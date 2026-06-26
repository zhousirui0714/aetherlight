/**
 * D2 - 正文智能内链 worker
 * 思路:
 *   1) 取所有 knowledge_articles (id, title, category)
 *   2) 给每篇文章 body 调 LLM, 提取文中出现的"其他可链接文章"
 *      (人名/书名/地名/概念), 输出 [{ anchor, target_id, target_title }]
 *   3) 写入 knowledge_articles.related_people (人物) / related_books (书)
 *   4) 失败 / LLM 限流时降级: 不写
 *
 * 用法: node scripts/inline-link-worker.mjs [--limit=N] [--category=figures,poems]
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
const BAILIAN_KEY = ENV.BAILIAN_API_KEY;
const BAILIAN_URL = ENV.BAILIAN_BASE_URL;
const MODEL = ENV.BAILIAN_MODEL || "qwen-plus";

const args = Object.fromEntries(process.argv.slice(2).map((s) => s.replace(/^--/, "").split("=")));
const LIMIT = parseInt(args.limit || "200", 10);
const CATS = args.category ? args.category.split(",") : null;
const PROGRESS = join(ROOT, "scripts", "inline-link.log");
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  process.stdout.write(line + "\n");
  appendFileSync(PROGRESS, line + "\n");
};

// 内存索引
const ID2TITLE = new Map();
const TITLE2ID = new Map();

async function loadIndex() {
  let offset = 0;
  while (true) {
    const r = await fetch(
      `${URL}/rest/v1/knowledge_articles?select=id,title,category&limit=1000&offset=${offset}`,
      { headers: H }
    );
    if (!r.ok) break;
    const d = await r.json();
    for (const a of d) {
      ID2TITLE.set(a.id, a.title);
      if (a.title) TITLE2ID.set(a.title, a.id);
    }
    if (d.length < 1000) break;
    offset += 1000;
  }
  log(`📚 索引 ${ID2TITLE.size} 篇文章`);
}

async function callLLM(article, candidates) {
  // candidates: [{ id, title, category }] 取前 200 个最相关候选
  const candText = candidates
    .map((c, i) => `${i + 1}. [${c.category}] ${c.title} (id: ${c.id})`)
    .join("\n");

  const prompt = `你是中华文化知识图谱助手。阅读以下文章正文, 提取正文中**明确提到**的「其他可链接文章」(人物/书/典籍/节日/概念/地名)。只输出在给定候选列表里能匹配到的项。

# 当前文章
标题: ${article.title}
分类: ${article.category}
正文片段: ${(article.body || "").slice(0, 1500)}

# 候选链接 (最多 200 个, 来自溯光知识库)
${candText}

# 输出 (严格 JSON, 无 markdown)
{
  "people": [ { "anchor": "文中出现的文字", "target_id": "id", "target_title": "标准名" } ],
  "books":  [ { "anchor": "...", "target_id": "...", "target_title": "..." } ],
  "events": [ { "anchor": "...", "target_id": "...", "target_title": "..." } ]
}

要求:
- 只输出正文中**真实出现**的 (anchor 必须是文章原文中能找到的 2-8 字)
- target_id 必须是候选列表中的 id
- 最多 5 个/类
- 没找到的类返回空数组`;

  const r = await fetch(`${BAILIAN_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${BAILIAN_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
    }),
  });
  if (!r.ok) throw new Error(`LLM ${r.status}`);
  const d = await r.json();
  const text = d.choices?.[0]?.message?.content || "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

async function loadArticle(id) {
  const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${id}&select=id,title,category,body,related_people,related_books,related_events`, { headers: H });
  if (!r.ok) return null;
  const d = await r.json();
  return d[0] || null;
}

async function mergeAndSave(id, kind, items) {
  if (!items || items.length === 0) return 0;
  const article = await loadArticle(id);
  if (!article) return 0;
  const existing = article[kind] || [];
  const existingIds = new Set(existing.map((x) => (typeof x === "string" ? x : x.id)));
  let added = 0;
  for (const it of items) {
    const tid = it.target_id;
    if (!tid || !ID2TITLE.has(tid)) continue;
    if (existingIds.has(tid)) continue;
    existing.push({
      id: tid,
      name: ID2TITLE.get(tid) || it.target_title,
      role: "内链",
    });
    existingIds.add(tid);
    added++;
  }
  if (added === 0) return 0;
  const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${id}`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ [kind]: existing }),
  });
  return r.ok ? added : 0;
}

async function main() {
  log(`🚀 智能内链 worker 启动, limit=${LIMIT}, cats=${CATS || "all"}`);

  await loadIndex();

  // 1) 选目标文章
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
  log(`🎯 候选 ${all.length} 篇, 限制 ${LIMIT}`);

  let i = 0, total_added = 0;
  for (const art of all.slice(0, LIMIT)) {
    i++;
    // 取候选: 同分类 + 标题包含的关键词
    const candidates = [];
    const titleKw = (art.title || "").slice(0, 2);
    for (const [id, title] of ID2TITLE) {
      if (id === art.id) continue;
      if (title.includes(titleKw) || candidates.length < 200) {
        candidates.push({ id, title, category: "" });
      }
      if (candidates.length >= 200) break;
    }

    try {
      const parsed = await callLLM(art, candidates);
      if (!parsed) {
        log(`⏭️  [${i}/${LIMIT}] ${art.id} ${art.title} - LLM 无输出`);
        continue;
      }
      const addP = await mergeAndSave(art.id, "related_people", parsed.people || []);
      const addB = await mergeAndSave(art.id, "related_books", parsed.books || []);
      const addE = await mergeAndSave(art.id, "related_events", parsed.events || []);
      const added = addP + addB + addE;
      total_added += added;
      if (added > 0) {
        log(`✅ [${i}/${LIMIT}] ${art.id} ${art.title} +${added} (people ${addP} | books ${addB} | events ${addE})`);
      } else {
        log(`   [${i}/${LIMIT}] ${art.id} ${art.title} 无新增`);
      }
    } catch (e) {
      log(`💥 [${i}/${LIMIT}] ${art.id} ${art.title} ${String(e).slice(0, 100)}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  log(`🎉 完成: 扫描 ${i} 篇, 总新增内链 ${total_added}`);
}

main().catch((e) => { console.error("💥", e); process.exit(1); });
