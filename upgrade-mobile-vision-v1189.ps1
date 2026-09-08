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

$log="$env:TEMP\UltimatePromptCreator-V1189-VisionUpgrade.log"
Start-Transcript -Path $log -Force | Out-Null

function Find-Exe([string]$cmd,[string[]]$candidates){
  $g=Get-Command $cmd -ErrorAction SilentlyContinue
  if($g){return $g.Source}
  return ($candidates|Where-Object{Test-Path $_}|Select-Object -First 1)
}
function Post-Json([string]$url,$obj,[int]$timeout=600){
  $body=$obj|ConvertTo-Json -Depth 70 -Compress
  try{return Invoke-RestMethod $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec $timeout}
  catch{
    $detail=$_.Exception.Message
    try{if($_.ErrorDetails.Message){$detail="$detail | Server: $($_.ErrorDetails.Message)"}}catch{}
    throw "POST $url failed: $detail"
  }
}
function Parse-JsonText([string]$text){
  $s=[string]$text;$a=$s.IndexOf('{');$b=$s.LastIndexOf('}')
  if($a -ge 0 -and $b -gt $a){$s=$s.Substring($a,$b-$a+1)}
  return $s|ConvertFrom-Json
}

try{
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V11.8.9 Fast Vision Upgrade ===' -ForegroundColor Cyan
  Write-Host 'Turbo uses qwen3-vl:2b-instruct. Balanced/Extreme keep the 4B model available.' -ForegroundColor White
  Write-Host ''

  $repoRaw='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $appFile=Join-Path $appDir 'index.html'
  $baseFile=Join-Path $appDir 'base-v118.html'
  $scripts=@('mobile-selfheal-v1184.js','mobile-v1185-hotfix.js','mobile-v1186-hotfix.js','mobile-v1187-quality.js','mobile-v1188-vision.js','mobile-v1189-fast-vision.js')
  $bridgeFile=Join-Path $appDir 'private-mobile-proxy-v1186.ps1'
  $port=8765

  $tailscale=Find-Exe 'tailscale' @("$env:ProgramFiles\Tailscale\tailscale.exe","$env:LOCALAPPDATA\Tailscale\tailscale.exe")
  $ollama=Find-Exe 'ollama' @("$env:LOCALAPPDATA\Programs\Ollama\ollama.exe","$env:LOCALAPPDATA\Ollama\ollama.exe","$env:ProgramFiles\Ollama\ollama.exe")
  if(-not $tailscale){throw 'Could not locate tailscale.exe.'}
  if(-not $ollama){throw 'Could not locate ollama.exe.'}

  $ts=& $tailscale status --json|ConvertFrom-Json
  $dns=([string]$ts.Self.DNSName).TrimEnd('.')
  if(-not $dns){throw 'Could not determine Tailscale MagicDNS hostname.'}
  $origin="https://$dns"
  Write-Host "Private URL: $origin/" -ForegroundColor Green

  Write-Host 'Step 1/8 - Downloading V11.8.9 app files...' -ForegroundColor White
  Invoke-WebRequest "$repoRaw/mobile-private-v118.html" -OutFile $baseFile -UseBasicParsing
  foreach($s in $scripts){Invoke-WebRequest "$repoRaw/$s" -OutFile (Join-Path $appDir $s) -UseBasicParsing}
  Invoke-WebRequest "$repoRaw/private-mobile-proxy-v1186.ps1" -OutFile $bridgeFile -UseBasicParsing
  $base=[IO.File]::ReadAllText($baseFile)
  $base=$base.Replace('Ultimate Prompt Creator V11.8 Private Mobile','Ultimate Prompt Creator V11.8.9 Fast Vision').Replace('V11.8 PRIVATE MOBILE','V11.8.9 FAST VISION')
  $inject=($scripts|ForEach-Object{"<script>`r`n$([IO.File]::ReadAllText((Join-Path $appDir $_)))`r`n</script>"}) -join "`r`n"
  $combined=$base.Replace('</body>',$inject+"`r`n</body>")
  [IO.File]::WriteAllText($appFile,$combined,[Text.Encoding]::UTF8)
  Write-Host 'V11.8.9 app assembled.' -ForegroundColor Green

  Write-Host 'Step 2/8 - Verifying Ollama and installing fast Vision model if needed...' -ForegroundColor White
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 15
  $names=@($tags.models|ForEach-Object{$_.name})
  $fastModel='qwen3-vl:2b-instruct'
  if($names -notcontains $fastModel){
    Write-Host 'Installing qwen3-vl:2b-instruct (about 1.9 GB, one time)...' -ForegroundColor Yellow
    & $ollama pull $fastModel | Out-Host
    if($LASTEXITCODE -ne 0){throw 'ollama pull qwen3-vl:2b-instruct failed.'}
    $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 15
    $names=@($tags.models|ForEach-Object{$_.name})
  }
  if($names -notcontains $fastModel){throw 'qwen3-vl:2b-instruct is not installed.'}
  Write-Host "Fast Vision model READY: $fastModel" -ForegroundColor Green
  if($names -contains 'qwen3-vl:4b-instruct'){Write-Host 'Quality Vision model READY: qwen3-vl:4b-instruct' -ForegroundColor Green}

  Write-Host 'Step 3/8 - Warming the 2B model directly in Ollama...' -ForegroundColor White
  $warm=Post-Json 'http://127.0.0.1:11434/api/chat' @{
    model=$fastModel;messages=@(@{role='user';content='Reply READY'});stream=$false;think=$false;keep_alive='30m';
    options=@{num_predict=16;num_ctx=1024;temperature=0}
  } 600
  if(-not ([string]$warm.message.content).Trim()){throw 'Direct Ollama warm-up returned no content.'}
  Write-Host '2B model warm-up PASS.' -ForegroundColor Green
  Write-Host 'Current Ollama processor placement:' -ForegroundColor White
  & $ollama ps | Out-Host

  Write-Host 'Step 4/8 - Creating small synthetic image and testing Vision DIRECTLY against Ollama...' -ForegroundColor White
  Add-Type -AssemblyName System.Drawing
  $imgPath=Join-Path $env:TEMP 'upc-v1189-vision-test.jpg'
  $bmp=New-Object System.Drawing.Bitmap 384,384
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $red=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Red)
  $blue=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Blue)
  $g.FillRectangle($red,52,58,280,190)
  $g.FillEllipse($blue,132,278,120,72)
  $bmp.Save($imgPath,[System.Drawing.Imaging.ImageFormat]::Jpeg)
  $red.Dispose();$blue.Dispose();$g.Dispose();$bmp.Dispose()
  $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($imgPath))

  $direct=Post-Json 'http://127.0.0.1:11434/api/chat' @{
    model=$fastModel;messages=@(@{role='user';content='In one short sentence describe the dominant shapes and colors in this image.';images=@($b64)});
    stream=$false;think=$false;keep_alive='30m';options=@{num_predict=80;num_ctx=1536;temperature=0}
  } 600
  $directText=([string]$direct.message.content).Trim()
  if(-not $directText){throw 'Direct 2B Vision test returned no final content.'}
  Write-Host "Direct Vision PASS: $directText" -ForegroundColor Green

  Write-Host 'Step 5/8 - Restarting proven V11.8.6 StreamContent bridge with V11.8.9 app...' -ForegroundColor White
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object{$_.CommandLine -like '*private-mobile-proxy-v118*.ps1*'} |
    ForEach-Object{try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}}
  Start-Sleep 2
  $args="-NoProfile -ExecutionPolicy Bypass -File `"$bridgeFile`" -AppFile `"$appFile`" -Port $port"
  Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden
  $ready=$false
  for($i=0;$i -lt 30;$i++){
    try{$info=Invoke-RestMethod "http://127.0.0.1:$port/bridge-info" -TimeoutSec 2;if($info.version -eq 'V11.8.6' -and $info.transport -eq 'StreamContent'){$ready=$true;break}}catch{}
    Start-Sleep 1
  }
  if(-not $ready){throw 'V11.8.6 StreamContent bridge did not restart.'}
  Write-Host 'Bridge READY.' -ForegroundColor Green

  Write-Host 'Step 6/8 - Testing 2B Vision through LOCAL bridge...' -ForegroundColor White
  $bridgeVision=Post-Json "http://127.0.0.1:$port/ollama/api/chat" @{
    model=$fastModel;messages=@(@{role='user';content='Briefly describe the dominant shapes and colors.';images=@($b64)});
    stream=$false;think=$false;keep_alive='30m';options=@{num_predict=80;num_ctx=1536;temperature=0}
  } 600
  $bt=([string]$bridgeVision.message.content).Trim();if(-not $bt){throw 'Local bridge 2B Vision returned no content.'}
  Write-Host "Local bridge Vision PASS: $bt" -ForegroundColor Green

  Write-Host 'Step 7/8 - Configuring/checking private Tailscale HTTPS root proxy...' -ForegroundColor White
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Host
  $bi=Invoke-RestMethod "$origin/bridge-info" -TimeoutSec 30
  if($bi.version -ne 'V11.8.6'){throw 'Private route is not pointing to the StreamContent bridge.'}
  Write-Host 'Private bridge route PASS.' -ForegroundColor Green

  Write-Host 'Step 8/8 - Testing exact iPhone HTTPS Vision route...' -ForegroundColor White
  $privateVision=Post-Json "$origin/ollama/api/chat" @{
    model=$fastModel;messages=@(@{role='user';content='Return ONLY JSON: {"image_summary":"short summary","facts":[{"section":"Color","fact":"visible fact","confidence":"CLEARLY_VISIBLE","evidence":"visible evidence"}]}. Analyze only the synthetic image.';images=@($b64)});
    stream=$false;think=$false;format='json';keep_alive='30m';options=@{num_predict=320;num_ctx=2048;temperature=0}
  } 600
  $vo=Parse-JsonText ([string]$privateVision.message.content)
  if(-not $vo.image_summary -or -not $vo.facts){throw 'Private HTTPS 2B Vision JSON did not contain image_summary + facts.'}
  Write-Host 'Private HTTPS 2B Vision JSON PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'FAST VISION PASSED - V11.8.9 IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'Turbo now prefers qwen3-vl:2b-instruct; Balanced/Extreme prefer the 4B model when available.' -ForegroundColor White
  Write-Host "Open: $origin/?v=1189" -ForegroundColor Cyan
  Start-Process "$origin/?v=1189"
}
catch{
  Write-Host ''
  Write-Host 'V11.8.9 FAST VISION UPGRADE / SELF-TEST STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'Leave this window open and send the visible error to ChatGPT.' -ForegroundColor Yellow
}
finally{
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
