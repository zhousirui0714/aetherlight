/**
 * 跑 10 张 sample 验证新 prompt
 * 覆盖: 人物/节日/建筑/典籍/诗词/神话 各 1-2 张
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildPrompt } from "./lib/cover-prompt.mjs";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const COVERS_DIR = join(ROOT, "public", "ai-covers");

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
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}` };

mkdirSync(COVERS_DIR, { recursive: true });

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return h;
}

async function generateOne(article) {
  const prompt = buildPrompt(article);
  const seed = Math.abs(hashCode(article.id)) % 100000;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&seed=${seed}&nologo=true&model=flux`;
  const filename = `sample_v2_${article.id}.jpg`;
  const outPath = join(COVERS_DIR, filename);

  for (let attempt = 1; attempt <= 2; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 60000);
    try {
      const res = await fetch(imageUrl, { signal: ctl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) throw new Error("too small");
      writeFileSync(outPath, buf);
      return { ok: true, path: outPath, size: buf.length, prompt };
    } catch (e) {
      clearTimeout(timer);
      if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
      else return { ok: false, error: e.message, prompt };
    }
  }
}

const SAMPLE_IDS = [
  "libai",        // 人物
  "dufu",         // 人物
  "kongzi",       // 人物
  "chunjie",      // 节日
  "gugong",       // 建筑
  "jiangjinjiu",  // 诗词
  "zaofabaidicheng", // 诗词
  "lunyu",        // 典籍
  "hongloumeng",  // 典籍
  "tangsancai",   // 器物
];

async function main() {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=id,title,category,sub_category,excerpt&id=in.(${SAMPLE_IDS.join(",")})`,
    { headers: HEADERS }
  );
  const articles = await r.json();
  console.log(`找到 ${articles.length} 篇文章\n`);

  for (const a of articles) {
    process.stdout.write(`[${a.id}] ${a.title} ... `);
    const res = await generateOne(a);
    if (res.ok) {
      console.log(`✅ ${(res.size / 1024).toFixed(0)}KB → ${res.path.split("/").pop()}`);
    } else {
      console.log(`❌ ${res.error}`);
    }
  }
  console.log("\n完成。看 public/ai-covers/sample_v2_*.jpg");
}

main().catch(e => { console.error(e); process.exit(1); });
