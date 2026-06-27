// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// 把 server-side env (SUPABASE_*, BAILIAN_*) 在 build 时内联成字符串字面量。
// 原因:Vercel 部署包里没有 .env 文件(gitignored),c12 / loadEnv 等代码如果在 runtime
// 读 /var/task/.env 会直接 ENOENT。把 process.env.X 替换成字符串后,bundle 里再无
// 任何运行时读 .env 的需求。
// 风险:内联后修改 env 需重 build。但 Vercel UI env 本身就是 build-time 注入的,语义一致。
const SERVER_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BAILIAN_API_KEY",
  "BAILIAN_BASE_URL",
] as const;

function buildServerEnvDefine(): Record<string, string> {
  const define: Record<string, string> = {};
  for (const key of SERVER_ENV_KEYS) {
    const value = process.env[key];
    // 留空字符串而不是 JSON.stringify(undefined),避免把整个表达式替换成 undefined
    define[`process.env.${key}`] = JSON.stringify(value ?? "");
  }
  return define;
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
  },
  vite: {
    // 把 process.env.SUPABASE_URL 等 server-side env 替换成字符串字面量。
    // 这样 runtime 不会再触发任何 .env 文件读取,根除 ENOENT /var/task/.env。
    define: buildServerEnvDefine(),
  },
});
