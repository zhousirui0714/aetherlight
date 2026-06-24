/**
 * 验证脚本：检查 DB 端点是否正常返回数据
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ENV = (() => {
  const env: Record<string, string> = {};
  for (const line of readFileSync(join(process.cwd(), ".env"), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
})();

const URL = ENV.SUPABASE_URL!;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function test(name: string, url: string) {
  const r = await fetch(url, { headers: H });
  if (!r.ok) {
    console.log(`[${name}] HTTP ${r.status} ❌`);
    return;
  }
  const data = await r.json();
  console.log(`[${name}] HTTP ${r.status} ✓ ${Array.isArray(data) ? data.length : 0} 条`);
  if (Array.isArray(data) && data.length > 0) {
    console.log(`  样本: ${(data[0].title || data[0].name || JSON.stringify(data[0])).slice(0, 60)}`);
  }
}

async function main() {
  console.log("=== 知识库端点验证 ===\n");

  // 各分类抽样
  for (const cat of ["节气", "节日", "诗词", "典籍", "非遗", "民俗", "人物"]) {
    await test(`分类: ${cat}`, `${URL}/rest/v1/knowledge_articles?select=id,title,category&category=eq.${encodeURIComponent(cat)}&limit=3`);
  }

  // 详情
  console.log("\n--- 详情 ---");
  await test("详情: 静夜思", `${URL}/rest/v1/knowledge_articles?select=*&id=eq.jingye&limit=1`);
  await test("详情: 立春", `${URL}/rest/v1/knowledge_articles?select=*&id=eq.lichun&limit=1`);
  await test("详情: 故宫", `${URL}/rest/v1/knowledge_articles?select=*&id=eq.gugong&limit=1`);

  // 总数
  console.log("\n--- 总数 ---");
  const countRes = await fetch(`${URL}/rest/v1/knowledge_articles?select=id`, {
    method: "HEAD",
    headers: { ...H, Prefer: "count=exact" },
  });
  console.log("总数:", countRes.headers.get("Content-Range"));

  // 检查 RLS
  console.log("\n--- RLS 公开读测试 ---");
  const anonRes = await fetch(`${URL}/rest/v1/knowledge_articles?select=id&limit=1`, {
    headers: { apikey: ENV.VITE_SUPABASE_PUBLISHABLE_KEY!, Authorization: `Bearer ${ENV.VITE_SUPABASE_PUBLISHABLE_KEY!}` },
  });
  console.log("匿名访问:", anonRes.status, anonRes.ok ? "✓" : "❌");
}

main().catch(console.error);
