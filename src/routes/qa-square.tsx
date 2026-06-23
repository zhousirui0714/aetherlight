import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MessageSquare, Award, Clock, User, Star, BadgeCheck, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/qa-square")({
  head: () => ({ meta: [{ title: "文化问答广场 · 溯光" }] }),
  component: QASquarePage,
});

interface Question {
  id: string;
  user: string;
  content: string;
  category: string;
  answers: Answer[];
  likes: number;
  created_at: string;
}

interface Answer {
  id: string;
  user: string;
  user_title?: string;
  is_expert?: boolean;
  content: string;
  likes: number;
  created_at: string;
}

interface Expert {
  id: string;
  name: string;
  title: string;
  specialty: string;
  answered_count: number;
}

const mockExperts: Expert[] = [
  { id: "e1", name: "李教授", title: "北京大学中文系教授", specialty: "古典文学", answered_count: 128 },
  { id: "e2", name: "王研究员", title: "国家博物馆研究员", specialty: "文物考古", answered_count: 96 },
  { id: "e3", name: "张老师", title: "昆曲艺术传承人", specialty: "传统戏曲", answered_count: 72 },
  { id: "e4", name: "陈博士", title: "中医研究院博士", specialty: "传统医学", answered_count: 54 },
];

const mockQuestions: Question[] = [
  {
    id: "q1",
    user: "诗词爱好者",
    content: "《诗经》中的'风雅颂'分别代表什么含义？",
    category: "诗词",
    answers: [
      {
        id: "a1",
        user: "李教授",
        user_title: "北京大学中文系教授",
        is_expert: true,
        content: "'风雅颂'是《诗经》的三种体制分类。'风'是地方民歌，来自各诸侯国；'雅'是朝廷正乐，分为大雅和小雅；'颂'是宗庙祭祀用的舞曲歌辞。",
        likes: 42,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    likes: 18,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "q2",
    user: "文化新手",
    content: "昆曲为什么被称为'百戏之祖'？",
    category: "戏曲",
    answers: [
      {
        id: "a2",
        user: "张老师",
        user_title: "昆曲艺术传承人",
        is_expert: true,
        content: "昆曲起源于江苏昆山，距今已有600多年历史。它对中国戏曲的发展影响深远，许多地方戏曲都从昆曲中汲取了养分。",
        likes: 36,
        created_at: new Date(Date.now() - 5400000).toISOString(),
      },
    ],
    likes: 24,
    created_at: new Date(Date.now() - 8640000).toISOString(),
  },
  {
    id: "q3",
    user: "历史迷",
    content: "青花瓷为什么能成为中国陶瓷的代表？",
    category: "工艺",
    answers: [],
    likes: 12,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
];

function QASquarePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: "all", label: "全部" },
    { id: "诗词", label: "诗词" },
    { id: "戏曲", label: "戏曲" },
    { id: "工艺", label: "工艺" },
    { id: "历史", label: "历史" },
    { id: "医学", label: "医学" },
  ];

  const filteredQuestions = selectedCategory === "all"
    ? questions
    : questions.filter(q => q.category === selectedCategory);

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) {
      toast("请输入问题内容");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const newQ: Question = {
        id: `q${Date.now()}`,
        user: "访客",
        content: newQuestion,
        category: "诗词",
        answers: [],
        likes: 0,
        created_at: new Date().toISOString(),
      };
      setQuestions([newQ, ...questions]);
      setNewQuestion("");
      setSubmitting(false);
      toast.success("问题已发布");
    }, 1000);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "刚刚";
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString("zh-CN");
  };

  return (
    <AppShell title="文化问答广场">
      {/* 专家入驻区 */}
      <div className="mb-8 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-lg text-foreground">入驻专家</h2>
          </div>
          <span className="text-xs text-muted-foreground">{mockExperts.length} 位专家</span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {mockExperts.map((expert) => (
            <div
              key={expert.id}
              className="rounded-2xl border border-border bg-card/50 p-4 transition hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-lg text-primary">
                  {expert.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-serif text-sm text-foreground truncate">{expert.name}</p>
                    <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{expert.specialty}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>已回答 {expert.answered_count} 个问题</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 提问区 */}
      <div className="mb-6 rounded-3xl border border-border bg-card p-6">
        <h3 className="font-serif text-lg text-foreground mb-4">提出你的问题</h3>
        <textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="关于诗词、戏曲、工艺、历史等文化问题..."
          rows={3}
          className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/70"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmitQuestion}
            disabled={submitting || !newQuestion.trim()}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "发布中..." : "发布问题"}
          </button>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-serif transition ${
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 问题列表 */}
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <div
            key={question.id}
            className="rounded-3xl border border-border bg-card p-6"
          >
            {/* 问题 */}
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/50">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">{question.user}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(question.created_at)}</span>
                  </div>
                </div>
                <p className="mt-2 font-serif text-base text-foreground">
                  {question.content}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-serif text-accent">
                    {question.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {question.answers.length} 回答
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3" />
                    {question.likes}
                  </span>
                </div>
              </div>
            </div>

            {/* 回答 */}
            {question.answers.length > 0 && (
              <div className="mt-6 space-y-4">
                {question.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`rounded-2xl border ${
                      answer.is_expert ? "border-primary/30 bg-primary/5" : "border-border bg-background/50"
                    } p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        answer.is_expert ? "bg-primary/10" : "bg-secondary/50"
                      }`}>
                        {answer.is_expert ? (
                          <BadgeCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-serif text-sm ${
                            answer.is_expert ? "text-primary" : "text-foreground"
                          }`}>
                            {answer.user}
                          </p>
                          {answer.user_title && (
                            <span className="text-xs text-muted-foreground">
                              {answer.user_title}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                          {answer.content}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {answer.likes}
                          </span>
                          <span>{formatTime(answer.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 无回答提示 */}
            {question.answers.length === 0 && (
              <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">暂无回答，等待专家解答...</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredQuestions.length === 0 && (
        <div className="py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-serif text-muted-foreground">暂无问题</p>
          <p className="mt-2 text-sm text-muted-foreground/70">提出你的第一个问题吧</p>
        </div>
      )}
    </AppShell>
  );
}