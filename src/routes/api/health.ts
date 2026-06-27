/**
 * /api/health — 部署后 healthcheck。
 *
 * 不做任何重活,只做"轻探活": 进程能跑 → Supabase / BAILIAN 端点
 * 各打一发 HEAD/GET 看是否能 TLS 握手成功。失败也不要让 process
 * 崩,只是把每个 dependency 的 status 标成 down,让调用方一眼看出
 * 哪个上游挂了。env 缺失也归在 down 里报出来,方便"页面 500 了"
 * 时第一眼定位是 env 没配还是上游挂了。
 *
 * 不返回任何敏感 env 值,只返回变量名 + 是否非空。
 */
import { createFileRoute } from "@tanstack/react-router";

type CheckResult = { ok: boolean; detail?: string };

async function checkSupabase(): Promise<CheckResult> {
  const url = process.env.SUPABASE_URL;
  if (!url) return { ok: false, detail: "SUPABASE_URL missing" };
  try {
    // Supabase 的 /auth/v1/health 是个无 auth 的轻 endpoint,HEAD 即可
    const r = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return { ok: r.ok, detail: `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

async function checkBailian(): Promise<CheckResult> {
  const base = process.env.BAILIAN_BASE_URL;
  if (!base) return { ok: false, detail: "BAILIAN_BASE_URL missing" };
  try {
    // 摸一下 base URL 的根,绝大多数网关会回 4xx 而非断连,能区分
    // "域名解析/握手失败" vs "鉴权失败"。
    const r = await fetch(base, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    // 任何 HTTP 响应都算 TCP/TLS 通,只关心网络层是否可达
    return { ok: r.status < 500, detail: `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

function checkEnvPresent(names: string[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const n of names) out[n] = Boolean(process.env[n]?.length);
  return out;
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const [supabase, bailian] = await Promise.all([checkSupabase(), checkBailian()]);
        const env = checkEnvPresent([
          "SUPABASE_URL",
          "SUPABASE_PUBLISHABLE_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
          "BAILIAN_API_KEY",
          "BAILIAN_BASE_URL",
        ]);
        const allOk =
          supabase.ok && bailian.ok && Object.values(env).every(Boolean);
        return new Response(
          JSON.stringify({
            ok: allOk,
            uptime: process.uptime(),
            time: new Date().toISOString(),
            env,
            supabase,
            bailian,
          }),
          {
            status: allOk ? 200 : 503,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
              "CDN-Cache-Control": "no-store",
              "Vercel-CDN-Cache-Control": "no-store",
            },
          },
        );
      },
    },
  },
});
