/**
 * 引入真实图片 (Wikipedia/Commons) 给 Top 高曝光文章
 *
 * 流程:
 *   1. 准备 articleId -> Wikipedia 标题的 mapping
 *   2. Wikipedia API 拿 lead image
 *   3. 下载 → 上传 Supabase storage
 *   4. PATCH knowledge_articles.cover_url
 *   5. 写入 photo_credit 字段 (如存在)
 *
 * 图源: Wikipedia/Wikimedia Commons, CC BY-SA 4.0
 *       详情页 footer 需注明图源 + 作者
 */
import { readFileSync, writeFileSync } from "node:fs";
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

// 中文 Wikipedia 词条 (人工挑选, 命中率高的代表性词条)
const TARGETS = [
  { id: "libai",          title: "李白",     fallback: "Li_Bai" },
  { id: "dufu",           title: "杜甫",     fallback: "Du_Fu" },
  { id: "gugong",         title: "北京故宫", fallback: "Forbidden_City" },
  { id: "chunjie",        title: "春节",     fallback: "Chinese_New_Year" },
  { id: "zaozhishu",      title: "造纸术",   fallback: "Cai_Lun" },
  { id: "jingju",         title: "京剧",     fallback: "Peking_opera" },
  { id: "kongzi",         title: "孔子",     fallback: "Confucius" },
  { id: "chadao",         title: "茶道",     fallback: "Chinese_tea_culture" },
  { id: "zhongqiu",       title: "中秋节",   fallback: "Mid-Autumn_Festival" },
  { id: "sichou",         title: "丝绸",     fallback: "Silk_in_China" },
];

// 1. 查 article UUID (DB 用 slug 字符串做主键, 不是 UUID)
console.log("🔍 查 article (id 即 slug)...");
const slugToId = {};
for (const t of TARGETS) {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?id=eq.${t.id}&select=id,title,category&limit=1`,
    { headers: HEADERS }
  );
  if (!r.ok) { console.error(`fetch err ${t.id}: ${r.status}`); continue; }
  const arr = await r.json();
  if (arr.length > 0) {
    slugToId[t.id] = arr[0].id;
    console.log(`  ✓ ${t.id} (${arr[0].title}, ${arr[0].category})`);
  } else {
    console.log(`  ✗ ${t.id} not found by id`);
  }
}

// 2. Wikipedia API 拿 lead image (zh + en fallback)
async function getLeadImage(title, fallback) {
  // 先试 zh
  let info = await tryWiki("zh", title);
  if (!info) info = await tryWiki("en", fallback);
  return info;
}

async function tryWiki(lang, title) {
  const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
  const url = `${endpoint}?action=query&format=json&prop=pageimages|imageinfo&piprop=original&iiprop=extmetadata|url&titles=${encodeURIComponent(title)}`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "AetherLight-CoverBot/1.0" } });
    if (!r.ok) { console.log(`  ⚠️  ${lang}.${title} HTTP ${r.status}`); return null; }
    const data = await r.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    if (!page || page.missing !== undefined) {
      console.log(`  ⚠️  ${lang}.${title} not found`);
      return null;
    }
    const orig = page.original || (page.pageimage && `https://${lang}.wikipedia.org/wiki/Special:FilePath/${page.pageimage}`);
    if (!orig) {
      console.log(`  ⚠️  ${lang}.${title} no lead image`);
      return null;
    }
    // extmetadata 里有 artist/license
    const meta = page.imageinfo?.[0]?.extmetadata || {};
    const artist = cleanMeta(meta.Artist?.value) || "Wikipedia / Wikimedia Commons";
    const license = cleanMeta(meta.LicenseShortName?.value) || "CC BY-SA 4.0";
    const creditLine = cleanMeta(meta.Credit?.value) || "";
    return { url: orig, artist, license, creditLine, sourceTitle: title, lang };
  } catch (e) {
    console.log(`  ⚠️  ${lang}.${title} err: ${e.message}`);
    return null;
  }
}

function cleanMeta(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[|\]\]/g, "")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// 3. 拿图 + 下载 + 上传
async function downloadImage(url) {
  const r = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "AetherLight-CoverBot/1.0" },
  });
  if (!r.ok) throw new Error(`download ${r.status}`);
  const ct = r.headers.get("content-type") || "";
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
  const buf = Buffer.from(await r.arrayBuffer());
  return { buf, ext, contentType: ct };
}

async function uploadToStorage(filename, buf, contentType) {
  const r = await fetch(`${URL}/storage/v1/object/covers/${filename}`, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buf,
  });
  if (!r.ok) {
    console.error(`  upload fail: ${r.status} ${await r.text()}`);
    return null;
  }
  return `${URL}/storage/v1/object/public/covers/${filename}`;
}

console.log("\n📥 拉图 + 上传...");
const result = {};
for (const t of TARGETS) {
  const articleId = slugToId[t.id];
  if (!articleId) continue;
  console.log(`\n[${t.title}]`);
  const info = await getLeadImage(t.title, t.fallback);
  if (!info) { console.log(`  ✗ 跳过, 无可用图`); continue; }
  console.log(`  ✓ 找到: ${info.url}`);
  console.log(`    署名: ${info.artist}`);
  console.log(`    许可: ${info.license}`);
  try {
    const { buf, ext, contentType } = await downloadImage(info.url);
    console.log(`  ✓ 下载: ${(buf.length / 1024).toFixed(0)}KB (${ext})`);
    const filename = `real/${t.id}.${ext}`;
    const publicUrl = await uploadToStorage(filename, buf, contentType);
    if (!publicUrl) continue;
    console.log(`  ✓ 上传: ${publicUrl}`);
    result[articleId] = { url: publicUrl, artist: info.artist, license: info.license, creditLine: info.creditLine, sourceTitle: info.sourceTitle, lang: info.lang };
  } catch (e) {
    console.log(`  ✗ 失败: ${e.message}`);
  }
}

// 4. PATCH DB
console.log("\n📝 PATCH cover_url ...");
for (const [articleId, r] of Object.entries(result)) {
  const patchBody = { cover_url: r.url };
  // 如果有 photo_credit 字段就一起更新
  const credit = `${r.artist} | ${r.license} | via ${r.lang}.wikipedia.org/wiki/${encodeURIComponent(r.sourceTitle)}`;
  // 试 patch photo_credit, 不存在也不报错
  const resp = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${articleId}`, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify({ ...patchBody, photo_credit: credit }),
  });
  if (!resp.ok) {
    // 退到只 patch cover_url
    const r2 = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${articleId}`, {
      method: "PATCH",
      headers: { ...HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify(patchBody),
    });
    if (!r2.ok) console.log(`  ✗ ${articleId} patch fail: ${r2.status}`);
    else console.log(`  ✓ ${articleId} → ${r.url.split("/").pop()} (无 photo_credit 字段)`);
  } else {
    console.log(`  ✓ ${articleId} → ${r.url.split("/").pop()} + photo_credit`);
  }
}

writeFileSync(join(ROOT, "real-covers-result.json"), JSON.stringify(result, null, 2), "utf-8");
console.log(`\n✅ 完成, 写入 real-covers-result.json`);
