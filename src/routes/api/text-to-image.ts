import { createFileRoute } from "@tanstack/react-router";

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

        try {
          // 尝试调用 TRAE API
          const fullPrompt = `${prompt}，${style}风格，中国传统文化艺术`;
          const encodedPrompt = encodeURIComponent(fullPrompt);
          const traeApiUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodedPrompt}&image_size=${size}`;

          const response = await fetch(traeApiUrl, {
            method: "GET",
            signal: AbortSignal.timeout(15000),
          });

          if (response.ok) {
            // 如果 TRAE API 返回图片，直接代理返回
            const contentType = response.headers.get("content-type") || "image/png";
            const arrayBuffer = await response.arrayBuffer();
            return new Response(arrayBuffer, {
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400",
              },
            });
          }

          throw new Error("TRAE API failed");
        } catch (error) {
          // 回退方案：使用 picsum.photos 带 seed
          console.warn("Text-to-image API fallback:", error);
          
          const seed = encodeURIComponent(prompt.slice(0, 30) + style);
          let dimensions = "800/450";
          
          if (size === "square_hd" || size === "square") {
            dimensions = "600/600";
          } else if (size === "portrait_4_3") {
            dimensions = "600/800";
          } else if (size === "portrait_16_9") {
            dimensions = "450/800";
          } else if (size === "landscape_4_3") {
            dimensions = "800/600";
          }
          
          const fallbackUrl = `https://picsum.photos/seed/${seed}/${dimensions}`;
          
          try {
            const response = await fetch(fallbackUrl, {
              signal: AbortSignal.timeout(10000),
            });
            
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              return new Response(arrayBuffer, {
                headers: {
                  "Content-Type": "image/jpeg",
                  "Cache-Control": "public, max-age=86400",
                  "X-Fallback": "true",
                },
              });
            }
          } catch (fallbackError) {
            console.error("Fallback image also failed:", fallbackError);
          }
          
          return new Response(
            JSON.stringify({ error: "Image generation failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
