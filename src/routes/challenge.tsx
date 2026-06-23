import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { trackEvent } from "@/lib/journey-storage";
import { Calendar, CheckCircle, Flame, Star, Trophy, Users, Clock, ChevronLeft, ChevronRight, Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/challenge")({
  head: () => ({ meta: [{ title: "诗词打卡挑战 · 溯光" }] }),
  component: ChallengePage,
});

interface DailyPoem {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  content: string[];
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

interface ChallengeProgress {
  day: number;
  completed: boolean;
  poem_id: string;
  completed_at?: string;
}

const dailyPoems: DailyPoem[] = [
  {
    id: "p1",
    title: "静夜思",
    author: "李白",
    dynasty: "唐",
    content: ["床前明月光，疑是地上霜。", "举头望明月，低头思故乡。"],
    difficulty: "easy",
    category: "思乡",
  },
  {
    id: "p2",
    title: "春晓",
    author: "孟浩然",
    dynasty: "唐",
    content: ["春眠不觉晓，处处闻啼鸟。", "夜来风雨声，花落知多少。"],
    difficulty: "easy",
    category: "春景",
  },
  {
    id: "p3",
    title: "登鹳雀楼",
    author: "王之涣",
    dynasty: "唐",
    content: ["白日依山尽，黄河入海流。", "欲穷千里目，更上一层楼。"],
    difficulty: "easy",
    category: "哲理",
  },
  {
    id: "p4",
    title: "望庐山瀑布",
    author: "李白",
    dynasty: "唐",
    content: ["日照香炉生紫烟，遥看瀑布挂前川。", "飞流直下三千尺，疑是银河落九天。"],
    difficulty: "medium",
    category: "山水",
  },
  {
    id: "p5",
    title: "将进酒",
    author: "李白",
    dynasty: "唐",
    content: ["君不见黄河之水天上来，奔流到海不复回。", "君不见高堂明镜悲白发，朝如青丝暮成雪。", "人生得意须尽欢，莫使金樽空对月。"],
    difficulty: "hard",
    category: "豪放",
  },
  {
    id: "p6",
    title: "水调歌头·明月几时有",
    author: "苏轼",
    dynasty: "宋",
    content: ["明月几时有？把酒问青天。", "不知天上宫阙，今夕是何年。", "我欲乘风归去，又恐琼楼玉宇，高处不胜寒。"],
    difficulty: "hard",
    category: "中秋",
  },
  {
    id: "p7",
    title: "江雪",
    author: "柳宗元",
    dynasty: "唐",
    content: ["千山鸟飞绝，万径人踪灭。", "孤舟蓑笠翁，独钓寒江雪。"],
    difficulty: "medium",
    category: "冬景",
  },
];

const challenges = [
  { id: "c1", name: "七日诗词之旅", days: 7, reward: "诗心初萌徽章", participants: 1284 },
  { id: "c2", name: "三十日诗词修行", days: 30, reward: "诗情画意徽章", participants: 567 },
  { id: "c3", name: "百日诗词大师", days: 100, reward: "诗满天下徽章", participants: 89 },
];

function ChallengePage() {
  const [currentDay, setCurrentDay] = useState(1);
  const [currentPoem, setCurrentPoem] = useState<DailyPoem>(dailyPoems[0]);
  const [progress, setProgress] = useState<ChallengeProgress[]>([]);
  const [streak, setStreak] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizCorrect, setQuizCorrect] = useState(false);

  useEffect(() => {
    loadProgress();
    selectTodayPoem();
  }, []);

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem("sukou_challenge_progress");
      if (saved) {
        const data = JSON.parse(saved);
        setProgress(data.progress || []);
        setStreak(data.streak || 0);
        setCurrentDay(data.currentDay || 1);
      }
    } catch {}
  };

  const saveProgress = (newProgress: ChallengeProgress[], newStreak: number, newDay: number) => {
    try {
      localStorage.setItem("sukou_challenge_progress", JSON.stringify({
        progress: newProgress,
        streak: newStreak,
        currentDay: newDay,
      }));
    } catch {}
  };

  const selectTodayPoem = () => {
    const today = new Date().getDate();
    const index = today % dailyPoems.length;
    setCurrentPoem(dailyPoems[index]);
  };

  const handleCompleteDay = async () => {
    const newProgress: ChallengeProgress = {
      day: currentDay,
      completed: true,
      poem_id: currentPoem.id,
      completed_at: new Date().toISOString(),
    };

    const updatedProgress = [...progress.filter(p => p.day !== currentDay), newProgress];
    const newStreak = streak + 1;
    const newDay = currentDay + 1;

    setProgress(updatedProgress);
    setStreak(newStreak);
    setCurrentDay(newDay);
    saveProgress(updatedProgress, newStreak, newDay);

    await trackEvent({
      type: "article_view",
      title: `诗词打卡：${currentPoem.title}`,
      description: `第${currentDay}天打卡完成`,
      category: "诗词挑战",
    });

    toast.success(`第${currentDay}天打卡完成！连续${newStreak}天`);
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
    setQuizAnswer("");
    setQuizCorrect(false);
  };

  const handleCheckQuiz = () => {
    // 简单的作者匹配测验
    const correct = quizAnswer.trim() === currentPoem.author;
    setQuizCorrect(correct);
    if (correct) {
      toast.success("回答正确！");
      handleCompleteDay();
    } else {
      toast("回答错误，再想想看");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-600";
      case "medium": return "bg-yellow-100 text-yellow-600";
      case "hard": return "bg-red-100 text-red-600";
      default: return "bg-secondary/20 text-secondary-foreground";
    }
  };

  const getDifficultyName = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "入门";
      case "medium": return "进阶";
      case "hard": return "挑战";
      default: return "普通";
    }
  };

  const completedDays = progress.filter(p => p.completed).length;
  const isTodayCompleted = progress.some(p => p.day === currentDay && p.completed);

  return (
    <AppShell title="诗词打卡挑战">
      {/* 概览 */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-xs text-muted-foreground">连续打卡</span>
          </div>
          <p className="font-serif text-2xl text-foreground">{streak}</p>
          <p className="text-xs text-muted-foreground">天</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-xs text-muted-foreground">累计完成</span>
          </div>
          <p className="font-serif text-2xl text-foreground">{completedDays}</p>
          <p className="text-xs text-muted-foreground">天</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span className="text-xs text-muted-foreground">当前进度</span>
          </div>
          <p className="font-serif text-2xl text-foreground">第{currentDay}天</p>
          <p className="text-xs text-muted-foreground">挑战中</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-xs text-muted-foreground">获得徽章</span>
          </div>
          <p className="font-serif text-2xl text-foreground">
            {completedDays >= 7 ? 1 : 0}
            {completedDays >= 30 ? "+1" : ""}
            {completedDays >= 100 ? "+1" : ""}
          </p>
          <p className="text-xs text-muted-foreground">枚</p>
        </div>
      </div>

      {/* 今日诗词 */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-lg text-foreground">今日诗词</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs ${getDifficultyColor(currentPoem.difficulty)}`}>
            {getDifficultyName(currentPoem.difficulty)}
          </span>
        </div>

        {/* 诗词标题 */}
        <div className="text-center mb-6">
          <h3 className="font-serif text-2xl text-foreground">{currentPoem.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentPoem.dynasty} · {currentPoem.author}
          </p>
          <span className="mt-2 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-serif text-accent">
            {currentPoem.category}
          </span>
        </div>

        {/* 诗词内容 */}
        <div className="text-center space-y-3">
          {currentPoem.content.map((line, i) => (
            <p key={i} className="font-serif text-xl text-foreground leading-relaxed">
              {line}
            </p>
          ))}
        </div>

        {/* 打卡按钮 */}
        <div className="mt-8 flex justify-center gap-4">
          {isTodayCompleted ? (
            <div className="flex items-center gap-2 rounded-full bg-green-100 px-6 py-3 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-serif">今日已完成</span>
            </div>
          ) : (
            <>
              <button
                onClick={handleCompleteDay}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground hover:opacity-90"
              >
                <CheckCircle className="h-5 w-5" />
                <span className="font-serif">完成打卡</span>
              </button>
              <button
                onClick={handleStartQuiz}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-foreground hover:border-primary/30"
              >
                <Sparkles className="h-5 w-5" />
                <span className="font-serif">答题挑战</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 答题测验 */}
      {showQuiz && !isTodayCompleted && (
        <div className="mt-6 rounded-3xl border border-border bg-card p-6">
          <h3 className="font-serif text-lg text-foreground mb-4">答题挑战</h3>
          <p className="text-sm text-muted-foreground mb-4">
            这首诗的作者是谁？
          </p>
          <input
            type="text"
            value={quizAnswer}
            onChange={(e) => setQuizAnswer(e.target.value)}
            placeholder="输入作者姓名..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50"
          />
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setShowQuiz(false)}
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              取消
            </button>
            <button
              onClick={handleCheckQuiz}
              disabled={!quizAnswer.trim()}
              className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              提交答案
            </button>
          </div>
          {quizCorrect && (
            <div className="mt-4 rounded-xl bg-green-100 p-4 text-center">
              <p className="font-serif text-green-600">回答正确！打卡成功</p>
            </div>
          )}
        </div>
      )}

      {/* 挑赛列表 */}
      <div className="mt-8">
        <h2 className="mb-4 font-serif text-xl text-foreground">参与挑战</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {challenges.map((challenge) => {
            const challengeProgress = progress.filter(p => p.day <= challenge.days && p.completed).length;
            const progressPercent = Math.min(100, (challengeProgress / challenge.days) * 100);

            return (
              <div
                key={challenge.id}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-base text-foreground">{challenge.name}</h3>
                  <span className="text-xs text-muted-foreground">{challenge.days}天</span>
                </div>

                {/* 进度条 */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-border mb-3">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{challengeProgress}/{challenge.days} 天</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {challenge.participants}人参与
                  </span>
                </div>

                {/* 奖励 */}
                <div className="mt-4 rounded-xl bg-accent/10 p-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-accent" />
                    <span className="text-xs font-serif text-accent">
                      完成奖励：{challenge.reward}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 打卡日历 */}
      <div className="mt-8">
        <h2 className="mb-4 font-serif text-xl text-foreground">打卡记录</h2>
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="grid grid-cols-7 gap-2">
            {[...Array(30)].map((_, i) => {
              const day = i + 1;
              const completed = progress.some(p => p.day === day && p.completed);
              const isCurrent = day === currentDay;

              return (
                <div
                  key={day}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs ${
                    completed
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-2 border-primary text-primary"
                        : "border border-border text-muted-foreground"
                  }`}
                >
                  {completed ? <CheckCircle className="h-4 w-4" /> : day}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <span>第1天</span>
            <span>第30天</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}