/**
 * 首页静态插图 URL 映射
 * - 4 张 Hero fallback 大背景 (1920x1080)
 * - 5 张 FeaturedEditorial 李白专题 (1 大 1024x640 + 4 小 800x600)
 * - 8 张 SagesDialogue 圣贤头像 (512x512)
 *
 * 来源: scripts/gen-home-illustrations.mjs
 * Storage: Supabase home-covers bucket
 * 风格: 新中式水墨画 (sumi-e, 5-7 阶墨色，无文字)
 * 生成时间: 2026-06-25
 */
export const HOME_FALLBACK_IMAGES = [
  "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/hero-fallback-1.jpg", // 山
  "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/hero-fallback-2.jpg", // 园林
  "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/hero-fallback-3.jpg", // 古建筑
  "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/hero-fallback-4.jpg", // 古寺
] as const;

export const FEATURED_EDITORIAL_IMAGE =
  "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/editorial-libai-main.jpg";

export const FEATURED_EDITORIAL_CARDS: Array<{ id: string; image: string }> = [
  { id: "static-1", image: "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/editorial-jingyesi.jpg" },
  { id: "static-2", image: "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/editorial-jiangjinjiu.jpg" },
  { id: "static-3", image: "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/editorial-yuexiazhuo.jpg" },
  { id: "static-4", image: "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/editorial-shuzhong.jpg" },
];

export const SAGE_AVATAR_URLS: Record<string, string> = {
  confucius:    "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/sage-confucius.jpg",
  wangxizhi:    "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/sage-wangxizhi.jpg",
  libai:        "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/sage-lbai.jpg",
  sushi:        "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/sage-sushi.jpg",
  wangyangming: "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/sage-wangyangming.jpg",
  guanhanqing:  "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/sage-guanhanqing.jpg",
  caoxueqin:    "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/sage-caoxueqin.jpg",
  meilanfang:   "https://ozshflujnxonhfwdtunp.supabase.co/storage/v1/object/public/home-covers/sage-meilanfang.jpg",
};
