import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createAiProvider, getDefaultModel } from "@/lib/ai-gateway.server";
import { findBook } from "@/lib/books";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// 缓存已读取的典籍原文，避免每次请求都读盘
const BOOK_CACHE = new Map<string, { title: string; chapters: { title: string; paragraphs: string[] }[] }>();

function loadBookData(bookId: string) {
  if (BOOK_CACHE.has(bookId)) return BOOK_CACHE.get(bookId)!;
  const filePath = join(process.cwd(), "src", "data", "reservator-books", `${bookId}.json`);
  if (!existsSync(filePath)) return null;
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  BOOK_CACHE.set(bookId, raw);
  return raw;
}

/** 在典籍原文中做关键词检索，返回最相关的段落 */
function searchBookParagraphs(
  bookData: { chapters: { title: string; paragraphs: string[] }[] },
  query: string,
  maxResults = 5
): { chapterTitle: string; text: string; score: number }[] {
  const tokens = query
    .toLowerCase()
    .split(/[\s,，。、？?！!；;：:《》''""]+/)
    .filter((t) => t.length >= 2);

  if (tokens.length === 0) return [];

  const results: { chapterTitle: string; text: string; score: number }[] = [];

  for (const chapter of bookData.chapters) {
    for (const para of chapter.paragraphs) {
      const lower = para.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (lower.includes(token)) score += token.length;
      }
      if (score > 0) {
        results.push({ chapterTitle: chapter.title, text: para, score });
      }
    }
  }

  // 按匹配度排序，取 top N
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

export const Route = createFileRoute("/api/book-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: UIMessage[];
          bookId?: string;
        };
        const { messages, bookId } = body;
        if (!Array.isArray(messages) || !bookId) {
          return new Response("messages and bookId required", { status: 400 });
        }

        const book = findBook(bookId);
        if (!book) return new Response("unknown book", { status: 404 });

        // 加载典籍原文
        const bookData = loadBookData(bookId);
        if (!bookData) return new Response("book data not found", { status: 404 });

        // 提取用户最新问题
        const lastMsg = [...messages].reverse().find((m) => m.role === "user");
        const userText = lastMsg
          ? lastMsg.parts.map((p: any) => (p.type === "text" ? p.text : "")).join("")
          : "";

        // 关键词检索原文段落
        const matchedParagraphs = userText ? searchBookParagraphs(bookData, userText, 5) : [];

        // 构建 RAG 上下文
        let ragContext = `\n\n【典籍信息】\n书名：《${book.title}》\n作者：${book.author}\n朝代：${book.dynasty}\n类别：${book.category}\n简介：${book.brief}`;

        if (matchedParagraphs.length > 0) {
          ragContext += `\n\n【典籍原文检索结果（按相关度排序）】\n`;
          for (const p of matchedParagraphs) {
            ragContext += `\n（出自 ${p.chapterTitle}）\n「${p.text.slice(0, 300)}」${p.text.length > 300 ? "…" : ""}\n`;
          }
        } else {
          ragContext += `\n\n【提示】典籍库中未找到与问题直接匹配的原文段落，请凭你的学识回答。`;
        }

        const system = `你是一位通晓《${book.title}》的国学学者，温润、博学、典雅。

要求：
- 基于提供的典籍原文段落回答问题，可引用原文并加以解释
- 引用原文时用「」括起，并在末尾注明出处章节
- 若原文段落不足以回答问题，可结合你对中国传统文化的了解作答
- 语言文白相间，典雅但易懂，单次回答 80–300 字
- 不得自称"AI"或"语言模型"
- 若不确定，坦诚说"此节我亦未深考"${ragContext}`;

        // 降级文本（LLM 不可用时）
        function buildFallbackResponse(): string {
          if (matchedParagraphs.length > 0) {
            let resp = `## 据《${book.title}》所载\n\n`;
            for (const p of matchedParagraphs.slice(0, 3)) {
              resp += `「${p.text.slice(0, 200)}」${p.text.length > 200 ? "…" : ""}\n\n`;
              resp += `—— 出自 ${p.chapterTitle}\n\n`;
            }
            return resp;
          }
          return `「${userText}」\n\n—— 此节我亦未深考，容我翻阅典籍，改日再与君细说。`;
        }

        try {
          const provider = createAiProvider();
          const model = provider(getDefaultModel());
          const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(messages),
          });

          const response = result.toUIMessageStreamResponse({ originalMessages: messages });
          const body = response.body;
          if (!body) throw new Error("No response body");

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
            cancel() { reader.cancel(); fallbackDeployed = true; },
          });

          return new Response(wrappedStream, {
            status: response.status,
            headers: response.headers,
          });
        } catch (llmErr) {
          console.warn("[book-chat] LLM unavailable, fallback to static:", llmErr);
          return sseStreamFromText(buildFallbackResponse());
        }
      },
    },
  },
});

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
    controller.enqueue(encoder.encode(`data: {"type":"text-delta","id":"${id}","delta":"${escaped}"}\n\n`));
  }
  controller.enqueue(encoder.encode(`data: {"type":"text-end","id":"${id}"}\n\n`));
  controller.enqueue(encoder.encode(`data: {"type":"finish","finishReason":"stop"}\n\n`));
  controller.enqueue(encoder.encode(`\n`));
}

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
