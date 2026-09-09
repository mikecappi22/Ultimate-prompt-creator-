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

$log="$env:TEMP\UltimatePromptCreator-V12-CleanRoom.log"
Start-Transcript -Path $log -Force | Out-Null

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

try {
  Write-Host ''
  Write-Host '=== Vision V12 Clean Room Installer ===' -ForegroundColor Cyan
  Write-Host 'Fresh standalone Vision page. No V11 Vision handlers and no Moondream routing.' -ForegroundColor White
  Write-Host ''

  $assetCommit='ff29edf2a454a4d4d499ad3f42aeef055af0e0a1'
  $raw="https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/$assetCommit"
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $shell=Join-Path $appDir 'vision-v12-clean-shell.html'
  $js=Join-Path $appDir 'vision-v12-clean.js'
  $app=Join-Path $appDir 'index.html'
  $bridge=Join-Path $appDir 'private-mobile-proxy-v1186.ps1'
  $port=8765

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

  Write-Host 'Step 1/7 - Verifying required Ollama models...' -ForegroundColor White
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

  Write-Host 'Step 2/7 - Backing up the previous private app...' -ForegroundColor White
  if(Test-Path $app){
    $backup=Join-Path $appDir ("index-before-v12-"+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
    Copy-Item $app $backup -Force
    Write-Host "Backup: $backup" -ForegroundColor Green
  } else {
    Write-Host 'No previous index.html found; nothing to back up.' -ForegroundColor DarkGray
  }

  Write-Host 'Step 3/7 - Downloading and assembling the exact validated V12 build...' -ForegroundColor White
  Invoke-WebRequest "$raw/vision-v12-clean-shell.html" -OutFile $shell -UseBasicParsing
  Invoke-WebRequest "$raw/vision-v12-clean.js" -OutFile $js -UseBasicParsing
  Invoke-WebRequest "$raw/private-mobile-proxy-v1186.ps1" -OutFile $bridge -UseBasicParsing
  $html=[IO.File]::ReadAllText($shell)
  $code=[IO.File]::ReadAllText($js)
  if(-not $html.Contains('<!-- VISION_V12_SCRIPT -->')){throw 'V12 shell injection marker is missing.'}
  if($code -notmatch 'Vision V12 Clean Room'){throw 'V12 controller marker is missing.'}
  if($code -match 'URL\.createObjectURL'){throw 'Unsafe object-URL code found in V12 controller.'}
  if($code -match '(?i)moondream'){throw 'Moondream routing unexpectedly found in V12 controller.'}
  $combined=$html.Replace('<!-- VISION_V12_SCRIPT -->',"<script>`r`n$code`r`n</script>")
  [IO.File]::WriteAllText($app,$combined,[Text.Encoding]::UTF8)
  Write-Host 'Standalone V12 page assembled.' -ForegroundColor Green

  Write-Host 'Step 4/7 - Restarting the private StreamContent bridge...' -ForegroundColor White
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object{$_.CommandLine -like '*private-mobile-proxy-v118*.ps1*'} |
    ForEach-Object{try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}}
  Start-Sleep 2
  $args="-NoProfile -ExecutionPolicy Bypass -File `"$bridge`" -AppFile `"$app`" -Port $port"
  Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden
  $ready=$false
  for($i=0;$i -lt 35;$i++){
    try{
      $info=Invoke-RestMethod "http://127.0.0.1:$port/bridge-info" -TimeoutSec 2
      if($info.version -eq 'V11.8.6' -and $info.transport -eq 'StreamContent'){$ready=$true;break}
    }catch{}
    Start-Sleep 1
  }
  if(-not $ready){throw 'StreamContent bridge did not become ready.'}
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Host
  Write-Host 'Private bridge ready.' -ForegroundColor Green

  Write-Host 'Step 5/7 - Testing Vision through the exact private HTTPS route...' -ForegroundColor White
  Add-Type -AssemblyName System.Drawing
  $imgPath=Join-Path $env:TEMP 'vision-v12-synthetic.jpg'
  $bmp=New-Object System.Drawing.Bitmap 160,120
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $red=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Red)
  $blue=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Blue)
  $g.FillRectangle($red,18,22,64,46)
  $g.FillEllipse($blue,102,56,42,42)
  $bmp.Save($imgPath,[System.Drawing.Imaging.ImageFormat]::Jpeg)
  $red.Dispose();$blue.Dispose();$g.Dispose();$bmp.Dispose()
  $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($imgPath))
  $sw=[Diagnostics.Stopwatch]::StartNew()
  $vision=Post-Json "$origin/ollama/api/chat" @{
    model=$qwen2
    messages=@(@{role='user';content='PLAIN TEXT ONLY. Describe the red rectangle, blue circle, and white background in 3-5 factual sentences.';images=@($b64)})
    stream=$false
    think=$false
    keep_alive='5m'
    options=@{num_predict=220;num_ctx=1536;temperature=0}
  } 900
  $visionText=Chat-Text $vision
  $sw.Stop()
  if($visionText.Length -lt 25){throw 'Synthetic Vision test returned too little content.'}
  if($visionText -notmatch '(?i)red' -or $visionText -notmatch '(?i)blue'){throw "Synthetic Vision test missed expected colors: $visionText"}
  Write-Host ("Vision route PASS in "+[Math]::Round($sw.Elapsed.TotalSeconds,1)+"s") -ForegroundColor Green

  Write-Host 'Step 6/7 - Testing qwen3:1.7b structuring through the private route...' -ForegroundColor White
  $sample='OBJECTS / TEXT: A red rectangle is on the left and a blue circle is on the right. BACKGROUND / ENVIRONMENT: Plain white background. COLORS: Red, blue, white. COMPOSITION: Two separated shapes.'
  $struct=Post-Json "$origin/ollama/api/chat" @{
    model='qwen3:1.7b'
    messages=@(@{role='user';content=("Return ONLY JSON with keys image_summary, reconstruction_summary, sections, keywords, reconstruction_prompt. sections must be an array and keywords must be an array. Use only this evidence: "+$sample)})
    stream=$false
    think=$false
    format='json'
    keep_alive='5m'
    options=@{num_predict=700;num_ctx=2304;temperature=0}
  } 900
  $st=Chat-Text $struct
  if($st -notmatch 'image_summary' -or $st -notmatch 'sections'){throw 'Structuring smoke test did not return required fields.'}
  Write-Host 'Structuring route PASS.' -ForegroundColor Green

  Write-Host 'Step 7/7 - Verifying the served V12 page...' -ForegroundColor White
  $page=Invoke-WebRequest "$origin/?v=1200" -UseBasicParsing -TimeoutSec 45
  if($page.StatusCode -ne 200){throw "Private page returned HTTP $($page.StatusCode)."}
  if($page.Content -notmatch 'V12 CLEAN ROOM'){throw 'Served page is not the V12 Clean Room build.'}
  if($page.Content -notmatch 'class ProgressTracker'){throw 'Served page is missing the progress/ETA controller.'}
  Write-Host 'Served page PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'VISION V12 CLEAN ROOM IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'Turbo: qwen3-vl:2b-instruct @ 384px' -ForegroundColor White
  Write-Host 'Structuring: qwen3:1.7b' -ForegroundColor White
  Write-Host 'Progress: full-width percentage + learned ETA' -ForegroundColor White
  Write-Host "Open: $origin/?v=1200" -ForegroundColor Cyan
  Start-Process "$origin/?v=1200"
}
catch {
  Write-Host ''
  Write-Host 'VISION V12 INSTALLER STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'Leave this window open and send the exact visible error to ChatGPT.' -ForegroundColor Yellow
}
finally {
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
