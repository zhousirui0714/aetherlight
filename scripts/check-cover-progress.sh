#!/bin/bash
# 看 AI 配图重建进度
cd /workspace

# 1) 本地 progress 文件
echo "=== 本地 progress ==="
node --input-type=module -e '
import {readFileSync} from "node:fs";
const w1=JSON.parse(readFileSync("./scripts/covers-progress-w1.json","utf-8")||"{}");
const w2=JSON.parse(readFileSync("./scripts/covers-progress-w2.json","utf-8")||"{}");
const ok=v=>Object.values(v).filter(x=>typeof x==="string").length;
const err=v=>Object.values(v).filter(x=>x&&typeof x==="object"&&x.error).length;
const pad=(n,w=3)=>String(n).padStart(w);
console.log("W1 (0-950):  ok="+pad(ok(w1))+" err="+pad(err(w1))+" total="+Object.keys(w1).length);
console.log("W2 (951+):   ok="+pad(ok(w2))+" err="+pad(err(w2))+" total="+Object.keys(w2).length);
const tot=ok(w1)+ok(w2);
console.log("合计:         "+tot+"/1966 done ("+Math.round(tot/1966*100)+"%)");
'

# 2) DB 现状
echo ""
echo "=== DB 现状 ==="
node --input-type=module -e '
const KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96c2hmbHVqbnhvbmhmd2R0dW5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg1ODE1OCwiZXhwIjoyMDk3NDM0MTU4fQ.anOBfnv8KzPSnBl2XUKfCVsc3DlOuGGv-z4kIiT5O1c";
const URL="https://ozshflujnxonhfwdtunp.supabase.co";
const r=await fetch(`${URL}/rest/v1/knowledge_articles?select=id&cover_url=not.is.null&limit=1`,{method:"HEAD",headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,Prefer:"count=exact"}});
const cr=r.headers.get("content-range");
console.log("DB cover_url 不为 null: "+(cr?cr.split("/").pop():"?")+"/1966");
'
