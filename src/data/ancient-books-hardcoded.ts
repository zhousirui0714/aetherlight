/**
 * 6 本硬编码核心典籍
 *
 * 包含出师表（ctext 不收录）、道德经/庄子等（ctext 限速暂用）
 * 配套外链跳转（识典古籍 + ctext.org + 维基文库）
 */

import { findBookLink, type BookLink } from "@/data/ancient-book-links";

export interface HardcodedBook {
  title: string;
  author?: string;
  dynasty: string;
  content: string;
  translation?: string;
  source: string;
  bookLink: BookLink;
}

export const ancientBooksHardcoded: Record<string, HardcodedBook> = {
  "出师表": {
    title: "出师表",
    author: "诸葛亮",
    dynasty: "三国",
    content: `先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。然侍卫之臣不懈于内，忠志之士忘身于后者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气；不宜妄自菲薄，引喻失义，以塞忠谏之路也。

宫中府中，俱为一体，陟罚臧否，不宜异同。若有作奸犯科及为忠善者，宜付有司论其刑赏，以昭陛下平明之理，不宜偏私，使内外异法也。

亲贤臣，远小人，此先汉所以兴隆也；亲小人，远贤臣，此后汉所以倾颓也。先帝在时，每与臣论此事，未尝不叹息痛恨于桓、灵也。

臣本布衣，躬耕于南阳，苟全性命于乱世，不求闻达于诸侯。先帝不以臣卑鄙，猥自枉屈，三顾臣于草庐之中，咨臣以当世之事，由是感激，遂许先帝以驱驰。

愿陛下托臣以讨贼兴复之效；不效，则治臣之罪，以告先帝之灵。今当远离，临表涕零，不知所言。`,
    source: "三国志·蜀书·诸葛亮传",
    bookLink: {
      name: "出师表", aliases: [], category: "集部",
      brief: "诸葛亮北伐前上疏刘禅",
      shidianguji: "https://www.shidianguji.com/search?q=%E5%87%BA%E5%B8%88%E8%A1%A8",
    },
  },
  "道德经": {
    title: "道德经",
    author: "老子",
    dynasty: "春秋",
    content: `【第一章】道可道，非常道。名可名，非常名。无名天地之始；有名万物之母。故常无欲，以观其妙；常有欲，以观其徼。此两者同出而异名，同谓之玄。玄之又玄，众妙之门。

【第二章】天下皆知美之为美，斯恶已。皆知善之为善，斯不善已。故有无相生，难易相成，长短相形，高下相倾，音声相和，前后相随。是以圣人处无为之事，行不言之教，万物作焉而不辞，生而不有，为而不恃，功成而弗居。夫唯弗居，是以不去。

【第三章】不尚贤，使民不争。不贵难得之货，使民不为盗。不见可欲，使民心不乱。是以圣人之治，虚其心，实其腹，弱其志，强其骨。常使民无知无欲，使夫智者不敢为也。为无为，则无不治。

【第八章】上善若水。水善利万物而不争，处众人之所恶，故几于道。居善地，心善渊，与善仁，言善信，正善治，事善能，动善时。夫唯不争，故无尤。

【第十一章】三十辐共一毂，当其无，有车之用。埏埴以为器，当其无，有器之用。凿户牖以为室，当其无，有室之用。故有之以为利，无之以为用。

【第四十一章】上士闻道，勤而行之。中士闻道，若存若亡。下士闻道，大笑之。不笑不足以为道。故建言有之：明道若昧，进道若退，夷道若颣。上德若谷，大白若辱，广德若不足，建德若偷，质真若渝，大方无隅，大器晚成，大音希声，大象无形。道隐无名。夫唯道，善贷且成。

【第八十一章】信言不美，美言不信。善者不辩，辩者不善。知者不博，博者不知。圣人不积，既以为人己愈有，既以与人己愈多。天之道，利而不害；圣人之道，为而不争。`,
    source: "马王堆帛书老子 / 王弼本通行本",
    bookLink: {
      name: "道德经", aliases: ["老子", "五千言"], category: "子部",
      brief: "老子著，道家根本经典",
      shidianguji: "https://www.shidianguji.com/search?q=%E9%81%93%E5%BE%B7%E7%BB%8F",
      ctext: "https://ctext.org/daodejing",
      wikisource: "https://zh.wikisource.org/wiki/Category:道德經",
    },
  },
  "离骚": {
    title: "离骚",
    author: "屈原",
    dynasty: "战国",
    content: `帝高阳之苗裔兮，朕皇考曰伯庸。摄提贞于孟陬兮，惟庚寅吾以降。皇览揆余初度兮，肇锡余以嘉名。名余曰正则兮，字余曰灵均。

纷吾既有此内美兮，又重之以修能。扈江离与辟芷兮，纫秋兰以为佩。汩余若将不及兮，恐年岁之不吾与。朝搴阰之木兰兮，夕揽洲之宿莽。

日月忽其不淹兮，春与秋其代序。惟草木之零落兮，恐美人之迟暮。不抚壮而弃秽兮，何不改乎此度？乘骐骥以驰骋兮，来吾道夫先路！

昔三后之纯粹兮，固众芳之所在。杂申椒与菌桂兮，岂惟纫夫蕙茝？彼尧舜之耿介兮，既遵道而得路。何桀纣之昌披兮，夫唯捷径以窘步。

【长太息以掩涕兮，哀民生之多艰。】余虽好修姱以鞿羁兮，謇朝谇而夕替。既替余以蕙纕兮，又申之以揽茝。亦余心之所善兮，虽九死其犹未悔。

【路漫漫其修远兮，吾将上下而求索。】

（节选）`,
    source: "楚辞·离骚",
    bookLink: {
      name: "离骚", aliases: [], category: "集部",
      brief: "屈原代表作，中国浪漫主义文学源头",
      shidianguji: "https://www.shidianguji.com/search?q=%E7%A6%BB%E9%AA%9A",
      ctext: "https://ctext.org/chu-ci/li-sao",
      wikisource: "https://zh.wikisource.org/wiki/離騷",
    },
  },
  "逍遥游": {
    title: "逍遥游",
    author: "庄周",
    dynasty: "战国",
    content: `北冥有鱼，其名为鲲。鲲之大，不知其几千里也。化而为鸟，其名为鹏。鹏之背，不知其几千里也；怒而飞，其翼若垂天之云。是鸟也，海运则将徙于南冥。南冥者，天池也。

齐谐者，志怪者也。谐之言曰："鹏之徙于南冥也，水击三千里，抟扶摇而上者九万里，去以六月息者也。"

且夫水之积也不厚，则其负大舟也无力。覆杯水于坳堂之上，则芥为之舟，置杯焉则胶，水浅而舟大也。风之积也不厚，则其负大翼也无力。

故九万里，则风斯在下矣，而后乃今培风；背负青天，而莫之夭阏者，而后乃今将图南。

【抟扶摇羊角而上者九万里，绝云气，负青天，然后图南，且适南冥也。】

（节选）`,
    source: "庄子·内篇·逍遥游",
    bookLink: {
      name: "逍遥游", aliases: ["庄子·逍遥游"], category: "子部",
      brief: "庄子内篇首章，论绝对自由",
      shidianguji: "https://www.shidianguji.com/search?q=%E9%80%8D%E9%81%A5%E6%B8%B8",
      ctext: "https://ctext.org/zhuangzi/xiao-yao-you",
    },
  },
  "论语": {
    title: "论语",
    author: "孔子及其弟子",
    dynasty: "春秋",
    content: `【学而篇】子曰："学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？"

有子曰："其为人也孝弟，而好犯上者，鲜矣；不好犯上，而好作乱者，未之有也。君子务本，本立而道生。孝弟也者，其为仁之本与！"

子曰："巧言令色，鲜矣仁！"

曾子曰："吾日三省吾身——为人谋而不忠乎？与朋友交而不信乎？传不习乎？"

【为政篇】子曰："为政以德，譬如北辰，居其所而众星共之。"

子曰："诗三百，一言以蔽之，曰'思无邪'。"

子曰："吾十有五而志于学，三十而立，四十而不惑，五十而知天命，六十而耳顺，七十而从心所欲不逾矩。"

【里仁篇】子曰："里仁为美。择不处仁，焉得知？"

子曰："不仁者不可以久处约，不可以长处乐。仁者安仁，知者利仁。"

（节选前三篇）`,
    source: "论语（以杨伯峻《论语译注》为底本）",
    bookLink: {
      name: "论语", aliases: ["四书"], category: "经部",
      brief: "孔子与弟子言行录，儒家根本经典",
      shidianguji: "https://www.shidianguji.com/search?q=%E8%AE%BA%E8%AF%AD",
      ctext: "https://ctext.org/analects",
      wikisource: "https://zh.wikisource.org/wiki/Category:論語",
    },
  },
  "孟子": {
    title: "孟子",
    author: "孟轲",
    dynasty: "战国",
    content: `【梁惠王上】孟子见梁惠王。王曰："叟！不远千里而来，亦将有以利吾国乎？"

孟子对曰："王！何必曰利？亦有仁义而已矣。王曰，'何以利吾国？' 大夫曰，'何以利吾家？' 士庶人曰，'何以利吾身？' 上下交征利而国危矣。万乘之国，弑其君者，必千乘之家；千乘之国，弑其君者，必百乘之家。万取千焉，千取百焉，不为不多矣。苟为后义而先利，不夺不餍。未有仁而遗其亲者也，未有义而后其君者也。王亦曰仁义而已矣，何必曰利？"

【公孙丑上】"我善养吾浩然之气。""其为气也，至大至刚，以直养而无害，则塞于天地之间。其为气也，配义与道；无是，馁也。是集义所生者，非义袭而取之也。"

（节选）`,
    source: "孟子（以杨伯峻《孟子译注》为底本）",
    bookLink: {
      name: "孟子", aliases: ["四书"], category: "经部",
      brief: "孟轲言行与思想，儒家亚圣之作",
      shidianguji: "https://www.shidianguji.com/search?q=%E5%AD%9F%E5%AD%90",
      ctext: "https://ctext.org/mengzi",
      wikisource: "https://zh.wikisource.org/wiki/Category:孟子",
    },
  },
};

// 自动为每条都补全 bookLink
for (const key in ancientBooksHardcoded) {
  if (!ancientBooksHardcoded[key].bookLink) {
    const link = findBookLink(key);
    if (link) ancientBooksHardcoded[key].bookLink = link;
  }
}
