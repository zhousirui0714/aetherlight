/**
 * 人物详情页章节 — 以人物传记为核心
 * 1. 人物画像（精选）
 * 2. 基础信息卡（字号朝代身份）
 * 3. 生平时间轴
 * 4. 人生故事
 * 5. 思想与贡献
 * 6. 代表作品
 * 7. 人物关系图
 * 8. 历史评价
 */
import { SectionHeading } from "../section-heading";
import { BasicInfoCard, I } from "../basic-info-card";
import { TimelineBlock, type TimelineEvent } from "../timeline-block";
import { RelatedItemsBlock } from "../knowledge-card";
import { Quote, Users, Sparkles, BookOpen, Star, Award } from "lucide-react";
import type { Article, RelatedItem } from "@/lib/knowledge-types";
import { getCategoryMeta } from "../category-meta";

interface Props {
  article: Article;
  /** 生平时间轴（API 字段或前端构造） */
  timeline?: TimelineEvent[];
  /** 人物关系（师承/朋友/弟子/家族） */
  relationships?: {
    teachers?: RelatedItem[];
    friends?: RelatedItem[];
    students?: RelatedItem[];
    family?: RelatedItem[];
  };
}

export function FigureSections({ article, timeline = [], relationships }: Props) {
  const meta = getCategoryMeta("figures");
  const accent = meta.accent;
  const rel = relationships || {
    teachers: article.relatedPeople?.filter((p) => p.brief?.includes("师")),
    friends: article.relatedPeople?.filter((p) => p.brief?.includes("友")),
    students: article.relatedPeople?.filter((p) => p.brief?.includes("弟子")),
    family: article.relatedPeople?.filter((p) => p.brief?.includes("家族")),
  };

  return (
    <>
      {/* === 1. 基础信息卡 === */}
      <BasicInfoCard
        title="人物画像"
        accent={accent}
        columns={4}
        items={[
          { icon: I.user, label: "姓名", value: article.title, primary: true },
          { icon: I.feather, label: "字 / 号", value: (article as any).courtesyName || (article as any).aliasName || "—", primary: true },
          { icon: I.calendar, label: "生卒", value: (article as any).lifeSpan || (article as any).birthDeath || "—", primary: true },
          { icon: I.crown, label: "朝代", value: article.dynasty || article.era || "—", primary: true },
          { icon: I.map, label: "籍贯", value: article.region || (article as any).birthplace || "—", primary: true },
          { icon: I.tag, label: "身份", value: (article as any).identity || article.subCategory || "—", primary: true },
          { icon: I.book, label: "代表作品", value: (article as any).representativeWorks || article.classics?.[0] || "—", primary: true },
          { icon: I.beaker, label: "主要成就", value: (article as any).achievements || "—", primary: true },
        ]}
      />

      {/* === 2. 生平时间轴 === */}
      {timeline.length > 0 && (
        <TimelineBlock
          title="生平时间轴"
          events={timeline}
          accent={accent}
          watermark="生"
        />
      )}

      {/* === 3. 人生故事（content 主体） === */}
      <section className="mb-8">
        <SectionHeading icon={Quote} title="人生故事" watermark="传" accent={accent} />
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="prose prose-lg max-w-none font-serif leading-loose text-foreground/85">
            {article.content ? (
              <div className="whitespace-pre-wrap">
                {article.content}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无详细介绍。</p>
            )}
          </div>
        </div>
      </section>

      {/* === 4. 思想与贡献 === */}
      {(article.history || (article as any).thought) && (
        <section className="mb-8">
          <SectionHeading icon={Sparkles} title="思想与贡献" watermark="思" accent={accent} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(article as any).thought && (
              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: accent,
                  background: `color-mix(in oklab, ${accent} 5%, var(--color-card))`,
                }}
              >
                <div className="mb-2 flex items-center gap-2 text-xs tracking-widest" style={{ color: accent }}>
                  <Sparkles className="h-3.5 w-3.5" /> 思想精髓
                </div>
                <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
                  {(article as any).thought}
                </p>
              </div>
            )}
            {(article as any).achievements && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-2 flex items-center gap-2 text-xs tracking-widest text-muted-foreground">
                  <Award className="h-3.5 w-3.5" /> 主要贡献
                </div>
                <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-foreground/85">
                  {(article as any).achievements}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* === 5. 代表作品 === */}
      {article.classics && article.classics.length > 0 && (
        <section className="mb-8">
          <SectionHeading icon={BookOpen} title="代表作品" watermark="作" accent={accent} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {article.classics.map((w, i) => (
              <div
                key={i}
                className="group cursor-pointer rounded-xl border border-border bg-card p-4 text-center transition hover:border-foreground/30 hover:shadow-sm"
              >
                <div
                  className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-sm font-serif text-sm font-bold text-white"
                  style={{ background: accent }}
                >
                  {i + 1}
                </div>
                <p className="font-serif text-sm font-semibold text-foreground">{w}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === 6. 人物关系图 === */}
      {(rel.teachers?.length || rel.friends?.length || rel.students?.length || rel.family?.length) ? (
        <section className="mb-8">
          <SectionHeading icon={Users} title="人物关系" watermark="系" accent={accent} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rel.teachers && rel.teachers.length > 0 && (
              <RelationCard title="师承" items={rel.teachers} accent={accent} />
            )}
            {rel.friends && rel.friends.length > 0 && (
              <RelationCard title="友人" items={rel.friends} accent={accent} />
            )}
            {rel.students && rel.students.length > 0 && (
              <RelationCard title="弟子" items={rel.students} accent={accent} />
            )}
            {rel.family && rel.family.length > 0 && (
              <RelationCard title="家族" items={rel.family} accent={accent} />
            )}
          </div>
        </section>
      ) : null}

      {/* === 7. 历史评价 === */}
      {article.influence && (
        <section className="mb-8">
          <SectionHeading icon={Star} title="历史评价" watermark="评" accent={accent} />
          <div
            className="relative overflow-hidden rounded-2xl border-l-4 bg-card p-6"
            style={{ borderColor: accent }}
          >
            <Quote className="absolute right-4 top-4 h-12 w-12 text-foreground/[0.04]" />
            <p className="whitespace-pre-line font-serif text-base italic leading-loose text-foreground/85">
              {article.influence}
            </p>
          </div>
        </section>
      )}
    </>
  );
}

function RelationCard({ title, items, accent }: { title: string; items: RelatedItem[]; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-sm font-serif text-xs font-bold text-white"
          style={{ background: accent }}
        >
          {title[0]}
        </span>
        <h3 className="font-serif text-sm font-semibold tracking-wider text-foreground">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((p, i) => (
          <RelatedItemRow key={i} item={p} />
        ))}
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

function RelatedItemRow({ item }: { item: RelatedItem }) {
  return (
    <Link
      to="/article/$id"
      params={{ id: item.id }}
      className="group flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2 transition hover:border-foreground/30 hover:bg-background"
    >
      <span className="font-serif text-sm font-semibold text-foreground">{item.title}</span>
      {item.brief && (
        <span className="line-clamp-1 flex-1 font-serif text-xs text-muted-foreground">
          {item.brief}
        </span>
      )}
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition group-hover:translate-x-0.5" />
    </Link>
  );
}
