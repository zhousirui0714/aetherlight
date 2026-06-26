/**
 * A3 - relations 深度补全 worker
 * - 给所有 83 篇人物 figures + 18 篇 mythology 推断缺失的人物关系
 * - 调 LLM 推断「老师/朋友/学生/影响」关系, 写入 knowledge_relations
 * - 慢任务: 每篇人物约 30-60s LLM 调用
 *
 * 用法: node scripts/expand-relations-worker.mjs [--limit=N] [--category=figures,mythology]
 */
import { readFileSync, appendFileSync, existsSync } from "node:fs";
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
const LIMIT = parseInt(args.limit || "100", 10);
const CATS = (args.category || "figures,mythology,classics").split(",");
const PROGRESS = join(ROOT, "scripts", "relations-expansion.log");
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  process.stdout.write(line + "\n");
  appendFileSync(PROGRESS, line + "\n");
};

const ALLOWED_RELATIONS = new Set(["teacher", "student", "friend", "influence", "family", "mentor", "rival", "colleague"]);

async function callLLM(article) {
  const prompt = `你是中华文化知识专家。基于以下人物/概念, 推断最多 5 个最关键的关联人物/书, 必须是真实历史人物或真实典籍。

# 主体
标题: ${article.title}
分类: ${article.category}
朝代: ${article.dynasty || "未知"}
摘要: ${(article.excerpt || "").slice(0, 300) || "(无)"}

# 已有信息
已知相关人物: ${(article.related_people || []).map((p) => p.name || p.id).join(", ") || "无"}
已知相关书: ${(article.related_books || []).map((b) => b.name || b.id).join(", ") || "无"}

# 输出 (严格 JSON, 不要 markdown)
{
  "relations": [
    { "target_title": "人物或书名 (标准中文, 如「李白」)", "relation_type": "teacher|student|friend|influence|family|mentor|rival|colleague", "weight": 0.5~1.0, "description": "一句话关系说明 (20字内)" }
  ]
}

要求:
- 0~5 个关系, 真实存在的
- target_title 用通用名, 不用生僻字
- relation_type 必须是枚举值
- 输出纯 JSON, 无 markdown`;

  const r = await fetch(`${BAILIAN_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BAILIAN_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });
  if (!r.ok) throw new Error(`LLM ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  const text = d.choices?.[0]?.message?.content || "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return [];
  const parsed = JSON.parse(m[0]);
  return Array.isArray(parsed.relations) ? parsed.relations : [];
}

async function findArticleByTitle(title) {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?title=ilike.*${encodeURIComponent(title)}*&select=id&limit=1`,
    { headers: H }
  );
  if (!r.ok) return null;
  const d = await r.json();
  return d[0]?.id || null;
}

async function relExists(from, to) {
  if (from === to) return true;
  const r = await fetch(
    `${URL}/rest/v1/knowledge_relations?from_article_id=eq.${from}&to_article_id=eq.${to}&select=id&limit=1`,
    { headers: H }
  );
  if (!r.ok) return false;
  const d = await r.json();
  return d.length > 0;
}

async function insertRelation(from, to, type, weight, desc) {
  const r = await fetch(`${URL}/rest/v1/knowledge_relations`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      from_article_id: from,
      to_article_id: to,
      relation_type: type,
      weight,
      description: desc,
    }),
  });
  return r.ok;
}

async function main() {
  log(`🚀 relations 补全 worker 启动, 目标 ${CATS.join("/")}, 上限 ${LIMIT}`);

  // 1) 加载全部目标文章
  const all = [];
  let offset = 0;
  while (true) {
    const catFilter = CATS.map((c) => `category.eq.${c}`).join(",");
    const r = await fetch(
      `${URL}/rest/v1/knowledge_articles?or=(${catFilter})&select=id,title,category,dynasty,excerpt,related_people,related_books&limit=200&offset=${offset}`,
      { headers: { ...H, Prefer: "count=exact" } }
    );
    if (!r.ok) break;
    const d = await r.json();
    all.push(...d);
    if (d.length < 200) break;
    offset += 200;
  }
  log(`📚 加载 ${all.length} 篇文章`);

  // 2) 跳过已有 ≥3 条关系的文章
  const needExpand = [];
  for (const a of all) {
    if ((a.related_people || []).length >= 3) continue;
    needExpand.push(a);
    if (needExpand.length >= LIMIT) break;
  }
  log(`🎯 待补全 ${needExpand.length} 篇`);

  let done = 0, added = 0, failed = 0;
  for (const a of needExpand) {
    try {
      const rels = await callLLM(a);
      if (rels.length === 0) {
        log(`⏭️  ${a.id} ${a.title} - LLM 返回空`);
        done++;
        continue;
      }
      for (const rel of rels) {
        if (!ALLOWED_RELATIONS.has(rel.relation_type)) continue;
        const targetId = await findArticleByTitle(rel.target_title);
        if (!targetId) {
          log(`  ❓ ${a.title} → ${rel.target_title} (DB 中找不到)`);
          continue;
        }
        if (await relExists(a.id, targetId)) {
          log(`  ⏭️  关系已存在 ${a.title} → ${rel.target_title}`);
          continue;
        }
        const ok = await insertRelation(a.id, targetId, rel.relation_type, rel.weight || 0.5, rel.description || "");
        if (ok) {
          log(`  ✅ ${a.title} -[${rel.relation_type}]-> ${rel.target_title}`);
          added++;
        } else {
          failed++;
        }
      }
      done++;
    } catch (e) {
      log(`💥 ${a.id} ${a.title} 失败: ${e.message?.slice(0, 100) || e}`);
      failed++;
    }
    // 节流
    await new Promise((r) => setTimeout(r, 200));
  }
  log(`🎉 完成: 处理 ${done}, 新增关系 ${added}, 失败 ${failed}`);
}

main().catch((e) => { console.error("💥", e); process.exit(1); });
