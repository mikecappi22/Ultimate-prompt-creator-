$ErrorActionPreference='Stop'
$Repo='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-'
$Ref='793e7a979f7514e8398e9dff5592e1202030ca7b'
$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$App=Join-Path $Dir 'index.html'
$Backup=Join-Path $Dir ('index-before-v146-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
$Bridge=Join-Path $Dir 'private-mobile-proxy-v1187.ps1'
$Tmp=Join-Path $env:TEMP 'UPC-V146'
$PrivateUrl='https://laptop-5efmmkr5.tail97be36.ts.net/'
$Utf8NoBom=New-Object System.Text.UTF8Encoding($false)

Write-Host '=== Ultimate Prompt Creator V14.6 Installer ===' -ForegroundColor Cyan
Write-Host 'Environment Vault + Project Templates + Model Adapter + all V14.5 production features.'
Write-Host 'Text-only architecture preserved. Ollama remains localhost-only.'
New-Item -ItemType Directory -Force -Path $Dir,$Tmp | Out-Null

function Download-Asset([string]$Name){
  $url="$Repo/$Ref/$Name";$dest=Join-Path $Tmp $Name
  Write-Host "  downloading $Name"
  Invoke-WebRequest $url -OutFile $dest -UseBasicParsing
  if(-not(Test-Path $dest)){throw "Download failed: $Name"}
  return $dest
}
function Read-Utf8([string]$Path){return [IO.File]::ReadAllText($Path,[Text.Encoding]::UTF8)}
function Stop-Bridge {
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object {$_.CommandLine -match 'private-mobile-proxy-v1187\.ps1' -and $_.CommandLine -match '8765'} |
    ForEach-Object {try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}}
}
function Start-Bridge {
  Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')
}

Write-Host 'Step 1/8 - Downloading pinned components...'
$Shell=Download-Asset 'private-unified-v143-shell.html'
$Defaults=Download-Asset 'subject-defaults-v134.js'
$Vault=Download-Asset 'subject-vault-v143.js'
$Prefill=Download-Asset 'subject-profile-paste-v143.js'
$Library=Download-Asset 'prompt-library-v143.js'
$Composer=Download-Asset 'smart-composer-v144.js'
$Production=Download-Asset 'production-hub-v145.js'
$Extensions=Download-Asset 'studio-extensions-v146.js'
$BridgeSrc=Download-Asset 'private-mobile-proxy-v1187.ps1'
$DbWorker=Download-Asset 'db-worker-v100.js'
$DbGzip=Download-Asset 'db-v8-mobile.v93.json.gz'
$DbJson=Download-Asset 'db-v8-mobile.json'
$CameraParts=@();1..5|ForEach-Object{$CameraParts+=Download-Asset ("camera-addon-v81.part$_.txt")}

Write-Host 'Step 2/8 - Assembling V14.6 Studio...'
$html=Read-Utf8 $Shell
$html=$html.Replace('/*__SUBJECT_DEFAULTS__*/',(Read-Utf8 $Defaults))
$html=$html.Replace('/*__SUBJECT_VAULT__*/',(Read-Utf8 $Vault))
$html=$html.Replace('/*__PROFILE_PREFILL__*/',(Read-Utf8 $Prefill))
$html=$html.Replace('/*__PROMPT_LIBRARY__*/',(Read-Utf8 $Library))
$featureScripts="<script>`r`n$(Read-Utf8 $Composer)`r`n</script>`r`n<script>`r`n$(Read-Utf8 $Production)`r`n</script>`r`n<script>`r`n$(Read-Utf8 $Extensions)`r`n</script>`r`n</body>"
$html=$html.Replace('</body>',$featureScripts)
$html=$html.Replace('Ultimate Prompt Creator V14.3 Unified','Ultimate Prompt Creator V14.6 Studio')
$html=$html.Replace('V14.3 UNIFIED','V14.6 STUDIO')
$html=$html.Replace('Subjects, Creative Director, Prompt Library and Prompt Workspace in one private app.','Projects, Subjects, Smart Build, Studio Extensions, Creative Director, Prompt Library and Prompt Workspace in one private app.')
foreach($m in @('V14.6 STUDIO','Subject Vault','Smart Prompt Composer','Production Studio','Environment Vault','Project Templates','Model Adapter','Shot Builder','Prompt History','Prompt Library','Prompt Workspace')){if(-not $html.Contains($m)){throw "Candidate missing marker: $m"}}
foreach($bad in @('Export Photo Backup','Import Photo Backup','svPhotoInput','IndexedDB','PHOTO_DB','PHOTO_STORE','Tailscale Funnel')){if($html.Contains($bad)){throw "Disallowed code/copy present: $bad"}}
$candidate=Join-Path $Tmp 'index-v146-candidate.html';[IO.File]::WriteAllText($candidate,$html,$Utf8NoBom)

Write-Host 'Step 3/8 - Backing up current page...'
if(Test-Path $App){Copy-Item $App $Backup -Force}

Write-Host 'Step 4/8 - Installing local assets...'
Copy-Item $BridgeSrc $Bridge -Force
Copy-Item $DbWorker (Join-Path $Dir 'db-worker-v100.js') -Force
Copy-Item $DbGzip (Join-Path $Dir 'db-v8-mobile.v93.json.gz') -Force
Copy-Item $DbJson (Join-Path $Dir 'db-v8-mobile.json') -Force
foreach($part in $CameraParts){Copy-Item $part (Join-Path $Dir ([IO.Path]::GetFileName($part))) -Force}

Write-Host 'Step 5/8 - Verifying Ollama text model...'
$tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -Method Get
$names=@($tags.models|ForEach-Object{if($_.name){$_.name}else{$_.model}})
if(-not($names -contains 'qwen3:1.7b')){& ollama pull 'qwen3:1.7b';if($LASTEXITCODE -ne 0){throw 'Could not install qwen3:1.7b'}}

Write-Host 'Step 6/8 - Installing V14.6 and restarting bridge...'
Copy-Item $candidate $App -Force
Stop-Bridge;Start-Sleep -Milliseconds 700;Start-Bridge;Start-Sleep -Seconds 3
& tailscale serve --bg http://127.0.0.1:8765 | Out-Host

Write-Host 'Step 7/8 - Running smoke tests...'
try{
  $health=Invoke-WebRequest 'http://127.0.0.1:8765/health' -UseBasicParsing -TimeoutSec 15
  if($health.StatusCode -ne 200 -or -not $health.Content.Contains('V11.8.7')){throw 'Bridge health failed.'}
  $page=Invoke-WebRequest 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 15
  foreach($m in @('V14.6 STUDIO','Environment Vault','Project Templates','Model Adapter','Production Studio','Smart Prompt Composer','Prompt Library')){if(-not $page.Content.Contains($m)){throw "Served page missing $m"}}
  $worker=Invoke-WebRequest 'http://127.0.0.1:8765/db-worker-v100.js' -UseBasicParsing -TimeoutSec 20
  if($worker.StatusCode -ne 200){throw 'Database worker failed.'}
  $ollama=Invoke-WebRequest 'http://127.0.0.1:8765/ollama/api/tags' -UseBasicParsing -TimeoutSec 20
  if($ollama.StatusCode -ne 200){throw 'Ollama proxy failed.'}
}catch{
  Write-Host 'Smoke test failed. Restoring previous page...' -ForegroundColor Yellow
  Stop-Bridge;if(Test-Path $Backup){Copy-Item $Backup $App -Force};Start-Sleep -Milliseconds 500;Start-Bridge;throw
}

Write-Host 'Step 8/8 - Final private HTTPS check...'
try{$remote=Invoke-WebRequest ($PrivateUrl+'?v=1460') -UseBasicParsing -TimeoutSec 25;if($remote.StatusCode -ne 200 -or -not $remote.Content.Contains('V14.6 STUDIO')){throw 'Private HTTPS page did not return V14.6.'};Write-Host 'Private HTTPS PASS.' -ForegroundColor Green}catch{Write-Warning ('Local V14.6 passed but HTTPS check failed: '+$_.Exception.Message)}

Write-Host ''
Write-Host 'V14.6 STUDIO IS READY' -ForegroundColor Green
Write-Host ($PrivateUrl+'?v=1460') -ForegroundColor Cyan
Write-Host 'Studio+: Environment Vault + Project Templates + Model Adapter.'
Write-Host 'V14.5 Projects, Shot Builder and Prompt History remain intact.'
Write-Host 'Privacy: text-only vaults; reference images remain external; no Funnel; Ollama stays localhost-only.'
Start-Process ($PrivateUrl+'?v=1460')
