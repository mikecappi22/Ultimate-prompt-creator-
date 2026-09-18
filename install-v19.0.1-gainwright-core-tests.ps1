$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v19-gainwright-core-tests-v1901.js'
$coreMarker = '__GAINWRIGHT_CORE_V190__'
$marker = '__GAINWRIGHT_CORE_TESTS_V1901__'

if (-not (Test-Path $app)) { throw "App not found at $app" }

$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)

if (-not $html.Contains($coreMarker)) {
    throw 'Gainwright Core V19.0 must be installed first.'
}

if ($html.Contains($marker)) {
    Write-Host 'Gainwright Core Tests V19.0.1 are already installed.' -ForegroundColor Yellow
    Write-Host 'Reload with ?v=1901tests and use CORE TESTS.' -ForegroundColor Cyan
    exit 0
}

$backup = Join-Path $dir ('index-before-v19.0.1-core-tests-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

try {
    Write-Host 'Downloading Gainwright Core Test Suite V19.0.1...' -ForegroundColor Cyan
    $module = (Invoke-WebRequest $url -UseBasicParsing).Content
    if (-not $module.Contains($marker)) { throw 'Test module marker verification failed.' }

    $nl = [Environment]::NewLine
    $html = $html.Replace('</body>', '<script>' + $nl + $module + $nl + '</script>' + $nl + '</body>')
    [IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))

    $verify = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
    if (-not $verify.Contains($marker)) { throw 'Test suite install verification failed.' }
}
catch {
    Copy-Item $backup $app -Force
    throw ('V19.0.1 test suite install failed. Backup restored. ' + $_.Exception.Message)
}

Write-Host ''
Write-Host 'PASS  Gainwright Core V19.0 found' -ForegroundColor Green
Write-Host 'PASS  Gainwright Core Test Suite V19.0.1 installed' -ForegroundColor Green
Write-Host 'PASS  No user Vault data modified by installer' -ForegroundColor Green
Write-Host ('Backup: ' + $backup) -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Reload with ?v=1901tests' -ForegroundColor Cyan
Write-Host 'Then click CORE TESTS -> RUN FULL CORE TEST.' -ForegroundColor Cyan
