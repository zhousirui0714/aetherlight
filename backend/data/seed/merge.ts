import type { Article } from "./types";
import { allRelations, type Relation } from "./relations";
import { figures } from "./figures";
import { figures2 } from "./figures2";
import { poems } from "./poems";
import { allData as restPart1Data } from "./rest-part1";
import { part2Articles } from "./rest-part2";

/**
 * 合并所有 Part 数据 (去重: 保留 first-occurrence, 后出现的同名 ID 会被覆盖/跳过)
 *
 * 优先级顺序:
 *   1. figures (核心人物) > figures2 > poems (基础数据)
 *   2. restPart1 (中期扩展)
 *   3. part2 (新扩展, lifestyle/philosophy/technology)
 *
 * 重复 ID 处理:
 *   - figures/figures2/poems/restPart1 优先 (更早创建, 字段可能更完整)
 *   - part2 中的重复会被跳过
 *   - 关系引用会指向保留的 ID
 */

function dedupeById(items: Article[]): { articles: Article[]; removedIds: string[] } {
  const seen = new Set<string>();
  const result: Article[] = [];
  const removed: string[] = [];
  for (const a of items) {
    if (seen.has(a.id)) {
      removed.push(a.id);
      continue;
    }
    seen.add(a.id);
    result.push(a);
  }
  return { articles: result, removedIds: removed };
}

const rawArticles: Article[] = [
  ...figures,
  ...figures2,
  ...poems,
  ...restPart1Data.figures,
  ...restPart1Data.classics,
  ...restPart1Data.festivals,
  ...restPart1Data.mythology,
  ...restPart1Data.intangible,
  ...restPart1Data.artifacts,
  ...part2Articles
];

const { articles: allArticlesDeduped, removedIds } = dedupeById(rawArticles);

if (removedIds.length > 0) {
  console.log(`[merge] 去重: 跳过 ${removedIds.length} 个重复 ID (first-occurrence 胜出)`);
  console.log(`[merge] 跳过 ID: ${removedIds.join(", ")}`);
}

export const allArticles: Article[] = allArticlesDeduped;

/**
 * 过滤 relations: 移除引用不存在 ID 的关联, 并去重 (from/to/type 唯一)
 */
function filterValidRelations(rels: Relation[]): { relations: Relation[]; removedCount: number; missingIds: Set<string> } {
  const ids = new Set(allArticlesDeduped.map(a => a.id));
  const seen = new Set<string>();
  const valid: Relation[] = [];
  const missing = new Set<string>();
  for (const r of rels) {
    const fromMissing = !ids.has(r.from_id);
    const toMissing = !ids.has(r.to_id);
    if (fromMissing || toMissing) {
      if (fromMissing) missing.add(r.from_id);
      if (toMissing) missing.add(r.to_id);
      continue;
    }
    const key = `${r.from_id}|${r.to_id}|${r.relation_type}`;
    if (seen.has(key)) continue;  // 去重
    seen.add(key);
    valid.push(r);
  }
  return { relations: valid, removedCount: rels.length - valid.length, missingIds: missing };
}

const { relations: allRelationsFiltered, removedCount: removedRelationsCount, missingIds: missingRelationIds } = filterValidRelations(allRelations);

if (removedRelationsCount > 0) {
  console.log(`[merge] 关系过滤: 移除 ${removedRelationsCount} 条引用缺失 ID 的关联`);
  console.log(`[merge] 缺失 ID: ${Array.from(missingRelationIds).join(", ")}`);
}

export const allRelationsExported: Relation[] = allRelationsFiltered;

/**
 * 校验: 确保 ID 唯一
 */
export function validateArticlesUnique(): { ok: boolean; dupIds: string[] } {
  const ids = new Set<string>();
  const dups: string[] = [];
  for (const a of allArticles) {
    if (ids.has(a.id)) dups.push(a.id);
    else ids.add(a.id);
  }
  return { ok: dups.length === 0, dupIds: dups };
}

/**
 * 校验: relation 引用的 ID 是否都存在
 */
export function validateRelationsReference(): { ok: boolean; missing: string[] } {
  const ids = new Set(allArticles.map(a => a.id));
  const missing: string[] = [];
  for (const r of allRelationsExported) {
    if (!ids.has(r.from_id)) missing.push(`from: ${r.from_id}`);
    if (!ids.has(r.to_id)) missing.push(`to: ${r.to_id}`);
  }
  return { ok: missing.length === 0, missing };
}

/**
 * 统计
 */
export function getStats() {
  const categoryMap = new Map<string, number>();
  for (const a of allArticles) {
    categoryMap.set(a.category, (categoryMap.get(a.category) ?? 0) + 1);
  }
  return {
    total: allArticles.length,
    totalRelations: allRelationsExported.length,
    byCategory: Object.fromEntries(categoryMap),
    removedDuplicates: removedIds,
    removedInvalidRelations: removedRelationsCount,
  };
}
