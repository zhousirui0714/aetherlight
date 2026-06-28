/**
 * 生成水墨风 SVG 背景并上传到 Supabase storage
 * v2: 12 张图, 10 个 category + poems 拆 4 张变体
 *
 * 设计:
 *  - 宣纸米黄 #f4ecdc 底 + 纸纹噪点
 *  - 三层水墨山 (远/中/近)
 *  - 飞鸟 + 小舟 (每图位置/数量不同)
 *  - 主元素: 每 category 一个专属元素 (灯笼/竹/月/凉亭/...)
 *  - 右上角朱砂方印 (印文 = category 单字)
 *  - 左侧 "溯光" 落款 + category 标签
 *  - 底部 "溯光" 朱砂小印
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

if (!URL || !KEY) { console.error("❌ env missing"); process.exit(1); }

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const W = 1200, H = 800;

// 12 张图定义: key, label, seal, mainElement (SVG string fragment)
const COVERS = [
  // poems 4 张变体 (山水 + 飞鸟 + 小舟, 山势/飞鸟位置不同)
  { key: "poems-a",      label: "诗 词", seal: "诗", theme: "mountains" },
  { key: "poems-b",      label: "诗 词", seal: "诗", theme: "mountains" },
  { key: "poems-c",      label: "诗 词", seal: "诗", theme: "mountains" },
  { key: "poems-d",      label: "诗 词", seal: "诗", theme: "mountains" },
  // 9 个其他 category 各 1 张, 主题不同
  { key: "classics",     label: "经 典", seal: "典", theme: "scroll" },   // 书卷
  { key: "figures",      label: "人 物", seal: "人", theme: "pavilion" }, // 凉亭
  { key: "philosophy",   label: "哲 思", seal: "哲", theme: "bamboo" },   // 竹
  { key: "mythology",    label: "神 话", seal: "神", theme: "moon" },     // 月+云
  { key: "festivals",    label: "节 令", seal: "节", theme: "lantern" },  // 灯笼
  { key: "lifestyle",    label: "风 物", seal: "物", theme: "teapot" },   // 茶壶
  { key: "artifacts",    label: "器 物", seal: "器", theme: "vase" },     // 瓶
  { key: "intangible",   label: "非 遗", seal: "遗", theme: "loom" },     // 织机
  { key: "technology",   label: "古 技", seal: "技", theme: "compass" },  // 罗盘
];

// 简单 PRNG
function makeRng(seed) {
  return (i, mod = 1000) => ((seed * (i + 7) * 1103515245 + 12345) % mod) / mod;
}

function buildMountains(r, baseY) {
  const peakCount = 5 + Math.floor(r(1) * 3);
  let p = `M 0 ${baseY}`;
  for (let i = 0; i < peakCount; i++) {
    const x = (i + 0.5) * (W / peakCount);
    const peakY = baseY - 30 - Math.floor(r(3 + i) * 60);
    p += ` Q ${x - W / peakCount / 3} ${peakY + 20} ${x} ${peakY} T ${x + W / peakCount / 2} ${peakY + 20}`;
  }
  p += ` L ${W} ${H} L 0 ${H} Z`;
  return p;
}

function buildBirds(r, count = 3) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = 200 + Math.floor(r(21 + i) * 800);
    const y = 60 + Math.floor(r(25 + i) * 140);
    out.push(`<path d="M ${x} ${y} q 8 -6 16 0 m -16 0 q 8 6 16 0" stroke="#1a1a1a" stroke-width="1.8" fill="none" opacity="0.55"/>`);
  }
  return out.join("\n  ");
}

function buildBoat(r) {
  const x = 60 + Math.floor(r(30) * 400);
  const y = 600 + Math.floor(r(31) * 50);
  return `<path d="M ${x} ${y} q 50 -10 100 0 z" fill="#1a1a1a" opacity="0.65"/>
<line x1="${x + 50}" y1="${y}" x2="${x + 50}" y2="${y - 32}" stroke="#1a1a1a" stroke-width="1.2" opacity="0.6"/>`;
}

// 主题元素 (放在画面中下区域, 浅水墨)
function themeElement(theme, r) {
  switch (theme) {
    case "scroll":
      // 摊开的书卷 (中间)
      return `<g transform="translate(${W/2 - 180}, ${H/2 + 60})" opacity="0.45">
        <path d="M 0 30 Q 0 0 30 0 L 330 0 Q 360 0 360 30 L 360 80 Q 360 100 330 100 L 30 100 Q 0 100 0 80 Z" fill="#e8dcc0" stroke="#3a3a3a" stroke-width="1.2"/>
        <line x1="40" y1="30" x2="320" y2="30" stroke="#3a3a3a" stroke-width="0.6" opacity="0.5"/>
        <line x1="40" y1="50" x2="320" y2="50" stroke="#3a3a3a" stroke-width="0.6" opacity="0.5"/>
        <line x1="40" y1="70" x2="320" y2="70" stroke="#3a3a3a" stroke-width="0.6" opacity="0.5"/>
        <line x1="40" y1="90" x2="320" y2="90" stroke="#3a3a3a" stroke-width="0.6" opacity="0.5"/>
      </g>`;
    case "pavilion":
      // 山顶凉亭
      return `<g transform="translate(${W/2 - 90}, 380)" opacity="0.55">
        <path d="M 0 30 L 90 0 L 180 30 L 180 90 L 0 90 Z" fill="#3a3a3a" opacity="0.3"/>
        <line x1="0" y1="30" x2="180" y2="30" stroke="#1a1a1a" stroke-width="2"/>
        <rect x="20" y="30" width="40" height="60" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
        <rect x="80" y="30" width="40" height="60" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
        <rect x="140" y="30" width="20" height="60" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
      </g>`;
    case "bamboo":
      // 几根竹子
      return `<g transform="translate(${W - 200}, 200)" opacity="0.5">
        <line x1="0" y1="0" x2="0" y2="380" stroke="#2a4a2a" stroke-width="6" stroke-linecap="round"/>
        <line x1="30" y1="0" x2="30" y2="350" stroke="#2a4a2a" stroke-width="5" stroke-linecap="round"/>
        <line x1="60" y1="0" x2="60" y2="320" stroke="#2a4a2a" stroke-width="4" stroke-linecap="round"/>
        ${[0, 30, 60].map((x, i) => `
        <path d="M ${x} ${80 + i*40} q -40 -10 -60 -40" stroke="#3a5a3a" stroke-width="2" fill="none"/>
        <path d="M ${x} ${130 + i*40} q 50 -20 70 -10" stroke="#3a5a3a" stroke-width="2" fill="none"/>`).join("")}
      </g>`;
    case "moon":
      // 云中月
      return `<g opacity="0.5">
        <circle cx="${W - 180}" cy="180" r="60" fill="#e8dcc0" stroke="#3a3a3a" stroke-width="1" opacity="0.6"/>
        <circle cx="${W - 180}" cy="180" r="60" fill="none" stroke="#c43a30" stroke-width="0.5" opacity="0.4"/>
        <path d="M ${W - 280} 200 q 30 -30 80 -20 q 50 10 80 0" stroke="#3a3a3a" stroke-width="2" fill="none" opacity="0.5"/>
        <path d="M ${W - 320} 250 q 40 -20 100 -10" stroke="#3a3a3a" stroke-width="2" fill="none" opacity="0.5"/>
      </g>`;
    case "lantern":
      // 悬挂的灯笼 (多个)
      return `<g opacity="0.55">
        ${[0, 1, 2].map((i) => `
        <g transform="translate(${250 + i*220}, 100)">
          <line x1="0" y1="0" x2="0" y2="40" stroke="#1a1a1a" stroke-width="1.2"/>
          <ellipse cx="0" cy="65" rx="22" ry="30" fill="#c43a30" opacity="0.7"/>
          <line x1="-22" y1="65" x2="22" y2="65" stroke="#8a2820" stroke-width="0.8" opacity="0.6"/>
          <line x1="0" y1="35" x2="0" y2="40" stroke="#8a2820" stroke-width="0.8" opacity="0.6"/>
          <line x1="0" y1="90" x2="0" y2="95" stroke="#8a2820" stroke-width="0.8" opacity="0.6"/>
          <path d="M -5 95 q 5 15 0 25" stroke="#c43a30" stroke-width="1.5" fill="none" opacity="0.7"/>
        </g>`).join("")}
      </g>`;
    case "teapot":
      // 茶壶
      return `<g transform="translate(${W/2 - 100}, ${H/2 + 80})" opacity="0.5">
        <ellipse cx="100" cy="40" rx="100" ry="20" fill="#3a3a3a" opacity="0.3"/>
        <path d="M 20 40 Q 20 0 100 0 Q 180 0 180 40 L 170 80 L 30 80 Z" fill="#3a3a3a" opacity="0.4"/>
        <path d="M 180 30 L 220 20 L 220 50 L 180 40 Z" fill="#3a3a3a" opacity="0.4"/>
        <path d="M 95 0 L 95 -15 Q 100 -20 105 -15 L 105 0" fill="#3a3a3a" opacity="0.4"/>
      </g>`;
    case "vase":
      // 瓷瓶
      return `<g transform="translate(${W/2 - 60}, ${H/2 + 20})" opacity="0.5">
        <path d="M 50 0 L 50 20 Q 50 30 60 30 L 60 30 Q 50 40 30 80 Q 10 130 30 200 L 90 200 Q 110 130 90 80 Q 70 40 60 30 Q 70 30 70 20 L 70 0 Z" fill="#e8dcc0" stroke="#3a3a3a" stroke-width="1.5"/>
        <path d="M 30 100 Q 60 110 90 100" stroke="#c43a30" stroke-width="1" fill="none" opacity="0.6"/>
        <path d="M 35 130 q 15 -8 25 0 q 10 8 25 0" stroke="#3a3a3a" stroke-width="0.6" fill="none" opacity="0.5"/>
      </g>`;
    case "loom":
      // 织机 (简化)
      return `<g transform="translate(${W/2 - 120}, ${H/2 + 30})" opacity="0.5">
        <rect x="0" y="0" width="240" height="120" fill="none" stroke="#3a3a3a" stroke-width="2"/>
        ${Array.from({length: 10}, (_, i) => `<line x1="${i*24}" y1="0" x2="${i*24}" y2="120" stroke="#3a3a3a" stroke-width="0.5" opacity="0.4"/>`).join("")}
        <line x1="0" y1="60" x2="240" y2="60" stroke="#c43a30" stroke-width="2" opacity="0.4"/>
        <rect x="0" y="120" width="240" height="8" fill="#3a3a3a" opacity="0.4"/>
      </g>`;
    case "compass":
      // 罗盘
      return `<g transform="translate(${W/2}, ${H/2 + 50})" opacity="0.55">
        <circle cx="0" cy="0" r="80" fill="#e8dcc0" stroke="#3a3a3a" stroke-width="2"/>
        <circle cx="0" cy="0" r="65" fill="none" stroke="#3a3a3a" stroke-width="0.5"/>
        <circle cx="0" cy="0" r="6" fill="#c43a30"/>
        <line x1="0" y1="-70" x2="0" y2="70" stroke="#1a1a1a" stroke-width="1.5"/>
        <line x1="-70" y1="0" x2="70" y2="0" stroke="#1a1a1a" stroke-width="1.5"/>
        <text x="0" y="-50" font-family="'KaiTi',serif" font-size="14" fill="#c43a30" text-anchor="middle">南</text>
        <text x="0" y="62" font-family="'KaiTi',serif" font-size="14" fill="#3a3a3a" text-anchor="middle">北</text>
        <text x="-58" y="6" font-family="'KaiTi',serif" font-size="14" fill="#3a3a3a" text-anchor="middle">西</text>
        <text x="58" y="6" font-family="'KaiTi',serif" font-size="14" fill="#3a3a3a" text-anchor="middle">东</text>
      </g>`;
    default:
      return "";
  }
}

function buildSvg(cover) {
  const seed = [...cover.key].reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = makeRng(seed);

  const farY = 350 + Math.floor(r(2) * 40);
  const midY = 450 + Math.floor(r(9) * 30);
  const nearY = 550 + Math.floor(r(15) * 20);

  const farPath = buildMountains(r, farY);
  const midPath = buildMountains(r, midY);
  const nearPath = buildMountains(r, nearY);

  const birdCount = 3 + Math.floor(r(20) * 2);
  const birds = buildBirds(r, birdCount);
  const boat = buildBoat(r);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="paper">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${seed % 100}"/>
      <feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.78  0 0 0 0 0.65  0 0 0 0.08 0"/>
    </filter>
    <filter id="ink">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="${(seed + 17) % 100}"/>
      <feDisplacementMap in="SourceGraphic" scale="3"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="#f4ecdc"/>
  <rect width="${W}" height="${H}" fill="#f4ecdc" filter="url(#paper)"/>

  <!-- 远山 -->
  <path d="${farPath}" fill="#3a3a3a" opacity="0.18" filter="url(#ink)"/>
  <!-- 中山 -->
  <path d="${midPath}" fill="#2a2a2a" opacity="0.30" filter="url(#ink)"/>
  <!-- 近山 -->
  <path d="${nearPath}" fill="#1a1a1a" opacity="0.45" filter="url(#ink)"/>

  <!-- 主题元素 (在山前, 水墨淡) -->
  ${themeElement(cover.theme, r)}

  <!-- 飞鸟 -->
  ${birds}

  <!-- 小舟 -->
  ${boat}

  <!-- 右侧朱砂方印 -->
  <g transform="translate(${W - 130}, 90)">
    <rect x="0" y="0" width="70" height="70" fill="none" stroke="#c43a30" stroke-width="3" rx="2"/>
    <text x="35" y="48" font-family="'KaiTi','STKaiti',serif" font-size="36" fill="#c43a30" text-anchor="middle" font-weight="bold">${cover.seal}</text>
  </g>

  <!-- 左侧题款 -->
  <g transform="translate(80, 90)">
    <text x="0" y="0" font-family="'KaiTi','STKaiti',serif" font-size="14" fill="#3a3a3a" letter-spacing="6" opacity="0.7">溯　光</text>
    <line x1="0" y1="14" x2="60" y2="14" stroke="#3a3a3a" stroke-width="0.5" opacity="0.4"/>
    <text x="0" y="36" font-family="'KaiTi','STKaiti',serif" font-size="22" fill="#1a1a1a" letter-spacing="8" opacity="0.85">${cover.label}</text>
  </g>

  <!-- 底部溯光印 -->
  <g transform="translate(80, ${H - 70})">
    <rect x="0" y="0" width="44" height="44" fill="#c43a30" rx="1"/>
    <text x="22" y="30" font-family="'KaiTi','STKaiti',serif" font-size="18" fill="#faf5e8" text-anchor="middle" font-weight="bold">溯光</text>
  </g>
</svg>`;
}

const BUCKET = "covers";
const PREFIX = "sumi";
const OUT_DIR = join(ROOT, "public", "sumi-covers");
mkdirSync(OUT_DIR, { recursive: true });

// 1. 删旧 svg
import { readdirSync, unlinkSync } from "node:fs";
for (const f of readdirSync(OUT_DIR).filter(f => f.endsWith(".svg"))) {
  unlinkSync(join(OUT_DIR, f));
}

console.log(`🎨 生成 ${COVERS.length} 张水墨风 SVG...`);
const svgs = {};
for (const c of COVERS) {
  const svg = buildSvg(c);
  svgs[c.key] = svg;
  writeFileSync(join(OUT_DIR, `${c.key}.svg`), svg, "utf-8");
  console.log(`  ✓ ${c.key}.svg (${(svg.length / 1024).toFixed(1)}KB)`);
}

// 2. 上传 Supabase
async function ensureBucket() {
  const r = await fetch(`${URL}/storage/v1/bucket`, { headers: HEADERS });
  const buckets = await r.json();
  if (!buckets.find((b) => b.name === BUCKET)) {
    const c = await fetch(`${URL}/storage/v1/bucket`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        name: BUCKET, public: true, file_size_limit: 5242880,
        allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
      }),
    });
    if (!c.ok) { console.error("Bucket create fail:", c.status); process.exit(1); }
  }
}

async function uploadSvg(key) {
  const filename = `${PREFIX}/${key}.svg`;
  const r = await fetch(`${URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "image/svg+xml", "x-upsert": "true" },
    body: svgs[key],
  });
  if (!r.ok) {
    console.error(`  ✗ ${key}: ${r.status} ${await r.text()}`);
    return null;
  }
  return `${URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

console.log("\n☁️  上传 Supabase...");
await ensureBucket();
const urlByKey = {};
for (const c of COVERS) {
  const url = await uploadSvg(c.key);
  if (url) urlByKey[c.key] = url;
}
console.log(`✓ 上传 ${Object.keys(urlByKey).length}/${COVERS.length} 张`);

writeFileSync(join(ROOT, "covers-sumi-urls.json"), JSON.stringify(urlByKey, null, 2), "utf-8");
console.log(`\n✅ 写到 covers-sumi-urls.json`);
