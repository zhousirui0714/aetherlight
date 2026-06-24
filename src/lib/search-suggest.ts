/**
 * 搜索联想词：基于语义搜索的同义词字典 + 拼音首字母
 * 输入 1-N 字 query，输出 5-8 个联想词（不调 LLM，毫秒级）
 */
import { SYNONYM_GROUPS, PINYIN_MAP } from "./semantic-search";

const POPULAR_QUERIES = [
  "李白", "杜甫", "苏轼", "诗经", "论语", "道德经",
  "端午", "中秋", "春节", "清明", "七夕", "重阳",
  "立春", "夏至", "立秋", "冬至",
  "孔子", "老子", "庄子", "屈原", "王维", "白居易",
  "山海经", "西游记", "红楼梦", "三国演义", "水浒传",
  "昆曲", "京剧", "中医", "茶道",
];

/**
 * 提取 query 的联想词
 * - 命中同义词组：返回该组所有词（最多 8 个）
 * - 拼音匹配：返回所有 PINYIN_MAP 中匹配的 key
 * - 都不命中：返回热门词中含 query 子串的
 */
export function getSuggestions(query: string, limit = 8): string[] {
  const q = query.trim();
  if (!q) return [];

  const out: string[] = [];
  const seen = new Set<string>();
  const add = (s: string) => {
    if (!s || seen.has(s) || s === q) return;
    seen.add(s);
    out.push(s);
  };

  // 1. 完全匹配同义词组
  for (const [key, words] of Object.entries(SYNONYM_GROUPS)) {
    if (key === q || words.includes(q)) {
      // 该组的所有词都算联想
      words.forEach(add);
    } else if (q.length >= 2 && key.includes(q)) {
      // query 是 key 的子串（如"端" → "端午"）
      add(key);
      words.slice(0, 3).forEach(add);
    }
  }

  // 2. 拼音匹配（用户输入拼音首字母）
  const lower = q.toLowerCase();
  for (const [key, pinyin] of Object.entries(PINYIN_MAP)) {
    if (pinyin.startsWith(lower) || pinyin.includes(lower)) {
      add(key);
    }
  }

  // 3. 热门词中含 query 子串
  if (q.length >= 1) {
    for (const hot of POPULAR_QUERIES) {
      if (hot.includes(q) || q.includes(hot)) {
        add(hot);
      }
    }
  }

  return out.slice(0, limit);
}
