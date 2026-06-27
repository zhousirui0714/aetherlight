import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Heart, MessageSquare, Clock, User, Send, Loader2, X, ThumbsUp, Reply } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tongyou/community/$id")({
  head: () => ({
    meta: [
      { title: "帖子详情 · 文化社区 · 溯光" },
    ],
  }),
  component: PostDetailPage,
});

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

function PostDetailPage() {
  const params = useParams();
  const postId = params.id;
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);

  useEffect(() => {
    const checkLogin = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session?.user);
    };
    checkLogin();
    loadPost();
    loadComments();
  }, [postId]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (data && !error) {
        setPost(data as Post);
        setLocalLikes(data.likes);
      } else {
        // 降级使用 mock 数据
        const mockPost: Post = {
          id: "1",
          user_id: "user1",
          user_name: "诗词爱好者",
          title: "李白的《将进酒》为何如此豪迈？",
          content: "《将进酒》是李白最著名的诗作之一，其豪迈奔放的风格令人震撼。\n\n诗中'天生我材必有用，千金散尽还复来'展现了诗人对人生的豁达态度。李白以酒为媒，抒发胸中块垒，将个人的失意与对自由的追求完美融合。\n\n这首诗的艺术特色：\n1. 气势磅礴，一泻千里\n2. 想象奇特，夸张大胆\n3. 情感真挚，感染力强\n\n正如诗中所言：'古来圣贤皆寂寞，惟有饮者留其名。'李白用他独特的方式，在诗歌史上留下了浓墨重彩的一笔。",
          category: "诗词讨论",
          likes: 42,
          replies: 3,
          created_at: new Date().toISOString(),
        };
        setPost(mockPost);
        setLocalLikes(42);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("community_replies")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && !error && data.length > 0) {
        setComments(data as Comment[]);
      } else {
        // 降级使用 mock 数据
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
        await supabase
          .from("community_posts")
          .update({ likes: liked ? post.likes - 1 : post.likes + 1 })
          .eq("id", post.id);
      } catch (err) {
        console.error("Failed to like post:", err);
      }
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast("请输入评论内容");
      return;
    }

    setCommenting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      
      let userName = "匿名用户";
      if (user) {
        userName = user.email?.split("@")[0] || "匿名用户";
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.nickname) {
          userName = profile.nickname;
        }
      }

      const newCommentData: Omit<Comment, "id" | "created_at"> = {
        post_id: postId,
        user_id: user?.id || "anonymous",
        user_name: userName,
        content: newComment,
        reply_to: replyingTo?.id,
        reply_to_name: replyingTo?.user_name,
        likes: 0,
      };

      if (isLoggedIn && user) {
        const { data, error } = await supabase
          .from("community_replies")
          .insert(newCommentData)
          .select()
          .single();

        if (data && !error) {
          setComments([data as Comment, ...comments]);
        } else {
          throw error;
        }
      } else {
        // 降级：本地添加
        const comment: Comment = {
          ...newCommentData,
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        setComments([comment, ...comments]);
        toast("评论已发布（本地模式）");
      }

      setNewComment("");
      setReplyingTo(null);
      toast.success("评论已发布");
    } catch (err) {
      console.error("Failed to submit comment:", err);
      // 降级：本地添加
      const comment: Comment = {
        id: `local-${Date.now()}`,
        post_id: postId,
        user_id: "anonymous",
        user_name: "匿名用户",
        content: newComment,
        reply_to: replyingTo?.id,
        reply_to_name: replyingTo?.user_name,
        likes: 0,
        created_at: new Date().toISOString(),
      };
      setComments([comment, ...comments]);
      setNewComment("");
      setReplyingTo(null);
      toast("评论已发布（本地模式）");
    } finally {
      setCommenting(false);
    }
  };

  const handleLikeComment = async (commentId: string, currentLikes: number) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    ));

    if (isLoggedIn) {
      try {
        await supabase
          .from("community_replies")
          .update({ likes: currentLikes + 1 })
          .eq("id", commentId);
      } catch (err) {
        console.error("Failed to like comment:", err);
      }
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
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
          <Link
            to="/tongyou/community"
            className="mt-4 text-sm text-primary hover:underline"
          >
            返回社区
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* 导航 */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">首页</Link>
        <span className="mx-2 text-border">/</span>
        <Link to="/community" className="hover:text-foreground">文化社区</Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground/80">帖子详情</span>
      </nav>

      {/* 返回按钮 */}
      <button
        onClick={() => window.history.back()}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        返回列表
      </button>

      {/* 帖子内容 */}
      <article className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8">
        {/* 分类标签 */}
        <span className="inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-serif text-accent">
          {post.category}
        </span>

        {/* 标题 */}
        <h1 className="mt-4 font-serif text-2xl text-foreground">
          {post.title}
        </h1>

        {/* 作者信息 */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-serif text-sm text-foreground">{post.user_name}</p>
            <p className="text-xs text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />
              {formatTime(post.created_at)}
            </p>
          </div>
        </div>

        {/* 内容 */}
        <div className="mt-6 whitespace-pre-line font-serif text-base leading-loose text-foreground/90">
          {post.content}
        </div>

        {/* 操作栏 */}
        <div className="mt-8 flex items-center gap-8 border-t border-border pt-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition ${
              liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-primary" : ""}`} />
            <span className="text-sm">{localLikes}</span>
          </button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm">{comments.length}</span>
          </div>
        </div>
      </article>

      {/* 评论区 */}
      <section className="mx-auto mt-8 max-w-3xl">
        <h2 className="font-serif text-xl text-foreground">评论 ({comments.length})</h2>

        {/* 评论输入框 */}
        <div className="mt-4 rounded-3xl border border-border bg-card p-4">
          {replyingTo && (
            <div className="mb-3 flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                回复 <span className="font-serif text-foreground">{replyingTo.user_name}</span>
              </p>
              <button
                onClick={() => setReplyingTo(null)}
                className="rounded-full p-1 hover:bg-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            rows={3}
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/70"
          />
          
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSubmitComment}
              disabled={commenting || !newComment.trim()}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {commenting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {commenting ? "发布中..." : "发布评论"}
            </button>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="mt-6 space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm text-foreground">
                      {comment.user_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  
                  {comment.reply_to && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      回复 <span className="font-serif">{comment.reply_to_name}</span>
                    </p>
                  )}
                  
                  <p className="mt-2 text-sm text-foreground/85">
                    {comment.content}
                  </p>
                  
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      onClick={() => handleLikeComment(comment.id, comment.likes)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{comment.likes}</span>
                    </button>
                    <button
                      onClick={() => setReplyingTo(comment)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      <span>回复</span>
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
