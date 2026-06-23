export interface Quote {
  text: string;
  title: string;
  author: string;
  dynasty: string;
}

export interface Source {
  title: string;
  type: 'book' | 'database' | 'website';
  url?: string;
}

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  quotes: Quote[];
  sources: Source[];
  interpretations?: string;
  scholarAnalysis?: string;
}

export const culturalKnowledge: Record<string, KnowledgeEntry> = {
  "李白喝酒": {
    id: "li-bai-drinking",
    question: "李白为什么喜欢喝酒？",
    answer: "李白嗜酒，与其豪放洒脱的个性、诗歌创作的灵感需求以及人生际遇密切相关。酒是他抒发豪情、排解苦闷、激发创作灵感的重要媒介。",
    quotes: [
      {
        text: "君不见黄河之水天上来，奔流到海不复回。君不见高堂明镜悲白发，朝如青丝暮成雪。人生得意须尽欢，莫使金樽空对月。",
        title: "将进酒",
        author: "李白",
        dynasty: "唐"
      },
      {
        text: "花间一壶酒，独酌无相亲。举杯邀明月，对影成三人。",
        title: "月下独酌",
        author: "李白",
        dynasty: "唐"
      },
      {
        text: "抽刀断水水更流，举杯消愁愁更愁。",
        title: "宣州谢朓楼饯别校书叔云",
        author: "李白",
        dynasty: "唐"
      }
    ],
    sources: [
      { title: "李太白集", type: "book" },
      { title: "全唐诗", type: "book" },
      { title: "国家图书馆数字资源", type: "database" }
    ],
    interpretations: "李白的饮酒诗展现了他对自由、理想和生命的深刻思考。酒在他的诗歌中不仅是物质的饮品，更是精神的寄托和艺术的催化剂。",
    scholarAnalysis: "学者陈贻焮认为，李白的饮酒是一种'审美沉醉'，他通过饮酒达到一种超越现实、进入艺术创作最佳状态的境界。这种状态与庄子的'心斋'、'坐忘'有相似之处。"
  },
  "端午节由来": {
    id: "dragon-boat-festival-origin",
    question: "端午节的由来？",
    answer: "端午节起源于中国古代，最初是祛病防疫的节日，后因纪念屈原而逐渐演变。农历五月初五，民间有吃粽子、赛龙舟、挂艾草等习俗。",
    quotes: [
      {
        text: "节分端午自谁言，万古传闻为屈原。堪笑楚江空渺渺，不能洗得直臣冤。",
        title: "端午",
        author: "文秀",
        dynasty: "唐"
      }
    ],
    sources: [
      { title: "荆楚岁时记", type: "book" },
      { title: "史记·屈原贾生列传", type: "book" },
      { title: "中国非物质文化遗产网", type: "website", url: "https://www.ihchina.cn" }
    ],
    interpretations: "端午节的习俗蕴含着古人对自然的敬畏和对健康的追求。龙舟竞渡象征着团结奋进，粽子则承载着对先贤的怀念。",
    scholarAnalysis: "民俗学家钟敬文指出，端午节是中国古代'卫生防疫节'的遗存，其习俗如挂艾草、佩香囊、饮雄黄酒等，都体现了古人预防疾病的智慧。"
  },
  "中秋赏月": {
    id: "mid-autumn-moon",
    question: "为什么中秋要赏月？",
    answer: "中秋赏月源于古人对月亮的崇拜和对团圆的向往。八月十五月儿圆，人们通过赏月寄托思念、祈求团圆，形成了独特的中秋文化。",
    quotes: [
      {
        text: "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。",
        title: "水调歌头",
        author: "苏轼",
        dynasty: "宋"
      },
      {
        text: "但愿人长久，千里共婵娟。",
        title: "水调歌头",
        author: "苏轼",
        dynasty: "宋"
      },
      {
        text: "海上生明月，天涯共此时。",
        title: "望月怀远",
        author: "张九龄",
        dynasty: "唐"
      }
    ],
    sources: [
      { title: "东京梦华录", type: "book" },
      { title: "梦梁录", type: "book" },
      { title: "中国国家天文", type: "website" }
    ],
    interpretations: "中秋明月象征着圆满和美好，赏月活动体现了中国人对家庭团聚、人间美好的追求。月色的皎洁也引发了无数文人的哲思与诗情。",
    scholarAnalysis: "历史学家杨宽认为，中秋节起源于上古的秋分祭月，经过唐宋时期的发展，逐渐从宗教祭祀演变为民间的团圆节日。"
  },
  "二十四节气": {
    id: "24-solar-terms",
    question: "什么是二十四节气？",
    answer: "二十四节气是中国古代订立的一种用来指导农事的补充历法，将一年分为二十四个节气，每个节气约15天，反映季节变化、物候特征和气候规律。",
    quotes: [
      {
        text: "春雨惊春清谷天，夏满芒夏暑相连。秋处露秋寒霜降，冬雪雪冬小大寒。",
        title: "二十四节气歌",
        author: "佚名",
        dynasty: "清"
      }
    ],
    sources: [
      { title: "月令七十二候集解", type: "book" },
      { title: "淮南子", type: "book" },
      { title: "联合国教科文组织非遗名录", type: "database" }
    ],
    interpretations: "二十四节气是古人观察太阳周年运动，认知一年中时令、气候、物候等变化规律所形成的知识体系，体现了中国人与自然和谐相处的智慧。",
    scholarAnalysis: "气象学家竺可桢认为，二十四节气的创立是中国古代天文学和农学的重要成就，其精确性反映了中国古代科学技术的高度发展。"
  },
  "诗经风雅颂": {
    id: "shijing-feng-ya-song",
    question: "《诗经》的'风雅颂'指什么？",
    answer: "《诗经》是中国最早的诗歌总集，分为风、雅、颂三部分。'风'是各地民歌，'雅'是宫廷乐歌，'颂'是宗庙祭祀乐歌，合称'风雅颂'。",
    quotes: [
      {
        text: "关关雎鸠，在河之洲。窈窕淑女，君子好逑。",
        title: "关雎",
        author: "佚名",
        dynasty: "周"
      },
      {
        text: "执子之手，与子偕老。",
        title: "击鼓",
        author: "佚名",
        dynasty: "周"
      }
    ],
    sources: [
      { title: "毛诗正义", type: "book" },
      { title: "诗集传", type: "book" },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "风雅颂的分类反映了周代社会的不同层面：风反映民间生活，雅体现贵族文化，颂彰显祭祀礼仪，共同构成了周代社会的完整画卷。",
    scholarAnalysis: "文学史家游国恩指出，风雅颂的划分不仅是音乐上的区别，更反映了社会阶层和用途的差异，是研究周代社会的重要史料。"
  },
  "苏轼代表作": {
    id: "su-shi-works",
    question: "苏东坡有哪些代表作？",
    answer: "苏轼是宋代文学巨匠，诗词文赋书画皆精。其代表作包括《水调歌头·明月几时有》《念奴娇·赤壁怀古》《前后赤壁赋》等，展现了豪放旷达的艺术风格。",
    quotes: [
      {
        text: "大江东去，浪淘尽，千古风流人物。",
        title: "念奴娇·赤壁怀古",
        author: "苏轼",
        dynasty: "宋"
      },
      {
        text: "寄蜉蝣于天地，渺沧海之一粟。",
        title: "前赤壁赋",
        author: "苏轼",
        dynasty: "宋"
      },
      {
        text: "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。",
        title: "定风波",
        author: "苏轼",
        dynasty: "宋"
      }
    ],
    sources: [
      { title: "东坡全集", type: "book" },
      { title: "全宋词", type: "book" },
      { title: "苏轼研究资料汇编", type: "database" }
    ],
    interpretations: "苏轼的作品体现了他豁达的人生态度和深邃的哲理思考，无论身处顺境逆境，都能保持乐观和从容。",
    scholarAnalysis: "词学家唐圭璋认为，苏轼开创了豪放词派，将词从'艳科'提升到可以抒写人生哲理和家国情怀的高度，对后世词坛影响深远。"
  },
  "昆曲百戏之祖": {
    id: "kunqu-opera",
    question: "昆曲为何被称为'百戏之祖'？",
    answer: "昆曲是中国最古老的戏曲剧种之一，起源于元末明初的昆山。它融合了唱、念、做、打等多种艺术形式，对京剧、越剧等众多戏曲剧种产生了深远影响，被誉为'百戏之祖'。",
    quotes: [],
    sources: [
      { title: "昆剧发展史", type: "book" },
      { title: "中国戏曲通史", type: "book" },
      { title: "联合国教科文组织非遗名录", type: "database" }
    ],
    interpretations: "昆曲的艺术体系完整，表演程式严谨，音乐唱腔优美，是中国戏曲艺术的集大成者，为后世戏曲发展奠定了基础。",
    scholarAnalysis: "戏剧理论家张庚认为，昆曲在表演艺术上的成就达到了中国古典戏剧的巅峰，其'唱、念、做、打'的综合表演体系被后来的各种戏曲所吸收和借鉴。"
  },
  "孔子思想": {
    id: "confucius-thought",
    question: "孔子的核心思想是什么？",
    answer: "孔子的核心思想是'仁'和'礼'。'仁'是爱人，是道德修养的最高境界；'礼'是社会秩序和行为规范。他主张通过修身、齐家、治国、平天下来实现社会和谐。",
    quotes: [
      {
        text: "仁者爱人。",
        title: "论语·颜渊",
        author: "孔子",
        dynasty: "春秋"
      },
      {
        text: "克己复礼为仁。",
        title: "论语·颜渊",
        author: "孔子",
        dynasty: "春秋"
      },
      {
        text: "己所不欲，勿施于人。",
        title: "论语·卫灵公",
        author: "孔子",
        dynasty: "春秋"
      }
    ],
    sources: [
      { title: "论语", type: "book" },
      { title: "史记·孔子世家", type: "book" },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "孔子的思想强调道德修养和社会责任，主张通过教育和自我完善来实现个人价值和社会和谐，对中国传统文化产生了深远影响。",
    scholarAnalysis: "哲学家冯友兰认为，孔子的'仁'学是一种道德理想主义，强调通过内在的道德自觉来达到外在的社会秩序，是中国传统文化的核心精神。"
  },
  "道德经": {
    id: "tao-te-ching",
    question: "《道德经》的核心思想是什么？",
    answer: "《道德经》是道家学派的经典著作，核心思想是'道'。道是宇宙的本源和规律，主张顺应自然、无为而治，追求内心的宁静和精神的自由。",
    quotes: [
      {
        text: "道可道，非常道；名可名，非常名。",
        title: "道德经·第一章",
        author: "老子",
        dynasty: "春秋"
      },
      {
        text: "无为而无不为。",
        title: "道德经·第四十八章",
        author: "老子",
        dynasty: "春秋"
      },
      {
        text: "上善若水。水善利万物而不争。",
        title: "道德经·第八章",
        author: "老子",
        dynasty: "春秋"
      }
    ],
    sources: [
      { title: "道德经注", type: "book" },
      { title: "庄子", type: "book" },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "《道德经》倡导一种自然无为的生活态度，认为顺应自然规律才能达到真正的自由和和谐，是中国哲学思想的重要源头。",
    scholarAnalysis: "哲学家陈鼓应认为，老子的'道'不仅是宇宙的本源，也是一种生活智慧，教导人们以柔克刚、以静制动，在纷繁的世界中保持内心的宁静。"
  }
};

export function searchKnowledge(query: string): KnowledgeEntry | null {
  const normalizedQuery = query.toLowerCase();
  
  for (const [key, entry] of Object.entries(culturalKnowledge)) {
    if (normalizedQuery.includes(key) || 
        entry.question.toLowerCase().includes(normalizedQuery)) {
      return entry;
    }
  }
  
  return null;
}

export function getRelatedKnowledge(tags: string[]): KnowledgeEntry[] {
  const results: KnowledgeEntry[] = [];
  
  for (const tag of tags) {
    const entry = searchKnowledge(tag);
    if (entry && !results.find(r => r.id === entry.id)) {
      results.push(entry);
    }
  }
  
  return results;
}
