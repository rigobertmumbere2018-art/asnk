#!/usr/bin/env bash
set -euo pipefail

echo "==> Extracting the ASNK application"
unzip -o "Kivu Scouts Hub.zip"

# Never use the embedded local environment file in CI or ship it to a Worker.
rm -f .env

echo "==> Applying the official Cloudflare Workers configuration"
cp cloudflare.vite.config.ts vite.config.ts

echo "==> Replacing the Render/Lovable/Nitro build setup"
node --input-type=module <<'NODE'
import fs from "node:fs";

const file = "package.json";
const pkg = JSON.parse(fs.readFileSync(file, "utf8"));

delete pkg.devDependencies?.["@lovable.dev/vite-tanstack-config"];
delete pkg.devDependencies?.nitro;
delete pkg.dependencies?.["@tanstack/zod-adapter"];

pkg.version = "1.0.0";
pkg.engines = { ...(pkg.engines ?? {}), node: ">=22.12.0" };
pkg.devDependencies = {
  ...(pkg.devDependencies ?? {}),
  vite: "8.3.8",
  "@cloudflare/vite-plugin": "1.69.1",
  wrangler: "4.162.0",
};
pkg.dependencies = {
  ...(pkg.dependencies ?? {}),
  "@tailwindcss/vite": "4.3.5",
  tailwindcss: "4.3.5",
};
pkg.scripts = {
  ...(pkg.scripts ?? {}),
  build: "vite build",
  preview: "vite preview",
  typecheck: "tsc --noEmit",
  "cf-typegen": "wrangler types",
  deploy: "npm run build && wrangler deploy",
};
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
NODE

echo "==> Updating the search route for Zod 4"
node --input-type=module <<'NODE'
import fs from "node:fs";

const file = "src/routes/recherche.tsx";
let source = fs.readFileSync(file, "utf8");
source = source.replace(
  'import { zodValidator, fallback } from "@tanstack/zod-adapter";\n',
  ""
);
source = source.replace(
  'q: fallback(z.string(), "").default(""),',
  'q: z.string().default(""),'
);
source = source.replace(
  "validateSearch: zodValidator(searchSchema),",
  "validateSearch: searchSchema,"
);
fs.writeFileSync(file, source);
NODE

echo "==> Protecting local environment files"
if ! grep -q '^# Local secrets' .gitignore 2>/dev/null; then
  cat >> .gitignore <<'EOF'

# Local secrets
.env
.env.*
!.env.example
.dev.vars
.wrangler/
EOF
fi

cat > .env.example <<'EOF'
# Public Supabase values (safe to expose in the browser)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

# Server-side Worker variables
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

# Only if trusted server-side admin operations are enabled:
# SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
EOF

echo "==> Installing dependencies"
npm install --no-audit --no-fund

echo "==> Running TypeScript validation"
npm run typecheck

echo "==> Building the Cloudflare Worker"
npm run build

echo "==> Cloudflare build completed"
