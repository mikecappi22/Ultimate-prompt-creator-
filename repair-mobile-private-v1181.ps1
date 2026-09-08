$ErrorActionPreference='Stop'

function Is-Admin {
  $id=[Security.Principal.WindowsIdentity]::GetCurrent()
  $p=New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
if(-not (Is-Admin)){
  Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  exit
}

$ts=tailscale status --json | ConvertFrom-Json
$dns=([string]$ts.Self.DNSName).TrimEnd('.')
if(-not $dns){throw 'Could not determine Tailscale hostname.'}
$origin="https://$dns"
$appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
if(-not (Test-Path $appDir)){throw "Mobile app directory not found: $appDir. Run the full V11.8 setup first."}

Write-Host '=== V11.8.1 Route Repair ===' -ForegroundColor Cyan
Write-Host "Private origin: $origin" -ForegroundColor Green

# Ensure Ollama allows the exact private origin and stays local-only.
[Environment]::SetEnvironmentVariable('OLLAMA_HOST','127.0.0.1:11434','User')
[Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS',$origin,'User')
$env:OLLAMA_HOST='127.0.0.1:11434'
$env:OLLAMA_ORIGINS=$origin

Write-Host 'Restarting Ollama...' -ForegroundColor White
Get-Process -Name 'ollama','ollama app','ollama_llama_server' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
$ollama=(Get-Command ollama).Source
Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden
for($i=0;$i -lt 30;$i++){
  try{Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2|Out-Null;break}catch{Start-Sleep -Seconds 1}
}

Write-Host 'Repairing Tailscale Serve routes...' -ForegroundColor White
tailscale serve reset | Out-Null
# Trailing slash is required for the /ollama/ subtree.
tailscale serve --bg --https=443 --set-path=/ollama/ http://127.0.0.1:11434 | Out-Host
tailscale serve --bg --https=443 --set-path=/ $appDir | Out-Host

Write-Host ''
tailscale serve status
Write-Host ''
Write-Host 'Testing private API route...' -ForegroundColor White
$r=Invoke-WebRequest "$origin/ollama/api/tags" -UseBasicParsing -TimeoutSec 15
if($r.StatusCode -eq 200){
  Write-Host 'SUCCESS: /ollama/api/tags returned HTTP 200.' -ForegroundColor Green
  Write-Host "Open this on iPhone Safari: $origin/" -ForegroundColor Cyan
}else{
  Write-Host "Unexpected HTTP status: $($r.StatusCode)" -ForegroundColor Yellow
}
Read-Host 'Press Enter to close'
