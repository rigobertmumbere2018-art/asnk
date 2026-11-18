#!/usr/bin/env bash
set -euo pipefail
echo "==> Extracting the ASNK application"
unzip -o "Kivu Scouts Hub.zip"
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
fs.writeFileSync("tsconfig.json",JSON.stringify(ts,null,2)+"\\n");
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
