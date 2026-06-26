/**
 * D2-regex - 纯正则内链 worker (不调 LLM)
 * 思路:
 *   1) 加载所有文章 id + title
 *   2) 对每篇文章 body, 用其他文章 title 作为锚点扫描
 *      - title 太短 (≤1 字) 跳过 (噪音大)
 *      - title 完全是常用词跳过 (如 "诗", "词")
 *      - 匹配数 > 0 且未在 related_articles 中 → 写入
 *   3) 跳过已有 related_articles 数 >= 5 的 (已饱和)
 *
 * 优势: 零 LLM 调用、零配额、跑完全量 1966 篇 ~5-10 分钟
 * 劣势: 漏掉"文中提到人名但没在库里建条目"的情况 (LLM 方案优势)
 *
 * 用法: node scripts/inline-link-regex.mjs [--limit=N] [--category=figures,poems]
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
const LIMIT = parseInt(args.limit || "99999", 10);
const CATS = args.category ? args.category.split(",") : null;
const PROGRESS = join(ROOT, "scripts", "inline-link-regex.log");
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  process.stdout.write(line + "\n");
  appendFileSync(PROGRESS, line + "\n");
};

// 排除的常见停用词 (单独出现频率太高, 噪音大)
const STOPWORDS = new Set([
  "诗", "词", "文", "书", "画", "歌", "舞", "茶", "酒", "梦", "魂", "古", "今", "美",
]);

async function loadIndex() {
  const all = [];
  let offset = 0;
  while (true) {
    const r = await fetch(
      `${URL}/rest/v1/knowledge_articles?select=id,title,category,sub_category&limit=1000&offset=${offset}`,
      { headers: H }
    );
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const d = await r.json();
    all.push(...d);
    if (d.length < 1000) break;
    offset += 1000;
  }
  log(`📚 加载 ${all.length} 篇文章作为锚点库`);
  if (all.length > 0) {
    log(`  示例: id=${all[0].id} title="${all[0].title}" cat=${all[0].category}`);
    log(`  示例: id=${all[1]?.id} title="${all[1]?.title}"`);
  }

  // 过滤噪音 title
  const valid = all.filter((a) => {
    const t = (a.title || "").trim();
    if (t.length < 2 || t.length > 30) return false;
    if (STOPWORDS.has(t)) return false;
    // 只过滤"纯 ASCII 数字+空白+标点"的标题 (中文是 \W, 不能误伤)
    if (/^[\d\s\.,;:!?'"()\-—_/\\]+$/.test(t)) return false;
    return true;
  });
  log(`🎯 有效锚点 ${valid.length} 个 (过滤 ${all.length - valid.length} 个噪音)`);
  return valid;
}

async function loadTargetArticle(id) {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?id=eq.${id}&select=id,title,body,related_articles`,
    { headers: H }
  );
  if (!r.ok) return null;
  const d = await r.json();
  return d[0] || null;
}

async function saveRelated(id, items) {
  const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${id}`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ related_articles: items }),
  });
  return r.ok;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  log(`🚀 D2-regex worker 启动, limit=${LIMIT}, cats=${CATS || "all"}`);
  const index = await loadIndex();

  // 选目标文章
  let all = [];
  let offset = 0;
  while (true) {
    let q = `${URL}/rest/v1/knowledge_articles?select=id,title,category&body=not.is.null&limit=500&offset=${offset}`;
    if (CATS) q += `&category=in.(${CATS.join(",")})`;
    const r = await fetch(q, { headers: H });
    if (!r.ok) break;
    const d = await r.json();
    all.push(...d);
    if (d.length < 500) break;
    offset += 500;
  }
  log(`🎯 目标 ${all.length} 篇, 处理上限 ${LIMIT}`);

  let processed = 0, total_added = 0, total_skipped = 0;
  const t0 = Date.now();

  for (const art of all.slice(0, LIMIT)) {
    processed++;
    const fullArt = await loadTargetArticle(art.id);
    if (!fullArt || !fullArt.body) continue;

    const body = fullArt.body;
    const existing = Array.isArray(fullArt.related_articles) ? fullArt.related_articles : [];
    const existingIds = new Set(existing.map((x) => (typeof x === "string" ? x : x.id)));

    // 已有 >= 5 个内链 → 跳过
    if (existing.length >= 5) {
      total_skipped++;
      continue;
    }

    // 候选 = 除自己外的全部 title
    const candidates = index.filter((c) => c.id !== art.id);

    const found = [];
    const seen = new Set();
    for (const c of candidates) {
      if (existingIds.has(c.id)) continue;
      if (seen.has(c.id)) continue;
      const re = new RegExp(escapeRegExp(c.title), "g");
      if (re.test(body)) {
        found.push({ id: c.id, name: c.title, role: "内链" });
        seen.add(c.id);
        if (found.length + existing.length >= 8) break; // 总数封顶
      }
    }

    if (found.length === 0) {
      if (processed % 20 === 0) {
        const elapsed = ((Date.now() - t0) / 1000 / 60).toFixed(1);
        const eta = ((Date.now() - t0) / processed * (LIMIT - processed) / 1000 / 60).toFixed(0);
        process.stdout.write(`\r[regex ${processed}/${Math.min(LIMIT, all.length)}] +${total_added} skip=${total_skipped} | ${elapsed}min | ETA ${eta}min`);
      }
      if (processed <= 5) log(`   [${processed}] ${art.id} ${art.title} 0 命中 (body 长度 ${body.length})`);
      continue;
    }

    const merged = [...existing, ...found];
    const ok = await saveRelated(art.id, merged);
    if (ok) {
      total_added += found.length;
      log(`✅ [${processed}/${LIMIT}] ${art.id} ${art.title} +${found.length} (e.g. ${found.slice(0, 3).map((x) => x.name).join(", ")})`);
    }

    if (processed % 20 === 0) {
      const elapsed = ((Date.now() - t0) / 1000 / 60).toFixed(1);
      const eta = ((Date.now() - t0) / processed * (LIMIT - processed) / 1000 / 60).toFixed(0);
      process.stdout.write(`\r[regex ${processed}/${Math.min(LIMIT, all.length)}] +${total_added} skip=${total_skipped} | ${elapsed}min | ETA ${eta}min`);
    }
  }
  log(`\n🎉 完成: 处理 ${processed} 篇, 新增内链 ${total_added}, 跳过(已饱和) ${total_skipped}, 用时 ${((Date.now() - t0) / 1000 / 60).toFixed(1)}min`);
}

main().catch((e) => { console.error("💥", e); process.exit(1); });
