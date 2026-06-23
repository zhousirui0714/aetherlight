/**
 * 深度文化知识库
 * 
 * 设计理念：从"广而浅"转向"深而精"
 * 每个朝代、每种传统文化类型只保留1-2个示范
 * 但每个知识条目都要深度挖掘，涵盖：
 * - 生平年表
 * - 历史背景
 * - 人物关系
 * - 作品详解
 * - 遗迹遗址
 * - 历代评价
 * - 现代研究
 * - 文化影响
 */

import { KnowledgeEntry, Person, Book, KnowledgeGraphNode } from "./types";

/* ============================================
   李白 - 深度知识库示范
   ============================================ */

export const liBaiDeepKnowledge = {
  // 核心人物数据
  person: {
    name: "李白",
    nameVariants: ["太白", "青莲居士", "谪仙人", "诗仙"],
    dynasty: "唐代",
    birthYear: "701年",
    deathYear: "762年",
    birthPlace: "碎叶城（今吉尔吉斯斯坦托克马克）",
    longTermResidence: "四川绵阳江油",
    
    // 详细生平年表
    timeline: [
      { year: "701年", event: "出生于碎叶城，传说其母梦太白金星入怀" },
      { year: "705年", event: "随父李客迁居绵州昌隆县（今四川江油）" },
      { year: "718年", event: "十八岁。隐居大匡山读书，同年出游成都、峨眉山" },
      { year: "720年", event: "二十岁。作《登锦城散花楼》，初显才华" },
      { year: "725年", event: "二十五岁。出蜀，「仗剑去国，辞亲远游」，沿江东下" },
      { year: "727年", event: "二十七岁。定居安陆，结识孟浩然" },
      { year: "730年", event: "三十岁。入长安，干谒张说、玉真公主，未获赏识" },
      { year: "734年", event: "三十四岁。作《蜀道难》，贺知章读后叹为「谪仙人」" },
      { year: "742年", event: "四十二岁。奉诏入京，供奉翰林" },
      { year: "743年", event: "四十三岁。作《清平调》三首，得罪高力士" },
      { year: "744年", event: "四十四岁。被赐金放还，离开长安，与杜甫相识于洛阳" },
      { year: "745年", event: "四十五岁。与杜甫、高适同游梁宋，秋别后未再相见" },
      { year: "755年", event: "五十五岁。安史之乱爆发，南下避难" },
      { year: "757年", event: "五十七岁。入永王李璘幕府，被牵连入狱" },
      { year: "759年", event: "五十九岁。流放夜郎，中途遇赦" },
      { year: "762年", event: "六十二岁。病逝于当涂县令李阳冰家中" }
    ],
    
    // 历史背景
    historicalContext: {
      era: "盛唐转衰",
      description: "李白的一生跨越了唐玄宗的开元盛世和天宝危机两个时期。他亲眼见证了大唐帝国的繁荣鼎盛，也经历了安史之乱的动荡离乱。这种时代巨变深刻影响了他的诗歌创作。",
      keyEvents: [
        { year: "713-741", event: "开元盛世 - 唐朝最繁荣的时期" },
        { year: "742-756", event: "天宝年间 - 由盛转衰的转折点" },
        { year: "755-763", event: "安史之乱 - 唐由盛转衰的转折点" }
      ]
    },
    
    // 人物关系
    relationships: [
      { 
        name: "杜甫", 
        relationship: "挚友", 
        description: "李白与杜甫是中国文学史上最伟大的诗人组合。二人于744年在洛阳相识，此后结伴同游，短暂相聚却结下深厚友谊。杜甫现存诗中涉及李白的超过十首，表达了对李白的深深思念。",
        poems: [
          "《赠李白》（746年）",
          "《春日忆李白》（749年）",
          "《冬日有怀李白》（754年）",
          "《天末怀李白》（755年）",
          "《不见》（763年）"
        ],
        famousQuote: "白也诗无敌，飘然思不群"
      },
      {
        name: "孟浩然", 
        relationship: "挚友", 
        description: "李白对孟浩然极为推崇，曾写下「吾爱孟夫子，风流天下闻」的诗句。二人在安陆相识，友谊深厚。",
        poems: ["《黄鹤楼送孟浩然之广陵》"],
        famousQuote: "故人西辞黄鹤楼，烟花三月下扬州"
      },
      {
        name: "贺知章", 
        relationship: "忘年交", 
        description: "贺知章是当时的文坛泰斗，比李白年长四十余岁。他读《蜀道难》后称李白为「谪仙人」，成为李白名号的由来。",
        poems: ["《对酒忆贺监》"],
        famousQuote: "金龟换酒处，却忆泪沾巾"
      },
      {
        name: "汪伦", 
        relationship: "仰慕者/友人", 
        description: "安徽泾县县令，仰慕李白，多次邀请李白做客。李白离去时作《赠汪伦》，使汪伦名留千古。",
        poems: ["《赠汪伦》"],
        famousQuote: "桃花潭水深千尺，不及汪伦送我情"
      },
      {
        name: "高力士", 
        relationship: "政敌", 
        description: "唐玄宗宠臣。李白在供奉翰林期间，曾让高力士为其脱靴，因此得罪高力士，后者向杨贵妃进谗言，导致李白被疏远。",
        poems: ["《清平调》"],
        famousQuote: "借问汉宫谁得似，可怜飞燕倚新妆"
      },
      {
        name: "李阳冰", 
        relationship: "晚年至交", 
        description: "李白晚年流落当涂，病重时将诗文托付给县令李阳冰。李阳冰后来编纂了《草堂集》，为李白作品的保存做出重要贡献。",
        poems: ["《献从叔当涂宰阳冰》"],
        famousQuote: "吾家有季父，杰出圣代英"
      }
    ],
    
    // 诗歌特色分析
    poetryCharacteristics: {
      浪漫主义: {
        description: "李白是中国文学史上最伟大的浪漫主义诗人，其诗想象奇特，意境壮阔，感情充沛。",
        examples: [
          "《将进酒》：「君不见黄河之水天上来，奔流到海不复回」",
          "《蜀道难》：「噫吁嚱，危乎高哉！蜀道之难，难于上青天！」",
          "《梦游天姥吟留别》：「天姥连天向天横，势拔五岳掩赤城」"
        ],
        techniques: [
          "夸张：李白善用夸张手法，如「白发三千丈」、「飞流直下三千尺」",
          "想象：李白的想象奇特大胆，如「举杯邀明月，对影成三人」",
          "比喻：善用比喻将抽象情感具象化，如「愁」如「黄河之水」"
        ]
      },
      语言风格: {
        description: "李白的诗歌语言清新自然，却又雄奇豪放，形成独特的「清水芙蓉」之美。",
        features: [
          "自然流畅：不事雕琢，如同脱口而出",
          "雄奇奔放：气势磅礴，情感激昂",
          "通俗易懂：用语浅显，妇孺皆知"
        ]
      },
      题材分类: {
        饮酒诗: {
          count: "约200首",
          description: "李白嗜酒，与酒相关的诗作众多，酒是他激发灵感、排解忧愁的媒介。",
          famous: ["《将进酒》《月下独酌》《山中与幽人对酌》"]
        },
        游仙诗: {
          count: "约100首",
          description: "李白信道求仙，游仙诗想象奇特，表达对自由精神的追求。",
          famous: ["《梦游天姥吟留别》《远别离》"]
        },
        山水诗: {
          count: "约150首",
          description: "李白游历名山大川，留下众多描写自然山水的佳作。",
          famous: ["《望庐山瀑布》《早发白帝城》《庐山谣》"]
        },
        赠别诗: {
          count: "约180首",
          description: "李白交游广阔，赠别诗情深意重。",
          famous: ["《黄鹤楼送孟浩然之广陵》《赠汪伦》《渡荆门送别》"]
        },
        政治抒情诗: {
          count: "约50首",
          description: "表达政治抱负和家国情怀的诗作。",
          famous: ["《行路难》《梁甫吟》"]
        }
      }
    },
    
    // 李白名句分类整理
    famousQuotes: {
      人生哲理: [
        { quote: "天生我材必有用，千金散尽还复来", source: "将进酒", interpretation: "表达了诗人对个人价值的自信和乐观的人生态度" },
        { quote: "长风破浪会有时，直挂云帆济沧海", source: "行路难", interpretation: "表达了面对困境时的乐观信念和不屈精神" },
        { quote: "人生得意须尽欢，莫使金樽空对月", source: "将进酒", interpretation: "体现了及时行乐的人生态度和对生命的热爱" }
      ],
      思乡怀人: [
        { quote: "举头望明月，低头思故乡", source: "静夜思", interpretation: "以最朴素的语言表达了最普遍的思乡之情" },
        { quote: "此夜曲中闻折柳，何人不起故园情", source: "春夜洛城闻笛", interpretation: "听到笛声引发思乡之情" }
      ],
      送别之情: [
        { quote: "桃花潭水深千尺，不及汪伦送我情", source: "赠汪伦", interpretation: "以潭水之深比喻友情之深" },
        { quote: "孤帆远影碧空尽，唯见长江天际流", source: "黄鹤楼送孟浩然之广陵", interpretation: "以景写情，含蓄深婉" }
      ],
      山水之美: [
        { quote: "飞流直下三千尺，疑是银河落九天", source: "望庐山瀑布", interpretation: "以夸张手法描写瀑布的壮观" },
        { quote: "两岸猿声啼不住，轻舟已过万重山", source: "早发白帝城", interpretation: "表达了历经险阻后的轻松愉悦" }
      ],
      饮酒豪情: [
        { quote: "人生飘忽百年内，且须酣畅万古情", source: "答王十二寒夜独酌有怀", interpretation: "借酒抒情，表达万古豪情" },
        { quote: "五花马，千金裘，呼儿将出换美酒，与尔同销万古愁", source: "将进酒", interpretation: "以酒消愁，气势豪迈" }
      ]
    },
    
    // 相关遗迹遗址
    relics: [
      {
        name: "李白故里",
        location: "四川省绵阳市江油市",
        description: "李白青少年时期生活的地方，现存李白故居、太白祠、李白纪念馆等。",
        highlights: ["太白碑林", "李白故居", "窦圌山李白读书台"]
      },
      {
        name: "马鞍山李白墓",
        location: "安徽省马鞍山市当涂县",
        description: "李白病逝并安葬于此，后人为其修建衣冠冢和太白祠。",
        highlights: ["李白墓", "太白祠", "李白纪念碑"]
      },
      {
        name: "济宁李白楼",
        location: "山东省济宁市任城区",
        description: "李白曾在此寓居，留下「鲁酒若琥珀」的诗句。",
        highlights: ["李白楼", "太白湖"]
      },
      {
        name: "安陆白兆山",
        location: "湖北省安陆市",
        description: "李白在安陆居住十年，留下众多诗作。",
        highlights: ["白兆寺", "桃花岩", "李白读书台"]
      },
      {
        name: "当涂太白祠",
        location: "安徽省马鞍山市当涂县",
        description: "为纪念李白而建的祠堂，始建于唐代。",
        highlights: ["太白祠", "李白墓", "龙山"]
      }
    ],
    
    // 相关典故
    allusions: [
      {
        title: "铁杵磨针",
        story: "相传李白少年时在四川眉山游玩，遇到一位老妇人正在磨铁杵，李白问她在做什么，老妇人说要把铁杵磨成针。李白被老妇的毅力感动，从此发奋读书。",
        origin: "《方舆胜览》",
        usage: "比喻只要有恒心、有毅力，再难的事也能成功"
      },
      {
        title: "醉捞江月",
        story: "相传李白在当涂采石矶赏月时，为捞取江中月影而坠水身亡。",
        origin: "《唐才子传》",
        usage: "表现了李白浪漫不羁的性格，也成为后人怀念诗人的一种方式"
      },
      {
        title: "骑驴找诗",
        story: "李白常骑驴游山玩水，寻找作诗灵感。有一次在华阴县骑驴，被县令拦住，李白大怒，留下「天子殿前尚容骑马，华阴县里不得骑驴」的佳话。",
        origin: "《唐才子传》",
        usage: "表现了李白的傲骨和不羁性格"
      },
      {
        title: "贵妃捧砚",
        story: "李白在翰林院供奉时，唐玄宗命其作《清平调》，杨贵妃亲自为其捧砚，高力士为其脱靴。",
        origin: "《松窗杂录》",
        usage: "表现了李白当时的恩宠，但也暗示了后来的失意"
      },
      {
        title: "金龟换酒",
        story: "贺知章初见李白，读其《蜀道难》，赞赏不已，解下身上的金龟换酒与李白共饮。",
        origin: "《本事诗》",
        usage: "比喻对人才的赏识和器重"
      }
    ],
    
    // 历代评价
    historicalComments: [
      {
        era: "唐代",
        critic: "杜甫",
        comment: "白也诗无敌，飘然思不群。清新庚开府，俊逸鲍参军。",
        source: "《春日忆李白》",
        note: "杜甫对李白诗歌成就的高度评价"
      },
      {
        era: "唐代",
        critic: "韩愈",
        comment: "李杜文章在，光焰万丈长。",
        source: "《调张籍》",
        note: "韩愈高度评价李杜二人诗歌的成就"
      },
      {
        era: "唐代",
        critic: "白居易",
        comment: "又诗之豪者，世称李杜之作。才矣奇矣，人不逮矣。",
        source: "《与元九书》",
        note: "白居易对李白才华的赞叹"
      },
      {
        era: "宋代",
        critic: "苏轼",
        comment: "李太白、杜子美以英玮绝世之姿，凌跨百代，古今诗人尽废。",
        source: "《书黄子思诗集后》",
        note: "苏轼认为李杜超越百代，无人能及"
      },
      {
        era: "明代",
        critic: "杨慎",
        comment: "太白为古今诗圣。",
        source: "《升庵诗话》",
        note: "杨慎称李白为诗圣"
      },
      {
        era: "清代",
        critic: "赵翼",
        comment: "李杜诗篇万口传。",
        source: "《论诗》",
        note: "赵翼感叹李杜诗篇流传之广"
      },
      {
        era: "近代",
        critic: "鲁迅",
        comment: "我以为一切好诗，到唐已被做完。",
        source: "《鲁迅书信集》",
        note: "鲁迅感叹唐代诗歌成就之巅"
      },
      {
        era: "现代",
        critic: "余光中",
        comment: "酒入豪肠，七分酿成了月光，余下三分啸成剑气，绣口一吐，就是半个盛唐。",
        source: "《寻李白》",
        note: "余光中以现代诗歌的形式赞美李白"
      }
    ],
    
    // 现代研究
    modernResearch: [
      {
        scholar: "裴斐",
        work: "《李白诗歌赏析》",
        contribution: "系统分析了李白诗歌的艺术特色"
      },
      {
        scholar: "郁贤皓",
        work: "《李白选集》",
        contribution: "李白研究的权威选本"
      },
      {
        scholar: "周勋初",
        work: "《李白评传》",
        contribution: "全面评述李白生平与创作"
      },
      {
        scholar: "袁行霈",
        work: "《中国文学史》",
        contribution: "将李白定位为「浪漫主义的最高峰」"
      }
    ],
    
    // 文化影响
    culturalInfluence: {
      文学: [
        "影响了历代浪漫主义诗人",
        "苏轼、辛弃疾等大家深受其影响",
        "鲁迅、毛泽东等现代文学家都推崇李白"
      ],
      艺术: [
        "李白诗作被广泛谱曲演唱",
        "李白故事被改编为戏曲、影视作品",
        "李白书法作品被后人珍视"
      ],
      生活: [
        "「李白」成为诗酒人生的代名词",
        "李白墓成为文化旅游景点",
        "多地举办李白诗歌节"
      ],
      精神: [
        "追求自由、不羁的性格成为文人精神象征",
        "李白的诗歌理想主义影响深远",
        "「诗仙」成为对诗人的最高赞誉之一"
      ]
    },
    
    // 推荐阅读
    recommendedReadings: [
      { title: "《李太白全集》", author: "李白", editor: "王琦注", note: "最完备的李白作品集" },
      { title: "《李白评传》", author: "周勋初", note: "权威的李白传记" },
      { title: "《李白研究》", author: "裴斐", note: "李白研究的重要著作" },
      { title: "《李白年谱》", author: "詹锳", note: "详细的李白生平编年" },
      { title: "《李白诗选》", author: "郁贤皓", note: "权威选本" }
    ],
    
    // 学习路径
    learningPath: [
      {
        step: 1,
        title: "入门",
        resources: ["《静夜思》", "《早发白帝城》", "《望庐山瀑布》", "《赠汪伦》"]
      },
      {
        step: 2,
        title: "进阶",
        resources: ["《将进酒》", "《蜀道难》", "《行路难》", "《黄鹤楼送孟浩然之广陵》"]
      },
      {
        step: 3,
        title: "深入",
        resources: ["《梦游天姥吟留别》", "《梁甫吟》", "《宣州谢朓楼饯别校书叔云》", "《月下独酌》"]
      },
      {
        step: 4,
        title: "研究",
        resources: ["《李白评传》", "《李白年谱》", "《李太白全集》", "李白与杜甫比较研究"]
      }
    ]
  }
};

// ============================================
// 知识问答模板 - 以李白为例
// ============================================

export const liBaiKnowledgeEntry: KnowledgeEntry = {
  id: "li-bai-comprehensive",
  question: "李白",
  answer: "李白（701年-762年），字太白，号青莲居士，唐代伟大的浪漫主义诗人，被誉为「诗仙」。他一生创作诗歌千余首，内容涵盖山水、饮酒、游仙、送别、政治等多种题材，想象奇特，语言豪放，在中国文学史上占有举足轻重的地位。",

  // 详细扩展内容
  detailedAnswer: {
    overview: "李白是中国文学史上最伟大的诗人之一，与杜甫并称「李杜」，代表了唐代诗歌的最高成就。他的一生充满传奇色彩：从碎叶城出生，到蜀中成长，再到遍游天下，最后病逝当涂。他的诗歌想象丰富、语言豪放、意境壮阔，是浪漫主义诗歌的巅峰之作。",

    sections: [
      {
        title: "生平概览",
        content: "李白一生可大致分为四个时期：蜀中时期（701-725年）、漫游时期（725-742年）、长安时期（742-744年）和流放时期（755-762年）。他出身商人家庭，不能参加科举，只能通过干谒之路求取功名，虽一度供奉翰林，但终因性格不羁而失意离去。安史之乱后，李白因入永王幕府而被牵连流放，中途遇赦后贫病交加，最终病逝于当涂。",
        expandable: true
      },
      {
        title: "诗歌成就",
        content: "李白的诗歌在艺术上达到了中国古典诗歌的最高峰。他的诗想象奇特、气势磅礴、语言豪放，形成了独特的浪漫主义风格。无论是描写山水、饮酒、游仙还是送别，李白都能写出令人叹为观止的佳作。他的代表作包括《静夜思》《将进酒》《蜀道难》《早发白帝城》《望庐山瀑布》等，千百年来广为传诵。",
        expandable: true
      },
      {
        title: "李白与杜甫",
        content: "李白与杜甫的友谊是中国文学史上最动人的佳话。二人于744年在洛阳相识，虽相聚短暂，却结下深厚友谊。杜甫现存诗中涉及李白的超过十首，表达了对李白的深深思念和仰慕。李白比杜甫年长十一岁，但二人相互欣赏，共同开创了唐代诗歌的繁盛时代。",
        expandable: true
      }
    ]
  },

  quotes: [
    { text: "君不见黄河之水天上来，奔流到海不复回。君不见高堂明镜悲白发，朝如青丝暮成雪。人生得意须尽欢，莫使金樽空对月。天生我材必有用，千金散尽还复来。", title: "将进酒", author: "李白", dynasty: "唐" },
    { text: "床前明月光，疑是地上霜。举头望明月，低头思故乡。", title: "静夜思", author: "李白", dynasty: "唐" },
    { text: "蜀道之难，难于上青天！", title: "蜀道难", author: "李白", dynasty: "唐" },
    { text: "两岸猿声啼不住，轻舟已过万重山。", title: "早发白帝城", author: "李白", dynasty: "唐" },
    { text: "飞流直下三千尺，疑是银河落九天。", title: "望庐山瀑布", author: "李白", dynasty: "唐" },
    { text: "长风破浪会有时，直挂云帆济沧海。", title: "行路难", author: "李白", dynasty: "唐" },
    { text: "桃花潭水深千尺，不及汪伦送我情。", title: "赠汪伦", author: "李白", dynasty: "唐" },
    { text: "孤帆远影碧空尽，唯见长江天际流。", title: "黄鹤楼送孟浩然之广陵", author: "李白", dynasty: "唐" }
  ],

  sources: [
    { title: "李太白全集", type: "book", isBook: true },
    { title: "旧唐书·李白列传", type: "book", isBook: true },
    { title: "新唐书·李白列传", type: "book", isBook: true },
    { title: "李白年谱", type: "book", isBook: true },
    { title: "李白评传", type: "book", isBook: true },
    { title: "唐才子传", type: "book", isBook: true }
  ],

  interpretations: "李白的诗歌代表了中国古典诗歌浪漫主义的最高成就。他以豪放的笔调、奇特的想象、清新的语言，创造了一个独特的诗歌世界。李白的诗歌不仅在当时广为传诵，而且对后世产生了深远影响，成为中国诗歌史上一座永恒的丰碑。",

  scholarAnalysis: "学者周勋初在《李白评传》中指出，李白的诗歌具有「清水出芙蓉，天然去雕饰」的美学特征，想象奇特、气势豪迈、感情充沛，是中国浪漫主义诗歌的巅峰。学者袁行霈在《中国文学史》中评价李白是「中国文学史上最具天才、最富于想象力的诗人」。",

  // 扩展知识节点
  detailedNodes: [
    // 核心人物
    { id: "li-bai", label: "李白", type: "person", description: "诗仙、浪漫主义诗人", connections: ["du-fu", "meng-haoran", "he-zhizhang"] },
    { id: "du-fu", label: "杜甫", type: "person", description: "诗圣、李白挚友", connections: ["li-bai", "wan-got"] },
    { id: "meng-haoran", label: "孟浩然", type: "person", description: "山水诗人、李白挚友", connections: ["li-bai"] },
    { id: "he-zhizhang", label: "贺知章", type: "person", description: "称李白为谪仙人", connections: ["li-bai"] },
    { id: "wang-lun", label: "汪伦", type: "person", description: "送别李白", connections: ["li-bai"] },
    { id: "li-yangbing", label: "李阳冰", type: "person", description: "李白晚年至交", connections: ["li-bai"] },
    
    // 代表作品
    { id: "jiang-jin-jiu", label: "将进酒", type: "book", description: "李白代表作", connections: ["li-bai"] },
    { id: "jing-ye-si", label: "静夜思", type: "book", description: "最著名的思乡诗", connections: ["li-bai"] },
    { id: "shu-dao-nan", label: "蜀道难", type: "book", description: "贺知章称谪仙人", connections: ["li-bai", "he-zhizhang"] },
    { id: "zao-fa-bai-di", label: "早发白帝城", type: "book", description: "三峡名篇", connections: ["li-bai"] },
    
    // 概念
    { id: "langman-zhuyi", label: "浪漫主义", type: "concept", description: "李白诗歌的核心风格", connections: ["li-bai"] },
    { id: "shi-xian", label: "诗仙", type: "concept", description: "李白的称号", connections: ["li-bai"] },
    { id: "li-du", label: "李杜", type: "concept", description: "李白与杜甫的并称", connections: ["li-bai", "du-fu"] },
    
    // 历史事件
    { id: "kai-yuan", label: "开元盛世", type: "event", description: "李白成长的时代背景", connections: ["li-bai"] },
    { id: "an-shi", label: "安史之乱", type: "event", description: "李白晚年的历史背景", connections: ["li-bai"] },
    
    // 遗迹
    { id: "jiangyou", label: "江油李白故里", type: "event", description: "李白青少年时期居住地", connections: ["li-bai"] },
    { id: "dangtu", label: "当涂李白墓", type: "event", description: "李白终老之地", connections: ["li-bai", "li-yangbing"] }
  ],

  // 相关问题建议
  relatedQuestions: [
    "李白和杜甫是什么关系？",
    "李白的《将进酒》赏析",
    "李白为什么被称为诗仙？",
    "李白的故乡在哪里？",
    "李白是怎么死的？",
    "李白有哪些著名的送别诗？",
    "李白和贺知章的故事",
    "安史之乱对李白的影响"
  ],

  // 学习路径
  learningPath: [
    { step: 1, title: "入门", resources: ["《静夜思》", "《早发白帝城》", "《望庐山瀑布》"] },
    { step: 2, title: "进阶", resources: ["《将进酒》", "《蜀道难》", "《行路难》"] },
    { step: 3, title: "深入", resources: ["《梦游天姥吟留别》", "《梁甫吟》", "李白与杜甫的友谊"] },
    { step: 4, title: "研究", resources: ["《李白评传》", "李白年谱", "李白在安陆的十年"] }
  ]
};

/* ============================================
   其他示范性人物（精简版，供参考）
   ============================================ */

// 孔子 - 儒家学派创始人
export const confuciusDeepKnowledge = {
  person: {
    name: "孔子",
    nameVariants: ["孔丘", "仲尼", "至圣先师"],
    dynasty: "春秋",
    birthYear: "前551年",
    deathYear: "前479年",
    birthPlace: "鲁国陬邑（今山东曲阜）",
    
    coreThoughts: {
      仁: "仁者爱人，是孔子思想的核心。仁是最高的道德原则，包括克己、爱人、忠恕等内容。",
      礼: "礼是社会秩序和行为规范，孔子主张克己复礼，以恢复周礼为己任。",
      中庸: "中庸之道是孔子的方法论，主张不偏不倚，恰到好处。",
      教育: "有教无类、因材施教是孔子的教育思想，打破了贵族对教育的垄断。"
    },
    
    代表著作: ["《论语》", "（整理六经：《诗》《书》《礼》《易》《乐》《春秋》）"],
    
    历史影响: [
      "儒家思想成为中国传统文化的主流",
      "孔子被尊为至圣先师、万世师表",
      "《论语》成为四书五经之一",
      "孔庙遍布全国，祭祀延续两千余年"
    ]
  }
};

// 曹雪芹 - 红楼梦作者
export const caoXueqinDeepKnowledge = {
  person: {
    name: "曹雪芹",
    nameVariants: ["曹霑", "梦阮", "雪芹"],
    dynasty: "清代",
    birthYear: "约1715年",
    deathYear: "约1763年",
    
    创作背景: {
      个人经历: "曹雪芹出身江宁织造曹家，幼年时家世显赫，后因家道中落，晚年居北京西郊，靠卖画和朋友接济度日，正是在这种贫困潦倒的生活中创作《红楼梦》。",
      时代背景: "清代康乾盛世，但封建社会已开始显露出衰败的迹象，《红楼梦》深刻揭示了这一历史趋势。"
    },
    
    红楼梦: {
      别名: ["石头记", "金玉缘"],
      结构: "120回（后40回一般认为是高鹗续写）",
      地位: "中国古典小说的巅峰之作，被誉为「中国封建社会的百科全书」"
    },
    
    艺术特色: [
      "塑造了众多性格鲜明的人物形象",
      "语言优美凝练，具有诗的韵味",
      "结构宏大而精密",
      "深刻揭示了封建社会的矛盾"
    ]
  }
};

// 屈原 - 楚辞之祖
export const quYuanBasicKnowledge = {
  person: {
    name: "屈原",
    nameVariants: ["屈平", "正则", "灵均"],
    dynasty: "战国",
    birthYear: "前340年",
    deathYear: "前278年",
    birthPlace: "楚国丹阳（今湖北秭归）",
    
    生平: "屈原出身楚国贵族，年轻时深受楚怀王信任，官至左徒，后因小人谗言被放逐。秦国攻破楚国郢都后，屈原悲愤交加，于公元前278年农历五月初五投汨罗江而死。",
    
    代表作品: ["《离骚》", "《九歌》", "《天问》", "《九章》"],
    
    历史贡献: [
      "创立了「楚辞」这一新的诗歌体裁",
      "《楚辞》与《诗经》并称「风骚」",
      "忧国忧民的精神成为士大夫的楷模",
      "端午节就是为了纪念屈原"
    ],
    
    精神遗产: "屈原的爱国主义精神和执着追求理想的品格，成为中华民族精神的重要组成部分。「路漫漫其修远兮，吾将上下而求索」成为激励后人的名言。"
  }
};

// ============================================
// 杜甫 - 深度知识库
// ============================================
export const duFuDeepKnowledge = {
  person: {
    name: "杜甫",
    nameVariants: ["子美", "少陵野老", "诗圣"],
    dynasty: "唐代",
    birthYear: "712年",
    deathYear: "770年",
    birthPlace: "河南巩义",
    
    timeline: [
      { year: "712年", event: "出生于河南巩义，出身京兆杜氏" },
      { year: "731年", event: "十九岁。漫游吴越、齐赵各地" },
      { year: "744年", event: "在洛阳与李白相遇，结下深厚友谊" },
      { year: "746年", event: "到长安求仕，困顿十年" },
      { year: "755年", event: "任右卫率府胄曹参军" },
      { year: "756年", event: "安史之乱爆发，被叛军俘获，后逃出" },
      { year: "757年", event: "任左拾遗，因上疏救房琯触怒肃宗" },
      { year: "759年", event: "辞官，辗转到达成都，营建草堂" },
      { year: "768年", event: "出川，病卧岳阳" },
      { year: "770年", event: "病逝于耒阳" }
    ],
    
    relationships: [
      { 
        name: "李白", 
        relationship: "挚友", 
        description: "杜甫与李白的友谊是中国文学史上最动人的佳话。二人于744年在洛阳相遇，虽相聚短暂，却结下终生不渝的友情。",
        poems: ["《赠李白》", "《春日忆李白》", "《冬日有怀李白》"],
        famousQuote: "何时一尊酒，重与细论文"
      },
      {
        name: "王维", 
        relationship: "挚友", 
        description: "王维与杜甫是同时代的诗人，相互敬佩。",
        poems: ["杜甫有多首诗提及王维"]
      }
    ],
    
    poetryCharacteristics: {
      现实主义: {
        description: "杜甫是中国文学史上最伟大的现实主义诗人，他的诗深刻反映了唐代社会的现实，被后人称为'诗史'。",
        examples: [
          "《兵车行》：'车辚辚，马萧萧，行人弓箭各在腰'",
          "《三吏》《三别》：记录安史之乱带给人民的苦难"
        ]
      },
      语言风格: {
        description: "杜甫的诗歌语言精炼工整，格律严谨，形成了'沉郁顿挫'的风格。",
        features: [
          "沉郁顿挫：感情深沉，格调悲壮",
          "精炼工整：炼字琢句，一丝不苟",
          "律诗典范：五律、七律的巅峰"
        ]
      },
      题材分类: {
        政治诗: {
          count: "约50首",
          description: "表达对国家命运和人民疾苦的关切。",
          famous: ["《兵车行》", "《丽人行》"]
        },
        战争诗: {
          count: "约30首",
          description: "记录安史之乱等战乱的苦难。",
          famous: ["《三吏》《三别》"]
        },
        咏怀诗: {
          count: "约100首",
          description: "表达个人抱负和身世感慨。",
          famous: ["《望岳》", "《春望》", "《茅屋为秋风所破歌》"]
        }
      }
    },
    
    famousQuotes: {
      忧国忧民: [
        { quote: "朱门酒肉臭，路有冻死骨", source: "自京洛奉呈柳大尹", interpretation: "深刻揭示社会贫富悬殊的千古名句" },
        { quote: "安得广厦千万间，大庇天下寒士俱欢颜", source: "茅屋为秋风所破歌", interpretation: "表达了诗人博大的济世情怀" }
      ],
      思乡怀人: [
        { quote: "露从今夜白，月是故乡明", source: "月夜忆舍弟", interpretation: "以月寄情，表达对故乡和亲人的思念" },
        { quote: "烽火连三月，家书抵万金", source: "春望", interpretation: "战乱中家书的珍贵" }
      ],
      壮志豪情: [
        { quote: "会当凌绝顶，一览众山小", source: "望岳", interpretation: "青年时期的壮志豪情" }
      ]
    },
    
    relics: [
      {
        name: "杜甫草堂",
        location: "四川省成都市",
        description: "杜甫在成都居住时的故居，后人建草堂纪念。",
        highlights: ["杜甫草堂博物馆", "工部祠"]
      },
      {
        name: "杜甫江阁",
        location: "湖南省长沙市",
        description: "杜甫晚年曾寓居于此。",
        highlights: ["杜甫江阁", "石像"]
      }
    ],
    
    historicalComments: [
      { era: "唐代", critic: "白居易", comment: "杜诗贯穿今古，积作为主干，尽得古今之体势。" },
      { era: "宋代", critic: "苏轼", comment: "杜甫李白，以英玮绝世之姿，凌跨百代。" }
    ],
    
    recommendedReadings: [
      { title: "《杜诗详注》", author: "仇兆鳌", note: "最详尽的杜诗注本" },
      { title: "《杜甫传》", author: "冯至", note: "权威的杜甫传记" }
    ],
    
    learningPath: [
      { step: 1, title: "入门", resources: ["《望岳》", "《春望》", "《绝句》"] },
      { step: 2, title: "进阶", resources: ["《兵车行》", "《茅屋为秋风所破歌》", "《春夜喜雨》"] },
      { step: 3, title: "深入", resources: ["《三吏》《三别》", "《羌村》"] },
      { step: 4, title: "研究", resources: ["杜甫与李白比较", "杜甫的现实主义"] }
    ]
  }
};

// ============================================
// 苏轼 - 深度知识库
// ============================================
export const suShiDeepKnowledge = {
  person: {
    name: "苏轼",
    nameVariants: ["子瞻", "东坡居士", "苏东坡"],
    dynasty: "宋代",
    birthYear: "1037年",
    deathYear: "1101年",
    birthPlace: "四川眉山",
    
    timeline: [
      { year: "1037年", event: "出生于四川眉山，苏洵之子" },
      { year: "1056年", event: "十九岁。与父苏洵、弟苏辙进京应试" },
      { year: "1057年", event: "中进士，名动京师" },
      { year: "1069年", event: "王安石变法，因反对新法被迫外任" },
      { year: "1079年", event: "因'乌台诗案'被捕入狱，后被贬黄州" },
      { year: "1089年", event: "任杭州知州，修建苏堤" },
      { year: "1094年", event: "新党执政，再次被贬惠州、儋州" },
      { year: "1101年", event: "病逝于常州，享年六十五岁" }
    ],
    
    relationships: [
      { 
        name: "王安石", 
        relationship: "政敌/文友", 
        description: "王安石与苏轼是政治上的对手，但在文学上相互敬佩。",
        famousQuote: "不知更几百年，方有如此人物"
      },
      {
        name: "苏辙", 
        relationship: "弟弟", 
        description: "苏辙是苏轼的亲弟弟，兄弟二人感情深厚。",
        famousQuote: "与君世世为兄弟，更结人间未了因"
      },
      {
        name: "欧阳修", 
        relationship: "恩师", 
        description: "欧阳修是苏轼的主考官，对苏轼的才华极为赏识。",
        famousQuote: "此人可谓善读书，他日文章必独步天下"
      }
    ],
    
    poetryCharacteristics: {
      豪放派: {
        description: "苏轼是北宋豪放派词的开创者，与辛弃疾并称'苏辛'。",
        examples: [
          "《念奴娇·赤壁怀古》：'大江东去，浪淘尽，千古风流人物'",
          "《水调歌头》：'明月几时有，把酒问青天'"
        ]
      },
      语言风格: {
        description: "苏轼的诗词风格多样，既有豪放之作，也有婉约清丽之词。",
        features: [
          "豪放旷达：'一蓑烟雨任平生'",
          "清丽婉约：'十年生死两茫茫'",
          "理趣深远：'不识庐山真面目'"
        ]
      },
      题材分类: {
        词: {
          count: "约300首",
          description: "词作成就最高，开创豪放派。",
          famous: ["《念奴娇·赤壁怀古》", "《水调歌头》", "《定风波》"]
        },
        诗: {
          count: "约2700首",
          description: "诗作题材广泛，风格多样。",
          famous: ["《题西林壁》", "《惠崇春江晚景》"]
        },
        文: {
          count: "众多",
          description: "散文成就与欧阳修并称'欧苏'。",
          famous: ["《赤壁赋》", "《后赤壁赋》"]
        }
      }
    },
    
    famousQuotes: {
      人生哲理: [
        { quote: "但愿人长久，千里共婵娟", source: "水调歌头", interpretation: "对亲人朋友的美好祝愿" },
        { quote: "不识庐山真面目，只缘身在此山中", source: "题西林壁", interpretation: "认识事物的哲理" },
        { quote: "一蓑烟雨任平生", source: "定风波", interpretation: "面对困境的豁达态度" }
      ],
      悼亡之情: [
        { quote: "十年生死两茫茫，不思量，自难忘", source: "江城子", interpretation: "对亡妻的深切思念" }
      ],
      壮志豪情: [
        { quote: "大江东去，浪淘尽，千古风流人物", source: "念奴娇·赤壁怀古", interpretation: "对历史英雄的追忆" }
      ]
    },
    
    relics: [
      {
        name: "眉山三苏祠",
        location: "四川省眉山市",
        description: "纪念苏洵、苏轼、苏辙父子的祠堂。",
        highlights: ["三苏祠"]
      },
      {
        name: "黄州东坡",
        location: "湖北省黄冈市",
        description: "苏轼被贬黄州时居住此地。",
        highlights: ["东坡雪堂", "东坡赤壁"]
      },
      {
        name: "杭州苏堤",
        location: "浙江省杭州市",
        description: "苏轼任杭州知州时修建。",
        highlights: ["苏堤", "苏东坡纪念馆"]
      }
    ],
    
    historicalComments: [
      { era: "宋代", critic: "欧阳修", comment: "读轼书，不觉汗出，快哉！老夫当避路，放他出一头地。" },
      { era: "现代", critic: "林语堂", comment: "苏轼是中国文学史上最具天才的文学家。" }
    ],
    
    recommendedReadings: [
      { title: "《苏轼文集》", author: "苏轼", note: "最完备的苏轼作品集" },
      { title: "《苏轼传》", author: "王水照", note: "权威的苏轼传记" },
      { title: "《东坡志林》", author: "苏轼", note: "苏轼的随笔集" }
    ],
    
    learningPath: [
      { step: 1, title: "入门", resources: ["《水调歌头》", "《题西林壁》", "《惠崇春江晚景》"] },
      { step: 2, title: "进阶", resources: ["《念奴娇·赤壁怀古》", "《定风波》", "《江城子》"] },
      { step: 3, title: "深入", resources: ["《赤壁赋》", "《后赤壁赋》"] },
      { step: 4, title: "研究", resources: ["苏轼与王安石", "苏轼的艺术成就"] }
    ]
  }
};

// ============================================
// 孔子 - 深度知识库
// ============================================
export const kongZiDeepKnowledge = {
  person: {
    name: "孔子",
    nameVariants: ["孔丘", "仲尼", "孔子", "万世师表"],
    dynasty: "春秋时期",
    birthYear: "公元前551年",
    deathYear: "公元前479年",
    birthPlace: "鲁国陬邑（今山东曲阜）",
    
    timeline: [
      { year: "公元前551年", event: "出生于鲁国陬邑，父亲叔梁纥早逝，由母亲颜征在抚养" },
      { year: "公元前544年", event: "七岁。随母亲迁居鲁国曲阜，开始学习" },
      { year: "公元前535年", event: "十六岁。母亲去世，开始做小官以谋生" },
      { year: "公元前522年", event: "二十九岁。开始收徒讲学，首批学生包括颜回之父" },
      { year: "公元前517年", event: "三十五岁。因鲁国内乱赴齐国，听《韶》乐，三月不知肉味" },
      { year: "公元前501年", event: "五十一岁。被鲁定公任为中都宰，治理有方" },
      { year: "公元前500年", event: "五十二岁。任鲁国大司寇，参与齐鲁夹谷之会" },
      { year: "公元前497年", event: "五十五岁。因政治主张不被采纳，带领弟子周游列国" },
      { year: "公元前484年", event: "六十八岁。结束十四年周游列国，返回鲁国" },
      { year: "公元前479年", event: "七十三岁。病逝于鲁国，弟子三千人为其守丧三年" }
    ],
    
    historicalContext: {
      era: "春秋末期",
      description: "孔子生活在中国历史上一个极为重要的转型时期。周王室衰微，礼崩乐坏，各诸侯国争霸天下。孔子试图通过复兴周礼、重建社会秩序来拯救乱世。",
      keyEvents: [
        { year: "公元前771年", event: "西周灭亡，春秋时期开始" },
        { year: "公元前551年", event: "孔子出生" },
        { year: "公元前479年", event: "孔子去世，战国时期即将开始" }
      ]
    },
    
    relationships: [
      { 
        name: "颜回", 
        relationship: "最得意弟子", 
        description: "颜回是孔子最欣赏的弟子，以德行著称。孔子称赞他'一箪食，一瓢饮，在陋巷，人不堪其忧，回也不改其乐'。",
        poems: ["《论语》记载其言行甚多"],
        famousQuote: "仰之弥高，钻之弥坚"
      },
      { 
        name: "子路", 
        relationship: "忠诚弟子", 
        description: "子路是孔子弟子中性格最直率的一个，勇于任事，对孔子忠心耿耿。",
        famousQuote: "君子死，冠不免"
      },
      { 
        name: "曾子", 
        relationship: "传承弟子", 
        description: "曾子，名参，是孔子晚年收的弟子，后被子思再传孟子，对儒家学派传承有重大贡献。",
        famousQuote: "吾日三省吾身"
      },
      { 
        name: "老子", 
        relationship: "思想交流", 
        description: "老子与孔子是同时代的思想家，传说孔子曾问道于老子。两者思想有显著差异，但都是中国哲学的奠基人。",
        famousQuote: "道不同，不相为谋"
      },
      {
        name: "周公", 
        relationship: "精神偶像", 
        description: "周公是西周初期的政治家，制礼作乐，是孔子最为推崇的古代圣王。孔子毕生致力于复兴周公之道。",
        famousQuote: "久矣吾不复梦见周公"
      }
    ],
    
    poetryCharacteristics: {
      "《诗》学": {
        description: "孔子是《诗经》的重要整理者和传播者，他提出'《诗》三百，一言以蔽之，曰：思无邪'。",
        examples: [
          "《关雎》：'关关雎鸠，在河之洲'",
          "《蒹葭》：'蒹葭苍苍，白露为霜'"
        ]
      },
      音乐素养: {
        description: "孔子酷爱音乐，'子在齐闻《韶》，三月不知肉味'。他将音乐作为人格修养的重要部分。",
        features: [
          "认为音乐能陶冶情操",
          "将音乐与治国结合",
          "提出'乐而不淫，哀而不伤'的审美标准"
        ]
      }
    },
    
    // 孔子名句分类整理
    famousQuotes: {
      学习与教育: [
        { quote: "学而时习之，不亦说乎", source: "论语·学而", interpretation: "学习知识后经常温习，是一件快乐的事" },
        { quote: "温故而知新，可以为师矣", source: "论语·为政", interpretation: "温习旧知识能有新体会，就可以当老师了" },
        { quote: "学而不思则罔，思而不学则殆", source: "论语·为政", interpretation: "只学习不思考会迷惑，只思考不学习会危险" },
        { quote: "三人行，必有我师焉", source: "论语·述而", interpretation: "几个人在一起，其中必有值得我学习的人" }
      ],
      品德与修养: [
        { quote: "己所不欲，勿施于人", source: "论语·颜渊", interpretation: "自己不愿意做的事，不要强加给别人" },
        { quote: "君子成人之美，不成人之恶", source: "论语·颜渊", interpretation: "君子帮助别人成就好事，不帮助别人做坏事" },
        { quote: "其身正，不令而行；其身不正，虽令不从", source: "论语·子路", interpretation: "自身正了，不用命令百姓也会跟着做" }
      ],
      人生哲理: [
        { quote: "知之为知之，不知为不知，是知也", source: "论语·为政", interpretation: "知道就是知道，不知道就是不知道，这才是真正的智慧" },
        { quote: "逝者如斯夫，不舍昼夜", source: "论语·子罕", interpretation: "时间像流水一样日夜流逝，令人感慨" },
        { quote: "不患无位，患所以立", source: "论语·里仁", interpretation: "不担心没有职位，担心没有立身之本" }
      ],
      政治理想: [
        { quote: "为政以德，譬如北辰，居其所而众星共之", source: "论语·为政", interpretation: "用道德治理国家，就像北极星居中不动，众星环绕" },
        { quote: "君君，臣臣，父父，子子", source: "论语·颜渊", interpretation: "君主要有君主的样子，臣子要有臣子的样子，各安其位" }
      ]
    },
    
    relics: [
      {
        name: "孔庙",
        location: "山东省曲阜市",
        description: "祭祀孔子的庙宇，是世界上最大的祭祀孔子建筑群。",
        highlights: ["大成殿", "杏坛", "碑林"]
      },
      {
        name: "孔府",
        location: "山东省曲阜市",
        description: "孔子后裔居住的府第，是中国现存最大、最完整的高官府第。",
        highlights: ["大堂", "二堂", "内宅"]
      },
      {
        name: "孔林",
        location: "山东省曲阜市",
        description: "孔子及其后裔的家族墓地，是世界上延时最久的家族墓地。",
        highlights: ["孔子墓", "楷木雕像", "驻跸亭"]
      },
      {
        name: "嵩阳书院",
        location: "河南省登封市",
        description: "宋代四大书院之一，司马迁曾在此讲学。",
        highlights: ["讲堂", "藏书楼"]
      }
    ],
    
    allusions: [
      { 
        title: "韦编三绝", 
        story: "孔子读《周易》时，用来编联竹简的皮绳断了三次，说明他读书的勤奋。",
        origin: "《史记·孔子世家》",
        usage: "形容读书勤奋"
      },
      { 
        title: "有教无类", 
        story: "孔子主张教育不分出身贵贱人人都可接受教育，打破了贵族对教育的垄断。",
        origin: "《论语·卫灵公》",
        usage: "指教育平等"
      },
      { 
        title: "因材施教", 
        story: "孔子根据每个学生的不同特点，采用不同的教学方法。",
        origin: "《论语·先进》",
        usage: "指根据不同人采取不同教育方法"
      },
      {
        title: "周游列国",
        story: "孔子55岁时带领弟子周游列国长达十四年，试图推行自己的政治主张。",
        origin: "《史记·孔子世家》",
        usage: "形容人四处奔走宣传自己的主张"
      }
    ],
    
    historicalComments: [
      { era: "战国", critic: "孟子", comment: "孔子之谓集大成。集大成也者，金声而玉振之也。", source: "《孟子·万章下》" },
      { era: "西汉", critic: "司马迁", comment: "《诗》有之：'高山仰止，景行行止。'虽不能至，然心向往之。", source: "《史记·孔子世家》" },
      { era: "东汉", critic: "汉武帝", comment: "罢黜百家，独尊儒术", source: "《汉书·董仲舒传》" },
      { era: "北宋", critic: "宋真宗", comment: "孔子定百代帝王之师", source: "《宋史》" },
      { era: "现代", critic: "胡适", comment: "孔子是中国第一个使教育民众化的人", source: "《中国哲学史大纲》" },
      { era: "现代", critic: "杜维明", comment: "孔子的人文精神对现代世界具有重要意义", source: "《哈佛燕京学刊》" }
    ],
    
    recommendedReadings: [
      { title: "《论语》", author: "孔子弟子及再传弟子", note: "记载孔子及其弟子言行的最重要典籍" },
      { title: "《春秋》", author: "孔子（编订）", note: "孔子修订的中国第一部编年体史书" },
      { title: "《礼记》", author: "戴圣（编订）", note: "记载儒家礼教的著作" },
      { title: "《史记·孔子世家》", author: "司马迁", note: "最权威的孔子传记" },
      { title: "《孔子传》", author: "钱穆", note: "现代权威的孔子传记" }
    ],
    
    learningPath: [
      { step: 1, title: "入门", resources: ["《论语》选读（学而、为政）", "孔子生平故事", "三孔（孔庙、孔府、孔林）"] },
      { step: 2, title: "进阶", resources: ["《论语》全读", "《论语》注解（朱熹《四书章句集注》）", "孔子的教育思想"] },
      { step: 3, title: "深入", resources: ["《礼记》选读", "《春秋》三传", "诸子百家与孔子的关系"] },
      { step: 4, title: "研究", resources: ["儒家思想的发展演变", "孔子与现代社会的价值", "中西哲学比较"] }
    ]
  }
};

// ============================================
// 屈原 - 深度知识库
// ============================================
export const quYuanDeepKnowledge = {
  person: {
    name: "屈原",
    nameVariants: ["屈平", "正则", "灵均", "屈原"],
    dynasty: "战国时期",
    birthYear: "约公元前340年",
    deathYear: "约公元前278年",
    birthPlace: "楚国丹阳（今湖北秭归）",
    
    timeline: [
      { year: "约前340年", event: "出生于楚国丹阳，芈姓屈氏，名平字原" },
      { year: "约前318年", event: "二十余岁，任楚怀王左徒，参与内政外交" },
      { year: "约前313年", event: "遭谗言被罢官，贬为三闾大夫" },
      { year: "约前304年", event: "第一次被流放汉北地区" },
      { year: "约前296年", event: "楚怀王客死于秦，顷襄王即位" },
      { year: "约前290年", event: "第二次被流放江南，开始创作《离骚》" },
      { year: "约前278年", event: "秦将白起破郢都，屈原投汨罗江殉国" }
    ],
    
    relationships: [
      { 
        name: "楚怀王", 
        relationship: "君主", 
        description: "楚怀王熊槐，屈原早期受到重用，后因谗言疏远屈原，最终客死于秦。",
        famousQuote: "信而见疑，忠而被谤"
      },
      { 
        name: "宋玉", 
        relationship: "后辈", 
        description: "宋玉是战国末期楚辞作家，相传为屈原弟子，继承并发展了楚辞创作。",
        famousQuote: "悲哉，秋之为气也"
      },
      { 
        name: "渔父", 
        relationship: "隐士", 
        description: "《渔父》篇中与屈原对话的隐士，代表了道家出世思想，与屈原的入世精神形成对比。",
        famousQuote: "举世皆浊我独清，众人皆醉我独醒"
      }
    ],
    
    poetryCharacteristics: {
      浪漫主义: {
        description: "屈原是中国浪漫主义诗歌的奠基人，其作品想象奇伟，辞藻瑰丽，大量运用神话传说。",
        examples: [
          "《离骚》：路漫漫其修远兮，吾将上下而求索",
          "《九歌》：沅有芷兮澧有兰，思公子兮未敢言"
        ]
      },
      楚辞体: {
        description: "屈原开创了楚辞这一诗歌体裁，句式灵活，多用兮字，对后世文学影响深远。",
        features: [
          "句式参差错落，更自由",
          "大量使用语气词'兮'",
          "地方色彩浓厚，楚地风情",
          "比兴象征，香草美人"
        ]
      }
    },
    
    famousQuotes: {
      家国情怀: [
        { quote: "路漫漫其修远兮，吾将上下而求索", source: "离骚", interpretation: "追求真理的道路漫长而遥远，我将不懈地探索" },
        { quote: "亦余心之所善兮，虽九死其犹未悔", source: "离骚", interpretation: "只要是我心中所追求的美好理想，即使死多次也不后悔" },
        { quote: "长太息以掩涕兮，哀民生之多艰", source: "离骚", interpretation: "长叹一声掩面流泪，哀叹人民生活的艰难" }
      ],
      人格追求: [
        { quote: "举世皆浊我独清，众人皆醉我独醒", source: "渔父", interpretation: "整个世界都污浊只有我清白，众人都醉了只有我清醒" },
        { quote: "宁溘死以流亡兮，余不忍为此态也", source: "离骚", interpretation: "宁愿立即死去或流亡，也不愿做出那种苟合取容的丑态" },
        { quote: "伏清白以死直兮，固前圣之所厚", source: "离骚", interpretation: "保持清白为正道而死，本是前代圣贤所推崇的" }
      ],
      浪漫意象: [
        { quote: "日月忽其不淹兮，春与秋其代序", source: "离骚", interpretation: "日月匆匆不停留，春秋四季依次更替" },
        { quote: "惟草木之零落兮，恐美人之迟暮", source: "离骚", interpretation: "想到草木的凋零，不禁担忧美人也将衰老" }
      ]
    },
    
    relics: [
      {
        name: "屈原故里",
        location: "湖北省秭归县",
        description: "屈原的故乡，有屈原祠、读书洞、照面井等遗迹。",
        highlights: ["屈原祠", "乐平里", "读书洞"]
      },
      {
        name: "汨罗江",
        location: "湖南省汨罗市",
        description: "屈原投江殉国的地方，每年端午节在此举行龙舟竞渡。",
        highlights: ["屈子祠", "屈原墓", "骚坛"]
      },
      {
        name: "屈原祠",
        location: "湖北省宜昌市秭归县",
        description: "纪念屈原的祠堂，始建于唐代，现存建筑为清代重建。",
        highlights: ["山门", "大殿", "屈原铜像"]
      }
    ],
    
    allusions: [
      { 
        title: "端午节", 
        story: "传说屈原投江后，百姓划船打捞，投粽子喂鱼，逐渐演变为端午节赛龙舟、吃粽子的习俗。",
        origin: "南朝梁·吴均《续齐谐记》",
        usage: "每年农历五月初五纪念屈原"
      },
      { 
        title: "香草美人", 
        story: "屈原在《离骚》中以香草美人比喻君子和理想，开创了中国文学中比兴象征的传统。",
        origin: "《离骚》",
        usage: "指楚辞中以香草美人喻君子的手法"
      },
      { 
        title: "汨罗投江", 
        story: "郢都被攻破后，屈原不愿做亡国奴，怀石投汨罗江而死，以死明志。",
        origin: "《史记·屈原贾生列传》",
        usage: "形容忠烈之士以死殉国"
      }
    ],
    
    historicalComments: [
      { era: "西汉", critic: "司马迁", comment: "其文约，其辞微，其志洁，其行廉。", source: "《史记·屈原贾生列传》" },
      { era: "东汉", critic: "王逸", comment: "屈原之词，诚博远矣。", source: "《楚辞章句序》" },
      { era: "南朝", critic: "刘勰", comment: "气往轹古，辞来切今，惊采绝艳，难与并能矣。", source: "《文心雕龙·辨骚》" },
      { era: "现代", critic: "鲁迅", comment: "逸响伟辞，卓绝一世。", source: "《汉文学史纲要》" },
      { era: "现代", critic: "郭沫若", comment: "屈原是两千多年前的一位伟大的爱国诗人。", source: "《屈原研究》" }
    ],
    
    recommendedReadings: [
      { title: "《离骚》", author: "屈原", note: "屈原最著名的代表作，中国最长的抒情诗" },
      { title: "《楚辞》", author: "屈原、宋玉等", note: "西汉刘向辑录的楚辞总集" },
      { title: "《史记·屈原贾生列传》", author: "司马迁", note: "最权威的屈原传记" },
      { title: "《楚辞章句》", author: "王逸", note: "最早的楚辞注本" },
      { title: "《屈原研究》", author: "郭沫若", note: "现代重要的屈原研究著作" }
    ],
    
    learningPath: [
      { step: 1, title: "入门", resources: ["《离骚》节选", "屈原生平故事", "端午节的由来"] },
      { step: 2, title: "进阶", resources: ["《离骚》全读", "《九歌》选读", "楚辞的艺术特色"] },
      { step: 3, title: "深入", resources: ["《九章》选读", "《渔父》《卜居》", "屈原与楚国历史"] },
      { step: 4, title: "研究", resources: ["楚辞学历史", "屈原与浪漫主义传统", "屈原的当代意义"] }
    ]
  }
};

// ============================================
// 陶渊明 - 深度知识库
// ============================================
export const taoYuanMingDeepKnowledge = {
  person: {
    name: "陶渊明",
    nameVariants: ["陶潜", "元亮", "五柳先生", "靖节先生"],
    dynasty: "东晋",
    birthYear: "约公元365年",
    deathYear: "约公元427年",
    birthPlace: "浔阳柴桑（今江西九江）",
    
    timeline: [
      { year: "约365年", event: "出生于浔阳柴桑，出身没落官宦家庭" },
      { year: "约393年", event: "29岁，首次出仕，任江州祭酒，不久辞官" },
      { year: "约400年", event: "入桓玄幕府，后因母丧辞官" },
      { year: "约404年", event: "入刘裕幕府，任镇军参军" },
      { year: "约405年", event: "任彭泽县令，八十余日即辞官归隐" },
      { year: "约406年", event: "创作《归去来兮辞》，正式开始隐居生活" },
      { year: "约408年", event: "家中失火，生活更加困顿" },
      { year: "约427年", event: "病逝于浔阳，自撰《自祭文》" }
    ],
    
    relationships: [
      { 
        name: "颜延之", 
        relationship: "挚友", 
        description: "南朝宋文学家，与陶渊明交谊深厚，常一起饮酒谈论。",
        famousQuote: "有疑陶渊明诗篇篇有酒"
      },
      { 
        name: "王弘", 
        relationship: "友人", 
        description: "江州刺史，仰慕陶渊明，常送酒接济，留下'白衣送酒'的典故。",
        famousQuote: "渊明嗜酒"
      },
      { 
        name: "苏轼", 
        relationship: "后世知音", 
        description: "苏轼极推崇陶渊明，晚年遍和陶诗百余首，称'吾与诗人无所甚好，独好渊明之诗'。",
        famousQuote: "其诗质而实绮，癯而实腴"
      }
    ],
    
    poetryCharacteristics: {
      田园诗派: {
        description: "陶渊明是田园诗派的开创者，以描写田园风光和隐居生活著称。",
        examples: [
          "《归园田居》：采菊东篱下，悠然见南山",
          "《饮酒》：山气日夕佳，飞鸟相与还"
        ]
      },
      平淡自然: {
        description: "诗风平淡自然，语言质朴，意境深远，看似平淡而内涵丰富。",
        features: [
          "语言朴素，不事雕琢",
          "意境悠远，韵味深长",
          "真情实感，自然流露",
          "物我两忘，天人合一"
        ]
      }
    },
    
    famousQuotes: {
      田园隐逸: [
        { quote: "采菊东篱下，悠然见南山", source: "饮酒·其五", interpretation: "在东篱下采菊，悠闲自在地望见南山，体现了超然物外的心境" },
        { quote: "归去来兮，田园将芜胡不归", source: "归去来兮辞", interpretation: "回去吧，田园快要荒芜了，为什么还不回去呢？" },
        { quote: "久在樊笼里，复得返自然", source: "归园田居·其一", interpretation: "长久困在官场牢笼里，如今终于能回归自然了" }
      ],
      人生感悟: [
        { quote: "悟已往之不谏，知来者之可追", source: "归去来兮辞", interpretation: "觉悟到过去的错误已经不可挽回，知道未来的事还来得及补救" },
        { quote: "人生无根蒂，飘如陌上尘", source: "杂诗·其一", interpretation: "人生没有根柢，就像路边的尘土一样飘泊无定" },
        { quote: "及时当勉励，岁月不待人", source: "杂诗·其一", interpretation: "应当趁年富力强之时勉励自己，光阴流逝是不等人的" }
      ],
      哲理思考: [
        { quote: "此中有真意，欲辨已忘言", source: "饮酒·其五", interpretation: "这里面蕴含着人生的真义，想要辨析却忘了怎样用语言表达" },
        { quote: "聊乘化以归尽，乐夫天命复奚疑", source: "归去来兮辞", interpretation: "姑且顺着自然的变化，走向生命的尽头，乐天知命还有什么可怀疑的呢" }
      ]
    },
    
    relics: [
      {
        name: "陶渊明纪念馆",
        location: "江西省九江市",
        description: "纪念陶渊明的专题博物馆，展示其生平与文学成就。",
        highlights: ["陶靖节祠", "陶渊明墓", "醉石"]
      },
      {
        name: "桃花源景区",
        location: "湖南省常德市",
        description: "因《桃花源记》而得名的景区，传说是陶渊明笔下的桃花源原型。",
        highlights: ["桃花山", "秦人村", "桃川书院"]
      }
    ],
    
    allusions: [
      { 
        title: "不为五斗米折腰", 
        story: "陶渊明任彭泽县令时，郡督邮来巡查，县吏让他束带迎接。陶渊明叹道：'吾不能为五斗米折腰，拳拳事乡里小人邪！'于是辞官归隐。",
        origin: "《晋书·陶潜传》",
        usage: "形容人有骨气，不为利禄所动"
      },
      { 
        title: "白衣送酒", 
        story: "陶渊明重阳节无酒，独坐菊花丛中。忽见一白衣人来，原来是江州刺史王弘派来送酒的。",
        origin: "《续晋阳秋》",
        usage: "形容朋友送酒，雪中送炭"
      },
      { 
        title: "世外桃源", 
        story: "陶渊明在《桃花源记》中描绘了一个与世隔绝、没有战乱的理想社会。",
        origin: "《桃花源记》",
        usage: "形容理想中的美好世界，或比喻不受外界影响的地方"
      }
    ],
    
    historicalComments: [
      { era: "南朝", critic: "钟嵘", comment: "文体省净，殆无长语。", source: "《诗品》" },
      { era: "北宋", critic: "苏轼", comment: "其诗质而实绮，癯而实腴。", source: "《与苏辙书》" },
      { era: "南宋", critic: "朱熹", comment: "陶诗所以为高，正在不待安排，胸中自然流出。", source: "《朱子语类》" },
      { era: "现代", critic: "鲁迅", comment: "陶潜总不能超于尘世，而且，于朝政还是留心。", source: "《魏晋风度及文章与药及酒之关系》" },
      { era: "现代", critic: "梁启超", comment: "自然界是他爱恋的伴侣，常常对着他笑。", source: "《陶渊明之文艺及其品格》" }
    ],
    
    recommendedReadings: [
      { title: "《陶渊明集》", author: "陶渊明", note: "陶渊明诗文全集，含诗、文、辞赋" },
      { title: "《桃花源记》", author: "陶渊明", note: "最著名的散文，千古名篇" },
      { title: "《归去来兮辞》", author: "陶渊明", note: "归隐宣言，六朝辞赋名篇" },
      { title: "《饮酒二十首》", author: "陶渊明", note: "组诗代表作，含'采菊东篱下'" },
      { title: "《归园田居五首》", author: "陶渊明", note: "田园诗代表作" }
    ],
    
    learningPath: [
      { step: 1, title: "入门", resources: ["《桃花源记》", "陶渊明生平故事", "不为五斗米折腰典故"] },
      { step: 2, title: "进阶", resources: ["《饮酒·其五》", "《归园田居·其一》", "《归去来兮辞》"] },
      { step: 3, title: "深入", resources: ["《饮酒二十首》全读", "《读山海经》", "田园诗的艺术特色"] },
      { step: 4, title: "研究", resources: ["陶渊明的哲学思想", "陶渊明对后世的影响", "陶诗的自然美学"] }
    ]
  }
};
