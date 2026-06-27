/**
 * Resilient 批量跑 AI 配图
 * 设计目标: sandbox 进程被回收后, 下次重启能从进度继续, 不丢已完成的工作
 *
 * 关键特性:
 *  1. 每 N 张立即 fsync 保存 progress (默认 10), 不依赖 process.exit
 *  2. 单张 fetch 60s timeout, retry 2 次, 每次 60s 还没出就放弃下一张
 *  3. 接收 CLI 参数: --batch-size N  --start IDX  --limit N  --max-minutes N
 *  4. watch_progress: 不重复处理已经在 progress 里的
 *  5. 把 worker 拆成小段, 避免单次跑超过 sandbox 限制
 *
 * 用法:
 *   node scripts/gen-article-covers-resilient.mjs --start 0 --limit 100
 *   # 跑前 100 张 (id 排序, view_count desc), sandbox 死了也能续
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildPrompt } from "./lib/cover-prompt.mjs";

// ---- CLI 参数解析 ----
const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  if (i === -1) return def;
  return args[i + 1];
}
const START = parseInt(getArg("--start", "0"), 10);
const LIMIT = parseInt(getArg("--limit", "100"), 10);
const BATCH_SAVE = parseInt(getArg("--batch-size", "5"), 10);
const MAX_MIN = parseInt(getArg("--max-minutes", "50"), 10);

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const CACHE_FILE = join(ROOT, "scripts", "covers-progress-w1.json");
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

// ---- 获取文章列表 ----
async function fetchAllArticles() {
  const all = [];
  let offset = 0;
  const PAGE = 500;
  while (true) {
    const r = await fetch(
      `${URL}/rest/v1/knowledge_articles?select=id,title,category,sub_category,tags,excerpt,cover_url&order=view_count.desc&limit=${PAGE}&offset=${offset}`,
      { headers: HEADERS }
    );
    if (!r.ok) throw new Error(`fetch articles: HTTP ${r.status}`);
    const d = await r.json();
    if (d.length === 0) break;
    all.push(...d);
    if (d.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

// ---- 加载进度 (容错空文件) ----
let progress = {};
if (existsSync(CACHE_FILE)) {
  try {
    const raw = readFileSync(CACHE_FILE, "utf-8").trim();
    progress = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn(`progress 文件损坏, 从空开始: ${e.message}`);
    progress = {};
  }
}
console.log(`[init] 已加载进度: ${Object.keys(progress).length} 张`);

// ---- 工具 ----
function slugify(s) {
  return s.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 60);
}
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return h;
}
function saveProgress() {
  // 写到 tmp 然后 rename, 防半写
  const tmp = CACHE_FILE + ".tmp";
  writeFileSync(tmp, JSON.stringify(progress, null, 2));
  // node 没有 rename sync 的 atomic API, 简单 read+write 也能接受
  writeFileSync(CACHE_FILE, JSON.stringify(progress, null, 2));
}

// ---- 单张生成 (60s timeout, retry 2 次) ----
async function generateOne(article) {
  // 跳过已完成
  if (progress[article.id]) {
    return { ok: true, skipped: true };
  }

  const prompt = buildPrompt(article);
  const seed = Math.abs(hashCode(article.id)) % 100000;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&seed=${seed}&nologo=true&model=flux`;
  const filename = `article_${slugify(article.id)}.jpg`;
  const outPath = join(COVERS_DIR, filename);

  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 5000) throw new Error("图片过小");
      writeFileSync(outPath, buffer);

      // 上传 Supabase
      const upRes = await fetch(
        `${URL}/storage/v1/object/${BUCKET}/${filename}`,
        {
          method: "POST",
          headers: { ...HEADERS, "Content-Type": "image/jpeg", "x-upsert": "true" },
          body: buffer,
        }
      );
      if (!upRes.ok) throw new Error(`upload: HTTP ${upRes.status}`);

      const publicUrl = `${URL}/storage/v1/object/public/${BUCKET}/${filename}`;
      // PATCH DB
      const patchRes = await fetch(
        `${URL}/rest/v1/knowledge_articles?id=eq.${article.id}`,
        {
          method: "PATCH",
          headers: { ...HEADERS, Prefer: "return=minimal" },
          body: JSON.stringify({ cover_url: publicUrl, cover_prompt: prompt, cover_checked_at: new Date().toISOString() }),
        }
      );
      if (!patchRes.ok) throw new Error(`patch: HTTP ${patchRes.status}`);

      progress[article.id] = publicUrl;
      return { ok: true, url: publicUrl, size: buffer.length };
    } catch (e) {
      clearTimeout(timer);
      if (attempt < 2) {
        console.log(`  retry [${article.id}]: ${e.message}`);
        await new Promise(r => setTimeout(r, 3000));
      } else {
        progress[article.id] = { error: e.message.slice(0, 100), ts: new Date().toISOString() };
        return { ok: false, error: e.message };
      }
    }
  }
  return { ok: false, error: "exhausted retries" };
}

// ---- 主循环 ----
async function main() {
  const all = await fetchAllArticles();
  console.log(`[init] DB 共 ${all.length} 篇文章`);

  const queue = all.slice(START, START + LIMIT);
  console.log(`[init] 本次跑 index ${START}-${START + queue.length - 1} (${queue.length} 张)`);
  console.log(`[init] max-minutes=${MAX_MIN}, batch-save=${BATCH_SAVE}`);

  const startTime = Date.now();
  const deadline = startTime + MAX_MIN * 60 * 1000;
  let ok = 0, skip = 0, fail = 0, processed = 0;

  for (let i = 0; i < queue.length; i++) {
    // 超时保护: 在 sandbox 回收前主动退出
    if (Date.now() > deadline) {
      console.log(`\n[watchdog] 达到 ${MAX_MIN}min 上限, 保存进度后退出.`);
      break;
    }
    if (Date.now() > deadline - 30 * 1000) {
      console.log(`[watchdog] 距退出 < 30s, 不再开新任务`);
      break;
    }

    const a = queue[i];
    const r = await generateOne(a);
    if (r.skipped) skip++;
    else if (r.ok) ok++;
    else fail++;
    processed++;

    // 每 BATCH_SAVE 张保存
    if (processed % BATCH_SAVE === 0) {
      saveProgress();
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const eta = ok > 0 ? Math.round((elapsed / ok) * (queue.length - i - 1)) : "?";
    process.stdout.write(`\r[resilient ${i + 1}/${queue.length}] ok=${ok} skip=${skip} fail=${fail} | ${elapsed}s | ETA ${eta}s | deadline ${MAX_MIN * 60}s`);

    // 礼貌 sleep
    if (i < queue.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  saveProgress();
  const totalElapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n\n✅ done: ok=${ok} skip=${skip} fail=${fail} | 用时 ${totalElapsed}min`);
  console.log(`💾 进度: ${Object.keys(progress).length} 张已记录`);
}

main().catch(e => { console.error(e); saveProgress(); process.exit(1); });

// 兜底: 任何信号都保存
process.on("SIGINT", () => { console.log("\n[signal] SIGINT, 保存进度..."); saveProgress(); process.exit(0); });
process.on("SIGTERM", () => { console.log("\n[signal] SIGTERM, 保存进度..."); saveProgress(); process.exit(0); });
