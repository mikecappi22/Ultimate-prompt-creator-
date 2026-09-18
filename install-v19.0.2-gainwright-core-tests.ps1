$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v19-gainwright-core-tests-v1902.js'
$coreMarker = '__GAINWRIGHT_CORE_V190__'
$marker = '__GAINWRIGHT_CORE_TESTS_V1902__'

if (-not (Test-Path $app)) { throw "App not found at $app" }
$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
if (-not $html.Contains($coreMarker)) { throw 'Gainwright Core V19.0 must be installed first.' }
if ($html.Contains($marker)) {
  Write-Host 'Gainwright Core Tests V19.0.2 are already installed.' -ForegroundColor Yellow
  Write-Host 'Reload with ?v=1902tests and run CORE TESTS.' -ForegroundColor Cyan
  exit 0
}
$backup = Join-Path $dir ('index-before-v19.0.2-core-tests-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force
try {
  $module = (Invoke-WebRequest $url -UseBasicParsing).Content
  if (-not $module.Contains($marker)) { throw 'V19.0.2 test module marker verification failed.' }
  $nl = [Environment]::NewLine
  $html = $html.Replace('</body>', '<script>' + $nl + $module + $nl + '</script>' + $nl + '</body>')
  [IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))
  $verify=[IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
  if(-not $verify.Contains($marker)){ throw 'Install verification failed.' }
}
catch {
  Copy-Item $backup $app -Force
  throw ('V19.0.2 test install failed. Backup restored. ' + $_.Exception.Message)
}
Write-Host ''
Write-Host 'PASS  Gainwright Core V19.0 found' -ForegroundColor Green
Write-Host 'PASS  Runtime test suite updated to V19.0.2' -ForegroundColor Green
Write-Host 'PASS  Canonical V18 database now correctly treated as optional fallback' -ForegroundColor Green
Write-Host ('Backup: ' + $backup) -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Reload with ?v=1902tests and run CORE TESTS again.' -ForegroundColor Cyan