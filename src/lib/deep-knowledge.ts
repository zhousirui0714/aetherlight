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
      { year: "725年", event: "二十五岁。出蜀，"仗剑去国，辞亲远游"，沿江东下" },
      { year: "727年", event: "二十七岁。定居安陆，结识孟浩然" },
      { year: "730年", event: "三十岁。入长安，干谒张说、玉真公主，未获赏识" },
      { year: "734年", event: "三十四岁。作《蜀道难》，贺知章读后叹为"谪仙人"" },
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
        description: "李白对孟浩然极为推崇，曾写下"吾爱孟夫子，风流天下闻"的诗句。二人在安陆相识，友谊深厚。",
        poems: ["《黄鹤楼送孟浩然之广陵》"],
        famousQuote: "故人西辞黄鹤楼，烟花三月下扬州"
      },
      {
        name: "贺知章", 
        relationship: "忘年交", 
        description: "贺知章是当时的文坛泰斗，比李白年长四十余岁。他读《蜀道难》后称李白为"谪仙人"，成为李白名号的由来。",
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
          "《将进酒》："君不见黄河之水天上来，奔流到海不复回"",
          "《蜀道难》："噫吁嚱，危乎高哉！蜀道之难，难于上青天！"",
          "《梦游天姥吟留别》："天姥连天向天横，势拔五岳掩赤城""
        ],
        techniques: [
          "夸张：李白善用夸张手法，如"白发三千丈"、"飞流直下三千尺"",
          "想象：李白的想象奇特大胆，如"举杯邀明月，对影成三人"",
          "比喻：善用比喻将抽象情感具象化，如"愁"如"黄河之水""
        ]
      },
      语言风格: {
        description: "李白的诗歌语言清新自然，却又雄奇豪放，形成独特的"清水芙蓉"之美。",
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
        description: "李白曾在此寓居，留下"鲁酒若琥珀"的诗句。",
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
        story: "李白常骑驴游山玩水，寻找作诗灵感。有一次在华阴县骑驴，被县令拦住，李白大怒，留下"天子殿前尚容骑马，华阴县里不得骑驴"的佳话。",
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
        contribution: "将李白定位为"浪漫主义的最高峰""
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
        ""李白"成为诗酒人生的代名词",
        "李白墓成为文化旅游景点",
        "多地举办李白诗歌节"
      ],
      精神: [
        "追求自由、不羁的性格成为文人精神象征",
        "李白的诗歌理想主义影响深远",
        ""诗仙"成为对诗人的最高赞誉之一"
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
  answer: "李白（701年-762年），字太白，号青莲居士，唐代伟大的浪漫主义诗人，被誉为"诗仙"。他一生创作诗歌千余首，内容涵盖山水、饮酒、游仙、送别、政治等多种题材，想象奇特，语言豪放，在中国文学史上占有举足轻重的地位。",

  // 详细扩展内容
  detailedAnswer: {
    overview: "李白是中国文学史上最伟大的诗人之一，与杜甫并称"李杜"，代表了唐代诗歌的最高成就。他的一生充满传奇色彩：从碎叶城出生，到蜀中成长，再到遍游天下，最后病逝当涂。他的诗歌想象丰富、语言豪放、意境壮阔，是浪漫主义诗歌的巅峰之作。",

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

  scholarAnalysis: "学者周勋初在《李白评传》中指出，李白的诗歌具有"清水出芙蓉，天然去雕饰"的美学特征，想象奇特、气势豪迈、感情充沛，是中国浪漫主义诗歌的巅峰。学者袁行霈在《中国文学史》中评价李白是"中国文学史上最具天才、最富于想象力的诗人"。",

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
      地位: "中国古典小说的巅峰之作，被誉为"中国封建社会的百科全书""
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
export const quYuanDeepKnowledge = {
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
      "创立了"楚辞"这一新的诗歌体裁",
      "《楚辞》与《诗经》并称"风骚"",
      "忧国忧民的精神成为士大夫的楷模",
      "端午节就是为了纪念屈原"
    ],
    
    精神遗产: "屈原的爱国主义精神和执着追求理想的品格，成为中华民族精神的重要组成部分。"路漫漫其修远兮，吾将上下而求索"成为激励后人的名言。"
  }
};
