#!/usr/bin/env bash
set -euo pipefail

echo "==> Extracting the ASNK application"
unzip -o "Kivu Scouts Hub.zip"
rm -f bun.lock bun.lockb

echo "==> Extracting public Supabase settings without retaining .env"
node --input-type=module <<'NODE'
import fs from "node:fs";

const source = fs.readFileSync(".env", "utf8");
const values = {};
for (const line of source.split(/\r?\n/)) {
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
  throw new Error("Missing required Supabase configuration keys: " + missing.join(", "));
}
fs.writeFileSync(
  ".env.production",
  "VITE_SUPABASE_URL=" + values.VITE_SUPABASE_URL + "\n" +
  "VITE_SUPABASE_PUBLISHABLE_KEY=" + values.VITE_SUPABASE_PUBLISHABLE_KEY + "\n"
);
const config = JSON.parse(fs.readFileSync("wrangler.jsonc", "utf8"));
config.vars = {
  ...(config.vars ?? {}),
  SUPABASE_URL: values.SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: values.SUPABASE_PUBLISHABLE_KEY,
};
fs.writeFileSync("wrangler.jsonc", JSON.stringify(config, null, 2) + "\n");
fs.unlinkSync(".env");
NODE

echo "==> Applying the official Cloudflare Workers configuration"
cp cloudflare.vite.config.ts vite.config.ts

echo "==> Replacing unavailable Lovable-hosted media references"
node --input-type=module <<'NODE'
import fs from "node:fs";
import path from "node:path";

const edits = {
  "src/components/admin/AdminShell.tsx": [
    ['import logo from "@/assets/asnk-logo.jpg.asset.json";', 'import { asnkLogo as logo } from "@/lib/media-assets";'],
    ["logo.url", "logo"],
  ],
  "src/components/site/SiteFooter.tsx": [
    ['import logo from "@/assets/asnk-logo.jpg.asset.json";', 'import { asnkLogo as logo } from "@/lib/media-assets";'],
    ["logo.url", "logo"],
  ],
  "src/components/site/SiteHeader.tsx": [
    ['import logo from "@/assets/asnk-logo.jpg.asset.json";', 'import { asnkLogo as logo } from "@/lib/media-assets";'],
    ["logo.url", "logo"],
  ],
  "src/routes/actualites.tsx": [
    ['import campagneImg from "@/assets/campagne-anti-incendie.jpg.asset.json";', 'import { campagnePhoto as campagneImg } from "@/lib/media-assets";'],
    ["campagneImg.url", "campagneImg"],
  ],
  "src/routes/index.tsx": [
    ['import heroAsset from "@/assets/hero-scouts-drapeau.jpg.asset.json";', 'import { heroScouts as heroAsset, commissairePortrait as commissaireAsset } from "@/lib/media-assets";'],
    ['import commissaireAsset from "@/assets/commissaire-jack-makutano.jpg.asset.json";', ""],
    ["heroAsset.url", "heroAsset"],
    ["commissaireAsset.url", "commissaireAsset"],
  ],
  "src/routes/mouvement.tsx": [
    ['import chasseAsset from "@/assets/grande-chasse-scout.jpg.asset.json";', 'import { chassePhoto as chasseAsset } from "@/lib/media-assets";'],
    ["chasseAsset.url", "chasseAsset"],
  ],
};

for (const [file, replacements] of Object.entries(edits)) {
  let source = fs.readFileSync(file, "utf8");
  for (const [before, after] of replacements) {
    if (!source.includes(before)) {
      throw new Error("Expected media reference not found in " + file + ": " + before);
    }
    source = source.replaceAll(before, after);
  }
  fs.writeFileSync(file, source);
}

const gallery = "src/routes/galerie.tsx";
let gallerySource = fs.readFileSync(gallery, "utf8");
const galleryImports = [
  'import ceremonie from "@/assets/gallery/ceremonie-passation.jpg.asset.json";',
  'import branchesEnfants from "@/assets/gallery/branches-enfants.jpg.asset.json";',
  'import salongoMarche from "@/assets/gallery/salongo-marche.jpg.asset.json";',
  'import salongoVille from "@/assets/gallery/salongo-ville.jpg.asset.json";',
  'import jeunesseGroupe from "@/assets/gallery/jeunesse-groupe.jpg.asset.json";',
  'import formationClasse from "@/assets/gallery/formation-classe.jpg.asset.json";',
  'import formationSalle from "@/assets/gallery/formation-salle.jpg.asset.json";',
  'import partenariatVsi from "@/assets/gallery/partenariat-vsi.jpg.asset.json";',
];
for (const line of galleryImports) {
  if (!gallerySource.includes(line)) throw new Error("Expected gallery media reference not found: " + line);
  gallerySource = gallerySource.replace(line, "");
}
gallerySource = gallerySource.replace(
  'import { createFileRoute } from "@tanstack/react-router";',
  'import { createFileRoute } from "@tanstack/react-router";\nimport { ceremonyPhoto as ceremonie, branchesPhoto as branchesEnfants, salongoMarchePhoto as salongoMarche, salongoVillePhoto as salongoVille, jeunessePhoto as jeunesseGroupe, formationClassePhoto, formationSallePhoto, partenariatPhoto as partenariatVsi } from "@/lib/media-assets";'
);
for (const [name, replacement] of [
  ["ceremonie", "ceremonie"],
  ["branchesEnfants", "branchesEnfants"],
  ["salongoMarche", "salongoMarche"],
  ["salongoVille", "salongoVille"],
  ["jeunesseGroupe", "jeunesseGroupe"],
  ["formationClasse", "formationClassePhoto"],
  ["formationSalle", "formationSallePhoto"],
  ["partenariatVsi", "partenariatVsi"],
]) {
  gallerySource = gallerySource.replaceAll(name + ".url", replacement);
}
fs.writeFileSync(gallery, gallerySource);

fs.mkdirSync("src/lib", { recursive: true });
fs.writeFileSync("src/lib/media-assets.ts", [
  'import heroScoutsFile from "@/assets/hero-scouts.jpg";',
  'import commissairePortraitFile from "@/assets/commissaire.jpg";',
  'import ceremonyPhotoFile from "@/assets/scouts-ceremony.jpg";',
  '',
  'export const asnkLogo = "/images/asnk-logo.svg";',
  'export const heroScouts = heroScoutsFile;',
  'export const commissairePortrait = commissairePortraitFile;',
  'export const ceremonyPhoto = ceremonyPhotoFile;',
  'const placeholder = "/images/placeholders/visuel-a-remplacer.svg";',
  'export const campagnePhoto = placeholder;',
  'export const chassePhoto = placeholder;',
  'export const branchesPhoto = placeholder;',
  'export const formationClassePhoto = placeholder;',
  'export const formationSallePhoto = placeholder;',
  'export const jeunessePhoto = placeholder;',
  'export const partenariatPhoto = placeholder;',
  'export const salongoMarchePhoto = placeholder;',
  'export const salongoVillePhoto = placeholder;',
  ''
].join("\n"));

fs.mkdirSync("public/images/placeholders", { recursive: true });
fs.writeFileSync("public/images/asnk-logo.svg", [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Emblème ASNK provisoire">',
  '<path d="M128 10 226 48v70c0 61-39 104-98 128-59-24-98-67-98-128V48z" fill="#0b2530" stroke="#b8d84b" stroke-width="9"/>',
  '<path d="M128 34 204 63v55c0 47-28 81-76 103-48-22-76-56-76-103V63z" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="3"/>',
  '<text x="128" y="130" fill="#fff" font-family="Arial,sans-serif" font-size="66" font-weight="700" text-anchor="middle">ASNK</text>',
  '<path d="M88 157h80" stroke="#b8d84b" stroke-width="7" stroke-linecap="round"/>',
  '<text x="128" y="184" fill="#fff" font-family="Arial,sans-serif" font-size="15" text-anchor="middle">SCOUTS DU NORD-KIVU</text>',
  '</svg>',
  ''
].join("\n"));
fs.writeFileSync("public/images/placeholders/visuel-a-remplacer.svg", [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" role="img" aria-label="Photographie originale ASNK à intégrer">',
  '<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#102f39"/><stop offset="1" stop-color="#263d43"/></linearGradient></defs>',
  '<rect width="1200" height="760" fill="url(#bg)"/>',
  '<path d="M0 610 300 430l230 140 260-260 410 300v150H0z" fill="#b8d84b" opacity=".12"/>',
  '<circle cx="600" cy="300" r="88" fill="none" stroke="#b8d84b" stroke-width="10" opacity=".7"/>',
  '<path d="M600 220v160M520 300h160" stroke="#b8d84b" stroke-width="8" opacity=".7"/>',
  '<text x="600" y="485" fill="#fff" font-family="Arial,sans-serif" font-size="34" font-weight="700" text-anchor="middle">PHOTO ASNK À INTÉGRER</text>',
  '</svg>',
  ''
].join("\n"));

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".asset.json")) fs.unlinkSync(full);
  }
}
walk("src");
NODE

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
