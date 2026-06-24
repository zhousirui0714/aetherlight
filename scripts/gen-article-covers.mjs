/**
 * 批量为每篇文章生成独特水墨风 AI 插图
 * - 读取 1902 篇 knowledge_articles
 * - 基于 category + sub_category + title + tags 生成独特 prompt
 * - 单张串行 + 重试
 * - 上传 Supabase Storage covers/{id}.jpg
 * - 写入 cover_url
 *
 * 用法:
 *   node scripts/gen-article-covers.mjs 100   # 跑前 100 篇
 *   node scripts/gen-article-covers.mjs all   # 跑全部 1902 篇
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const CACHE_FILE = join(ROOT, "scripts", "covers-progress.json");
const COVERS_DIR = join(ROOT, "public", "ai-covers");
const BUCKET = "covers";

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

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

mkdirSync(COVERS_DIR, { recursive: true });

// 1. 获取所有文章
const allArticles = [];
let offset = 0;
const PAGE = 500;
console.log("获取文章列表...");
while (true) {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=id,title,category,sub_category,tags,excerpt&order=view_count.desc&limit=${PAGE}&offset=${offset}`,
    { headers: HEADERS }
  );
  const d = await r.json();
  if (d.length === 0) break;
  allArticles.push(...d);
  if (d.length < PAGE) break;
  offset += PAGE;
}
console.log(`找到 ${allArticles.length} 篇文章 (按热度排序)`);

// 2. 限制数量
const limitArg = process.argv[2] || "100";
const limit = limitArg === "all" ? allArticles.length : parseInt(limitArg);
const articles = allArticles.slice(0, limit);
console.log(`本批将处理: ${articles.length} 篇\n`);

// 3. 加载进度（断点续传）
let progress = {};
if (existsSync(CACHE_FILE)) {
  progress = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
  console.log(`已加载进度: ${Object.keys(progress).length} 张已完成`);
}

// 4. 提示词模板（严格无文字）
const STYLE = `Traditional Chinese ink wash painting (shuimo), sumi-e brush technique, wet ink wash gradients with 5-7 shades of gray ink only, generous negative space (60% blank rice paper), no outlines, no color except one small vermillion red seal stamp at corner. STRICTLY NO TEXT, NO CHARACTERS, NO LETTERS, NO WRITING, NO CALLIGRAPHY, NO INSCRIPTIONS anywhere. Empty blank surfaces only. No modern elements, no frame, no border, no watermark, no signature, no captions, no labels, no titles, no annotations. Aspect ratio 4:3, museum quality, ultra high detail, masterpiece.`;

// 5. 根据 article 生成独特 prompt
function buildPrompt(article) {
  const parts = [];
  parts.push(`Category: ${article.category}`);
  if (article.sub_category) parts.push(`Subcategory: ${article.sub_category}`);
  if (article.tags && article.tags.length) parts.push(`Tags: ${article.tags.join(", ")}`);
  parts.push(`Title: ${article.title}`);
  if (article.excerpt) parts.push(`Excerpt: ${article.excerpt.slice(0, 200)}`);

  // 让 AI 提取关键词并基于内容构图
  return `A ${STYLE} The painting should depict a scene inspired by the following subject: ${article.title}. Visual hints: ${article.excerpt ? article.excerpt.slice(0, 150) : article.sub_category || article.category}. Atmosphere: ${article.sub_category || "classical Chinese"}. Do not include any text or characters in the painting.`;
}

function slugify(s) {
  return s.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 60);
}

async function generateOne(article) {
  if (progress[article.id]) {
    return { ok: true, skipped: true, url: progress[article.id] };
  }

  const prompt = buildPrompt(article);
  const seed = Math.abs(hashCode(article.id)) % 100000;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&seed=${seed}&nologo=true&model=flux`;
  const filename = `article_${slugify(article.id)}.jpg`;
  const outPath = join(COVERS_DIR, filename);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      writeFileSync(outPath, buffer);

      // 上传到 Supabase
      const upRes = await fetch(
        `${URL}/storage/v1/object/${BUCKET}/${filename}`,
        {
          method: "POST",
          headers: { ...HEADERS, "Content-Type": "image/jpeg", "x-upsert": "true" },
          body: buffer,
        }
      );
      if (!upRes.ok) throw new Error(`Upload ${upRes.status}`);

      const publicUrl = `${URL}/storage/v1/object/public/${BUCKET}/${filename}`;

      // 更新 DB
      const patchRes = await fetch(
        `${URL}/rest/v1/knowledge_articles?id=eq.${article.id}`,
        {
          method: "PATCH",
          headers: { ...HEADERS, Prefer: "return=minimal" },
          body: JSON.stringify({ cover_url: publicUrl }),
        }
      );
      if (!patchRes.ok) throw new Error(`DB PATCH ${patchRes.status}`);

      progress[article.id] = publicUrl;
      return { ok: true, url: publicUrl, size: buffer.length };
    } catch (e) {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 8000));
      } else {
        return { ok: false, error: e.message };
      }
    }
  }
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return h;
}

const startTime = Date.now();
let ok = 0, fail = 0, skip = 0;
for (let i = 0; i < articles.length; i++) {
  const a = articles[i];
  const r = await generateOne(a);
  if (r.ok && r.skipped) skip++;
  else if (r.ok) ok++;
  else fail++;

  // 每 5 张保存一次进度（断点续传）
  if ((i + 1) % 5 === 0) {
    writeFileSync(CACHE_FILE, JSON.stringify(progress, null, 2));
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const eta = ok > 0 ? (elapsed / ok * (articles.length - i - 1)).toFixed(0) : "?";
  process.stdout.write(`\r[${i + 1}/${articles.length}] ok=${ok} skip=${skip} fail=${fail} | ${elapsed}min | ETA ${eta}min`);

  // 间隔 4 秒避免 rate limit
  if (i < articles.length - 1) {
    await new Promise(r => setTimeout(r, 4000));
  }
}

writeFileSync(CACHE_FILE, JSON.stringify(progress, null, 2));
console.log(`\n\n✅ 完成: ok=${ok} skip=${skip} fail=${fail} | 用时 ${((Date.now() - startTime) / 1000 / 60).toFixed(1)}min`);
console.log(`进度已保存到 ${CACHE_FILE}`);
