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
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // 当前 chunks 主要被 @tanstack/react-router 和一票 @radix-ui 组件撑大
    // (~670KB 和 300+KB)。真正瘦身要靠 dynamic import 拆路由 / 砍掉用不到的
    // Radix 组件,先放宽阈值消除警告,避免日后再添包时反复触发。
    build: {
      chunkSizeWarningLimit: 1024,
    },
  },
});
