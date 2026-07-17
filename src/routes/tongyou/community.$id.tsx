import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { ArrowLeft, Heart, MessageSquare, Clock, User, Send, Loader2, X, ThumbsUp, Reply } from "lucide-react";
import { toast } from "sonner";

// supabase 在函数内动态 import，避免 SSR 模块求值时触发代理导致错误
function getSupabase() {
  return import("@/integrations/supabase/client").then((m) => m.supabase);
}

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  replies: number;
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  content: string;
  reply_to?: string;
  reply_to_name?: string;
  likes: number;
  created_at: string;
}

const mockPosts: Post[] = [
  {
    id: "1",
    user_id: "user1",
    user_name: "诗词爱好者",
    title: "李白的《将进酒》为何如此豪迈？",
    content: "《将进酒》是李白最著名的诗作之一，其豪迈奔放的风格令人震撼。\n\n诗中'天生我材必有用，千金散尽还复来'展现了诗人对人生的豁达态度。李白以酒为媒，抒发胸中块垒，将个人的失意与对自由的追求完美融合。\n\n这首诗的艺术特色：\n1. 气势磅礴，一泻千里\n2. 想象奇特，夸张大胆\n3. 情感真挚，感染力强\n\n正如诗中所言：'古来圣贤皆寂寞，惟有饮者留其名。'李白用他独特的方式，在诗歌史上留下了浓墨重彩的一笔。",
    category: "诗词讨论",
    likes: 42,
    replies: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "user2",
    user_name: "民俗研究者",
    title: "端午节除了屈原，还有哪些文化内涵？",
    content: "端午节不仅是纪念屈原，还有祛病防疫、龙舟竞渡、采药等多种民俗内涵。在不同地区，端午的习俗各有特色，如江南的赛龙舟、北方的射柳、闽南的扒龙船等。\n\n端午节的文化内涵：\n1. 防疫驱邪——挂艾草、饮雄黄酒\n2. 纪念先贤——屈原、伍子胥、曹娥\n3. 竞技娱乐——龙舟竞渡\n4. 团圆和睦——包粽子、家庭聚会",
    category: "节日民俗",
    likes: 35,
    replies: 12,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    user_id: "user3",
    user_name: "古籍学者",
    title: "《诗经》中的'风雅颂'如何理解？",
    content: "风是各地民歌，反映民间生活；雅是宫廷乐歌，体现贵族文化；颂是宗庙祭祀乐歌，彰显礼仪传统。三者共同构成周代社会的完整画卷。\n\n'风'包含十五国风，共160篇，是《诗经》中最富生活气息的部分。'雅'分为大雅、小雅，共105篇，多为贵族宴饮、朝会之作。'颂'共40篇，是宗庙祭祀时所用的乐歌。",
    category: "典籍研读",
    likes: 28,
    replies: 5,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const mockComments: Comment[] = [
  {
    id: "c1",
    post_id: "1",
    user_id: "user4",
    user_name: "文化爱好者",
    content: "同意！李白的豪放确实无人能及，尤其是'君不见黄河之水天上来'这句，气势磅礴！",
    likes: 12,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "c2",
    post_id: "1",
    user_id: "user5",
    user_name: "唐诗研究",
    content: "补充一下，《将进酒》写于李白被排挤出长安之后，那种怀才不遇的悲愤也融入了诗中。",
    likes: 8,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "c3",
    post_id: "1",
    user_id: "user6",
    user_name: "诗词新手",
    reply_to: "c2",
    reply_to_name: "唐诗研究",
    content: "原来是这样！学习了~",
    likes: 3,
    created_at: new Date(Date.now() - 5400000).toISOString(),
  },
];

// 用 loader 获取 postId，避免在组件中使用 useParams()
// TanStack Router 子路由嵌套时 useParams 在 SSR 下可能触发内部错误
export const Route = createFileRoute("/tongyou/community/$id")({
  loader: ({ params }) => {
    return { postId: params.id };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `帖子 ${loaderData.postId} · 文化社区 · 溯光` },
    ],
  }),
  component: PostDetailPage,
});

function PostDetailPage() {
  const { postId } = Route.useLoaderData();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [localLikes, setLocalLikes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [liked, setLiked] = useState(false);

  // postId 变化时从 mock 数据同步状态（立即，不依赖 Supabase）
  useEffect(() => {
    const matched = mockPosts.find((p) => p.id === postId) ?? null;
    setPost(matched);
    setLocalLikes(matched?.likes ?? 0);
    setLiked(false);
    setComments(postId === "1" ? mockComments : []);
  }, [postId]);

  useEffect(() => {
    (async () => {
      const sb = await getSupabase();
      const { data } = await sb.auth.getSession();
      setIsLoggedIn(!!data.session?.user);
    })();
    loadPostFromDb();
    loadCommentsFromDb();
  }, [postId]);

  // 后台从 Supabase 拉取帖子内容
  const loadPostFromDb = async () => {
    try {
      const sb = await getSupabase();
      const { data, error } = await sb
        .from("community_posts")
        .select("*")
        .eq("id", postId)
        .maybeSingle();
      if (data && !error) {
        setPost(data as Post);
        setLocalLikes(data.likes);
      }
    } catch (err) {
      console.error("Failed to load post from DB:", err);
    }
  };

  const loadCommentsFromDb = async () => {
    try {
      const sb = await getSupabase();
      const { data, error } = await sb
        .from("community_replies")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data && !error && data.length > 0) {
        setComments(data as Comment[]);
      } else {
        setComments(mockComments);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
      setComments(mockComments);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    setLiked(!liked);
    setLocalLikes(prev => liked ? prev - 1 : prev + 1);
    if (isLoggedIn) {
      try {
        const sb = await getSupabase();
        await sb.from("community_posts")
          .update({ likes: liked ? post.likes - 1 : post.likes + 1 })
          .eq("id", post.id);
      } catch {}
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) { toast("请输入评论内容"); return; }
    setCommenting(true);
    try {
      const sb = await getSupabase();
      const { data: sessionData } = await sb.auth.getSession();
      const user = sessionData.session?.user;
      let userName = "匿名用户";
      if (user) {
        userName = user.email?.split("@")[0] || "匿名用户";
        const { data: profile } = await sb.from("profiles")
          .select("nickname").eq("id", user.id).maybeSingle();
        if (profile?.nickname) userName = profile.nickname;
      }
      const newCommentData = { post_id: postId, user_id: user?.id || "anonymous", user_name: userName, content: newComment, reply_to: replyingTo?.id, reply_to_name: replyingTo?.user_name, likes: 0 };
      if (isLoggedIn && user) {
        const { data, error } = await sb.from("community_replies")
          .insert(newCommentData).select().single();
        if (data && !error) setComments([data as Comment, ...comments]);
        else throw error;
      } else {
        setComments([{ ...newCommentData, id: `local-${Date.now()}`, created_at: new Date().toISOString() }, ...comments]);
        toast("评论已发布（本地模式）");
      }
      setNewComment(""); setReplyingTo(null);
      toast.success("评论已发布");
    } catch {
      setComments([...comments, { post_id: postId, user_id: "anonymous", user_name: "匿名用户", content: newComment, reply_to: replyingTo?.id, reply_to_name: replyingTo?.user_name, likes: 0, id: `local-${Date.now()}`, created_at: new Date().toISOString() }]);
      setNewComment(""); setReplyingTo(null);
      toast("评论已发布（本地模式）");
    } finally { setCommenting(false); }
  };

  const handleLikeComment = async (commentId: string, currentLikes: number) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
    if (isLoggedIn) {
      try {
        const sb = await getSupabase();
        await sb.from("community_replies").update({ likes: currentLikes + 1 }).eq("id", commentId);
      } catch {}
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 font-serif text-sm text-muted-foreground">加载中...</p>
        </div>
      </AppShell>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="font-serif text-lg text-muted-foreground">帖子不存在</p>
          <Link to="/tongyou/community" className="mt-4 text-sm text-primary hover:underline">返回社区</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">首页</Link>
        <span className="mx-2 text-border">/</span>
        <Link to="/tongyou/community" className="hover:text-foreground">文化社区</Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground/80">帖子详情</span>
      </nav>
      <button onClick={() => window.history.back()} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> 返回列表
      </button>
      <article className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8">
        <span className="inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-serif text-accent">{post.category}</span>
        <h1 className="mt-4 font-serif text-2xl text-foreground">{post.title}</h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><User className="h-5 w-5 text-primary" /></div>
          <div><p className="font-serif text-sm text-foreground">{post.user_name}</p><p className="text-xs text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />{formatTime(post.created_at)}</p></div>
        </div>
        <div className="mt-6 whitespace-pre-line font-serif text-base leading-loose text-foreground/90">{post.content}</div>
        <div className="mt-8 flex items-center gap-8 border-t border-border pt-6">
          <button onClick={handleLike} className={`flex items-center gap-2 transition ${liked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Heart className={`h-5 w-5 ${liked ? "fill-primary" : ""}`} /><span className="text-sm">{localLikes}</span>
          </button>
          <div className="flex items-center gap-2 text-muted-foreground"><MessageSquare className="h-5 w-5" /><span className="text-sm">{comments.length}</span></div>
        </div>
      </article>
      <section className="mx-auto mt-8 max-w-3xl">
        <h2 className="font-serif text-xl text-foreground">评论 ({comments.length})</h2>
        <div className="mt-4 rounded-3xl border border-border bg-card p-4">
          {replyingTo && (
            <div className="mb-3 flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">回复 <span className="font-serif text-foreground">{replyingTo.user_name}</span></p>
              <button onClick={() => setReplyingTo(null)} className="rounded-full p-1 hover:bg-border"><X className="h-4 w-4" /></button>
            </div>
          )}
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="写下你的评论..." rows={3}
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/70" />
          <div className="mt-3 flex justify-end">
            <button onClick={handleSubmitComment} disabled={commenting || !newComment.trim()}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
              {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {commenting ? "发布中..." : "发布评论"}
            </button>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10"><User className="h-4 w-4 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm text-foreground">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(comment.created_at)}</span>
                  </div>
                  {comment.reply_to && <p className="mt-1 text-xs text-muted-foreground">回复 <span className="font-serif">{comment.reply_to_name}</span></p>}
                  <p className="mt-2 text-sm text-foreground/85">{comment.content}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <button onClick={() => handleLikeComment(comment.id, comment.likes)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition">
                      <ThumbsUp className="h-3.5 w-3.5" /><span>{comment.likes}</span>
                    </button>
                    <button onClick={() => setReplyingTo(comment)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
                      <Reply className="h-3.5 w-3.5" /><span>回复</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {comments.length === 0 && (
          <div className="mt-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background/40">
              <MessageSquare className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <p className="font-serif text-lg text-muted-foreground">暂无评论</p>
            <p className="mt-2 text-sm text-muted-foreground/70">来发表第一条评论吧</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
