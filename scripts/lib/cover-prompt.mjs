/**
 * 共用的 AI 配图 prompt 构建器
 * 2026-06-27 重写
 *
 * 关键改进:
 *  1. 不再写死 sumi-e 灰墨风格 → 改为按具体主体出视觉
 *  2. 维护 100+ 主题关键词字典 (李白/春节/故宫/论语/...) → 抽具象画面
 *  3. 按 category 兜底默认视觉
 *  4. 强 prompt 避免 AI 在画面写错字 / 加题款 / 加印章
 *
 * 如果某个标题没匹配, fallback 走 categoryHint + excerpt
 */

// ---------- 主题视觉字典 ----------
// key: title 包含的关键短语
// value: 英文具象描述 (Pollinations 用英文 prompt)
const SUBJECT_HINTS = {
  // 人物
  "李白": "a Tang dynasty poet in flowing white robes holding a wine cup, gazing at the moon, free spirited",
  "杜甫": "a Tang dynasty poet in plain robes with a brush, beside a desk of scrolls, melancholic and thoughtful",
  "孔子": "a wise elderly scholar in dark Confucian robes, holding open bamboo slips, gentle teaching smile",
  "孟子": "a wise philosopher in flowing robes gesturing while teaching disciples",
  "屈原": "a poet in elaborate robes with feathered hat, standing on a misty riverbank at twilight",
  "秦始皇": "an emperor in black dragon robe with jade crown, sitting on a throne, imperial palace background",
  "老子": "an old sage with long white beard riding a green ox through misty mountains",
  "庄子": "a free-spirited scholar in flowing robes, butterflies around, sitting on a rock by a stream",
  "王羲之": "a calligrapher with brush, writing on a long unrolled scroll, ink stone beside, white geese in background",
  "苏东坡": "a scholar in bamboo hat and staff, standing on a cliff overlooking a misty river",
  "苏轼": "a scholar in bamboo hat and staff, standing on a cliff overlooking a misty river",
  "辛弃疾": "a Song dynasty warrior-poet in armor, gripping a sword, autumn battlefield in background",
  "陆游": "a Song dynasty poet in scholar robes, holding a long sword, looking into distance",
  "李清照": "a Song dynasty female poet in elegant silk robes, sitting by a window with falling flowers",
  "关汉卿": "a Yuan dynasty playwright in scholar robes, holding a script, theatrical masks nearby",
  "白居易": "a Tang dynasty poet in red robes, sitting on a garden bench with lute",
  "王维": "a Tang dynasty poet-painter sitting in a mountain pavilion surrounded by misty peaks",
  "李商隐": "a Tang dynasty poet in dark scholar robes, standing under a waning moon with autumn leaves",
  "曹操": "a warlord in dark armor on horseback, banner behind, fierce commanding expression",
  "诸葛亮": "a strategist in crane-feather fan, sitting in a tent, scrolls and maps on table",
  "刘备": "a benevolent lord in simple robes, sitting under plum blossoms, gentle expression",
  "关羽": "a warrior in green armor with long flowing beard, holding a guandao blade, heroic pose",
  "张飞": "a fierce warrior in black armor with a long spear, roaring battle cry",
  "吕布": "a warrior in red armor on a red horse, holding a halberd, blood-red battle background",
  "岳飞": "a loyal general in silver armor, holding a spear, standing in front of banners",
  "杨贵妃": "a noble Tang lady in red dress with floral hairpin, graceful pose in palace garden",
  "西施": "a beautiful woman in white silk robes, washing silk by a stream, willows above",
  "王昭君": "a Han dynasty lady in red fur-lined robes, riding a horse across a snowy steppe",
  "貂蝉": "a beautiful woman in pink silk, holding a flower, moonlit garden",
  "女娲": "a goddess with human upper body and snake lower body, repairing the sky with colorful stones",
  "神农": "a sage-emperor tasting herbs in a mountain forest, basket of plants beside",
  "仓颉": "an ancient sage with four eyes, carving characters on a cliff",
  "鲁班": "a master carpenter with tools, building a wooden bird mechanism, blueprints on table",

  // 节日
  "春节": "red lanterns hanging, plum blossoms in snow, spring couplets on door, festive atmosphere",
  "过年": "red lanterns hanging, plum blossoms in snow, family gathering, firecrackers",
  "元宵节": "lanterns floating in night sky, full moon, river of lanterns, sweet glutinous rice balls",
  "上元": "lanterns floating in night sky, full moon, river of lanterns",
  "清明节": "willow branches swaying, light drizzle, people with flowers, ancient stone steps",
  "清明": "willow branches swaying, light drizzle, people with flowers, ancient stone steps",
  "端午节": "zongzi rice dumplings wrapped in leaves, dragon boat race on river, mugwort leaves",
  "端午": "zongzi rice dumplings wrapped in leaves, dragon boat race on river, mugwort leaves",
  "七夕节": "magpie bridge spanning the Milky Way, two bright stars Altair and Vega, romantic night sky",
  "七夕": "magpie bridge spanning the Milky Way, two bright stars Altair and Vega, romantic night sky",
  "中秋节": "bright full moon over palace rooftops, mooncakes on a plate, osmanthus flowers, family reunion",
  "中秋": "bright full moon over palace rooftops, mooncakes on a plate, osmanthus flowers, family reunion",
  "重阳节": "chrysanthemum flowers, golden autumn mountains, old person climbing with cane",
  "重阳": "chrysanthemum flowers, golden autumn mountains, old person climbing with cane",
  "腊八": "porridge of eight grains bubbling in a clay pot, colorful dried fruits, winter scene",
  "寒食": "cold food festival, no fire, spring outing, people eating cold snacks under willow trees",
  "祭灶": "kitchen god ascending to heaven, sweet sticky candy on lips, warm domestic scene",
  "灶王": "kitchen god in red robe, ascending in smoke to report to heaven",

  // 二十四节气
  "立春": "first spring sprouts breaking through snow, plum blossoms blooming, swallows returning",
  "雨水": "gentle rain on willows, misty river, frogs awakening, farmer in field",
  "惊蛰": "thunder rolling over awakening mountains, insects stirring, peach blossoms opening",
  "春分": "balanced sunlight, peach and pear blossoms in full bloom, swallows in flight",
  "谷雨": "young rice seedlings in terraced fields, peony flowers, misty mountains",
  "立夏": "lush green leaves, lotus buds emerging, cicadas beginning to sing",
  "小满": "wheat grains filling but not yet ripe, full but not overflowing",
  "芒种": "farmers planting rice in flooded paddies, plums turning yellow, summer solstice approaching",
  "夏至": "shimmering heat, lotus in full bloom, long day, cool shade under trees",
  "小暑": "hot summer, dragonflies over lotus, dogs lying in shade, cicadas loud",
  "大暑": "scorching noon, people fanning, melting ice desserts, lotus pond",
  "立秋": "first red leaves appearing, cool breeze, harvest beginning, cicadas quiet",
  "处暑": "heat beginning to recede, geese starting to fly south, autumn clouds",
  "白露": "white dew on grass at dawn, geese flying south, autumn air crisp",
  "秋分": "balanced light, red and gold foliage, harvest moon, chrysanthemums",
  "寒露": "cold dew on chrysanthemums, autumn deepening, geese flying in V formation",
  "霜降": "morning frost on red maple leaves, persimmons ripening on branches, geese flying south",
  "立冬": "first snow on bare branches, warm stove, people in thick robes",
  "小雪": "light snow falling, plum buds visible, warm indoor scene",
  "大雪": "heavy snow covering mountains, people in fur coats, warm wine",
  "冬至": "long winter night, families gathered, dumplings on table, snow outside window",
  "小寒": "icy streams, plum blossoms about to bloom, deep cold",
  "大寒": "deepest cold of winter, ice sculptures, end of cycle, dawn of new year",

  // 建筑
  "故宫": "Forbidden City aerial view, red walls, golden glazed tile roofs, marble white terraces",
  "紫禁城": "Forbidden City aerial view, red walls, golden glazed tile roofs, marble white terraces",
  "长城": "Great Wall snaking across misty mountain ridges, watchtowers, autumn colors",
  "万里长城": "Great Wall snaking across misty mountain ridges, watchtowers, autumn colors",
  "苏州园林": "classical Chinese garden with zigzag bridge over lotus pond, moon gate, rockery, pavilion",
  "颐和园": "Summer Palace with long corridor by Kunming Lake, painted beams, Seventeen-Arch Bridge",
  "天坛": "Temple of Heaven with three tiered blue circular roof, white marble altar, blue sky",
  "布达拉宫": "Potala Palace on red hill, white and red walls, golden roofs against blue sky",
  "莫高窟": "Buddhist cave temple interior, ancient murals, Buddha statues, dim golden light",
  "龙门石窟": "giant Buddha statue carved into cliff face, serene expression, ancient stone",
  "云冈石窟": "Buddhist grottoes with stone Buddha statues, ancient Northern Wei style",
  "拙政园": "Humble Administrator's Garden with classical pavilions, lotus pond, scholar's rocks",
  "平遥古城": "ancient walled city with grey brick walls, traditional courtyard houses, lanterns",
  "丽江古城": "old town with stone canals, red lanterns, wooden houses, snow-capped mountain backdrop",
  "都江堰": "ancient water conservation system, fish mouth levee, rushing water through bamboo forest",
  "灵渠": "ancient canal with stone locks, boats passing through, karst mountains",
  "大运河": "grand canal with merchant boats, ancient docks, waterway through cities",
  "赵州桥": "ancient stone arch bridge with open spandrels, reflection in calm water",
  "应县木塔": "ancient wooden pagoda towering over the plain, intricate bracket sets",
  "黄鹤楼": "yellow crane tower by Yangtze river, poets writing farewell poems",
  "岳阳楼": "Yueyang tower on Dongting lake, misty waters, scholars climbing stairs",
  "滕王阁": "Tengwang pavilion by Gan river, sunset glow, banquet scene",
  "蓬莱阁": "Penglai pavilion on seacliff, mist and waves, mythical immortal mountain",
  "西湖": "West Lake with three pagodas reflected in water, willows, distant mountains",
  "雷峰塔": "Leifeng pagoda by West Lake at sunset, white snake legend atmosphere",
  "白塔": "white pagoda on hilltop, blue sky, sacred Buddhist architecture",
  "悬空寺": "hanging temple on cliff face, wooden beams supporting it, dramatic mountain",

  // 诗词作品
  "将进酒": "grand Tang feast with overflowing golden wine, jade cups, robed poets toasting, river of stars",
  "静夜思": "lone traveler awake in moonlight, white frost at the foot of bed, distant homeland",
  "春晓": "a few petals drifting in gentle wind, a bird singing at dawn, spring garden",
  "登鹳雀楼": "white stork tower at sunset, vast river flowing to the sea, layered mountains",
  "望庐山瀑布": "towering waterfall cascading from misty green mountain, rainbow in spray",
  "水调歌头": "bright moon in night sky, Su Dongpo with wine cup, dancing shadows, yearning for home",
  "如梦令": "drunken woman remembering petal-strewn path after rain, hazy mood, delicate flowers",
  "声声慢": "autumn dusk, yellow flowers on ground, cold curtain, lonely woman with wine",
  "定风波": "wind and rain drenching a bamboo hat-wearing poet, misty mountain path, calm smile",
  "念奴娇": "great river and cliffs, red cliffs of Chibi, hero in armor, river of stars",
  "赤壁赋": "red cliffs by great river, Su Shi and friend on a boat under moon, philosophical mood",
  "琵琶行": "pipa player in a boat by river, autumn moon, weeping audience",
  "长恨歌": "palace garden at night, Yang Guifei in red robes under plum blossoms, eternal love",
  "桃花源记": "idyllic hidden valley with peach blossoms, simple villagers, peaceful streams",
  "岳阳楼记": "tower by vast lake, Fan Zhongyan gazing at autumn waters, scholarly concern",
  "滕王阁序": "grand pavilion by river, Wang Bo at banquet, sunset over landscape",
  "出师表": "Zhuge Liang kneeling before young emperor, candlelit, scrolls and seals",
  "兰亭集序": "scholars by winding stream, floating wine cups, calligraphy competition",
  "归去来兮辞": "Tao Yuanming with hoe in hand, chrysanthemums by fence, rural mountain home",
  "醉翁亭记": "Ouyang Xiu drinking with friends in mountain pavilion, streams and forests",
  "陋室铭": "scholar in simple study with qin and books, mountain view through window",
  "爱莲说": "lotus pond in full bloom, scholar in white robes admiring pure flowers",
  "岳阳楼": "Yueyang tower on Dongting lake, misty waters",
  "滕王阁": "Tengwang pavilion by Gan river, sunset glow",
  "黄鹤楼": "yellow crane tower by Yangtze river, misty waters",
  "清明": "willow branches swaying, light drizzle, people with flowers",
  "九月九日": "chrysanthemum flowers, golden autumn mountains",
  "咏鹅": "white geese floating in green water on red lotus pond, child watching",
  "静夜": "lone figure in moonlit garden, white frost, silver moonlight",
  "春江花月夜": "spring river under full moon, flowers in bloom, fisherman on boat",
  "登高": "scholar on mountain peak, autumn wind, vast sky",
  "九月": "chrysanthemum flowers, autumn mountains",
  "咏柳": "willow tree with fresh green branches swaying in spring breeze",
  "咏鹅": "white geese floating in green water, child watching",
  "春望": "war-torn capital in spring, broken walls, white-haired poet",
  "绝句": "two yellow orioles in green willow, white egrets on blue sky",
  "江雪": "lone fisherman in snow on river, vast empty landscape, ancient cold",

  // 典籍
  "论语": "bamboo slips unrolled on a wooden desk, scholarly study room, candle, books",
  "道德经": "Laozi riding a green ox, yin-yang symbol carved in stone, misty valley",
  "诗经": "willow branch, peach blossom, ancient verse scroll, young woman gathering plants",
  "楚辞": "orchid petals floating on river, poet in elaborate robes with feathered hat",
  "史记": "Sima Qian with brush and bamboo slips, library of bamboo scrolls, candle light",
  "易经": "hexagram pattern carved in jade, yin-yang fish, ancient bronze divination tools",
  "黄帝内经": "ancient medical text on bamboo, meridian diagram on body, moxibustion and herbs",
  "山海经": "mythical creatures in a vast landscape, nine-tailed fox, phoenix, dragon turtle",
  "孙子兵法": "bamboo slips with military diagrams, strategist with fan, flags and tents",
  "天工开物": "ancient workshop with craftsmen making porcelain, water-powered trip hammer, plow",
  "本草纲目": "apothecary with hundreds of herb drawers, dried herbs, traditional pharmacy",
  "水经注": "ancient geography with river maps, scholars studying water systems",
  "梦溪笔谈": "Song dynasty scholar in study with astronomical instruments, scientific instruments",
  "齐民要术": "ancient agricultural treatise, farming tools, seed samples",
  "贞观政要": "Tang emperor and ministers in court, scrolls of political wisdom",
  "资治通鉴": "vast chronicle of history, scholars in imperial library, lamp light",
  "金刚经": "Buddhist sutra on golden scroll, temple interior, golden light",
  "心经": "Buddhist heart sutra, meditation, lotus, candle",
  "法华经": "Lotus sutra, Buddhist temple, monks chanting",
  "坛经": "Huineng teaching under a tree, simple robes, disciples listening",
  "六祖坛经": "Huineng teaching under a tree, simple robes, disciples listening",
  "庄子": "philosopher dreaming of butterfly, mountain stream, free spirit",
  "列子": "Daoist sage in mountain hut, philosophical writings",
  "韩非子": "Legalist scholar in stern robes, bamboo slips on legal codes",
  "墨子": "craftsman with wooden mechanical device, geometric tools, ink writing",
  "荀子": "philosopher in scholar robes, bamboo slips, wise expression",
  "管子": "statesman in ancient robes, scrolls of economic policy",

  // 思想
  "禅": "monk in grey robe sitting in meditation under ancient pine, mist, stone lantern",
  "佛教": "golden Buddha statue in red temple, incense spirals, lotus flowers, golden light",
  "道教": "Taoist sage in star robe, yin-yang diagram, peach of immortality, flying crane",
  "儒家": "Confucius teaching in a courtyard, disciples with bamboo scrolls, ancient academy",
  "墨家": "craftsman with wooden mechanical device, geometric tools, ink writing",
  "法家": "Han Feizi in stern robes, bamboo slips on legal codes, scales of justice",
  "阴阳": "yin-yang diagram carved in jade, dual spiral, mountain and water",
  "五行": "five elements wood fire earth metal water, ritual bronze vessels",
  "八卦": "bagua trigrams carved in stone, ancient cosmology",
  "太极": "taiji yin-yang symbol in flowing mist, cosmic harmony",

  // 饮食
  "茶": "steaming tea in a purple clay teapot, bamboo whisk, ancient tea house, mountain mist",
  "茶叶": "tea plants on misty mountain slope, tea picker with bamboo basket, fresh green leaves",
  "酒": "ceramic wine jar, amber wine pouring, plum blossom branch, scholar's drinking cup",
  "白酒": "ceramic jar of baijiu, white porcelain, warm glow",
  "黄酒": "amber rice wine, ceramic warming vessel, scholar at table",
  "葡萄酒": "grape vines with purple clusters, Tang dynasty wine vessels",
  "茅台": "baijiu distillery with red ceramic jars, Maotai town",
  "火锅": "steaming copper hotpot with chili peppers, wooden table, families gathered",
  "饺子": "dumpling folding scene, bamboo steamer, dough and filling, family at table",
  "月饼": "round mooncake with intricate pattern, osmanthus flowers, moon in background",
  "粽子": "zongzi wrapped in bamboo leaves, dragon boat in background",
  "烤鸭": "Peking duck hanging in red oven, glistening crispy skin, sliced pieces on plate",
  "豆腐": "fresh white tofu on a stone slab, mountain stream, simple kitchen",
  "筷子": "elegant red and gold chopsticks, banquet setting, traditional table",
  "瓷器": "blue and white porcelain, kiln fire, master craftsman painting",
  "八大菜系": "various Chinese dishes on a banquet table, regional cuisine spread",
  "川菜": "Sichuan hotpot with red chili peppers, steaming wok",
  "鲁菜": "northern Chinese banquet dishes, elegant presentation",
  "粤菜": "Cantonese dim sum in bamboo steamers, tea service",
  "江浙菜": "Jiangsu Zhejiang dishes, sweet and light, elegant presentation",
  "闽菜": "Fujian dishes with seafood, southern Chinese flavor",

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
  "八仙": "Eight Immortals crossing the sea on different magical objects, waves",
  "灶神": "kitchen god in red robe, ascending in smoke to heaven",
  "门神": "two fierce door gods in armor, holding weapons, painted on temple doors",
  "阎王": "King Yama in dark robes in underworld, judgment hall, scrolls of life and death",
  "龙王": "Dragon King in imperial robes, underwater palace, coral and pearls",
  "观音": "Guanyin bodhisattva in white robes, holding vase, standing on lotus",
  "弥勒": "Maitreya Buddha with big smile, bare belly, sitting on ground",
  "罗汉": "Arhat disciples of Buddha, varied expressions, temple setting",

  // 艺术
  "京剧": "Peking opera performer in elaborate headdress and red costume, painted face, stage",
  "昆曲": "Kunqu opera performer in silk robes with fan, classical stage, moonlit garden",
  "皮影戏": "shadow puppet silhouettes on white screen, colorful puppets, lamp light",
  "剪纸": "red paper-cut design of phoenix and flowers, intricate patterns, scissors",
  "刺绣": "embroidered silk with peony and phoenix, needle and colorful threads",
  "苏绣": "Suzhou embroidery with peacock and flowers, fine silk threads, skilled hands",
  "湘绣": "Hunan embroidery with tiger or lion, vivid colors, dense stitching",
  "粤绣": "Guangdong embroidery with phoenix and flowers, vibrant colors",
  "蜀绣": "Sichuan embroidery, intricate silk work, traditional patterns",
  "青花瓷": "blue and white porcelain vase with dragon pattern, hand painting, kiln fire",
  "紫砂壶": "purple clay teapot with bamboo pattern, tea ceremony, scholar's desk",
  "玉雕": "jade carving of dragon, craftsman with tools, translucent green stone",
  "文房四宝": "the four treasures of study - brush, ink, paper, ink stone, arranged on desk",
  "毛笔": "traditional Chinese writing brush, ink, scrolls, scholar's desk",
  "砚台": "ink stone with carved patterns, scholar grinding ink",
  "书法": "calligrapher's hand holding brush writing large characters, ink stone, scroll",
  "中国画": "classical Chinese landscape painting in progress, mountain and water, mist",
  "山水画": "majestic mountain landscape painting, misty peaks, flowing water, scholar painting",
  "花鸟画": "bird perched on plum branch, peony flowers, traditional Chinese painting",
  "年画": "New Year picture with chubby baby and auspicious symbols, red and gold",
  "蜡染": "wax-resist dyeing with blue patterns on cloth, ethnic minority craft",
  "扎染": "tie-dye fabric with intricate blue patterns, hands tying knots",
  "风筝": "colorful kites flying in spring sky, dragon kite, butterfly kite",
  "铁画": "iron paintings of bamboo and plum, black metal silhouette, traditional Anhui craft",
  "竹编": "bamboo weaving of baskets and containers, skilled hands, green bamboo",
  "泥塑": "clay sculpture of Buddha or folk figure, colored, craftsman at work",
  "面人": "dough figurine sculpture, folk art, colorful characters",
  "唐三彩": "Tang tri-color ceramic horse, three-color glaze, ancient tomb artifact",
  "漆器": "red lacquerware with mother-of-pearl inlay, intricate patterns, craftsman at work",
  "青铜": "bronze ritual vessel with taotie pattern, ancient sacrificial ceremony",
  "玉器": "jade bi disc with dragon pattern, translucent green, ancient noble",
  "丝绸": "silk weaver at loom, colorful brocade emerging, mulberry trees",
  "旗袍": "elegant qipao dress in red silk, traditional tailoring",

  // 音乐
  "古琴": "scholar playing guqin on a mountain pavilion, flowing water, pine trees",
  "琵琶": "lady in Tang dress playing pipa, pear blossoms falling, palace interior",
  "二胡": "erhu player with sad melody, autumn moon, old man with white beard",
  "笛子": "scholar playing bamboo flute on a bridge over stream, moonlit night",
  "编钟": "bronze bell chime set, ancient ritual music, grand hall, ceremonial scene",
  "箫": "xiao flute player in bamboo grove, morning mist, peaceful meditation",
  "古筝": "guzheng player in flowing silk robes, mountain backdrop, gentle plucking",
  "扬琴": "yangqin hammered dulcimer, ensemble performance",
  "唢呐": "suona player at festival, bright red instrument, festive scene",
  "笙": "sheng mouth organ, traditional Chinese orchestra",
  "埙": "xun clay ocarina, ancient wind instrument, mountains",
  "古乐": "ancient Chinese music performance, traditional instruments ensemble",

  // 武术
  "武术": "kung fu master in martial stance, red sash, mountain temple",
  "太极拳": "tai chi master in white robes performing slow form, misty park",
  "少林": "Shaolin monks training in temple courtyard, wooden dummies, autumn leaves",
  "武当": "Wudang martial arts on misty mountain, sword forms",
  "咏春": "wing chun master training wooden dummy, simple studio",
  "形意": "xingyi martial arts, powerful stances, traditional uniform",
  "八卦掌": "bagua zhang practitioner walking the circle, fluid movement",
  "气功": "qigong master in meditation, internal energy visualization",
  "易筋经": "yijin jing muscle-tendon changing exercises, monastery training",
  "五禽戏": "five animal qigong, mimicking tiger deer bear monkey bird",
  "八段锦": "eight pieces of brocade qigong, gentle exercise in park",
  "剑": "scholar with jade sword, mountain stream, literary martial arts",
  "刀": "warrior with broadsword, dramatic pose, wind blowing",
  "弓": "archer drawing bow, mountain background, traditional armor",

  // 古代科技
  "四大发明": "papermaking printing gunpowder compass, ancient Chinese inventions",
  "造纸术": "papermaking process, mulberry bark soaking, craftsman at work",
  "印刷术": "movable type printing, blocks arranged, scholar printing pages",
  "火药": "ancient gunpowder mixture, alchemist with mortar and pestle",
  "指南针": "ancient si nan compass, lodestone spoon on bronze plate",
  "丝绸之路": "silk road camel caravan through desert, distant mountains",
  "瓷器之路": "porcelain cargo ship on southern sea route, blue and white vases",
  "茶马古道": "tea horse road in mountain jungle, horse caravan with tea bales",
  "都江堰": "ancient water conservation system, fish mouth levee",
  "灵渠": "ancient canal with stone locks, boats passing through",
  "水排": "water-powered bellows, ancient metallurgy, river wheel",
  "水转大纺车": "water-powered spinning wheel, ancient textile machinery",
  "浑天仪": "armillary sphere, Zhang Heng astronomical instrument",
  "地动仪": "Zhang Heng's seismoscope, dragon heads with balls, Han dynasty",
  "候风地动仪": "Zhang Heng's seismoscope, dragon heads with balls, Han dynasty",
  "简仪": "Shen Kuo's simplified astronomical instrument, observatory",
  "水运仪象台": "Su Song's astronomical clock tower, complex water-driven mechanism",
  "活字印刷": "Bi Sheng's movable clay type printing, characters in tray",
  "司南": "ancient si nan magnetic compass, bronze spoon on square plate",

  // 服饰
  "汉服": "Han dynasty clothing, wide sleeves, crossed collar, flowing robes",
  "唐装": "Tang dynasty clothing, elaborate hairstyle, silk robes",
  "旗袍": "qipao dress in red silk, elegant tailoring, traditional beauty",
  "冕服": "imperial ceremonial dress, mian crown with beads, ritual robes",
  "凤冠": "phoenix crown of empress, elaborate hair ornament, gold and jade",
  "霞帔": "colorful ceremonial shawl of noblewoman, official court dress",
  "官服": "official mandarin robes with rank badges, court dress",
  "铠甲": "warrior armor, scale pattern, helmet with plume",
  "布鞋": "traditional cloth shoes, embroidered, old style footwear",
  "丝绸": "silk weaver at loom, colorful brocade emerging, mulberry trees",
  "刺绣": "embroidered silk with peony and phoenix, needle and threads",

  // 中医
  "中医": "traditional Chinese medicine, herbalist with dried herbs, acupuncture",
  "针灸": "acupuncture needles, meridian diagram on body, traditional clinic",
  "推拿": "tui na massage, hands on back, traditional therapy",
  "太极拳": "tai chi master in white robes performing slow form",
  "五禽戏": "five animal qigong, mimicking tiger deer bear monkey bird",
  "气功": "qigong master in meditation, internal energy",
  "中药": "Chinese medicine cabinet with hundreds of drawers, dried herbs",
  "拔罐": "cupping therapy, glass cups on back, traditional Chinese medicine",
  "艾灸": "moxibustion, burning mugwort on skin, meridian points",
  "脉诊": "pulse diagnosis, doctor feeling patient's wrist, traditional clinic",
  "经络": "meridian system on body, acupuncture points, traditional chart",
  "阴阳": "yin-yang symbol, dual forces, balance",
  "五行": "five elements wood fire earth metal water, philosophy",
  "黄帝内经": "ancient medical text, meridian diagram on body",
  "本草纲目": "apothecary with hundreds of herb drawers",
  "伤寒论": "ancient medical text, herbs and prescriptions",
  "神农本草": "Shennong tasting herbs, basket of plants, mountain forest",
};

// 按 category 给一个默认视觉风格
const CATEGORY_DEFAULT_HINT = {
  "figures": "a historical Chinese figure in appropriate dynasty robes, dignified, portrait composition",
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
  "kungfu": "kung fu martial arts practitioner in stance, traditional uniform, mountain or temple",
  "medicine": "traditional Chinese medicine setting, herbs, instruments, scholar physician",
  "invention": "ancient Chinese invention or craft being made, workshop setting, tools and materials",
  "default": "traditional Chinese cultural scene with characteristic elements, elegant composition",
};

function pickSubjectHint(title) {
  if (!title) return null;
  // 优先精确匹配整词 (按字典顺序, 长的先匹配, 避免 "李" 抢 "李白")
  const keys = Object.keys(SUBJECT_HINTS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (title.includes(key)) return SUBJECT_HINTS[key];
  }
  return null;
}

export function buildPrompt(article) {
  const subjectHint = pickSubjectHint(article.title);

  // category 兜底
  const catRaw = (article.sub_category || article.category || "").toLowerCase();
  let categoryHint = CATEGORY_DEFAULT_HINT["default"];
  for (const k of Object.keys(CATEGORY_DEFAULT_HINT)) {
    if (catRaw.includes(k)) {
      categoryHint = CATEGORY_DEFAULT_HINT[k];
      break;
    }
  }

  // mood 从 excerpt 抽
  const moodHint = article.excerpt
    ? article.excerpt.slice(0, 120).replace(/[\r\n]+/g, " ")
    : "";

  const subject = subjectHint
    ? subjectHint
    : `${article.title}, ${categoryHint}`;

  return [
    `EMPTY TEXT IMAGE - PAINTING ONLY, NO WRITING OF ANY KIND.`,
    `Traditional Chinese cultural painting in the style of meticulous gongbi, depicting:`,
    `Subject: ${subject}.`,
    `Atmosphere: ${moodHint || "classical Chinese cultural atmosphere"}.`,
    `Style: rich cultural detail, warm color palette with traditional Chinese pigments (vermillion, malachite green, ochre, ink black, gold leaf), elegant composition with foreground subject and atmospheric background, soft lighting, no harsh shadows.`,
    `CRITICAL: this is a pure visual painting. NEVER include any Chinese characters, NO text, NO letters, NO writing, NO calligraphy, NO inscriptions, NO captions, NO labels, NO watermarks, NO signatures, NO seals, NO stamps, NO poetic couplets, NO banners with text, NO scrolls with text, NO books with readable pages. All surfaces including walls, scrolls, clothing, banners, sky must be completely free of any written marks, glyphs, or character-like shapes. If you would normally add a poem or signature, leave that area as blank paper or plain silk instead.`,
    `Aspect ratio 4:3, museum quality, ultra high detail, masterpiece illustration.`,
  ].join(" ");
}
