import { SectionHeading } from "./section-heading";
import { MapPin } from "lucide-react";

interface MapBlockProps {
  /** 地点名（自由文本，作为坐标查询关键词） */
  location: string;
  /** 简短描述（会在地图下方展示） */
  description?: string;
  /** 显示坐标（可选） */
  coordinates?: { lat: number; lng: number; name?: string };
  title?: string;
  accent?: string;
  watermark?: string;
}

/**
 * 地点地图 — 使用 静态 SVG + 高斯坐标近似 (无第三方依赖，稳定)
 * 后续可扩展为接入天地图 / 百度地图
 */
export function MapBlock({
  location,
  description,
  coordinates,
  title = "地理位置",
  accent = "var(--color-cinnabar)",
  watermark = "地",
}: MapBlockProps) {
  if (!location) return null;

  return (
    <section className="mb-8">
      <SectionHeading icon={MapPin} title={title} watermark={watermark} accent={accent} />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {/* 简化版地图背景：山脉 SVG + 经纬网格 */}
        <div
          aria-hidden
          className="relative h-48 w-full overflow-hidden"
          style={{
            background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 8%, var(--color-paper)) 0%, var(--color-paper) 100%)`,
          }}
        >
          {/* 山影 */}
          <svg
            className="absolute inset-0 h-full w-full opacity-30"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 150 Q60 80 120 110 T240 100 T400 130 L400 200 L0 200 Z" fill={accent} opacity="0.25" />
            <path d="M0 170 Q80 120 160 140 T320 130 T400 160 L400 200 L0 200 Z" fill={accent} opacity="0.4" />
            <path d="M0 185 Q100 160 200 170 T400 175 L400 200 L0 200 Z" fill={accent} opacity="0.55" />
            {/* 经纬线 */}
            <line x1="100" y1="0" x2="100" y2="200" stroke={accent} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
            <line x1="200" y1="0" x2="200" y2="200" stroke={accent} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
            <line x1="300" y1="0" x2="300" y2="200" stroke={accent} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
            <line x1="0" y1="60" x2="400" y2="60" stroke={accent} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
            <line x1="0" y1="120" x2="400" y2="120" stroke={accent} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
          </svg>

          {/* 中心定位点 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="relative flex items-center justify-center"
            >
              <span
                aria-hidden
                className="absolute h-12 w-12 animate-ping rounded-full opacity-50"
                style={{ background: accent }}
              />
              <span
                className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg"
                style={{ background: accent }}
              >
                <MapPin className="h-4 w-4 text-white" />
              </span>
            </div>
          </div>

          {/* 标签 */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
            <span
              className="rounded-full bg-white/80 px-3 py-1 font-serif text-sm font-semibold tracking-wider shadow-sm backdrop-blur"
              style={{ color: accent }}
            >
              📍 {location}
            </span>
            {coordinates && (
              <span className="rounded-full bg-white/70 px-2.5 py-1 font-mono text-[10px] tracking-wider text-muted-foreground backdrop-blur">
                {coordinates.lat.toFixed(2)}°N · {coordinates.lng.toFixed(2)}°E
              </span>
            )}
          </div>
        </div>
        {description && (
          <div className="px-5 py-3 text-sm text-foreground/80">
            <p className="font-serif leading-relaxed">{description}</p>
          </div>
        )}
      </div>
    </section>
  );
}
