/**
 * 批量给 1966 篇 knowledge_articles 分配水墨风 cover
 *
 * 流程:
 *   1. 读 covers-sumi-urls.json (9 张水墨风 SVG 的 public URL)
 *   2. 拉全表 1966 篇 (id, category), 用 .range 分页
 *   3. 按 category 分桶
 *   4. 批量 PATCH cover_url (每批 50)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = {};
for (const line of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m && !line.startsWith("#")) ENV[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const URL = ENV.SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("❌ env missing"); process.exit(1); }

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "count=exact",
};

const urlByCat = JSON.parse(readFileSync(join(ROOT, "covers-sumi-urls.json"), "utf-8"));
const validCats = Object.keys(urlByCat);
console.log("✓ URL 映射:", validCats.length, "个分类");

// 1. 分页拉全表 (id, category) - PostgREST 默认 1000 上限
console.log("\n拉取所有文章...");
let allArticles = [];
const PAGE = 1000;
let from = 0;
while (true) {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=id,category&order=id&limit=${PAGE}&offset=${from}`,
    { headers: HEADERS }
  );
  if (!r.ok) { console.error("fetch err:", r.status, await r.text()); process.exit(1); }
  const arr = await r.json();
  allArticles = allArticles.concat(arr);
  console.log(`  ${from}–${from + arr.length} (累计 ${allArticles.length})`);
  if (arr.length < PAGE) break;
  from += PAGE;
  if (from > 5000) { console.log("达到 5000 上限, 停止"); break; }
}
console.log(`✓ 共 ${allArticles.length} 篇`);

// 2. 按 category 分桶 + 检查未匹配
const buckets = {};
const unmatched = [];
for (const a of allArticles) {
  if (a.category && urlByCat[a.category]) {
    if (!buckets[a.category]) buckets[a.category] = [];
    buckets[a.category].push(a.id);
  } else {
    unmatched.push({ id: a.id, category: a.category });
  }
}
console.log("\n分类分布:");
for (const cat of validCats) {
  console.log(`  ${cat}: ${buckets[cat]?.length || 0} 篇`);
}
if (unmatched.length > 0) {
  console.log(`\n⚠️  未匹配 category: ${unmatched.length} 篇 (示例: ${JSON.stringify(unmatched.slice(0, 3))})`);
  // 给未匹配的也分配第一个分类的图 (兜底)
  console.log(`  → 全部归入 'poems' (兜底)`);
  if (!buckets.poems) buckets.poems = [];
  buckets.poems.push(...unmatched.map((u) => u.id));
}

// 3. 批量 PATCH
const BATCH = 50;
let updated = 0;
let totalToUpdate = 0;
for (const cat of validCats) totalToUpdate += buckets[cat]?.length || 0;
console.log(`\n开始批量 PATCH (目标 ${totalToUpdate} 篇, 每批 ${BATCH})...`);

for (const cat of validCats) {
  const ids = buckets[cat] || [];
  if (ids.length === 0) continue;
  const url = urlByCat[cat];
  console.log(`\n[${cat}] ${ids.length} 篇 → ${url.split("/").pop()}`);

  for (let i = 0; i < ids.length; i += BATCH) {
    const slice = ids.slice(i, i + BATCH);
    // 用 in.() 批量 PATCH
    const inList = `(${slice.join(",")})`;
    const r = await fetch(
      `${URL}/rest/v1/knowledge_articles?id=in.${inList}`,
      {
        method: "PATCH",
        headers: { ...HEADERS, Prefer: "return=minimal" },
        body: JSON.stringify({ cover_url: url }),
      }
    );
    if (!r.ok) {
      console.error(`  ✗ batch ${i}-${i + slice.length}: ${r.status} ${await r.text()}`);
    } else {
      updated += slice.length;
      process.stdout.write(`\r  [${Math.min(i + BATCH, ids.length)}/${ids.length}] updated=${updated}/${totalToUpdate}  `);
    }
  }
}

console.log(`\n\n✅ 完成: ${updated}/${totalToUpdate} 篇已分配水墨风 cover_url`);

// 4. 验证
const verify = await fetch(`${URL}/rest/v1/knowledge_articles?select=id&cover_url=is.null&limit=0`, { headers: HEADERS });
console.log(`\n📊 剩余 cover_url IS NULL:`, verify.headers.get("content-range"));
const verify2 = await fetch(`${URL}/rest/v1/knowledge_articles?select=id&cover_url=not.is.null&limit=0`, { headers: HEADERS });
console.log(`📊 已有 cover_url:        `, verify2.headers.get("content-range"));
