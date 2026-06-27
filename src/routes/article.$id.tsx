import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { ARTICLES } from "@/lib/knowledge-data";
import { normalizeArticle as normalizeV3Article, type Article, type RelatedItem } from "@/lib/knowledge-types";
import { getExpandedContent } from "@/lib/expanded-content";
import { trackEvent } from "@/lib/journey-storage";
import {
  ArticlePageShell,
  FigureSections,
  PoemSections,
  ClassicSections,
  FestivalSections,
  MythologySections,
  IntangibleSections,
  ArtifactSections,
  LifestyleSections,
  PhilosophySections,
  TechnologySections,
  ReferencesBlock,
  getCategoryMeta,
} from "@/components/article";
import type { TimelineEvent, ProcessStep } from "@/components/article";

/**
 * 服务端拉取文章 — SSR 优先，避免首屏"加载中…"
 * 优先级：Supabase knowledge_articles 表 → 静态 ARTICLES
 * 失败时返回 null，前端兜底显示未找到
 */
const fetchArticleServer = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    // 尝试 Supabase (服务端使用 service role key)
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row, error } = await supabaseAdmin
        .from("knowledge_articles")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (row && !error) return normalizeV3Article(row);
    } catch (err) {
      console.warn("[article-loader] supabase fetch failed, falling back to static:", err);
    }
    // 回退到静态 ARTICLES
    const staticArticle = ARTICLES.find((a) => a.id === data.id);
    if (staticArticle) return normalizeV3Article(staticArticle);
    return null;
  });

export const Route = createFileRoute("/article/$id")({
  loader: async ({ params }) => {
    const article = await fetchArticleServer({ data: { id: params.id } });
    return { article };
  },
  head: ({ loaderData, params }) => {
    const a: any = loaderData?.article;
    const title = a?.title ? `${a.title} · 溯光` : "知识详情 · 溯光";
    const desc = a?.excerpt || a?.content?.slice(0, 80) || "深入了解中华传统文化知识";
    const ogImage = a?.coverUrl || undefined;
    const url = `https://aetherlight.vercel.app/article/${params.id}`;
    // JSON-LD: Article schema.org
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a?.title || "",
      description: desc,
      image: ogImage ? [ogImage] : undefined,
      datePublished: a?.createdAt || undefined,
      dateModified: a?.createdAt || undefined,
      author: a?.author && a.author.length > 0
        ? { "@type": "Person", name: a.author }
        : { "@type": "Organization", name: "溯光 Aetherlight" },
      publisher: {
        "@type": "Organization",
        name: "溯光 Aetherlight",
        logo: { "@type": "ImageObject", url: "https://aetherlight.vercel.app/logo.png" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      keywords: a?.tags?.join(",") || [a?.category, a?.dynasty, a?.era].filter(Boolean).join(","),
      inLanguage: "zh-CN",
    };
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "溯光 Aetherlight" },
        { property: "og:locale", content: "zh_CN" },
        ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
        { name: "twitter:card", content: ogImage ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  component: ArticlePage,
});

/**
 * 字段归一化：DB snake_case / API camelCase / 静态 ARTICLES 都统一为 v3 Article
 * 直接复用 @/lib/knowledge-types 中的 normalizeArticle (它已经处理了中文 category → CategoryKey 映射)
 */
const normalizeArticle = normalizeV3Article;

function ArticlePage() {
  const navigate = useNavigate();
  const { article: loaderArticle } = Route.useLoaderData();

  // 追踪文章阅读
  useEffect(() => {
    if (loaderArticle) {
      trackEvent({
        type: "article_view",
        title: loaderArticle.title || "未知文章",
        description: loaderArticle.excerpt || loaderArticle.content?.slice(0, 50),
        category: getCategoryMeta(loaderArticle.category).label,
      });
    }
  }, [loaderArticle]);

  if (!loaderArticle) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="seal mb-4 text-2xl">溯</div>
          <h2 className="font-serif text-xl text-foreground">未找到这篇文章</h2>
          <p className="mt-2 text-sm text-muted-foreground">它可能已经被移动或删除</p>
          <button
            onClick={() => navigate({ to: "/gallery" })}
            className="mt-6 rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            返回知识长廊
          </button>
        </div>
      </AppShell>
    );
  }

  const article = loaderArticle;

  // 按 category 分发到对应章节
  const section = renderCategorySections(article);

  // 参考来源（统一构造）
  const references = buildReferences(article);

  return (
    <ArticlePageShell
      article={article}
      categorySections={section}
      enableAiAnalysis
      enableAiQA
      enableContinueTracing
      extra={references.length > 0 ? <ReferencesBlock sources={references} accent={getCategoryMeta(article.category).accent} /> : undefined}
    />
  );
}

// ---------------------------------------------------------------------------
// 按 category 分发到分类专属章节
// ---------------------------------------------------------------------------
function renderCategorySections(article: Article) {
  switch (article.category) {
    case "figures": {
      const { timeline, relationships } = expandFigureData(article);
      return <FigureSections article={article} timeline={timeline} relationships={relationships} />;
    }
    case "poems":
      return <PoemSections article={article} />;
    case "classics": {
      const { chapters, relatedSchools } = expandClassicData(article);
      return <ClassicSections article={article} chapters={chapters} relatedSchools={relatedSchools} />;
    }
    case "festivals": {
      const { targetDate, evolution, regionalVariations, foods } = expandFestivalData(article);
      return (
        <FestivalSections
          article={article}
          targetDate={targetDate}
          evolution={evolution}
          regionalVariations={regionalVariations}
          foods={foods}
        />
      );
    }
    case "mythology": {
      const { plot, characters, relationships } = expandMythologyData(article);
      return (
        <MythologySections
          article={article}
          plot={plot}
          characters={characters}
          relationships={relationships}
        />
      );
    }
    case "intangible": {
      const { craftFlow, gallery, inheritors } = expandIntangibleData(article);
      return (
        <IntangibleSections
          article={article}
          craftFlow={craftFlow}
          gallery={gallery}
          inheritors={inheritors}
        />
      );
    }
    case "artifacts": {
      const { evolution, coordinates, structureImages, relatedBuildings } = expandArtifactData(article);
      return (
        <ArtifactSections
          article={article}
          evolution={evolution}
          coordinates={coordinates}
          structureImages={structureImages}
          relatedBuildings={relatedBuildings}
        />
      );
    }
    case "lifestyle": {
      const { craft, evolution, regionalVariants, modernExperiences, relatedFestivals } = expandLifestyleData(article);
      return (
        <LifestyleSections
          article={article}
          craft={craft}
          evolution={evolution}
          regionalVariants={regionalVariants}
          modernExperiences={modernExperiences}
          relatedFestivals={relatedFestivals}
        />
      );
    }
    case "philosophy": {
      const { classics, comparisons, applications } = expandPhilosophyData(article);
      return (
        <PhilosophySections
          article={article}
          classics={classics}
          comparisons={comparisons}
          applications={applications}
        />
      );
    }
    case "technology": {
      const { principle, spreadRoute, modernContinuations } = expandTechnologyData(article);
      return (
        <TechnologySections
          article={article}
          principle={principle}
          spreadRoute={spreadRoute}
          modernContinuations={modernContinuations}
        />
      );
    }
    default: {
      // 兜底：通用详情页
      return (
        <div className="space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="prose prose-lg max-w-none font-serif leading-loose text-foreground/85">
              <div className="whitespace-pre-wrap">{article.content || article.excerpt}</div>
            </div>
          </div>
        </div>
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 数据扩展：从 article 提取/构造分类专属的数据 (timeline / characters / etc.)
// 这些是前端"从原始字段推断"出来的，缺数据时给空数组即可
// ---------------------------------------------------------------------------

function expandFigureData(article: Article) {
  const timeline: TimelineEvent[] = [];
  const relationships: {
    teachers: RelatedItem[];
    friends: RelatedItem[];
    students: RelatedItem[];
    family: RelatedItem[];
  } = {
    teachers: [],
    friends: [],
    students: [],
    family: [],
  };

  // 从 expanded-content 提取时间轴（如有）
  const expanded = getExpandedContent(article.id);
  if ((expanded as any)?.timeline && Array.isArray((expanded as any).timeline)) {
    timeline.push(...(expanded as any).timeline);
  }

  // 分类：relatedPeople 中带关键字的关系
  article.relatedPeople?.forEach((p) => {
    const brief = p.brief || "";
    if (brief.includes("师") || brief.includes("teacher")) relationships.teachers.push(p);
    else if (brief.includes("弟子") || brief.includes("学生")) relationships.students.push(p);
    else if (brief.includes("家族") || brief.includes("父") || brief.includes("子")) relationships.family.push(p);
    else relationships.friends.push(p);
  });

  return { timeline, relationships };
}

function expandClassicData(article: Article) {
  const chapters: { title: string; brief?: string }[] = [];
  const relatedSchools: RelatedItem[] = [];
  const expanded = getExpandedContent(article.id);
  if ((expanded as any)?.chapters && Array.isArray((expanded as any).chapters)) {
    chapters.push(...(expanded as any).chapters);
  }
  article.relatedBooks?.forEach((b) => {
    if (b.brief?.includes("学") || b.brief?.includes("派")) relatedSchools.push(b);
  });
  return { chapters, relatedSchools };
}

function expandFestivalData(article: Article) {
  const targetDate = (article as any).targetDate
    ? new Date((article as any).targetDate)
    : article.tags?.includes("节气")
      ? computeNextSolarTerm(article.title)
      : undefined;
  const evolution: TimelineEvent[] = [];
  const regionalVariations: { region: string; custom: string }[] = [];
  const foods: { name: string; description: string }[] = [];

  const expanded = getExpandedContent(article.id);
  if ((expanded as any)?.evolution) evolution.push(...(expanded as any).evolution);
  if ((expanded as any)?.regions) regionalVariations.push(...(expanded as any).regions);
  if ((expanded as any)?.foods) foods.push(...(expanded as any).foods);

  return { targetDate, evolution, regionalVariations, foods };
}

function expandMythologyData(article: Article) {
  const plot: TimelineEvent[] = [];
  const characters: { name: string; role: string; description: string }[] = [];
  const relationships: { from: string; to: string; type: string }[] = [];

  const expanded = getExpandedContent(article.id);
  if ((expanded as any)?.plot) plot.push(...(expanded as any).plot);
  if ((expanded as any)?.characters) characters.push(...(expanded as any).characters);
  if ((expanded as any)?.relationships) relationships.push(...(expanded as any).relationships);

  return { plot, characters, relationships };
}

function expandIntangibleData(article: Article) {
  const craftFlow: ProcessStep[] = [];
  const gallery: { url: string; title: string; description?: string }[] = [];
  const inheritors: { name: string; title?: string; brief?: string }[] = [];
  const expanded = getExpandedContent(article.id);
  if ((expanded as any)?.craftFlow) craftFlow.push(...(expanded as any).craftFlow);
  if ((expanded as any)?.gallery) gallery.push(...(expanded as any).gallery);
  if ((expanded as any)?.inheritors) inheritors.push(...(expanded as any).inheritors);
  return { craftFlow, gallery, inheritors };
}

function expandArtifactData(article: Article) {
  const evolution: TimelineEvent[] = [];
  const coordinates = (article as any).coordinates as { lat: number; lng: number } | undefined;
  const structureImages: { url: string; title: string; description?: string }[] = [];
  const relatedBuildings: RelatedItem[] = [];

  const expanded = getExpandedContent(article.id);
  if ((expanded as any)?.evolution) evolution.push(...(expanded as any).evolution);
  if ((expanded as any)?.structureImages) structureImages.push(...(expanded as any).structureImages);

  article.relatedArticles?.forEach((a) => {
    if (a.category === "artifacts") relatedBuildings.push(a);
  });

  return { evolution, coordinates, structureImages, relatedBuildings };
}

function expandLifestyleData(article: Article) {
  const craft: ProcessStep[] = [];
  const evolution: TimelineEvent[] = [];
  const regionalVariants: { region: string; features: string }[] = [];
  const modernExperiences: { name: string; description: string; url?: string }[] = [];
  const relatedFestivals: RelatedItem[] = [];

  const expanded = getExpandedContent(article.id);
  if ((expanded as any)?.craft) craft.push(...(expanded as any).craft);
  if ((expanded as any)?.evolution) evolution.push(...(expanded as any).evolution);
  if ((expanded as any)?.regionalVariants) regionalVariants.push(...(expanded as any).regionalVariants);
  if ((expanded as any)?.modernExperiences) modernExperiences.push(...(expanded as any).modernExperiences);

  article.relatedEvents?.forEach((e) => {
    if (e.category === "festivals") relatedFestivals.push(e);
  });

  return { craft, evolution, regionalVariants, modernExperiences, relatedFestivals };
}

function expandPhilosophyData(article: Article) {
  const classics: { title: string; text: string; source?: string }[] = [];
  const comparisons: { school: string; compare: string }[] = [];
  const applications: { scene: string; example: string }[] = [];

  const expanded = getExpandedContent(article.id);
  if ((expanded as any)?.classics) classics.push(...(expanded as any).classics);
  if ((expanded as any)?.comparisons) comparisons.push(...(expanded as any).comparisons);
  if ((expanded as any)?.applications) applications.push(...(expanded as any).applications);

  return { classics, comparisons, applications };
}

function expandTechnologyData(article: Article) {
  const principle: ProcessStep[] = [];
  const spreadRoute: TimelineEvent[] = [];
  const modernContinuations: { name: string; description: string }[] = [];
  const expanded = getExpandedContent(article.id);
  if ((expanded as any)?.principle) principle.push(...(expanded as any).principle);
  if ((expanded as any)?.spreadRoute) spreadRoute.push(...(expanded as any).spreadRoute);
  if ((expanded as any)?.modernContinuations) modernContinuations.push(...(expanded as any).modernContinuations);
  return { principle, spreadRoute, modernContinuations };
}

// ---------------------------------------------------------------------------
// 工具：构造参考来源
// ---------------------------------------------------------------------------
function buildReferences(article: Article): string[] {
  const refs: string[] = [];
  if (article.source) refs.push(article.source);
  if (article.influence) refs.push(`《中华文明通鉴》`);
  if (article.dynasty) refs.push(`《${article.dynasty}史》`);
  refs.push("AI 雅士文化知识库（综合参考）");
  return refs;
}

// ---------------------------------------------------------------------------
// 工具：节气倒计时日期估算
// 真正的节气计算需要天文算法，这里按月份近似处理
// ---------------------------------------------------------------------------
function computeNextSolarTerm(title: string): Date | undefined {
  const solarTerms2026: Record<string, { month: number; day: number }> = {
    "立春": { month: 2, day: 4 },
    "雨水": { month: 2, day: 19 },
    "惊蛰": { month: 3, day: 6 },
    "春分": { month: 3, day: 21 },
    "清明": { month: 4, day: 5 },
    "谷雨": { month: 4, day: 20 },
    "立夏": { month: 5, day: 6 },
    "小满": { month: 5, day: 21 },
    "芒种": { month: 6, day: 6 },
    "夏至": { month: 6, day: 21 },
    "小暑": { month: 7, day: 7 },
    "大暑": { month: 7, day: 23 },
    "立秋": { month: 8, day: 7 },
    "处暑": { month: 8, day: 23 },
    "白露": { month: 9, day: 8 },
    "秋分": { month: 9, day: 23 },
    "寒露": { month: 10, day: 8 },
    "霜降": { month: 10, day: 24 },
    "立冬": { month: 11, day: 7 },
    "小雪": { month: 11, day: 22 },
    "大雪": { month: 12, day: 7 },
    "冬至": { month: 12, day: 22 },
    "小寒": { month: 1, day: 6 },
    "大寒": { month: 1, day: 20 },
  };
  const t = solarTerms2026[title];
  if (!t) return undefined;
  const now = new Date();
  let year = now.getFullYear();
  const target = new Date(year, t.month - 1, t.day);
  if (target < now) {
    return new Date(year + 1, t.month - 1, t.day);
  }
  return target;
}
