/**
 * Worker 3 - 专门补齐审计出的 缺封面 列表
 * 读取 scripts/audit-cover.json, 找出 status="❌ 缺封面" 的文章
 * 单独重新生成, 避免被 W1/W2 列表顺序干扰
 *
 * 用法: node scripts/gen-article-covers-w3.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const AUDIT_JSON = join(ROOT, "scripts", "audit-cover.json");
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
const URL = ENV.SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
mkdirSync(COVERS_DIR, { recursive: true });

if (!existsSync(AUDIT_JSON)) {
  console.error("❌ 请先运行: node scripts/cover-audit.mjs");
  process.exit(1);
}
const audit = JSON.parse(readFileSync(AUDIT_JSON, "utf-8"));
const targets = audit.records.filter((r) => r.status === "❌ 缺封面");
console.log(`🎯 命中无封面目标 ${targets.length} 篇`);

let progress = {};
if (existsSync(CACHE_FILE)) {
  progress = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
  console.log(`已加载进度: ${Object.keys(progress).length} 张已完成`);
}

const STYLE = `Traditional Chinese ink wash painting (shuimo), sumi-e brush technique, wet ink wash gradients with 5-7 shades of gray ink only, generous negative space (60% blank rice paper), no outlines, no color except one small vermillion red seal stamp at corner. STRICTLY NO TEXT, NO CHARACTERS, NO LETTERS, NO WRITING, NO CALLIGRAPHY, NO INSCRIPTIONS anywhere. Empty blank surfaces only. No modern elements, no frame, no border, no watermark, no signature, no captions, no labels, no titles, no annotations. Aspect ratio 4:3, museum quality, ultra high detail, masterpiece.`;

function buildPrompt(t) {
  return `A ${STYLE} The painting should depict a scene inspired by: ${t.title} (${t.category}). Visual hints based on category: ${t.category}. Do not include any text or characters.`;
}
function slugify(s) { return s.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 60); }
function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0; return h; }

async function genOne(t) {
  if (progress[t.id]) return { ok: true, skipped: true };
  const prompt = buildPrompt(t);
  const seed = Math.abs(hashCode(t.id)) % 100000;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&seed=${seed}&nologo=true&model=flux`;
  const filename = `article_${slugify(t.id)}.jpg`;
  const outPath = join(COVERS_DIR, filename);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 5000) throw new Error("图片过小");
      writeFileSync(outPath, buffer);
      // 上传 + DB
      const up = await fetch(`${URL}/storage/v1/object/${BUCKET}/${filename}`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "image/jpeg", "x-upsert": "true" },
        body: buffer,
      });
      if (up.ok) {
        const publicUrl = `${URL}/storage/v1/object/public/${BUCKET}/${filename}`;
        await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${t.id}`, {
          method: "PATCH",
          headers: { ...HEADERS, Prefer: "return=minimal" },
          body: JSON.stringify({ cover_url: publicUrl, cover_prompt: prompt, cover_checked_at: new Date().toISOString() }),
        });
        progress[t.id] = publicUrl;
      } else {
        progress[t.id] = `/ai-covers/${filename}`;
      }
      return { ok: true };
    } catch (e) {
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 6000));
      else return { ok: false, error: e.message };
    }
  }
}

let ok = 0, skip = 0, fail = 0;
const t0 = Date.now();
for (let i = 0; i < targets.length; i++) {
  const r = await genOne(targets[i]);
  if (r.ok && r.skipped) skip++;
  else if (r.ok) ok++;
  else fail++;
  if ((i + 1) % 2 === 0) writeFileSync(CACHE_FILE, JSON.stringify(progress, null, 2));
  const elapsed = ((Date.now() - t0) / 1000 / 60).toFixed(1);
  process.stdout.write(`\r[W3 ${i + 1}/${targets.length}] ok=${ok} skip=${skip} fail=${fail} | ${elapsed}min`);
  if (i < targets.length - 1) await new Promise(r => setTimeout(r, 4000));
}
writeFileSync(CACHE_FILE, JSON.stringify(progress, null, 2));
console.log(`\n\n✅ W3 完成: ok=${ok} skip=${skip} fail=${fail}`);
