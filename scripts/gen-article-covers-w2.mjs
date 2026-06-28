/**
 * Worker 2 - 处理 951-1902 文章（按热度排序后）
 * 与 Worker 1 共享 progress 文件（双 worker 不会冲突，因为 ID 段不同）
 *
 * 2026-06-28: 接入 lib/cover-prompt.mjs 的新 prompt 模板
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildPrompt } from "./lib/cover-prompt.mjs";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const CACHE_FILE = join(ROOT, "scripts", "covers-progress-w2.json");
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

const allArticles = [];
let offset = 0;
const PAGE = 500;
console.log("Worker2: 获取文章列表...");
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
console.log(`找到 ${allArticles.length} 篇`);

const START = 951; // worker2 从第 952 张开始
const articles = allArticles.slice(START);
console.log(`Worker2: 处理 ${articles.length} 篇 (从 index ${START} 开始)`);

let progress = {};
if (existsSync(CACHE_FILE)) {
  try {
    const raw = readFileSync(CACHE_FILE, "utf-8").trim();
    progress = raw ? JSON.parse(raw) : {};
    console.log(`已加载进度: ${Object.keys(progress).length} 张已完成`);
  } catch (e) {
    console.warn(`progress 文件损坏, 从空开始: ${e.message}`);
    progress = {};
  }
}

// 旧的 sumi-e STYLE 模板已废, 改用 lib/cover-prompt.mjs 的 buildPrompt

function slugify(s) {
  return s.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 60);
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return h;
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

      const patchRes = await fetch(
        `${URL}/rest/v1/knowledge_articles?id=eq.${article.id}`,
        {
          method: "PATCH",
          headers: { ...HEADERS, Prefer: "return=minimal" },
          body: JSON.stringify({ cover_url: publicUrl, cover_prompt: prompt, cover_checked_at: new Date().toISOString() }),
        }
      );
      if (!patchRes.ok) throw new Error(`DB PATCH ${patchRes.status}`);

      progress[article.id] = publicUrl;
      return { ok: true, url: publicUrl, size: buffer.length };
    } catch (e) {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 6000));
      } else {
        return { ok: false, error: e.message };
      }
    }
  }
}

const startTime = Date.now();
let ok = 0, fail = 0, skip = 0;
for (let i = 0; i < articles.length; i++) {
  const a = articles[i];
  const r = await generateOne(a);
  if (r.ok && r.skipped) skip++;
  else if (r.ok) ok++;
  else fail++;

  if ((i + 1) % 5 === 0) {
    writeFileSync(CACHE_FILE, JSON.stringify(progress, null, 2));
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const eta = ok > 0 ? (elapsed / ok * (articles.length - i - 1)).toFixed(0) : "?";
  process.stdout.write(`\r[W2 ${i + 1}/${articles.length}] ok=${ok} skip=${skip} fail=${fail} | ${elapsed}min | ETA ${eta}min`);

  if (i < articles.length - 1) {
    await new Promise(r => setTimeout(r, 4000));
  }
}

writeFileSync(CACHE_FILE, JSON.stringify(progress, null, 2));
console.log(`\n\n✅ Worker2 完成: ok=${ok} skip=${skip} fail=${fail} | 用时 ${((Date.now() - startTime) / 1000 / 60).toFixed(1)}min`);
