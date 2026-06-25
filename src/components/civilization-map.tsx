import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

type Theme = {
  key: string;
  label: string;
  desc: string;
  // 地图坐标（百分比 0-100，相对 1400×地图高度容器）
  x: number;
  y: number;
};

const THEMES: Theme[] = [
  { key: "figures",    label: "人物", desc: "圣贤名士",   x: 50, y: 15 },
  { key: "poems",      label: "诗词", desc: "唐诗宋词",   x: 22, y: 26 },
  { key: "classics",   label: "典籍", desc: "经史子集",   x: 78, y: 22 },
  { key: "festivals",  label: "节气", desc: "岁时节令",   x: 8,  y: 58 },
  { key: "mythology",  label: "神话", desc: "上古传说",   x: 22, y: 82 },
  { key: "intangible", label: "非遗", desc: "传统技艺",   x: 72, y: 80 },
  { key: "artifacts",  label: "建筑", desc: "宫殿园林",   x: 92, y: 48 },
  { key: "philosophy", label: "哲学", desc: "诸子百家",   x: 33, y: 50 },
  { key: "technology", label: "科技", desc: "四大发明",   x: 67, y: 50 },
];

export function CivilizationMap() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const hoveredTheme = THEMES.find(t => t.key === hovered);

  return (
    <section data-section="civilization-map" className="relative w-full overflow-hidden bg-background paper-texture">
      {/* 标题区 - 全站三段式 */}
      <div className="mx-auto max-w-6xl px-6 pt-20 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">EXPLORE BY CATEGORY</div>
        <h2 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">文明地图</h2>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          九大主题，纵横五千年。点选一方水土，开启一场与先贤的对话。
        </p>
      </div>

      {/* 地图本体 - 横长 AI 生成古代中国山水长卷 + 9 个墨色圆 + 中央朱砂大印 */}
      <div className="relative mx-auto mt-12 h-[60vh] min-h-[500px] w-full max-w-[1400px] overflow-hidden rounded-2xl border border-stone-300/40 shadow-[0_8px_32px_-12px_rgba(42,37,32,0.15)]">
        {/* 背景 - AI 生成的古代中国山水长卷（本地 public 资源） */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/civilization-map.jpg)" }}
        />
        {/* 米白蒙版 - 让图变淡彩宣纸感 */}
        <div className="absolute inset-0 bg-background/30" />
        {/* 左上→右下对角米白渐变（增加地图感） */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/15 via-transparent to-background/45" />

        {/* SVG 虚线网 - 从中心"溯光"到 9 个主题点 + 外圈虚线 */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {THEMES.map(theme => (
            <line
              key={theme.key}
              x1="50"
              y1="50"
              x2={theme.x}
              y2={theme.y}
              stroke="currentColor"
              strokeWidth="0.12"
              strokeDasharray="0.6 0.5"
              className="text-foreground/25"
            />
          ))}
          <ellipse
            cx="50"
            cy="50"
            rx="44"
            ry="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.1"
            strokeDasharray="0.4 0.6"
            className="text-foreground/15"
          />
        </svg>

        {/* 9 个主题点 - 方案 A：墨色描边圆 + 中心朱砂点 + 米白标签 */}
        {THEMES.map(theme => {
          const isHovered = hovered === theme.key;
          return (
            <button
              key={theme.key}
              onClick={() => navigate({ to: "/gallery" })}
              onMouseEnter={() => setHovered(theme.key)}
              onMouseLeave={() => setHovered(null)}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${theme.x}%`, top: `${theme.y}%` }}
            >
              <div className="flex flex-col items-center gap-1.5">
                {/* 墨色描边圆 + 中心朱砂小点 */}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isHovered
                      ? "scale-125 border-foreground/70 bg-background/50 shadow-md"
                      : "border-foreground/45 bg-background/25 backdrop-blur-sm"
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full bg-rose-700/95 transition-all duration-300 ${
                      isHovered ? "scale-150 shadow-[0_0_8px_rgba(180,40,40,0.6)]" : ""
                    }`}
                  />
                </div>
                {/* 标签 - 米白半透底 */}
                <span
                  className={`rounded px-2 py-0.5 font-serif text-xs transition-all duration-300 ${
                    isHovered
                      ? "bg-background/95 text-foreground shadow-sm"
                      : "bg-background/70 text-foreground/80 backdrop-blur-sm"
                  }`}
                >
                  {theme.label}
                </span>
              </div>
            </button>
          );
        })}

        {/* 中央"溯光"朱砂大印 - 唯一红色焦点 */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-rose-800 bg-rose-700 shadow-[0_6px_20px_rgba(180,40,40,0.45),inset_0_0_12px_rgba(120,20,20,0.3)] md:h-24 md:w-24">
            <div className="text-center font-serif text-base leading-tight text-[#faf5e8] md:text-lg">
              <div>溯</div>
              <div>光</div>
            </div>
          </div>
          <div className="mt-1 text-center font-serif text-[10px] tracking-[0.3em] text-foreground/70">
            致五千年
          </div>
        </div>

        {/* 角落装饰 - 强化"古地图"感 */}
        <div className="absolute left-4 top-4 z-10 select-none font-serif text-[10px] tracking-[0.3em] text-foreground/55 md:left-6 md:top-6 md:text-xs">
          ✦ 文明之图 ✦
        </div>
        <div className="absolute right-4 top-4 z-10 select-none font-serif text-[10px] tracking-[0.2em] text-foreground/55 md:right-6 md:top-6 md:text-xs">
          SUUGŌ · AETHERLIGHT
        </div>
        <div className="absolute bottom-4 left-4 z-10 select-none font-serif text-[10px] tracking-[0.3em] text-foreground/55 md:bottom-6 md:left-6 md:text-xs">
          万卷 · 千载
        </div>
        <div className="absolute bottom-4 right-4 z-10 select-none font-serif text-[10px] tracking-[0.2em] text-foreground/55 md:bottom-6 md:right-6 md:text-xs">
          一脉 · 千年
        </div>

        {/* hover 详情卡 */}
        {hoveredTheme && (
          <div
            className="absolute z-30 w-60 rounded-xl border border-stone-300/60 bg-background/95 p-4 shadow-xl backdrop-blur-md transition-all"
            style={{
              left: hoveredTheme.x > 60
                ? `${Math.max(hoveredTheme.x - 32, 2)}%`
                : `${Math.min(hoveredTheme.x + 6, 70)}%`,
              top: `${hoveredTheme.y}%`,
              transform: "translateY(-50%)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-foreground/45 bg-background/30">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-700/95" />
              </div>
              <div>
                <div className="font-serif text-sm text-foreground">{hoveredTheme.label}</div>
                <div className="text-[10px] text-muted-foreground">{hoveredTheme.desc}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-foreground/65">
              点击进入「{hoveredTheme.label}」专题 →
            </div>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-10 text-center">
        <button
          onClick={() => navigate({ to: "/gallery" })}
          className="inline-flex items-center gap-1.5 font-serif text-sm tracking-[0.2em] text-foreground/70 transition hover:text-rose-800"
        >
          探索全部 15 大分类
          <span className="text-base">→</span>
        </button>
      </div>
    </section>
  );
}
