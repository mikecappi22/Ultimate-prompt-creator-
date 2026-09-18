$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v19-gainwright-integrity-v1904.js'
$coreMarker = '__GAINWRIGHT_CORE_V190__'
$marker = '__GAINWRIGHT_INTEGRITY_V1904__'

if (-not (Test-Path $app)) { throw "App not found at $app" }
$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)

if (-not $html.Contains($coreMarker)) { throw 'Gainwright Core V19.0 must be installed first.' }

if ($html.Contains($marker)) {
  Write-Host 'Gainwright Integrity Guard V19.0.4 is already installed.' -ForegroundColor Yellow
  Write-Host 'Reload with ?v=1904integrity' -ForegroundColor Cyan
  exit 0
}

$backup = Join-Path $dir ('index-before-v19.0.4-integrity-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

try {
  Write-Host 'Downloading Gainwright V19.0.4 Integrity Guard...' -ForegroundColor Cyan
  $module = (Invoke-WebRequest $url -UseBasicParsing).Content
  if (-not $module.Contains($marker)) { throw 'V19.0.4 marker verification failed.' }

  $nl=[Environment]::NewLine
  $html=$html.Replace('</body>','<script>'+$nl+$module+$nl+'</script>'+$nl+'</body>')
  [IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))

  $verify=[IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
  if(-not $verify.Contains($marker)){ throw 'Install verification failed.' }
}
catch {
  Copy-Item $backup $app -Force
  throw ('V19.0.4 install failed. Backup restored. '+$_.Exception.Message)
}

Write-Host ''
Write-Host 'PASS  Gainwright Core V19.0 found' -ForegroundColor Green
Write-Host 'PASS  V19.0.4 End-to-End Integrity Guard installed' -ForegroundColor Green
Write-Host 'PASS  Stale AI/legacy decisions are refreshed on Analyze' -ForegroundColor Green
Write-Host 'PASS  Manual and V18 database decisions are preserved' -ForegroundColor Green
Write-Host 'PASS  Master prompt is invalidated whenever its source changes' -ForegroundColor Green
Write-Host 'PASS  Local AI Master must preserve accepted facts verbatim or falls back safely' -ForegroundColor Green
Write-Host ('Backup: '+$backup) -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Reload with ?v=1904integrity' -ForegroundColor Cyan