$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'

function Is-Admin {
  $id=[Security.Principal.WindowsIdentity]::GetCurrent()
  $p=New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if(-not (Is-Admin)){
  Write-Host 'Reopening this repair as Administrator...' -ForegroundColor Yellow
  Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoExit -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  exit
}

$log=Join-Path $env:TEMP 'UltimatePromptCreator-V1182-Repair.log'
try { Start-Transcript -Path $log -Force | Out-Null } catch {}

function Find-Ollama {
  $cmd=Get-Command ollama.exe -ErrorAction SilentlyContinue
  if($cmd){return $cmd.Source}
  $candidates=@(
    (Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'),
    (Join-Path $env:LOCALAPPDATA 'Ollama\ollama.exe'),
    (Join-Path $env:ProgramFiles 'Ollama\ollama.exe')
  )
  foreach($p in $candidates){if(Test-Path $p){return $p}}
  return $null
}

function Find-Tailscale {
  $cmd=Get-Command tailscale.exe -ErrorAction SilentlyContinue
  if($cmd){return $cmd.Source}
  $candidates=@(
    (Join-Path $env:ProgramFiles 'Tailscale\tailscale.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Tailscale\tailscale.exe')
  )
  foreach($p in $candidates){if($p -and (Test-Path $p)){return $p}}
  return $null
}

function Wait-Ollama([int]$Seconds=45){
  for($i=1;$i -le $Seconds;$i++){
    try{
      $r=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2
      if($null -ne $r){return $true}
    }catch{}
    Start-Sleep -Seconds 1
  }
  return $false
}

try {
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V11.8.2 Mobile Repair ===' -ForegroundColor Cyan
  Write-Host "Diagnostic log: $log" -ForegroundColor DarkGray

  $ollama=Find-Ollama
  if(-not $ollama){throw 'Could not locate ollama.exe. Open the Ollama Windows app once, then rerun this repair.'}
  Write-Host "Found Ollama: $ollama" -ForegroundColor Green

  $tailscale=Find-Tailscale
  if(-not $tailscale){throw 'Could not locate tailscale.exe.'}
  Write-Host "Found Tailscale: $tailscale" -ForegroundColor Green

  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  $appFile=Join-Path $appDir 'index.html'
  if(-not (Test-Path $appFile)){
    throw "Private mobile app file is missing: $appFile. Run the full V11.8 setup first."
  }
  Write-Host "Found mobile app: $appFile" -ForegroundColor Green

  Write-Host 'Reading your Tailscale hostname...' -ForegroundColor White
  $tsJson=& $tailscale status --json
  $ts=$tsJson | ConvertFrom-Json
  $dns=([string]$ts.Self.DNSName).TrimEnd('.')
  if(-not $dns){throw 'Could not determine the Tailscale MagicDNS hostname.'}
  $origin="https://$dns"
  Write-Host "Private HTTPS origin: $origin" -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 1/4 - Configuring Ollama for the private origin...' -ForegroundColor Cyan
  [Environment]::SetEnvironmentVariable('OLLAMA_HOST','127.0.0.1:11434','User')
  [Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS',$origin,'User')
  $env:OLLAMA_HOST='127.0.0.1:11434'
  $env:OLLAMA_ORIGINS=$origin

  Write-Host 'Step 2/4 - Restarting Ollama...' -ForegroundColor Cyan
  Get-Process -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -match '^ollama'} | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Write-Host "Launching: $ollama serve" -ForegroundColor DarkGray
  Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden

  if(-not (Wait-Ollama 45)){
    throw 'Ollama did not answer on http://127.0.0.1:11434 within 45 seconds.'
  }
  $local=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 10
  $localModels=@($local.models | ForEach-Object {$_.name})
  Write-Host ('Ollama local API is READY. Models: ' + ($localModels -join ', ')) -ForegroundColor Green

  Write-Host ''
  Write-Host 'Step 3/4 - Repairing Tailscale Serve routes...' -ForegroundColor Cyan
  & $tailscale serve reset | Out-Host
  if($LASTEXITCODE -ne 0){throw "tailscale serve reset failed with exit code $LASTEXITCODE"}

  # /ollama/ is intentionally a trailing-slash subtree mount so /ollama/api/* matches it.
  & $tailscale serve --bg --https=443 --set-path=/ollama/ 'http://127.0.0.1:11434' | Out-Host
  if($LASTEXITCODE -ne 0){throw "Tailscale Ollama route failed with exit code $LASTEXITCODE"}

  & $tailscale serve --bg --https=443 --set-path=/ $appDir | Out-Host
  if($LASTEXITCODE -ne 0){throw "Tailscale app route failed with exit code $LASTEXITCODE"}

  Write-Host ''
  Write-Host 'Current Tailscale Serve configuration:' -ForegroundColor White
  & $tailscale serve status | Out-Host

  Write-Host ''
  Write-Host 'Step 4/4 - Testing the private iPhone API route...' -ForegroundColor Cyan
  $testUrl="$origin/ollama/api/tags"
  Write-Host "Testing: $testUrl" -ForegroundColor DarkGray
  $resp=Invoke-WebRequest $testUrl -UseBasicParsing -TimeoutSec 20
  if($resp.StatusCode -ne 200){throw "Private API returned HTTP $($resp.StatusCode)"}

  Write-Host ''
  Write-Host 'SUCCESS - PRIVATE MOBILE CONNECTION IS READY' -ForegroundColor Green
  Write-Host 'The /ollama/api/tags route returned HTTP 200.' -ForegroundColor Green
  Write-Host ''
  Write-Host 'On your iPhone:' -ForegroundColor White
  Write-Host '1. Keep Tailscale connected.' -ForegroundColor White
  Write-Host '2. Open Safari.' -ForegroundColor White
  Write-Host "3. Open: $origin/" -ForegroundColor Cyan
  Write-Host '4. Tap Check Ollama.' -ForegroundColor White

} catch {
  Write-Host ''
  Write-Host 'REPAIR STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log saved to: $log" -ForegroundColor Yellow
  Write-Host 'Take a screenshot of this red error and send it to ChatGPT.' -ForegroundColor Yellow
} finally {
  try { Stop-Transcript | Out-Null } catch {}
  Write-Host ''
  Read-Host 'Press Enter to close this window'
}
