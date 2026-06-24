import { useState, useEffect, useRef } from "react";
import { Calendar, BookOpen, User, Scroll, Award } from "lucide-react";
import { fetchDailyPush } from "@/lib/daily-push.functions";

interface TodayItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  termName?: string;
}

const categoryIcons: Record<string, typeof Calendar> = {
  "节气": Calendar,
  "诗词": BookOpen,
  "人物": User,
  "典故": Scroll,
  "非遗": Award,
};

const categoryColors: Record<string, string> = {
  "节气": "bg-emerald-500",
  "诗词": "bg-amber-500",
  "人物": "bg-blue-500",
  "典故": "bg-purple-500",
  "非遗": "bg-rose-500",
};

const solarTerms = [
  { name: "小寒", date: [1, 5], description: "天气渐寒，开始进入一年中最寒冷的时期。" },
  { name: "大寒", date: [1, 20], description: "一年中最冷的时节，天寒地冻。" },
  { name: "立春", date: [2, 4], description: "春季开始，万物复苏，天气回暖。" },
  { name: "雨水", date: [2, 19], description: "降雨增多，滋润万物生长。" },
  { name: "惊蛰", date: [3, 6], description: "春雷初响，蛰伏的动物开始苏醒。" },
  { name: "春分", date: [3, 21], description: "昼夜平分，春天过半，百花盛开。" },
  { name: "清明", date: [4, 5], description: "天清地明，适合踏青扫墓。" },
  { name: "谷雨", date: [4, 20], description: "雨水滋润谷物生长。" },
  { name: "立夏", date: [5, 6], description: "夏季开始，气温升高。" },
  { name: "小满", date: [5, 21], description: "麦类作物开始饱满，但尚未成熟。" },
  { name: "芒种", date: [6, 6], description: "麦类等有芒作物成熟，夏播作物忙着播种。" },
  { name: "夏至", date: [6, 21], description: "白天最长，炎热的夏天正式到来。" },
  { name: "小暑", date: [7, 7], description: "天气开始炎热，但尚未达到最热。" },
  { name: "大暑", date: [7, 23], description: "一年中最热的时期。" },
  { name: "立秋", date: [8, 8], description: "秋季开始，天气逐渐凉爽。" },
  { name: "处暑", date: [8, 23], description: "炎热的暑气即将结束。" },
  { name: "白露", date: [9, 8], description: "天气转凉，露水开始凝结成白色。" },
  { name: "秋分", date: [9, 23], description: "昼夜平分，秋天过半。" },
  { name: "寒露", date: [10, 8], description: "露水变凉，寒意渐浓。" },
  { name: "霜降", date: [10, 24], description: "开始出现霜冻，天气变冷。" },
  { name: "立冬", date: [11, 8], description: "冬季开始，万物收藏。" },
  { name: "小雪", date: [11, 22], description: "开始下雪，但雪量不大。" },
  { name: "大雪", date: [12, 7], description: "雪量增多，天气更加寒冷。" },
  { name: "冬至", date: [12, 22], description: "白天最短，寒冬正式到来。" },
];

function getCurrentSolarTerm(): { name: string; description: string } {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  for (let i = 0; i < solarTerms.length; i++) {
    const term = solarTerms[i];
    const [termMonth, termDay] = term.date;
    
    const nextTerm = solarTerms[(i + 1) % solarTerms.length];
    const [nextMonth, nextDay] = nextTerm.date;

    if (month === termMonth) {
      if (day >= termDay) {
        if (month === nextMonth) {
          if (day < nextDay) return term;
        } else {
          return term;
        }
      }
    } else if (month > termMonth && month < nextMonth) {
      return term;
    } else if (month === 12 && termMonth === 12 && nextMonth === 1) {
      if (day >= termDay) return term;
    } else if (month === 1 && termMonth === 12 && nextMonth === 1) {
      if (day < nextDay) return solarTerms[solarTerms.length - 1];
    }
  }

  return solarTerms[0];
}

function getPoetryExcerpt(content: string): string {
  // 从内容中提取与诗词相关的信息
  const poetryKeywords = ['诗', '词', '韵', '吟', '咏', '赋', '律', '绝', '古体', '近体', '风雅', '骚人'];
  const poetryPatterns = [
    new RegExp(`(['"\`][^'\`"]{10,80}['"\`])`, 'g'),  // 引号内的内容
    /([^\s]{10,80}[，。；！？])/g,  // 句子片段
  ];
  
  for (const keyword of poetryKeywords) {
    if (content.includes(keyword)) {
      for (const pattern of poetryPatterns) {
        const match = content.match(pattern);
        if (match) {
          return match[0].substring(0, 100) + (match[0].length > 100 ? "..." : "");
        }
      }
    }
  }
  
  // 如果没有找到诗词相关内容，生成一个示例
  return "采菊东篱下，悠然见南山。山气日夕佳，飞鸟相与还。";
}

function getFigureExcerpt(content: string): string {
  // 从内容中提取与人物相关的信息
  const figureKeywords = ['人', '士', '贤', '杰', '圣', '师', '家', '先贤', '名士', '大家', '学者', '文人', '诗人'];
  const figurePatterns = [
    new RegExp(`([^，。；！？]*?[^，。；！？]*?(?:${figureKeywords.join('|')})[^，。；！？]*?[，。；！？])`, 'g'),
    /([^，。；！？]*?[^，。；！？]*?(?:生于|著有|擅长|开创)[^，。；！？]*?[，。；！？])/g,
  ];
  
  for (const keyword of figureKeywords) {
    if (content.includes(keyword)) {
      for (const pattern of figurePatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          return matches[0].substring(0, 100) + (matches[0].length > 100 ? "..." : "");
        }
      }
    }
  }
  
  // 如果没有找到人物相关内容，生成一个示例
  return "李白（701年-762年），字太白，号青莲居士，唐代伟大的浪漫主义诗人，被誉为诗仙。";
}

function getHeritageExcerpt(content: string): string {
  // 从内容中提取与非遗相关的信息
  const heritageKeywords = ['遗', '传', '艺', '技', '工', '俗', '风', '习', '匠', '手', '古法', '传统', '技艺', '工艺', '民俗'];
  const heritagePatterns = [
    new RegExp(`([^，。；！？]*?[^，。；！？]*?(?:${heritageKeywords.join('|')})[^，。；！？]*?[，。；！？])`, 'g'),
    /([^，。；！？]*?[^，。；！？]*?(?:流传|传承|古老|传统)[^，。；！？]*?[，。；！？])/g,
  ];
  
  for (const keyword of heritageKeywords) {
    if (content.includes(keyword)) {
      for (const pattern of heritagePatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          return matches[0].substring(0, 100) + (matches[0].length > 100 ? "..." : "");
        }
      }
    }
  }
  
  // 如果没有找到非遗相关内容，生成一个示例
  return "昆曲，中国现存最古老的戏曲形式之一，被誉为百戏之祖，2001年被联合国教科文组织列为人类口述和非物质遗产代表作。";
}

// 主题化推荐函数
function getRelatedPoetryTitle(solarTerm: string, content: string): string {
  // 根据节气和内容推荐相关诗词标题
  const poetryMap: Record<string, string[]> = {
    "夏至": [
      "《夏至避暑北池》",
      "《夏至日作》", 
      "《夏至後初暑登连天观》",
      "《和梦得夏至忆苏州呈卢宾客》"
    ],
    "冬至": [
      "《冬至夜思家》",
      "《邯郸冬至夜思家》",
      "《冬至日遇京使发寄舍弟》",
      "《冬至感怀》"
    ],
    "清明": [
      "《清明》",
      "《清明日园林杂兴》",
      "《清明即事》",
      "《清明日》"
    ],
    "立春": [
      "《立春》",
      "《立春日晨起》",
      "《立春偶成》",
      "《立春日感怀》"
    ],
    "立夏": [
      "《立夏日作》",
      "《立夏》",
      "《立夏前二日作》",
      "《立夏日雨》"
    ],
    "立秋": [
      "《立秋》",
      "《立秋日》",
      "《立秋日曲江忆元九》",
      "《立秋日祷雨宿灵隐寺同周徐二令》"
    ],
    "立冬": [
      "《立冬》",
      "《立冬日作》",
      "《立冬夜舟中作》",
      "《立冬后作》"
    ],
    "惊蛰": [
      "《惊蛰日雷》",
      "《惊蛰后》",
      "《惊蛰》",
      "《甲戌正月十四日书所见》"
    ],
    "春分": [
      "《春分日》",
      "《春分投简阳明洞天》",
      "《春分》",
      "《春分日白云楼》"
    ],
    "秋分": [
      "《秋分后顿凄冷有感》",
      "《秋分日同友人山亭》",
      "《秋分》",
      "《秋分夜》"
    ],
    "芒种": [
      "《时雨》",
      "《芒种后积雨骤冷三绝》",
      "《梅雨五绝》",
      "《芒种》"
    ],
    "小暑": [
      "《夏日对雨》",
      "《小暑六月节》",
      "《夏日南亭怀辛大》",
      "《小暑日寄》"
    ],
    "大暑": [
      "《大暑》",
      "《夏日三首》",
      "《大热》",
      "《大暑松下》"
    ],
    "处暑": [
      "《处暑》",
      "《早秋曲江感怀》",
      "《处暑后风雨》",
      "《处暑》"
    ],
    "白露": [
      "《白露》",
      "《衰荷》",
      "《白露日归途即目》",
      "《白露》"
    ],
    "寒露": [
      "《池上》",
      "《寒露》",
      "《寒露惊秋晚》",
      "《寒露日》"
    ],
    "霜降": [
      "《秋晚新晴》",
      "《霜降》",
      "《岁晚》",
      "《秋日》"
    ],
    "小寒": [
      "《微雨》",
      "《小寒食》",
      "《小寒》",
      "《窗前木芙蓉》"
    ],
    "大寒": [
      "《苦寒吟》",
      "《大寒出江陵西门》",
      "《大寒》",
      "《冬行》"
    ],
    "雨水": [
      "《春晓》",
      "《早春呈水部张十八员外》",
      "《春夜喜雨》",
      "《雨水》"
    ],
    "谷雨": [
      "《谷雨》",
      "《牡丹图》",
      "《三月晦日偶题》",
      "《谷雨后一》"
    ]
  };
  
  const poems = poetryMap[solarTerm] || ["《夏日即景》", "《节气吟》", "《时令感怀》", "《气候抒怀》"];
  const randomIndex = Math.floor(Math.random() * poems.length);
  return poems[randomIndex];
}

function getRelatedPoetryContent(solarTerm: string, content: string): string {
  // 根据节气推荐相关诗词内容
  const poetryContentMap: Record<string, string> = {
    "夏至": "夏至避暑北池 唐·韦应物 忆在南宫秩，分司许近郊。因声荷君幸，此夕任逍遥。 暝色赴春愁，回风吹细雨。", 
    "冬至": "邯郸冬至夜思家 唐·白居易 邯郸驿里逢冬至，抱膝灯前影伴身。想得家中夜深坐，还应说着远行人。",
    "清明": "清明 唐·杜牧 清明时节雨纷纷，路上行人欲断魂。借问酒家何处有？牧童遥指杏花村。",
    "立春": "立春 唐·杜甫 春日春盘细生菜，忽忆两京梅发时。温汤皎洁如华清，杨柳宫眉新画作。",
    "立夏": "立夏日忆京师 唐·韦应物 改序念芳辰，烦襟倦日永。夏木已成阴，公门昼恒静。",
    "立秋": "立秋 唐·刘言史 兹晨戒流火，商飙早已惊。云天收夏色，木叶动秋声。",
    "立冬": "立冬 唐·李白 冻笔新诗懒写，寒炉美酒时温。醉看墨花月白，恍疑雪满前村。",
    "惊蛰": "观田家 唐·韦应物 微雨众卉新，一雷惊蛰始。田家几日闲，耕种从此起。",
    "春分": "春分日 唐·徐铉 仲春初四日，春色正中分。绿野徘徊月，晴天断续云。",
    "秋分": "秋分後顿凄冷有感 宋·陆游 今年秋气早，木落不待黄。蟋蟀当在宇，遽已近我床。",
    "芒种": "时雨 宋·陆游 时雨及芒种，四野皆插秧。家家麦饭美，处处菱歌长。",
    "小暑": "小暑六月节 唐·元稹 倏忽温风至，因循小暑来。竹喧先觉雨，山暗已闻雷。",
    "大暑": "大暑 唐·司空曙 大暑运金气，荆扬不知秋。林下有塌翼，水中无行舟。",
    "处暑": "处暑 宋·吕本中 离离原上草，一岁一枯荣。野火烧不尽，春风吹又生。",
    "白露": "白露 唐·杜甫 白露团甘子，清晨散马蹄。圃开连石树，船渡入江溪。",
    "寒露": "池上 唐·白居易 袅袅凉风动，凄凄寒露零。兰衰花始白，荷破叶犹青。",
    "霜降": "秋晚新晴 宋·陆游 霜降水返壑，风落木归山。冉冉岁华晚，昆虫皆闭关。",
    "小寒": "小寒 宋·黄庭坚 雁声不到东篱畔，满城但、风雨凄凉。", 
    "大寒": "苦寒吟 唐·孟郊 天地寂寥山雨歇，几生修得到梅花。",
    "雨水": "春晓 唐·孟浩然 春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。",
    "谷雨": "谷雨 宋·朱槔 天点纷林际，虚檐写梦中。明朝知谷雨，无策禁花风。"
  };
  
  return poetryContentMap[solarTerm] || content.substring(0, 100) + (content.length > 100 ? "..." : "");
}

function getRelatedFigureName(solarTerm: string, content: string): string {
  // 根据节气推荐相关历史人物
  const figureMap: Record<string, string[]> = {
    "夏至": ["韦应物", "白居易", "李白", "杜甫", "苏轼"],
    "冬至": ["白居易", "杜甫", "李白", "王维", "苏轼"],
    "清明": ["杜牧", "王维", "李白", "杜甫", "白居易"],
    "立春": ["杜甫", "李白", "王维", "白居易", "苏轼"],
    "立夏": ["韦应物", "李白", "杜甫", "白居易", "苏轼"],
    "立秋": ["刘言史", "李白", "杜甫", "王维", "白居易"],
    "立冬": ["李白", "杜甫", "白居易", "王维", "苏轼"],
    "惊蛰": ["韦应物", "杜甫", "李白", "白居易", "苏轼"],
    "春分": ["徐铉", "王维", "李白", "杜甫", "白居易"],
    "秋分": ["陆游", "杜甫", "李白", "王维", "白居易"],
    "芒种": ["陆游", "苏轼", "李白", "杜甫", "白居易"],
    "小暑": ["元稹", "杜甫", "李白", "白居易", "苏轼"],
    "大暑": ["司空曙", "杜甫", "李白", "王维", "白居易"],
    "处暑": ["吕本中", "陆游", "苏轼", "杜甫", "李白"],
    "白露": ["杜甫", "李白", "王维", "白居易", "苏轼"],
    "寒露": ["白居易", "杜甫", "李白", "王维", "苏轼"],
    "霜降": ["陆游", "苏轼", "杜甫", "李白", "王维"],
    "小寒": ["黄庭坚", "苏轼", "李白", "杜甫", "王维"],
    "大寒": ["孟郊", "杜甫", "李白", "王维", "白居易"],
    "雨水": ["孟浩然", "杜甫", "李白", "王维", "白居易"],
    "谷雨": ["朱槔", "苏轼", "李白", "杜甫", "白居易"]
  };
  
  const figures = figureMap[solarTerm] || ["李白", "杜甫", "白居易", "王维", "苏轼"];
  const randomIndex = Math.floor(Math.random() * figures.length);
  return figures[randomIndex];
}

function getRelatedFigureBio(solarTerm: string, content: string): string {
  // 根据节气推荐相关人物介绍
  const bioMap: Record<string, string> = {
    "夏至": "韦应物（737～792），长安(今陕西西安)人。唐代诗人，以写景和田园诗著称，与王维、孟浩然、柳宗元并称为“王孟韦柳”。",
    "冬至": "白居易（772年－846年），字乐天，号香山居士，又号醉吟先生，祖籍太原，到其曾祖父时迁居下邽，生于河南新郑。是唐代伟大的现实主义诗人。",
    "清明": "杜牧（803年－约852年），字牧之，号樊川居士，京兆万年人，唐代杰出的诗人、散文家。",
    "立春": "杜甫（712年—770年），字子美，自号少陵野老，唐代伟大的现实主义诗人，与李白合称“李杜”。",
    "立夏": "韦应物（737～792），长安(今陕西西安)人。唐代诗人，以写景和田园诗著称，与王维、孟浩然、柳宗元并称为“王孟韦柳”。",
    "立秋": "刘言史（约公元740年前后在世），赵州邯郸人。唐代诗人，与李贺同时期，以乐府诗著称。",
    "立冬": "李白（701年-762年），字太白，号青莲居士，又号“谪仙人”，唐代伟大的浪漫主义诗人，被后人誉为“诗仙”。",
    "惊蛰": "韦应物（737～792），长安(今陕西西安)人。唐代诗人，以写景和田园诗著称，与王维、孟浩然、柳宗元并称为“王孟韦柳”。",
    "春分": "徐铉（916年-991年），五代宋初文学家、书法家。徐铉工于诗，与韩熙载齐名，江东谓之“韩徐”。",
    "秋分": "陆游（1125年11月13日－1210年1月26日），字务观，号放翁，越州山阴（今浙江绍兴）人，南宋文学家、史学家、爱国诗人。",
    "芒种": "陆游（1125年11月13日－1210年1月26日），字务观，号放翁，越州山阴（今浙江绍兴）人，南宋文学家、史学家、爱国诗人。",
    "小暑": "元稹（779年—831年），字微之，别字威明，河南洛阳人。唐朝大臣、文学家、诗人。",
    "大暑": "司空曙（约720-约790），字文明，或作文初，广平（今河北永年县）人，大历十才子之一。",
    "处暑": "吕本中（1084-1145），原名大中，字居仁，世称东莱先生，寿州人，诗人，词人，道学家。",
    "白露": "杜甫（712年—770年），字子美，自号少陵野老，唐代伟大的现实主义诗人，与李白合称“李杜”。",
    "寒露": "白居易（772年－846年），字乐天，号香山居士，又号醉吟先生，祖籍太原，到其曾祖父时迁居下邽，生于河南新郑。是唐代伟大的现实主义诗人。",
    "霜降": "陆游（1125年11月13日－1210年1月26日），字务观，号放翁，越州山阴（今浙江绍兴）人，南宋文学家、史学家、爱国诗人。",
    "小寒": "黄庭坚（1045年8月9日-1105年5月24日），字鲁直，号山谷道人，晚号涪翁，洪州分宁（今江西省九江市修水县）人，北宋著名文学家、书法家。",
    "大寒": "孟郊（751年-814年），字东野，湖州武康（今浙江省湖州市德清县）人，唐代著名诗人。",
    "雨水": "孟浩然（689年—740年），名浩，字浩然，号孟山人，襄州襄阳（今湖北襄阳）人，唐代著名的山水田园派诗人。",
    "谷雨": "朱槔（约1130年前后在世），字逢年，号玉澜居士，徽州婺源人，南宋诗人。"
  };
  
  return bioMap[solarTerm] || "李白，唐代伟大的浪漫主义诗人，被誉为诗仙。";
}

function getRelatedHeritageTitle(solarTerm: string, content: string): string {
  // 根据节气推荐相关非遗项目
  const heritageMap: Record<string, string[]> = {
    "夏至": [
      "夏至祭祀习俗",
      "龙舟竞渡",
      "端午节",
      "二十四节气",
      "传统医药"
    ],
    "冬至": [
      "冬至祭祖",
      "九九消寒图",
      "腊八节",
      "二十四节气",
      "传统礼仪"
    ],
    "清明": [
      "清明节",
      "踏青习俗",
      "扫墓祭祖",
      "二十四节气",
      "传统礼仪"
    ],
    "立春": [
      "立春迎春",
      "鞭春牛",
      "春节",
      "二十四节气",
      "传统礼仪"
    ],
    "立夏": [
      "立夏秤人",
      "立夏尝新",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "立秋": [
      "立秋贴秋膘",
      "晒秋",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "立冬": [
      "立冬补冬",
      "冬酿",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "惊蛰": [
      "惊蛰祭白虎",
      "驱虫习俗",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "春分": [
      "春分竖鸡蛋",
      "春祭",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "秋分": [
      "秋分祭月",
      "送秋牛",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "芒种": [
      "芒种煮梅",
      "安苗",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "小暑": [
      "小暑食新",
      "晒伏",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "大暑": [
      "大暑伏羊",
      "烧伏香",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "处暑": [
      "处暑放河灯",
      "处暑吃鸭",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "白露": [
      "白露节",
      "收清露",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "寒露": [
      "寒露赏菊",
      "登高",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "霜降": [
      "霜降吃柿子",
      "赏红叶",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "小寒": [
      "小寒数九",
      "腊八节",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "大寒": [
      "大寒迎年",
      "腊月习俗",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "雨水": [
      "雨水祈福",
      "回娘家",
      "二十四节气",
      "传统习俗",
      "民间信仰"
    ],
    "谷雨": [
      "谷雨祭仓颉",
      "采茶",
      "二十四节气",
      "传统习俗",
      "传统技艺"
    ]
  };
  
  const heritages = heritageMap[solarTerm] || ["二十四节气", "传统礼仪", "民间信仰", "传统技艺", "民俗活动"];
  const randomIndex = Math.floor(Math.random() * heritages.length);
  return heritages[randomIndex];
}

function getRelatedHeritageContent(solarTerm: string, content: string): string {
  // 根据节气推荐相关非遗内容
  const heritageContentMap: Record<string, string> = {
    "夏至": "夏至祭祀习俗，中国古代重要的岁时节日之一。古人认为夏至是阴阳交替的关键时刻，举行各种祭祀活动以祈求丰收和平安。",
    "冬至": "冬至祭祖是中国传统民俗活动，源于汉代，盛于唐宋，相沿至今。冬至是时年八节之一，被视为冬季的大节日。",
    "清明": "清明节又称踏青节、三月节、祭祖节等，是中华民族传统的春祭节日，与七月半、十月朔、十二月朔合称四大祭祖节。",
    "立春": "立春迎春是中国古代重要节令之一，人们通过各种仪式迎接春天的到来，体现了农耕文明对自然节律的敬畏和顺应。",
    "立夏": "立夏秤人习俗流传于江南一带，人们在立夏日用大秤称人轻重，以检验一年来身体的变化，寄托着对健康平安的期盼。",
    "立秋": "晒秋是立秋时节的传统农俗现象，具有极强的地域特色。村民们利用房前屋后及自家窗台屋顶架晒、挂晒农作物。",
    "立冬": "立冬补冬是传统习俗，民间有“三九补一冬，来年无病痛”的说法，人们会在立冬时节食用滋补食品以抵御严寒。",
    "惊蛰": "惊蛰祭白虎是广东等地的传统习俗，人们相信惊蛰后各种害虫、猛兽活跃，祭拜白虎可以驱邪避害，保佑平安。",
    "春分": "春分竖鸡蛋是中国民间流行的一种游戏，传说春分这天最容易把鸡蛋竖起来，寓意着阴阳平衡，和谐圆满。",
    "秋分": "秋分祭月是古代帝王的礼制，后来逐渐流传到民间，形成了中秋节赏月、祭月的习俗，寄托着人们对团圆美满的向往。",
    "芒种": "芒种煮梅是我国南方地区的传统习俗，正值梅子成熟的季节，人们会在此时制作梅子酒、梅子汤等。",
    "小暑": "小暑食新是民间传统习俗，农民将新割的稻谷碾成米后，做好饭供祀五谷大神和祖先，然后人人吃新米。",
    "大暑": "大暑伏羊是指在大暑节气期间喝羊肉汤、吃伏羊的习惯，这种习俗在江苏、山东等地颇为盛行。",
    "处暑": "处暑放河灯是民间传统习俗，人们在处暑时节将河灯放入江河湖海之中，任其漂流，以此表达对逝者的思念。",
    "白露": "白露节是民间传统节日，人们在此时会收清露，认为用露水泡茶或制药可以清热解毒，延年益寿。",
    "寒露": "寒露赏菊是传统习俗，菊花为寒露时节的代表性花卉，人们在寒露时节赏菊、饮菊花酒，以求长寿。",
    "霜降": "霜降吃柿子是民间习俗，人们认为霜降时节的柿子味道甘甜，营养价值高，可以御寒保暖，防感冒。",
    "小寒": "小寒数九是从冬至开始算起的，每九天为一个“九”，共九九八十一天，是民间流传已久的节气歌谣。",
    "大寒": "大寒迎年是传统习俗，大寒是二十四节气中的最后一个节气，意味着年的临近，人们开始准备迎接新年。",
    "雨水": "雨水祈福是民间传统习俗，人们在雨水节气祈求风调雨顺、五谷丰登，体现了农耕文化对自然的依赖和敬畏。",
    "谷雨": "谷雨祭仓颉是陕西省白水县的传统民俗，谷雨节气纪念文字始祖仓颉造字的功绩，体现了中华文化的深厚底蕴。"
  };
  
  return heritageContentMap[solarTerm] || "二十四节气是中国古代订立的一种用来指导农事的补充历法...";
}

function getRelatedStoryTitle(solarTerm: string, content: string): string {
  // 根据节气推荐相关典故
  const storyMap: Record<string, string[]> = {
    "夏至": [
      "夏至一阴生",
      "夏至测日影",
      "冬至阳生",
      "阴阳转换",
      "太极循环"
    ],
    "冬至": [
      "冬至一阳生",
      "阴极阳生",
      "冬至大如年",
      "履长之庆",
      "亚岁迎祥"
    ],
    "清明": [
      "清明时节雨",
      "踏青游春",
      "寒食禁火",
      "介子推",
      "清明插柳"
    ],
    "立春": [
      "立春迎春",
      "春牛劝耕",
      "鞭春牛",
      "迎春仪式",
      "春回大地"
    ],
    "立夏": [
      "立夏秤人",
      "立夏尝新",
      "夏日开端",
      "春去夏来",
      "立夏迎夏"
    ],
    "立秋": [
      "立秋贴秋膘",
      "秋高气爽",
      "立秋晒秋",
      "秋收冬藏",
      "秋来暑往"
    ],
    "立冬": [
      "立冬补冬",
      "冬藏养生",
      "立冬三候",
      "冬日来临",
      "冬令进补"
    ],
    "惊蛰": [
      "惊蛰始雷",
      "蛰虫惊出",
      "春雷惊蛰",
      "万物复苏",
      "雷动虫鸣"
    ],
    "春分": [
      "春分昼夜平",
      "春分竖鸡蛋",
      "春分祭日",
      "日夜等长",
      "春分点"
    ],
    "秋分": [
      "秋分昼夜平",
      "秋分祭月",
      "秋分送秋牛",
      "日夜等长",
      "秋分点"
    ],
    "芒种": [
      "芒种忙种",
      "芒种煮梅",
      "芒种安苗",
      "时雨及芒种",
      "四野皆插秧"
    ],
    "小暑": [
      "小暑温风至",
      "小暑苦热",
      "小暑食新",
      "小暑纳凉",
      "小暑养生"
    ],
    "大暑": [
      "大暑湿热蒸",
      "大暑伏羊",
      "大暑酷热",
      "大暑养生",
      "大暑避暑"
    ],
    "处暑": [
      "处暑乃止",
      "处暑放河灯",
      "处暑吃鸭",
      "处暑凉意",
      "暑气渐消"
    ],
    "白露": [
      "白露为霜",
      "白露收清露",
      "白露节",
      "白露秋风",
      "露水凝结"
    ],
    "寒露": [
      "寒露凝",
      "寒露降",
      "寒露清",
      "寒露重",
      "露水更寒"
    ],
    "霜降": [
      "霜降杀百草",
      "霜降吃柿子",
      "霜降赏红叶",
      "霜降至",
      "秋尽冬临"
    ],
    "小寒": [
      "小寒料峭",
      "小寒数九",
      "小寒三候",
      "小寒时节",
      "小寒大寒"
    ],
    "大寒": [
      "大寒迎年",
      "大寒冰坚",
      "大寒三候",
      "岁末年终",
      "寒极必暖"
    ],
    "雨水": [
      "雨水润物",
      "雨水贵如油",
      "雨水洗尘",
      "雨水丰年",
      "雨水时节"
    ],
    "谷雨": [
      "谷雨生百物",
      "雨生百谷",
      "谷雨祭仓颉",
      "谷雨采茶",
      "雨后初晴"
    ]
  };
  
  const stories = storyMap[solarTerm] || ["二十四节气", "阴阳五行", "天人合一", "自然规律", "节气物候"];
  const randomIndex = Math.floor(Math.random() * stories.length);
  return stories[randomIndex];
}

function getRelatedStoryContent(solarTerm: string, content: string): string {
  // 根据节气推荐相关典故内容
  const storyContentMap: Record<string, string> = {
    "夏至": "夏至一阴生，是指夏至这一天虽然阳气达到极致，但从此以后阴气开始增长，体现了《易经》中物极必反的道理。夏至过后，太阳直射点南移，北半球的白天开始逐渐变短，夜晚变长。",
    "冬至": "冬至一阳生，是指冬至这一天阴气达到极致，从此以后阳气开始增长。冬至是阴阳转换的关键节点，标志着阳气开始回升，春天即将到来，所以有“冬至大如年”的说法。",
    "清明": "清明时节雨纷纷，不仅是指气候现象，也蕴含着深厚的文化内涵。清明是二十四节气中唯一演变为节日的节气，融合了寒食节和上巳节的习俗，成为祭祖扫墓、踏青春游的重要时节。",
    "立春": "立春是二十四节气之首，标志着春天的开始。古人认为立春是阳气初生的标志，万物复苏，生机盎然。立春日要举行隆重的迎春仪式，以祈求一年的好收成。",
    "立夏": "立夏是夏季的第一个节气，表示告别春天，夏天开始。《月令七十二候集解》中说：“立，建始也，夏，假也，物至此时皆假大也。”这里的“假”是“大”的意思，是指春天播种的植物已经直立长大了。",
    "立秋": "立秋并不等于入秋，气象学上的入秋需要连续5天滑动平均气温稳定在22℃以下。立秋时节，我国大部分地区仍未脱离夏季，但早晚温差开始增大，秋老虎还会肆虐一时。",
    "立冬": "立冬是冬季的第一个节气，表示冬季的开始。《月令七十二候集解》中说：“立，建始也；冬，终也，万物收藏也。”意思是秋季作物全部收晒完毕，收藏入库，动物也已准备冬眠。",
    "惊蛰": "惊蛰是指春雷惊醒了蛰伏的动物，实际上昆虫是听不到雷声的，大地回春，天气变暖才是使它们结束冬眠的原因。惊蛰时节，正是大好的“桃花浪”，春虫出动，生机勃勃。",
    "春分": "春分这一天，太阳直射赤道，全球昼夜等长。春分过后，太阳直射点继续北移，北半球白昼变长，黑夜变短。春分在古代是重要的节日，有祭日的习俗。",
    "秋分": "秋分这一天，太阳直射赤道，全球昼夜等长。秋分过后，太阳直射点继续南移，北半球白昼变短，黑夜变长。秋分曾是传统的“祭月节”，现在的中秋节就是由秋分的祭月节演化而来。",
    "芒种": "芒种是农忙的时节，“芒”是指某些有芒的谷物，如稻、黍、稷等；“种”是指播种的意思。芒种时节，正是南方种稻、北方收麦的忙碌时期，所以也被称为“忙种”。",
    "小暑": "小暑是全年 hottest 的节气之一，标志着即将进入一年中最热的时期。《月令七十二候集解》：“六月节……暑，热也，就热之中分为大小，月初为小，月中为大，今则热气犹小也。”",
    "大暑": "大暑是全年最热的节气，正值“中伏”前后，全国普遍高温，长江流域的许多地方，经常出现40℃以上的高温天气。《月令七十二候集解》：“六月中，……暑，热也，就热之中分为大小，月初为小，月中为大，今则热气犹大也。”",
    "处暑": "处暑的“处”是终止、躲藏的意思。处暑表示炎热的暑天结束，这时三伏已过或近尾声，白天热，早晚凉，昼夜温差较大，不时有秋雨降临。",
    "白露": "白露是典型的秋天节气，从白露节气开始，按农历来说，已是真正的秋天了。白露时节，由于天气逐渐转凉，昼夜温差加大，清晨的露水会凝结成白色的水滴附着在草木之上。",
    "寒露": "寒露是气温转凉的象征，标志着天气由凉爽向寒冷过渡，露水更冷，快要凝结成霜了。《月令七十二候集解》说：“九月节，露气寒冷，将凝结也。”",
    "霜降": "霜降是秋季的最后一个节气，也是秋季向冬季的过渡节气。霜降节气含有天气渐冷、初霜出现的意思，也意味着冬天的脚步越来越近了。",
    "小寒": "小寒标志着开始进入一年中最寒冷的日子。《月令七十二候集解》：“十二月节，月初寒尚小，故云。月半则大矣。”就是在气象记录中，小寒是气温最低的节气，只有少数年份的大寒气温低于小寒的。",
    "大寒": "大寒是二十四节气中最后一个节气，也是最冷的节气。大寒时节，寒潮南下频繁，是中国大部分地区一年中的最冷时期，风大，低温，地面积雪不化，呈现出冰天雪地、天寒地冻的严寒景象。",
    "雨水": "雨水节气标示着降雨开始，雨量渐增。《月令七十二候集解》：“正月中，天一生水。春始属木，然生木者必水也，故立春后继之雨水。且东风既解冻，则散而为雨矣。”",
    "谷雨": "谷雨是春季最后一个节气，取自“雨生百谷”之意。此时降水明显增加，田中的秧苗初插、作物新种，最需要雨水的滋润，降雨有利于越冬作物、春播作物的生长。"
  };
  
  return storyContentMap[solarTerm] || "二十四节气体现了中国古代人民对自然规律的深刻认识...";
}

export function TodayCards() {
  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTodayItems();
  }, []);

  // 根据卡片内容构建图片搜索关键词
  const getSearchQuery = (item: TodayItem): string => {
    // 移除书名号等特殊字符
    const cleanTitle = item.title.replace(/[《》「」]/g, "");
    
    switch (item.category) {
      case "节气":
        return `${cleanTitle} 节气 中国传统文化`;
      case "诗词":
        return `${cleanTitle} 古诗 书法`;
      case "人物":
        return `${cleanTitle} 古代人物 画像`;
      case "非遗":
        return `${cleanTitle} 传统文化 非遗`;
      case "典故":
        return `${cleanTitle} 中国典故 传统`;
      default:
        return `${cleanTitle} 中国传统文化`;
    }
  };

  // 为卡片获取真实图片
  const fetchImageForItem = async (item: TodayItem) => {
    if (imageUrls[item.id] || failedImages.has(item.id)) return;
    
    try {
      const query = getSearchQuery(item);
      const response = await fetch(`/api/search-image?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.url) {
        setImageUrls(prev => ({ ...prev, [item.id]: data.url }));
      }
    } catch (error) {
      console.error(`获取图片失败 ${item.title}:`, error);
    }
  };

  // 为所有卡片获取图片
  const fetchAllImages = (items: TodayItem[]) => {
    items.forEach(item => fetchImageForItem(item));
  };

  const loadTodayItems = async () => {
    try {
      // 获取今天的日期
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 格式
      
      // 从每日推送中获取今天的个性化内容
      const dailyPushData = await fetchDailyPush({ data: { date: dateStr } });
      
      // 获取当前节气
      const solarTerm = getCurrentSolarTerm();
      
      // 生成主题化推荐内容
      const themeBasedItems: TodayItem[] = [
        {
          id: "solar-term",
          title: "今日节气",
          excerpt: `今日是${solarTerm.name}，${solarTerm.description}`,
          category: "节气",
          termName: solarTerm.name,
        },
        {
          id: "poetry",
          title: getRelatedPoetryTitle(solarTerm.name, dailyPushData.body),
          excerpt: getRelatedPoetryContent(solarTerm.name, dailyPushData.body),
          category: "诗词",
        },
        {
          id: "figure",
          title: getRelatedFigureName(solarTerm.name, dailyPushData.body),
          excerpt: getRelatedFigureBio(solarTerm.name, dailyPushData.body),
          category: "人物",
        },
        {
          id: "heritage",
          title: getRelatedHeritageTitle(solarTerm.name, dailyPushData.body),
          excerpt: getRelatedHeritageContent(solarTerm.name, dailyPushData.body),
          category: "非遗",
        },
        {
          id: "story",
          title: getRelatedStoryTitle(solarTerm.name, dailyPushData.body),
          excerpt: getRelatedStoryContent(solarTerm.name, dailyPushData.body),
          category: "典故",
        },
      ];

      setTodayItems(themeBasedItems);
      // 为所有卡片获取真实图片
      fetchAllImages(themeBasedItems);
    } catch (error) {
      console.error("加载今日推送内容失败:", error);
      
      // 如果加载失败，则使用默认内容
      const currentTerm = getCurrentSolarTerm();
      const fallbackItems: TodayItem[] = [
        {
          id: "solar-term",
          title: "今日节气",
          excerpt: `今日是${currentTerm.name}，${currentTerm.description}`,
          category: "节气",
          termName: currentTerm.name,
        },
        {
          id: "poetry",
          title: "今日诗词",
          excerpt: "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
          category: "诗词",
        },
        {
          id: "figure",
          title: "今日人物",
          excerpt: "李白，唐代伟大的浪漫主义诗人，被誉为诗仙。",
          category: "人物",
        },
        {
          id: "heritage",
          title: "今日非遗",
          excerpt: "昆曲，中国传统戏曲中最古老的剧种之一。",
          category: "非遗",
        },
        {
          id: "story",
          title: "今日典故",
          excerpt: "卧薪尝胆：形容人刻苦自励，立志报仇雪耻。",
          category: "典故",
        },
      ];

      setTodayItems(fallbackItems);
      // 为所有卡片获取真实图片
      fetchAllImages(fallbackItems);
    }
  };

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => new Set([...prev, id]));
    setLoadedImages(prev => new Set([...prev, id]));
  };

  return (
    <section className="mt-12">
      <div className="mb-8 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">TODAY'S HIGHLIGHTS</div>
        <h2 className="mt-2 font-serif text-3xl text-foreground">今 日 撷 英</h2>
        <p className="mt-2 text-sm text-muted-foreground">每日精选 · 文化瑰宝</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {todayItems.map((item) => {
          const Icon = categoryIcons[item.category] || BookOpen;
          const bgColor = categoryColors[item.category] || "bg-gray-500";
          
          // 使用从 API 获取的真实图片
          const imageUrl = imageUrls[item.id];
            
          const isLoaded = loadedImages.has(item.id);
          const isFailed = failedImages.has(item.id);
          
          return (
            <a
              key={item.id}
              href={item.id === "daily-push" ? `/daily` : `/gallery?category=${encodeURIComponent(item.category)}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="relative h-28 overflow-hidden">
                {isFailed || !imageUrl ? (
                  <div className="h-full w-full bg-gradient-to-br from-secondary via-background to-secondary">
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        background: `radial-gradient(circle at 30% 40%, var(--color-bronze) 0%, transparent 45%), radial-gradient(circle at 75% 70%, var(--color-cinnabar) 0%, transparent 40%)`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor}/20`}>
                        <Icon className={`h-6 w-6 ${bgColor.replace("bg-", "text-")}`} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className={`h-full w-full object-cover transition-all duration-500 ${
                        isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
                      } group-hover:scale-110`}
                      onLoad={() => handleImageLoad(item.id)}
                      onError={() => handleImageError(item.id)}
                      loading="lazy"
                    />
                    {!isLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor}/20`}>
                          <Icon className={`h-6 w-6 ${bgColor.replace("bg-", "text-")} animate-pulse`} />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/90 to-transparent" />
              </div>
              <div className="p-4">
                <h3 className="font-serif text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {item.excerpt}
                </p>
                <span className={`mt-3 inline-block rounded-full ${bgColor}/10 px-2.5 py-1 text-[10px] font-serif tracking-widest text-foreground/70`}>
                  {item.category}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
