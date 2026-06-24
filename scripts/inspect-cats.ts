// 查看完整 category 分布
import { readFileSync } from "node:fs";
import { join } from "node:path";
const PAT = process.env.SUPABASE_PAT || readFileSync(join(process.cwd(), ".env"), "utf-8").match(/SUPABASE_PAT=(.+)/)?.[1]?.trim();
async function q(sql: string) {
  const r = await fetch(`https://api.supabase.com/v1/projects/ozshflujnxonhfwdtunp/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  return r.ok ? await r.json() : await r.text();
}
(async () => {
  const cats: any = await q(`SELECT category, COUNT(*) AS n FROM knowledge_articles GROUP BY category ORDER BY n DESC`);
  console.log("完整 category 分布:");
  cats.forEach((r: any) => console.log(`  "${r.category}": ${r.n}`));
  const other = cats.filter((c: any) => !['人物','诗词','典籍','节日','节气','神话','非遗','艺术','建筑','饮食','服饰','哲学','科技','医学'].includes(c.category));
  if (other.length > 0) {
    console.log("\n未映射的 category:", other);
  }
  // 看几个未映射的样本
  for (const c of other) {
    const samples: any = await q(`SELECT id, title FROM knowledge_articles WHERE category = '${c.category}' LIMIT 3`);
    console.log(`\n"${c.category}" 样本:`, samples);
  }
})();
