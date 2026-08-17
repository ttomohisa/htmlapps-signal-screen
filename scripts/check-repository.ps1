param([switch]$ForceDownload)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$required = @(
  "AGENTS.md","APP_SPEC.md","app.config.json","dependencies.json","src\index.template.html",
  "build-standalone.ps1","src\vendor\qrcode.js","scripts\build-self-extract.ps1","scripts\verify-standalone.ps1",
  "scripts\verify-self-extract.ps1","README.md","README.ja.md","LICENSE","THIRD_PARTY_NOTICES.md",
  "schemas\app-config.schema.json","schemas\dependencies.schema.json"
)
foreach ($relative in $required) { if (-not (Test-Path (Join-Path $Root $relative))) { throw "Required repository file is missing: $relative" } }

$builderBytes = [System.IO.File]::ReadAllBytes((Join-Path $Root "scripts\build-self-extract.ps1"))
foreach ($byte in $builderBytes) { if ($byte -gt 0x7f) { throw "scripts\build-self-extract.ps1 must contain ASCII text only so Windows PowerShell 5.1 cannot corrupt loader text." } }

& (Join-Path $Root "build-standalone.ps1")
$html = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "dist\index.html")
$requiredContent = @("Signal Screen","connect-src 'none'","stage-surface","flashConfirmDialog","prefers-reduced-motion","localStorage","SignalQRCode","qrModeButton","stageQr")
foreach ($item in $requiredContent) { if (-not $html.Contains($item)) { throw "Required content missing: $item" } }
Write-Host "[OK] Repository check passed." -ForegroundColor Green
