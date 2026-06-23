import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Palette, Music, Image, Sparkles, Wand2, Download, Share2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      } else {
        // 文生音乐：演示模式
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const musicUrl = `https://example.com/music/${Date.now()}.mp3`;
        setResult({ type: "music", url: musicUrl, prompt });
        toast.success("乐曲已生成（演示模式）");
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

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* 左侧：创作区 */}
        <div className="space-y-6">
          {/* 输入区 */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h3 className="font-serif text-lg text-foreground">创作灵感</h3>
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === "image" 
                ? "描述你想创作的画面，如：李白月下独酌，举杯邀明月..." 
                : "描述你想创作的音乐意境，如：春江花月夜的悠远意境..."
              }
              rows={3}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/70 resize-none"
            />

            {/* 风格选择 */}
            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-foreground">选择风格</p>
              <div className="flex flex-wrap gap-2">
                {(mode === "image" ? imageStyles : musicStyles).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.label)}
                    className={`rounded-full px-3 py-1.5 text-xs font-serif transition ${
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

            {/* 示例灵感 */}
            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-foreground">试试这些灵感</p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.slice(0, 4).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-serif text-sm tracking-widest text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
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

          {/* 结果展示 */}
          {result && (
            <div className="rounded-3xl border border-border bg-card p-6 scroll-in">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-lg text-foreground">
                  {result.type === "image" ? "画作成果" : "乐曲成果"}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> 重新创作
                  </button>
                </div>
              </div>

              {result.type === "image" ? (
                <div className="relative overflow-hidden rounded-2xl border border-border">
                  <img
                    src={result.url}
                    alt={result.prompt}
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.src = "https://picsum.photos/800/450?random=" + Date.now();
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-gradient-to-br from-secondary via-background to-secondary p-8 text-center">
                  <Music className="h-12 w-12 mx-auto mb-4 text-accent" />
                  <p className="font-serif text-lg text-foreground">{result.prompt}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{style}风格</p>
                  <div className="mt-6 flex justify-center gap-4">
                    <button className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">
                      <Music className="h-4 w-4" /> 播放乐曲
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground/70">（音乐生成功能为演示模式）</p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
                >
                  <Download className="h-4 w-4" /> 下载
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
                >
                  <Share2 className="h-4 w-4" /> 分享
                </button>
              </div>
            </div>
          )}

          {/* 生成中状态 */}
          {isGenerating && !result && (
            <div className="rounded-3xl border border-border bg-card p-12 text-center">
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
                  : `以"${style}"风格演绎"${prompt.slice(0, 30)}..."`
                }
              </p>
              <div className="mt-6 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        {/* 右侧：创作指南 */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-accent" />
              <h3 className="font-serif text-lg text-foreground">创作指南</h3>
            </div>
            
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <h4 className="font-serif text-base text-foreground mb-2">文生图技巧</h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>描述具体场景和人物动作</li>
                  <li>融入诗词意象更添韵味</li>
                  <li>选择合适的传统画风</li>
                  <li>可添加季节、时间等细节</li>
                </ul>
              </div>
              
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <h4 className="font-serif text-base text-foreground mb-2">文生音乐技巧</h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>描述音乐的情感基调</li>
                  <li>指定传统乐器类型</li>
                  <li>融入诗词意境</li>
                  <li>可描述场景氛围</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 创作历史 */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h3 className="font-serif text-lg text-foreground">创作灵感库</h3>
            </div>
            
            <div className="space-y-3">
              {examplePrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  className="block w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-left text-sm font-serif text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}