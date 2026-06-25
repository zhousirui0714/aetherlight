/**
 * 经典外链跳转表
 *
 * 设计原则：
 *   - 零爬虫、零侵权、纯外链
 *   - 用户点击 → 第三方网站搜索 → 用户自己选原文
 *   - 三层来源互补：
 *       1. 识典古籍（字节跳动公益）- 现代校注 + AI 助手
 *       2. ctext.org（中国哲学书电子化计划）- 先秦汉学术权威 + 英文
 *       3. 维基文库 - 公有领域古籍原文
 *
 * 适用场景：
 *   - 知识库文章底部"查看原典"
 *   - ancient-books API 响应附带
 *   - 同游/对话引用古文时插入
 */

export interface BookLink {
  /** 经典名（中文） */
  name: string;
  /** 别名（用于匹配） */
  aliases: string[];
  /** 分类 */
  category: "经部" | "史部" | "子部" | "集部" | "蒙学" | "医学" | "哲学" | "诗词";
  /** 简介（30 字内） */
  brief: string;
  /** 在识典古籍搜索 */
  shidianguji: string;
  /** ctext.org 主页（仅先秦汉有） */
  ctext?: string;
  /** 维基文库（如有） */
  wikisource?: string;
}

/**
 * 30+ 部常见典籍跳转表
 * 覆盖先秦至清主要经典
 */
export const ANCIENT_BOOK_LINKS: BookLink[] = [
  // ============ 经部 ============
  { name: "论语", aliases: ["lun yu", "四书"], category: "经部", brief: "孔子与弟子言行录，儒家根本经典",
    shidianguji: "https://www.shidianguji.com/search?q=%E8%AE%BA%E8%AF%AD",
    ctext: "https://ctext.org/analects",
    wikisource: "https://zh.wikisource.org/wiki/Category:論語" },
  { name: "孟子", aliases: ["meng zi", "四书"], category: "经部", brief: "孟轲言行与思想，儒家亚圣之作",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%AD%9F%E5%AD%90",
    ctext: "https://ctext.org/mengzi",
    wikisource: "https://zh.wikisource.org/wiki/Category:孟子" },
  { name: "大学", aliases: ["da xue", "四书"], category: "经部", brief: "四书之首，儒家入门经典",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%A4%A7%E5%AD%A6",
    ctext: "https://ctext.org/liji/da-xue" },
  { name: "中庸", aliases: ["zhong yong", "四书"], category: "经部", brief: "论中正平和之德，四书之一",
    shidianguji: "https://www.shidianguji.com/search?q=%E4%B8%AD%E5%BA%B8",
    ctext: "https://ctext.org/liji/zhong-yong" },
  { name: "诗经", aliases: ["shi jing", "诗三百", "毛诗"], category: "经部", brief: "中国最早的诗歌总集，风雅颂 305 篇",
    shidianguji: "https://www.shidianguji.com/search?q=%E8%AF%97%E7%BB%8F",
    ctext: "https://ctext.org/shijing",
    wikisource: "https://zh.wikisource.org/wiki/Category:詩經" },
  { name: "尚书", aliases: ["shang shu", "书经", "书"], category: "经部", brief: "上古历史文献汇编，佶屈聱牙",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%B0%9A%E4%B9%A6",
    ctext: "https://ctext.org/shang-shu" },
  { name: "礼记", aliases: ["li ji", "小戴礼记"], category: "经部", brief: "儒家礼学论文集，与周礼仪礼合称三礼",
    shidianguji: "https://www.shidianguji.com/search?q=%E7%A4%BC%E8%AE%B0",
    ctext: "https://ctext.org/liji" },
  { name: "周易", aliases: ["zhou yi", "易经", "易"], category: "经部", brief: "群经之首，卜筮与哲学双轨",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%91%A8%E6%98%93",
    ctext: "https://ctext.org/yijing" },
  { name: "春秋", aliases: ["chun qiu", "麟经"], category: "经部", brief: "鲁国编年史，孔子笔削微言大义",
    shidianguji: "https://www.shidianguji.com/search?q=%E6%98%A5%E7%A7%8B",
    ctext: "https://ctext.org/chun-qiu" },
  { name: "左传", aliases: ["zuo zhuan", "左氏春秋"], category: "经部", brief: "春秋三传之一，详于记事",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%B7%A6%E4%BC%A0",
    ctext: "https://ctext.org/zuo-zhuan" },
  { name: "孝经", aliases: ["xiao jing"], category: "经部", brief: "十三经之一，论孝道",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%AD%9D%E7%BB%8F",
    ctext: "https://ctext.org/xiaojing" },

  // ============ 史部 ============
  { name: "史记", aliases: ["shi ji", "太史公书"], category: "史部", brief: "司马迁著，纪传体开山之作",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%8F%B2%E8%AE%B0",
    wikisource: "https://zh.wikisource.org/wiki/Category:史記" },
  { name: "汉书", aliases: ["han shu", "前汉书"], category: "史部", brief: "班固著，首部断代史",
    shidianguji: "https://www.shidianguji.com/search?q=%E6%B1%89%E4%B9%A6" },
  { name: "后汉书", aliases: ["hou han shu"], category: "史部", brief: "范晔著，记东汉史",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%90%8E%E6%B1%89%E4%B9%A6" },
  { name: "三国志", aliases: ["san guo zhi"], category: "史部", brief: "陈寿著，魏蜀吴三国史",
    shidianguji: "https://www.shidianguji.com/search?q=%E4%B8%89%E5%9B%BD%E5%BF%97" },
  { name: "资治通鉴", aliases: ["zi zhi tong jian", "通鉴"], category: "史部", brief: "司马光编年体通史巨著",
    shidianguji: "https://www.shidianguji.com/search?q=%E8%B5%84%E6%B2%BB%E9%80%9A%E9%89%B4" },
  { name: "国语", aliases: ["guo yu"], category: "史部", brief: "春秋国别史，又称春秋外传",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%9B%BD%E8%AF%AD",
    ctext: "https://ctext.org/guoyu" },
  { name: "战国策", aliases: ["zhan guo ce"], category: "史部", brief: "战国时期史料汇编",
    shidianguji: "https://www.shidianguji.com/search?q=%E6%88%98%E5%9B%BD%E7%AD%96",
    ctext: "https://ctext.org/zhanguoce" },

  // ============ 子部 ============
  { name: "道德经", aliases: ["dao de jing", "老子", "五千言"], category: "子部", brief: "老子著，道家根本经典",
    shidianguji: "https://www.shidianguji.com/search?q=%E9%81%93%E5%BE%B7%E7%BB%8F",
    ctext: "https://ctext.org/daodejing",
    wikisource: "https://zh.wikisource.org/wiki/Category:道德經" },
  { name: "庄子", aliases: ["zhuang zi", "南华经"], category: "子部", brief: "庄周著，道家哲思与寓言",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%BA%84%E5%AD%90",
    ctext: "https://ctext.org/zhuangzi",
    wikisource: "https://zh.wikisource.org/wiki/Category:莊子" },
  { name: "论语正义", aliases: [], category: "子部", brief: "刘宝楠注疏《论语》",
    shidianguji: "https://www.shidianguji.com/search?q=%E8%AE%BA%E8%AF%AD%E6%AD%A3%E4%B9%89" },
  { name: "墨子", aliases: ["mo zi"], category: "子部", brief: "墨翟著，墨家思想总集",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%A2%A8%E5%AD%90",
    ctext: "https://ctext.org/mozi" },
  { name: "荀子", aliases: ["xun zi"], category: "子部", brief: "荀况著，先秦儒家集大成",
    shidianguji: "https://www.shidianguji.com/search?q=%E8%8D%80%E5%AD%90",
    ctext: "https://ctext.org/xunzi" },
  { name: "韩非子", aliases: ["han fei zi"], category: "子部", brief: "韩非著，法家集大成",
    shidianguji: "https://www.shidianguji.com/search?q=%E9%9F%A9%E9%9D%9E%E5%AD%90",
    ctext: "https://ctext.org/hanfeizi" },
  { name: "楚辞", aliases: ["chu ci", "屈赋"], category: "集部", brief: "屈原等楚地诗歌总集",
    shidianguji: "https://www.shidianguji.com/search?q=%E6%A5%9A%E8%BE%9E",
    wikisource: "https://zh.wikisource.org/wiki/Category:楚辭" },
  { name: "离骚", aliases: ["li sao"], category: "集部", brief: "屈原代表作，中国浪漫主义文学源头",
    shidianguji: "https://www.shidianguji.com/search?q=%E7%A6%BB%E9%AA%9A",
    ctext: "https://ctext.org/chu-ci/li-sao" },
  { name: "九章算术", aliases: ["jiu zhang suan shu"], category: "子部", brief: "中国古代数学经典",
    shidianguji: "https://www.shidianguji.com/search?q=%E4%B9%9D%E7%AB%A0%E7%AE%97%E6%9C%AF" },

  // ============ 集部 ============
  { name: "全唐诗", aliases: ["quan tang shi"], category: "诗词", brief: "清代官修唐诗总集，收 4.9 万首",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%85%A8%E5%94%90%E8%AF%97" },
  { name: "唐诗三百首", aliases: ["tang shi san bai shou"], category: "诗词", brief: "蘅塘退士编唐诗选本",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%94%90%E8%AF%97%E4%B8%89%E7%99%BE%E9%A6%96" },
  { name: "宋词三百首", aliases: ["song ci san bai shou"], category: "诗词", brief: "上彊村民编宋词选本",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%AE%8B%E8%AF%8D%E4%B8%89%E7%99%BE%E9%A6%96" },
  { name: "楚辞集注", aliases: [], category: "集部", brief: "朱熹注《楚辞》",
    shidianguji: "https://www.shidianguji.com/search?q=%E6%A5%9A%E8%BE%9E%E9%9B%86%E6%B3%A8" },

  // ============ 蒙学 ============
  { name: "三字经", aliases: ["san zi jing"], category: "蒙学", brief: "蒙学经典，三字一句",
    shidianguji: "https://www.shidianguji.com/search?q=%E4%B8%89%E5%AD%97%E7%BB%8F",
    ctext: "https://ctext.org/three-character-classic",
    wikisource: "https://zh.wikisource.org/wiki/三字經" },
  { name: "千字文", aliases: ["qian zi wen"], category: "蒙学", brief: "千字不重复的蒙学韵文",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%8D%83%E5%AD%97%E6%96%87" },
  { name: "弟子规", aliases: ["di zi gui"], category: "蒙学", brief: "清代蒙学礼仪规范",
    shidianguji: "https://www.shidianguji.com/search?q=%E5%BC%9F%E5%AD%90%E8%A7%84" },

  // ============ 医学 ============
  { name: "黄帝内经", aliases: ["huang di nei jing"], category: "医学", brief: "中医理论奠基之作",
    shidianguji: "https://www.shidianguji.com/search?q=%E9%BB%84%E5%B8%9D%E5%86%85%E7%BB%8F" },
  { name: "伤寒论", aliases: ["shang han lun"], category: "医学", brief: "张仲景著，中医临床奠基",
    shidianguji: "https://www.shidianguji.com/search?q=%E4%BC%A4%E5%AF%92%E8%AE%BA" },
  { name: "本草纲目", aliases: ["ben cao gang mu"], category: "医学", brief: "李时珍著，药学百科全书",
    shidianguji: "https://www.shidianguji.com/search?q=%E6%9C%AC%E8%8D%89%E7%BA%B2%E7%9B%AE" },

  // ============ 文学 ============
  { name: "红楼梦", aliases: ["hong lou meng", "石头记"], category: "集部", brief: "曹雪芹著，中国古典小说巅峰",
    shidianguji: "https://www.shidianguji.com/search?q=%E7%BA%A2%E6%A5%BC%E6%A2%A6",
    ctext: "https://ctext.org/hongloumeng" },
  { name: "三国演义", aliases: ["san guo yan yi"], category: "集部", brief: "罗贯中著，历史演义小说",
    shidianguji: "https://www.shidianguji.com/search?q=%E4%B8%89%E5%9B%BD%E6%BC%94%E4%B9%89",
    ctext: "https://ctext.org/sanguo-yanyi" },
  { name: "水浒传", aliases: ["shui hu zhuan"], category: "集部", brief: "施耐庵著，英雄传奇小说",
    shidianguji: "https://www.shidianguji.com/search?q=%E6%B0%B4%E6%B5%92%E4%BC%A0" },
  { name: "西游记", aliases: ["xi you ji"], category: "集部", brief: "吴承恩著，神魔小说巅峰",
    shidianguji: "https://www.shidianguji.com/search?q=%E8%A5%BF%E6%B8%B8%E8%AE%B0" },
];

/** 按名称快速查找 */
const linksByName = new Map<string, BookLink>();
for (const link of ANCIENT_BOOK_LINKS) {
  linksByName.set(link.name, link);
  for (const alias of link.aliases) {
    linksByName.set(alias, link);
  }
}

/** 查找典籍链接（支持别名） */
export function findBookLink(name: string): BookLink | null {
  if (!name) return null;
  const trimmed = name.trim();
  // 精确匹配
  if (linksByName.has(trimmed)) return linksByName.get(trimmed)!;
  // 包含匹配（输入"论语正义"也能找到"论语"）
  for (const link of ANCIENT_BOOK_LINKS) {
    if (trimmed.includes(link.name) || link.aliases.some((a) => trimmed.includes(a))) {
      return link;
    }
  }
  return null;
}

/** 按分类筛选 */
export function getBookLinksByCategory(category: BookLink["category"]): BookLink[] {
  return ANCIENT_BOOK_LINKS.filter((l) => l.category === category);
}
