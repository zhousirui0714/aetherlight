/**
 * 数据质量扫描器 - 不修改任何数据，只输出报告
 * 1) category 异常值: 既非 9 标准类, 也非 NULL
 * 2) orphan relations: source/target 指向不存在的 article
 * 3) 相关性引用断裂: related_people/books/events 里有 id 但 DB 中不存在
 * 4) view_count 全 0 统计
 * 5) 无效 cover_url 格式
 * 6) 重复 title
 * 7) 字段长度异常 (title<2字 或 >50字, body<10字)
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

const STD_CAT = new Set([
  "figures", "poems", "classics", "festivals", "philosophy",
  "intangible", "artifacts", "lifestyle", "mythology", "architecture",
  "technology", "art", "music", "clothing", "geography", "education",
  "cuisine", "medicine",
]);

const report = {
  generatedAt: new Date().toISOString(),
  totalArticles: 0,
  category: { distribution: {}, unknown: [], nullCount: 0 },
  relations: { total: 0, orphan: [] },
  relatedRefs: { brokenPeople: 0, brokenBooks: 0, brokenEvents: 0, samples: [] },
  viewCount: { zeroCount: 0, topByView: [] },
  coverUrl: { malformed: [], total: 0 },
  duplicates: { byTitle: [] },
  length: { shortTitle: [], longTitle: [], shortBody: [] },
};

async function fetchAll(path, select = "id") {
  const all = [];
  let offset = 0;
  while (true) {
    const r = await fetch(`${URL}${path}&limit=1000&offset=${offset}`, { headers: H });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const d = await r.json();
    all.push(...d);
    if (d.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function main() {
  console.log("⏳ 1) 加载全部文章 (1966 条)...");
  const articles = await fetchAll(
    "/knowledge_articles?select=id,title,category,view_count,cover_url,body,related_people,related_books,related_events,created_at",
    "id"
  );
  report.totalArticles = articles.length;
  const idSet = new Set(articles.map((a) => a.id));
  console.log(`   ${articles.length} 条`);

  console.log("⏳ 2) 分类分布 + 异常值...");
  for (const a of articles) {
    const c = a.category;
    if (c == null) {
      report.category.nullCount++;
      continue;
    }
    if (!STD_CAT.has(c)) {
      report.category.unknown.push({ id: a.id, title: a.title, cat: c });
    } else {
      report.category.distribution[c] = (report.category.distribution[c] || 0) + 1;
    }
  }
  console.log(`   9 标准类合计 ${Object.values(report.category.distribution).reduce((a, b) => a + b, 0)}, 异常 ${report.category.unknown.length}, NULL ${report.category.nullCount}`);

  console.log("⏳ 3) 加载 relations (预计 120 条)...");
  const relations = await fetchAll("/knowledge_relations?select=id,from_article_id,to_article_id,relation_type,description", "id");
  report.relations.total = relations.length;
  for (const r of relations) {
    if (!idSet.has(r.from_article_id) || !idSet.has(r.to_article_id)) {
      report.relations.orphan.push({
        id: r.id, type: r.relation_type, from: r.from_article_id, to: r.to_article_id,
        missing: !idSet.has(r.from_article_id) ? "from" : "to",
      });
    }
  }
  console.log(`   ${relations.length} 条, orphan ${report.relations.orphan.length}`);

  console.log("⏳ 4) related_people/books/events 引用断裂...");
  let bp = 0, bb = 0, be = 0;
  for (const a of articles) {
    const rp = a.related_people || [];
    for (const x of rp) {
      const targetId = typeof x === "string" ? x : x.id;
      if (targetId && !idSet.has(targetId)) {
        bp++;
        if (report.relatedRefs.samples.length < 10) {
          report.relatedRefs.samples.push({ article: a.id, kind: "people", missing: targetId });
        }
      }
    }
    const rb = a.related_books || [];
    for (const x of rb) {
      const targetId = typeof x === "string" ? x : x.id;
      if (targetId && !idSet.has(targetId)) {
        bb++;
        if (report.relatedRefs.samples.length < 10) {
          report.relatedRefs.samples.push({ article: a.id, kind: "books", missing: targetId });
        }
      }
    }
    const re = a.related_events || [];
    for (const x of re) {
      const targetId = typeof x === "string" ? x : x.id;
      if (targetId && !idSet.has(targetId)) {
        be++;
        if (report.relatedRefs.samples.length < 10) {
          report.relatedRefs.samples.push({ article: a.id, kind: "events", missing: targetId });
        }
      }
    }
  }
  report.relatedRefs.brokenPeople = bp;
  report.relatedRefs.brokenBooks = bb;
  report.relatedRefs.brokenEvents = be;
  console.log(`   people ${bp} | books ${bb} | events ${be}`);

  console.log("⏳ 5) view_count 统计...");
  let z = 0;
  for (const a of articles) {
    if (!a.view_count || a.view_count === 0) z++;
  }
  report.viewCount.zeroCount = z;
  report.viewCount.topByView = articles
    .filter((a) => a.view_count > 0)
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 10)
    .map((a) => ({ id: a.id, title: a.title, v: a.view_count }));
  console.log(`   全 0: ${z} / ${articles.length}`);

  console.log("⏳ 6) cover_url 格式校验...");
  for (const a of articles) {
    const u = a.cover_url;
    if (!u) continue;
    report.coverUrl.total++;
    if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(u)) {
      report.coverUrl.malformed.push({ id: a.id, url: u });
    }
  }
  console.log(`   ${report.coverUrl.total} 张, 格式异常 ${report.coverUrl.malformed.length}`);

  console.log("⏳ 7) 重复 title 检测...");
  const byTitle = new Map();
  for (const a of articles) {
    const t = (a.title || "").trim();
    if (!t) continue;
    byTitle.set(t, (byTitle.get(t) || 0) + 1);
  }
  for (const [t, n] of byTitle) {
    if (n > 1) {
      report.duplicates.byTitle.push({ title: t, count: n });
    }
  }
  report.duplicates.byTitle.sort((a, b) => b.count - a.count);
  console.log(`   重复 ${report.duplicates.byTitle.length} 组`);

  console.log("⏳ 8) 字段长度异常...");
  for (const a of articles) {
    const t = (a.title || "").trim();
    const b = (a.body || "").trim();
    if (t.length < 2) report.length.shortTitle.push({ id: a.id, title: t });
    if (t.length > 50) report.length.longTitle.push({ id: a.id, title: t });
    if (b.length < 10) report.length.shortBody.push({ id: a.id, title: t, bodyLen: b.length });
  }
  console.log(`   短标题 ${report.length.shortTitle.length} | 长标题 ${report.length.longTitle.length} | 短正文 ${report.length.shortBody.length}`);

  // 写报告
  const out = join(ROOT, "scripts", "data-quality-report.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`\n✅ 报告已写: ${out}`);

  // 打印摘要
  console.log("\n========== 数据质量报告摘要 ==========");
  console.log(`📊 文章总数: ${report.totalArticles}`);
  console.log(`📁 分类分布:`, Object.entries(report.category.distribution).sort((a, b) => b[1] - a[1]));
  console.log(`❓ 异常 category (非 9 标准类): ${report.category.unknown.length}`);
  if (report.category.unknown.length) {
    const sample = report.category.unknown.slice(0, 5);
    console.log("   样例:", sample.map((x) => `${x.id}→${x.cat}`).join(", "));
  }
  console.log(`🕳️ orphan relations: ${report.relations.orphan.length} / ${report.relations.total}`);
  console.log(`🔗 related_* 引用断裂: people ${bp} | books ${bb} | events ${be}`);
  console.log(`👀 view_count 全 0: ${z} / ${articles.length}`);
  console.log(`🖼️ cover_url 格式异常: ${report.coverUrl.malformed.length}`);
  console.log(`📛 重复 title: ${report.duplicates.byTitle.length} 组 (top 3:`,
    report.duplicates.byTitle.slice(0, 3).map((x) => `${x.title}×${x.count}`).join(", "), ")");
  console.log(`📏 长度异常: 短标题 ${report.length.shortTitle.length} | 长标题 ${report.length.longTitle.length} | 短正文 ${report.length.shortBody.length}`);
}

main().catch((e) => {
  console.error("💥", e);
  process.exit(1);
});
