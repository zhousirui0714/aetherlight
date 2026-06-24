/**
 * 知识长廊 AI 插图试点 (C 阶段)
 * ─────────────────────────────────────────────────────────
 * 从 backend/data/knowledge_articles_v3.json 选 30/45 条 article
 * 调 pollinations.ai 生成国风插图
 * 保存到 scripts/output/cover-{category}-{id}.jpg
 * 输出 scripts/output/report.json
 *
 * 不写 Supabase (等人工 review 后再决定)
 *
 * 运行: npx tsx scripts/generate-cover-batch.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SEED_FILE = join(ROOT, "backend/data/knowledge_articles_v3.json");
const OUTPUT_DIR = join(ROOT, "scripts/output");
const REPORT_FILE = join(OUTPUT_DIR, "report.json");

const PER_CATEGORY = 3;
// v2 试点: 只跑 artifacts + intangible (figures 保留 v1)
const CATEGORIES = ["artifacts", "intangible"] as const;
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";
const WIDTH = 1024;
const HEIGHT = 576;
const TIMEOUT_MS = 60000;
const DELAY_BETWEEN_MS = 12000;     // 12s 防 rate limit
const MAX_RETRIES = 3;              // 3 次重试
const RETRY_BASE_MS = 5000;         // 5s 起步 backoff

// ──────────────────────────────────────────────────────
// 3 套 prompt 模板 (按 category 选)
// ──────────────────────────────────────────────────────
function promptForFigures(a: any): string {
  const dynasty = a.dynasty || "ancient China";
  const tags = (a.tags || []).join(", ");
  return [
    `Ancient Chinese ${a.title}`,
    "portrait, head and shoulders",
    "traditional Chinese clothing (Hanfu or dynasty-appropriate)",
    `${dynasty} dynasty style`,
    "Chinese gongbi (meticulous brush) painting technique",
    "vibrant traditional colors, fine line work",
    "blank background or subtle ink wash",
    "no text, no watermark",
    `cultural context: ${tags}`,
  ].join(", ");
}

function promptForArtifacts(a: any): string {
  // v2 改写: 从水墨抽象 → 工笔重彩 + 具象建筑结构
  // v1 失败: "fine line drawing with subtle watercolor wash" → 输出太抽象不像建筑
  const dynasty = a.dynasty || "ancient China";
  return [
    `Ancient Chinese ${a.title}`,
    "Chinese realistic architectural painting",
    `${dynasty} dynasty style building`,
    "gongbi (meticulous brush) with rich traditional colors",
    "clear recognizable building structure, full facade visible",
    "golden glazed roof tiles, red wooden pillars, white stone walls",
    "elevated frontal perspective, centered composition",
    "no people in foreground, no text, no watermark",
    "background of blue sky and traditional Chinese cloud patterns",
  ].join(", ");
}

function promptForIntangible(a: any): string {
  // v2 改写: 从装饰纹样 → 实物/表演场景
  // v1 失败: "decorative pattern, symmetrical" → 只生成一块布/一个抽象图案
  const tags = (a.tags || []).join(", ");
  return [
    `Ancient Chinese ${a.title}`,
    "realistic cultural scene illustration",
    `traditional Chinese ${a.title} artifact or performance scene`,
    "vibrant traditional Chinese colors",
    "centered composition, single subject focus",
    "no text, no watermark, no people in extreme close-up",
    `cultural context: ${tags}`,
  ].join(", ");
}

const PROMPT_BUILDERS: Record<string, (a: any) => string> = {
  figures: promptForFigures,
  artifacts: promptForArtifacts,
  intangible: promptForIntangible,
};

// ──────────────────────────────────────────────────────
// 选 articles (按 sort_weight 降序, 优先 emoji cover, 不要空)
// ──────────────────────────────────────────────────────
function pickArticles(articles: any[], category: string, count: number): any[] {
  return articles
    .filter((a) => a.category === category)
    .filter((a) => a.cover && !a.cover.startsWith("http")) // emoji
    .sort((a, b) => (b.sort_weight || 0) - (a.sort_weight || 0))
    .slice(0, count);
}

// ──────────────────────────────────────────────────────
// 调 pollinations + 保存
// ──────────────────────────────────────────────────────
async function generateOne(article: any, category: string): Promise<{
  ok: boolean;
  path?: string;
  url: string;
  prompt: string;
  bytes?: number;
  ms?: number;
  error?: string;
  retries?: number;
}> {
  const builder = PROMPT_BUILDERS[category];
  if (!builder) return { ok: false, url: "", prompt: "", error: "no builder" };

  const prompt = builder(article);
  const fullPrompt = `${prompt}, Chinese traditional culture, classical art style`;

  const seed = stableHash(`${article.id}|${category}`);

  const encoded = encodeURIComponent(fullPrompt);
  const url =
    `${POLLINATIONS_BASE}/${encoded}` +
    `?width=${WIDTH}&height=${HEIGHT}&seed=${seed}&nologo=true&private=true`;

  const filePath = join(OUTPUT_DIR, `cover-${category}-${article.id}.jpg`);

  const start = Date.now();
  let lastError = "";
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "User-Agent": "Aetherlight-Batch/1.0" },
      });

      if (res.status === 429) {
        const wait = RETRY_BASE_MS * Math.pow(2, attempt);
        console.log(`  ⏳ 429 rate limited, 重试 ${attempt + 1}/${MAX_RETRIES} (等 ${wait / 1000}s)`);
        await sleep(wait);
        lastError = `HTTP 429 (retry ${attempt + 1})`;
        continue;
      }
      if (!res.ok) {
        return { ok: false, url, prompt, error: `HTTP ${res.status}` };
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.startsWith("image/")) {
        return { ok: false, url, prompt, error: `content-type=${ct}` };
      }

      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);
      writeFileSync(filePath, buf);

      return {
        ok: true,
        path: filePath,
        url,
        prompt,
        bytes: buf.byteLength,
        ms: Date.now() - start,
        retries: attempt,
      };
    } catch (err) {
      lastError = String(err).slice(0, 100);
      const wait = RETRY_BASE_MS * Math.pow(2, attempt);
      if (attempt < MAX_RETRIES - 1) {
        console.log(`  ⏳ ${lastError}, 重试 ${attempt + 1}/${MAX_RETRIES} (等 ${wait / 1000}s)`);
        await sleep(wait);
      }
    }
  }
  return { ok: false, url, prompt, error: lastError || "exhausted retries", retries: MAX_RETRIES };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// FNV-1a 32-bit
function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h | 0);
}

// ──────────────────────────────────────────────────────
// 主流程
// ──────────────────────────────────────────────────────
async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const articles: any[] = JSON.parse(readFileSync(SEED_FILE, "utf-8"));
  console.log(`📚 加载 ${articles.length} 条 article`);

  const picked: { article: any; category: string }[] = [];
  for (const cat of CATEGORIES) {
    const builder = PROMPT_BUILDERS[cat];
    if (!builder) continue;
    const list = pickArticles(articles, cat, PER_CATEGORY);
    for (const a of list) picked.push({ article: a, category: cat });
  }
  console.log(`🎯 选中 ${picked.length} 条 (${CATEGORIES.join("+")} × ${PER_CATEGORY})`);

  const results: any[] = [];
  let okCount = 0;
  let totalMs = 0;

  for (let i = 0; i < picked.length; i++) {
    const { article, category } = picked[i];
    process.stdout.write(`  [${i + 1}/${picked.length}] ${category}/${article.id} (${article.title}) ... `);
    const r = await generateOne(article, category);
    totalMs += r.ms || 0;
    if (r.ok) {
      okCount++;
      process.stdout.write(`✓ ${(r.bytes! / 1024).toFixed(1)}KB ${r.ms}ms (重试 ${r.retries || 0} 次)\n`);
    } else {
      process.stdout.write(`✗ ${r.error}\n`);
    }
    results.push({
      id: article.id,
      title: article.title,
      category,
      sub_category: article.sub_category,
      dynasty: article.dynasty,
      ok: r.ok,
      path: r.path ? r.path.replace(ROOT + "\\", "").replace(/\\/g, "/") : undefined,
      url: r.url,
      prompt: r.prompt,
      bytes: r.bytes,
      ms: r.ms,
      retries: r.retries,
      error: r.error,
    });
    if (i < picked.length - 1) await sleep(DELAY_BETWEEN_MS);
  }

  // 写 report
  const summary = {
    total: picked.length,
    ok: okCount,
    failed: picked.length - okCount,
    avgMs: Math.round(totalMs / picked.length),
    timestamp: new Date().toISOString(),
    results,
  };
  writeFileSync(REPORT_FILE, JSON.stringify(summary, null, 2));
  console.log(`\n📊 汇总: 成功 ${okCount}/${picked.length}, 平均 ${summary.avgMs}ms/张`);
  console.log(`📄 报告: ${REPORT_FILE}`);
  console.log(`🖼️  图片: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("❌ 失败:", err);
  process.exit(1);
});
