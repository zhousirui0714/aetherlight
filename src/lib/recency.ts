/**
 * 时间衰减与综合排序工具
 *
 * 核心思想：
 *   1. 热度 ≠ 一直热门，**新内容应得到加成**（避免老内容霸榜）
 *   2. 用指数衰减：score * exp(-Δt / τ)，τ = 半衰期
 *   3. 用户兴趣加权：匹配 category/tag 的内容加权
 *
 * 应用：
 *   - knowledge-gallery 热门 tab
 *   - 首页推荐
 *   - 任意 "热度排序" 场景
 */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * 指数时间衰减
 *
 * @param createdAt  内容创建时间（ISO string 或 Date）
 * @param halfLifeDays 半衰期（天）：每隔这段时间，权重变为一半
 * @param now 参考当前时间（默认 new Date()）
 * @returns 0-1 之间的衰减系数
 */
export function recencyDecay(
  createdAt: string | Date,
  halfLifeDays = 30,
  now: Date = new Date()
): number {
  const t = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const ageMs = Math.max(0, now.getTime() - t.getTime());
  const ageDays = ageMs / DAY_MS;
  return Math.pow(0.5, ageDays / halfLifeDays);
}

/**
 * 兴趣匹配加权：内容字段 vs 用户偏好
 *
 * @param userInterests 用户偏好 { category, tags[] }
 * @param content 文章 { category, tags[] }
 * @returns 加权分数（0-1）
 */
export function interestMatch(
  userInterests: { category?: string; tags?: string[] } | null,
  content: { category?: string; tags?: string[] }
): number {
  if (!userInterests) return 0;

  let score = 0;

  // 分类匹配 +0.6
  if (
    userInterests.category &&
    content.category &&
    userInterests.category === content.category
  ) {
    score += 0.6;
  }

  // 标签匹配 +0.2 per tag, 上限 0.6
  if (userInterests.tags && content.tags) {
    const userTags = new Set(userInterests.tags);
    let matched = 0;
    for (const t of content.tags) {
      if (userTags.has(t)) matched++;
    }
    score += Math.min(0.6, matched * 0.2);
  }

  return Math.min(1.0, score);
}

export interface TrendingItem {
  /** 原始热度（view/favorite/count） */
  popularity: number;
  /** 创建时间 */
  createdAt: string | Date;
  /** 分类 */
  category?: string;
  /** 标签 */
  tags?: string[];
}

export interface TrendingScore {
  /** 原始热度分数（log 归一化） */
  popularityScore: number;
  /** 时间衰减分数 */
  recencyScore: number;
  /** 兴趣匹配分数 */
  interestScore: number;
  /** 综合 0-1 */
  total: number;
}

export interface TrendingOptions {
  /** 半衰期（天）默认 30 */
  halfLifeDays?: number;
  /** 兴趣匹配 */
  userInterests?: { category?: string; tags?: string[] } | null;
  /** 权重配置 */
  weights?: {
    popularity?: number;
    recency?: number;
    interest?: number;
  };
}

/**
 * 计算热门综合分数
 *
 * 默认权重：popularity=0.55, recency=0.30, interest=0.15
 */
export function trendingScore(
  item: TrendingItem,
  options: TrendingOptions = {}
): TrendingScore {
  const { halfLifeDays = 30, userInterests = null } = options;
  const weights = {
    popularity: 0.55,
    recency: 0.30,
    interest: 0.15,
    ...(options.weights || {}),
  };

  // 1. Popularity（log 缩放，让新文章能追上老爆款）
  // log10(popularity + 1) / log10(100000) 把 0-100k 映射到 0-1
  const popRaw = Math.max(0, item.popularity);
  const popularityScore = popRaw > 0
    ? Math.min(1, Math.log10(popRaw + 1) / Math.log10(100000))
    : 0;

  // 2. Recency
  const recencyScore = recencyDecay(item.createdAt, halfLifeDays);

  // 3. Interest
  const interestScore = interestMatch(userInterests, {
    category: item.category,
    tags: item.tags,
  });

  const total =
    weights.popularity * popularityScore +
    weights.recency * recencyScore +
    weights.interest * interestScore;

  return {
    popularityScore,
    recencyScore,
    interestScore,
    total: Math.min(1, total),
  };
}

/**
 * 排序一组 items
 */
export function sortByTrending<T extends TrendingItem>(
  items: T[],
  options: TrendingOptions = {}
): Array<T & { trending: TrendingScore }> {
  return items
    .map((item) => ({ ...item, trending: trendingScore(item, options) }))
    .sort((a, b) => b.trending.total - a.trending.total);
}
