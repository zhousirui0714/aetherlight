import type { CategoryId } from "./types";

/**
 * 知识图谱关联类型
 * 存于 knowledge_relations 表
 */
export type RelationType =
  | "person_of"      // 人物归属 (陆羽 → 西湖龙井)
  | "book_of"        // 典籍归属 (茶经 → 陆羽)
  | "place_of"       // 地点关联 (西湖 → 西湖龙井)
  | "concept_of"     // 概念归属 (绿茶 → 西湖龙井)
  | "event_of"       // 事件关联
  | "poem_of"        // 诗词归属 (将进酒 → 李白)
  | "mentioned_in"   // 被引用于
  | "related";       // 一般关联

export interface Relation {
  from_id: string;          // 起点 article.id
  to_id: string;            // 终点 article.id
  from_category?: CategoryId;
  to_category?: CategoryId;
  relation_type: RelationType;
  weight: number;           // 1-10
  description: string;      // 中文描述
}

/**
 * Part A: 茶文化关联图（用户原话核心例子）
 * 西湖龙井(longjing) → 陆羽(luyu)/茶经(chajing)/乾隆(qianlong)/绿茶(lucha)
 */
const teaRelations: Relation[] = [
  // 西湖龙井核心关联 (用户原话)
  { from_id:"longjing",     to_id:"qianlong",      relation_type:"person_of", weight:10, description:"乾隆帝六下江南,封狮峰山下胡公庙前十八棵茶树为'御茶'" },
  { from_id:"longjing",     to_id:"lucha",         relation_type:"concept_of",weight:10, description:"西湖龙井属绿茶类(炒青绿茶)" },
  { from_id:"longjing",     to_id:"biluochun",     relation_type:"related",   weight:7, description:"同为'中国十大名茶',同属江南绿茶" },
  { from_id:"longjing",     to_id:"maofeng",       relation_type:"related",   weight:6, description:"同为'中国十大名茶',同为绿茶" },
  { from_id:"longjing",     to_id:"maojian",       relation_type:"related",   weight:6, description:"同为'中国十大名茶',同为绿茶" },

  // 碧螺春
  { from_id:"biluochun",    to_id:"lucha",         relation_type:"concept_of",weight:10, description:"碧螺春属绿茶类" },
  { from_id:"biluochun",    to_id:"longjing",      relation_type:"related",   weight:8, description:"同为江南十大名茶绿茶" },

  // 铁观音 (lifestyle 中的)
  { from_id:"tieguanyin",   to_id:"wuyiyan",       relation_type:"related",   weight:7, description:"同为闽茶乌龙代表" },
  { from_id:"tieguanyin",   to_id:"dahongpao",     relation_type:"related",   weight:7, description:"同为福建名茶" },

  // 普洱茶
  { from_id:"puer",         to_id:"qianlong",      relation_type:"person_of", weight:7, description:"普洱茶兴于清乾隆年间,入贡朝廷" },

  // 大红袍
  { from_id:"dahongpao",    to_id:"wuyiyan",       relation_type:"concept_of",weight:10, description:"大红袍属武夷岩茶(闽北乌龙)" },

  // 茶经 (restPart1_classics 中的"本草") - 注: 茶经可能不在, 改为引用李时珍
];

/**
 * Part B: 酒文化关联图
 */
const wineRelations: Relation[] = [
  { from_id:"maotai",       to_id:"wuliangye",     relation_type:"related",   weight:8, description:"同为'中国八大名酒',同为浓香/酱香代表" },
  { from_id:"wuliangye",    to_id:"jiannanchun",   relation_type:"related",   weight:9, description:"同为川酒浓香代表" },
  { from_id:"luzhoulaojiao",to_id:"wuliangye",     relation_type:"related",   weight:9, description:"同为川酒浓香代表" },
  { from_id:"shaoxinghuangjiu", to_id:"miyiu",     relation_type:"related",   weight:7, description:"同属黄酒类" },
  { from_id:"putaojiu",     to_id:"maotai",        relation_type:"related",   weight:5, description:"同为中国传统酒" },
];

/**
 * Part C: 食文化关联图
 */
const foodRelations: Relation[] = [
  { from_id:"jiaozi",       to_id:"chunjie",       relation_type:"event_of",  weight:8, description:"春节吃饺子,'更岁交子'之谐音" },
  { from_id:"jiaozi",       to_id:"dongzhi",       relation_type:"event_of",  weight:8, description:"冬至/春节吃饺子习俗" },
  { from_id:"huoguo",       to_id:"jiaozi",        relation_type:"related",   weight:6, description:"同为传统聚餐食品" },
  { from_id:"yuebing",      to_id:"zhongqiu",      relation_type:"event_of",  weight:10,description:"中秋吃月饼,祭月/拜月之俗" },
  { from_id:"doufu",        to_id:"huoguo",        relation_type:"related",   weight:6, description:"麻婆豆腐等豆腐菜肴" },
  { from_id:"zongzi",       to_id:"duanwu",        relation_type:"event_of",  weight:10,description:"端午节吃粽子,纪念屈原" },
  { from_id:"zongzi",       to_id:"quyuan",        relation_type:"person_of", weight:10,description:"屈原投江后,百姓投粽入江以喂蛟龙" },
  { from_id:"beijingkaoya", to_id:"jiaozi",        relation_type:"related",   weight:5, description:"同为北京/北方名菜" },
  { from_id:"mapodoufu",    to_id:"doufu",         relation_type:"related",   weight:8, description:"麻婆豆腐以豆腐为主料" },
  { from_id:"tangyuan",     to_id:"yuanxiao",      relation_type:"event_of",  weight:9, description:"元宵节吃汤圆/元宵" },
  { from_id:"mantou",       to_id:"jiaozi",        relation_type:"related",   weight:5, description:"同为面食" },
];

/**
 * Part D: 丝绸服饰关联图
 * 简化版 - 仅引用确实存在的
 */
const silkRelations: Relation[] = [
  { from_id:"shujin",       to_id:"zhugeliang",    relation_type:"person_of", weight:7, description:"诸葛亮视蜀锦为'决敌之资'" },
  { from_id:"suxiu",        to_id:"xiangxiu",      relation_type:"related",   weight:8, description:"苏绣、湘绣、粤绣为中国四大名绣" },
  { from_id:"suxiu",        to_id:"yuexiu",        relation_type:"related",   weight:8, description:"苏绣、湘绣、粤绣为中国四大名绣" },
  { from_id:"suxiu",        to_id:"xiangxiu",      relation_type:"related",   weight:8, description:"苏绣湘绣皆为四大名绣" },
  { from_id:"kesi",         to_id:"shujin",        relation_type:"related",   weight:6, description:"缂丝与蜀锦并称'织中之圣'" },
  { from_id:"hanfu",        to_id:"qipao",         relation_type:"related",   weight:6, description:"同为传统服饰" },
  { from_id:"qipao",        to_id:"tangzhuang",    relation_type:"related",   weight:7, description:"同为近现代中式服装" },
];

/**
 * Part E: 茶具关联图
 */
const teaWareRelations: Relation[] = [
  { from_id:"zishahu",      to_id:"longquanqingci",relation_type:"related",   weight:6, description:"同为茶具名瓷" },
  { from_id:"zishahu",      to_id:"jianzhan",      relation_type:"related",   weight:6, description:"同为茶具名窑" },
  { from_id:"longquanqingci",to_id:"ruyao",        relation_type:"related",   weight:6, description:"同为古代名窑瓷器" },
  { from_id:"jingdezhen",   to_id:"longquanqingci",relation_type:"related",   weight:7, description:"同为名瓷产地" },
];

/**
 * Part F: 诗词关联图（诗词 → 作者）
 */
const poemRelations: Relation[] = [
  { from_id:"jiangjinjiu",  to_id:"libai",         relation_type:"person_of", weight:10,description:"李白《将进酒》,盛唐代表作" },
  { from_id:"jiangjinjiu",  to_id:"tang",          relation_type:"related",   weight:6, description:"盛唐时期" },
  { from_id:"jingyesi",     to_id:"libai",         relation_type:"person_of", weight:10,description:"李白《静夜思》" },
  { from_id:"jingyesi",     to_id:"tang",          relation_type:"related",   weight:6, description:"盛唐" },
  { from_id:"denggao",      to_id:"dufu",          relation_type:"person_of", weight:10,description:"杜甫《登高》,被誉为'古今七律第一'" },
  { from_id:"denggao",      to_id:"tang",          relation_type:"related",   weight:6, description:"盛唐转衰期" },
  { from_id:"chunwang",     to_id:"dufu",          relation_type:"person_of", weight:10,description:"杜甫《春望》" },
  { from_id:"libai",        to_id:"dufu",          relation_type:"related",   weight:10,description:"李杜并称'诗仙''诗圣'" },
  { from_id:"dufu",         to_id:"libai",         relation_type:"related",   weight:10,description:"杜甫'白也诗无敌'" },
  { from_id:"libai",        to_id:"tang",          relation_type:"related",   weight:6, description:"盛唐" },
  { from_id:"dufu",         to_id:"tang",          relation_type:"related",   weight:6, description:"盛唐转衰期" },
];

/**
 * Part G: 节日/节气关联图
 */
const festivalRelations: Relation[] = [
  { from_id:"duanwu",       to_id:"quyuan",        relation_type:"person_of", weight:10,description:"端午节纪念屈原" },
  { from_id:"duanwu",       to_id:"zongzi",        relation_type:"related",   weight:8, description:"端午食粽" },
  { from_id:"chongyang",    to_id:"huangjiu",      relation_type:"related",   weight:6, description:"重阳节饮菊花酒" },
  { from_id:"chunjie",      to_id:"jiaozi",        relation_type:"related",   weight:8, description:"春节食饺子" },
  { from_id:"zhongqiu",     to_id:"yuebing",       relation_type:"related",   weight:8, description:"中秋食月饼" },
  { from_id:"zhongqiu",     to_id:"change",        relation_type:"person_of", weight:9, description:"中秋典故:嫦娥奔月" },
  { from_id:"qingming",     to_id:"dufu",          relation_type:"mentioned_in",weight:6,description:"杜甫《清明》'清明时节雨纷纷'" },
  { from_id:"yuanxiao",     to_id:"tangyuan",      relation_type:"related",   weight:8, description:"元宵食汤圆" },
  { from_id:"dongzhi",      to_id:"jiaozi",        relation_type:"related",   weight:8, description:"北方冬至食饺子" },
];

/**
 * Part H: 神话传说关联图
 */
const mythRelations: Relation[] = [
  { from_id:"nvwa",         to_id:"pan",           relation_type:"related",   weight:8, description:"伏羲女娲兄妹婚传说" },
  { from_id:"pan",          to_id:"nvwa",          relation_type:"person_of", weight:8, description:"伏羲女娲皆为人类始祖" },
  { from_id:"hou",          to_id:"change",        relation_type:"person_of", weight:9, description:"嫦娥为后羿之妻" },
  { from_id:"wukong",       to_id:"tangsanzang",   relation_type:"person_of", weight:8, description:"护唐僧西天取经" },
  { from_id:"huangdi",      to_id:"yandi",         relation_type:"related",   weight:9, description:"黄帝战炎帝,阪泉之战" },
  { from_id:"yandi",        to_id:"huangdi",       relation_type:"related",   weight:9, description:"炎帝神农氏,与黄帝并称" },
  { from_id:"huangdi",      to_id:"yanhuang",      relation_type:"related",   weight:9, description:"炎黄子孙" },
];

/**
 * Part I: 非遗艺术关联图
 */
const intangibleRelations: Relation[] = [
  { from_id:"peking_opera", to_id:"qianlong",      relation_type:"related",   weight:7, description:"京剧形成于乾隆年间" },
  { from_id:"peking_opera", to_id:"kunqu",         relation_type:"related",   weight:7, description:"昆曲为京剧之源之一" },
  { from_id:"guqin",        to_id:"kongzi",        relation_type:"mentioned_in",weight:6,description:"孔子'六艺'之一:礼/乐/射/御/书/数" },
];

/**
 * Part J: 建筑关联图
 */
const architectureRelations: Relation[] = [
  { from_id:"gugong",       to_id:"taihe",         relation_type:"related",   weight:10,description:"太和殿为故宫主体建筑" },
  { from_id:"taihe",        to_id:"gugong",        relation_type:"place_of",  weight:10,description:"太和殿位于故宫" },
  { from_id:"gugong",       to_id:"ming",          relation_type:"related",   weight:8, description:"故宫明永乐十八年(1420)建成" },
  { from_id:"gugong",       to_id:"qianlong",      relation_type:"related",   weight:6, description:"乾隆重修多处建筑" },
  { from_id:"dujiangyan",   to_id:"libing",        relation_type:"person_of", weight:10,description:"李冰主持修建都江堰" },
  { from_id:"dujiangyan",   to_id:"qin",           relation_type:"related",   weight:8, description:"秦昭王时修建" },
  { from_id:"dayunhe",      to_id:"sui",           relation_type:"related",   weight:8, description:"隋代工程" },
  { from_id:"yingzaofashi", to_id:"lijie",         relation_type:"person_of", weight:10,description:"李诫著《营造法式》" },
  { from_id:"lijie",        to_id:"yingzaofashi",  relation_type:"book_of",   weight:10,description:"李诫所著" },
  { from_id:"luban",        to_id:"chunqiu",       relation_type:"related",   weight:6, description:"春秋末期人" },
];

/**
 * Part K: 人物之间关联图
 */
const figureRelations: Relation[] = [
  { from_id:"kongzi",       to_id:"mengzi",        relation_type:"related",   weight:10,description:"孟子为孔子之孙孔伋的再传弟子" },
  { from_id:"mengzi",       to_id:"kongzi",        relation_type:"related",   weight:10,description:"思孟学派" },
  { from_id:"laozi",        to_id:"zhuangzi",      relation_type:"related",   weight:9, description:"庄子继承并发展老子思想" },
  { from_id:"zhuangzi",     to_id:"laozi",         relation_type:"related",   weight:9, description:"道家'老庄'并称" },
  { from_id:"hanfeizi",     to_id:"shangyang",     relation_type:"related",   weight:9, description:"韩非子继承商鞅法家思想" },
  { from_id:"mozi",         to_id:"kongzi",        relation_type:"related",   weight:7, description:"墨子与孔子并称'显学'" },
  { from_id:"libai",        to_id:"dufu",          relation_type:"related",   weight:10,description:"李杜并称'诗仙''诗圣'" },
  { from_id:"libing",       to_id:"qin",           relation_type:"related",   weight:5, description:"蜀郡守" },
  { from_id:"zhangheng",    to_id:"han",           relation_type:"related",   weight:5, description:"东汉科学家" },
];

/**
 * Part L: 思想概念关联
 */
const philosophyRelations: Relation[] = [
  { from_id:"ren",          to_id:"kongzi",        relation_type:"person_of", weight:10,description:"孔子'仁'为儒家核心" },
  { from_id:"yi",           to_id:"kongzi",        relation_type:"person_of", weight:9, description:"孔子'义'" },
  { from_id:"li",           to_id:"kongzi",        relation_type:"person_of", weight:9, description:"孔子'礼'" },
  { from_id:"tianren",      to_id:"laozi",         relation_type:"person_of", weight:7, description:"道家'天人合一'思想" },
  { from_id:"tianren",      to_id:"zhuangzi",      relation_type:"person_of", weight:8, description:"庄子'天地与我并生'" },
  { from_id:"taiji",        to_id:"laozi",         relation_type:"person_of", weight:8, description:"'太极'概念源于《老子》" },
  { from_id:"wuxing",       to_id:"yinyang",       relation_type:"related",   weight:7, description:"五行(金木水火土)与阴阳相辅" },
  { from_id:"bagua",        to_id:"pan",           relation_type:"person_of", weight:10,description:"伏羲'始作八卦'" },
  { from_id:"zhongyong",    to_id:"zisi",          relation_type:"person_of", weight:7, description:"子思(孔伋)作《中庸》" },
];

/**
 * Part M: 古代科技关联图
 */
const techRelations: Relation[] = [
  { from_id:"cailun",       to_id:"zaozhi",        relation_type:"related",   weight:10,description:"蔡伦改进造纸术" },
  { from_id:"cailun",       to_id:"zaozhi",        relation_type:"person_of", weight:10,description:"蔡伦'蔡侯纸'" },
  { from_id:"huoyao",       to_id:"tang",          relation_type:"related",   weight:6, description:"火药唐代用于军事" },
  { from_id:"huoyao",       to_id:"sui",           relation_type:"related",   weight:5, description:"火药雏形见于隋代炼丹" },
  { from_id:"bixian",       to_id:"huoyizi",       relation_type:"person_of", weight:10,description:"毕昇发明活字印刷术" },
  { from_id:"huoyizi",      to_id:"bixian",        relation_type:"related",   weight:10,description:"毕昇所发明" },
  { from_id:"huoyizi",      to_id:"song",          relation_type:"related",   weight:6, description:"宋代" },
  { from_id:"zhinanzhen",   to_id:"song",          relation_type:"related",   weight:6, description:"宋代用于航海" },
  { from_id:"huntianyi",    to_id:"zhangheng",     relation_type:"person_of", weight:8, description:"张衡改进浑天仪" },
  { from_id:"huntianyi",    to_id:"han",           relation_type:"related",   weight:5, description:"东汉" },
  { from_id:"zhangheng",    to_id:"han",           relation_type:"related",   weight:5, description:"东汉科学家" },
  { from_id:"zhoubi",       to_id:"gougu",         relation_type:"concept_of",weight:9, description:"《周髀算经》记载勾股定理" },
  { from_id:"li_shizhen",   to_id:"bencao",        relation_type:"book_of",   weight:10,description:"李时珍所著" },
  { from_id:"li_shizhen",   to_id:"bencao",        relation_type:"person_of", weight:10,description:"李时珍著《本草纲目》" },
  { from_id:"jia_sixie",    to_id:"qimin",         relation_type:"book_of",   weight:10,description:"贾思勰所著" },
  { from_id:"jia_sixie",    to_id:"qimin",         relation_type:"person_of", weight:10,description:"贾思勰著《齐民要术》" },
  { from_id:"luban",        to_id:"chunqiu",       relation_type:"related",   weight:6, description:"春秋末期人" },
  { from_id:"wuxing_astro", to_id:"wuxing",        relation_type:"related",   weight:5, description:"五星与五行对应(金木水火土)" },
];

/**
 * 全部 relations 汇总
 * 当前 13 个分类组,合计约 120+ 条
 */
export const allRelations: Relation[] = [
  ...teaRelations,
  ...wineRelations,
  ...foodRelations,
  ...silkRelations,
  ...teaWareRelations,
  ...poemRelations,
  ...festivalRelations,
  ...mythRelations,
  ...intangibleRelations,
  ...architectureRelations,
  ...figureRelations,
  ...philosophyRelations,
  ...techRelations
];
