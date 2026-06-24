// scripts/expand-relations-v2.mjs
// 扩充文章的 related_people / related_books / related_events / related_poems / related_articles
// 从现有 1-2 个扩展到 4-6 个，跨文章互联
// 与 enrich-knowledge-v3.mjs 字段不冲突，可独立运行

import fs from "node:fs";
import path from "node:path";

// === 加载 .env ===
const ENV_PATH = path.resolve(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  const envContent = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BAILIAN_KEY = process.env.BAILIAN_API_KEY;
const BAILIAN_BASE = process.env.BAILIAN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";

if (!SUPABASE_URL || !SERVICE_KEY || !BAILIAN_KEY) {
  console.error("Missing env");
  process.exit(1);
}

const SB_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function callLLM(prompt) {
  const res = await fetch(`${BAILIAN_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BAILIAN_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen-turbo",
      messages: [
        { role: "system", content: "你是中国传统文化知识图谱构建专家，擅长准确列出文献/人物/事件/诗词之间的关联。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function extractJSON(raw) {
  // 兼容 ```json ... ``` 包裹
  const m = raw.match(/\[[\s\S]*?\]/);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)) return null;
    return arr;
  } catch {
    return null;
  }
}

function mergeUnique(existing, incoming) {
  const result = Array.isArray(existing) ? [...existing] : [];
  const seen = new Set(result.map(x => `${x.type || ""}:${x.title}`));
  for (const item of incoming) {
    if (!item || !item.title) continue;
    const key = `${item.type || ""}:${item.title}`;
    if (seen.has(key)) continue;
    result.push({
      type: item.type || "other",
      title: String(item.title).trim(),
      relation: String(item.relation || "").trim(),
    });
    seen.add(key);
  }
  return result;
}

// === 5 类关系字段 ===
const RELATION_FIELDS = [
  {
    key: "related_people",
    type: "people",
    label: "人物",
    shouldExpand: (a) => !Array.isArray(a.related_people) || a.related_people.length < 4,
    prompt: (a) => `为「${a.title}」（${a.category}）列出 4-6 位相关人物。

要求覆盖多种关系：
- 师从/弟子（学术传承）
- 朋友/唱和（如李白-杜甫）
- 论敌/批评
- 直接影响 / 受其影响
- 共同经历（同一时代/事件/地点）

**严格 JSON 数组**（不要 markdown 包裹）：
[
  {"title": "人物名", "relation": "关系描述（10字以内）", "type": "people"},
  ...
]

人物必须真实存在于中国传统文化史。`,
  },
  {
    key: "related_books",
    type: "book",
    label: "典籍",
    shouldExpand: (a) => !Array.isArray(a.related_books) || a.related_books.length < 3,
    prompt: (a) => `为「${a.title}」（${a.category}）列出 3-5 部相关典籍/著作。

**严格 JSON 数组**：
[
  {"title": "典籍名", "relation": "关系（10字以内）", "type": "book"},
  ...
]

关系示例：引用、化用、注释、评论、收录、影响`,
  },
  {
    key: "related_events",
    type: "event",
    label: "事件",
    shouldExpand: (a) => !Array.isArray(a.related_events) || a.related_events.length < 3,
    prompt: (a) => `为「${a.title}」（${a.category}）列出 3-5 个相关历史事件。

**严格 JSON 数组**：
[
  {"title": "事件名", "relation": "关系（10字以内）", "type": "event"},
  ...
]`,
  },
  {
    key: "related_poems",
    type: "poem",
    label: "诗词",
    shouldExpand: (a) => !Array.isArray(a.related_poems) || a.related_poems.length < 3,
    prompt: (a) => `为「${a.title}」（${a.category}）列出 3-5 首相关诗词（包含作者）。

格式：${a.category === "诗词" ? "（可以是同一作者的其他作品，或主题相关的）" : "（描写同一题材/化用/主题相关的）"}

**严格 JSON 数组**：
[
  {"title": "《诗词名》", "relation": "关系（10字以内）", "type": "poem"},
  ...
]`,
  },
  {
    key: "related_articles",
    type: "article",
    label: "文章",
    shouldExpand: (a) => !Array.isArray(a.related_articles) || a.related_articles.length < 3,
    prompt: (a) => `为「${a.title}」（${a.category}）列出 3-5 篇相关古文/名篇（如《岳阳楼记》《醉翁亭记》《陋室铭》等）。

**严格 JSON 数组**：
[
  {"title": "《文章名》", "relation": "关系（10字以内）", "type": "article"},
  ...]`,
  },
];

// === 进度 ===
const PROGRESS_FILE = path.resolve(process.cwd(), "scripts", "expand-relations-progress.json");
let progress = {};
try { progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8")); } catch {}
function saveProgress() {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function sbSelect(q) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`SB ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbUpdate(id, patch) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/knowledge_articles?id=eq.${encodeURIComponent(id)}`,
    { method: "PATCH", headers: SB_HEADERS, body: JSON.stringify(patch) }
  );
  if (!res.ok) throw new Error(`SB update ${res.status}: ${await res.text()}`);
}

async function main() {
  console.log(`[expand-relations-v2] 开始 ...`);

  const articles = await sbSelect(
    "knowledge_articles?select=id,title,category,related_people,related_books,related_events,related_poems,related_articles&order=view_count.desc&limit=500"
  );
  console.log(`  Total: ${articles.length}`);

  const toExpand = articles.filter((a) =>
    RELATION_FIELDS.some((f) => f.shouldExpand(a))
  );
  console.log(`  To expand: ${toExpand.length}`);

  if (toExpand.length === 0) {
    console.log("  ✓ 已完整，结束。");
    return;
  }

  let ok = 0, fail = 0, relationsAdded = 0;
  const startTime = Date.now();

  for (let i = 0; i < toExpand.length; i++) {
    const a = toExpand[i];
    const update = {};
    const progKey = (k) => `${a.id}:${k}`;

    for (const f of RELATION_FIELDS) {
      if (!f.shouldExpand(a)) continue;
      if (progress[progKey(f.key)]) continue;

      try {
        console.log(`  [${i + 1}/${toExpand.length}] ${a.title.slice(0, 20)} → ${f.label}`);
        const raw = await callLLM(f.prompt(a));
        const incoming = extractJSON(raw);
        if (!incoming || incoming.length === 0) {
          throw new Error("parse failed");
        }

        const merged = mergeUnique(a[f.key], incoming);
        const added = merged.length - (Array.isArray(a[f.key]) ? a[f.key].length : 0);
        if (added > 0) {
          update[f.key] = merged;
          relationsAdded += added;
        }
        progress[progKey(f.key)] = Date.now();
        await new Promise((r) => setTimeout(r, 600));
      } catch (e) {
        console.error(`    FAIL ${f.key}: ${e.message.slice(0, 100)}`);
        fail++;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    if (Object.keys(update).length > 0) {
      try {
        await sbUpdate(a.id, update);
        ok++;
        console.log(`    ✓ ${Object.keys(update).join(",")} (${Object.values(update).reduce((s, arr) => s + arr.length, 0)} 条关联)`);
      } catch (e) {
        console.error(`    DB FAIL: ${e.message.slice(0, 100)}`);
        fail++;
        for (const k of Object.keys(update)) {
          delete progress[progKey(k)];
        }
      }
      saveProgress();
    }

    const elapsed = (Date.now() - startTime) / 60000;
    const eta = (elapsed / (i + 1)) * (toExpand.length - i - 1);
    if ((i + 1) % 5 === 0) {
      console.log(
        `  [${i + 1}/${toExpand.length}] ok=${ok} relations=${relationsAdded} fail=${fail} | ${elapsed.toFixed(1)}min | ETA ${eta.toFixed(0)}min`
      );
    }
  }

  console.log(`\n✓ Done. ok=${ok} relations_added=${relationsAdded} fail=${fail}`);
  console.log(`  Time: ${((Date.now() - startTime) / 60000).toFixed(1)} min`);
}

main().catch((e) => {
  console.error("[fatal]", e);
  process.exit(1);
});
