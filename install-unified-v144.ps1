$ErrorActionPreference='Stop'
$Repo='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-'
$Ref='dbd84ac3cb03d2e290e0cc2bcff57b1057469923'
$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$App=Join-Path $Dir 'index.html'
$Backup=Join-Path $Dir ('index-before-v144-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
$Bridge=Join-Path $Dir 'private-mobile-proxy-v1187.ps1'
$Tmp=Join-Path $env:TEMP 'UPC-V144'
$PrivateUrl='https://laptop-5efmmkr5.tail97be36.ts.net/'
$Utf8NoBom=New-Object System.Text.UTF8Encoding($false)

Write-Host '=== Ultimate Prompt Creator V14.4 Installer ===' -ForegroundColor Cyan
Write-Host 'Smart Build + Wardrobe Builder + Prompt Inspector + existing V14.3 Subject Vault and Prompt Library.'
Write-Host 'Subject Vault remains text-only. Ollama remains localhost-only.'
New-Item -ItemType Directory -Force -Path $Dir,$Tmp | Out-Null

function Download-Asset([string]$Name){
  $url="$Repo/$Ref/$Name"
  $dest=Join-Path $Tmp $Name
  Write-Host "  downloading $Name"
  Invoke-WebRequest $url -OutFile $dest -UseBasicParsing
  if(-not (Test-Path $dest)){throw "Download failed: $Name"}
  return $dest
}
function Read-Utf8([string]$Path){return [System.IO.File]::ReadAllText($Path,[System.Text.Encoding]::UTF8)}
function Stop-Bridge {
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match 'private-mobile-proxy-v1187\.ps1' -and $_.CommandLine -match '8765'
  } | ForEach-Object { try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{} }
}
function Start-Bridge {
  Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')
}

Write-Host 'Step 1/8 - Downloading pinned V14.4 components...'
$Shell=Download-Asset 'private-unified-v143-shell.html'
$Defaults=Download-Asset 'subject-defaults-v134.js'
$Vault=Download-Asset 'subject-vault-v143.js'
$Prefill=Download-Asset 'subject-profile-paste-v143.js'
$Library=Download-Asset 'prompt-library-v143.js'
$Composer=Download-Asset 'smart-composer-v144.js'
$BridgeSrc=Download-Asset 'private-mobile-proxy-v1187.ps1'
$DbWorker=Download-Asset 'db-worker-v100.js'
$DbGzip=Download-Asset 'db-v8-mobile.v93.json.gz'
$DbJson=Download-Asset 'db-v8-mobile.json'
$CameraParts=@()
1..5 | ForEach-Object {$CameraParts += Download-Asset ("camera-addon-v81.part$_.txt")}

Write-Host 'Step 2/8 - Assembling V14.4 Smart Studio...'
$html=Read-Utf8 $Shell
$html=$html.Replace('/*__SUBJECT_DEFAULTS__*/',(Read-Utf8 $Defaults))
$html=$html.Replace('/*__SUBJECT_VAULT__*/',(Read-Utf8 $Vault))
$html=$html.Replace('/*__PROFILE_PREFILL__*/',(Read-Utf8 $Prefill))
$html=$html.Replace('/*__PROMPT_LIBRARY__*/',(Read-Utf8 $Library))
$composerText=Read-Utf8 $Composer
$html=$html.Replace('</body>',("<script>`r`n"+$composerText+"`r`n</script>`r`n</body>"))
$html=$html.Replace('Ultimate Prompt Creator V14.3 Unified','Ultimate Prompt Creator V14.4 Smart Studio')
$html=$html.Replace('V14.3 UNIFIED','V14.4 SMART STUDIO')
$html=$html.Replace('Subjects, Creative Director, Prompt Library and Prompt Workspace in one private app.','Subjects, Smart Build, Creative Director, Prompt Library and Prompt Workspace in one private app.')
if($html.Contains('/*__SUBJECT_') -or $html.Contains('/*__PROFILE_') -or $html.Contains('/*__PROMPT_LIBRARY__*/')){throw 'Assembly marker remained in candidate page.'}
foreach($m in @('V14.4 SMART STUDIO','Subject Vault','Browse / Search Subjects','Smart Prompt Composer','Wardrobe Builder','Prompt Recipes','Prompt Inspector','Database Suggestions','Creative Director','Prompt Library','Recommend Suggestions','Prompt Workspace','ADDISON','ANNA','ASHLEY','AVA','BECKIE','Paste Profile JSON')){if(-not $html.Contains($m)){throw "Candidate page missing required marker: $m"}}
foreach($bad in @('Export Photo Backup','Import Photo Backup','svPhotoInput','IndexedDB','PHOTO_DB','PHOTO_STORE','Tailscale Funnel')){if($html.Contains($bad)){throw "Disallowed code or copy present: $bad"}}
if($html.Contains('sv-subject-strip')){throw 'Old horizontal subject strip is still present.'}
$candidate=Join-Path $Tmp 'index-v144-candidate.html'
[System.IO.File]::WriteAllText($candidate,$html,$Utf8NoBom)

Write-Host 'Step 3/8 - Preserving current private page...'
if(Test-Path $App){Copy-Item $App $Backup -Force}

Write-Host 'Step 4/8 - Installing local database assets...'
Copy-Item $BridgeSrc $Bridge -Force
Copy-Item $DbWorker (Join-Path $Dir 'db-worker-v100.js') -Force
Copy-Item $DbGzip (Join-Path $Dir 'db-v8-mobile.v93.json.gz') -Force
Copy-Item $DbJson (Join-Path $Dir 'db-v8-mobile.json') -Force
foreach($part in $CameraParts){Copy-Item $part (Join-Path $Dir ([IO.Path]::GetFileName($part))) -Force}
foreach($name in @('db-worker-v100.js','db-v8-mobile.v93.json.gz','db-v8-mobile.json','camera-addon-v81.part1.txt','camera-addon-v81.part2.txt','camera-addon-v81.part3.txt','camera-addon-v81.part4.txt','camera-addon-v81.part5.txt')){if(-not (Test-Path (Join-Path $Dir $name))){throw "Static asset missing after install: $name"}}

Write-Host 'Step 5/8 - Verifying local text model...'
$tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -Method Get
$names=@($tags.models | ForEach-Object { if($_.name){$_.name}else{$_.model} })
if(-not ($names -contains 'qwen3:1.7b')){
  Write-Host 'qwen3:1.7b is missing; installing it now...'
  & ollama pull 'qwen3:1.7b'
  if($LASTEXITCODE -ne 0){throw 'Could not install qwen3:1.7b'}
}

Write-Host 'Step 6/8 - Installing V14.4 and restarting private bridge...'
Copy-Item $candidate $App -Force
Stop-Bridge
Start-Sleep -Milliseconds 700
Start-Bridge
Start-Sleep -Seconds 3
& tailscale serve --bg http://127.0.0.1:8765 | Out-Host

Write-Host 'Step 7/8 - Running local smoke tests...'
try{
  $health=Invoke-WebRequest 'http://127.0.0.1:8765/health' -UseBasicParsing -TimeoutSec 15
  if($health.StatusCode -ne 200 -or -not $health.Content.Contains('V11.8.7')){throw 'Private bridge health check failed.'}
  $page=Invoke-WebRequest 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 15
  foreach($m in @('V14.4 SMART STUDIO','Browse / Search Subjects','Smart Prompt Composer','Wardrobe Builder','Prompt Inspector','Prompt Library','Recommend Suggestions','Prompt Workspace')){if(-not $page.Content.Contains($m)){throw "Served page missing $m"}}
  foreach($bad in @('Export Photo Backup','Import Photo Backup','svPhotoInput','PHOTO_DB','sv-subject-strip')){if($page.Content.Contains($bad)){throw "Served page contains disallowed legacy code: $bad"}}
  $worker=Invoke-WebRequest 'http://127.0.0.1:8765/db-worker-v100.js' -UseBasicParsing -TimeoutSec 20
  if($worker.StatusCode -ne 200 -or -not $worker.Content.Contains("type==='recommend'")){throw 'Prompt database worker did not load correctly.'}
  $gz=Invoke-WebRequest 'http://127.0.0.1:8765/db-v8-mobile.v93.json.gz' -UseBasicParsing -TimeoutSec 30
  if($gz.StatusCode -ne 200 -or [int64]$gz.RawContentLength -lt 1000){throw 'Compressed prompt database did not load.'}
  $ollama=Invoke-WebRequest 'http://127.0.0.1:8765/ollama/api/tags' -UseBasicParsing -TimeoutSec 20
  if($ollama.StatusCode -ne 200){throw "Ollama proxy returned $($ollama.StatusCode)"}
}catch{
  Write-Host 'Smoke test failed. Restoring previous page...' -ForegroundColor Yellow
  Stop-Bridge
  if(Test-Path $Backup){Copy-Item $Backup $App -Force}
  Start-Sleep -Milliseconds 500
  Start-Bridge
  throw
}

Write-Host 'Step 8/8 - Final private HTTPS check...'
try{
  $remote=Invoke-WebRequest ($PrivateUrl+'?v=1440') -UseBasicParsing -TimeoutSec 25
  if($remote.StatusCode -ne 200 -or -not $remote.Content.Contains('V14.4 SMART STUDIO')){throw 'Private HTTPS page did not return V14.4.'}
  Write-Host 'Private HTTPS PASS.' -ForegroundColor Green
}catch{
  Write-Warning ('Local V14.4 passed but private HTTPS check failed: '+$_.Exception.Message)
  Write-Warning 'Tailscale Serve may need a few seconds; reload the private URL once.'
}

Write-Host ''
Write-Host 'V14.4 SMART STUDIO IS READY' -ForegroundColor Green
Write-Host $PrivateUrl -ForegroundColor Cyan
Write-Host 'Build: structured Smart Composer with database suggestions in every scene layer.'
Write-Host 'Wardrobe: top/bottom/footwear/accessories plus reusable wardrobe presets.'
Write-Host 'Inspector: deterministic prompt-health and subject-conflict checks.'
Write-Host 'Recipes: RAW iPhone, Director''s Cut Realism, 120 Film, Hasselblad, Seedance 2:3 and Candid Home.'
Write-Host 'Privacy: Subject Vault remains text-only; Ollama remains 127.0.0.1 behind tailnet-only Tailscale Serve.'
Start-Process ($PrivateUrl+'?v=1440')