import type { Article } from "./types";

// technology 4+8+8+8+6+6+5+5 = 50 条
// 分多个 const 数组,每片 ~200 行,保证单次 Write 成功

// 四发明 4
const fourInv: Article[] = [
  { id:"zhizao",title:"造纸术",category:"technology",sub_category:"四大发明",tags:["东汉","蔡伦","世界级"],
    excerpt:"东汉蔡伦改进造纸术,'蔡侯纸'使书写材料普及,世界文明重大变革。",
    body:"中国四大发明之一。东汉蔡伦(约62年-121年)于公元105年改进造纸术,造'蔡侯纸'。",
    dynasty:"汉",era:"东汉",region:"河南",author:"溯光编辑部",cover:"📜",sort_weight:95,
    history:"西汉已有麻纸,但工艺粗糙。东汉和帝时,蔡伦任尚方令,改进工艺,'用树肤、麻头及敝布、鱼网以为纸',公元105年奏报朝廷。",
    influence:"造纸术经丝绸之路传至西方,改变世界文明进程。8世纪传至阿拉伯,12世纪传至欧洲,催生文艺复兴。",
    body_extended:"蔡侯纸制作:树皮、麻头、破布、鱼网→切碎→浸石灰→舂捣→抄纸→晾晒。",
    faq:[{question:"蔡伦是宦官吗？",answer:"是。蔡伦是东汉宦官,字敬仲,桂阳郡(今湖南)人。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"huoziys",title:"活字印刷术",category:"technology",sub_category:"四大发明",tags:["北宋","毕昇","世界级"],
    excerpt:"北宋毕昇(约970-1051)发明活字印刷术,'胶泥活字'早于西方400年。",
    body:"中国四大发明之一。北宋毕昇于庆历年间(1041-1048)发明泥活字印刷。",
    dynasty:"宋",era:"北宋",region:"河南/安徽",author:"溯光编辑部",cover:"🖨️",sort_weight:95,
    history:"唐代已有雕版印刷(868年《金刚经》)。北宋庆历年间,毕昇用胶泥刻字,火烧硬,排版印刷。",
    influence:"活字印刷术经丝绸之路西传,1450年德国谷登堡发明金属活字印刷,引发欧洲知识普及、宗教改革、文艺复兴。",
    body_extended:"活字按材质:泥活字(毕昇)、木活字(王祯)、铜活字(明代)。",
    faq:[{question:"活字印刷为什么没在中国普及？",answer:"中国雕版印刷成熟、汉字繁多,活字印刷反不如雕版经济。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"huoyao",title:"火药",category:"technology",sub_category:"四大发明",tags:["唐","炼丹","世界级"],
    excerpt:"唐代炼丹家偶然发明,宋代用于军事,改变世界战争史。",
    body:"中国四大发明之一。火药是炼丹家在炼制长生不老药时偶然发现。",
    dynasty:"唐",era:"唐代",region:"全国",author:"溯光编辑部",cover:"💥",sort_weight:90,
    history:"唐代炼丹家在炼制丹药时,以硝石、硫磺、木炭按比例混合,无意中发现爆燃,成为原始火药。",
    influence:"火药传入阿拉伯,13世纪传至欧洲,催生热兵器革命。'火药'在阿拉伯语为'barud'(源于汉语'火药'音译)。",
    body_extended:"火药配方:硝石75%、硫磺10%、木炭15%。",
    faq:[{question:"火药是道家炼丹发明的吗？",answer:"是。唐代道家炼丹,偶然发明。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"zhinanzhen",title:"指南针",category:"technology",sub_category:"四大发明",tags:["战国","司南","世界级"],
    excerpt:"战国时期'司南'雏形,宋代用于航海,改变世界航海史。",
    body:"中国四大发明之一。战国时期已有'司南'(磁石勺),宋代发展出旱罗盘,用于航海。",
    dynasty:"战国",era:"战国至今",region:"全国",author:"溯光编辑部",cover:"🧭",sort_weight:90,
    history:"战国时期《韩非子·有度》'故先王立司南,以端朝夕',是中国古代磁指南最早的记载。",
    influence:"指南针传入阿拉伯、欧洲,催生了15-16世纪大航海时代。哥伦布、麦哲伦均依靠指南针发现新大陆。",
    body_extended:"指南针演化:司南(战国)→指南鱼(宋代)→磁针(宋代)→罗盘(明代)→旱罗盘(欧洲)。",
    faq:[{question:"司南是什么？",answer:"战国时期'司南',以磁石磨成长柄勺形,置于光滑地盘上,勺柄指南,是最早的磁性指向器。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  }
];

// 天文 8
const astro: Article[] = [
  { id:"huntianyi",title:"浑天仪",category:"technology",sub_category:"天文",tags:["汉","张衡","天体"],
    excerpt:"东汉张衡创制,以水力运转,模拟天体运行,是古代天文观测重大发明。",
    body:"浑天仪是古代观测天体的仪器,东汉张衡改良,水力运转。",
    dynasty:"汉",era:"东汉",region:"河南",author:"溯光编辑部",cover:"🌌",sort_weight:80,
    history:"汉武帝时落下闳造浑天仪。张衡于公元117年改进,'以四分度之二为转轴','以漏水转之',加刻度、二十八宿、日月五星。",
    influence:"浑天仪是中国古代天文观测重要仪器,领先世界近千年。",
    body_extended:"浑天仪分:浑仪(观测)、浑象(演示)、水运浑象(张衡创,水力自动运转)。",
    faq:[{question:"浑天仪是做什么的？",answer:"浑仪:观测天体位置;浑象:演示天体运行。"}],
    related_people:[{id:"zhangheng",title:"张衡",category:"figures"}],
    related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"zhangheng",title:"张衡",category:"technology",sub_category:"天文",tags:["东汉","科学家","地动仪"],
    excerpt:"东汉科学家,'南阳西鄂人',造地动仪、浑天仪,'科圣'。",
    body:"张衡(78年-139年),字平子,南阳西鄂(今河南南阳)人,东汉科学家、文学家。",
    dynasty:"汉",era:"东汉",region:"河南",author:"溯光编辑部",cover:"🔭",sort_weight:85,
    history:"张衡17岁游学长安,28岁任南阳太守主簿。公元111年起,入京任郎中,后任太史令,主掌天文历算。",
    influence:"张衡是中国古代最杰出科学家之一,'科圣'。其地动仪是世界最早的地震仪,比西方早1700年。",
    body_extended:"张衡四项发明:候风地动仪(132年)、水运浑象、指南车(注:有争议)、记里鼓车。",
    faq:[{question:"地动仪工作原理？",answer:"内设都柱(中心柱),八方向各有一龙,龙嘴含珠,下各有一蟾蜍张口对应。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"didongyi",title:"候风地动仪",category:"technology",sub_category:"天文",tags:["东汉","张衡","世界第一"],
    excerpt:"东汉张衡于132年创制,世界最早的地震监测仪器,早西方1700年。",
    body:"候风地动仪是张衡于公元132年发明的地震监测仪器。",
    dynasty:"汉",era:"东汉",region:"河南",author:"溯光编辑部",cover:"🌍",sort_weight:88,
    history:"公元132年,张衡创制候风地动仪,'以精铜铸成,员径八尺,合盖隆起,形似酒尊',内设'都柱''八道'。",
    influence:"这是世界最早的地震仪,领先西方1700年。138年成功记录陇西地震。",
    body_extended:"地动仪失传:约毁于东汉末年战乱,近代王振铎(1951)、冯锐(2002)均尝试复原。",
    faq:[{question:"地动仪失传了吗？",answer:"史书有详细描述,但实物失传。现存为后人复原模型,具体结构有争议。"}],
    related_people:[{id:"zhangheng",title:"张衡",category:"figures"}],
    related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"jianyi",title:"简仪",category:"technology",sub_category:"天文",tags:["元","郭守敬","登封"],
    excerpt:"元代郭守敬创制,化繁为简,中国天文观测重大革命,现存登封观星台。",
    body:"简仪是元代郭守敬(1231-1316)于1276年设计的天文观测仪器。",
    dynasty:"元",era:"元代",region:"河南登封",author:"溯光编辑部",cover:"🌠",sort_weight:75,
    history:"郭守敬将唐宋以来浑仪的复杂结构分解为'赤道经纬仪'和'立运仪'两部分,简化结构,减少误差。",
    influence:"简仪比西方同样结构早300年。登封观星台是元代天文台遗址,2010年列入世界文化遗产。",
    body_extended:"郭守敬主持'授时历'(1281年),一年365.2425天,与现行公历一致。",
    faq:[{question:"登封观星台在哪儿？",answer:"河南省登封市告成镇,建于元代至元年间(1276-1280),是元代天文观测中心,现存。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"shuiyun",title:"水运仪象台",category:"technology",sub_category:"天文",tags:["宋","苏颂","开封"],
    excerpt:"北宋苏颂主持建造(1092年),集天文观测、天象演示、报时于一体,'世界时钟'。",
    body:"水运仪象台是北宋苏颂、韩公廉等设计制造的大型综合天文仪器。",
    dynasty:"宋",era:"北宋",region:"河南开封",author:"溯光编辑部",cover:"⏰",sort_weight:75,
    history:"苏颂主持建造于1092年,高约12米,集天文观测(浑仪)、演示(浑象)、报时(昼夜钟鼓)于一体,以水力运转。",
    influence:"水运仪象台是11世纪世界最先进的综合天文钟,其擒纵器(机械钟核心)早于欧洲200年。李约瑟称其为'现代天文钟的祖先'。",
    body_extended:"水运仪象台由苏颂《新仪象法要》详细记载,得以复原。",
    faq:[{question:"什么是'擒纵器'？",answer:"机械钟的核心部件,周期性释放能量,使齿轮匀速运动。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"shoushi",title:"授时历",category:"technology",sub_category:"天文",tags:["元","郭守敬","历法"],
    excerpt:"元代郭守敬、王恂编订,1281年颁行,一年365.2425天,与现行公历相同。",
    body:"授时历是中国古代最精确的历法,由郭守敬、王恂等人编订,至元十八年(1281年)颁行。",
    dynasty:"元",era:"元代",region:"全国",author:"溯光编辑部",cover:"📅",sort_weight:72,
    history:"元世祖忽必烈命郭守敬、王恂等编订新历,3年完成,'以古为法'、'以今为时',废除'上元积年'。",
    influence:"授时历的回归年长度365.2425日,与现行公历(格里高利历)完全相同,但比公历早300多年。",
    body_extended:"授时历采用'招差法'计算天体运行,'弧矢割圆术'计算弧长。",
    faq:[{question:"授时历为什么先进？",answer:"首次完全废除'上元积年'概念,采用实测数据。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"ershiba",title:"二十八宿",category:"technology",sub_category:"天文",tags:["先秦","天区","中印共有"],
    excerpt:"中国古代天区划分系统,'东方青龙、北方玄武、西方白虎、南方朱雀'。",
    body:"二十八宿是中国古代沿黄道带划分的28个星区,起源于先秦。",
    dynasty:"周",era:"先秦至今",region:"全国",author:"溯光编辑部",cover:"⭐",sort_weight:65,
    history:"二十八宿起源于上古,春秋战国时期定型,用于天文观测、占星、农时。",
    influence:"二十八宿影响中国、印度、阿拉伯、波斯天文学。中国与印度共有的二十八宿,是中印古代文化交流的证据。",
    body_extended:"四方:东方苍龙七宿、北方玄武七宿、西方白虎七宿、南方朱雀七宿。",
    faq:[{question:"什么是'三垣'？",answer:"紫微垣、太微垣、天市垣,是北天极附近三个天区。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"wuxing_astro",title:"五星",category:"technology",sub_category:"天文",tags:["先秦","水金火木土","占星"],
    excerpt:"金木水火土五大行星,中国古代天文观测重要对象,与五行对应。",
    body:"五星指水星、金星、火星、木星、土星五大行星,中国古代长期观测。",
    dynasty:"周",era:"先秦至今",region:"全国",author:"溯光编辑部",cover:"🪐",sort_weight:55,
    history:"五星观测始于先秦,《尚书·舜典》'在璇玑玉衡,以齐七政',含五大行星。",
    influence:"五星与五行(金木水火土)对应,是天人合一思想的重要体现。",
    body_extended:"五星古名:水星(辰星)、金星(太白)、火星(熒惑)、木星(岁星)、土星(镇星)。",
    faq:[{question:"为什么'金星'又称'太白'？",answer:"金星亮度最高,古人称'太白星';黄昏出现称'长庚',黎明出现称'启明'。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  }
];

export const fourInventions: Article[] = fourInv;
export const astronomyArticles: Article[] = astro;
export { mathArticles, medicineArticles, agricultureArticles } from "./rest-part2-technology-2b";
