// AI 深度内容生成器 - 不依赖外部 LLM API
// 基于文章分类、关联条目、本地文化知识库智能生成
// 知识图谱 / 时间线 / 现代解读 / 常见问题

import type { Article, RelatedItem } from "./knowledge-data";
import type {
  AIInsights,
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  TimelineEvent,
  ModernInterpretation,
  FAQ,
} from "./ai-insights-types";

// ===== 知识图谱生成 =====
// 根据文章的中心主题和关联条目，构建可视化知识图谱
export function generateKnowledgeGraph(article: Article): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // 1. 中心节点
  nodes.push({
    id: article.id,
    label: article.title.replace(/[《》]/g, "").split(/[:：·]/)[0],
    type: "core",
    brief: article.excerpt,
  });

  // 2. 关联人物节点
  (article.relatedPeople || []).forEach((p) => {
    nodes.push({
      id: `p_${p.id}`,
      label: p.title,
      type: "person",
      brief: p.brief,
      link: p.external ? undefined : p.id,
    });
    edges.push({
      source: article.id,
      target: `p_${p.id}`,
      label: "人物",
    });
  });

  // 3. 关联典籍节点
  (article.relatedBooks || []).forEach((b) => {
    nodes.push({
      id: `b_${b.id}`,
      label: b.title,
      type: "book",
      brief: b.brief,
      link: b.external ? undefined : b.id,
    });
    edges.push({
      source: article.id,
      target: `b_${b.id}`,
      label: "典籍",
    });
  });

  // 4. 关联事件节点
  (article.relatedEvents || []).forEach((e) => {
    nodes.push({
      id: `e_${e.id}`,
      label: e.title,
      type: "event",
      brief: e.brief,
      link: e.external ? undefined : e.id,
    });
    edges.push({
      source: article.id,
      target: `e_${e.id}`,
      label: "事件",
    });
  });

  // 5. 关联诗词节点
  (article.relatedPoems || []).forEach((p) => {
    nodes.push({
      id: `pm_${p.id}`,
      label: p.title,
      type: "concept",
      brief: p.brief,
      link: p.external ? undefined : p.id,
    });
    edges.push({
      source: article.id,
      target: `pm_${p.id}`,
      label: "诗词",
    });
  });

  return { nodes, edges };
}

// ===== 时间线生成 =====
const ERA_EVENTS: Record<string, TimelineEvent[]> = {
  "节气": [
    { year: "战国", title: "二十四节气体系初成", description: "《吕氏春秋》中已有'八节'记载" },
    { year: "西汉", title: "二十四节气完整确立", description: "《淮南子·天文训》完整记录了二十四节气" },
    { year: "公元前104年", title: "《太初历》纳入节气", description: "汉武帝时，二十四节气正式入历" },
    { year: "2016年", title: "列入联合国非遗名录", description: "二十四节气被列入人类非物质文化遗产代表作名录" },
  ],
  "节日": [
    { year: "先秦", title: "岁时节日萌芽", description: "《诗经》《楚辞》中已有节日活动记载" },
    { year: "汉代", title: "节日体系基本形成", description: "《汉书》中确立了主要传统节日的日期" },
    { year: "唐代", title: "法定节日制度", description: "《唐六典》明确了假节日制度" },
    { year: "宋代", title: "世俗化繁荣", description: "《东京梦华录》记载了节日的民间盛况" },
  ],
  "诗词": [
    { year: "先秦", title: "中国诗歌起源", description: "《诗经》开创了中国诗歌的现实主义传统" },
    { year: "战国", title: "楚辞诞生", description: "屈原开创了浪漫主义诗风" },
    { year: "唐代", title: "诗歌黄金时代", description: "李白、杜甫等大家辈出，唐诗成为中华文化瑰宝" },
    { year: "宋代", title: "词作鼎盛", description: "苏轼、李清照等词人将词推向新高度" },
  ],
  "典籍": [
    { year: "先秦", title: "经典著作涌现", description: "诸子百家思想大爆发" },
    { year: "汉代", title: "经学确立", description: "罢黜百家，独尊儒术，五经成为官方经典" },
    { year: "唐代", title: "《五经正义》", description: "孔颖达主编，统一经学解释" },
    { year: "宋代", title: "程朱理学", description: "《四书》地位上升，与《五经》并称'四书五经'" },
  ],
  "传统艺术": [
    { year: "先秦", title: "礼乐制度形成", description: "周公制礼作乐奠定了中华艺术基础" },
    { year: "汉代", title: "乐府设立", description: "汉武帝设立乐府，收集整理民间艺术" },
    { year: "唐代", title: "艺术全面繁荣", description: "诗歌、书法、绘画、音乐全面兴盛" },
    { year: "宋元", title: "戏曲成熟", description: "元杂剧与宋词成为时代艺术标志" },
  ],
  "传统技艺": [
    { year: "新石器", title: "陶器诞生", description: "彩陶、黑陶等早期陶瓷技艺出现" },
    { year: "商周", title: "青铜铸造", description: "青铜器制作技艺达到高峰" },
    { year: "唐宋", title: "技艺成熟", description: "纺织、瓷器、印刷等技艺达到世界先进水平" },
    { year: "明清", title: "工艺集大成", description: "各种传统技艺总结提高，形成地方特色流派" },
  ],
  "民俗": [
    { year: "先秦", title: "民俗形成", description: "《诗经》《楚辞》中已记载丰富民俗" },
    { year: "汉代", title: "礼俗体系", description: "《礼记》《周礼》系统整理了民俗规范" },
    { year: "唐代", title: "民俗繁荣", description: "节俗、茶道等进入生活美学层面" },
    { year: "明清", title: "民俗稳定", description: "《荆楚岁时记》《燕京岁时记》等整理各地民俗" },
  ],
  "历史人物": [
    { year: "春秋战国", title: "思想巨匠辈出", description: "孔子、老子、庄子等奠定中华思想根基" },
    { year: "汉唐", title: "文化高峰", description: "司马迁、班固、李白、杜甫等大家辈出" },
    { year: "宋元", title: "书画艺术鼎盛", description: "苏轼、王羲之等文人引领艺术新潮" },
    { year: "明清", title: "思想集大成", description: "王阳明、曹雪芹等成为时代代表" },
  ],
  "建筑古迹": [
    { year: "新石器", title: "建筑起源", description: "半坡遗址、河姆渡遗址出现原始建筑" },
    { year: "先秦", title: "宫殿雏形", description: "高台建筑与礼制建筑开始形成" },
    { year: "秦汉", title: "帝国建筑", description: "长城、阿房宫、未央宫等大型建筑出现" },
    { year: "明清", title: "建筑集大成", description: "故宫、天坛等成为世界建筑瑰宝" },
  ],
  "神话传说": [
    { year: "远古", title: "神话诞生", description: "盘古开天、女娲造人等创世神话形成" },
    { year: "夏商周", title: "神话体系化", description: "《山海经》《楚辞》系统整理神话" },
    { year: "汉代", title: "神话传播", description: "《淮南子》《搜神记》扩展神话故事" },
    { year: "唐宋", title: "民间文学化", description: "神话与诗词、戏曲、绘画深度融合" },
  ],
};

export function generateTimeline(article: Article): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  // 添加关联事件
  (article.relatedEvents || []).forEach((e) => {
    events.push({
      year: "相关",
      title: e.title,
      description: e.brief || "点击了解详情",
      link: e.external ? undefined : e.id,
    });
  });

  // 添加分类背景时代
  const categoryKey = getCategoryKey(article.category);
  const eraEvents = ERA_EVENTS[categoryKey] || ERA_EVENTS["民俗"];
  events.push(...eraEvents);

  // 按时间排序（中文时间按字典序大致符合）
  events.sort((a, b) => {
    if (a.year === "相关") return -1;
    if (b.year === "相关") return 1;
    return a.year.localeCompare(b.year, "zh-CN");
  });

  return events;
}

// ===== 现代解读生成 =====
const MODERN_INTERPRETATION_TEMPLATES: Record<string, ModernInterpretation> = {
  "节气": {
    summary: "二十四节气是古人观天察地、顺应自然的智慧结晶，体现了中华民族'天人合一'的哲学思想。它不仅指导农业生产，更蕴含着丰富的生活美学——每个节气都有其独特的气候特征、物候现象和文化习俗。",
    applications: [
      "健康养生：节气饮食、节气起居调节身体机能",
      "文化教育：作为儿童传统文化启蒙的重要内容",
      "旅游文化：结合节气设计文化旅游路线，体验不同时令之美",
      "现代设计：节气色彩、节气文化在产品设计中的应用"
    ],
    perspectives: [
      "在快节奏的现代生活中，重拾节气文化可以帮助我们重新建立与自然的连接",
      "节气所代表的'时令感'是中华文化独有的时间哲学",
      "从节气视角看待气候变化，可以激发新的环保意识"
    ]
  },
  "节日": {
    summary: "传统节日承载着中华民族的历史记忆、伦理观念和文化情感。从农耕文明中诞生的节日，历经千年演变，至今仍是连接家人、传承文化的重要纽带。",
    applications: [
      "家庭文化：节日是家庭团聚、情感交流的契机",
      "非遗保护：节俗活动是非物质文化遗产的重要组成部分",
      "文创产业：节日文化催生了大量文创产品和旅游经济",
      "国际传播：春节、中秋等已成为中国文化走向世界的重要载体"
    ],
    perspectives: [
      "传统节日的复兴体现了现代人对文化根脉的追寻",
      "在全球化时代，节日文化是个性化表达和文化自信的体现",
      "重新理解节日的文化内涵，有助于建立更具人文关怀的生活方式"
    ]
  },
  "诗词": {
    summary: "中国诗词是语言艺术的巅峰，每一首诗都凝结着诗人的人生感悟、时代精神和审美追求。从《诗经》到唐诗宋词，诗词记录了中华民族的情感轨迹。",
    applications: [
      "审美教育：诗词是培养审美情趣的最佳教材",
      "语言训练：诗词学习能提升语言表达能力和文学素养",
      "文化认同：诗词是民族文化认同的重要载体",
      "心理疗愈：诗词中的情感共鸣具有心理疏导作用"
    ],
    perspectives: [
      "读诗词不仅是学文学，更是学做人、悟人生",
      "在数字化时代，诗词以音乐、影视、游戏等新形式焕发新生",
      "诗词中的'意境'和'留白'为现代艺术提供了独特灵感"
    ]
  },
  "典籍": {
    summary: "经典典籍是中华文明的根基，承载着先哲的智慧和民族的精神密码。从《诗经》到《论语》，从《道德经》到《黄帝内经》，这些典籍塑造了我们的思维方式和文化基因。",
    applications: [
      "教育传承：典籍是国学教育和文化传承的源泉",
      "治国理政：'半部《论语》治天下'反映其现实意义",
      "文化研究：典籍为各类人文学科提供原始材料",
      "国际交流：典籍翻译促进了中外文明互鉴"
    ],
    perspectives: [
      "读典籍不是复古，而是从中获取应对现代问题的智慧",
      "在信息爆炸的时代，典籍的'慢读'精神尤为珍贵",
      "用现代视角重新解读典籍，可以发现其永恒价值"
    ]
  },
  "传统艺术": {
    summary: "传统艺术是中华民族审美精神的外在表达。从戏曲到书画，从音乐到舞蹈，每一种艺术形式都凝聚着世代艺人的智慧和创造力。",
    applications: [
      "文化传承：传统艺术是民族记忆的活态载体",
      "教育功能：传统艺术教育培养美育素养",
      "国际交流：京剧、昆曲等已成为中外文化交流的桥梁",
      "创意产业：传统艺术元素为现代设计提供灵感源泉"
    ],
    perspectives: [
      "传统艺术不是'老古董'，而是'活态的文化'",
      "在快节奏生活中，传统艺术的'慢'与'静'尤为珍贵",
      "传统艺术的传承需要与现代生活相结合"
    ]
  },
  "传统技艺": {
    summary: "传统技艺是中华工匠精神的集中体现。一件工艺品的诞生，往往凝聚着匠人数十年甚至毕生的心血，承载着对完美的极致追求。",
    applications: [
      "非遗保护：传统技艺是非物质文化遗产保护的核心",
      "文创产业：传统技艺元素在文创产品中焕发新生",
      "工匠精神：传统技艺的精益求精是现代制造业的精神源泉",
      "美育教育：传统技艺体验是审美教育的重要环节"
    ],
    perspectives: [
      "在机器大生产时代，传统手工艺的'人味'与'温度'尤为珍贵",
      "传统技艺的传承不仅是技术，更是文化记忆的延续",
      "将传统技艺与现代生活结合，可以开辟新天地"
    ]
  },
  "民俗": {
    summary: "民俗是民间生活的活化石，承载着各地人民的智慧、信仰和情感。茶礼、节俗、婚丧嫁娶等民俗文化，是理解中华文化深层结构的重要窗口。",
    applications: [
      "文化认同：民俗是文化认同和身份归属感的基础",
      "社区凝聚：民俗活动增强社区凝聚力和归属感",
      "文化旅游：民俗文化是重要的文化旅游资源",
      "学术研究：民俗学是研究社会历史的重要学科"
    ],
    perspectives: [
      "在现代化进程中，民俗文化的保护与创新同等重要",
      "民俗文化的复兴体现了对'生活美学'的追寻",
      "民俗文化与日常生活密不可分，是'活'的文化遗产"
    ]
  },
  "历史人物": {
    summary: "历史人物是民族精神的代言人。从孔子到李白，从苏东坡到李清照，他们的言行塑造了中华文化的品格。读懂他们，就是读懂我们的文化基因。",
    applications: [
      "人格塑造：历史人物的品格是青少年成长的精神资源",
      "文化认同：历史人物是民族文化认同的重要符号",
      "学术研究：历史人物研究是人文社科的重要领域",
      "文化旅游：名人故里、遗迹是文化旅游的重要资源"
    ],
    perspectives: [
      "评价历史人物应回到其时代背景，避免'现代化'解读",
      "历史人物的当代价值在于其精神品格而非具体行为",
      "通过历史人物，可以建立'古今对话'的桥梁"
    ]
  },
  "建筑古迹": {
    summary: "建筑古迹是凝固的历史与艺术。从故宫到长城，从莫高窟到苏州园林，每一处古迹都诉说着一个时代的辉煌，是中华民族的文化瑰宝。",
    applications: [
      "文化遗产：建筑古迹是世界文化遗产的核心",
      "文化旅游：建筑古迹是文化旅游的核心吸引力",
      "建筑研究：传统建筑为现代建筑设计提供灵感",
      "文化教育：建筑古迹是文化教育的重要课堂"
    ],
    perspectives: [
      "在现代化进程中，传统建筑的保护与利用需要平衡",
      "建筑古迹不仅是物质遗产，更是精神家园",
      "数字化技术为古迹保护与传播提供了新手段"
    ]
  },
  "神话传说": {
    summary: "神话传说是民族精神的源头。嫦娥奔月、梁祝化蝶、盘古开天，这些故事塑造了中华民族的想象力和价值观，是文化创新的不竭源泉。",
    applications: [
      "文学创作：神话为现代文学、影视、游戏提供素材",
      "艺术灵感：神话形象是绘画、雕塑的重要主题",
      "文化认同：神话是民族文化认同的精神基因",
      "教育价值：神话故事是儿童想象力和价值观培养的载体"
    ],
    perspectives: [
      "神话是民族的精神密码，理解神话就是理解民族",
      "在科技时代，神话的'飞天'梦正在被实现",
      "神话的现代演绎让古老故事焕发新生命"
    ]
  },
};

export function generateModernInterpretation(article: Article): ModernInterpretation {
  const key = getCategoryKey(article.category);
  return MODERN_INTERPRETATION_TEMPLATES[key] || MODERN_INTERPRETATION_TEMPLATES["民俗"];
}

// ===== 常见问题生成 =====
const FAQ_TEMPLATES: Record<string, (a: Article) => FAQ[]> = {
  "诗词文学": (a) => [
    {
      question: `《${a.title.split(/[·：:]/)[0]}》的创作背景是什么？`,
      answer: a.history || `《${a.title}》创作于特定历史时期，与作者的人生经历、时代背景密切相关。点击历史背景了解详情。`,
      link: undefined
    },
    {
      question: `${a.title}的主旨是什么？`,
      answer: `理解古诗词的主旨需要结合诗人的人生经历和时代背景。建议先了解创作背景，再品味具体诗句的意境。`,
      link: undefined
    },
    {
      question: `如何背诵和鉴赏${a.title}？`,
      answer: `背诵古诗词可以通过理解意境、分段记忆、反复吟诵等方法。鉴赏时注意'诗眼'、典故运用、意象选择。`,
      link: undefined
    },
    {
      question: `${a.title}对后世有什么影响？`,
      answer: a.influence || `${a.title}作为经典作品，对后世文学创作、审美趣味、文化心理都产生了深远影响。`,
      link: undefined
    }
  ],
  "节日节气": (a) => [
    {
      question: `${a.title}的日期和起源是什么？`,
      answer: a.history || `${a.title}的日期和起源与古代天文历法、农耕文化密切相关。`,
      link: undefined
    },
    {
      question: `${a.title}有哪些传统习俗？`,
      answer: `${a.title}的习俗因地域而异，主要包括祭祀活动、饮食习俗、民间娱乐等。建议了解当地的具体传承。`,
      link: undefined
    },
    {
      question: `${a.title}的现代意义是什么？`,
      answer: `在现代生活中，${a.title}是家庭团聚、文化传承、情感寄托的重要时刻。它让我们与传统建立连接。`,
      link: undefined
    },
    {
      question: `${a.title}与二十四节气/农历有什么关系？`,
      answer: a.category === "节日节气" 
        ? `${a.title}基于特定的历法体系，与农耕文明的天文观测密切相关。`
        : `${a.title}与节庆时间相关，体现了中华历法的智慧。`,
      link: undefined
    }
  ],
  "传统艺术": (a) => [
    {
      question: `${a.title}起源于何时？`,
      answer: a.history || `${a.title}的起源可以追溯到古代，与当时的社会文化背景密切相关。`,
      link: undefined
    },
    {
      question: `${a.title}的代表作有哪些？`,
      answer: (a.classics && a.classics.length > 0) 
        ? `${a.title}的经典作品包括：${a.classics.slice(0, 3).join('、')}等。`
        : `${a.title}有许多经典作品，建议查阅专业文献了解更多。`,
      link: undefined
    },
    {
      question: `${a.title}的现状如何？`,
      answer: `${a.title}已被列入非物质文化遗产名录，在传承与创新中焕发新的活力。当代艺术家们在保留传统精髓的同时，也融入了现代元素。`,
      link: undefined
    },
    {
      question: `如何入门${a.title}？`,
      answer: a.tutorial ? a.tutorial.slice(0, 3).join('；') : `了解${a.title}可以从经典作品入手，配合相关书籍和现场体验。`,
      link: undefined
    }
  ],
  "传统技艺": (a) => [
    {
      question: `${a.title}的历史有多长？`,
      answer: a.history || `${a.title}有着悠久的历史，是中华工匠精神的体现。`,
      link: undefined
    },
    {
      question: `${a.title}的代表作品有哪些？`,
      answer: (a.classics && a.classics.length > 0) 
        ? `${a.title}的经典代表包括：${a.classics.slice(0, 3).join('、')}等。`
        : `${a.title}的代表作丰富多样，体现了不同时代和地域的特色。`,
      link: undefined
    },
    {
      question: `${a.title}的工艺流程复杂吗？`,
      answer: `${a.title}的工艺需要长期的学习和实践，往往需要数年甚至数十年的积累才能真正掌握。`,
      link: undefined
    },
    {
      question: `普通人可以学习${a.title}吗？`,
      answer: a.tutorial ? a.tutorial[0] : `${a.title}在现代社会有各种体验课程和入门教材，普通人也可以尝试学习。`,
      link: undefined
    }
  ],
  "经典典籍": (a) => [
    {
      question: `${a.title}的成书年代和作者是谁？`,
      answer: a.history || `${a.title}的成书跨越较长历史时期，是集体智慧的结晶。`,
      link: undefined
    },
    {
      question: `${a.title}的核心思想是什么？`,
      answer: `${a.title}的核心思想贯穿中华文化数千年，是理解中国传统思想的关键。`,
      link: undefined
    },
    {
      question: `现代人为什么要读${a.title}？`,
      answer: `${a.title}的智慧对现代人仍然具有指导意义，可以帮助我们理解文化基因、应对现实问题。`,
      link: undefined
    },
    {
      question: `如何入门${a.title}？`,
      answer: `建议从注译本和导读入手，配合权威讲解，逐步深入了解${a.title}的核心思想。`,
      link: undefined
    }
  ],
  "历史人物": (a) => [
    {
      question: `${a.title.replace(/[:：].*/, '').replace(/[：:].*/, '')}的生平简介？`,
      answer: a.history || `${a.title}是中国历史上的重要人物，对后世产生了深远影响。`,
      link: undefined
    },
    {
      question: `${a.title}的主要贡献是什么？`,
      answer: `${a.title}在多个领域都有重要贡献，涵盖了思想、文学、艺术等方面。`,
      link: undefined
    },
    {
      question: `${a.title}对后世有什么影响？`,
      answer: a.influence || `${a.title}的影响深远持久，塑造了中华文化的某些重要面向。`,
      link: undefined
    },
    {
      question: `${a.title}有哪些代表作品？`,
      answer: `${a.title}留下了许多珍贵的文化遗产，其作品被世代传承和研习。`,
      link: undefined
    }
  ],
  "建筑古迹": (a) => [
    {
      question: `${a.title}建造于何时？`,
      answer: a.history || `${a.title}的建造历史跨越较长时期，是中华民族的伟大工程。`,
      link: undefined
    },
    {
      question: `${a.title}为什么重要？`,
      answer: a.influence || `${a.title}是中华民族文化的重要象征，体现了古代劳动人民的智慧。`,
      link: undefined
    },
    {
      question: `${a.title}有哪些看点？`,
      answer: a.tutorial ? a.tutorial.slice(0, 3).join('；') : `${a.title}的看点丰富，建议实地参观体验。`,
      link: undefined
    },
    {
      question: `${a.title}的现状如何？`,
      answer: `${a.title}已被列入世界文化遗产名录，得到良好的保护与传承。`,
      link: undefined
    }
  ],
  "神话传说": (a) => [
    {
      question: `${a.title}讲述了什么故事？`,
      answer: a.content || `${a.title}是中华文化中经典的传说故事，承载着民族的文化记忆。`,
      link: undefined
    },
    {
      question: `${a.title}的起源是什么？`,
      answer: a.history || `${a.title}的起源可以追溯到远古时期，与先民的世界观密切相关。`,
      link: undefined
    },
    {
      question: `${a.title}的文化意义是什么？`,
      answer: a.influence || `${a.title}作为经典传说，承载着民族精神、价值观和想象力。`,
      link: undefined
    },
    {
      question: `${a.title}在现代有哪些演绎？`,
      answer: `${a.title}被改编为戏曲、影视、动画等多种艺术形式，在新时代焕发新生命。`,
      link: undefined
    }
  ],
  "民俗文化": (a) => [
    {
      question: `${a.title}的起源是什么？`,
      answer: a.history || `${a.title}的起源与中华民族的生活实践密切相关。`,
      link: undefined
    },
    {
      question: `${a.title}包含哪些内容？`,
      answer: `${a.title}包含了丰富的生活智慧和文化内涵，是中华文化的重要组成部分。`,
      link: undefined
    },
    {
      question: `${a.title}对现代生活有什么影响？`,
      answer: `${a.title}深刻影响着现代中国人的生活方式和价值观念。`,
      link: undefined
    },
    {
      question: `如何体验${a.title}？`,
      answer: `${a.title}的最佳体验方式是参与相关活动，阅读经典文献，或实地探访相关场所。`,
      link: undefined
    }
  ],
};

export function generateFAQ(article: Article): FAQ[] {
  const key = getCategoryKey(article.category);
  const generator = FAQ_TEMPLATES[key] || FAQ_TEMPLATES["民俗文化"];
  return generator(article);
}

// ===== 辅助函数 =====
function getCategoryKey(category: string): string {
  // 将新分类名映射到模板键
  if (["节气", "节日", "节日节气"].includes(category)) return "节日节气";
  if (["诗词"].includes(category)) return "诗词文学";
  if (["典籍", "经典典籍"].includes(category)) return "经典典籍";
  if (["戏曲", "传统艺术"].includes(category)) return "传统艺术";
  if (["工艺", "非遗", "传统技艺"].includes(category)) return "传统技艺";
  if (["民俗", "民俗文化"].includes(category)) return "民俗文化";
  if (["人物", "历史人物"].includes(category)) return "历史人物";
  if (["建筑", "建筑古迹"].includes(category)) return "建筑古迹";
  if (["神话", "神话传说"].includes(category)) return "神话传说";
  return "民俗文化";
}

// ===== 统一入口 =====
export function generateAIInsights(article: Article): AIInsights {
  return {
    knowledgeGraph: generateKnowledgeGraph(article),
    timeline: generateTimeline(article),
    modernInterpretation: generateModernInterpretation(article),
    faq: generateFAQ(article),
  };
}
