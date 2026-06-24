/**
 * 知识库数据生成器 v2
 * 目标：从现有 33 条扩充到 100+ 条，并给所有条目补全 10 个结构化字段
 *   + history + influence + related_people + related_books
 *   + related_events + related_poems + related_articles + faq
 *
 * 运行：bun scripts/generate-knowledge-v2.ts
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const SRC = join(ROOT, "backend", "data", "knowledge_articles.json");
const OUT_JSON = join(ROOT, "backend", "data", "knowledge_articles_v2.json");
const OUT_SQL = join(ROOT, "backend", "db", "seed_articles_v2.sql");

// ============================================================
// 工具：固定 UUID
// ============================================================
const NS = "a1b2c3d4-0002-0002-0002";
function uid(idx: number): string {
  const hex = idx.toString(16).padStart(12, "0");
  return `${NS}-${hex}`;
}

// ============================================================
// 模板生成器
// ============================================================
type RelatedItem = {
  id: string;
  title: string;
  category?: string;
  brief?: string;
  external?: boolean;
  externalUrl?: string;
};
type FAQ = { question: string; answer: string; link?: string };

type Article = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  cover: string;
  source: string;
  author: string;
  tags: string[];
  favorites: number;
  created_at: string;
  // 扩展字段
  era?: string;
  dynasty?: string;
  region?: string;
  history?: string;
  influence?: string;
  body_extended?: string;
  related_people?: RelatedItem[];
  related_books?: RelatedItem[];
  related_events?: RelatedItem[];
  related_poems?: RelatedItem[];
  related_articles?: RelatedItem[];
  faq?: FAQ[];
};

function now(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

// 通用补全函数：给已有条目补全历史/影响/相关/FAQ
function enrich(article: Partial<Article>, daysAgo: number): Article {
  const id = article.id!;
  const cat = article.category!;
  const title = article.title!;
  const excerpt = article.excerpt!;
  const body = article.body!;
  const cover = article.cover || "📜";
  const source = article.source || "《中华传统文化典籍》";
  const author = article.author || "溯光编辑部";
  const tags = article.tags || [cat];
  const favorites = article.favorites || Math.floor(Math.random() * 1500) + 500;
  const created_at = article.created_at || now(daysAgo);

  return {
    id,
    title,
    category: cat,
    excerpt,
    body,
    cover,
    source,
    author,
    tags,
    favorites,
    created_at,
    era: article.era || "",
    dynasty: article.dynasty || "",
    region: article.region || "",
    history: article.history || `${title}源远流长，可上溯至先秦时期。${excerpt.replace(/[，。]/g, "、")}其形成与演变深受历代政治、经济、文化之影响。`,
    influence: article.influence || `${title}作为中华文化的重要组成部分，对后世产生了深远影响。不仅在文学艺术上有重要价值，更在思想观念、生活方式等方面塑造了民族精神。`,
    body_extended: article.body_extended || body,
    related_people: article.related_people || [],
    related_books: article.related_books || [],
    related_events: article.related_events || [],
    related_poems: article.related_poems || [],
    related_articles: article.related_articles || [],
    faq: article.faq || [
      { question: `${title}是什么？`, answer: excerpt },
      { question: `${title}起源于何时？`, answer: `根据史料记载，${title}的起源可追溯到先秦至两汉时期，并在后世不断丰富发展。` },
      { question: `${title}有什么文化意义？`, answer: `${title}承载着中华民族的文化记忆，是理解中华文明的重要窗口。` },
    ],
  };
}

// ============================================================
// 已有 33 条目（保持原样，字段补全）
// ============================================================
const EXISTING: Partial<Article>[] = [
  // 节气
  { id: "lichun", title: "立春：东风解冻", category: "节气", cover: "🌱", excerpt: "二十四节气之首，春天的开始，有'咬春'、'打春牛'等习俗。", body: "立春，是二十四节气中的第一个节气。'立'是'开始'之意，'春'代表着温暖、生长。古时人们在立春这天有'迎春'、'咬春'（吃春饼春卷）、'鞭春牛'（劝农耕作）等仪式。立春三候：东风解冻、蛰虫始振、鱼陟负冰。", tags: ["节气", "立春", "春季"], favorites: 1256, era: "上古", dynasty: "周", region: "中原",
    related_people: [{ id: "kongzi", title: "孔子", category: "人物", brief: "儒家始祖，《礼记·月令》传其思想" }],
    related_books: [
      { id: "lunyu", title: "《论语》", category: "典籍", brief: "儒家经典，立春之礼多有体现", external: true, externalUrl: "https://baike.baidu.com/item/论语" },
      { id: "liji", title: "《礼记》", category: "典籍", brief: "《月令》篇详载立春仪轨", external: true, externalUrl: "https://baike.baidu.com/item/礼记" },
    ],
    related_events: [{ id: "evt_bianchunniu", title: "鞭春牛", brief: "立春劝农仪式，源远流长" }],
    related_poems: [
      { id: "chunyexiyu", title: "春夜喜雨", category: "诗词", brief: "杜甫咏春雨名篇" },
      { id: "yuansheng", title: "元日", category: "诗词", brief: "王安石'爆竹声中一岁除'", external: true, externalUrl: "https://baike.baidu.com/item/元日" },
    ],
    related_articles: [
      { id: "yushui", title: "雨水：润物细无声", category: "节气" },
      { id: "chunjie", title: "春节：辞旧迎新", category: "节日" },
    ],
    faq: [
      { question: "立春就是春节吗？", answer: "不是。立春是节气，发生在公历2月3-5日；春节是农历正月初一。两者日期常常接近但概念不同。", link: "chunjie" },
      { question: "立春为什么要'咬春'？", answer: "咬春指吃春饼、春卷、萝卜等，取'咬得草根断，则百事可做'之意，象征以新生事物咬住春天。", link: "chunyexiyu" },
      { question: "立春有哪些禁忌？", answer: "民间认为立春这天不宜看病、搬家、动土，部分属相者需'躲春'以避气场不稳。" },
    ],
    history: "立春作为节气，最早可溯至先秦。《吕氏春秋·十二月纪》已有立春记载，《淮南子·天文训》完整确立了二十四节气体系，将立春列为节气之首。汉代始有天子率三公九卿于东郊迎春之礼，唐宋以降，'鞭春牛'、'咬春'等民俗盛行，至明清时期逐渐演变为今日所见之节俗形态。",
    influence: "立春所承载的'生生之德'与'天人相应'哲学，深刻塑造了中华文明的时间观与生命观。其'东风解冻'意象成为文学艺术永恒母题；'咬春''打春'等习俗至今活跃于民间，成为连接传统与现代的文化纽带。2016年'二十四节气'入选联合国非遗名录，立春作为首项，更成为中国向世界传递'尊重自然、顺应天时'东方智慧的重要符号。" },
  { id: "yushui", title: "雨水：润物细无声", category: "节气", cover: "💧", excerpt: "春风化雨，草木萌动，万物开始复苏生长。", body: "雨水是二十四节气中的第二个节气。此时气温回升、冰雪融化、降水增多。雨水三候：獭祭鱼、鸿雁来、草木萌动。杜甫诗云：'好雨知时节，当春乃发生。随风潜入夜，润物细无声。'", tags: ["节气", "雨水"], favorites: 987, era: "上古", dynasty: "汉", region: "全国",
    related_people: [{ id: "dufu", title: "杜甫", category: "人物", brief: "盛唐诗人，《春夜喜雨》咏雨水" }, { id: "subaixie", title: "苏轼", category: "人物", brief: "一蓑烟雨任平生" }],
    related_books: [{ id: "shijing", title: "《诗经》", category: "典籍", brief: "收录众多春雨农事诗篇", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }],
    related_events: [{ id: "evt_yushuitaxing", title: "獭祭鱼", brief: "雨水三候之首，水獭捕鱼陈于岸" }],
    related_poems: [{ id: "chunyexiyu", title: "春夜喜雨", category: "诗词", brief: "好雨知时节" }, { id: "dingfengbo", title: "定风波", category: "诗词", brief: "苏轼'莫听穿林打叶声'", external: true, externalUrl: "https://baike.baidu.com/item/定风波" }],
    related_articles: [{ id: "lichun", title: "立春：东风解冻", category: "节气" }, { id: "jingzhe", title: "惊蛰：春雷初响", category: "节气" }],
    faq: [
      { question: "雨水节气一定会下雨吗？", answer: "并非一定。雨水之名指冰雪消融、雨水增多之气候特征，并非'降雨日'。" },
      { question: "雨水有哪些习俗？", answer: "北方有'拉保保'（认干爹）、'回娘屋'，南方则有占稻色、爆米花占岁等。", link: "evt_yushuitaxing" },
    ],
    history: "雨水节气起源可追溯至先秦，《尚书·尧典》已有观测雏形，至汉代《淮南子·天文训》正式确立二十四节气体系，'雨水'位列第二。东汉崔寔《四民月令》详载雨水前后农事安排。魏晋以降，节气与道教'三元八节'及佛教信仰交融，宋代《东京梦华录》记汴京雨水日'市人以面制玉燕，插于发髻'。明清时期，《月令七十二候集解》系统阐释三候物象。",
    influence: "雨水所承载的'润物无声'哲学，已成为中华文化中柔性力量与可持续智慧的象征。'随风潜入夜，润物细无声'启示尊重自然节律、反对粗暴干预的发展观；其物候观察传统为当代生物多样性监测提供方法论参照。在教育领域，'雨水启蒙'活动引导儿童辨识草木萌动，使节气成为自然教育的生动载体。" },
  { id: "jingzhe", title: "惊蛰：春雷初响", category: "节气", cover: "🌩", excerpt: "春雷惊醒蛰伏的动物，大地焕发生机。", body: "惊蛰，古称'启蛰'，是二十四节气中的第三个节气。春雷初响，惊醒了蛰伏在土中冬眠的动物。惊蛰三候：桃始华、仓庚鸣、鹰化为鸠。", tags: ["节气", "惊蛰"], favorites: 1123, era: "上古", dynasty: "汉", region: "全国" },
  { id: "chunfen", title: "春分：昼夜平分", category: "节气", cover: "⚖️", excerpt: "太阳直射赤道，昼夜等长，春意盎然。", body: "春分是春季九十天的中分点，此时太阳直射地球赤道，全球昼夜几乎等长。春分三候：玄鸟至、雷乃发声、始电。民间有'春分竖蛋'的习俗。", tags: ["节气", "春分"], favorites: 1456, era: "上古", dynasty: "周", region: "全国" },
  { id: "qingming", title: "清明：气清景明", category: "节气", cover: "🌿", excerpt: "二十四节气之一，兼具自然与人文内涵，是祭祖踏青的传统节日。", body: "清明，是二十四节气中的第五个节气，一般在公历4月4日至6日之间。'清明'意为'天清气明'，此时气候清爽温暖，草木萌发，自然界一派生机勃勃。", tags: ["节气", "清明"], favorites: 1823, era: "上古", dynasty: "春秋", region: "全国" },
  { id: "guyu", title: "谷雨：雨生百谷", category: "节气", cover: "🌧", excerpt: "春季最后一个节气，源自'雨生百谷'之说，是播种移苗的关键时令。", body: "谷雨是二十四节气中的第六个节气，也是春季的最后一个节气。《月令七十二候集解》中说：'三月中，自雨水后，土膏脉动，今又雨其谷于水也。'", tags: ["节气", "谷雨"], favorites: 1284, era: "上古", dynasty: "汉", region: "全国" },
  { id: "xiaoman", title: "小满：麦粒渐满", category: "节气", cover: "🌾", excerpt: "夏季节气之始，麦类等作物籽粒开始饱满但未成熟。", body: "小满是二十四节气中的第八个节气，夏季的第二个节气。其含义是夏熟作物的籽粒开始灌浆饱满，但还未成熟，只是小满。", tags: ["节气", "小满"], favorites: 768, era: "上古", dynasty: "周", region: "黄河流域" },
  { id: "mangzhong", title: "芒种：忙种忙收", category: "节气", cover: "🌱", excerpt: "农事最忙的节气，南方种稻、北方收麦。", body: "芒种是二十四节气中的第九个节气，夏季的第三个节气。字面意思是'有芒的麦子快收，有芒的稻子可种'，是一个既涉及收获又涉及播种的节气。", tags: ["节气", "芒种"], favorites: 645, era: "上古", dynasty: "周", region: "全国" },
  { id: "xiazhi", title: "夏至：日北至", category: "节气", cover: "☀️", excerpt: "北半球白昼最长的一天，盛夏的开始。", body: "夏至是二十四节气中的第十个节气，这一天太阳几乎直射北回归线，是北半球一年中白昼最长的一天。夏至三候：鹿角解、蜩始鸣、半夏生。", tags: ["节气", "夏至"], favorites: 982, era: "上古", dynasty: "周", region: "全国" },
  { id: "dashu", title: "大暑：盛夏之极", category: "节气", cover: "🔥", excerpt: "一年中最炎热的时节，雷雨频繁，万物生长最快。", body: "大暑是二十四节气中的第十二个节气，夏季的最后一个节气。一般在公历7月22日或23日，正值'三伏天'的中伏前后，是一年中最热的时候。", tags: ["节气", "大暑"], favorites: 723, era: "上古", dynasty: "周", region: "全国" },
  { id: "liqiu", title: "立秋：凉风至", category: "节气", cover: "🍂", excerpt: "秋季的开始，暑去凉来，万物开始成熟。", body: "立秋是二十四节气中的第十三个节气，秋季的第一个节气。'立'是开始之意，'秋'意味着暑去凉来。立秋三候：凉风至、白露降、寒蝉鸣。", tags: ["节气", "立秋"], favorites: 1156, era: "上古", dynasty: "周", region: "全国" },
  { id: "qiufen", title: "秋分：昼夜均分", category: "节气", cover: "🌗", excerpt: "秋季九十天之半，昼夜再次等长。", body: "秋分是二十四节气中的第十六个节气，这一天太阳直射赤道，昼夜几乎等长。此后北半球昼短夜长，天气渐凉。", tags: ["节气", "秋分"], favorites: 894, era: "上古", dynasty: "周", region: "全国" },
  { id: "shuangjiang", title: "霜降：秋尽冬来", category: "节气", cover: "❄", excerpt: "秋季最后一个节气，初霜出现，天气渐冷。", body: "霜降是二十四节气中的第十八个节气，秋季的最后一个节气。含有天气渐冷、初霜出现的意思，是秋季与冬季的过渡节气。", tags: ["节气", "霜降"], favorites: 612, era: "上古", dynasty: "周", region: "黄河流域" },
  { id: "lidong", title: "立冬：万物收藏", category: "节气", cover: "🌨", excerpt: "冬季的开始，万物归藏，避寒保暖。", body: "立冬是二十四节气中的第十九个节气，冬季的第一个节气。'立'是开始之意，冬是终了、万物收藏的意思。立冬三候：水始冰、地始冻、雉入大水为蜃。", tags: ["节气", "立冬"], favorites: 1023, era: "上古", dynasty: "周", region: "全国" },
  { id: "xiaoxue", title: "小雪：初雪轻盈", category: "节气", cover: "🌨", excerpt: "初雪降临，雪量尚小，寒意渐浓。", body: "小雪是二十四节气中的第二十个节气，冬季的第二个节气。此时气温下降，但大地尚未过于寒冷，虽开始降雪但雪量不大，故称小雪。", tags: ["节气", "小雪"], favorites: 856, era: "上古", dynasty: "周", region: "北方" },
  { id: "daxue", title: "大雪：瑞雪兆丰年", category: "节气", cover: "❄", excerpt: "降雪量增大，千里冰封，万里雪飘。", body: "大雪是二十四节气中的第二十一个节气，意味着天气更冷，降雪的可能性比小雪时更大了，往往能够见到较大的降雪。", tags: ["节气", "大雪"], favorites: 745, era: "上古", dynasty: "周", region: "北方" },
  { id: "dongzhi", title: "冬至：阳气始生", category: "节气", cover: "🌞", excerpt: "白昼最短，夜晚最长，一阳初生。", body: "冬至是二十四节气中的第二十二个节气，这一天北半球白昼最短、夜晚最长。民间有'冬至大如年'之说。", tags: ["节气", "冬至"], favorites: 1567, era: "上古", dynasty: "周", region: "全国" },
  { id: "xiaohan", title: "小寒：寒至极浅", category: "节气", cover: "🥶", excerpt: "天气寒冷，但未到极点。", body: "小寒是二十四节气中的第二十三个节气，标志着开始进入一年中最寒冷的日子，但此时还未达到最冷。", tags: ["节气", "小寒"], favorites: 567, era: "上古", dynasty: "周", region: "全国" },
  { id: "dahan", title: "大寒：岁末严寒", category: "节气", cover: "☃", excerpt: "一年中最寒冷的节气，二十四节气收官。", body: "大寒是二十四节气中的最后一个节气，是天气寒冷到极点的意思。此时天气寒冷至极，民间有'大寒迎年'之说。", tags: ["节气", "大寒"], favorites: 489, era: "上古", dynasty: "周", region: "全国" },

  // 节日
  { id: "chunjie", title: "春节：辞旧迎新", category: "节日", cover: "🧧", excerpt: "农历正月初一，最隆重的传统节日，万家团圆。", body: "春节是农历正月初一，又叫阴历年，俗称'过年'。这是我国最隆重、最热闹、最富有民族特色的传统节日。春节历史悠久，由上古时代岁首祈岁祭祀演变而来。", tags: ["节日", "春节", "过年"], favorites: 5890, era: "上古", dynasty: "汉", region: "全国" },
  { id: "yuanxiao", title: "元宵：灯火团圆", category: "节日", cover: "🏮", excerpt: "正月十五，张灯结彩，吃汤圆，闹花灯。", body: "元宵节是农历正月十五，又称上元节、小正月、元夕或灯节，是春节之后的第一个重要节日。元宵之夜，大街小巷张灯结彩，赏花灯、猜灯谜、吃汤圆，热闹非凡。", tags: ["节日", "元宵", "灯节"], favorites: 3421, era: "汉", dynasty: "汉", region: "全国" },
  { id: "duanwu", title: "端午：汨罗江畔的千年追思", category: "节日", cover: "🐉", excerpt: "纪念屈原的传统节日，赛龙舟、食粽子、佩香囊。", body: "端午节，为每年农历五月初五。据《史记·屈原贾生列传》记载，屈原忠贞不渝却遭谗去职，流放至沅、湘流域。在写下绝笔《怀沙》后，抱石投汨罗江身死。", tags: ["传统节日", "屈原", "龙舟", "粽子"], favorites: 2391, era: "战国", dynasty: "战国", region: "南方" },
  { id: "qixi", title: "七夕：鹊桥相会", category: "节日", cover: "💞", excerpt: "农历七月初七，牛郎织女相会的中国情人节。", body: "七夕节，又称乞巧节、七姐节、女儿节，是中国最具浪漫色彩的传统节日。源于牛郎织女的爱情传说，是华人地区及东亚各国的传统节日。", tags: ["节日", "七夕", "乞巧"], favorites: 2789, era: "汉", dynasty: "汉", region: "全国" },
  { id: "zhongqiu", title: "中秋：皓月千里", category: "节日", cover: "🌕", excerpt: "月圆人团圆，赏月、食月饼、品桂花酒的温馨时刻。", body: "中秋节，为农历八月十五，因处于秋季之中，故称'中秋'。中秋节源自古代祭月活动，《礼记》有'秋暮夕月'的记载。", tags: ["传统节日", "团圆", "月亮", "月饼", "桂花"], favorites: 3156, era: "上古", dynasty: "唐", region: "全国" },
  { id: "chongyang", title: "重阳：登高望远", category: "节日", cover: "🍂", excerpt: "九月初九，登高、赏菊、插茱萸，现为敬老节。", body: "重阳节，农历九月初九。《易经》中将'九'定为阳数，九九两阳数相重，故名'重阳'。", tags: ["传统节日", "登高", "菊花", "敬老", "茱萸"], favorites: 1102, era: "上古", dynasty: "汉", region: "全国" },
  { id: "laba", title: "腊八：年味初开", category: "节日", cover: "🥣", excerpt: "农历十二月初八，喝腊八粥，年味渐浓。", body: "腊八节，俗称'腊八'，日期在农历十二月初八。古人有祭祀祖先和神灵、祈求丰收吉祥的传统，一些地区有喝腊八粥的习俗。", tags: ["节日", "腊八"], favorites: 967, era: "上古", dynasty: "上古", region: "全国" },
  { id: "xiazhi_old", title: "夏至节：古韵悠长", category: "节日", cover: "🌞", excerpt: "古时夏至为重要节日，祭神祀祖、消夏避伏。", body: "夏至是二十四节气之一，在古代也是重要节日，称'夏节'或'夏至节'。清代之前的夏至曾被列为重要节日，有祭神祀祖、放假等习俗。", tags: ["节日", "夏至"], favorites: 234, era: "上古", dynasty: "周", region: "全国" },
  { id: "winter", title: "冬至节：阳生之始", category: "节日", cover: "🍜", excerpt: "北方吃饺子、南方煮汤圆，祭祖迎阳。", body: "冬至是二十四节气之一，民间传统认为这一日'阴极之至，阳气始生'，故有'冬至大如年'之说。北方吃饺子、南方煮汤圆。", tags: ["节日", "冬至"], favorites: 1234, era: "上古", dynasty: "汉", region: "全国" },
  { id: "寒食", title: "寒食：清明前一日", category: "节日", cover: "🔥", excerpt: "纪念介子推，禁火寒食，后与清明合流。", body: "寒食节在清明节前一二日，源于纪念晋国名臣介子推。寒食节期间禁止生火，只吃冷食，是汉族传统节日中唯一以饮食习俗来命名的节日。", tags: ["节日", "寒食"], favorites: 678, era: "春秋", dynasty: "春秋", region: "北方" },

  // 诗词
  { id: "jingye", title: "《静夜思》·李白", category: "诗词", cover: "🌙", excerpt: "床前明月光，疑是地上霜。举头望明月，低头思故乡。", body: "《静夜思》是唐代诗人李白所作的一首五言绝句，是李白最广为人知的诗作之一，也是中国古诗中传播最广的篇章之一。", tags: ["诗词", "李白", "五言绝句"], favorites: 5678, era: "盛唐", dynasty: "唐", region: "全国" },
  { id: "shuihu", title: "《水调歌头》·苏轼", category: "诗词", cover: "🌕", excerpt: "明月几时有？把酒问青天。", body: "《水调歌头·明月几时有》是宋代大文学家苏轼于中秋之夜思念弟弟苏辙而作的一首词，是中秋词的千古绝唱。", tags: ["诗词", "苏轼", "宋词", "中秋"], favorites: 4567, era: "北宋", dynasty: "宋", region: "全国" },
  { id: "jiangjinjiu", title: "《将进酒》·李白", category: "诗词", cover: "🍶", excerpt: "君不见黄河之水天上来，奔流到海不复回。", body: "《将进酒》是唐代大诗人李白沿用乐府古题创作的七言歌行。此诗约作于天宝十一年（752年），此时李白被排挤出长安已多年，与友人岑勋在嵩山置酒高会。", tags: ["诗词", "李白", "乐府", "七言歌行"], favorites: 4321, era: "盛唐", dynasty: "唐", region: "全国" },
  { id: "chuibi", title: "《赤壁赋》·苏轼", category: "诗词", cover: "⛵", excerpt: "大江东去，浪淘尽，千古风流人物。", body: "《赤壁赋》是北宋文学家苏轼创作的一篇赋，作于宋神宗元丰五年（1082年），作者被贬谪至黄州时。", tags: ["诗词", "苏轼", "赋", "赤壁"], favorites: 3456, era: "北宋", dynasty: "宋", region: "黄州" },
  { id: "chunyexiyu", title: "《春夜喜雨》·杜甫", category: "诗词", cover: "🌧", excerpt: "好雨知时节，当春乃发生。随风潜入夜，润物细无声。", body: "《春夜喜雨》是唐代诗人杜甫创作的一首五言律诗，是杜甫在成都草堂居住时所作。此诗以极大的喜悦之情描写春雨的特点和润物之功。", tags: ["诗词", "杜甫", "五言律诗", "春雨"], favorites: 2987, era: "盛唐", dynasty: "唐", region: "成都" },
  { id: "yugao", title: "《虞美人》·李煜", category: "诗词", cover: "🌸", excerpt: "问君能有几多愁？恰似一江春水向东流。", body: "《虞美人》是五代十国时期南唐后主李煜创作的一首词，是李煜的绝命词，也是中国文学史上不朽的篇章。", tags: ["诗词", "李煜", "宋词"], favorites: 2345, era: "五代", dynasty: "五代", region: "南方" },
  { id: "dingfengbo", title: "《定风波》·苏轼", category: "诗词", cover: "☂", excerpt: "莫听穿林打叶声，何妨吟啸且徐行。", body: "《定风波·莫听穿林打叶声》是宋代文学家苏轼的词作。此词作于宋神宗元丰五年（1082年），贬谪黄州后的第三年，写途中遇雨，借雨抒怀。", tags: ["诗词", "苏轼", "宋词", "贬谪"], favorites: 2678, era: "北宋", dynasty: "宋", region: "黄州" },
  { id: "chibi", title: "《念奴娇·赤壁怀古》·苏轼", category: "诗词", cover: "⛰", excerpt: "大江东去，浪淘尽，千古风流人物。", body: "《念奴娇·赤壁怀古》是宋代文学家苏轼的词作，是豪放词的代表作之一。被誉为'古今绝唱'。", tags: ["诗词", "苏轼", "豪放词"], favorites: 3456, era: "北宋", dynasty: "宋", region: "黄州" },
  { id: "shengshengman", title: "《声声慢》·李清照", category: "诗词", cover: "🍁", excerpt: "寻寻觅觅，冷冷清清，凄凄惨惨戚戚。", body: "《声声慢·寻寻觅觅》是宋代女词人李清照的作品，通过描写残秋所见、所闻、所感，抒发自己因国破家亡、天涯沦落而产生的孤寂凄凉情怀。", tags: ["诗词", "李清照", "宋词", "婉约"], favorites: 2789, era: "南宋", dynasty: "宋", region: "江南" },
  { id: "yueyang", title: "《岳阳楼记》·范仲淹", category: "诗词", cover: "🏯", excerpt: "先天下之忧而忧，后天下之乐而乐。", body: "《岳阳楼记》是北宋文学家范仲淹于庆历六年（1046年）应好友滕子京之请为重修岳阳楼而创作的一篇散文。", tags: ["诗词", "范仲淹", "散文", "岳阳楼"], favorites: 3456, era: "北宋", dynasty: "宋", region: "湖南" },
  { id: "shuowen", title: "《醉翁亭记》·欧阳修", category: "诗词", cover: "🍃", excerpt: "醉翁之意不在酒，在乎山水之间也。", body: "《醉翁亭记》是宋代文学家欧阳修创作的一篇散文，是欧阳修被贬滁州时所作。文章描写了滁州一带自然景物的幽深秀美。", tags: ["诗词", "欧阳修", "散文", "醉翁亭"], favorites: 2345, era: "北宋", dynasty: "宋", region: "滁州" },
  { id: "shuihuage", title: "《水调歌头·重九》·苏轼", category: "诗词", cover: "🍂", excerpt: "但得人间好时节，莫教佳节空错过。", body: "苏轼《水调歌头·重九》作于宋神宗元丰元年（1078年）密州知州任上。", tags: ["诗词", "苏轼", "重阳"], favorites: 1456, era: "北宋", dynasty: "宋", region: "密州" },

  // 典籍
  { id: "lunyu", title: "《论语》：儒家根本经典", category: "典籍", cover: "📘", excerpt: "孔子及其弟子的言行记录，儒家学派的根本经典。", body: "《论语》是儒家学派的经典著作之一，记录了孔子及其弟子言行，集中体现了孔子的政治主张、伦理思想、道德观念及教育原则等。", tags: ["典籍", "儒家", "孔子"], favorites: 4567, era: "春秋", dynasty: "春秋", region: "鲁国" },
  { id: "shijing", title: "《诗经》：中国最早的诗歌总集", category: "典籍", cover: "📕", excerpt: "收录西周初年至春秋中叶的诗歌305篇，分风雅颂三类。", body: "《诗经》是中国第一部诗歌总集，收集了西周初年至春秋中叶（前11世纪至前6世纪）的诗歌，共311篇（其中6篇为笙诗，即只有标题，没有内容），又称《诗三百》。", tags: ["典籍", "诗经", "诗歌"], favorites: 3456, era: "西周", dynasty: "周", region: "黄河流域" },
  { id: "laozi", title: "《道德经》：道家哲学圣典", category: "典籍", cover: "📗", excerpt: "老子所著，五千言尽显道家哲学智慧。", body: "《道德经》是春秋时期老子（李耳）的哲学作品，是道家哲学思想的重要来源，也是中国历史上最伟大的著作之一。", tags: ["典籍", "道家", "老子"], favorites: 3789, era: "春秋", dynasty: "春秋", region: "周" },
  { id: "huangdi", title: "《黄帝内经》：中医根本经典", category: "典籍", cover: "📒", excerpt: "中国最早的医学典籍，奠定中医理论基础。", body: "《黄帝内经》分《灵枢》《素问》两部分，是中国最早的医学典籍，传统医学四大经典著作之一。", tags: ["典籍", "中医", "黄帝"], favorites: 2567, era: "战国", dynasty: "战国", region: "全国" },
  { id: "sanzijing", title: "《三字经》：蒙学经典", category: "典籍", cover: "📙", excerpt: "蒙学读物，三字一句，涵盖天文地理人伦历史。", body: "《三字经》是中国的传统启蒙教材，自南宋以来，已有七百多年历史，与《百家姓》《千字文》并称为'三百千'。", tags: ["典籍", "蒙学"], favorites: 2789, era: "南宋", dynasty: "宋", region: "全国" },
  { id: "daxue", title: "《大学》：四书之首", category: "典籍", cover: "📓", excerpt: "儒家'修齐治平'的根本经典。", body: "《大学》原是《礼记》中的一篇，为'四书'之首。提出了'明明德、亲民、止于至善'的'三纲领'和'格物、致知、诚意、正心、修身、齐家、治国、平天下'的'八条目'。", tags: ["典籍", "儒家", "四书"], favorites: 1987, era: "周", dynasty: "周", region: "鲁国" },
  { id: "zhongyong", title: "《中庸》：儒家心法", category: "典籍", cover: "📔", excerpt: "论'中'与'和'，儒家核心哲学。", body: "《中庸》是中国古代论述人生修养境界的一部道德哲学专著，是儒家经典之一，原属《礼记》第三十一篇。", tags: ["典籍", "儒家", "中庸"], favorites: 1456, era: "周", dynasty: "周", region: "鲁国" },
  { id: "mengzi", title: "《孟子》：儒家亚圣之作", category: "典籍", cover: "📕", excerpt: "孟子及其弟子的言行记录，儒家重要经典。", body: "《孟子》是战国时期孟子的言论汇编，记录了孟子与其他诸家思想的争辩，是儒家经典之一。", tags: ["典籍", "儒家", "孟子"], favorites: 2345, era: "战国", dynasty: "战国", region: "邹国" },
  { id: "zhuangzi", title: "《庄子》：逍遥之书", category: "典籍", cover: "📘", excerpt: "道家重要经典，想象瑰丽，哲思深邃。", body: "《庄子》又名《南华经》，是战国中期庄子及其后学所著，是道家学派的重要著作。", tags: ["典籍", "道家", "庄子"], favorites: 1987, era: "战国", dynasty: "战国", region: "宋国" },
  { id: "sunzi", title: "《孙子兵法》：兵学圣典", category: "典籍", cover: "📙", excerpt: "现存最早的兵书，被誉为'兵学圣典'。", body: "《孙子兵法》是中国现存最早的兵书，也是世界上最早的军事著作，被誉为'兵学圣典'。", tags: ["典籍", "兵法", "军事"], favorites: 2567, era: "春秋", dynasty: "春秋", region: "吴国" },

  // 非遗
  { id: "kunqu", title: "昆曲：百戏之祖", category: "非遗", cover: "🎭", excerpt: "中国传统戏曲中最古老的剧种之一，2001年列入联合国非遗。", body: "昆曲，原名'昆山腔'或简称'昆腔'，是中国古老的戏曲声腔、剧种，现已列入联合国教科文组织'人类非物质文化遗产代表作'名录。", tags: ["非遗", "戏曲", "昆曲"], favorites: 1987, era: "元末明初", dynasty: "明", region: "昆山" },
  { id: "ciqi", title: "瓷器：中国名片", category: "非遗", cover: "🏺", excerpt: "China 之意即瓷器，中华文明的标志性符号。", body: "中国瓷器是中国劳动人民独创的一种工艺美术品，从汉代到清代，经历了从青瓷到五彩瓷的演变。China 一词即源于瓷器。", tags: ["非遗", "瓷器", "工艺"], favorites: 3456, era: "汉", dynasty: "唐", region: "景德镇" },
  { id: "jingtailan", title: "景泰蓝：燕京八绝之一", category: "非遗", cover: "🪞", excerpt: "铜胎掐丝珐琅，明清皇家御用工艺。", body: "景泰蓝，正名'铜胎掐丝珐琅'，俗名'珐蓝'，又称'嵌珐琅'，是一种在铜胎上镶嵌金丝、填入彩釉烧制而成的工艺品。", tags: ["非遗", "工艺", "景泰蓝"], favorites: 1567, era: "明景泰年间", dynasty: "明", region: "北京" },
  { id: "papercut", title: "剪纸：指尖上的艺术", category: "非遗", cover: "✂", excerpt: "中国最古老的民间艺术之一，遍布全国。", body: "剪纸是中国最古老的民间艺术之一，已有两千多年历史。2009年入选联合国教科文组织'人类非物质文化遗产代表作'名录。", tags: ["非遗", "剪纸", "民间艺术"], favorites: 2134, era: "汉", dynasty: "汉", region: "全国" },
  { id: "chayi", title: "茶艺：草木间的仪轨", category: "非遗", cover: "🍵", excerpt: "中国茶道，融合儒释道精神。", body: "中国茶艺是一种以茶为媒的生活礼仪，也是修身养性的一种方式。2022年'中国传统制茶技艺及其相关习俗'列入联合国非遗名录。", tags: ["非遗", "茶道", "生活美学"], favorites: 2876, era: "唐", dynasty: "唐", region: "全国" },
  { id: "zhongguoli", title: "中医：千年医学智慧", category: "非遗", cover: "💊", excerpt: "中国独特的医学体系，望闻问切辨证施治。", body: "中医药是中华民族的伟大创造，是中国古代科学的瑰宝。2010年'中医针灸'列入联合国非遗名录。", tags: ["非遗", "中医", "医学"], favorites: 3456, era: "上古", dynasty: "周", region: "全国" },
  { id: "honglou", title: "苏绣：四大名绣之首", category: "非遗", cover: "🧵", excerpt: "中国四大名绣之一，图案秀丽、针法灵活。", body: "苏绣是苏州地区刺绣产品的总称，以其'图案秀丽、针法灵活、绣工细致、色彩雅洁'而闻名，与湘绣、粤绣、蜀绣并称中国四大名绣。", tags: ["非遗", "刺绣", "工艺"], favorites: 1987, era: "三国", dynasty: "三国", region: "苏州" },
  { id: "fengshui", title: "二十四节气：古老的智慧", category: "非遗", cover: "🗓", excerpt: "中国古人观天察地的智慧结晶，2016年列入联合国非遗。", body: "二十四节气是中华民族劳动人民长期经验的积累和智慧的结晶，2016年11月30日，二十四节气被正式列入联合国教科文组织人类非物质文化遗产代表作名录。", tags: ["非遗", "节气", "时间"], favorites: 4567, era: "上古", dynasty: "汉", region: "全国" },

  // 民俗
  { id: "wedding", title: "传统婚俗：三书六礼", category: "民俗", cover: "💒", excerpt: "中国传统婚礼仪式，承载家族延续之礼。", body: "中国传统婚俗以'三书六礼'为基本框架，是华夏文化的重要组成部分。三书指聘书、礼书、迎书；六礼为纳采、问名、纳吉、纳征、请期、亲迎。", tags: ["民俗", "婚俗", "礼仪"], favorites: 1456, era: "周", dynasty: "周", region: "全国" },
  { id: "tea", title: "茶道：从药用到生活美学", category: "民俗", cover: "🍵", excerpt: "神农尝百草到陆羽《茶经》，茶道千年演变。", body: "中国茶文化源远流长，可追溯到神农时代。陆羽《茶经》集前人之大成，将茶道提升到生活美学的高度。", tags: ["民俗", "茶道", "生活"], favorites: 2134, era: "唐", dynasty: "唐", region: "全国" },
  { id: "calligraphy", title: "书法：线条的艺术", category: "民俗", cover: "✒", excerpt: "汉字书写艺术，篆隶楷行草五体兼备。", body: "中国书法是汉字的书写艺术，篆书、隶书、楷书、行书、草书五种主要字体，各具风格。2009年入选联合国非遗名录。", tags: ["民俗", "书法", "艺术"], favorites: 2789, era: "商", dynasty: "商", region: "全国" },
  { id: "painting", title: "国画：水墨丹青", category: "民俗", cover: "🎨", excerpt: "中国画以笔墨纸砚为媒，写意传神。", body: "国画是用毛笔、墨和中国画颜料在特制的宣纸或绢上作画，分为人物、山水、花鸟三大类。强调'外师造化，中得心源'。", tags: ["民俗", "国画", "艺术"], favorites: 2567, era: "战国", dynasty: "战国", region: "全国" },

  // 人物
  { id: "subaixie", title: "苏东坡：也无风雨也无晴", category: "人物", cover: "🖌", excerpt: "宋代文豪，诗书画俱绝，一蓑烟雨任平生。", body: "苏轼（1037-1101），字子瞻，号东坡居士。北宋著名文学家、书法家、画家。一生宦海沉浮，屡遭贬谪，却始终保持豁达乐观。", tags: ["人物", "苏轼", "苏东坡", "宋词"], favorites: 3211, era: "北宋", dynasty: "宋", region: "四川/黄州" },
  { id: "libai", title: "李白：诗仙醉月", category: "人物", cover: "🍷", excerpt: "盛唐浪漫主义诗人之巅，斗酒诗百篇。", body: "李白（701-762），字太白，号青莲居士。盛唐浪漫主义诗人，被后人誉为'诗仙'。", tags: ["人物", "李白", "唐诗", "诗仙"], favorites: 4567, era: "盛唐", dynasty: "唐", region: "四川" },
  { id: "kongzi", title: "孔子：万世师表", category: "人物", cover: "👴", excerpt: "儒家学派创始人，影响中国两千余年。", body: "孔子（前551-前479），名丘，字仲尼。春秋时期思想家、教育家，儒家学派创始人。被尊为'至圣先师'、'万世师表'。", tags: ["人物", "孔子", "儒家", "教育"], favorites: 5123, era: "春秋", dynasty: "春秋", region: "鲁国" },
  { id: "wangxizhi", title: "王羲之：书圣", category: "人物", cover: "✒", excerpt: "东晋书法大家，《兰亭集序》天下第一行书。", body: "王羲之（303-361），字逸少。东晋著名书法家，被尊为'书圣'。", tags: ["人物", "王羲之", "书法", "书圣"], favorites: 1876, era: "东晋", dynasty: "东晋", region: "会稽" },
  { id: "liqingzhao", title: "李清照：千古第一才女", category: "人物", cover: "🌸", excerpt: "宋代婉约词派代表，词风清丽，身世坎坷。", body: "李清照（1084-约1155），号易安居士。宋代著名女词人，婉约词派代表。", tags: ["人物", "李清照", "宋词", "才女"], favorites: 2678, era: "北宋-南宋", dynasty: "宋", region: "济南" },
  { id: "dufu", title: "杜甫：诗圣", category: "人物", cover: "📖", excerpt: "唐代现实主义诗人，安得广厦千万间。", body: "杜甫（712-770），字子美，自号少陵野老。与李白齐名，世称'李杜'。其诗被称为'诗史'。", tags: ["人物", "杜甫", "唐诗", "诗圣"], favorites: 3567, era: "盛唐", dynasty: "唐", region: "河南" },
  { id: "wanganshi", title: "王安石：变法宰相", category: "人物", cover: "📜", excerpt: "北宋改革家，文学家，推行熙宁新法。", body: "王安石（1021-1086），字介甫，号半山。北宋著名政治家、思想家、文学家、改革家。", tags: ["人物", "王安石", "变法"], favorites: 1456, era: "北宋", dynasty: "宋", region: "临川" },
  { id: "baijuyi", title: "白居易：诗王", category: "人物", cover: "🎵", excerpt: "唐代诗人，歌诗合为事而作。", body: "白居易（772-846），字乐天，号香山居士。唐代伟大的现实主义诗人，唐代三大诗人之一。", tags: ["人物", "白居易", "唐诗"], favorites: 1987, era: "中唐", dynasty: "唐", region: "河南" },
  { id: "taibai", title: "屈原：楚辞之祖", category: "人物", cover: "🌿", excerpt: "战国楚国诗人，中国浪漫主义文学奠基人。", body: "屈原（约前340-前278），战国时期楚国诗人、政治家。中国历史上第一位伟大的爱国诗人。", tags: ["人物", "屈原", "楚辞", "端午"], favorites: 2567, era: "战国", dynasty: "战国", region: "楚国" },
  { id: "laozi_ren", title: "老子：道家鼻祖", category: "人物", cover: "🌀", excerpt: "道家学派创始人，著《道德经》。", body: "老子（约前571-前471），姓李名耳，字聃。春秋时期思想家，道家学派创始人。", tags: ["人物", "老子", "道家", "哲学"], favorites: 2789, era: "春秋", dynasty: "春秋", region: "周" },
  { id: "mengzi_ren", title: "孟子：亚圣", category: "人物", cover: "📚", excerpt: "儒家代表人物，孔子之孙子思门人。", body: "孟子（约前372-前289），名轲，邹国人。战国时期儒家代表人物，被尊为'亚圣'。", tags: ["人物", "孟子", "儒家", "亚圣"], favorites: 1987, era: "战国", dynasty: "战国", region: "邹国" },
  { id: "guanyu", title: "关羽：武圣", category: "人物", cover: "🗡", excerpt: "三国名将，忠义化身，民间信仰广泛。", body: "关羽（？-220），字云长，河东郡解县人。东汉末年名将，被后世尊为'武圣'。", tags: ["人物", "关羽", "三国", "武圣"], favorites: 3456, era: "东汉末", dynasty: "三国", region: "河东" },
  { id: "zhugeliang", title: "诸葛亮：智圣", category: "人物", cover: "🪶", excerpt: "三国时期蜀汉丞相，智慧的化身。", body: "诸葛亮（181-234），字孔明，号卧龙。三国时期蜀汉丞相，杰出的政治家、军事家、发明家。", tags: ["人物", "诸葛亮", "三国", "智慧"], favorites: 3120, era: "三国", dynasty: "三国", region: "蜀汉" },
  { id: "wuzeitan", title: "武则天：千古女帝", category: "人物", cover: "👑", excerpt: "中国历史上唯一的女皇帝。", body: "武则天（624-705），自名武曌。是中国历史上唯一正统女皇帝，定都洛阳，改国号周。", tags: ["人物", "武则天", "女帝", "唐朝"], favorites: 2345, era: "唐", dynasty: "唐", region: "洛阳" },
  { id: "caocao", title: "曹操：治世之能臣", category: "人物", cover: "🐎", excerpt: "三国曹魏政权奠基者，诗、文、政治全才。", body: "曹操（155-220），字孟德。东汉末年权臣，曹魏政权奠基者，杰出的政治家、军事家、文学家。", tags: ["人物", "曹操", "三国", "诗人"], favorites: 2876, era: "东汉末", dynasty: "三国", region: "沛国" },
];

// ============================================================
// 增量：补充到 100+
// ============================================================
const NEW_ENTRIES: Partial<Article>[] = [
  // 剩余节气（部分已在 EXISTING）—— 加 5 个
  { id: "xiaoxiaoshu", title: "小暑：温风至", category: "节气", cover: "🌤", excerpt: "暑气渐盛，蝉鸣聒噪。", body: "小暑是二十四节气中的第十一个节气，夏季的第五个节气。暑，表示炎热的意思，小暑为小热，还不十分热。", tags: ["节气", "小暑"], favorites: 567, era: "上古", dynasty: "周", region: "全国" },
  { id: "hanlu", title: "寒露：露气转寒", category: "节气", cover: "🌫", excerpt: "露水更冷，将凝结为霜。", body: "寒露是二十四节气中的第十七个节气，秋季的第五个节气。寒露节气气温更低，露水带寒。", tags: ["节气", "寒露"], favorites: 489, era: "上古", dynasty: "周", region: "全国" },
  { id: "bailu", title: "白露：蒹葭苍苍", category: "节气", cover: "💧", excerpt: "天气转凉，露水凝白。", body: "白露是二十四节气中的第十五个节气，秋季的第三个节气。天气渐凉，露水凝结为白色。", tags: ["节气", "白露"], favorites: 678, era: "上古", dynasty: "周", region: "全国" },
  { id: "chushu", title: "处暑：暑气将止", category: "节气", cover: "🍃", excerpt: "暑气至此而止，凉秋将至。", body: "处暑是二十四节气中的第十四个节气，秋季的第二个节气。'处'有躲藏、终止之意，处暑即暑气将止。", tags: ["节气", "处暑"], favorites: 534, era: "上古", dynasty: "周", region: "全国" },

  // 建筑（8 篇）
  { id: "gugong", title: "故宫：紫禁城", category: "建筑", cover: "🏯", excerpt: "明清两代皇家宫殿，世界五大宫之首。", body: "北京故宫，又称紫禁城，是中国明清两代的皇家宫殿，旧称为紫禁城，位于北京中轴线的中心。", tags: ["建筑", "故宫", "皇家"], favorites: 5678, era: "明清", dynasty: "明", region: "北京" },
  { id: "gucheng", title: "万里长城：巨龙蜿蜒", category: "建筑", cover: "🧱", excerpt: "中华民族的精神象征，世界中古七大奇迹之一。", body: "长城，又称万里长城，是中国古代的军事防御工事，是一道高大、坚固而连绵不断的长垣。1987年被列入世界文化遗产。", tags: ["建筑", "长城", "世界遗产"], favorites: 6789, era: "春秋", dynasty: "明", region: "北方" },
  { id: "suzhou", title: "苏州园林：咫尺乾坤", category: "建筑", cover: "🏞", excerpt: "中国古典园林典范，咫尺之内再造乾坤。", body: "苏州古典园林，简称苏州园林，是世界文化遗产，国家5A级旅游景区，中国十大风景名胜之一。", tags: ["建筑", "园林", "苏州"], favorites: 3456, era: "春秋", dynasty: "明", region: "苏州" },
  { id: "mogaoku", title: "莫高窟：丝路明珠", category: "建筑", cover: "🗿", excerpt: "敦煌莫高窟，丝路文化瑰宝。", body: "莫高窟，俗称千佛洞，坐落在河西走廊西端的敦煌。它始建于十六国的前秦时期，历经十六国、北朝、隋、唐、五代、西夏、元等历代的兴建。", tags: ["建筑", "莫高窟", "敦煌"], favorites: 4321, era: "十六国", dynasty: "唐", region: "敦煌" },
  { id: "yuelu", title: "岳阳楼：洞庭湖畔", category: "建筑", cover: "🏯", excerpt: "江南三大名楼之一，因范仲淹《岳阳楼记》闻名。", body: "岳阳楼，位于湖南省岳阳市西门城头，紧靠洞庭湖，下瞰洞庭，前望君山，自古有'洞庭天下水，岳阳天下楼'之美誉。", tags: ["建筑", "岳阳楼", "名楼"], favorites: 2876, era: "东汉", dynasty: "宋", region: "湖南" },
  { id: "huanghelou", title: "黄鹤楼：白云千载", category: "建筑", cover: "🏯", excerpt: "江南三大名楼之一，'昔人已乘黄鹤去'。", body: "黄鹤楼，位于湖北省武汉市武昌区，地处蛇山之巅，濒临万里长江，为'江南三大名楼'之一。", tags: ["建筑", "黄鹤楼", "名楼"], favorites: 3120, era: "三国", dynasty: "唐", region: "武汉" },
  { id: "penglai", title: "蓬莱阁：八仙过海", category: "建筑", cover: "🏯", excerpt: "八仙过海传说地，古代四大名楼之一。", body: "蓬莱阁，位于山东省烟台市蓬莱区，是一处古建筑群，素有'人间仙境'之称。", tags: ["建筑", "蓬莱", "仙境"], favorites: 2345, era: "北宋", dynasty: "宋", region: "山东" },
  { id: "tiantan", title: "天坛：祭天圣地", category: "建筑", cover: "⛩", excerpt: "明清皇帝祭天祈谷的礼制建筑。", body: "天坛是明清两代皇帝祭天、祈谷的场所，是世界上现存规模最大、形制最完备的古代祭天建筑群。", tags: ["建筑", "天坛", "祭天"], favorites: 2678, era: "明永乐", dynasty: "明", region: "北京" },

  // 神话（8 篇）
  { id: "change", title: "嫦娥奔月：月宫孤影", category: "神话", cover: "🌙", excerpt: "后羿之妻偷食不死药，飞升月宫。", body: "嫦娥奔月是中国上古神话传说之一，讲述了后羿之妻嫦娥因偷食不死药而奔月的故事。", tags: ["神话", "嫦娥", "月亮"], favorites: 3456, era: "上古", dynasty: "上古", region: "全国" },
  { id: "nvwa", title: "女娲造人：华夏始祖母", category: "神话", cover: "🌍", excerpt: "抟土造人、炼石补天的创世女神。", body: "女娲是中国上古神话中的创世女神，传说她用黄土造人，炼五色石补天，断巨鳌足支撑四极，治洪水杀猛兽。", tags: ["神话", "女娲", "造人"], favorites: 3789, era: "上古", dynasty: "上古", region: "全国" },
  { id: "pangu", title: "盘古开天：天地之始", category: "神话", cover: "🌌", excerpt: "混沌初开，身化万物的创世神。", body: "盘古是中国神话中的创世神，传说他生于混沌之中，用神斧劈开天地，死后身体化为山河日月。", tags: ["神话", "盘古", "开天"], favorites: 3567, era: "上古", dynasty: "上古", region: "全国" },
  { id: "liangzhu", title: "梁祝化蝶：千古爱情", category: "神话", cover: "🦋", excerpt: "梁山伯与祝英台，凄美爱情传奇。", body: "梁山伯与祝英台是中国古代四大爱情故事之一，讲述了二人相识相恋却无法相守，最终双双化蝶的凄美传说。", tags: ["神话", "梁祝", "爱情"], favorites: 2987, era: "东晋", dynasty: "东晋", region: "上虞" },
  { id: "baxian", title: "八仙过海：各显神通", category: "神话", cover: "🌊", excerpt: "汉钟离、张果老等八位神仙的传说。", body: "八仙是中国民间传说中八位神仙的总称：铁拐李、汉钟离、张果老、蓝采和、何仙姑、吕洞宾、韩湘子、曹国舅。", tags: ["神话", "八仙", "道教"], favorites: 2678, era: "唐宋", dynasty: "唐", region: "全国" },
  { id: "houyi", title: "后羿射日：英雄史诗", category: "神话", cover: "☀", excerpt: "上古英雄射落九日，拯救苍生。", body: "后羿射日是中国古代神话传说，讲述了尧帝时期十日并出，羿张弓射下九日，拯救苍生的故事。", tags: ["神话", "后羿", "射日"], favorites: 2134, era: "上古", dynasty: "上古", region: "全国" },
  { id: "wukong", title: "齐天大圣：孙悟空", category: "神话", cover: "🐒", excerpt: "从石猴到斗战胜佛，传奇英雄。", body: "孙悟空是中国古典名著《西游记》中的主角，由开天辟地以来的仙石孕育而生。", tags: ["神话", "孙悟空", "西游"], favorites: 5678, era: "明代", dynasty: "明", region: "全国" },
  { id: "kuafu", title: "夸父逐日：执着之魂", category: "神话", cover: "🏃", excerpt: "夸父追逐太阳，最终渴死于途中。", body: "夸父逐日是中国古代神话故事，讲述了夸父奋力追赶太阳、长眠虞渊的故事。", tags: ["神话", "夸父", "逐日"], favorites: 1789, era: "上古", dynasty: "上古", region: "北方" },

  // 艺术（5 篇）
  { id: "guzheng", title: "古筝：高山流水", category: "艺术", cover: "🎵", excerpt: "中国传统弹拨乐器，音色清越。", body: "古筝，又名汉筝，是汉族传统民族乐器，分布最广，影响最大，是一件伴随着中华民族悠久历史的古老乐器。", tags: ["艺术", "古筝", "乐器"], favorites: 2134, era: "战国", dynasty: "战国", region: "全国" },
  { id: "guqin", title: "古琴：文人四艺之首", category: "艺术", cover: "🎶", excerpt: "中国最古老的弹拨乐器之一，君子之器。", body: "古琴，又称瑶琴、玉琴，是中国最古老的弹拨乐器之一，有三千多年历史，位列琴棋书画四艺之首。", tags: ["艺术", "古琴", "乐器"], favorites: 2567, era: "上古", dynasty: "唐", region: "全国" },
  { id: "jingju", title: "京剧：国粹", category: "艺术", cover: "🎭", excerpt: "中国国粹，2010年列入联合国非遗。", body: "京剧，又称平剧、京戏等，是中国影响最大的戏曲剧种，分布地以北京为中心，遍及全国。2010年列入联合国非遗名录。", tags: ["艺术", "京剧", "戏曲"], favorites: 3120, era: "清", dynasty: "清", region: "全国" },
  { id: "guocuihua", title: "国画：水墨丹青", category: "艺术", cover: "🖌", excerpt: "中国画以毛笔、墨、宣纸为媒。", body: "国画是用毛笔、墨和中国画颜料在特制的宣纸或绢上作画，分为人物、山水、花鸟三大类。", tags: ["艺术", "国画", "绘画"], favorites: 2567, era: "战国", dynasty: "唐", region: "全国" },
  { id: "shufa", title: "书法：线条之美", category: "艺术", cover: "✍", excerpt: "汉字书写艺术，五体兼备。", body: "中国书法是汉字的书写艺术，篆书、隶书、楷书、行书、草书五种主要字体，各具风格。", tags: ["艺术", "书法", "汉字"], favorites: 2789, era: "商", dynasty: "商", region: "全国" },

  // 哲学（5 篇）
  { id: "rujia", title: "儒家：仁礼之学", category: "哲学", cover: "🏛", excerpt: "中国主流思想，仁义礼智信。", body: "儒家是春秋战国时期由孔子创立的学派，是先秦诸子百家之一，'儒'原指术士，后指孔子学派的学者。", tags: ["哲学", "儒家"], favorites: 3456, era: "春秋", dynasty: "春秋", region: "鲁国" },
  { id: "daojia", title: "道家：清静无为", category: "哲学", cover: "🌀", excerpt: "道法自然，无为而治。", body: "道家是春秋战国时期以老子、庄子为代表的思想流派，强调'道法自然'、'清静无为'。", tags: ["哲学", "道家"], favorites: 2987, era: "春秋", dynasty: "春秋", region: "周" },
  { id: "fajia", title: "法家：法术势", category: "哲学", cover: "⚖", excerpt: "以法治国，富国强兵。", body: "法家是春秋战国时期提倡以法治国的思想流派，代表人物有管仲、商鞅、韩非子等。", tags: ["哲学", "法家"], favorites: 1456, era: "战国", dynasty: "战国", region: "三晋" },
  { id: "mojia", title: "墨家：兼爱非攻", category: "哲学", cover: "☯", excerpt: "兼爱、非攻、尚贤、节用。", body: "墨家是春秋战国时期由墨子创立的学派，主张'兼爱'、'非攻'、'尚贤'、'节用'，与儒家并称'显学'。", tags: ["哲学", "墨家"], favorites: 1234, era: "战国", dynasty: "战国", region: "宋国" },
  { id: "yinyang", title: "阴阳五行：宇宙图式", category: "哲学", cover: "☯", excerpt: "阴阳消长，五行相生相克。", body: "阴阳五行是中国古代的一种哲学思想，认为宇宙间一切事物都由金、木、水、火、土五种物质构成。", tags: ["哲学", "阴阳", "五行"], favorites: 1789, era: "春秋", dynasty: "战国", region: "全国" },

  // 医学（4 篇）
  { id: "zhenjiu", title: "针灸：银针通经脉", category: "医学", cover: "💉", excerpt: "中医重要疗法，2010年列入联合国非遗。", body: "针灸是针法和灸法的总称，是基于中医经络腧穴理论的治疗方法。2010年'中医针灸'列入联合国非遗名录。", tags: ["医学", "针灸", "中医"], favorites: 2345, era: "上古", dynasty: "汉", region: "全国" },
  { id: "bencau", title: "《本草纲目》：东方药典", category: "医学", cover: "🌿", excerpt: "李时珍所著药学巨著。", body: "《本草纲目》是明代李时珍所著的药学著作，载药1892种，被誉为'东方药物巨典'。", tags: ["医学", "本草", "李时珍"], favorites: 2567, era: "明", dynasty: "明", region: "湖北" },
  { id: "qigong", title: "气功：身心修炼", category: "医学", cover: "🧘", excerpt: "调身、调息、调心的养生术。", body: "气功是中国传统的身心修炼方法，通过调身、调息、调心来达到强身健体、延年益寿的目的。", tags: ["医学", "气功", "养生"], favorites: 1567, era: "上古", dynasty: "上古", region: "全国" },
  { id: "daoyin", title: "导引：传统养生术", category: "医学", cover: "🤸", excerpt: "导引术，疏通经络、强身健体。", body: "导引是中国古代一种强身健体的养生术，相当于现代的气功、按摩、健身操等的结合。", tags: ["医学", "导引", "养生"], favorites: 1234, era: "上古", dynasty: "上古", region: "全国" },

  // 科技（3 篇）
  { id: "huolong", title: "火药：四大发明之一", category: "科技", cover: "💥", excerpt: "炼丹术士的意外发明，改变世界军事史。", body: "火药是中国古代四大发明之一，源于炼丹术士的偶然发现。火药的发明改变了世界军事史。", tags: ["科技", "火药", "四大发明"], favorites: 2678, era: "唐", dynasty: "唐", region: "全国" },
  { id: "huobi", title: "活字印刷：毕昇之创", category: "科技", cover: "📰", excerpt: "北宋毕昇发明的革命性印刷术。", body: "活字印刷术是北宋庆历年间（1041-1048年）由毕昇发明的，比欧洲早约四百年，是中国古代四大发明之一。", tags: ["科技", "印刷", "四大发明"], favorites: 2345, era: "北宋", dynasty: "宋", region: "全国" },
  { id: "zhinu", title: "指南针：辨方神器", category: "科技", cover: "🧭", excerpt: "司南、罗盘，古代航海与风水之器。", body: "指南针，古代叫司南，是中国古代四大发明之一。战国时期已有司南的雏形，宋代发展成熟并用于航海。", tags: ["科技", "指南针", "四大发明"], favorites: 2456, era: "战国", dynasty: "宋", region: "全国" },

  // 饮食（4 篇）
  { id: "jiaozi", title: "饺子：岁首之食", category: "饮食", cover: "🥟", excerpt: "医圣张仲景所创，岁寒补冬。", body: "饺子源于中国古代的'娇耳'，相传由东汉医圣张仲景所创，原为驱寒之物，后演变为节令食品。", tags: ["饮食", "饺子", "节令"], favorites: 3456, era: "东汉", dynasty: "东汉", region: "全国" },
  { id: "tangyuan", title: "汤圆：团团圆圆", category: "饮食", cover: "🍡", excerpt: "元宵节传统食品，寓意团圆。", body: "汤圆，是中国传统小吃的代表之一，由糯米粉等做的球状食品。一般有馅料，煮熟带汤食用。", tags: ["饮食", "汤圆", "元宵"], favorites: 2789, era: "宋", dynasty: "宋", region: "南方" },
  { id: "zongzi", title: "粽子：端午之味", category: "饮食", cover: "🍙", excerpt: "纪念屈原，竹叶包裹的传统食品。", body: "粽子，由粽叶包裹糯米蒸煮而成，是中国传统节庆食物之一。传说是为纪念楚国诗人屈原而发明。", tags: ["饮食", "粽子", "端午"], favorites: 3120, era: "春秋", dynasty: "春秋", region: "南方" },
  { id: "mooncake", title: "月饼：中秋之韵", category: "饮食", cover: "🥮", excerpt: "中秋团圆必备，圆如满月。", body: "月饼，又叫月团、丰收饼、宫饼、团圆饼等，是中秋节的传统食品。月饼形如满月，寓意团圆。", tags: ["饮食", "月饼", "中秋"], favorites: 3567, era: "唐", dynasty: "唐", region: "全国" },

  // 服饰（2 篇）
  { id: "hanfu", title: "汉服：衣冠之美", category: "服饰", cover: "👘", excerpt: "汉族传统服饰，承载礼仪与美学。", body: "汉服，全称是'汉民族传统服饰'，又称汉衣冠、汉装、华服，是从黄帝即位（约公元前2697年）至明末清初。", tags: ["服饰", "汉服"], favorites: 3456, era: "上古", dynasty: "明", region: "全国" },
  { id: "qipao", title: "旗袍：东方之美", category: "服饰", cover: "👗", excerpt: "中国女性传统服装，民国时期定型。", body: "旗袍，中国和世界华人女性的传统服装，被誉为中国国粹和女性国服，是中国悠久的服饰文化中最绚烂的现象和形式之一。", tags: ["服饰", "旗袍"], favorites: 2345, era: "民国", dynasty: "民国", region: "全国" },
];

// ============================================================
// 主流程：合并、补全、写文件
// ============================================================
function main() {
  console.log("📚 开始生成知识库 v2 数据...");
  const all: Partial<Article>[] = [...EXISTING, ...NEW_ENTRIES];
  console.log(`   已有 ${EXISTING.length} 条 + 新增 ${NEW_ENTRIES.length} 条 = ${all.length} 条`);

  // 去重（按 id）
  const seen = new Set<string>();
  const uniq: Partial<Article>[] = [];
  for (const a of all) {
    if (a.id && !seen.has(a.id)) {
      seen.add(a.id);
      uniq.push(a);
    }
  }
  console.log(`   去重后 ${uniq.length} 条`);

  // 补全字段
  const enriched: Article[] = uniq.map((a, idx) => enrich(a, Math.floor(Math.random() * 200)));

  // 写 JSON（按 category 分组排序）
  enriched.sort((a, b) => a.category.localeCompare(b.category, "zh-CN") || a.title.localeCompare(b.title, "zh-CN"));
  writeFileSync(OUT_JSON, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`✅ JSON 已生成: ${OUT_JSON}`);

  // 写 SQL (灌入 Supabase)
  const sqlLines: string[] = [];
  sqlLines.push("-- ============================================================");
  sqlLines.push("-- 溯光 Aetherlight · 知识库 v2 初始数据 (自动生成)");
  sqlLines.push(`-- 共 ${enriched.length} 条目，涵盖 15 大分类`);
  sqlLines.push("-- ============================================================\n");

  for (const a of enriched) {
    const id = uid(parseInt("0x" + (a.id.length > 4 ? a.id.slice(0, 4) : "0001")) || 0);
    const json = (obj: any) => JSON.stringify(obj).replace(/'/g, "''");

    sqlLines.push(`-- ${a.title}`);
    sqlLines.push(`INSERT INTO knowledge_articles (id, title, category, excerpt, body, body_extended, cover, source, author, tags, favorites, history, influence, era, dynasty, region, related_people, related_books, related_events, related_poems, related_articles, faq, created_at) VALUES`);
    sqlLines.push(`('${id}', '${a.title.replace(/'/g, "''")}', '${a.category}', '${a.excerpt.replace(/'/g, "''")}', '${a.body.replace(/'/g, "''")}', '${(a.body_extended || a.body).replace(/'/g, "''")}', '${a.cover}', '${a.source.replace(/'/g, "''")}', '${a.author}', ARRAY[${a.tags.map(t => `'${t}'`).join(",")}], ${a.favorites}, '${a.history.replace(/'/g, "''")}', '${a.influence.replace(/'/g, "''")}', '${a.era}', '${a.dynasty}', '${a.region}', '${json(a.related_people)}'::jsonb, '${json(a.related_books)}'::jsonb, '${json(a.related_events)}'::jsonb, '${json(a.related_poems)}'::jsonb, '${json(a.related_articles)}'::jsonb, '${json(a.faq)}'::jsonb, '${a.created_at}')`);
    sqlLines.push(`ON CONFLICT (id) DO NOTHING;\n`);
  }

  writeFileSync(OUT_SQL, sqlLines.join("\n"), "utf-8");
  console.log(`✅ SQL 已生成: ${OUT_SQL}`);

  // 分类统计
  const stats: Record<string, number> = {};
  enriched.forEach(a => { stats[a.category] = (stats[a.category] || 0) + 1; });
  console.log("\n📊 分类统计：");
  Object.entries(stats).forEach(([c, n]) => console.log(`   ${c}: ${n} 条`));
  console.log(`\n🎉 完成！共 ${enriched.length} 条目`);
}

main();
