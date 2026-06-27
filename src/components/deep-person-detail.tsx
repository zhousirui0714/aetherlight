import { useState } from "react";
import {
  Calendar,
  Users,
  BookOpen,
  Quote,
  MapPin,
  History,
  Award,
  GraduationCap,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lightbulb,
  Route
} from "lucide-react";

// 临时类型定义，后续可导入
interface TimelineEvent { year: string; event: string }
interface Relationship { name: string; relationship: string; description: string; poems?: string[]; famousQuote?: string }
interface FamousQuote { quote: string; source: string; interpretation: string }
interface Relic { name: string; location: string; description: string; highlights: string[] }
interface Allusion { title: string; story: string; origin: string; usage: string }
interface HistoricalComment { era: string; critic: string; comment: string; source: string; note?: string }
interface ModernResearch { scholar: string; work: string; contribution: string }
interface RecommendedReading { title: string; author?: string; note: string }
interface LearningPath { step: number; title: string; resources: string[] }

interface DeepPersonDetailProps {
  name: string;
  dynasty: string;
  birthYear?: string;
  deathYear?: string;
  description: string;
  timeline?: TimelineEvent[];
  relationships?: Relationship[];
  poetryFeatures?: {
    浪漫主义?: { description: string; examples?: string[] };
    语言风格?: { description: string; features: string[] };
    题材分类?: { [key: string]: { count: string; description: string; famous: string[] } };
  };
  famousQuotes?: { [category: string]: FamousQuote[] };
  relics?: Relic[];
  allusions?: Allusion[];
  historicalComments?: HistoricalComment[];
  modernResearch?: ModernResearch[];
  culturalInfluence?: {
    文学?: string[];
    艺术?: string[];
    生活?: string[];
    精神?: string[];
  };
  recommendedReadings?: RecommendedReading[];
  learningPath?: LearningPath[];
  onClose: () => void;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}

type TabType = "timeline" | "relationships" | "poetry" | "quotes" | "allusions" | "relics" | "comments" | "learning";

const tabConfig: { key: TabType; label: string; icon: typeof Calendar }[] = [
  { key: "timeline", label: "生平", icon: Calendar },
  { key: "relationships", label: "人物", icon: Users },
  { key: "poetry", label: "诗作", icon: BookOpen },
  { key: "quotes", label: "名句", icon: Quote },
  { key: "allusions", label: "典故", icon: Sparkles },
  { key: "relics", label: "遗迹", icon: MapPin },
  { key: "comments", label: "评价", icon: History },
  { key: "learning", label: "学习", icon: Route },
];

export function DeepPersonDetail({
  name,
  dynasty,
  birthYear,
  deathYear,
  description,
  timeline = [],
  relationships = [],
  poetryFeatures,
  famousQuotes = {},
  relics = [],
  allusions = [],
  historicalComments = [],
  recommendedReadings = [],
  learningPath = [],
  onClose,
  onNodeClick
}: DeepPersonDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>("timeline");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedItems(newSet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* 主面板 */}
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        {/* 头部 */}
        <div className="relative border-b border-border bg-gradient-to-r from-primary/10 via-background to-accent/10 p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground">{name}</h2>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span>{dynasty}</span>
                {birthYear && deathYear && (
                  <span>{birthYear} - {deathYear}</span>
                )}
              </div>
            </div>
          </div>
          
          <p className="mt-4 font-serif leading-relaxed text-foreground/80">
            {description}
          </p>
        </div>

        {/* 标签导航 */}
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4">
          {tabConfig.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-serif transition whitespace-nowrap border-b-2 -mb-px ${
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="max-h-[55vh] overflow-y-auto p-6">
          {/* 生平年表 */}
          {activeTab === "timeline" && (
            <div className="space-y-1">
              {timeline.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 shrink-0 rounded-full bg-primary" />
                    {index < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="pb-6">
                    <div className="font-serif font-semibold text-foreground">{event.year}</div>
                    <p className="mt-1 font-serif text-sm leading-relaxed text-muted-foreground">
                      {event.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 人物关系 */}
          {activeTab === "relationships" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {relationships.map((rel, index) => (
                <button
                  key={index}
                  onClick={() => onNodeClick?.(rel.name, "person")}
                  className="rounded-xl border border-border bg-secondary/30 p-4 text-left transition hover:border-primary/50 hover:bg-secondary/50"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-semibold text-foreground">{rel.name}</h4>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {rel.relationship}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 font-serif text-xs leading-relaxed text-muted-foreground">
                    {rel.description}
                  </p>
                  {rel.famousQuote && (
                    <p className="mt-3 border-l-2 border-primary/30 pl-3 font-serif text-xs italic text-foreground/70">
                      "{rel.famousQuote}"
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 诗作特色 */}
          {activeTab === "poetry" && poetryFeatures && (
            <div className="space-y-6">
              {poetryFeatures.浪漫主义 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-serif font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    浪漫主义风格
                  </h4>
                  <p className="font-serif text-sm leading-relaxed text-muted-foreground">
                    {poetryFeatures.浪漫主义.description}
                  </p>
                  {poetryFeatures.浪漫主义.examples && (
                    <div className="mt-3 space-y-2">
                      {poetryFeatures.浪漫主义.examples.map((ex, i) => (
                        <p key={i} className="border-l-2 border-primary/30 pl-3 font-serif text-sm text-foreground/80">
                          {ex}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {poetryFeatures.语言风格 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-serif font-semibold text-foreground">
                    <BookMarked className="h-4 w-4 text-primary" />
                    语言风格
                  </h4>
                  <p className="font-serif text-sm leading-relaxed text-muted-foreground">
                    {poetryFeatures.语言风格.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {poetryFeatures.语言风格.features.map((f, i) => (
                      <span key={i} className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground/70">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {poetryFeatures.题材分类 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-serif font-semibold text-foreground">
                    <BookOpen className="h-4 w-4 text-primary" />
                    题材分类
                  </h4>
                  <div className="grid gap-3">
                    {Object.entries(poetryFeatures.题材分类).map(([category, data]) => (
                      <button
                        key={category}
                        onClick={() => toggleExpand(`category-${category}`)}
                        className="rounded-xl border border-border bg-secondary/30 p-4 text-left transition hover:border-primary/30"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-serif font-semibold text-foreground">{category}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{data.count}</span>
                          </div>
                          {expandedItems.has(`category-${category}`) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="mt-1 font-serif text-xs text-muted-foreground">{data.description}</p>
                        {expandedItems.has(`category-${category}`) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {data.famous.map((f, i) => (
                              <span key={i} className="rounded bg-primary/10 px-2 py-1 font-serif text-xs text-primary">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 名句欣赏 */}
          {activeTab === "quotes" && (
            <div className="space-y-6">
              {Object.entries(famousQuotes).map(([category, quotes]) => (
                <div key={category}>
                  <h4 className="mb-3 font-serif font-semibold text-foreground">{category}</h4>
                  <div className="space-y-3">
                    {quotes.map((q, i) => (
                      <div key={i} className="rounded-xl border border-border bg-secondary/30 p-4">
                        <p className="font-serif text-base leading-relaxed text-foreground">
                          "{q.quote}"
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">—— {q.source}</span>
                          <button
                            onClick={() => toggleExpand(`quote-${category}-${i}`)}
                            className="text-xs text-primary hover:underline"
                          >
                            {expandedItems.has(`quote-${category}-${i}`) ? "收起释义" : "查看释义"}
                          </button>
                        </div>
                        {expandedItems.has(`quote-${category}-${i}`) && (
                          <p className="mt-3 border-t border-border pt-3 font-serif text-sm text-foreground/70">
                            {q.interpretation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 相关典故 */}
          {activeTab === "allusions" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {allusions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => toggleExpand(`allusion-${i}`)}
                  className="rounded-xl border border-border bg-secondary/30 p-4 text-left transition hover:border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-semibold text-foreground">{a.title}</h4>
                    {expandedItems.has(`allusion-${i}`) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">出自：{a.origin}</p>
                  {expandedItems.has(`allusion-${i}`) && (
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      <p className="font-serif text-sm leading-relaxed text-foreground/80">{a.story}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">用法：</span>{a.usage}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 遗迹遗址 */}
          {activeTab === "relics" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {relics.map((r, i) => (
                <div key={i} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif font-semibold text-foreground">{r.name}</h4>
                      <p className="text-xs text-muted-foreground">{r.location}</p>
                    </div>
                  </div>
                  <p className="mt-3 font-serif text-sm leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.highlights.map((h, j) => (
                      <span key={j} className="rounded bg-primary/5 px-2 py-0.5 text-[10px] text-primary/80">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 历代评价 */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              {historicalComments.map((c, i) => (
                <div key={i} className="rounded-xl border-l-4 border-primary/30 border-r border-t border-b border-border bg-secondary/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-serif font-semibold text-foreground">{c.critic}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{c.era}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.source}</span>
                  </div>
                  <p className="mt-3 font-serif text-sm leading-relaxed italic text-foreground/80">
                    "{c.comment}"
                  </p>
                  {c.note && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <Lightbulb className="mr-1 inline h-3 w-3" />
                      {c.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 学习路径 */}
          {activeTab === "learning" && (
            <div className="space-y-6">
              <div>
                <h4 className="mb-4 font-serif font-semibold text-foreground">进阶学习路径</h4>
                <div className="space-y-3">
                  {learningPath.map((path, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {path.step}
                        </div>
                        {i < learningPath.length - 1 && (
                          <div className="w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="pb-6">
                        <h5 className="font-serif font-semibold text-foreground">{path.title}</h5>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {path.resources.map((r, j) => (
                            <span key={j} className="rounded-lg bg-secondary px-2 py-1 text-xs text-foreground/70">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {recommendedReadings.length > 0 && (
                <div>
                  <h4 className="mb-3 font-serif font-semibold text-foreground">推荐阅读</h4>
                  <div className="space-y-2">
                    {recommendedReadings.map((r, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                        <BookOpen className="mt-0.5 h-4 w-4 text-primary" />
                        <div>
                          <p className="font-serif text-sm font-semibold text-foreground">{r.title}</p>
                          {r.author && (
                            <p className="text-xs text-muted-foreground">{r.author}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
