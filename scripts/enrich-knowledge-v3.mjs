// scripts/enrich-knowledge-v3.mjs
// 批量为 knowledge_articles 补全 body_extended / influence / faq 三个字段
// 用 Supabase REST API + 阿里百炼 LLM（OpenAI 兼容）
// 零依赖，Node 18+ 即可

import fs from "node:fs";
import path from "node:path";

// === 加载 .env（手动解析，不用 dotenv 包）===
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
  console.error("Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / BAILIAN_API_KEY");
  process.exit(1);
}

const SB_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

// === LLM 调用 ===
async function callLLM(prompt, model = "qwen-turbo") {
  const res = await fetch(`${BAILIAN_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BAILIAN_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "你是一位博学的中国传统文化专家，擅长典雅、深入地讲解诗词、典籍、节气、节日、人物、哲学等。回答要言之有物，引经据典。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.75,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// === 字段补全策略 ===
const FIELDS = [
  {
    key: "body_extended",
    label: "深入解读",
    shouldEnrich: (a) => !a.body_extended || a.body_extended.length < 300,
    prompt: (a) => `为「${a.title}」（分类：${a.category}）写一段 600-1000 字的深入解读。

要求：
- 补充必要的背景知识（年代、出处、相关人物）
- 解读核心思想/艺术特色/历史意义
- 如是诗词：点出意象、典故、艺术手法
- 如是典籍：概括核心思想，引用原文 1-2 句
- 如是人物：介绍生平关键转折、贡献
- 文风典雅，适合知识普及，避免空话
- 不要加"以下是..."这类开头，直接进入正文

参考摘要：${(a.excerpt || a.body || "").slice(0, 400)}`,
  },
  {
    key: "influence",
    label: "现代影响",
    shouldEnrich: (a) => !a.influence || a.influence.length < 100,
    prompt: (a) => `为「${a.title}」（分类：${a.category}）写一段 200-350 字的「现代影响/当代价值」。

要求：
- 在当代文化/学术/生活中的具体体现
- 对现代人有什么启示
- 1-2 个具体例子（被引用、改编、入选教材、引发讨论等）
- 文风典雅

直接输出，不要加标题。`,
  },
  {
    key: "faq",
    label: "常见问答",
    shouldEnrich: (a) => !a.faq || !Array.isArray(a.faq) || a.faq.length < 3,
    prompt: (a) => `为「${a.title}」（分类：${a.category}）生成 5 个常见问题及答案。

**严格 JSON 数组格式**（不要加 \`\`\`json 标记，直接输出）：
[
  {"q": "问题1", "a": "答案1（60-120字）"},
  {"q": "问题2", "a": "答案2"},
  {"q": "问题3", "a": "答案3"},
  {"q": "问题4", "a": "答案4"},
  {"q": "问题5", "a": "答案5"}
]

要求：
- 问题具体有深度，不要"是什么"这种泛问
- 答案引用典故/原文，有信息密度`,
    parse: (raw) => {
      // 尝试提取 JSON（应对 ```json 包裹）
      const m = raw.match(/\[[\s\S]*\]/);
      if (!m) return null;
      try {
        const arr = JSON.parse(m[0]);
        if (!Array.isArray(arr)) return null;
        return arr
          .filter(x => x && x.q && x.a)
          .map(x => ({ question: String(x.q), answer: String(x.a) }));
      } catch {
        return null;
      }
    },
  },
];

// === 进度文件 ===
const PROGRESS_FILE = path.resolve(process.cwd(), "scripts", "enrich-progress.json");
let progress = {};
try {
  progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
} catch {}

function saveProgress() {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// === Supabase REST ===
async function sbSelect(pathname) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, { headers: SB_HEADERS });
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

// === 主流程 ===
async function main() {
  console.log(`[enrich-v3] 开始 ...`);
  console.log(`  LLM endpoint: ${BAILIAN_BASE}`);

  // 1. 加载所有文章
  const articles = await sbSelect(
    "knowledge_articles?select=id,title,category,excerpt,body,body_extended,influence,faq&order=view_count.desc&limit=500"
  );
  console.log(`  Total: ${articles.length} articles`);

  // 2. 找出需要补全的
  const toEnrich = articles.filter((a) =>
    FIELDS.some((f) => f.shouldEnrich(a))
  );
  console.log(`  To enrich: ${toEnrich.length} articles`);

  if (toEnrich.length === 0) {
    console.log(`  ✓ 全部已补全，结束。`);
    return;
  }

  // 3. 逐篇处理
  let ok = 0, skip = 0, fail = 0, fieldsUpdated = 0;
  const startTime = Date.now();

  for (let i = 0; i < toEnrich.length; i++) {
    const a = toEnrich[i];
    const update = {};
    const progressKey = (k) => `${a.id}:${k}`;

    for (const f of FIELDS) {
      if (!f.shouldEnrich(a)) {
        skip++;
        continue;
      }
      if (progress[progressKey(f.key)]) {
        skip++;
        continue;
      }

      try {
        console.log(
          `  [${i + 1}/${toEnrich.length}] ${a.title.slice(0, 20)} → ${f.label}`
        );
        const raw = await callLLM(f.prompt(a));

        // 解析（faq 特殊处理）
        let value = raw;
        if (f.parse) {
          value = f.parse(raw);
          if (!value || value.length === 0) {
            throw new Error("parse returned empty");
          }
        }

        update[f.key] = value;
        progress[progressKey(f.key)] = Date.now();
        fieldsUpdated++;

        await new Promise((r) => setTimeout(r, 600));
      } catch (e) {
        console.error(`    FAIL ${f.key}: ${e.message.slice(0, 120)}`);
        fail++;
        // 失败等待长一些（避免连续失败）
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    // 4. 写回 DB
    if (Object.keys(update).length > 0) {
      try {
        await sbUpdate(a.id, update);
        ok++;
        console.log(`    ✓ saved ${Object.keys(update).join(",")}`);
      } catch (e) {
        console.error(`    DB FAIL: ${e.message.slice(0, 120)}`);
        fail++;
        // 失败时回滚 progress（让下次重试）
        for (const k of Object.keys(update)) {
          delete progress[progressKey(k)];
        }
      }
      saveProgress();
    }

    // 进度
    const elapsed = (Date.now() - startTime) / 60000;
    const eta = (elapsed / (i + 1)) * (toEnrich.length - i - 1);
    if ((i + 1) % 5 === 0) {
      console.log(
        `  [${i + 1}/${toEnrich.length}] ok=${ok} fields=${fieldsUpdated} fail=${fail} | ${elapsed.toFixed(1)}min | ETA ${eta.toFixed(0)}min`
      );
    }
  }

  console.log(`\n✓ Done. ok=${ok} fields=${fieldsUpdated} skip=${skip} fail=${fail}`);
  console.log(`  Total time: ${((Date.now() - startTime) / 60000).toFixed(1)} min`);
}

main().catch((e) => {
  console.error("[fatal]", e);
  process.exit(1);
});
