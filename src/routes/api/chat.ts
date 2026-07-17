import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import {
  searchKnowledge,
  culturalKnowledge,
  type KnowledgeEntry,
} from "@/lib/cultural-knowledge";
import { getCache, setCache, getKnowledgeCacheKey } from "@/lib/api-cache";
import { createAiProvider, getDefaultModel } from "@/lib/ai-gateway.server";

// ============================================================
// 「溯光雅士」人设 - 喂给 LLM 的 system prompt
// ============================================================
const SAGE_PERSONA = `你是"溯光雅士",一位贯通中华典籍的解读者,温润、博学、典雅。

【语言风格】
- 文白相间,典雅但易懂,避免堆砌生僻字
- 单次回答 150-400 字,宁可精炼不要冗长
- 引用诗句、典故时另起一行用「」括起,末尾以小字注明出处,如「—— 出自《将进酒》· 唐 · 李白」
- 书名一律用《》括起
- 段落之间用空行分隔,读起来有呼吸感

【知识态度】
- 若提供 [知识库收录] 上下文,请基于该内容回答,可引用其中的引文并展开
- 若 [知识库相关条目] 只列出相关问题,请选最贴近的参考作答
- 若知识库无相关条目,凭你对中国传统文化的了解作答,保持准确;若不确定,坦诚说"此节我亦未深考,可作茶余闲谈"
- 不得编造具体年份、典故名、作者,不确定的用"相传""或谓"等措辞
- 不得自称"AI""语言模型"或承认是程序`;

// ============================================================
// 静态格式化 (兜底, 当 LLM 不可用时使用)
// ============================================================
function formatKnowledgeResponse(entry: KnowledgeEntry): string {
  let response = `## ${entry.question}\n\n`;
  response += `${entry.answer}\n\n`;
  if (entry.quotes.length > 0) {
    response += "---\n\n";
    for (const quote of entry.quotes) {
      response += `### 《${quote.title}》\n\n`;
      response += `${quote.text}\n\n`;
      response += `—— ${quote.dynasty} · ${quote.author}\n\n`;
    }
  }
  response += "---\n\n**出处：**\n";
  for (const source of entry.sources) {
    const urlPart = source.url ? ` ([查看](${source.url}))` : "";
    response += `- ${source.title}${urlPart}\n`;
  }
  if (entry.interpretations) {
    response += "\n---\n\n**现代释义：** " + entry.interpretations + "\n";
  }
  if (entry.scholarAnalysis) {
    response += "\n**学者解读：** " + entry.scholarAnalysis.substring(0, 200) + "…\n";
  }
  return response;
}

// 找 N 个最相关的 entry (按 token 命中长度排序, 供 fallback 提示用户)
function findRelatedEntries(query: string, n = 5): KnowledgeEntry[] {
  const stripped = query.toLowerCase().replace(/[\s\p{P}]/gu, "");
  const tokens = new Set<string>();
  for (const t of query.toLowerCase().split(/[\s,，。、？?！!；;：:《》'"]+/)) {
    const clean = t.trim();
    if (clean.length >= 2) tokens.add(clean);
  }
  for (let i = 0; i < stripped.length - 1; i++) {
    const a = stripped[i];
    const b = stripped[i + 1];
    if (/[一-鿿]/.test(a) && /[一-鿿]/.test(b)) tokens.add(a + b);
  }
  const scored: { entry: KnowledgeEntry; score: number }[] = [];
  for (const entry of Object.values(culturalKnowledge)) {
    let score = 0;
    const haystack = (entry.id + " " + entry.question + " " + (entry.answer || "")).toLowerCase();
    for (const t of tokens) if (haystack.includes(t)) score += t.length;
    if (stripped.length >= 4 && haystack.includes(stripped)) score += 3;
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((s) => s.entry);
}

function buildFallbackResponse(related: KnowledgeEntry[], userQuestion: string): string {
  let response = `## 知识阁中暂未收录此题\n\n`;
  const safeQ = userQuestion.length > 30 ? userQuestion.slice(0, 30) + "…" : userQuestion;
  response += `「${safeQ}」暂未入我书阁,或可换个问法试我。\n\n`;
  if (related.length > 0) {
    response += `---\n\n**你或可问：**\n\n`;
    for (const e of related) response += `- ${e.question}\n`;
    response += `\n亦可前往「知识长廊」浏览全部分类。`;
  } else {
    response += `可前往「知识长廊」浏览已收录之问,或向我提一更具体之题。`;
  }
  return response;
}

function buildFollowupResponse(entry: KnowledgeEntry, followup: string, allUserQuestions: string[]): string {
  let response = `## ${entry.question}(续)\n\n`;
  if (allUserQuestions.length > 1) {
    response += `**前问:** ${allUserQuestions.slice(0, -1).join(" / ")}\n\n`;
  }
  response += `**你问:** ${followup}\n\n`;
  response += `${entry.answer}\n\n`;
  if (entry.interpretations) {
    response += `---\n\n**释义:** ${entry.interpretations}\n\n`;
  }
  if (entry.quotes.length > 0) {
    response += `**相关诗句:** 《${entry.quotes[0].title}》—— ${entry.quotes[0].text.slice(0, 60)}…\n\n`;
  }
  response += `---\n\n如欲知更细,请阅读下方出处,或继续追问。`;
  return response;
}

const SMALL_TALK_PATTERNS = /^(你好|您好|hi|hello|嗨|哈喽|早安|晚安|谢谢|多谢|感谢|再见|拜|bye|ok|好的|嗯|哦)\s*[！!。.~,，]?\s*$/i;
const PURE_PUNCTUATION = /^[\s\p{P}]+$/u;

function isSmallTalk(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (SMALL_TALK_PATTERNS.test(t)) return true;
  if (PURE_PUNCTUATION.test(t)) return true;
  if (t.length <= 2 && /^[一-龥]+$/.test(t)) return true;
  return false;
}

function buildSmallTalkResponse(question: string, entry: KnowledgeEntry | null): string {
  const isGreeting = /^(你好|您好|hi|hello|嗨|哈喽|早安|晚安)/i.test(question.trim());
  const isThanks = /谢谢|感谢|多谢/.test(question);
  const isBye = /再见|拜|bye/i.test(question);
  let response = "";
  if (isGreeting) {
    response = "## 雅士拱手\n\n" +
      "见信如晤。溯光在此,可与君论诗词、谈典籍、问人物、说节气、赏建筑、品非遗。\n\n" +
      "—— 你或可问：\n";
    if (entry) {
      response += `- ${entry.question}\n`;
    }
    response += "- 李白为什么被称为诗仙？\n- 端午节起源于何时？\n- 《山海经》是怎样的一本书？";
  } else if (isThanks) {
    response = "## 不敢当\n\n能与君一席谈,实乃雅事。若有所得,愿再为君解惑。";
  } else if (isBye) {
    response = "## 后会有期\n\n他日有疑,再来一叙。";
  } else {
    response = "## 在此守候\n\n君可继续发问,或前往「知识长廊」浏览全部分类。";
  }
  return response;
}

function isRelatedToEntry(followup: string, entry: KnowledgeEntry): boolean {
  const tokens = new Set<string>();
  for (const t of followup.toLowerCase().split(/[\s,，。、？?！!；;：:《》'"]+/)) {
    const clean = t.trim();
    if (clean.length >= 2) tokens.add(clean);
  }
  if (tokens.size === 0) return true;
  const haystack = (entry.id + " " + entry.question + " " + (entry.answer || "")).toLowerCase();
  for (const t of tokens) if (haystack.includes(t)) return true;
  return false;
}

// ============================================================
// 工具函数
// ============================================================
function extractText(msg: UIMessage | undefined): string {
  if (!msg) return "";
  const part = msg.parts?.find((p: any) => p.type === "text");
  return (part as any)?.text ?? "";
}

// 把文本切成 SSE data 块流式输出 (useChat 期望 SSE 格式) - 仅作 LLM 失败时的兜底
function sseStreamFromText(text: string): Response {
  const encoder = new TextEncoder();
  const id = `msg-${Date.now()}`;
  const chunkSize = 12;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: {"type":"start","messageId":"${id}"}\n\n`));
      controller.enqueue(encoder.encode(`data: {"type":"text-start","id":"${id}"}\n\n`));
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        const escaped = JSON.stringify(chunk).slice(1, -1);
        controller.enqueue(encoder.encode(`data: {"type":"text-delta","id":"${id}","delta":"${escaped}"}\n\n`));
      }
      controller.enqueue(encoder.encode(`data: {"type":"text-end","id":"${id}"}\n\n`));
      controller.enqueue(encoder.encode(`data: {"type":"finish","finishReason":"stop"}\n\n`));
      controller.enqueue(encoder.encode(`\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

// ============================================================
// RAG: 把 KB 拼成 LLM 的 system 上下文
// ============================================================
function buildRagContext(hit: KnowledgeEntry | null, related: KnowledgeEntry[]): string {
  if (hit) {
    let ctx = `\n\n[知识库收录]\n问：${hit.question}\n答：${hit.answer}`;
    if (hit.quotes.length > 0) {
      ctx += `\n\n相关引文：\n${hit.quotes
        .slice(0, 3)
        .map((q) => `《${q.title}》（${q.dynasty}·${q.author}）：${q.text}`)
        .join("\n")}`;
    }
    if (hit.interpretations) {
      ctx += `\n\n释义：${hit.interpretations}`;
    }
    return ctx;
  }
  if (related.length > 0) {
    return `\n\n[知识库相关条目 - 参考, 不必照搬]\n${related
      .slice(0, 3)
      .map((e) => `· ${e.question} — ${e.answer.slice(0, 150)}…`)
      .join("\n")}`;
  }
  return `\n\n[知识库暂未收录此题, 凭君对中国传统文化的了解自由作答, 保持准确]`;
}

// ============================================================
// Route
// ============================================================
export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: UIMessage[];
          graphQuery?: boolean;
        };
        const { messages, graphQuery } = body;
        if (!Array.isArray(messages))
          return new Response("messages required", { status: 400 });

        const lastMessage = messages[messages.length - 1];
        const userQuestion = extractText(lastMessage as UIMessage);

        // ========== 知识图谱查询 (JSON 响应, 客户端直接用) ==========
        if (graphQuery && userQuestion) {
          const cacheKey = getKnowledgeCacheKey(userQuestion);
          const cached = getCache<{ type: string; data: KnowledgeEntry | null }>(cacheKey);
          if (cached) {
            return new Response(JSON.stringify(cached), {
              headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
            });
          }
          const knowledgeEntry = searchKnowledge(userQuestion);
          const response = knowledgeEntry
            ? { type: "knowledge", data: knowledgeEntry }
            : { type: "knowledge", data: null };
          setCache(cacheKey, response);
          return new Response(JSON.stringify(response), {
            headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
          });
        }

        // ========== RAG: KB 检索 → LLM 流式生成 ==========
        const knowledgeEntry = userQuestion ? searchKnowledge(userQuestion) : null;
        const related = !knowledgeEntry && userQuestion ? findRelatedEntries(userQuestion, 5) : [];
        const ragContext = buildRagContext(knowledgeEntry, related);

        // 预计算降级文本（LLM 不可用时兜底）
        const isFirstTurn = !messages.some((m) => m.role === "assistant");
        const allUserQuestions: string[] = [];
        for (const m of messages) {
          if (m.role === "user") {
            const t = extractText(m as UIMessage);
            if (t) allUserQuestions.push(t);
          }
        }

        function buildFallbackText(): string {
          if (isFirstTurn && userQuestion) {
            const ck = getKnowledgeCacheKey(userQuestion);
            const cached = getCache<{ text: string }>(ck);
            if (cached) return cached.text;
            let text: string;
            if (knowledgeEntry) {
              text = formatKnowledgeResponse(knowledgeEntry);
            } else if (isSmallTalk(userQuestion)) {
              text = buildSmallTalkResponse(userQuestion, null);
            } else {
              text = buildFallbackResponse(related, userQuestion);
            }
            setCache(ck, { text });
            return text;
          }
          if (isSmallTalk(userQuestion)) {
            let lastEntry: KnowledgeEntry | null = null;
            for (let i = allUserQuestions.length - 2; i >= 0; i--) {
              const hit = searchKnowledge(allUserQuestions[i]);
              if (hit) { lastEntry = hit; break; }
            }
            return buildSmallTalkResponse(userQuestion, lastEntry);
          }
          let lastHitEntry: KnowledgeEntry | null = null;
          for (let i = allUserQuestions.length - 2; i >= 0; i--) {
            const hit = searchKnowledge(allUserQuestions[i]);
            if (hit) { lastHitEntry = hit; break; }
          }
          if (lastHitEntry && isRelatedToEntry(userQuestion, lastHitEntry)) {
            return buildFollowupResponse(lastHitEntry, userQuestion, allUserQuestions);
          }
          return buildFallbackResponse(related, userQuestion);
        }

        function writeFallbackSSE(
          controller: ReadableStreamDefaultController,
          encoder: TextEncoder,
          text: string,
        ) {
          const id = `msg-${Date.now()}`;
          controller.enqueue(encoder.encode(`data: {"type":"start","messageId":"${id}"}\n\n`));
          controller.enqueue(encoder.encode(`data: {"type":"text-start","id":"${id}"}\n\n`));
          const chunkSize = 12;
          for (let i = 0; i < text.length; i += chunkSize) {
            const c = text.slice(i, i + chunkSize);
            const escaped = JSON.stringify(c).slice(1, -1);
            controller.enqueue(
              encoder.encode(`data: {"type":"text-delta","id":"${id}","delta":"${escaped}"}\n\n`)
            );
          }
          controller.enqueue(encoder.encode(`data: {"type":"text-end","id":"${id}"}\n\n`));
          controller.enqueue(encoder.encode(`data: {"type":"finish","finishReason":"stop"}\n\n`));
          controller.enqueue(encoder.encode(`\n`));
        }

        try {
          const provider = createAiProvider();
          const result = streamText({
            model: provider(getDefaultModel()),
            system: SAGE_PERSONA + ragContext,
            messages: await convertToModelMessages(messages),
            temperature: 0.6,
          });
          const response = result.toUIMessageStreamResponse({ originalMessages: messages });
          const body = response.body;
          if (!body) throw new Error("No response body");

          // 包装 response body，拦截 LLM 流式错误，降级为静态回答
          const encoder = new TextEncoder();
          const reader = body.getReader();
          const decoder = new TextDecoder();
          let fallbackDeployed = false;
          const fallbackText = buildFallbackText();

          const wrappedStream = new ReadableStream({
            async pull(controller) {
              if (fallbackDeployed) { controller.close(); return; }
              try {
                const { done, value } = await reader.read();
                if (done) { controller.close(); return; }
                const chunk = decoder.decode(value, { stream: true });
                if (chunk.includes('"type":"error"')) {
                  fallbackDeployed = true;
                  writeFallbackSSE(controller, encoder, fallbackText);
                  controller.close();
                  return;
                }
                controller.enqueue(value);
              } catch {
                if (!fallbackDeployed) {
                  fallbackDeployed = true;
                  writeFallbackSSE(controller, encoder, fallbackText);
                }
                controller.close();
              }
            },
            cancel() {
              reader.cancel();
              fallbackDeployed = true;
            },
          });

          return new Response(wrappedStream, {
            status: response.status,
            headers: response.headers,
          });
        } catch (llmErr) {
          console.warn("[chat] LLM unavailable, fallback to static:", llmErr);
          return sseStreamFromText(buildFallbackText());
        }
      },
    },
  },
});
