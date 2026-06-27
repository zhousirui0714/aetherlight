import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { BAILIAN_DEFAULT_MODEL, createBailianProvider } from "@/lib/ai-gateway.server";
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

        const key = process.env.BAILIAN_API_KEY;
        if (!key) return new Response("缺少 BAILIAN_API_KEY", { status: 500 });

        const gateway = createBailianProvider(key);
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

        const result = streamText({
          model: gateway(process.env.BAILIAN_MODEL || BAILIAN_DEFAULT_MODEL),
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
