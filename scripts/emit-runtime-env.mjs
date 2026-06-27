// Post-build step: writes a `.env` file into the Vercel server function output
// directory so any code that does `readFileSync('.env')` at runtime (c12 / loadEnv
// in some Nitro v3 beta code paths) finds the file instead of throwing ENOENT.
//
// Vercel strips .env from the deployed package (it's gitignored), so without
// this step runtime dotenv loading crashes. We populate the .env from the env
// vars Vercel injects at build time (which is the same set the runtime sees
// in process.env, so there's no real security delta from committing one).
import { writeFileSync, existsSync } from "node:fs";
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
