import type { Article } from "./types";
import { lifestyleArticles } from "./rest-part2-lifestyle";
import { lifestyleMoreArticles } from "./rest-part2-lifestyle-2";
import { philosophyArticles } from "./rest-part2-philosophy";
import { fourInventions, astronomyArticles } from "./rest-part2-technology-2a";
import { mathArticles, medicineArticles, agricultureArticles } from "./rest-part2-technology-2b";
import { waterWorksArticles, architectureArticles, textileArticles } from "./rest-part2-technology-2c";

/**
 * Part2 完整合并导出
 * - lifestyle: 60 条 (rest-part2-lifestyle 30 + rest-part2-lifestyle-2 30)
 * - philosophy: 40 条
 * - technology: 50 条 (四发明 4 + 天文 8 + 数学 8 + 医学 8 + 农学 6 + 水利 6 + 营造 5 + 纺织 5)
 * 合计: 150 条
 */
export const part2Articles: Article[] = [
  ...lifestyleArticles,
  ...lifestyleMoreArticles,
  ...philosophyArticles,
  ...fourInventions,
  ...astronomyArticles,
  ...mathArticles,
  ...medicineArticles,
  ...agricultureArticles,
  ...waterWorksArticles,
  ...architectureArticles,
  ...textileArticles
];
