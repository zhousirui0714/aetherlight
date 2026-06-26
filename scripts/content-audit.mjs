/**
 * 知识库字段完整性审计
 * - 拉取 knowledge_articles 全部
 * - 逐字段检查空/缺失
 * - 对照 public/ai-covers/ 文件系统
 * - 输出 scripts/audit-content.csv + audit-content.json
 *
 * 用法: node scripts/content-audit.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const COVERS_DIR = join(ROOT, "public", "ai-covers");
const OUT_CSV = join(ROOT, "scripts", "audit-content.csv");
const OUT_JSON = join(ROOT, "scripts", "audit-content.json");

function loadEnv() {
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}
const ENV = loadEnv();
const URL = ENV.SUPABASE_URL || ENV.VITE_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

// 1) 列出现存封面文件
const coversFs = new Set();
if (existsSync(COVERS_DIR)) {
  for (const f of readdirSync(COVERS_DIR)) {
    if (f.endsWith(".jpg") || f.endsWith(".png")) {
      const fp = join(COVERS_DIR, f);
      const s = statSync(fp);
      if (s.size > 1024) coversFs.add(f);
    }
  }
}
console.log(`📁 文件系统封面: ${coversFs.size} 张`);

// 2) 拉取全部文章 (分页)
const all = [];
let offset = 0;
const PAGE = 500;
console.log("🔌 拉取 knowledge_articles...");
while (true) {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=id,title,category,sub_category,cover_url,excerpt,body,history,influence,faq,related_people,related_books,related_articles,related_events,tags&limit=${PAGE}&offset=${offset}`,
    { headers: HEADERS }
  );
  if (!r.ok) {
    console.error("❌ fetch failed:", r.status, await r.text());
    break;
  }
  const d = await r.json();
  if (d.length === 0) break;
  all.push(...d);
  if (d.length < PAGE) break;
  offset += PAGE;
}
console.log(`📊 拉取到 ${all.length} 篇`);

// 3) 字段完整性检查
const required = {
  cover_url: (v) => !!v,
  excerpt: (v) => typeof v === "string" && v.trim().length >= 10,
  body: (v) => typeof v === "string" && v.trim().length >= 30,
  history: (v) => typeof v === "string" && v.trim().length >= 20,
  influence: (v) => typeof v === "string" && v.trim().length >= 20,
  faq: (v) => Array.isArray(v) && v.length >= 2,
  related_people: (v) => Array.isArray(v) && v.length >= 1,
  related_books: (v) => Array.isArray(v),
  related_articles: (v) => Array.isArray(v),
  related_events: (v) => Array.isArray(v),
};
const fieldNames = Object.keys(required);

const records = [];
let totalMissing = 0;
const summary = { total: all.length, byCategory: {}, byField: {} };

for (const a of all) {
  const missing = [];
  for (const f of fieldNames) {
    if (!required[f](a[f])) {
      missing.push(f);
      summary.byField[f] = (summary.byField[f] || 0) + 1;
    }
  }
  // 检查封面文件
  const expectedFile = `article_${a.id.replace(/[^a-zA-Z0-9_\-]/g, "_")}.jpg`;
  const coverFileExists = coversFs.has(expectedFile);
  if (!a.cover_url && !coverFileExists) {
    missing.push("cover_file");
    summary.byField["cover_file"] = (summary.byField["cover_file"] || 0) + 1;
  }

  const completeness = (fieldNames.length + 1 - missing.length) / (fieldNames.length + 1);
  const grade = completeness >= 0.9 ? "A" : completeness >= 0.7 ? "B" : completeness >= 0.5 ? "C" : "D";

  summary.byCategory[a.category] = summary.byCategory[a.category] || { total: 0, D: 0, C: 0, B: 0, A: 0 };
  summary.byCategory[a.category].total++;
  summary.byCategory[a.category][grade]++;
  totalMissing += missing.length;

  records.push({
    id: a.id,
    title: a.title,
    category: a.category,
    sub_category: a.sub_category || "",
    grade,
    completeness: Math.round(completeness * 100) + "%",
    missing_fields: missing.join("|") || "—",
    cover_url: a.cover_url || "",
    cover_file: coverFileExists ? expectedFile : "✗",
    body_len: (a.body || "").length,
    history_len: (a.history || "").length,
  });
}

// 4) 排序：缺字段多的在前
records.sort((a, b) => b.missing_fields.split("|").length - a.missing_fields.split("|").length);

// 5) 写 CSV
const headers = ["id", "title", "category", "sub_category", "grade", "completeness", "missing_fields", "cover_file", "cover_url", "body_len", "history_len"];
const csvLines = [headers.join(",")];
for (const r of records) {
  csvLines.push(headers.map((h) => {
    const v = String(r[h] ?? "");
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(","));
}
writeFileSync(OUT_CSV, csvLines.join("\n"), "utf-8");

writeFileSync(OUT_JSON, JSON.stringify({ summary, records }, null, 2), "utf-8");

// 6) 终端报告
console.log("\n" + "═".repeat(60));
console.log("📋 字段缺失统计（按字段）");
console.log("═".repeat(60));
const sortedFields = Object.entries(summary.byField).sort((a, b) => b[1] - a[1]);
for (const [f, n] of sortedFields) {
  const pct = ((n / all.length) * 100).toFixed(1);
  console.log(`  ${f.padEnd(20)} ${String(n).padStart(4)} 篇  (${pct}%)`);
}

console.log("\n" + "═".repeat(60));
console.log("📊 完整度分级（按分类）");
console.log("═".repeat(60));
console.log(`${"分类".padEnd(12)} ${"总".padStart(4)}  ${"A≥90%".padStart(6)}  ${"B≥70%".padStart(6)}  ${"C≥50%".padStart(6)}  ${"D<50%".padStart(6)}`);
console.log("─".repeat(50));
for (const [cat, s] of Object.entries(summary.byCategory).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`${cat.padEnd(12)} ${String(s.total).padStart(4)}  ${String(s.A).padStart(6)}  ${String(s.B).padStart(6)}  ${String(s.C).padStart(6)}  ${String(s.D).padStart(6)}`);
}

console.log("\n" + "═".repeat(60));
console.log("🚨 最缺内容的 10 篇");
console.log("═".repeat(60));
for (const r of records.slice(0, 10)) {
  console.log(`  ${r.grade}  ${r.id.padEnd(20)} [${r.category}] ${r.title}`);
  console.log(`     缺: ${r.missing_fields}`);
}

console.log(`\n✅ 报告写入:`);
console.log(`   ${OUT_CSV}`);
console.log(`   ${OUT_JSON}`);
console.log(`\n📈 总缺字段次数: ${totalMissing} | 平均每篇缺 ${(totalMissing / all.length).toFixed(1)} 个字段`);
