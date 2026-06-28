/**
 * 批量 PATCH 进度里的 cover_url 到 DB
 * 处理 progress 文件里所有的 (id, url) 映射
 * 容错: 单个失败不影响其他
 */
import { readFileSync } from "node:fs";

const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96c2hmbHVqbnhvbmhmd2R0dW5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg1ODE1OCwiZXhwIjoyMDk3NDM0MTU4fQ.anOBfnv8KzPSnBl2XUKfCVsc3DlOuGGv-z4kIiT5O1c";
const URL = "https://ozshflujnxonhfwdtunp.supabase.co";
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const p = JSON.parse(readFileSync("/workspace/scripts/covers-progress-w1.json", "utf-8"));
const entries = Object.entries(p).filter(([_, v]) => typeof v === "string");
console.log(`总计 ${entries.length} 条 url 待 PATCH`);

let ok = 0, fail = 0;
const BATCH = 20; // 一次 PATCH 多行

// 一次 PATCH 多行 (同一 cover_url 通常不, 但可以 batch by 20 ids)
for (let i = 0; i < entries.length; i += BATCH) {
  const batch = entries.slice(i, i + BATCH);
  // 逐个 PATCH (PostgREST 不支持一次 PATCH 多行不同 body)
  await Promise.all(batch.map(async ([id, coverUrl]) => {
    const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify({ cover_url: coverUrl }),
    });
    if (r.ok) ok++;
    else {
      fail++;
      if (fail < 5) console.log(`  fail ${id}: ${r.status}`);
    }
  }));
  process.stdout.write(`\r[${Math.min(i + BATCH, entries.length)}/${entries.length}] ok=${ok} fail=${fail}`);
}

console.log(`\n✅ done: ok=${ok} fail=${fail}`);

// 验证
const r = await fetch(`${URL}/rest/v1/knowledge_articles?select=id&cover_url=not.is.null&limit=1`, {
  method: "HEAD",
  headers: { ...HEADERS, Prefer: "count=exact" },
});
console.log(`DB cover_url 总数: ${r.headers.get("content-range")}`);
