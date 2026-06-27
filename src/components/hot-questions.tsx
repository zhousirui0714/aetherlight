import { Link } from "@tanstack/react-router";
import { MessageSquare, ArrowRight, User, BookOpen, Sparkles, Lightbulb } from "lucide-react";

interface HotQuestion {
  question: string;
  category: string;
  icon: typeof User;
  color: string;
}

const hotQuestions: HotQuestion[] = [
  {
    question: "李白为什么被称为诗仙？",
    category: "人物",
    icon: User,
    color: "bg-primary/10 text-primary",
  },
  {
    question: "《诗经》的风雅颂指什么？",
    category: "典籍",
    icon: BookOpen,
    color: "bg-accent/10 text-accent",
  },
  {
    question: "端午节的由来是什么？",
    category: "节日",
    icon: Sparkles,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    question: "昆曲为何被称为百戏之祖？",
    category: "非遗",
    icon: Lightbulb,
    color: "bg-purple-100 text-purple-600",
  },
  {
    question: "苏轼的生平经历是怎样的？",
    category: "人物",
    icon: User,
    color: "bg-amber-100 text-amber-600",
  },
  {
    question: "二十四节气有什么文化意义？",
    category: "节气",
    icon: Sparkles,
    color: "bg-blue-100 text-blue-600",
  },
];

export function HotQuestions() {
  return (
    <section className="mt-24">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="font-serif text-xs tracking-[0.4em] text-accent">POPULAR Q&A</div>
          <h2 className="mt-2 font-serif text-3xl text-foreground">热门问答</h2>
          <p className="mt-2 text-sm text-muted-foreground">大家都在问的文化知识</p>
        </div>
        <Link
          to="/chat"
          className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition md:inline-flex"
        >
          更多 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hotQuestions.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={i}
              to="/chat"
              search={{ q: item.question }}
              style={{ animationDelay: `${i * 50}ms` }}
              className="scroll-in group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 rounded-xl p-2.5 ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                  <h3 className="mt-1 font-serif text-base text-foreground group-hover:text-primary transition line-clamp-2">
                    {item.question}
                  </h3>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>点击向雅士提问</span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 text-center md:hidden">
        <Link
          to="/chat"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
        >
          查看更多 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
