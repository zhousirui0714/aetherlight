/**
 * 重复 title 修复: 把 90 组重复 title 的文章, 用 LLM 重新生成唯一 title
 * 策略: 取 category / body / id 上下文, 让 LLM 给出"词牌名 · 作者"或"主题 · 分类"格式
 * 例: "吴文英" → "唐多令 · 吴文英 (一) / (二) / ..."
 */
import { readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = (() => {
  const env = {};
  for (const l of readFileSync(join(ROOT, ".env"), "utf-8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !l.startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
})();
const H = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};
const URL = ENV.SUPABASE_URL;
const BAILIAN_KEY = ENV.BAILIAN_API_KEY;
const BAILIAN_URL = ENV.BAILIAN_BASE_URL;
const MODEL = ENV.BAILIAN_MODEL || "qwen-plus";

const PROGRESS = join(ROOT, "scripts", "title-dedup.log");
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  process.stdout.write(line + "\n");
  appendFileSync(PROGRESS, line + "\n");
};

async function callLLM(items) {
  const ctx = items.map((it, i) => `[${i + 1}] id=${it.id} cat=${it.category} body首段="${(it.body || "").slice(0, 150)}"`).join("\n");
  const prompt = `这些文章标题都是 "${items[0].title}", 但实际是不同内容。请给每篇生成**唯一且简短**的标题 (<= 15 字), 让用户能区分。

输入:
${ctx}

要求:
- 优先使用词牌名 / 节选名 / 序号 (如 "一" "二" "三")
- 必要时加 " · " + 朝代/作者/类别
- 不要用 ID 区分
- 输出严格 JSON, 无 markdown

{
  "titles": [
    { "id": "原id", "new_title": "新标题" }
  ]
}`;
  const r = await fetch(`${BAILIAN_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${BAILIAN_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1000,
    }),
  });
  if (!r.ok) throw new Error(`LLM ${r.status}`);
  const d = await r.json();
  const text = d.choices?.[0]?.message?.content || "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function main() {
  log("🔧 重复 title 修复 worker 启动");

  // 1) 加载所有 title, 找重复组
  const titleMap = new Map();
  let offset = 0;
  while (true) {
    const r = await fetch(`${URL}/rest/v1/knowledge_articles?select=id,title,category,body&limit=500&offset=${offset}`, { headers: H });
    if (!r.ok) break;
    const d = await r.json();
    for (const a of d) {
      const t = (a.title || "").trim();
      if (!t) continue;
      if (!titleMap.has(t)) titleMap.set(t, []);
      titleMap.get(t).push(a);
    }
    if (d.length < 500) break;
    offset += 500;
  }
  const dups = [...titleMap.entries()].filter(([_, arr]) => arr.length > 1);
  log(`📋 找到 ${dups.length} 组重复 title`);

  let fixedGroups = 0, fixedItems = 0;
  for (const [title, items] of dups) {
    if (items.length < 2) continue;
    try {
      const parsed = await callLLM(items);
      if (!parsed?.titles) continue;
      let ok = 0;
      for (const nt of parsed.titles) {
        if (!nt.id || !nt.new_title || nt.new_title === title) continue;
        const pr = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${nt.id}`, {
          method: "PATCH",
          headers: H,
          body: JSON.stringify({ title: nt.new_title }),
        });
        if (pr.ok) ok++;
      }
      if (ok > 0) {
        fixedGroups++;
        fixedItems += ok;
        log(`✅ "${title}" (×${items.length}) → ${ok} 个新 title`);
      } else {
        log(`⏭️  "${title}" 无变化`);
      }
    } catch (e) {
      log(`💥 "${title}" 失败: ${String(e).slice(0, 100)}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  log(`🎉 完成: 修复 ${fixedGroups} 组 / ${fixedItems} 个 title`);
}

main().catch((e) => { console.error("💥", e); process.exit(1); });
