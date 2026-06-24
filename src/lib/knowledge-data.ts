export type Category =
  | "诗词文学"
  | "历史人物"
  | "节日节气"
  | "传统艺术"
  | "传统技艺"
  | "民俗文化"
  | "经典典籍"
  | "建筑古迹"
  | "神话传说";

// 关联条目（可点击跳转到详情）
export interface RelatedItem {
  id: string;             // 跳转目标 ID（文章 id 或外部链接）
  title: string;          // 显示标题
  category?: string;      // 分类（用于展示彩色标签）
  brief?: string;         // 一句话简介
  external?: boolean;     // 是否外部链接（如典籍原文）
  externalUrl?: string;   // 外部链接
}

export interface Article {
  id: string;
  title: string;
  category: Category;
  excerpt: string;
  content: string;
  favorites: number;
  cover: string; // emoji or symbol
  // ===== 静态结构化字段 =====
  source?: string;                  // 出处/文献来源
  history?: string;                 // 历史背景
  // 关联条目（可点击跳转）
  relatedPeople?: RelatedItem[];    // 相关人物
  relatedBooks?: RelatedItem[];     // 相关典籍
  relatedEvents?: RelatedItem[];    // 相关历史事件
  relatedPoems?: RelatedItem[];     // 相关诗词
  relatedArticles?: RelatedItem[];  // 相关文章推荐
  // 保留原有字段
  influence?: string;               // 文化影响
  tutorial?: string[];              // 体验教程/入门步骤
  classics?: string[];              // 经典作品/代表人物
  tips?: string;                    // 欣赏指南/小贴士
}

export const CATEGORIES: ("全部" | Category)[] = [
  "全部",
  "诗词文学",
  "历史人物",
  "节日节气",
  "传统艺术",
  "传统技艺",
  "民俗文化",
  "经典典籍",
  "建筑古迹",
  "神话传说",
];

export const ARTICLES: Article[] = [
  {
    id: "lichun",
    title: "立春：东风解冻",
    category: "节日节气",
    excerpt: "二十四节气之首，春天的开始，有'咬春'、'打春牛'等习俗。",
    content: "立春，是二十四节气中的第一个节气。'立'是'开始'之意，'春'代表着温暖、生长。古时人们在立春这天有'迎春'、'咬春'（吃春饼春卷）、'鞭春牛'（劝农耕作）等仪式。立春三候：东风解冻、蛰虫始振、鱼陟负冰。",
    favorites: 1256,
    cover: "🌱",
    source: "《月令七十二候集解》·《礼记·月令》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，《礼记·月令》传其思想" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家经典，立春之礼多有体现", external: true, externalUrl: "https://baike.baidu.com/item/论语" },
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "收录春日祭祀农事之诗篇", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }
    ],
    relatedEvents: [
      { id: "lichun_evt", title: "鞭春牛", brief: "立春劝农仪式，源远流长" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼春夜望月寄怀", external: true, externalUrl: "https://baike.baidu.com/item/水调歌头·明月几时有" }
    ],
    relatedArticles: [
      { id: "yushui", title: "雨水：润物细无声", category: "节日节气", brief: "立春后的第二个节气" },
      { id: "chunjie", title: "春节：辞旧迎新", category: "节日节气", brief: "立春常与春节相邻" }
    ]
  },
  {
    id: "yushui",
    title: "雨水：润物细无声",
    category: "节日节气",
    excerpt: "春风化雨，草木萌动，万物开始复苏生长。",
    content: "雨水是二十四节气中的第二个节气。此时气温回升、冰雪融化、降水增多。雨水三候：獭祭鱼、鸿雁来、草木萌动。杜甫诗云：'好雨知时节，当春乃发生。随风潜入夜，润物细无声。'",
    favorites: 987,
    cover: "💧",
    source: "《月令七十二候集解》·《礼记·月令》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，多有春雨诗作" },
      { id: "subaixie", title: "苏轼", category: "历史人物", brief: "宋代文豪，写有'一蓑烟雨任平生'" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "收录众多春雨农事诗篇", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }
    ],
    relatedEvents: [
      { id: "yushui_evt", title: "獭祭鱼", brief: "雨水三候之首，水獭捕鱼陈于岸" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放代表诗作" },
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼中秋怀人名作", external: true, externalUrl: "https://baike.baidu.com/item/水调歌头·明月几时有" }
    ],
    relatedArticles: [
      { id: "lichun", title: "立春：东风解冻", category: "节日节气", brief: "雨水前的节气" },
      { id: "jingzhe", title: "惊蛰：春雷初响", category: "节日节气", brief: "雨水后的节气" }
    ]
  },
  {
    id: "jingzhe",
    title: "惊蛰：春雷初响",
    category: "节日节气",
    excerpt: "春雷惊醒蛰伏的动物，大地焕发生机。",
    content: "惊蛰，古称'启蛰'，是二十四节气中的第三个节气。春雷初响，惊醒了蛰伏在土中冬眠的动物。惊蛰三候：桃始华、仓庚鸣、鹰化为鸠。",
    favorites: 1123,
    cover: "🌩",
    source: "《月令七十二候集解》·《夏小正》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，惊蛰多有诗作" }
    ],
    relatedBooks: [
      { id: "huangdi", title: "《黄帝内经》", category: "经典典籍", brief: "中医经典，惊蛰养生多有论述", external: true, externalUrl: "https://baike.baidu.com/item/黄帝内经" }
    ],
    relatedEvents: [
      { id: "jingzhe_evt", title: "祭白虎打小人", brief: "惊蛰传统民俗，驱邪避灾" }
    ],
    relatedPoems: [
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡名篇" }
    ],
    relatedArticles: [
      { id: "yushui", title: "雨水：润物细无声", category: "节日节气", brief: "惊蛰前的节气" },
      { id: "chunfen", title: "春分：昼夜平分", category: "节日节气", brief: "惊蛰后的节气" }
    ]
  },
  {
    id: "chunfen",
    title: "春分：昼夜平分",
    category: "节日节气",
    excerpt: "太阳直射赤道，昼夜等长，春意盎然。",
    content: "春分是春季九十天的中分点，此时太阳直射地球赤道，全球昼夜几乎等长。春分三候：玄鸟至、雷乃发声、始电。民间有'春分竖蛋'的习俗。",
    favorites: 876,
    cover: "⚖️",
    source: "《月令七十二候集解》·《春秋繁露》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，春分有'祭日'之礼" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "记载孔子春分之礼", external: true, externalUrl: "https://baike.baidu.com/item/论语" },
      { id: "huangdi", title: "《黄帝内经》", category: "经典典籍", brief: "中医经典，春分养生之纲", external: true, externalUrl: "https://baike.baidu.com/item/黄帝内经" }
    ],
    relatedEvents: [
      { id: "chunfen_evt", title: "春祭日", brief: "帝王春分祭日之礼，源远流长" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼中秋怀人名作", external: true, externalUrl: "https://baike.baidu.com/item/水调歌头·明月几时有" }
    ],
    relatedArticles: [
      { id: "jingzhe", title: "惊蛰：春雷初响", category: "节日节气", brief: "春分前的节气" },
      { id: "qingming", title: "清明：踏青扫墓", category: "节日节气", brief: "春分后的节气" }
    ]
  },
  {
    id: "qingming",
    title: "清明：踏青扫墓",
    category: "节日节气",
    excerpt: "天清地明，祭扫先人，踏青郊游。",
    content: "清明既是节气也是节日。此时气候清爽温暖，草木始发新枝芽。清明节习俗包括扫墓祭祖、踏青郊游、植树、放风筝等。杜牧诗云：'清明时节雨纷纷，路上行人欲断魂。'",
    favorites: 1567,
    cover: "🌸",
    source: "《月令七十二候集解》·《荆楚岁时记》·《历书》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，传承清明祭祖之礼" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家经典，记载祭祖之礼", external: true, externalUrl: "https://baike.baidu.com/item/论语" },
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "收录春日祭祀诗篇", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }
    ],
    relatedEvents: [
      { id: "qingming_evt", title: "寒食节", brief: "清明前一二日，纪念介子推" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼怀人词作", external: true, externalUrl: "https://baike.baidu.com/item/水调歌头·明月几时有" }
    ],
    relatedArticles: [
      { id: "chunfen", title: "春分：昼夜平分", category: "节日节气", brief: "清明前的节气" },
      { id: "guyu", title: "谷雨：雨生百谷", category: "节日节气", brief: "清明后的节气" },
      { id: "qingmingjie", title: "清明：慎终追远", category: "节日节气", brief: "清明节另一视角" }
    ]
  },
  {
    id: "guyu",
    title: "谷雨：雨生百谷",
    category: "节日节气",
    excerpt: "春季最后一个节气，源自'雨生百谷'之说。",
    content: "谷雨是春季最后一个节气，源自'雨生百谷'之说。谷雨节气的到来意味着寒潮天气基本结束，气温回升加快，大大有利于谷类农作物的生长。古人有'走谷雨'、'喝谷雨茶'、'赏牡丹'等习俗。",
    favorites: 1284,
    cover: "🌧",
    source: "《月令七十二候集解》·《群芳谱》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，多有春雨诗作" }
    ],
    relatedBooks: [
      { id: "huangdi", title: "《黄帝内经》", category: "经典典籍", brief: "中医经典，谷雨养生之纲", external: true, externalUrl: "https://baike.baidu.com/item/黄帝内经" },
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，'道法自然'契合谷雨精神", external: true, externalUrl: "https://baike.baidu.com/item/道德经" }
    ],
    relatedEvents: [
      { id: "guyu_evt", title: "祭仓颉", brief: "谷雨祭祀文字始祖仓颉的传统" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放代表诗作" }
    ],
    relatedArticles: [
      { id: "qingming", title: "清明：踏青扫墓", category: "节日节气", brief: "谷雨前的节气" },
      { id: "chayi", title: "茶事：一盏清欢", category: "民俗文化", brief: "谷雨时节采茶品茶" }
    ]
  },
  {
    id: "duanwu",
    title: "端午：汨罗江畔的千年追思",
    category: "节日节气",
    excerpt: "纪念屈原的传统节日，赛龙舟、食粽子、佩香囊。",
    content: "端午节，为每年农历五月初五。据《史记·屈原贾生列传》记载，屈原忠贞不渝却遭谗去职，流放至沅、湘流域。在写下绝笔《怀沙》后，抱石投汨罗江身死。后人为纪念这位伟大的爱国诗人，便有了赛龙舟、吃粽子、悬艾草等习俗。",
    favorites: 2391,
    cover: "🐉",
    source: "《史记·屈原贾生列传》·《荆楚岁时记》·《风土记》",
    relatedPeople: [
      { id: "quyuan", title: "屈原", category: "历史人物", brief: "战国楚国诗人，端午纪念对象", external: true, externalUrl: "https://baike.baidu.com/item/屈原" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "屈原《离骚》受其影响", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }
    ],
    relatedEvents: [
      { id: "duanwu_evt", title: "屈原投江", brief: "公元前278年，屈原于汨罗江投江" }
    ],
    relatedPoems: [
      { id: "chuibi", title: "出师表", category: "诗词文学", brief: "诸葛亮前出师表，与屈原同为忠臣典范" }
    ],
    relatedArticles: [
      { id: "qingming", title: "清明：踏青扫墓", category: "节日节气", brief: "同为祭祀传统节日" },
      { id: "zhongqiu", title: "中秋：月圆人团圆", category: "节日节气", brief: "同为传统三大节日" },
      { id: "kite", title: "风筝：纸鸢乘风", category: "传统技艺", brief: "传统手工艺" }
    ]
  },
  {
    id: "zhongqiu",
    title: "中秋：月圆人团圆",
    category: "节日节气",
    excerpt: "八月十五月儿圆，赏月、吃月饼、家人团聚。",
    content: "中秋节是中国传统佳节，农历八月十五。此时月亮最圆最亮，象征团圆。中秋节习俗包括赏月、吃月饼、提灯笼、猜灯谜等。苏轼《水调歌头》写尽中秋情怀。",
    favorites: 3123,
    cover: "🥮",
    source: "《礼记·月令》·《唐书·太宗纪》·《东京梦华录》",
    relatedPeople: [
      { id: "subaixie", title: "苏轼", category: "历史人物", brief: "宋代文豪，《水调歌头》写尽中秋情怀" },
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，多有咏月名篇" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "收录'月出皎兮'等咏月诗篇", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }
    ],
    relatedEvents: [
      { id: "change_evt", title: "嫦娥奔月", brief: "中秋神话传说，月宫仙子的故事" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼中秋怀弟名篇" },
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡名篇" }
    ],
    relatedArticles: [
      { id: "duanwu", title: "端午：汨罗江畔的千年追思", category: "节日节气", brief: "同为传统三大节日" },
      { id: "chongyang", title: "重阳：登高望远", category: "节日节气", brief: "同为传统节日" },
      { id: "change", title: "嫦娥奔月：月宫仙子的千年守望", category: "神话传说", brief: "中秋神话" },
      { id: "guqin", title: "古琴：太古之音", category: "传统艺术", brief: "中秋古琴雅集" }
    ]
  },
  {
    id: "chongyang",
    title: "重阳：登高望远",
    category: "节日节气",
    excerpt: "九月初九，登高、赏菊、插茱萸，现为敬老节。",
    content: "重阳节，农历九月初九。《易经》中将'九'定为阳数，九九两阳数相重，故名'重阳'。古人在这一天有登高赏秋、感恩敬老的习俗。王维'遥知兄弟登高处，遍插茱萸少一人'即写此节。",
    favorites: 1102,
    cover: "🍂",
    source: "《易经》·《续齐谐记》·《荆楚岁时记》",
    relatedPeople: [
      { id: "wangxizhi", title: "王羲之", category: "历史人物", brief: "东晋书圣，其家族有'重阳雅集'传统" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "收录秋日登高思亲诗篇", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }
    ],
    relatedEvents: [
      { id: "chongyang_evt", title: "重阳登高", brief: "古人九九登高望远、避灾祈福的传统" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼怀人词作", external: true, externalUrl: "https://baike.baidu.com/item/水调歌头·明月几时有" }
    ],
    relatedArticles: [
      { id: "zhongqiu", title: "中秋：月圆人团圆", category: "节日节气", brief: "同为传统节日" },
      { id: "qingming", title: "清明：踏青扫墓", category: "节日节气", brief: "同为祭祀传统节日" },
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "王羲之《兰亭集序》与重阳雅集相通" }
    ]
  },
  {
    id: "chunjie",
    title: "春节：辞旧迎新",
    category: "节日节气",
    excerpt: "农历新年，贴春联、放鞭炮、守岁、拜年。",
    content: "春节是中华民族最重要的传统节日，农历正月初一。春节习俗包括贴春联、贴窗花、放鞭炮、吃年夜饭、守岁、拜年、发压岁钱等。是全家团圆的日子。",
    favorites: 4521,
    cover: "🧧",
    source: "《尔雅·释天》·《荆楚岁时记》·《东京梦华录》",
    relatedPeople: [
      { id: "wangxizhi", title: "王羲之", category: "历史人物", brief: "东晋书圣，春联始于其题桃符" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家经典，春节礼仪多有体现", external: true, externalUrl: "https://baike.baidu.com/item/论语" }
    ],
    relatedEvents: [
      { id: "chunjie_evt", title: "年兽传说", brief: "春节驱逐年兽、爆竹迎新的民间传说" }
    ],
    relatedPoems: [
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡名篇" }
    ],
    relatedArticles: [
      { id: "lichun", title: "立春：东风解冻", category: "节日节气", brief: "春节常与立春相邻" },
      { id: "honglou", title: "对联：楹联艺术", category: "民俗文化", brief: "春节传统装饰艺术" },
      { id: "papercut", title: "剪纸：纸上生花", category: "传统技艺", brief: "春节贴窗花习俗" }
    ]
  },
  {
    id: "qingmingjie",
    title: "清明：慎终追远",
    category: "节日节气",
    excerpt: "缅怀先烈，祭扫先人，踏青赏春。",
    content: "清明节是重要的祭祀节日，人们扫墓祭祖，缅怀先人。同时也是踏青郊游的好时节，体现了'天人合一'的理念。",
    favorites: 1876,
    cover: "🌿",
    source: "《礼记·祭法》·《清明节文化读本》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，对祭祀之礼有系统论述" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家经典，详述祭祀之礼", external: true, externalUrl: "https://baike.baidu.com/item/论语" }
    ],
    relatedEvents: [
      { id: "qingming_evt2", title: "祭英烈", brief: "清明祭奠革命先烈的现代传统" }
    ],
    relatedPoems: [
      { id: "chuibi", title: "出师表", category: "诗词文学", brief: "诸葛亮忠贞之笔，与慎终追远相通" }
    ],
    relatedArticles: [
      { id: "qingming", title: "清明：踏青扫墓", category: "节日节气", brief: "清明节气另一视角" },
      { id: "guyu", title: "谷雨：雨生百谷", category: "节日节气", brief: "清明后的节气" },
      { id: "chongyang", title: "重阳：登高望远", category: "节日节气", brief: "同为敬亲传统节日" }
    ]
  },
  {
    id: "jingye",
    title: "静夜思·李白",
    category: "诗词文学",
    excerpt: "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
    content: "《静夜思》是唐代诗人李白所作的一首五言古诗。此诗描写了秋日夜晚，诗人于屋内抬头望月的所感。诗中运用比喻、衬托等手法，表达客居思乡之情，语言清新朴素而韵味含蓄无穷，历来广为传诵。",
    favorites: 5612,
    cover: "🌙",
    source: "《李太白全集》·《唐诗三百首》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐浪漫主义诗人，本诗作者" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "中国最早的诗歌总集，五言诗渊源", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }
    ],
    relatedEvents: [
      { id: "jingye_evt", title: "秋夜思乡", brief: "盛唐游子客居他乡的普遍心境" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼中秋怀人名篇" },
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗代表" }
    ],
    relatedArticles: [
      { id: "change", title: "嫦娥奔月：月宫仙子的千年守望", category: "神话传说", brief: "月亮文化的源头" },
      { id: "guqin", title: "古琴：太古之音", category: "传统艺术", brief: "文人雅艺的代表" }
    ]
  },
  {
    id: "shuihu",
    title: "水调歌头·明月几时有",
    category: "诗词文学",
    excerpt: "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。",
    content: "苏轼于宋神宗熙宁九年（1076年）中秋在密州所作。词以月起兴，围绕中秋明月展开想象和思考，把人世间的悲欢离合之情纳入对宇宙人生的哲理性追寻中，反映了作者复杂而又矛盾的思想感情。",
    favorites: 4123,
    cover: "🌕",
    source: "《东坡乐府笺》·《全宋词》",
    relatedPeople: [
      { id: "subaixie", title: "苏轼", category: "历史人物", brief: "宋代文豪，本词作者" },
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，苏轼推崇的'谪仙人'" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家经典，'但愿人长久'与之相通", external: true, externalUrl: "https://baike.baidu.com/item/论语" }
    ],
    relatedEvents: [
      { id: "shuihu_evt", title: "熙宁九年中秋", brief: "苏轼时任密州知州，怀念远在济南的弟弟苏辙" }
    ],
    relatedPoems: [
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡名篇" },
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放代表诗作" }
    ],
    relatedArticles: [
      { id: "zhongqiu", title: "中秋：月圆人团圆", category: "节日节气", brief: "本词创作的中秋背景" },
      { id: "change", title: "嫦娥奔月：月宫仙子的千年守望", category: "神话传说", brief: "月亮文化的源头" },
      { id: "guqin", title: "古琴：太古之音", category: "传统艺术", brief: "中秋古琴雅集" }
    ]
  },
  {
    id: "jiangjinjiu",
    title: "将进酒·李白",
    category: "诗词文学",
    excerpt: "君不见黄河之水天上来，奔流到海不复回。",
    content: "《将进酒》是唐代大诗人李白沿用乐府古题创作的一首诗。此诗思想内容非常深沉，艺术表现非常成熟，在同题作品中影响最大。诗人豪饮高歌，借酒消愁，抒发了忧愤深广的人生感慨。",
    favorites: 3876,
    cover: "🍶",
    source: "《李太白全集》·《乐府诗集》·《唐诗三百首》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐浪漫主义诗人，本诗作者" },
      { id: "subaixie", title: "苏轼", category: "历史人物", brief: "宋代文豪，承袭李白的豪放词风" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "乐府诗远承《诗经》传统", external: true, externalUrl: "https://baike.baidu.com/item/诗经" },
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，影响李白人生哲学", external: true, externalUrl: "https://baike.baidu.com/item/道德经" }
    ],
    relatedEvents: [
      { id: "jiangjinjiu_evt", title: "天宝三载赐金放还", brief: "李白被唐玄宗赐金放还，离开长安" }
    ],
    relatedPoems: [
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡名篇" },
      { id: "chuibi", title: "出师表", category: "诗词文学", brief: "诸葛亮前出师表，豪情相通" }
    ],
    relatedArticles: [
      { id: "chayi", title: "茶事：一盏清欢", category: "民俗文化", brief: "酒与茶，文人生活的两面" },
      { id: "duanwu", title: "端午：汨罗江畔的千年追思", category: "节日节气", brief: "同为诗人精神象征" }
    ]
  },
  {
    id: "chuibi",
    title: "出师表·诸葛亮",
    category: "诗词文学",
    excerpt: "鞠躬尽瘁，死而后已。千古忠臣的赤诚之心。",
    content: "《出师表》是三国时期蜀汉丞相诸葛亮在北伐中原之前给后主刘禅上书的表文。表达了诸葛亮对先帝的知遇之恩的真挚感情和北定中原的决心，以及对后主的殷切期望。",
    favorites: 2345,
    cover: "📝",
    source: "《三国志·蜀书·诸葛亮传》·《文选》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，忠义思想源流" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家'忠君'思想之源", external: true, externalUrl: "https://baike.baidu.com/item/论语" }
    ],
    relatedEvents: [
      { id: "chuibi_evt", title: "诸葛亮北伐", brief: "蜀汉建兴五年至十二年（227-234年）" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗代表" }
    ],
    relatedArticles: [
      { id: "duanwu", title: "端午：汨罗江畔的千年追思", category: "节日节气", brief: "同为忠臣典范的节日纪念" },
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "《出师表》书法名帖众多" }
    ]
  },
  {
    id: "lunyu",
    title: "《论语》：半部治天下",
    category: "经典典籍",
    excerpt: "孔门弟子记述孔子言行的语录体散文集，儒家思想的核心经典。",
    content: "《论语》是儒家学派的经典著作之一，由孔子的弟子及其再传弟子编撰而成。它以语录体和对话文体为主，记录了孔子及其弟子的言行，集中体现了孔子的政治主张、伦理思想、道德观念及教育原则等。",
    favorites: 1893,
    cover: "📜",
    source: "《史记·孔子世家》·《汉书·艺文志》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，《论语》记录其思想" },
      { id: "zhuangzi", title: "庄子", category: "历史人物", brief: "道家代表，与《论语》形成儒道互补" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "儒家五经之一，与《论语》并称", external: true, externalUrl: "https://baike.baidu.com/item/诗经" },
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，与《论语》并为中华双璧", external: true, externalUrl: "https://baike.baidu.com/item/道德经" }
    ],
    relatedEvents: [
      { id: "lunyu_evt", title: "孔子周游列国", brief: "《论语》多记录孔子周游中的言行" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼中秋怀弟名作，'但愿人长久'源出《论语》'仁者寿'" }
    ],
    relatedArticles: [
      { id: "zhongguoli", title: "中国礼：礼仪之邦", category: "民俗文化", brief: "《论语》核心论礼" },
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "《论语》是书法常书内容" }
    ]
  },
  {
    id: "shijing",
    title: "《诗经》：风雅颂的源头",
    category: "经典典籍",
    excerpt: "中国最早的诗歌总集，收录西周至春秋时期诗歌305篇。",
    content: "《诗经》是中国古代诗歌的开端，最早的一部诗歌总集，收集了西周初年至春秋中叶（前11世纪至前6世纪）的诗歌，共311篇。分为《风》《雅》《颂》三部分。'关关雎鸠，在河之洲'已成为千古绝唱。",
    favorites: 2780,
    cover: "🪶",
    source: "《史记·孔子世家》·《毛诗正义》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，编订《诗经》" },
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，远承《诗经》风雅" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家根本经典，与《诗经》并称", external: true, externalUrl: "https://baike.baidu.com/item/论语" }
    ],
    relatedEvents: [
      { id: "shijing_evt", title: "孔子删《诗》", brief: "传说孔子从三千余首诗中删定为三百零五篇" }
    ],
    relatedPoems: [
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡名篇" },
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼中秋怀弟名作" }
    ],
    relatedArticles: [
      { id: "lichun", title: "立春：东风解冻", category: "节日节气", brief: "《诗经》中多有立春农事诗" },
      { id: "qingming", title: "清明：踏青扫墓", category: "节日节气", brief: "《诗经》收录春秋祭祀诗" }
    ]
  },
  {
    id: "laozi",
    title: "《道德经》：道法自然",
    category: "经典典籍",
    excerpt: "道家思想的奠基之作，老子智慧的结晶。",
    content: "《道德经》又称《老子》，是道家学派的经典著作。全书共八十一章，以'道'为核心，阐述了老子的宇宙观、人生观和政治哲学。主张'无为而治'、'道法自然'，对中国文化影响深远。",
    favorites: 2156,
    cover: "☯️",
    source: "《史记·老子韩非列传》·《道德经》",
    relatedPeople: [
      { id: "zhuangzi", title: "庄子", category: "历史人物", brief: "道家代表，承袭并发展《道德经》思想" },
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，深受道家思想影响" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家根本经典，与《道德经》并为中华双璧", external: true, externalUrl: "https://baike.baidu.com/item/论语" },
      { id: "huangdi", title: "《黄帝内经》", category: "经典典籍", brief: "中医经典，深受道家思想影响", external: true, externalUrl: "https://baike.baidu.com/item/黄帝内经" }
    ],
    relatedEvents: [
      { id: "laozi_evt", title: "紫气东来", brief: "传说老子西出函谷关，关令尹喜请其著书" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗作，蕴含道家豪情" }
    ],
    relatedArticles: [
      { id: "fengshui", title: "风水：天人合一", category: "民俗文化", brief: "道家'天人合一'思想的实践" },
      { id: "guqin", title: "古琴：太古之音", category: "传统艺术", brief: "道家精神与古琴相通" }
    ]
  },
  {
    id: "huangdi",
    title: "《黄帝内经》：中医之祖",
    category: "经典典籍",
    excerpt: "中国最早的医学典籍，奠定了中医理论基础。",
    content: "《黄帝内经》是中国最早的医学典籍，相传为黄帝所作。它奠定了人体生理、病理、诊断以及治疗的认识基础，是中国影响极大的一部医学著作，被称为医之始祖。",
    favorites: 1432,
    cover: "🔬",
    source: "《黄帝内经素问》·《灵枢经》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，养生思想部分相通" }
    ],
    relatedBooks: [
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，影响中医理论", external: true, externalUrl: "https://baike.baidu.com/item/道德经" }
    ],
    relatedEvents: [
      { id: "huangdi_evt", title: "岐黄之术", brief: "岐伯与黄帝问答，奠定中医基础" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，亦关注养生" }
    ],
    relatedArticles: [
      { id: "chayi", title: "茶事：一盏清欢", category: "民俗文化", brief: "茶与中医养生密切相关" },
      { id: "laozi", title: "《道德经》：道法自然", category: "经典典籍", brief: "道家思想与中医相通" }
    ]
  },
  {
    id: "kunqu",
    title: "昆曲：百戏之祖",
    category: "传统艺术",
    excerpt: "中国汉族传统戏曲中最古老的剧种之一，2001年列入人类非物质文化遗产。",
    content: "昆曲发源于14世纪苏州昆山，糅合了唱念做表、舞蹈及武术的表演艺术。昆曲以鼓、板控制演唱节奏，以曲笛、三弦等为主要伴奏乐器，唱念语音为'中州韵'。被誉为'百戏之祖'。",
    favorites: 842,
    cover: "🎭",
    history: "昆曲起源于元末明初的江苏昆山一带，距今已有六百余年历史。明代嘉靖年间，魏良辅等人对昆山腔进行改革，融合南北曲之长，创制了细腻婉转的'水磨腔'，使昆曲从此走向全国。明万历年间至清乾隆年间是昆曲的鼎盛时期，风靡大江南北，成为宫廷与文人雅士最钟爱的戏曲形式。",
    influence: "昆曲是中国戏曲艺术的集大成者，被誉为'百戏之祖'、'百戏之师'。它对京剧、越剧、川剧、湘剧等几乎所有中国地方戏曲都产生了深远影响。2001年，昆曲被联合国教科文组织列为首批'人类口头和非物质遗产代表作'。昆曲的文学剧本如《牡丹亭》《长生殿》等，也是中国古典文学的巅峰之作。",
    tutorial: [
      "听腔入门：先从经典唱段入手，推荐《牡丹亭·游园》中的'皂罗袍'，感受水磨腔的婉转细腻",
      "了解行当：熟悉生、旦、净、末、丑五大行当，重点认识巾生（青年书生）与闺门旦（少女）",
      "欣赏身段：注意演员的手眼身法步，昆曲的每一个动作都有规范，如'兰花指'、'水袖功'",
      "阅读剧本：对照原文欣赏，汤显祖的《牡丹亭》是最佳入门剧本，文辞优美如诗",
      "观看演出：线上可搜索江苏省昆剧院、上海昆剧院的演出视频，现场体验更佳"
    ],
    classics: [
      "《牡丹亭》——汤显祖，'情不知所起，一往而深'",
      "《长生殿》——洪昇，唐明皇与杨贵妃的爱情",
      "《桃花扇》——孔尚任，以离合之情写兴亡之感",
      "《西厢记》——王实甫，张生与崔莺莺的爱情故事"
    ],
    tips: "初听昆曲不必急于听懂每句唱词，先感受其声腔之美。昆曲节奏舒缓，适合静心品味，建议选择一个安静的夜晚，泡一壶清茶，慢慢沉浸其中。",
    source: "《辞海·艺术分册》·《昆曲大辞典》·《中国戏曲史》",
    relatedPeople: [
      { id: "tangxianzu", title: "汤显祖", category: "历史人物", brief: "明代戏剧家，《牡丹亭》作者", external: true, externalUrl: "https://baike.baidu.com/item/汤显祖" },
      { id: "subaixie", title: "苏轼", category: "历史人物", brief: "其词作常被昆曲传唱" }
    ],
    relatedBooks: [
      { id: "mudanting", title: "《牡丹亭》", category: "经典典籍", brief: "汤显祖代表作，昆曲巅峰之作", external: true, externalUrl: "https://baike.baidu.com/item/牡丹亭" },
      { id: "changshengdian", title: "《长生殿》", category: "经典典籍", brief: "洪昇代表作，唐明皇与杨贵妃的故事", external: true, externalUrl: "https://baike.baidu.com/item/长生殿" }
    ],
    relatedEvents: [
      { id: "zhongqiu", title: "中秋戏曲雅集", category: "节日节气", brief: "中秋节传统昆曲演出" },
      { id: "chunjie", title: "春节庙会演剧", category: "节日节气", brief: "春节期间各地昆曲表演" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，昆曲常演剧目" },
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白名篇" }
    ],
    relatedArticles: [
      { id: "jingju", title: "京剧：国粹之光", category: "传统艺术", brief: "了解中国戏曲艺术" },
      { id: "guqin", title: "古琴：太古之音", category: "传统艺术", brief: "传统文人雅艺" },
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "中国传统艺术" }
    ]
  },
  {
    id: "ciqi",
    title: "青花瓷：景德镇的蓝白韵律",
    category: "传统技艺",
    excerpt: "以含氧化钴矿物为色料，在白胎上绘画后烧制而成。",
    content: "青花瓷起源于唐宋，成熟于元代景德镇。它用钴料在素胎上绘制纹饰，再罩以透明釉，经高温还原焰一次烧成。其色泽幽靓苍翠，纹饰清新明丽，是中国陶瓷艺术的代表。",
    favorites: 1432,
    cover: "🏺",
    source: "《中国陶瓷史》·《景德镇陶录》·冯先铭《中国陶瓷》",
    relatedPeople: [
      { id: "wangxizhi", title: "王羲之", category: "历史人物", brief: "东晋书法家，青花瓷纹饰常取其书法意趣" }
    ],
    relatedBooks: [
      { id: "taoshuo", title: "《陶说》", category: "经典典籍", brief: "清代朱琰著，陶瓷史专著", external: true, externalUrl: "https://baike.baidu.com/item/陶说" },
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，影响青花瓷美学" }
    ],
    relatedEvents: [
      { id: "chunjie", title: "春节陶瓷展", category: "节日节气", brief: "春节期间各类陶瓷展览" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗作" }
    ],
    relatedArticles: [
      { id: "jingtailan", title: "景泰蓝：皇家工艺", category: "传统技艺", brief: "了解传统金属工艺" },
      { id: "embroidery", title: "刺绣：针尖上的丹青", category: "传统技艺", brief: "传统手工艺" }
    ]
  },
  {
    id: "jingtailan",
    title: "景泰蓝：皇家工艺",
    category: "传统技艺",
    excerpt: "铜胎掐丝珐琅，皇家御用，精美绝伦。",
    content: "景泰蓝，学名铜胎掐丝珐琅，因其在明朝景泰年间盛行且多用蓝色釉料而得名。制作工艺复杂，需经过制胎、掐丝、点蓝、烧蓝、磨光、镀金等多道工序，是中国传统工艺的瑰宝。",
    favorites: 967,
    cover: "🔷",
    source: "《中国传统工艺》·《燕京岁时记》·《故宫博物院院刊》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，景泰蓝纹饰多取其诗意" }
    ],
    relatedBooks: [
      { id: "huangdi", title: "《黄帝内经》", category: "经典典籍", brief: "中医经典，景泰蓝色彩理论受其影响" }
    ],
    relatedEvents: [
      { id: "chunjie", title: "春节工艺展", category: "节日节气", brief: "春节期间传统工艺展览" }
    ],
    relatedPoems: [
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白名篇" }
    ],
    relatedArticles: [
      { id: "ciqi", title: "青花瓷：景德镇的蓝白韵律", category: "传统技艺", brief: "了解青花瓷工艺" },
      { id: "tiehua", title: "铁画：铁打丹青", category: "传统技艺", brief: "另一种金属工艺" }
    ]
  },
  {
    id: "papercut",
    title: "剪纸：纸上生花",
    category: "传统技艺",
    excerpt: "用剪刀或刻刀在纸上剪刻花纹，装点生活。",
    content: "剪纸是一种用剪刀或刻刀在纸上剪刻花纹的民间艺术。它题材广泛，寓意丰富，常用于节庆装饰、婚丧嫁娶等场合。剪纸艺术历史悠久，风格独特，是中国民间艺术的重要组成部分。",
    favorites: 1234,
    cover: "✂️",
    history: "剪纸艺术的历史可追溯至公元六世纪。新疆吐鲁番出土的北朝时期五幅团花剪纸，是目前发现最早的剪纸实物。造纸术发明后，剪纸逐渐普及。唐宋时期，剪纸艺术已非常成熟，用于节日装饰、刺绣花样、祭祀仪礼等。明清时期，剪纸艺术达到鼎盛，各地形成了鲜明的地域风格，如陕北的粗犷豪放、扬州的精巧秀丽、佛山的金碧辉煌。",
    influence: "2009年，中国剪纸被联合国教科文组织列入'人类非物质文化遗产代表作名录'。剪纸不仅是一种装饰艺术，更是中国民间文化的活态载体——每一幅剪纸都承载着祈福、辟邪、繁衍等美好寓意。剪纸的镂空技法影响了中国雕刻、刺绣、皮影等多种艺术形式，其造型语言也深刻影响了中国现代设计。",
    tutorial: [
      "准备工具：一把尖头小剪刀、彩色宣纸或红纸、铅笔、橡皮",
      "折叠起稿：将纸对折（对称剪纸）或四折（团花），用铅笔轻轻画出图案轮廓",
      "剪刻顺序：先剪内部细小部分，再剪外部轮廓，最后剪边缘。保持线条连贯",
      "入门图案：从简单的双喜字、窗花开始，再尝试十二生肖、花卉等复杂图案",
      "装裱保存：完成的剪纸可用透明胶膜覆压，或夹在书页中平整保存"
    ],
    classics: [
      "陕北剪纸——粗犷豪放，造型夸张，代表作者有库淑兰",
      "扬州剪纸——线条流畅，精巧秀丽，以花鸟见长",
      "佛山剪纸——色彩绚丽，常用铜凿、银凿等金属箔",
      "蔚县剪纸——彩色点染，戏曲人物为特色"
    ],
    tips: "初学剪纸最重要的是耐心。剪刀要锋利但动作要轻柔，不要强行扭转纸张。练习时可以先在废纸上画好图案再剪，熟练后便能脱稿创作。红色是最传统的剪纸用色，象征喜庆吉祥。",
    source: "《中国民间剪纸艺术》·《中华民俗大全》·《辞海·艺术分册》",
    relatedPeople: [
      { id: "kushulan", title: "库淑兰", category: "历史人物", brief: "陕北剪纸艺术大师", external: true, externalUrl: "https://baike.baidu.com/item/库淑兰" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "古代诗歌总集，剪纸常取其意境" }
    ],
    relatedEvents: [
      { id: "chunjie", title: "春节贴窗花", category: "节日节气", brief: "春节剪纸贴窗花的习俗" },
      { id: "qingming", title: "清明节气", category: "节日节气", brief: "清明时节民间剪纸" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗作" }
    ],
    relatedArticles: [
      { id: "embroidery", title: "刺绣：针尖上的丹青", category: "传统技艺", brief: "剪纸与刺绣关系密切" },
      { id: "zharian", title: "扎染：布里生花", category: "传统技艺", brief: "传统印染工艺" },
      { id: "honglou", title: "对联：楹联艺术", category: "民俗文化", brief: "春节传统装饰" }
    ]
  },
  {
    id: "chayi",
    title: "茶事：一盏清欢",
    category: "民俗文化",
    excerpt: "从神农尝百草到陆羽《茶经》，茶已成为东方生活美学的代名词。",
    content: "中国是茶的故乡。饮茶之风始于汉，盛于唐，普及于宋。唐代陆羽撰《茶经》，开创茶道。文人雅士品茶论道，演化出'茶道'文化，讲究'和、静、怡、真'四谛。",
    favorites: 1567,
    cover: "🍵",
    source: "《茶经》·《大观茶论》·《茶疏》",
    relatedPeople: [
      { id: "subaixie", title: "苏轼", category: "历史人物", brief: "宋代文豪，有'从来佳茗似佳人'之名句" },
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，多有茶酒诗作" }
    ],
    relatedBooks: [
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，茶道精神与之相通", external: true, externalUrl: "https://baike.baidu.com/item/道德经" },
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家经典，茶礼之本", external: true, externalUrl: "https://baike.baidu.com/item/论语" }
    ],
    relatedEvents: [
      { id: "chayi_evt", title: "陆羽著《茶经》", brief: "唐代陆羽著《茶经》，被尊为'茶圣'" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，多涉茶事" },
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡名篇" }
    ],
    relatedArticles: [
      { id: "guqin", title: "古琴：太古之音", category: "传统艺术", brief: "琴茶一味，文人雅集" },
      { id: "guyu", title: "谷雨：雨生百谷", category: "节日节气", brief: "谷雨时节采茶品茶" },
      { id: "ciqi", title: "青花瓷：景德镇的蓝白韵律", category: "传统技艺", brief: "茶具以青花瓷为代表" }
    ]
  },
  {
    id: "zhongguoli",
    title: "中国礼：礼仪之邦",
    category: "民俗文化",
    excerpt: "周公制礼作乐，礼仪文化贯穿华夏文明。",
    content: "中国素有'礼仪之邦'之称。礼仪文化源远流长，从周公制礼作乐开始，礼便成为社会秩序的基石。传统礼仪包括吉礼、凶礼、军礼、宾礼、嘉礼等，渗透到生活的方方面面。",
    favorites: 1678,
    cover: "🏛",
    source: "《周礼》·《仪礼》·《礼记》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，礼学集大成者" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家核心论礼经典", external: true, externalUrl: "https://baike.baidu.com/item/论语" },
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "儒家经典，多有礼乐诗篇", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }
    ],
    relatedEvents: [
      { id: "zhongguoli_evt", title: "周公制礼作乐", brief: "西周初年周公旦制礼作乐，奠定中华礼乐文明" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，体现礼乐精神" }
    ],
    relatedArticles: [
      { id: "chunjie", title: "春节：辞旧迎新", category: "节日节气", brief: "春节礼俗的集中体现" },
      { id: "honglou", title: "对联：楹联艺术", category: "民俗文化", brief: "楹联是礼仪的载体之一" }
    ]
  },
  {
    id: "honglou",
    title: "对联：楹联艺术",
    category: "民俗文化",
    excerpt: "对仗工整、平仄协调的独特文学形式。",
    content: "对联又称楹联，是写在纸、布上或刻在竹子、木头、柱子上的对偶语句。对仗工整、平仄协调，是中国传统文化瑰宝。春节贴春联是最普遍的习俗。",
    favorites: 1345,
    cover: "📜",
    source: "《楹联丛话》·《对联话》·《春联大全》",
    relatedPeople: [
      { id: "wangxizhi", title: "王羲之", category: "历史人物", brief: "东晋书圣，相传春联源于其题桃符" },
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，对联讲究对偶源出其名分思想" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家经典，对联讲究'文以载道'", external: true, externalUrl: "https://baike.baidu.com/item/论语" }
    ],
    relatedEvents: [
      { id: "honglou_evt", title: "春联起源", brief: "五代后蜀主孟昶题'新年纳余庆，嘉节号长春'为最早春联" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，常被改写为对联" },
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白名篇，对联常取其意" }
    ],
    relatedArticles: [
      { id: "chunjie", title: "春节：辞旧迎新", category: "节日节气", brief: "春节贴春联的习俗" },
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "对联与书法相辅相成" }
    ]
  },
  {
    id: "fengshui",
    title: "风水：天人合一",
    category: "民俗文化",
    excerpt: "研究人与自然环境和谐共处的传统学问。",
    content: "风水是中国传统地理学和环境学的结合，研究如何选择和布置居住环境，以达到人与自然的和谐。其核心思想是'天人合一'，注重山水形胜、方位朝向等因素。",
    favorites: 1890,
    cover: "🏔",
    source: "《葬书》·《地理正宗》·《阳宅十书》",
    relatedPeople: [
      { id: "zhuangzi", title: "庄子", category: "历史人物", brief: "道家代表，'天人合一'思想源头之一" }
    ],
    relatedBooks: [
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，'道法自然'是风水哲学根基", external: true, externalUrl: "https://baike.baidu.com/item/道德经" },
      { id: "huangdi", title: "《黄帝内经》", category: "经典典籍", brief: "中医经典，风水讲究与中医养生相通", external: true, externalUrl: "https://baike.baidu.com/item/黄帝内经" }
    ],
    relatedEvents: [
      { id: "fengshui_evt", title: "郭璞著《葬书》", brief: "东晋郭璞著《葬书》，奠定风水学基础" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，体现自然与人的和谐" }
    ],
    relatedArticles: [
      { id: "suzhou", title: "苏州园林：诗意的栖居", category: "建筑古迹", brief: "园林是风水的艺术化呈现" },
      { id: "gugong", title: "故宫：紫禁城的六百年", category: "建筑古迹", brief: "故宫建筑严格遵循风水理念" }
    ]
  },
  {
    id: "subaixie",
    title: "苏东坡：也无风雨也无晴",
    category: "历史人物",
    excerpt: "宋代文豪，诗书画俱绝，一蓑烟雨任平生。",
    content: "苏轼（1037-1101），字子瞻，号东坡居士。北宋著名文学家、书法家、画家。一生宦海沉浮，屡遭贬谪，却始终保持豁达乐观，留下《赤壁赋》《水调歌头》等不朽名篇。",
    favorites: 3211,
    cover: "🖌",
    source: "《宋史·苏轼传》·《东坡乐府》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，苏轼推崇的'谪仙人'" },
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，影响苏轼人格养成" },
      { id: "zhuangzi", title: "庄子", category: "历史人物", brief: "道家代表，苏轼深受其逍遥思想影响" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家经典，苏轼人格根基", external: true, externalUrl: "https://baike.baidu.com/item/论语" },
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，影响苏轼达观态度", external: true, externalUrl: "https://baike.baidu.com/item/道德经" }
    ],
    relatedEvents: [
      { id: "subaixie_evt", title: "乌台诗案", brief: "1079年，苏轼因诗作被诬下狱" },
      { id: "subaixie_evt2", title: "贬谪黄州", brief: "1080年，苏轼被贬黄州团练副使" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼中秋怀弟名作" },
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗代表" }
    ],
    relatedArticles: [
      { id: "chayi", title: "茶事：一盏清欢", category: "民俗文化", brief: "苏轼有'从来佳茗似佳人'之名句" },
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "苏轼'宋四家'之一" }
    ]
  },
  {
    id: "libai",
    title: "李白：诗仙醉月",
    category: "历史人物",
    excerpt: "盛唐浪漫主义诗人之巅，斗酒诗百篇。",
    content: "李白（701-762），字太白，号青莲居士。盛唐浪漫主义诗人，被后人誉为'诗仙'。其诗豪放飘逸，想象丰富，语言流转自然，音律和谐多变。代表作有《将进酒》《蜀道难》等。",
    favorites: 4567,
    cover: "🍷",
    source: "《新唐书·李白传》·《李太白全集》",
    relatedPeople: [
      { id: "subaixie", title: "苏轼", category: "历史人物", brief: "宋代文豪，承袭李白的豪放诗风" },
      { id: "zhuangzi", title: "庄子", category: "历史人物", brief: "道家代表，李白深受其逍遥思想影响" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "中国诗歌总集，李白诗风渊源之一", external: true, externalUrl: "https://baike.baidu.com/item/诗经" },
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，李白人生哲学根基", external: true, externalUrl: "https://baike.baidu.com/item/道德经" }
    ],
    relatedEvents: [
      { id: "libai_evt", title: "赐金放还", brief: "天宝三载（744年），李白被唐玄宗赐金放还" }
    ],
    relatedPoems: [
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡名篇" },
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗代表" }
    ],
    relatedArticles: [
      { id: "duanwu", title: "端午：汨罗江畔的千年追思", category: "节日节气", brief: "李白多有端午诗作" },
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "李白草书亦有可观" }
    ]
  },
  {
    id: "kongzi",
    title: "孔子：万世师表",
    category: "历史人物",
    excerpt: "儒家学派创始人，影响中国两千余年。",
    content: "孔子（前551-前479），名丘，字仲尼。春秋时期思想家、教育家，儒家学派创始人。被尊为'至圣先师'、'万世师表'。其思想以'仁'为核心，对中国文化影响深远。",
    favorites: 5123,
    cover: "👴",
    source: "《史记·孔子世家》·《论语》",
    relatedPeople: [
      { id: "zhuangzi", title: "庄子", category: "历史人物", brief: "道家代表，与儒家形成互补" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "记载孔子言行的语录体经典", external: true, externalUrl: "https://baike.baidu.com/item/论语" },
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "孔子编订，列为儒家经典", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }
    ],
    relatedEvents: [
      { id: "kongzi_evt", title: "周游列国", brief: "孔子率弟子周游列国十四载" },
      { id: "kongzi_evt2", title: "杏坛讲学", brief: "孔子聚徒讲学于杏坛，开创私学" }
    ],
    relatedPoems: [
      { id: "shijing", title: "《诗经》", category: "诗词文学", brief: "孔子编订的诗歌总集" }
    ],
    relatedArticles: [
      { id: "zhongguoli", title: "中国礼：礼仪之邦", category: "民俗文化", brief: "儒家礼文化的奠基" },
      { id: "chunjie", title: "春节：辞旧迎新", category: "节日节气", brief: "春节礼仪深受儒家影响" }
    ]
  },
  {
    id: "zhuangzi",
    title: "庄子：逍遥游",
    category: "历史人物",
    excerpt: "道家代表人物，追求精神自由的哲人。",
    content: "庄子（约前369-前286），名周。战国时期道家学派代表人物。其思想主张顺应自然、追求精神自由。《庄子》一书想象奇特，文风汪洋恣肆，充满寓言和哲理。",
    favorites: 2345,
    cover: "🦋",
    source: "《史记·老子韩非列传》·《庄子》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，《庄子》中多次出现" },
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，深受庄子逍遥思想影响" }
    ],
    relatedBooks: [
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家根本经典，与《庄子》同源", external: true, externalUrl: "https://baike.baidu.com/item/道德经" }
    ],
    relatedEvents: [
      { id: "zhuangzi_evt", title: "庄周梦蝶", brief: "《齐物论》中'庄周梦为蝴蝶'的著名寓言" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，体现庄子超脱情怀" }
    ],
    relatedArticles: [
      { id: "guqin", title: "古琴：太古之音", category: "传统艺术", brief: "庄子在《齐物论》中论'天籁'" },
      { id: "fengshui", title: "风水：天人合一", category: "民俗文化", brief: "道家'天人合一'思想的实践" }
    ]
  },
  {
    id: "wangxizhi",
    title: "王羲之：书圣",
    category: "历史人物",
    excerpt: "东晋书法大家，《兰亭集序》天下第一行书。",
    content: "王羲之（303-361），字逸少。东晋著名书法家，被尊为'书圣'。其书法风格飘逸灵动，代表作《兰亭集序》被誉为'天下第一行书'。",
    favorites: 1876,
    cover: "✒️",
    source: "《晋书·王羲之传》·《书断》",
    relatedPeople: [
      { id: "subaixie", title: "苏轼", category: "历史人物", brief: "宋代书法家，推崇王羲之" }
    ],
    relatedBooks: [
      { id: "lantingxu", title: "《兰亭集序》", category: "经典典籍", brief: "天下第一行书，王羲之代表作", external: true, externalUrl: "https://baike.baidu.com/item/兰亭集序" }
    ],
    relatedEvents: [
      { id: "wangxizhi_evt", title: "兰亭雅集", brief: "东晋永和九年（353年）王羲之与名士的修禊盛会" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，常被书法家书写" }
    ],
    relatedArticles: [
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "王羲之是中国书法艺术巅峰" },
      { id: "chongyang", title: "重阳：登高望远", category: "节日节气", brief: "王氏家族有重阳雅集传统" }
    ]
  },
  {
    id: "liqingzhao",
    title: "李清照：千古第一才女",
    category: "历史人物",
    excerpt: "宋代婉约词派代表，词风清丽，身世坎坷。",
    content: "李清照（1084-约1155），号易安居士。宋代著名女词人，婉约词派代表。前期词作清丽明快，南渡后转为深沉哀婉。所作《声声慢》《如梦令》等词流传千古。",
    favorites: 2678,
    cover: "🌸",
    source: "《宋史·李清照传》·《漱玉词》",
    relatedPeople: [
      { id: "subaixie", title: "苏轼", category: "历史人物", brief: "宋代豪放词代表，与李清照婉约词相对" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "中国诗歌总集，影响李清照词风", external: true, externalUrl: "https://baike.baidu.com/item/诗经" }
    ],
    relatedEvents: [
      { id: "liqingzhao_evt", title: "靖康之变", brief: "1127年北宋灭亡，李清照南渡后词风转变" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼中秋怀弟名作" },
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡名篇" }
    ],
    relatedArticles: [
      { id: "zhongqiu", title: "中秋：月圆人团圆", category: "节日节气", brief: "中秋诗词的传统" },
      { id: "embroidery", title: "刺绣：针尖上的丹青", category: "传统技艺", brief: "李清照时代刺绣艺术的代表" }
    ]
  },
  {
    id: "jingju",
    title: "京剧：国粹之光",
    category: "传统艺术",
    excerpt: "中国国粹，融合唱念做打，生旦净丑演绎千秋忠义。",
    content: "京剧是中国影响最大的戏曲剧种，有'国剧'之称。它融合了唱、念、做、打四种艺术手法，以生、旦、净、丑四大行当塑造人物，以西皮、二黄为主要声腔，伴奏乐器有京胡、月琴、鼓板等。京剧脸谱色彩鲜明，红表忠勇、黑表刚直、白表奸诈，是东方戏剧艺术的代表。",
    favorites: 3210,
    cover: "🎭",
    history: "京剧形成于清代道光年间（约1840年前后）。乾隆五十五年（1790年），四大徽班陆续进京，与汉调艺人合作，吸收了昆曲、秦腔等剧种的精华，逐渐融合形成了京剧。同治、光绪年间，京剧走向成熟，涌现出'同光十三绝'等名家。民国时期，梅兰芳、程砚秋、尚小云、荀慧生'四大名旦'将京剧推向鼎盛，使京剧走向世界舞台。",
    influence: "京剧是中国戏曲的集大成者，被誉为'国粹'。2010年，京剧被联合国教科文组织列入'人类非物质文化遗产代表作名录'。京剧不仅影响了中国几乎所有地方戏曲的发展，其表演体系还与斯坦尼斯拉夫斯基体系、布莱希特体系并称世界三大戏剧体系。梅兰芳的海外演出让京剧走向世界，成为中国文化最闪亮的名片之一。",
    tutorial: [
      "认识行当：生（男性角色）、旦（女性角色）、净（花脸）、丑（丑角），每个行当又细分多种",
      "辨脸谱：红色忠勇（关羽）、黑色刚直（包拯）、白色奸诈（曹操）、蓝色勇猛（窦尔敦）、金色神怪",
      "听唱腔：从西皮（明快）和二黄（沉郁）两种基本腔调入手，推荐《空城计》《贵妃醉酒》",
      "看身段：注意'唱念做打'四功，尤其关注水袖功、翎子功、甩发功等特技",
      "入门剧目：推荐《三岔口》（武戏经典）、《霸王别姬》（生旦对戏）、《铡美案》（净角代表）"
    ],
    classics: [
      "《霸王别姬》——梅兰芳代表作，楚汉相争的千古绝唱",
      "《贵妃醉酒》——梅派经典，杨贵妃的醉态之美",
      "《空城计》——老生戏代表，诸葛亮的空城退敌",
      "《三岔口》——武戏经典，黑暗中的精彩搏斗",
      "《铡美案》——净角代表，包拯铁面无私"
    ],
    tips: "欣赏京剧不必一开始就追求听懂唱词。可以先从武戏看起（如《三岔口》《闹天宫》），视觉冲击力强，容易入门。再逐渐过渡到文戏，品味唱腔之美。看戏前了解故事背景会大大提升观赏体验。",
    source: "《京剧史》·《中国大百科全书·戏曲卷》·《梅兰芳全集》",
    relatedPeople: [
      { id: "meilanfang", title: "梅兰芳", category: "历史人物", brief: "京剧四大名旦之首，旦行一代宗师", external: true, externalUrl: "https://baike.baidu.com/item/梅兰芳" },
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "京剧中有《孔子》剧目" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "京剧剧目多取《诗经》诗意" }
    ],
    relatedEvents: [
      { id: "chunjie", title: "春节京剧贺岁", category: "节日节气", brief: "春节期间京剧贺岁演出" }
    ],
    relatedPoems: [
      { id: "chuibi", title: "出师表", category: "诗词文学", brief: "诸葛亮前出师表，京剧《空城计》据此编演" },
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗作" }
    ],
    relatedArticles: [
      { id: "kunqu", title: "昆曲：百戏之祖", category: "传统艺术", brief: "京剧的源头之一" },
      { id: "piyingxi", title: "皮影戏：光影千年", category: "传统艺术", brief: "中国传统戏剧" }
    ]
  },
  {
    id: "piyingxi",
    title: "皮影戏：光影千年",
    category: "传统艺术",
    excerpt: "一方白幕、几盏油灯，剪影之间演绎大千世界。",
    content: "皮影戏又称'影子戏'或'灯影戏'，是一种以兽皮或纸板剪刻成人物剪影，在光源照射下用白色幕布表演故事的民间戏剧。表演者一边操纵影人，一边配以唱腔和音乐，集绘画、雕刻、文学、音乐、表演于一体，被誉为'电影的祖先'。",
    favorites: 1567,
    cover: "🎬",
    history: "皮影戏起源于两千多年前的西汉。相传汉武帝爱妃李夫人病逝，武帝思念不已，方士李少翁用棉帛裁成李夫人影像，在灯光下映于幕布上，武帝恍若见其影，皮影戏由此而生。唐宋时期，皮影戏已非常繁荣，宋代《东京梦华录》记载了汴京瓦舍中皮影戏演出的盛况。明清时期，皮影戏遍布全国，形成陕西华县、甘肃陇东、河北唐山等不同流派。",
    influence: "2011年，中国皮影戏被联合国教科文组织列入'人类非物质文化遗产代表作名录'。皮影戏是中国最早将光影用于叙事的艺术形式，被认为是电影的雏形。18世纪，皮影戏经丝绸之路传入欧洲，被称为'中国影灯'，对世界动画和电影的发展产生了启发。皮影的雕刻技艺也独立成为一门精美的民间美术形式。",
    tutorial: [
      "了解流派：陕西皮影（精细古朴）、唐山皮影（造型优美）、甘肃皮影（粗犷豪放）各有特色",
      "欣赏雕刻：注意皮影的镂空技法，一个影人通常有上千个镂空，关节灵活可动",
      "听唱腔：不同地区皮影戏配以当地方言和戏曲，如陕西碗碗腔、唐山乐亭大鼓",
      "观摩表演：关注艺人双手操纵多个影人的技艺，以及武打场面的精彩设计",
      "动手体验：可购买简易皮影DIY套装，体验剪刻和操纵影人的乐趣"
    ],
    classics: [
      "《白蛇传》——经典爱情故事，影人造型精美",
      "《西游记》——孙悟空的形象最受欢迎",
      "《三国演义》——战争场面在皮影中尤为精彩",
      "《闹天宫》——武戏代表，操纵技艺高超"
    ],
    tips: "观看皮影戏最好选择现场演出，光影效果和艺人表演的魅力是视频难以完全传达的。如果有机会去陕西华县或河北唐山，一定要看一场地道的皮影戏。线上可搜索成都博物馆皮影展厅的数字资源。",
    source: "《中国皮影戏史》·《辞海·艺术分册》·《陕西皮影》",
    relatedPeople: [
      { id: "lishaoweng", title: "李少翁", category: "历史人物", brief: "汉代方士，相传为皮影戏发明者", external: true, externalUrl: "https://baike.baidu.com/item/李少翁" }
    ],
    relatedBooks: [
      { id: "dongjing", title: "《东京梦华录》", category: "经典典籍", brief: "宋代孟元老著，记载皮影戏演出盛况", external: true, externalUrl: "https://baike.baidu.com/item/东京梦华录" }
    ],
    relatedEvents: [
      { id: "chunjie", title: "春节皮影演出", category: "节日节气", brief: "春节期间各地皮影戏表演" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗作" }
    ],
    relatedArticles: [
      { id: "kunqu", title: "昆曲：百戏之祖", category: "传统艺术", brief: "中国传统戏曲" },
      { id: "jingju", title: "京剧：国粹之光", category: "传统艺术", brief: "中国传统戏曲" },
      { id: "papercut", title: "剪纸：纸上生花", category: "传统技艺", brief: "皮影的雕刻借鉴剪纸" }
    ]
  },
  {
    id: "embroidery",
    title: "刺绣：针尖上的丹青",
    category: "传统技艺",
    excerpt: "一针一线绣出锦绣山河，四大名绣各展风华。",
    content: "刺绣是用针线在织物上绣制各种装饰图案的传统手工艺。中国刺绣历史悠久，技艺精湛，形成了苏绣、湘绣、粤绣、蜀绣'四大名绣'，以及顾绣、苗绣、汴绣等众多地方绣种。刺绣题材涵盖花鸟鱼虫、山水人物，被誉为'针尖上的丹青'。",
    favorites: 1890,
    cover: "🪡",
    history: "中国刺绣的历史可追溯至四千多年前。虞舜之时已有'衣画而裳绣'的记载。1974年陕西宝鸡出土的西周刺绣残片，是目前发现最早的刺绣实物。唐宋时期，刺绣从实用装饰走向艺术欣赏，出现了以书画为蓝本的'画绣'。明清时期，四大名绣风格成熟：苏绣以精细雅洁著称，湘绣以写实雄浑见长，粤绣色彩富丽，蜀绣技法严谨。",
    influence: "刺绣是中国女红文化的核心，承载着'慈母手中线'的深厚情感。四大名绣均被列入国家级非物质文化遗产名录。刺绣技法影响了现代时装设计、家居装饰等领域，苏绣的双面绣技艺更是令世界叹为观止。近年来，刺绣元素频繁出现在国际时装周上，成为'中国风'设计的重要灵感来源。",
    tutorial: [
      "认识绣种：苏绣（江苏，精细雅洁）、湘绣（湖南，写实雄浑）、粤绣（广东，富丽堂皇）、蜀绣（四川，严谨细腻）",
      "基本针法：从平针、回针、缎面绣等基础针法练起，再学习套针、抢针等进阶技法",
      "准备材料：绣花针、绣线（丝线或棉线）、绣绷、底布（棉布或丝绸）、剪刀",
      "入门图案：从简单的花卉、小动物开始，推荐先绣一幅小尺寸的兰花或荷花",
      "进阶体验：尝试双面绣（正反两面图案一致），感受苏绣的极致技艺"
    ],
    classics: [
      "苏绣《猫》——双面绣代表作，毛发纤毫毕现",
      "湘绣《虎》——以鬅毛针表现虎毛的威猛",
      "粤绣《百鸟朝凤》——色彩绚丽，构图饱满",
      "蜀绣《芙蓉鲤鱼》——线条细腻，层次丰富"
    ],
    tips: "初学刺绣最重要的是保持耐心和手的稳定。绣线不要拉得太紧，否则底布会皱。使用绣绷能保持底布平整。初学者建议选择针数较粗的棉线，比丝线更容易操作。每天绣半小时，坚持一个月就能完成一幅像样的作品。",
    source: "《中国刺绣史》·《苏绣技法》·《湘绣艺术》",
    relatedPeople: [
      { id: "liqingzhao", title: "李清照", category: "历史人物", brief: "宋代女词人，刺绣常以词意为题材" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", brief: "刺绣常取《诗经》意趣" }
    ],
    relatedEvents: [
      { id: "chunjie", title: "春节刺绣展", category: "节日节气", brief: "春节期间传统刺绣展览" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作" }
    ],
    relatedArticles: [
      { id: "zharian", title: "扎染：布里生花", category: "传统技艺", brief: "传统染织工艺" },
      { id: "ciqi", title: "青花瓷：景德镇的蓝白韵律", category: "传统技艺", brief: "传统工艺" },
      { id: "papercut", title: "剪纸：纸上生花", category: "传统技艺", brief: "传统手工艺" }
    ]
  },
  {
    id: "zharian",
    title: "扎染：布里生花",
    category: "传统技艺",
    excerpt: "线扎缝绞，入缸浸染，拆线一刻方见花开。",
    content: "扎染古称扎缬、绞缬，是中国传统的织物染色工艺。通过纱线、绳索等工具将织物扎、缝、缚、夹后入染缸浸染，拆线后形成深浅不一、自然晕染的花纹。大理白族扎染和四川自贡扎染最为著名，图案多以蝴蝶、花卉、鱼鸟为主题，蓝白相间，清新雅致。",
    favorites: 1340,
    cover: "🌀",
    history: "扎染起源于东晋时期，距今已有1600余年历史。南北朝时期，扎染已广泛用于服饰。唐代是扎染的鼎盛时期，'青碧缬衣裙'成为贵族妇女的时尚。宋代以后，随着印花技术的普及，扎染逐渐式微，但在西南少数民族地区得以传承。云南大理的白族扎染技艺世代相传，至今仍是当地人重要的生活技艺。",
    influence: "2006年，白族扎染技艺被列入国家级非物质文化遗产名录。扎染的'不可复制性'——每件作品的花纹都独一无二，使其在现代手工艺复兴中备受青睐。扎染技法影响了日本的'絞り染め'、印度的Bandhani等世界各地的防染工艺。如今，扎染元素广泛应用于服装、家居、文创产品中，成为'慢生活'美学的代表。",
    tutorial: [
      "准备材料：纯棉或真丝白布、板蓝根等植物染料（或化学染料）、棉线、橡皮筋、手套",
      "设计图案：常见的有同心圆（中心扎起）、条纹（折叠后绑扎）、蜘蛛纹（多点扎结）",
      "扎结手法：用棉线紧紧缠绕绑扎，绑扎越紧，防染效果越好，留白越多",
      "浸染过程：将扎好的布放入染缸，浸泡20-30分钟后取出氧化，可反复多次加深颜色",
      "拆线晾干：染好后拆去绑扎线，展开清洗浮色，阴干即可看到独一无二的花纹"
    ],
    classics: [
      "大理白族扎染——蓝底白花，蝴蝶纹为经典图案",
      "自贡扎染——色彩丰富，图案精细",
      "南通蓝印花布——虽为印花，与扎染风格相近",
      "日本絞り染め——受中国扎染影响发展的日本工艺"
    ],
    tips: "扎染最大的魅力在于'拆线那一刻的惊喜'——你永远不知道最终会呈现怎样的花纹。初学者建议从简单的同心圆开始练习。使用天然植物染料（如板蓝根）更环保，颜色也更有层次感。染好的布料首次清洗会有浮色脱落，属正常现象。",
    source: "《中国染织史》·《白族扎染》·《中国传统工艺》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，扎染纹样多取诗意" }
    ],
    relatedBooks: [
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，影响扎染美学" }
    ],
    relatedEvents: [
      { id: "chunjie", title: "春节扎染展", category: "节日节气", brief: "春节期间传统扎染展览" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作" }
    ],
    relatedArticles: [
      { id: "embroidery", title: "刺绣：针尖上的丹青", category: "传统技艺", brief: "刺绣常与扎染结合" },
      { id: "ciqi", title: "青花瓷：景德镇的蓝白韵律", category: "传统技艺", brief: "传统工艺" }
    ]
  },
  {
    id: "guqin",
    title: "古琴：太古之音",
    category: "传统艺术",
    excerpt: "七弦之上，高山流水遇知音，三千年的文人雅器。",
    content: "古琴，又称瑶琴、玉琴，是中国最古老的弹拨乐器之一，距今已有三千多年历史。古琴有七根弦，十三个徽位，音色深沉悠远。它不仅是一件乐器，更是文人雅士修身养性的精神载体，被誉为'琴棋书画'四艺之首。2003年，古琴艺术被联合国教科文组织列入'人类口头和非物质遗产代表作'。",
    favorites: 2100,
    cover: "🎻",
    history: "古琴的历史可追溯至三千多年前的西周时期。相传伏羲、神农削桐为琴，绳丝为弦。春秋时期，古琴已成为文人必备之器，伯牙子期'高山流水'遇知音的故事流传千古。魏晋时期，嵇康一曲《广陵散》成为绝唱。唐宋时期，古琴艺术达到高峰，出现了大量琴谱和琴论。明清时期，虞山派、广陵派等琴派各具特色，传承至今。",
    influence: "古琴是中国文人精神的象征，承载着'天人合一'的哲学思想。2003年，古琴艺术被联合国教科文组织列入'人类口头和非物质遗产代表作'。古琴音乐影响了古筝、瑟等中国弹拨乐器的发展，其记谱法'减字谱'是世界上独特的音乐文献系统。古琴曲目如《高山流水》《广陵散》《梅花三弄》等，已成为中国古典音乐的经典符号。",
    tutorial: [
      "认识古琴：了解琴身结构（琴面、琴底、七弦、十三徽），熟悉散音、泛音、按音三种音色",
      "基本指法：右手抹、挑、勾、剔、打、摘，左手吟、猱、绰、注、撞等指法",
      "入门曲目：从《仙翁操》《秋风词》等小曲开始，再学《酒狂》《阳关三叠》",
      "减字谱：学习古琴独特的记谱方式，它记录指法而非音高，需要老师指导",
      "琴道修养：古琴讲究'琴心合一'，弹琴前需净手焚香，调整呼吸与心境"
    ],
    classics: [
      "《高山流水》——伯牙子期知音故事，千古绝唱",
      "《广陵散》——嵇康绝笔，慷慨激昂",
      "《梅花三弄》——以梅花傲雪喻高洁品格",
      "《阳关三叠》——送别名曲，'劝君更尽一杯酒'",
      "《酒狂》——阮籍所作，借酒抒怀"
    ],
    tips: "学习古琴最好找一位老师入门，因为减字谱和指法需要面对面传授。初学不必急于弹曲，先练好基本指法。古琴的音量较小，适合独自或在小范围品赏，这正是其'雅'之所在。每天练习30分钟，三个月可弹简单小曲。",
    source: "《古琴曲集》·《琴史》·《中国音乐史》",
    relatedPeople: [
      { id: "zhuangzi", title: "庄子", category: "历史人物", brief: "道家代表人物，'鼓琴'故事流传千古" },
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家'六艺'之一为琴，孔子善鼓琴" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "记载孔子学琴'曲不离口'的故事" },
      { id: "laozi", title: "《道德经》", category: "经典典籍", brief: "道家经典，与古琴精神相通" }
    ],
    relatedEvents: [
      { id: "zhongqiu", title: "中秋古琴雅集", category: "节日节气", brief: "中秋传统古琴演奏" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，中秋怀人" },
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡" }
    ],
    relatedArticles: [
      { id: "kunqu", title: "昆曲：百戏之祖", category: "传统艺术", brief: "传统文人雅艺" },
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "传统文人雅艺" }
    ]
  },
  {
    id: "shufa",
    title: "书法：墨舞千秋",
    category: "传统艺术",
    excerpt: "一点一画见风骨，翰墨之间写尽中华精神。",
    content: "书法是中国特有的用毛笔书写汉字的艺术，是中华文化最核心的视觉表达形式。书法以汉字为载体，通过点画、结构、章法和墨色变化，展现书写者的精神气质与审美追求。篆、隶、楷、行、草五大书体各具风韵，被誉为'无言的诗，无行的舞，无图的画，无声的乐'。",
    favorites: 3450,
    cover: "🖌",
    history: "中国书法的历史与汉字的发展同步。甲骨文是最早的成熟文字，金文铸于青铜，石鼓文古朴雄浑。秦代李斯创小篆，统一文字。汉代隶书取代篆书，成为正式书体。魏晋时期，楷书、行书、草书相继成熟，王羲之《兰亭集序》被誉为'天下第一行书'。唐代是楷书的高峰，颜真卿、柳公权并称'颜筋柳骨'。宋代尚意，明清尚态，书法艺术代代传承。",
    influence: "书法是中国艺术的根基，深刻影响了中国画、篆刻、建筑等所有视觉艺术。2009年，中国书法被联合国教科文组织列入'人类非物质文化遗产代表作名录'。书法的审美理念——气韵、骨力、章法，已成为中国美学的核心范畴。书法还传播到日本、韩国等地，发展出书道等本土艺术，形成了'汉字文化圈'的共同审美。",
    tutorial: [
      "选帖入门：从楷书入手，推荐颜真卿《多宝塔碑》（雄浑）或欧阳询《九成宫》（严谨）",
      "文房四宝：毛笔（兼毫适中）、墨汁（初学可用瓶装）、宣纸（毛边纸练习）、砚台",
      "基本笔画：先练横、竖、撇、捺、点、提、钩、折八种基本笔画，每种反复练习",
      "间架结构：掌握汉字的结构规律，如'横平竖直'、'中宫收紧'、'左紧右松'",
      "临摹方法：先读帖（观察），再摹帖（描红），后临帖（对照写），最后背临（默写）"
    ],
    classics: [
      "王羲之《兰亭集序》——天下第一行书，飘若浮云矫若惊龙",
      "颜真卿《祭侄文稿》——天下第二行书，悲愤之作",
      "苏轼《寒食帖》——天下第三行书，旷达中见沉郁",
      "欧阳询《九成宫醴泉铭》——楷书典范，法度森严",
      "怀素《自叙帖》——草书极品，狂草如风"
    ],
    tips: "学书法贵在坚持，每天练字半小时比一周练三小时更有效。初学一定要从楷书入手，打好基础再学行草。选一本好字帖等于找了一位好老师，不要频繁换帖。练字时注意坐姿和执笔方法，'指实掌虚'是基本要领。",
    source: "《中国书法史》·《书法概论》·《兰亭序》",
    relatedPeople: [
      { id: "wangxizhi", title: "王羲之", category: "历史人物", brief: "东晋书圣，《兰亭集序》作者" },
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，亦是草书大家" }
    ],
    relatedBooks: [
      { id: "lantingxu", title: "《兰亭集序》", category: "经典典籍", brief: "天下第一行书", external: true, externalUrl: "https://baike.baidu.com/item/兰亭集序" },
      { id: "lunyu", title: "《论语》", category: "经典典籍", brief: "儒家经典，书法常书内容" }
    ],
    relatedEvents: [
      { id: "chunjie", title: "春节写春联", category: "节日节气", brief: "春节传统习俗，书法大显身手" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，常被书法家书写" },
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白名篇，书法常书" }
    ],
    relatedArticles: [
      { id: "guqin", title: "古琴：太古之音", category: "传统艺术", brief: "传统文人雅艺'琴棋书画'之一" },
      { id: "kunqu", title: "昆曲：百戏之祖", category: "传统艺术", brief: "传统艺术" },
      { id: "tiehua", title: "铁画：铁打丹青", category: "传统技艺", brief: "将书法锻于铁上" }
    ]
  },
  {
    id: "tiehua",
    title: "铁画：铁打丹青",
    category: "传统技艺",
    excerpt: "以铁为墨，以锤为笔，锻打出别具一格的钢铁画卷。",
    content: "铁画又名铁花，是安徽芜湖特有的传统工艺品。它以熟铁为原料，经锻打、焊接、淬火等工序，制成山水、花鸟、人物等画面，既有国画的意境，又有雕塑的立体感。铁画黑白分明，刚柔并济，被誉为'铁打丹青'，是中国工艺美术中的独特门类。",
    favorites: 890,
    cover: "⚒",
    history: "铁画创制于清代康熙年间，由芜湖铁匠汤鹏所创。相传汤鹏与画家萧云从为邻，受其画稿启发，将铁器锻打技术与绘画艺术结合，创制出铁画。康熙年间，铁画被贡入宫廷，备受赞赏。乾隆年间，铁画技艺进一步发展，出现了彩色铁画、铁画灯具等新品种。三百余年来，铁画技艺在芜湖世代相传，成为地方文化名片。",
    influence: "芜湖铁画是国家级非物质文化遗产，是中国工艺美术中独一无二的铁锻艺术。它打破了'画'与'器'的界限，将冶铁工艺与文人画意境完美融合。铁画的创制体现了中国工匠'技进乎道'的精神，对现代金属工艺和公共艺术创作仍有启发。人民大会堂曾陈列大型铁画《迎客松》，成为铁画艺术的经典代表。",
    tutorial: [
      "了解工艺：铁画制作需经过选料、锻打、焊接、淬火、整形、装框等工序",
      "欣赏要点：注意铁画的线条如国画用笔，有粗细、顿挫之分，疏密得当",
      "经典题材：山水（仿渐江、萧云从画意）、花鸟（松鹤、鹰）、书法（行草为多）",
      "鉴别优劣：好的铁画线条流畅、焊接无痕、黑白对比强烈、构图疏密有致",
      "参观体验：可前往芜湖铁画博物馆或工艺美术厂参观制作过程"
    ],
    classics: [
      "《迎客松》——人民大会堂陈列，铁画巅峰之作",
      "《梅兰竹菊》——四条屏，文人画意趣",
      "《奔马》——仿徐悲鸿画意，铁线流畅有力",
      "《草书》——以铁锻写书法，刚劲飘逸"
    ],
    tips: "铁画是较为小众的传统工艺，欣赏时可以将其与国画对照，感受'以铁代墨'的妙处。如果有机会去芜湖，一定要去铁画工坊看看匠人现场锻打的过程，那种火花四溅中诞生艺术的体验非常震撼。",
    source: "《芜湖铁画》·《中国传统工艺》·《汤鹏铁画》",
    relatedPeople: [
      { id: "tangpeng", title: "汤鹏", category: "历史人物", brief: "清代铁匠，铁画创始人", external: true, externalUrl: "https://baike.baidu.com/item/汤鹏" }
    ],
    relatedBooks: [
      { id: "changwuzhi", title: "《长物志》", category: "经典典籍", brief: "明代文震亨著，影响铁画意境", external: true, externalUrl: "https://baike.baidu.com/item/长物志" }
    ],
    relatedEvents: [
      { id: "chunjie", title: "春节工艺展", category: "节日节气", brief: "春节期间铁画展览" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗作" }
    ],
    relatedArticles: [
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "铁画借鉴书法笔意" },
      { id: "jingtailan", title: "景泰蓝：皇家工艺", category: "传统技艺", brief: "同为传统金属工艺" }
    ]
  },
  {
    id: "kite",
    title: "风筝：纸鸢乘风",
    category: "传统技艺",
    excerpt: "一线牵古今，纸鸢乘风去，放飞千年的天空之梦。",
    content: "风筝，古称纸鸢、鹞子，是中国人发明的飞行器，也是深受喜爱的民间玩具和工艺品。风筝以竹篾为骨架，糊以纸或绢，绘以图案，系以长线，借风力放飞。中国风筝讲究'扎、糊、绘、放'四艺，潍坊、北京、天津、南通并称中国四大风筝产地，各有独特风格。",
    favorites: 1670,
    cover: "🪁",
    history: "风筝起源于两千多年前的春秋时期。相传墨子'斫木为鹞，三年而成'，是最早的风筝雏形。东汉蔡伦改进造纸术后，纸风筝逐渐取代木风筝。唐代，风筝上加装竹笛，风吹有声，故称'风筝'。宋代，放风筝成为流行的民间活动，《清明上河图》中就有放风筝的场景。明清时期，风筝艺术达到鼎盛，曹雪芹还著有《南鹞北鸢考工志》，详细记载风筝扎制技艺。",
    influence: "风筝是中国人对飞行的最早探索，启迪了现代航空学的发展。中国风筝通过丝绸之路传入欧洲，对西方飞行器的发明产生了影响。潍坊国际风筝节自1984年举办至今，已成为世界级的文化盛事。2006年，潍坊风筝制作技艺被列入国家级非物质文化遗产名录。风筝上的彩绘也是一门独立的民间美术形式。",
    tutorial: [
      "四艺入门：扎（用竹篾扎骨架，讲究对称平衡）、糊（用纸或绢糊面，平整无皱）、绘（彩绘图案，鲜艳美观）、放（调整提线角度，借风放飞）",
      "制作材料：竹篾（弹性好的毛竹）、宣纸或绢、浆糊、颜料、棉线",
      "入门款式：从最简单的菱形风筝（十字骨架）开始，再尝试燕子、蝴蝶等软翅风筝",
      "绘制图案：传统图案有沙燕、金鱼、蜈蚣、八卦等，也可自由创作",
      "放飞技巧：选择3-4级风的晴天，背风站立，边放线边后退，感受风力变化"
    ],
    classics: [
      "北京沙燕风筝——曹氏风筝代表，造型优美",
      "潍坊龙头蜈蚣风筝——超长串式风筝，气势恢宏",
      "南通板鹞风筝——装有哨口，放飞时声如天籁",
      "天津软翅风筝——魏记风筝，工艺精湛"
    ],
    tips: "做风筝最关键的是骨架的对称和平衡，稍有偏差就飞不稳。初学者建议从菱形风筝开始，结构简单容易成功。放风筝要选择空旷无障碍物的场地，避开高压线。春天是放风筝的最佳季节，'草长莺飞二月天'正是好时候。",
    source: "《曹雪芹风筝谱》·《南鹞北鸢考工志》·《中国风筝》",
    relatedPeople: [
      { id: "caoxueqin", title: "曹雪芹", category: "历史人物", brief: "清代作家，著有《南鹞北鸢考工志》", external: true, externalUrl: "https://baike.baidu.com/item/曹雪芹" },
      { id: "mozi", title: "墨子", category: "历史人物", brief: "相传最早制作风筝雏形", external: true, externalUrl: "https://baike.baidu.com/item/墨子" }
    ],
    relatedBooks: [
      { id: "hongloumeng", title: "《红楼梦》", category: "经典典籍", brief: "曹雪芹著，多次写到放风筝", external: true, externalUrl: "https://baike.baidu.com/item/红楼梦" }
    ],
    relatedEvents: [
      { id: "qingming", title: "清明放风筝", category: "节日节气", brief: "清明节传统放风筝习俗" },
      { id: "chunjie", title: "春节风筝展", category: "节日节气", brief: "春节期间各地风筝展览" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作" }
    ],
    relatedArticles: [
      { id: "tieba", title: "活字印刷：文明之火", category: "传统技艺", brief: "同为传统工艺" },
      { id: "papercut", title: "剪纸：纸上生花", category: "传统技艺", brief: "传统手工艺" }
    ]
  },
  {
    id: "tieba",
    title: "活字印刷：文明之火",
    category: "传统技艺",
    excerpt: "一字一印，排版成书，四大发明点亮人类文明。",
    content: "活字印刷术是中国古代四大发明之一，由北宋毕昇发明。它用胶泥刻字，每字一印，火烧令坚后，按稿件排字成版，印刷后可拆解重复使用。活字印刷术极大降低了书籍生产的成本，推动了知识的传播和文明的进步，是改变世界进程的伟大发明。",
    favorites: 2340,
    cover: "🔤",
    history: "北宋庆历年间（约1041-1048年），平民毕昇发明了胶泥活字印刷术，这是世界上最早的活字印刷。元代王祯创制木活字，并发明转轮排字架，提高了排字效率。明代出现铜活字，清代曾用铜活字印制《古今图书集成》。活字印刷术约在13世纪传入朝鲜、日本，后经丝绸之路传入欧洲。1450年前后，德国古腾堡发明铅活字印刷，独立发展了西方活字印刷体系。",
    influence: "活字印刷术是中国对世界文明的伟大贡献之一。它使书籍的大规模生产成为可能，打破了知识被少数人垄断的局面，推动了教育普及和思想解放。活字印刷术的传播加速了欧洲文艺复兴和宗教改革，间接改变了世界历史进程。2010年，木活字印刷术被联合国教科文组织列入'急需保护的非物质文化遗产名录'，福建宁化木活字印刷术至今仍有传承。",
    tutorial: [
      "了解原理：刻字（反字阳文）→ 排版（按稿件检字入盘）→ 刷墨 → 印刷 → 拆版",
      "体验刻字：用橡皮章或陶泥练习刻反字，感受'反字正印'的巧妙",
      "检字排版：学习转轮排字盘的使用，按韵部分类存放活字",
      "刷墨印刷：用墨刷均匀涂墨，覆纸后轻刷，揭起即成印刷品",
      "参观体验：可前往中国印刷博物馆（北京）或瑞安木活字印刷展示馆参观"
    ],
    classics: [
      "毕昇胶泥活字——世界最早的活字印刷",
      "王祯木活字及转轮排字架——元代改进",
      "明代铜活字——华燧会通馆铜字印本",
      "《古今图书集成》——清代铜活字印制的大型类书"
    ],
    tips: "活字印刷体验最有趣的是刻反字——你需要将字反过来写、反过来刻，印出来才是正的。初学可以用橡皮章代替胶泥，更容易操作。如果有机会去福建瑞安或宁化，可以看到至今仍在使用木活字修族谱的传承人，感受活态传承的魅力。",
    source: "《梦溪笔谈》·《中国印刷史》·《中华印刷大典》",
    relatedPeople: [
      { id: "bisheng", title: "毕昇", category: "历史人物", brief: "北宋发明家，活字印刷术发明者", external: true, externalUrl: "https://baike.baidu.com/item/毕昇" },
      { id: "wangzhen", title: "王祯", category: "历史人物", brief: "元代农学家，改进木活字印刷", external: true, externalUrl: "https://baike.baidu.com/item/王祯" }
    ],
    relatedBooks: [
      { id: "mengxibitan", title: "《梦溪笔谈》", category: "经典典籍", brief: "沈括著，最早记载毕昇活字印刷", external: true, externalUrl: "https://baike.baidu.com/item/梦溪笔谈" }
    ],
    relatedEvents: [
      { id: "chunjie", title: "春节印刷展", category: "节日节气", brief: "春节期间传统印刷展览" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗作" }
    ],
    relatedArticles: [
      { id: "shufa", title: "书法：墨舞千秋", category: "传统艺术", brief: "书法与印刷关系密切" },
      { id: "kite", title: "风筝：纸鸢乘风", category: "传统技艺", brief: "同为传统手工艺" }
    ]
  },
  // ===== 建筑古迹 =====
  {
    id: "gugong",
    title: "故宫：紫禁城的六百年",
    category: "建筑古迹",
    excerpt: "明清两代皇家宫殿，世界上现存规模最大、保存最完整的木质结构古建筑群。",
    content: "故宫又称紫禁城，是明清两代的皇家宫殿，旧称为紫禁城，位于北京中轴线的中心。故宫以三大殿（太和殿、中和殿、保和殿）为中心，占地面积约72万平方米，建筑面积约15万平方米，有大小宫殿七十多座，房屋九千余间。是世界上现存规模最大、保存最为完整的木质结构古建筑之一。",
    favorites: 5621,
    cover: "🏯",
    history: "故宫始建于明永乐四年（1406年），永乐十八年（1420年）建成。是明成祖朱棣迁都北京后启动的皇家工程，由蒯祥、蔡信等匠师设计建造。先后有24位皇帝在此居住执政。1912年清帝逊位后，故宫仍由逊帝溥仪居住至1924年。1925年10月10日，故宫博物院成立，对公众开放。故宫于1987年被联合国教科文组织列入世界文化遗产名录。",
    influence: "故宫是中国宫廷建筑的巅峰之作，代表了中国古代建筑艺术的最高成就。它的中轴对称布局、严格的等级制度、色彩运用（红墙黄瓦）、装饰艺术（龙凤纹样）都深刻影响了中国乃至东亚的建筑文化。今天的故宫博物院馆藏文物超过186万件，是世界最大的博物馆之一。故宫文创、故宫数字博物馆让传统文化以现代方式走向大众。",
    tutorial: [
      "推荐路线：午门→太和门→太和殿→中和殿→保和殿→御花园→神武门，约需3-4小时",
      "必看建筑：太和殿（金銮殿）、乾清宫、交泰殿、坤宁宫、御花园",
      "珍宝馆与钟表馆：另需购票，可以看到故宫最精美的文物收藏",
      "角楼与护城河：东华门或西华门外的角楼是摄影胜地，夕阳下尤其美",
      "数字故宫：下载'故宫展览'APP或访问 https://www.dpm.org.cn 可线上逛故宫"
    ],
    classics: [
      "《我在故宫修文物》——纪录片，让钟表、书画、青铜修复师走入大众视野",
      "《故宫日历》——每年一册，精选故宫藏品，已成为文创经典",
      "太和殿——故宫核心，明清举行重大典礼的地方",
      "御花园——明清皇家园林典范，奇石秀木遍布"
    ],
    tips: "故宫建议提前7天在官网实名购票。最佳参观季节是春秋两季，避开节假日高峰。进故宫一定要租借电子讲解器或在公众号上听官方讲解，了解每座建筑背后的故事。午门的'门钉九纵九横'、脊兽的数量都有讲究，处处体现着皇家的礼制。",
    source: "《明史·宫室志》·《清史稿·宫殿志》",
    relatedPeople: [
      { id: "zhudi", title: "朱棣", category: "历史人物", external: true, externalUrl: "https://baike.baidu.com/item/明成祖", brief: "故宫建造者，1406年下诏营建紫禁城" },
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，故宫建筑处处体现儒家礼制" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/论语", brief: "儒家经典，故宫礼制之本" }
    ],
    relatedEvents: [
      { id: "gugong_evt", title: "故宫博物院成立", brief: "1925年10月10日，故宫博物院正式成立对公众开放" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", external: true, externalUrl: "https://baike.baidu.com/item/水调歌头·明月几时有", brief: "苏轼中秋怀弟名作" }
    ],
    relatedArticles: [
      { id: "badaling", title: "长城：中华民族的脊梁", category: "建筑古迹", brief: "同为明清皇家工程" },
      { id: "fengshui", title: "风水：天人合一", category: "民俗文化", brief: "故宫严格遵循风水理念" }
    ]
  },
  {
    id: "badaling",
    title: "长城：中华民族的脊梁",
    category: "建筑古迹",
    excerpt: "万里长城，世界新七大奇迹之一，中华民族的精神象征。",
    content: "长城又称万里长城，是我国古代的军事防御工程。长城修筑的历史可上溯到西周时期，春秋战国时期各诸侯国为了相互防御而修筑烽火台、城墙。秦始皇统一六国后，连贯修缮了战国长城，后经历代王朝扩建修筑，至明代形成东起鸭绿江、西至嘉峪关、总长度达21196.18千米的长城。",
    favorites: 4980,
    cover: "🧱",
    history: "长城始建于春秋战国时期，各诸侯国为互防而修筑。公元前221年，秦始皇统一六国后，派蒙恬率三十万大军北击匈奴，并将原秦、赵、燕三国的北边长城连贯修缮，西起临洮东至辽东。汉代继续向西延伸至河西走廊。南北朝至元代，由于民族融合，长城作用逐渐淡化。明代是长城修筑的高峰，朱元璋建国后即开始修筑长城，明长城是中国历史上规模最大、最坚固的长城工程。",
    influence: "长城是中华民族精神的象征，代表着中华民族的智慧、勤劳和坚韧。1987年，长城被联合国教科文组织列入世界文化遗产名录。2009年，'不到长城非好汉'成为新七大奇迹之首的评选佳话。长城不仅是军事防御工程的杰作，也见证了中华文明两千多年的发展历程。今天，长城已成为中国最重要的文化名片之一，每年吸引数千万中外游客。",
    tutorial: [
      "选择段落：北京附近推荐八达岭（雄伟）、慕田峪（秀美）、司马台（野趣），甘肃嘉峪关（关城特色）",
      "最佳时间：春秋两季气候宜人，避开盛夏和严冬。清晨登山可看日出",
      "徒步路线：八达岭有北段（好汉坡）和南段之分，南段游客较少景色更美",
      "攀登准备：穿防滑徒步鞋，带足水和干粮，注意防晒",
      "摄影机位：八达岭长城博物馆、望京石、好汉坡都是绝佳拍摄点"
    ],
    classics: [
      "八达岭长城——最著名段，明长城精华",
      "慕田峪长城——植被丰富，风景秀丽",
      "嘉峪关——明长城西端起点，'天下第一雄关'",
      "金山岭长城——保存最完整，被称'摄影爱好者的长城'"
    ],
    tips: "登长城不要只看人多就止步。推荐爬到北八楼或北十二楼，人会少很多，视野也更开阔。长城台阶陡峭，务必穿防滑鞋，下雨天不要登城。注意：长城上卫生间有限，请提前做好准备。带孩子的游客推荐慕田峪，有缆车和滑道，老人小孩都适宜。",
    source: "《史记·封禅书》·《淮南子·览冥训》",
    relatedPeople: [
      { id: "qinshihuang", title: "秦始皇", category: "历史人物", external: true, externalUrl: "https://baike.baidu.com/item/秦始皇", brief: "公元前221年统一六国后连缀修筑长城" },
      { id: "mengtian", title: "蒙恬", category: "历史人物", external: true, externalUrl: "https://baike.baidu.com/item/蒙恬", brief: "秦朝名将，率三十万大军修筑长城" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/诗经", brief: "收录秦风《无衣》等戍边诗篇" }
    ],
    relatedEvents: [
      { id: "qin_unite", title: "秦始皇修长城", brief: "公元前221年，秦始皇连缀秦赵燕三国长城，西起临洮东至辽东" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗作，体现盛唐气象" }
    ],
    relatedArticles: [
      { id: "gugong", title: "故宫：紫禁城的六百年", category: "建筑古迹", brief: "同为明清皇家建筑工程" },
      { id: "mogaoku", title: "莫高窟：丝路上的艺术宝库", category: "建筑古迹", brief: "同为世界文化遗产" }
    ]
  },
  {
    id: "mogaoku",
    title: "莫高窟：丝路上的艺术宝库",
    category: "建筑古迹",
    excerpt: "千年敦煌，壁画飞天，世界佛教艺术的高峰。",
    content: "莫高窟俗称千佛洞，位于河西走廊西端的敦煌。始建于十六国的前秦时期，历经十六国、北朝、隋、唐、五代、西夏、元等历代的兴建，形成巨大的规模。是世界上现存规模最大、内容最丰富的佛教艺术圣地。现有洞窟735个，壁画4.5万平方米、泥质彩塑2415尊，是世界文化遗产。",
    favorites: 3210,
    cover: "🗿",
    history: "公元366年，乐僔和尚途经敦煌东南的三危山，见金光万道如千佛跃动，认为是圣地，遂在悬崖上开凿了第一个石窟。此后历经北魏、隋、唐等十个朝代、千年不断的开凿，形成了南北长1680米的石窟群。莫高窟在元代以后逐渐衰落。清光绪二十六年（1900年），道士王圆箓偶然发现藏经洞（第17窟），内藏5万余件古代文献和艺术品，震惊世界。",
    influence: "莫高窟是中国佛教艺术和敦煌学的发源地，对中国佛教美术、建筑、文学的发展有深远影响。1987年列入世界文化遗产。藏经洞出土文献涵盖中古时期多种学科，是研究中亚史、中西交流史、佛教史、文学史的珍贵资料。敦煌壁画中的'飞天'形象成为中华艺术的重要符号，常被用于现代设计。",
    tutorial: [
      "购票预约：莫高窟实行实名制预约，提前1个月在官网购票",
      "观看电影：先观看《千年莫高》和《梦幻佛宫》两部数字电影，建立整体印象",
      "参观洞窟：由讲解员带领参观8-10个代表性洞窟，讲解员讲的精彩与否决定体验",
      "数字展示中心：通过球幕电影体验'虚拟洞窟'，弥补不能看的洞窟",
      "周边联游：可与鸣沙山月牙泉、阳关、玉门关组成西线一日游"
    ],
    classics: [
      "九层楼大佛——第96窟，35.5米高的弥勒佛，敦煌标志性建筑",
      "藏经洞——第17窟，5万卷文献的发现地，'学术的伤心地'",
      "飞天壁画——第321窟，初唐双飞天最为经典",
      "反弹琵琶——第112窟，《观无量寿经变》中的舞者"
    ],
    tips: "莫高窟的参观与解说完全取决于讲解员。预约时如有选择，可以等有经验的讲解员。洞窟内禁止拍照和摄像，闪光灯会对千年壁画造成不可逆伤害。最好在春末或秋初前往，既避开了旺季，又避开了沙尘暴。7-8月敦煌非常炎热，最高温度可达40℃，需做好防晒。",
    source: "《李克让重修莫高窟佛龛碑》·《敦煌录》",
    relatedPeople: [
      { id: "lezun", title: "乐僔", category: "历史人物", external: true, externalUrl: "https://baike.baidu.com/item/乐僔", brief: "前秦僧人，公元366年首凿莫高窟第一窟" },
      { id: "wangyuanlu", title: "王圆箓", category: "历史人物", external: true, externalUrl: "https://baike.baidu.com/item/王圆箓", brief: "清末道士，1900年发现藏经洞" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/诗经", brief: "儒家经典，敦煌壁画多取其诗意" }
    ],
    relatedEvents: [
      { id: "mogaoku_evt", title: "藏经洞发现", brief: "1900年，王圆箓偶然发现第17窟藏经洞，内藏5万余件文献" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作" }
    ],
    relatedArticles: [
      { id: "badaling", title: "长城：中华民族的脊梁", category: "建筑古迹", brief: "同为世界文化遗产" },
      { id: "kunqu", title: "昆曲：百戏之祖", category: "传统艺术", brief: "莫高窟壁画与戏曲艺术相通" }
    ]
  },
  {
    id: "suzhou",
    title: "苏州园林：诗意的栖居",
    category: "建筑古迹",
    excerpt: "咫尺之内再造乾坤，江南古典园林的杰出代表。",
    content: "苏州古典园林是江南私家园林的典范，始于春秋，发展于唐宋，兴盛于明清。拙政园、留园、网师园、环秀山庄等9座园林被列入世界文化遗产名录。苏州园林以小见大，以少胜多，'虽由人作，宛自天开'，是中国山水画、诗词意境在现实空间中的立体呈现。",
    favorites: 2870,
    cover: "🌳",
    history: "苏州园林最早可追溯至公元前6世纪吴王阖闾的姑苏台。东晋时顾辟疆建'辟疆园'，是现存文献记载最早的苏州私家园林。唐宋时期，江南经济繁荣，私家园林勃兴。明清两代，苏州成为全国造园中心，拙政园、留园、网师园、狮子林等名园相继建成。文震亨《长物志》、李渔《闲情偶寄》成为造园理论经典。1997年，拙政园、留园、网师园、环秀山庄被列入世界文化遗产，2000年扩展为9处。",
    influence: "苏州园林深刻影响了中国乃至东亚的造园艺术。它以有限空间创造无限意境，体现了'天人合一'的哲学思想，对现代景观设计有重要启发。拙政园等9处园林被列入世界文化遗产。苏州园林的'借景'、'对景'、'框景'等手法，以及花窗、廊桥、假山等元素，启发了无数现代建筑设计师。陈从周的《中国名园》、刘敦桢的《苏州古典园林》是研究园林的经典著作。",
    tutorial: [
      "必游四大名园：拙政园（最大，明代遗构）、留园（建筑精美）、网师园（小巧精致）、狮子林（假山王国）",
      "推荐时间：4-5月（杜鹃、牡丹盛开）或9-10月（桂花飘香），避开节假日",
      "看园方法：先看厅堂匾额楹联，再看建筑布局，最后看花木配置，三者合一才能读懂园林",
      "夜游网师园：'夜游拙政'或'古典夜园'是苏州园林的特色体验",
      "联游周边：可顺游苏州博物馆（贝聿铭设计）、平江路历史街区"
    ],
    classics: [
      "拙政园——苏州最大名园，明代御史王献臣所建",
      "留园——清代刘恕营造，以建筑空间艺术著称",
      "网师园——南宋史正志万卷堂旧址，'小园极则'",
      "狮子林——元代天如禅师惟则的菩提正宗寺后花园，以假山闻名"
    ],
    tips: "游苏州园林一定要慢。建议每个园子至少花2小时，重点欣赏'移步换景'的妙处。注意花窗漏景，'庭院深深深几许'的意境要在恰当的角度才能体会。拙政园和留园旺季人很多，建议早晨7:30前到达，或购买夜场票，体验不一样的园林。",
    source: "《长物志》·《园冶》·《闲情偶寄》",
    relatedPeople: [
      { id: "wenwenzheng", title: "文震亨", category: "历史人物", external: true, externalUrl: "https://baike.baidu.com/item/文震亨", brief: "明代文人，著《长物志》影响造园美学" },
      { id: "wangxianchen", title: "王献臣", category: "历史人物", external: true, externalUrl: "https://baike.baidu.com/item/王献臣", brief: "明代御史，拙政园建造者" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/论语", brief: "儒家经典，造园理念之本" },
      { id: "shijing", title: "《诗经》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/诗经", brief: "古典诗歌，园林匾额楹联多取其意" }
    ],
    relatedEvents: [
      { id: "suzhou_evt", title: "九处园林列入世遗", brief: "1997年拙政园等4处，2000年扩展为9处列入世界文化遗产" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，园林意境相通" }
    ],
    relatedArticles: [
      { id: "gugong", title: "故宫：紫禁城的六百年", category: "建筑古迹", brief: "同为世界文化遗产" },
      { id: "fengshui", title: "风水：天人合一", category: "民俗文化", brief: "园林是风水的艺术化呈现" },
      { id: "kunqu", title: "昆曲：百戏之祖", category: "传统艺术", brief: "苏州园林与昆曲同源于苏州" }
    ]
  },
  // ===== 神话传说 =====
  {
    id: "change",
    title: "嫦娥奔月：月宫仙子的千年守望",
    category: "神话传说",
    excerpt: "广寒宫里桂花香，最是人间思乡月。",
    content: "嫦娥奔月是中国最具代表性的神话之一。传说后羿射下九日后，西王母赐其不死药，嫦娥因故偷食仙药，身不由己飞升月宫。从此独居广寒宫，与捣药的玉兔、伐桂的吴刚为伴。这个凄美的故事承载着古人对月亮的无限想象，也成为中秋节的文化符号。",
    favorites: 4521,
    cover: "🌙",
    history: "嫦娥奔月的神话最早见于《归藏》（约战国时期），后见于《淮南子》、《搜神记》等汉魏典籍。在不同版本中，故事细节略有差异：有的说嫦娥是被迫飞天，有的说她主动偷药，有的说她为了保护仙药不被蓬蒙抢走而吞下。但'独守月宫'的核心情节始终未变。唐代李商隐'嫦娥应悔偷灵药，碧海青天夜夜心'，使这一形象更添凄美。中秋节拜月习俗也由此而来。",
    influence: "嫦娥奔月是中国月亮文化的核心意象，影响了诗词、绘画、戏剧等各个艺术门类。'床前明月光'（李白）、'明月几时有'（苏轼）、'海上生明月，天涯共此时'（张九龄）等千古名句都从这一神话中汲取灵感。月宫、玉兔、桂花树、伐桂树的意象反复出现在中国艺术中。2007年，'嫦娥一号'探月卫星以'嫦娥'命名，使古老神话与现代科技交相辉映。",
    tutorial: [
      "中秋习俗：赏月、拜月、吃月饼、玩花灯、猜灯谜，感受'天涯共此时'的浪漫",
      "相关诗词：读《古朗月行》（李白）、《嫦娥》（李商隐）、《水调歌头》（苏轼）",
      "传说扩展：了解'吴刚伐桂'、'玉兔捣药'、'桂花仙子'等相关神话",
      "艺术鉴赏：欣赏历代'嫦娥奔月'主题绘画，如五代周文矩《仙女图》",
      "科学延展：了解中国探月工程'嫦娥工程'，看看现实中如何'奔月'"
    ],
    classics: [
      "李白《古朗月行》——'小时不识月，呼作白玉盘'",
      "李商隐《嫦娥》——'嫦娥应悔偷灵药，碧海青天夜夜心'",
      "苏轼《水调歌头》——'但愿人长久，千里共婵娟'",
      "《嫦娥奔月》——敦煌壁画中的经典题材"
    ],
    tips: "中秋节是体验嫦娥文化的最佳时机。在南方一些地区，至今保留'拜月'习俗：妇女在月下设案，摆放月饼、瓜果，焚香拜月。给孩子的睡前故事里讲讲嫦娥、玉兔、吴刚，让孩子在仰望月亮时有更丰富的想象。中秋夜的月亮是一年中最圆的，'海上生明月，天涯共此时'——不妨给远方的人打个电话，遥寄相思。",
    source: "《归藏》·《淮南子·览冥训》·《搜神记》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，多有咏月名篇" },
      { id: "subaixie", title: "苏轼", category: "历史人物", brief: "宋代文豪，《水调歌头》写尽中秋情怀" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/诗经", brief: "收录'月出皎兮'等咏月诗篇" }
    ],
    relatedEvents: [
      { id: "change_evt", title: "后羿射日", brief: "传说后羿射下九日，西王母赐其不死药，嫦娥因故偷食" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", external: true, externalUrl: "https://baike.baidu.com/item/水调歌头·明月几时有", brief: "苏轼中秋怀弟名作，'但愿人长久'" },
      { id: "jingye", title: "静夜思", category: "诗词文学", brief: "李白月夜思乡名篇" }
    ],
    relatedArticles: [
      { id: "zhongqiu", title: "中秋：月圆人团圆", category: "节日节气", brief: "嫦娥故事的中秋文化背景" },
      { id: "pangu", title: "盘古开天：鸿蒙初辟的神话", category: "神话传说", brief: "同为创世神话" }
    ]
  },
  {
    id: "liangzhu",
    title: "梁祝化蝶：东方的罗密欧与朱丽叶",
    category: "神话传说",
    excerpt: "碧草青青花盛开，彩蝶双飞舞人间。",
    content: "梁山伯与祝英台是中国最著名的爱情传说，与《孟姜女》《白蛇传》《牛郎织女》并称中国四大爱情传说。故事讲述东晋时期，祝英台女扮男装与梁山伯同窗三载，归家后山伯上门求亲，方知英台已许配马家。山伯忧郁而终，英台出嫁途中绕道山伯坟前祭拜，坟墓裂开，英台跳入，二人化作蝴蝶翩然飞去。",
    favorites: 3876,
    cover: "🦋",
    history: "梁祝传说最早见于唐代梁载言《十道四蕃志》，'义妇祝英台与梁山伯同冢'。晚唐张读《宣室志》详细记载了'蝴蝶'情节。宋代以后，故事逐渐丰满，'同窗共读'、'十八相送'、'楼台会'、'化蝶'等核心情节相继成型。梁祝故事在民间流传一千七百余年，传播范围遍及中国及东亚、东南亚，被改编为越剧《梁祝》、小提琴协奏曲《梁祝》等无数艺术形式。",
    influence: "梁祝传说被称为'东方的罗密欧与朱丽叶'，是中国最具世界影响力的爱情故事之一。它体现了'对自由爱情的追求'与'对封建礼教的反抗'。1959年，小提琴协奏曲《梁山伯与祝英台》首演，将中国传统戏曲与西方交响乐完美融合，成为中国音乐史上的里程碑。越剧《梁祝》、电影《梁祝》、电视剧《梁祝》等各种艺术形式让这个故事家喻户晓，并入选国家级非物质文化遗产名录。",
    tutorial: [
      "听《梁祝》小提琴协奏曲：何占豪、陈钢1959年作品，最经典的版本",
      "看越剧《梁祝》：茅威涛、范瑞娟的版本最为经典",
      "去实地探访：浙江宁波梁祝文化公园、江苏宜兴祝英台故里、宁波梁山伯庙",
      "读相关文献：《宁波府志》《鄞县志》中有梁祝故里记载",
      "了解戏曲：除越剧外，还有京剧、川剧、豫剧等多个剧种演绎"
    ],
    classics: [
      "越剧《梁祝》——中国戏曲经典剧目",
      "小提琴协奏曲《梁祝》——'中国音乐走向世界的名片'",
      "电影《梁山伯与祝英台》——1963年邵氏黄梅调电影",
      "宁波梁祝文化公园——梁祝传说发源地"
    ],
    tips: "听《梁祝》最好的版本是俞丽拿演奏的。小提琴协奏曲的'楼台会'、'哭灵'、'化蝶'三个乐章是情感高潮。建议在安静的夜晚听完全曲（约25分钟），感受从相识相知到生离死别再到化蝶双飞的完整情感。带孩子听《梁祝》时，可以先讲讲故事情节，孩子会更有共鸣。",
    source: "《十道四蕃志》·《宣室志》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，梁祝故事中常见诗意表达" },
      { id: "liqingzhao", title: "李清照", category: "历史人物", brief: "宋代女词人，爱情诗作与梁祝精神相通" }
    ],
    relatedBooks: [
      { id: "shijing", title: "《诗经》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/诗经", brief: "收录爱情诗篇，梁祝精神源流" }
    ],
    relatedEvents: [
      { id: "liangzhu_evt", title: "梁祝同冢", brief: "东晋时期，祝英台与梁山伯合葬一处'义妇祝英台与梁山伯同冢'" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼怀人词作，与梁祝情感相通" }
    ],
    relatedArticles: [
      { id: "baishe", title: "白蛇传：千年等一回的爱情", category: "神话传说", brief: "中国四大爱情传说之一" },
      { id: "kunqu", title: "昆曲：百戏之祖", category: "传统艺术", brief: "越剧《梁祝》是戏曲经典" }
    ]
  },
  {
    id: "baishe",
    title: "白蛇传：千年等一回的爱情",
    category: "神话传说",
    excerpt: "西湖断桥边，白蛇与许仙的传奇。",
    content: "白蛇传是中国四大爱情传说之一。故事讲述修炼千年的白蛇精白素贞，羡慕人间生活，携青蛇小青化身人形下凡游玩。在西湖断桥边与青年许仙相遇，借伞定情，结为夫妇。后因法海和尚从中作梗，白素贞被镇压在雷峰塔下，许仙之子许仕林长大后高中状元，祭塔救母，一家团圆。",
    favorites: 3340,
    cover: "🐍",
    history: "白蛇传故事成型于宋代。南宋《西湖三塔记》已有雏形。明代冯梦龙《警世通言·白娘子永镇雷峰塔》对情节进行了重要扩展，使其成为完整的传奇。清代《雷峰塔传奇》又增加了'盗仙草'、'水漫金山'、'祭塔'等经典情节，使故事更加丰满。1924年，雷峰塔倒坍，白蛇传故事更是家喻户晓。",
    influence: "白蛇传是中国民间故事的瑰宝，对戏曲、影视、文学影响深远。它代表了'妖'对'人'的向往，对真善美的追求，被誉为'中国版的人鬼情未了'。京剧《白蛇传》、越剧《白蛇传》、电视剧《新白娘子传奇》等各种艺术形式让这个故事家喻户晓。'千年等一回'主题曲成为几代人的集体记忆。",
    tutorial: [
      "实地探访：杭州西湖断桥、雷峰塔是故事发生地",
      "看《新白娘子传奇》——1992年赵雅芝版是经典",
      "看京剧《白蛇传》——杜近芳的'游湖'、'水漫金山'是经典段落",
      "了解传统：参观中国丝绸博物馆，看'白蛇传'主题刺绣",
      "延伸阅读：读《警世通言》中的'白娘子永镇雷峰塔'"
    ],
    classics: [
      "京剧《白蛇传》——'游湖''结盟''惊变''盗草''水漫金山'",
      "越剧《白蛇传》——袁雪芬、范瑞娟经典版本",
      "电视剧《新白娘子传奇》——1992年经典",
      "动画电影《白蛇：缘起》——追光动画的现代演绎"
    ],
    tips: "去杭州西湖游玩时，断桥不要错过。建议早晨或黄昏前往，'断桥残雪'是西湖十景之一。雷峰塔是新塔，2002年重建，登塔可俯瞰西湖全景。'白蛇传'主题的文创产品很多，如丝绸、首饰等，都是很好的纪念品。带孩子看《新白娘子传奇》可以了解传统爱情观，但要注意引导孩子对'法海'角色的辩证认识。",
    source: "《警世通言·白娘子永镇雷峰塔》·《西湖三塔记》",
    relatedPeople: [
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，白蛇故事广为流传" },
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，'人妖之恋'涉及儒家伦理思考" }
    ],
    relatedBooks: [
      { id: "lunyu", title: "《论语》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/论语", brief: "儒家经典，'人'与'妖'的伦理思考" }
    ],
    relatedEvents: [
      { id: "baishe_evt", title: "雷峰塔倒坍", brief: "1924年9月25日，杭州雷峰塔倒坍，'白蛇传'故事更广为流传" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，情感相通" }
    ],
    relatedArticles: [
      { id: "liangzhu", title: "梁祝化蝶：东方的罗密欧与朱丽叶", category: "神话传说", brief: "中国四大爱情传说之一" },
      { id: "kunqu", title: "昆曲：百戏之祖", category: "传统艺术", brief: "越剧《白蛇传》是戏曲经典" }
    ]
  },
  {
    id: "pangu",
    title: "盘古开天：鸿蒙初辟的神话",
    category: "神话传说",
    excerpt: "天地玄黄，宇宙洪荒，日月盈昃，辰宿列张。",
    content: "盘古开天辟地是中国最古老的神话之一。传说远古时期，天地混沌如鸡子，盘古生于其中。一万八千年后，他醒来觉得混沌压抑，便用神斧劈开天地。天地分开后，盘古头顶天脚踏地，日复一日地支撑着，让天地越分越开。盘古死后，他的身体化为万物：气息化为风云，声音化为雷霆，眼睛化为日月，血液化为江河，肌肉化为田土。",
    favorites: 2780,
    cover: "🌌",
    history: "盘古神话最早见于三国时期徐整的《三五历纪》和《五运历年纪》。'天地混沌如鸡子，盘古生其中'，形象地描述了宇宙起源。到了南朝，任昉《述异记》进一步丰富了盘古垂死化身万物的情节：'头为四岳，目为日月，脂膏为江海，毛发为草木'。这一神话体现了中国古人朴素的天人合一思想，也是世界创世神话中极具想象力的一种。",
    influence: "盘古开天辟地的神话是中华文明的源头之一。'盘古'已成为中国文化的标志性符号，从盘古开天地到三皇五帝，再到夏商周，构成了完整的中华创世神话体系。'盘古精神'代表了中国人民开创未来的勇气和力量。盘古神话影响了文学、艺术、影视、游戏等众多领域，'盘古'成为众多游戏和影视作品中的角色。",
    tutorial: [
      "读相关典籍：《三五历纪》《述异记》《山海经》中都有盘古记载",
      "看相关影视：《宝莲灯》《封神演义》等都有盘古元素",
      "参观文化景点：盘古山（河南）、盘古洞（湖南）等地名与盘古传说相关",
      "朗诵《千字文》——'天地玄黄，宇宙洪荒，日月盈昃，辰宿列张'",
      "了解少数民族神话：苗族、瑶族等也有自己的盘古/盘王传说"
    ],
    classics: [
      "《三五历纪》——三国徐整，最早记载盘古神话",
      "《述异记》——南朝任昉，丰富了盘古化身万物的情节",
      "《千字文》——'天地玄黄，宇宙洪荒'成为蒙学经典",
      "盘古开天——众多游戏、影视中的经典IP"
    ],
    tips: "给孩子讲盘古故事时，可以配合简笔画或动画，让孩子的想象力飞扬。盘古顶天立地'日长一丈'的情景，可以让孩子表演。'垂死化身'的段落可以培养孩子对大自然的感恩意识——'我们呼吸的风，是盘古的气息；我们的眼睛，与盘古的日月同辉'。带孩子去大自然时，可以引导他们联想：山是盘古的骨骼，水是盘古的血液，草木是盘古的毛发。",
    source: "《三五历纪》·《五运历年纪》·《述异记》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，整理上古神话传说" },
      { id: "zhuangzi", title: "庄子", category: "历史人物", brief: "道家代表，'天地与我并生'的哲学与盘古精神相通" }
    ],
    relatedBooks: [
      { id: "laozi", title: "《道德经》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/道德经", brief: "道家根本经典，'道生一'与盘古创世相通" },
      { id: "shijing", title: "《诗经》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/诗经", brief: "最早诗歌总集，保留上古神话元素" }
    ],
    relatedEvents: [
      { id: "pangu_evt", title: "盘古垂死化身", brief: "传说盘古死后气息为风云、声为雷霆、目为日月，化身万物" }
    ],
    relatedPoems: [
      { id: "shuihu", title: "水调歌头", category: "诗词文学", brief: "苏轼词作，体现宇宙人生的思考" }
    ],
    relatedArticles: [
      { id: "change", title: "嫦娥奔月：月宫仙子的千年守望", category: "神话传说", brief: "同为上古神话" },
      { id: "nezha", title: "哪吒闹海：少年英雄的觉醒", category: "神话传说", brief: "同为经典神话传说" }
    ]
  },
  {
    id: "nezha",
    title: "哪吒闹海：少年英雄的觉醒",
    category: "神话传说",
    excerpt: "我命由我不由天，少年哪吒的反叛精神。",
    content: "哪吒闹海是中国最著名的少年英雄故事。传说陈塘关总兵李靖的第三子哪吒，出生时是一团肉球，被太乙真人收为弟子。他七岁时在东海洗澡，用混天绫搅动龙宫，打死巡海夜叉李艮，又抽了龙王三太子敖丙的龙筋。龙王到陈塘关兴师问罪，哪吒'剔骨还父、析肉还母'，以死谢罪。后太乙真人用莲花荷叶重塑其身，哪吒得以复活，最终降服龙王。",
    favorites: 5123,
    cover: "🔱",
    history: "哪吒故事源于佛教毗沙门天王之子那吒矩钵罗那，经中国化后形成本土哪吒形象。唐代《毗沙门仪轨》中已有哪吒形象，宋代《佛说观音义疏》《大宋宣和遗事》提到哪吒闹海。明代《西游记》《封神演义》对哪吒故事进行了系统化、生动化的整理，'闹海'、'剔骨还父'、'莲花化身'等情节深入人心。1979年上海美术电影制片厂《哪吒闹海》、2019年《哪吒之魔童降世》让哪吒形象代代相传。",
    influence: "哪吒是中国最具反叛精神的少年英雄形象。'我命由我不由天'的呐喊成为年轻人突破束缚的宣言。哪吒故事对'父子关系'、'权威'、'自我'等命题的探讨深刻影响了中国文化。2019年动画电影《哪吒之魔童降世》票房突破50亿元，成为中国动画电影的里程碑，也让哪吒成为新一代年轻人的精神偶像。",
    tutorial: [
      "看《哪吒闹海》——1979年上海美术电影制片厂经典动画",
      "看《哪吒之魔童降世》——2019年票房50亿+的现代演绎",
      "读《封神演义》——明代许仲琳原著，第十六回到第二十二回有完整哪吒故事",
      "了解道教文化：太乙真人、混天绫、乾坤圈、风火轮等法宝",
      "去陈塘关遗址：四川宜宾陈塘关传说地，江西武夷山也有相关传说"
    ],
    classics: [
      "《哪吒闹海》——1979年上海美影，中国动画巅峰之作",
      "《哪吒之魔童降世》——2019年国漫新巅峰",
      "《封神演义》——明代许仲琳原著",
      "哪吒——天津河西区'哪吒故里'，建有哪吒闹海主题展馆"
    ],
    tips: "带孩子看《哪吒闹海》时，可以重点讨论'我命由我不由天'的主题——但也要注意引导孩子认识到'父母的不易'。哪吒'剔骨还父'看似决绝，实则包含着复杂的亲子关系探讨，《哪吒之魔童降世》对此有更现代的诠释。建议家长和孩子一起看这部电影，然后讨论'如果你不被父母理解，你怎么办'。",
    source: "《封神演义》·《西游记》·《三教源流搜神大全》",
    relatedPeople: [
      { id: "kongzi", title: "孔子", category: "历史人物", brief: "儒家始祖，'父子'关系是哪吒故事核心议题之一" },
      { id: "libai", title: "李白", category: "历史人物", brief: "盛唐诗人，'我命由我不由天'的精神共鸣" }
    ],
    relatedBooks: [
      { id: "laozi", title: "《道德经》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/道德经", brief: "道家经典，太乙真人'道法自然'的精神" },
      { id: "shijing", title: "《诗经》", category: "经典典籍", external: true, externalUrl: "https://baike.baidu.com/item/诗经", brief: "收录上古神话元素" }
    ],
    relatedEvents: [
      { id: "nezha_evt", title: "哪吒闹海", brief: "传说哪吒七岁时在东海洗澡打死夜叉李艮、抽龙太子敖丙龙筋" }
    ],
    relatedPoems: [
      { id: "jiangjinjiu", title: "将进酒", category: "诗词文学", brief: "李白豪放诗作，体现反叛精神" }
    ],
    relatedArticles: [
      { id: "pangu", title: "盘古开天：鸿蒙初辟的神话", category: "神话传说", brief: "同为经典神话传说" },
      { id: "change", title: "嫦娥奔月：月宫仙子的千年守望", category: "神话传说", brief: "同为上古神话" }
    ]
  },
];
