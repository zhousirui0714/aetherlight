/**
 * Supabase 知识库 v3 自动同步脚本
 * - 应用 v3 migration (10 英文分类 + 新字段 + knowledge_relations)
 * - 上传 articles 到 knowledge_articles
 * - 上传 relations 到 knowledge_relations
 *
 * 运行: bun scripts/sync-supabase-v3.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const MIGRATION_FILE = join(ROOT, "supabase", "migrations", "20260624_knowledge_v3.sql");
const ARTICLES_FILE = join(ROOT, "backend", "data", "knowledge_articles_v3.json");
const RELATIONS_FILE = join(ROOT, "backend", "data", "knowledge_relations_v3.json");

function loadEnv(): Record<string, string> {
  const content = readFileSync(ENV_FILE, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) {
      env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const ENV = loadEnv();
const URL = ENV.SUPABASE_URL || ENV.VITE_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const PAT = ENV.SUPABASE_PAT;  // Personal Access Token
const PROJECT_REF = ENV.SUPABASE_PROJECT_REF || URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!URL || !KEY) {
  console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 缺失");
  process.exit(1);
}

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

// ============================================================
// Step 0: 应用 v3 migration (通过 Supabase Management API)
// ============================================================
async function applyMigration(): Promise<boolean> {
  if (!PAT || !PROJECT_REF) {
    console.log("⚠️  SUPABASE_PAT / PROJECT_REF 缺失，跳过 migration 自动应用");
    console.log("   请手动到 Supabase SQL Editor 执行:");
    console.log("   " + MIGRATION_FILE);
    return false;
  }

  const sql = readFileSync(MIGRATION_FILE, "utf-8");
  console.log(`📋 Step 0: 应用 v3 migration (${sql.length} 字节)...`);

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    console.log("   ✓ migration 已应用");
    return true;
  } else {
    const err = await res.text();
    console.error("   ✗ migration 失败:", err.slice(0, 500));
    return false;
  }
}

// ============================================================
// Step 1: 加载 v3 JSON
// ============================================================
function loadV3Data() {
  console.log("📊 Step 1: 加载 v3 数据...");
  const articles = JSON.parse(readFileSync(ARTICLES_FILE, "utf-8"));
  const relations = JSON.parse(readFileSync(RELATIONS_FILE, "utf-8"));
  console.log(`   articles: ${articles.length}, relations: ${relations.length}`);
  return { articles, relations };
}

// ============================================================
// Step 2: Upsert articles
// ============================================================
async function upsertArticles(articles: any[]): Promise<{ ok: number; failed: number }> {
  console.log(`\n📤 Step 2: Upsert ${articles.length} 条 articles...`);

  const rows = articles.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    sub_category: a.sub_category || "",
    excerpt: a.excerpt || "",
    body: a.body || "",
    body_extended: a.body_extended || "",
    cover: a.cover || "📜",
    cover_url: a.cover_url || null,
    source: a.source || "",
    author: a.author || "溯光编辑部",
    dynasty: a.dynasty || "",
    era: a.era || "",
    region: a.region || "",
    history: a.history || "",
    influence: a.influence || "",
    full_text: a.full_text || null,
    full_text_lang: a.full_text_lang || "classical",
    view_count: a.view_count || 0,
    sort_weight: a.sort_weight || 0,
    tags: a.tags || [],
    related_people: a.related_people || [],
    related_books: a.related_books || [],
    related_events: a.related_events || [],
    related_poems: a.related_poems || [],
    related_articles: a.related_articles || [],
    faq: a.faq || [],
  }));

  // 去重
  const seen = new Set<string>();
  const uniq = rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  console.log(`   去重后 ${uniq.length} 条`);

  const BATCH = 30;
  let ok = 0, failed = 0;
  for (let i = 0; i < uniq.length; i += BATCH) {
    const batch = uniq.slice(i, i + BATCH);
    const res = await fetch(`${URL}/rest/v1/knowledge_articles`, {
      method: "POST",
      headers: {
        ...HEADERS,
        Prefer: "return=minimal,resolution=merge-duplicates",
      },
      body: JSON.stringify(batch),
    });
    if (res.ok) {
      ok += batch.length;
      process.stdout.write(`\r   ✓ articles ${ok}/${uniq.length}`);
    } else {
      failed += batch.length;
      const text = await res.text();
      console.error(`\n   ✗ 批次 ${i} 失败: ${text.slice(0, 200)}`);
    }
  }
  console.log();
  return { ok, failed };
}

// ============================================================
// Step 3: Upsert relations
// ============================================================
async function upsertRelations(relations: any[]): Promise<{ ok: number; failed: number }> {
  console.log(`\n📤 Step 3: Upsert ${relations.length} 条 relations...`);

  const rows = relations.map((r) => ({
    from_article_id: r.from_id,
    to_article_id: r.to_id,
    relation_type: r.relation_type,
    weight: r.weight || 1,
    description: r.description || "",
  }));

  const BATCH = 30;
  let ok = 0, failed = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const res = await fetch(`${URL}/rest/v1/knowledge_relations`, {
      method: "POST",
      headers: {
        ...HEADERS,
        Prefer: "return=minimal,resolution=merge-duplicates",
      },
      body: JSON.stringify(batch),
    });
    if (res.ok) {
      ok += batch.length;
      process.stdout.write(`\r   ✓ relations ${ok}/${rows.length}`);
    } else {
      failed += batch.length;
      const text = await res.text();
      console.error(`\n   ✗ 批次 ${i} 失败: ${text.slice(0, 200)}`);
    }
  }
  console.log();
  return { ok, failed };
}

// ============================================================
// Step 4: 验证
// ============================================================
async function verify(): Promise<void> {
  console.log("\n📊 Step 4: 验证 DB 状态...");

  const articleCount = await fetch(`${URL}/rest/v1/knowledge_articles?select=id`, {
    method: "HEAD",
    headers: { ...HEADERS, Prefer: "count=exact" },
  });
  console.log("   articles DB 总数:", articleCount.headers.get("Content-Range"));

  const relationCount = await fetch(`${URL}/rest/v1/knowledge_relations?select=id`, {
    method: "HEAD",
    headers: { ...HEADERS, Prefer: "count=exact" },
  });
  console.log("   relations DB 总数:", relationCount.headers.get("Content-Range"));

  // 按 category 统计
  const allRes = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=category&limit=10000`,
    { headers: HEADERS }
  );
  if (allRes.ok) {
    const all = await allRes.json();
    const catCount: Record<string, number> = {};
    for (const r of all) {
      catCount[r.category] = (catCount[r.category] || 0) + 1;
    }
    console.log("\n   分类统计:");
    Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([c, n]) => console.log(`     ${c}: ${n}`));
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log("🚀 Supabase 知识库 v3 同步开始\n");

  await applyMigration();
  const { articles, relations } = loadV3Data();
  const artRes = await upsertArticles(articles);
  const relRes = await upsertRelations(relations);
  await verify();

  console.log(`\n🎉 同步完成！`);
  console.log(`   articles: 成功 ${artRes.ok}, 失败 ${artRes.failed}`);
  console.log(`   relations: 成功 ${relRes.ok}, 失败 ${relRes.failed}`);
}

main().catch((err) => {
  console.error("❌ 失败:", err);
  process.exit(1);
});
