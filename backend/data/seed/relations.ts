import type { CategoryId } from "./types";

/**
 * 知识图谱关联类型
 * 存于 knowledge_relations 表
 *
 * ⚠️ 重要原则: from_id / to_id 必须能在 backend/data/seed/*.ts 里找到对应 article
 *    merge.ts 会自动过滤引用不存在 ID 的关系（不会报错,直接跳过）
 */
export type RelationType =
  | "person_of"      // 人物归属 (陆羽 → 陆羽著《茶经》)
  | "book_of"        // 典籍归属 (茶经 → 陆羽)
  | "place_of"       // 地点关联 (西湖 → 西湖龙井)
  | "concept_of"     // 概念归属 (绿茶 → 西湖龙井)
  | "event_of"       // 事件关联
  | "poem_of"        // 诗词归属 (将进酒 → 李白)
  | "mentioned_in"   // 被引用于
  | "related"        // 一般关联
  | "teacher_of"     // 师承
  | "work_of";       // 作品归属 (《西游记》→ 孙悟空)

export interface Relation {
  from_id: string;
  to_id: string;
  from_category?: CategoryId;
  to_category?: CategoryId;
  relation_type: RelationType;
  weight: number;
  description: string;
}

// ============================================================
// A. 茶文化深度关联 (用户原话核心: 西湖龙井/陆羽/茶经/乾隆/绿茶)
// ============================================================
const teaRelations: Relation[] = [
  // 龙井核心
  { from_id:"longjing",   to_id:"qianlong", relation_type:"person_of",  weight:10, description:"乾隆帝六下江南,封狮峰山下胡公庙前十八棵茶树为'御茶'" },
  { from_id:"longjing",   to_id:"lucha",    relation_type:"concept_of", weight:10, description:"西湖龙井属绿茶类(炒青绿茶)" },
  { from_id:"longjing",   to_id:"luyu",     relation_type:"related",    weight:8,  description:"陆羽《茶经》品评天下名茶,杭州钱塘天竺、灵隐二寺产茶为'上品'" },
  { from_id:"longjing",   to_id:"biluochun",relation_type:"related",    weight:7,  description:"同为'中国十大名茶',同属江南绿茶" },
  { from_id:"longjing",   to_id:"maofeng",  relation_type:"related",    weight:6,  description:"同为'中国十大名茶',同为绿茶" },
  { from_id:"longjing",   to_id:"maojian",  relation_type:"related",    weight:6,  description:"同为'中国十大名茶',同为绿茶" },

  // 碧螺春
  { from_id:"biluochun",  to_id:"lucha",    relation_type:"concept_of", weight:10, description:"碧螺春属绿茶类" },
  { from_id:"biluochun",  to_id:"longjing", relation_type:"related",    weight:8,  description:"同为江南十大名茶绿茶" },

  // 铁观音/大红袍
  { from_id:"tieguanyin", to_id:"wuyiyan",  relation_type:"related",    weight:7,  description:"同为闽茶乌龙代表" },
  { from_id:"tieguanyin", to_id:"dahongpao",relation_type:"related",    weight:7,  description:"同为福建名茶" },
  { from_id:"dahongpao",  to_id:"wuyiyan",  relation_type:"concept_of", weight:10, description:"大红袍属武夷岩茶(闽北乌龙)" },

  // 普洱
  { from_id:"puer",       to_id:"qianlong", relation_type:"person_of",  weight:7,  description:"普洱茶兴于清乾隆年间,入贡朝廷" },
];

// ============================================================
// B. 酒文化关联
// ============================================================
const wineRelations: Relation[] = [
  { from_id:"maotai",         to_id:"wuliangye",       relation_type:"related", weight:8, description:"同为'中国八大名酒',同为浓香/酱香代表" },
  { from_id:"wuliangye",      to_id:"jiannanchun",     relation_type:"related", weight:9, description:"同为川酒浓香代表" },
  { from_id:"luzhoulaojiao",  to_id:"wuliangye",       relation_type:"related", weight:9, description:"同为川酒浓香代表" },
  { from_id:"shaoxinghuangjiu",to_id:"miyiu",          relation_type:"related", weight:7, description:"同属黄酒类" },
  { from_id:"putaojiu",       to_id:"maotai",          relation_type:"related", weight:5, description:"同为中国传统酒" },
  // 酒与诗
  { from_id:"jiangjinjiu",    to_id:"maotai",          relation_type:"related", weight:6, description:"李白《将进酒》'将进酒,杯莫停',与酒文化" },
  // 菊花酒
  { from_id:"chongyang",      to_id:"qixi",            relation_type:"related", weight:5, description:"同为传统节日,体现民俗节令" },
];

// ============================================================
// C. 食文化 + 节日关联
// ============================================================
const foodRelations: Relation[] = [
  { from_id:"jiaozi",   to_id:"chunjie",  relation_type:"event_of", weight:8,  description:"春节吃饺子,'更岁交子'之谐音" },
  { from_id:"jiaozi",   to_id:"dongzhi",  relation_type:"event_of", weight:8,  description:"冬至/春节吃饺子习俗" },
  { from_id:"huoguo",   to_id:"jiaozi",   relation_type:"related",  weight:6,  description:"同为传统聚餐食品" },
  { from_id:"yuebing",  to_id:"zhongqiu", relation_type:"event_of", weight:10, description:"中秋吃月饼,祭月/拜月之俗" },
  { from_id:"doufu",    to_id:"huoguo",   relation_type:"related",  weight:6,  description:"麻婆豆腐等豆腐菜肴" },
  { from_id:"zongzi",   to_id:"duanwu",   relation_type:"event_of", weight:10, description:"端午节吃粽子,纪念屈原" },
  { from_id:"zongzi",   to_id:"quyuan",   relation_type:"person_of",weight:10, description:"屈原投江后,百姓投粽入江以喂蛟龙" },
  { from_id:"tangyuan", to_id:"yuanxiao", relation_type:"event_of", weight:9,  description:"元宵节吃汤圆/元宵" },
  { from_id:"mantou",   to_id:"jiaozi",   relation_type:"related",  weight:5,  description:"同为面食" },
];

// ============================================================
// D. 丝绸服饰关联
// ============================================================
const silkRelations: Relation[] = [
  { from_id:"suxiu",     to_id:"xiangxiu", relation_type:"related", weight:8, description:"苏绣、湘绣、粤绣为中国四大名绣" },
  { from_id:"suxiu",     to_id:"yuexiu",   relation_type:"related", weight:8, description:"苏绣、湘绣、粤绣为中国四大名绣" },
  { from_id:"kesi",      to_id:"shujin",   relation_type:"related", weight:6, description:"缂丝与蜀锦并称'织中之圣'" },
  { from_id:"hanfu",     to_id:"qipao",    relation_type:"related", weight:6, description:"同为传统服饰" },
  { from_id:"qipao",     to_id:"tangzhuang",relation_type:"related",weight:7, description:"同为近现代中式服装" },
  // 服饰与汉
  { from_id:"hanfu",     to_id:"qixi",     relation_type:"related", weight:6, description:"七夕穿针乞巧,着汉服" },
];

// ============================================================
// E. 诗词 ↔ 作者 ↔ 朝代
// ============================================================
const poemRelations: Relation[] = [
  // 李白
  { from_id:"jiangjinjiu",to_id:"libai",   relation_type:"poem_of",  weight:10, description:"李白《将进酒》,盛唐代表作" },
  { from_id:"jingyesi",   to_id:"libai",   relation_type:"poem_of",  weight:10, description:"李白《静夜思》" },
  // 杜甫
  { from_id:"denggao",    to_id:"dufu",    relation_type:"poem_of",  weight:10, description:"杜甫《登高》,被誉为'古今七律第一'" },
  { from_id:"chunwang",   to_id:"dufu",    relation_type:"poem_of",  weight:10, description:"杜甫《春望》" },
  { from_id:"qingming",   to_id:"dufu",    relation_type:"mentioned_in",weight:6,description:"杜甫《清明》'清明时节雨纷纷'" },
  // 李杜并称
  { from_id:"libai",      to_id:"dufu",    relation_type:"related",  weight:10, description:"李杜并称'诗仙''诗圣'" },
  { from_id:"dufu",       to_id:"libai",   relation_type:"related",  weight:10, description:"杜甫'白也诗无敌'" },
];

// ============================================================
// F. 节日关联
// ============================================================
const festivalRelations: Relation[] = [
  { from_id:"duanwu",     to_id:"quyuan",    relation_type:"person_of",   weight:10, description:"端午节纪念屈原" },
  { from_id:"duanwu",     to_id:"zongzi",    relation_type:"related",     weight:8,  description:"端午食粽" },
  { from_id:"chunjie",    to_id:"jiaozi",    relation_type:"related",     weight:8,  description:"春节食饺子" },
  { from_id:"zhongqiu",   to_id:"yuebing",   relation_type:"related",     weight:8,  description:"中秋食月饼" },
  { from_id:"zhongqiu",   to_id:"change",    relation_type:"person_of",   weight:9,  description:"中秋典故:嫦娥奔月" },
  { from_id:"yuanxiao",   to_id:"tangyuan",  relation_type:"related",     weight:8,  description:"元宵食汤圆" },
  { from_id:"dongzhi",    to_id:"jiaozi",    relation_type:"related",     weight:8,  description:"北方冬至食饺子" },
  // 七夕
  { from_id:"qixi",       to_id:"hanfu",     relation_type:"related",     weight:6,  description:"七夕穿针乞巧,展现传统手工艺" },
  // 重阳
  { from_id:"chongyang",  to_id:"gugong",    relation_type:"related",     weight:4,  description:"重阳节皇家登高" },
];

// ============================================================
// G. 神话/志怪 (含 4 大名著人物 ↔ 作品)
// ============================================================
const mythRelations: Relation[] = [
  // 女娲
  { from_id:"nvwa",       to_id:"change",    relation_type:"related",     weight:7,  description:"同为上古神话人物" },
  // 嫦娥
  { from_id:"change",     to_id:"zhongqiu",  relation_type:"event_of",    weight:10, description:"中秋节源于嫦娥奔月传说" },
  { from_id:"change",     to_id:"qixi",      relation_type:"related",     weight:4,  description:"同为上古神话体系" },
  // 4 大名著人物 ↔ 作品 (★ 关键缺失)
  { from_id:"sunwukong",  to_id:"xiyouji",   relation_type:"work_of",     weight:10, description:"《西游记》主角,大闹天宫/西天取经" },
  { from_id:"zhubajie",   to_id:"xiyouji",   relation_type:"work_of",     weight:10, description:"《西游记》主要角色,天蓬元帅转世" },
  { from_id:"tangseng",   to_id:"xiyouji",   relation_type:"work_of",     weight:10, description:"《西游记》主角,金蝉子转世,西天取经" },
  { from_id:"wusong",     to_id:"shuihu-zhuan",relation_type:"work_of",   weight:10, description:"《水浒传》主要角色,景阳冈打虎" },
  { from_id:"likui",      to_id:"shuihu-zhuan",relation_type:"work_of",   weight:10, description:"《水浒传》主要角色,'黑旋风'" },
  { from_id:"songjiang",   to_id:"shuihu-zhuan",relation_type:"work_of",  weight:10, description:"《水浒传》主角,梁山泊首领,'及时雨'" },
  // 神话 ↔ 典籍
  { from_id:"xiyouji",    to_id:"change",    relation_type:"mentioned_in",weight:6,  description:"《西游记》天竺国暗合月中嫦娥" },
  { from_id:"xiyouji",    to_id:"laozi-huatuo",relation_type:"mentioned_in",weight:7,description:"《西游记》借太上老君炼丹为情节" },
];

// ============================================================
// H. 非遗艺术
// ============================================================
const intangibleRelations: Relation[] = [
  { from_id:"guqin",      to_id:"kongzi",    relation_type:"mentioned_in",weight:6,  description:"孔子'六艺'之一:礼/乐/射/御/书/数" },
  { from_id:"guqin",      to_id:"wangxizhi-quan",relation_type:"mentioned_in",weight:5,description:"王献之《中秋帖》、王羲之书法均借鉴古琴意境" },
];

// ============================================================
// I. 建筑器物
// ============================================================
const architectureRelations: Relation[] = [
  { from_id:"gugong",     to_id:"taihe",     relation_type:"related",     weight:10, description:"太和殿为故宫主体建筑" },
  { from_id:"taihe",      to_id:"gugong",    relation_type:"place_of",    weight:10, description:"太和殿位于故宫" },
  { from_id:"gugong",     to_id:"qianlong",  relation_type:"related",     weight:6,  description:"乾隆重修多处建筑" },
  { from_id:"dujiangyan", to_id:"libing",    relation_type:"person_of",   weight:10, description:"李冰主持修建都江堰" },
  { from_id:"yingzaofashi",to_id:"lijing",   relation_type:"person_of",   weight:10, description:"李诫著《营造法式》" },
  { from_id:"lijing",     to_id:"yingzaofashi",relation_type:"book_of",   weight:10, description:"李诫所著" },
  { from_id:"tiantan",    to_id:"gugong",    relation_type:"related",     weight:7,  description:"同为明清皇家建筑,天坛祭天,故宫理政" },
  { from_id:"dunhuang",   to_id:"xiyouji",   relation_type:"mentioned_in",weight:5,  description:"《西游记》唐僧取经西行,经敦煌一带" },
];

// ============================================================
// J. 人物 ↔ 典籍 (★ 思孟学派 / 老庄 / 法家 / 史家)
// ============================================================
const figureRelations: Relation[] = [
  // 儒
  { from_id:"kongzi",     to_id:"mengzi",    relation_type:"teacher_of",  weight:10, description:"孟子为孔子之孙孔伋的再传弟子" },
  { from_id:"mengzi",     to_id:"kongzi",    relation_type:"related",     weight:10, description:"思孟学派,继承孔子仁学" },
  { from_id:"xunzi",      to_id:"kongzi",    relation_type:"teacher_of",  weight:9,  description:"荀子为儒家学者,性恶论" },
  // 道
  { from_id:"laozi",      to_id:"zhuangzi",  relation_type:"teacher_of",  weight:9,  description:"庄子继承并发展老子思想" },
  { from_id:"zhuangzi",   to_id:"laozi",     relation_type:"related",     weight:9,  description:"道家'老庄'并称" },
  // 法
  { from_id:"hanfeizi",   to_id:"shangyang", relation_type:"related",     weight:9,  description:"韩非子继承商鞅法家思想" },
  { from_id:"xunzi",      to_id:"hanfeizi",  relation_type:"teacher_of",  weight:8,  description:"韩非子、李斯同为荀子弟子" },
  { from_id:"hanfeizi",   to_id:"xunzi",     relation_type:"related",     weight:8,  description:"韩非子师从荀子" },
  // 墨
  { from_id:"mozi",       to_id:"kongzi",    relation_type:"related",     weight:7,  description:"墨子与孔子并称'显学'" },
  // 诗
  { from_id:"libai",      to_id:"dufu",      relation_type:"related",     weight:10, description:"李杜并称'诗仙''诗圣'" },
  { from_id:"libing",     to_id:"dujiangyan",relation_type:"work_of",     weight:10, description:"李冰主持修建都江堰" },
  { from_id:"zhangheng",  to_id:"huntianyi", relation_type:"work_of",     weight:8,  description:"张衡改进浑天仪" },
  { from_id:"zhangheng",  to_id:"didongyi",  relation_type:"work_of",     weight:10, description:"张衡发明地动仪" },
  { from_id:"libai",      to_id:"simaqian",  relation_type:"mentioned_in",weight:6,  description:"李白《侠客行》'赵客缦胡缨',引《史记·游侠列传》" },
  // 史
  { from_id:"simaqian",   to_id:"simaqian-shiji",relation_type:"related",weight:7,  description:"司马迁(汉)与司马光(宋)并称'史家双司马'" },
];

// ============================================================
// K. 思想概念 ↔ 思想家
// ============================================================
const philosophyRelations: Relation[] = [
  { from_id:"ren",        to_id:"kongzi",    relation_type:"person_of",   weight:10, description:"孔子'仁'为儒家核心" },
  { from_id:"ren",        to_id:"mengzi",    relation_type:"related",     weight:8,  description:"孟子'仁政'为仁之延伸" },
  { from_id:"taiji",      to_id:"laozi",     relation_type:"person_of",   weight:8,  description:"'太极'概念源于《老子》" },
  { from_id:"taiji",      to_id:"kongzi",    relation_type:"mentioned_in",weight:7,  description:"《易传·系辞》'易有太极',儒家也讲太极" },
  { from_id:"wuxing_astro",to_id:"wuxing",   relation_type:"related",     weight:5,  description:"五星与五行对应(金木水火土)" },
  { from_id:"zhongyong",  to_id:"kongzi",    relation_type:"mentioned_in",weight:7,  description:"《中庸》为子思(孔伋)所作,传孔子中庸之道" },
  // 典籍 ↔ 思想家
  { from_id:"lunyu",      to_id:"kongzi",    relation_type:"book_of",     weight:10, description:"《论语》记录孔子言行" },
  { from_id:"daodejing",  to_id:"laozi",     relation_type:"book_of",     weight:10, description:"《道德经》传为老子所著" },
  { from_id:"shiji",      to_id:"simaqian",  relation_type:"book_of",     weight:10, description:"司马迁著《史记》" },
  { from_id:"shijing",    to_id:"kongzi",    relation_type:"mentioned_in",weight:8,  description:"孔子整理《诗经》'思无邪'" },
  { from_id:"xiyouji",    to_id:"sunwukong", relation_type:"mentioned_in",weight:8,  description:"《西游记》主角孙悟空" },
  { from_id:"shuihu-zhuan",to_id:"wusong",   relation_type:"mentioned_in",weight:7,  description:"《水浒传》主要角色武松" },
  { from_id:"hongloumeng",to_id:"xiyouji",   relation_type:"related",     weight:5,  description:"同为四大名著,写人写情" },
  { from_id:"sanguo-yanyi",to_id:"xiyouji",  relation_type:"related",     weight:5,  description:"同为四大名著" },
  { from_id:"hongloumeng",to_id:"shijing",   relation_type:"mentioned_in",weight:7,  description:"《红楼梦》'黛玉葬花'化《诗经》意境" },
];

// ============================================================
// L. 古代科技 (重写 - 4 大发明 ↔ 关联条目)
// ============================================================
const techRelations: Relation[] = [
  // 四大发明
  { from_id:"zhizao",     to_id:"huoyao",    relation_type:"related",     weight:9,  description:"同为四大发明" },
  { from_id:"zhizao",     to_id:"huoziys",   relation_type:"related",     weight:9,  description:"同为四大发明" },
  { from_id:"zhizao",     to_id:"zhinanzhen",relation_type:"related",     weight:9,  description:"同为四大发明" },
  { from_id:"huoyao",     to_id:"huoziys",   relation_type:"related",     weight:9,  description:"同为四大发明" },
  { from_id:"huoyao",     to_id:"zhinanzhen",relation_type:"related",     weight:9,  description:"同为四大发明" },
  { from_id:"huoziys",    to_id:"zhinanzhen",relation_type:"related",     weight:9,  description:"同为四大发明" },
  // 天文
  { from_id:"huntianyi",  to_id:"zhangheng", relation_type:"work_of",     weight:8,  description:"张衡改进浑天仪" },
  { from_id:"didongyi",   to_id:"zhangheng", relation_type:"work_of",     weight:10, description:"张衡发明地动仪" },
  { from_id:"huntianyi",  to_id:"didongyi",  relation_type:"related",     weight:7,  description:"同为张衡发明的天文/地震仪器" },
  { from_id:"jianyi",     to_id:"shoushi",   relation_type:"related",     weight:8,  description:"郭守敬主持的简仪与授时历配套使用" },
  { from_id:"shuiyun",    to_id:"huntianyi", relation_type:"related",     weight:6,  description:"水运仪象台集浑仪、浑象、报时于一体" },
  // 数学
  { from_id:"zhoubi",     to_id:"gougu",     relation_type:"concept_of",  weight:9,  description:"《周髀算经》记载勾股定理" },
  // 中医
  { from_id:"bencao",     to_id:"shennong",  relation_type:"related",     weight:7,  description:"《本草纲目》参考《神农本草经》" },
  { from_id:"huangdi-neijing",to_id:"shennong",relation_type:"related", weight:7,  description:"同为中医四大经典" },
  { from_id:"huangdi-neijing",to_id:"kongzi",relation_type:"mentioned_in",weight:5,description:"成书于先秦至两汉,儒家'格物致知'思想影响" },
  // 营造
  { from_id:"yingzaofashi",to_id:"lijing",   relation_type:"book_of",     weight:10, description:"李诫所著" },
  { from_id:"yingzaofashi",to_id:"gugong",   relation_type:"related",     weight:5,  description:"《营造法式》总结北宋以前建筑经验" },
];

// ============================================================
// M. 神话 ↔ 文学
// ============================================================
const mythLiteratureRelations: Relation[] = [
  { from_id:"nvwa",       to_id:"xiyouji",   relation_type:"mentioned_in",weight:5,  description:"《西游记》女娲补天引为开篇" },
  { from_id:"laozi-huatuo",to_id:"daodejing",relation_type:"book_of",    weight:8,  description:"太上老君为《道德经》作者老子之神格化" },
  { from_id:"xiyouji",    to_id:"daodejing", relation_type:"mentioned_in",weight:5,  description:"《西游记》多次引《道德经》" },
];

// ============================================================
// 全部 relations 汇总
// 预计 ~150 条;实际通过 ID 校验的约 130-140 条
// ============================================================
export const allRelations: Relation[] = [
  ...teaRelations,
  ...wineRelations,
  ...foodRelations,
  ...silkRelations,
  ...poemRelations,
  ...festivalRelations,
  ...mythRelations,
  ...intangibleRelations,
  ...architectureRelations,
  ...figureRelations,
  ...philosophyRelations,
  ...techRelations,
  ...mythLiteratureRelations,
];
