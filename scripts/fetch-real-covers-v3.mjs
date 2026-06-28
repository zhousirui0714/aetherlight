/**
 * 全量拉图 v3 — 主题化精搜
 * - ~200 个搜索词, 每个 1 张图
 * - 优先 Asian Art / China / Japan / Korea / Tibet
 * - 上传到 Supabase covers/real/multi2/{slug}.jpg
 * - 输出 title-关键词映射表
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = {};
for (const line of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m && !line.startsWith("#")) ENV[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const URL = ENV.SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("❌ env missing"); process.exit(1); }
const H = {
  apikey: KEY, Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json", Prefer: "count=exact",
};
const UA = "AetherLight-CoverBot/3.0";
const MET = "https://collectionapi.metmuseum.org/public/collection/v1";

// ============ 主题搜索词 (200+ 项) ============
// 每条: { slug, terms: [...], keys: [title 关键词], cat, sub? }
const QUERIES = [
  // 故宫 / 紫禁城 / 宫殿
  { slug: "gugong", terms: ["Forbidden City", "Ming imperial court painting", "imperial dragon robe", "Qing imperial portrait"], keys: ["故宫","紫禁","宫殿","宫廷"], cat: "artifacts" },
  { slug: "palace-screen", terms: ["Chinese imperial screen", "Coromandel screen"], keys: ["屏风","插屏"], cat: "artifacts" },
  { slug: "throne", terms: ["Chinese imperial throne"], keys: ["宝座","龙椅","御座"], cat: "artifacts" },

  // 西游记 / 神话小说
  { slug: "xiyouji", terms: ["monkey king", "Sun Wukong", "Chinese demon"], keys: ["西游","孙悟空","大闹","唐僧","取经"], cat: "mythology" },
  { slug: "hongloumeng", terms: ["Chinese lady portrait", "Qing lady", "scholar garden"], keys: ["红楼","宝玉","黛玉","金陵"], cat: "mythology" },
  { slug: "shuihuzhuan", terms: ["Chinese warrior painting", "Ming dynasty figure painting"], keys: ["水浒","梁山","宋江","武松","鲁智深"], cat: "mythology" },
  { slug: "sanguo", terms: ["Three Kingdoms", "Chinese general portrait", "Ming figure painting"], keys: ["三国","刘备","关羽","张飞","诸葛亮","曹操"], cat: "mythology" },
  { slug: "fengshen", terms: ["Chinese deity painting", "Daoist immortal"], keys: ["封神","姜子牙","哪吒","杨戬"], cat: "mythology" },
  { slug: "nezha", terms: ["Chinese guardian figure", "Buddhist guardian"], keys: ["哪吒"], cat: "mythology" },

  // 神话 / 道教 / 佛教
  { slug: "guanyin", terms: ["Bodhisattva Avalokiteshvara", "Guanyin", "Kuan Yin"], keys: ["观世音","观音","菩萨"], cat: "mythology" },
  { slug: "buddha", terms: ["Buddha statue China", "Chinese Buddha"], keys: ["佛","佛祖","释迦","弥勒","如来"], cat: "mythology" },
  { slug: "daoist", terms: ["Daoist immortal", "Taoist sage"], keys: ["道教","道家","真人","吕洞宾","八仙"], cat: "mythology" },
  { slug: "longwang", terms: ["Chinese dragon", "Dragon King"], keys: ["龙王","龙"], cat: "mythology" },
  { slug: "phoenix", terms: ["Chinese phoenix", "Fenghuang"], keys: ["凤凰","凤"], cat: "mythology" },
  { slug: "kilin", terms: ["Chinese qilin", "Qilin mythical creature"], keys: ["麒麟"], cat: "mythology" },
  { slug: "houyi", terms: ["Houyi archer"], keys: ["后羿","嫦娥","射日"], cat: "mythology" },
  { slug: "nuwa", terms: ["Nüwa goddess"], keys: ["女娲","伏羲","补天"], cat: "mythology" },
  { slug: "jingwei", terms: ["Chinese myth bird"], keys: ["精卫","夸父"], cat: "mythology" },
  { slug: "pangu", terms: ["Pangu creation myth"], keys: ["盘古","开天辟地"], cat: "mythology" },
  { slug: "huangdi", terms: ["Yellow Emperor", "Huangdi portrait"], keys: ["黄帝","炎帝","蚩尤"], cat: "mythology" },
  { slug: "yao-shun", terms: ["Sage king China"], keys: ["尧","舜","禹","禅让"], cat: "mythology" },

  // 人物 — 古代名人
  { slug: "confucius", terms: ["Confucius portrait", "Confucius painting"], keys: ["孔子","孔丘","仲尼","儒家"], cat: "figures" },
  { slug: "laozi", terms: ["Laozi portrait", "Daoist sage"], keys: ["老子","李耳","道德经"], cat: "figures" },
  { slug: "zhuangzi", terms: ["Zhuangzi", "Daoist philosopher"], keys: ["庄子","庄周"], cat: "figures" },
  { slug: "mengzi", terms: ["Mencius portrait"], keys: ["孟子","孟轲"], cat: "figures" },
  { slug: "xunzi", terms: ["Xunzi portrait", "Han scholar"], keys: ["荀子"], cat: "figures" },
  { slug: "hanfeizi", terms: ["Han Feizi", "Legalist"], keys: ["韩非","法家","商鞅"], cat: "figures" },
  { slug: "mozi", terms: ["Mozi portrait"], keys: ["墨子","墨家"], cat: "figures" },
  { slug: "zhuge", terms: ["Zhuge Liang portrait"], keys: ["诸葛亮","孔明","卧龙"], cat: "figures" },
  { slug: "wusong", terms: ["Chinese warrior", "Ming figure painting"], keys: ["武松","鲁智深","梁山好汉"], cat: "figures" },
  { slug: "wangxizhi", terms: ["Wang Xizhi", "Chinese calligrapher"], keys: ["王羲之","兰亭","书圣"], cat: "figures" },
  { slug: "wanglun", terms: ["Tang poet", "Tang dynasty painting"], keys: ["王维","摩诘"], cat: "figures" },
  { slug: "subai-xie", terms: ["Su Shi portrait", "Song scholar"], keys: ["苏轼","苏东坡","东坡"], cat: "figures" },
  { slug: "liji", terms: ["Li Bai poet", "Tang dynasty"], keys: ["李白","太白","青莲","诗仙"], cat: "figures" },
  { slug: "dufu-r", terms: ["Du Fu", "Tang poet"], keys: ["杜甫","少陵","诗圣"], cat: "figures" },
  { slug: "baijuyi", terms: ["Bai Juyi", "Tang poet"], keys: ["白居易","乐天"], cat: "figures" },
  { slug: "wanganshi", terms: ["Li Qingzhao", "female poet"], keys: ["李清照","易安","婉约"], cat: "figures" },
  { slug: "xinqi", terms: ["Xin Qiji", "Song poet"], keys: ["辛弃疾","稼轩"], cat: "figures" },
  { slug: "luyou", terms: ["Lu You", "Southern Song poet"], keys: ["陆游","放翁"], cat: "figures" },
  { slug: "tangbohu", terms: ["Ming scholar", "Wen Zhengming"], keys: ["唐伯虎","文征明","吴门"], cat: "figures" },
  { slug: "pu-songling", terms: ["Qing scholar portrait"], keys: ["蒲松龄","聊斋","志异"], cat: "figures" },
  { slug: "cao-xueqin", terms: ["Qing scholar portrait"], keys: ["曹雪芹","红楼梦"], cat: "figures" },
  { slug: "wu-zetian", terms: ["Wu Zetian", "Chinese empress"], keys: ["武则天","女皇"], cat: "figures" },
  { slug: "cixi", terms: ["Empress Dowager Cixi", "Qing imperial"], keys: ["慈禧"], cat: "figures" },
  { slug: "qianlong", terms: ["Qianlong Emperor", "Qing imperial portrait"], keys: ["乾隆","雍正","康熙"], cat: "figures" },
  { slug: "wudi", terms: ["Han Wudi", "Chinese emperor"], keys: ["汉武帝","刘邦","项羽"], cat: "figures" },
  { slug: "tangtaizong", terms: ["Tang Taizong", "Chinese emperor portrait"], keys: ["唐太宗","李世民","贞观"], cat: "figures" },
  { slug: "qin-shi-huang", terms: ["Qin Shi Huang", "terracotta warrior"], keys: ["秦始皇","嬴政","始皇帝"], cat: "figures" },
  { slug: "yuefei", terms: ["Yue Fei", "Song general"], keys: ["岳飞","岳武穆"], cat: "figures" },
  { slug: "zheng-he", terms: ["Zheng He", "Ming admiral"], keys: ["郑和","下西洋","宝船"], cat: "figures" },
  { slug: "wangyangming", terms: ["Wang Yangming", "Ming philosopher"], keys: ["王阳明","心学"], cat: "figures" },
  { slug: "zengguofan", terms: ["Qing official portrait"], keys: ["曾国藩","李鸿章","张之洞"], cat: "figures" },
  { slug: "kangxi", terms: ["Kangxi Emperor portrait"], keys: ["康熙"], cat: "figures" },
  { slug: "cangjie", terms: ["Cangjie", "Chinese characters"], keys: ["仓颉","造字"], cat: "figures" },
  { slug: "huangjue-zi", terms: ["Huang Yueying", "female inventor"], keys: ["黄月英","诸葛亮妻"], cat: "figures" },
  { slug: "zhangheng", terms: ["Zhang Heng", "Han scientist"], keys: ["张衡","浑天仪","地动仪"], cat: "figures" },
  { slug: "zu-chongzhi", terms: ["Zu Chongzhi", "mathematician"], keys: ["祖冲之","圆周率"], cat: "figures" },
  { slug: "cailun", terms: ["Cai Lun", "paper invention"], keys: ["蔡伦","造纸"], cat: "figures" },
  { slug: "shennong", terms: ["Shennong", "herbal medicine"], keys: ["神农","尝百草","本草"], cat: "figures" },
  { slug: "bianque", terms: ["Bian Que", "Chinese medicine"], keys: ["扁鹊","中医"], cat: "figures" },
  { slug: "huashigulu", terms: ["Hua Tuo", "Chinese medicine"], keys: ["华佗","麻沸散","五禽戏"], cat: "figures" },
  { slug: "sun-simiao", terms: ["Sun Simiao", "medicine"], keys: ["孙思邈","千金方"], cat: "figures" },
  { slug: "lidian", terms: ["Li Shizhen", "herbal"], keys: ["李时珍","本草纲目"], cat: "figures" },

  // 艺术 / 画家
  { slug: "guohua", terms: ["Chinese landscape painting", "shan shui"], keys: ["国画","山水画","山水"], cat: "artifacts" },
  { slug: "shuimo", terms: ["Chinese ink painting"], keys: ["水墨","写意","文人画"], cat: "artifacts" },
  { slug: "gongbi", terms: ["Chinese gongbi painting", "meticulous"], keys: ["工笔","仕女"], cat: "artifacts" },
  { slug: "shufa", terms: ["Chinese calligraphy", "ink scroll"], keys: ["书法","行书","楷书","草书","隶书"], cat: "artifacts" },
  { slug: "xieyi", terms: ["Chinese xieyi painting"], keys: ["写意"], cat: "artifacts" },
  { slug: "nihong", terms: ["Ni Zan", "Yuan painter"], keys: ["倪瓒","元四家","黄公望","王蒙","吴镇"], cat: "artifacts" },
  { slug: "tang-yin", terms: ["Tang Yin", "Ming painter"], keys: ["唐寅","仇英","沈周","文征明"], cat: "artifacts" },
  { slug: "zhengbanqiao", terms: ["Zheng Banqiao", "Qing painter"], keys: ["郑板桥","扬州八怪"], cat: "artifacts" },
  { slug: "qi-baishi", terms: ["Qi Baishi", "shrimp painting"], keys: ["齐白石"], cat: "artifacts" },
  { slug: "xubeihong", terms: ["Xu Beihong", "horse painting"], keys: ["徐悲鸿","马"], cat: "artifacts" },
  { slug: "zhangdaqian", terms: ["Zhang Daqian", "splashed ink"], keys: ["张大千","泼墨"], cat: "artifacts" },
  { slug: "cuihua", terms: ["Chinese cloisonne", "Jingtailan"], keys: ["景泰蓝","掐丝珐琅"], cat: "artifacts" },
  { slug: "kexi", terms: ["Chinese woodblock print"], keys: ["木刻","版画"], cat: "artifacts" },
  { slug: "nianhua", terms: ["Chinese New Year print", "Nianhua"], keys: ["年画","杨柳青","桃花坞"], cat: "artifacts" },
  { slug: "cizhuan-r", terms: ["Chinese porcelain", "blue and white"], keys: ["青花","瓷","官窑","汝窑","钧窑","哥窑","定窑"], cat: "artifacts" },
  { slug: "jingci", terms: ["Jingdezhen porcelain"], keys: ["景德镇"], cat: "artifacts" },
  { slug: "tang-sancai", terms: ["Tang sancai", "sancai pottery"], keys: ["唐三彩"], cat: "artifacts" },
  { slug: "qinzheng", terms: ["Qin bronze", "ritual vessel"], keys: ["青铜","鼎","尊","爵","簋"], cat: "artifacts" },
  { slug: "yu-qi", terms: ["Chinese jade", "jade carving", "jade cong", "jade bi"], keys: ["玉","玉璧","玉琮","玉佩"], cat: "artifacts" },
  { slug: "lashi", terms: ["Chinese lacquerware", "lacquer"], keys: ["漆器","漆"], cat: "artifacts" },
  { slug: "zhu-ji", terms: ["Chinese bamboo carving"], keys: ["竹雕","竹刻"], cat: "artifacts" },
  { slug: "guqin-r", terms: ["guqin", "Chinese zither"], keys: ["古琴","琴"], cat: "intangible" },
  { slug: "pipa-r", terms: ["pipa", "Chinese lute"], keys: ["琵琶"], cat: "intangible" },
  { slug: "guzheng", terms: ["guzheng", "Chinese zither"], keys: ["古筝"], cat: "intangible" },
  { slug: "erhu", terms: ["erhu", "Chinese fiddle"], keys: ["二胡","胡琴"], cat: "intangible" },
  { slug: "dizi", terms: ["dizi", "Chinese flute"], keys: ["笛子","箫","竹笛"], cat: "intangible" },
  { slug: "suzhou-r", terms: ["Suzhou garden", "scholar's rock"], keys: ["苏州","拙政","留园","网师"], cat: "artifacts" },
  { slug: "yuanlin", terms: ["Chinese garden", "rockery"], keys: ["园林","假山","亭","轩"], cat: "artifacts" },
  { slug: "luzhi", terms: ["lattice window", "Chinese architecture"], keys: ["窗棂","漏窗"], cat: "artifacts" },

  // 茶 / 食
  { slug: "chadao-r", terms: ["Chinese teapot", "Yixing teapot", "Gongfu tea"], keys: ["茶","茶道","茶艺","紫砂","功夫茶"], cat: "lifestyle" },
  { slug: "chajing-r", terms: ["Lu Yu tea classic", "tea ceremony"], keys: ["茶经","陆羽"], cat: "lifestyle" },
  { slug: "chunju", terms: ["Spring tea", "green tea"], keys: ["春茶","绿茶","龙井","碧螺春","毛尖"], cat: "lifestyle" },
  { slug: "puer", terms: ["Pu'er tea"], keys: ["普洱","黑茶"], cat: "lifestyle" },
  { slug: "hongcha", terms: ["Chinese red tea", "black tea"], keys: ["红茶","祁门","正山小种"], cat: "lifestyle" },
  { slug: "mi", terms: ["honey", "beehive Chinese"], keys: ["蜂蜜","蜜"], cat: "lifestyle" },
  { slug: "jiuhua", terms: ["Baijiu", "Chinese liquor"], keys: ["白酒","酒","茅台","五粮液"], keys2: ["酒"], cat: "lifestyle" },
  { slug: "huangjiu", terms: ["Chinese yellow wine"], keys: ["黄酒","绍兴"], cat: "lifestyle" },
  { slug: "doujiang", terms: ["soy milk"], keys: ["豆浆"], cat: "lifestyle" },
  { slug: "doufu", terms: ["tofu", "soy food"], keys: ["豆腐"], cat: "lifestyle" },
  { slug: "mooncake", terms: ["moon cake", "Chinese pastry"], keys: ["月饼"], cat: "lifestyle" },
  { slug: "jiaozi", terms: ["jiaozi", "dumpling"], keys: ["饺子","馄饨"], cat: "lifestyle" },
  { slug: "baozi", terms: ["baozi", "steamed bun"], keys: ["包子","馒头"], cat: "lifestyle" },
  { slug: "chuan-cai", terms: ["Sichuan cuisine", "Chinese food"], keys: ["川菜","麻婆","宫保"], cat: "lifestyle" },
  { slug: "yue-cai", terms: ["Cantonese cuisine"], keys: ["粤菜","广式"], cat: "lifestyle" },
  { slug: "lu-cai", terms: ["Shandong cuisine"], keys: ["鲁菜"], cat: "lifestyle" },
  { slug: "chopstick", terms: ["Chinese chopstick"], keys: ["筷子"], cat: "lifestyle" },
  { slug: "yinxiang", terms: ["Chinese tea cup", "porcelain cup"], keys: ["茶杯","茶具"], cat: "lifestyle" },

  // 服饰 / 妆容 / 丝绸
  { slug: "qipao", terms: ["cheongsam", "qipao"], keys: ["旗袍"], cat: "lifestyle" },
  { slug: "hanfu", terms: ["Hanfu", "Chinese traditional clothing"], keys: ["汉服","襦裙","曲裾"], cat: "lifestyle" },
  { slug: "tangzhuang", terms: ["Tang suit", "Chinese jacket"], keys: ["唐装","中山装"], cat: "lifestyle" },
  { slug: "magua", terms: ["Chinese horse face skirt"], keys: ["马褂","长衫"], cat: "lifestyle" },
  { slug: "buyao", terms: ["buyao hairpin"], keys: ["步摇","簪","钗","凤冠"], cat: "lifestyle" },
  { slug: "xiezi-r", terms: ["Chinese embroidered shoes"], keys: ["绣花鞋"], cat: "lifestyle" },
  { slug: "silk-r", terms: ["Chinese silk", "silk brocade", "silk embroidery"], keys: ["丝绸","蜀锦","苏绣","湘绣","粤绣","织锦"], cat: "lifestyle" },
  { slug: "zaran", terms: ["Chinese dyeing", "indigo"], keys: ["扎染","蜡染","蓝印花"], cat: "lifestyle" },
  { slug: "makeup", terms: ["Chinese makeup", "face powder"], keys: ["妆容","胭脂","粉黛"], cat: "lifestyle" },

  // 建筑
  { slug: "yuelu-r", terms: ["Yueyang Tower", "Chinese tower"], keys: ["岳阳楼"], cat: "artifacts" },
  { slug: "huanghelou-r", terms: ["Yellow Crane Tower"], keys: ["黄鹤楼"], cat: "artifacts" },
  { slug: "tengwangge-r", terms: ["Tengwang Pavilion"], keys: ["滕王阁"], cat: "artifacts" },
  { slug: "penglaige", terms: ["Penglai Pavilion"], keys: ["蓬莱阁"], cat: "artifacts" },
  { slug: "greatwall", terms: ["Great Wall China"], keys: ["长城","万里长城"], cat: "artifacts" },
  { slug: "dayan-r", terms: ["Big Wild Goose Pagoda", "pagoda"], keys: ["大雁塔","小雁塔","塔"], cat: "artifacts" },
  { slug: "songyue", terms: ["Songyue Pagoda"], keys: ["嵩岳寺塔","铁塔"], cat: "artifacts" },
  { slug: "zhaozhouqiao-r", terms: ["Zhaozhou Bridge"], keys: ["赵州桥","卢沟桥","桥"], cat: "artifacts" },
  { slug: "dujiangyan-r", terms: ["Dujiangyan irrigation"], keys: ["都江堰","灵渠","水利"], cat: "artifacts" },
  { slug: "mogaoku-r", terms: ["Mogao Caves", "Dunhuang"], keys: ["莫高窟","敦煌","石窟","壁画","飞天"], cat: "artifacts" },
  { slug: "yungang", terms: ["Yungang Grottoes"], keys: ["云冈","龙门","石窟"], cat: "artifacts" },
  { slug: "longmen", terms: ["Longmen Grottoes"], keys: ["龙门石窟"], cat: "artifacts" },
  { slug: "qinling-r", terms: ["Qin terracotta"], keys: ["兵马俑","秦陵","秦始皇帝陵"], cat: "artifacts" },
  { slug: "ming-xiaoling-r", terms: ["Ming Xiaoling Tomb"], keys: ["明孝陵","十三陵","乾陵","陵墓"], cat: "artifacts" },
  { slug: "qinhuai", terms: ["Qinhuai River", "Nanjing"], keys: ["秦淮","夫子庙"], cat: "artifacts" },
  { slug: "mingju", terms: ["Chinese courtyard house", "siheyuan"], keys: ["四合院","民居","土楼","围龙","吊脚楼"], cat: "artifacts" },
  { slug: "tiantan-r", terms: ["Temple of Heaven"], keys: ["天坛"], cat: "artifacts" },
  { slug: "tiantan-r2", terms: ["Confucius Temple Qufu"], keys: ["孔庙","曲阜"], cat: "artifacts" },
  { slug: "potala", terms: ["Potala Palace"], keys: ["布达拉宫"], cat: "artifacts" },
  { slug: "yiheyuan-r", terms: ["Summer Palace"], keys: ["颐和园","避暑山庄","承德"], cat: "artifacts" },
  { slug: "mingsha", terms: ["Mingsha mountain", "Crescent Lake"], keys: ["鸣沙山","月牙泉"], cat: "artifacts" },
  { slug: "jiuzhaigou", terms: ["Jiuzhaigou"], keys: ["九寨沟","黄山","泰山","峨眉","武当","青城"], cat: "artifacts" },

  // 科技 / 四大发明
  { slug: "huoju-r", terms: ["Chinese firework", "gunpowder weapon"], keys: ["火药","火器","火炮","火箭"], cat: "technology" },
  { slug: "huoju-r2", terms: ["ancient Chinese war"], keys: ["火铳","火绳枪"], cat: "technology" },
  { slug: "zhinnan-r", terms: ["Chinese compass", "si nan"], keys: ["指南针","罗盘","司南","磁"], cat: "technology" },
  { slug: "zaozhi-r", terms: ["Chinese paper scroll", "Cai Lun paper"], keys: ["纸","造纸","宣纸"], cat: "technology" },
  { slug: "yinshua", terms: ["Chinese movable type", "Bi Sheng"], keys: ["印刷","活字","毕昇"], cat: "technology" },
  { slug: "huntianyi-r", terms: ["Han astronomical instrument"], keys: ["浑天仪","天文","圭表"], cat: "technology" },
  { slug: "dayunhe-r", terms: ["Grand Canal"], keys: ["大运河","京杭","漕运"], cat: "technology" },
  { slug: "gougu-r", terms: ["Chinese mathematics"], keys: ["勾股","算术","九章算术","算经"], cat: "technology" },
  { slug: "maixue-r", terms: ["Chinese pulse diagnosis"], keys: ["脉学","脉象","中医","针灸","推拿"], cat: "technology" },
  { slug: "kanerjing-r", terms: ["Karez irrigation"], keys: ["坎儿井","井"], cat: "technology" },
  { slug: "shanghan", terms: ["Chinese medicine text", "herbal"], keys: ["伤寒","金匮","温病","黄帝内经","本草"], cat: "technology" },
  { slug: "daoyin-r", terms: ["Dao Yin exercise"], keys: ["导引","气功","太极","五禽戏","八段锦"], cat: "technology" },
  { slug: "ershiba-r", terms: ["Chinese constellations", "lunar mansions"], keys: ["二十八宿","星宿","北斗","天文"], cat: "technology" },
  { slug: "yinli", terms: ["Chinese calendar", "lunisolar"], keys: ["历法","农历","阴阳历"], cat: "technology" },
  { slug: "shier-shichen", terms: ["Chinese time keeping"], keys: ["十二时辰","时辰","日晷","漏刻"], cat: "technology" },

  // 诗词/文学
  { slug: "tangshi-300-r", terms: ["Tang poetry", "Tang dynasty painting"], keys: ["唐诗","李白诗","杜甫诗","王维诗","白居易"], cat: "poems" },
  { slug: "songci", terms: ["Song ci poetry"], keys: ["宋词","苏轼词","李清照词","辛弃疾词","柳永"], cat: "poems" },
  { slug: "yuanqu", terms: ["Yuan drama", "Zaju"], keys: ["元曲","元杂剧","关汉卿","马致远"], cat: "poems" },
  { slug: "chuci", terms: ["Chu ci", "Qu Yuan"], keys: ["楚辞","屈原","离骚"], cat: "poems" },
  { slug: "shijing-r", terms: ["Classic of Poetry", "Shijing"], keys: ["诗经","国风","雅","颂"], cat: "poems" },
  { slug: "lunyu-r", terms: ["Analects Confucius"], keys: ["论语","学而","为政"], cat: "classics" },
  { slug: "daxue", terms: ["Great Learning", "Confucian classic"], keys: ["大学","中庸"], cat: "classics" },
  { slug: "mengzi-r", terms: ["Mencius text"], keys: ["孟子","梁惠王"], cat: "classics" },
  { slug: "zhongyong", terms: ["Doctrine of the Mean"], keys: ["中庸"], cat: "classics" },
  { slug: "daodejing", terms: ["Dao De Jing"], keys: ["道德经","老子"], cat: "philosophy" },
  { slug: "zhuangzi-r", terms: ["Zhuangzi text"], keys: ["庄子","逍遥游","齐物"], cat: "philosophy" },
  { slug: "sunzi", terms: ["Sunzi Art of War"], keys: ["孙子","三十六计","兵法"], cat: "philosophy" },
  { slug: "hanfeizi-r", terms: ["Han Feizi text"], keys: ["韩非"], cat: "philosophy" },
  { slug: "fajia", terms: ["Legalist text", "Shang Yang"], keys: ["法家","商鞅"], cat: "philosophy" },
  { slug: "mozi-r", terms: ["Mozi text"], keys: ["墨子"], cat: "philosophy" },
  { slug: "yijing", terms: ["I Ching", "Book of Changes"], keys: ["易经","周易","八卦","六十四卦","阴阳"], cat: "philosophy" },
  { slug: "fengshui", terms: ["Feng shui compass", "luopan"], keys: ["风水","罗盘","堪舆"], cat: "philosophy" },
  { slug: "yinyang", terms: ["Yin Yang", "Taiji"], keys: ["阴阳","太极","五行","金木水火土"], cat: "philosophy" },

  // 节庆
  { slug: "chunjie-r", terms: ["Chinese New Year", "red lantern", "Spring Festival"], keys: ["春","春节","年","红灯笼","鞭炮","对联","福"], cat: "festivals" },
  { slug: "yuanxiao", terms: ["Yuanxiao lantern", "tangyuan"], keys: ["元宵","汤圆","灯会"], cat: "festivals" },
  { slug: "qingming", terms: ["Qingming", "tomb sweeping"], keys: ["清明","踏青","寒食"], cat: "festivals" },
  { slug: "duanwu-r", terms: ["Dragon boat", "Duanwu"], keys: ["端午","龙舟","粽子","屈原","艾草"], cat: "festivals" },
  { slug: "qixi", terms: ["Qixi festival", "Magpie bridge"], keys: ["七夕","牛郎","织女"], cat: "festivals" },
  { slug: "zhongqiu-r", terms: ["Moon festival", "Mid-autumn moon"], keys: ["中秋","月","月饼","玉兔","嫦娥","桂花"], cat: "festivals" },
  { slug: "chongyang", terms: ["Double Ninth", "Chongyang"], keys: ["重阳","登高","菊花"], cat: "festivals" },
  { slug: "laba", terms: ["Laba congee"], keys: ["腊八","粥"], cat: "festivals" },
  { slug: "lihun", terms: ["Chinese wedding", "red bridal"], keys: ["婚礼","喜","嫁娶"], cat: "festivals" },
  { slug: "shousui", terms: ["Shousui New Year eve"], keys: ["守岁","年兽"], cat: "festivals" },
  { slug: "jieqi", terms: ["Solar terms China", "lunisolar"], keys: ["节气","立春","春分","夏至","秋分","冬至"], cat: "festivals" },
  { slug: "jingqi", terms: ["Jingzhe", "awakening insects"], keys: ["惊蛰","春分","清明","谷雨"], cat: "festivals" },
  { slug: "liqiu", terms: ["Beginning of Autumn"], keys: ["立秋","处暑","白露","寒露","霜降"], cat: "festivals" },
  { slug: "lidong", terms: ["Beginning of Winter"], keys: ["立冬","小雪","大雪","小寒","大寒"], cat: "festivals" },
  { slug: "hanfu-ming", terms: ["Hanfu", "Chinese traditional clothing"], keys: ["汉服","襦裙"], cat: "lifestyle" },

  // 戏曲/非遗
  { slug: "jingju-r", terms: ["Peking opera mask", "opera costume"], keys: ["京剧","生旦净末丑","脸谱","花旦","老生"], cat: "intangible" },
  { slug: "kunjun-r", terms: ["Kunqu opera", "Chinese opera"], keys: ["昆曲","牡丹亭","游园","惊梦","杜丽娘"], cat: "intangible" },
  { slug: "yueju", terms: ["Yue opera", "Cantonese opera"], keys: ["粤剧","越剧","黄梅戏","豫剧"], cat: "intangible" },
  { slug: "chuanju", terms: ["Sichuan opera", "face change"], keys: ["川剧","变脸"], cat: "intangible" },
  { slug: "piying", terms: ["Chinese shadow puppet"], keys: ["皮影","皮影戏"], cat: "intangible" },
  { slug: "muou", terms: ["Chinese wooden puppet", "Rod puppet"], keys: ["木偶","提线木偶","布袋戏","漳州木偶"], cat: "intangible" },
  { slug: "caiqi", terms: ["paper cutting", "Chinese folk art"], keys: ["剪纸","窗花"], cat: "intangible" },
  { slug: "kites", terms: ["Chinese kite", "Weifang kite"], keys: ["风筝","潍坊"], cat: "intangible" },
  { slug: "tangren", terms: ["Chinese sugar painting", "folk art"], keys: ["糖人","糖画","吹糖"], cat: "intangible" },
  { slug: "cixiu", terms: ["Chinese embroidery", "Su embroidery"], keys: ["刺绣","苏绣","湘绣","蜀绣","粤绣"], cat: "intangible" },
  { slug: "yinchen", terms: ["silver jewelry", "Miao silver"], keys: ["银饰","苗银"], cat: "intangible" },
  { slug: "zhijia", terms: ["Chinese paper umbrella", "oil paper umbrella"], keys: ["油纸伞","伞"], cat: "intangible" },
  { slug: "kungfu", terms: ["Chinese martial arts", "Shaolin"], keys: ["武术","功夫","少林","武当","太极拳"], cat: "intangible" },
  { slug: "wushu", terms: ["Chinese sword", "jian"], keys: ["剑","刀","武术"], cat: "intangible" },
  { slug: "mahjong", terms: ["mahjong", "Chinese tile game"], keys: ["麻将"], cat: "lifestyle" },
  { slug: "weiqi", terms: ["Go game", "weiqi"], keys: ["围棋","象棋","棋"], cat: "lifestyle" },
  { slug: "guofeng", terms: ["Chinese folk music", "guoyue"], keys: ["民乐","国乐","丝竹"], cat: "intangible" },

  // 古代语言/文字
  { slug: "jiagu", terms: ["oracle bone script", "Jiaguwen"], keys: ["甲骨","甲骨文"], cat: "artifacts" },
  { slug: "jinwen", terms: ["bronze inscription", "jinwen"], keys: ["金文","钟鼎文"], cat: "artifacts" },
  { slug: "xiaozhuan", terms: ["small seal script"], keys: ["小篆","篆书","籀文"], cat: "artifacts" },
  { slug: "lishu", terms: ["clerical script", "lishu"], keys: ["隶书"], cat: "artifacts" },
  { slug: "kaishu", terms: ["regular script", "kaishu"], keys: ["楷书"], cat: "artifacts" },
  { slug: "xingshu", terms: ["running script", "xingshu"], keys: ["行书"], cat: "artifacts" },
  { slug: "caoshu", terms: ["grass script", "caoshu"], keys: ["草书","狂草"], cat: "artifacts" },
  { slug: "zhongwen", terms: ["Chinese characters", "hanzi"], keys: ["汉字","中文","字"], cat: "classics" },
  { slug: "pinyin", terms: ["pinyin", "Chinese romanization"], keys: ["拼音"], cat: "classics" },

  // 思想/学派
  { slug: "rujia", terms: ["Confucian scholar portrait"], keys: ["儒","儒家","儒学","理学","程朱","陆王"], cat: "philosophy" },
  { slug: "daojia", terms: ["Daoist immortal", "Daoist painting"], keys: ["道","道家","道家"], cat: "philosophy" },
  { slug: "fujia", terms: ["Buddhist monk", "Chan"], keys: ["佛","佛教","禅","禅宗","净土","律宗"], cat: "philosophy" },
  { slug: "xuanxue", terms: ["Xuanxue", "Neo Daoism"], keys: ["玄学","魏晋"], cat: "philosophy" },
  { slug: "mingqing-r", terms: ["Ming Qing scholar", "Ming painting"], keys: ["明清","阳明","心学"], cat: "philosophy" },

  // 古代小说
  { slug: "gudian-xiaoshuo", terms: ["Ming Qing novel", "Ming painting"], keys: ["小说","古典小说","四大名著"], cat: "classics" },
  { slug: "bianwen", terms: ["bianwen", "Tang narrative"], keys: ["变文","话本"], cat: "classics" },
  { slug: "gushihua", terms: ["Chinese storytelling", "storyteller"], keys: ["说书","评书","鼓书"], cat: "classics" },

  // 民俗
  { slug: "miansuo", terms: ["Chinese knot", "longevity knot"], keys: ["中国结","结"], cat: "intangible" },
  { slug: "tangyuan-r", terms: ["tangyuan rice ball"], keys: ["汤圆","元宵"], cat: "lifestyle" },
  { slug: "zao", terms: ["zao", "Chinese New Year decoration"], keys: ["灶神","门神","桃符"], cat: "festivals" },
  { slug: "hua", terms: ["Chinese flower arrangement"], keys: ["花道","插花"], cat: "lifestyle" },
  { slug: "penjing", terms: ["Chinese bonsai", "penjing"], keys: ["盆景"], cat: "lifestyle" },
  { slug: "guohua-r2", terms: ["Chinese flower painting", "bird and flower"], keys: ["花鸟","工笔花鸟"], cat: "artifacts" },

  // 古代科学
  { slug: "tianwen", terms: ["ancient Chinese astronomy"], keys: ["天文","观星","星象"], cat: "technology" },
  { slug: "dili", terms: ["Chinese geography", "ancient map"], keys: ["地理","地图","徐霞客"], cat: "technology" },
  { slug: "bencao", terms: ["Materia medica", "Chinese herbal"], keys: ["本草","草药","中药"], cat: "technology" },
  { slug: "nongshu", terms: ["Chinese agriculture", "Qimin Yaoshu"], keys: ["农","农学","齐民要术"], cat: "technology" },
  { slug: "jiyi", terms: ["Chinese weaving", "loom"], keys: ["织布","纺织","织机","黄道婆"], cat: "technology" },
  { slug: "yinshua-r", terms: ["Chinese woodblock print", "movable type"], keys: ["雕版","活字"], cat: "technology" },
  { slug: "zhongyi", terms: ["Chinese medicine", "TCM"], keys: ["中医","中药","望闻问切"], cat: "technology" },
];

// ============ 2. Met Museum 搜索 ============
async function metSearch(q) {
  const r = await fetch(`${MET}/search?q=${encodeURIComponent(q)}&hasImages=true`, { headers: { "User-Agent": UA } });
  if (!r.ok) return [];
  return (await r.json()).objectIDs || [];
}
async function metObject(id) {
  const r = await fetch(`${MET}/objects/${id}`, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  return r.json();
}

async function download(url) {
  const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`dl ${r.status}`);
  const ct = r.headers.get("content-type") || "";
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
  return { buf: Buffer.from(await r.arrayBuffer()), ext, contentType: ct };
}

async function upload(filename, buf, contentType) {
  const r = await fetch(`${URL}/storage/v1/object/covers/${filename}`, {
    method: "POST",
    headers: { ...H, "Content-Type": contentType, "x-upsert": "true" },
    body: buf,
  });
  if (!r.ok) {
    const t = await r.text();
    if (t.includes("already exists")) return `${URL}/storage/v1/object/public/covers/${filename}`;
    return null;
  }
  return `${URL}/storage/v1/object/public/covers/${filename}`;
}

const LOCAL = join(ROOT, "public", "real-covers");
mkdirSync(LOCAL, { recursive: true });

const creds = [];
const used = new Set();

async function pickFor(q) {
  for (const term of q.terms) {
    const ids = await metSearch(term);
    for (const id of ids.slice(0, 8)) {
      const obj = await metObject(id);
      if (!obj || !obj.primaryImageSmall) continue;
      if (!/Asian|China/i.test(`${obj.department} ${obj.culture}`)) continue;
      if (used.has(`met-${id}`)) continue;
      used.add(`met-${id}`);
      return { ...q, picked: { source: "Met Museum", objectId: id, title: obj.title, artist: obj.artistDisplayName || "Unattributed", date: obj.objectDate || "", dept: obj.department, culture: obj.culture, image: obj.primaryImage, thumb: obj.primaryImageSmall, term } };
    }
  }
  return null;
}

console.log(`🚀 拉 ${QUERIES.length} 张图 (目标 ~${QUERIES.length} 张)...\n`);
let ok = 0, fail = 0, skip = 0;
for (const q of QUERIES) {
  process.stdout.write(`[${q.slug.padEnd(15)}] `);
  try {
    const p = await pickFor(q);
    if (!p) { skip++; console.log(`✗ 无匹配`); continue; }
    const { buf, ext, contentType } = await download(p.picked.image);
    const filename = `real/multi2/${q.slug}.${ext}`;
    const publicUrl = await upload(filename, buf, contentType);
    if (!publicUrl) { fail++; console.log(`✗ upload fail`); continue; }
    ok++;
    console.log(`✓ ${p.picked.title.slice(0, 38).padEnd(40)} [${p.picked.term.slice(0, 20)}]`);
    writeFileSync(join(LOCAL, `${q.slug}.${ext}`), buf);
    creds.push({ ...p.picked, slug: q.slug, keys: q.keys, cat: q.cat, publicUrl, keys: q.keys });
  } catch (e) {
    fail++; console.log(`✗ ${e.message.slice(0, 40)}`);
  }
  // 速率限制 (Met 允许但保守)
  await new Promise(r => setTimeout(r, 200));
}

writeFileSync(join(ROOT, "real-covers-v3.json"), JSON.stringify(creds, null, 2), "utf-8");
console.log(`\n\n✅ 完成: ${ok} 成功, ${skip} 跳过, ${fail} 失败`);
console.log(`输出: real-covers-v3.json`);
console.log(`本地: public/real-covers/ (多2张)`);
console.log(`Supabase: covers/real/multi2/`);
