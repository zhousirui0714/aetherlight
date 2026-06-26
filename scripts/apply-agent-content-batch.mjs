/**
 * apply-agent-content-batch.mjs
 * 把 agent 手动整理的内容草稿写入 DB
 * 标注 _ai_generated 字段, 便于人工审核
 *
 * 用法: node scripts/apply-agent-content-batch.mjs [--dry-run]
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

const PROGRESS = join(ROOT, "scripts", "apply-agent-content.log");
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  process.stdout.write(line + "\n");
  appendFileSync(PROGRESS, line + "\n");
};

async function main() {
  const items = JSON.parse(readFileSync(join(ROOT, "scripts/agent-content-batch.json"), "utf-8")).items;
  log(`🚀 apply-agent-content-batch 启动, ${items.length} 篇, dry-run=${DRY_RUN}`);

  for (const it of items) {
    const patch = {
      excerpt: it.excerpt,
      body: it.body_append,
      _ai_generated: true,
      _ai_generated_at: new Date().toISOString(),
    };
    if (it.history_append) {
      // 已有 history 则附加, 否则覆盖
      const get = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${it.id}&select=history`, { headers: H });
      const d = await get.json();
      const cur = d[0]?.history;
      patch.history = (cur ? cur + "\n\n" : "") + it.history_append;
    }

    if (DRY_RUN) {
      log(`  DRY ${it.id} ${it.title} | excerpt=${it.excerpt.length}字 body=${it.body_append.length}字 history_append=${(it.history_append || "").length}字`);
      continue;
    }
    const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${it.id}`, {
      method: "PATCH",
      headers: H,
      body: JSON.stringify(patch),
    });
    if (r.ok) {
      log(`✅ ${it.id} ${it.title} | +excerpt +body +history_append`);
    } else {
      const err = await r.text().catch(() => "");
      log(`❌ ${it.id} ${it.title} | ${r.status} ${err.slice(0, 200)}`);
    }
  }
  log(`\n🎉 完成 ${items.length} 篇`);
}

main().catch((e) => { console.error("💥", e); process.exit(1); });
