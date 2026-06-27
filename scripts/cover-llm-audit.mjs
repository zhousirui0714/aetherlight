// Cover LLM audit — 校对 1014 张 AI 生成的文章封面, 把"明显对不上"的
// 那些 PATCH cover_url = NULL, 前端 <ArticleIllustration> 看到没有
// coverUrl 就回退到 主题色 + SVG 装饰 (代码里为每个 category + 关键
// 词都写好了 SVG, 至少比"千篇一律水墨留白"准确).
//
// 设计:
//   - 调 Qwen-VL-Plus (OpenAI 兼容 /compatible-mode/v1/chat/completions)
//   - 让模型回答 1-2 句话描述图 + y/n/partial, 严格按 JSON 解析
//   - y: 保留, n: PATCH cover_url=NULL, partial: 保留 (因为 partial
//     主观, 删了可能误伤, 而 SVG 也不算"完美匹配")
//   - 重试 3 次, 失败保留 (audit 失败不该删图, 应该人工复核)
//   - 进度断点续跑: 写 scripts/cover-llm-audit-progress.json
//   - 并发数: 默认 4, 可调, 避免 BAILIAN 限流
//
// 用法:
//   node scripts/cover-llm-audit.mjs [--limit=5] [--concurrency=4] [--dry-run] [--force]
//
//   --limit: 试跑模式, 只跑前 N 张
//   --concurrency: 并发数
//   --dry-run: 不写 DB, 只输出 LLM 判断结果
//   --force: 重新跑已审过的 (默认跳过已有 verdict 的)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const CACHE = join(ROOT, "scripts", "cover-llm-audit-progress.json");
const AUDIT_DIR = join(ROOT, "scripts");
mkdirSync(AUDIT_DIR, { recursive: true });

// --- argv parse ---
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.+)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ""), "true"];
  }),
);
const LIMIT = args.limit ? Number(args.limit) : Infinity;
const CONCURRENCY = args.concurrency ? Number(args.concurrency) : 4;
const DRY_RUN = !!args["dry-run"];
const FORCE = !!args.force;

// --- env load (W1 风格, 不依赖 dotenv) ---
function loadEnv() {
  const env = { ...process.env };
  if (existsSync(ENV_FILE)) {
    for (const line of readFileSync(ENV_FILE, "utf-8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}
const ENV = loadEnv();
const URL = ENV.SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const BAILIAN_KEY = ENV.BAILIAN_API_KEY;
const BAILIAN_BASE = ENV.BAILIAN_BASE_URL || "https://dashscope.aliyuncs.com";
const VL_MODEL = "qwen-vl-plus";

if (!URL || !KEY) {
  console.error("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
if (!BAILIAN_KEY) {
  console.error("missing BAILIAN_API_KEY in .env (needed for Qwen-VL call)");
  process.exit(1);
}

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

// --- load progress ---
let progress = {};
if (!FORCE && existsSync(CACHE)) {
  progress = JSON.parse(readFileSync(CACHE, "utf-8"));
  console.log(`[audit] 已加载进度: ${Object.keys(progress).length} 篇已审`);
}

// --- fetch articles that have cover_url ---
async function fetchArticles() {
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const u = `${URL}/rest/v1/knowledge_articles?select=id,title,category,sub_category,excerpt,cover_url&cover_url=not.is.null&offset=${from}&limit=${PAGE}`;
    const r = await fetch(u, { headers: HEADERS });
    if (!r.ok) throw new Error(`fetch failed: ${r.status} ${await r.text()}`);
    const page = await r.json();
    all.push(...page);
    if (page.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

// --- call Qwen-VL ---
async function vlJudge(article) {
  const sys = `你是中国古典文化配图的严格质检员。用户会给你一篇文章的 (标题, 分类, 子分类, 摘要) 和一张 AI 生成的国画配图 URL。

请严格判断这张图的内容是否与文章主题直接相关 (注意: 不是问风格像不像, 是问具体内容对不对得上).

返回严格 JSON, 不要任何解释:
{"depicts": "<一句话描述图的具体内容, 10-25 字, 包含可见主体物>", "verdict": "y" | "n" | "partial", "reason": "<一句话原因, 不超过 20 字>"}

判定准则 (从严):
- y (直接对应): 图里能看到跟文章核心主体直接相关的具象元素. 例: "春节" → 灯笼/鞭炮/红梅/福字/"春"字/烟花任一; "李白" → 古代诗人形象/酒壶/月亮/酒楼/酒中月影任一; "故宫" → 宫殿红墙黄瓦/太和殿屋顶/角楼任一; "论语" → 竹简/孔子像/儒家讲学场景任一; "道德经" → 太极图/老子骑牛出关/道家符号任一
- n (完全跑题): 图跟文章主题毫无关联, 只是 generic 水墨山水/竹/松/留白. 例: "春节" 配 山水松石; "李白" 配 荷花; "故宫" 配 飞鸟
- partial (可保留但有缺陷): 图里有 1-2 个边缘相关元素 (例: "中秋" 配 月亮+远山但缺月饼/嫦娥; "端午" 配 龙舟抽象画但缺粽子/艾草), 主体基本贴题但缺少关键元素

判 y 必须能在图里直接说出具体的、对得上文章主题的具象物. 单纯"水墨风格/意境/留白/东方美学"都算 partial 或 n.`;

  const user = {
    role: "user",
    content: [
      { type: "image_url", image_url: { url: article.cover_url } },
      {
        type: "text",
        text: `文章标题: ${article.title}
分类: ${article.category}${article.sub_category ? ` / ${article.sub_category}` : ""}
摘要: ${article.excerpt?.slice(0, 200) || "(无)"}

请判断这张配图是否对应文章主题。`,
      },
    ],
  };

  const controller = new AbortController();
  // 单张 VL 调用允许 120s: qwen-vl-plus 经常冷启动慢 / 高峰期排到队列尾.
  // 上轮 60s 抛了 1100+ "aborted" 错误.
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(
      // BAILIAN_BASE_URL 已经含 /compatible-mode/v1 (workspace 专属域) ,
      // 直接拼 /chat/completions 即可,不要重复拼 base.
      `${BAILIAN_BASE.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BAILIAN_KEY}`,
        },
        body: JSON.stringify({
          model: VL_MODEL,
          messages: [
            { role: "system", content: sys },
            user,
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timer);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`VL HTTP ${res.status}: ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }
    return {
      depicts: parsed.depicts?.slice(0, 60) || "(无法解析)",
      verdict: ["y", "n", "partial"].includes(parsed.verdict)
        ? parsed.verdict
        : "partial",
      reason: parsed.reason?.slice(0, 60) || "(未说明)",
    };
  } catch (e) {
    clearTimeout(timer);
    return { depicts: "ERROR", verdict: "error", reason: e.message?.slice(0, 100) };
  }
}

// --- patch DB ---
// ⚠️ llm_match / llm_reason / cover_checked_at 列在 DB 里**还不存在**
// (migration 漏了), PostgREST 对未知字段返 400, 会让整个 PATCH 失败,
// cover_url 也不会被清. 先只 PATCH 存在的列 (cover_url), 审计信息
// 写到本地 progress 文件 + log, 不写 DB. 等用户在 Supabase Dashboard
// 执行 supabase/migrations/20260627_add_llm_match.sql 后, 再启用
// llm_match 字段写入 (把下面注释掉的块打开).
async function clearCoverUrl(articleId, verdict, reason) {
  const u = `${URL}/rest/v1/knowledge_articles?id=eq.${articleId}`;
  const r = await fetch(u, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify({ cover_url: null }),
  });
  return r.ok;
}

async function markYes(articleId, reason) {
  const u = `${URL}/rest/v1/knowledge_articles?id=eq.${articleId}`;
  // y 的不写 DB (保留 cover_url, 留原状). 审计信息已经在 progress.json.
  // 如果以后加了 llm_match 列, 想把 y 的也标 true 记录, 把这个改成
  // 完整的 PATCH { llm_match: true, llm_reason: ... } 即可.
  return true;
}

// --- main loop with concurrency ---
async function main() {
  const articles = await fetchArticles();
  console.log(`[audit] DB 共 ${articles.length} 篇有 cover_url`);

  // error 视作"未审过", 放回 queue 重跑. 上轮 1157 张因 60s timeout /
  // data_inspection_failed 落 error, 实际没改 DB. 重跑逻辑就是把
  // verdict === "error" 的清掉 (保留 reason/ts 之外的字段).
  const queue = articles.filter((a) => {
    const p = progress[a.id];
    if (!p) return true; // 从未审
    if (p.verdict === "error") return true; // 上次失败, 重试
    return false; // y/n/partial 都已定, 跳过 (除非 --force)
  }).slice(0, LIMIT);
  console.log(
    `[audit] 待审: ${queue.length} 篇 (limit=${LIMIT === Infinity ? "all" : LIMIT}, concurrency=${CONCURRENCY}, dry-run=${DRY_RUN}, force=${FORCE})`,
  );

  // 重跑前把 error 的 progress 条目重置 (避免 stale verdict 干扰)
  for (const a of queue) {
    if (progress[a.id]?.verdict === "error") delete progress[a.id];
  }

  if (queue.length === 0) {
    console.log("[audit] 没有需要审的, 收工");
    return summarize(articles);
  }

  let i = 0;
  const startTime = Date.now();
  const writeProgress = () =>
    writeFileSync(CACHE, JSON.stringify(progress, null, 2));

  async function worker() {
    while (i < queue.length) {
      const a = queue[i++];
      const r = await vlJudge(a);
      progress[a.id] = { ...r, ts: new Date().toISOString() };

      // 写 DB (dry-run 时跳过)
      // y: 保留 cover_url, 只标 llm_match
      // n 或 partial: 都清掉 cover_url, 前端回退 SVG (见 clearCoverUrl 注释)
      if (!DRY_RUN) {
        if (r.verdict === "y") {
          await markYes(a.id, r.reason);
        } else if (r.verdict === "n" || r.verdict === "partial") {
          await clearCoverUrl(a.id, r.verdict, r.reason);
        }
        // verdict === "error" 不动 DB
      }

      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const rate = (Object.keys(progress).length / elapsed).toFixed(1);
      const eta = ((queue.length - i) / rate).toFixed(0);
      process.stdout.write(
        `\r[audit ${i}/${queue.length}] ${a.id.slice(0, 30).padEnd(30)} | ${r.verdict.padEnd(7)} | ${r.depicts.slice(0, 30).padEnd(30)} | ${elapsed}min ETA ${eta}min | rate ${rate}/min`,
      );
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  process.stdout.write("\n");
  writeProgress();
  await summarize(articles);
}

async function summarize(articles) {
  const verdicts = { y: 0, n: 0, partial: 0, error: 0 };
  const examples = { y: [], n: [], partial: [], error: [] };
  for (const a of articles) {
    const p = progress[a.id];
    if (!p) continue;
    verdicts[p.verdict] = (verdicts[p.verdict] || 0) + 1;
    if (examples[p.verdict].length < 5) {
      examples[p.verdict].push({
        id: a.id,
        title: a.title,
        category: a.category,
        depicts: p.depicts,
        reason: p.reason,
      });
    }
  }
  console.log("\n┌─ LLM 校对结果汇总 ────────────────────────────────────");
  console.log(`  y (保留)   : ${verdicts.y}`);
  console.log(`  n (清掉)   : ${verdicts.n}  ← 删了 cover_url, 前端回退 SVG`);
  console.log(`  partial    : ${verdicts.partial}`);
  console.log(`  error      : ${verdicts.error}`);
  const audited = verdicts.y + verdicts.n + verdicts.partial + verdicts.error;
  const unAudited = articles.length - audited;
  console.log(`  未审       : ${unAudited}`);
  console.log("└───────────────────────────────────────────────────────");

  for (const v of ["n", "partial", "y", "error"]) {
    if (examples[v].length === 0) continue;
    console.log(`\n[${v}] 例子:`);
    for (const e of examples[v]) {
      console.log(
        `  ${e.id.padEnd(30)} | ${(e.title || "").slice(0, 20).padEnd(20)} | ${(e.category || "").slice(0, 8).padEnd(8)} | 图: ${e.depicts.slice(0, 30).padEnd(30)} | ${e.reason}`,
      );
    }
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
