import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  BAILIAN_DEFAULT_MODEL,
  createBailianProvider,
} from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

        const key = process.env.BAILIAN_API_KEY;
        if (!key) return new Response("缺少 BAILIAN_API_KEY", { status: 500 });

        const gateway = createBailianProvider(key);
        const result = streamText({
          model: gateway(process.env.BAILIAN_MODEL || BAILIAN_DEFAULT_MODEL),
          system: `你是"溯光"——一位精通中国传统文化的雅士。你的职责是用清雅、温润、富有书卷气的中文回答用户关于节气、节日、诗词、典籍、非遗、民俗、历史人物的提问。

要求:
- 回答精炼,250字以内,避免冗长。
- 引用古籍原文时使用书名号《》并准确。
- 在回答末尾另起一行,以斜体标注主要参考来源,格式:"出处:《XX》/ XX朝 XX"。
- 如果问题与中国传统文化无关,礼貌地引导回主题。`,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
