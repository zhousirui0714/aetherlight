/**
 * expand-query.mjs — 用 synonyms-dict 扩展用户搜索词
 * 用法:
 *   node expand-query.mjs "李白"           # 输出扩展词列表
 *   node expand-query.mjs "诗人"           # 输出重定向列表
 *   node expand-query.mjs "李太白"         # 自动识别 → 太白/诗仙
 *   echo "红楼梦" | node expand-query.mjs # 读 stdin
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dict = JSON.parse(readFileSync(join(import.meta.dirname, "synonyms-dict.json"), "utf-8"));

// 反向索引: 词 -> 同义词组
const reverse = new Map();
for (const group of dict.synonyms) {
  for (const word of group) {
    if (!reverse.has(word)) reverse.set(word, []);
    reverse.get(word).push(...group.filter((w) => w !== word));
  }
}

let input = process.argv.slice(2).join(" ").trim();
if (!input) {
  // try stdin
  try {
    input = readFileSync(0, "utf-8").trim();
  } catch {}
}
if (!input) {
  console.log("用法: node expand-query.mjs <keyword>");
  process.exit(1);
}

console.log(`输入: ${input}`);

// 1) 同义词扩展
const expanded = new Set([input]);
if (reverse.has(input)) {
  for (const w of reverse.get(input)) expanded.add(w);
}

// 2) 重定向扩展
if (dict.redirects[input]) {
  for (const w of dict.redirects[input]) expanded.add(w);
}

if (expanded.size === 1) {
  console.log(`❌ 未找到同义词/重定向, 建议人工补全`);
  process.exit(0);
}

console.log(`扩展 (${expanded.size} 词):`);
for (const w of expanded) console.log(`  - ${w}`);

// 3) 构造 OR 查询字符串 (PostgREST format)
const orQuery = [...expanded].map((w) => `title.ilike.*${w}*`).join(",");
console.log(`\nPostgREST OR query:`);
console.log(`  ?or=(${orQuery})`);
