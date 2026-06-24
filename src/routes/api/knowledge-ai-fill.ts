/**
 * /api/knowledge-ai-fill
 * 知识长廊 · AI 懒加载补全
 * POST { articleId, fields: ["history","influence","faq"], articleSnapshot?: {...} }
 *  -> 调百炼/Qwen LLM 补全缺省字段，结果回写 ai_completions 表
 */
import { createFileRoute } from "@tanstack/react-router";
import { createAiProvider, getDefaultModel } from "@/lib/ai-gateway.server";
import { generateText } from "ai";
import { getCache, setCache } from "@/lib/api-cache";

const ALLOWED_FIELDS = ["history", "influence", "faq", "translation", "annotation"] as const;
type Field = (typeof ALLOWED_FIELDS)[number];

const SYSTEM_PROMPT = `你是溯光 Aetherlight 的中华文化主编，受众为青少年与传统文化爱好者。要求：
- 严谨典雅，可引经据典（《XX》·作者），但语言要易懂
- 不用 Markdown 标题分隔
- JSON 严格返回（用 { ... } 或 [ ... ]）`;

const PROMPT_TEMPLATES: Record<Field, (s: ArticleSnapshot) => string> = {
  history: (s) =>
    `请为「${s.title}」（${s.category}）撰写 200-400 字的「历史背景」。
内容可参考：${s.excerpt || s.body?.slice(0, 200) || "无"}。
要求：1) 起源 + 演变 + 关键节点；2) 末尾引用 1-2 部典籍（用《书名》·作者 格式）；3) 用流畅散文，不用 Markdown 标题。`,

  influence: (s) =>
    `请为「${s.title}」（${s.category}）撰写 200-300 字的「现代解读」。
内容可参考：${s.excerpt || s.body?.slice(0, 200) || "无"}。
严格用 JSON 返回：{"summary":"...","applications":["...", "...", "..."],"perspectives":["...", "..."]}`,

  faq: (s) =>
    `请为「${s.title}」（${s.category}）生成 3-5 个常见问题。
内容可参考：${s.excerpt || s.body?.slice(0, 200) || "无"}。
严格用 JSON 返回：[{"question":"...","answer":"..."}, ...]，answer 控制在 60-120 字。`,

  translation: (s) =>
    `请为「${s.title}」（${s.category}）生成现代汉语翻译。
原文参考：${(s.body || "").slice(0, 600) || s.excerpt || "无"}。
要求：
1) 若原文是诗词/典籍，按行/句逐条翻译为「现代汉语」（每行 original + modern）
2) 末尾附 80-150 字「整体意境」（用散文概括主旨、情感、意境）
3) 严格用 JSON 返回（不要 Markdown）：
{"verseByVerse":[{"original":"原文 1","modern":"译文 1"},{"original":"原文 2","modern":"译文 2"}],"overall":"整体意境文字..."}
4) 若原文为非诗词（无逐行结构），可只填 overall 字段，verseByVerse 留空数组。`,

  annotation: (s) =>
    `请为「${s.title}」（${s.category}）生成 4-8 个关键注释。
原文参考：${(s.body || "").slice(0, 600) || s.excerpt || "无"}。
要求：
1) 注释应解释难字、生僻典故、人名、地名、关键意象
2) 严格用 JSON 返回：[{"term":"词条","meaning":"解释（40-90字）","source":"出处（如《XX》·作者；无则留空）"}, ...]
3) 不要 Markdown，不要包裹在 \`\`\` 里，直接是 JSON 数组。`,
};

type ArticleSnapshot = {
  title: string;
  category: string;
  excerpt?: string;
  body?: string;
};

type RequestBody = {
  articleId: string;
  fields: string[];
  articleSnapshot?: ArticleSnapshot;
};

type FillResult = {
  articleId: string;
  filled: Record<string, any>;
  status: Record<string, string>;
  cached: boolean;
  tokensUsed: number;
};

export const Route = createFileRoute("/api/knowledge-ai-fill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as RequestBody;

        if (!body.articleId || !Array.isArray(body.fields) || body.fields.length === 0) {
          return jsonResponse({ error: "invalid body" }, 400);
        }

        const fields = body.fields.filter((f): f is Field =>
          (ALLOWED_FIELDS as readonly string[]).includes(f)
        );
        if (fields.length === 0) {
          return jsonResponse({ error: "no allowed fields", allowed: ALLOWED_FIELDS }, 400);
        }

        const snapshot: ArticleSnapshot = body.articleSnapshot || {
          title: "",
          category: "",
          excerpt: "",
          body: "",
        };

        // 1. 先查缓存
        const cacheKey = `kb-ai:${body.articleId}:${fields.sort().join(",")}`;
        const cached = getCache<FillResult>(cacheKey);
        if (cached) {
          return jsonResponse(cached, 200, { "X-Cache": "HIT" });
        }

        // 2. 调 LLM 补全
        const filled: Record<string, any> = {};
        const status: Record<string, string> = {};
        let tokensUsed = 0;

        try {
          const provider = createAiProvider();
          const model = provider(getDefaultModel());

          for (const field of fields) {
            try {
              const prompt = PROMPT_TEMPLATES[field](snapshot);
              const { text, usage } = await generateText({
                model,
                system: SYSTEM_PROMPT,
                prompt,
                temperature: 0.7,
                maxTokens: field === "faq" ? 1000 : 800,
              });

              const content = parseContent(field, text);
              filled[field] = content;
              status[field] = "ready";
              tokensUsed += usage?.totalTokens ?? 0;
            } catch (err) {
              console.error(`[ai-fill] ${field} failed:`, err);
              status[field] = `error: ${String(err).slice(0, 100)}`;
              filled[field] = fallbackFor(field, snapshot);
            }
          }
        } catch (err) {
          // 整体 LLM 不可用 → 全部降级
          console.error("[ai-fill] LLM unavailable:", err);
          for (const field of fields) {
            status[field] = "fallback";
            filled[field] = fallbackFor(field, snapshot);
          }
        }

        const result: FillResult = {
          articleId: body.articleId,
          filled,
          status,
          cached: false,
          tokensUsed,
        };

        // 3. 缓存 1 小时
        setCache(cacheKey, result, 60 * 60 * 1000);

        return jsonResponse(result, 200, { "X-Cache": "MISS" });
      },
    },
  },
});

function parseContent(field: Field, text: string): any {
  if (field === "faq") {
    const m = text.match(/\[[\s\S]*\]/);
    return m ? safeJson(m[0], []) : [];
  }
  if (field === "influence") {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? safeJson(m[0], { summary: text, applications: [], perspectives: [] }) : { summary: text, applications: [], perspectives: [] };
  }
  return text.trim();
}

function safeJson<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function fallbackFor(field: Field, s: ArticleSnapshot): any {
  if (field === "faq") {
    return [
      { question: `${s.title}是什么？`, answer: s.excerpt || "请查阅相关典籍获取详细解释。" },
      { question: `${s.title}的起源？`, answer: "其起源可上溯至先秦至两汉时期，并在后世不断丰富发展。" },
      { question: `${s.title}有什么文化意义？`, answer: "承载着中华民族的文化记忆，是理解中华文明的重要窗口。" },
    ];
  }
  if (field === "influence") {
    return {
      summary: `${s.title}作为中华文化的重要组成部分，对后世产生了深远影响。`,
      applications: ["应用于教育普及", "在文创产业中广泛使用", "成为国际文化交流的载体"],
      perspectives: ["需结合现代价值观重新阐释", "可作为文化自信的支点之一"],
    };
  }
  if (field === "translation") {
    return {
      verseByVerse: [],
      overall: `${s.title}的现代汉语译文正在生成中，请稍候再试。`,
    };
  }
  if (field === "annotation") {
    return [
      { term: s.title, meaning: "暂未生成注释，请稍候重试。", source: "" },
    ];
  }
  return `${s.title}源远流长，可上溯至先秦时期。其形成与演变深受历代政治、经济、文化之影响，至今仍具有重要价值。`;
}

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
