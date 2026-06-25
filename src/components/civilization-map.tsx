import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  User, ScrollText, BookOpen, Sparkles, Mountain, Drama,
  Building2, Brain, Cog,
} from "lucide-react";
import { HOME_FALLBACK_IMAGES } from "@/lib/home-illustrations";

type Theme = {
  key: string;
  label: string;
  desc: string;
  seal: string;
  icon: typeof User;
  // 地图坐标（百分比 0-100，相对 1400×地图高度容器）
  x: number;
  y: number;
};

const THEMES: Theme[] = [
  { key: "figures",    label: "人物", desc: "圣贤名士",   seal: "人", icon: User,       x: 50, y: 15 },
  { key: "poems",      label: "诗词", desc: "唐诗宋词",   seal: "诗", icon: ScrollText, x: 22, y: 26 },
  { key: "classics",   label: "典籍", desc: "经史子集",   seal: "典", icon: BookOpen,   x: 78, y: 22 },
  { key: "festivals",  label: "节气", desc: "岁时节令",   seal: "气", icon: Sparkles,   x: 8,  y: 58 },
  { key: "mythology",  label: "神话", desc: "上古传说",   seal: "神", icon: Mountain,   x: 22, y: 82 },
  { key: "intangible", label: "非遗", desc: "传统技艺",   seal: "遗", icon: Drama,      x: 72, y: 80 },
  { key: "artifacts",  label: "建筑", desc: "宫殿园林",   seal: "筑", icon: Building2,  x: 92, y: 48 },
  { key: "philosophy", label: "哲学", desc: "诸子百家",   seal: "哲", icon: Brain,      x: 33, y: 50 },
  { key: "technology", label: "科技", desc: "四大发明",   seal: "科", icon: Cog,        x: 67, y: 50 },
];

const SUUGUANG_SEEDS = ["sumi-mountain", "sumi-river", "sumi-pine", "sumi-pavilion"];

function hashDate(date: Date): number {
  const dayKey = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) hash = (hash * 31 + dayKey.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function pickSupabaseByDate(date: Date): string {
  return HOME_FALLBACK_IMAGES[hashDate(date) % HOME_FALLBACK_IMAGES.length];
}

function picsumFallback(date: Date): string {
  const seed = SUUGUANG_SEEDS[hashDate(date) % SUUGUANG_SEEDS.length];
  return `https://picsum.photos/seed/${seed}-${date.toISOString().slice(0, 10)}/1920/1080`;
}

export function CivilizationMap() {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string>(pickSupabaseByDate(new Date()));
  const [imageFailed, setImageFailed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const handleImageError = () => {
    if (!imageFailed) {
      setImageFailed(true);
      setImageUrl(picsumFallback(new Date()));
    }
  };

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

      {/* 地图本体 - 横幅水墨山水 + 9 个浮动主题点 + 中央"溯光"朱砂大印 */}
      <div className="relative mx-auto mt-12 h-[60vh] min-h-[500px] w-full max-w-[1400px] overflow-hidden rounded-2xl border border-stone-300/40 shadow-[0_8px_32px_-12px_rgba(42,37,32,0.15)]">
        {/* 背景水墨图 */}
        <img
          src={imageUrl}
          alt=""
          onError={handleImageError}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: "brightness(1.1) contrast(0.85) saturate(0.35) sepia(0.15)",
          }}
        />
        {/* 米白蒙版 - 让图变淡彩宣纸感 */}
        <div className="absolute inset-0 bg-background/30" />
        {/* 左上→右下对角米白渐变（增加地图感） */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/15 via-transparent to-background/45" />

        {/* SVG 虚线网 - 从中心"溯光"到 9 个主题点 */}
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
          {/* 外圈虚线 - 强化"地图"感 */}
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

        {/* 9 个主题点 - 浮动在地图上 */}
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
                {/* 主题点 - 朱砂小圆 */}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-serif text-xs transition-all duration-300 ${
                    isHovered
                      ? "scale-125 border-rose-900 bg-rose-800 text-[#faf5e8] shadow-[0_4px_12px_rgba(180,40,40,0.5)]"
                      : "border-rose-700/80 bg-rose-700/90 text-[#faf5e8] shadow-[0_2px_6px_rgba(180,40,40,0.35)]"
                  }`}
                >
                  {theme.seal}
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

        {/* 中央"溯光"朱砂大印 */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-rose-800 bg-rose-700 shadow-[0_6px_20px_rgba(180,40,40,0.45),inset_0_0_12px_rgba(120,20,20,0.3)] md:h-24 md:w-24">
            <div className="text-center font-serif text-base leading-tight text-[#faf5e8] md:text-lg">
              <div>溯</div>
              <div>光</div>
            </div>
          </div>
          {/* 印章下方小字 */}
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
              // 卡片位置：点的右侧（如果点偏右则放左侧）
              left: hoveredTheme.x > 60
                ? `${Math.max(hoveredTheme.x - 32, 2)}%`
                : `${Math.min(hoveredTheme.x + 6, 70)}%`,
              top: `${hoveredTheme.y}%`,
              transform: "translateY(-50%)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center border border-rose-800/70 bg-rose-700/90 font-serif text-xs text-[#faf5e8]"
                style={{ borderRadius: "2px" }}
              >
                {hoveredTheme.seal}
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
