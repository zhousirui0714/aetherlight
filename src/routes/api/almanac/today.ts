/**
 * /api/almanac/today
 * GET  - 返回今日黄历
 *
 * 缓存：服务端 1 小时（每天的数据基本不变）
 */
import { createFileRoute } from "@tanstack/react-router";
import { getAlmanac } from "@/lib/lunisolar-helper";

const CACHE_TTL_MS = 60 * 60 * 1000;
let cached: { data: any; ts: number } | null = null;

export const Route = createFileRoute("/api/almanac/today")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const dateParam = url.searchParams.get("date");
        const now = Date.now();
        const requested = dateParam ? new Date(dateParam) : new Date();

        // 缓存 key 用日期（不同时刻同一天可复用）
        const dayKey = requested.toISOString().slice(0, 10);
        if (cached && cached.ts > now - CACHE_TTL_MS && cached.data?.dayKey === dayKey) {
          return Response.json({ ...cached.data.data, cached: true });
        }

        try {
          const data = getAlmanac(requested);
          const payload = { data, dayKey };
          cached = { data: payload, ts: now };
          return Response.json({ ...data, cached: false });
        } catch (err) {
          console.error("[almanac] error:", err);
          return Response.json({ error: "lunisolar 计算失败" }, { status: 500 });
        }
      },
    },
  },
});
