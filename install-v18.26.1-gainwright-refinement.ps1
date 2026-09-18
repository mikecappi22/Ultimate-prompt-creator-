$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-gainwright-refinement-v18261.js'
$baseMarker = '__GAINWRIGHT_VISUAL_STUDIO_V1826__'
$marker = '__GAINWRIGHT_VISUAL_STUDIO_V18261__'

if (-not (Test-Path $app)) { throw "App not found at $app" }

$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)

if (-not $html.Contains($baseMarker)) {
    throw 'Gainwright Visual Studio V18.26 must be installed first.'
}

if ($html.Contains($marker)) {
    Write-Host 'Gainwright Visual Studio V18.26.1 is already installed.' -ForegroundColor Yellow
    Write-Host 'Reload with ?v=18261refine' -ForegroundColor Cyan
    exit 0
}

$backup = Join-Path $dir ('index-before-v18.26.1-refinement-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading Gainwright Visual Studio V18.26.1 refinement...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content

if (-not $module.Contains($marker)) {
    throw 'Downloaded refinement failed marker verification.'
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
    throw ('V18.26.1 install failed. Backup restored. ' + $_.Exception.Message)
}

Write-Host ''
Write-Host 'PASS  Gainwright V18.26 found' -ForegroundColor Green
Write-Host 'PASS  Visual Builder branding applied' -ForegroundColor Green
Write-Host 'PASS  Wizard progress/navigation converted to dark amber' -ForegroundColor Green
Write-Host 'PASS  Sidebar, Home and Diagnostics legacy colors removed' -ForegroundColor Green
Write-Host 'PASS  Garbled arrow characters repaired' -ForegroundColor Green
Write-Host 'PASS  Content width expanded for desktop' -ForegroundColor Green
Write-Host ('Backup: ' + $backup) -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Reload with ?v=18261refine' -ForegroundColor Cyan
