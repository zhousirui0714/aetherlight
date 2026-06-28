/**
 * 批量从 Met Museum API 拉真实中国文物图, 入库 Supabase, PATCH 详情页 hero
 *
 * 优势:
 *   - Met Museum 5万+ 中国相关物件
 *   - CC0 公共域, 商用免费, 不需要署名(但我们仍会保留)
 *   - 公开 JSON API, 无 key, 无 rate limit
 *
 * 流程:
 *   1. 搜 chinese 相关主题 (Scholar / Dragon / Porcelain / Calligraphy / Op / Landscape / Painting)
 *   2. 拿每条搜的前 N 个 objectId
 *   3. 详情 API 拿 primaryImage (高清)
 *   4. 下载到 Buffer, 上传 covers/real/met/{id}.jpg
 *   5. PATCH knowledge_articles.cover_url (按 articleId 配)
 *   6. 写真实 photo_credit (artist + objectDate + department)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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

const MET_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
const UA = "AetherLight-CoverBot/1.0";

// 1. 多主题搜索, 各拿若干 objectId
const SEARCH_TERMS = [
  // 主题 → 配 1+ 篇文章
  { q: "Chinese scholar painting",  topic: "scholar" },      // 山水/文人
  { q: "Chinese dragon porcelain", topic: "dragon" },        // 龙
  { q: "Chinese calligraphy",      topic: "calligraphy" },   // 书法
  { q: "Chinese opera mask",       topic: "opera" },         // 京剧脸谱
  { q: "Confucius",                topic: "confucius" },     // 孔子
  { q: "Chinese teapot",           topic: "teapot" },        // 茶
  { q: "Chinese silk",             topic: "silk" },          // 丝绸
  { q: "Chinese landscape",        topic: "landscape" },     // 山水
  { q: "Chinese moon",             topic: "moon" },          // 中秋
  { q: "Chinese New Year",         topic: "newyear" },       // 春节
  { q: "Forbidden City",           topic: "palace" },        // 故宫
  { q: "Tang dynasty",             topic: "tang" },          // 唐代
  { q: "Ming porcelain",           topic: "ming" },          // 明瓷
];

// 2. 文章 slug → 主题 (DB 实际主键)
const ARTICLE_BY_TOPIC = {
  scholar:    ["kongzi", "libai"],                  // 孔子 + 李白(文人气)
  calligraphy:["libai", "dufu"],                    // 诗仙诗圣
  confucius:  ["kongzi"],
  opera:      ["jingju"],
  teapot:     ["chadao"],
  silk:       ["sichou"],
  moon:       ["zhongqiu"],
  newyear:    ["chunjie"],
  palace:     ["gugong"],
  landscape:  ["libai", "dufu"],                    // 诗配山水
  tang:       ["libai", "dufu"],
  dragon:     ["gugong"],
  ming:       ["gugong"],
};

async function metSearch(term) {
  const u = `${MET_BASE}/search?q=${encodeURIComponent(term.q)}&isHighlight=true&hasImages=true`;
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) return [];
  const data = await r.json();
  return data.objectIDs || [];
}

async function metObject(id) {
  const u = `${MET_BASE}/objects/${id}`;
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  return r.json();
}

async function download(url) {
  const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`dl ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function upload(filename, buf, contentType) {
  const r = await fetch(`${URL}/storage/v1/object/covers/${filename}`, {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": contentType, "x-upsert": "true" },
    body: buf,
  });
  if (!r.ok) {
    console.error(`  upload fail ${r.status}: ${await r.text()}`);
    return null;
  }
  return `${URL}/storage/v1/object/public/covers/${filename}`;
}

// 3. 跑!
const cache = []; // { topic, id, title, artist, date, dept, image }
console.log("🔍 拉候选物件...");
for (const term of SEARCH_TERMS) {
  const ids = await metSearch(term);
  console.log(`  [${term.topic}] ${term.q} → ${ids.length} 候选`);
  // 拿前 3 个详情
  for (const id of ids.slice(0, 5)) {
    const obj = await metObject(id);
    if (!obj || !obj.primaryImageSmall) continue;
    // 放宽 department 匹配 (Met 用 "Asian Art")
    if (!/Asian|Chinese/i.test(obj.department || "") &&
        !/China|Chinese|Japan|Korea|Asia/i.test(obj.culture || "")) continue;
    cache.push({
      topic: term.topic,
      objectId: id,
      title: obj.title,
      artist: obj.artistDisplayName || "Unattributed",
      date: obj.objectDate || "",
      dept: obj.department,
      culture: obj.culture || "",
      image: obj.primaryImage,
      thumb: obj.primaryImageSmall,
    });
  }
}
console.log(`\n📦 共 ${cache.length} 件候选`);

// 4. 按 articleSlug 分配, 每个 slug 取 1 张
const articleToImage = {}; // slug -> { url, credit }
const usedIds = new Set();
for (const [topic, slugs] of Object.entries(ARTICLE_BY_TOPIC)) {
  const candidates = cache.filter((c) => c.topic === topic && !usedIds.has(c.objectId));
  if (candidates.length === 0) {
    console.log(`  ⚠️  [${topic}] 无可用图`);
    continue;
  }
  // 选第一张, 标记 used
  const c = candidates[0];
  usedIds.add(c.objectId);
  for (const slug of slugs) {
    if (articleToImage[slug]) continue; // 已分配过
    articleToImage[slug] = c;
    console.log(`  ✓ ${slug} ← [${topic}] ${c.title} (${c.artist}, ${c.date})`);
  }
}

// 5. 下载 + 上传 + PATCH
const LOCAL_DIR = join(ROOT, "public", "real-covers");
mkdirSync(LOCAL_DIR, { recursive: true });
const credits = [];

console.log("\n⬆️  下载 + 上传 + PATCH...");
for (const [slug, c] of Object.entries(articleToImage)) {
  try {
    console.log(`\n[${slug}] ${c.title}`);
    const buf = await download(c.image);
    const ext = c.image.match(/\.(\w+)(?:\?|$)/)?.[1] || "jpg";
    const filename = `real/met/${slug}.${ext}`;
    const publicUrl = await upload(filename, buf, `image/${ext === "jpg" ? "jpeg" : ext}`);
    if (!publicUrl) continue;
    console.log(`  ✓ upload ${publicUrl}`);

    // PATCH cover_url
    const credit = `${c.artist || "Unattributed"} | ${c.title} | ${c.date} | ${c.dept} | Met Museum (CC0) | objectId=${c.objectId}`;
    const patch = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${slug}`, {
      method: "PATCH",
      headers: { ...HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify({ cover_url: publicUrl, photo_credit: credit }),
    });
    if (!patch.ok) {
      // 退到只 patch cover_url (没 photo_credit 字段)
      const r2 = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${slug}`, {
        method: "PATCH",
        headers: { ...HEADERS, Prefer: "return=minimal" },
        body: JSON.stringify({ cover_url: publicUrl }),
      });
      if (!r2.ok) { console.log(`  ✗ patch fail: ${r2.status}`); continue; }
      console.log(`  ✓ patch (no photo_credit)`);
    } else {
      console.log(`  ✓ patch + photo_credit`);
    }

    // 本地存一份 (备份)
    writeFileSync(join(LOCAL_DIR, `${slug}.${ext}`), buf);

    credits.push({ slug, ...c, publicUrl, credit });
  } catch (e) {
    console.log(`  ✗ ${e.message}`);
  }
}

writeFileSync(join(ROOT, "real-covers-met.json"), JSON.stringify(credits, null, 2), "utf-8");
console.log(`\n\n✅ 完成! 成功 ${credits.length} 张`);
console.log(`写入: real-covers-met.json`);
console.log(`本地: public/real-covers/`);
