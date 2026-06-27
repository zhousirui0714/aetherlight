/**
 * 今日黄历卡片
 *
 * 展示：阴历日期 / 四柱八字 / 纳音 / 节气
 * 数据源：lunisolar v2.6.0 (MIT)
 * API：/api/almanac/today
 */

import { useEffect, useState } from "react";
import { Calendar, Sparkles, Flame, Snowflake, Mountain, Droplet, Leaf, Circle, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface AlmanacData {
  date: string;
  lunarDate: string;
  yearGz: string;
  monthGz: string;
  dayGz: string;
  hourGz: string;
  char8: string;
  zodiac: string;
  yearElement: string;
  lunarMonth: string;
  lunarDay: string;
  nayin: { year: string; month: string; day: string };
  solarTerm: string | null;
  nextSolarTerm: { name: string; daysAway: number } | null;
  seasonHint: string;
}

const ELEMENT_STYLE: Record<string, { icon: any; color: string; bg: string }> = {
  木: { icon: Leaf, color: "text-emerald-700", bg: "bg-emerald-50" },
  火: { icon: Flame, color: "text-rose-700", bg: "bg-rose-50" },
  土: { icon: Mountain, color: "text-amber-700", bg: "bg-amber-50" },
  金: { icon: Circle, color: "text-yellow-700", bg: "bg-yellow-50" },
  水: { icon: Droplet, color: "text-blue-700", bg: "bg-blue-50" },
  "—": { icon: Sparkles, color: "text-foreground", bg: "bg-secondary" },
};

export function AlmanacCard() {
  const [data, setData] = useState<AlmanacData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    fetch("/api/almanac/today")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((j) => { if (!aborted) { setData(j); setLoading(false); } })
      .catch((e) => { if (!aborted) { setErr(String(e)); setLoading(false); } });
    return () => { aborted = true; };
  }, []);

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/5 p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 animate-pulse" />
          正在从历法中撷取今日...
        </div>
      </div>
    );
  }

  if (err || !data) {
    return null; // 静默失败
  }

  const elStyle = ELEMENT_STYLE[data.yearElement] || ELEMENT_STYLE["—"];
  const ElIcon = elStyle.icon;

  return (
    <div className={`mb-6 rounded-2xl border border-accent/20 ${elStyle.bg} p-5`}>
      <div className="flex flex-wrap items-start gap-4">
        {/* 左侧：日期 + 阴历 */}
        <div className="min-w-[180px] flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>今日黄历</span>
            {data.solarTerm && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-800">
                {data.solarTerm}
              </span>
            )}
            {data.nextSolarTerm && (
              <span className="text-[10px] text-muted-foreground/70">
                · 距 {data.nextSolarTerm.name} {data.nextSolarTerm.daysAway} 天
              </span>
            )}
          </div>
          <div className="mt-1 font-serif text-2xl text-foreground">
            {data.lunarMonth}
            <span className="text-muted-foreground"> · </span>
            {data.lunarDay}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {data.zodiac}年 · {data.yearElement}年 · {data.lunarDate}
          </div>
        </div>

        {/* 中间：四柱八字 */}
        <div className="min-w-[280px] flex-[2]">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">四柱八字</div>
          <div className="mt-1 grid grid-cols-4 gap-1.5 font-serif text-base">
            {[
              { label: "年柱", value: data.yearGz },
              { label: "月柱", value: data.monthGz },
              { label: "日柱", value: data.dayGz },
              { label: "时柱", value: data.hourGz },
            ].map((p) => (
              <div key={p.label} className="rounded-md bg-background/60 px-2 py-1.5 text-center">
                <div className="text-[10px] text-muted-foreground">{p.label}</div>
                <div className="font-serif text-lg text-foreground">{p.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：纳音五行 + 跳转 */}
        <div className="min-w-[160px] flex-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">五行纳音</div>
          <div className="mt-1 space-y-0.5 text-xs">
            <div><span className="text-muted-foreground">年：</span>{data.nayin.year}</div>
            <div><span className="text-muted-foreground">月：</span>{data.nayin.month}</div>
            <div><span className="text-muted-foreground">日：</span>{data.nayin.day}</div>
          </div>
          <Link
            to="/search"
            search={{ q: "节气" }}
            className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent hover:underline"
          >
            <ElIcon className="h-3 w-3" />
            探索节气文化
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
