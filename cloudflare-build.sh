#!/usr/bin/env bash
set -euo pipefail
echo "==> Extracting the ASNK application"
unzip -o "Kivu Scouts Hub.zip"
echo "==> Correcting ASNK branding assets, responsive images and favicon"
node --input-type=module <<'ASNK_BRANDING'
import fs from "node:fs";
import path from "node:path";
const publicDir="public";
fs.mkdirSync(publicDir,{recursive:true});
// SVG favicon: compact ASNK shield mark, served directly by Cloudflare's static assets.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#123b68"/><path d="M32 7 53 15v17c0 13-8 21-21 26C19 53 11 45 11 32V15z" fill="#fff" stroke="#d5ad45" stroke-width="2"/><path d="M32 16 35.8 27.5 48 27.5 38.1 34.7 41.9 46 32 39 22.1 46 25.9 34.7 16 27.5 28.2 27.5z" fill="#123b68"/><text x="32" y="57" font-family="Arial,sans-serif" font-size="6" font-weight="700" text-anchor="middle" fill="#fff">ASNK</text></svg>`;
fs.writeFileSync(path.join(publicDir,"favicon.svg"),favicon);
fs.writeFileSync(path.join(publicDir,"favicon.ico"),favicon);
const root="src/routes/__root.tsx";
if(fs.existsSync(root)){
 let s=fs.readFileSync(root,"utf8");
 const iconLinks='<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" /><link rel="alternate icon" href="/favicon.ico?v=2" /><link rel="apple-touch-icon" href="/favicon.svg?v=2" />';
 if(!s.includes('href="/favicon.svg')){
   if(s.includes("<HeadContent />")) s=s.replace("<HeadContent />", "<HeadContent />\\n    "+iconLinks);
   else if(s.includes("<HeadContent/>")) s=s.replace("<HeadContent/>", "<HeadContent/>\\n    "+iconLinks);
   else if(s.includes("</head>")) s=s.replace("</head>", iconLinks+"</head>");
   else throw new Error("Impossible d'ajouter le favicon : structure head de __root.tsx non reconnue");
 }
 fs.writeFileSync(root,s);
}
// Normalize image rendering without distorting source proportions.
const cssCandidates=["src/styles.css","src/index.css","src/global.css"];
const css=cssCandidates.find(p=>fs.existsSync(p));
if(css){
 const rules=`
/* ASNK media presentation */
img, picture, video { max-width: 100%; }
img { height: auto; }
.site-logo, .logo img, img[alt*="logo" i] { object-fit: contain; object-position: center; }
figure img, .gallery img, [class*="gallery"] img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; }
.hero img, [class*="hero"] img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; }
@media (max-width: 640px) {
  img { max-width: 100%; }
  .site-logo, .logo img, img[alt*="logo" i] { max-height: 52px; }
}
`;
 let styles=fs.readFileSync(css,"utf8");
 if(!styles.includes("ASNK media presentation")) styles+="\\n"+rules+"\\n";
 fs.writeFileSync(css,styles);
}
ASNK_BRANDING
rm -f bun.lock bun.lockb
echo "==> Applying the Cloudflare-native backend"
cp -R cloudflare-overlay/. .
echo "==> Preparing TanStack Start for Cloudflare Workers"
cp cloudflare.vite.config.ts vite.config.ts
node --input-type=module <<'NODE'
import fs from "node:fs";
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
delete pkg.devDependencies?.["@lovable.dev/vite-tanstack-config"];
delete pkg.devDependencies?.nitro;
delete pkg.dependencies?.["@tanstack/zod-adapter"];
pkg.engines={...(pkg.engines??{}),node:">=22.12.0"};
pkg.scripts={...(pkg.scripts??{}),build:"vite build",preview:"vite preview",typecheck:"tsc --noEmit","cf-typegen":"wrangler types",deploy:"npm run build && wrangler deploy"};
fs.writeFileSync("package.json",JSON.stringify(pkg,null,2)+"\n");
const searchRoute="src/routes/recherche.tsx";
if(fs.existsSync(searchRoute)){let s=fs.readFileSync(searchRoute,"utf8");s=s.replace('import { zodValidator, fallback } from "@tanstack/zod-adapter";\n',"").replace('q: fallback(z.string(), "").default(""),','q: z.string().default(""),').replace("validateSearch: zodValidator(searchSchema),","validateSearch: searchSchema,");fs.writeFileSync(searchRoute,s)}
const rootRoute="src/routes/__root.tsx";
if(fs.existsSync(rootRoute)){let s=fs.readFileSync(rootRoute,"utf8");s=s.replace("function ErrorComponent({ error, reset }: { error: Error; reset: () => void })","function ErrorComponent({ error, reset }: { error: unknown; reset: () => void })");fs.writeFileSync(rootRoute,s)}
// tsconfig.json is JSONC (comments are valid there), so remove comments safely before parsing.
const rawTs=fs.readFileSync("tsconfig.json","utf8");
let cleanTs="", inString=false, escaped=false, lineComment=false, blockComment=false;
for(let i=0;i<rawTs.length;i++){
  const ch=rawTs[i], next=rawTs[i+1];
  if(lineComment){if(ch==="\\n"){lineComment=false;cleanTs+=ch}else cleanTs+=" ";continue}
  if(blockComment){if(ch==="*"&&next==="/"){blockComment=false;cleanTs+="  ";i++}else cleanTs+=ch==="\\n"?"\\n":" ";continue}
  if(inString){cleanTs+=ch;if(escaped)escaped=false;else if(ch==="\\\\")escaped=true;else if(ch==='"')inString=false;continue}
  if(ch==='"'){inString=true;cleanTs+=ch;continue}
  if(ch==="/"&&next==="/"){lineComment=true;cleanTs+="  ";i++;continue}
  if(ch==="/"&&next==="*"){blockComment=true;cleanTs+="  ";i++;continue}
  cleanTs+=ch;
}
const ts=JSON.parse(cleanTs);
ts.compilerOptions={...(ts.compilerOptions??{}),noImplicitAny:false};
ts.compilerOptions.types=["vite/client","node"];
fs.writeFileSync("tsconfig.json",JSON.stringify(ts,null,2)+"\n");
fs.writeFileSync(".env.production","");
const wr=JSON.parse(fs.readFileSync("wrangler.jsonc","utf8"));wr.vars={...(wr.vars??{}),ASNK_MEDIA_PUBLIC_BASE_URL:"https://pub-09215c6a4e1441598c606e92ab2a3793.r2.dev"};fs.writeFileSync("wrangler.jsonc",JSON.stringify(wr,null,2)+"\n");
NODE
echo "==> Installing Cloudflare dependencies"
npm install --save-dev @cloudflare/vite-plugin wrangler --no-audit --no-fund
echo "==> Generating Cloudflare Worker types"
npm run cf-typegen
echo "==> Checking TypeScript"
npm run typecheck
echo "==> Building Cloudflare Worker"
npm run build
echo "==> Checking Worker package without deploying"
npx wrangler deploy --dry-run
echo "==> Cloudflare-native build and dry-run completed"
