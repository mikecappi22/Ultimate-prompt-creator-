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

$log="$env:TEMP\UltimatePromptCreator-V1194-FAST.log"
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
function Text-FromGenerate($obj){
  $t=([string]$obj.response).Trim()
  if(-not $t){$t=([string]$obj.thinking).Trim()}
  return $t
}
function Text-FromChat($obj){
  $t=([string]$obj.message.content).Trim()
  if(-not $t){$t=([string]$obj.message.thinking).Trim()}
  return $t
}
function Preview([string]$text,[int]$max=140){
  $clean=([string]$text).Replace("`r",' ').Replace("`n",' ').Trim()
  if($clean.Length -le $max){return $clean}
  return $clean.Substring(0,$max)
}

try {
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V11.9.4 Fast CPU Installer ===' -ForegroundColor Cyan
  Write-Host 'Non-blocking Vision adapter: Moondream generate -> Moondream chat -> Qwen VL 2B fallback.' -ForegroundColor White
  Write-Host ''

  $repo='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $shell=Join-Path $appDir 'mobile-v1193-shell.html'
  $js=Join-Path $appDir 'mobile-v1194-fast-cpu.js'
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

  Write-Host 'Step 1/7 - Verifying models...' -ForegroundColor White
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20
  $names=@($tags.models|ForEach-Object{$_.name})
  if($names -notcontains 'qwen3:1.7b'){throw 'qwen3:1.7b is missing.'}
  if(-not ($names|Where-Object{$_ -match '^moondream(?::|$)'})){
    Write-Host 'Downloading Moondream once...' -ForegroundColor Yellow
    & $ollama pull moondream | Out-Host
  }
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20
  $names=@($tags.models|ForEach-Object{$_.name})
  $moon=($names|Where-Object{$_ -match '^moondream(?::|$)'}|Select-Object -First 1)
  $qwen2=($names|Where-Object{$_ -eq 'qwen3-vl:2b-instruct'}|Select-Object -First 1)
  if(-not $qwen2){$qwen2=($names|Where-Object{$_ -match 'qwen3-vl.*2b'}|Select-Object -First 1)}
  if(-not $qwen2){
    Write-Host 'Qwen VL 2B fallback is missing; downloading it once...' -ForegroundColor Yellow
    & $ollama pull qwen3-vl:2b-instruct | Out-Host
    $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20
    $names=@($tags.models|ForEach-Object{$_.name})
    $qwen2=($names|Where-Object{$_ -eq 'qwen3-vl:2b-instruct'}|Select-Object -First 1)
  }
  if(-not $moon){Write-Host 'WARNING: Moondream is unavailable. Turbo will use Qwen VL 2B.' -ForegroundColor Yellow}
  if(-not $qwen2){throw 'No usable Turbo Vision fallback is installed.'}
  Write-Host "Text: qwen3:1.7b | Moondream: $moon | Qwen fallback: $qwen2" -ForegroundColor Green

  Write-Host 'Step 2/7 - Unloading heavy models from RAM...' -ForegroundColor White
  foreach($m in @('qwen3-vl:4b-instruct','qwen3-vl:2b-instruct','moondream:latest','moondream')){
    try{& $ollama stop $m | Out-Null}catch{}
  }
  Write-Host 'RAM cleared. Models remain installed.' -ForegroundColor Green

  Write-Host 'Step 3/7 - Building fresh V11.9.4 page...' -ForegroundColor White
  Invoke-WebRequest "$repo/mobile-v1193-shell.html" -OutFile $shell -UseBasicParsing
  Invoke-WebRequest "$repo/mobile-v1194-fast-cpu.js" -OutFile $js -UseBasicParsing
  Invoke-WebRequest "$repo/private-mobile-proxy-v1186.ps1" -OutFile $bridge -UseBasicParsing
  $html=[IO.File]::ReadAllText($shell)
  $code=[IO.File]::ReadAllText($js)
  if(-not $html.Contains('<!-- UPC_APP_SCRIPT -->')){throw 'App shell injection marker missing.'}
  $html=$html.Replace('V11.9.3 CPU Edition','V11.9.4 Fast CPU')
  $html=$html.Replace('V11.9.3 CPU EDITION','V11.9.4 FAST CPU')
  $html=$html.Replace('<!-- UPC_APP_SCRIPT -->',"<script>`r`n$code`r`n</script>")
  [IO.File]::WriteAllText($app,$html,[Text.Encoding]::UTF8)
  Write-Host 'Fresh V11.9.4 page built.' -ForegroundColor Green

  Write-Host 'Step 4/7 - Restarting private bridge...' -ForegroundColor White
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

  Write-Host 'Step 5/7 - Testing Turbo Vision adapter...' -ForegroundColor White
  Add-Type -AssemblyName System.Drawing
  $test=Join-Path $env:TEMP 'upc-v1194-test.jpg'
  $bmp=New-Object System.Drawing.Bitmap 96,96
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $brush=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Red)
  $g.FillRectangle($brush,20,24,56,38)
  $bmp.Save($test,[System.Drawing.Imaging.ImageFormat]::Jpeg)
  $brush.Dispose();$g.Dispose();$bmp.Dispose()
  $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($test))
  $prompt='Plain text only. Describe the visible shape and color in one short sentence.'
  $visionText=''
  $visionPath=''
  $sw=[Diagnostics.Stopwatch]::StartNew()

  if($moon){
    try{
      $gen=Post-Json "$origin/ollama/api/generate" @{
        model=$moon;prompt=$prompt;images=@($b64);stream=$false;keep_alive='10m';options=@{num_predict=120;num_ctx=1536;temperature=0}
      } 600
      $visionText=Text-FromGenerate $gen
      if($visionText.Length -ge 20){$visionPath='Moondream /api/generate'}
    }catch{Write-Host ("Moondream generate warning: "+$_.Exception.Message) -ForegroundColor Yellow}
    if($visionText.Length -lt 20){
      try{
        $chat=Post-Json "$origin/ollama/api/chat" @{
          model=$moon;messages=@(@{role='user';content=$prompt;images=@($b64)});stream=$false;keep_alive='10m';options=@{num_predict=120;num_ctx=1536;temperature=0}
        } 600
        $visionText=Text-FromChat $chat
        if($visionText.Length -ge 20){$visionPath='Moondream /api/chat'}
      }catch{Write-Host ("Moondream chat warning: "+$_.Exception.Message) -ForegroundColor Yellow}
    }
  }

  if($visionText.Length -lt 20){
    Write-Host 'Moondream did not return usable text; testing Qwen VL 2B fallback...' -ForegroundColor Yellow
    $fallback=Post-Json "$origin/ollama/api/chat" @{
      model=$qwen2;messages=@(@{role='user';content=$prompt;images=@($b64)});stream=$false;think=$false;keep_alive='10m';options=@{num_predict=100;num_ctx=1536;temperature=0}
    } 600
    $visionText=Text-FromChat $fallback
    $visionPath='Qwen VL 2B fallback'
  }
  $sw.Stop()
  if($visionText.Length -lt 20){throw 'All Turbo Vision paths returned empty output.'}
  Write-Host ("Turbo Vision PASS in "+[Math]::Round($sw.Elapsed.TotalSeconds,1)+"s via "+$visionPath+": "+(Preview $visionText)) -ForegroundColor Green

  Write-Host 'Step 6/7 - Testing qwen3:1.7b structuring...' -ForegroundColor White
  $s=Post-Json "$origin/ollama/api/chat" @{
    model='qwen3:1.7b';messages=@(@{role='user';content='Return ONLY JSON with keys image_summary, reconstruction_summary, sections. sections must be an array. Use only this evidence: A red rectangle appears on a white background.'});stream=$false;think=$false;format='json';keep_alive='10m';options=@{num_predict=450;num_ctx=2048;temperature=0}
  } 600
  $st=([string]$s.message.content).Trim()
  if($st -notmatch 'image_summary'){throw 'qwen3:1.7b structuring test failed.'}
  Write-Host 'Structuring PASS.' -ForegroundColor Green

  Write-Host 'Step 7/7 - Final private page check...' -ForegroundColor White
  $page=Invoke-WebRequest "$origin/?v=1194" -UseBasicParsing -TimeoutSec 30
  if($page.StatusCode -ne 200 -or $page.Content -notmatch 'V11.9.4'){throw 'Private V11.9.4 page check failed.'}
  Write-Host 'Private page PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'V11.9.4 FAST CPU IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host ("Turbo path verified: "+$visionPath) -ForegroundColor White
  Write-Host "Open: $origin/?v=1194" -ForegroundColor Cyan
  Start-Process "$origin/?v=1194"
}
catch {
  Write-Host ''
  Write-Host 'V11.9.4 FAST CPU INSTALLER STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'Leave this window open and send this exact error to ChatGPT.' -ForegroundColor Yellow
}
finally {
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
