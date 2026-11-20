$ErrorActionPreference = "Stop"
$Project = "C:\ASNK"
$Base = "https://raw.githubusercontent.com/rigobertmumbere2018-art/asnk/main"

Write-Host "=== Mise a jour ciblee et deploiement ASNK ===" -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $Project "package.json"))) { throw "package.json introuvable dans C:\ASNK." }
if (-not (Test-Path (Join-Path $Project "src\routes\districts.tsx"))) { throw "Le projet source ASNK est incomplet." }

Set-Location $Project
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path $Project "ASNK_BACKUP_DISTRICTS_$Stamp"
New-Item -ItemType Directory -Path $Backup -Force | Out-Null

$Files = @(
  "src/routes/districts.tsx",
  "src/routes/actualites.tsx",
  "src/routes/districts.\$slug.tsx",
  "src/data/district-activities.ts"
)

foreach ($File in $Files) {
  $Local = Join-Path $Project ($File -replace "/", "\")
  $Parent = Split-Path $Local -Parent
  if (-not (Test-Path $Parent)) { New-Item -ItemType Directory -Path $Parent -Force | Out-Null }
  if (Test-Path $Local) {
    $BackupFile = Join-Path $Backup ($File -replace "/", "__")
    Copy-Item $Local $BackupFile -Force
  }
  $Url = "$Base/$File"
  Write-Host "Recuperation : $File"
  Invoke-WebRequest -Uri $Url -OutFile $Local
  if (-not (Test-Path $Local) -or (Get-Item $Local).Length -lt 100) {
    throw "Fichier recupere invalide : $File. Sauvegarde locale : $Backup"
  }
}

Write-Host "Fichiers sauvegardes dans $Backup" -ForegroundColor Yellow
Write-Host "=== Compilation ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Compilation echouee. Aucun deploiement effectue. Sauvegarde : $Backup" }

Write-Host "=== Deploiement Cloudflare ===" -ForegroundColor Cyan
npx nitro deploy --prebuilt
if ($LASTEXITCODE -ne 0) { throw "Echec du deploiement Cloudflare. Sauvegarde : $Backup" }

Write-Host "Deploiement termine." -ForegroundColor Green
Write-Host "Page districts : https://asnk-scouts-nord-kivu.rigobertmumbere2018.workers.dev/districts"
