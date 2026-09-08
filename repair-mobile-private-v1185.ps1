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

$log="$env:TEMP\UltimatePromptCreator-V1185-Repair.log"
Start-Transcript -Path $log -Force | Out-Null

function Find-Exe([string]$cmd,[string[]]$candidates){
  $g=Get-Command $cmd -ErrorAction SilentlyContinue
  if($g){return $g.Source}
  return ($candidates|Where-Object{Test-Path $_}|Select-Object -First 1)
}
function Post-Json([string]$url,$obj,[int]$timeout=180){
  $body=$obj|ConvertTo-Json -Depth 40 -Compress
  try{return Invoke-RestMethod $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec $timeout}
  catch{
    $detail=$_.Exception.Message
    try{
      if($_.ErrorDetails.Message){$detail="$detail | Server: $($_.ErrorDetails.Message)"}
      elseif($_.Exception.Response){
        $stream=$_.Exception.Response.GetResponseStream();if($stream){$reader=New-Object IO.StreamReader($stream);$server=$reader.ReadToEnd();$reader.Dispose();if($server){$detail="$detail | Server: $server"}}
      }
    }catch{}
    throw "POST $url failed: $detail"
  }
}
function Parse-JsonText([string]$text){
  $s=[string]$text
  $a=$s.IndexOf('{');$b=$s.LastIndexOf('}')
  if($a -ge 0 -and $b -gt $a){$s=$s.Substring($a,$b-$a+1)}
  return $s|ConvertFrom-Json
}

try{
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V11.8.5 Permanent Mobile Repair + Production Self-Test ===' -ForegroundColor Cyan
  Write-Host 'This build explicitly disables Qwen3 thinking and tests the exact Director POST path end-to-end.' -ForegroundColor White
  Write-Host ''

  $repoRaw='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $appFile=Join-Path $appDir 'index.html'
  $baseFile=Join-Path $appDir 'base-v118.html'
  $patch84=Join-Path $appDir 'mobile-selfheal-v1184.js'
  $patch85=Join-Path $appDir 'mobile-v1185-hotfix.js'
  $proxyFile=Join-Path $appDir 'private-mobile-proxy-v1184.ps1'
  $proxyPort=8765

  $tailscale=Find-Exe 'tailscale' @("$env:ProgramFiles\Tailscale\tailscale.exe","$env:LOCALAPPDATA\Tailscale\tailscale.exe")
  $ollama=Find-Exe 'ollama' @("$env:LOCALAPPDATA\Programs\Ollama\ollama.exe","$env:LOCALAPPDATA\Ollama\ollama.exe","$env:ProgramFiles\Ollama\ollama.exe")
  if(-not $tailscale){throw 'Could not locate tailscale.exe.'}
  if(-not $ollama){throw 'Could not locate ollama.exe.'}
  Write-Host "Found Ollama: $ollama" -ForegroundColor Green
  Write-Host "Found Tailscale: $tailscale" -ForegroundColor Green

  $ts=& $tailscale status --json | ConvertFrom-Json
  $dns=([string]$ts.Self.DNSName).TrimEnd('.')
  if(-not $dns){throw 'Could not determine the Tailscale MagicDNS hostname.'}
  $origin="https://$dns"
  Write-Host "Private URL: $origin/" -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 1/8 - Downloading and assembling V11.8.5...' -ForegroundColor White
  Invoke-WebRequest "$repoRaw/mobile-private-v118.html" -OutFile $baseFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-selfheal-v1184.js" -OutFile $patch84 -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-v1185-hotfix.js" -OutFile $patch85 -UseBasicParsing
  Invoke-WebRequest "$repoRaw/private-mobile-proxy-v1184.ps1" -OutFile $proxyFile -UseBasicParsing
  $base=[IO.File]::ReadAllText($baseFile)
  $p84=[IO.File]::ReadAllText($patch84)
  $p85=[IO.File]::ReadAllText($patch85)
  $base=$base.Replace('Ultimate Prompt Creator V11.8 Private Mobile','Ultimate Prompt Creator V11.8.5 Permanent Mobile').Replace('V11.8 PRIVATE MOBILE','V11.8.5 PERMANENT MOBILE')
  $inject="<script>`r`n$p84`r`n</script>`r`n<script>`r`n$p85`r`n</script>`r`n"
  $combined=$base.Replace('</body>',$inject+'</body>')
  [IO.File]::WriteAllText($appFile,$combined,[Text.Encoding]::UTF8)
  Write-Host 'V11.8.5 app assembled.' -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 2/8 - Ensuring Ollama is running locally...' -ForegroundColor White
  [Environment]::SetEnvironmentVariable('OLLAMA_HOST','127.0.0.1:11434','User')
  $env:OLLAMA_HOST='127.0.0.1:11434'
  $ready=$false
  try{Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3|Out-Null;$ready=$true}catch{}
  if(-not $ready){
    Get-Process -Name 'ollama','ollama app','ollama_llama_server' -ErrorAction SilentlyContinue|Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep 2
    Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden
    for($i=0;$i -lt 45;$i++){try{Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2|Out-Null;$ready=$true;break}catch{Start-Sleep 1}}
  }
  if(-not $ready){throw 'Ollama local API did not become ready.'}
  Write-Host 'Ollama local API READY.' -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 3/8 - Verifying dedicated Director model qwen3:1.7b...' -ForegroundColor White
  $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 10
  $names=@($tags.models|ForEach-Object{$_.name})
  $textModel='qwen3:1.7b'
  if($names -notcontains $textModel){
    Write-Host 'Installing qwen3:1.7b (one-time download)...' -ForegroundColor Yellow
    & $ollama pull $textModel | Out-Host
    if($LASTEXITCODE -ne 0){throw 'ollama pull qwen3:1.7b failed.'}
    $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 10
    $names=@($tags.models|ForEach-Object{$_.name})
  }
  if($names -notcontains $textModel){throw 'qwen3:1.7b is not installed.'}
  $visionModel=($names|Where-Object{$_ -match 'qwen3-vl|llava|vision|gemma3'}|Select-Object -First 1)
  Write-Host "Director text model READY: $textModel" -ForegroundColor Green
  if($visionModel){Write-Host "Vision model READY: $visionModel" -ForegroundColor Green}

  Write-Host ''
  Write-Host 'Step 4/8 - Testing LOCAL Qwen3 with think=false...' -ForegroundColor White
  $localChat=Post-Json 'http://127.0.0.1:11434/api/chat' @{
    model=$textModel;messages=@(@{role='user';content='Reply with exactly OK'});stream=$false;think=$false;keep_alive='10m';
    options=@{num_predict=64;num_ctx=1024;temperature=0}
  } 180
  $localText=[string]$localChat.message.content
  if(-not $localText.Trim()){throw "Local chat produced no final content. thinking length=$(([string]$localChat.message.thinking).Length)"}
  Write-Host "LOCAL chat PASS: $($localText.Trim())" -ForegroundColor Green

  $probePrompt='Return ONLY JSON: {"scores":{"overall":88},"creative_direction":"ok","keywords":[{"keyword":"test","prompt_phrase":"test phrase"}],"final_prompt":"test prompt"}'
  $localJson=Post-Json 'http://127.0.0.1:11434/api/chat' @{
    model=$textModel;messages=@(@{role='user';content=$probePrompt});stream=$false;think=$false;format='json';keep_alive='10m';
    options=@{num_predict=300;num_ctx=1536;temperature=0}
  } 180
  $jo=Parse-JsonText ([string]$localJson.message.content)
  if(-not $jo.final_prompt){throw 'Local Director JSON probe did not return final_prompt.'}
  Write-Host 'LOCAL Director JSON PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 5/8 - Restarting the private local bridge...' -ForegroundColor White
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object{$_.CommandLine -like '*private-mobile-proxy-v118*.ps1*'} |
    ForEach-Object{try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}}
  Start-Sleep 2
  $args="-NoProfile -ExecutionPolicy Bypass -File `"$proxyFile`" -AppFile `"$appFile`" -Port $proxyPort"
  Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden
  $bridgeReady=$false
  for($i=0;$i -lt 30;$i++){try{$r=Invoke-WebRequest "http://127.0.0.1:$proxyPort/health" -UseBasicParsing -TimeoutSec 2;if($r.StatusCode -eq 200){$bridgeReady=$true;break}}catch{};Start-Sleep 1}
  if(-not $bridgeReady){throw 'Local bridge failed to start on 127.0.0.1:8765.'}
  Write-Host 'Local bridge READY.' -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 6/8 - Testing production POST through LOCAL bridge...' -ForegroundColor White
  $bridgeChat=Post-Json "http://127.0.0.1:$proxyPort/ollama/api/chat" @{
    model=$textModel;messages=@(@{role='user';content='Reply with exactly BRIDGE_OK'});stream=$false;think=$false;keep_alive='10m';
    options=@{num_predict=64;num_ctx=1024;temperature=0}
  } 180
  if(-not ([string]$bridgeChat.message.content).Trim()){throw 'Bridge chat returned no final content.'}
  Write-Host "LOCAL bridge POST PASS: $(([string]$bridgeChat.message.content).Trim())" -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 7/8 - Configuring one Tailscale HTTPS root proxy...' -ForegroundColor White
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$proxyPort" | Out-Host
  & $tailscale serve status | Out-Host

  Write-Host ''
  Write-Host 'Step 8/8 - Testing EXACT iPhone HTTPS Director path...' -ForegroundColor White
  $privateTags=Invoke-RestMethod "$origin/ollama/api/tags" -TimeoutSec 30
  if(-not $privateTags.models){throw 'Private HTTPS /api/tags returned no models.'}
  Write-Host 'Private HTTPS GET PASS.' -ForegroundColor Green

  $privateChat=Post-Json "$origin/ollama/api/chat" @{
    model=$textModel;messages=@(@{role='user';content='Reply with exactly IPHONE_OK'});stream=$false;think=$false;keep_alive='10m';
    options=@{num_predict=64;num_ctx=1024;temperature=0}
  } 180
  if(-not ([string]$privateChat.message.content).Trim()){throw 'Private HTTPS chat returned no final content.'}
  Write-Host "Private HTTPS chat PASS: $(([string]$privateChat.message.content).Trim())" -ForegroundColor Green

  $privateJson=Post-Json "$origin/ollama/api/chat" @{
    model=$textModel;messages=@(@{role='user';content=$probePrompt});stream=$false;think=$false;format='json';keep_alive='10m';
    options=@{num_predict=300;num_ctx=1536;temperature=0}
  } 180
  $pjo=Parse-JsonText ([string]$privateJson.message.content)
  if(-not $pjo.final_prompt){throw 'Private HTTPS Director JSON probe did not return final_prompt.'}
  Write-Host 'Private HTTPS Director JSON PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'ALL DIRECTOR CORE TESTS PASSED - V11.8.5 IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host "Open on iPhone Safari: $origin/?v=1185" -ForegroundColor Cyan
  if($visionModel){Write-Host 'Vision model is installed; use the in-app V11.8.5 self-test and then test one real image.' -ForegroundColor White}
  Start-Process "$origin/?v=1185"
}
catch{
  Write-Host ''
  Write-Host 'REPAIR / SELF-TEST STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'The window will remain open so the error cannot disappear.' -ForegroundColor Yellow
}
finally{
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
