#!/usr/bin/env bash
set -euo pipefail

echo "==> Extracting the ASNK application"
unzip -o "Kivu Scouts Hub.zip"
rm -f bun.lock bun.lockb

echo "==> Preparing TanStack Start for Cloudflare Workers"
cp cloudflare.vite.config.ts vite.config.ts

node --input-type=module <<'NODE'
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
delete pkg.devDependencies?.["@lovable.dev/vite-tanstack-config"];
delete pkg.devDependencies?.nitro;
delete pkg.dependencies?.["@tanstack/zod-adapter"];

pkg.engines = { ...(pkg.engines ?? {}), node: ">=22.12.0" };
pkg.scripts = {
  ...(pkg.scripts ?? {}),
  build: "vite build",
  preview: "vite preview",
  typecheck: "tsc --noEmit",
  "cf-typegen": "wrangler types",
  deploy: "npm run build && wrangler deploy",
};
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");

const searchRoute = "src/routes/recherche.tsx";
let source = fs.readFileSync(searchRoute, "utf8");
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
fs.writeFileSync(searchRoute, source);

let tsconfig = fs.readFileSync("tsconfig.json", "utf8");
if (!tsconfig.includes('"types": ["vite/client", "node"]')) {
  tsconfig = tsconfig.replace('"types": ["vite/client"]', '"types": ["vite/client", "node"]');
}
fs.writeFileSync("tsconfig.json", tsconfig);

const envText = fs.readFileSync(".env", "utf8");
const values = {};
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
  if (match) values[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
}
const required = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];
const missing = required.filter((key) => !values[key]);
if (missing.length) {
  throw new Error("Missing Supabase configuration keys: " + missing.join(", "));
}

fs.writeFileSync(
  ".env.production",
  "VITE_SUPABASE_URL=" + JSON.stringify(values.VITE_SUPABASE_URL) + "\n" +
  "VITE_SUPABASE_PUBLISHABLE_KEY=" + JSON.stringify(values.VITE_SUPABASE_PUBLISHABLE_KEY) + "\n"
);

const wrangler = JSON.parse(fs.readFileSync("wrangler.jsonc", "utf8"));
wrangler.vars = {
  ...(wrangler.vars ?? {}),
  SUPABASE_URL: values.SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: values.SUPABASE_PUBLISHABLE_KEY,
};
fs.writeFileSync("wrangler.jsonc", JSON.stringify(wrangler, null, 2) + "\n");
fs.rmSync(".env", { force: true });
NODE

echo "==> Adding cache headers for built assets"
mkdir -p public
cat > public/_headers <<'EOF'
/assets/*
  Cache-Control: public, max-age=31536000, immutable
EOF

echo "==> Installing Cloudflare dependencies"
npm install --save-dev @cloudflare/vite-plugin wrangler --no-audit --no-fund

echo "==> Generating Cloudflare Worker types"
npm run cf-typegen

echo "==> Checking TypeScript"
npm run typecheck

echo "==> Building the Cloudflare Worker"
npm run build

echo "==> Checking the Worker package without deploying"
npx wrangler deploy --dry-run

echo "==> Cloudflare build and dry-run completed"
