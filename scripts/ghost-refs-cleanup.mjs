/**
 * 清理 related_people / related_books / related_events 中的「幽灵 id」
 * 即数组里引用了 DB 中不存在的 article id
 * 直接 PATCH 删掉这些项
 */
import { readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = (() => {
  const env = {};
  for (const l of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !l.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
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
const PROGRESS = join(ROOT, "scripts", "ghost-cleanup.log");
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  process.stdout.write(line + "\n");
  appendFileSync(PROGRESS, line + "\n");
};

const FIELDS = ["related_people", "related_books", "related_events"];

async function fetchAllIds() {
  const ids = new Set();
  let offset = 0;
  while (true) {
    const r = await fetch(`${URL}/rest/v1/knowledge_articles?select=id&limit=1000&offset=${offset}`, { headers: H });
    if (!r.ok) break;
    const d = await r.json();
    for (const x of d) ids.add(x.id);
    if (d.length < 1000) break;
    offset += 1000;
  }
  return ids;
}

async function main() {
  log("🧹 幽灵引用清理 worker 启动");
  const allIds = await fetchAllIds();
  log(`📚 DB 共有 ${allIds.size} 个合法 id`);

  // 1) 拉所有文章的 related_* 字段
  let offset = 0;
  let totalFixed = 0;
  let totalArticles = 0;
  while (true) {
    const r = await fetch(
      `${URL}/rest/v1/knowledge_articles?select=id,title,related_people,related_books,related_events&limit=500&offset=${offset}`,
      { headers: H }
    );
    if (!r.ok) break;
    const arts = await r.json();
    for (const a of arts) {
      totalArticles++;
      const patch = {};
      let changed = false;
      for (const field of FIELDS) {
        const arr = a[field] || [];
        if (!Array.isArray(arr) || arr.length === 0) continue;
        const cleaned = arr.filter((x) => {
          const id = typeof x === "string" ? x : x?.id;
          return id && allIds.has(id);
        });
        if (cleaned.length !== arr.length) {
          patch[field] = cleaned;
          changed = true;
        }
      }
      if (changed) {
        const pr = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${a.id}`, {
          method: "PATCH",
          headers: H,
          body: JSON.stringify(patch),
        });
        if (pr.ok) totalFixed++;
        else log(`  ❌ PATCH ${a.id} ${pr.status}`);
      }
    }
    if (arts.length < 500) break;
    offset += 500;
    if (totalArticles % 1000 === 0) log(`⏳ 已扫 ${totalArticles}, 修复 ${totalFixed}`);
  }
  log(`🎉 完成: 扫描 ${totalArticles} 篇, 修复 ${totalFixed} 篇`);
}

main().catch((e) => { console.error("💥", e); process.exit(1); });
