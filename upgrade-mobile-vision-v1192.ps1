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

$log="$env:TEMP\UltimatePromptCreator-V1192-VisionUpgrade.log"
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
  Write-Host '=== Ultimate Prompt Creator V11.9.2 Clean Vision Upgrade + End-to-End Test ===' -ForegroundColor Cyan
  Write-Host 'This clean build removes all legacy Vision/self-test scripts. Vision returns plain evidence; qwen3:1.7b owns JSON structuring.' -ForegroundColor White
  Write-Host ''

  $repoRaw='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $appFile=Join-Path $appDir 'index.html'
  $baseFile=Join-Path $appDir 'base-v118.html'
  $directorFile=Join-Path $appDir 'mobile-v1187-quality.js'
  $visionFile=Join-Path $appDir 'mobile-v1192-clean-vision.js'
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

  Write-Host 'Step 1/8 - Downloading CLEAN app files only...' -ForegroundColor White
  Invoke-WebRequest "$repoRaw/mobile-private-v118.html" -OutFile $baseFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-v1187-quality.js" -OutFile $directorFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-v1192-clean-vision.js" -OutFile $visionFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/private-mobile-proxy-v1186.ps1" -OutFile $bridgeFile -UseBasicParsing
  $base=[IO.File]::ReadAllText($baseFile)
  $base=$base.Replace('Ultimate Prompt Creator V11.8 Private Mobile','Ultimate Prompt Creator V11.9.2 Clean Vision').Replace('V11.8 PRIVATE MOBILE','V11.9.2 CLEAN VISION')
  $inject="<script>`r`n$([IO.File]::ReadAllText($directorFile))`r`n</script>`r`n<script>`r`n$([IO.File]::ReadAllText($visionFile))`r`n</script>`r`n"
  $combined=$base.Replace('</body>',$inject+'</body>')
  [IO.File]::WriteAllText($appFile,$combined,[Text.Encoding]::UTF8)
  Write-Host 'Clean V11.9.2 app assembled: base + Director + one Vision controller.' -ForegroundColor Green

  Write-Host 'Step 2/8 - Verifying Ollama models...' -ForegroundColor White
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20
  $names=@($tags.models|ForEach-Object{$_.name})
  $textModel='qwen3:1.7b'
  $visionModel=($names|Where-Object{$_ -eq 'qwen3-vl:2b-instruct'}|Select-Object -First 1)
  if(-not $visionModel){$visionModel=($names|Where-Object{$_ -match 'qwen3-vl.*2b'}|Select-Object -First 1)}
  if(-not $visionModel){$visionModel=($names|Where-Object{$_ -match 'qwen3-vl|llava|vision|gemma3'}|Select-Object -First 1)}
  if($names -notcontains $textModel){throw 'qwen3:1.7b is missing.'}
  if(-not $visionModel){throw 'No Vision model is installed.'}
  Write-Host "Text model: $textModel" -ForegroundColor Green
  Write-Host "Vision model: $visionModel" -ForegroundColor Green

  Write-Host 'Step 3/8 - Creating synthetic image...' -ForegroundColor White
  Add-Type -AssemblyName System.Drawing
  $imgPath=Join-Path $env:TEMP 'upc-v1192-vision-test.jpg'
  $bmp=New-Object System.Drawing.Bitmap 192,192
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $red=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Red)
  $blue=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Blue)
  $g.FillRectangle($red,30,32,132,84)
  $g.FillEllipse($blue,68,128,56,42)
  $bmp.Save($imgPath,[System.Drawing.Imaging.ImageFormat]::Jpeg)
  $red.Dispose();$blue.Dispose();$g.Dispose();$bmp.Dispose()
  $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($imgPath))
  Write-Host 'Synthetic image ready.' -ForegroundColor Green

  Write-Host 'Step 4/8 - Testing DIRECT Vision as PLAIN EVIDENCE (no JSON)...' -ForegroundColor White
  $evidencePrompt='VISUAL EVIDENCE PASS ONLY. Do not output JSON. Describe only visible shapes, colors, background, framing and lighting in short factual sentences.'
  $v=Post-Json 'http://127.0.0.1:11434/api/chat' @{
    model=$visionModel;messages=@(@{role='user';content=$evidencePrompt;images=@($b64)});stream=$false;think=$false;keep_alive='30m';
    options=@{num_predict=260;num_ctx=1536;temperature=0}
  } 600
  $evidence=([string]$v.message.content).Trim()
  if($evidence.Length -lt 40){throw 'Direct Vision evidence output was too short.'}
  Write-Host "Direct plain Vision PASS: $($evidence.Replace("`r",' ').Replace("`n",' ').Substring(0,[Math]::Min(180,$evidence.Length)))" -ForegroundColor Green

  Write-Host 'Step 5/8 - Testing DIRECT qwen3:1.7b strict structuring...' -ForegroundColor White
  $schema=@{
    type='object';additionalProperties=$false;required=@('image_summary','reconstruction_summary','sections');properties=@{
      image_summary=@{type='string'};reconstruction_summary=@{type='string'};sections=@{type='array';minItems=4;maxItems=12;items=@{type='object';additionalProperties=$false;required=@('section','items');properties=@{section=@{type='string'};items=@{type='array';minItems=1;maxItems=5;items=@{type='object';additionalProperties=$false;required=@('keyword','description','confidence','evidence','prompt_phrase');properties=@{keyword=@{type='string'};description=@{type='string'};confidence=@{type='string';enum=@('CLEARLY_VISIBLE','HIGHLY_PROBABLE','ESTIMATED','CANNOT_VERIFY')};evidence=@{type='string'};prompt_phrase=@{type='string'}}}}}}}}
    }
  }
  $structPrompt="Convert this visual evidence into a faithful reconstruction object. Use only the evidence. VISUAL EVIDENCE:`n$evidence"
  $s=Post-Json 'http://127.0.0.1:11434/api/chat' @{
    model=$textModel;messages=@(@{role='user';content=$structPrompt});stream=$false;think=$false;format=$schema;keep_alive='30m';
    options=@{num_predict=1400;num_ctx=3072;temperature=0.05}
  } 600
  $so=Parse-JsonText ([string]$s.message.content)
  if(-not $so.image_summary -or -not $so.sections){throw 'Direct text structuring did not return required fields.'}
  Write-Host "Direct structuring PASS: $($so.sections.Count) sections." -ForegroundColor Green

  Write-Host 'Step 6/8 - Restarting proven StreamContent bridge with CLEAN app...' -ForegroundColor White
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
  if(-not $ready){throw 'StreamContent bridge failed to restart.'}
  Write-Host 'Bridge READY.' -ForegroundColor Green

  Write-Host 'Step 7/8 - Testing CLEAN two-stage pipeline through LOCAL bridge...' -ForegroundColor White
  $bv=Post-Json "http://127.0.0.1:$port/ollama/api/chat" @{
    model=$visionModel;messages=@(@{role='user';content=$evidencePrompt;images=@($b64)});stream=$false;think=$false;keep_alive='30m';options=@{num_predict=260;num_ctx=1536;temperature=0}
  } 600
  $be=([string]$bv.message.content).Trim();if($be.Length -lt 40){throw 'Bridge Vision evidence output too short.'}
  $bs=Post-Json "http://127.0.0.1:$port/ollama/api/chat" @{
    model=$textModel;messages=@(@{role='user';content=("Convert this visual evidence into a faithful reconstruction object. Use only the evidence.`n"+$be)});stream=$false;think=$false;format=$schema;keep_alive='30m';options=@{num_predict=1400;num_ctx=3072;temperature=0.05}
  } 600
  $bso=Parse-JsonText ([string]$bs.message.content);if(-not $bso.sections){throw 'Local bridge structuring failed.'}
  Write-Host 'Local bridge two-stage pipeline PASS.' -ForegroundColor Green

  Write-Host 'Step 8/8 - Testing EXACT private HTTPS two-stage route...' -ForegroundColor White
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Host
  $bi=Invoke-RestMethod "$origin/bridge-info" -TimeoutSec 30
  if($bi.version -ne 'V11.8.6'){throw 'Private route is not pointed at the StreamContent bridge.'}
  $pv=Post-Json "$origin/ollama/api/chat" @{
    model=$visionModel;messages=@(@{role='user';content=$evidencePrompt;images=@($b64)});stream=$false;think=$false;keep_alive='30m';options=@{num_predict=260;num_ctx=1536;temperature=0}
  } 600
  $pe=([string]$pv.message.content).Trim();if($pe.Length -lt 40){throw 'Private HTTPS Vision evidence output too short.'}
  $ps=Post-Json "$origin/ollama/api/chat" @{
    model=$textModel;messages=@(@{role='user';content=("Convert this visual evidence into a faithful reconstruction object. Use only the evidence.`n"+$pe)});stream=$false;think=$false;format=$schema;keep_alive='30m';options=@{num_predict=1400;num_ctx=3072;temperature=0.05}
  } 600
  $pso=Parse-JsonText ([string]$ps.message.content);if(-not $pso.sections){throw 'Private HTTPS structuring failed.'}
  Write-Host 'Private HTTPS two-stage pipeline PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'V11.9.2 CLEAN VISION PASSED ALL END-TO-END TESTS' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'The invalid-JSON failure is eliminated because the Vision model never outputs JSON.' -ForegroundColor White
  Write-Host "Open: $origin/?v=1192" -ForegroundColor Cyan
  Start-Process "$origin/?v=1192"
}
catch{
  Write-Host ''
  Write-Host 'V11.9.2 CLEAN VISION UPGRADE / TEST STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'Leave this window open and send the visible error to ChatGPT.' -ForegroundColor Yellow
}
finally{
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
