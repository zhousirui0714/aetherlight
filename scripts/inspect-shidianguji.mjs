// scripts/inspect-shidianguji.mjs
// 解析识典古籍 sitemap，了解可用的 ID
import fs from "fs/promises";

const INDEX_URL = "https://www.shidianguji.com/sitemap/book-v2/index.xml";

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`);
  return r.text();
}

async function main() {
  console.log("[1/3] 拉 sitemap index ...");
  const idxXml = await fetchText(INDEX_URL);
  const subUrls = Array.from(idxXml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  console.log(`     子 sitemap ${subUrls.length} 个: ${subUrls.join(", ")}`);

  let allIds = [];
  for (const u of subUrls) {
    console.log(`[2/3] 拉 ${u} ...`);
    const xml = await fetchText(u);
    const ids = Array.from(
      xml.matchAll(/<loc>https:\/\/www\.shidianguji\.com\/book\/([A-Za-z0-9_-]+)<\/loc>/g)
    ).map((m) => m[1]);
    allIds = allIds.concat(ids);
    console.log(`     拿到 ${ids.length} 个 ID`);
  }
  allIds = Array.from(new Set(allIds));
  console.log(`[3/3] 去重后共 ${allIds.length} 个独立书 ID`);

  // 简单 ID 类型分布
  const buckets = {};
  for (const id of allIds) {
    const prefix = id.match(/^[A-Z]+/)?.[0] || "OTHER";
    buckets[prefix] = (buckets[prefix] || 0) + 1;
  }
  console.log("     ID 前缀分布:", JSON.stringify(buckets, null, 2));

  await fs.writeFile(
    "scripts/shidianguji-ids.json",
    JSON.stringify(allIds, null, 2)
  );
  console.log("     写入 scripts/shidianguji-ids.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
