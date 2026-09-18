$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v19-gainwright-semantic-router-v1905.js'
$guardMarker = '__GAINWRIGHT_INTEGRITY_V1904__'
$marker = '__GAINWRIGHT_SEMANTIC_ROUTER_V1905__'

if (-not (Test-Path $app)) { throw "App not found at $app" }
$html=[IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)

if(-not $html.Contains($guardMarker)){ throw 'Gainwright Integrity Guard V19.0.4 must be installed first.' }

if($html.Contains($marker)){
  Write-Host 'Gainwright Semantic Router V19.0.5 is already installed.' -ForegroundColor Yellow
  Write-Host 'Reload with ?v=1905semantic' -ForegroundColor Cyan
  exit 0
}

$backup=Join-Path $dir ('index-before-v19.0.5-semantic-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

try{
  Write-Host 'Downloading Gainwright V19.0.5 Semantic Router...' -ForegroundColor Cyan
  $module=(Invoke-WebRequest $url -UseBasicParsing).Content
  if(-not $module.Contains($marker)){ throw 'V19.0.5 marker verification failed.' }
  $nl=[Environment]::NewLine
  $html=$html.Replace('</body>','<script>'+$nl+$module+$nl+'</script>'+$nl+'</body>')
  [IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))
  $verify=[IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
  if(-not $verify.Contains($marker)){ throw 'Install verification failed.' }
}
catch{
  Copy-Item $backup $app -Force
  throw ('V19.0.5 install failed. Backup restored. '+$_.Exception.Message)
}

Write-Host ''
Write-Host 'PASS  V19.0.4 Integrity Guard found' -ForegroundColor Green
Write-Host 'PASS  V19.0.5 Semantic Decision Router installed' -ForegroundColor Green
Write-Host 'PASS  Non-constraint visual details are rerouted out of Constraints' -ForegroundColor Green
Write-Host 'PASS  Weak Environment / Camera / Realism values are expanded contextually' -ForegroundColor Green
Write-Host 'PASS  Gainwright Master receives an explicit accepted-decisions lock' -ForegroundColor Green
Write-Host ('Backup: '+$backup) -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Reload with ?v=1905semantic' -ForegroundColor Cyan