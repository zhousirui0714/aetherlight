// Post-build step: writes a `.env` file into the Vercel server function output
// directory so any code that does `readFileSync('.env')` at runtime (c12 / loadEnv
// in some Nitro v3 beta code paths) finds the file instead of throwing ENOENT.
//
// Vercel strips .env from the deployed package (it's gitignored), so without
// this step runtime dotenv loading crashes. We populate the .env from the env
// vars Vercel injects at build time (which is the same set the runtime sees
// in process.env, so there's no real security delta from committing one).
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BAILIAN_API_KEY",
  "BAILIAN_BASE_URL",
];

// Anchor relative paths to the package root (/) so pnpm/npm
// run the script from the right directory regardless of where they were invoked.
const ROOT = resolve(process.cwd());

// Node 不会自动加载 .env（Vite 会，但 post-build 脚本不会）。本地构建时如果 shell
// 没把 .env 里的键 export 出来，process.env 就是空的，写出的 .env 就会缺键。
// 用一个轻量解析把 .env 注进 process.env，但只对尚未设置的键生效，让 Vercel 在
// build 阶段注入的真值优先。
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
loadEnvFile(join(ROOT, ".env"));
loadEnvFile(join(ROOT, ".env.local"));

// Nitro's vercel preset puts the serverless function here. The function's
// runtime cwd is /var/task/, so anything we write next to index.mjs ends up
// at /var/task/<name>.
const TARGETS = [
  join(ROOT, ".vercel/output/functions/__server.func"),
  join(ROOT, ".vercel/output/functions/__server.func/_ssr"),
];

let written = 0;
for (const dir of TARGETS) {
  if (!existsSync(dir)) continue;
  const lines = KEYS.filter((k) => process.env[k]).map((k) => `${k}=${process.env[k]}`);
  if (lines.length === 0) continue;
  const path = join(dir, ".env");
  writeFileSync(path, lines.join("\n") + "\n", "utf8");
  console.log(`[emit-runtime-env] wrote ${lines.length} keys -> ${path}`);
  written++;
}

if (written === 0) {
  console.warn(
    "[emit-runtime-env] no Vercel function output dirs found; " +
      "skipping. (Probably running on a non-Vercel preset — safe to ignore.)",
  );
}
