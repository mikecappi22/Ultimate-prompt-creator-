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

$log="$env:TEMP\UltimatePromptCreator-V121-QualitySpeed.log"
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
function Post-Json([string]$url,$obj,[int]$timeout=900){
  $body=$obj|ConvertTo-Json -Depth 40 -Compress
  try{return Invoke-RestMethod $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec $timeout}
  catch{
    $detail=$_.Exception.Message
    try{if($_.ErrorDetails.Message){$detail="$detail | Server: $($_.ErrorDetails.Message)"}}catch{}
    throw "POST $url failed: $detail"
  }
}
function Chat-Text($obj){
  $t=([string]$obj.message.content).Trim()
  if(-not $t){$t=([string]$obj.message.thinking).Trim()}
  return $t
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
  Write-Host '=== Vision V12.1 Quality + Speed Transactional Installer ===' -ForegroundColor Cyan
  Write-Host 'Keeps the V12 two-stage architecture, adds confidence control, and tunes Turbo for CPU speed.' -ForegroundColor White
  Write-Host 'The working V12 page is automatically restored if any live candidate test fails.' -ForegroundColor White
  Write-Host ''

  $assetCommit='589c1a9267e3ea96cafc28820a1db8a677d4535e'
  $raw="https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/$assetCommit"
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $shell=Join-Path $appDir 'vision-v121-shell.html'
  $js=Join-Path $appDir 'vision-v121-quality-speed.js'
  $candidate=Join-Path $appDir 'index-v121-candidate.html'
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

  Write-Host 'Step 1/8 - Verifying required Ollama models...' -ForegroundColor White
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 30
  $names=@($tags.models|ForEach-Object{$_.name})
  if($names -notcontains 'qwen3:1.7b'){
    Write-Host 'Downloading qwen3:1.7b...' -ForegroundColor Yellow
    & $ollama pull qwen3:1.7b | Out-Host
    if($LASTEXITCODE -ne 0){throw 'ollama pull qwen3:1.7b failed.'}
  }
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 30
  $names=@($tags.models|ForEach-Object{$_.name})
  $qwen2=($names|Where-Object{$_ -eq 'qwen3-vl:2b-instruct'}|Select-Object -First 1)
  if(-not $qwen2){$qwen2=($names|Where-Object{$_ -match 'qwen3-vl.*2b'}|Select-Object -First 1)}
  if(-not $qwen2){
    Write-Host 'Downloading qwen3-vl:2b-instruct...' -ForegroundColor Yellow
    & $ollama pull qwen3-vl:2b-instruct | Out-Host
    if($LASTEXITCODE -ne 0){throw 'ollama pull qwen3-vl:2b-instruct failed.'}
    $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 30
    $names=@($tags.models|ForEach-Object{$_.name})
    $qwen2=($names|Where-Object{$_ -eq 'qwen3-vl:2b-instruct'}|Select-Object -First 1)
  }
  if(-not $qwen2){throw 'Required qwen3-vl:2b-instruct model is unavailable.'}
  Write-Host "Required models ready: $qwen2 + qwen3:1.7b" -ForegroundColor Green

  Write-Host 'Step 2/8 - Creating rollback backup of the working page...' -ForegroundColor White
  if(Test-Path $app){
    $backup=Join-Path $appDir ("index-working-before-v121-"+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
    Copy-Item $app $backup -Force
    Write-Host "Rollback backup: $backup" -ForegroundColor Green
  } else {
    throw 'No current private index.html was found. Install the stable V12 Clean Room first.'
  }

  Write-Host 'Step 3/8 - Downloading exact pinned V12.1 assets...' -ForegroundColor White
  Invoke-WebRequest "$raw/vision-v121-shell.html" -OutFile $shell -UseBasicParsing
  Invoke-WebRequest "$raw/vision-v121-quality-speed.js" -OutFile $js -UseBasicParsing
  Invoke-WebRequest "$raw/private-mobile-proxy-v1186.ps1" -OutFile $bridge -UseBasicParsing
  $html=[IO.File]::ReadAllText($shell)
  $code=[IO.File]::ReadAllText($js)
  if(-not $html.Contains('<!-- VISION_V121_SCRIPT -->')){throw 'V12.1 shell injection marker is missing.'}
  if($code -notmatch 'Vision V12\.1 Quality \+ Speed'){throw 'V12.1 controller marker is missing.'}
  if($code -notmatch "px:320"){throw 'V12.1 Turbo 320px speed setting is missing.'}
  if($code -notmatch 'BANNED_CERTAINTY'){throw 'V12.1 confidence guard is missing.'}
  if($code -notmatch 'format:STRUCT_SCHEMA'){throw 'V12.1 schema-constrained structuring is missing.'}
  if($code -match 'URL\.createObjectURL'){throw 'Safari-unsafe object-URL code found.'}
  if($code -match '(?i)moondream'){throw 'Moondream routing unexpectedly found in V12.1.'}
  $combined=$html.Replace('<!-- VISION_V121_SCRIPT -->',"<script>`r`n$code`r`n</script>")
  [IO.File]::WriteAllText($candidate,$combined,[Text.Encoding]::UTF8)
  Write-Host 'Candidate V12.1 page assembled without touching the working V12 index.' -ForegroundColor Green

  Write-Host 'Step 4/8 - Starting V12.1 candidate through the private bridge...' -ForegroundColor White
  Restart-PrivateBridge $bridge $candidate $port
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Host
  $candidateLive=$true
  $info=Invoke-RestMethod "$origin/bridge-info" -TimeoutSec 30
  if($info.version -ne 'V11.8.6' -or $info.transport -ne 'StreamContent'){throw 'Private route is not using the expected StreamContent bridge.'}
  Write-Host 'Candidate bridge PASS.' -ForegroundColor Green

  Write-Host 'Step 5/8 - Testing Vision through the exact private HTTPS route...' -ForegroundColor White
  Add-Type -AssemblyName System.Drawing
  $imgPath=Join-Path $env:TEMP 'vision-v121-synthetic.jpg'
  $bmp=New-Object System.Drawing.Bitmap 128,96
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $red=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Red)
  $blue=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Blue)
  $g.FillRectangle($red,14,18,50,36)
  $g.FillEllipse($blue,78,32,36,36)
  $bmp.Save($imgPath,[System.Drawing.Imaging.ImageFormat]::Jpeg)
  $red.Dispose();$blue.Dispose();$g.Dispose();$bmp.Dispose()
  $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($imgPath))
  $sw=[Diagnostics.Stopwatch]::StartNew()
  $vision=Post-Json "$origin/ollama/api/chat" @{
    model=$qwen2
    messages=@(@{role='user';content='PLAIN TEXT ONLY. In three factual sentences describe the red rectangle, blue circle, and white background.';images=@($b64)})
    stream=$false
    think=$false
    keep_alive='2m'
    options=@{num_predict=180;num_ctx=1280;temperature=0}
  } 900
  $visionText=Chat-Text $vision
  $sw.Stop()
  if($visionText.Length -lt 25){throw 'Synthetic Vision test returned too little content.'}
  if($visionText -notmatch '(?i)red' -or $visionText -notmatch '(?i)blue'){throw "Synthetic Vision test missed expected colors: $visionText"}
  if($visionText -notmatch '(?i)(rectangle|square|box)' -or $visionText -notmatch '(?i)(circle|round|ellipse)'){throw "Synthetic Vision test missed expected shapes: $visionText"}
  Write-Host ("Private Vision PASS in "+[Math]::Round($sw.Elapsed.TotalSeconds,1)+"s") -ForegroundColor Green

  Write-Host 'Step 6/8 - Testing qwen3:1.7b confidence-aware structuring route...' -ForegroundColor White
  $sample='[CLEAR] SUBJECT: One portrait subject. [ESTIMATED] EYES: Eye color appears light but exact hue is uncertain. [CLEAR] HAIR: Light hair with blue streaks. [CLEAR] WARDROBE: Cream knit sweater. [CLEAR] CAMERA / FRAMING: Tight portrait crop. [CLEAR] LIGHTING / SHADOWS: Soft warm light.'
  $structPrompt="Return ONLY JSON with keys image_summary, reconstruction_summary, sections, keywords, reconstruction_prompt. sections must be an array of objects with name, summary, confidence. keywords must be an array of objects with text, confidence. confidence must be CLEARLY_VISIBLE or ESTIMATED. Preserve the EYES confidence as ESTIMATED. Use only this evidence: $sample"
  $struct=Post-Json "$origin/ollama/api/chat" @{
    model='qwen3:1.7b'
    messages=@(@{role='user';content=$structPrompt})
    stream=$false
    think=$false
    format='json'
    keep_alive='2m'
    options=@{num_predict=650;num_ctx=2048;temperature=0}
  } 900
  $st=Chat-Text $struct
  if($st.Length -lt 60){throw 'Structuring smoke test returned too little content.'}
  try{$so=$st|ConvertFrom-Json}catch{throw 'Structuring smoke test returned invalid JSON.'}
  if(-not $so.image_summary -or -not $so.sections -or -not $so.keywords){throw 'Structuring smoke test omitted required fields.'}
  Write-Host 'Private structuring route PASS.' -ForegroundColor Green

  Write-Host 'Step 7/8 - Verifying candidate page and V12.1 safety markers...' -ForegroundColor White
  $page=Invoke-WebRequest "$origin/?v=1210" -UseBasicParsing -TimeoutSec 45
  if($page.StatusCode -ne 200){throw "Candidate page returned HTTP $($page.StatusCode)."}
  if($page.Content -notmatch 'V12\.1 QUALITY \+ SPEED'){throw 'Served candidate is not the V12.1 Quality + Speed build.'}
  if($page.Content -notmatch 'class ProgressTracker'){throw 'Candidate page is missing the progress/ETA controller.'}
  if($page.Content -notmatch 'BANNED_CERTAINTY'){throw 'Candidate page is missing confidence safeguards.'}
  if($page.Content -notmatch 'px:320'){throw 'Candidate page is missing the Turbo speed profile.'}
  Write-Host 'Candidate page PASS.' -ForegroundColor Green

  Write-Host 'Step 8/8 - Committing candidate as the live private page...' -ForegroundColor White
  Copy-Item $candidate $app -Force
  Restart-PrivateBridge $bridge $app $port
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Null
  $final=Invoke-WebRequest "$origin/?v=1210" -UseBasicParsing -TimeoutSec 45
  if($final.StatusCode -ne 200 -or $final.Content -notmatch 'V12\.1 QUALITY \+ SPEED'){throw 'Final live V12.1 verification failed after deployment.'}
  $candidateLive=$false
  Write-Host 'Final live page PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'VISION V12.1 QUALITY + SPEED IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'Turbo: qwen3-vl:2b-instruct @ 320px' -ForegroundColor White
  Write-Host 'Vision budget: 520 tokens / 2048 context' -ForegroundColor White
  Write-Host 'Structuring: qwen3:1.7b schema / 1050 tokens / 2560 context' -ForegroundColor White
  Write-Host 'Confidence: CLEAR vs ESTIMATED, with certainty-drift rejection' -ForegroundColor White
  Write-Host "Rollback backup retained at: $backup" -ForegroundColor DarkGray
  Write-Host "Open: $origin/?v=1210" -ForegroundColor Cyan
  Start-Process "$origin/?v=1210"
}
catch {
  $originalError=$_.Exception.Message
  Write-Host ''
  Write-Host 'V12.1 candidate failed a validation step. Restoring the working V12 page...' -ForegroundColor Yellow
  if($backup -and (Test-Path $backup) -and $app -and $bridge -and $tailscale){
    try{
      Copy-Item $backup $app -Force
      Restart-PrivateBridge $bridge $app $port
      & $tailscale serve reset | Out-Null
      & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Null
      if($origin){
        $rollbackPage=Invoke-WebRequest "$origin/" -UseBasicParsing -TimeoutSec 30
        if($rollbackPage.StatusCode -eq 200){Write-Host 'ROLLBACK PASS: previous working page is live again.' -ForegroundColor Green}
      }
    }catch{
      Write-Host ("Rollback warning: "+$_.Exception.Message) -ForegroundColor Red
    }
  }
  Write-Host ''
  Write-Host 'VISION V12.1 INSTALLER STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $originalError -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'The previous V12 build was preserved/restored when possible. Send the exact visible error to ChatGPT.' -ForegroundColor Yellow
}
finally {
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
