$ErrorActionPreference = "Stop"
$Project = "C:\ASNK"

Write-Host "=== Mise a jour et deploiement ASNK ===" -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $Project ".git"))) {
  throw "Le dossier C:\ASNK ne contient pas un depot Git."
}
Set-Location $Project

$changes = git status --porcelain
if ($LASTEXITCODE -ne 0) { throw "Impossible de verifier Git." }
if ($changes) {
  Write-Host "Des modifications locales sont presentes. Aucun fichier ne sera ecrase." -ForegroundColor Yellow
  git status --short
  throw "Sauvegardez ou validez vos modifications locales, puis relancez ce script."
}

git fetch origin
if ($LASTEXITCODE -ne 0) { throw "Echec de recuperation depuis GitHub." }
git switch main
if ($LASTEXITCODE -ne 0) { throw "Impossible de passer sur main." }
git pull --ff-only origin main
if ($LASTEXITCODE -ne 0) { throw "Mise a jour impossible sans conflit." }

npm install
if ($LASTEXITCODE -ne 0) { throw "Installation des dependances echouee." }

npm run build
if ($LASTEXITCODE -ne 0) { throw "Compilation echouee. Le Worker n'a PAS ete deploye." }

npx nitro deploy --prebuilt
if ($LASTEXITCODE -ne 0) { throw "Le deploiement Cloudflare a echoue." }

Write-Host "Deploiement termine. Verifiez https://asnk-scouts-nord-kivu.rigobertmumbere2018.workers.dev/districts" -ForegroundColor Green
