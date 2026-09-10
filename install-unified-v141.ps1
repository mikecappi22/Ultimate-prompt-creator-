$ErrorActionPreference='Stop'

$Repo='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-'
$Ref='318821f13547a4b0f81b0eed41a0b992d5d2094c'
$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$App=Join-Path $Dir 'index.html'
$Backup=Join-Path $Dir ('index-before-v141-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
$Bridge=Join-Path $Dir 'private-mobile-proxy-v1186.ps1'
$Tmp=Join-Path $env:TEMP 'UPC-V141'
$PrivateUrl='https://laptop-5efmmkr5.tail97be36.ts.net/'
$Utf8NoBom=New-Object System.Text.UTF8Encoding($false)

Write-Host '=== Ultimate Prompt Creator V14.1 Unified Installer ===' -ForegroundColor Cyan
Write-Host 'Clean navigation + Subjects + Director + Prompt + local photo migration.'
Write-Host ''

New-Item -ItemType Directory -Force -Path $Dir,$Tmp | Out-Null

function Download-Text([string]$Name){
  $url="$Repo/$Ref/$Name"
  $dest=Join-Path $Tmp $Name
  Invoke-WebRequest $url -OutFile $dest -UseBasicParsing
  return $dest
}
function Read-Utf8([string]$Path){
  return [System.IO.File]::ReadAllText($Path,[System.Text.Encoding]::UTF8)
}
function Assert-NoMojibake([string]$Text,[string]$Where){
  foreach($cp in @(0x00F0,0x00E2,0x00C3,0xFFFD)){
    $ch=[string][char]$cp
    if($Text.Contains($ch)){throw "Encoding corruption detected in $Where (code point $cp)."}
  }
}
function Stop-Bridge {
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match 'private-mobile-proxy-v1186\.ps1' -and $_.CommandLine -match '8765'
  } | ForEach-Object {
    try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}
  }
}
function Start-Bridge {
  Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')
}

Write-Host 'Step 1/7 - Downloading pinned V14.1 assets...'
$Shell=Download-Text 'private-unified-v141-shell.html'
$Defaults=Download-Text 'subject-defaults-v134.js'
$Vault=Download-Text 'subject-vault-v132.js'
$Prefill=Download-Text 'subject-profile-paste-v133.js'
$PhotoBackup=Download-Text 'subject-photo-backup-v141.js'
$BridgeSrc=Download-Text 'private-mobile-proxy-v1186.ps1'

Write-Host 'Step 2/7 - Assembling UTF-8 safe one-file workspace...'
$html=Read-Utf8 $Shell
$html=$html.Replace('/*__SUBJECT_DEFAULTS__*/',(Read-Utf8 $Defaults))
$html=$html.Replace('/*__SUBJECT_VAULT__*/',(Read-Utf8 $Vault))
$html=$html.Replace('/*__PROFILE_PREFILL__*/',(Read-Utf8 $Prefill))
$html=$html.Replace('/*__PHOTO_BACKUP__*/',(Read-Utf8 $PhotoBackup))
if($html.Contains('/*__SUBJECT_') -or $html.Contains('/*__PHOTO_BACKUP__*/')){throw 'Assembly marker remained in candidate page.'}
foreach($m in @('V14.1 UNIFIED','Subjects','Director','Prompt','Export Photo Backup','Import Photo Backup','qwen3:1.7b','ADDISON','ANNA','ASHLEY','AVA','BECKIE')){
  if(-not $html.Contains($m)){throw "Candidate page missing required marker: $m"}
}
Assert-NoMojibake $html 'assembled page'
$candidate=Join-Path $Tmp 'index-v141-candidate.html'
[System.IO.File]::WriteAllText($candidate,$html,$Utf8NoBom)

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

Write-Host 'Step 5/7 - Installing V14.1 and restarting private bridge...'
Copy-Item $candidate $App -Force
Stop-Bridge
Start-Sleep -Milliseconds 700
Start-Bridge
Start-Sleep -Seconds 3
& tailscale serve --bg http://127.0.0.1:8765 | Out-Host

Write-Host 'Step 6/7 - Running local bridge and Ollama smoke tests...'
try{
  $health=Invoke-WebRequest 'http://127.0.0.1:8765/health' -UseBasicParsing -TimeoutSec 15
  if($health.StatusCode -ne 200){throw "Health returned $($health.StatusCode)"}
  $page=Invoke-WebRequest 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 15
  foreach($m in @('V14.1 UNIFIED','Subject Vault','Creative Director','Prompt Workspace','Export Photo Backup')){
    if(-not $page.Content.Contains($m)){throw "Served page missing $m"}
  }
  Assert-NoMojibake $page.Content 'served page'
  $ollama=Invoke-WebRequest 'http://127.0.0.1:8765/ollama/api/tags' -UseBasicParsing -TimeoutSec 20
  if($ollama.StatusCode -ne 200){throw "Ollama proxy returned $($ollama.StatusCode)"}
}catch{
  Write-Host 'Smoke test failed. Restoring previous page...' -ForegroundColor Yellow
  if(Test-Path $Backup){Copy-Item $Backup $App -Force;Stop-Bridge;Start-Sleep -Milliseconds 500;Start-Bridge}
  throw
}

Write-Host 'Step 7/7 - Final private URL check...'
try{
  $remote=Invoke-WebRequest ($PrivateUrl+'?v=1410') -UseBasicParsing -TimeoutSec 25
  if($remote.StatusCode -ne 200 -or -not $remote.Content.Contains('V14.1 UNIFIED')){throw 'Private HTTPS page did not return V14.1.'}
  Write-Host 'Private HTTPS PASS.' -ForegroundColor Green
}catch{
  Write-Warning ('Local V14.1 passed but private HTTPS check failed: '+$_.Exception.Message)
  Write-Warning 'Tailscale may need a few seconds; reload the private URL once.'
}

Write-Host ''
Write-Host 'V14.1 UNIFIED WORKSPACE IS READY' -ForegroundColor Green
Write-Host $PrivateUrl -ForegroundColor Cyan
Write-Host 'Navigation colors: Subjects=purple, Director=orange, Prompt=blue.'
Write-Host 'Photo migration: export from the old GitHub page, then import the backup in this V14.1 Subjects tab.'
Start-Process ($PrivateUrl+'?v=1410')
