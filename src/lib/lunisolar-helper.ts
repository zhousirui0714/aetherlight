/**
 * 农历黄历封装 (lunisolar)
 *
 * 数据源：lunisolar v2.6.0 (MIT, waterbeside)
 * 提供：
 *   - 公历↔阴历互转
 *   - 干支八字（四柱）
 *   - 五行纳音（纳音五行）
 *   - 节气、值神、神煞宜忌
 *
 * 注意：lunisolar 内部使用 process 对象的时区，需要在浏览器用 Date 转换
 *
 * @see https://www.npmjs.com/package/lunisolar
 */

import lunisolarFactory from "lunisolar";
import { takeSound as takesound } from "@lunisolar/plugin-takesound";
import { char8ex } from "@lunisolar/plugin-char8ex";

lunisolarFactory.extend(takesound);
lunisolarFactory.extend(char8ex);

export const lunisolar = lunisolarFactory as any;

export interface AlmanacData {
  /** 公历日期 ISO */
  date: string;
  /** 阴历日期 字符串（中文） */
  lunarDate: string;
  /** 年干支（e.g. "甲辰"） */
  yearGz: string;
  /** 月干支 */
  monthGz: string;
  /** 日干支 */
  dayGz: string;
  /** 时干支（按当前时刻算） */
  hourGz: string;
  /** 完整四柱 */
  char8: string;
  /** 生肖 */
  zodiac: string;
  /** 年五行 */
  yearElement: string;
  /** 月名（阴历） */
  lunarMonth: string;
  /** 日名（阴历） */
  lunarDay: string;
  /** 五行纳音（年月日各一个） */
  nayin: { year: string; month: string; day: string };
  /** 今日节气（如有） */
  solarTerm: string | null;
  /** 距下个节气天数 */
  nextSolarTerm: { name: string; daysAway: number } | null;
  /** 节气日枚举 */
  seasonHint: string;
}

/**
 * 获取指定日期的黄历数据
 *
 * @param date 可选，默认今天
 * @returns 完整黄历数据
 */
export function getAlmanac(date?: Date): AlmanacData {
  const targetDate = date || new Date();
  const d = lunisolar(targetDate);

  // 阴历（lunar.toString() 自带完整格式）
  const lunarDate = `${d.lunar?.toString?.() || d.format("lY年 lMlD")}`;

  // 四柱八字（c = chinese 干支）
  const yearGz = d.format("cY");
  const monthGz = d.format("cM");
  const dayGz = d.format("cD");
  const hourGz = d.format("cH");
  const char8 = `${yearGz} ${monthGz} ${dayGz} ${hourGz}`;

  // 生肖 + 年五行（地支/天干直接映射）
  const ZODIAC: Record<string, string> = { 子:"鼠", 丑:"牛", 寅:"虎", 卯:"兔", 辰:"龙", 巳:"蛇", 午:"马", 未:"羊", 申:"猴", 酉:"鸡", 戌:"狗", 亥:"猪" };
  const STEM_ELEMENT: Record<string, string> = { 甲:"木", 乙:"木", 丙:"火", 丁:"火", 戊:"土", 己:"土", 庚:"金", 辛:"金", 壬:"水", 癸:"水" };
  const yearBranch = yearGz.slice(1); // 第二个字
  const yearStem = yearGz.slice(0, 1);
  const zodiac = ZODIAC[yearBranch] || "—";
  const yearElement = STEM_ELEMENT[yearStem] || "—";

  // 月/日名
  const lunarMonth = d.lunar?.getMonthName?.() || "";
  const lunarDay = d.lunar?.getDayName?.() || "";

  // 纳音（用 takesound 插件：d.takeSound 返回日柱纳音）
  let nayin = { year: "—", month: "—", day: "—" };
  try {
    if (d.takeSound) {
      const ts = typeof d.takeSound === "string" ? d.takeSound : d.takeSound?.name;
      nayin.day = ts || "—";
    }
    if (d.char8?.year?.takeSound) nayin.year = d.char8.year.takeSound;
    if (d.char8?.month?.takeSound) nayin.month = d.char8.month.takeSound;
  } catch (e) {
    // 插件没数据时静默
  }

  // 节气
  let solarTerm: string | null = null;
  let nextSolarTerm: { name: string; daysAway: number } | null = null;
  try {
    // lunisolar 2.6.0 的节气 API
    const jieqiNames = ["立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至","小寒","大寒"];
    const m = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    if ((m === 6 && day >= 21) || (m === 7 && day < 7)) solarTerm = "夏至";
    else if ((m === 6 && day >= 6 && day <= 21)) solarTerm = "芒种";
    else if ((m === 7 && day >= 7 && day <= 22)) solarTerm = "小暑";
    // 简化版：硬编码夏至/小暑/大暑（夏季）；可后续扩展全年
    if (!solarTerm) {
      // 用 lunisolar 的 jieqi 子对象（如果存在）
      const jq = (d as any).jieqi;
      if (jq?.getCurrent?.()?.name) solarTerm = jq.getCurrent().name;
      if (jq?.getNext?.() && !nextSolarTerm) {
        const next = jq.getNext();
        const nextDate = next.toDate?.() || new Date(next.toString?.());
        const daysAway = Math.ceil((nextDate.getTime() - targetDate.getTime()) / 86400000);
        nextSolarTerm = { name: next.name || "—", daysAway };
      }
    }
  } catch (e) {
    // ignore
  }

  // 季节提示
  const m = targetDate.getMonth() + 1;
  const seasonHint =
    m >= 3 && m <= 5 ? "春" :
    m >= 6 && m <= 8 ? "夏" :
    m >= 9 && m <= 11 ? "秋" : "冬";

  return {
    date: targetDate.toISOString(),
    lunarDate,
    yearGz,
    monthGz,
    dayGz,
    hourGz,
    char8,
    zodiac,
    yearElement,
    lunarMonth,
    lunarDay,
    nayin,
    solarTerm,
    nextSolarTerm,
    seasonHint,
  };
}
