/**
 * DB 清理：清空 author 字段含"溯光/编辑部"等占位符
 * 直接 SQL via 逐条 in 批量
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = (() => {
  const env = {};
  for (const line of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
})();
const HEADERS = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

console.log("🔍 扫描含溯光/编辑部的 author ...");
let offset = 0;
const PAGE = 200;
const all = [];
while (true) {
  const r = await fetch(
    `${ENV.SUPABASE_URL}/rest/v1/knowledge_articles?or=(author.ilike.*溯光*,author.ilike.*编辑部*)&select=id,title,author&limit=${PAGE}&offset=${offset}`,
    { headers: HEADERS }
  );
  if (!r.ok) break;
  const d = await r.json();
  if (d.length === 0) break;
  all.push(...d);
  if (d.length < PAGE) break;
  offset += PAGE;
}
console.log(`📊 命中 ${all.length} 条`);
if (all.length === 0) {
  console.log("✅ 已是干净状态");
  process.exit(0);
}

console.log("前 5 条示例:");
for (const a of all.slice(0, 5)) console.log(`  ${a.id}  ${a.title}  → "${a.author}"`);

// 批量 PATCH (每批 50 条)
const BATCH = 50;
let ok = 0, fail = 0;
for (let i = 0; i < all.length; i += BATCH) {
  const chunk = all.slice(i, i + BATCH);
  const ids = chunk.map((x) => `"${x.id}"`).join(",");
  const r = await fetch(`${ENV.SUPABASE_URL}/rest/v1/knowledge_articles?id=in.(${ids})`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({ author: "" }),
  });
  if (r.ok) ok += chunk.length;
  else {
    fail += chunk.length;
    console.log(`  ❌ batch ${i}-${i + BATCH}: ${r.status} ${(await r.text()).slice(0, 100)}`);
  }
  process.stdout.write(`\r  PATCH ${Math.min(i + BATCH, all.length)}/${all.length}  ok=${ok} fail=${fail}`);
}
console.log(`\n\n✅ 完成: ok=${ok} fail=${fail}`);
