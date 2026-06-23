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
  isBook?: boolean;
}

export interface Person {
  name: string;
  dynasty: string;
  birthYear?: string;
  deathYear?: string;
  description: string;
  achievements: string[];
  works: string[];
}

export interface Book {
  title: string;
  dynasty: string;
  author?: string;
  content: string;
  summary: string;
  chapters?: string[];
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'concept' | 'book' | 'person' | 'quote' | 'event';
  description?: string;
  connections?: string[];
}

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  quotes: Quote[];
  sources: Source[];
  interpretations?: string;
  scholarAnalysis?: string;
  graphNodes?: KnowledgeGraphNode[];
}

export const persons: Record<string, Person> = {
  "毛亨": {
    name: "毛亨",
    dynasty: "汉代",
    description: "毛亨，生卒年不详，是西汉时期的学者，相传是古文诗学\"毛诗学\"的开创者。他与毛苌一起被称为\"大小毛公\"。",
    achievements: [
      "整理并注释《诗经》，形成《毛诗故训传》",
      "开创古文诗学流派",
      "对《诗经》的传承和研究影响深远"
    ],
    works: ["《毛诗故训传》"]
  },
  "李白": {
    name: "李白",
    dynasty: "唐代",
    birthYear: "701年",
    deathYear: "762年",
    description: "李白，字太白，号青莲居士，又号\"谪仙人\"，唐代伟大的浪漫主义诗人，被后人誉为\"诗仙\"。",
    achievements: [
      "创作大量优秀诗篇，风格豪放飘逸",
      "开创浪漫主义诗歌高峰",
      "与杜甫并称\"李杜\""
    ],
    works: ["《李太白集》", "《将进酒》", "《静夜思》", "《蜀道难》"]
  },
  "苏轼": {
    name: "苏轼",
    dynasty: "宋代",
    birthYear: "1037年",
    deathYear: "1101年",
    description: "苏轼，字子瞻，号东坡居士，北宋著名文学家、书法家、画家，唐宋八大家之一。",
    achievements: [
      "诗词文赋书画皆精",
      "开创豪放词派",
      "影响后世文学深远"
    ],
    works: ["《东坡全集》", "《水调歌头》", "《念奴娇·赤壁怀古》"]
  },
  "孔子": {
    name: "孔子",
    dynasty: "春秋",
    birthYear: "公元前551年",
    deathYear: "公元前479年",
    description: "孔子，名丘，字仲尼，春秋时期鲁国陬邑人，儒家学派创始人，被尊为\"至圣先师\"。",
    achievements: [
      "创立儒家学派",
      "整理六经",
      "开创私学，有弟子三千"
    ],
    works: ["《论语》", "《春秋》"]
  },
  "老子": {
    name: "老子",
    dynasty: "春秋",
    description: "老子，姓李名耳，字聃，春秋时期思想家，道家学派创始人。",
    achievements: [
      "创立道家学派",
      "著有《道德经》",
      "思想影响中国哲学发展"
    ],
    works: ["《道德经》"]
  }
};

export const books: Record<string, Book> = {
  "毛诗序": {
    title: "毛诗序",
    dynasty: "汉代",
    author: "毛亨",
    summary: "《毛诗序》是汉代毛亨为《诗经》所作的序言，是中国古代诗论的重要文献。",
    content: "《毛诗序》曰：\"诗者，志之所之也，在心为志，发言为诗。情动于中而形于言，言之不足故嗟叹之，嗟叹之不足故永歌之，永歌之不足，不知手之舞之，足之蹈之也。"\n\n"情发于声，声成文谓之音。治世之音安以乐，其政和；乱世之音怨以怒，其政乖；亡国之音哀以思，其民困。故正得失，动天地，感鬼神，莫近于诗。"\n\n"先王以是经夫妇，成孝敬，厚人伦，美教化，移风俗。"\n\n"故诗有六义焉：一曰风，二曰赋，三曰比，四曰兴，五曰雅，六曰颂。上以风化下，下以风刺上，主文而谲谏，言之者无罪，闻之者足以戒，故曰风。"\n\n"至于王道衰，礼义废，政教失，国异政，家殊俗，而变风变雅作矣。国史明乎得失之迹，伤人伦之废，哀刑政之苛，吟咏情性，以风其上，达于事变而怀其旧俗者也。"
  },
  "论语": {
    title: "论语",
    dynasty: "春秋",
    summary: "《论语》是记录孔子及其弟子言行的儒家经典著作，共二十篇。",
    content: "子曰：\"学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？\""\n\n"子曰：\"君子务本，本立而道生。孝弟也者，其为仁之本与！\""\n\n"子曰：\"吾十有五而志于学，三十而立，四十而不惑，五十而知天命，六十而耳顺，七十而从心所欲，不逾矩。\""\n\n"子曰：\"温故而知新，可以为师矣。\""\n\n"子曰：\"学而不思则罔，思而不学则殆。\""\n\n"子曰：\"知之为知之，不知为不知，是知也。\""
  },
  "道德经": {
    title: "道德经",
    dynasty: "春秋",
    author: "老子",
    summary: "《道德经》又称《老子》，是道家学派的经典著作，共八十一章。",
    content: "道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲以观其妙，常有欲以观其徼。此两者同出而异名，同谓之玄，玄之又玄，众妙之门。"\n\n"天下皆知美之为美，斯恶已；皆知善之为善，斯不善已。故有无相生，难易相成，长短相形，高下相倾，音声相和，前后相随。"\n\n"不尚贤，使民不争；不贵难得之货，使民不为盗；不见可欲，使民心不乱。"\n\n"道冲，而用之或不盈。渊兮，似万物之宗。挫其锐，解其纷，和其光，同其尘。湛兮，似或存。吾不知谁之子，象帝之先。"\n\n"天地不仁，以万物为刍狗；圣人不仁，以百姓为刍狗。天地之间，其犹橐籥乎？虚而不屈，动而愈出。多言数穷，不如守中。"
  },
  "诗经": {
    title: "诗经",
    dynasty: "周代",
    summary: "《诗经》是中国最早的诗歌总集，收录西周至春秋时期诗歌305篇，分为风、雅、颂三部分。",
    content: "关关雎鸠，在河之洲。窈窕淑女，君子好逑。参差荇菜，左右流之。窈窕淑女，寤寐求之。"\n\n"桃之夭夭，灼灼其华。之子于归，宜其室家。桃之夭夭，有蕡其实。之子于归，宜其家室。"\n\n"采采芣苢，薄言采之。采采芣苢，薄言有之。采采芣苢，薄言掇之。采采芣苢，薄言捋之。"\n\n"蒹葭苍苍，白露为霜。所谓伊人，在水一方。溯洄从之，道阻且长。溯游从之，宛在水中央。"\n\n"昔我往矣，杨柳依依。今我来思，雨雪霏霏。行道迟迟，载渴载饥。我心伤悲，莫知我哀！"
  },
  "将进酒": {
    title: "将进酒",
    dynasty: "唐代",
    author: "李白",
    summary: "《将进酒》是唐代诗人李白的代表作之一，描写了诗人豪放不羁的性格和对人生的感慨。",
    content: "君不见黄河之水天上来，奔流到海不复回。君不见高堂明镜悲白发，朝如青丝暮成雪。人生得意须尽欢，莫使金樽空对月。天生我材必有用，千金散尽还复来。烹羊宰牛且为乐，会须一饮三百杯。岑夫子，丹丘生，将进酒，杯莫停。与君歌一曲，请君为我倾耳听。钟鼓馔玉不足贵，但愿长醉不复醒。古来圣贤皆寂寞，惟有饮者留其名。陈王昔时宴平乐，斗酒十千恣欢谑。主人何为言少钱，径须沽取对君酌。五花马、千金裘，呼儿将出换美酒，与尔同销万古愁。"
  },
  "水调歌头": {
    title: "水调歌头·明月几时有",
    dynasty: "宋代",
    author: "苏轼",
    summary: "《水调歌头》是苏轼的代表作，写于中秋佳节，表达了对亲人的思念和对人生的哲理思考。",
    content: "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。我欲乘风归去，又恐琼楼玉宇，高处不胜寒。起舞弄清影，何似在人间。转朱阁，低绮户，照无眠。不应有恨，何事长向别时圆？人有悲欢离合，月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。"
  }
};

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
      { title: "李太白集", type: "book", isBook: true },
      { title: "全唐诗", type: "book", isBook: true },
      { title: "国家图书馆数字资源", type: "database" }
    ],
    interpretations: "李白的饮酒诗展现了他对自由、理想和生命的深刻思考。酒在他的诗歌中不仅是物质的饮品，更是精神的寄托和艺术的催化剂。",
    scholarAnalysis: "学者陈贻焮认为，李白的饮酒是一种'审美沉醉'，他通过饮酒达到一种超越现实、进入艺术创作最佳状态的境界。这种状态与庄子的'心斋'、'坐忘'有相似之处。",
    graphNodes: [
      { id: "li-bai", label: "李白", type: "person", description: "唐代浪漫主义诗人" },
      { id: "wine", label: "酒文化", type: "concept", description: "中国传统酒文化" },
      { id: "poetry", label: "诗歌创作", type: "concept", description: "古代诗歌艺术" },
      { id: "jiang-jin-jiu", label: "将进酒", type: "quote", description: "李白代表作" }
    ]
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
      { title: "荆楚岁时记", type: "book", isBook: true },
      { title: "史记·屈原贾生列传", type: "book", isBook: true },
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
      { title: "东京梦华录", type: "book", isBook: true },
      { title: "梦梁录", type: "book", isBook: true },
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
      { title: "月令七十二候集解", type: "book", isBook: true },
      { title: "淮南子", type: "book", isBook: true },
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
      { title: "毛诗正义", type: "book", isBook: true },
      { title: "诗集传", type: "book", isBook: true },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "风雅颂的分类反映了周代社会的不同层面：风反映民间生活，雅体现贵族文化，颂彰显祭祀礼仪，共同构成了周代社会的完整画卷。",
    scholarAnalysis: "文学史家游国恩指出，风雅颂的划分不仅是音乐上的区别，更反映了社会阶层和用途的差异，是研究周代社会的重要史料。",
    graphNodes: [
      { id: "shijing", label: "诗经", type: "book", description: "中国最早诗歌总集" },
      { id: "feng", label: "国风", type: "concept", description: "十五国地方民歌" },
      { id: "ya", label: "雅", type: "concept", description: "宫廷乐歌" },
      { id: "song", label: "颂", type: "concept", description: "宗庙祭祀乐歌" },
      { id: "mao-heng", label: "毛亨", type: "person", description: "毛诗学开创者" }
    ]
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
      { title: "东坡全集", type: "book", isBook: true },
      { title: "全宋词", type: "book", isBook: true },
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
      { title: "昆剧发展史", type: "book", isBook: true },
      { title: "中国戏曲通史", type: "book", isBook: true },
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
      { title: "论语", type: "book", isBook: true },
      { title: "史记·孔子世家", type: "book", isBook: true },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "孔子的思想强调道德修养和社会责任，主张通过教育和自我完善来实现个人价值和社会和谐，对中国传统文化产生了深远影响。",
    scholarAnalysis: "哲学家冯友兰认为，孔子的'仁'学是一种道德理想主义，强调通过内在的道德自觉来达到外在的社会秩序，是中国传统文化的核心精神。",
    graphNodes: [
      { id: "confucius", label: "孔子", type: "person", description: "儒家学派创始人" },
      { id: "ren", label: "仁", type: "concept", description: "爱人之道" },
      { id: "li", label: "礼", type: "concept", description: "社会秩序" },
      { id: "lunyu", label: "论语", type: "book", description: "记录孔子言行" },
      { id: "rujia", label: "儒家", type: "concept", description: "儒家学派" }
    ]
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
      { title: "道德经注", type: "book", isBook: true },
      { title: "庄子", type: "book", isBook: true },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "《道德经》倡导一种自然无为的生活态度，认为顺应自然规律才能达到真正的自由和和谐，是中国哲学思想的重要源头。",
    scholarAnalysis: "哲学家陈鼓应认为，老子的'道'不仅是宇宙的本源，也是一种生活智慧，教导人们以柔克刚、以静制动，在纷繁的世界中保持内心的宁静。",
    graphNodes: [
      { id: "laozi", label: "老子", type: "person", description: "道家学派创始人" },
      { id: "dao", label: "道", type: "concept", description: "宇宙本源" },
      { id: "wuwei", label: "无为", type: "concept", description: "顺应自然" },
      { id: "taoteching", label: "道德经", type: "book", description: "道家经典" },
      { id: "daojia", label: "道家", type: "concept", description: "道家学派" }
    ]
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

export function getPerson(name: string): Person | null {
  return persons[name] || null;
}

export function getBook(title: string): Book | null {
  return books[title] || null;
}
