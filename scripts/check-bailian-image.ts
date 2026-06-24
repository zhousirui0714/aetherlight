/**
 * 验证 BAILIAN qwen-image / wanx 等图像生成 API 是否可用
 * 通过 dashscope 接口
 *
 * 运行: npx tsx scripts/check-bailian-image.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");

function loadEnv(): Record<string, string> {
  const content = readFileSync(ENV_FILE, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !line.startsWith("#")) {
      env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const ENV = loadEnv();
const KEY = ENV.BAILIAN_API_KEY;
const BASE = ENV.BAILIAN_BASE_URL || "https://dashscope.aliyuncs.com";

if (!KEY) {
  console.error("❌ BAILIAN_API_KEY 缺失");
  process.exit(1);
}

console.log("KEY 前缀:", KEY.slice(0, 12) + "...");
console.log("BASE:", BASE);

// 尝试 1: qwen-image (DashScope 同步文生图, 走 POST)
async function tryQwenImage() {
  console.log("\n--- 尝试 1: qwen-image (同步) ---");
  const res = await fetch(`${BASE}/api/v1/services/aigc/text2image/image-synthesis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model: "qwen-image",
      input: { prompt: "ancient Chinese landscape ink wash painting, mountains and mist, classical Song dynasty style, monochrome, no text" },
      parameters: { size: "1024*1024", n: 1 },
    }),
  });
  console.log("status:", res.status);
  const text = await res.text();
  console.log("body (前 600):", text.slice(0, 600));
  return res.ok;
}

async function tryWanx() {
  console.log("\n--- 尝试 2: wanx-v1 (异步) ---");
  const res = await fetch(`${BASE}/api/v1/services/aigc/text2image/image-synthesis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model: "wanx-v1",
      input: { prompt: "古代中国水墨山水画,云雾,宋代风格,单色" },
      parameters: { style: "<chinese painting>", size: "1024*1024", n: 1 },
    }),
  });
  console.log("status:", res.status);
  const text = await res.text();
  console.log("body (前 600):", text.slice(0, 600));
  return res.ok;
}

async function tryPollinations() {
  console.log("\n--- 尝试 3: pollinations.ai (无 key 公开 API) ---");
  const prompt = "ancient chinese ink wash landscape painting mountains mist song dynasty monochrome";
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=42&nologo=true`;
  const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(30000) });
  console.log("status:", res.status);
  console.log("content-type:", res.headers.get("content-type"));
  if (res.ok) {
    const ab = await res.arrayBuffer();
    const crypto = await import("node:crypto");
    const md5 = crypto.createHash("md5").update(Buffer.from(ab)).digest("hex");
    console.log("size:", ab.byteLength, "md5:", md5);
  }
  return res.ok;
}

async function tryPollinations2() {
  console.log("\n--- 尝试 4: pollinations.ai 第二张 (不同 prompt + seed) ---");
  const prompt = "chinese traditional architecture ancient palace red walls golden roof";
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=99&nologo=true`;
  const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(30000) });
  console.log("status:", res.status);
  if (res.ok) {
    const ab = await res.arrayBuffer();
    const crypto = await import("node:crypto");
    const md5 = crypto.createHash("md5").update(Buffer.from(ab)).digest("hex");
    console.log("size:", ab.byteLength, "md5:", md5);
  }
  return res.ok;
}

async function tryBailianOpenAI() {
  console.log("\n--- 尝试 5: 百炼 OpenAI compatible /v1/images/generations ---");
  const url = `${BASE}/images/generations`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model: "qwen-image",
      prompt: "ancient Chinese landscape ink wash painting, mountains and mist, classical Song dynasty style, monochrome, no text",
      n: 1,
      size: "1024x1024",
    }),
  });
  console.log("status:", res.status);
  const text = await res.text();
  console.log("body (前 600):", text.slice(0, 600));
  return res.ok;
}

async function main() {
  await tryQwenImage();
  await tryWanx();
  await tryPollinations();
  await tryPollinations2();
  await tryBailianOpenAI();
}

main().catch((err) => {
  console.error("❌:", err);
  process.exit(1);
});
