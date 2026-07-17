import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createAiProvider, getDefaultModel } from "@/lib/ai-gateway.server";
import { findSage } from "@/lib/sages";

export const Route = createFileRoute("/api/dialogue")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[]; sageId?: string };
        const { messages, sageId } = body;
        if (!Array.isArray(messages) || !sageId) {
          return new Response("messages and sageId required", { status: 400 });
        }
        const sage = findSage(sageId);
        if (!sage) return new Response("unknown sage", { status: 404 });

        const provider = createAiProvider();
        const system = `你正在扮演中国历史人物【${sage.name}】，${sage.dynasty}人。
风格关键词：${sage.styles.join("、")}
代表作：${sage.works.join("、")}
个人小传：${sage.intro}

请始终以${sage.name}本人的口吻、性情、价值观、人生际遇与文风与对方对话。要求：
- 语言典雅、富有时代气息，可适度文白相间，但保持易懂。
- 自然引用自己的诗文/著作或同时代典故，引文请加书名号《》或单独成行。
- 引用诗句、典故时另起一行用「」括起，并在末尾以小字注明出处，如「——出自《将进酒》」。
- 单次回答 80–220 字，避免冗长说教。
- 不要破坏角色：不得自称"AI"、"语言模型"或承认是程序。
- 若对方问起未来或本人卒年之后的事，可委婉避而不答，或以本人时代视角推想。
- 始终保持温润、雅致、有文化底蕴的语气。`;

        // 预生成降级文本（LLM 不可用时使用）
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        const userText = lastUserMsg
          ? lastUserMsg.parts.map((p: any) => (p.type === "text" ? p.text : "")).join("")
          : "";

        function buildFallbackResponse(): string {
          if (userText) {
            return `「${userText}」\n\n—— 惭愧，此节我亦未深考。待我翻阅典籍，改日再与君细说。`;
          }
          return `—— 此间事，容我三思。`;
        }

        try {
          const result = streamText({
            model: provider(getDefaultModel()),
            system,
            messages: await convertToModelMessages(messages),
          });

          const response = result.toUIMessageStreamResponse({ originalMessages: messages });
          const body = response.body;
          if (!body) throw new Error("No response body");

          // 包装 response body，拦截 LLM 流式错误，降级为静态回答
          const encoder = new TextEncoder();
          const reader = body.getReader();
          const decoder = new TextDecoder();
          let fallbackDeployed = false;
          const fallbackText = buildFallbackResponse();

          const wrappedStream = new ReadableStream({
            async pull(controller) {
              if (fallbackDeployed) { controller.close(); return; }
              try {
                const { done, value } = await reader.read();
                if (done) { controller.close(); return; }
                const chunk = decoder.decode(value, { stream: true });
                if (chunk.includes('"type":"error"')) {
                  fallbackDeployed = true;
                  writeFallbackSSE(controller, encoder, fallbackText);
                  controller.close();
                  return;
                }
                controller.enqueue(value);
              } catch {
                if (!fallbackDeployed) {
                  fallbackDeployed = true;
                  writeFallbackSSE(controller, encoder, fallbackText);
                }
                controller.close();
              }
            },
            cancel() {
              reader.cancel();
              fallbackDeployed = true;
            },
          });

          return new Response(wrappedStream, {
            status: response.status,
            headers: response.headers,
          });
        } catch (llmErr) {
          console.warn("[dialogue] LLM unavailable, fallback to static:", llmErr);
          return sseStreamFromText(buildFallbackResponse());
        }
      },
    },
  },
});

/** 把降级文本写成 SSE 块（useChat 兼容格式） */
function writeFallbackSSE(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  text: string,
) {
  const id = `msg-${Date.now()}`;
  controller.enqueue(encoder.encode(`data: {"type":"start","messageId":"${id}"}\n\n`));
  controller.enqueue(encoder.encode(`data: {"type":"text-start","id":"${id}"}\n\n`));
  const chunkSize = 12;
  for (let i = 0; i < text.length; i += chunkSize) {
    const c = text.slice(i, i + chunkSize);
    const escaped = JSON.stringify(c).slice(1, -1);
    controller.enqueue(
      encoder.encode(`data: {"type":"text-delta","id":"${id}","delta":"${escaped}"}\n\n`)
    );
  }
  controller.enqueue(encoder.encode(`data: {"type":"text-end","id":"${id}"}\n\n`));
  controller.enqueue(encoder.encode(`data: {"type":"finish","finishReason":"stop"}\n\n`));
  controller.enqueue(encoder.encode(`\n`));
}

/** 纯文本 SSE 流（兜底用） */
function sseStreamFromText(text: string): Response {
  const encoder = new TextEncoder();
  const id = `msg-${Date.now()}`;
  const chunkSize = 12;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: {"type":"start","messageId":"${id}"}\n\n`));
      controller.enqueue(encoder.encode(`data: {"type":"text-start","id":"${id}"}\n\n`));
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        const escaped = JSON.stringify(chunk).slice(1, -1);
        controller.enqueue(encoder.encode(`data: {"type":"text-delta","id":"${id}","delta":"${escaped}"}\n\n`));
      }
      controller.enqueue(encoder.encode(`data: {"type":"text-end","id":"${id}"}\n\n`));
      controller.enqueue(encoder.encode(`data: {"type":"finish","finishReason":"stop"}\n\n`));
      controller.enqueue(encoder.encode(`\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
