$ErrorActionPreference='Stop'
$Repo='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-'
$Ref='2f15248c354fa1aa2bdc71ce67b013ae5d11003e'
$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$App=Join-Path $Dir 'index.html'
$Backup=Join-Path $Dir ('index-before-v142-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
$Bridge=Join-Path $Dir 'private-mobile-proxy-v1186.ps1'
$Tmp=Join-Path $env:TEMP 'UPC-V142'
$PrivateUrl='https://laptop-5efmmkr5.tail97be36.ts.net/'
$Utf8NoBom=New-Object System.Text.UTF8Encoding($false)

Write-Host '=== Ultimate Prompt Creator V14.2 Installer ===' -ForegroundColor Cyan
Write-Host 'Subjects + Director + Prompt. Subject Vault is text-only.'
New-Item -ItemType Directory -Force -Path $Dir,$Tmp | Out-Null

function Download-Text([string]$Name){
  $url="$Repo/$Ref/$Name"
  $dest=Join-Path $Tmp $Name
  Invoke-WebRequest $url -OutFile $dest -UseBasicParsing
  return $dest
}
function Read-Utf8([string]$Path){return [System.IO.File]::ReadAllText($Path,[System.Text.Encoding]::UTF8)}
function Stop-Bridge {
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match 'private-mobile-proxy-v1186\.ps1' -and $_.CommandLine -match '8765'
  } | ForEach-Object { try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{} }
}
function Start-Bridge {
  Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')
}

Write-Host 'Step 1/7 - Downloading pinned V14.2 assets...'
$Shell=Download-Text 'private-unified-v141-shell.html'
$Defaults=Download-Text 'subject-defaults-v134.js'
$Vault=Download-Text 'subject-vault-v142.js'
$Prefill=Download-Text 'subject-profile-paste-v142.js'
$BridgeSrc=Download-Text 'private-mobile-proxy-v1186.ps1'

Write-Host 'Step 2/7 - Assembling text-only private workspace...'
$html=Read-Utf8 $Shell
$html=$html.Replace('/*__SUBJECT_DEFAULTS__*/',(Read-Utf8 $Defaults))
$html=$html.Replace('/*__SUBJECT_VAULT__*/',(Read-Utf8 $Vault))
$html=$html.Replace('/*__PROFILE_PREFILL__*/',(Read-Utf8 $Prefill))
$html=$html.Replace('/*__PHOTO_BACKUP__*/','')
$html=$html.Replace('V14.1 UNIFIED','V14.2 UNIFIED')
$html=$html.Replace('V14.1 Unified','V14.2 Unified')
$html=$html.Replace('Subject profiles and reference photos stay in this browser.','Subject profiles stay in this browser.')
$html=$html.Replace('Reusable identities and local reference photos.','Reusable identities and continuity profiles.')
if($html.Contains('/*__SUBJECT_') -or $html.Contains('/*__PHOTO_BACKUP__*/')){throw 'Assembly marker remained in candidate page.'}
foreach($m in @('V14.2 UNIFIED','Subject Vault','Creative Director','Prompt Workspace','ADDISON','ANNA','ASHLEY','AVA','BECKIE','Paste Profile JSON')){if(-not $html.Contains($m)){throw "Candidate page missing required marker: $m"}}
foreach($bad in @('Export Photo Backup','Import Photo Backup','svPhotoInput','IndexedDB','PHOTO_DB','PHOTO_STORE')){if($html.Contains($bad)){throw "Photo storage code still present: $bad"}}
$candidate=Join-Path $Tmp 'index-v142-candidate.html'
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

Write-Host 'Step 5/7 - Installing V14.2 and restarting private bridge...'
Copy-Item $candidate $App -Force
Stop-Bridge
Start-Sleep -Milliseconds 700
Start-Bridge
Start-Sleep -Seconds 3
& tailscale serve --bg http://127.0.0.1:8765 | Out-Host

Write-Host 'Step 6/7 - Running local smoke tests...'
try{
  $health=Invoke-WebRequest 'http://127.0.0.1:8765/health' -UseBasicParsing -TimeoutSec 15
  if($health.StatusCode -ne 200){throw "Health returned $($health.StatusCode)"}
  $page=Invoke-WebRequest 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 15
  foreach($m in @('V14.2 UNIFIED','Subject Vault','Creative Director','Prompt Workspace')){if(-not $page.Content.Contains($m)){throw "Served page missing $m"}}
  foreach($bad in @('Export Photo Backup','Import Photo Backup','svPhotoInput','PHOTO_DB')){if($page.Content.Contains($bad)){throw "Served page still contains photo storage code: $bad"}}
  $ollama=Invoke-WebRequest 'http://127.0.0.1:8765/ollama/api/tags' -UseBasicParsing -TimeoutSec 20
  if($ollama.StatusCode -ne 200){throw "Ollama proxy returned $($ollama.StatusCode)"}
}catch{
  Write-Host 'Smoke test failed. Restoring previous page...' -ForegroundColor Yellow
  if(Test-Path $Backup){Copy-Item $Backup $App -Force;Stop-Bridge;Start-Sleep -Milliseconds 500;Start-Bridge}
  throw
}

Write-Host 'Step 7/7 - Final private URL check...'
try{
  $remote=Invoke-WebRequest ($PrivateUrl+'?v=1420') -UseBasicParsing -TimeoutSec 25
  if($remote.StatusCode -ne 200 -or -not $remote.Content.Contains('V14.2 UNIFIED')){throw 'Private HTTPS page did not return V14.2.'}
  Write-Host 'Private HTTPS PASS.' -ForegroundColor Green
}catch{
  Write-Warning ('Local V14.2 passed but private HTTPS check failed: '+$_.Exception.Message)
  Write-Warning 'Tailscale may need a few seconds; reload the private URL once.'
}

Write-Host ''
Write-Host 'V14.2 TEXT-ONLY UNIFIED WORKSPACE IS READY' -ForegroundColor Green
Write-Host $PrivateUrl -ForegroundColor Cyan
Write-Host 'Subject photos are no longer stored by the platform. Keep reference images in your normal photo library and attach them only when needed.'
Start-Process ($PrivateUrl+'?v=1420')
