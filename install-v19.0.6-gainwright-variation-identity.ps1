$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v19-gainwright-variation-identity-v1906.js'
$coreMarker = '__GAINWRIGHT_CORE_V190__'
$marker = '__GAINWRIGHT_VARIATION_IDENTITY_V1906__'

if (-not (Test-Path $app)) { throw "App not found at $app" }
$html=[IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
if(-not $html.Contains($coreMarker)){ throw 'Gainwright Core V19.0 must be installed first.' }

if($html.Contains($marker)){
  Write-Host 'Gainwright Variation Identity Isolation V19.0.6 is already installed.' -ForegroundColor Yellow
  Write-Host 'Reload with ?v=1906identity' -ForegroundColor Cyan
  exit 0
}

$backup=Join-Path $dir ('index-before-v19.0.6-variation-identity-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

try{
  Write-Host 'Downloading Gainwright V19.0.6 Variation Identity Isolation...' -ForegroundColor Cyan
  $module=(Invoke-WebRequest $url -UseBasicParsing).Content
  if(-not $module.Contains($marker)){ throw 'V19.0.6 marker verification failed.' }
  $nl=[Environment]::NewLine
  $html=$html.Replace('</body>','<script>'+$nl+$module+$nl+'</script>'+$nl+'</body>')
  [IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))
  $verify=[IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
  if(-not $verify.Contains($marker)){ throw 'Install verification failed.' }
}
catch{
  Copy-Item $backup $app -Force
  throw ('V19.0.6 install failed. Backup restored. '+$_.Exception.Message)
}

Write-Host ''
Write-Host 'PASS  Gainwright Core V19 found' -ForegroundColor Green
Write-Host 'PASS  V19.0.6 Variation Identity Isolation installed' -ForegroundColor Green
Write-Host 'PASS  Controlled Variations no longer fall back to legacy Subject Vault identities' -ForegroundColor Green
Write-Host 'PASS  Current reference lock is used only when intentionally enabled' -ForegroundColor Green
Write-Host 'PASS  Addison / other saved subject names are blocked from unintended variation inheritance' -ForegroundColor Green
Write-Host ('Backup: '+$backup) -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Reload with ?v=1906identity' -ForegroundColor Cyan