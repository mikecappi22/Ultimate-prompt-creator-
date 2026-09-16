$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-category-lighting-v1814.js'

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)

if ($html.Contains('__UPC_V1814_LIGHTING__')) {
    Write-Host 'V18.14 Lighting is already installed.' -ForegroundColor Yellow
    exit 0
}

if (-not ($html.Contains('__UPC_V181_CLEAN_DB__') -or $html.Contains('__UPC_V18_CLEAN__'))) {
    throw 'V18 clean core marker was not found.'
}

if ($html.Contains('__UPC_LIVE_DB162__') -or $html.Contains('__UPC_CATALOG163__') -or $html.Contains('__UPC_CATEGORY174__')) {
    throw 'Legacy search markers detected. This lighting installer requires the clean V18 build.'
}

$backup = Join-Path $dir ('index-before-v18.14-lighting-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading V18.14 Lighting...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content

if (-not $module.Contains('__UPC_V1814_LIGHTING__')) {
    throw 'Downloaded lighting module failed marker verification.'
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace('</body>', $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains('__UPC_V1814_LIGHTING__')) {
    Copy-Item $backup $app -Force
    throw 'Install verification failed. The backup was restored automatically.'
}

Write-Host ''
Write-Host 'PASS  V18 clean core found' -ForegroundColor Green
Write-Host 'PASS  V18.14 Lighting installed' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open the app with ?v=1814lighting and search Lighting for:' -ForegroundColor Cyan
Write-Host '  window'
Write-Host '  golden'
Write-Host '  Rembrandt'
Write-Host '  neon'
Write-Host '  rim'
