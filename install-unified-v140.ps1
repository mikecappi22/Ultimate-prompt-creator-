$ErrorActionPreference='Stop'

$Repo='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-'
$Ref='962633ef26cdf5b9af948583e3639f249a0ab5e3'
$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$App=Join-Path $Dir 'index.html'
$Backup=Join-Path $Dir ('index-before-v140-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
$Bridge=Join-Path $Dir 'private-mobile-proxy-v1186.ps1'
$Tmp=Join-Path $env:TEMP 'UPC-V140'
$PrivateUrl='https://laptop-5efmmkr5.tail97be36.ts.net/'

Write-Host '=== Ultimate Prompt Creator V14 Unified Installer ===' -ForegroundColor Cyan
Write-Host 'Subjects + Director + Prompt in one private Tailscale app.'
Write-Host ''

New-Item -ItemType Directory -Force -Path $Dir,$Tmp | Out-Null

function Download-Text([string]$Name){
  $url="$Repo/$Ref/$Name"
  $dest=Join-Path $Tmp $Name
  Invoke-WebRequest $url -OutFile $dest -UseBasicParsing
  return $dest
}

Write-Host 'Step 1/7 - Downloading pinned V14 assets...'
$Shell=Download-Text 'private-unified-v140-shell.html'
$Defaults=Download-Text 'subject-defaults-v134.js'
$Vault=Download-Text 'subject-vault-v132.js'
$Prefill=Download-Text 'subject-profile-paste-v133.js'
$BridgeSrc=Download-Text 'private-mobile-proxy-v1186.ps1'

Write-Host 'Step 2/7 - Assembling one-file private workspace...'
$html=Get-Content $Shell -Raw
$html=$html.Replace('/*__SUBJECT_DEFAULTS__*/',(Get-Content $Defaults -Raw))
$html=$html.Replace('/*__SUBJECT_VAULT__*/',(Get-Content $Vault -Raw))
$html=$html.Replace('/*__PROFILE_PREFILL__*/',(Get-Content $Prefill -Raw))
if($html.Contains('/*__SUBJECT_')){throw 'Assembly marker remained in candidate page.'}
foreach($m in @('V14 UNIFIED','Subjects','Director','Prompt','qwen3:1.7b','ADDISON','ANNA','ASHLEY','AVA','BECKIE','IndexedDB')){
  if(-not $html.Contains($m)){throw "Candidate page missing required marker: $m"}
}
$candidate=Join-Path $Tmp 'index-v140-candidate.html'
Set-Content -Path $candidate -Value $html -Encoding UTF8

Write-Host 'Step 3/7 - Preserving current private page...'
if(Test-Path $App){Copy-Item $App $Backup -Force}
Copy-Item $BridgeSrc $Bridge -Force

Write-Host 'Step 4/7 - Verifying local text model...'
$tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -Method Get
$names=@($tags.models | ForEach-Object { if($_.name){$_.name}else{$_.model} })
if(-not ($names -contains 'qwen3:1.7b')){
  Write-Host 'qwen3:1.7b is missing; installing it now...'
  & ollama pull 'qwen3:1.7b'
  if($LASTEXITCODE -ne 0){throw 'Could not install qwen3:1.7b'}
}

Write-Host 'Step 5/7 - Installing V14 page and restarting private bridge...'
Copy-Item $candidate $App -Force
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object {
  $_.CommandLine -match 'private-mobile-proxy-v1186\.ps1' -and $_.CommandLine -match '8765'
} | ForEach-Object {
  try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}
}
Start-Sleep -Milliseconds 700
Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')
Start-Sleep -Seconds 3
& tailscale serve --bg http://127.0.0.1:8765 | Out-Host

Write-Host 'Step 6/7 - Running local bridge and Ollama smoke tests...'
try{
  $health=Invoke-WebRequest 'http://127.0.0.1:8765/health' -UseBasicParsing -TimeoutSec 15
  if($health.StatusCode -ne 200){throw "Health returned $($health.StatusCode)"}
  $page=Invoke-WebRequest 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 15
  foreach($m in @('V14 UNIFIED','Subjects','Creative Director','Prompt Workspace')){
    if(-not $page.Content.Contains($m)){throw "Served page missing $m"}
  }
  $ollama=Invoke-WebRequest 'http://127.0.0.1:8765/ollama/api/tags' -UseBasicParsing -TimeoutSec 20
  if($ollama.StatusCode -ne 200){throw "Ollama proxy returned $($ollama.StatusCode)"}
}catch{
  Write-Host 'Smoke test failed. Restoring previous page...' -ForegroundColor Yellow
  if(Test-Path $Backup){Copy-Item $Backup $App -Force}
  throw
}

Write-Host 'Step 7/7 - Final private URL check...'
try{
  $remote=Invoke-WebRequest ($PrivateUrl+'?v=1400') -UseBasicParsing -TimeoutSec 25
  if($remote.StatusCode -ne 200 -or -not $remote.Content.Contains('V14 UNIFIED')){throw 'Private HTTPS page did not return V14.'}
  Write-Host 'Private HTTPS PASS.' -ForegroundColor Green
}catch{
  Write-Warning ('Local V14 passed but private HTTPS check failed: '+$_.Exception.Message)
  Write-Warning 'Tailscale may need a few seconds; reload the private URL once.'
}

Write-Host ''
Write-Host 'V14 UNIFIED WORKSPACE IS READY' -ForegroundColor Green
Write-Host $PrivateUrl -ForegroundColor Cyan
Write-Host ''
Write-Host 'Left navigation: Subjects | Director | Prompt'
Write-Host 'Note: reference photos saved on the old GitHub Pages origin do not transfer automatically; re-add them once in V14.'
Start-Process ($PrivateUrl+'?v=1400')
