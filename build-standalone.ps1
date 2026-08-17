param(
  [switch]$ForceDownload,
  [switch]$SkipSelfExtract,
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$TemplatePath = Join-Path $Root "src\index.template.html"
$AppConfigPath = Join-Path $Root "app.config.json"
$DependenciesPath = Join-Path $Root "dependencies.json"
$QrLibraryPath = Join-Path $Root "src\vendor\qrcode.js"
$VerifyPath = Join-Path $Root "scripts\verify-standalone.ps1"
$SelfExtractBuilderPath = Join-Path $Root "scripts\build-self-extract.ps1"
$DistRoot = Join-Path $Root "dist"

function Read-Utf8([string]$Path) {
  if (-not (Test-Path $Path)) { throw "Required file not found: $Path" }
  return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function ConvertTo-SafeJson([object]$Value, [int]$Depth = 30) {
  return ($Value | ConvertTo-Json -Compress -Depth $Depth).Replace("<", "\u003c").Replace(">", "\u003e").Replace("&", "\u0026")
}

$appConfig = (Read-Utf8 $AppConfigPath) | ConvertFrom-Json
$dependencies = (Read-Utf8 $DependenciesPath) | ConvertFrom-Json
if (@($dependencies.dependencies).Count -ne 0) {
  throw "Signal Screen currently expects dependencies.json to contain no third-party packages."
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $Root ([string]$appConfig.build.output)
} elseif (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
  $OutputPath = Join-Path $Root $OutputPath
}

$manifest = [ordered]@{
  schemaVersion = 1
  builder = "single-html-app-template/1.0"
  generatedAtUtc = [DateTime]::UtcNow.ToString("o")
  app = [ordered]@{
    name = [string]$appConfig.name
    slug = [string]$appConfig.slug
    version = [string]$appConfig.version
  }
  dependencies = @()
}

$bundle = [ordered]@{ schemaVersion = 1; dependencies = [ordered]@{} }
$template = Read-Utf8 $TemplatePath
$qrLibrary = Read-Utf8 $QrLibraryPath
$bundleJson = ConvertTo-SafeJson $bundle 10
$replacements = [ordered]@{
  "__QR_CODE_JS__" = $qrLibrary
  "__APP_CONFIG_JSON__" = ConvertTo-SafeJson $appConfig 20
  "__BUILD_MANIFEST_JSON__" = ConvertTo-SafeJson $manifest 20
  "__EMBEDDED_ASSET_BUNDLE_BASE64__" = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($bundleJson))
}

foreach ($entry in $replacements.GetEnumerator()) {
  $count = ([regex]::Matches($template, [regex]::Escape($entry.Key))).Count
  if ($count -ne 1) { throw "Template placeholder $($entry.Key) must occur exactly once; found $count." }
  $template = $template.Replace($entry.Key, [string]$entry.Value)
}

$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
[System.IO.File]::WriteAllText($OutputPath, $template, (New-Object System.Text.UTF8Encoding($false)))
[System.IO.File]::WriteAllText((Join-Path $outputDirectory "dependency-manifest.json"), ($manifest | ConvertTo-Json -Depth 20), (New-Object System.Text.UTF8Encoding($false)))
[System.IO.File]::WriteAllText((Join-Path $outputDirectory ".nojekyll"), "", (New-Object System.Text.UTF8Encoding($false)))

& $VerifyPath -Path $OutputPath -RequireNetworkBlock ([bool]$appConfig.build.blockRuntimeNetwork)

if (-not $SkipSelfExtract -and [bool]$appConfig.build.selfExtract.enabled) {
  $selfPath = Join-Path $Root ([string]$appConfig.build.selfExtract.output)
  & $SelfExtractBuilderPath -InputPath $OutputPath -OutputPath $selfPath -AppName ([string]$appConfig.name) -AppNameJa ([string]$appConfig.nameJa)
}

Write-Host "[OK] Built Signal Screen $($appConfig.version)" -ForegroundColor Green
