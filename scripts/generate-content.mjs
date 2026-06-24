// 批量生成 51 篇文章的扩展内容
// 调用百炼 LLM API，输出到 src/lib/generated-content.json
// 每篇生成：content(1500-3000字)、history(500-1000字)、influence(300-500字)

import fs from 'node:fs';
import path from 'node:path';

// 解析 .env
const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.match(/^BAILIAN_API_KEY=(.+)$/m)?.[1]?.trim();
const baseUrl = envContent.match(/^BAILIAN_BASE_URL=(.+)$/m)?.[1]?.trim();
if (!apiKey || !baseUrl) {
  console.error('Missing BAILIAN_API_KEY or BAILIAN_BASE_URL in .env');
  process.exit(1);
}

// 解析 knowledge-data.ts，提取所有文章 id/title/category/excerpt
// 用正则匹配每篇文章的开头
const src = fs.readFileSync('src/lib/knowledge-data.ts', 'utf8');

// 提取每篇文章：id, title, category, excerpt, current content
const articles = [];
const articleRegex = /\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*excerpt:\s*"([^"]*)",[\s\S]*?content:\s*"([^"]*)",/g;
let m;
while ((m = articleRegex.exec(src)) !== null) {
  articles.push({
    id: m[1],
    title: m[2],
    category: m[3],
    excerpt: m[4],
    currentContent: m[5].slice(0, 80),
  });
}
console.log(`Found ${articles.length} articles.`);

// 读取已生成的内容（如有）
const outFile = 'src/lib/generated-content.json';
let generated = {};
if (fs.existsSync(outFile)) {
  try {
    generated = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  } catch {}
}

const systemPrompt = `你是一位精通中国传统文化、治学严谨的雅士，擅长撰写深入浅出的文化普及文章。
请为给定的传统文化主题撰写三段文字，输出严格 JSON，不要任何解释或前后缀。`;

function buildUserPrompt(article) {
  return `请为以下传统文化主题撰写深度内容，输出严格 JSON 格式：

主题：《${article.title}》
分类：${article.category}
原摘要：${article.excerpt}

要求输出三个字段：
1. "content": 正文内容，1500-2500 字，分 4-6 个自然段，每段以"【小标题】"开头（如【起源与流变】），段与段之间用 \\n\\n 分隔
2. "history": 历史背景，400-600 字，介绍该主题的起源、发展脉络、在历史长河中的演变
3. "influence": 文化影响与现代意义，300-500 字

写作要求：
- 引用典籍时使用书名号《》，如《论语》《诗经》
- 历史人名首次出现可附朝代
- 语言典雅清通，可适度引用古文（标注出处）
- 严格按以下 JSON Schema 输出，不要任何额外文字或 Markdown 代码块标记：
{"content":"...","history":"...","influence":"..."}`;
}

async function callApi(article, retries = 3) {
  const body = {
    model: 'qwen-plus',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildUserPrompt(article) },
    ],
    max_tokens: 4000,
    temperature: 0.7,
  };
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`HTTP ${r.status}: ${txt.slice(0, 200)}`);
      }
      const data = await r.json();
      const text = data.choices?.[0]?.message?.content || '';
      // 解析 JSON（可能包裹在 ```json ... ``` 中）
      const jsonStr = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(jsonStr);
      if (!parsed.content || !parsed.history || !parsed.influence) {
        throw new Error('Missing fields in response');
      }
      return parsed;
    } catch (err) {
      console.warn(`[${article.id}] retry ${i + 1}: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

const CONCURRENCY = 4;
const queue = articles.filter(a => !generated[a.id]);
console.log(`Pending: ${queue.length} articles.`);

let done = 0;
let failed = [];
const executing = new Set();

async function worker(article) {
  try {
    const t0 = Date.now();
    const result = await callApi(article);
    generated[article.id] = result;
    done++;
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[${done}/${queue.length}] ✓ ${article.id} (${article.title}) - ${elapsed}s, content=${result.content.length}字`);
    // 每 5 篇保存一次
    if (done % 5 === 0) {
      fs.writeFileSync(outFile, JSON.stringify(generated, null, 2), 'utf8');
    }
  } catch (err) {
    failed.push({ id: article.id, error: err.message });
    console.error(`[${article.id}] FAILED: ${err.message}`);
  }
}

async function run() {
  for (const a of queue) {
    if (executing.size >= CONCURRENCY) {
      await Promise.race(executing);
    }
    const p = worker(a).finally(() => executing.delete(p));
    executing.add(p);
  }
  await Promise.all(executing);
  fs.writeFileSync(outFile, JSON.stringify(generated, null, 2), 'utf8');
  console.log(`\n=== Done. ${done} success, ${failed.length} failed ===`);
  if (failed.length) console.log('Failed:', JSON.stringify(failed, null, 2));
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
