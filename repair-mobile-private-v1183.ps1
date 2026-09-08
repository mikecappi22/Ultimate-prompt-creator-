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

$log="$env:TEMP\UltimatePromptCreator-V1183-Repair.log"
Start-Transcript -Path $log -Force | Out-Null

try {
  Write-Host '=== V11.8.3 Private Mobile Repair ===' -ForegroundColor Cyan

  $repoRaw='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  $appFile=Join-Path $appDir 'index.html'
  $proxyFile=Join-Path $appDir 'private-mobile-proxy-v1183.ps1'
  $proxyPort=8765
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null

  Write-Host 'Downloading latest private mobile app and local bridge...' -ForegroundColor White
  Invoke-WebRequest "$repoRaw/mobile-private-v118.html" -OutFile $appFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/private-mobile-proxy-v1183.ps1" -OutFile $proxyFile -UseBasicParsing

  $tailscaleCandidates=@(
    "$env:ProgramFiles\Tailscale\tailscale.exe",
    "$env:LOCALAPPDATA\Tailscale\tailscale.exe"
  )
  $tailscale=(Get-Command tailscale -ErrorAction SilentlyContinue).Source
  if(-not $tailscale){$tailscale=$tailscaleCandidates|Where-Object{Test-Path $_}|Select-Object -First 1}
  if(-not $tailscale){throw 'Could not locate tailscale.exe.'}

  $ollamaCandidates=@(
    "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
    "$env:LOCALAPPDATA\Ollama\ollama.exe",
    "$env:ProgramFiles\Ollama\ollama.exe"
  )
  $ollama=(Get-Command ollama -ErrorAction SilentlyContinue).Source
  if(-not $ollama){$ollama=$ollamaCandidates|Where-Object{Test-Path $_}|Select-Object -First 1}
  if(-not $ollama){throw 'Could not locate ollama.exe.'}

  Write-Host "Found Ollama: $ollama" -ForegroundColor Green
  Write-Host "Found Tailscale: $tailscale" -ForegroundColor Green

  $ts=& $tailscale status --json | ConvertFrom-Json
  $dns=([string]$ts.Self.DNSName).TrimEnd('.')
  if(-not $dns){throw 'Could not determine your Tailscale hostname.'}
  $origin="https://$dns"
  Write-Host "Private URL: $origin/" -ForegroundColor Green

  Write-Host 'Step 1/5 - Ensuring Ollama is local and running...' -ForegroundColor White
  [Environment]::SetEnvironmentVariable('OLLAMA_HOST','127.0.0.1:11434','User')
  $env:OLLAMA_HOST='127.0.0.1:11434'
  try { Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 | Out-Null }
  catch {
    Get-Process -Name 'ollama','ollama app','ollama_llama_server' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden
  }
  $ready=$false
  for($i=0;$i -lt 40;$i++){
    try{Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2|Out-Null;$ready=$true;break}catch{Start-Sleep -Seconds 1}
  }
  if(-not $ready){throw 'Ollama local API did not become ready on 127.0.0.1:11434.'}
  Write-Host 'Ollama local API is READY.' -ForegroundColor Green

  Write-Host 'Step 2/5 - Stopping any old mobile bridge process...' -ForegroundColor White
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*private-mobile-proxy-v1183.ps1*' } |
    ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {} }

  Write-Host 'Step 3/5 - Starting local app + Ollama bridge...' -ForegroundColor White
  $args="-NoProfile -ExecutionPolicy Bypass -File `"$proxyFile`" -AppFile `"$appFile`" -Port $proxyPort"
  Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden

  $bridgeReady=$false
  for($i=0;$i -lt 30;$i++){
    try{ $r=Invoke-WebRequest "http://127.0.0.1:$proxyPort/health" -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -eq 200){$bridgeReady=$true;break} }catch{}
    Start-Sleep -Seconds 1
  }
  if(-not $bridgeReady){throw 'Local mobile bridge did not start on 127.0.0.1:8765.'}
  Write-Host 'Local mobile bridge is READY.' -ForegroundColor Green

  Write-Host 'Step 4/5 - Replacing Tailscale multi-path routing with ONE root proxy...' -ForegroundColor White
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$proxyPort" | Out-Host
  Write-Host ''
  & $tailscale serve status | Out-Host

  Write-Host 'Step 5/5 - Testing the private iPhone route...' -ForegroundColor White
  $test="$origin/ollama/api/tags"
  Write-Host "Testing: $test" -ForegroundColor Cyan
  $resp=Invoke-WebRequest $test -UseBasicParsing -TimeoutSec 20
  if($resp.StatusCode -ne 200){throw "Private API returned HTTP $($resp.StatusCode)."}

  Write-Host ''
  Write-Host 'SUCCESS - PRIVATE MOBILE CONNECTION IS READY' -ForegroundColor Green
  Write-Host 'The bridge returned HTTP 200 from Ollama.' -ForegroundColor Green
  Write-Host ''
  Write-Host 'On your iPhone, keep Tailscale connected and open:' -ForegroundColor White
  Write-Host "$origin/" -ForegroundColor Cyan
  Write-Host ''
  Write-Host 'This version uses a single Tailscale root proxy, so there is no /ollama Serve mount to return 403.' -ForegroundColor Green
  Start-Process "$origin/"
}
catch {
  Write-Host ''
  Write-Host 'REPAIR STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log saved to: $log" -ForegroundColor Yellow
}
finally {
  try { Stop-Transcript | Out-Null } catch {}
  Read-Host 'Press Enter to close this window'
}
