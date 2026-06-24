/**
 * 把 AI 试点成功的 cover URL 合并到 knowledge_articles_v3.json
 * 读 scripts/output/report.json 拿成功项, 改对应 article 的 cover_url 字段
 *
 * 运行: npx tsx scripts/apply-cover-pilot.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORT_FILE = join(ROOT, "scripts/output/report.json");
const V3_FILE = join(ROOT, "backend/data/knowledge_articles_v3.json");

if (!existsSync(REPORT_FILE)) {
  console.error("❌ 缺少 scripts/output/report.json (请先跑 generate-cover-batch.ts)");
  process.exit(1);
}

const report: any = JSON.parse(readFileSync(REPORT_FILE, "utf-8"));
const v3: any[] = JSON.parse(readFileSync(V3_FILE, "utf-8"));

let updated = 0;
let skipped = 0;

for (const r of report.results) {
  if (!r.ok) { skipped++; continue; }

  const idx = v3.findIndex((a) => a.id === r.id);
  if (idx < 0) { skipped++; continue; }

  // 写 pollinations URL 到 cover_url
  v3[idx].cover_url = r.url;
  // 保留 cover emoji 不动 (前端逻辑会优先用 cover_url)
  updated++;
}

writeFileSync(V3_FILE, JSON.stringify(v3, null, 2));

console.log(`✅ 成功更新 ${updated} 条 cover_url`);
console.log(`⏭️  跳过 ${skipped} 条 (失败/不存在)`);
console.log(`📄 写入: ${V3_FILE}`);
