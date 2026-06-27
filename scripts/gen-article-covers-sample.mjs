/**
 * Sample 5 - 验证新 prompt 模板
 * 修复点:
 *   1. 移除写死的 "5-7 灰墨 + 60% 留白" sumi-e 风格 (根因)
 *   2. 按 title+category+sub_category 提取具体视觉关键词
 *   3. 根据分类自动出具体视觉描述 (人/物/景/书/食...)
 *   4. 保留"中国风" 但允许用色 + 留白, 不强制死板留白
 *   5. 显式禁掉文字/字符 (AI 写汉字容易跑偏)
 *
 * 不写 W1/W2 的 progress, 只生成文件 + 报告链接, 给你目视验证
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const COVERS_DIR = join(ROOT, "public", "ai-covers");

function loadEnv() {
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const ENV = loadEnv();
const URL = ENV.SUPABASE_URL || ENV.VITE_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

mkdirSync(COVERS_DIR, { recursive: true });

// ---------- 视觉关键词字典 ----------
// 抽取标题中的核心物象, 让 AI 有具体可画的东西
// 比如 "李白" → "举杯诗人", "春节" → "红灯笼梅花"
const SUBJECT_HINTS = {
  // 历史人物
  "李白": "a Tang dynasty poet in white robes, holding a wine cup, gazing at the moon, free spirited",
  "杜甫": "a Tang dynasty poet in plain robes, holding a brush, beside a desk with scrolls, melancholic expression",
  "孔子": "a wise elderly scholar in traditional Confucian robes, holding bamboo slips, gentle smile",
  "屈原": "a poet in long robes standing on a riverbank at twilight, long beard, headscarf, resolute gaze",
  "秦始皇": "an emperor in black dragon robe with crown, sitting on a throne, imperial palace background",
  "老子": "an old sage with long white beard riding a green ox through misty mountains",
  "庄子": "a free-spirited scholar in flowing robes, butterflies around, sitting on a rock by a stream",
  "王羲之": "a calligrapher holding a brush, writing on a long scroll, ink stone beside him, geese in background",
  "苏东坡": "a scholar in bamboo hat, holding a staff, standing on a cliff overlooking misty river",
  "关羽": "a warrior in green armor with long beard, holding a guandao blade, heroic pose",
  "诸葛亮": "a strategist in crane-feather fan, sitting in a tent, scrolls and maps on table",
  "岳飞": "a loyal general in silver armor, holding a spear, standing in front of banners",
  "杨贵妃": "a noble lady in red Tang dynasty dress with floral hairpin, graceful pose in palace garden",

  // 节日
  "春节": "red lanterns hanging, plum blossoms in snow, firecrackers, spring couplets on door, festive",
  "元宵节": "lanterns floating in night sky, full moon, river of lanterns, sweet glutinous rice balls",
  "清明": "willow branches swaying, people with flowers walking in drizzle, ancient stone steps",
  "端午": "zongzi rice dumplings wrapped in leaves, dragon boat race on river, mugwort leaves",
  "七夕": "magpie bridge spanning the Milky Way, two stars Altair and Vega, romantic night sky",
  "中秋": "bright full moon over palace, mooncakes on a plate, osmanthus flowers, family reunion",
  "重阳": "chrysanthemum flowers, golden autumn mountains, old man climbing with cane",

  // 节气
  "立春": "first spring sprouts breaking through snow, plum blossoms blooming, swallows returning",
  "雨水": "gentle rain on willows, misty river, frogs awakening, farmer in field",
  "惊蛰": "thunder rolling over awakening mountains, insects stirring, peach blossoms",
  "春分": "balanced sun, peach and pear blossoms in full bloom, swallows in flight",
  "清明": "willow branches swaying, people with flowers walking in drizzle, ancient stone steps",
  "谷雨": "young rice seedlings in terraced fields, peony flowers, misty mountains",
  "立夏": "lush green leaves, lotus buds emerging, cicadas beginning to sing",
  "夏至": "shimmering heat, lotus in full bloom, long day, cool shade under trees",
  "立秋": "first red leaves appearing, cool breeze, harvest beginning, cicadas quiet",
  "秋分": "balanced light, red and gold foliage, harvest moon, chrysanthemums",
  "霜降": "morning frost on red leaves, persimmons ripening, geese flying south",
  "立冬": "first snow on bare branches, warm stove, people in thick robes",
  "冬至": "long winter night, families gathered, dumplings on table, snow outside window",

  // 建筑
  "故宫": "Forbidden City aerial view, red walls, golden glazed tile roofs, marble white terraces",
  "长城": "Great Wall snaking across misty mountain ridges, watchtowers, autumn colors",
  "苏州园林": "classical Chinese garden with zigzag bridge over lotus pond, moon gate, rockery",
  "莫高窟": "Buddhist cave temple interior, ancient murals, Buddha statues, dim golden light",
  "天坛": "Temple of Heaven with three tiered blue circular roof, white marble altar, blue sky",
  "颐和园": "Summer Palace with long corridor by Kunming Lake, painted beams, Seventeen-Arch Bridge",
  "布达拉宫": "Potala Palace on red hill, white and red walls, golden roofs against blue sky",
  "拙政园": "Humble Administrator's Garden with classical pavilions, lotus pond, scholar's rocks",
  "平遥古城": "ancient walled city with grey brick walls, traditional courtyard houses, lanterns",
  "丽江古城": "old town with stone canals, red lanterns, wooden houses, snow-capped mountain backdrop",
  "龙门石窟": "giant Buddha statue carved into cliff face, serene expression, ancient stone",
  "都江堰": "ancient water conservation system, fish mouth levee, rushing water through bamboo forest",
  "灵渠": "ancient canal with stone locks, boats passing through, karst mountains",

  // 诗词作品
  "将进酒": "a grand feast with overflowing golden wine, jade cups, robed poets singing, river of stars",
  "静夜思": "lone figure on a bed looking out at bright moon through window, white frost on ground",
  "春晓": "a few petals drifting in gentle wind, a bird singing, spring dawn in a garden",
  "登鹳雀楼": "white stork tower at sunset, vast river flowing to the sea, layered mountains",
  "望庐山瀑布": "towering waterfall cascading from misty green mountain, rainbow in spray, poet watching",
  "静夜思": "a traveler lying awake in moonlight, white frost at the foot of bed, distant homeland",
  "水调歌头": "bright moon in night sky, Su Dongpo with wine cup, dancing shadows, yearning for home",
  "如梦令": "drunken woman remembering petal-strewn path after rain, hazy mood, delicate flowers",
  "声声慢": "autumn dusk, yellow flowers on ground, cold curtain, lonely woman with wine",
  "定风波": "wind and rain drenching a bamboo hat-wearing poet, misty mountain path, calm smile",

  // 典籍
  "论语": "bamboo slips unrolled on a wooden desk, sage's hand writing characters, scholarly study",
  "道德经": "Laozi riding a green ox, yin-yang symbol carved in stone, misty valley",
  "诗经": "willow branch, peach blossom, ancient verse scroll, young woman gathering plants",
  "楚辞": "orchid petals floating on river, poet in elaborate robes with feathered hat",
  "史记": "Sima Qian with brush and bamboo slips, library of bamboo scrolls, candle light",
  "易经": "hexagram pattern carved in jade, yin-yang fish, ancient bronze divination tools",
  "黄帝内经": "ancient medical text on bamboo, meridian diagram on body, moxibustion and herbs",
  "山海经": "mythical creatures in a vast landscape, nine-tailed fox, phoenix, dragon turtle",
  "孙子兵法": "bamboo slips with military diagrams, strategist with fan, flags and tents",
  "天工开物": "ancient workshop with craftsmen making porcelain, water-powered trip hammer, plow",

  // 思想
  "禅": "monk in grey robe sitting in meditation under ancient pine, mist, stone lantern",
  "佛教": "golden Buddha statue in red temple, incense spirals, lotus flowers, golden light",
  "道教": "Taoist sage in star robe, yin-yang diagram, peach of immortality, flying crane",
  "儒家": "Confucius teaching in a courtyard, disciples with bamboo scrolls, ancient academy",
  "墨家": "craftsman with wooden mechanical device, geometric tools, ink writing",
  "法家": "Han Feizi in stern robes, bamboo slips on legal codes, scales of justice",

  // 饮食
  "茶": "steaming tea in a purple clay teapot, bamboo whisk, ancient tea house, mountain mist",
  "酒": "ceramic wine jar, amber wine pouring, plum blossom branch, scholar's drinking cup",
  "火锅": "steaming copper hotpot with chili peppers, wooden table, families gathered",
  "饺子": "dumpling folding scene, bamboo steamer, dough and filling, family at table",
  "月饼": "round mooncake with intricate pattern, osmanthus flowers, moon in background",
  "粽子": "zongzi wrapped in bamboo leaves, dragon boat in background, Wu Zixu's spirit",
  "烤鸭": "Peking duck hanging in red oven, glistening crispy skin, sliced pieces on plate",

  // 神话
  "嫦娥": "Chang'e flying to the moon in flowing silk robes, jade rabbit pounding elixir",
  "后羿": "Houyi the archer drawing bow, nine suns in sky, mountain landscape",
  "哪吒": "Nezha in golden armor with red sash, wind fire wheels, fighting the dragon king",
  "孙悟空": "Sun Wukong the Monkey King with golden staff, somersault cloud, mountain of flowers",
  "女娲": "Nüwa the goddess with snake body and human torso, repairing the sky with colorful stones",
  "盘古": "Pangu with axe separating heaven and earth, dawn breaking through chaos",
  "牛郎织女": "cowherd and weaving maiden separated by Milky Way, magpies forming bridge",
  "梁山伯与祝英台": "butterflies emerging from tomb, tragic lovers, garden of peonies",
  "白蛇传": "white snake spirit in flowing white dress, scholar falling in love, West Lake scene",
  "孟姜女": "Meng Jiangnu crying at the broken Great Wall, tears flowing, autumn wind",
  "八仙": "Eight Immortals crossing the sea on different magical objects, waves, immortal realm",

  // 艺术
  "京剧": "Peking opera performer in elaborate headdress and red costume, painted face, stage",
  "昆曲": "Kunqu opera performer in silk robes with fan, classical stage, moonlit garden",
  "皮影戏": "shadow puppet silhouettes on white screen, colorful puppets, lamp light",
  "剪纸": "red paper-cut design of phoenix and flowers, intricate patterns, scissors",
  "刺绣": "embroidered silk with peony and phoenix, needle and colorful threads, fine detail",
  "青花瓷": "blue and white porcelain vase with dragon pattern, hand painting, kiln fire",
  "紫砂壶": "purple clay teapot with bamboo pattern, tea ceremony, scholar's desk",
  "玉雕": "jade carving of dragon, craftsman with tools, translucent green stone",
  "文房四宝": "the four treasures of study - brush, ink, paper, ink stone, arranged on desk",
  "书法": "calligrapher's hand holding brush writing large characters, ink stone, scroll",

  // 音乐
  "古琴": "scholar playing guqin on a mountain pavilion, flowing water, pine trees",
  "琵琶": "lady in Tang dress playing pipa, pear blossoms falling, palace interior",
  "二胡": "erhu player with sad melody, autumn moon, old man with white beard",
  "笛子": "scholar playing bamboo flute on a bridge over stream, moonlit night",
  "编钟": "bronze bell chime set, ancient ritual music, grand hall, ceremonial scene",
  "箫": "xiao flute player in bamboo grove, morning mist, peaceful meditation",

  // 器物
  "瓷器": "ancient celadon vase with lotus pattern, kiln fire, master craftsman",
  "漆器": "red lacquerware with mother-of-pearl inlay, intricate patterns, craftsman at work",
  "青铜器": "bronze ritual vessel with taotie pattern, ancient sacrificial ceremony",
  "玉器": "jade bi disc with dragon pattern, translucent green, ancient noble holding it",
  "丝绸": "silk weaver at loom, colorful brocade emerging, mulberry trees in background",
  "茶叶": "tea plants on misty mountain slope, tea picker with basket, fresh green leaves",
  "中药": "Chinese medicine cabinet with hundreds of drawers, dried herbs, traditional pharmacy",
  "算盘": "ancient abacus with wooden beads, merchant counting, ledger book",
};

// 按 category 给一个默认视觉风格
const CATEGORY_DEFAULT_HINT = {
  "figures": "a historical figure in appropriate dynasty robes, dignified, portrait composition",
  "poems": "a scene of poetry recitation, scholar in flowing robes, brush and scroll, willows or mountains",
  "poetry": "a scene of poetry recitation, scholar in flowing robes, brush and scroll, willows or mountains",
  "classics": "ancient bamboo slips and scrolls, scholarly study room, candle, books",
  "festivals": "a traditional Chinese festival scene with characteristic symbols, family gathering, warm light",
  "solar_terms": "seasonal landscape reflecting this solar term, sky and earth in harmony",
  "architecture": "classical Chinese architecture with traditional craftsmanship, courtyard, eaves, tile roofs",
  "artifacts": "intricate traditional craft artifact, hands working on it, master craftsmanship",
  "art": "traditional Chinese art form performance or creation, vivid colors, cultural symbols",
  "myths": "mythical scene with traditional Chinese painting style, ethereal atmosphere, magical creatures",
  "thoughts": "a sage meditating or teaching, ancient Chinese philosophical setting, ink and brush",
  "food": "Chinese traditional food dish beautifully presented, steam rising, banquet table",
  "music": "traditional Chinese musical instrument being played, ancient setting, flowing melody visual",
  "default": "traditional Chinese cultural scene with characteristic elements, elegant composition",
};

function pickSubjectHint(title) {
  // 优先精确匹配整词
  for (const key of Object.keys(SUBJECT_HINTS)) {
    if (title.includes(key)) return SUBJECT_HINTS[key];
  }
  return null;
}

function buildPrompt(article) {
  // 1) 试 subject 关键词
  const subjectHint = pickSubjectHint(article.title);

  // 2) 按 category 给默认
  const catKey = (article.sub_category || article.category || "").toLowerCase();
  let categoryHint = CATEGORY_DEFAULT_HINT["default"];
  for (const k of Object.keys(CATEGORY_DEFAULT_HINT)) {
    if (catKey.includes(k)) {
      categoryHint = CATEGORY_DEFAULT_HINT[k];
      break;
    }
  }

  // 3) 用 excerpt 补充场景氛围 (但限制长度)
  const moodHint = article.excerpt
    ? article.excerpt.slice(0, 120).replace(/[\r\n]+/g, " ")
    : "";

  // 4) 组装 prompt: 关键变 → 主体描述 (subject) > 类别默认 > 标题
  //    不再写死 sumi-e + 灰墨, 允许色彩, 允许细节, 但保持中国风
  //    显式禁掉文字/字符 (防止 AI 写错字)
  const subject = subjectHint
    ? subjectHint
    : `${article.title}, ${categoryHint}`;

  // prompt 前置强烈的"无文字"声明, 让 AI 在主体内容生成前就接受约束
  // 之前 (将进酒) 张被拒就是因为 AI 画了"将进酒"题字
  return [
    `EMPTY TEXT IMAGE - PAINTING ONLY, NO WRITING OF ANY KIND.`,
    `Traditional Chinese cultural painting in the style of meticulous gongbi, depicting:`,
    `Subject: ${subject}.`,
    `Atmosphere: ${moodHint || "classical Chinese cultural atmosphere"}.`,
    `Style: rich cultural detail, warm color palette with traditional Chinese pigments (vermillion, malachite green, ochre, ink black, gold leaf), elegant composition with foreground subject and atmospheric background, soft lighting, no harsh shadows.`,
    `CRITICAL: this is a pure visual painting. NEVER include any Chinese characters, NO text, NO letters, NO writing, NO calligraphy, NO inscriptions, NO captions, NO labels, NO watermarks, NO signatures, NO seals, NO stamps, NO poetic couplets (对联), NO banners with text, NO scrolls with text, NO books with readable pages. All surfaces including walls, scrolls, clothing, banners, sky must be completely free of any written marks, glyphs, or character-like shapes. If you would normally add a poem or signature, leave that area as blank paper or plain silk instead.`,
    `Aspect ratio 4:3, museum quality, ultra high detail, masterpiece illustration.`,
  ].join(" ");
}

function slugify(s) {
  return s.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 60);
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return h;
}

async function generateOne(article) {
  const prompt = buildPrompt(article);
  const seed = Math.abs(hashCode(article.id)) % 100000;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&seed=${seed}&nologo=true&model=flux`;
  const filename = `sample_${slugify(article.id)}.jpg`;
  const outPath = join(COVERS_DIR, filename);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 5000) throw new Error("图片过小");
      writeFileSync(outPath, buffer);
      return { ok: true, path: outPath, size: buffer.length, prompt };
    } catch (e) {
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 4000));
      else return { ok: false, error: e.message, prompt };
    }
  }
}

// 5 个 sample: 人物 / 节日 / 建筑 / 典籍 / 诗词 (覆盖主要类型)
const SAMPLE_IDS = ["libai", "chunjie", "gugong", "kongzi", "jiangjinjiu"];

// 复用 lib/cover-prompt.mjs 的 buildPrompt
// (脚本内联了一份 copy, 方便单跑调试; 跟 W1/W2 共享 prompt 行为)
import { buildPrompt as _buildPromptFromLib } from "./lib/cover-prompt.mjs";
// (这里没用, 留个 anchor 防 lint)

async function main() {
  const r = await fetch(
    `${URL}/rest/v1/knowledge_articles?select=id,title,category,sub_category,excerpt&id=in.(${SAMPLE_IDS.join(",")})`,
    { headers: HEADERS }
  );
  const articles = await r.json();
  console.log(`找到 ${articles.length} 篇 sample 文章\n`);

  for (const a of articles) {
    console.log(`\n--- ${a.id} (${a.title}) ---`);
    console.log(`  category: ${a.category} | sub: ${a.sub_category}`);
    const res = await generateOne(a);
    if (res.ok) {
      console.log(`  ✅ ${res.path} (${(res.size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`  ❌ ${res.error}`);
    }
  }
  console.log("\n完成。看 public/ai-covers/sample_*.jpg");
}

main().catch(e => { console.error(e); process.exit(1); });
