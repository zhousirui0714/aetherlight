/**
 * 批量为首页 17 个静态插图位置生成独特水墨风 AI 插图
 * - HomeHero 4 张 fallback 背景（1920x1080）
 * - FeaturedEditorial 5 张李白专题（1 大 + 4 小）
 * - SagesDialogue 8 张圣贤头像（240x240）
 *
 * 输出：
 * - 下载到 public/home-illustrations/<filename>
 * - 上传 Supabase Storage home-covers/<filename>
 * - 写入 home-covers-progress.json（断点续传）
 * - 控制台输出最终 URL 映射（手抄到组件里）
 *
 * 用法:
 *   node scripts/gen-home-illustrations.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const CACHE_FILE = join(ROOT, "scripts", "home-covers-progress.json");
const OUT_DIR = join(ROOT, "public", "home-illustrations");
const BUCKET = "home-covers";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const ENV = loadEnv();
const URL = ENV.SUPABASE_URL || ENV.VITE_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "image/jpeg",
};
mkdirSync(OUT_DIR, { recursive: true });

// 严格水墨风 (无文字 / 无人物肖像)
const STYLE = `Traditional Chinese ink wash painting (shuimo), sumi-e brush technique, wet ink wash gradients with 5-7 shades of gray ink only, generous negative space (60% blank rice paper), no outlines, no color except one small vermillion red seal stamp at corner. STRICTLY NO TEXT, NO CHARACTERS, NO LETTERS, NO WRITING, NO CALLIGRAPHY, NO INSCRIPTIONS anywhere. Empty blank surfaces only. No modern elements, no frame, no border, no watermark, no signature, no captions, no labels, no titles, no annotations. Museum quality, ultra high detail, masterpiece.`;

// 圣贤肖像版（允许人物侧影）
const SAGE_STYLE = `Traditional Chinese literati portrait painting (xieyi / freehand style), monochrome ink wash on aged rice paper, sage wearing ancient Hanfu robe, three-quarter view, minimal facial features captured with a few brush strokes, dignified serene expression, soft ink gradients, 5-7 shades of gray, generous negative space around figure, one small vermillion red seal stamp at corner. STRICTLY NO TEXT, NO CHARACTERS, NO LETTERS, NO WRITING, NO CALLIGRAPHY, NO INSCRIPTIONS anywhere. No frame, no border, no watermark, no signature, no labels. 1:1 square composition, museum quality, ultra high detail, masterpiece.`;

// 17 个任务定义
const JOBS = [
  // HomeHero 4 张 fallback 背景
  {
    id: "hero-fallback-1",
    label: "Hero fallback · 山",
    width: 1920, height: 1080,
    prompt: `${STYLE} A vast misty mountain range with layered peaks fading into fog, traditional Chinese shan-shui composition with strong foreground pine trees, distant ethereal cloud-wrapped summits, subtle river winding through valley. Aspect 16:9 cinematic widescreen, atmospheric perspective.`,
  },
  {
    id: "hero-fallback-2",
    label: "Hero fallback · 园林",
    width: 1920, height: 1080,
    prompt: `${STYLE} A classical Chinese garden (yuanlin) with curved moon gate, lattice windows, lotus pond, ornate pavilion reflected in still water, willows draping over rockery, atmospheric mist. Aspect 16:9 cinematic widescreen.`,
  },
  {
    id: "hero-fallback-3",
    label: "Hero fallback · 古建筑",
    width: 1920, height: 1080,
    prompt: `${STYLE} A grand ancient Chinese palace hall (gongdian) with sweeping upturned eaves, intricate dougong brackets, vermillion wooden columns, stone platform, mountain backdrop. Aspect 16:9 cinematic widescreen, monumental composition.`,
  },
  {
    id: "hero-fallback-4",
    label: "Hero fallback · 古寺",
    width: 1920, height: 1080,
    prompt: `${STYLE} A remote ancient Buddhist temple (simiao) nestled among misty pine-forested mountains, stone path with monk's footprints, single incense curl rising, pagoda silhouette in distance. Aspect 16:9 cinematic widescreen, contemplative atmosphere.`,
  },

  // FeaturedEditorial · 李白专题 (1 大 + 4 小)
  {
    id: "editorial-libai-main",
    label: "Editorial main · 李白盛唐气象",
    width: 1024, height: 640,
    prompt: `${STYLE} A grand Tang dynasty poet standing on a cliff edge overlooking vast misty mountains and a winding river, flowing Hanfu robes caught in mountain wind, raised wine cup, moon rising over peaks, dramatic high Tang poetic atmosphere. Aspect 16:10, monumental.`,
  },
  {
    id: "editorial-jingyesi",
    label: "Editorial · 静夜思",
    width: 800, height: 600,
    prompt: `${STYLE} A quiet moonlit night scene, frost glistening on the ground like white salt, lone wanderer seen from behind looking up at the bright full moon through bare branches, distant humble cottage. Aspect 4:3, melancholic serene.`,
  },
  {
    id: "editorial-jiangjinjiu",
    label: "Editorial · 将进酒",
    width: 800, height: 600,
    prompt: `${STYLE} A dramatic golden Yellow River cascading from the heavens in turbulent waves meeting the sea, three friends raising wine cups in a moonlit pavilion, mountains and stars, exuberant energy. Aspect 4:3, dynamic and grand.`,
  },
  {
    id: "editorial-yuexiazhuo",
    label: "Editorial · 月下独酌",
    width: 800, height: 600,
    prompt: `${STYLE} A solitary poet sitting on a stone bench in a moonlit garden, full moon reflected in a clear wine vessel on the ground, plum blossom branches overhead, single crane shadow passing. Aspect 4:3, intimate and lonely.`,
  },
  {
    id: "editorial-shuzhong",
    label: "Editorial · 李白蜀中岁月",
    width: 800, height: 600,
    prompt: `${STYLE} A young swordsman on a mule leaving a Sichuan mountain valley, towering emerald peaks (Qingchengshan) in the background, ancient plank road, mist rising from the gorge, pine and bamboo. Aspect 4:3, romantic departure.`,
  },

  // SagesDialogue 8 张圣贤头像
  {
    id: "sage-confucius",
    label: "Sage · 孔子",
    width: 512, height: 512,
    prompt: `${SAGE_STYLE} Confucius (Kong Zi), elderly wise sage with long flowing beard, kind dignified eyes, wearing layered scholar's robes and traditional headpiece, holding a bamboo scroll. Ancient Chinese literati portrait, 1:1 square.`,
  },
  {
    id: "sage-wangxizhi",
    label: "Sage · 王羲之",
    width: 512, height: 512,
    prompt: `${SAGE_STYLE} Wang Xizhi, the Sage of Calligraphy, elegant refined scholar with gentle expression, holding a calligraphy brush, ink stone and scroll on side table, crane in the background. Ancient Chinese literati portrait, 1:1 square.`,
  },
  {
    id: "sage-lbai",
    label: "Sage · 李白",
    width: 512, height: 512,
    prompt: `${SAGE_STYLE} Li Bai, the Poet Immortal, free-spirited scholar with high forehead and bright eyes, slight smile, holding a wine gourd, long Tang-dynasty robe, pine trees and moon in background. Ancient Chinese literati portrait, 1:1 square.`,
  },
  {
    id: "sage-sushi",
    label: "Sage · 苏轼",
    width: 512, height: 512,
    prompt: `${SAGE_STYLE} Su Shi (Su Dongpo), middle-aged poet with full beard and dignified expression, wearing a tall official's hat, holding a bamboo staff, distant West Lake in background. Ancient Chinese literati portrait, 1:1 square.`,
  },
  {
    id: "sage-wangyangming",
    label: "Sage · 王阳明",
    width: 512, height: 512,
    prompt: `${SAGE_STYLE} Wang Yangming, the Neo-Confucian philosopher, serious contemplative scholar with piercing eyes, seated in meditation pose, simple scholar robes, bamboo grove behind. Ancient Chinese literati portrait, 1:1 square.`,
  },
  {
    id: "sage-guanhanqing",
    label: "Sage · 关汉卿",
    width: 512, height: 512,
    prompt: `${SAGE_STYLE} Guan Hanqing, Yuan dynasty playwright, lively expressive scholar with sharp eyes, slight theatrical smirk, holding a stage prop scroll, traditional Yuan-era costume. Ancient Chinese literati portrait, 1:1 square.`,
  },
  {
    id: "sage-caoxueqin",
    label: "Sage · 曹雪芹",
    width: 512, height: 512,
    prompt: `${SAGE_STYLE} Cao Xueqin, Qing dynasty novelist of Dream of the Red Chamber, melancholic thin scholar with refined features, holding a writing brush, books stacked beside him, plum blossom branch. Ancient Chinese literati portrait, 1:1 square.`,
  },
  {
    id: "sage-meilanfang",
    label: "Sage · 梅兰芳",
    width: 512, height: 512,
    prompt: `${SAGE_STYLE} Mei Lanfang, the legendary Peking opera performer, elegant figure in refined scholar-paintist attire, soft stage-like poise, holding a folded fan, peony and orchid in background suggesting theatrical beauty. Ancient Chinese literati portrait, 1:1 square.`,
  },
];

// 加载进度
let progress = {};
if (existsSync(CACHE_FILE)) {
  progress = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
  console.log(`已加载进度: ${Object.keys(progress).length} 张已完成\n`);
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

async function generateOne(job) {
  if (progress[job.id]) {
    return { ok: true, skipped: true, url: progress[job.id] };
  }
  const seed = hashCode(job.id) % 100000;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(job.prompt)}?width=${job.width}&height=${job.height}&seed=${seed}&nologo=true&model=flux`;
  const filename = `${job.id}.jpg`;
  const outPath = join(OUT_DIR, filename);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 5000) throw new Error(`Too small (${buffer.length}B), likely error image`);
      writeFileSync(outPath, buffer);

      // 上传到 Supabase Storage
      const upRes = await fetch(
        `${URL}/storage/v1/object/${BUCKET}/${filename}`,
        {
          method: "POST",
          headers: { ...HEADERS, "Content-Type": "image/jpeg", "x-upsert": "true" },
          body: buffer,
        }
      );
      if (!upRes.ok) {
        const t = await upRes.text();
        throw new Error(`Upload ${upRes.status}: ${t.slice(0, 100)}`);
      }

      const publicUrl = `${URL}/storage/v1/object/public/${BUCKET}/${filename}`;
      progress[job.id] = publicUrl;
      return { ok: true, url: publicUrl, size: buffer.length };
    } catch (e) {
      console.log(`\n  [${job.id}] attempt ${attempt}/3 failed: ${e.message}`);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 10000));
      } else {
        return { ok: false, error: e.message };
      }
    }
  }
}

const startTime = Date.now();
let ok = 0, fail = 0, skip = 0;
for (let i = 0; i < JOBS.length; i++) {
  const job = JOBS[i];
  process.stdout.write(`\r[${i + 1}/${JOBS.length}] ${job.label} ...`);
  const r = await generateOne(job);
  if (r.ok && r.skipped) skip++;
  else if (r.ok) ok++;
  else fail++;

  // 每张保存进度
  writeFileSync(CACHE_FILE, JSON.stringify(progress, null, 2));

  // 间隔 4 秒避免 rate limit
  if (i < JOBS.length - 1) {
    await new Promise(r => setTimeout(r, 4000));
  }
}

const totalMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
console.log(`\n\n✅ 完成: ok=${ok} skip=${skip} fail=${fail} | 用时 ${totalMin}min`);
console.log(`\n--- URL 映射 (复制到组件) ---`);
for (const job of JOBS) {
  const url = progress[job.id];
  console.log(`${job.id}: ${url || "(failed)"}`);
}
console.log(`\n进度已保存到 ${CACHE_FILE}`);
