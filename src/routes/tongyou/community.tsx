import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Trophy, Plus, Heart, Clock, User, Award, Send, Loader2, X, ChevronRight, BookOpen, Lightbulb, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/journey-storage";

export const Route = createFileRoute("/tongyou/community")({
  head: () => ({
    meta: [
      { title: "文化社区 · 溯光" },
      { name: "description", content: "与同好共话文化，以竞赛检验学识。发帖讨论、答题挑战，传承千年智慧。" },
    ],
  }),
  component: CommunityPage,
});

type TabType = "posts" | "quiz";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  replies: number;
  created_at: string;
  user_name?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  category: string;
}

const mockPosts: Post[] = [
  {
    id: "1",
    user_id: "user1",
    title: "李白的《将进酒》为何如此豪迈？",
    content: "《将进酒》是李白最著名的诗作之一，其豪迈奔放的风格令人震撼。诗中'天生我材必有用，千金散尽还复来'展现了诗人对人生的豁达态度...",
    category: "诗词讨论",
    likes: 42,
    replies: 8,
    created_at: new Date().toISOString(),
    user_name: "诗词爱好者",
  },
  {
    id: "2",
    user_id: "user2",
    title: "端午节除了屈原，还有哪些文化内涵？",
    content: "端午节不仅是纪念屈原，还有祛病防疫、龙舟竞渡、采药等多种民俗内涵。在不同地区，端午的习俗各有特色...",
    category: "节日民俗",
    likes: 35,
    replies: 12,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_name: "民俗研究者",
  },
  {
    id: "3",
    user_id: "user3",
    title: "《诗经》中的'风雅颂'如何理解？",
    content: "风是各地民歌，反映民间生活；雅是宫廷乐歌，体现贵族文化；颂是宗庙祭祀乐歌，彰显礼仪传统。三者共同构成周代社会的完整画卷...",
    category: "典籍研读",
    likes: 28,
    replies: 5,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    user_name: "古籍学者",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "李白被后人誉为什么称号？",
    options: ["诗圣", "诗仙", "诗鬼", "诗佛"],
    correct_index: 1,
    explanation: "李白因其诗歌风格豪放飘逸，想象奇特，被后人誉为'诗仙'。杜甫则被称为'诗圣'。",
    category: "人物",
  },
  {
    id: "q2",
    question: "《诗经》分为哪三部分？",
    options: ["风、雅、颂", "诗、词、曲", "赋、比、兴", "经、史、子"],
    correct_index: 0,
    explanation: "《诗经》分为风（民歌）、雅（宫廷乐歌）、颂（祭祀乐歌）三部分，合称'风雅颂'。",
    category: "典籍",
  },
  {
    id: "q3",
    question: "端午节最初是为了什么？",
    options: ["纪念屈原", "祛病防疫", "庆祝丰收", "祭祀祖先"],
    correct_index: 1,
    explanation: "端午节最初是祛病防疫的节日，后因纪念屈原而逐渐演变，形成了吃粽子、赛龙舟等习俗。",
    category: "节日",
  },
  {
    id: "q4",
    question: "昆曲被誉为什么？",
    options: ["百戏之王", "百戏之祖", "戏曲之母", "戏曲之源"],
    correct_index: 1,
    explanation: "昆曲是中国最古老的戏曲剧种之一，因其艺术体系完整、表演程式严谨，被誉为'百戏之祖'。",
    category: "非遗",
  },
  {
    id: "q5",
    question: "苏轼的号是什么？",
    options: ["青莲居士", "东坡居士", "六一居士", "香山居士"],
    correct_index: 1,
    explanation: "苏轼字子瞻，号东坡居士，北宋文学家、书画家。李白号青莲居士，欧阳修号六一居士。",
    category: "人物",
  },
];

function CommunityPage() {
  const [tab, setTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("诗词讨论");
  const [posting, setPosting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  
  // 答题状态
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number }[]>([
    { rank: 1, name: "诗词达人", score: 95 } as any,
    { rank: 2, name: "文化爱好者", score: 88 } as any,
    { rank: 3, name: "古籍学者", score: 82 } as any,
  ]);

  const categories = ["全部", "诗词讨论", "节日民俗", "典籍研读", "人物传记", "非遗传承", "其他话题"];

  // 加载帖子列表
  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && !error) {
        setPosts(data as Post[]);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
      // 失败时使用 mock 数据
      setPosts(mockPosts);
    } finally {
      setPostsLoading(false);
    }
  };

  // 加载排行榜
  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_scores")
        .select("user_name, score")
        .order("score", { ascending: false })
        .limit(10);

      if (data && !error && data.length > 0) {
        setLeaderboard(data.map((item, i) => ({
          rank: i + 1,
          name: item.user_name || "匿名用户",
          score: item.score,
        })));
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    }
  };

  useEffect(() => {
    const checkLogin = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session?.user);
    };
    checkLogin();
    loadPosts();
    loadLeaderboard();
  }, []);

  const filteredPosts = selectedCategory === "全部"
    ? posts
    : posts.filter(p => p.category === selectedCategory);

  const handleNewPost = async () => {
    if (!isLoggedIn) {
      toast("请先登录后再发帖");
      return;
    }
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast("请填写标题和内容");
      return;
    }

    setPosting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      
      if (!user) throw new Error("Not logged in");

      // 先获取用户昵称
      let userName = user.email?.split("@")[0] || "匿名用户";
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();
      
      if (profile?.nickname) {
        userName = profile.nickname;
      }

      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: user.id,
          user_name: userName,
          title: newPostTitle,
          content: newPostContent,
          category: newPostCategory,
          likes: 0,
          replies: 0,
        })
        .select()
        .single();

      if (data && !error) {
        setPosts([data as Post, ...posts]);
        setShowNewPost(false);
        setNewPostTitle("");
        setNewPostContent("");
        toast.success("帖子已发布");
        trackEvent({
          type: "post_create",
          title: newPostTitle,
          description: newPostContent.slice(0, 50),
          category: newPostCategory,
        });
      } else {
        throw error;
      }
    } catch (err) {
      console.error("Failed to create post:", err);
      // 降级：本地添加
      const newPost: Post = {
        id: `local-${Date.now()}`,
        user_id: "local-user",
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
        likes: 0,
        replies: 0,
        created_at: new Date().toISOString(),
        user_name: "我",
      };
      setPosts([newPost, ...posts]);
      setShowNewPost(false);
      setNewPostTitle("");
      setNewPostContent("");
      toast("帖子已发布（本地模式）");
      trackEvent({
        type: "post_create",
        title: newPostTitle,
        description: newPostContent.slice(0, 50),
        category: newPostCategory,
      });
    } finally {
      setPosting(false);
    }
  };

  const handleFinishQuiz = async () => {
    setQuizFinished(true);
    
    // 记录答题完成历程
    trackEvent({
      type: "quiz_complete",
      title: "知识答题",
      description: `答对 ${score} / ${quizQuestions.length} 题`,
      category: "答题挑战",
      metadata: {
        score: score,
        total: quizQuestions.length,
      },
    });
    
    if (isLoggedIn) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        
        if (user) {
          let userName = user.email?.split("@")[0] || "匿名用户";
          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", user.id)
            .maybeSingle();
          
          if (profile?.nickname) {
            userName = profile.nickname;
          }

          await supabase.from("quiz_scores").insert({
            user_id: user.id,
            user_name: userName,
            score,
            total: quizQuestions.length,
          });
          
          loadLeaderboard();
        }
      } catch (err) {
        console.error("Failed to save score:", err);
      }
    }
  };

  const handleNextQuiz = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(quizIndex + 1);
      setCurrentQuiz(quizQuestions[quizIndex + 1]);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // 完成所有题目
      handleFinishQuiz();
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setCurrentQuiz(quizQuestions[0]);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredCount(0);
    setQuizFinished(false);
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    setAnsweredCount(answeredCount + 1);
    
    if (index === currentQuiz?.correct_index) {
      setScore(score + 1);
    }
  };

  useEffect(() => {
    if (tab === "quiz" && !currentQuiz) {
      setCurrentQuiz(quizQuestions[0]);
    }
  }, [tab, currentQuiz]);

  return (
    <AppShell title="文化社区">
      <div className="mb-10 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">CULTURAL COMMUNITY</div>
        <h1 className="mt-3 font-serif text-4xl text-foreground">文 化 社 区</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-loose text-muted-foreground">
          与同好共话文化，以竞赛检验学识。发帖讨论、答题挑战，传承千年智慧。
        </p>
      </div>

      {/* 标签切换 */}
      <div className="mb-8 flex justify-center gap-4">
        <button
          onClick={() => setTab("posts")}
          className={`flex items-center gap-2 rounded-full px-6 py-3 font-serif text-sm transition ${
            tab === "posts"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-5 w-5" /> 话题讨论
        </button>
        <button
          onClick={() => setTab("quiz")}
          className={`flex items-center gap-2 rounded-full px-6 py-3 font-serif text-sm transition ${
            tab === "quiz"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trophy className="h-5 w-5" /> 竞赛答题
        </button>
      </div>

      {/* 话题讨论 */}
      {tab === "posts" && (
        <div className="space-y-6">
          {/* 发帖按钮 */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`rounded-full px-4 py-1.5 text-xs font-serif transition ${
                    selectedCategory === c
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNewPost(true)}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" /> 发起话题
            </button>
          </div>

          <p className="text-sm text-muted-foreground">共 {filteredPosts.length} 个话题</p>

          {/* 新帖弹窗 */}
          {showNewPost && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewPost(false)} />
              <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-serif text-lg text-foreground">发起新话题</h3>
                  <button onClick={() => setShowNewPost(false)} className="rounded-full p-1 hover:bg-secondary">
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="话题标题"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/70"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.filter(c => c !== "全部").map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewPostCategory(c)}
                      className={`rounded-full px-3 py-1 text-xs font-serif transition ${
                        newPostCategory === c
                          ? "bg-accent text-accent-foreground"
                          : "border border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="分享你的见解..."
                  rows={5}
                  className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/70 resize-none"
                />

                <button
                  onClick={handleNewPost}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm text-primary-foreground hover:opacity-90 transition"
                >
                  <Send className="h-4 w-4" /> 发布话题
                </button>
              </div>
            </div>
          )}

          {/* 帖子列表 */}
          <div className="space-y-4">
            {postsLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">暂无话题</p>
                <button
                  onClick={() => setShowNewPost(true)}
                  className="mt-4 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90"
                >
                  发起第一个话题
                </button>
              </div>
            ) : (
              filteredPosts.map((post, i) => (
                <Link
                  key={post.id}
                  to="/tongyou/community/$id"
                  params={{ id: post.id }}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="scroll-in group flex rounded-3xl border border-border bg-card p-6 transition hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex-1 flex items-start gap-4">
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-serif text-lg text-primary">
                      {post.user_name?.charAt(0) || "匿"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{post.user_name}</span>
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-serif text-accent">
                          {post.category}
                        </span>
                      </div>
                      <h3 className="mt-1 font-serif text-lg text-foreground group-hover:text-primary transition">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" /> {post.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(post.created_at).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* 竞赛答题 */}
      {tab === "quiz" && (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* 左侧：答题区 */}
          <div className="space-y-6">
            {quizFinished ? (
              /* 答题完成页面 */
              <div className="rounded-3xl border border-border bg-card p-8 text-center">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                  <Trophy className="h-10 w-10 text-accent" />
                </div>
                <h2 className="font-serif text-2xl text-foreground">答题完成！</h2>
                <div className="my-6">
                  <p className="text-sm text-muted-foreground">你的得分</p>
                  <p className="font-serif text-6xl text-primary">{score}<span className="text-2xl text-muted-foreground">/{quizQuestions.length}</span></p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {score === quizQuestions.length
                    ? "🎉 满分！你是真正的文化达人！"
                    : score >= quizQuestions.length * 0.8
                      ? "👍 优秀！传统文化功底深厚"
                      : score >= quizQuestions.length * 0.6
                        ? "😊 不错！继续加油"
                        : "💪 继续努力，多了解传统文化吧"
                  }
                </p>
                {!isLoggedIn && (
                  <p className="mt-3 text-xs text-muted-foreground">登录后可记录成绩并参与排行榜</p>
                )}
                <button
                  onClick={handleRestartQuiz}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm text-primary-foreground hover:opacity-90"
                >
                  <RefreshCw className="h-4 w-4" /> 再挑战一次
                </button>
              </div>
            ) : (
              <>
                {/* 进度显示 */}
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      第 {quizIndex + 1} / {quizQuestions.length} 题
                    </span>
                    <span className="flex items-center gap-1 text-sm font-serif text-foreground">
                      <Award className="h-4 w-4 text-accent" />
                      得分：{score}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 题目卡片 */}
                {currentQuiz && (
                  <div className="rounded-3xl border border-border bg-card p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-serif text-accent">
                        {currentQuiz.category}
                      </span>
                    </div>
                    
                    <h3 className="font-serif text-xl text-foreground">{currentQuiz.question}</h3>

                    {/* 选项 */}
                    <div className="mt-6 space-y-3">
                      {currentQuiz.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswer(index)}
                          disabled={showResult}
                          className={`w-full rounded-2xl border px-5 py-4 text-left font-serif text-base transition ${
                            showResult
                              ? index === currentQuiz.correct_index
                                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20"
                                : selectedAnswer === index
                                  ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20"
                                  : "border-border bg-background text-muted-foreground"
                              : selectedAnswer === index
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-foreground hover:border-primary/30"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    {/* 结果解释 */}
                    {showResult && (
                      <div className="mt-6 rounded-2xl border border-border bg-background/50 p-4">
                        <p className="text-sm text-muted-foreground">
                          {selectedAnswer === currentQuiz.correct_index
                            ? "✓ 回答正确！"
                            : "✗ 回答错误，正确答案是：" + currentQuiz.options[currentQuiz.correct_index]
                          }
                        </p>
                        <p className="mt-2 text-sm text-foreground">{currentQuiz.explanation}</p>
                      </div>
                    )}

                    {/* 下一题按钮 */}
                    {showResult && (
                      <button
                        onClick={handleNextQuiz}
                        className="mt-6 w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm text-primary-foreground hover:opacity-90 transition"
                      >
                        {quizIndex < quizQuestions.length - 1 ? "下一题" : "查看成绩"}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 右侧：答题规则 */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                <h3 className="font-serif text-lg text-foreground">答题规则</h3>
              </div>
              
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>每题四个选项，选择正确答案</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>答对得 1 分，答错不扣分</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>每题有详细解释说明</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>可随时重新开始挑战</span>
                </li>
              </ul>
            </div>

            {/* 排行榜 */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                <h3 className="font-serif text-lg text-foreground">排行榜</h3>
              </div>
              
              <div className="space-y-3">
                {leaderboard.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-serif ${
                      item.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                      item.rank === 2 ? "bg-gray-200 text-gray-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {item.rank}
                    </span>
                    <span className="flex-1 text-sm text-foreground truncate">{item.name}</span>
                    <span className="text-sm text-muted-foreground">{item.score}分</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}