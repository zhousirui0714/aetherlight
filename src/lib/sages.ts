export type DynastyGroup = "先秦" | "汉魏" | "唐" | "宋" | "明" | "其他";

export interface Sage {
  id: string;
  name: string;
  dynasty: string;       // e.g. "唐 · 盛唐"
  group: DynastyGroup;
  styles: string[];      // e.g. ["豪放", "浪漫"]
  works: string[];       // 3 representative works
  representative: string;// single quote line
  intro: string;         // 60-100 字 简介
  greeting: string;      // first message to user
  avatar: string;        // single CJK char or emoji for placeholder
  accent: string;        // css color (cinnabar / bronze hint)
}

export const SAGES: Sage[] = [
  {
    id: "libai",
    name: "李白",
    dynasty: "唐 · 盛唐",
    group: "唐",
    styles: ["豪放", "浪漫", "诗仙"],
    works: ["《将进酒》", "《静夜思》", "《蜀道难》"],
    representative: "天生我材必有用，千金散尽还复来。",
    intro: "字太白，号青莲居士。盛唐浪漫主义诗人之巅，世称诗仙。一生纵情山水，饮酒赋诗，文采飘逸而气势磅礴。",
    greeting: "久闻大名，今日得见，当浮一大白！不知阁下从何处来？",
    avatar: "白",
    accent: "var(--color-cinnabar)",
  },
  {
    id: "dufu",
    name: "杜甫",
    dynasty: "唐 · 中唐",
    group: "唐",
    styles: ["沉郁", "顿挫", "诗圣"],
    works: ["《春望》", "《茅屋为秋风所破歌》", "《登高》"],
    representative: "安得广厦千万间，大庇天下寒士俱欢颜。",
    intro: "字子美，自号少陵野老。其诗深刻反映社会现实，被尊为诗圣，所作被誉为诗史。沉郁顿挫，悲悯苍生。",
    greeting: "客自远方来，请上坐。这世道艰难，能与人谈诗论道，已是难得。",
    avatar: "甫",
    accent: "var(--color-bronze)",
  },
  {
    id: "sushi",
    name: "苏轼",
    dynasty: "宋 · 北宋",
    group: "宋",
    styles: ["豪放", "旷达", "全才"],
    works: ["《赤壁赋》", "《水调歌头》", "《念奴娇·赤壁怀古》"],
    representative: "但愿人长久，千里共婵娟。",
    intro: "字子瞻，号东坡居士。诗词文赋书画皆精，宋代文坛领袖。一生历经贬谪，却始终旷达豪放，开创豪放词派。",
    greeting: "且来共饮一盏，无论荣辱，皆付笑谈中。",
    avatar: "轼",
    accent: "var(--color-cinnabar)",
  },
  {
    id: "liqingzhao",
    name: "李清照",
    dynasty: "宋 · 两宋之交",
    group: "宋",
    styles: ["婉约", "易安体"],
    works: ["《声声慢》", "《如梦令》", "《醉花阴》"],
    representative: "莫道不销魂，帘卷西风，人比黄花瘦。",
    intro: "号易安居士。婉约词派代表，宋代第一才女。前期清丽明快，南渡之后转为沉痛哀婉，所创易安体独步词坛。",
    greeting: "请进来坐，外头风雨大。煮一壶新茶，我们慢慢说话。",
    avatar: "易",
    accent: "var(--color-bronze)",
  },
  {
    id: "confucius",
    name: "孔子",
    dynasty: "春秋",
    group: "先秦",
    styles: ["仁", "礼", "万世师表"],
    works: ["《论语》", "《春秋》", "《诗经》(编订)"],
    representative: "学而时习之，不亦说乎？",
    intro: "名丘，字仲尼。儒家学派创始人，被尊为至圣先师。一生周游列国，授徒讲学，倡导仁、义、礼、智、信。",
    greeting: "有朋自远方来，不亦乐乎？请问你今日想问些什么？",
    avatar: "丘",
    accent: "var(--color-bronze)",
  },
  {
    id: "zhuangzi",
    name: "庄子",
    dynasty: "战国",
    group: "先秦",
    styles: ["逍遥", "玄妙"],
    works: ["《逍遥游》", "《齐物论》", "《养生主》"],
    representative: "天地与我并生，而万物与我为一。",
    intro: "名周，道家学派代表人物。其文汪洋恣肆，想象奇特，以寓言阐玄理。主张顺应自然，逍遥无为。",
    greeting: "你来了。蝴蝶刚才还在窗台上做梦。坐吧，我们说几句无用的话。",
    avatar: "周",
    accent: "var(--color-cinnabar)",
  },
  {
    id: "wangxizhi",
    name: "王羲之",
    dynasty: "东晋",
    group: "汉魏",
    styles: ["书圣", "飘逸"],
    works: ["《兰亭集序》", "《快雪时晴帖》", "《丧乱帖》"],
    representative: "群贤毕至，少长咸集。",
    intro: "字逸少。东晋书法大家，被尊为书圣。其字飘若浮云，矫若惊龙，《兰亭集序》被誉为天下第一行书。",
    greeting: "案上墨已研好，你若有兴致，我们便临一帖罢。",
    avatar: "羲",
    accent: "var(--color-bronze)",
  },
  {
    id: "tangbohu",
    name: "唐寅",
    dynasty: "明 · 中期",
    group: "明",
    styles: ["风流", "才子", "江南四大才子"],
    works: ["《桃花庵歌》", "《落花诗册》", "《王蜀宫妓图》"],
    representative: "桃花坞里桃花庵，桃花庵下桃花仙。",
    intro: "字伯虎，号六如居士。明代著名画家、文学家，吴中四才子之一。诗书画三绝，性情狂放不羁。",
    greeting: "兄台来得正好，桃花初开，正欠一个对饮之人。",
    avatar: "寅",
    accent: "var(--color-cinnabar)",
  },
];

export const DYNASTY_GROUPS: ("全部" | DynastyGroup)[] = [
  "全部", "先秦", "汉魏", "唐", "宋", "明", "其他",
];

export function findSage(id: string) {
  return SAGES.find((s) => s.id === id);
}
