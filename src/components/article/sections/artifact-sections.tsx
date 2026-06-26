/**
 * 建筑器物详情页 — 突出空间展示
 * 1. 建造年代 / 地点
 * 2. 建筑风格
 * 3. 历史沿革
 * 4. 建筑结构解析
 * 5. 细节赏析 (斗拱/屋顶/彩绘)
 * 6. 地图位置
 * 7. 历史故事
 * 8. 相关建筑推荐
 * 9. 未来扩展 3D
 */
import { SectionHeading } from "../section-heading";
import { BasicInfoCard, I } from "../basic-info-card";
import { TimelineBlock, type TimelineEvent } from "../timeline-block";
import { MapBlock } from "../map-block";
import { RelatedItemsBlock } from "../knowledge-card";
import { getCategoryMeta } from "../category-meta";
import { Building2, Compass, History, Layers, Brush, Sparkles, Box, Quote } from "lucide-react";
import type { Article, RelatedItem } from "@/lib/knowledge-types";

interface Props {
  article: Article;
  /** 历史沿革 */
  evolution?: TimelineEvent[];
  /** 地图位置（坐标） */
  coordinates?: { lat: number; lng: number };
  /** 结构/细节图片 */
  structureImages?: { url: string; title: string; description?: string }[];
  /** 相关建筑 */
  relatedBuildings?: RelatedItem[];
}

export function ArtifactSections({
  article,
  evolution = [],
  coordinates,
  structureImages = [],
  relatedBuildings = [],
}: Props) {
  const meta = getCategoryMeta("artifacts");
  const accent = meta.accent;

  return (
    <>
      {/* === 1. 基础信息卡 === */}
      <BasicInfoCard
        title="建筑档案"
        accent={accent}
        columns={4}
        items={[
          { icon: I.calendar, label: "建造年代", value: article.dynasty || article.era || "—", primary: true },
          { icon: I.map, label: "所在地点", value: article.region || "—", primary: true },
          { icon: I.building, label: "建筑风格", value: (article as any).style || "—", primary: true },
          { icon: I.beaker, label: "结构类型", value: (article as any).structureType || "—", primary: true },
          { icon: I.crown, label: "现存级别", value: (article as any).protectionLevel || "—", primary: false },
          { icon: I.user, label: "设计/主持", value: (article as any).designer || "—", primary: false },
          { icon: I.tag, label: "类别", value: article.subCategory || "—", primary: false },
          { icon: I.feather, label: "占地", value: (article as any).area || "—", primary: false },
        ]}
      />

      {/* === 2. 地图位置 === */}
      {article.region && (
        <MapBlock
          location={article.region}
          description={(article as any).locationDesc}
          coordinates={coordinates}
          accent={accent}
        />
      )}

      {/* === 3. 历史沿革 === */}
      {evolution.length > 0 && (
        <TimelineBlock
          title="历史沿革"
          events={evolution}
          accent={accent}
          watermark="史"
        />
      )}

      {/* === 4. 建筑结构解析 === */}
      {article.content && (
        <section className="mb-8">
          <SectionHeading icon={Layers} title="建筑结构解析" watermark="构" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="prose prose-lg max-w-none font-serif leading-loose text-foreground/85">
              <div className="whitespace-pre-wrap">{article.content}</div>
            </div>
          </div>
        </section>
      )}

      {/* === 5. 细节赏析 (斗拱/屋顶/彩绘) === */}
      {structureImages.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={Brush} title="细节赏析" subtitle="DETAILS" watermark="赏" accent={accent} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {structureImages.map((img, i) => (
              <div
                key={i}
                className="group overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-serif text-sm font-semibold text-foreground">{img.title}</h4>
                  {img.description && (
                    <p className="mt-1.5 line-clamp-2 font-serif text-xs leading-relaxed text-foreground/70">
                      {img.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 6. 历史故事 === */}
      {article.history && (
        <section className="mb-8">
          <SectionHeading icon={Quote} title="历史故事" watermark="事" accent={accent} />
          <div
            className="rounded-2xl border-l-4 bg-card p-5 md:p-6"
            style={{ borderColor: accent }}
          >
            <p className="whitespace-pre-line font-serif text-base leading-loose text-foreground/85">
              {article.history}
            </p>
          </div>
        </section>
      )}

      {/* === 7. 后世影响 === */}
      {article.influence && (
        <section className="mb-8">
          <SectionHeading icon={Sparkles} title="后世影响" watermark="响" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
              {article.influence}
            </p>
          </div>
        </section>
      )}

      {/* === 8. 相关建筑推荐 === */}
      {relatedBuildings.length > 0 && (
        <RelatedItemsBlock
          title="相关建筑推荐"
          accent={accent}
          items={relatedBuildings}
          watermark="联"
        />
      )}

      {/* === 9. 3D 浏览 扩展占位 === */}
      <section className="mb-8">
        <div
          className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-5"
        >
          <Box className="h-5 w-5" style={{ color: accent }} />
          <div className="flex-1">
            <h4 className="font-serif text-sm font-semibold text-foreground">3D 沉浸式浏览</h4>
            <p className="mt-0.5 font-serif text-xs text-muted-foreground">
              即将上线：可旋转缩放的 3D 建筑模型，斗拱/屋顶细节可单独查看
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 font-serif text-[10px] tracking-widest text-white"
            style={{ background: accent }}
          >
            敬请期待
          </span>
        </div>
      </section>
    </>
  );
}
