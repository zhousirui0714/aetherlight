import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HeroBlock } from "./hero-block";
import { ActionBar } from "./action-bar";
import { AiDeepAnalysis } from "./ai-deep-analysis";
import { AiQAPanel } from "./ai-qa-panel";
import { ContinueTracingPath } from "./continue-tracing-path";
import { CompletenessBadge } from "./completeness-badge";
import { ArticleIllustration } from "@/components/article-illustration";
import { getCategoryMeta } from "./category-meta";
import type { Article } from "@/lib/knowledge-types";

interface ArticlePageShellProps {
  article: Article;
  /** 分类专属的章节组件 — 由详情页按 category 传入 */
  categorySections: ReactNode;
  /** 关联条目等其它内容 */
  extra?: ReactNode;
  /** 是否启用 AI 深度解析 (默认 true) */
  enableAiAnalysis?: boolean;
  /** 是否启用 AI 问答 (默认 true) */
  enableAiQA?: boolean;
  /** 是否启用继续溯光 (默认 true) */
  enableContinueTracing?: boolean;
}

/**
 * 详情页统一框架
 * 负责：AppShell、返回按钮、Hero、收藏分享、AI、继续溯光
 * 不负责：分类专属章节（由 categorySections 注入）
 */
export function ArticlePageShell({
  article,
  categorySections,
  extra,
  enableAiAnalysis = true,
  enableAiQA = true,
  enableContinueTracing = true,
}: ArticlePageShellProps) {
  const navigate = useNavigate();
  const meta = getCategoryMeta(article.category);

  return (
    <AppShell>
      {/* 顶部：返回按钮 + 分类路径 */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/gallery" })}
          className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 返回知识长廊
        </button>
        <div className="flex items-center gap-1.5 font-serif text-[10px] tracking-widest text-muted-foreground">
          <span>溯光</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{meta.label}</span>
        </div>
      </div>

      <article className="scroll-in">
        {/* ============ Hero ============ */}
        <HeroBlock
          title={article.title}
          excerpt={article.excerpt}
          categoryLabel={meta.label}
          subCategory={article.subCategory}
          tags={article.tags}
          cover={article.cover}
          coverUrl={article.coverUrl}
          dynasty={article.dynasty}
          era={article.era}
          region={article.region}
          author={article.author}
          favorites={article.favorites}
          viewCount={article.viewCount}
          heroHint={meta.heroHint}
          seal={meta.seal}
          accent={meta.accent}
          accent2={meta.accent2}
        />

        {/* 完整度徽章 (放在 Hero 下方) */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <CompletenessBadge
            articleId={article.id}
            known={{
              hasCover: !!article.coverUrl,
              hasExcerpt: !!article.excerpt && article.excerpt.length >= 10,
              hasBody: !!article.content && article.content.length >= 30,
              hasHistory: !!(article as any).history && (article as any).history.length >= 20,
              hasInfluence: !!(article as any).influence && (article as any).influence.length >= 20,
              hasFaq: Array.isArray((article as any).faq) && (article as any).faq.length >= 2,
              hasRelatedPeople:
                Array.isArray((article as any).relatedPeople) && (article as any).relatedPeople.length >= 1,
            }}
          />
        </div>

        {/* ============ 分类专属章节（核心） ============ */}
        <div className="mb-12">{categorySections}</div>

        {/* ============ AI 深度解析 ============ */}
        {enableAiAnalysis && (
          <AiDeepAnalysis article={article} accent={meta.accent} />
        )}

        {/* ============ 底部操作栏 ============ */}
        <ActionBar
          articleId={article.id}
          articleTitle={article.title}
          articleCategory={meta.label}
          dynasty={article.dynasty}
          author={article.author}
          excerpt={article.excerpt}
          cover={article.cover}
          coverUrl={article.coverUrl}
          tags={article.tags}
          accent={meta.accent}
          onTalkFigure={article.category === "figures" ? () =>
            navigate({ to: "/dialogue/$id", params: { id: article.id } })
          : undefined}
        />

        {/* ============ 其它内容（参考来源等） ============ */}
        {extra}

        {/* ============ AI 问答 ============ */}
        {enableAiQA && (
          <div className="mt-12">
            <AiQAPanel
              articleId={article.id}
              articleTitle={article.title}
              articleExcerpt={article.excerpt}
              articleCategory={meta.label}
              accent={meta.accent}
            />
          </div>
        )}

        {/* ============ 继续溯光 — 知识图谱驱动的探索路径 ============ */}
        {enableContinueTracing && (
          <div className="mt-4">
            <ContinueTracingPath
              articleId={article.id}
              articleTitle={article.title}
              accent={meta.accent}
            />
          </div>
        )}
      </article>
    </AppShell>
  );
}
