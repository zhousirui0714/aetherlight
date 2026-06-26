/**
 * D4-dedup-regex - 纯正则版重复 title 修复 (不调 LLM)
 * 思路:
 *   1) 找所有重复的 title
 *   2) 给重复组里第 2、3、... 篇加 " (一)" / " (二)" / ... 后缀
 *   3) 同时清掉前导空白 / 孤立间隔号等脏数据
 *
 * 优势: 零 LLM 调用、立即可跑
 * 劣势: 后缀可能不够优雅 (LLM 能生成语义化标题)
 *
 * 用法: node scripts/dedup-titles-regex.mjs [--dry-run]
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
const DRY_RUN = args["dry-run"] === "1" || args["dry-run"] === "true";

const PROGRESS = join(ROOT, "scripts", "dedup-titles-regex.log");
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  process.stdout.write(line + "\n");
  appendFileSync(PROGRESS, line + "\n");
};

const CHINESE_NUMS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十"];

function cleanTitle(t) {
  if (!t) return t;
  return t
    .replace(/^[\s·•・:：,，;；]+/, "")  // 前导空白/间隔号/标点
    .replace(/[\s·•・:：,，;；]+$/, "")  // 尾随
    .replace(/\s+/g, " ")                 // 多空白合一
    .trim();
}

async function main() {
  log(`🚀 D4-dedup-regex worker 启动, dry-run=${DRY_RUN}`);

  // 1) 拉所有文章的 id + title
  const all = [];
  let offset = 0;
  while (true) {
    const r = await fetch(
      `${URL}/rest/v1/knowledge_articles?select=id,title&limit=1000&offset=${offset}`,
      { headers: H }
    );
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const d = await r.json();
    all.push(...d);
    if (d.length < 1000) break;
    offset += 1000;
  }
  log(`📚 加载 ${all.length} 篇文章`);

  // 2) 找重复 title 组
  const title2ids = new Map();
  for (const a of all) {
    if (!a.title) continue;
    if (!title2ids.has(a.title)) title2ids.set(a.title, []);
    title2ids.get(a.title).push(a.id);
  }
  const dups = [...title2ids.entries()].filter(([_, ids]) => ids.length > 1);
  log(`🔍 找到 ${dups.length} 组重复 title`);

  // 3) 找脏 title（前导空白/间隔号/标点）
  const dirty = all.filter((a) => a.title && cleanTitle(a.title) !== a.title);
  log(`🧹 找到 ${dirty.length} 篇脏 title`);

  let totalChanged = 0;

  // 4) 修脏 title
  for (const a of dirty) {
    const cleaned = cleanTitle(a.title);
    if (!cleaned) continue;
    if (DRY_RUN) {
      log(`  DRY [脏] ${a.id} "${a.title}" → "${cleaned}"`);
    } else {
      const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${a.id}`, {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ title: cleaned }),
      });
      if (r.ok) {
        totalChanged++;
        if (totalChanged % 20 === 0) log(`  ... 已改 ${totalChanged}/${dirty.length} 脏 title`);
        log(`✅ [脏] ${a.id} "${a.title}" → "${cleaned}"`);
      } else {
        log(`❌ [脏] ${a.id} "${a.title}" ${r.status}`);
      }
    }
  }

  // 5) 修重复 title — 给第 2、3、... 篇加后缀
  // 注意: 脏 title 已修, 重新算重复
  const finalTitle2ids = new Map();
  for (const a of all) {
    const t = cleanTitle(a.title) || a.title;
    if (!t) continue;
    if (!finalTitle2ids.has(t)) finalTitle2ids.set(t, []);
    finalTitle2ids.get(t).push(a.id);
  }
  const finalDups = [...finalTitle2ids.entries()].filter(([_, ids]) => ids.length > 1);
  log(`🔍 修脏后剩余 ${finalDups.length} 组重复 title`);

  const CN = (n) => CHINESE_NUMS[n] || `${n}`;
  for (const [title, ids] of finalDups) {
    log(`  组 "${title}" 共 ${ids.length} 篇:`);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const newTitle = i === 0 ? title : `${title}（${CN(i)}）`;
      if (DRY_RUN) {
        log(`    DRY ${id} "${title}" → "${newTitle}"`);
      } else {
        const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${id}`, {
          method: "PATCH",
          headers: H,
          body: JSON.stringify({ title: newTitle }),
        });
        if (r.ok) {
          totalChanged++;
          log(`    ✅ ${id} → "${newTitle}"`);
        }
      }
    }
  }

  log(`\n🎉 完成: ${DRY_RUN ? "DRY" : ""} 共改 ${totalChanged} 篇文章, 修了 ${dirty.length} 个脏 title + ${finalDups.length} 组重复`);
}

main().catch((e) => { console.error("💥", e); process.exit(1); });
