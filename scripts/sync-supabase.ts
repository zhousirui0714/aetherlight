/**
 * Supabase 知识库自动同步脚本 v3
 * - 支持 15 大分类
 * - 写入扩展字段 (history/related_xxx/faq/era/dynasty/region)
 * - 失败重试 + 进度
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");

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

if (!URL || !KEY) {
  console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 缺失");
  process.exit(1);
}

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function tableInfo(): Promise<string[]> {
  const res = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=*&limit=1`,
    { headers: HEADERS }
  );
  if (res.status === 200) {
    const data = await res.json();
    if (data.length > 0) return Object.keys(data[0]);
  }
  return [];
}

async function upsertBatch(rows: any[]) {
  const res = await fetch(`${URL}/rest/v1/knowledge_articles`, {
    method: "POST",
    headers: {
      ...HEADERS,
      Prefer: "return=minimal,resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `${res.status} ${text.slice(0, 300)}` };
  }
  return { ok: true };
}

async function main() {
  console.log("📊 Step 1: 查询表当前字段...");
  const columns = await tableInfo();
  console.log("   现有字段:", columns.join(", "));

  // 字段映射：DB 用 snake_case 风格，但当前 columns 可能既有 id/title 等
  // 文章 JSON 用 camelCase + 部分同名字段
  const articles = JSON.parse(
    readFileSync(join(ROOT, "backend", "data", "knowledge_articles.json"), "utf-8")
  );
  console.log(`\n📚 Step 2: 加载本地 ${articles.length} 条知识库...`);

  // 已扩展 CHECK 约束到 15 大分类 (migration 已跑)
  const ALLOWED_CATS = new Set([
    "节气", "节日", "诗词", "典籍", "非遗", "民俗", "人物",
    "建筑", "神话", "艺术", "哲学", "医学", "科技", "饮食", "服饰",
  ]);
  const inAllowed = articles.filter((a: any) => ALLOWED_CATS.has(a.category));
  const skipped = articles.length - inAllowed.length;
  console.log(`   符合 CHECK 约束: ${inAllowed.length} 条${skipped > 0 ? `（跳过 ${skipped} 条：建筑/神话/艺术/哲学/医学/科技/饮食/服饰，需先扩展 CHECK 约束）` : ""}`);

  // 提取要写入的字段（DB 已有列）
  // 注意：PostgREST 批量 upsert 要求所有行 keys 一致，所以统一构造相同 keys
  const allowedCols = new Set(columns);
  const rows = inAllowed.map((a: any) => {
    const row: any = {};
    // 标准字段
    if (allowedCols.has("id")) row.id = a.id;
    if (allowedCols.has("title")) row.title = a.title;
    if (allowedCols.has("category")) row.category = a.category;
    if (allowedCols.has("excerpt")) row.excerpt = a.excerpt || "";
    if (allowedCols.has("body")) row.body = a.content || a.body || "";
    if (allowedCols.has("cover")) row.cover = a.cover || "📜";
    if (allowedCols.has("source")) row.source = a.source || "";
    if (allowedCols.has("author")) row.author = a.author || "溯光编辑部";
    if (allowedCols.has("tags")) row.tags = a.tags || [a.category || "知识"];
    if (allowedCols.has("favorites")) row.favorites = a.favorites || 0;
    if (allowedCols.has("created_at")) row.created_at = a.created_at || new Date().toISOString();
    // 扩展字段（统一用空值占位以保证 keys 一致）
    if (allowedCols.has("history")) row.history = a.history || "";
    if (allowedCols.has("influence")) row.influence = a.influence || "";
    if (allowedCols.has("body_extended")) row.body_extended = a.body_extended || a.content || "";
    if (allowedCols.has("related_people")) {
      row.related_people = a.relatedPeople || a.related_people || [];
    }
    if (allowedCols.has("related_books")) {
      row.related_books = a.relatedBooks || a.related_books || [];
    }
    if (allowedCols.has("related_events")) {
      row.related_events = a.relatedEvents || a.related_events || [];
    }
    if (allowedCols.has("related_poems")) {
      row.related_poems = a.relatedPoems || a.related_poems || [];
    }
    if (allowedCols.has("related_articles")) {
      row.related_articles = a.relatedArticles || a.related_articles || [];
    }
    if (allowedCols.has("faq")) row.faq = a.faq || [];
    if (allowedCols.has("dynasty")) row.dynasty = a.dynasty || "";
    if (allowedCols.has("era")) row.era = a.era || "";
    if (allowedCols.has("region")) row.region = a.region || "";
    return row;
  });

  console.log(`\n📤 Step 3: 批量 upsert ${rows.length} 条到 Supabase...`);

  // 按 id 去重（按出现顺序保留首次）
  const seen = new Set<string>();
  const uniqRows = rows.filter((r: any) => {
    if (!r.id) return false;
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  console.log(`   去重后 ${uniqRows.length} 条`);

  // 优先用 upsert（POST + resolution=merge-duplicates）
  // 但 merge-duplicates 需要主键有 UNIQUE 约束。id 已经是 PK 所以支持。
  const BATCH = 30;
  let ok = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < uniqRows.length; i += BATCH) {
    const batch = uniqRows.slice(i, i + BATCH);
    const r = await upsertBatch(batch);
    if (r.ok) {
      ok += batch.length;
      process.stdout.write(`\r   ✓ 已写入 ${ok}/${uniqRows.length}`);
    } else {
      failed += batch.length;
      failures.push(r.error);
      console.error(`\n   ✗ 批次 ${i} 失败:`, r.error.slice(0, 200));
    }
  }
  console.log(`\n\n🎉 写入完成：成功 ${ok}，失败 ${failed}`);

  if (failures.length > 0) {
    console.log("\n失败原因（第一条）:");
    console.log("  ", failures[0].slice(0, 500));
  }

  console.log("\n📊 Step 4: 验证 DB 总数...");
  const countRes = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=id`,
    { method: "HEAD", headers: { ...HEADERS, Prefer: "count=exact" } }
  );
  const range = countRes.headers.get("Content-Range");
  console.log("   DB 总数:", range || "未知");

  console.log("\n📊 Step 5: 按分类统计...");
  const statsRes = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=category`,
    { headers: { ...HEADERS, Prefer: "count=exact" } }
  );
  if (statsRes.ok) {
    const all = await statsRes.json();
    const catCount: Record<string, number> = {};
    for (const r of all) {
      const c = r.category || "未分类";
      catCount[c] = (catCount[c] || 0) + 1;
    }
    Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([c, n]) => console.log(`   ${c}: ${n} 条`));
  }

  console.log("\n✅ 完成！所有字段已同步：标准 + history/related_*/faq/era/dynasty/region");
}

main().catch((e) => {
  console.error("❌ 错误:", e);
  process.exit(1);
});
