import { createFileRoute } from "@tanstack/react-router";

/**
 * /api/text-to-image
 * GET  - 文本生成图片 (server-side proxy)
 *
 * 查询参数:
 *   - prompt: string (必填)  内容描述
 *   - style:  string (可选)  艺术风格, 如"国画"/"工笔"/"水墨"
 *   - size:   string (可选)  landscape_16_9 / square / portrait_4_3 ...
 *
 * 响应: image/jpeg 流
 *
 * 实现: 调 pollinations.ai (免费公开, 无 key)
 *       失败回退: picsum.photos (随机图, 主题不相关但稳定)
 *
 * 缓存: 用 prompt+style 的稳定 hash 作 seed, 同 prompt 永远返回同图
 *       (pollinations 那边按 seed 缓存, LRU 1 小时)
 */
export const Route = createFileRoute("/api/text-to-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const prompt = url.searchParams.get("prompt") || "";
        const style = url.searchParams.get("style") || "";
        const size = url.searchParams.get("size") || "landscape_16_9";

        if (!prompt) {
          return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
        }

        // 尺寸映射: pollinations 支持任意, picsum 用 preset
        const dims = sizeToDims(size);

        // 稳定 seed: 用 prompt+style+size 的简单 hash
        const seed = stableHash(`${prompt}|${style}|${size}`);

        // 拼接完整 prompt (中英混合, 强化"中国传统文化")
        const fullPrompt = style
          ? `${prompt}，${style}风格，中国传统文化`
          : `${prompt}，中国传统文化艺术`;

        // 1. 优先调 pollinations.ai
        const encodedPrompt = encodeURIComponent(fullPrompt);
        const pollinationsUrl =
          `https://image.pollinations.ai/prompt/${encodedPrompt}` +
          `?width=${dims.w}&height=${dims.h}&seed=${seed}&nologo=true&private=true`;

        try {
          const response = await fetch(pollinationsUrl, {
            method: "GET",
            signal: AbortSignal.timeout(30000),
            headers: { "User-Agent": "Aetherlight/1.0" },
          });

          if (response.ok && response.headers.get("content-type")?.startsWith("image/")) {
            const arrayBuffer = await response.arrayBuffer();
            return new Response(arrayBuffer, {
              headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=86400, s-maxage=604800",
                "X-Image-Source": "pollinations",
              },
            });
          }

          console.warn(`[text-to-image] pollinations 非图片响应 (${response.status})`);
        } catch (err) {
          console.warn("[text-to-image] pollinations 失败:", err);
        }

        // 2. Fallback: picsum.photos (主题不相关但稳定)
        const picsumSeed = encodeURIComponent(`${prompt.slice(0, 30)}-${style}`);
        const fallbackUrl = `https://picsum.photos/seed/${picsumSeed}/${dims.w}/${dims.h}`;

        try {
          const response = await fetch(fallbackUrl, {
            signal: AbortSignal.timeout(15000),
          });
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            return new Response(arrayBuffer, {
              headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=86400",
                "X-Image-Source": "picsum-fallback",
              },
            });
          }
        } catch (err) {
          console.error("[text-to-image] picsum fallback 也失败:", err);
        }

        return new Response(
          JSON.stringify({ error: "Image generation failed" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});

function sizeToDims(size: string): { w: number; h: number } {
  switch (size) {
    case "square_hd":
    case "square":
      return { w: 1024, h: 1024 };
    case "portrait_4_3":
      return { w: 768, h: 1024 };
    case "portrait_16_9":
      return { w: 576, h: 1024 };
    case "landscape_4_3":
      return { w: 1024, h: 768 };
    case "landscape_16_9":
    default:
      return { w: 1024, h: 576 };
  }
}

/**
 * 稳定哈希 (FNV-1a 32-bit) -> 返回 [0, 2^31) 的非负整数
 * 用于 pollinations seed, 保证同 prompt 永远同图
 */
function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h | 0);
}
