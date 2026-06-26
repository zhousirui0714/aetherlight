/**
 * 非遗艺术详情页 — 突出数字展馆体验
 * 1. 非遗级别
 * 2. 所属地区
 * 3. 代表传承人
 * 4. 历史起源
 * 5. 制作工艺流程
 * 6. 工艺特点
 * 7. 高清图片（作品画廊）
 * 8. 传承现状
 * 9. AI 工艺讲解
 */
import { SectionHeading } from "../section-heading";
import { BasicInfoCard, I } from "../basic-info-card";
import { ProcessFlow, type ProcessStep } from "../process-flow";
import { getCategoryMeta } from "../category-meta";
import { Award, MapPin, User, History, Wrench, Image as ImageIcon, Sparkles, Quote } from "lucide-react";
import type { Article } from "@/lib/knowledge-types";

interface Props {
  article: Article;
  /** 工艺流程 */
  craftFlow?: ProcessStep[];
  /** 作品画廊 */
  gallery?: { url: string; title: string; description?: string }[];
  /** 代表传承人 */
  inheritors?: { name: string; title?: string; brief?: string }[];
}

export function IntangibleSections({
  article,
  craftFlow = [],
  gallery = [],
  inheritors = [],
}: Props) {
  const meta = getCategoryMeta("intangible");
  const accent = meta.accent;

  return (
    <>
      {/* === 1. 基础信息卡 === */}
      <BasicInfoCard
        title="非遗档案"
        accent={accent}
        columns={4}
        items={[
          { icon: I.crown, label: "非遗级别", value: (article as any).level || "—", primary: true },
          { icon: I.calendar, label: "入选时间", value: (article as any).enrolledAt || "—", primary: true },
          { icon: I.map, label: "所属地区", value: article.region || "—", primary: true },
          { icon: I.tag, label: "类别", value: article.subCategory || "—", primary: false },
          { icon: I.book, label: "起源年代", value: article.dynasty || "—", primary: false },
          { icon: I.user, label: "代表传承人", value: (article as any).mainInheritor || "—", primary: false },
          { icon: I.beaker, label: "工艺特点", value: (article as any).craftFeatures || "—", primary: false },
          { icon: I.feather, label: "濒危程度", value: (article as any).endangerment || "—", primary: false },
        ]}
      />

      {/* === 2. 历史起源 === */}
      {article.history && (
        <section className="mb-8">
          <SectionHeading icon={History} title="历史起源" watermark="源" accent={accent} />
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

      {/* === 3. 代表传承人 === */}
      {inheritors.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={User} title="代表传承人" watermark="传" accent={accent} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {inheritors.map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-sm font-bold text-white"
                  style={{ background: accent }}
                >
                  {p.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-sm font-semibold text-foreground">{p.name}</h4>
                    {p.title && (
                      <span
                        className="rounded-sm px-1.5 py-0.5 font-serif text-[9px] tracking-widest text-white"
                        style={{ background: accent }}
                      >
                        {p.title}
                      </span>
                    )}
                  </div>
                  {p.brief && (
                    <p className="mt-1.5 line-clamp-2 font-serif text-xs leading-relaxed text-foreground/75">
                      {p.brief}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 4. 制作工艺流程 === */}
      {craftFlow.length > 0 && (
        <ProcessFlow
          title="制作工艺流程"
          steps={craftFlow}
          accent={accent}
          watermark="工"
        />
      )}

      {/* === 5. 工艺特点 === */}
      {article.content && (
        <section className="mb-8">
          <SectionHeading icon={Wrench} title="工艺特点与文化内涵" watermark="艺" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="prose prose-lg max-w-none font-serif leading-loose text-foreground/85">
              <div className="whitespace-pre-wrap">{article.content}</div>
            </div>
          </div>
        </section>
      )}

      {/* === 6. 作品画廊 === */}
      {gallery.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={ImageIcon} title="代表作品" watermark="品" accent={accent} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {gallery.map((g, i) => (
              <div
                key={i}
                className="group overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={g.url}
                    alt={g.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-serif text-sm font-semibold text-foreground">{g.title}</h4>
                  {g.description && (
                    <p className="mt-1 line-clamp-2 font-serif text-[11px] text-foreground/65">
                      {g.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center font-serif text-[10px] tracking-widest text-muted-foreground">
            后续将扩展视频、3D 浏览等沉浸式体验
          </p>
        </section>
      )}

      {/* === 7. 传承现状 === */}
      {article.influence && (
        <section className="mb-8">
          <SectionHeading icon={Award} title="传承现状" watermark="续" accent={accent} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
              {article.influence}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
