import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Music, Image, Sparkles, Wand2, Download, Share2, RefreshCw, Loader2, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { listCreations, saveCreation, deleteCreation, type CreationItem } from "@/lib/creation-storage";
import { generateMelody, playMelody, stopMelody } from "@/lib/music-generator";
import { trackEvent } from "@/lib/journey-storage";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "艺术创作 · 溯光" },
      { name: "description", content: "以 AI 为笔，绘千年风雅。文生图、文生音乐，让传统文化焕发新生。" },
    ],
  }),
  component: CreatePage,
});

type CreateMode = "image" | "music";

function CreatePage() {
  const [mode, setMode] = useState<CreateMode>("image");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("古典水墨");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ type: CreateMode; url: string; prompt: string } | null>(null);
  const [history, setHistory] = useState<CreationItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [musicInfo, setMusicInfo] = useState<{ duration: number; noteCount: number } | null>(null);

  const imageStyles = [
    { id: "水墨", label: "古典水墨", desc: "淡雅清逸，意境深远" },
    { id: "工笔", label: "工笔重彩", desc: "精细入微，色彩斑斓" },
    { id: "山水", label: "山水画卷", desc: "层峦叠嶂，云烟缭绕" },
    { id: "人物", label: "人物仕女", desc: "端庄典雅，气韵生动" },
    { id: "花鸟", label: "花鸟虫鱼", desc: "生机盎然，妙趣横生" },
    { id: "书法", label: "书法意境", desc: "笔走龙蛇，气吞山河" },
  ];

  const musicStyles = [
    { id: "古琴", label: "古琴雅韵", desc: "清微淡远，高山流水" },
    { id: "琵琶", label: "琵琶铮铮", desc: "金戈铁马，十面埋伏" },
    { id: "笛箫", label: "笛箫悠扬", desc: "空灵飘逸，如泣如诉" },
    { id: "丝竹", label: "丝竹合奏", desc: "琴瑟和鸣，雅乐清音" },
    { id: "戏曲", label: "戏曲唱腔", desc: "昆曲京剧，韵味悠长" },
    { id: "民乐", label: "民间乐曲", desc: "江南丝竹，北国笙歌" },
  ];

  const examplePrompts = mode === "image" ? [
    "李白月下独酌，举杯邀明月",
    "苏轼赤壁怀古，大江东去",
    "王维空山新雨，明月松间照",
    "陶渊明采菊东篱下，悠然见南山",
    "杜甫草堂春夜，细雨鱼儿出",
    "屈原离骚，香草美人",
  ] : [
    "春江花月夜的悠远意境",
    "高山流水觅知音",
    "梅花三弄的清雅",
    "阳关三叠的离别愁绪",
    "平沙落雁的宁静",
    "渔舟唱晚的归航",
  ];

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const items = await listCreations();
      setHistory(items);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast("请输入创作灵感");
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      if (mode === "image") {
        // 文生图：调用服务端 API
        const params = new URLSearchParams({
          prompt,
          style,
          size: "landscape_16_9",
        });
        
        const imageUrl = `/api/text-to-image?${params.toString()}`;
        
        // 预加载图片确保生成成功
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("图片加载失败"));
          img.src = imageUrl;
          
          // 超时保护
          setTimeout(() => reject(new Error("生成超时")), 20000);
        });
        
        setResult({ type: "image", url: imageUrl, prompt });
        toast.success("画作已生成");
        saveCreation({ type: "image", prompt, style, url: imageUrl }).then(() => {
          loadHistory();
          trackEvent({
            type: "creation_make",
            title: `画作：${prompt.slice(0, 20)}`,
            description: `风格：${style}`,
            category: "绘画创作",
          });
        });
      } else {
        const info = generateMelody(style, prompt);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const musicId = `music_${Date.now()}`;
        setResult({ type: "music", url: musicId, prompt });
        setMusicInfo({ duration: info.duration, noteCount: info.noteCount });
        toast.success("乐曲已生成");
        saveCreation({ type: "music", prompt, style, url: musicId }).then(() => {
          loadHistory();
          trackEvent({
            type: "creation_make",
            title: `乐曲：${prompt.slice(0, 20)}`,
            description: `风格：${style}`,
            category: "音乐创作",
          });
        });
      }
    } catch (error) {
      toast.error("生成失败，请重试");
      console.error("Generate error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    const link = window.document.createElement("a");
    link.href = result.url;
    link.download = `溯光创作_${result.prompt.slice(0, 20)}.png`;
    link.click();
    toast("已开始下载");
  };

  const handleShare = () => {
    if (!result) return;
    
    if (navigator.share) {
      navigator.share({
        title: `溯光艺术创作 - ${result.prompt}`,
        text: `以"${result.prompt}"为灵感创作的${result.type === "image" ? "画作" : "乐曲"}`,
        url: result.url,
      });
    } else {
      navigator.clipboard.writeText(result.url);
      toast("链接已复制到剪贴板");
    }
  };

  const togglePlayMusic = () => {
    if (!result || result.type !== "music") return;
    
    if (isPlaying) {
      stopMelody();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setPlayProgress(0);
      playMelody(style, result.prompt, (progress) => {
        setPlayProgress(progress);
        if (progress >= 1) {
          setIsPlaying(false);
          setPlayProgress(0);
        }
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      stopMelody();
    };
  }, []);

  return (
    <AppShell title="艺术创作">
      <div className="mb-10 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">AI ART CREATION</div>
        <h1 className="mt-3 font-serif text-4xl text-foreground">艺 术 创 作</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-loose text-muted-foreground">
          以 AI 为笔，绘千年风雅。输入灵感，生成古典风格的画作或乐曲。
        </p>
      </div>

      {/* 模式切换 */}
      <div className="mb-8 flex justify-center gap-4">
        <button
          onClick={() => setMode("image")}
          className={`flex items-center gap-2 rounded-full px-6 py-3 font-serif text-sm transition ${
            mode === "image"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Image className="h-5 w-5" /> 文生图
        </button>
        <button
          onClick={() => setMode("music")}
          className={`flex items-center gap-2 rounded-full px-6 py-3 font-serif text-sm transition ${
            mode === "music"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Music className="h-5 w-5" /> 文生音乐
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr_320px]">
        {/* 左栏：创作记录 */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              <h3 className="font-serif text-lg text-foreground">创作记录</h3>
              <span className="ml-auto text-xs text-muted-foreground">{history.length}</span>
            </div>

            <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : history.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/40">
                    <Sparkles className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-serif text-muted-foreground">暂无创作记录</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">开始你的第一幅作品吧</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-xl border border-border bg-background/50 overflow-hidden transition hover:border-primary/30"
                  >
                    {item.type === "image" && (
                      <div className="relative h-20 overflow-hidden">
                        <img
                          src={item.url}
                          alt={item.prompt}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://picsum.photos/400/200?random=" + item.id;
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCreation(item.id).then(() => loadHistory());
                          }}
                          className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-1 opacity-0 transition group-hover:opacity-100 hover:bg-destructive"
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    )}
                    <div className="p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.type === "image" ? (
                          <Image className="h-3 w-3 text-accent" />
                        ) : (
                          <Music className="h-3 w-3 text-accent" />
                        )}
                        <span className="text-[10px] tracking-wider text-muted-foreground">
                          {item.style}
                        </span>
                        <span className="ml-auto text-[10px] text-muted-foreground/60">
                          {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                      <p
                        className="text-xs font-serif text-foreground/80 line-clamp-1 cursor-pointer hover:text-foreground"
                        onClick={() => {
                          setPrompt(item.prompt);
                          setStyle(item.style);
                          setMode(item.type);
                          setResult({ type: item.type, url: item.url, prompt: item.prompt });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        {item.prompt}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* 中栏：创作成果（主视觉） */}
        <main className="space-y-6 min-w-0">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-foreground">
                {result
                  ? result.type === "image"
                    ? "画作成果"
                    : "乐曲成果"
                  : isGenerating
                    ? "正在创作"
                    : "创作成果"}
              </h3>
              {result && !isGenerating && (
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> 重新创作
                </button>
              )}
            </div>

            {isGenerating && !result && (
              <div className="rounded-2xl border border-dashed border-border bg-background/30 p-16 text-center">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  {mode === "image" ? (
                    <Image className="h-10 w-10 animate-pulse text-primary" />
                  ) : (
                    <Music className="h-10 w-10 animate-pulse text-primary" />
                  )}
                </div>
                <p className="font-serif text-lg text-foreground">正在创作...</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "image"
                    ? `以"${style}"风格描绘"${prompt.slice(0, 30)}..."`
                    : `以"${style}"风格演绎"${prompt.slice(0, 30)}..."`}
                </p>
                <div className="mt-6 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              </div>
            )}

            {!result && !isGenerating && (
              <div className="rounded-2xl border border-dashed border-border bg-background/30 p-16 text-center">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
                  {mode === "image" ? (
                    <Image className="h-8 w-8 text-primary/50" />
                  ) : (
                    <Music className="h-8 w-8 text-primary/50" />
                  )}
                </div>
                <p className="font-serif text-base text-muted-foreground">执笔待墨，等灵感落纸</p>
                <p className="mt-1 text-xs text-muted-foreground/70">在右侧输入灵感，开启你的创作</p>
              </div>
            )}

            {result && result.type === "image" && (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary">
                <img
                  src={result.url}
                  alt={result.prompt}
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = "https://picsum.photos/800/450?random=" + Date.now();
                  }}
                />
              </div>
            )}

            {result && result.type === "music" && (
              <div className="rounded-2xl border border-border bg-gradient-to-br from-secondary via-background to-secondary p-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayMusic}
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
                  >
                    {isPlaying ? (
                      <Loader2 className="h-7 w-7 animate-spin" />
                    ) : (
                      <Music className="h-7 w-7" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg text-foreground">{result.prompt}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{style}风格 · {musicInfo?.noteCount || 0} 个音符</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-100"
                      style={{ width: `${playProgress * 100}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                    <span>{formatTime(playProgress * (musicInfo?.duration || 0))}</span>
                    <span>{formatTime(musicInfo?.duration || 0)}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-center gap-2">
                  <div className="flex items-end gap-0.5 h-8">
                    {[...Array(16)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full bg-accent/60 transition-all duration-150 ${
                          isPlaying ? "animate-pulse" : ""
                        }`}
                        style={{
                          height: isPlaying ? `${20 + Math.random() * 80}%` : "20%",
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {result && !isGenerating && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <Download className="h-4 w-4" /> 下载
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <Share2 className="h-4 w-4" /> 分享
              </button>
            </div>
          )}
        </main>

        {/* 右栏：创作灵感（紧凑） */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 xl:sticky xl:top-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h3 className="font-serif text-lg text-foreground">创作灵感</h3>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === "image"
                  ? "描述你想创作的画面，如：李白月下独酌，举杯邀明月..."
                  : "描述你想创作的音乐意境，如：春江花月夜的悠远意境..."
              }
              rows={3}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/70 resize-none"
            />

            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-foreground">选择风格</p>
              <div className="flex flex-wrap gap-1.5">
                {(mode === "image" ? imageStyles : musicStyles).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.label)}
                    className={`rounded-full px-2.5 py-1 text-xs font-serif transition ${
                      style === s.label
                        ? "bg-accent text-accent-foreground"
                        : "border border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-foreground">试试这些灵感</p>
              <div className="flex flex-col gap-1.5">
                {examplePrompts.slice(0, 3).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="text-left rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs font-serif text-muted-foreground hover:text-foreground hover:border-primary/30 transition truncate"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-serif text-sm tracking-widest text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  创作中...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  开始创作
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}