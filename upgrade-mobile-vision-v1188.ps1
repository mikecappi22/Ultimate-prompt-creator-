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

$log="$env:TEMP\UltimatePromptCreator-V1188-VisionUpgrade.log"
Start-Transcript -Path $log -Force | Out-Null

function Find-Exe([string]$cmd,[string[]]$candidates){
  $g=Get-Command $cmd -ErrorAction SilentlyContinue
  if($g){return $g.Source}
  return ($candidates|Where-Object{Test-Path $_}|Select-Object -First 1)
}
function Post-Json([string]$url,$obj,[int]$timeout=300){
  $body=$obj|ConvertTo-Json -Depth 60 -Compress
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
  Write-Host '=== Ultimate Prompt Creator V11.8.8 Safari-Safe Vision Upgrade ===' -ForegroundColor Cyan
  Write-Host 'Keeps the proven V11.8.6 StreamContent bridge and V11.8.7 Director. Replaces Vision image handling with FileReader/DataURL.' -ForegroundColor White
  Write-Host ''

  $repoRaw='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $appFile=Join-Path $appDir 'index.html'
  $baseFile=Join-Path $appDir 'base-v118.html'
  $scripts=@(
    'mobile-selfheal-v1184.js',
    'mobile-v1185-hotfix.js',
    'mobile-v1186-hotfix.js',
    'mobile-v1187-quality.js',
    'mobile-v1188-vision.js'
  )
  $bridgeFile=Join-Path $appDir 'private-mobile-proxy-v1186.ps1'
  $port=8765

  $tailscale=Find-Exe 'tailscale' @("$env:ProgramFiles\Tailscale\tailscale.exe","$env:LOCALAPPDATA\Tailscale\tailscale.exe")
  if(-not $tailscale){throw 'Could not locate tailscale.exe.'}
  $ts=& $tailscale status --json|ConvertFrom-Json
  $dns=([string]$ts.Self.DNSName).TrimEnd('.')
  if(-not $dns){throw 'Could not determine the Tailscale MagicDNS hostname.'}
  $origin="https://$dns"
  Write-Host "Private URL: $origin/" -ForegroundColor Green

  Write-Host 'Step 1/6 - Downloading V11.8.8 Vision module...' -ForegroundColor White
  Invoke-WebRequest "$repoRaw/mobile-private-v118.html" -OutFile $baseFile -UseBasicParsing
  foreach($s in $scripts){Invoke-WebRequest "$repoRaw/$s" -OutFile (Join-Path $appDir $s) -UseBasicParsing}
  Invoke-WebRequest "$repoRaw/private-mobile-proxy-v1186.ps1" -OutFile $bridgeFile -UseBasicParsing

  $base=[IO.File]::ReadAllText($baseFile)
  $base=$base.Replace('Ultimate Prompt Creator V11.8 Private Mobile','Ultimate Prompt Creator V11.8.8 Safari Vision').Replace('V11.8 PRIVATE MOBILE','V11.8.8 SAFARI VISION')
  $inject=($scripts|ForEach-Object{"<script>`r`n$([IO.File]::ReadAllText((Join-Path $appDir $_)))`r`n</script>"}) -join "`r`n"
  $combined=$base.Replace('</body>',$inject+"`r`n</body>")
  [IO.File]::WriteAllText($appFile,$combined,[Text.Encoding]::UTF8)
  Write-Host 'V11.8.8 app assembled.' -ForegroundColor Green

  Write-Host 'Step 2/6 - Restarting the known-good V11.8.6 StreamContent bridge...' -ForegroundColor White
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
  if(-not $ready){throw 'V11.8.6 StreamContent bridge did not restart correctly.'}
  Write-Host 'Bridge READY: V11.8.6 StreamContent.' -ForegroundColor Green

  Write-Host 'Step 3/6 - Verifying Ollama models through the bridge...' -ForegroundColor White
  $tags=Invoke-RestMethod "http://127.0.0.1:$port/ollama/api/tags" -TimeoutSec 20
  $names=@($tags.models|ForEach-Object{$_.name})
  $visionModel=($names|Where-Object{$_ -match 'qwen3-vl|llava|vision|gemma3'}|Select-Object -First 1)
  $textModel=($names|Where-Object{$_ -eq 'qwen3:1.7b'}|Select-Object -First 1)
  if(-not $visionModel){throw 'No vision-capable model is installed.'}
  if(-not $textModel){Write-Host 'qwen3:1.7b was not found; Vision can still extract facts but reconstruction will use fallback grouping.' -ForegroundColor Yellow}
  Write-Host "Vision model: $visionModel" -ForegroundColor Green
  if($textModel){Write-Host "Text synthesis model: $textModel" -ForegroundColor Green}

  Write-Host 'Step 4/6 - Creating a synthetic image and testing Vision through LOCAL bridge...' -ForegroundColor White
  Add-Type -AssemblyName System.Drawing
  $imgPath=Join-Path $env:TEMP 'upc-v1188-vision-test.jpg'
  $bmp=New-Object System.Drawing.Bitmap 512,512
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $red=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Red)
  $blue=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Blue)
  $g.FillRectangle($red,70,80,360,230)
  $g.FillEllipse($blue,176,350,160,100)
  $bmp.Save($imgPath,[System.Drawing.Imaging.ImageFormat]::Jpeg)
  $red.Dispose();$blue.Dispose();$g.Dispose();$bmp.Dispose()
  $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($imgPath))

  $plain=Post-Json "http://127.0.0.1:$port/ollama/api/chat" @{
    model=$visionModel;messages=@(@{role='user';content='Briefly describe the dominant shapes and colors in this synthetic image.';images=@($b64)});
    stream=$false;think=$false;keep_alive='10m';options=@{num_predict=160;num_ctx=2048;temperature=0}
  } 240
  $plainText=([string]$plain.message.content).Trim()
  if(-not $plainText){throw 'Local bridge Vision smoke test returned no final content.'}
  Write-Host "Local Vision PASS: $plainText" -ForegroundColor Green

  Write-Host 'Step 5/6 - Testing production-style Vision JSON through the LOCAL bridge...' -ForegroundColor White
  $jsonPrompt='Return ONLY JSON with this exact shape: {"image_summary":"short description","facts":[{"section":"Color","fact":"visible fact","confidence":"CLEARLY_VISIBLE","evidence":"visible evidence"}]}. Analyze the synthetic image only.'
  $vj=Post-Json "http://127.0.0.1:$port/ollama/api/chat" @{
    model=$visionModel;messages=@(@{role='user';content=$jsonPrompt;images=@($b64)});
    stream=$false;think=$false;format='json';keep_alive='10m';options=@{num_predict=500;num_ctx=3072;temperature=0}
  } 300
  $vo=Parse-JsonText ([string]$vj.message.content)
  if(-not $vo.image_summary -or -not $vo.facts){throw 'Local production-style Vision JSON did not contain image_summary + facts.'}
  Write-Host 'Local Vision JSON PASS.' -ForegroundColor Green

  Write-Host 'Step 6/6 - Testing exact PRIVATE HTTPS Vision route used by iPhone...' -ForegroundColor White
  $privateOk=$false
  try{$bi=Invoke-RestMethod "$origin/bridge-info" -TimeoutSec 20;if($bi.version -eq 'V11.8.6'){$privateOk=$true}}catch{}
  if(-not $privateOk){
    Write-Host 'Private root proxy was not pointed at the bridge. Repairing Tailscale Serve...' -ForegroundColor Yellow
    & $tailscale serve reset | Out-Null
    & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Host
  }
  $pv=Post-Json "$origin/ollama/api/chat" @{
    model=$visionModel;messages=@(@{role='user';content=$jsonPrompt;images=@($b64)});
    stream=$false;think=$false;format='json';keep_alive='10m';options=@{num_predict=500;num_ctx=3072;temperature=0}
  } 300
  $pvo=Parse-JsonText ([string]$pv.message.content)
  if(-not $pvo.image_summary -or -not $pvo.facts){throw 'Private HTTPS Vision JSON did not contain image_summary + facts.'}
  Write-Host 'Private HTTPS Vision JSON PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'VISION PIPELINE PASSED - V11.8.8 IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'Safari preprocessing now uses FileReader + Canvas DataURL only. URL.createObjectURL is not used by the V11.8.8 Vision path.' -ForegroundColor White
  Write-Host "Open on iPhone/PC: $origin/?v=1188" -ForegroundColor Cyan
  Start-Process "$origin/?v=1188"
}
catch{
  Write-Host ''
  Write-Host 'V11.8.8 VISION UPGRADE / SELF-TEST STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'Leave this window open and send the visible error to ChatGPT.' -ForegroundColor Yellow
}
finally{
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
