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
  $body=$obj|ConvertTo-Json -Depth 50 -Compress
  try {
    return Invoke-RestMethod $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec $timeout
  }
  catch {
    $detail=$_.Exception.Message
    try {
      if($_.ErrorDetails.Message){$detail="$detail | Server: $($_.ErrorDetails.Message)"}
    } catch {}
    throw "POST $url failed: $detail"
  }
}

function Parse-JsonText([string]$text){
  $s=[string]$text
  $a=$s.IndexOf('{')
  $b=$s.LastIndexOf('}')
  if($a -ge 0 -and $b -gt $a){$s=$s.Substring($a,$b-$a+1)}
  return $s|ConvertFrom-Json
}

function Preview-Text([string]$text,[int]$max=180){
  $clean=([string]$text).Replace("`r",' ').Replace("`n",' ').Trim()
  if($clean.Length -le $max){return $clean}
  return $clean.Substring(0,$max)
}

try {
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V11.9.2 Clean Vision Upgrade + End-to-End Test ===' -ForegroundColor Cyan
  Write-Host 'Vision returns plain visual evidence. qwen3:1.7b owns all JSON structuring.' -ForegroundColor White
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

  $tailscale=Find-Exe 'tailscale' @(
    "$env:ProgramFiles\Tailscale\tailscale.exe",
    "$env:LOCALAPPDATA\Tailscale\tailscale.exe"
  )
  $ollama=Find-Exe 'ollama' @(
    "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
    "$env:LOCALAPPDATA\Ollama\ollama.exe",
    "$env:ProgramFiles\Ollama\ollama.exe"
  )
  if(-not $tailscale){throw 'Could not locate tailscale.exe.'}
  if(-not $ollama){throw 'Could not locate ollama.exe.'}

  $ts=& $tailscale status --json | ConvertFrom-Json
  $dns=([string]$ts.Self.DNSName).TrimEnd('.')
  if(-not $dns){throw 'Could not determine Tailscale MagicDNS hostname.'}
  $origin="https://$dns"
  Write-Host "Private URL: $origin/" -ForegroundColor Green

  Write-Host 'Step 1/8 - Downloading clean app files...' -ForegroundColor White
  Invoke-WebRequest "$repoRaw/mobile-private-v118.html" -OutFile $baseFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-v1187-quality.js" -OutFile $directorFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-v1192-clean-vision.js" -OutFile $visionFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/private-mobile-proxy-v1186.ps1" -OutFile $bridgeFile -UseBasicParsing

  $base=[IO.File]::ReadAllText($baseFile)
  $base=$base.Replace('Ultimate Prompt Creator V11.8 Private Mobile','Ultimate Prompt Creator V11.9.2 Clean Vision')
  $base=$base.Replace('V11.8 PRIVATE MOBILE','V11.9.2 CLEAN VISION')
  $director=[IO.File]::ReadAllText($directorFile)
  $vision=[IO.File]::ReadAllText($visionFile)
  $inject="<script>`r`n$director`r`n</script>`r`n<script>`r`n$vision`r`n</script>`r`n"
  $combined=$base.Replace('</body>',$inject+'</body>')
  [IO.File]::WriteAllText($appFile,$combined,[Text.Encoding]::UTF8)
  Write-Host 'Clean V11.9.2 app assembled.' -ForegroundColor Green

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
  $red.Dispose()
  $blue.Dispose()
  $g.Dispose()
  $bmp.Dispose()
  $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($imgPath))
  Write-Host 'Synthetic image ready.' -ForegroundColor Green

  $evidencePrompt='VISUAL EVIDENCE PASS ONLY. Do not output JSON. Describe only visible shapes, colors, background, framing and lighting in short factual sentences.'
  $structurePromptPrefix='Return ONLY JSON with keys image_summary, reconstruction_summary, and sections. sections must be an array of objects with section and items. Each item must contain keyword, description, confidence, evidence, and prompt_phrase. Use confidence values CLEARLY_VISIBLE, HIGHLY_PROBABLE, ESTIMATED, or CANNOT_VERIFY. Use only the supplied visual evidence.'

  Write-Host 'Step 4/8 - Testing DIRECT Vision as plain evidence...' -ForegroundColor White
  $directVision=Post-Json 'http://127.0.0.1:11434/api/chat' @{
    model=$visionModel
    messages=@(@{role='user';content=$evidencePrompt;images=@($b64)})
    stream=$false
    think=$false
    keep_alive='30m'
    options=@{num_predict=260;num_ctx=1536;temperature=0}
  } 600
  $evidence=([string]$directVision.message.content).Trim()
  if($evidence.Length -lt 40){throw 'Direct Vision evidence output was too short.'}
  Write-Host ("Direct plain Vision PASS: "+(Preview-Text $evidence)) -ForegroundColor Green

  Write-Host 'Step 5/8 - Testing DIRECT qwen3:1.7b JSON structuring...' -ForegroundColor White
  $directStructPrompt=$structurePromptPrefix+"`n`nVISUAL EVIDENCE:`n"+$evidence
  $directStruct=Post-Json 'http://127.0.0.1:11434/api/chat' @{
    model=$textModel
    messages=@(@{role='user';content=$directStructPrompt})
    stream=$false
    think=$false
    format='json'
    keep_alive='30m'
    options=@{num_predict=1400;num_ctx=3072;temperature=0.05}
  } 600
  $directObject=Parse-JsonText ([string]$directStruct.message.content)
  if(-not $directObject.image_summary -or -not $directObject.sections){throw 'Direct text structuring did not return required fields.'}
  Write-Host ("Direct structuring PASS: "+$directObject.sections.Count+" sections.") -ForegroundColor Green

  Write-Host 'Step 6/8 - Restarting StreamContent bridge with clean app...' -ForegroundColor White
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object{$_.CommandLine -like '*private-mobile-proxy-v118*.ps1*'} |
    ForEach-Object{try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}}
  Start-Sleep 2
  $args="-NoProfile -ExecutionPolicy Bypass -File `"$bridgeFile`" -AppFile `"$appFile`" -Port $port"
  Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden

  $ready=$false
  for($i=0;$i -lt 30;$i++){
    try {
      $info=Invoke-RestMethod "http://127.0.0.1:$port/bridge-info" -TimeoutSec 2
      if($info.version -eq 'V11.8.6' -and $info.transport -eq 'StreamContent'){$ready=$true;break}
    } catch {}
    Start-Sleep 1
  }
  if(-not $ready){throw 'StreamContent bridge failed to restart.'}
  Write-Host 'Bridge READY.' -ForegroundColor Green

  Write-Host 'Step 7/8 - Testing two-stage pipeline through LOCAL bridge...' -ForegroundColor White
  $bridgeVision=Post-Json "http://127.0.0.1:$port/ollama/api/chat" @{
    model=$visionModel
    messages=@(@{role='user';content=$evidencePrompt;images=@($b64)})
    stream=$false
    think=$false
    keep_alive='30m'
    options=@{num_predict=260;num_ctx=1536;temperature=0}
  } 600
  $bridgeEvidence=([string]$bridgeVision.message.content).Trim()
  if($bridgeEvidence.Length -lt 40){throw 'Bridge Vision evidence output was too short.'}

  $bridgeStructPrompt=$structurePromptPrefix+"`n`nVISUAL EVIDENCE:`n"+$bridgeEvidence
  $bridgeStruct=Post-Json "http://127.0.0.1:$port/ollama/api/chat" @{
    model=$textModel
    messages=@(@{role='user';content=$bridgeStructPrompt})
    stream=$false
    think=$false
    format='json'
    keep_alive='30m'
    options=@{num_predict=1400;num_ctx=3072;temperature=0.05}
  } 600
  $bridgeObject=Parse-JsonText ([string]$bridgeStruct.message.content)
  if(-not $bridgeObject.sections){throw 'Local bridge structuring failed.'}
  Write-Host 'Local bridge two-stage pipeline PASS.' -ForegroundColor Green

  Write-Host 'Step 8/8 - Testing exact private HTTPS two-stage route...' -ForegroundColor White
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Host
  $bridgeInfo=Invoke-RestMethod "$origin/bridge-info" -TimeoutSec 30
  if($bridgeInfo.version -ne 'V11.8.6'){throw 'Private route is not pointed at the StreamContent bridge.'}

  $privateVision=Post-Json "$origin/ollama/api/chat" @{
    model=$visionModel
    messages=@(@{role='user';content=$evidencePrompt;images=@($b64)})
    stream=$false
    think=$false
    keep_alive='30m'
    options=@{num_predict=260;num_ctx=1536;temperature=0}
  } 600
  $privateEvidence=([string]$privateVision.message.content).Trim()
  if($privateEvidence.Length -lt 40){throw 'Private HTTPS Vision evidence output was too short.'}

  $privateStructPrompt=$structurePromptPrefix+"`n`nVISUAL EVIDENCE:`n"+$privateEvidence
  $privateStruct=Post-Json "$origin/ollama/api/chat" @{
    model=$textModel
    messages=@(@{role='user';content=$privateStructPrompt})
    stream=$false
    think=$false
    format='json'
    keep_alive='30m'
    options=@{num_predict=1400;num_ctx=3072;temperature=0.05}
  } 600
  $privateObject=Parse-JsonText ([string]$privateStruct.message.content)
  if(-not $privateObject.sections){throw 'Private HTTPS structuring failed.'}
  Write-Host 'Private HTTPS two-stage pipeline PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'V11.9.2 CLEAN VISION PASSED ALL END-TO-END TESTS' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'Vision is plain evidence only; qwen3:1.7b performs JSON structuring.' -ForegroundColor White
  Write-Host "Open: $origin/?v=1192" -ForegroundColor Cyan
  Start-Process "$origin/?v=1192"
}
catch {
  Write-Host ''
  Write-Host 'V11.9.2 CLEAN VISION UPGRADE / TEST STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'Leave this window open and send the visible error to ChatGPT.' -ForegroundColor Yellow
}
finally {
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
