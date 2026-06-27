// 详情页组件 barrel — 统一对外导出
export { ArticlePageShell } from "./article-page-shell";
export { HeroBlock } from "./hero-block";
export { BasicInfoCard, I as BasicInfoIcons } from "./basic-info-card";
export { SectionHeading } from "./section-heading";
export { TimelineBlock } from "./timeline-block";
export type { TimelineEvent } from "./timeline-block";
export { ProcessFlow } from "./process-flow";
export type { ProcessStep } from "./process-flow";
export { MapBlock } from "./map-block";
export { KnowledgeCard, RelatedItemsBlock } from "./knowledge-card";
export type { RelatedItem as ArticleRelatedItem } from "@/lib/knowledge-types";
export { ReferencesBlock } from "./references-block";
export { ActionBar } from "./action-bar";
export { ContinueTracingPath } from "./continue-tracing-path";
export { AiDeepAnalysis } from "./ai-deep-analysis";
export { AiQAPanel } from "./ai-qa-panel";

// 10 个分类的章节组件
export { FigureSections } from "./sections/figure-sections";
export { PoemSections } from "./sections/poem-sections";
export { ClassicSections } from "./sections/classic-sections";
export { FestivalSections } from "./sections/festival-sections";
export { MythologySections } from "./sections/mythology-sections";
export { IntangibleSections } from "./sections/intangible-sections";
export { ArtifactSections } from "./sections/artifact-sections";
export { LifestyleSections } from "./sections/lifestyle-sections";
export { PhilosophySections } from "./sections/philosophy-sections";
export { TechnologySections } from "./sections/technology-sections";

// 分类配置
export { CATEGORY_META, getCategoryMeta } from "./category-meta";
