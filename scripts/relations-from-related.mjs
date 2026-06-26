/**
 * A3-from-related - 把已存在的 related_* 字段转成 knowledge_relations 行
 * 零 LLM 调用, 纯结构化整理
 *
 * 输入: knowledge_articles.related_articles / related_people / related_books / related_events
 * 输出: knowledge_relations 行 (去重)
 *
 * 用法: node scripts/relations-from-related.mjs [--dry-run]
 */
import { readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = (() => {
  const env = {};
  for (const l of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !l.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return env;
})();
const H = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};
const URL = ENV.SUPABASE_URL;

const args = Object.fromEntries(process.argv.slice(2).map((s) => s.replace(/^--/, "").split("=")));
const DRY_RUN = args["dry-run"] !== undefined;

const PROGRESS = join(ROOT, "scripts", "relations-from-related.log");
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  process.stdout.write(line + "\n");
  appendFileSync(PROGRESS, line + "\n");
};

// 关系类型映射
const FIELD_TO_TYPE = {
  related_articles: "related",
  related_people: "person_of",
  related_books: "work_of",
  related_events: "event_of",
  related_poems: "poem_of",
};

function pickId(item) {
  if (!item) return null;
  if (typeof item === "string") return item;
  return item.id || null;
}

async function loadAllArticles() {
  const all = [];
  let offset = 0;
  while (true) {
    const r = await fetch(
      `${URL}/rest/v1/knowledge_articles?select=id,related_articles,related_people,related_books,related_events,related_poems&limit=1000&offset=${offset}`,
      { headers: H }
    );
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const d = await r.json();
    all.push(...d);
    if (d.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function loadExistingRelations() {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_relations?select=from_article_id,to_article_id,relation_type&limit=10000`,
    { headers: H }
  );
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const d = await r.json();
  const set = new Set();
  for (const x of d) set.add(`${x.from_article_id}|${x.to_article_id}|${x.relation_type}`);
  return set;
}

async function insertRelation(from, to, type, weight = 0.5, description = "") {
  const r = await fetch(`${URL}/rest/v1/knowledge_relations`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      from_article_id: from,
      to_article_id: to,
      relation_type: type,
      weight,
      description,
    }),
  });
  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    return { ok: false, status: r.status, err: errText.slice(0, 200) };
  }
  return { ok: true };
}

async function main() {
  log(`🚀 A3-from-related worker 启动, dry-run=${DRY_RUN}`);

  const articles = await loadAllArticles();
  log(`📚 加载 ${articles.length} 篇文章`);

  const existing = await loadExistingRelations();
  log(`📊 已有 ${existing.size} 条 relations`);

  let toInsert = [];
  for (const a of articles) {
    for (const [field, type] of Object.entries(FIELD_TO_TYPE)) {
      const arr = a[field];
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        const targetId = pickId(item);
        if (!targetId || targetId === a.id) continue;
        const key = `${a.id}|${targetId}|${type}`;
        if (existing.has(key)) continue;
        const desc = typeof item === "string" ? "" : (item.role || item.relation || "");
        toInsert.push({ from: a.id, to: targetId, type, desc });
      }
    }
  }

  log(`🎯 待新增 ${toInsert.length} 条 relations`);

  if (DRY_RUN) {
    log("🔍 DRY RUN 模式, 不写 DB");
    for (const x of toInsert.slice(0, 20)) {
      log(`  ${x.from} --[${x.type}]--> ${x.to} (${x.desc})`);
    }
    if (toInsert.length > 20) log(`  ... 还有 ${toInsert.length - 20} 条`);
    return;
  }

  let ok = 0, fail = 0;
  for (let i = 0; i < toInsert.length; i++) {
    const r = toInsert[i];
    const result = await insertRelation(r.from, r.to, r.type, 1, r.desc);
    if (result.ok) ok++;
    else {
      fail++;
      if (fail <= 3) log(`  ❌ [${i}] ${r.from}--[${r.type}]-->${r.to} : ${result.status} ${result.err}`);
    }
    if ((i + 1) % 50 === 0) {
      log(`  ... 进度 ${i + 1}/${toInsert.length} ok=${ok} fail=${fail}`);
    }
  }
  log(`\n🎉 完成: 插入 ${ok} 条, 失败 ${fail} 条`);
}

main().catch((e) => { console.error("💥", e); process.exit(1); });
