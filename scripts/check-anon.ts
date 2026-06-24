/**
 * 用真实 publishable key 验证
 */
const URL = "https://ozshflujnxonhfwdtunp.supabase.co";
const KEY = "sb_publishable_wHFjXUg7E8WZ6lKVUKGU0g_eVZ_GwdL";

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function main() {
  // 1. 公开列表
  const r = await fetch(`${URL}/rest/v1/knowledge_articles?select=id,title,category,excerpt,favorites,cover&limit=3`, { headers: H });
  console.log("公开列表 HTTP:", r.status, r.ok ? "✓" : "❌");
  if (r.ok) {
    const d = await r.json();
    console.log("返回:", d.length, "条");
    d.forEach((x: any) => console.log("  -", x.title, `(${x.category})`));
  } else {
    console.log("错误:", (await r.text()).slice(0, 300));
  }

  // 2. 分类筛选
  console.log("\n--- 分类筛选测试 ---");
  for (const cat of ["节气", "节日", "诗词", "典籍", "非遗", "民俗", "人物"]) {
    const r2 = await fetch(`${URL}/rest/v1/knowledge_articles?select=id&category=eq.${encodeURIComponent(cat)}&limit=1`, { headers: H });
    const d2 = await r2.json();
    console.log(`${cat}: HTTP ${r2.status} ${d2.length} 条`);
  }

  // 3. 详情
  console.log("\n--- 详情 ---");
  for (const id of ["jingye", "lichun", "libai", "kunqu"]) {
    const r3 = await fetch(`${URL}/rest/v1/knowledge_articles?select=id,title&category,excerpt,cover&id=eq.${id}&limit=1`, { headers: H });
    const d3 = await r3.json();
    console.log(`${id}: HTTP ${r3.status} ${d3.length > 0 ? d3[0].title : "未找到"}`);
  }

  // 4. 总数
  const r4 = await fetch(`${URL}/rest/v1/knowledge_articles?select=id`, {
    method: "HEAD",
    headers: { ...H, Prefer: "count=exact" },
  });
  console.log("\nDB 总数:", r4.headers.get("Content-Range"));
}

main().catch(console.error);
