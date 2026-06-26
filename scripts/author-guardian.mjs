/**
 * 后台守护：每 60s 扫一次 DB，发现含"溯光/编辑部"的 author 记录自动清空
 * 防止 W1/W2 / FILL worker 写回占位符 author
 */
import { readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = (() => {
  const env = {};
  for (const line of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
})();
const HEADERS = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

const LOG = join(ROOT, "scripts", "author-guardian.log");
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try { appendFileSync(LOG, line); } catch {}
};

const INTERVAL = 60_000; // 60s

async function scan() {
  const all = [];
  let offset = 0;
  while (true) {
    const r = await fetch(
      `${ENV.SUPABASE_URL}/rest/v1/knowledge_articles?or=(author.ilike.*溯光*,author.ilike.*编辑部*,author.ilike.*蜀光*,author.ilike.*水墨编辑部*)&select=id,title,author&limit=200&offset=${offset}`,
      { headers: HEADERS }
    );
    if (!r.ok) {
      log(`scan HTTP ${r.status}`);
      break;
    }
    const d = await r.json();
    if (d.length === 0) break;
    all.push(...d);
    if (d.length < 200) break;
    offset += 200;
  }
  return all;
}

async function purge(ids) {
  if (ids.length === 0) return 0;
  const BATCH = 50;
  let ok = 0;
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const inList = chunk.map((x) => `"${x}"`).join(",");
    const r = await fetch(
      `${ENV.SUPABASE_URL}/rest/v1/knowledge_articles?id=in.(${inList})`,
      {
        method: "PATCH",
        headers: HEADERS,
        body: JSON.stringify({ author: "" }),
      }
    );
    if (r.ok) ok += chunk.length;
    else log(`  patch ${i}-${i + BATCH} HTTP ${r.status}: ${(await r.text()).slice(0, 100)}`);
  }
  return ok;
}

let cycles = 0;

async function tick() {
  cycles++;
  try {
    const hits = await scan();
    if (hits.length === 0) {
      if (cycles % 10 === 0) log(`#${cycles} 干净 ✓`);
      return;
    }
    log(`#${cycles} 命中 ${hits.length} 条, 开始清理`);
    for (const h of hits.slice(0, 5)) log(`  - ${h.id} ${h.title} → "${h.author}"`);
    if (hits.length > 5) log(`  ... 还有 ${hits.length - 5} 条`);
    const cleared = await purge(hits.map((h) => h.id));
    log(`  → 清理 ${cleared} 条`);
  } catch (e) {
    log(`error: ${e}`);
  }
}

log(`guardian 启动, 间隔 ${INTERVAL / 1000}s`);
tick();
setInterval(tick, INTERVAL);

process.on("SIGINT", () => { log("guardian 收到 SIGINT, 退出"); process.exit(0); });
process.on("SIGTERM", () => { log("guardian 收到 SIGTERM, 退出"); process.exit(0); });
