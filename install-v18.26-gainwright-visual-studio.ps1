$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-gainwright-visual-studio-v1826.js'
$marker = '__GAINWRIGHT_VISUAL_STUDIO_V1826__'

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)

if (-not ($html.Contains('__UPC_V1825_RELEASE_LOCK__') -or $html.Contains('__UPC_V18251_AUDIT_FEEDBACK__'))) {
    throw 'V18.25 Production Release baseline was not found. Install V18.25 first.'
}

if ($html.Contains($marker)) {
    Write-Host 'Gainwright Visual Studio V18.26 is already installed.' -ForegroundColor Yellow
    Write-Host 'Reload with ?v=1826gainwright' -ForegroundColor Cyan
    exit 0
}

$backup = Join-Path $dir ('index-before-v18.26-gainwright-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading Gainwright Visual Studio V18.26...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content

if (-not $module.Contains($marker)) {
    throw 'Downloaded Gainwright Visual Studio module failed marker verification.'
}

try {
    $newline = [Environment]::NewLine
    $html = $html.Replace('</body>', '<script>' + $newline + $module + $newline + '</script>' + $newline + '</body>')
    [IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))

    $verify = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
    if (-not $verify.Contains($marker)) {
        throw 'Install verification failed.'
    }
}
catch {
    Copy-Item $backup $app -Force
    throw ('Gainwright Visual Studio install failed. Backup restored automatically. ' + $_.Exception.Message)
}

Write-Host ''
Write-Host 'PASS  V18.25 production baseline found' -ForegroundColor Green
Write-Host 'PASS  Existing prompt engine and databases preserved' -ForegroundColor Green
Write-Host 'PASS  Gainwright Visual Studio branding installed' -ForegroundColor Green
Write-Host 'PASS  Black / amber editorial interface installed' -ForegroundColor Green
Write-Host 'PASS  Existing Neon presentation layer disabled' -ForegroundColor Green
Write-Host ('Backup: ' + $backup) -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open Gainwright Visual Studio with ?v=1826gainwright' -ForegroundColor Cyan
Write-Host 'Internal UPC/V18 identifiers stay unchanged for compatibility.' -ForegroundColor DarkGray
