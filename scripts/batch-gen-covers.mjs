// 批量生成水墨风 AI 插图（强化 no text）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "ai-covers");
fs.mkdirSync(OUT_DIR, { recursive: true });

// 统一水墨风 + 严格无文字
const STYLE = `Traditional Chinese ink wash painting (shuimo), sumi-e brush technique, wet ink wash gradients with 5-7 shades of gray ink only, generous negative space (60% blank rice paper), no outlines, no color except one small vermillion red seal stamp at corner. STRICTLY NO TEXT, NO CHARACTERS, NO LETTERS, NO WRITING, NO CALLIGRAPHY, NO INSCRIPTIONS anywhere in the image. Empty blank surfaces only. No modern elements, no frame, no border, no watermark, no signature, no captions, no labels, no titles, no annotations. Aspect ratio 4:3, museum quality, ultra high detail, masterpiece.`;

// 10 大分类 × 3 张 = 30 张
const SUBJECTS = [
  // figures 人物
  { cat: "figures", slug: "poet-pine", scene: "An ancient Chinese poet in flowing Han Dynasty robes sitting under a pine tree on a mountain cliff, gazing at distant misty valleys" },
  { cat: "figures", slug: "philosopher-standing", scene: "An ancient Chinese philosopher standing in ceremonial Han Dynasty robes in a bamboo grove, hands clasped, contemplative pose" },
  { cat: "figures", slug: "general-horseback", scene: "An ancient Chinese general on horseback silhouetted against an ink-wash sunset, war banner flowing" },

  // poems 诗词
  { cat: "poems", slug: "moonlit-drinking", scene: "A small figure of a Tang Dynasty poet sitting alone on a riverbank under a luminous full moon, wine cup in hand, vast empty sky" },
  { cat: "poems", slug: "lone-fisherman", scene: "A tiny lone fishing boat with a straw-hat fisherman on a vast misty river, distant snow-covered mountains, melancholic autumn atmosphere" },
  { cat: "poems", slug: "ancient-road", scene: "An ancient Chinese post road winding through misty autumn mountains, a small thatched pavilion by a gnarled tree, no figures" },

  // classics 典籍
  { cat: "classics", slug: "bamboo-scrolls", scene: "Several ancient bamboo scrolls partially unrolled on a wooden table, blank surface visible, with a bronze ink stone and brush" },
  { cat: "classics", slug: "stone-tablet", scene: "An ancient Chinese stone stele standing in a misty courtyard, blank weathered surface surrounded by moss" },
  { cat: "classics", slug: "scholar-desk", scene: "An ancient Chinese scholar's desk with an ink stone, blank paper sheets, a small bronze incense burner, and a single branch of plum blossom" },

  // festivals 节日
  { cat: "festivals", slug: "lantern-night", scene: "Glowing red paper lanterns hanging in a misty ancient Chinese street at night, soft warm light through fog" },
  { cat: "festivals", slug: "dragon-boat", scene: "A traditional Chinese dragon boat on a misty river, viewed from a distance, dragon head silhouette at the bow" },
  { cat: "festivals", slug: "mid-autumn-moon", scene: "A luminous full moon over an ancient Chinese pavilion on a hill, surrounded by osmanthus trees, misty autumn atmosphere" },

  // mythology 神话
  { cat: "mythology", slug: "change-flying", scene: "A celestial woman in flowing Hanfu robes flying toward a luminous full moon, leaving a trail of misty clouds, ethereal" },
  { cat: "mythology", slug: "pangu-creation", scene: "A giant primordial figure holding up misty mountain peaks against a swirling cosmic sky, ink-wash style, no detail in face" },
  { cat: "mythology", slug: "nezha-waves", scene: "A small figure of a child warrior standing on cosmic wheels above churning waves, a silk ribbon flowing, ink-wash mythological" },

  // intangible 非遗
  { cat: "intangible", slug: "peking-opera-mask", scene: "A single traditional Chinese opera mask with bold red and black paint patterns, isolated on a misty ink-wash background" },
  { cat: "intangible", slug: "tea-ceremony", scene: "An ancient Chinese tea ceremony scene with a small clay teapot, two tiny cups, a bamboo whisk, on a wooden tray, misty morning" },
  { cat: "intangible", slug: "shadow-puppet", scene: "A single traditional Chinese shadow puppet figure made of translucent leather, held up against a glowing paper screen" },

  // artifacts 建筑器物
  { cat: "artifacts", slug: "bronze-ding", scene: "A single ancient Chinese bronze ritual vessel (ding) with two handles, isolated on a misty plain, weathered patina" },
  { cat: "artifacts", slug: "forbidden-city-wall", scene: "A towering red wall and golden roof corner of an ancient Chinese palace, viewed from below, misty dawn atmosphere" },
  { cat: "artifacts", slug: "dunhuang-cave", scene: "The interior of an ancient Chinese Buddhist cave temple with a single painted flying apsara on the curved ceiling, soft candlelight" },

  // lifestyle 饮食服饰
  { cat: "lifestyle", slug: "teapot-cups", scene: "A small purple clay teapot and two empty tea cups on a wooden tray, with a single plum branch, soft morning mist" },
  { cat: "lifestyle", slug: "hanfu-detail", scene: "A close-up of flowing Han Dynasty silk robes hanging from a wooden rack, with subtle embroidery patterns, morning light" },
  { cat: "lifestyle", slug: "guqin-table", scene: "An ancient Chinese seven-string guqin lying on a wooden table, with a small incense burner and a single orchid sprig" },

  // philosophy 思想
  { cat: "philosophy", slug: "taiji-stones", scene: "A traditional Yin-Yang taiji pattern formed by black and white pebbles on a mossy rock, surrounded by misty bamboo" },
  { cat: "philosophy", slug: "lotus-meditation", scene: "A single pink lotus flower blooming in a misty pond, viewed from a low angle, soft dawn light, no figures" },
  { cat: "philosophy", slug: "go-board", scene: "A wooden Go board with scattered black and white stones mid-game, viewed from above, with a single chrysanthemum bloom beside it" },

  // technology 科技
  { cat: "technology", slug: "armillary-sphere", scene: "An ancient Chinese bronze armillary sphere on a wooden stand, isolated against a misty starry sky background" },
  { cat: "technology", slug: "papermaking", scene: "An ancient Chinese papermaking workshop with wooden frames and sheets of wet paper hanging to dry, soft misty light" },
  { cat: "technology", slug: "compass-vela", scene: "An ancient Chinese magnetic compass on a wooden ship deck, viewed from above, with misty ocean in background" },
];

async function generate(item, idx) {
  const prompt = `A ${STYLE} Specifically: ${item.scene}.`;
  const seed = 1000 + idx * 17;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&seed=${seed}&nologo=true&model=flux`;
  const filename = `${item.cat}_${item.slug}_s${seed}.jpg`;
  const outPath = path.join(OUT_DIR, filename);

  // 3 次重试 + 指数退避
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buffer);
      const size = buffer.length;
      console.log(`[${idx + 1}/${SUBJECTS.length}] OK ${filename} (${(size / 1024).toFixed(0)}KB)${attempt > 1 ? ` (重试 ${attempt})` : ""}`);
      return { ok: true, filename, size };
    } catch (e) {
      const wait = attempt * 8000;
      if (attempt < 3) {
        console.log(`[${idx + 1}/${SUBJECTS.length}] RETRY ${attempt}/3 ${filename}: ${e.message} (等待 ${wait / 1000}s)`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        console.log(`[${idx + 1}/${SUBJECTS.length}] FAIL ${filename}: ${e.message}`);
        return { ok: false, error: e.message };
      }
    }
  }
}

async function main() {
  console.log(`=== 批量生成 ${SUBJECTS.length} 张水墨风插图 (单张串行 + 重试) ===\n`);
  const results = [];
  for (let i = 0; i < SUBJECTS.length; i++) {
    const r = await generate(SUBJECTS[i], i);
    results.push(r);
    // 每张后等待 4 秒避免 rate limit
    if (i < SUBJECTS.length - 1) {
      await new Promise(r => setTimeout(r, 4000));
    }
  }
  const ok = results.filter(r => r.ok).length;
  const totalKb = results.filter(r => r.ok).reduce((s, r) => s + r.size, 0) / 1024;
  console.log(`\n=== 完成: ${ok}/${SUBJECTS.length} 成功 (${totalKb.toFixed(0)}KB) ===`);
}

main();
