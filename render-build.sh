#!/usr/bin/env bash
set -euo pipefail

echo "==> Extracting the ASNK application"
unzip -o "Kivu Scouts Hub.zip"

echo "==> Applying the official Cloudflare Workers configuration"
cp cloudflare.vite.config.ts vite.config.ts

echo "==> Removing the Render/Lovable/Nitro build adapters"
npm pkg delete 'devDependencies.@lovable.dev/vite-tanstack-config'
npm pkg delete 'devDependencies.nitro'
npm pkg delete 'dependencies.@tanstack/zod-adapter'

echo "==> Pinning the Cloudflare build toolchain"
npm pkg set version=1.0.0
npm pkg set 'engines.node=>=22.12.0'
npm pkg set 'devDependencies.vite=8.3.8'
npm pkg set 'devDependencies.@cloudflare/vite-plugin=1.69.1'
npm pkg set 'devDependencies.wrangler=4.162.0'
npm pkg set 'dependencies.@tailwindcss/vite=4.3.5'
npm pkg set 'dependencies.tailwindcss=4.3.5'
npm pkg set 'scripts.build=vite build'
npm pkg set 'scripts.preview=vite preview'
npm pkg set 'scripts.typecheck=tsc --noEmit'
npm pkg set 'scripts.cf-typegen=wrangler types'
npm pkg set 'scripts.deploy=npm run build && wrangler deploy'

echo "==> Updating the search route for Zod 4"
node --input-type=module <<'NODE'
import fs from "node:fs";

const file = "src/routes/recherche.tsx";
let source = fs.readFileSync(file, "utf8");
source = source.replace(
  'import { zodValidator, fallback } from "@tanstack/zod-adapter";\\n',
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
