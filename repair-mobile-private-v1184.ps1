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

$log="$env:TEMP\UltimatePromptCreator-V1184-Repair.log"
Start-Transcript -Path $log -Force | Out-Null

function Find-Exe([string]$cmd,[string[]]$candidates){
  $x=(Get-Command $cmd -ErrorAction SilentlyContinue).Source
  if($x){return $x}
  return ($candidates|Where-Object{Test-Path $_}|Select-Object -First 1)
}

function Post-Json([string]$url,$obj,[int]$timeout=180){
  $body=$obj|ConvertTo-Json -Depth 30 -Compress
  return Invoke-RestMethod $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec $timeout
}

try {
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V11.8.4 Permanent Mobile Repair + Self-Test ===' -ForegroundColor Cyan
  Write-Host 'This version tests Ollama, the text model, the vision model, the local bridge, and the private Tailscale route.' -ForegroundColor White
  Write-Host ''

  $repoRaw='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  $appFile=Join-Path $appDir 'index.html'
  $baseFile=Join-Path $appDir 'base-v118.html'
  $patchFile=Join-Path $appDir 'mobile-selfheal-v1184.js'
  $proxyFile=Join-Path $appDir 'private-mobile-proxy-v1184.ps1'
  $proxyPort=8765
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null

  $tailscale=Find-Exe 'tailscale' @(
    "$env:ProgramFiles\Tailscale\tailscale.exe",
    "$env:LOCALAPPDATA\Tailscale\tailscale.exe"
  )
  if(-not $tailscale){throw 'Could not locate tailscale.exe.'}

  $ollama=Find-Exe 'ollama' @(
    "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
    "$env:LOCALAPPDATA\Ollama\ollama.exe",
    "$env:ProgramFiles\Ollama\ollama.exe"
  )
  if(-not $ollama){throw 'Could not locate ollama.exe.'}

  Write-Host "Found Ollama: $ollama" -ForegroundColor Green
  Write-Host "Found Tailscale: $tailscale" -ForegroundColor Green

  $ts=& $tailscale status --json | ConvertFrom-Json
  $dns=([string]$ts.Self.DNSName).TrimEnd('.')
  if(-not $dns){throw 'Could not determine your Tailscale MagicDNS hostname.'}
  $origin="https://$dns"
  Write-Host "Private URL: $origin/" -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 1/8 - Downloading V11.8.4 app patch and bridge...' -ForegroundColor White
  Invoke-WebRequest "$repoRaw/mobile-private-v118.html" -OutFile $baseFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-selfheal-v1184.js" -OutFile $patchFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/private-mobile-proxy-v1184.ps1" -OutFile $proxyFile -UseBasicParsing
  $base=[IO.File]::ReadAllText($baseFile)
  $patch=[IO.File]::ReadAllText($patchFile)
  $base=$base.Replace('Ultimate Prompt Creator V11.8 Private Mobile','Ultimate Prompt Creator V11.8.4 Self-Healing Mobile').Replace('V11.8 PRIVATE MOBILE','V11.8.4 SELF-HEALING MOBILE')
  $combined=$base.Replace('</body>',"<script>`r`n$patch`r`n</script>`r`n</body>")
  [IO.File]::WriteAllText($appFile,$combined,[Text.Encoding]::UTF8)
  Write-Host 'Downloaded and assembled V11.8.4.' -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 2/8 - Ensuring Ollama is running locally...' -ForegroundColor White
  [Environment]::SetEnvironmentVariable('OLLAMA_HOST','127.0.0.1:11434','User')
  $env:OLLAMA_HOST='127.0.0.1:11434'
  $ready=$false
  try { Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 | Out-Null; $ready=$true } catch {}
  if(-not $ready){
    Get-Process -Name 'ollama','ollama app','ollama_llama_server' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden
    for($i=0;$i -lt 45;$i++){
      try{Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2|Out-Null;$ready=$true;break}catch{Start-Sleep -Seconds 1}
    }
  }
  if(-not $ready){throw 'Ollama did not become ready on 127.0.0.1:11434.'}
  Write-Host 'Ollama local API is READY.' -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 3/8 - Installing/verifying the dedicated fast text model...' -ForegroundColor White
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 10
  $names=@($tags.models|ForEach-Object{$_.name})
  $textModel='qwen3:1.7b'
  if($names -notcontains $textModel){
    Write-Host 'qwen3:1.7b is not installed. Pulling it now (one-time download, about 1.4 GB)...' -ForegroundColor Yellow
    & $ollama pull $textModel | Out-Host
    if($LASTEXITCODE -ne 0){throw 'ollama pull qwen3:1.7b failed.'}
    $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 10
    $names=@($tags.models|ForEach-Object{$_.name})
  }
  if($names -notcontains $textModel){throw 'qwen3:1.7b is still not listed after installation.'}
  Write-Host "Text model READY: $textModel" -ForegroundColor Green

  $visionModel=($names|Where-Object{$_ -match 'qwen3-vl|llava|vision|gemma3'}|Select-Object -First 1)
  if($visionModel){Write-Host "Vision model found: $visionModel" -ForegroundColor Green}
  else{Write-Host 'No vision model found. Director will work; Vision tab will require a vision model.' -ForegroundColor Yellow}

  Write-Host ''
  Write-Host 'Step 4/8 - Running LOCAL Ollama generation tests...' -ForegroundColor White
  $plain=Post-Json 'http://127.0.0.1:11434/api/generate' @{
    model=$textModel; prompt='Reply with exactly OK /no_think'; stream=$false; keep_alive='10m';
    options=@{num_predict=16;num_ctx=1024;temperature=0}
  } 120
  if(-not $plain.response){throw 'Local plain generate returned no response.'}
  Write-Host "Plain text generation PASS: $($plain.response.Trim())" -ForegroundColor Green

  $json=Post-Json 'http://127.0.0.1:11434/api/generate' @{
    model=$textModel; prompt='Return only JSON: {"ok":true} /no_think'; stream=$false; format='json'; keep_alive='10m';
    options=@{num_predict=64;num_ctx=1024;temperature=0}
  } 120
  try{$json.response|ConvertFrom-Json|Out-Null;Write-Host 'JSON generation PASS.' -ForegroundColor Green}
  catch{Write-Host 'JSON mode returned text but did not parse. V11.8.4 has an automatic plain-text fallback.' -ForegroundColor Yellow}

  if($visionModel){
    try{
      Add-Type -AssemblyName System.Drawing
      $imgPath=Join-Path $env:TEMP 'upc-v1184-vision-test.jpg'
      $bmp=New-Object System.Drawing.Bitmap 512,512
      $g=[System.Drawing.Graphics]::FromImage($bmp)
      $g.Clear([System.Drawing.Color]::White)
      $brush=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Red)
      $g.FillRectangle($brush,96,96,320,320)
      $bmp.Save($imgPath,[System.Drawing.Imaging.ImageFormat]::Jpeg)
      $g.Dispose();$brush.Dispose();$bmp.Dispose()
      $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($imgPath))
      $vr=Post-Json 'http://127.0.0.1:11434/api/chat' @{
        model=$visionModel; stream=$false; keep_alive='10m';
        messages=@(@{role='user';content='In one short sentence, describe the dominant colored shape in this test image.';images=@($b64)});
        options=@{num_predict=80;num_ctx=2048;temperature=0}
      } 180
      if($vr.message.content){Write-Host "Vision inference PASS: $($vr.message.content.Trim())" -ForegroundColor Green}
      else{Write-Host 'Vision request returned no content; the mobile app will show the exact Ollama error if a real photo fails.' -ForegroundColor Yellow}
    }catch{
      Write-Host "Vision smoke test WARNING: $($_.Exception.Message)" -ForegroundColor Yellow
      Write-Host 'Director can still operate. The app includes detailed Vision error reporting and fallback.' -ForegroundColor Yellow
    }
  }

  Write-Host ''
  Write-Host 'Step 5/8 - Replacing the old local bridge...' -ForegroundColor White
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*private-mobile-proxy-v1183.ps1*' -or $_.CommandLine -like '*private-mobile-proxy-v1184.ps1*' } |
    ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {} }
  Start-Sleep -Seconds 2

  $args="-NoProfile -ExecutionPolicy Bypass -File `"$proxyFile`" -AppFile `"$appFile`" -Port $proxyPort"
  Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden
  $bridgeReady=$false
  for($i=0;$i -lt 30;$i++){
    try{$r=Invoke-WebRequest "http://127.0.0.1:$proxyPort/health" -UseBasicParsing -TimeoutSec 2;if($r.StatusCode -eq 200){$bridgeReady=$true;break}}catch{}
    Start-Sleep -Seconds 1
  }
  if(-not $bridgeReady){throw 'V11.8.4 local bridge did not start on 127.0.0.1:8765.'}
  Write-Host 'V11.8.4 bridge READY.' -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 6/8 - Testing GET and POST through the LOCAL bridge...' -ForegroundColor White
  $btags=Invoke-RestMethod "http://127.0.0.1:$proxyPort/ollama/api/tags" -TimeoutSec 15
  if(-not $btags.models){throw 'Bridge GET /api/tags returned no models.'}
  Write-Host 'Bridge GET PASS.' -ForegroundColor Green
  $bgen=Post-Json "http://127.0.0.1:$proxyPort/ollama/api/generate" @{
    model=$textModel; prompt='Reply with exactly BRIDGE_OK /no_think';stream=$false;keep_alive='10m';
    options=@{num_predict=24;num_ctx=1024;temperature=0}
  } 120
  if(-not $bgen.response){throw 'Bridge POST /api/generate returned no response.'}
  Write-Host "Bridge POST PASS: $($bgen.response.Trim())" -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 7/8 - Configuring ONE Tailscale Serve root proxy...' -ForegroundColor White
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$proxyPort" | Out-Host
  & $tailscale serve status | Out-Host

  Write-Host ''
  Write-Host 'Step 8/8 - Testing the EXACT private URL used by the iPhone...' -ForegroundColor White
  $ptags=Invoke-RestMethod "$origin/ollama/api/tags" -TimeoutSec 30
  if(-not $ptags.models){throw 'Private HTTPS GET /api/tags returned no models.'}
  Write-Host 'Private HTTPS GET PASS.' -ForegroundColor Green

  $pgen=Post-Json "$origin/ollama/api/generate" @{
    model=$textModel; prompt='Reply with exactly IPHONE_OK /no_think';stream=$false;keep_alive='10m';
    options=@{num_predict=24;num_ctx=1024;temperature=0}
  } 180
  if(-not $pgen.response){throw 'Private HTTPS POST /api/generate returned no response.'}
  Write-Host "Private HTTPS POST PASS: $($pgen.response.Trim())" -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'ALL CORE TESTS PASSED - V11.8.4 IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host ''
  Write-Host 'The Director now uses qwen3:1.7b for text generation instead of forcing the Qwen3-VL model to produce structured text.' -ForegroundColor White
  Write-Host 'The mobile app also retries JSON mode -> chat JSON -> plain generate automatically and shows the REAL Ollama error body if all modes fail.' -ForegroundColor White
  Write-Host ''
  Write-Host 'Open on iPhone Safari:' -ForegroundColor White
  Write-Host "$origin/?v=1184" -ForegroundColor Cyan
  Write-Host ''
  Start-Process "$origin/?v=1184"
}
catch {
  Write-Host ''
  Write-Host 'REPAIR / SELF-TEST STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'The window will remain open so the error cannot disappear.' -ForegroundColor Yellow
}
finally {
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
