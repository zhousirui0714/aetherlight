// Read-only report on the article-cover worker fleet. Does NOT call any
// external API. Run: node scripts/cover-progress-report.mjs
//
// Compares four sources of truth to tell you what's really done vs.
// what's just been "claimed" in a progress file:
//
//   1. scripts/covers-progress-w1.json   (W1: heat-ranked 0..950, by view_count desc)
//   2. scripts/covers-progress-w2.json   (W2: heat-ranked 951.., by view_count desc)
//   3. scripts/home-covers-progress.json (home-illustration worker — separate track)
//   4. public/ai-covers/ on disk         (what Vercel actually serves)
//
// Surfaces:
//   - W1/W2/home record counts and overlap (where they wasted API quota)
//   - "claimed but missing on disk"      (worker died mid-write, or local file got deleted)
//   - "on disk but unclaimed"            (someone hand-added, or progress file reset)
//   - "audit-cover.csv still says missing" stale list (workers covered it but audit wasn't re-run)
//
// Does NOT touch Supabase. To recheck DB-truth, run scripts/cover-audit.mjs.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const SCRIPTS = join(ROOT, "scripts");
const COVERS_DIR = join(ROOT, "public/ai-covers");
const HOME_DIR = join(ROOT, "public/home-illustrations");

const SOURCES = {
  w1: join(SCRIPTS, "covers-progress-w1.json"),
  w2: join(SCRIPTS, "covers-progress-w2.json"),
  home: join(SCRIPTS, "home-covers-progress.json"),
};

function loadProgress(p) {
  if (!existsSync(p)) return new Map();
  const data = JSON.parse(readFileSync(p, "utf-8"));
  // value is the URL (string); key is the article id
  return new Map(Object.entries(data));
}

function diskFileIds(dir) {
  if (!existsSync(dir)) return new Set();
  // filename pattern is article_<slugified-id>.jpg OR editorial-<slug>.jpg etc.
  // for the article workers we only care about the article_<id>.jpg set.
  const ids = new Set();
  for (const f of readdirSync(dir)) {
    if (f.startsWith("article_") && f.endsWith(".jpg")) {
      ids.add(f.slice("article_".length, -".jpg".length));
    }
  }
  return ids;
}

function diskFileCount(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).length;
}

function fmtTime(p) {
  if (!existsSync(p)) return "(missing)";
  return statSync(p).mtime.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function intersection(setA, setB) {
  const out = new Set();
  for (const v of setA) if (setB.has(v)) out.add(v);
  return out;
}

function diff(a, b) {
  const out = new Set();
  for (const v of a) if (!b.has(v)) out.add(v);
  return out;
}

const w1 = loadProgress(SOURCES.w1);
const w2 = loadProgress(SOURCES.w2);
const home = loadProgress(SOURCES.home);

const diskArticle = diskFileIds(COVERS_DIR);
const diskHome = new Set(
  existsSync(HOME_DIR) ? readdirSync(HOME_DIR) : [],
);

const unionArticle = new Set([...w1.keys(), ...w2.keys()]);
const w1w2Overlap = intersection(w1, w2);

const claimedButMissing = diff(unionArticle, diskArticle);
const diskButUnclaimed = diff(diskArticle, unionArticle);

console.log("┌─ 源文件 mtime ────────────────────────────────────────────────────────");
for (const [name, p] of Object.entries(SOURCES)) {
  console.log(`  ${name.padEnd(5)} ${fmtTime(p)}  (${p})`);
}
console.log("└──────────────────────────────────────────────────────────────────────");
console.log("");

console.log("┌─ Progress 文件汇报数 ───────────────────────────────────────────────");
console.log(`  W1                : ${w1.size} 篇 (代码里 END=950 写死的上限)`);
console.log(`  W2                : ${w2.size} 篇 (从 951 开始)`);
console.log(`  W1 ∩ W2 重叠      : ${w1w2Overlap.size} 篇 (两个 worker 重复跑同一 ID,纯浪费 API 配额)`);
console.log(`  W1 ∪ W2 去重总    : ${unionArticle.size} 篇`);
console.log(`  home illustrations: ${home.size} 篇 (独立 track)`);
console.log("└──────────────────────────────────────────────────────────────────────");
console.log("");

console.log("┌─ 实际磁盘文件 ──────────────────────────────────────────────────────");
console.log(`  public/ai-covers/article_*.jpg      : ${diskArticle.size} 张`);
console.log(`  public/ai-covers/ 全部 (含非 article_): ${diskFileCount(COVERS_DIR)} 个文件`);
console.log(`  public/home-illustrations/           : ${diskHome.size} 个文件`);
console.log("└──────────────────────────────────────────────────────────────────────");
console.log("");

console.log("┌─ 关键差异 ──────────────────────────────────────────────────────────");
console.log(`  progress 记录但本地缺文件: ${claimedButMissing.size} 篇`);
console.log(`    → 进程被杀、git reset、或 .gitignore 删了 progress 里的老文件`);
if (claimedButMissing.size > 0) {
  const sample = [...claimedButMissing].slice(0, 8);
  console.log(`    例子: ${sample.join(", ")}`);
}
console.log("");
console.log(`  本地有文件但 progress 未记: ${diskButUnclaimed.size} 张`);
console.log(`    → 有人手工加的,或更老 worker 写的(比如原始 gen-article-covers.mjs)`);
if (diskButUnclaimed.size > 0) {
  const sample = [...diskButUnclaimed].slice(0, 8);
  console.log(`    例子: ${sample.join(", ")}`);
}
console.log("└──────────────────────────────────────────────────────────────────────");
console.log("");

// audit-cover.csv 落后度
// CSV 实际是 10 列(用 `awk -F','` 数 NF=10),header 10 列,最后一列就是 action。
// 之前写 cols.length < 11 把所有行都过滤掉了,所以才要修。
const auditCsv = join(SCRIPTS, "audit-cover.csv");
if (existsSync(auditCsv)) {
  const lines = readFileSync(auditCsv, "utf-8").split("\n").slice(1).filter(Boolean);
  const needGen = lines.filter((l) => {
    const cols = l.split(",");
    if (cols.length < 10) return false;
    const status = cols[3];
    const action = cols[cols.length - 1] || "";
    return status && status.includes("缺封面") && action.includes("w1/w2");
  });
  const staleClaim = needGen.filter((l) => {
    const id = l.split(",")[0];
    return unionArticle.has(id);
  });
  const actuallyMissing = needGen.filter((l) => {
    const id = l.split(",")[0];
    return !unionArticle.has(id) && !diskArticle.has(id);
  });
  console.log("┌─ audit-cover.csv 落后度 ─────────────────────────────────────────────");
  console.log(`  audit 标 "需 w1/w2 生成" 总数     : ${needGen.length} 篇`);
  console.log(`  其中 W1/W2 已覆盖 (audit 过时)    : ${staleClaim.length} 篇`);
  console.log(`  仍真实缺封面 (audit 准)            : ${actuallyMissing.length} 篇`);
  if (actuallyMissing.length > 0) {
    console.log(`    例子: ${actuallyMissing.slice(0, 5).map((l) => l.split(",")[0]).join(", ")}`);
  }
  console.log("  → 想得到 ground truth 请重跑: node scripts/cover-audit.mjs");
  console.log("└──────────────────────────────────────────────────────────────────────");
  console.log("");
}

// 总结
console.log("┌─ 总结 ──────────────────────────────────────────────────────────────");
const fileCount = diskArticle.size;
const claimedCount = unionArticle.size;
const coveredGap = Math.max(0, claimedCount - fileCount);
console.log(`  工人"汇报完成": ${claimedCount}`);
console.log(`  实际磁盘文件:   ${fileCount}`);
console.log(`  缺口 (汇报了但缺文件): ${coveredGap} 篇 ← 这是要补的"假完成"`);
console.log(`  进程当前是否在跑:`);
console.log(`    ps -ef | grep gen-article-covers`);
console.log(`    (空输出 = 没在跑,W1/W2 都停了)`);
console.log("└──────────────────────────────────────────────────────────────────────");
