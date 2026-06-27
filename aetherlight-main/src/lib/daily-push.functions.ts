import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { BAILIAN_DEFAULT_MODEL, createBailianProvider } from "./ai-gateway.server";

const Input = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export const fetchDailyPush = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // try cache
    const { data: existing } = await supabaseAdmin
      .from("daily_pushes")
      .select("date,title,body,source_note")
      .eq("date", data.date)
      .maybeSingle();

    if (existing) return existing;

    const key = process.env.BAILIAN_API_KEY;
    if (!key) throw new Error("缺少 BAILIAN_API_KEY");

    const gateway = createBailianProvider(key);
    const d = new Date(data.date + "T08:00:00Z");
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();

    const { text } = await generateText({
      model: gateway(process.env.BAILIAN_MODEL || BAILIAN_DEFAULT_MODEL),
      prompt: `请为日期 ${data.date}(公历${month}月${day}日)生成一段中国传统文化的"每日撷光"推送。
要求:
1. 结合当日可能的节气、传统节日、历史人物诞辰或诗词主题选取一个切入点。
2. 风格雅致、书卷气、富有禅意,避免生硬的百科腔。
3. 输出严格 JSON,字段如下,不要 markdown 代码块:
{
  "title": "8-14字的诗意标题",
  "body": "120-180字的正文,讲述这个文化主题,使用富有意境的中文",
  "source_note": "一句话来源标注,如 '根据${month}月${day}日·节气推演' 或 '出自《XX》'"
}`,
    });

    let parsed: { title: string; body: string; source_note: string };
    try {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        title: "撷一缕时光",
        body: text.slice(0, 200),
        source_note: `根据${month}月${day}日生成`,
      };
    }

    await supabaseAdmin.from("daily_pushes").insert({
      date: data.date,
      title: parsed.title,
      body: parsed.body,
      source_note: parsed.source_note,
    });

    return { date: data.date, ...parsed };
  });
