import { readFileSync } from "node:fs";

const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96c2hmbHVqbnhvbmhmd2R0dW5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg1ODE1OCwiZXhwIjoyMDk3NDM0MTU4fQ.anOBfnv8KzPSnBl2XUKfCVsc3DlOuGGv-z4kIiT5O1c";
const URL = "https://ozshflujnxonhfwdtunp.supabase.co";

const p = JSON.parse(readFileSync("/workspace/scripts/covers-progress-w1.json", "utf-8"));
const keys = Object.keys(p);
console.log("progress 总 keys:", keys.length);

// 1) 抽 5 个测 progress id 是否在 DB
const samples = keys.slice(0, 5);
for (const k of samples) {
  const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=eq.${k}&limit=1`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const d = await r.json();
  console.log(" -", k, "=>", d.length > 0 ? "OK (" + d[0].title.slice(0, 25) + ")" : "不存在");
}

// 2) 统计: progress 里的 id 哪些在 DB 存在
let exist = 0, missing = 0;
const missingIds = [];
const batchSize = 50;
for (let i = 0; i < keys.length; i += batchSize) {
  const batch = keys.slice(i, i + batchSize);
  const filter = batch.map(k => `"${k.replace(/"/g, '\\"')}"`).join(",");
  const r = await fetch(`${URL}/rest/v1/knowledge_articles?id=in.(${filter})&select=id`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const d = await r.json();
  const foundIds = new Set(d.map(x => x.id));
  for (const k of batch) {
    if (foundIds.has(k)) exist++;
    else { missing++; missingIds.push(k); }
  }
}
console.log(`\nprogress 里的 id: exist=${exist}, missing=${missing}`);
if (missing > 0) console.log("missing 样例:", missingIds.slice(0, 5));
