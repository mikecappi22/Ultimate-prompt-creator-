$ErrorActionPreference='Stop'

function Is-Admin {
  $id=[Security.Principal.WindowsIdentity]::GetCurrent()
  $p=New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
if(-not (Is-Admin)){
  Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoExit -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  exit
}

$log="$env:TEMP\UltimatePromptCreator-V130-TextOnly.log"
Start-Transcript -Path $log -Force | Out-Null
$backup=$null
$candidateLive=$false
$appDir=$null
$app=$null
$bridge=$null
$tailscale=$null
$port=8765
$origin=$null

function Find-Exe([string]$cmd,[string[]]$candidates){
  $g=Get-Command $cmd -ErrorAction SilentlyContinue
  if($g){return $g.Source}
  return ($candidates|Where-Object{Test-Path $_}|Select-Object -First 1)
}
function Post-Json([string]$url,$obj,[int]$timeout=600){
  $body=$obj|ConvertTo-Json -Depth 40 -Compress
  try{return Invoke-RestMethod $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec $timeout}
  catch{
    $detail=$_.Exception.Message
    try{if($_.ErrorDetails.Message){$detail="$detail | Server: $($_.ErrorDetails.Message)"}}catch{}
    throw "POST $url failed: $detail"
  }
}
function Restart-PrivateBridge([string]$bridgeFile,[string]$appFile,[int]$listenPort){
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object{$_.CommandLine -like '*private-mobile-proxy-v118*.ps1*'} |
    ForEach-Object{try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}}
  Start-Sleep 2
  $args="-NoProfile -ExecutionPolicy Bypass -File `"$bridgeFile`" -AppFile `"$appFile`" -Port $listenPort"
  Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden
  $ready=$false
  for($i=0;$i -lt 35;$i++){
    try{
      $info=Invoke-RestMethod "http://127.0.0.1:$listenPort/bridge-info" -TimeoutSec 2
      if($info.version -eq 'V11.8.6' -and $info.transport -eq 'StreamContent'){$ready=$true;break}
    }catch{}
    Start-Sleep 1
  }
  if(-not $ready){throw 'StreamContent bridge did not become ready.'}
}

try {
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V13 Text-Only Platform ===' -ForegroundColor Cyan
  Write-Host 'This removes the image-analysis feature from the active private platform.' -ForegroundColor White
  Write-Host 'The existing page is backed up until the text-only candidate passes all live tests.' -ForegroundColor White
  Write-Host ''

  $assetCommit='8f81e51205cd7dac94a029a299a21081fd843a48'
  $raw="https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/$assetCommit"
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $candidate=Join-Path $appDir 'index-v130-text-only-candidate.html'
  $app=Join-Path $appDir 'index.html'
  $bridge=Join-Path $appDir 'private-mobile-proxy-v1186.ps1'

  $ollama=Find-Exe 'ollama' @(
    "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
    "$env:LOCALAPPDATA\Ollama\ollama.exe",
    "$env:ProgramFiles\Ollama\ollama.exe"
  )
  $tailscale=Find-Exe 'tailscale' @(
    "$env:ProgramFiles\Tailscale\tailscale.exe",
    "$env:LOCALAPPDATA\Tailscale\tailscale.exe"
  )
  if(-not $ollama){throw 'Could not locate ollama.exe.'}
  if(-not $tailscale){throw 'Could not locate tailscale.exe.'}

  $ts=& $tailscale status --json | ConvertFrom-Json
  $dns=([string]$ts.Self.DNSName).TrimEnd('.')
  if(-not $dns){throw 'Could not determine Tailscale MagicDNS hostname.'}
  $origin="https://$dns"
  Write-Host "Private URL: $origin/" -ForegroundColor Green

  Write-Host 'Step 1/8 - Verifying the text model...' -ForegroundColor White
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 30
  $names=@($tags.models|ForEach-Object{$_.name})
  if($names -notcontains 'qwen3:1.7b'){
    Write-Host 'Downloading qwen3:1.7b...' -ForegroundColor Yellow
    & $ollama pull qwen3:1.7b | Out-Host
    if($LASTEXITCODE -ne 0){throw 'ollama pull qwen3:1.7b failed.'}
  }
  Write-Host 'qwen3:1.7b ready.' -ForegroundColor Green

  Write-Host 'Step 2/8 - Creating temporary rollback backup...' -ForegroundColor White
  if(-not (Test-Path $app)){throw 'Current private index.html was not found.'}
  $backup=Join-Path $appDir ("index-before-text-only-"+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
  Copy-Item $app $backup -Force
  Write-Host "Temporary rollback backup: $backup" -ForegroundColor Green

  Write-Host 'Step 3/8 - Downloading the exact validated text-only assets...' -ForegroundColor White
  Invoke-WebRequest "$raw/private-text-only-v130.html" -OutFile $candidate -UseBasicParsing
  Invoke-WebRequest "$raw/private-mobile-proxy-v1186.ps1" -OutFile $bridge -UseBasicParsing
  $pageText=[IO.File]::ReadAllText($candidate)
  if($pageText -notmatch 'V13 TEXT ONLY'){throw 'V13 text-only marker is missing.'}
  if($pageText -match '(?i)qwen3-vl|moondream|/api/generate|images\s*:|type=["'']file["'']'){throw 'Candidate contains image-analysis or multimodal code.'}
  if($pageText -notmatch 'Director' -or $pageText -notmatch 'Prompt'){throw 'Candidate is missing Director or Prompt.'}
  Write-Host 'Candidate static inspection PASS.' -ForegroundColor Green

  Write-Host 'Step 4/8 - Starting the candidate through the private bridge...' -ForegroundColor White
  Restart-PrivateBridge $bridge $candidate $port
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Host
  $candidateLive=$true
  $info=Invoke-RestMethod "$origin/bridge-info" -TimeoutSec 30
  if($info.version -ne 'V11.8.6' -or $info.transport -ne 'StreamContent'){throw 'Private route is not using the expected StreamContent bridge.'}
  Write-Host 'Private bridge PASS.' -ForegroundColor Green

  Write-Host 'Step 5/8 - Testing text-only Ollama through private HTTPS...' -ForegroundColor White
  $smoke=Post-Json "$origin/ollama/api/chat" @{
    model='qwen3:1.7b'
    messages=@(@{role='user';content='Reply with exactly TEXT_ONLY_READY'})
    stream=$false
    think=$false
    keep_alive='10m'
    options=@{num_predict=24;num_ctx=1024;temperature=0}
  } 600
  $smokeText=([string]$smoke.message.content).Trim()
  if($smokeText -notmatch 'TEXT_ONLY_READY'){throw "Text model smoke test returned unexpected output: $smokeText"}
  Write-Host 'Private text-model route PASS.' -ForegroundColor Green

  Write-Host 'Step 6/8 - Verifying candidate page has no image-analysis controls...' -ForegroundColor White
  $web=Invoke-WebRequest "$origin/?v=1300" -UseBasicParsing -TimeoutSec 45
  if($web.StatusCode -ne 200){throw "Candidate page returned HTTP $($web.StatusCode)."}
  if($web.Content -notmatch 'V13 TEXT ONLY'){throw 'Served candidate is not V13 text-only.'}
  if($web.Content -match '(?i)qwen3-vl|moondream|/api/generate|images\s*:|type=["'']file["'']'){throw 'Served candidate exposes image-analysis code.'}
  Write-Host 'Candidate page PASS.' -ForegroundColor Green

  Write-Host 'Step 7/8 - Making the text-only page live...' -ForegroundColor White
  Copy-Item $candidate $app -Force
  Restart-PrivateBridge $bridge $app $port
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Null
  $final=Invoke-WebRequest "$origin/?v=1300" -UseBasicParsing -TimeoutSec 45
  if($final.StatusCode -ne 200 -or $final.Content -notmatch 'V13 TEXT ONLY'){throw 'Final live text-only verification failed.'}
  if($final.Content -match '(?i)qwen3-vl|moondream|/api/generate|images\s*:|type=["'']file["'']'){throw 'Final live page still contains image-analysis code.'}
  $candidateLive=$false
  Write-Host 'Final live text-only page PASS.' -ForegroundColor Green

  Write-Host 'Step 8/8 - Removing local image-analysis files and models...' -ForegroundColor White
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 30
  $removeModels=@($tags.models|ForEach-Object{$_.name}|Where-Object{$_ -match '^(?i:qwen3-vl|moondream)(:|$)'})
  foreach($m in $removeModels){
    try{& $ollama stop $m | Out-Null}catch{}
    try{
      & $ollama rm $m | Out-Host
      if($LASTEXITCODE -eq 0){Write-Host "Removed model: $m" -ForegroundColor Green}else{Write-Host "Warning: could not remove model $m" -ForegroundColor Yellow}
    }catch{Write-Host "Warning: could not remove model $m" -ForegroundColor Yellow}
  }
  Get-ChildItem $appDir -File -ErrorAction SilentlyContinue |
    Where-Object{$_.Name -notin @('index.html','private-mobile-proxy-v1186.ps1')} |
    ForEach-Object{try{Remove-Item $_.FullName -Force -ErrorAction Stop;Write-Host "Removed old app file: $($_.Name)" -ForegroundColor DarkGray}catch{}}

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'V13 TEXT-ONLY PLATFORM IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'Private app: Director + Prompt only' -ForegroundColor White
  Write-Host 'Image-analysis controls: removed' -ForegroundColor White
  Write-Host 'Image-analysis models installed by this project: removed when found' -ForegroundColor White
  Write-Host "Open: $origin/?v=1300" -ForegroundColor Cyan
  Start-Process "$origin/?v=1300"
}
catch {
  Write-Host ''
  Write-Host 'V13 TEXT-ONLY INSTALLER STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  if($candidateLive -and $backup -and (Test-Path $backup) -and $bridge -and (Test-Path $bridge)){
    Write-Host 'Restoring the previous private page...' -ForegroundColor Yellow
    try{
      Copy-Item $backup $app -Force
      Restart-PrivateBridge $bridge $app $port
      & $tailscale serve reset | Out-Null
      & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Null
      Write-Host 'ROLLBACK PASS - previous page restored.' -ForegroundColor Green
    }catch{Write-Host ('Rollback warning: '+$_.Exception.Message) -ForegroundColor Red}
  }
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'Leave this window open and send the exact visible error to ChatGPT.' -ForegroundColor Yellow
}
finally {
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
