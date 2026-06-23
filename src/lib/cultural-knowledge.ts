export interface Quote {
  text: string;
  title: string;
  author: string;
  dynasty: string;
}

export interface Source {
  title: string;
  type: 'book' | 'database' | 'website';
  url?: string;
  isBook?: boolean;
}

export interface Person {
  name: string;
  dynasty: string;
  birthYear?: string;
  deathYear?: string;
  description: string;
  achievements: string[];
  works: string[];
}

export interface Book {
  title: string;
  dynasty: string;
  author?: string;
  content: string;
  summary: string;
  chapters?: string[];
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'concept' | 'book' | 'person' | 'quote' | 'event';
  description?: string;
  connections?: string[];
}

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  quotes: Quote[];
  sources: Source[];
  interpretations?: string;
  scholarAnalysis?: string;
  graphNodes?: KnowledgeGraphNode[];
}

export const persons: Record<string, Person> = {
  "毛亨": {
    name: "毛亨",
    dynasty: "汉代",
    description: "毛亨，生卒年不详，是西汉时期的学者，相传是古文诗学毛诗学的开创者。他与毛苌一起被称为大小毛公。他整理并注释《诗经》，形成《毛诗故训传》，对《诗经》的传承和研究影响深远。",
    achievements: ["整理并注释《诗经》，形成《毛诗故训传》", "开创古文诗学流派", "对《诗经》的传承和研究影响深远"],
    works: ["《毛诗故训传》"]
  },
  "毛苌": {
    name: "毛苌",
    dynasty: "汉代",
    description: "毛苌，西汉著名学者，师从毛亨，继承并传播毛诗学，世称小毛公。他曾在河间国教授《诗经》，使毛诗学得以流传后世。",
    achievements: ["继承传播毛诗学", "教授《诗经》于河间", "与毛亨并称大小毛公"],
    works: ["《毛诗故训传》"]
  },
  "李白": {
    name: "李白",
    dynasty: "唐代",
    birthYear: "701年",
    deathYear: "762年",
    description: "李白，字太白，号青莲居士，又号谪仙人，唐代伟大的浪漫主义诗人，被后人誉为诗仙。他出生于碎叶，幼年随家人迁居四川绵竹。他的诗想象奇特，感情豪迈，充满浪漫主义色彩。",
    achievements: ["创作大量优秀诗篇，风格豪放飘逸", "开创浪漫主义诗歌高峰", "与杜甫并称李杜，代表唐诗最高成就", "被誉为诗仙，影响后世文学深远"],
    works: ["《李太白集》", "《将进酒》", "《静夜思》", "《蜀道难》", "《早发白帝城》", "《行路难》"]
  },
  "杜甫": {
    name: "杜甫",
    dynasty: "唐代",
    birthYear: "712年",
    deathYear: "770年",
    description: "杜甫，字子美，号少陵野老，唐代伟大的现实主义诗人。他忧国忧民，诗作深刻反映社会现实，被称为诗圣。他的诗作风格沉郁顿挫，与李白并称李杜。",
    achievements: ["开创现实主义诗歌传统", "被誉为诗圣", "与李白并称李杜", "留下诗作一千四百余首"],
    works: ["《杜工部集》", "《春望》", "《茅屋为秋风所破歌》", "《三吏》", "《三别》"]
  },
  "白居易": {
    name: "白居易",
    dynasty: "唐代",
    birthYear: "772年",
    deathYear: "846年",
    description: "白居易，字乐天，号香山居士，唐代伟大的现实主义诗人。他提出文章合为时而著，歌诗合为事而作的主张，诗作通俗易懂，老妪能解。",
    achievements: ["倡导新乐府运动", "诗作通俗易懂，流传广泛", "与元稹并称元白", "文学成就涵盖诗、词、文、赋"],
    works: ["《白氏长庆集》", "《长恨歌》", "《琵琶行》", "《赋得古原草送别》"]
  },
  "苏轼": {
    name: "苏轼",
    dynasty: "宋代",
    birthYear: "1037年",
    deathYear: "1101年",
    description: "苏轼，字子瞻，号东坡居士，北宋著名文学家、书法家、画家，唐宋八大家之一。他才华横溢，诗词文赋书画皆精，豁达乐观的人生态度影响了无数后人。",
    achievements: ["诗词文赋书画皆精", "开创豪放词派", "唐宋八大家之一", "影响后世文学深远"],
    works: ["《东坡全集》", "《水调歌头》", "《念奴娇·赤壁怀古》", "《前后赤壁赋》", "《定风波》"]
  },
  "王维": {
    name: "王维",
    dynasty: "唐代",
    birthYear: "701年",
    deathYear: "761年",
    description: "王维，字摩诘，号摩诘居士，唐代著名诗人、画家。他精通诗、书、画、音乐，苏轼评价味摩诘之诗，诗中有画；观摩诘之画，画中有诗，被尊为诗佛。",
    achievements: ["开创山水诗派", "诗中有画，画中有诗", "被尊为诗佛", "精通诗书画乐"],
    works: ["《王右丞集》", "《山居秋暝》", "《相思》", "《送元二使安西》", "《鸟鸣涧》"]
  },
  "陶渊明": {
    name: "陶渊明",
    dynasty: "东晋",
    birthYear: "365年",
    deathYear: "427年",
    description: "陶渊明，字元亮，号五柳先生，东晋著名诗人。他不满官场黑暗，辞官归隐，开创田园诗派，被尊为田园诗祖。他的桃花源理想影响深远。",
    achievements: ["开创田园诗派", "被尊为田园诗祖", "提出桃花源理想", "不为五斗米折腰"],
    works: ["《陶渊明集》", "《归去来兮辞》", "《桃花源记》", "《饮酒》", "《归园田居》"]
  },
  "屈原": {
    name: "屈原",
    dynasty: "战国",
    birthYear: "公元前340年",
    deathYear: "公元前278年",
    description: "屈原，名平，字原，楚国诗人、政治家。他忧国忧民，创立的楚辞体开辟了诗歌新天地，被誉为中华诗祖。端午节即源于纪念他。",
    achievements: ["创立楚辞体", "被誉为中华诗祖", "《离骚》成为中国文学瑰宝", "端午节纪念先驱"],
    works: ["《离骚》", "《九歌》", "《天问》", "《九章》", "《招魂》"]
  },
  "孔子": {
    name: "孔子",
    dynasty: "春秋",
    birthYear: "公元前551年",
    deathYear: "公元前479年",
    description: "孔子，名丘，字仲尼，春秋时期鲁国陬邑人，儒家学派创始人，被尊为至圣先师。他整理六经，开创私学，提倡仁义礼智，对中国传统文化产生深远影响。",
    achievements: ["创立儒家学派", "整理六经：《诗》《书》《礼》《易》《乐》《春秋》", "开创私学，有弟子三千", "提出仁为核心的思想体系"],
    works: ["《论语》", "《春秋》", "《诗经》整理", "《礼记》整理"]
  },
  "老子": {
    name: "老子",
    dynasty: "春秋",
    description: "老子，姓李名耳，字聃，春秋时期思想家，道家学派创始人。相传他西出函谷关时，应关令尹喜之请，著《道德经》五千言。",
    achievements: ["创立道家学派", "著有《道德经》", "思想影响中国哲学发展", "对世界哲学产生深远影响"],
    works: ["《道德经》"]
  },
  "庄子": {
    name: "庄子",
    dynasty: "战国",
    birthYear: "公元前369年",
    deathYear: "公元前286年",
    description: "庄子，名周，战国时期道家学派的代表人物，与老子并称老庄。他的哲学思想追求精神自由，文章想象奇特，汪洋恣肆。",
    achievements: ["发展道家学派思想", "与老子并称老庄", "追求精神自由", "《庄子》成为道家经典"],
    works: ["《庄子》", "《逍遥游》", "《齐物论》", "《养生主》"]
  },
  "孟子": {
    name: "孟子",
    dynasty: "战国",
    birthYear: "公元前372年",
    deathYear: "公元前289年",
    description: "孟子，名轲，字子舆，战国时期儒家学派代表人物，被尊为亚圣。他继承并发展孔子思想，提出性善论和民本思想。",
    achievements: ["继承发展孔子思想", "被尊为亚圣", "提出性善论", "提出民为贵，社稷次之，君为轻"],
    works: ["《孟子》"]
  },
  "荀子": {
    name: "荀子",
    dynasty: "战国",
    birthYear: "公元前313年",
    deathYear: "公元前238年",
    description: "荀子，名况，字卿，战国时期儒家学派代表人物。他提出性恶论，主张礼法兼治，培养了韩非、李斯等法家人物。",
    achievements: ["提出性恶论", "主张礼法兼治", "培养韩非、李斯等法家人物", "《荀子》为儒家重要典籍"],
    works: ["《荀子》"]
  },
  "韩愈": {
    name: "韩愈",
    dynasty: "唐代",
    birthYear: "768年",
    deathYear: "824年",
    description: "韩愈，字退之，唐代文学家、思想家，唐宋八大家之首。他倡导古文运动，提出文以载道主张，被尊为百代文宗。",
    achievements: ["倡导古文运动", "被尊为百代文宗", "唐宋八大家之首", "提出文以载道主张"],
    works: ["《昌黎先生集》", "《师说》", "《进学解》", "《原道》"]
  },
  "柳宗元": {
    name: "柳宗元",
    dynasty: "唐代",
    birthYear: "773年",
    deathYear: "819年",
    description: "柳宗元，字子厚，唐代文学家、哲学家，唐宋八大家之一。他与韩愈共同倡导古文运动，山水游记成就极高。",
    achievements: ["与韩愈倡导古文运动", "唐宋八大家之一", "山水游记成就极高", "哲学上提出元气说"],
    works: ["《柳河东集》", "《永州八记》", "《捕蛇者说》", "《黔之驴》"]
  },
  "李清照": {
    name: "李清照",
    dynasty: "宋代",
    birthYear: "1084年",
    deathYear: "约1155年",
    description: "李清照，号易安居士，宋代著名女词人。她婉约词派的代表人物，前期词作清新秀丽，后期词作感伤沉郁，被誉为千古第一才女。",
    achievements: ["婉约词派代表人物", "被誉为千古第一才女", "提出词别是一家理论", "词作兼擅豪放婉约"],
    works: ["《漱玉词》", "《如梦令》", "《声声慢》", "《一剪梅》"]
  },
  "辛弃疾": {
    name: "辛弃疾",
    dynasty: "宋代",
    birthYear: "1140年",
    deathYear: "1207年",
    description: "辛弃疾，字幼安，号稼轩，南宋豪放派词人。他一生以恢复中原为志，词作慷慨激昂，充满爱国热情，与苏轼并称苏辛。",
    achievements: ["豪放派词人代表", "与苏轼并称苏辛", "词作充满爱国热情", "文武双全的抗金英雄"],
    works: ["《稼轩长短句》", "《破阵子》", "《永遇乐·京口北固亭怀古》", "《青玉案·元夕》"]
  },
  "岳飞": {
    name: "岳飞",
    dynasty: "宋代",
    birthYear: "1103年",
    deathYear: "1142年",
    description: "岳飞，字鹏举，南宋抗金名将，民族英雄。他精忠报国，率领岳家军抗金，功勋卓著，后被奸臣秦桧陷害而死。",
    achievements: ["抗金名将，组建岳家军", "精忠报国的民族英雄", "收复建康、襄阳等失地", "《满江红》激励后世"],
    works: ["《满江红》", "《岳飞集》"]
  },
  "陆游": {
    name: "陆游",
    dynasty: "宋代",
    birthYear: "1125年",
    deathYear: "1210年",
    description: "陆游，字务观，号放翁，南宋著名诗人。他一生忧国忧民，诗作充满爱国激情，是中国文学史上存诗最多的诗人之一。",
    achievements: ["存诗近万首，中国文学史存诗最多者之一", "诗作充满爱国激情", "词作、散文成就也很高", "与王安石、苏轼、黄庭坚并称宋代四大诗人"],
    works: ["《剑南诗稿》", "《渭南文集》", "《示儿》", "《卜算子·咏梅》"]
  }
};

export const books: Record<string, Book> = {
  "毛诗序": {
    title: "毛诗序",
    dynasty: "汉代",
    author: "毛亨",
    summary: "《毛诗序》是汉代毛亨为《诗经》所作的序言，是中国古代诗论的重要文献。它系统阐述了诗歌的本质、功能和分类，对后世诗论产生了深远影响。",
    content: "《毛诗序》曰：诗者，志之所之也，在心为志，发言为诗。情动于中而形于言，言之不足故嗟叹之，嗟叹之不足故永歌之，永歌之不足，不知手之舞之，足之蹈之也。\n\n情发于声，声成文谓之音。治世之音安以乐，其政和；乱世之音怨以怒，其政乖；亡国之音哀以思，其民困。故正得失，动天地，感鬼神，莫近于诗。\n\n先王以是经夫妇，成孝敬，厚人伦，美教化，移风俗。\n\n故诗有六义焉：一曰风，二曰赋，三曰比，四曰兴，五曰雅，六曰颂。上以风化下，下以风刺上，主文而谲谏，言之者无罪，闻之者足以戒，故曰风。\n\n至于王道衰，礼义废，政教失，国异政，家殊俗，而变风变雅作矣。国史明乎得失之迹，伤人伦之废，哀刑政之苛，吟咏情性，以风其上，达于事变而怀其旧俗者也。\n\n颂者，美盛德之形容，以其成功告于神明者也。是谓四始，诗之至也。",
    chapters: ["大序", "小序", "诗六义", "变风变雅"]
  },
  "论语": {
    title: "论语",
    dynasty: "春秋",
    summary: "《论语》是记录孔子及其弟子言行的儒家经典著作，共二十篇。它是儒家学派的奠基之作，集中体现了孔子的政治主张、伦理思想和教育原则。",
    content: "子曰：学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？\n\n子曰：君子务本，本立而道生。孝弟也者，其为仁之本与！\n\n子曰：巧言令色，鲜矣仁！\n\n子曰：吾十有五而志于学，三十而立，四十而不惑，五十而知天命，六十而耳顺，七十而从心所欲，不逾矩。\n\n子曰：温故而知新，可以为师矣。\n\n子曰：学而不思则罔，思而不学则殆。\n\n子曰：知之为知之，不知为不知，是知也。\n\n子曰：三人行，必有我师焉：择其善者而从之，其不善者而改之。\n\n子曰：仁远乎哉？我欲仁，斯仁至矣。\n\n子曰：己所不欲，勿施于人。\n\n子曰：己欲立而立人，己欲达而达人。\n\n子曰：君子成人之美，不成人之恶。小人反是。\n\n子曰：名不正则言不顺，言不顺则事不成，事不成则礼乐不兴，礼乐不兴则刑罚不中，刑罚不中则民无所措手足。",
    chapters: ["学而第一", "为政第二", "八佾第三", "里仁第四", "公冶长第五", "雍也第六", "述而第七", "泰伯第八", "子罕第九", "乡党第十", "先进第十一", "颜渊第十二", "子路第十三", "宪问第十四", "卫灵公第十五", "季氏第十六", "阳货第十七", "微子第十八", "子张第十九", "尧曰第二十"]
  },
  "道德经": {
    title: "道德经",
    dynasty: "春秋",
    author: "老子",
    summary: "《道德经》又称《老子》，是道家学派的经典著作，共八十一章。它以道为核心，阐述宇宙本源、政治哲学、人生修养等思想，对中国乃至世界哲学产生了深远影响。",
    content: "第一章：道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲以观其妙，常有欲以观其徼。此两者同出而异名，同谓之玄，玄之又玄，众妙之门。\n\n第三章：不尚贤，使民不争；不贵难得之货，使民不为盗；不见可欲，使民心不乱。是以圣人之治，虚其心，实其腹；弱其志，强其骨。常使民无知无欲，使夫智者不敢为也。为无为，则无不治。\n\n第五章：天地不仁，以万物为刍狗；圣人不仁，以百姓为刍狗。天地之间，其犹橐籥乎？虚而不屈，动而愈出。多言数穷，不如守中。\n\n第八章：上善若水。水善利万物而不争，处众人之所恶，故几于道。居善地，心善渊，与善仁，言善信，政善治，事善能，动善时。夫唯不争，故无尤。\n\n第十二章：五色令人目盲，五音令人耳聋，五味令人口爽，驰骋畋猎令人心发狂，难得之货令人行妨。是以圣人为腹不为目，故去彼取此。\n\n第十五章：古之善为士者，微妙玄通，深不可识。夫唯不可识，故强为之容：豫兮若冬涉川，犹兮若畏四邻，俨兮其若客，涣兮若冰之将释，敦兮其若朴，旷兮其若谷，混兮其若浊。孰能浊以静之徐清？孰能安以久动之徐生？保此道者不欲盈。夫唯不盈，故能蔽不新成。\n\n第十六章：致虚极，守静笃。万物并作，吾以观复。夫物芸芸，各复归其根。归根曰静，是谓复命。复命曰常，知常曰明。不知常，妄作凶。知常容，容乃公，公乃王，王乃天，天乃道，道乃久，没身不殆。\n\n第二十二章：曲则全，枉则直，洼则盈，敝则新，少则得，多则惑。是以圣人抱一为天下式。不自见故明，不自是故彰，不自伐故有功，不自矜故长。夫唯不争，故天下莫能与之争。\n\n第二十五章：有物混成，先天地生。寂兮寥兮，独立不改，周行而不殆，可以为天下母。吾不知其名，字之曰道，强为之名曰大。大曰逝，逝曰远，远曰返。故道大，天大，地大，王亦大。域中有四大，而王居其一焉。人法地，地法天，天法道，道法自然。\n\n第三十三章：知人者智，自知者明。胜人者有力，自胜者强。知足者富，强行者有志。不失其所者久，死而不亡者寿。\n\n第四十七章：不出户，知天下；不窥牖，见天道。其出弥远，其知弥少。是以圣人不行而知，不见而名，不为而成。\n\n第五十六章：知者不言，言者不知。塞其兑，闭其门；挫其锐，解其纷；和其光，同其尘。是谓玄同。故不可得而亲，不可得而疏；不可得而利，不可得而害；不可得而贵，不可得而贱。故为天下贵。\n\n第六十四章：为之于未有，治之于未乱。合抱之木，生于毫末；九层之台，起于累土；千里之行，始于足下。为者败之，执者失之。是以圣人无为故无败，无执故无失。民之从事，常于几成而败之。慎终如始，则无败事。\n\n第八十一章：信言不美，美言不信。善者不辩，辩者不善。知者不博，博者不知。圣人不积，既以为人己愈有，既以与人己愈多。天之道，利而不害；圣人之道，为而不争。",
    chapters: ["道经", "德经"]
  },
  "诗经": {
    title: "诗经",
    dynasty: "周代",
    summary: "《诗经》是中国最早的诗歌总集，收录西周至春秋时期诗歌305篇，分为风、雅、颂三部分。它是中国古典文学的开端，被誉为《诗》三百，被列为儒家五经之一。",
    content: "《关雎》\n关关雎鸠，在河之洲。窈窕淑女，君子好逑。\n参差荇菜，左右流之。窈窕淑女，寤寐求之。\n求之不得，寤寐思服。悠哉悠哉，辗转反侧。\n参差荇菜，左右采之。窈窕淑女，琴瑟友之。\n参差荇菜，左右芼之。窈窕淑女，钟鼓乐之。\n\n《蒹葭》\n蒹葭苍苍，白露为霜。所谓伊人，在水一方。\n溯洄从之，道阻且长。溯游从之，宛在水中央。\n蒹葭萋萋，白露未晞。所谓伊人，在水之湄。\n溯洄从之，道阻且跻。溯游从之，宛在水中坻。\n蒹葭采采，白露未已。所谓伊人，在水之涘。\n溯洄从之，道阻且右。溯游从之，宛在水中沚。\n\n《采薇》\n昔我往矣，杨柳依依。今我来思，雨雪霏霏。\n行道迟迟，载渴载饥。我心伤悲，莫知我哀！\n\n《卫风·伯兮》\n伯兮朅兮，邦之桀兮。伯也执殳，为王前驱。\n自伯之东，首如飞蓬。岂无膏沐？谁适为容！\n其雨其雨，杲杲出日。愿言思伯，甘心首疾。\n焉得谖草？言树之背。愿言思伯，使我心痗。\n\n《王风·黍离》\n彼黍离离，彼稷之苗。行迈靡靡，中心摇摇。\n知我者，谓我心忧；不知我者，谓我何求。悠悠苍天，此何人哉？",
    chapters: ["国风", "小雅", "大雅", "颂"]
  },
  "将进酒": {
    title: "将进酒",
    dynasty: "唐代",
    author: "李白",
    summary: "《将进酒》是唐代诗人李白的代表作之一，描写了诗人豪放不羁的性格和对人生的感慨。此诗豪迈奔放，表达了诗人对怀才不遇的愤懑和及时行乐的旷达。",
    content: "君不见黄河之水天上来，奔流到海不复回。\n君不见高堂明镜悲白发，朝如青丝暮成雪。\n人生得意须尽欢，莫使金樽空对月。\n天生我材必有用，千金散尽还复来。\n烹羊宰牛且为乐，会须一饮三百杯。\n岑夫子，丹丘生，将进酒，杯莫停。\n与君歌一曲，请君为我倾耳听。\n钟鼓馔玉不足贵，但愿长醉不复醒。\n古来圣贤皆寂寞，惟有饮者留其名。\n陈王昔时宴平乐，斗酒十千恣欢谑。\n主人何为言少钱，径须沽取对君酌。\n五花马、千金裘，呼儿将出换美酒，\n与尔同销万古愁。",
    chapters: ["全诗一首"]
  },
  "水调歌头": {
    title: "水调歌头·明月几时有",
    dynasty: "宋代",
    author: "苏轼",
    summary: "《水调歌头》是苏轼的代表作，写于中秋佳节，表达了对亲人的思念和对人生的哲理思考。此词意境豁达，情理交融，是中秋词的绝唱。",
    content: "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。\n我欲乘风归去，又恐琼楼玉宇，高处不胜寒。\n起舞弄清影，何似在人间。\n\n转朱阁，低绮户，照无眠。不应有恨，何事长向别时圆？\n人有悲欢离合，月有阴晴圆缺，此事古难全。\n但愿人长久，千里共婵娟。",
    chapters: ["上阙：问月", "下阙：怀人"]
  },
  "离骚": {
    title: "离骚",
    dynasty: "战国",
    author: "屈原",
    summary: "《离骚》是屈原的代表作，是中国古代最长的抒情诗。它以自传体的形式，表达了诗人忧国忧民的爱国情怀和九死不悔的执着追求。",
    content: "帝高阳之苗裔兮，朕皇考曰伯庸。\n摄提贞于孟陬兮，惟庚寅吾以降。\n皇览揆余于初度兮，肇锡余以嘉名：\n名余曰正则兮，字余曰灵均。\n\n纷吾既有此内美兮，又重之以修能。\n扈江离与辟芷兮，纫秋兰以为佩。\n汩余若将不及兮，恐年岁之不吾与。\n朝搴阰之木兰兮，夕揽洲之宿莽。\n日月忽其不淹兮，春与秋其代序。\n唯草木之零落兮，恐美人之迟暮。\n\n长太息以掩涕兮，哀民生之多艰。\n余虽好修姱以鞿羁兮，謇朝谇而夕替。\n既替余以蕙纕兮，又申之以揽茝。\n亦余心之所善兮，虽九死其犹未悔。",
    chapters: ["离骚", "九歌", "天问", "九章", "招魂", "大招", "远游", "卜居", "渔父"]
  },
  "逍遥游": {
    title: "逍遥游",
    dynasty: "战国",
    author: "庄子",
    summary: "《逍遥游》是《庄子》的首篇，表达了庄子追求精神绝对自由的哲学思想。文中通过鲲鹏与蜩鸠的对比，说明了小大之辨，阐述了无功、无己、无名的逍遥境界。",
    content: "北冥有鱼，其名为鲲。鲲之大，不知其几千里也；化而为鸟，其名为鹏。鹏之背，不知其几千里也；怒而飞，其翼若垂天之云。是鸟也，海运则将徙于南冥。南冥者，天池也。\n\n《齐谐》者，志怪者也。《谐》之言曰：鹏之徙于南冥也，水击三千里，抟扶摇而上者九万里，去以六月息者也。野马也，尘埃也，生物之以息相吹也。天之苍苍，其正色邪？其远而无所至极邪？其视下也，亦若是则已矣。\n\n且夫水之积也不厚，则其负大舟也无力。覆杯水于坳堂之上，则芥为之舟，置杯焉则胶，水浅而舟大也。风之积也不厚，则其负大翼也无力。故九万里，则风斯在下矣，而后乃今培风；背负青天，而莫之夭阏者，而后乃今将图南。\n\n蜩与学鸠笑之曰：我决起而飞，抢榆枋而止，时则不至，而控于地而已矣，奚以之九万里而南为？适莽苍者，三餐而反，腹犹果然；适百里者，宿舂粮；适千里者，三月聚粮。之二虫又何知！\n\n小知不及大知，小年不及大年。奚以知其然也？朝菌不知晦朔，蟪蛄不知春秋，此小年也。楚之南有冥灵者，以五百岁为春，五百岁为秋；上古有大椿者，以八千岁为春，八千岁为秋，此大年也。而彭祖乃今以久特闻，众人匹之，不亦悲乎！",
    chapters: ["逍遥游"]
  },
  "孟子": {
    title: "孟子",
    dynasty: "战国",
    author: "孟子",
    summary: "《孟子》是记录孟子言行的儒家经典，共七篇十四卷。它系统阐述了孟子的性善论、民本思想和仁政主张，是儒家学说的重要著作。",
    content: "第一章：梁惠王章句上\n\n孟子见梁惠王。王曰：叟！不远千里而来，亦将有以利吾国乎？\n\n孟子对曰：王何必曰利？亦有仁义而已矣。王曰何以利吾国？大夫曰何以利吾家？士庶人曰何以利吾身？上下交征利而国危矣。\n\n万乘之国，弑其君者，必千乘之家；千乘之国，弑其君者，必百乘之家。万取千焉，千取百焉，不为不多矣。苟为后义而先利，不夺不餍。未有仁而遗其亲者也，未有义而后其君者也。\n\n王亦曰仁义而已矣，何必曰利？\n\n第二章：公孙丑上\n\n孟子曰：人皆有不忍人之心。先王有不忍人之心，斯有不忍人之政矣。以不忍人之心，行不忍人之政，治天下可运之掌上。\n\n所以谓人皆有不忍人之心者，今人乍见孺子将入于井，皆有怵惕恻隐之心。非所以内交于孺子之父母也，非所以要誉于乡党朋友也，非恶其声而然也。\n\n由是观之，无恻隐之心，非人也；无羞恶之心，非人也；无辞让之心，非人也；无是非之心，非人也。恻隐之心，仁之端也；羞恶之心，义之端也；辞让之心，礼之端也；是非之心，智之端也。人之有是四端也，犹其有四体也。",
    chapters: ["梁惠王章句上", "梁惠王章句下", "公孙丑章句上", "公孙丑章句下", "滕文公章句上", "滕文公章句下", "离娄章句上", "离娄章句下", "万章章句上", "万章章句下", "告子章句上", "告子章句下", "尽心章句上", "尽心章句下"]
  },
  "唐诗三百首": {
    title: "唐诗三百首",
    dynasty: "唐代",
    summary: "《唐诗三百首》是清代蘅塘退士编选的唐诗选本，共收录唐代诗人七十余位，诗作三百余首。它是流传最广、影响最大的唐诗选本之一。",
    content: "《静夜思》——李白\n床前明月光，疑是地上霜。\n举头望明月，低头思故乡。\n\n《春晓》——孟浩然\n春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。\n\n《相思》——王维\n红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。\n\n《登鹳雀楼》——王之涣\n白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。\n\n《江雪》——柳宗元\n千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。\n\n《游子吟》——孟郊\n慈母手中线，游子身上衣。\n临行密密缝，意恐迟迟归。\n谁言寸草心，报得三春晖。",
    chapters: ["五言古诗", "七言古诗", "五言律诗", "七言律诗", "五言绝句", "七言绝句"]
  },
  "宋词三百首": {
    title: "宋词三百首",
    dynasty: "宋代",
    summary: "《宋词三百首》是晚清朱祖谋编选的宋词选本，共收录词人八十一余家，词作二百八十三首。它是研究宋词的重要选本。",
    content: "《念奴娇·赤壁怀古》——苏轼\n大江东去，浪淘尽，千古风流人物。故垒西边，人道是，三国周郎赤壁。乱石穿空，惊涛拍岸，卷起千堆雪。江山如画，一时多少豪杰。\n\n遥想公瑾当年，小乔初嫁了，雄姿英发。羽扇纶巾，谈笑间，樯橹灰飞烟灭。故国神游，多情应笑我，早生华发。人生如梦，一尊还酹江月。\n\n《雨霖铃》——柳永\n寒蝉凄切，对长亭晚，骤雨初歇。都门帐饮无绪，留恋处，兰舟催发。执手相看泪眼，竟无语凝噎。念去去，千里烟波，暮霭沉沉楚天阔。\n\n多情自古伤离别，更那堪，冷落清秋节！今宵酒醒何处？杨柳岸，晓风残月。此去经年，应是良辰好景虚设。便纵有千种风情，更与何人说？\n\n《声声慢》——李清照\n寻寻觅觅，冷冷清清，凄凄惨惨戚戚。乍暖还寒时候，最难将息。三杯两盏淡酒，怎敌他、晚来风急！雁过也，正伤心，却是旧时相识。\n\n满地黄花堆积，憔悴损，如今有谁堪摘？守着窗儿，独自怎生得黑！梧桐更兼细雨，到黄昏、点点滴滴。这次第，怎一个愁字了得！",
    chapters: ["小令", "中调", "长调"]
  },
  "春江花月夜": {
    title: "春江花月夜",
    dynasty: "唐代",
    author: "张若虚",
    summary: "《春江花月夜》是唐代诗人张若虚的代表作，被闻一多先生誉为诗中的诗，顶峰上的顶峰。全诗以月为主体，以江为场景，描绘了一幅幽美邈远的春江月夜图。",
    content: "春江潮水连海平，海上明月共潮生。\n滟滟随波千万里，何处春江无月明！\n\n江流宛转绕芳甸，月照花林皆似霰；\n空里流霜不觉飞，汀上白沙看不见。\n\n江天一色无纤尘，皎皎空中孤月轮。\n江畔何人初见月？江月何年初照人？\n\n人生代代无穷已，江月年年望相似。\n不知江月待何人，但见长江送流水。\n\n白云一片去悠悠，青枫浦上不胜愁。\n谁家今夜扁舟子？何处相思明月楼？\n\n可怜楼上月徘徊，应照离人妆镜台。\n玉户帘中卷不去，捣衣砧上拂还来。\n\n此时相望不相闻，愿逐月华流照君。\n鸿雁长飞光不度，鱼龙潜跃水成文。\n\n昨夜闲潭梦落花，可怜春半不还家。\n江水流春去欲尽，江潭落月复西斜。\n\n斜月沉沉藏海雾，碣石潇湘无限路。\n不知乘月几人归，落月摇情满江树。",
    chapters: ["全诗一首"]
  },
  "陋室铭": {
    title: "陋室铭",
    dynasty: "唐代",
    author: "刘禹锡",
    summary: "《陋室铭》是唐代刘禹锡的代表作，通过描写简陋的居室，表达作者高洁傲岸的节操和安贫乐道的情趣。全文仅八十一字，却意境深远。",
    content: "山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。苔痕上阶绿，草色入帘青。谈笑有鸿儒，往来无白丁。可以调素琴，阅金经。无丝竹之乱耳，无案牍之劳形。南阳诸葛庐，西蜀子云亭。孔子云：何陋之有？",
    chapters: ["全篇一篇"]
  },
  "爱莲说": {
    title: "爱莲说",
    dynasty: "宋代",
    author: "周敦颐",
    summary: "《爱莲说》是宋代周敦颐的代表作，通过赞美莲花出淤泥而不染的品质，表达作者洁身自好的高尚情操。",
    content: "水陆草木之花，可爱者甚蕃。晋陶渊明独爱菊。自李唐来，世人甚爱牡丹。予独爱莲之出淤泥而不染，濯清涟而不妖，中通外直，不蔓不枝，香远益清，亭亭净植，可远观而不可亵玩焉。\n\n予谓菊，花之隐逸者也；牡丹，花之富贵者也；莲，花之君子者也。噫！菊之爱，陶后鲜有闻。莲之爱，同予者何人？牡丹之爱，宜乎众矣！",
    chapters: ["全篇一篇"]
  },
  "岳阳楼记": {
    title: "岳阳楼记",
    dynasty: "宋代",
    author: "范仲淹",
    summary: "《岳阳楼记》是宋代范仲淹的代表作，通过描写岳阳楼景色，表达了先天下之忧而忧，后天下之乐而乐的伟大政治抱负。",
    content: "庆历四年春，滕子京谪守巴陵郡。越明年，政通人和，百废俱兴，乃重修岳阳楼，增其旧制，刻唐贤今人诗赋于其上。予观夫巴陵胜状，在洞庭一湖。衔远山，吞长江，浩浩汤汤，横无际涯；朝晖夕阴，气象万千。此则岳阳楼之大观也。前人之述备矣。然则北通巫峡，南极潇湘，迁客骚人，多会于此，览物之情，得无异乎？\n\n若夫霪雨霏霏，连月不开，阴风怒号，浊浪排空；日星隐曜，山岳潜形；商旅不行，樯倾楫摧；薄暮冥冥，虎啸猿啼。登斯楼也，则有去国怀乡，忧谗畏讥，满目萧然，感极而悲者矣。\n\n至若春和景明，波澜不惊，上下天光，一碧万顷；沙鸥翔集，锦鳞游泳；岸芷汀兰，郁郁青青。而或长烟一空，皓月千里，浮光跃金，静影沉璧，渔歌互答，此乐何极！登斯楼也，则有心旷神怡，宠辱偕忘，把酒临风，其喜洋洋者矣。\n\n嗟夫！予尝求古仁人之心，或异二者之为，何哉？不以物喜，不以己悲；居庙堂之高则忧其民；处江湖之远则忧其君。是进亦忧，退亦忧。然则何时而乐耶？其必曰先天下之忧而忧，后天下之乐而乐乎！噫！微斯人，吾谁与归？",
    chapters: ["全篇一篇"]
  }
};

export const culturalKnowledge: Record<string, KnowledgeEntry> = {
  "李白喝酒": {
    id: "li-bai-drinking",
    question: "李白为什么喜欢喝酒？",
    answer: "李白嗜酒，与其豪放洒脱的个性、诗歌创作的灵感需求以及人生际遇密切相关。酒是他抒发豪情、排解苦闷、激发创作灵感的重要媒介。李白一生与酒结下不解之缘，留下大量饮酒诗作。",
    quotes: [
      { text: "君不见黄河之水天上来，奔流到海不复回。君不见高堂明镜悲白发，朝如青丝暮成雪。人生得意须尽欢，莫使金樽空对月。天生我材必有用，千金散尽还复来。", title: "将进酒", author: "李白", dynasty: "唐" },
      { text: "花间一壶酒，独酌无相亲。举杯邀明月，对影成三人。月既不解饮，影徒随我身。暂伴月将影，行乐须及春。", title: "月下独酌", author: "李白", dynasty: "唐" },
      { text: "抽刀断水水更流，举杯消愁愁更愁。人生在世不称意，明朝散发弄扁舟。", title: "宣州谢朓楼饯别校书叔云", author: "李白", dynasty: "唐" },
      { text: "两人对酌山花开，一杯一杯复一杯。我醉欲眠卿且去，明朝有意抱琴来。", title: "山中与幽人对酌", author: "李白", dynasty: "唐" }
    ],
    sources: [
      { title: "李太白集", type: "book", isBook: true },
      { title: "全唐诗", type: "book", isBook: true },
      { title: "新唐书·李白传", type: "book", isBook: true },
      { title: "国家图书馆数字资源", type: "database" }
    ],
    interpretations: "李白的饮酒诗展现了他对自由、理想和生命的深刻思考。酒在他的诗歌中不仅是物质的饮品，更是精神的寄托和艺术的催化剂。他借酒抒情，以酒会友，在酒中寻找创作的灵感。",
    scholarAnalysis: "学者陈贻焮认为，李白的饮酒是一种审美沉醉，他通过饮酒达到一种超越现实、进入艺术创作最佳状态的境界。这种状态与庄子的心斋、坐忘有相似之处。学者袁行霈则指出，李白饮酒诗的独特之处在于他把饮酒提升到了哲学的高度，通过酒来表达对人生的思考和对自由的追求。",
    graphNodes: [
      { id: "li-bai", label: "李白", type: "person", description: "唐代浪漫主义诗人" },
      { id: "wine", label: "酒文化", type: "concept", description: "中国传统酒文化" },
      { id: "poetry", label: "诗歌创作", type: "concept", description: "古代诗歌艺术" },
      { id: "jiang-jin-jiu", label: "将进酒", type: "quote", description: "李白代表作" }
    ]
  },
  "端午节由来": {
    id: "dragon-boat-festival-origin",
    question: "端午节的由来？",
    answer: "端午节起源于中国古代，最初是祛病防疫的节日，后因纪念屈原而逐渐演变。农历五月初五，民间有吃粽子、赛龙舟、挂艾草、佩香囊等习俗。2009年被列入世界非物质文化遗产。",
    quotes: [
      { text: "节分端午自谁言，万古传闻为屈原。堪笑楚江空渺渺，不能洗得直臣冤。", title: "端午", author: "文秀", dynasty: "唐" },
      { text: "五月五日天晴明，杨花绕江啼晓莺。", title: "竞渡曲", author: "刘禹锡", dynasty: "唐" }
    ],
    sources: [
      { title: "荆楚岁时记", type: "book", isBook: true },
      { title: "史记·屈原贾生列传", type: "book", isBook: true },
      { title: "续齐谐记", type: "book", isBook: true },
      { title: "中国非物质文化遗产网", type: "database" }
    ],
    interpretations: "端午节的习俗蕴含着古人对自然的敬畏和对健康的追求。龙舟竞渡象征着团结奋进，粽子则承载着对先贤的怀念。佩香囊、挂艾草等习俗则体现了古人的防疫智慧。",
    scholarAnalysis: "民俗学家钟敬文指出，端午节是中国古代卫生防疫节的遗存，其习俗如挂艾草、佩香囊、饮雄黄酒等，都体现了古人预防疾病的智慧。历史学家江绍原认为，端午节的起源可以追溯到上古的夏至节气，最初是一个祈求丰收、驱除瘟疫的节日。",
    graphNodes: [
      { id: "qu-yuan", label: "屈原", type: "person", description: "端午节的纪念人物" },
      { id: "dragon-boat", label: "龙舟竞渡", type: "concept", description: "端午节习俗" },
      { id: "zongzi", label: "粽子", type: "concept", description: "端午节食品" },
      { id: "mugwort", label: "艾草", type: "concept", description: "端午节习俗草药" }
    ]
  },
  "中秋赏月": {
    id: "mid-autumn-moon",
    question: "为什么中秋要赏月？",
    answer: "中秋赏月源于古人对月亮的崇拜和对团圆的向往。八月十五月儿圆，人们通过赏月寄托思念、祈求团圆，形成了独特的中秋文化。中秋节与春节、清明节、端午节并称为中国四大传统节日。",
    quotes: [
      { text: "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。", title: "水调歌头", author: "苏轼", dynasty: "宋" },
      { text: "但愿人长久，千里共婵娟。", title: "水调歌头", author: "苏轼", dynasty: "宋" },
      { text: "海上生明月，天涯共此时。情人怨遥夜，竟夕起相思。", title: "望月怀远", author: "张九龄", dynasty: "唐" },
      { text: "露从今夜白，月是故乡明。", title: "月夜忆舍弟", author: "杜甫", dynasty: "唐" }
    ],
    sources: [
      { title: "东京梦华录", type: "book", isBook: true },
      { title: "梦梁录", type: "book", isBook: true },
      { title: "中国国家天文", type: "website" },
      { title: "中国民俗网", type: "database" }
    ],
    interpretations: "中秋明月象征着圆满和美好，赏月活动体现了中国人对家庭团聚、人间美好的追求。月色的皎洁也引发了无数文人的哲思与诗情。月饼作为中秋节的特有食品，也象征着团圆和美满。",
    scholarAnalysis: "历史学家杨宽认为，中秋节起源于上古的秋分祭月，经过唐宋时期的发展，逐渐从宗教祭祀演变为民间的团圆节日。民俗学家乌丙安指出，中秋赏月习俗的形成与农业生产周期密切相关，八月十五正值秋收时节，人们在丰收之余举行祭月、赏月活动，表达对天地自然的感恩之情。",
    graphNodes: [
      { id: "moon", label: "月亮崇拜", type: "concept", description: "中秋文化核心" },
      { id: "mooncake", label: "月饼", type: "concept", description: "中秋节令食品" },
      { id: "reunion", label: "团圆", type: "concept", description: "中秋文化主题" },
      { id: "su-shi", label: "苏轼", type: "person", description: "中秋词代表作家" }
    ]
  },
  "二十四节气": {
    id: "24-solar-terms",
    question: "什么是二十四节气？",
    answer: "二十四节气是中国古代订立的一种用来指导农事的补充历法，将一年分为二十四个节气，每个节气约15天，反映季节变化、物候特征和气候规律。2016年被列入联合国教科文组织人类非物质文化遗产。",
    quotes: [
      { text: "春雨惊春清谷天，夏满芒夏暑相连。秋处露秋寒霜降，冬雪雪冬小大寒。", title: "二十四节气歌", author: "佚名", dynasty: "清" },
      { text: "立春：一候东风解冻，二候蛰虫始振，三候鱼陟负冰。", title: "月令七十二候集解", author: "吴澄", dynasty: "元" }
    ],
    sources: [
      { title: "月令七十二候集解", type: "book", isBook: true },
      { title: "淮南子", type: "book", isBook: true },
      { title: "逸周书·时训解", type: "book", isBook: true },
      { title: "联合国教科文组织非遗名录", type: "database" }
    ],
    interpretations: "二十四节气是古人观察太阳周年运动，认知一年中时令、气候、物候等变化规律所形成的知识体系，体现了中国人与自然和谐相处的智慧。每个节气又分为三候，共七十二候。",
    scholarAnalysis: "气象学家竺可桢认为，二十四节气的创立是中国古代天文学和农学的重要成就，其精确性反映了中国古代科学技术的高度发展。农业史学家胡锡文指出，二十四节气是中华民族的独特创造，它与农业生产紧密结合，是老祖宗留给我们的宝贵文化遗产。",
    graphNodes: [
      { id: "lichun", label: "立春", type: "event", description: "春季第一个节气" },
      { id: "yushui", label: "雨水", type: "event", description: "春季第二个节气" },
      { id: "jingzhe", label: "惊蛰", type: "event", description: "春季第三个节气" },
      { id: "chunfen", label: "春分", type: "event", description: "春季中气" },
      { id: "qingming", label: "清明", type: "event", description: "春季节气" }
    ]
  },
  "诗经风雅颂": {
    id: "shijing-feng-ya-song",
    question: "《诗经》的风雅颂指什么？",
    answer: "《诗经》是中国最早的诗歌总集，分为风、雅、颂三部分。风是各地民歌，共十五国风160篇；雅是宫廷乐歌，分大雅小雅共105篇；颂是宗庙祭祀乐歌，共40篇。三者合称诗之六义。",
    quotes: [
      { text: "关关雎鸠，在河之洲。窈窕淑女，君子好逑。", title: "关雎", author: "佚名", dynasty: "周" },
      { text: "执子之手，与子偕老。", title: "击鼓", author: "佚名", dynasty: "周" },
      { text: "蒹葭苍苍，白露为霜。所谓伊人，在水一方。", title: "蒹葭", author: "佚名", dynasty: "周" }
    ],
    sources: [
      { title: "毛诗正义", type: "book", isBook: true },
      { title: "诗集传", type: "book", isBook: true },
      { title: "毛诗序", type: "book", isBook: true },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "风雅颂的分类反映了周代社会的不同层面：风反映民间生活，雅体现贵族文化，颂彰显祭祀礼仪，共同构成了周代社会的完整画卷。这种分类不仅是音乐上的区别，更反映了社会阶层和用途的差异。",
    scholarAnalysis: "文学史家游国恩指出，风雅颂的划分不仅是音乐上的区别，更反映了社会阶层和用途的差异，是研究周代社会的重要史料。经学家朱熹在《诗集传》中认为，风是民俗歌谣之诗，雅是正乐之诗，颂是宗庙祭祀之诗。现代学者袁行霈则认为，《诗经》的风雅颂体现了中国古代诗学的美刺传统，即诗歌具有讽喻和赞美的社会功能。",
    graphNodes: [
      { id: "shijing", label: "诗经", type: "book", description: "中国最早诗歌总集" },
      { id: "feng", label: "国风", type: "concept", description: "十五国地方民歌" },
      { id: "ya", label: "雅", type: "concept", description: "宫廷乐歌" },
      { id: "song", label: "颂", type: "concept", description: "宗庙祭祀乐歌" },
      { id: "liu-yi", label: "六义", type: "concept", description: "诗经六义" },
      { id: "mao-heng", label: "毛亨", type: "person", description: "毛诗学开创者" }
    ]
  },
  "苏轼代表作": {
    id: "su-shi-works",
    question: "苏东坡有哪些代表作？",
    answer: "苏轼是宋代文学巨匠，诗词文赋书画皆精。其代表作包括《水调歌头·明月几时有》《念奴娇·赤壁怀古》《前后赤壁赋》等，展现了豪放旷达的艺术风格。",
    quotes: [
      { text: "大江东去，浪淘尽，千古风流人物。", title: "念奴娇·赤壁怀古", author: "苏轼", dynasty: "宋" },
      { text: "寄蜉蝣于天地，渺沧海之一粟。哀吾生之须臾，羡长江之无穷。", title: "前赤壁赋", author: "苏轼", dynasty: "宋" },
      { text: "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。", title: "定风波", author: "苏轼", dynasty: "宋" },
      { text: "但愿人长久，千里共婵娟。", title: "水调歌头", author: "苏轼", dynasty: "宋" }
    ],
    sources: [
      { title: "东坡全集", type: "book", isBook: true },
      { title: "全宋词", type: "book", isBook: true },
      { title: "苏轼研究资料汇编", type: "database" }
    ],
    interpretations: "苏轼的作品体现了他豁达的人生态度和深邃的哲理思考，无论身处顺境逆境，都能保持乐观和从容。他的诗词既有豪放派的激昂慷慨，又有婉约派的细腻柔情，形成了独特的艺术风格。",
    scholarAnalysis: "词学家唐圭璋认为，苏轼开创了豪放词派，将词从艳科提升到可以抒写人生哲理和家国情怀的高度，对后世词坛影响深远。文学史家钱钟书指出，苏轼是宋代最有多方面才能的文学家，他的散文与韩愈、柳宗元并称唐宋八大家，诗歌与黄庭坚并称苏黄，词与辛弃疾并称苏辛，书法与黄庭坚、米芾、蔡襄并称宋四家。",
    graphNodes: [
      { id: "su-shi", label: "苏轼", type: "person", description: "北宋文豪" },
      { id: "ci", label: "词", type: "concept", description: "宋代文学体裁" },
      { id: "dongpo", label: "东坡", type: "concept", description: "苏轼号" },
      { id: "chibi", label: "赤壁", type: "event", description: "赤壁怀古" }
    ]
  },
  "昆曲百戏之祖": {
    id: "kunqu-opera",
    question: "昆曲为何被称为百戏之祖？",
    answer: "昆曲是中国最古老的戏曲剧种之一，起源于元末明初的昆山。它融合了唱、念、做、打等多种艺术形式，以其优美的唱腔和细腻的表演著称。2001年被联合国教科文组织列为人类口头和非物质遗产代表作。",
    quotes: [],
    sources: [
      { title: "昆剧发展史", type: "book", isBook: true },
      { title: "中国戏曲通史", type: "book", isBook: true },
      { title: "联合国教科文组织非遗名录", type: "database" }
    ],
    interpretations: "昆曲的艺术体系完整，表演程式严谨，音乐唱腔优美，是中国戏曲艺术的集大成者。其水磨腔婉转悠扬身段表演细腻程式化，代表了中国古典戏曲的最高艺术成就，为后世戏曲发展奠定了基础。",
    scholarAnalysis: "戏剧理论家张庚认为，昆曲在表演艺术上的成就达到了中国古典戏剧的巅峰，其唱、念、做、打的综合表演体系被后来的各种戏曲所吸收和借鉴。戏曲史家顾笃璜指出，昆曲以其深厚的文化底蕴和精湛的艺术表现，被誉为百戏之祖，对京剧、越剧、粤剧等剧种都产生了深远影响。",
    graphNodes: [
      { id: "kunqu", label: "昆曲", type: "concept", description: "百戏之祖" },
      { id: "shuimoqiang", label: "水磨腔", type: "concept", description: "昆曲唱腔特点" },
      { id: "wanxi", label: "牡丹亭", type: "book", description: "昆曲代表作" },
      { id: "tang-xianzu", label: "汤显祖", type: "person", description: "昆曲剧作家" }
    ]
  },
  "孔子思想": {
    id: "confucius-thought",
    question: "孔子的核心思想是什么？",
    answer: "孔子的核心思想是仁和礼。仁是爱人，是道德修养的最高境界；礼是社会秩序和行为规范。他主张通过修身、齐家、治国、平天下来实现社会和谐。孔子被尊为至圣先师，对中国文化产生了深远影响。",
    quotes: [
      { text: "仁者爱人。", title: "论语·颜渊", author: "孔子", dynasty: "春秋" },
      { text: "克己复礼为仁。一日克己复礼，天下归仁焉。", title: "论语·颜渊", author: "孔子", dynasty: "春秋" },
      { text: "己所不欲，勿施于人。", title: "论语·卫灵公", author: "孔子", dynasty: "春秋" },
      { text: "己欲立而立人，己欲达而达人。", title: "论语·雍也", author: "孔子", dynasty: "春秋" }
    ],
    sources: [
      { title: "论语", type: "book", isBook: true },
      { title: "史记·孔子世家", type: "book", isBook: true },
      { title: "礼记", type: "book", isBook: true },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "孔子的思想强调道德修养和社会责任，主张通过教育和自我完善来实现个人价值和社会和谐。他提出有教无类的教育思想，打破了贵族对教育的垄断。孔子的思想对中国传统文化产生了深远影响，成为中国文化的核心价值体系。",
    scholarAnalysis: "哲学家冯友兰认为，孔子的仁学是一种道德理想主义，强调通过内在的道德自觉来达到外在的社会秩序，是中国传统文化的核心精神。历史学家李学勤指出，孔子创立的儒家学说成为中国传统文化的主干，其仁政思想对后世的政治哲学产生了深远影响。教育学家陶行知认为，孔子有教无类的教育思想打破了阶级壁垒，为后世普及教育奠定了思想基础。",
    graphNodes: [
      { id: "confucius", label: "孔子", type: "person", description: "儒家学派创始人" },
      { id: "ren", label: "仁", type: "concept", description: "孔子思想核心" },
      { id: "li", label: "礼", type: "concept", description: "社会秩序规范" },
      { id: "lunyu", label: "论语", type: "book", description: "记录孔子言行" },
      { id: "rujia", label: "儒家", type: "concept", description: "儒家学派" },
      { id: "sixiang", label: "六经", type: "concept", description: "孔子整理的六部典籍" }
    ]
  },
  "道德经": {
    id: "tao-te-ching",
    question: "《道德经》的核心思想是什么？",
    answer: "《道德经》是道家学派的经典著作，核心思想是道。道是宇宙的本源和规律，主张顺应自然、无为而治，追求内心的宁静和精神的自由。全书五千余字，分为道经和德经两部分。",
    quotes: [
      { text: "道可道，非常道；名可名，非常名。", title: "道德经·第一章", author: "老子", dynasty: "春秋" },
      { text: "无为而无不为。", title: "道德经·第四十八章", author: "老子", dynasty: "春秋" },
      { text: "上善若水。水善利万物而不争，处众人之所恶，故几于道。", title: "道德经·第八章", author: "老子", dynasty: "春秋" },
      { text: "祸兮，福之所倚；福兮，祸之所伏。", title: "道德经·第五十八章", author: "老子", dynasty: "春秋" },
      { text: "知人者智，自知者明。胜人者有力，自胜者强。", title: "道德经·第三十三章", author: "老子", dynasty: "春秋" }
    ],
    sources: [
      { title: "道德经注", type: "book", isBook: true },
      { title: "庄子", type: "book", isBook: true },
      { title: "史记·老子韩非列传", type: "book", isBook: true },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "《道德经》倡导一种自然无为的生活态度，认为顺应自然规律才能达到真正的自由和和谐。它提出的道法自然、无为而治、上善若水等思想成为中国哲学的重要源头，影响了后世无数哲学家和政治家的思想。",
    scholarAnalysis: "哲学家陈鼓应认为，老子的道不仅是宇宙的本源，也是一种生活智慧，教导人们以柔克刚、以静制动，在纷繁的世界中保持内心的宁静。历史学家钱穆指出，《道德经》是世界上除《圣经》以外被翻译最多的典籍，对世界哲学产生了深远影响。道教学者任继愈认为，老子思想的核心是道，而道的本质是自然，即顺应事物本来的规律。",
    graphNodes: [
      { id: "laozi", label: "老子", type: "person", description: "道家学派创始人" },
      { id: "dao", label: "道", type: "concept", description: "宇宙本源" },
      { id: "wuwei", label: "无为", type: "concept", description: "顺应自然" },
      { id: "ziran", label: "自然", type: "concept", description: "道法自然" },
      { id: "taoteching", label: "道德经", type: "book", description: "道家经典" },
      { id: "daojia", label: "道家", type: "concept", description: "道家学派" }
    ]
  },
  "屈原离骚": {
    id: "qu-yuan-li-sao",
    question: "屈原与《离骚》",
    answer: "屈原，名平，字原，战国时期楚国诗人、政治家。他忧国忧民，创立的楚辞体开辟了诗歌新天地，被誉为中华诗祖。《离骚》是其代表作，是中国古代最长的抒情诗。",
    quotes: [
      { text: "帝高阳之苗裔兮，朕皇考曰伯庸。", title: "离骚", author: "屈原", dynasty: "战国" },
      { text: "长太息以掩涕兮，哀民生之多艰。", title: "离骚", author: "屈原", dynasty: "战国" },
      { text: "路漫漫其修远兮，吾将上下而求索。", title: "离骚", author: "屈原", dynasty: "战国" },
      { text: "亦余心之所善兮，虽九死其犹未悔。", title: "离骚", author: "屈原", dynasty: "战国" }
    ],
    sources: [
      { title: "楚辞", type: "book", isBook: true },
      { title: "史记·屈原贾生列传", type: "book", isBook: true },
      { title: "屈原离骚注", type: "book", isBook: true },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "《离骚》以自传体的形式，表达了屈原忧国忧民的爱国情怀和九死不悔的执着追求。诗中运用大量香草美人的象征手法，表达诗人高洁的品格和不屈的精神。",
    scholarAnalysis: "文学史家鲁迅称《离骚》逸响伟辞，卓绝一世，给予了极高评价。楚辞研究专家姜亮夫认为，屈原的创作将中国诗歌从集体歌唱推进到个人独创的新阶段，开创了中国文学的浪漫主义传统。",
    graphNodes: [
      { id: "qu-yuan", label: "屈原", type: "person", description: "中华诗祖" },
      { id: "li-sao", label: "离骚", type: "book", description: "屈原代表作" },
      { id: "chu-ci", label: "楚辞", type: "concept", description: "屈原创造的诗歌体裁" },
      { id: "dragon-boat", label: "端午节", type: "event", description: "纪念屈原" }
    ]
  },
  "桃花源记": {
    id: "taohuayuan-ji",
    question: "陶渊明与《桃花源记》",
    answer: "陶渊明，名潜，字元亮，号五柳先生，东晋著名诗人。他不满官场黑暗，辞官归隐，开创田园诗派。《桃花源记》是他辞官后所写，描绘了一个理想的社会图景。",
    quotes: [
      { text: "晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近。忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。", title: "桃花源记", author: "陶渊明", dynasty: "东晋" },
      { text: "土地平旷，屋舍俨然，有良田、美池、桑竹之属。阡陌交通，鸡犬相闻。其中往来种作，男女衣着，悉如外人。黄发垂髫，并怡然自乐。", title: "桃花源记", author: "陶渊明", dynasty: "东晋" }
    ],
    sources: [
      { title: "陶渊明集", type: "book", isBook: true },
      { title: "晋书·陶潜传", type: "book", isBook: true },
      { title: "中华经典古籍库", type: "database" }
    ],
    interpretations: "《桃花源记》通过描写一个与世隔绝的理想社会，表达了陶渊明对黑暗现实的不满和对美好生活的向往。桃花源成为后世文人追求的理想世界的代名词。",
    scholarAnalysis: "文学史家萧统编纂《陶渊明集》，给予陶渊明极高评价。学者陈寅恪认为，桃花源故事反映了魏晋时期战乱频仍背景下人们对安宁生活的渴望，同时也体现了道家小国寡民的思想影响。",
    graphNodes: [
      { id: "tao-yuanming", label: "陶渊明", type: "person", description: "田园诗祖" },
      { id: "taohuayuan", label: "桃花源", type: "concept", description: "理想社会" },
      { id: "tianyuan", label: "田园诗", type: "concept", description: "陶渊明开创的诗派" }
    ]
  },
  "唐诗宋词": {
    id: "tang-shi-song-ci",
    question: "唐诗宋词有什么区别？",
    answer: "唐诗和宋词是中国古典诗歌的两座高峰。唐诗以五言、七言律诗和绝句为主，讲究格律对仗，语言凝练；宋词则配乐歌唱，分成上下阕，有词牌名限制，形式更自由，情感更细腻。",
    quotes: [
      { text: "床前明月光，疑是地上霜。举头望明月，低头思故乡。", title: "静夜思", author: "李白", dynasty: "唐" },
      { text: "大江东去，浪淘尽，千古风流人物。", title: "念奴娇·赤壁怀古", author: "苏轼", dynasty: "宋" }
    ],
    sources: [
      { title: "全唐诗", type: "book", isBook: true },
      { title: "全宋词", type: "book", isBook: true },
      { title: "唐诗鉴赏辞典", type: "book", isBook: true },
      { title: "宋词鉴赏辞典", type: "book", isBook: true }
    ],
    interpretations: "唐诗和宋词代表了两种不同的审美趣味：唐诗偏重意境的营造和情感的抒发，宋词则更注重音律的美感和情感的细腻表达。两者共同构成了中国古典诗歌的辉煌篇章。",
    scholarAnalysis: "文学史家钱钟书在《谈艺录》中指出，唐诗以情韵胜，宋词以意趣胜，各有所长。学者王国维在《人间词话》中提出，词以境界为最上，对唐宋词的艺术成就进行了深入分析。",
    graphNodes: [
      { id: "tang-shi", label: "唐诗", type: "concept", description: "唐代诗歌" },
      { id: "song-ci", label: "宋词", type: "concept", description: "宋代词作" },
      { id: "li-bai", label: "李白", type: "person", description: "诗仙" },
      { id: "du-fu", label: "杜甫", type: "person", description: "诗圣" },
      { id: "su-shi", label: "苏轼", type: "person", description: "豪放词代表" },
      { id: "li-qingzhao", label: "李清照", type: "person", description: "婉约词代表" }
    ]
  },
  "静夜思": {
    id: "jing-ye-si",
    question: "李白的《静夜思》",
    answer: "《静夜思》是唐代诗人李白的名作，描写了诗人在寂静的夜晚思念故乡的深情。全诗语言通俗易懂，意境深远，成为千古传诵的名篇。",
    quotes: [
      { text: "床前明月光，疑是地上霜。举头望明月，低头思故乡。", title: "静夜思", author: "李白", dynasty: "唐" }
    ],
    sources: [
      { title: "李太白集", type: "book", isBook: true },
      { title: "全唐诗", type: "book", isBook: true }
    ],
    interpretations: "这首诗以月光为媒介，表达了诗人对故乡的深切思念。'举头望明月，低头思故乡'两句，将动作与情感紧密结合，成为表达乡愁的经典意象。",
    scholarAnalysis: "学者周汝昌认为，《静夜思》之所以千古传诵，在于它以最朴素的语言表达了最普遍的思乡之情。诗中的'床'字，有人认为是卧具，也有人认为是井栏上的木架。",
    graphNodes: [
      { id: "li-bai", label: "李白", type: "person", description: "作者" },
      { id: "moon", label: "明月", type: "concept", description: "思乡意象" },
      { id: "hometown", label: "思乡", type: "concept", description: "诗歌主题" }
    ]
  },
  "春江花月夜": {
    id: "chun-jiang-hua-yue-ye",
    question: "张若虚与《春江花月夜》",
    answer: "《春江花月夜》是唐代诗人张若虚的代表作，全诗以月为主体，以江为场景，描绘了一幅幽美邈远的春江月夜图，被闻一多先生誉为'诗中的诗，顶峰上的顶峰'。",
    quotes: [
      { text: "春江潮水连海平，海上明月共潮生。滟滟随波千万里，何处春江无月明！", title: "春江花月夜", author: "张若虚", dynasty: "唐" },
      { text: "江畔何人初见月？江月何年初照人？人生代代无穷已，江月年年望相似。", title: "春江花月夜", author: "张若虚", dynasty: "唐" },
      { text: "此时相望不相闻，愿逐月华流照君。", title: "春江花月夜", author: "张若虚", dynasty: "唐" }
    ],
    sources: [
      { title: "全唐诗", type: "book", isBook: true },
      { title: "唐诗鉴赏辞典", type: "book", isBook: true }
    ],
    interpretations: "这首诗以春、江、花、月、夜五种事物为中心，描绘了一幅幽美邈远的自然画卷。诗人通过对宇宙人生的追问，表达了对生命永恒的思考和对美好事物的追求。",
    scholarAnalysis: "闻一多先生高度评价《春江花月夜》，认为它'是诗中的诗，顶峰上的顶峰'。学者叶嘉莹认为，这首诗展现了唐诗最高的艺术境界，是'以哲学的思辨融入诗歌艺术'的典范。",
    graphNodes: [
      { id: "zhang-ruoxu", label: "张若虚", type: "person", description: "作者" },
      { id: "moon", label: "月", type: "concept", description: "诗歌意象" },
      { id: "river", label: "江", type: "concept", description: "诗歌意象" },
      { id: "spring", label: "春", type: "concept", description: "诗歌意象" }
    ]
  },
  "赤壁怀古": {
    id: "chi-bi-huai-gu",
    question: "苏轼的《念奴娇·赤壁怀古》",
    answer: "《念奴娇·赤壁怀古》是苏轼的代表作，通过描写赤壁古战场的壮丽景色，抒发了对古代英雄的仰慕和壮志难酬的感慨，被誉为'千古绝唱'。",
    quotes: [
      { text: "大江东去，浪淘尽，千古风流人物。故垒西边，人道是，三国周郎赤壁。乱石穿空，惊涛拍岸，卷起千堆雪。江山如画，一时多少豪杰。", title: "念奴娇·赤壁怀古", author: "苏轼", dynasty: "宋" },
      { text: "遥想公瑾当年，小乔初嫁了，雄姿英发。羽扇纶巾，谈笑间，樯橹灰飞烟灭。故国神游，多情应笑我，早生华发。人生如梦，一尊还酹江月。", title: "念奴娇·赤壁怀古", author: "苏轼", dynasty: "宋" }
    ],
    sources: [
      { title: "东坡全集", type: "book", isBook: true },
      { title: "全宋词", type: "book", isBook: true },
      { title: "宋词鉴赏辞典", type: "book", isBook: true }
    ],
    interpretations: "这首词上阙写景，下阙怀古，通过对三国英雄周瑜的赞美，表达了作者对建功立业的渴望。最后以'人生如梦'作结，体现了苏轼豁达超脱的人生态度。",
    scholarAnalysis: "词学家龙榆生认为，此词'雄视百代，为豪放词之冠'。学者叶嘉莹指出，苏轼在这首词中展现了'以诗为词'的特点，将诗歌的意境引入词的创作。",
    graphNodes: [
      { id: "su-shi", label: "苏轼", type: "person", description: "作者" },
      { id: "zhou-yu", label: "周瑜", type: "person", description: "词中人物" },
      { id: "chibi", label: "赤壁", type: "event", description: "古战场遗址" },
      { id: "haofang", label: "豪放派", type: "concept", description: "词派风格" }
    ]
  },
  "水调歌头": {
    id: "shui-diao-ge-tou",
    question: "苏轼的《水调歌头·明月几时有》",
    answer: "《水调歌头·明月几时有》是苏轼的中秋词代表作，表达了对亲人的思念和对人生的哲理思考。此词意境豁达，情理交融，是中秋词的绝唱。",
    quotes: [
      { text: "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。我欲乘风归去，又恐琼楼玉宇，高处不胜寒。", title: "水调歌头", author: "苏轼", dynasty: "宋" },
      { text: "人有悲欢离合，月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。", title: "水调歌头", author: "苏轼", dynasty: "宋" }
    ],
    sources: [
      { title: "东坡全集", type: "book", isBook: true },
      { title: "全宋词", type: "book", isBook: true }
    ],
    interpretations: "这首词以问月开篇，引出对人生的思考。上阙写诗人想要超脱尘世，但又留恋人间；下阙感叹人生无常，最后以美好的祝愿作结。'但愿人长久，千里共婵娟'成为表达思念和祝福的千古名句。",
    scholarAnalysis: "学者胡云翼在《宋词选》中评价此词'清旷豪放，兼而有之'。词学家俞平伯认为，这首词的哲理思考'不露痕迹，自然浑成'。",
    graphNodes: [
      { id: "su-shi", label: "苏轼", type: "person", description: "作者" },
      { id: "moon", label: "明月", type: "concept", description: "核心意象" },
      { id: "reunion", label: "团圆", type: "concept", description: "主题" },
      { id: "mid-autumn", label: "中秋", type: "event", description: "节日背景" }
    ]
  },
  "声声慢": {
    id: "sheng-sheng-man",
    question: "李清照的《声声慢》",
    answer: "《声声慢》是宋代女词人李清照的代表作，通过描写秋日黄昏的景象，表达了词人晚年丧夫、颠沛流离的悲苦心情，被誉为'千古绝唱'。",
    quotes: [
      { text: "寻寻觅觅，冷冷清清，凄凄惨惨戚戚。乍暖还寒时候，最难将息。三杯两盏淡酒，怎敌他、晚来风急！", title: "声声慢", author: "李清照", dynasty: "宋" },
      { text: "满地黄花堆积，憔悴损，如今有谁堪摘？守着窗儿，独自怎生得黑！梧桐更兼细雨，到黄昏、点点滴滴。这次第，怎一个愁字了得！", title: "声声慢", author: "李清照", dynasty: "宋" }
    ],
    sources: [
      { title: "漱玉词", type: "book", isBook: true },
      { title: "全宋词", type: "book", isBook: true }
    ],
    interpretations: "这首词开头连用七组叠字，层层递进，将愁绪推向极致。全词以秋景为依托，表达了词人内心的孤独、凄凉和对往事的追忆。",
    scholarAnalysis: "词学家沈祖棻认为，'寻寻觅觅'七叠字'创意出奇'，'足以为此词生色'。学者叶嘉莹指出，李清照在这首词中展现了'女性特有的敏锐和细腻'。",
    graphNodes: [
      { id: "li-qingzhao", label: "李清照", type: "person", description: "作者" },
      { id: "autumn", label: "秋", type: "concept", description: "季节意象" },
      { id: "sadness", label: "愁", type: "concept", description: "情感主题" },
      { id: "wanlou", label: "婉约派", type: "concept", description: "词派风格" }
    ]
  },
  "满江红": {
    id: "man-jiang-hong",
    question: "岳飞的《满江红》",
    answer: "《满江红》是南宋抗金名将岳飞的代表作，表达了岳飞精忠报国、收复中原的壮志豪情，是中华民族爱国主义精神的象征。",
    quotes: [
      { text: "怒发冲冠，凭栏处、潇潇雨歇。抬望眼，仰天长啸，壮怀激烈。三十功名尘与土，八千里路云和月。莫等闲、白了少年头，空悲切！", title: "满江红", author: "岳飞", dynasty: "宋" },
      { text: "靖康耻，犹未雪。臣子恨，何时灭！驾长车，踏破贺兰山缺。壮志饥餐胡虏肉，笑谈渴饮匈奴血。待从头、收拾旧山河，朝天阙。", title: "满江红", author: "岳飞", dynasty: "宋" }
    ],
    sources: [
      { title: "岳飞集", type: "book", isBook: true },
      { title: "宋史·岳飞传", type: "book", isBook: true }
    ],
    interpretations: "这首词慷慨激昂，表达了岳飞对国家耻辱的悲愤和收复失地的决心。'莫等闲、白了少年头，空悲切'成为激励后世青年珍惜时光、建功立业的名言。",
    scholarAnalysis: "历史学家邓广铭认为，《满江红》'气壮山河，志吞胡虏'，充分展现了岳飞的爱国精神。词学家王易在《词曲史》中评价此词'沉痛激烈，足以振聋发聩'。",
    graphNodes: [
      { id: "yue-fei", label: "岳飞", type: "person", description: "作者" },
      { id: "patriotism", label: "爱国主义", type: "concept", description: "核心精神" },
      { id: "jingkang", label: "靖康之耻", type: "event", description: "历史背景" },
      { id: "national-hero", label: "民族英雄", type: "concept", description: "历史地位" }
    ]
  },
  "蜀道难": {
    id: "shu-dao-nan",
    question: "李白的《蜀道难》",
    answer: "《蜀道难》是李白代表作之一，描写了蜀道的高峻险阻，表达了诗人对自然的敬畏和对人生的感慨，是李白浪漫主义诗歌的巅峰之作。",
    quotes: [
      { text: "噫吁嚱，危乎高哉！蜀道之难，难于上青天！蚕丛及鱼凫，开国何茫然！尔来四万八千岁，不与秦塞通人烟。", title: "蜀道难", author: "李白", dynasty: "唐" },
      { text: "地崩山摧壮士死，然后天梯石栈相钩连。上有六龙回日之高标，下有冲波逆折之回川。黄鹤之飞尚不得过，猿猱欲度愁攀援。", title: "蜀道难", author: "李白", dynasty: "唐" },
      { text: "剑阁峥嵘而崔嵬，一夫当关，万夫莫开。", title: "蜀道难", author: "李白", dynasty: "唐" }
    ],
    sources: [
      { title: "李太白集", type: "book", isBook: true },
      { title: "全唐诗", type: "book", isBook: true }
    ],
    interpretations: "这首诗以雄奇的想象、夸张的手法描写蜀道之艰险，表达了诗人对自然力量的敬畏和对人生的独特思考。诗中'蜀道之难，难于上青天'成为千古名句。",
    scholarAnalysis: "文学史家郁贤皓认为，《蜀道难》'以惊人的艺术想象力，把蜀道的艰险描绘得淋漓尽致'。学者周勋初指出，这首诗'充分体现了李白浪漫主义诗歌的艺术特色'。",
    graphNodes: [
      { id: "li-bai", label: "李白", type: "person", description: "作者" },
      { id: "shudao", label: "蜀道", type: "concept", description: "地理背景" },
      { id: "sichuan", label: "四川", type: "concept", description: "地区" },
      { id: "romanticism", label: "浪漫主义", type: "concept", description: "诗歌风格" }
    ]
  },
  "出师表": {
    id: "chu-shi-biao",
    question: "诸葛亮的《出师表》",
    answer: "《出师表》是三国时期蜀汉丞相诸葛亮北伐前写给后主刘禅的奏章，表达了诸葛亮对蜀汉的忠诚和对国家的责任感，是中国古代忠臣的典范之作。",
    quotes: [
      { text: "先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于外者，盖追先帝之殊遇，欲报之于陛下也。", title: "出师表", author: "诸葛亮", dynasty: "三国" },
      { text: "亲贤臣，远小人，此先汉所以兴隆也；亲小人，远贤臣，此后汉所以倾颓也。", title: "出师表", author: "诸葛亮", dynasty: "三国" },
      { text: "受任于败军之际，奉命于危难之间，尔来二十有一年矣。", title: "出师表", author: "诸葛亮", dynasty: "三国" },
      { text: "鞠躬尽瘁，死而后已。", title: "出师表", author: "诸葛亮", dynasty: "三国" }
    ],
    sources: [
      { title: "三国志·诸葛亮传", type: "book", isBook: true },
      { title: "古文观止", type: "book", isBook: true }
    ],
    interpretations: "《出师表》以恳切的语言，表达了诸葛亮对国家的忠诚和对后主的期望。'鞠躬尽瘁，死而后已'成为形容忠臣鞠躬尽瘁的千古名言。",
    scholarAnalysis: "文学批评家刘勰在《文心雕龙》中评价《出师表》为'表之英也'。历史学家黎东方认为，诸葛亮的忠诚和智慧在《出师表》中得到了充分体现。",
    graphNodes: [
      { id: "zhuge-liang", label: "诸葛亮", type: "person", description: "作者" },
      { id: "shuhan", label: "蜀汉", type: "concept", description: "政权" },
      { id: "liushan", label: "刘禅", type: "person", description: "后主" },
      { id: "loyalty", label: "忠义", type: "concept", description: "核心精神" }
    ]
  }
};

export function searchKnowledge(query: string): KnowledgeEntry | null {
  const normalizedQuery = query.toLowerCase();
  
  for (const [key, entry] of Object.entries(culturalKnowledge)) {
    if (normalizedQuery.includes(key) || 
        entry.question.toLowerCase().includes(normalizedQuery)) {
      return entry;
    }
  }
  
  return null;
}

export function getRelatedKnowledge(tags: string[]): KnowledgeEntry[] {
  const results: KnowledgeEntry[] = [];
  
  for (const tag of tags) {
    const entry = searchKnowledge(tag);
    if (entry && !results.find(r => r.id === entry.id)) {
      results.push(entry);
    }
  }
  
  return results;
}

export function getPerson(name: string): Person | null {
  return persons[name] || null;
}

export function getBook(title: string): Book | null {
  return books[title] || null;
}

export function getAllPersons(): Person[] {
  return Object.values(persons);
}

export function getAllBooks(): Book[] {
  return Object.values(books);
}