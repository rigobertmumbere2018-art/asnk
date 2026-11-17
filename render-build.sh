#!/usr/bin/env bash
set -euo pipefail

echo "==> Extracting the real ASNK application from Kivu Scouts Hub.zip"
unzip -o "Kivu Scouts Hub.zip"

echo "==> Removing the incompatible Zod v3 adapter"
npm pkg delete 'dependencies.@tanstack/zod-adapter'

echo "==> Configuring the production start command"
npm pkg set 'scripts.start=node .output/server/index.mjs'

echo "==> Updating the search route for Zod v4"
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

echo "==> Installing dependencies"
npm install

echo "==> Building TanStack Start"
npm run build

echo "==> Build completed successfully"
