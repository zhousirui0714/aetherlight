/**
 * 生成水墨风 SVG 背景并上传到 Supabase storage
 *
 * 设计原则:
 *  - 宣纸米黄 #f4ecdc 底
 *  - 极淡水墨山水 (远/中/近三层)
 *  - 一叶扁舟 + 飞鸟点缀
 *  - 右上角朱砂小印 (category 中文名)
 *  - 底部题款 "溯光" 朱砂小印
 *  - 9 个 category 各 1 张, 每张 1200x800
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = {};
for (const line of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m && !line.startsWith("#")) ENV[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const URL = ENV.SUPABASE_URL || ENV.VITE_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 缺失");
  process.exit(1);
}

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

// 9 个 category (DB 真实 key) + 中文标签 + 印文
const CATS = [
  { key: "poems",      label: "诗 词", seal: "诗" },
  { key: "classics",   label: "经 典", seal: "典" },
  { key: "figures",    label: "人 物", seal: "人" },
  { key: "philosophy", label: "哲 思", seal: "哲" },
  { key: "mythology",  label: "神 话", seal: "神" },
  { key: "festivals",  label: "节 令", seal: "节" },
  { key: "lifestyle",  label: "风 物", seal: "物" },
  { key: "artifacts",  label: "器 物", seal: "器" },
  { key: "intangible", label: "非 遗", seal: "遗" },
];

const W = 1200, H = 800;

// 9 张水墨山的"随机种子" — 决定山的形状,让每张图略有不同
// 但都是同一个水墨体系, 整体调性统一
function buildSvg(cat) {
  // 用 cat.key 字符串当种子, 推几个数
  const seed = [...cat.key].reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = (i, mod = 100) => ((seed * (i + 7) * 1103515245 + 12345) % mod) / mod;

  // 远山路径
  const peakCount = 5 + Math.floor(r(1) * 3);
  const baseY = 350 + Math.floor(r(2) * 40);
  let farPath = `M 0 ${baseY}`;
  for (let i = 0; i < peakCount; i++) {
    const x = (i + 0.5) * (W / peakCount);
    const peakY = baseY - 30 - Math.floor(r(3 + i) * 60);
    const cpx1 = x - W / peakCount / 2;
    const cpx2 = x - W / peakCount / 4;
    farPath += ` Q ${cpx1} ${peakY + 20} ${x} ${peakY} T ${x + W / peakCount / 2} ${peakY + 20}`;
  }
  farPath += ` L ${W} ${H} L 0 ${H} Z`;

  // 中山路径
  const midCount = 4 + Math.floor(r(8) * 3);
  const midBaseY = 450 + Math.floor(r(9) * 30);
  let midPath = `M 0 ${midBaseY}`;
  for (let i = 0; i < midCount; i++) {
    const x = (i + 0.5) * (W / midCount);
    const peakY = midBaseY - 20 - Math.floor(r(10 + i) * 40);
    midPath += ` Q ${x - W / midCount / 3} ${peakY + 15} ${x} ${peakY} T ${x + W / midCount / 3} ${peakY + 15}`;
  }
  midPath += ` L ${W} ${H} L 0 ${H} Z`;

  // 近山
  const nearBaseY = 550 + Math.floor(r(15) * 20);
  let nearPath = `M 0 ${nearBaseY}`;
  const nearCount = 3 + Math.floor(r(16) * 2);
  for (let i = 0; i < nearCount; i++) {
    const x = (i + 0.5) * (W / nearCount);
    const peakY = nearBaseY - 10 - Math.floor(r(17 + i) * 25);
    nearPath += ` Q ${x - W / nearCount / 3} ${peakY + 10} ${x} ${peakY} T ${x + W / nearCount / 3} ${peakY + 10}`;
  }
  nearPath += ` L ${W} ${H} L 0 ${H} Z`;

  // 飞鸟位置 (3-4 只)
  const birds = [];
  const birdCount = 3 + Math.floor(r(20) * 2);
  for (let i = 0; i < birdCount; i++) {
    birds.push({
      x: 600 + Math.floor(r(21 + i) * 500),
      y: 80 + Math.floor(r(25 + i) * 100),
    });
  }

  // 小舟
  const boatX = 80 + Math.floor(r(30) * 400);
  const boatY = 600 + Math.floor(r(31) * 60);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- 宣纸米黄底 -->
  <rect width="${W}" height="${H}" fill="#f4ecdc"/>

  <!-- 纸纹噪点 (模拟宣纸纤维) -->
  <defs>
    <filter id="paper">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${seed % 100}"/>
      <feColorMatrix values="0 0 0 0 0.85
                              0 0 0 0 0.78
                              0 0 0 0 0.65
                              0 0 0 0.08 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="ink">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="${(seed + 17) % 100}"/>
      <feDisplacementMap in="SourceGraphic" scale="3"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#f4ecdc" filter="url(#paper)"/>

  <!-- 远山 (最淡) -->
  <path d="${farPath}" fill="#3a3a3a" opacity="0.18" filter="url(#ink)"/>
  <!-- 中山 -->
  <path d="${midPath}" fill="#2a2a2a" opacity="0.30" filter="url(#ink)"/>
  <!-- 近山 (最浓) -->
  <path d="${nearPath}" fill="#1a1a1a" opacity="0.45" filter="url(#ink)"/>

  <!-- 飞鸟 -->
  ${birds.map((b) => `<path d="M ${b.x} ${b.y} q 8 -6 16 0 m -16 0 q 8 6 16 0" stroke="#1a1a1a" stroke-width="1.8" fill="none" opacity="0.55"/>`).join("\n  ")}

  <!-- 小舟 -->
  <path d="M ${boatX} ${boatY} q 50 -10 100 0 z" fill="#1a1a1a" opacity="0.65"/>
  <line x1="${boatX + 50}" y1="${boatY}" x2="${boatX + 50}" y2="${boatY - 32}" stroke="#1a1a1a" stroke-width="1.2" opacity="0.6"/>

  <!-- 右侧朱砂方印 (category 印文) -->
  <g transform="translate(${W - 130}, 90)">
    <rect x="0" y="0" width="70" height="70" fill="none" stroke="#c43a30" stroke-width="3" rx="2"/>
    <text x="35" y="48" font-family="'KaiTi','STKaiti',serif" font-size="36" fill="#c43a30" text-anchor="middle" font-weight="bold">${cat.seal}</text>
  </g>

  <!-- 左侧题款 category 标签 -->
  <g transform="translate(80, 90)">
    <text x="0" y="0" font-family="'KaiTi','STKaiti',serif" font-size="14" fill="#3a3a3a" letter-spacing="6" opacity="0.7">溯　光</text>
    <line x1="0" y1="14" x2="60" y2="14" stroke="#3a3a3a" stroke-width="0.5" opacity="0.4"/>
    <text x="0" y="36" font-family="'KaiTi','STKaiti',serif" font-size="22" fill="#1a1a1a" letter-spacing="8" opacity="0.85">${cat.label}</text>
  </g>

  <!-- 底部朱砂小印 "溯光" -->
  <g transform="translate(80, ${H - 70})">
    <rect x="0" y="0" width="44" height="44" fill="#c43a30" rx="1"/>
    <text x="22" y="30" font-family="'KaiTi','STKaiti',serif" font-size="18" fill="#faf5e8" text-anchor="middle" font-weight="bold">溯光</text>
  </g>
</svg>`;
}

const BUCKET = "covers";
const PREFIX = "sumi";

// 1. 生成本地文件 (供 review)
const OUT_DIR = join(ROOT, "public", "sumi-covers");
mkdirSync(OUT_DIR, { recursive: true });

console.log("🎨 生成 9 张水墨风 SVG...");
const svgs = {};
for (const cat of CATS) {
  const svg = buildSvg(cat);
  svgs[cat.key] = svg;
  const localPath = join(OUT_DIR, `${cat.key}.svg`);
  writeFileSync(localPath, svg, "utf-8");
  console.log(`  ✓ ${cat.key}.svg (${(svg.length / 1024).toFixed(1)}KB)`);
}

// 2. 上传 Supabase
async function ensureBucket() {
  const r = await fetch(`${URL}/storage/v1/bucket`, { headers: HEADERS });
  const buckets = await r.json();
  if (!buckets.find((b) => b.name === BUCKET)) {
    console.log(`\n创建 bucket: ${BUCKET}`);
    const c = await fetch(`${URL}/storage/v1/bucket`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        name: BUCKET,
        public: true,
        file_size_limit: 5242880, // 5MB
        allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
      }),
    });
    if (!c.ok) {
      console.error("Bucket 创建失败:", c.status, await c.text());
      process.exit(1);
    }
  } else {
    console.log(`\n✓ Bucket ${BUCKET} 已存在`);
  }
}

async function uploadSvg(cat) {
  const filename = `${PREFIX}/${cat.key}.svg`;
  const r = await fetch(`${URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Content-Type": "image/svg+xml",
      "x-upsert": "true",
    },
    body: svgs[cat.key],
  });
  if (!r.ok) {
    console.error(`  ✗ ${cat.key}: ${r.status} ${await r.text()}`);
    return null;
  }
  return `${URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

console.log("\n☁️  上传到 Supabase...");
await ensureBucket();
const urlByCat = {};
for (const cat of CATS) {
  const url = await uploadSvg(cat);
  if (url) {
    urlByCat[cat.key] = url;
    console.log(`  ✓ ${cat.key} → ${url}`);
  }
}

console.log("\n✅ 完成");
console.log("\nURL 映射 (供下一步 assign 用):");
console.log(JSON.stringify(urlByCat, null, 2));

// 写出 url map 给下一脚本
writeFileSync(
  join(ROOT, "covers-sumi-urls.json"),
  JSON.stringify(urlByCat, null, 2),
  "utf-8"
);
console.log(`\n写到 covers-sumi-urls.json`);
