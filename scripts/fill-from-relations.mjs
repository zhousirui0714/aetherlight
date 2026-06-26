/**
 * FILL-from-relations - 把 knowledge_relations 的 person_of / work_of / event_of / poem_of
 * 反向回填到 knowledge_articles.related_people / related_books / related_events / related_poems
 * 零 LLM 调用, 纯结构化整理
 *
 * 用法: node scripts/fill-from-relations.mjs [--dry-run]
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

const PROGRESS = join(ROOT, "scripts", "fill-from-relations.log");
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  process.stdout.write(line + "\n");
  appendFileSync(PROGRESS, line + "\n");
};

const TYPE_TO_FIELD = {
  person_of: "related_people",
  work_of: "related_books",
  event_of: "related_events",
  poem_of: "related_poems",
};

async function loadRelations() {
  const all = [];
  let offset = 0;
  while (true) {
    const r = await fetch(
      `${URL}/rest/v1/knowledge_relations?select=from_article_id,to_article_id,relation_type&limit=1000&offset=${offset}`,
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

async function loadArticles() {
  const all = [];
  let offset = 0;
  while (true) {
    const r = await fetch(
      `${URL}/rest/v1/knowledge_articles?select=id,title,related_people,related_books,related_events,related_poems&limit=1000&offset=${offset}`,
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

function pickId(item) {
  if (!item) return null;
  if (typeof item === "string") return item;
  return item.id || null;
}

async function saveField(id, field, value) {
  const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${id}`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ [field]: value }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    return { ok: false, status: r.status, err: err.slice(0, 150) };
  }
  return { ok: true };
}

async function main() {
  log(`🚀 FILL-from-relations worker 启动, dry-run=${DRY_RUN}`);

  const [relations, articles] = await Promise.all([loadRelations(), loadArticles()]);
  log(`📊 ${relations.length} 条 relations, ${articles.length} 篇文章`);

  // from -> Map<field, Set<id>>
  const fromMap = new Map();
  // 同时建 titleMap
  const titleMap = new Map();
  for (const a of articles) titleMap.set(a.id, a.title);

  for (const rel of relations) {
    const field = TYPE_TO_FIELD[rel.relation_type];
    if (!field) continue;
    if (!fromMap.has(rel.from_article_id)) fromMap.set(rel.from_article_id, {});
    const m = fromMap.get(rel.from_article_id);
    if (!m[field]) m[field] = new Set();
    m[field].add(rel.to_article_id);
  }

  log(`🎯 ${fromMap.size} 篇文章有待补 relations`);

  let totalUpdated = 0, totalAdded = 0;
  for (const [id, fields] of fromMap) {
    const updates = {};
    for (const [field, ids] of Object.entries(fields)) {
      const existing = articles.find((a) => a.id === id)?.[field];
      const existingIds = new Set(
        Array.isArray(existing) ? existing.map(pickId).filter(Boolean) : []
      );
      const newIds = [...ids].filter((tid) => !existingIds.has(tid));
      if (newIds.length === 0) continue;
      const merged = [
        ...(Array.isArray(existing) ? existing : []),
        ...newIds.map((tid) => ({ id: tid, name: titleMap.get(tid) || tid, role: "A3 反查" })),
      ];
      updates[field] = merged;
      totalAdded += newIds.length;
    }
    if (Object.keys(updates).length === 0) continue;

    if (DRY_RUN) {
      const fields = Object.keys(updates).join(",");
      log(`  DRY ${id} (${titleMap.get(id)}) ← ${fields}`);
      totalUpdated++;
    } else {
      for (const [field, val] of Object.entries(updates)) {
        const result = await saveField(id, field, val);
        if (result.ok) {
          totalUpdated++;
        } else {
          if (totalUpdated < 5) log(`  ❌ ${id}.${field} ${result.status} ${result.err}`);
        }
      }
    }
  }

  log(`\n🎉 完成: 更新 ${totalUpdated} 篇文章, 新增 ${totalAdded} 个 related_* 项`);
}

main().catch((e) => { console.error("💥", e); process.exit(1); });
