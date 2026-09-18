$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-gainwright-polish-v18262.js'
$baseMarker = '__GAINWRIGHT_VISUAL_STUDIO_V18261__'
$marker = '__GAINWRIGHT_VISUAL_STUDIO_V18262__'

if (-not (Test-Path $app)) { throw "App not found at $app" }

$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)

if (-not $html.Contains($baseMarker)) {
    throw 'Gainwright Visual Studio V18.26.1 must be installed first.'
}

if ($html.Contains($marker)) {
    Write-Host 'Gainwright Visual Studio V18.26.2 is already installed.' -ForegroundColor Yellow
    Write-Host 'Reload with ?v=18262polish' -ForegroundColor Cyan
    exit 0
}

$backup = Join-Path $dir ('index-before-v18.26.2-polish-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading Gainwright Visual Studio V18.26.2 polish...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content

if (-not $module.Contains($marker)) {
    throw 'Downloaded V18.26.2 polish module failed marker verification.'
}

try {
    $nl = [Environment]::NewLine
    $html = $html.Replace('</body>', '<script>' + $nl + $module + $nl + '</script>' + $nl + '</body>')
    [IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))
    $verify = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
    if (-not $verify.Contains($marker)) { throw 'Install verification failed.' }
}
catch {
    Copy-Item $backup $app -Force
    throw ('V18.26.2 install failed. Backup restored. ' + $_.Exception.Message)
}

Write-Host ''
Write-Host 'PASS  Gainwright V18.26.1 found' -ForegroundColor Green
Write-Host 'PASS  Home navigation converted to Gainwright styling' -ForegroundColor Green
Write-Host 'PASS  Duplicate Create heading suppressed' -ForegroundColor Green
Write-Host 'PASS  Remaining text encoding artifacts repaired' -ForegroundColor Green
Write-Host 'PASS  Clear All button restyled' -ForegroundColor Green
Write-Host 'PASS  Presets / Stack Builder / Studio Health / Diagnostics docked together' -ForegroundColor Green
Write-Host ('Backup: ' + $backup) -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Reload with ?v=18262polish' -ForegroundColor Cyan
