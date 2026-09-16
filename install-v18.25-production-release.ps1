$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-production-release-lock-v1825.js'
$releaseDir = Join-Path $dir 'ProductionReleases\V18.25'

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)

if ($html.Contains('__UPC_V1825_RELEASE_LOCK__')) {
    Write-Host 'V18.25 Production Release Lock is already installed.' -ForegroundColor Yellow
    if (Test-Path (Join-Path $releaseDir 'index-v18.25-production.html')) {
        Write-Host "Production snapshot: $releaseDir" -ForegroundColor DarkGray
    }
    exit 0
}

$requiredMarkers = @(
    '__UPC_V1816_CONSTRAINTS__',
    '__UPC_V1817_AUDIT__',
    '__UPC_V1818_STACK__',
    '__UPC_V1819_PRESETS__',
    '__UPC_V1820_COMPOSER__',
    '__UPC_V1821_RECIPES__',
    '__UPC_V1822_VARIATIONS__',
    '__UPC_V1823_ANALYZER__',
    '__UPC_V1824_BACKUP__'
)
foreach ($marker in $requiredMarkers) {
    if (-not $html.Contains($marker)) {
        throw "Required release marker missing: $marker"
    }
}

$preBackup = Join-Path $dir ('index-before-v18.25-production-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $preBackup -Force

Write-Host 'Downloading V18.25 Production Release Lock...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content
if (-not $module.Contains('__UPC_V1825_RELEASE_LOCK__')) {
    throw 'Downloaded V18.25 module failed marker verification.'
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace('</body>', $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains('__UPC_V1825_RELEASE_LOCK__')) {
    Copy-Item $preBackup $app -Force
    throw 'Install verification failed. The pre-install backup was restored automatically.'
}

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
$releaseFile = Join-Path $releaseDir 'index-v18.25-production.html'
Copy-Item $app $releaseFile -Force
$sha = (Get-FileHash $releaseFile -Algorithm SHA256).Hash
$created = (Get-Date).ToString('o')

$manifest = [ordered]@{
    release = 'UPC-V18.25-PRODUCTION'
    version = '18.25'
    createdAt = $created
    source = $app
    snapshot = $releaseFile
    sha256 = $sha
    bridgeChanged = $false
    bridgeNote = 'V18.25 does not modify the v1188 bridge, scheduled tasks, Tailscale, or Ollama.'
    restoreScript = (Join-Path $releaseDir 'restore-v18.25-production.ps1')
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $releaseDir 'release-manifest-v18.25.json') -Encoding UTF8
"$sha  index-v18.25-production.html" | Set-Content (Join-Path $releaseDir 'index-v18.25-production.sha256.txt') -Encoding ASCII

$restoreScript = @'
$ErrorActionPreference = 'Stop'
$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$releaseDir = Join-Path $dir 'ProductionReleases\V18.25'
$snapshot = Join-Path $releaseDir 'index-v18.25-production.html'
$manifestPath = Join-Path $releaseDir 'release-manifest-v18.25.json'
if (-not (Test-Path $snapshot)) { throw "V18.25 production snapshot not found: $snapshot" }
if (-not (Test-Path $manifestPath)) { throw "V18.25 release manifest not found: $manifestPath" }
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$actual = (Get-FileHash $snapshot -Algorithm SHA256).Hash
if ($actual -ne $manifest.sha256) { throw 'Production snapshot checksum mismatch. Restore aborted.' }
if (Test-Path $app) {
    $backup = Join-Path $dir ('index-before-restore-v18.25-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
    Copy-Item $app $backup -Force
    Write-Host "Current app backed up: $backup" -ForegroundColor DarkGray
}
Copy-Item $snapshot $app -Force
$restored = (Get-FileHash $app -Algorithm SHA256).Hash
if ($restored -ne $manifest.sha256) { throw 'Restored index checksum mismatch.' }
Write-Host 'PASS  UPC V18.25 production snapshot restored' -ForegroundColor Green
Write-Host "SHA256: $restored" -ForegroundColor Green
'@
Set-Content (Join-Path $releaseDir 'restore-v18.25-production.ps1') -Value $restoreScript -Encoding UTF8

$finalSha = (Get-FileHash $releaseFile -Algorithm SHA256).Hash
if ($finalSha -ne $sha) {
    Copy-Item $preBackup $app -Force
    throw 'Production snapshot checksum changed unexpectedly. Original app backup restored.'
}

Write-Host ''
Write-Host 'PASS  V18.24 Workspace Backup found' -ForegroundColor Green
Write-Host 'PASS  V18.25 Production Release Lock installed' -ForegroundColor Green
Write-Host 'PASS  Production snapshot created' -ForegroundColor Green
Write-Host "PASS  SHA256 $sha" -ForegroundColor Green
Write-Host "Snapshot: $releaseFile" -ForegroundColor DarkGray
Write-Host "Manifest: $(Join-Path $releaseDir 'release-manifest-v18.25.json')" -ForegroundColor DarkGray
Write-Host "Restore:  $(Join-Path $releaseDir 'restore-v18.25-production.ps1')" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open UPC with ?v=1825production' -ForegroundColor Cyan
Write-Host 'Run the V18.25 Production Audit in Create > Step 8.' -ForegroundColor Cyan
