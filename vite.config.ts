import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
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
  // ⚠️ 不要在这里用 vite.define 把 process.env.SUPABASE_URL 等替换成字面量:
  // vite build 启动时 process.env 是空的(Vercel 在 build 阶段才注入 env,但如果
  // Vercel UI 配的 env 比 build 启动晚,或者 env 通过 Vercel CLI 之外的方式管理,
  // vite 进程就拿不到),替换出来的就是空字符串,build 产物里硬编码成 "",runtime
  // 永远拿不到真值,Supabase 客户端就抛 "Missing Supabase environment variable(s)"
  // 导致所有非首页路由 500。
  // 正确做法:build 产物里保留 process.env.X 原样,Vercel runtime 会通过 process.env
  // 注入真值。scripts/emit-runtime-env.mjs 仍然把 env 写到 function 输出目录的
  // .env,防止任何走 dotenv/c12/loadEnv 的代码在 /var/task/.env 路径上 ENOENT。
});
