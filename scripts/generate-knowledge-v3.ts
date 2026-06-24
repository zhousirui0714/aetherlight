/**
 * 知识库 v3 数据生成器
 *
 * 数据流程:
 *   backend/data/seed/*.ts (源数据)
 *     -> merge.ts 合并 + 校验
 *     -> backend/data/knowledge_articles_v3.json (输出)
 *     -> backend/data/knowledge_relations_v3.json (输出)
 *
 * 运行: bun scripts/generate-knowledge-v3.ts
 */
import { writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const OUT_ARTICLES = join(ROOT, "backend", "data", "knowledge_articles_v3.json");
const OUT_RELATIONS = join(ROOT, "backend", "data", "knowledge_relations_v3.json");

async function main() {
  console.log("📊 Step 1: 加载并合并所有 seed 数据...");

  // 动态 import merge.ts（必须用 file:// URL 才能在 ESM 解析相对路径）
  const mergePath = new URL("../backend/data/seed/merge.ts", import.meta.url);
  const { allArticles, allRelationsExported, validateArticlesUnique, validateRelationsReference, getStats } = await import(mergePath.href);

  console.log(`   总文章: ${allArticles.length}`);
  console.log(`   总关联: ${allRelationsExported.length}`);

  console.log("\n🔍 Step 2: 校验...");
  const uniqCheck = validateArticlesUnique();
  if (!uniqCheck.ok) {
    console.error("❌ 重复 ID:", uniqCheck.dupIds.slice(0, 10));
    process.exit(1);
  }
  console.log("   ✓ ID 唯一");

  const refCheck = validateRelationsReference();
  if (!refCheck.ok) {
    console.error("❌ 关联引用的 ID 缺失:", refCheck.missing.slice(0, 20));
    console.warn("   (这些关联在 DB 同步时会被跳过)");
  } else {
    console.log("   ✓ 所有关联引用都存在");
  }

  // 过滤：只保留引用存在的 relation
  const validRelations = refCheck.ok
    ? allRelationsExported
    : allRelationsExported.filter((r: any) => !refCheck.missing.some((m: string) => m.endsWith(r.from_id) || m.endsWith(r.to_id)));

  // 过滤：去掉没有 id 的 article（防御性）
  const cleanArticles = allArticles.filter(a => a.id && a.title);

  console.log("\n📋 Step 3: 分类统计...");
  const stats = getStats();
  console.log("   总计:", stats.total, "条文章,", stats.totalRelations, "条关联");
  Object.entries(stats.byCategory).forEach(([c, n]) => {
    console.log(`   ${c}: ${n} 条`);
  });

  console.log("\n💾 Step 4: 写入 JSON...");
  writeFileSync(OUT_ARTICLES, JSON.stringify(cleanArticles, null, 2), "utf-8");
  console.log(`   ✓ ${OUT_ARTICLES}`);

  writeFileSync(OUT_RELATIONS, JSON.stringify(validRelations, null, 2), "utf-8");
  console.log(`   ✓ ${OUT_RELATIONS}`);

  console.log("\n✅ 生成完成！");
  console.log("   下一步: bun scripts/sync-supabase-v3.ts");
}

main().catch((err) => {
  console.error("❌ 失败:", err);
  process.exit(1);
});
