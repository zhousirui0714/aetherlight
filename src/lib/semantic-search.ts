/**
 * 语义搜索：同义词扩展 + 拼音匹配 + 智能联想
 * 不依赖外部 embedding API，毫秒级响应
 * - 命中低时调用 LLM 兜底（如果环境支持）
 */

import { knowledgeApi } from "@/lib/knowledge-api";

// ============================================================
// 同义词 / 联想字典
// ============================================================
export const SYNONYM_GROUPS: Record<string, string[]> = {
  // 节气
  "立春": ["立春", "打春", "春节", "迎春", "节气", "春天", "春季", "万物生发"],
  "春分": ["春分", "昼夜平分", "仲春", "春天", "春季"],
  "清明": ["清明", "寒食", "祭祖", "扫墓", "踏青", "二十四节气", "春"],
  "夏至": ["夏至", "日长至", "盛夏", "夏", "蝉鸣", "荷花"],
  "立秋": ["立秋", "秋天", "秋季", "凉风至", "落叶"],
  "秋分": ["秋分", "仲秋", "丰收", "秋天", "秋季", "中秋"],
  "冬至": ["冬至", "数九", "饺子", "汤圆", "冬", "严冬"],
  // 节日
  "春节": ["春节", "过年", "年", "除夕", "正月初一", "鞭炮", "春联", "红色", "团圆", "红包"],
  "端午": ["端午", "端午节", "粽子", "龙舟", "屈原", "五日", "仲夏", "艾草", "雄黄"],
  "中秋": ["中秋", "中秋节", "月亮", "月饼", "团圆", "赏月", "嫦娥", "桂花"],
  "七夕": ["七夕", "乞巧", "牛郎", "织女", "鹊桥", "情人节"],
  "重阳": ["重阳", "重阳节", "登高", "敬老", "菊花", "茱萸", "九月初九"],
  // 主题概念
  "月亮": ["月亮", "月", "明月", "月光", "嫦娥", "玉兔", "桂花", "婵娟", "阴晴圆缺"],
  "思乡": ["思乡", "乡愁", "故乡", "家乡", "团圆", "亲人", "归家", "中秋", "明月"],
  "登高": ["登高", "登楼", "远望", "望远", "思乡", "秋天", "秋", "高远"],
  "送别": ["送别", "离别", "送行", "友情", "惜别", "送", "赠别"],
  "战争": ["战争", "边塞", "出征", "将军", "战场", "家国", "保家卫国", "沙场"],
  "山水": ["山水", "自然", "风景", "山川", "江河", "田园", "隐居"],
  "爱情": ["爱情", "相思", "情", "恋", "情诗", "婉约", "闺怨"],
  // 人物
  "李白": ["李白", "太白", "诗仙", "青莲居士", "盛唐", "杜甫", "唐朝"],
  "杜甫": ["杜甫", "少陵", "诗圣", "工部", "草堂", "忧国忧民", "唐朝"],
  "苏轼": ["苏轼", "东坡", "苏东坡", "东坡居士", "豪放派", "宋词", "宋朝"],
  "屈原": ["屈原", "屈子", "离骚", "楚辞", "端午", "楚国", "汨罗江"],
  "孔子": ["孔子", "孔丘", "至圣", "文宣王", "儒学", "论语", "春秋", "儒家", "弟子"],
  "老子": ["老子", "老聃", "道德经", "道家", "哲学", "道", "玄学"],
  "庄子": ["庄子", "庄周", "道家", "逍遥游", "哲学"],
  // 典籍
  "诗经": ["诗经", "诗三百", "风雅颂", "六义", "国风", "雅", "颂", "先秦"],
  "论语": ["论语", "孔子", "儒家", "学而", "为政", "八佾", "里仁", "四书"],
  "道德经": ["道德经", "老子", "道家", "五千言", "玄学", "哲学"],
  "山海经": ["山海经", "神话", "异兽", "神兽", "夸父", "精卫", "先秦"],
  "西游记": ["西游记", "西行", "取经", "唐僧", "孙悟空", "猪八戒", "沙僧", "四大名著"],
  "红楼梦": ["红楼梦", "石头记", "金陵十二钗", "贾宝玉", "林黛玉", "曹雪芹"],
  // 类别
  "古诗": ["古诗", "唐诗", "宋词", "诗", "词", "韵律", "押韵"],
  "成语": ["成语", "四字", "典故", "故事", "古文"],
  "神话": ["神话", "传说", "神兽", "神", "仙", "山海经", "志怪"],
  "非遗": ["非遗", "非物质", "文化遗产", "手工艺", "传承", "昆曲", "京剧", "古琴"],
  "中医": ["中医", "中药", "针灸", "把脉", "黄帝内经", "本草纲目", "药方", "养生"],
  // 风格
  "婉约": ["婉约", "柳永", "李清照", "秦观", "宋词", "柔美"],
  "豪放": ["豪放", "苏轼", "辛弃疾", "岳飞", "宋词", "大气", "壮阔"],
};

// 拼音首字母映射（高频文化词）
export const PINYIN_MAP: Record<string, string> = {
  "李白": "libai",
  "杜甫": "dufu",
  "苏轼": "sushi",
  "辛弃疾": "xinqiji",
  "李清照": "liqingzhao",
  "屈原": "quyuan",
  "孔子": "kongzi",
  "老子": "laozi",
  "庄子": "zhuangzi",
  "端午": "duanwu",
  "中秋": "zhongqiu",
  "春节": "chunjie",
  "七夕": "qixi",
  "重阳": "chongyang",
  "清明": "qingming",
  "夏至": "xiazhi",
  "冬至": "dongzhi",
  "立春": "lichun",
  "立秋": "liqiu",
  "诗经": "shijing",
  "论语": "lunyu",
  "道德经": "daodejing",
  "山海经": "shanhaijing",
  "西游记": "xiyouji",
  "红楼梦": "hongloumeng",
  "中医": "zhongyi",
  "非遗": "feiyi",
  "昆曲": "kunqu",
  "京剧": "jingju",
  "古琴": "guqin",
};

/**
 * 扩展 query 为相关词列表
 * 1. 命中同义词组 → 加入组内所有词
 * 2. 拼音匹配 → 找到对应中文
 * 3. AI 兜底（如果低命中）
 */
export async function expandQuery(query: string, useAI = true): Promise<{
  original: string;
  expanded: string[];
  related: string[];
}> {
  const original = query.trim();
  const expanded = new Set<string>([original]);
  const lower = original.toLowerCase();
  const related: string[] = [];

  // 1. 同义词组扩展
  for (const [key, group] of Object.entries(SYNONYM_GROUPS)) {
    if (original.includes(key) || key.includes(original)) {
      group.forEach(w => expanded.add(w));
    }
    // 反向也匹配：query 命中组内任一词
    for (const word of group) {
      if (original.includes(word) && !original.includes(key)) {
        group.forEach(w => expanded.add(w));
        related.push(key);
        break;
      }
    }
  }

  // 2. 拼音匹配（仅当 query 是纯字母时）
  if (/^[a-z]+$/i.test(original)) {
    for (const [cn, py] of Object.entries(PINYIN_MAP)) {
      if (py === lower || py.startsWith(lower)) {
        expanded.add(cn);
        // 进一步扩展同义词
        const group = SYNONYM_GROUPS[cn];
        group?.forEach(w => expanded.add(w));
      }
    }
  }

  // 3. AI 兜底：仅当 1+2 命中少且启用
  if (useAI && expanded.size < 5) {
    try {
      const aiRelated = await aiExpandQuery(original);
      aiRelated.forEach(w => expanded.add(w));
    } catch {
      // 静默失败
    }
  }

  return {
    original,
    expanded: Array.from(expanded),
    related: Array.from(new Set(related)),
  };
}

/**
 * AI 扩词（调 BAILIAN/OpenAI 兼容 API）
 * 失败/超时则返回空数组
 */
async function aiExpandQuery(query: string): Promise<string[]> {
  try {
    const apiKey = (import.meta as any).env?.VITE_BAILIAN_API_KEY ||
                   (import.meta as any).env?.BAILIAN_API_KEY;
    if (!apiKey) return [];

    const prompt = `用户搜索：「${query}」
请基于中华传统文化，给出 5-8 个最相关的关键词或主题词（不是字面相关，是文化意义上的联想）。
要求：JSON 数组格式，每个词不超过 6 字。
例：搜"端午" → ["屈原","粽子","龙舟","楚辞","五月","仲夏","艾草"]
例：搜"思乡" → ["明月","故乡","中秋","团圆","归家","亲人"]`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return [];
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    // 尝试解析 JSON 数组
    const match = content.match(/\[[\s\S]*?\]/);
    if (match) {
      try {
        const arr = JSON.parse(match[0]);
        if (Array.isArray(arr)) return arr.filter((x: any) => typeof x === "string");
      } catch {}
    }
    // 兜底：按换行/逗号拆
    return content.split(/[\n,，]/).map(s => s.trim().replace(/^["「\[]|["」\]]$/g, "")).filter(s => s && s.length <= 8).slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * 评分：query 命中字段的位置 + 扩展词命中权重
 * 返回 0-1+ 的分数，>0 表示相关
 */
export function scoreMatch(text: string, query: string, expanded: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const ql = query.toLowerCase();

  // 原文完全匹配 → 最高
  if (lower === ql) return 1.0;
  // 标题位置匹配（前 30 字符）→ 高
  const titleHit = lower.indexOf(ql);
  if (titleHit >= 0 && titleHit < 30) return 0.85 - titleHit * 0.005;
  // 任意位置匹配 → 中
  if (titleHit >= 0) return 0.6;
  // 扩展词命中
  for (let i = 0; i < expanded.length; i++) {
    const w = expanded[i];
    if (w === query) continue; // 上面已算
    const idx = lower.indexOf(w.toLowerCase());
    if (idx >= 0) {
      // 越靠前越相关，扩展词权重递减
      const wScore = 0.4 * (1 - i / Math.max(expanded.length, 1));
      const posScore = idx < 30 ? 0.1 : 0;
      return Math.min(0.5, wScore + posScore);
    }
  }
  return 0;
}

/**
 * 语义搜索 entry：把 query 扩展后批量打分排序
 */
export async function semanticSearch<T>(
  query: string,
  candidates: T[],
  fields: (keyof T)[],
  options: { useAI?: boolean; topK?: number; threshold?: number } = {}
): Promise<{ item: T; score: number }[]> {
  const { useAI = true, topK = 20, threshold = 0.15 } = options;
  const { expanded, original } = await expandQuery(query, useAI);

  const scored = candidates.map(item => {
    let maxScore = 0;
    for (const f of fields) {
      const text = String(item[f] || "");
      const s = scoreMatch(text, original, expanded);
      if (s > maxScore) maxScore = s;
    }
    return { item, score: maxScore };
  });

  return scored
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
