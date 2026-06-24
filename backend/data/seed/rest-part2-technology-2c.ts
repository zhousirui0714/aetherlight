import type { Article } from "./types";

// technology 余下: 水利 6 + 营造 5 + 纺织 5 = 16

const waterWorks: Article[] = [
  { id:"dujiangyan",title:"都江堰",category:"technology",sub_category:"水利",tags:["战国","李冰","无坝引水"],
    excerpt:"战国秦蜀郡守李冰主持修建,无坝引水工程,世界水利史奇迹,2000年仍在使用。",
    body:"都江堰位于四川成都都江堰市,战国秦昭王时蜀郡守李冰(约公元前256-前251)主持修建。",
    dynasty:"战国",era:"战国",region:"四川",author:"溯光编辑部",cover:"💧",sort_weight:95,
    history:"李冰主持修建,凿离堆,'深淘滩,低作堰',宝瓶口引水入内江,飞沙堰泄洪排沙,鱼嘴分水。",
    influence:"都江堰使成都平原'水旱从人,不知饥馑,时无荒年,天下谓之天府',2000年持续使用,2000年入选世界文化遗产。",
    body_extended:"都江堰三大主体:鱼嘴(分水)、飞沙堰(泄洪)、宝瓶口(引水)。",
    faq:[
      {question:"什么是'深淘滩,低作堰'？",answer:"都江堰岁修六字诀。'深淘滩'指内江岁修时深挖河床;'低作堰'指飞沙堰不能修太高,以利泄洪。"},
      {question:"为什么无坝引水？",answer:"李冰巧妙利用地形和水流规律,不需要大坝拦截,而是引导,这是都江堰的伟大之处。"}
    ],
    related_people:[{id:"libing",title:"李冰",category:"figures"}],
    related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"lingqu",title:"灵渠",category:"technology",sub_category:"水利",tags:["秦","史禄","湘桂运河"],
    excerpt:"秦始皇时史禄开凿,沟通湘江与漓江,世界最早的船闸式运河。",
    body:"灵渠位于广西兴安县,秦始皇为统一岭南,命监御史禄(史禄)开凿(公元前214年)。",
    dynasty:"秦",era:"秦代",region:"广西",author:"溯光编辑部",cover:"⛵",sort_weight:80,
    history:"灵渠分北渠(注入湘江)、南渠(注入漓江),铧嘴分水,大小天平调节水量,陡门(船闸)控制水位。",
    influence:"灵渠沟通长江水系与珠江水系,促进中原与岭南交通,2000年仍在灌溉。2018年入选世界灌溉工程遗产。",
    body_extended:"灵渠:铧嘴(分水堤)、大小天平(溢流坝)、北渠、南渠、陡门(36处)。",
    faq:[{question:"什么是'陡门'？",answer:"灵渠的船闸,通过关闭/开启陡门控制水位,船只可翻越山岭。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"zhengguoqu",title:"郑国渠",category:"technology",sub_category:"水利",tags:["战国","韩国","关中"],
    excerpt:"战国末韩国水工郑国主持修建,关中四大水利之一,'疲秦计'产物。",
    body:"郑国渠位于陕西关中平原,战国末韩国水工郑国主持修建(公元前246年)。",
    dynasty:"战国",era:"战国末",region:"陕西",author:"溯光编辑部",cover:"💦",sort_weight:72,
    history:"韩桓惠王为'疲秦'之计,派郑国入秦修建大型灌溉渠,意图消耗秦国国力。秦王识破后,郑国答:'始臣为间,然渠成亦秦之利也。'秦王让其继续,遂成。",
    influence:"郑国渠使关中'收皆亩一钟'(亩产6石4斗),关中成为沃野,秦统一六国有了经济基础。",
    body_extended:"郑国渠长150公里,引泾水灌溉盐碱地,改良土壤。",
    faq:[{question:"什么是'疲秦'之计？",answer:"韩国担心秦进攻,派间谍郑国修渠,意图消耗秦国人力物力,使秦无力东征。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"dayunhe",title:"京杭大运河",category:"technology",sub_category:"水利",tags:["隋","杨广","南北大动脉"],
    excerpt:"隋炀帝杨广主导开凿,贯通南北,沟通海河、黄河、淮河、长江、钱塘江五大水系。",
    body:"京杭大运河全长1794公里,是世界最长运河,北起涿郡(今北京),南至余杭(今杭州)。",
    dynasty:"隋",era:"隋代至今",region:"北京-杭州",author:"溯光编辑部",cover:"🛶",sort_weight:90,
    history:"春秋吴王夫差开凿邗沟(公元前486年),隋炀帝610年贯通至涿郡,元代1293年京杭段贯通。",
    influence:"大运河是古代南北交通大动脉,'半部中国史',2014年列入世界文化遗产。",
    body_extended:"京杭大运河:通济渠(610)、永济渠(610)、邗沟(486)、江南河(610)、会通河(1289)、通惠河(1293)。",
    faq:[{question:"为什么大运河是'半部中国史'？",answer:"大运河是古代南北经济、文化、政治的纽带,沿线产生扬州、苏州、杭州、济宁等繁华都市,促进国家统一。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"kanerjing",title:"坎儿井",category:"technology",sub_category:"水利",tags:["汉","新疆","地下水利"],
    excerpt:"新疆吐鲁番特有的地下水利工程,与长城、运河并称'中国古代三大工程'。",
    body:"坎儿井是新疆吐鲁番特有的地下水利工程,竖井+暗渠+明渠组合。",
    dynasty:"汉",era:"汉代至今",region:"新疆吐鲁番",author:"溯光编辑部",cover:"🕳️",sort_weight:75,
    history:"相传坎儿井由林则徐(1840年代)或更早时期从中亚引入,后经新疆各族人民改进。现存5000余条,长5000余公里。",
    influence:"坎儿井解决干旱地区灌溉问题,'沙漠绿洲'的生命线,与万里长城、京杭大运河并称'中国古代三大工程'。",
    body_extended:"坎儿井结构:竖井(挖土/通气)、暗渠(输水)、明渠(灌溉)、涝坝(蓄水)。",
    faq:[{question:"坎儿井为什么要在地下？",answer:"吐鲁番夏季气温高达40℃以上,地下暗渠可避免水分蒸发,这是其设计的精妙之处。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"baixi",title:"白渠",category:"technology",sub_category:"水利",tags:["汉","关中","汉代水利"],
    excerpt:"汉武帝时白公主持修建,与郑国渠合称'郑白渠',关中重要水利。",
    body:"白渠位于陕西关中,汉武帝太始二年(公元前95年)由赵中大夫白公主持修建。",
    dynasty:"汉",era:"西汉",region:"陕西",author:"溯光编辑部",cover:"💦",sort_weight:60,
    history:"白渠引渭水支流石川河,灌溉关中渭北高地,长100余公里。",
    influence:"白渠与郑国渠合称'郑白渠',长期灌溉关中,直至唐宋仍有作用。",
    body_extended:"白渠有歌谣:'田于何所?池阳谷口。郑渠在前,白渠起后。举锸如云,决渠为雨。'",
    faq:[{question:"白渠与郑国渠什么关系？",answer:"郑国渠引泾水,白渠引石川水,二者共同构成关中水利网,使关中成为沃野。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  }
];

const architecture: Article[] = [
  { id:"yingzaofashi",title:"营造法式",category:"technology",sub_category:"营造",tags:["宋","李诫","建筑规范"],
    excerpt:"北宋李诫著,中国第一部建筑学专著,系统性总结古代建筑技术。",
    body:"《营造法式》北宋李诫(?-1110)著,元符三年(1100年)成书,崇宁二年(1103年)刊行。",
    dynasty:"宋",era:"北宋",region:"河南开封",author:"溯光编辑部",cover:"🏯",sort_weight:78,
    history:"李诫主持建造开封府衙、班荆馆、辟雍等,精通建筑,官至将作监丞,主持编修《营造法式》。",
    influence:"《营造法式》是中国第一部建筑学专著,系统总结宫殿、寺庙、官署、府第等建筑技术,影响东亚建筑近千年。",
    body_extended:"《营造法式》共34卷,3555条,详细记述'材分'制度(木构模数),是世界上最早的建筑规范。",
    faq:[{question:"什么是'材分'？",answer:"《营造法式》将木构件标准化为8等'材',每等分'分',用为模数,保证构件可互换,体现工业化思维。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"luban",title:"鲁班",category:"technology",sub_category:"营造",tags:["春秋","工匠","祖师"],
    excerpt:"春秋末期鲁国巧匠,'百工圣祖','中国工匠祖师',发明众多木工工具。",
    body:"鲁班(约公元前507-前444),姓公输名般,鲁国(今山东)人,春秋末期建筑工匠。",
    dynasty:"春秋",era:"春秋末期",region:"山东",author:"溯光编辑部",cover:"🛠️",sort_weight:88,
    history:"鲁班出身工匠世家,发明众多木工工具:锯、刨、钻、铲、曲尺、墨斗等。",
    influence:"鲁班被尊为'百工圣祖'、'中国工匠祖师'。其传说丰富,鲁班锁、鲁班凳等巧夺天工。",
    body_extended:"鲁班传说:鲁班锁(六根木条交叉咬合)、鲁班凳(不用钉的折叠凳)。",
    faq:[{question:"鲁班发明了哪些工具？",answer:"锯、刨、钻、铲、曲尺、墨斗、斧、凿、锛等木工工具,还改进许多农业生产工具。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"yangshilei",title:"样式雷",category:"technology",sub_category:"营造",tags:["清","皇家建筑","家族"],
    excerpt:"清代雷氏家族八代主持皇家建筑设计,圆明园、颐和园、故宫均出其手。",
    body:"样式雷是清代主持皇家建筑设计的雷氏家族,八代200余年,被誉'清代样式雷'。",
    dynasty:"清",era:"清代",region:"北京",author:"溯光编辑部",cover:"🏛️",sort_weight:75,
    history:"雷发达(1619-1693)为样式雷始祖,任工部样式房掌案。子孙八代(雷金玉、雷家玺、雷景修、雷思起、雷廷昌等)继承。",
    influence:"样式雷主持设计:圆明园、颐和园、承德避暑山庄、故宫、天坛等。其'烫样'(建筑模型)2007年入选联合国'世界记忆'名录。",
    body_extended:"样式雷留下大量'烫样'(用草纸板烙制立体建筑模型),现藏于国家图书馆,2007年入选联合国教科文组织'世界记忆遗产'。",
    faq:[{question:"什么是'烫样'？",answer:"用草纸板、木头等材料按比例制作的立体建筑模型,房屋门窗可开合,内有家具陈设,用于皇帝审阅。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"taihe",title:"太和殿",category:"technology",sub_category:"营造",tags:["明","故宫","木构"],
    excerpt:"故宫太和殿,中国古代木构建筑最高峰,高35米,中国现存最大木构大殿。",
    body:"太和殿(俗称金銮殿)位于北京紫禁城南北主轴线核心位置,明永乐十八年(1420)建成。",
    dynasty:"明",era:"明代",region:"北京",author:"溯光编辑部",cover:"🏛️",sort_weight:82,
    history:"太和殿明清两代举行重大典礼:登基、大婚、册立皇后、命将出征等。明代初建,屡毁屡建,现存为康熙三十六年(1697)重建。",
    influence:"太和殿是中国古代木构建筑技艺巅峰,高35.05米,面阔11间(60.01米),进深5间(33.33米),'九五之尊'(9开间5进深)。",
    body_extended:"太和殿三大特点:1)三层汉白玉台基;2)重檐庑殿顶(最高等级);3)72根大柱(中央6根'沥粉贴金云龙')。",
    faq:[{question:"什么是'九五之尊'？",answer:"太和殿面阔九间,进深五间,合'九五'(《易经》乾卦九五:'飞龙在天'),象征皇权至高无上。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"lijing",title:"李诫",category:"technology",sub_category:"营造",tags:["宋","营造法式","将作监"],
    excerpt:"北宋将作监丞,主持编修《营造法式》,中国建筑学奠基人。",
    body:"李诫(?-1110),字明仲,郑州管城(今河南郑州)人,北宋建筑家。",
    dynasty:"宋",era:"北宋",region:"河南",author:"溯光编辑部",cover:"📐",sort_weight:65,
    history:"李诫家学渊源,父李南公、兄李譠,均任官。1072年补郊社斋郎,1091年任将作监丞,主持多项重大建筑工程。",
    influence:"李诫主持编修《营造法式》,奠定中国建筑学基础。",
    body_extended:"李诫以《考工记》《木经》(喻皓著)为基础,实地考察工匠,历时数年编修完成。",
    faq:[{question:"《营造法式》是何时颁行？",answer:"1100年成书,1103年(崇宁二年)由朝廷颁行。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  }
];

const textile: Article[] = [
  { id:"hualouji",title:"花楼机",category:"technology",sub_category:"纺织",tags:["汉","提花","织机"],
    excerpt:"中国汉代发明的提花织机,'花楼'高悬,'提花'技术领先世界1500年。",
    body:"花楼机是中国古代提花织机,汉代已有雏形,唐代成熟。",
    dynasty:"汉",era:"汉代至今",region:"全国",author:"溯光编辑部",cover:"🧵",sort_weight:68,
    history:"花楼机由两人操作:一人'拉花'(在高楼上提拉经线),一人'织手'(在下方穿梭打纬)。汉代王逸《机妇赋》记载。",
    influence:"花楼机是中国古代最复杂的纺织机械,能织出任何复杂图案,'蜀锦''云锦'均依赖花楼机。",
    body_extended:"花楼机工作原理:提花束综高悬,经线提起形成'开口',织手穿梭打纬。",
    faq:[{question:"花楼机与西方的雅卡尔提花机？",answer:"中国花楼机(汉代)领先法国雅卡尔提花机(1801年)1500年,但机械原理一致。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"shujin",title:"蜀锦",category:"technology",sub_category:"纺织",tags:["汉","蜀锦","四大名锦"],
    excerpt:"中国四大名锦之首,始于战国,成都特产,'锦官城'得名于此。",
    body:"蜀锦是四川成都出产的提花丝织锦,工艺独特,始于战国,兴于汉代。",
    dynasty:"战国",era:"战国至今",region:"四川",author:"溯光编辑部",cover:"🧵",sort_weight:75,
    history:"蜀锦始于战国,汉代成都设'锦官',故有'锦官城'美称。三国时,诸葛亮重视蜀锦,'决敌之资,唯仰锦耳'。",
    influence:"蜀锦2006年入选国家级非物质文化遗产,'寸锦寸金',与云锦、宋锦、壮锦并称'中国四大名锦'。",
    body_extended:"蜀锦工艺:经线起花、五彩提花、独特的'晕染'技术。",
    faq:[{question:"蜀锦为什么贵？",answer:"蜀锦制作需用'花楼机',两人操作,效率低;且蚕丝本身贵;加上'晕染'技艺独特,故贵。"}],
    related_people:[{id:"zhugeliang",title:"诸葛亮",category:"figures"}],
    related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"yunjin",title:"云锦",category:"technology",sub_category:"纺织",tags:["元","南京","四大名锦"],
    excerpt:"元代起南京生产,'妆花织造'技术,2009年入选世界非物质文化遗产。",
    body:"云锦是南京传统提花丝织锦,因色泽光丽灿烂如云霞而得名,2009年入选世界非物质文化遗产。",
    dynasty:"元",era:"元代至今",region:"江苏南京",author:"溯光编辑部",cover:"☁️",sort_weight:78,
    history:"云锦始于元代,盛于明清,为皇家御用贡品。'妆花织造'技艺独特,一天仅能织5-6厘米。",
    influence:"云锦是四大名锦之一,'东方瑰宝',曾远销海外,影响欧洲织造。",
    body_extended:"云锦'妆花'工艺:用'挖梭'技法,在彩色底子上挖织彩色花纹,色彩多达十余种。",
    faq:[{question:"云锦与蜀锦的区别？",answer:"蜀锦:经线起花,几何图案为主;云锦:妆花挖梭,色彩斑斓,仿古画风格。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"kesi",title:"缂丝",category:"technology",sub_category:"纺织",tags:["唐","通经断纬","织中之圣"],
    excerpt:"织中之圣,'通经断纬'技法,正反两面图案相同,自宋以来为皇家御用。",
    body:"缂丝又称'刻丝',以'通经断纬'技法织造,是中国最古老的丝织工艺之一。",
    dynasty:"唐",era:"唐代至今",region:"苏州/定州",author:"溯光编辑部",cover:"🏮",sort_weight:75,
    history:"缂丝始于唐代,宋代发展成熟,朱克柔、沈子蕃为宋代缂丝名家。明清时期,缂丝为皇家御用,紫禁城缂丝藏品丰富。",
    influence:"缂丝被称为'织中之圣',2009年入选世界非物质文化遗产。其工艺繁复,正反两面图案相同。",
    body_extended:"缂丝主要产地:苏州缂丝(南方)、定州缂丝(北方)。",
    faq:[{question:"缂丝为什么叫'刻丝'？",answer:"'缂'字本义'刻',因缂丝织造时小梭换色,织出图案如刀刻般有立体感,故名'刻丝'。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  },
  { id:"songying",title:"宋锦",category:"technology",sub_category:"纺织",tags:["宋","苏州","四大名锦"],
    excerpt:"宋代苏州创制,图案雅致,'活色生香',2009年入选世界非物质文化遗产。",
    body:"宋锦是苏州宋代创制的丝织锦,2009年入选世界非物质文化遗产。",
    dynasty:"宋",era:"宋代至今",region:"江苏苏州",author:"溯光编辑部",cover:"🧣",sort_weight:70,
    history:"宋锦始于宋代,宋代宫廷画院画师参与设计,使其图案雅致,色彩清丽,有'活色生香'之誉。",
    influence:"宋锦是四大名锦之一,2009年入选世界非物质文化遗产,被誉为'锦绣之冠'。",
    body_extended:"宋锦主要产地:苏州,现存'苏州宋锦织造技艺'为国家级非遗。",
    faq:[{question:"宋锦与蜀锦、云锦的区别？",answer:"蜀锦:几何纹为主,庄重;云锦:妆花挖梭,富丽;宋锦:小朵花,清雅,适合书画装裱。"}],
    related_people:[],related_books:[],related_events:[],related_poems:[],related_articles:[]
  }
];

export const waterWorksArticles: Article[] = waterWorks;
export const architectureArticles: Article[] = architecture;
export const textileArticles: Article[] = textile;
