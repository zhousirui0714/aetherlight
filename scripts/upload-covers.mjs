/**
 * 批量上传水墨风 AI 插图到 Supabase Storage
 * + 给每篇 knowledge_article 分配一张 cover
 *
 * 流程:
 *   1. 上传 public/ai-covers/*.jpg 到 bucket `covers/`
 *   2. 构建 {category: [url, ...]} 映射
 *   3. 给每篇文章按 category 分配一张 cover，写入 cover_url
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");

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

if (!URL || !KEY) {
  console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 缺失");
  process.exit(1);
}

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const COVERS_DIR = join(ROOT, "public", "ai-covers");
const BUCKET = "covers";

// 1. 列出所有 jpg
const files = readdirSync(COVERS_DIR).filter(f => f.endsWith(".jpg"));
console.log(`找到 ${files.length} 张待上传图\n`);

// 2. 解析 {category: [filename, ...]}
const byCategory = {};
for (const f of files) {
  // 文件名格式: {cat}_{slug}_s{seed}.jpg
  const m = f.match(/^([a-z]+)_/);
  if (m) {
    const cat = m[1];
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(f);
  }
}
console.log("按分类统计:", Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length])));

// 3. 上传到 Supabase Storage (public bucket)
async function ensureBucket() {
  // 列出 buckets
  const r = await fetch(`${URL}/storage/v1/bucket`, { headers: HEADERS });
  const buckets = await r.json();
  if (!buckets.find(b => b.name === BUCKET)) {
    console.log(`创建 bucket: ${BUCKET}`);
    const create = await fetch(`${URL}/storage/v1/bucket`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        name: BUCKET,
        public: true,
        file_size_limit: 10485760, // 10MB
        allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
      }),
    });
    if (!create.ok) {
      const t = await create.text();
      throw new Error(`Bucket 创建失败: ${create.status} ${t}`);
    }
  } else {
    console.log(`Bucket ${BUCKET} 已存在`);
  }
}

async function uploadFile(filename) {
  const data = readFileSync(join(COVERS_DIR, filename));
  const r = await fetch(
    `${URL}/storage/v1/object/${BUCKET}/${filename}`,
    {
      method: "POST",
      headers: {
        ...HEADERS,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: data,
    }
  );
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`上传失败 ${filename}: ${r.status} ${t}`);
  }
}

async function getPublicUrl(filename) {
  return `${URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function main() {
  await ensureBucket();

  console.log("\n开始上传...");
  let ok = 0;
  for (const f of files) {
    try {
      await uploadFile(f);
      ok++;
      process.stdout.write(`\r[${ok}/${files.length}] 上传中...`);
    } catch (e) {
      console.log(`\nFAIL ${f}: ${e.message}`);
    }
  }
  console.log(`\n上传完成: ${ok}/${files.length}`);

  // 4. 给每篇文章分配 cover
  console.log("\n开始分配 cover_url 到 knowledge_articles...");

  // 4.1 获取所有文章 (id, title, category)
  const artRes = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=id,category&limit=1000`,
    { headers: HEADERS }
  );
  const articles = await artRes.json();
  console.log(`找到 ${articles.length} 篇文章`);

  // 4.2 构建 {category: [url, ...]} 公开 URL
  const urlByCat = {};
  for (const [cat, list] of Object.entries(byCategory)) {
    urlByCat[cat] = await Promise.all(list.map(getPublicUrl));
  }
  console.log("URL 映射:", Object.fromEntries(Object.entries(urlByCat).map(([k, v]) => [k, v.length])));

  // 4.3 按 category 分桶（DB 直接用英文 key: figures/poems/classics/festivals/...）
  const buckets = {};
  for (const a of articles) {
    const key = a.category;
    if (key && urlByCat[key]) {
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(a.id);
    } else if (key) {
      if (!buckets.__unmatched) buckets.__unmatched = [];
      buckets.__unmatched.push({ id: a.id, category: key });
    }
  }
  console.log("\n文章按分类:", Object.fromEntries(Object.entries(buckets).filter(([k]) => k !== "__unmatched").map(([k, v]) => [k, v.length])));
  if (buckets.__unmatched) console.log(`未匹配 category: ${buckets.__unmatched.length} (示例: ${JSON.stringify(buckets.__unmatched.slice(0, 3))})`);

  // 4.4 循环分配（每张图被分配 N 次，轮询）
  const updates = [];
  for (const [cat, ids] of Object.entries(buckets)) {
    const urls = urlByCat[cat];
    if (!urls || urls.length === 0) continue;
    ids.forEach((id, i) => {
      const url = urls[i % urls.length];
      updates.push({ id, cover_url: url });
    });
  }
  console.log(`准备更新 ${updates.length} 篇文章`);

  // 4.5 批量 PATCH (每次 50 条)
  const BATCH = 50;
  let updated = 0;
  for (let i = 0; i < updates.length; i += BATCH) {
    const slice = updates.slice(i, i + BATCH);
    // 并发更新 (用 Promise.all + single update each)
    await Promise.all(slice.map(async (u) => {
      const r = await fetch(
        `${URL}/rest/v1/knowledge_articles?id=eq.${u.id}`,
        {
          method: "PATCH",
          headers: { ...HEADERS, Prefer: "return=minimal" },
          body: JSON.stringify({ cover_url: u.cover_url }),
        }
      );
      if (r.ok) updated++;
    }));
    process.stdout.write(`\r[${Math.min(i + BATCH, updates.length)}/${updates.length}] 已更新`);
  }
  console.log(`\n\n✅ 完成: ${updated} 篇文章已分配 cover_url`);
}

main().catch(e => {
  console.error("❌", e);
  process.exit(1);
});
