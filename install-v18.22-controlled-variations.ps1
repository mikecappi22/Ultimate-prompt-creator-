$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-controlled-variations-reference-lock-v1822.js'

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)

if ($html.Contains('__UPC_V1822_VARIATIONS__')) {
    Write-Host 'V18.22 Controlled Variations + Reference Identity Lock is already installed.' -ForegroundColor Yellow
    exit 0
}

if (-not $html.Contains('__UPC_V1820_COMPOSER__')) {
    throw 'V18.20 Final Prompt Composer 2.0 is required before installing V18.22.'
}

if (-not $html.Contains('__UPC_V1821_RECIPES__')) {
    throw 'V18.21 Saved Recipes / Master Stacks is required before installing V18.22.'
}

$backup = Join-Path $dir ('index-before-v18.22-controlled-variations-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading V18.22 Controlled Variations + Reference Identity Lock...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content

if (-not $module.Contains('__UPC_V1822_VARIATIONS__')) {
    throw 'Downloaded V18.22 module failed marker verification.'
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace('</body>', $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains('__UPC_V1822_VARIATIONS__')) {
    Copy-Item $backup $app -Force
    throw 'Install verification failed. The backup was restored automatically.'
}

Write-Host ''
Write-Host 'PASS  V18.20 Final Prompt Composer found' -ForegroundColor Green
Write-Host 'PASS  V18.21 Saved Recipes found' -ForegroundColor Green
Write-Host 'PASS  V18.22 Controlled Variations installed' -ForegroundColor Green
Write-Host 'PASS  Reference Identity Lock enabled for every composed prompt' -ForegroundColor Green
Write-Host 'PASS  Create subject selector hidden (Subject Vault data preserved)' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open UPC with ?v=1822variations' -ForegroundColor Cyan
Write-Host 'Create now starts with Reference Identity Lock instead of Subject selection.' -ForegroundColor Cyan
