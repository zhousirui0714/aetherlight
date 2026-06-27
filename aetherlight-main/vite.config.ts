// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Force-enable the Nitro deploy plugin and pin the preset to Vercel's Node serverless
  // runtime. Without this, the build emits a Cloudflare-Worker bundle (`dist/server/server.js`)
  // which Vercel can't run, so the deployed site falls through to Vercel's own error page.
  nitro: {
    preset: "vercel",
    vercel: {
      // Functions take longer than the default 10s once we start doing AI streaming
      // upstream. Bump to 30s (Vercel hobby plan max for Node functions).
      functions: {
        maxDuration: 30,
      },
    },
    // Nitro v3 vite 插件会强制关掉 Vite 的 copyPublicDir,但它自己的 publicAssets
    // 默认只含 Vite 构建产物(assets/ 里那些 JS/CSS/字体),不包含 Vite 的 publicDir。
    // 这导致 public/ai-covers/, public/home-illustrations/ 等共 1000+ 张图永远
    // 不会被复制到 .vercel/output/static/。显式把 public/ 注入 publicAssets 才能
    // 让 Vercel 把它们当静态资源 serve。
    publicAssets: [
      {
        dir: "public",
        maxAge: 60 * 60 * 24, // 1 天缓存,图片不算 fingerprint
        baseURL: "/",
        fallthrough: false,
      },
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      // 当前 chunks 主要被 @tanstack/react-router 和一票 @radix-ui 组件撑大
      // (~670KB 和 300+KB)。真正瘦身要靠 dynamic import 拆路由 / 砍掉用不到的
      // Radix 组件,先放宽阈值消除警告,避免日后再添包时反复触发。
      chunkSizeWarningLimit: 1024,
    },
    // ⚠️ 不要再用 vite.define 把 process.env.SUPABASE_URL 等替换成字面量!
    // 上一轮用 define 修 ENOENT /var/task/.env 是错的副作用:build 启动时
    // process.env 是空的(这些 env 是 Vercel runtime 注入的,不是 build 阶段),
    // define 替换出来硬编码成空字符串,runtime 永远拿不到真值,所有非首页
    // createServerFn 路由 500。改回让 build 产物保留 process.env.X 由 Vercel
    // runtime 注入。scripts/emit-runtime-env.mjs 仍然把 env 写到 function
    // 输出目录的 .env,防御任何走 dotenv/c12/loadEnv 的代码在 /var/task/.env
    // 路径上 ENOENT。
  },
});
