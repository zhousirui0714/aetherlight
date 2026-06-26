/**
 * Worker 4 - 回填已有封面的 cover_prompt
 * 从 buildPrompt 重建, 写入 DB 的 cover_prompt 字段
 * 用于审计一致性
 *
 * 用法: node scripts/gen-article-covers-w4-backfill-prompt.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const URL_ = null; // see loadEnv

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

const STYLE = `Traditional Chinese ink wash painting (shuimo), sumi-e brush technique, wet ink wash gradients with 5-7 shades of gray ink only, generous negative space (60% blank rice paper), no outlines, no color except one small vermillion red seal stamp at corner. STRICTLY NO TEXT, NO CHARACTERS, NO LETTERS, NO WRITING, NO CALLIGRAPHY, NO INSCRIPTIONS anywhere. Empty blank surfaces only. No modern elements, no frame, no border, no watermark, no signature, no captions, no labels, no titles, no annotations. Aspect ratio 4:3, museum quality, ultra high detail, masterpiece.`;

function buildPrompt(a) {
  return `A ${STYLE} The painting should depict a scene inspired by the following subject: ${a.title}. Visual hints: ${a.excerpt ? a.excerpt.slice(0, 150) : a.sub_category || a.category}. Atmosphere: ${a.sub_category || "classical Chinese"}. Do not include any text or characters in the painting.`;
}

// 拉所有有 cover_url 的文章
console.log("📊 拉取已有 cover_url 的文章...");
const all = [];
let offset = 0;
const PAGE = 500;
while (true) {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=id,title,excerpt,category,sub_category,cover_url,cover_prompt&not.is.null=cover_url&limit=${PAGE}&offset=${offset}`,
    { headers: HEADERS }
  );
  if (!r.ok) break;
  const d = await r.json();
  if (d.length === 0) break;
  all.push(...d);
  if (d.length < PAGE) break;
  offset += PAGE;
}
console.log(`✅ 找到 ${all.length} 篇有 cover_url`);

let ok = 0, skip = 0;
for (let i = 0; i < all.length; i++) {
  const a = all[i];
  if (a.cover_prompt && a.cover_prompt.length > 50) {
    skip++;
    continue;
  }
  const prompt = buildPrompt(a);
  const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${a.id}`, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify({ cover_prompt: prompt }),
  });
  if (r.ok) ok++;
  if ((i + 1) % 50 === 0) {
    process.stdout.write(`\r[W4 ${i + 1}/${all.length}] ok=${ok} skip=${skip}`);
  }
  // 不限速, 仅写 DB
}
console.log(`\n\n✅ W4 回填: ok=${ok} skip=${skip}`);
