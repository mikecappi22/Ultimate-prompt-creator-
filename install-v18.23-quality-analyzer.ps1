$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-prompt-quality-analyzer-v1823.js'

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)

if ($html.Contains('__UPC_V1823_ANALYZER__')) {
    Write-Host 'V18.23 Prompt Quality Analyzer is already installed.' -ForegroundColor Yellow
    exit 0
}

if (-not $html.Contains('__UPC_V1820_COMPOSER__')) {
    throw 'V18.20 Final Prompt Composer 2.0 is required before installing V18.23.'
}

if (-not $html.Contains('__UPC_V1822_VARIATIONS__')) {
    throw 'V18.22 Controlled Variations / Reference Identity Lock is required before installing V18.23.'
}

$backup = Join-Path $dir ('index-before-v18.23-quality-analyzer-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading V18.23 Prompt Quality Analyzer...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content

if (-not $module.Contains('__UPC_V1823_ANALYZER__')) {
    throw 'Downloaded V18.23 module failed marker verification.'
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace('</body>', $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains('__UPC_V1823_ANALYZER__')) {
    Copy-Item $backup $app -Force
    throw 'Install verification failed. The backup was restored automatically.'
}

Write-Host ''
Write-Host 'PASS  V18.20 Final Prompt Composer found' -ForegroundColor Green
Write-Host 'PASS  V18.22 Reference Identity Lock found' -ForegroundColor Green
Write-Host 'PASS  V18.23 Prompt Quality Analyzer installed' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open UPC with ?v=1823analyzer' -ForegroundColor Cyan
Write-Host 'Create > Step 8 now includes the Prompt Quality Analyzer.' -ForegroundColor Cyan
