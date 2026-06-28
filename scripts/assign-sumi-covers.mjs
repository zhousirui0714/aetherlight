/**
 * 批量给 1966 篇 knowledge_articles 分配水墨风 cover
 * v2: 12 张图, poems 拆 4 张轮询
 *
 * 分配规则:
 *   - poems (1405) → 4 张轮询 poems-a/b/c/d
 *   - classics/figures/philosophy/mythology/festivals/lifestyle/artifacts/intangible/technology 各 1 张
 *   - 未匹配 category → poems-a (兜底)
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

const urlByKey = JSON.parse(readFileSync(join(ROOT, "covers-sumi-urls.json"), "utf-8"));
console.log("✓ URL 映射:", Object.keys(urlByKey).length, "张图");

// category -> key[] (支持多张轮询)
const CATEGORY_KEYS = {
  poems:      ["poems-a", "poems-b", "poems-c", "poems-d"],
  classics:   ["classics"],
  figures:    ["figures"],
  philosophy: ["philosophy"],
  mythology:  ["mythology"],
  festivals:  ["festivals"],
  lifestyle:  ["lifestyle"],
  artifacts:  ["artifacts"],
  intangible: ["intangible"],
  technology: ["technology"],
};
const FALLBACK = "poems-a";

// 1. 拉全表
console.log("\n拉取所有文章...");
let all = [];
const PAGE = 1000;
let from = 0;
while (true) {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=id,category&order=id&limit=${PAGE}&offset=${from}`,
    { headers: HEADERS }
  );
  if (!r.ok) { console.error("fetch err:", r.status, await r.text()); process.exit(1); }
  const arr = await r.json();
  all = all.concat(arr);
  console.log(`  ${from}–${from + arr.length} (累计 ${all.length})`);
  if (arr.length < PAGE) break;
  from += PAGE;
  if (from > 5000) break;
}
console.log(`✓ 共 ${all.length} 篇`);

// 2. 分配 url (按 category 轮询)
const updates = []; // [{ id, cover_url }]
const stat = {}; // key -> count
for (const a of all) {
  const keys = (a.category && CATEGORY_KEYS[a.category]) || [FALLBACK];
  // 用 hash 简单分桶, 同一 id 永远拿同一个 key (保证稳定)
  const hash = [...a.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const key = keys[hash % keys.length];
  updates.push({ id: a.id, cover_url: urlByKey[key] });
  stat[key] = (stat[key] || 0) + 1;
}

console.log("\n分配统计:");
for (const [k, v] of Object.entries(stat)) console.log(`  ${k}: ${v}`);
console.log(`  总: ${updates.length}`);

// 3. 批量 PATCH (每批 50)
const BATCH = 50;
let updated = 0;
console.log(`\n开始批量 PATCH (每批 ${BATCH})...`);

for (let i = 0; i < updates.length; i += BATCH) {
  const slice = updates.slice(i, i + BATCH);
  // 按 url 分组, 每组用 in.() 批量
  const byUrl = {};
  for (const u of slice) {
    if (!byUrl[u.cover_url]) byUrl[u.cover_url] = [];
    byUrl[u.cover_url].push(u.id);
  }
  for (const [url, ids] of Object.entries(byUrl)) {
    const r = await fetch(
      `${URL}/rest/v1/knowledge_articles?id=in.(${ids.join(",")})`,
      {
        method: "PATCH",
        headers: { ...HEADERS, Prefer: "return=minimal" },
        body: JSON.stringify({ cover_url: url }),
      }
    );
    if (!r.ok) console.error(`  ✗ batch err: ${r.status} ${await r.text()}`);
  }
  updated += slice.length;
  process.stdout.write(`\r  [${Math.min(i + BATCH, updates.length)}/${updates.length}]  `);
}

console.log(`\n\n✅ 完成: ${updated}/${updates.length} 篇`);

// 4. 验证
const v1 = await fetch(`${URL}/rest/v1/knowledge_articles?select=id&cover_url=is.null&limit=0`, { headers: HEADERS });
console.log(`\n📊 cover_url IS NULL:    `, v1.headers.get("content-range"));
const v2 = await fetch(`${URL}/rest/v1/knowledge_articles?select=id&cover_url=not.is.null&limit=0`, { headers: HEADERS });
console.log(`📊 cover_url NOT NULL:    `, v2.headers.get("content-range"));
