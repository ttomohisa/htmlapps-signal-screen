param(
  [string]$OutputDir = ""
)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$config = Get-Content -Raw -Encoding UTF8 (Join-Path $root "app.config.json") | ConvertFrom-Json
$version = [string]$config.version
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw "Expected an app.config.json SemVer version." }

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $root "dist\release-package"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir = Join-Path $root $OutputDir
}
$destination = [System.IO.Path]::GetFullPath($OutputDir)
New-Item -ItemType Directory -Force -Path $destination | Out-Null

$stem = "htmlapps-signal-screen-v$version"
$regular = Join-Path $destination "$stem.html"
$compressed = Join-Path $destination "$stem.self-extract.html"
$licenseFile = Join-Path $destination "LICENSE"
$noticesFile = Join-Path $destination "THIRD_PARTY_NOTICES.md"

$inputs = @(
  @{ Source = "dist/index.html"; Target = $regular },
  @{ Source = "dist/index.self-extract.html"; Target = $compressed },
  @{ Source = "LICENSE"; Target = $licenseFile },
  @{ Source = "THIRD_PARTY_NOTICES.md"; Target = $noticesFile },
  @{ Source = "assets/screenshot.png"; Target = (Join-Path $destination "screenshot-ja.png") },
  @{ Source = "assets/screenshot-en.png"; Target = (Join-Path $destination "screenshot-en.png") },
  @{ Source = "assets/screenshot-mobile.png"; Target = (Join-Path $destination "screenshot-mobile-ja.png") }
)

foreach ($file in $inputs) {
  $source = Join-Path $root $file.Source
  if (-not (Test-Path -LiteralPath $source)) { throw "Release input is missing: $($file.Source)" }
  Copy-Item -LiteralPath $source -Destination $file.Target -Force
}

$zip = Join-Path $destination "$stem.zip"
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -LiteralPath @($regular,$compressed,$licenseFile,$noticesFile) -DestinationPath $zip -CompressionLevel Optimal

$archive = [System.IO.Compression.ZipFile]::OpenRead($zip)
try {
  $names = @($archive.Entries | ForEach-Object { $_.FullName })
  $expected = @("$stem.html","$stem.self-extract.html","LICENSE","THIRD_PARTY_NOTICES.md")
  foreach ($name in $expected) {
    if ($names -notcontains $name) { throw "Release ZIP does not contain $name. Contents: $($names -join ', ')" }
  }
  if ($names.Count -ne $expected.Count) { throw "Release ZIP has unexpected extra entries." }
} finally {
  $archive.Dispose()
}

$files = @($inputs | ForEach-Object { $_.Target }) + @($zip)
$checksums = @(
  foreach ($path in $files) {
    $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $(Split-Path -Leaf $path)"
  }
)
$checksumFile = Join-Path $destination "SHA256SUMS.txt"
[System.IO.File]::WriteAllLines($checksumFile,[string[]]$checksums,[System.Text.UTF8Encoding]::new($false))
if ($checksums.Count -ne $files.Count) { throw "Release checksums are incomplete." }
Write-Host "[OK] Packaged Signal Screen v$version into $destination"
