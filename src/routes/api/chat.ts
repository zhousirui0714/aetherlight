import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createAiProvider, getDefaultModel } from "@/lib/ai-gateway.server";
import { searchKnowledge, type KnowledgeEntry } from "@/lib/cultural-knowledge";

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
        
        // 先尝试从知识库获取答案
        const knowledgeEntry = searchKnowledge(userQuestion);
        if (knowledgeEntry) {
          const formattedResponse = formatKnowledgeResponse(knowledgeEntry);
          return new Response(JSON.stringify({
            type: "knowledge",
            data: knowledgeEntry
          }), {
            headers: { "Content-Type": "application/json" }
          });
        }

        // 如果知识库没有匹配，使用AI回答
        const provider = createAiProvider();
        const result = streamText({
          model: provider(getDefaultModel()),
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
