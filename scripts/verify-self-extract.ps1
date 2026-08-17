param(
  [Parameter(Mandatory = $true)]
  [string]$Path,
  [string]$ExpectedSourcePath = ""
)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-FaviconHref([string]$Html) {
  $links = [regex]::Matches($Html, '<link\b[^>]*>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  foreach ($match in $links) {
    $tag = $match.Value
    $rel = [regex]::Match($tag, '\brel\s*=\s*(["''])(?<rel>.*?)\1', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if (-not $rel.Success) { continue }
    if (-not (@($rel.Groups["rel"].Value -split '\s+') | Where-Object { $_.Equals("icon",[StringComparison]::OrdinalIgnoreCase) })) { continue }
    $href = [regex]::Match($tag, '\bhref\s*=\s*(["''])(?<href>.*?)\1', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($href.Success) { return [System.Net.WebUtility]::HtmlDecode($href.Groups["href"].Value) }
  }
  return ""
}

if (-not (Test-Path $Path)) { throw "Self-extracting HTML was not found: $Path" }
$wrapperBytes = [System.IO.File]::ReadAllBytes($Path)
foreach ($byte in $wrapperBytes) { if ($byte -gt 0x7f) { throw "The self-extracting loader must be ASCII-only to avoid Windows PowerShell 5.1 source-encoding regressions." } }
$html = [System.Text.Encoding]::ASCII.GetString($wrapperBytes)
if ($html -notmatch "connect-src\s+'none'") { throw "connect-src 'none' is missing" }
if ([string]::IsNullOrWhiteSpace((Get-FaviconHref $html))) { throw "The inherited favicon is missing" }

$payloadMatch = [regex]::Match($html, '<script\s+id=["'']self-extract-payload["'']\s+type=["'']application/octet-stream["'']>(?<payload>[A-Za-z0-9+/=\r\n]+)</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if (-not $payloadMatch.Success) { throw "The embedded Base64 payload could not be parsed." }
$compressedBytes = [Convert]::FromBase64String(($payloadMatch.Groups["payload"].Value -replace '\s+',''))
$input = [System.IO.MemoryStream]::new($compressedBytes); $output = [System.IO.MemoryStream]::new()
try {
  $gzip = [System.IO.Compression.GZipStream]::new($input,[System.IO.Compression.CompressionMode]::Decompress)
  try { $gzip.CopyTo($output) } finally { $gzip.Dispose() }
  $restoredBytes = $output.ToArray()
} finally { $output.Dispose(); $input.Dispose() }

if (-not [string]::IsNullOrWhiteSpace($ExpectedSourcePath)) {
  $expectedBytes = [System.IO.File]::ReadAllBytes($ExpectedSourcePath)
  if ($expectedBytes.Length -ne $restoredBytes.Length) { throw "Restored payload length does not match the source HTML." }
  for ($i=0; $i -lt $expectedBytes.Length; $i+=1) { if ($expectedBytes[$i] -ne $restoredBytes[$i]) { throw "Restored payload differs from the source HTML at byte $i." } }
  $sourceFavicon = Get-FaviconHref ([System.Text.Encoding]::UTF8.GetString($expectedBytes))
  $wrapperFavicon = Get-FaviconHref $html
  if (-not $sourceFavicon.Equals($wrapperFavicon,[StringComparison]::Ordinal)) { throw "The self-extracting loader favicon does not match the source HTML favicon." }
}
Write-Host "[OK] Self-extract verification passed: $Path" -ForegroundColor Green
