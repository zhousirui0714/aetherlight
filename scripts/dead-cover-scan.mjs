/**
 * 死图扫描: 并发 fetch 1963 张 cover_url, 找出 404/超时/格式错误
 * 不修改数据, 只输出报告
 */
import { readFileSync, writeFileSync } from "node:fs";
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
  Prefer: "count=exact",
};
const URL = ENV.SUPABASE_URL + "/rest/v1";

const CONCURRENCY = 10;
const TIMEOUT_MS = 8000;
const PAGE = 500;

async function fetchAllArticles() {
  const all = [];
  let offset = 0;
  while (true) {
    const r = await fetch(`${URL}/knowledge_articles?select=id,title,cover_url&cover_url=not.is.null&limit=${PAGE}&offset=${offset}`, { headers: H });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const d = await r.json();
    all.push(...d);
    if (d.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

async function checkOne(url) {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const r = await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    const ms = Date.now() - start;
    return {
      status: r.status,
      ok: r.ok,
      size: r.headers.get("content-length"),
      type: r.headers.get("content-type"),
      ms,
    };
  } catch (e) {
    return { status: 0, ok: false, error: String(e).slice(0, 80), ms: Date.now() - start };
  }
}

async function main() {
  console.log("⏳ 加载所有 cover_url...");
  const arts = await fetchAllArticles();
  console.log(`   ${arts.length} 张待检查`);

  const report = {
    generatedAt: new Date().toISOString(),
    total: arts.length,
    ok: 0,
    dead: [],
    slow: [],
    byStatus: {},
  };

  let i = 0;
  const queue = [...arts];

  async function worker(id) {
    while (queue.length) {
      const art = queue.shift();
      if (!art) break;
      const result = await checkOne(art.cover_url);
      const code = String(result.status);
      report.byStatus[code] = (report.byStatus[code] || 0) + 1;
      if (result.ok) {
        report.ok++;
        if (result.ms > 3000) {
          report.slow.push({ id: art.id, title: art.title, url: art.cover_url, ms: result.ms });
        }
      } else {
        report.dead.push({
          id: art.id,
          title: art.title,
          url: art.cover_url,
          status: result.status,
          error: result.error,
        });
      }
      i++;
      if (i % 50 === 0) process.stdout.write(`\r  ${i}/${arts.length} (${report.ok} ok, ${report.dead.length} dead)`);
    }
  }

  console.log("⏳ 并发扫描 (并发 " + CONCURRENCY + ")...");
  const start = Date.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, k) => worker(k)));
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n✅ 完成: ${i}/${arts.length}  耗时 ${elapsed}s`);
  console.log(`📊 状态分布:`, report.byStatus);
  console.log(`💀 死图: ${report.dead.length} / ${arts.length}`);
  console.log(`🐌 慢图 (>3s): ${report.slow.length}`);

  const out = join(ROOT, "scripts", "dead-cover-report.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`\n报告: ${out}`);

  if (report.dead.length) {
    console.log("\n死图样例:");
    for (const d of report.dead.slice(0, 5)) {
      console.log(`  ${d.id}  ${d.title}  [${d.status}]  ${d.url}`);
    }
  }
}

main().catch((e) => { console.error("💥", e); process.exit(1); });
