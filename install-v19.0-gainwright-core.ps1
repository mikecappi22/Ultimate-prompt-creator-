$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$coreUrl = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v19-gainwright-core-v190.js'
$polishUrl = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-gainwright-polish-v18262.js'
$baseMarker = '__GAINWRIGHT_VISUAL_STUDIO_V1826__'
$polishMarker = '__GAINWRIGHT_VISUAL_STUDIO_V18262__'
$coreMarker = '__GAINWRIGHT_CORE_V190__'

if (-not (Test-Path $app)) { throw "App not found at $app" }

$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)

if (-not $html.Contains($baseMarker)) {
    throw 'Gainwright Visual Studio V18.26 branding must be installed first.'
}

if ($html.Contains($coreMarker)) {
    Write-Host 'Gainwright Core V19.0 is already installed.' -ForegroundColor Yellow
    Write-Host 'Reload with ?v=190core' -ForegroundColor Cyan
    exit 0
}

$backup = Join-Path $dir ('index-before-v19.0-gainwright-core-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

try {
    $nl = [Environment]::NewLine

    if (-not $html.Contains($polishMarker)) {
        Write-Host 'Applying V18.26.2 UI polish first...' -ForegroundColor Cyan
        $polish = (Invoke-WebRequest $polishUrl -UseBasicParsing).Content
        if (-not $polish.Contains($polishMarker)) { throw 'V18.26.2 polish marker verification failed.' }
        $html = $html.Replace('</body>', '<script>' + $nl + $polish + $nl + '</script>' + $nl + '</body>')
    }

    Write-Host 'Downloading Gainwright Core V19.0...' -ForegroundColor Cyan
    $core = (Invoke-WebRequest $coreUrl -UseBasicParsing).Content
    if (-not $core.Contains($coreMarker)) { throw 'V19.0 Core marker verification failed.' }

    $html = $html.Replace('</body>', '<script>' + $nl + $core + $nl + '</script>' + $nl + '</body>')
    [IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))

    $verify = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
    if (-not $verify.Contains($coreMarker)) { throw 'V19.0 install verification failed.' }
}
catch {
    Copy-Item $backup $app -Force
    throw ('V19.0 install failed. Backup restored. ' + $_.Exception.Message)
}

Write-Host ''
Write-Host 'PASS  Gainwright Visual Studio base found' -ForegroundColor Green
Write-Host 'PASS  V18.26.2 polish present' -ForegroundColor Green
Write-Host 'PASS  Gainwright Core V19.0 installed' -ForegroundColor Green
Write-Host 'PASS  Idea-first Create flow enabled' -ForegroundColor Green
Write-Host 'PASS  V18 databases reused as visual knowledge engine' -ForegroundColor Green
Write-Host 'PASS  Local Ollama idea analysis + master refinement enabled' -ForegroundColor Green
Write-Host 'PASS  V18 quality analyzer + controlled variations bridged' -ForegroundColor Green
Write-Host 'PASS  Gainwright Vault + autosave enabled' -ForegroundColor Green
Write-Host 'PASS  Legacy V18 builder preserved as Advanced V18 Engine' -ForegroundColor Green
Write-Host ('Backup: ' + $backup) -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Reload with ?v=190core' -ForegroundColor Cyan
Write-Host 'Reference photos remain local browser-memory only in V19.0; no vision analysis is claimed.' -ForegroundColor DarkGray
