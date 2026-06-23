import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { heritageCategories, featuredPractitioners, type Practitioner, type HeritageCategory } from "@/lib/heritage-data";
import { MapPin, Award, Briefcase, Star, ChevronRight, Users } from "lucide-react";

export const Route = createFileRoute("/heritage")({
  head: () => ({ meta: [{ title: "非遗传承人 · 溯光" }] }),
  component: HeritagePage,
});

function HeritagePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null);

  const filteredPractitioners = selectedCategory === "all"
    ? featuredPractitioners
    : featuredPractitioners.filter(p => 
        p.category.toLowerCase().includes(selectedCategory) ||
        heritageCategories.find(c => c.id === selectedCategory)?.name.includes(p.category)
      );

  const totalCount = heritageCategories.reduce((sum, c) => sum + c.count, 0);

  return (
    <AppShell title="非遗传承人">
      {/* 介绍区 */}
      <div className="mb-8 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-8">
        <div className="flex items-start gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-foreground">非遗传承人专题</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              记录那些守护千年技艺的匠人。他们用一生的时间，传承着祖先留下的珍贵文化遗产。
              每一位传承人，都是活着的历史，是文化延续的桥梁。
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="font-serif text-lg">{totalCount}+</span>
                <span className="text-xs text-muted-foreground">项非遗</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <span className="font-serif text-lg">{featuredPractitioners.length}</span>
                <span className="text-xs text-muted-foreground">位传承人</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-serif transition ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          全部
        </button>
        {heritageCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{cat.icon}</span>
            <span className="font-serif">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 分类概览 */}
      {selectedCategory === "all" && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {heritageCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="rounded-2xl border border-border bg-card p-4 text-center transition hover:border-primary/30 hover:shadow-md"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <p className="font-serif text-sm text-foreground">{cat.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{cat.count} 项</p>
            </button>
          ))}
        </div>
      )}

      {/* 传承人列表 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPractitioners.map((p, index) => (
          <button
            key={p.id}
            onClick={() => setSelectedPractitioner(p)}
            className="group rounded-3xl border border-border bg-card p-6 text-left transition hover:border-primary/30 hover:shadow-lg"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* 头部 */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-xl text-primary">
                {p.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition">
                  {p.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.title}</p>
              </div>
            </div>

            {/* 信息 */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{p.specialty}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{p.region}</span>
              </div>
            </div>

            {/* 简介 */}
            <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
              {p.bio}
            </p>

            {/* 成就标签 */}
            {p.achievements && p.achievements.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {p.achievements.slice(0, 2).map((a, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-serif text-accent"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}

            {/* 查看详情 */}
            <div className="mt-4 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition">
              <span>查看详情</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>

      {/* 详情弹窗 */}
      {selectedPractitioner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPractitioner(null)}
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-background p-8 shadow-2xl">
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedPractitioner(null)}
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-secondary transition"
            >
              ×
            </button>

            {/* 头部 */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-serif text-2xl text-primary">
                {selectedPractitioner.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-serif text-xl text-foreground">
                  {selectedPractitioner.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedPractitioner.title}
                </p>
              </div>
            </div>

            {/* 基本信息 */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card/50 p-3">
                <p className="text-xs text-muted-foreground">专长领域</p>
                <p className="mt-1 font-serif text-sm text-foreground">
                  {selectedPractitioner.specialty}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card/50 p-3">
                <p className="text-xs text-muted-foreground">所在地区</p>
                <p className="mt-1 font-serif text-sm text-foreground">
                  {selectedPractitioner.region}
                </p>
              </div>
            </div>

            {/* 简介 */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-2">人物简介</p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                {selectedPractitioner.bio}
              </p>
            </div>

            {/* 代表作品 */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-2">代表作品</p>
              <div className="flex flex-wrap gap-2">
                {selectedPractitioner.works.map((work, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-serif text-foreground/80"
                  >
                    {work}
                  </span>
                ))}
              </div>
            </div>

            {/* 成就 */}
            {selectedPractitioner.achievements && selectedPractitioner.achievements.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-2">荣誉成就</p>
                <div className="space-y-2">
                  {selectedPractitioner.achievements.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2"
                    >
                      <Star className="h-4 w-4 text-accent" />
                      <span className="text-sm font-serif text-foreground">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {filteredPractitioners.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-4xl mb-4">🎭</div>
          <p className="font-serif text-muted-foreground">该分类暂无传承人数据</p>
          <button
            onClick={() => setSelectedCategory("all")}
            className="mt-4 rounded-full border border-border px-4 py-2 text-sm hover:border-primary/30"
          >
            查看全部
          </button>
        </div>
      )}
    </AppShell>
  );
}