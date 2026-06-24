import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Plus, Heart, Clock, Send, Loader2, X, BookOpen, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/journey-storage";

export const Route = createFileRoute("/tongyou/community")({
  head: () => ({
    meta: [
      { title: "文化社区 · 溯光" },
      { name: "description", content: "与同好共话文化，发帖讨论，传承千年智慧。问答请前往「问雅士」。" },
    ],
  }),
  component: CommunityPage,
});

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

const CATEGORIES = [
  "全部",
  "诗词讨论",
  "典籍研读",
  "节日民俗",
  "节气物语",
  "非遗传承",
  "人物轶事",
  "其他话题",
];

function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("诗词讨论");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && !error && data.length > 0) {
        setPosts(data as Post[]);
      } else {
        // 没有数据时使用 mock
        setPosts(mockPosts);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
      setPosts(mockPosts);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session?.user);
    })();
    loadPosts();
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

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error("未登录");

      let userName = user.email?.split("@")[0] || "匿名用户";
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.nickname) userName = profile.nickname;

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
        toast.success("话题已发布");
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
      // 兜底：本地添加
      const localPost: Post = {
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
      setPosts([localPost, ...posts]);
      setShowNewPost(false);
      setNewPostTitle("");
      setNewPostContent("");
      toast("话题已发布（本地模式）");
      trackEvent({
        type: "post_create",
        title: newPostTitle,
        description: newPostContent.slice(0, 50),
        category: newPostCategory,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="文化社区">
      <div className="mb-8 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">CULTURAL COMMUNITY</div>
        <h1 className="mt-3 font-serif text-4xl text-foreground">文 化 社 区</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-loose text-muted-foreground">
          与同好共话文化。发帖讨论、分享心得，传承千年智慧。
        </p>
      </div>

      {/* 问雅士入口提示条 */}
      <div className="mx-auto mb-6 flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          <span>有文化问题想直接问？前往「<span className="font-serif text-foreground">问雅士</span>」可与 AI 多轮对话。</span>
        </div>
        <Link
          to="/chat"
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs text-accent-foreground transition hover:opacity-90"
        >
          <MessageCircle className="h-3.5 w-3.5" /> 立即提问
        </Link>
      </div>

      {/* 分类 + 发帖按钮 */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
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

      <p className="mb-3 text-sm text-muted-foreground">共 {filteredPosts.length} 个话题</p>

      {/* 新帖弹窗 */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setShowNewPost(false)} />
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-foreground">发起新话题</h3>
              <button
                onClick={() => !submitting && setShowNewPost(false)}
                className="rounded-full p-1 hover:bg-secondary"
                disabled={submitting}
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {!isLoggedIn && (
              <div className="mb-3 rounded-lg border border-amber-200/50 bg-amber-50/60 px-3 py-2 text-xs text-amber-900/80">
                提示：登录后可将话题同步到云端。
              </div>
            )}

            <input
              type="text"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="话题标题"
              maxLength={80}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/70"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c !== "全部").map((c) => (
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
              maxLength={2000}
              className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/70 resize-none"
            />

            <div className="mt-1 text-right text-[10px] text-muted-foreground/60">
              {newPostContent.length} / 2000
            </div>

            <button
              onClick={handleNewPost}
              disabled={submitting}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              发布话题
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
            <p className="mt-3 text-sm text-muted-foreground">该分类下暂无话题</p>
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
                    <span className="text-xs text-muted-foreground">{post.user_name || "匿名"}</span>
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
                      <Heart className="h-3.5 w-3.5" /> {post.likes ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> {post.replies ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(post.created_at).toLocaleDateString("zh-CN")}
                    </span>
                    {post.id.startsWith("local-") && (
                      <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-amber-100/60 px-2 py-0.5 text-[10px] text-amber-700">
                        <BookOpen className="h-2.5 w-2.5" /> 本地
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
