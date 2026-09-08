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

$log="$env:TEMP\UltimatePromptCreator-V1190-Upgrade.log"
Start-Transcript -Path $log -Force | Out-Null

function Find-Exe([string]$cmd,[string[]]$candidates){
  $g=Get-Command $cmd -ErrorAction SilentlyContinue
  if($g){return $g.Source}
  return ($candidates|Where-Object{Test-Path $_}|Select-Object -First 1)
}
function Post-Json-Retry([string]$url,$obj,[int]$attempts=4,[int]$timeout=600){
  $body=$obj|ConvertTo-Json -Depth 70 -Compress
  $last=$null
  for($i=0;$i -lt $attempts;$i++){
    try{return Invoke-RestMethod $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec $timeout}
    catch{
      $last=$_
      $status=$null
      try{$status=[int]$_.Exception.Response.StatusCode}catch{}
      $retryable=($status -in 502,503,504) -or ($_.Exception.Message -match 'timed out|temporarily|connection')
      if($retryable -and $i -lt ($attempts-1)){
        $delay=[math]::Pow(2,$i+1)
        Write-Host "Transient POST failure (attempt $($i+1)/$attempts): $($_.Exception.Message). Retrying in $delay sec..." -ForegroundColor Yellow
        Start-Sleep -Seconds $delay
        continue
      }
      throw
    }
  }
  throw $last
}

try{
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V11.9.0 Verified Vision Upgrade ===' -ForegroundColor Cyan
  Write-Host 'Removes the legacy Vision/self-test stack, preserves the working Director and StreamContent bridge, and installs one verified Vision controller.' -ForegroundColor White
  Write-Host ''

  $repoRaw='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $appFile=Join-Path $appDir 'index.html'
  $baseFile=Join-Path $appDir 'base-v118.html'
  $scripts=@('mobile-v1185-hotfix.js','mobile-v1186-hotfix.js','mobile-v1187-quality.js','mobile-v1190-verified-vision.js')
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

  Write-Host 'Step 1/7 - Downloading the clean V11.9.0 app stack...' -ForegroundColor White
  Invoke-WebRequest "$repoRaw/mobile-private-v118.html" -OutFile $baseFile -UseBasicParsing
  foreach($s in $scripts){Invoke-WebRequest "$repoRaw/$s" -OutFile (Join-Path $appDir $s) -UseBasicParsing}
  Invoke-WebRequest "$repoRaw/private-mobile-proxy-v1186.ps1" -OutFile $bridgeFile -UseBasicParsing

  $base=[IO.File]::ReadAllText($baseFile)
  $base=$base.Replace('Ultimate Prompt Creator V11.8 Private Mobile','Ultimate Prompt Creator V11.9.0 Verified Vision').Replace('V11.8 PRIVATE MOBILE','V11.9.0 VERIFIED VISION')
  $inject=($scripts|ForEach-Object{"<script>`r`n$([IO.File]::ReadAllText((Join-Path $appDir $_)))`r`n</script>"}) -join "`r`n"
  $combined=$base.Replace('</body>',$inject+"`r`n</body>")
  [IO.File]::WriteAllText($appFile,$combined,[Text.Encoding]::UTF8)
  Write-Host 'Clean V11.9.0 app assembled. Legacy V11.8.4/V11.8.8/V11.8.9 Vision handlers are no longer bundled.' -ForegroundColor Green

  Write-Host 'Step 2/7 - Verifying required Ollama models...' -ForegroundColor White
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20
  $names=@($tags.models|ForEach-Object{$_.name})
  foreach($m in @('qwen3:1.7b','qwen3-vl:2b-instruct')){
    if($names -notcontains $m){
      Write-Host "Installing missing model $m ..." -ForegroundColor Yellow
      & $ollama pull $m | Out-Host
      if($LASTEXITCODE -ne 0){throw "ollama pull $m failed."}
    }
  }
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20
  $names=@($tags.models|ForEach-Object{$_.name})
  if($names -notcontains 'qwen3:1.7b'){throw 'qwen3:1.7b is missing.'}
  if($names -notcontains 'qwen3-vl:2b-instruct'){throw 'qwen3-vl:2b-instruct is missing.'}
  Write-Host 'Director + Turbo Vision models READY.' -ForegroundColor Green

  Write-Host 'Step 3/7 - Restarting the proven V11.8.6 StreamContent bridge...' -ForegroundColor White
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
  if(-not $ready){throw 'StreamContent bridge did not restart on 127.0.0.1:8765.'}
  Write-Host 'Bridge READY.' -ForegroundColor Green

  Write-Host 'Step 4/7 - Testing text generation through the local bridge...' -ForegroundColor White
  $text=Post-Json-Retry "http://127.0.0.1:$port/ollama/api/chat" @{
    model='qwen3:1.7b';messages=@(@{role='user';content='Reply exactly TEXT_OK'});stream=$false;think=$false;keep_alive='30m';options=@{num_predict=32;num_ctx=1024;temperature=0}
  }
  if(-not ([string]$text.message.content).Trim()){throw 'Local bridge text test returned no content.'}
  Write-Host "Local text PASS: $(([string]$text.message.content).Trim())" -ForegroundColor Green

  Write-Host 'Step 5/7 - Running a tiny 2B Vision test through the local bridge...' -ForegroundColor White
  Add-Type -AssemblyName System.Drawing
  $imgPath=Join-Path $env:TEMP 'upc-v1190-vision-test.jpg'
  $bmp=New-Object System.Drawing.Bitmap 192,192
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $red=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Red)
  $blue=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Blue)
  $g.FillRectangle($red,30,30,132,86)
  $g.FillEllipse($blue,70,122,52,52)
  $bmp.Save($imgPath,[System.Drawing.Imaging.ImageFormat]::Jpeg)
  $red.Dispose();$blue.Dispose();$g.Dispose();$bmp.Dispose()
  $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($imgPath))

  $vision=Post-Json-Retry "http://127.0.0.1:$port/ollama/api/chat" @{
    model='qwen3-vl:2b-instruct';messages=@(@{role='user';content='In one short sentence describe the dominant colors and shapes.';images=@($b64)});stream=$false;think=$false;keep_alive='30m';options=@{num_predict=64;num_ctx=1536;temperature=0}
  }
  $vt=([string]$vision.message.content).Trim();if(-not $vt){throw 'Local bridge Vision test returned no content.'}
  Write-Host "Local Vision PASS: $vt" -ForegroundColor Green
  Write-Host 'Ollama processor placement:' -ForegroundColor White
  & $ollama ps | Out-Host

  Write-Host 'Step 6/7 - Pointing Tailscale HTTPS at the verified bridge...' -ForegroundColor White
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Host
  $bi=Invoke-RestMethod "$origin/bridge-info" -TimeoutSec 30
  if($bi.version -ne 'V11.8.6'){throw 'Private Tailscale route is not pointing to the StreamContent bridge.'}
  Write-Host 'Private bridge route PASS.' -ForegroundColor Green

  Write-Host 'Step 7/7 - Testing exact private Vision POST used by the browser...' -ForegroundColor White
  $pv=Post-Json-Retry "$origin/ollama/api/chat" @{
    model='qwen3-vl:2b-instruct';messages=@(@{role='user';content='Return only JSON: {"image_summary":"summary","facts":[{"section":"Color","fact":"fact","confidence":"CLEARLY_VISIBLE","evidence":"evidence"}]}. Analyze only this image.';images=@($b64)});stream=$false;think=$false;format='json';keep_alive='30m';options=@{num_predict=240;num_ctx=2048;temperature=0}
  }
  $raw=[string]$pv.message.content
  if($raw -notmatch 'image_summary' -or $raw -notmatch 'facts'){throw 'Private Vision JSON test did not return the expected structure.'}
  Write-Host 'Private HTTPS Vision POST PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'V11.9.0 VERIFIED VISION READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'The old V11.8.5 self-test has been removed from this app build.' -ForegroundColor White
  Write-Host 'After choosing a real photo, Run V11.9.0 Vision Test will analyze that selected photo automatically.' -ForegroundColor White
  Write-Host "Open: $origin/?v=1190" -ForegroundColor Cyan
  Start-Process "$origin/?v=1190"
}
catch{
  Write-Host ''
  Write-Host 'V11.9.0 UPGRADE / SELF-TEST STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'Leave this window open and send the visible error to ChatGPT.' -ForegroundColor Yellow
}
finally{
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
