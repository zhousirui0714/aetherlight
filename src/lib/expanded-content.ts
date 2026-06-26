// 详情页扩展内容 — 智能补全 + JSON 索引
//
// 设计目标：让所有 60+ 文章（包括只有 content/history/influence 的旧文章）都能用上新分类详情页
// 补全策略：
//  1. 优先用 generated-content.json 中的丰富数据 (若存在)
//  2. 否则用 ARTICLES 静态数据中的 content/history/influence
//  3. 自动从 content 解析【小标题/章节/年份】等结构化字段
//  4. 从 region/relatedPeople 等字段推断地图坐标、人物关系

import generated from "./generated-content.json";
import type { Article, RelatedItem } from "./knowledge-types";
import { ARTICLES as LEGACY_ARTICLES } from "./knowledge-data";

// ---------------------------------------------------------------------------
// 扩展内容接口 — 详情页 10 个分类章节需要的所有结构化数据
// ---------------------------------------------------------------------------

export interface TimelineEvent {
  year: string;
  title: string;
  description?: string;
  highlight?: boolean;
}

export interface ProcessStep {
  title: string;
  description?: string;
  icon?: string;
  highlight?: boolean;
}

export interface CharacterInfo {
  name: string;
  role: string;
  description: string;
}

export interface MythRelationship {
  from: string;
  to: string;
  type: string;
}

export interface FigureRelationships {
  teachers: RelatedItem[];
  friends: RelatedItem[];
  students: RelatedItem[];
  family: RelatedItem[];
}

export interface StructureImage {
  url: string;
  title: string;
  description?: string;
}

export interface ChapterItem {
  title: string;
  brief?: string;
}

export interface RegionFood {
  name: string;
  description: string;
}

export interface RegionVariant {
  region: string;
  features?: string;
  custom?: string;
}

export interface ModernExperience {
  name: string;
  description: string;
  url?: string;
}

export interface ClassicQuote {
  title: string;
  text: string;
  source?: string;
}

export interface Comparison {
  school: string;
  compare: string;
}

export interface Application {
  scene: string;
  example: string;
}

export interface ExpandedContent {
  // 基础
  content: string;
  history: string;
  influence: string;
  // 人物
  timeline?: TimelineEvent[];
  relationships?: FigureRelationships;
  // 建筑/器物
  coordinates?: { lat: number; lng: number };
  structureImages?: StructureImage[];
  // 节日节气
  evolution?: TimelineEvent[];
  regionalVariations?: RegionVariant[];
  foods?: RegionFood[];
  targetDate?: string; // ISO
  // 神话
  plot?: TimelineEvent[];
  characters?: CharacterInfo[];
  mythRelationships?: MythRelationship[];
  // 非遗
  craftFlow?: ProcessStep[];
  gallery?: StructureImage[];
  inheritors?: { name: string; title?: string; brief?: string }[];
  // 典籍
  chapters?: ChapterItem[];
  classics?: ClassicQuote[];
  // 思想
  comparisons?: Comparison[];
  applications?: Application[];
  // 科技
  principle?: ProcessStep[];
  spreadRoute?: TimelineEvent[];
  modernContinuations?: { name: string; description: string }[];
  // 饮食服饰
  craft?: ProcessStep[];
  regionalVariants?: RegionVariant[];
  modernExperiences?: ModernExperience[];
  relatedFestivals?: RelatedItem[];
  // 通用
  relatedSchools?: RelatedItem[];
  relatedBuildings?: RelatedItem[];
  similarPoems?: RelatedItem[];
  artisticFeatures?: string;
  // 智能推断标记
  _inferred?: boolean; // true 表示数据是从 article 字段推断出来的，没有人工数据
  _source?: "json" | "inferred" | "article";
}

// ---------------------------------------------------------------------------
// 索引
// ---------------------------------------------------------------------------

const EXPANDED_JSON: Record<string, Partial<ExpandedContent>> = generated as any;

// 城市坐标 (核心城市，覆盖大部分文章 region)
const CITY_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  "北京": { lat: 39.9042, lng: 116.4074, name: "北京" },
  "故宫": { lat: 39.9163, lng: 116.3972, name: "北京·故宫" },
  "紫禁城": { lat: 39.9163, lng: 116.3972, name: "北京·紫禁城" },
  "西安": { lat: 34.3416, lng: 108.9398, name: "西安" },
  "长安": { lat: 34.3416, lng: 108.9398, name: "西安·长安" },
  "洛阳": { lat: 34.6197, lng: 112.4539, name: "洛阳" },
  "南京": { lat: 32.0603, lng: 118.7969, name: "南京" },
  "金陵": { lat: 32.0603, lng: 118.7969, name: "南京·金陵" },
  "建康": { lat: 32.0603, lng: 118.7969, name: "南京·建康" },
  "杭州": { lat: 30.2741, lng: 120.1551, name: "杭州" },
  "临安": { lat: 30.2741, lng: 120.1551, name: "杭州·临安" },
  "苏州": { lat: 31.2989, lng: 120.5853, name: "苏州" },
  "成都": { lat: 30.5728, lng: 104.0668, name: "成都" },
  "广州": { lat: 23.1291, lng: 113.2644, name: "广州" },
  "敦煌": { lat: 40.1421, lng: 94.6612, name: "敦煌" },
  "曲阜": { lat: 35.5947, lng: 116.9926, name: "曲阜" },
  "绍兴": { lat: 29.9971, lng: 120.5826, name: "绍兴" },
  "扬州": { lat: 32.3947, lng: 119.4124, name: "扬州" },
  "开封": { lat: 34.7972, lng: 114.3076, name: "开封" },
  "亳州": { lat: 33.8693, lng: 115.7787, name: "亳州" },
  "天水": { lat: 34.5805, lng: 105.7249, name: "天水" },
  "大理": { lat: 25.6065, lng: 100.2676, name: "大理" },
  "武汉": { lat: 30.5928, lng: 114.3055, name: "武汉" },
  "长沙": { lat: 28.2282, lng: 112.9388, name: "长沙" },
  "济南": { lat: 36.6512, lng: 117.1201, name: "济南" },
  "泰山": { lat: 36.2547, lng: 117.1011, name: "泰山" },
  "黄鹤楼": { lat: 30.5448, lng: 114.3054, name: "武汉·黄鹤楼" },
  "岳阳楼": { lat: 29.3717, lng: 113.0977, name: "岳阳" },
  "滕王阁": { lat: 28.6810, lng: 115.8533, name: "南昌·滕王阁" },
  "蓬莱": { lat: 37.8122, lng: 120.7580, name: "蓬莱" },
  "峨眉山": { lat: 29.5429, lng: 103.3346, name: "峨眉山" },
  "黄山": { lat: 29.7147, lng: 118.3376, name: "黄山" },
};

// 二十四节气日期表 (近似)
const SOLAR_TERMS_2026: Record<string, { month: number; day: number }> = {
  "立春": { month: 2, day: 4 },
  "雨水": { month: 2, day: 19 },
  "惊蛰": { month: 3, day: 6 },
  "春分": { month: 3, day: 21 },
  "清明": { month: 4, day: 5 },
  "谷雨": { month: 4, day: 20 },
  "立夏": { month: 5, day: 6 },
  "小满": { month: 5, day: 21 },
  "芒种": { month: 6, day: 6 },
  "夏至": { month: 6, day: 21 },
  "小暑": { month: 7, day: 7 },
  "大暑": { month: 7, day: 23 },
  "立秋": { month: 8, day: 7 },
  "处暑": { month: 8, day: 23 },
  "白露": { month: 9, day: 8 },
  "秋分": { month: 9, day: 23 },
  "寒露": { month: 10, day: 8 },
  "霜降": { month: 10, day: 24 },
  "立冬": { month: 11, day: 7 },
  "小雪": { month: 11, day: 22 },
  "大雪": { month: 12, day: 7 },
  "冬至": { month: 12, day: 22 },
  "小寒": { month: 1, day: 6 },
  "大寒": { month: 1, day: 20 },
};

// ---------------------------------------------------------------------------
// 解析器 — 从正文/历史中提取结构化数据
// ---------------------------------------------------------------------------

/** 解析【xxx】小标题为时间轴 */
export function parseSectionsToTimeline(text: string): TimelineEvent[] | null {
  if (!text) return null;
  const re = /【\s*([^\】]{2,40})\s*】/g;
  const sections: { title: string; content: string }[] = [];
  let m: RegExpExecArray | null;
  let lastIdx = 0;
  let lastTitle = "";
  while ((m = re.exec(text)) !== null) {
    if (lastTitle) {
      sections.push({ title: lastTitle, content: text.slice(lastIdx, m.index).trim() });
    }
    lastTitle = m[1].trim();
    lastIdx = m.index + m[0].length;
  }
  if (lastTitle) {
    sections.push({ title: lastTitle, content: text.slice(lastIdx).trim() });
  }
  if (sections.length < 2) return null;
  // 把 section title + 内容前 80 字作为 timeline event
  return sections.map((s, i) => ({
    year: `第 ${i + 1} 段`,
    title: s.title,
    description: s.content.length > 120 ? s.content.slice(0, 120) + "…" : s.content,
    highlight: i === 0,
  }));
}

/** 解析"明永乐四年（1406年）"等历史年份为 timeline */
export function parseYearsToTimeline(text: string): TimelineEvent[] | null {
  if (!text) return null;
  const re = /([东汉|西汉|南北朝|魏晋|隋|唐|宋|元|明|清|北魏|前秦|后秦|五代|辽|金|明初|明中|明末|清初|清中|清末|北宋|南宋]?(?:[初|中|末|早|晚]?)?[\u4e00-\u9fa5]{0,4}(?:元年|二年|三年|四年|五年|六年|七年|八年|九年|十年|十一年|十二年|十三年|十四年|十五年|十六年|十七年|十八年|十九年|二十年)|(\d{2,4})\s*年)/g;
  const events: TimelineEvent[] = [];
  let m: RegExpExecArray | null;
  let lastIdx = 0;
  while ((m = re.exec(text)) !== null) {
    const yearStr = m[1] || (m[2] ? `${m[2]} 年` : "");
    if (!yearStr) continue;
    // 取年份后 60 字作为描述
    const descStart = m.index + m[0].length;
    const desc = text.slice(descStart, descStart + 80).split(/[\n。]/)[0]?.trim() || "";
    if (desc.length < 4) continue;
    events.push({
      year: yearStr,
      title: desc.slice(0, 16) + (desc.length > 16 ? "…" : ""),
      description: desc,
    });
    if (events.length >= 8) break; // 限 8 条
    lastIdx = m.index;
  }
  return events.length >= 2 ? events : null;
}

/** 解析章节标题（第一章、卷一、第一章 等） */
export function parseChapters(text: string): ChapterItem[] | null {
  if (!text) return null;
  const re = /(?:^|\n)\s*(?:第[一二三四五六七八九十百]+(?:章|篇|回|卷|节)|[一二三四五六七八九十]+[、.])\s*([^\n。]{2,30})/g;
  const chapters: ChapterItem[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const title = (m[0] + "").replace(/\s+/g, " ").trim();
    const brief = text.slice(m.index + m[0].length, m.index + m[0].length + 60).split(/[\n。]/)[0]?.trim() || "";
    if (title.length < 4) continue;
    chapters.push({ title, brief: brief.length > 4 ? brief : undefined });
    if (chapters.length >= 12) break;
  }
  return chapters.length >= 2 ? chapters : null;
}

/** 解析工艺流程：寻找 "第一步：xxx / 1. xxx" 等 */
export function parseProcessFlow(text: string): ProcessStep[] | null {
  if (!text) return null;
  const re = /(?:^|\n)\s*(?:(?:第[一二三四五六七八九十]+步|[一二三四五六七八九十]+[、.]|Step\s*\d+))\s*[:：]?\s*([^\n。]{4,60})/g;
  const steps: ProcessStep[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const title = m[1].trim();
    const descStart = m.index + m[0].length;
    const desc = text.slice(descStart, descStart + 80).split(/[\n。]/)[0]?.trim() || "";
    if (title.length < 3) continue;
    steps.push({ title, description: desc.length > 4 ? desc : undefined });
    if (steps.length >= 8) break;
  }
  return steps.length >= 2 ? steps : null;
}

/** 推断主要人物（神话/故事） */
export function parseCharacters(text: string): CharacterInfo[] | null {
  if (!text) return null;
  // 简单正则：人名后接"是"、"为"、"曰" 等谓语
  const re = /([\u4e00-\u9fa5]{2,3})(?:是|为|乃|即|称|谓之|曰|者|，[之])/g;
  const set = new Set<string>();
  const characters: CharacterInfo[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    if (set.has(name)) continue;
    if (["皇帝", "百姓", "众人", "大人", "此时", "于是", "然后", "因为", "因此", "可见", "所以"].includes(name)) continue;
    set.add(name);
    const descStart = Math.max(0, m.index - 30);
    const desc = text.slice(descStart, m.index + 60).trim();
    if (desc.length < 10) continue;
    characters.push({ name, role: "角色", description: desc });
    if (characters.length >= 6) break;
  }
  return characters.length >= 2 ? characters : null;
}

/** 从 region 字符串中匹配城市坐标 */
export function matchCoordinates(region?: string, title?: string): { lat: number; lng: number; name: string } | undefined {
  const text = `${region || ""} ${title || ""}`;
  for (const [key, coord] of Object.entries(CITY_COORDS)) {
    if (text.includes(key)) return coord;
  }
  return undefined;
}

/** 推断人物关系 — 按 brief 关键字分类 */
export function inferRelationships(article: Article): FigureRelationships {
  const result: FigureRelationships = {
    teachers: [],
    friends: [],
    students: [],
    family: [],
  };
  article.relatedPeople?.forEach((p) => {
    const brief = p.brief || "";
    if (/师|teacher|传|受业/i.test(brief)) result.teachers.push(p);
    else if (/弟子|学生|师承|受教/i.test(brief)) result.students.push(p);
    else if (/父|母|子|女|兄|弟|姐|妹|家|族|妻/i.test(brief)) result.family.push(p);
    else result.friends.push(p);
  });
  // 如果全部归到了 friends 没法区分，按名称首字重复判定 family
  if (result.family.length === 0 && result.friends.length >= 2) {
    const surnameGroups: Record<string, RelatedItem[]> = {};
    [...result.teachers, ...result.friends, ...result.students].forEach((p) => {
      const surname = p.title?.[0];
      if (surname) {
        surnameGroups[surname] = surnameGroups[surname] || [];
        surnameGroups[surname].push(p);
      }
    });
    Object.values(surnameGroups).forEach((arr) => {
      if (arr.length >= 2) {
        arr.forEach((p) => {
          result.family.push(p);
          // 从原数组移除
          result.teachers = result.teachers.filter((x) => x.id !== p.id);
          result.friends = result.friends.filter((x) => x.id !== p.id);
          result.students = result.students.filter((x) => x.id !== p.id);
        });
      }
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// 智能推断：给任意 article 输出完整 ExpandedContent
// ---------------------------------------------------------------------------

export function inferExpandedContent(article: Article): ExpandedContent {
  const json = EXPANDED_JSON[article.id];
  const baseContent = (json as any)?.content || article.content || article.bodyExtended || article.excerpt || "";
  const baseHistory = (json as any)?.history || (article as any).history || "";
  const baseInfluence = (json as any)?.influence || (article as any).influence || "";

  const result: ExpandedContent = {
    content: baseContent,
    history: baseHistory,
    influence: baseInfluence,
    _inferred: !json,
    _source: json ? "json" : "article",
  };

  // ---- timeline：优先解析【xxx】小标题，其次年份，最后空 ----
  const sectionsTl = parseSectionsToTimeline(baseContent) || parseSectionsToTimeline(baseHistory);
  const yearTl = parseYearsToTimeline(baseHistory) || parseYearsToTimeline(baseContent);
  result.timeline = sectionsTl || yearTl;

  // ---- chapters ----
  result.chapters = parseChapters(baseContent);

  // ---- craftFlow / principle / craft ----
  result.craftFlow = parseProcessFlow(baseContent);
  result.principle = parseProcessFlow(baseContent);
  result.craft = parseProcessFlow(baseContent);

  // ---- characters (mythology) ----
  result.characters = parseCharacters(baseContent);

  // ---- coordinates ----
  const coords = matchCoordinates(article.region, article.title);
  if (coords) result.coordinates = coords;

  // ---- relationships (figures) ----
  result.relationships = inferRelationships(article);

  // ---- targetDate (festivals) ----
  if (article.tags?.includes("节气") || article.subCategory?.includes("节气") || SOLAR_TERMS_2026[article.title]) {
    const t = SOLAR_TERMS_2026[article.title];
    if (t) {
      const now = new Date();
      let year = now.getFullYear();
      let target = new Date(year, t.month - 1, t.day);
      if (target < now) target = new Date(year + 1, t.month - 1, t.day);
      result.targetDate = target.toISOString();
    }
  }

  // ---- evolution = timeline (复用) ----
  result.evolution = result.timeline;

  // ---- plot (mythology) = timeline + characters ----
  result.plot = result.timeline;

  // ---- spreadRoute / modernContinuations: 留空由后续手工补 ----
  result.modernContinuations = [];

  // ---- relatedFestivals / relatedBuildings / relatedSchools ----
  result.relatedFestivals = (article.relatedEvents || []).filter((e) => e.category === "节日节气");
  result.relatedBuildings = (article.relatedArticles || []).filter((a) => a.category === "建筑古迹");
  result.relatedSchools = (article.relatedBooks || []).filter((b) => b.brief?.match(/学|派|家/));
  result.similarPoems = article.relatedPoems;

  // ---- 关联 timeline 字段全部填上（plot/evolution/spreadRoute 都可共享） ----
  if (result.plot?.length && !result.spreadRoute?.length) {
    result.spreadRoute = result.plot;
  }

  return result;
}

/**
 * 详情页主入口：合并 JSON 扩展数据 + 智能推断
 * 对所有 441+ 文章都能返回完整 ExpandedContent
 */
export function getExpandedContent(article: Article): ExpandedContent {
  if (!article) return null as any;
  return inferExpandedContent(article);
}

/**
 * 仅用 id 获取（向后兼容）
 */
export function getExpandedContentById(id: string): ExpandedContent | null {
  // 优先从 JSON
  const json = EXPANDED_JSON[id];
  if (json) {
    // 补全缺省字段：从 ARTICLES 找原始 article
    const article = (LEGACY_ARTICLES as any[]).find((a) => a.id === id);
    if (article) return inferExpandedContent(article as Article);
    return inferExpandedContent({ id, title: id, category: "festivals", excerpt: "", content: "", favorites: 0, cover: "📜" } as any);
  }
  // 找不到 JSON：构造虚拟 article 触发推断
  const article = (LEGACY_ARTICLES as any[]).find((a) => a.id === id);
  if (article) return inferExpandedContent(article as Article);
  return null;
}

export { EXPANDED_JSON };
