/**
 * Met Museum + Art Institute of Chicago 双源批量拉真实文物图
 * v2: 覆盖 18 篇文章, 每篇 1 张
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
const UA = "AetherLight-CoverBot/1.0";

// ============ 1. 文章 → 多个搜索词 (按优先级) ============
const TARGETS = [
  // figures
  { slug: "libai",    terms: ["Tang dynasty horse", "Tang horse", "Han Gan horse", "Night-Shining White"] },
  { slug: "dufu",     terms: ["Tang calligraphy", "Chinese calligraphy", "poet scroll"] },
  { slug: "kongzi",   terms: ["Confucius jade", "Confucius bronze", "ritual vessel Confucius", "jade disc bi"] },
  { slug: "qinshihuang", terms: ["Qin dynasty", "terracotta", "Qin bronze", "Shi Huangdi"] },
  // classics
  { slug: "shijing",  terms: ["Confucian text", "Chinese classic text", "jade ritual"] },
  { slug: "lunyu",   terms: ["Confucian", "Confucius"] },
  // festivals
  { slug: "chunjie",  terms: ["Chinese New Year", "red lantern", "lantern", "Spring Festival"] },
  { slug: "zhongqiu", terms: ["moon Chinese", "celestial Chinese", "jade moon"] },
  { slug: "duanwu",   terms: ["dragon boat", "boat Chinese", "festival boat"] },
  // lifestyle
  { slug: "chadao",   terms: ["Chinese teapot", "teapot yixing", "tea vessel"] },
  { slug: "sichou",   terms: ["Chinese silk textile", "silk brocade", "Chinese robe"] },
  // artifacts
  { slug: "gugong",   terms: ["Ming imperial", "Qing imperial", "imperial dragon", "Ming porcelain dragon", "imperial jade"] },
  { slug: "cizhuan",  terms: ["Chinese porcelain", "blue and white", "qinghua porcelain"] },
  // intangible
  { slug: "jingju",   terms: ["opera mask", "theater mask China", "Chinese opera costume"] },
  { slug: "kunjun",   terms: ["Chinese opera", "kunqu", "Chinese mask"] },
  // technology
  { slug: "zaozhishu", terms: ["Cai Lun", "Chinese paper", "paper scroll Chinese", "calligraphy scroll"] },
  { slug: "huoju",     terms: ["gunpowder", "fireworks", "rocket Chinese"] },
  { slug: "zhinnan",   terms: ["compass Chinese", "magnetic compass", "sou needle"] },
];

// ============ 2. Met Museum ============
const MET = "https://collectionapi.metmuseum.org/public/collection/v1";

async function metSearch(q) {
  const r = await fetch(`${MET}/search?q=${encodeURIComponent(q)}&hasImages=true`, { headers: { "User-Agent": UA } });
  if (!r.ok) return [];
  return (await r.json()).objectIDs || [];
}
async function metObject(id) {
  const r = await fetch(`${MET}/objects/${id}`, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  return r.json();
}

// ============ 3. Art Institute of Chicago ============
const AIC = "https://api.artic.edu/api/v1";
const AIC_IMG = "https://www.artic.edu/iiif/2";  // IIIF 图床

async function aicSearch(q) {
  const fields = "id,title,artist_title,date_display,image_id,is_public_domain,classification_titles,style_titles";
  const r = await fetch(`${AIC}/artworks/search?q=${encodeURIComponent(q)}&fields=${fields}&limit=10&query[term][is_public_domain]=true`, { headers: { "AIC-User-Agent": "AetherLight/1.0" } });
  if (!r.ok) return [];
  const data = await r.json();
  return data.data || [];
}
function aicImgUrl(imageId, size = 800) {
  return `${AIC_IMG}/${imageId}/full/${size},/0/default.jpg`;
}

// ============ 4. 主流程 ============
const LOCAL_DIR = join(ROOT, "public", "real-covers");
mkdirSync(LOCAL_DIR, { recursive: true });

const credits = [];
const used = new Set();  // 防重复

async function download(url) {
  const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`dl ${r.status} ${url}`);
  const ct = r.headers.get("content-type") || "";
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
  return { buf: Buffer.from(await r.arrayBuffer()), ext, contentType: ct };
}

async function upload(filename, buf, contentType) {
  const r = await fetch(`${URL}/storage/v1/object/covers/${filename}`, {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": contentType, "x-upsert": "true" },
    body: buf,
  });
  if (!r.ok) {
    const t = await r.text();
    // 如果同文件已存在, 也算 OK
    if (t.includes("already exists")) return `${URL}/storage/v1/object/public/covers/${filename}`;
    return null;
  }
  return `${URL}/storage/v1/object/public/covers/${filename}`;
}

async function pickFor(slug, terms) {
  for (const term of terms) {
    // Met
    const ids = await metSearch(term);
    for (const id of ids.slice(0, 5)) {
      const obj = await metObject(id);
      if (!obj || !obj.primaryImageSmall) continue;
      if (!/Asian|Chinese/i.test(obj.department || "") &&
          !/China|Chinese|Japan|Korea|Asia/i.test(obj.culture || "")) continue;
      if (used.has(`met-${id}`)) continue;
      used.add(`met-${id}`);
      return {
        source: "Met Museum",
        url: obj.primaryImage,
        title: obj.title,
        artist: obj.artistDisplayName || "Unattributed",
        date: obj.objectDate || "",
        dept: obj.department,
        culture: obj.culture,
        license: "CC0",
        objectId: id,
      };
    }
    // AIC
    const aic = await aicSearch(term);
    for (const item of aic.slice(0, 5)) {
      if (!item.image_id) continue;
      if (!item.is_public_domain) continue;
      const title = item.title || "";
      if (!/china|chinese|asia|asian|tang|ming|qing|han|song/i.test(`${title} ${item.classification_titles || ""}`)) continue;
      if (used.has(`aic-${item.id}`)) continue;
      used.add(`aic-${item.id}`);
      return {
        source: "Art Institute of Chicago",
        url: aicImgUrl(item.image_id, 1200),
        title,
        artist: item.artist_title || "Unattributed",
        date: item.date_display || "",
        dept: (item.classification_titles || []).join(", "),
        culture: "",
        license: "CC0",
        objectId: item.id,
      };
    }
  }
  return null;
}

console.log(`🚀 拉 ${TARGETS.length} 张图...\n`);
for (const t of TARGETS) {
  process.stdout.write(`[${t.slug.padEnd(12)}] `);
  try {
    const picked = await pickFor(t.slug, t.terms);
    if (!picked) {
      console.log("✗ 无可用图");
      continue;
    }
    console.log(`✓ ${picked.title.slice(0, 40)}... (${picked.source})`);
    const { buf, ext, contentType } = await download(picked.url);
    const filename = `real/multi/${t.slug}.${ext}`;
    const publicUrl = await upload(filename, buf, contentType);
    if (!publicUrl) { console.log(`  ✗ upload fail`); continue; }
    const credit = `${picked.artist} | ${picked.title} | ${picked.date} | ${picked.dept} | ${picked.source} (${picked.license}) | id=${picked.objectId}`;
    const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${t.slug}`, {
      method: "PATCH",
      headers: { ...HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify({ cover_url: publicUrl, photo_credit: credit }),
    });
    if (!r.ok) {
      const r2 = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${t.slug}`, {
        method: "PATCH",
        headers: { ...HEADERS, Prefer: "return=minimal" },
        body: JSON.stringify({ cover_url: publicUrl }),
      });
      console.log(`  ${r2.ok ? "✓" : "✗"} patch ${publicUrl.split("/").pop()}${r2.ok ? "" : " (no photo_credit)"}`);
    } else {
      console.log(`  ✓ patch + photo_credit`);
    }
    writeFileSync(join(LOCAL_DIR, `${t.slug}.${ext}`), buf);
    credits.push({ slug: t.slug, ...picked, publicUrl, credit });
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }
}

writeFileSync(join(ROOT, "real-covers-multi.json"), JSON.stringify(credits, null, 2), "utf-8");
console.log(`\n\n✅ 完成: 成功 ${credits.length}/${TARGETS.length} 篇`);
console.log(`写入: real-covers-multi.json`);
console.log(`本地: public/real-covers/`);
