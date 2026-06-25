/**
 * TF-IDF + 余弦相似度 - 纯本地算法，零外部依赖
 *
 * 应用场景：
 *   - 文章相关推荐：基于 title + category + tags + excerpt + body 计算相似度
 *   - 内容去重
 *   - 兴趣画像 vs 文章匹配
 *
 * 中文分词策略（轻量级，不依赖 jieba）：
 *   1. 完整词保留：title/category/tags 中的词
 *   2. 字符 bigram：解决中文分词难题
 *   3. 停用词过滤：的/了/是/在/和/与/或 等
 *
 * 字段权重（domain knowledge）：
 *   - title:    3.0  (强信号)
 *   - tags:     2.5
 *   - category: 2.0
 *   - excerpt:  1.5
 *   - content:  0.8
 *
 * 时间复杂度：
 *   - 索引构建: O(N * L)  N=文档数, L=平均长度
 *   - 单次查询: O(M * K)  M=query 词数, K=候选文档数 (取 topK 后剪枝)
 */

// ===== 停用词 =====
const STOPWORDS = new Set([
  "的", "了", "是", "在", "和", "与", "或", "也", "就", "都",
  "及", "以", "为", "而", "其", "之", "于", "乃", "乎",
  "the", "a", "an", "is", "are", "of", "to", "in", "on", "and", "or", "but",
  "我", "你", "他", "她", "它", "我们", "你们", "他们",
  "这", "那", "这个", "那个", "这些", "那些",
  "有", "没", "不", "没", "无",
  "上", "下", "里", "外", "中", "内", "前", "后", "左", "右",
]);

// ===== Tokenize =====

/**
 * 文本分词 = 完整词 + 字符 bigram（解决中文分词）
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const t = String(text).toLowerCase().trim();
  if (!t) return [];

  const tokens: string[] = [];

  // 1. 完整短语（>=2 字的连续 CJK 视为一个词）
  const cjkPhrases = t.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  for (const phrase of cjkPhrases) {
    if (!STOPWORDS.has(phrase)) tokens.push(phrase);
    // 2. bigram（覆盖未登录词）
    for (let i = 0; i < phrase.length - 1; i++) {
      const bg = phrase.slice(i, i + 2);
      if (!STOPWORDS.has(bg)) tokens.push(bg);
    }
  }

  // 3. 英文/数字词（按空格分）
  const enWords = t.match(/[a-z0-9]+/g) || [];
  for (const w of enWords) {
    if (w.length > 1 && !STOPWORDS.has(w)) tokens.push(w);
  }

  return tokens;
}

// ===== TF-IDF =====

export interface TFIDFDoc {
  id: string;
  /** 字段权重 */
  weights?: Partial<Record<keyof ArticleFields, number>>;
  /** 文档字段 */
  fields: Partial<ArticleFields>;
}

export interface ArticleFields {
  title: string;
  category: string;
  tags: string | string[];
  excerpt: string;
  content: string;
  /** 相关条目（如 related_people.title / related_books.title 等） */
  relatedNames?: string[];
}

const DEFAULT_WEIGHTS: Record<keyof ArticleFields, number> = {
  title: 3.0,
  tags: 2.5,
  category: 2.0,
  excerpt: 1.5,
  content: 0.8,
  relatedNames: 1.8,
};

export interface TFIDFIndex {
  /** 词 -> 出现该词的文档 ID 集合 */
  df: Map<string, Set<string>>;
  /** 文档 -> 词频向量 (归一化前) */
  tf: Map<string, Map<string, number>>;
  /** 文档 -> 向量 L2 范数（预计算，加速余弦） */
  norms: Map<string, number>;
  /** 文档数 */
  N: number;
  /** 文档 id 列表（保序） */
  ids: string[];
  /** 文档原始 fields（可选缓存） */
  docs: Map<string, Partial<ArticleFields>>;
}

export interface BuildOptions {
  /** 自定义字段权重 */
  weights?: Partial<Record<keyof ArticleFields, number>>;
}

/**
 * 构建 TF-IDF 索引
 */
export function buildIndex(
  docs: { id: string; fields: Partial<ArticleFields> }[],
  options: BuildOptions = {}
): TFIDFIndex {
  const weights = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };
  const df = new Map<string, Set<string>>();
  const tf = new Map<string, Map<string, number>>();
  const norms = new Map<string, number>();
  const docFields = new Map<string, Partial<ArticleFields>>();

  // 1. TF（带字段权重）
  for (const d of docs) {
    docFields.set(d.id, d.fields);
    const termWeights = new Map<string, number>();

    for (const [field, weight] of Object.entries(weights)) {
      if (!weight) continue;
      const raw = d.fields[field as keyof ArticleFields];
      if (!raw) continue;

      const value = Array.isArray(raw) ? raw.join(" ") : String(raw);
      const tokens = tokenize(value);
      for (const tok of tokens) {
        termWeights.set(tok, (termWeights.get(tok) || 0) + weight);
      }
    }

    tf.set(d.id, termWeights);

    // 2. DF（词 -> 出现该词的文档数）
    for (const term of termWeights.keys()) {
      if (!df.has(term)) df.set(term, new Set());
      df.get(term)!.add(d.id);
    }
  }

  // 3. TF-IDF 归一化（IDF 权重） + 预计算 L2 norm
  for (const [docId, termWeights] of tf.entries()) {
    const vec = new Map<string, number>();
    let sumSquares = 0;

    for (const [term, tfScore] of termWeights.entries()) {
      const dfScore = df.get(term)?.size || 0;
      const idf = Math.log((docs.length + 1) / (1 + dfScore)) + 1; // smooth IDF
      const v = tfScore * idf;
      vec.set(term, v);
      sumSquares += v * v;
    }

    // 用 L2 归一化后的向量替换
    const norm = Math.sqrt(sumSquares) || 1;
    for (const [term, v] of vec.entries()) {
      vec.set(term, v / norm);
    }
    tf.set(docId, vec);
    norms.set(docId, 1.0); // 归一化后 = 1
  }

  return {
    df,
    tf,
    norms,
    N: docs.length,
    ids: docs.map((d) => d.id),
    docs: docFields,
  };
}

/**
 * 把 query 转为 TF-IDF 向量
 */
export function vectorizeQuery(
  index: TFIDFIndex,
  text: string,
  fieldWeight = 1.0
): Map<string, number> {
  const tokens = tokenize(text);
  const tfCount = new Map<string, number>();
  for (const t of tokens) {
    tfCount.set(t, (tfCount.get(t) || 0) + fieldWeight);
  }

  const vec = new Map<string, number>();
  let sumSquares = 0;
  for (const [term, tfScore] of tfCount.entries()) {
    const dfScore = index.df.get(term)?.size || 0;
    if (dfScore === 0) continue; // 词不在语料中，忽略
    const idf = Math.log((index.N + 1) / (1 + dfScore)) + 1;
    const v = tfScore * idf;
    vec.set(term, v);
    sumSquares += v * v;
  }

  // L2 归一化
  const norm = Math.sqrt(sumSquares) || 1;
  for (const [term, v] of vec.entries()) {
    vec.set(term, v / norm);
  }
  return vec;
}

/**
 * 向量余弦相似度（两个已归一化向量，直接点积）
 */
export function cosine(a: Map<string, number>, b: Map<string, number>): number {
  // 取较小 map 迭代
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, av] of small.entries()) {
    const bv = large.get(term);
    if (bv !== undefined) dot += av * bv;
  }
  return dot;
}

// ===== 检索 =====

export interface SearchOptions {
  topK?: number;
  /** 排除这些文档 id */
  exclude?: Set<string>;
  /** 最小相似度阈值（0-1） */
  threshold?: number;
}

export interface SearchResult {
  id: string;
  score: number;
}

/**
 * 索引内相似度检索：返回 topK 相似文档
 */
export function searchSimilar(
  index: TFIDFIndex,
  queryText: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { topK = 10, exclude, threshold = 0 } = options;
  if (!queryText.trim()) return [];

  const qVec = vectorizeQuery(index, queryText);

  // 1. 找出 query 命中的文档（剪枝：只算命中文档的相似度）
  const candidates = new Set<string>();
  for (const term of qVec.keys()) {
    const docs = index.df.get(term);
    if (docs) docs.forEach((id) => candidates.add(id));
  }

  if (candidates.size === 0) return [];

  // 2. 计算每个候选的余弦相似度
  const scored: SearchResult[] = [];
  for (const docId of candidates) {
    if (exclude?.has(docId)) continue;
    const docVec = index.tf.get(docId);
    if (!docVec) continue;
    const score = cosine(qVec, docVec);
    if (score >= threshold) scored.push({ id: docId, score });
  }

  // 3. 排序 + topK
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ===== 文档-文档相似度（用于推荐） =====

/**
 * 找与给定文档最相似的 topK 个文档
 */
export function findSimilarDocs(
  index: TFIDFIndex,
  docId: string,
  options: SearchOptions = {}
): SearchResult[] {
  const exclude = new Set([...(options.exclude || []), docId]);
  const docFields = index.docs.get(docId);
  if (!docFields) return [];

  // 拼装 query 文本（用与索引构建相同的字段权重思想）
  const parts: string[] = [];
  parts.push(docFields.title || "");
  parts.push(docFields.category || "");
  const tags = docFields.tags;
  if (Array.isArray(tags)) parts.push(tags.join(" "));
  else if (tags) parts.push(tags);
  parts.push(docFields.excerpt || "");
  // content 太长，只取前 500 字
  parts.push((docFields.content || "").slice(0, 500));
  if (docFields.relatedNames) parts.push(docFields.relatedNames.join(" "));

  return searchSimilar(index, parts.join(" "), { ...options, exclude });
}
