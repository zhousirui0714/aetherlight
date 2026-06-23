export interface Practitioner {
  id: string;
  name: string;
  title: string;
  category: string;
  region: string;
  specialty: string;
  bio: string;
  works: string[];
  achievements?: string[];
  avatar?: string;
}

export interface HeritageCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export const heritageCategories: HeritageCategory[] = [
  { id: "opera", name: "传统戏曲", description: "京剧、昆曲、越剧、黄梅戏等戏曲艺术", icon: "🎭", count: 217 },
  { id: "music", name: "民间音乐", description: "古琴、南音、江南丝竹等传统音乐", icon: "🎵", count: 186 },
  { id: "dance", name: "民间舞蹈", description: "狮舞、龙舞、秧歌等传统舞蹈", icon: "💃", count: 152 },
  { id: "craft", name: "传统技艺", description: "陶瓷、刺绣、漆器、景泰蓝等工艺美术", icon: "🏺", count: 490 },
  { id: "medicine", name: "中医文化", description: "针灸、推拿、中药炮制等传统医药", icon: "🌿", count: 137 },
  { id: "folk", name: "民俗文化", description: "传统节日、庙会、祭祀等民俗活动", icon: "🏮", count: 182 },
];

export const featuredPractitioners: Practitioner[] = [
  {
    id: "zhang-ying",
    name: "张迎",
    title: "国家级非遗传承人",
    category: "刺绣",
    region: "江苏苏州",
    specialty: "苏绣",
    bio: "从事苏绣艺术四十余年，擅长双面绣、乱针绣等技法。作品多次获得国家及省级工艺美术精品展金奖，被多家博物馆收藏。",
    works: ["双面绣《猫》", "乱针绣《长城》", "《姑苏繁华图》"],
    achievements: ["中国工艺美术大师", "国家级非遗代表性传承人"],
  },
  {
    id: "wang-yiren",
    name: "王伊人",
    title: "省级非遗传承人",
    category: "古琴",
    region: "浙江杭州",
    specialty: "浙派古琴",
    bio: "师从著名古琴家，潜心研究古琴艺术三十余年。多次出访海外进行文化交流，致力于古琴艺术的传承与推广。",
    works: ["《流水》", "《广陵散》", "《平沙落雁》"],
    achievements: ["浙江省工艺美术大师", "西湖琴社社长"],
  },
  {
    id: "li-mingzhe",
    name: "李明哲",
    title: "国家级非遗传承人",
    category: "陶瓷",
    region: "江西景德镇",
    specialty: "青花瓷制作",
    bio: "景德镇青花瓷制作技艺的杰出代表，作品融合传统与现代审美，创造了独特的青花分水技法。",
    works: ["《青花分水山水瓶》", "《青花龙纹缸》", "《莲纹盘》"],
    achievements: ["中国陶瓷艺术大师", "国家一级美术师"],
  },
  {
    id: "sun-li",
    name: "孙丽",
    title: "国家级非遗传承人",
    category: "昆曲",
    region: "江苏苏州",
    specialty: "昆曲表演",
    bio: "著名昆曲表演艺术家，工青衣。主演《牡丹亭》《长生殿》等经典剧目，曾获中国戏剧梅花奖。",
    works: ["《牡丹亭·惊梦》", "《长生殿·密誓》", "《渔家乐》"],
    achievements: ["中国戏剧梅花奖得主", "国家一级演员"],
  },
  {
    id: "chen-jianguo",
    name: "陈建国",
    title: "省级非遗传承人",
    category: "皮影戏",
    region: "陕西西安",
    specialty: "陕西皮影",
    bio: "从事皮影戏表演和制作五十余年，精通皮影的雕刻、彩绘和操纵技法。为保护和传承皮影戏艺术做出重要贡献。",
    works: ["《西游记》", "《白蛇传》", "《三打白骨精》"],
    achievements: ["陕西省工艺美术大师"],
  },
  {
    id: "huang-xia",
    name: "黄霞",
    title: "市级非遗传承人",
    category: "剪纸",
    region: "陕西延安",
    specialty: "陕北剪纸",
    bio: "延安剪纸代表性传承人，创作了大量反映陕北民俗风情的剪纸作品。作品被多家艺术机构收藏。",
    works: ["《黄土地上的歌》", "《延安岁月》", "《窗花系列》"],
    achievements: ["陕西省民间艺术家"],
  },
];