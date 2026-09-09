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

$log="$env:TEMP\UltimatePromptCreator-V1193-CPU.log"
Start-Transcript -Path $log -Force | Out-Null

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
function Preview([string]$text,[int]$max=120){
  $clean=([string]$text).Replace("`r",' ').Replace("`n",' ').Trim()
  if($clean.Length -le $max){return $clean}
  return $clean.Substring(0,$max)
}

try {
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V11.9.3 CPU Edition Installer ===' -ForegroundColor Cyan
  Write-Host 'Optimized for CPU-only Vega 8 hardware: Moondream Turbo + qwen3:1.7b structuring.' -ForegroundColor White
  Write-Host ''

  $repo='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $shell=Join-Path $appDir 'mobile-v1193-shell.html'
  $js=Join-Path $appDir 'mobile-v1193-cpu.js'
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
  if(-not $dns){throw 'Could not determine Tailscale hostname.'}
  $origin="https://$dns"
  Write-Host "Private URL: $origin/" -ForegroundColor Green

  Write-Host 'Step 1/7 - Verifying Ollama...' -ForegroundColor White
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20
  $names=@($tags.models|ForEach-Object{$_.name})
  if($names -notcontains 'qwen3:1.7b'){throw 'qwen3:1.7b is missing. Install it with: ollama pull qwen3:1.7b'}
  Write-Host 'qwen3:1.7b ready.' -ForegroundColor Green

  Write-Host 'Step 2/7 - Installing/checking Moondream Turbo model...' -ForegroundColor White
  $moon=($names|Where-Object{$_ -match '^moondream(?::|$)'}|Select-Object -First 1)
  if(-not $moon){
    Write-Host 'Downloading Moondream once (about 1.7 GB)...' -ForegroundColor Yellow
    & $ollama pull moondream | Out-Host
    if($LASTEXITCODE -ne 0){throw 'ollama pull moondream failed.'}
    $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20
    $names=@($tags.models|ForEach-Object{$_.name})
    $moon=($names|Where-Object{$_ -match '^moondream(?::|$)'}|Select-Object -First 1)
  }
  if(-not $moon){throw 'Moondream did not appear in Ollama model list.'}
  Write-Host "Turbo model ready: $moon" -ForegroundColor Green

  Write-Host 'Step 3/7 - Unloading heavy Vision models from RAM...' -ForegroundColor White
  foreach($m in @('qwen3-vl:4b-instruct','qwen3-vl:2b-instruct')){
    try{& $ollama stop $m | Out-Null}catch{}
  }
  Write-Host 'Heavy Vision models unloaded; they remain installed for Balanced/Extreme.' -ForegroundColor Green

  Write-Host 'Step 4/7 - Building fresh V11.9.3 private page...' -ForegroundColor White
  Invoke-WebRequest "$repo/mobile-v1193-shell.html" -OutFile $shell -UseBasicParsing
  Invoke-WebRequest "$repo/mobile-v1193-cpu.js" -OutFile $js -UseBasicParsing
  Invoke-WebRequest "$repo/private-mobile-proxy-v1186.ps1" -OutFile $bridge -UseBasicParsing
  $html=[IO.File]::ReadAllText($shell)
  $code=[IO.File]::ReadAllText($js)
  if(-not $html.Contains('<!-- UPC_APP_SCRIPT -->')){throw 'V11.9.3 shell marker missing.'}
  $html=$html.Replace('<!-- UPC_APP_SCRIPT -->',"<script>`r`n$code`r`n</script>")
  [IO.File]::WriteAllText($app,$html,[Text.Encoding]::UTF8)
  Write-Host 'Fresh CPU Edition page built with no legacy Vision scripts.' -ForegroundColor Green

  Write-Host 'Step 5/7 - Restarting private StreamContent bridge...' -ForegroundColor White
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object{$_.CommandLine -like '*private-mobile-proxy-v118*.ps1*'} |
    ForEach-Object{try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}}
  Start-Sleep 2
  $args="-NoProfile -ExecutionPolicy Bypass -File `"$bridge`" -AppFile `"$app`" -Port $port"
  Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden
  $ready=$false
  for($i=0;$i -lt 30;$i++){
    try{$info=Invoke-RestMethod "http://127.0.0.1:$port/bridge-info" -TimeoutSec 2;if($info.version -eq 'V11.8.6'){$ready=$true;break}}catch{}
    Start-Sleep 1
  }
  if(-not $ready){throw 'StreamContent bridge did not start.'}
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Host
  Write-Host 'Private bridge ready.' -ForegroundColor Green

  Write-Host 'Step 6/7 - Running fast Moondream Vision smoke test...' -ForegroundColor White
  Add-Type -AssemblyName System.Drawing
  $test=Join-Path $env:TEMP 'upc-v1193-test.jpg'
  $bmp=New-Object System.Drawing.Bitmap 128,128
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $brush=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Red)
  $g.FillRectangle($brush,24,30,80,54)
  $bmp.Save($test,[System.Drawing.Imaging.ImageFormat]::Jpeg)
  $brush.Dispose();$g.Dispose();$bmp.Dispose()
  $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($test))
  $sw=[Diagnostics.Stopwatch]::StartNew()
  $v=Post-Json "$origin/ollama/api/chat" @{
    model=$moon
    messages=@(@{role='user';content='PLAIN TEXT ONLY. Briefly describe the visible shape and color.';images=@($b64)})
    stream=$false
    keep_alive='30m'
    options=@{num_predict=100;num_ctx=1536;temperature=0}
  } 600
  $sw.Stop()
  $vt=([string]$v.message.content).Trim()
  if($vt.Length -lt 10){throw 'Moondream smoke test returned no useful content.'}
  Write-Host ("Moondream PASS in "+[Math]::Round($sw.Elapsed.TotalSeconds,1)+"s: "+(Preview $vt)) -ForegroundColor Green

  Write-Host 'Step 7/7 - Testing qwen3:1.7b structuring through private route...' -ForegroundColor White
  $s=Post-Json "$origin/ollama/api/chat" @{
    model='qwen3:1.7b'
    messages=@(@{role='user';content='Return ONLY JSON with keys image_summary, reconstruction_summary, sections. sections must be an array. Use this evidence only: A red rectangle appears on a white background.'})
    stream=$false
    think=$false
    format='json'
    keep_alive='30m'
    options=@{num_predict=400;num_ctx=2048;temperature=0}
  } 600
  $st=([string]$s.message.content).Trim()
  if($st -notmatch 'image_summary'){throw 'qwen3:1.7b JSON structuring smoke test failed.'}
  Write-Host 'qwen3:1.7b structuring PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'V11.9.3 CPU EDITION IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host "Open: $origin/?v=1193" -ForegroundColor Cyan
  Write-Host 'Turbo = Moondream 448px | Balanced = Qwen VL 2B | Extreme = Qwen VL 4B' -ForegroundColor White
  Start-Process "$origin/?v=1193"
}
catch {
  Write-Host ''
  Write-Host 'V11.9.3 CPU EDITION INSTALLER STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'Leave this window open and send this exact error to ChatGPT.' -ForegroundColor Yellow
}
finally {
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
