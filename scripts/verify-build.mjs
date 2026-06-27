// Post-build sanity check. Runs after `vite build` and `emit-runtime-env`.
// Fails (non-zero exit) if any of the known-breakage invariants are violated,
// so Vercel rejects a bad build before it ever reaches production.
//
// Why: every "网站打不开了" regression in this project has traced back to one
// of these:
//   - public/ai-covers (1014 images) missing from .vercel/output/static/  → 404 on every <img>
//   - .env missing from __server.func/                                    → ENOENT /var/task/.env
//   - vite.define collapsed process.env.SUPABASE_URL to ""                → 500 on every createServerFn route
// Rather than remember the checklist, encode it once and let CI fail loudly.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const STATIC = join(ROOT, ".vercel/output/static");
const FN = join(ROOT, ".vercel/output/functions/__server.func");
const FN_ENV = join(FN, ".env");
const SSR_DIR = join(FN, "_ssr");

let failures = 0;
function check(label, ok, detail) {
  const tag = ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
  console.log(`  ${tag} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

console.log("[verify-build] checking .vercel/output/");

// 1. static/ 存在 + 至少有 Vite 客户端产物 + Vite 的 public/ 被复制
check(".vercel/output/static/ exists", existsSync(STATIC));
if (existsSync(STATIC)) {
  const top = readdirSync(STATIC);
  check("  contains Vite client assets/", top.includes("assets"));
  check(
    "  contains public/ (ai-covers/ + home-illustrations/ + images/)",
    top.includes("ai-covers") || top.includes("home-illustrations") || top.includes("images"),
    `found: ${top.filter((n) => !n.startsWith(".")).join(", ")}`,
  );
  if (top.includes("ai-covers")) {
    const covers = readdirSync(join(STATIC, "ai-covers"));
    check(
      "  ai-covers/ has images (>= 1000)",
      covers.length >= 1000,
      `count=${covers.length}`,
    );
  }
}

// 2. server function 输出 + .env 被写出来了 (防 ENOENT /var/task/.env)
check(".vercel/output/functions/__server.func/ exists", existsSync(FN));
check(
  "  __server.func/.env exists (emit-runtime-env worked)",
  existsSync(FN_ENV),
);

if (existsSync(FN_ENV)) {
  const envText = readFileSync(FN_ENV, "utf-8");
  for (const key of [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "BAILIAN_API_KEY",
    "BAILIAN_BASE_URL",
  ]) {
    check(
      `  .env has ${key}`,
      new RegExp(`^${key}=.+`, "m").test(envText),
    );
  }
}

// 3. client.server.mjs 里 SUPABASE_URL 必须保持 process.env.SUPABASE_URL
//    不是空字符串(防 vite.define 把 env 替换成 "" 导致 500)
if (existsSync(SSR_DIR)) {
  const ssrFiles = readdirSync(SSR_DIR).filter(
    (f) => f.startsWith("client.server") && f.endsWith(".mjs"),
  );
  check(
    "  _ssr/client.server.*.mjs exists",
    ssrFiles.length > 0,
    ssrFiles.join(", ") || "(none)",
  );
  for (const f of ssrFiles) {
    const text = readFileSync(join(SSR_DIR, f), "utf-8");
    check(
      `  ${f}: keeps process.env.SUPABASE_URL (not hard-coded to "")`,
      text.includes("process.env.SUPABASE_URL") && !/SUPABASE_URL\s*=\s*""/.test(text),
    );
  }
}

console.log("");
if (failures > 0) {
  console.error(
    `\x1b[31m[verify-build] FAILED — ${failures} check(s) above broke invariants.\x1b[0m`,
  );
  console.error(
    "[verify-build] Refusing to let a broken build ship. Fix the issue(s) and rebuild.",
  );
  process.exit(1);
}
console.log("\x1b[32m[verify-build] all checks passed.\x1b[0m");
