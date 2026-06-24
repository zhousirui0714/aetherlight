import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createAiProvider, getDefaultModel } from "@/lib/ai-gateway.server";
import { searchKnowledge, type KnowledgeEntry } from "@/lib/cultural-knowledge";
import { getCache, setCache, getKnowledgeCacheKey } from "@/lib/api-cache";

function formatKnowledgeResponse(entry: KnowledgeEntry): string {
  let response = `## ${entry.question}\n\n`;
  response += `${entry.answer}\n\n`;
  
  if (entry.quotes.length > 0) {
    response += "---\n\n";
    for (const quote of entry.quotes) {
      response += `### 《${quote.title}》\n\n`;
      response += `${quote.text}\n\n`;
      response += `—— ${quote.dynasty} · ${quote.author}\n\n`;
    }
  }
  
  response += "---\n\n";
  response += "**出处：**\n";
  for (const source of entry.sources) {
    const urlPart = source.url ? ` ([查看](${source.url}))` : "";
    response += `- ${source.title}${urlPart}\n`;
  }
  
  if (entry.interpretations) {
    response += "\n---\n\n";
    response += `**现代释义：** ${entry.interpretations}\n`;
  }
  
  if (entry.scholarAnalysis) {
    response += "\n**学者解读：** " + entry.scholarAnalysis.substring(0, 150) + "…\n";
  }
  
  return response;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

        const lastMessage = messages[messages.length - 1];
        const userQuestion = lastMessage?.parts?.find(p => p.type === "text")?.text || "";
        // 是否首问（只有 1 条 user 消息，没有 assistant 消息）
        const isFirstTurn = !messages.some(m => m.role === "assistant");

        // ========== 知识库快速路径：仅首问 ==========
        if (isFirstTurn && userQuestion) {
          const cacheKey = getKnowledgeCacheKey(userQuestion);
          const cached = getCache<{ type: string; data: KnowledgeEntry }>(cacheKey);
          if (cached) {
            return new Response(JSON.stringify(cached), {
              headers: { "Content-Type": "application/json", "X-Cache": "HIT" }
            });
          }

          const knowledgeEntry = searchKnowledge(userQuestion);
          if (knowledgeEntry) {
            const response = { type: "knowledge", data: knowledgeEntry };
            setCache(cacheKey, response);
            return new Response(JSON.stringify(response), {
              headers: { "Content-Type": "application/json", "X-Cache": "MISS" }
            });
          }
        }

        // ========== 多轮 / 无知识命中 → 走 LLM ==========
        const provider = createAiProvider();
        // 计算对话轮数，用于系统提示
        const turnCount = messages.filter(m => m.role === "user").length;
        const systemText = `你是"溯光"——一位精通中国传统文化的雅士。${turnCount > 1 ? `当前是与用户的第 ${turnCount} 轮对话。` : ""}

要求:
- 回答精炼,250字以内,避免冗长。
- 引用古籍原文时使用书名号《》并准确。
- ${turnCount > 1 ? "请基于上文历史消息回答，避免重复前面已说过的内容；如用户问'那他…呢/与…相比呢/还有吗'等追问，请紧扣上文主题深入展开。" : "在回答末尾另起一行,以斜体标注主要参考来源,格式:\"出处:《XX》/ XX朝 XX\"。"}
- 如果问题与中国传统文化无关,礼貌地引导回主题。
- 回答口吻: 清雅、温润、富有书卷气。`;

        const result = streamText({
          model: provider(getDefaultModel()),
          system: systemText,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
