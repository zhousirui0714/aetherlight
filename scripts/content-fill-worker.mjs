/**
 * 内容补全 worker
 * - 读取 scripts/audit-content.json
 * - 找出 D/C 级 + 缺关键字段的文章
 * - 直接调百炼/Qwen LLM 补全
 * - 回写 knowledge_articles 表
 *
 * 用法: node scripts/content-fill-worker.mjs [--limit=N] [--grade=C,D] [--category=poems,figures]
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const AUDIT_JSON = join(ROOT, "scripts", "audit-content.json");
const PROGRESS_LOG = join(ROOT, "scripts", "fill-progress.log");
const ENV = (() => {
  const env = {};
  for (const line of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
})();

const SUPABASE_URL = ENV.SUPABASE_URL;
const SUPABASE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const BAILIAN_KEY = ENV.BAILIAN_API_KEY;
const BAILIAN_URL = ENV.BAILIAN_BASE_URL;
const MODEL = ENV.BAILIAN_MODEL || "qwen-plus";
const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

// CLI args
const args = Object.fromEntries(process.argv.slice(2).map((s) => s.replace(/^--/, "").split("=")));
const LIMIT = parseInt(args.limit || "200", 10);
const GRADES = (args.grade || "C,D").split(",");
const CATEGORIES = args.category ? args.category.split(",") : null;
const DRY_RUN = args.dryRun === "true";

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  if (!DRY_RUN) appendFileSync(PROGRESS_LOG, line + "\n");
};

// ==== 1. 加载审计结果 ====
if (!existsSync(AUDIT_JSON)) {
  console.error("❌ 请先运行: node scripts/content-audit.mjs");
  process.exit(1);
}
const audit = JSON.parse(readFileSync(AUDIT_JSON, "utf-8"));
let targets = audit.records.filter(
  (r) => GRADES.includes(r.grade) && (!CATEGORIES || CATEGORIES.includes(r.category))
);
log(`🎯 命中目标 ${targets.length} 篇 (限定 grade=${GRADES.join("/")}${CATEGORIES ? `, category=${CATEGORIES.join("/")}` : ""})`);
log(`📦 限制处理: ${LIMIT}`);

targets = targets.slice(0, LIMIT);

// ==== 2. LLM 调取 (百炼) ====
async function callLLM(systemPrompt, userPrompt, expectJson = false) {
  const res = await fetch(`${BAILIAN_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BAILIAN_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM ${res.status}: ${err.slice(0, 200)}`);
  }
  const j = await res.json();
  let text = j.choices?.[0]?.message?.content || "";
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  if (expectJson) {
    const m = text.match(/[\[{][\s\S]*[\]}]/);
    if (!m) throw new Error("未找到 JSON");
    return JSON.parse(m[0]);
  }
  return text;
}

const SYSTEM = `你是溯光 Aetherlight 的中华文化主编。严谨典雅、可引经据典（《XX》·作者），语言要易懂。不用 Markdown 标题，按要求格式返回。`;

const PROMPTS = {
  history: (a) => `为「${a.title}」（${a.category}）写 200-400 字「历史背景」。可参考摘要：${a.excerpt || a.body?.slice(0, 200) || "无"}。
要求：1) 起源 + 演变 + 关键节点；2) 末尾引用 1-2 部典籍（用《书名》·作者 格式）；3) 流畅散文。`,

  influence: (a) => `为「${a.title}」（${a.category}）写 200-300 字「现代解读」。摘要：${a.excerpt || ""}。
严格返回 JSON：{"summary":"...","applications":["...","...","..."],"perspectives":["...","..."]}`,

  faq: (a) => `为「${a.title}」（${a.category}）生成 3-5 个常见问题。摘要：${a.excerpt || ""}。
严格返回 JSON：[{"question":"...","answer":"..."}, ...]，answer 60-120 字。`,

  translation: (a) => `为「${a.title}」（${a.category}）生成现代汉语翻译。
原文：${(a.body || "").slice(0, 600) || a.excerpt || ""}。
要求：1) 若是诗词/典籍，按行/句逐条翻译；2) 末尾附 80-150 字「整体意境」；3) 严格 JSON：
{"verseByVerse":[{"original":"原文 1","modern":"译文 1"}],"overall":"整体意境..."}
非诗词则 verseByVerse 留空数组。`,

  annotation: (a) => `为「${a.title}」（${a.category}）生成 4-8 个关键注释。原文：${(a.body || "").slice(0, 600) || a.excerpt || ""}。
严格返回 JSON：[{"term":"词条","meaning":"解释 40-90 字","source":"出处（如《XX》·作者；无则留空）"}, ...]`,

  related_people: (a) => `为「${a.title}」（${a.category}）列出 3-6 位相关人物（师承/友人/弟子/家族）。
摘要：${a.excerpt || ""}。
严格返回 JSON：[{"id":"拼音小写-id","title":"姓名","relation":"师/友/弟子/家族","brief":"关系说明 30-60 字"}, ...]
id 用拼音小写连字符，不与已有 id 冲突即可。`,
};

// ==== 3. 补全流程 ====
let success = 0, fail = 0, totalFields = 0;
for (let i = 0; i < targets.length; i++) {
  const a = targets[i];
  const missing = a.missing_fields.split("|").filter((f) => f !== "cover_file" && f !== "cover_url" && PROMPTS[f]);
  if (missing.length === 0) continue;

  log(`\n[${i + 1}/${targets.length}] ${a.id} ${a.title} [${a.category}] grade=${a.grade}`);
  log(`   缺: ${missing.join(", ")}`);

  if (DRY_RUN) continue;

  const filled = {};
  for (const field of missing) {
    try {
      const expectJson = field !== "history";
      const prompt = PROMPTS[field]({ ...a, body: a.excerpt });
      const result = await callLLM(SYSTEM, prompt, expectJson);
      filled[field] = result;
      log(`   ✅ ${field}`);
      totalFields++;
    } catch (e) {
      log(`   ❌ ${field}: ${e.message?.slice(0, 100) || e}`);
      fail++;
    }
    // 防 LLM 限速
    await new Promise((r) => setTimeout(r, 800));
  }

  if (Object.keys(filled).length === 0) continue;

  // 4. 回写 Supabase (直接 PATCH)
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_articles?id=eq.${a.id}`, {
      method: "PATCH",
      headers: { ...HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify(filled),
    });
    if (!r.ok) {
      const err = await r.text();
      log(`   ❌ DB 写入: ${r.status} ${err.slice(0, 150)}`);
      fail++;
    } else {
      log(`   💾 已回写 ${Object.keys(filled).join(", ")}`);
      success++;
    }
  } catch (e) {
    log(`   ❌ DB 异常: ${e.message}`);
    fail++;
  }
}

log(`\n══════ 汇总 ══════`);
log(`✅ 成功: ${success} 篇 / ❌ 失败: ${fail} 次 / 🧠 调用 LLM: ${totalFields} 次`);
log(`📋 进度日志: ${PROGRESS_LOG}`);
