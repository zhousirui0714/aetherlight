import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { searchKnowledge, culturalKnowledge, type KnowledgeEntry } from "@/lib/cultural-knowledge";
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
  response += "---\n\n**出处：**\n";
  for (const source of entry.sources) {
    const urlPart = source.url ? ` ([查看](${source.url}))` : "";
    response += `- ${source.title}${urlPart}\n`;
  }
  if (entry.interpretations) {
    response += "\n---\n\n**现代释义：** " + entry.interpretations + "\n";
  }
  if (entry.scholarAnalysis) {
    response += "\n**学者解读：** " + entry.scholarAnalysis.substring(0, 200) + "…\n";
  }
  return response;
}

// 找 N 个最相关的 entry (按 token 命中长度排序)
function findRelatedEntries(query: string, n = 5): KnowledgeEntry[] {
  const stripped = query.toLowerCase().replace(/[\s\p{P}]/gu, "");
  const tokens = query.toLowerCase().split(/[\s,，。、？?！!；;：:《》'"]+/).filter((t) => t.length >= 2);
  const scored: { entry: KnowledgeEntry; score: number }[] = [];
  for (const entry of Object.values(culturalKnowledge)) {
    let score = 0;
    const haystack = (entry.id + " " + entry.question + " " + (entry.answer || "")).toLowerCase();
    for (const t of tokens) if (haystack.includes(t)) score += t.length;
    if (stripped.length >= 4 && haystack.includes(stripped)) score += 3;
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((s) => s.entry);
}

function buildFallbackResponse(related: KnowledgeEntry[], userQuestion: string): string {
  let response = `## 知识阁中暂未收录此题\n\n`;
  const safeQ = userQuestion.length > 30 ? userQuestion.slice(0, 30) + "…" : userQuestion;
  response += `「${safeQ}」暂未入我书阁,或可换个问法试我。\n\n`;
  if (related.length > 0) {
    response += `---\n\n**你或可问：**\n\n`;
    for (const e of related) response += `- ${e.question}\n`;
    response += `\n亦可前往「知识长廊」浏览全部分类。`;
  } else {
    response += `可前往「知识长廊」浏览已收录之问,或向我提一更具体之题。`;
  }
  return response;
}

function buildFollowupResponse(entry: KnowledgeEntry, followup: string, allUserQuestions: string[]): string {
  let response = `## ${entry.question}(续)\n\n`;
  if (allUserQuestions.length > 1) {
    response += `**前问:** ${allUserQuestions.slice(0, -1).join(" / ")}\n\n`;
  }
  response += `**你问:** ${followup}\n\n`;
  response += `${entry.answer}\n\n`;
  if (entry.interpretations) {
    response += `---\n\n**释义:** ${entry.interpretations}\n\n`;
  }
  if (entry.quotes.length > 0) {
    response += `**相关诗句:** 《${entry.quotes[0].title}》—— ${entry.quotes[0].text.slice(0, 60)}…\n\n`;
  }
  response += `---\n\n如欲知更细,请阅读下方出处,或继续追问。`;
  return response;
}

function extractText(msg: UIMessage | undefined): string {
  if (!msg) return "";
  const part = msg.parts?.find((p: any) => p.type === "text");
  return (part as any)?.text ?? "";
}

// 把文本切成 SSE data 块流式输出 (useChat 期望 SSE 格式)
function sseStreamFromText(text: string): Response {
  const encoder = new TextEncoder();
  const id = `msg-${Date.now()}`;
  const chunkSize = 12; // 每块 12 字符, 接近打字机效果

  const stream = new ReadableStream({
    start(controller) {
      // type: start (含 messageId, AI SDK 需要)
      controller.enqueue(encoder.encode(`data: {"type":"start","messageId":"${id}"}\n\n`));
      // type: text-start
      controller.enqueue(encoder.encode(`data: {"type":"text-start","id":"${id}"}\n\n`));
      // 分块发送文本
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        const escaped = JSON.stringify(chunk).slice(1, -1);
        controller.enqueue(encoder.encode(`data: {"type":"text-delta","id":"${id}","delta":"${escaped}"}\n\n`));
      }
      // type: text-end
      controller.enqueue(encoder.encode(`data: {"type":"text-end","id":"${id}"}\n\n`));
      // type: finish (含 finishReason, AI SDK 用)
      controller.enqueue(encoder.encode(`data: {"type":"finish","finishReason":"stop"}\n\n`));
      // 末尾空行 (SSE 结束)
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

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[]; graphQuery?: boolean };
        const { messages, graphQuery } = body;
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

        const lastMessage = messages[messages.length - 1];
        const userQuestion = extractText(lastMessage as UIMessage);

        // ========== 知识图谱查询 (JSON 响应, 客户端直接用) ==========
        if (graphQuery && userQuestion) {
          const cacheKey = getKnowledgeCacheKey(userQuestion);
          const cached = getCache<{ type: string; data: KnowledgeEntry | null }>(cacheKey);
          if (cached) {
            return new Response(JSON.stringify(cached), {
              headers: { "Content-Type": "application/json", "X-Cache": "HIT" }
            });
          }
          const knowledgeEntry = searchKnowledge(userQuestion);
          const response = knowledgeEntry
            ? { type: "knowledge", data: knowledgeEntry }
            : { type: "knowledge", data: null };
          setCache(cacheKey, response);
          return new Response(JSON.stringify(response), {
            headers: { "Content-Type": "application/json", "X-Cache": "MISS" }
          });
        }

        // ========== 首问: 100% 走知识库 (SSE 流式输出) ==========
        const isFirstTurn = !messages.some((m) => m.role === "assistant");
        if (isFirstTurn && userQuestion) {
          const cacheKey = getKnowledgeCacheKey(userQuestion);
          const cached = getCache<{ text: string }>(cacheKey);
          if (cached) {
            return sseStreamFromText(cached.text);
          }

          const knowledgeEntry = searchKnowledge(userQuestion);
          let text: string;
          if (knowledgeEntry) {
            text = formatKnowledgeResponse(knowledgeEntry);
          } else {
            const related = findRelatedEntries(userQuestion, 5);
            text = buildFallbackResponse(related, userQuestion);
          }
          setCache(cacheKey, { text });
          return sseStreamFromText(text);
        }

        // ========== 多轮对话: 优先复用上轮已命中 entry ==========
        const allUserQuestions: string[] = [];
        for (const m of messages) {
          if (m.role === "user") {
            const t = extractText(m as UIMessage);
            if (t) allUserQuestions.push(t);
          }
        }

        let lastHitEntry: KnowledgeEntry | null = null;
        for (let i = allUserQuestions.length - 2; i >= 0; i--) {
          const hit = searchKnowledge(allUserQuestions[i]);
          if (hit) { lastHitEntry = hit; break; }
        }

        if (lastHitEntry) {
          const text = buildFollowupResponse(lastHitEntry, userQuestion, allUserQuestions);
          return sseStreamFromText(text);
        }

        // 全部未命中: 降级响应
        const related = findRelatedEntries(userQuestion, 5);
        const text = buildFallbackResponse(related, userQuestion);
        return sseStreamFromText(text);
      },
    },
  },
});
