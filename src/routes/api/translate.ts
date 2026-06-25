import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createAiProvider, getDefaultModel } from "@/lib/ai-gateway.server";
import { findSage } from "@/lib/sages";

/**
 * POST /api/translate
 * body: {
 *   text: string,
 *   mode?: "voice" | "scholar" | "poet",   // 默认 "voice"(兼容旧调用)
 *   sageId?: string,                         // voice 模式必填
 *   poetName?: string,                       // poet 模式必填
 * }
 * resp: { translation: string }
 *
 * 三种口吻:
 * - voice:  用 sage 的口吻(对话页用)
 * - scholar: 用学者口吻(文章正文、长廊卡片用)
 * - poet:    用诗人本人口吻(诗句「...」用)
 */
export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          text?: string;
          mode?: "voice" | "scholar" | "poet";
          sageId?: string;
          poetName?: string;
        };
        const { text, mode = "voice", sageId, poetName } = body;
        if (!text || typeof text !== "string" || !text.trim()) {
          return new Response(JSON.stringify({ error: "text required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const provider = createAiProvider();
        let system: string;
        if (mode === "voice") {
          if (!sageId) {
            return new Response(JSON.stringify({ error: "sageId required for voice mode" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const sage = findSage(sageId);
          if (!sage) {
            return new Response(JSON.stringify({ error: "unknown sage" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }
          system = `你正在扮演中国历史人物【${sage.name}】。
身份：${sage.dynasty}
性格：${sage.styles.join("、")}
个人小传：${sage.intro}

任务：把【你(${sage.name})自己】刚刚说过的一段文言文,翻译成大白话版本。
**关键:用你自己的口吻说,不要用翻译腔**。

严格要求:
1. 第一人称用「我」,称呼对方用「你」或你惯用的称呼
2. 用现代汉语口语,但**不要翻译腔**——禁止「我对此感到十分悲伤」「此时此刻我怀着激动的心情」这种拗口表达
3. 保留原文的核心信息、情感、典故;引用过的诗句可以用括号简单解释
4. 长度控制在原文的 1.2-1.8 倍,不要啰嗦
5. 直接输出翻译结果,**不要加「翻译:」「大白话版:」等任何前缀**,不要任何注释
6. 如果原文本身已经是大白话,只输出:「(此句已是白话,无需翻译)」`;
        } else if (mode === "poet") {
          if (!poetName || !poetName.trim()) {
            return new Response(JSON.stringify({ error: "poetName required for poet mode" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          system = `你正在扮演中国古代诗人【${poetName}】。
任务：把"你(${poetName})自己写的诗"或"别人引用你的诗"翻译成大白话,用你自己的口吻说。

严格要求:
1. 用你自己的性格、说话方式(可参考你的时代背景和作品风格)
2. 第一人称用「我」,称呼对方用「你」或你惯用的称呼
3. 用现代汉语口语,**不要翻译腔**——禁止「我对此感到十分悲伤」「此时此刻我怀着激动的心情」这种拗口表达
4. 保留原诗的意象、情感、典故;可以简单解释
5. 长度控制在原文的 1.2-1.8 倍
6. 直接输出翻译结果,**不要加「翻译:」「大白话版:」等任何前缀**
7. 如果原文本身已经是大白话,只输出:「(此句已是白话,无需翻译)」`;
        } else {
          // scholar mode
          system = `你是「溯光」的雅士——一位博古通今的现代学者,精通中国古典文学,擅长把文言文翻译成现代汉语。
性格：温和、博学、耐心、有点文人气。

任务：把用户提供的文言文,翻译成大白话版本。用学者向朋友讲解的口吻。

严格要求:
1. 用现代汉语口语,**不要翻译腔**——禁止「我对此感到十分悲伤」「此时此刻我怀着激动的心情」这种拗口表达
2. 保留原文的核心信息、情感、典故;可以用括号简单解释生僻典故
3. 长度控制在原文的 1.2-1.8 倍
4. 直接输出翻译结果,**不要加「翻译:」「大白话版:」等任何前缀**
5. 如果原文本身已经是大白话,只输出:「(此句已是白话,无需翻译)」`;
        }

        try {
          const result = await generateText({
            model: provider(getDefaultModel()),
            system,
            prompt: text,
            temperature: 0.6,
          });
          const translation = result.text.trim();
          return new Response(JSON.stringify({ translation }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[translate] LLM error:", e);
          return new Response(JSON.stringify({ error: "translation_failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
