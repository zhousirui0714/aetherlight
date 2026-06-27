import { useState } from "react";
import { Share2, Download, Copy, Loader2, X, ImageDown } from "lucide-react";
import { toast } from "sonner";
import { renderShareCard, downloadDataURL, copyImageToClipboard, type ShareCardData } from "@/lib/share-card";

interface Props {
  data: ShareCardData;
  /** 是否为详情页底部的主分享按钮（true）还是次要按钮（false） */
  primary?: boolean;
}

export function ShareCardButton({ data, primary = true }: Props) {
  const [open, setOpen] = useState(false);
  const [dataURL, setDataURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    try {
      // 等一帧让 modal 渲染
      await new Promise((r) => setTimeout(r, 50));
      const url = await renderShareCard(data);
      setDataURL(url);
    } catch (err) {
      console.error("[share-card] render failed:", err);
      toast("生成分享卡失败，请重试");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!dataURL) return;
    const safeName = data.title.replace(/[\\/:*?"<>|]/g, "_").slice(0, 30);
    downloadDataURL(dataURL, `溯光-${safeName}.png`);
    toast("已下载到本地");
  };

  const handleCopy = async () => {
    if (!dataURL) return;
    const ok = await copyImageToClipboard(dataURL);
    if (ok) {
      toast("已复制图片到剪贴板");
    } else {
      toast("当前浏览器不支持复制图片，请改用下载");
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm transition ${
          primary
            ? "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
            : "border-border bg-card text-xs text-muted-foreground hover:text-foreground"
        }`}
        title="生成分享图"
      >
        <ImageDown className={primary ? "h-4 w-4" : "h-3.5 w-3.5"} />
        {primary ? "生成分享卡" : "分享卡"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="mb-1 font-serif text-xl text-foreground">分享卡</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              水墨风格分享图，适合发到朋友圈、小红书等平台
            </p>

            <div className="flex items-center justify-center rounded-xl bg-muted/30 p-4">
              {loading ? (
                <div className="flex h-[480px] w-full max-w-[360px] flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">绘制中…</p>
                </div>
              ) : dataURL ? (
                <img
                  src={dataURL}
                  alt="分享卡预览"
                  className="max-h-[480px] w-auto rounded-lg shadow-md"
                />
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleDownload}
                disabled={!dataURL}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> 下载图片
              </button>
              <button
                onClick={handleCopy}
                disabled={!dataURL}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm text-foreground transition hover:border-primary/30 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" /> 复制图片
              </button>
              {typeof navigator.share === "function" && dataURL && (
                <button
                  onClick={async () => {
                    try {
                      const blob = await (await fetch(dataURL)).blob();
                      const file = new File([blob], `${data.title}.png`, { type: "image/png" });
                      await navigator.share({
                        title: data.title,
                        text: data.excerpt,
                        files: [file],
                      });
                    } catch {
                      // 用户取消
                    }
                  }}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm text-foreground transition hover:border-primary/30"
                >
                  <Share2 className="h-4 w-4" /> 系统分享
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground/70">
              尺寸 1080×1440（3:4 比例）· 长按图片可保存到相册
            </p>
          </div>
        </div>
      )}
    </>
  );
}
