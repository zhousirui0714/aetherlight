/**
 * 封面一致性审计
 * - 对比 DB cover_url 字段 vs public/ai-covers/ 文件系统
 * - 用 LLM 对 50 张抽样图做"图文一致性"打分
 * - 输出 audit-cover.csv + audit-cover.json
 *
 * 用法: node scripts/cover-audit.mjs [--sample=N]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const COVERS_DIR = join(ROOT, "public", "ai-covers");
const OUT_CSV = join(ROOT, "scripts", "audit-cover.csv");
const OUT_JSON = join(ROOT, "scripts", "audit-cover.json");

const ENV = (() => {
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
})();
const URL = ENV.SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const BAILIAN_KEY = ENV.BAILIAN_API_KEY;
const BAILIAN_URL = ENV.BAILIAN_BASE_URL;
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const args = Object.fromEntries(process.argv.slice(2).map((s) => s.replace(/^--/, "").split("=")));
const SAMPLE = parseInt(args.sample || "50", 10);
const LLM_CHECK = args.llmCheck !== "false";

console.log("📁 扫描 public/ai-covers/...");
const coversFs = new Set();
const coversMeta = new Map();
if (existsSync(COVERS_DIR)) {
  for (const f of readdirSync(COVERS_DIR)) {
    if (!/\.(jpg|png)$/i.test(f)) continue;
    const fp = join(COVERS_DIR, f);
    const s = statSync(fp);
    if (s.size < 1024) continue;
    coversFs.add(f);
    coversMeta.set(f, { size: s.size, mtime: s.mtimeMs });
  }
}
console.log(`✅ 找到 ${coversFs.size} 张有效封面`);

console.log("🔌 拉取 knowledge_articles...");
const all = [];
let offset = 0;
const PAGE = 500;
while (true) {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=id,title,category,cover_url&limit=${PAGE}&offset=${offset}`,
    { headers: HEADERS }
  );
  if (!r.ok) break;
  const d = await r.json();
  if (d.length === 0) break;
  all.push(...d);
  if (d.length < PAGE) break;
  offset += PAGE;
}
console.log(`✅ 拉取 ${all.length} 篇`);

const records = [];
let dbOrphans = 0; // DB 有 cover_url 但文件不在
let fsOrphans = 0; // 文件存在但 DB 无 url
let matchOk = 0;
let noCover = 0;

for (const a of all) {
  const expectedFile = `article_${a.id.replace(/[^a-zA-Z0-9_\-]/g, "_")}.jpg`;
  const hasFile = coversFs.has(expectedFile);
  const hasUrl = !!a.cover_url;

  if (!hasFile && !hasUrl) {
    noCover++;
    records.push({
      id: a.id,
      title: a.title,
      category: a.category,
      status: "❌ 缺封面",
      file: "—",
      url: a.cover_url || "—",
      size: "—",
      action: "需 w1/w2 生成",
    });
    continue;
  }

  if (hasUrl && !hasFile) {
    // DB有url但本地无文件 - 验证 URL 是否可用
    dbOrphans++;
    records.push({
      id: a.id,
      title: a.title,
      category: a.category,
      status: "⚠️ 远端OK",
      file: "—",
      url: a.cover_url,
      size: "—",
      action: "本地无文件(生产环境OK)",
    });
    continue;
  }

  if (!hasUrl && hasFile) {
    fsOrphans++;
    records.push({
      id: a.id,
      title: a.title,
      category: a.category,
      status: "⚠️ 文件孤儿",
      file: expectedFile,
      url: "—",
      size: coversMeta.get(expectedFile).size,
      action: "回填 cover_url",
    });
    continue;
  }

  matchOk++;
  records.push({
    id: a.id,
    title: a.title,
    category: a.category,
    status: "✅ OK",
    file: expectedFile,
    url: a.cover_url,
    size: coversMeta.get(expectedFile).size,
    action: "—",
  });
}

// LLM 图文一致性抽样
let llmResults = [];
if (LLM_CHECK && BAILIAN_KEY && SAMPLE > 0) {
  console.log(`\n🤖 LLM 图文一致性抽样 (${SAMPLE} 张)...`);
  const candidates = records.filter((r) => r.status === "✅ OK");
  const sample = candidates.sort(() => Math.random() - 0.5).slice(0, SAMPLE);
  let i = 0;
  for (const c of sample) {
    i++;
    try {
      const prompt = `你是文化主题审查员。给定的封面图对应的知识卡片标题是「${c.title}」（分类 ${c.category}）。
封面 URL: ${c.url}
请基于 URL 文件名和标题判断：1) 这张图大致是关于什么主题？2) 是否与中国文化相关？3) 图与标题的契合度 0-1。
仅返回 JSON：{"topic":"...","culture_related":true/false,"match":0.85,"reason":"..."}`;

      const r = await fetch(`${BAILIAN_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${BAILIAN_KEY}` },
        body: JSON.stringify({
          model: ENV.BAILIAN_MODEL || "qwen-plus",
          messages: [
            { role: "system", content: "你只返回 JSON，不要 Markdown。" },
            { role: "user", content: prompt },
          ],
          max_tokens: 200,
        }),
      });
      const j = await r.json();
      let text = j.choices?.[0]?.message?.content || "";
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const m = text.match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : { match: 0.5, reason: "未解析" };
      c.llm_match = parsed.match;
      c.llm_reason = parsed.reason;
      llmResults.push(c);
      console.log(`  [${i}/${sample.length}] ${c.id} ${c.title} → match=${parsed.match?.toFixed(2)} ${parsed.reason?.slice(0, 30)}`);
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      c.llm_error = String(e).slice(0, 80);
    }
  }
}

// 报告
console.log("\n" + "═".repeat(60));
console.log("📊 封面一致性审计");
console.log("═".repeat(60));
console.log(`  ✅ 正常:        ${matchOk} 篇`);
console.log(`  ❌ 缺封面:      ${noCover} 篇`);
console.log(`  ⚠️ URL孤儿:    ${dbOrphans} 篇 (DB有URL但文件不在)`);
console.log(`  ⚠️ 文件孤儿:   ${fsOrphans} 篇 (文件存在但DB无URL)`);
if (llmResults.length > 0) {
  const bad = llmResults.filter((r) => (r.llm_match || 1) < 0.6);
  const good = llmResults.filter((r) => (r.llm_match || 0) >= 0.8);
  console.log(`  🤖 LLM 抽样:    ${llmResults.length} 张, 高分(≥0.8) ${good.length}, 低分(<0.6) ${bad.length}`);
  if (bad.length > 0) {
    console.log("\n  🚨 建议重新生成的低分封面:");
    for (const b of bad.slice(0, 10)) {
      console.log(`     - ${b.id}  ${b.title}  (${b.llm_match?.toFixed(2)}) ${b.llm_reason?.slice(0, 40)}`);
    }
  }
}

// 写 CSV
const headers = ["id", "title", "category", "status", "file", "size", "url", "llm_match", "llm_reason", "action"];
const csv = [headers.join(",")];
for (const r of records) {
  csv.push(headers.map((h) => {
    const v = String(r[h] ?? "");
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(","));
}
writeFileSync(OUT_CSV, csv.join("\n"), "utf-8");
writeFileSync(OUT_JSON, JSON.stringify({ records, llmResults, summary: { matchOk, noCover, dbOrphans, fsOrphans } }, null, 2), "utf-8");
console.log(`\n📄 报告: ${OUT_CSV}`);
console.log(`📄 JSON: ${OUT_JSON}`);
