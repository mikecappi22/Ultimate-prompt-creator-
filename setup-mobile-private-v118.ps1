$ErrorActionPreference = 'Stop'

function Is-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Is-Admin)) {
  Write-Host 'Administrator permission is required so Tailscale can serve the local app directory.' -ForegroundColor Yellow
  Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  exit
}

$repoRaw = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
$appDir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$appFile = Join-Path $appDir 'index.html'
New-Item -ItemType Directory -Force -Path $appDir | Out-Null

Write-Host ''
Write-Host '=== Ultimate Prompt Creator V11.8 Private Mobile Setup ===' -ForegroundColor Cyan

if (-not (Get-Command tailscale -ErrorAction SilentlyContinue)) { throw 'Tailscale command was not found.' }
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) { throw 'Ollama command was not found.' }

Write-Host 'Downloading the private mobile app...' -ForegroundColor White
Invoke-WebRequest "$repoRaw/mobile-private-v118.html" -OutFile $appFile -UseBasicParsing

$ts = tailscale status --json | ConvertFrom-Json
$dns = [string]$ts.Self.DNSName
$dns = $dns.TrimEnd('.')
if (-not $dns) { throw 'Could not determine the Tailscale MagicDNS hostname.' }
$origin = "https://$dns"

Write-Host "Tailscale hostname: $origin" -ForegroundColor Green

# Keep Ollama local-only and allow requests from this exact private HTTPS origin.
[Environment]::SetEnvironmentVariable('OLLAMA_HOST','127.0.0.1:11434','User')
[Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS',$origin,'User')
$env:OLLAMA_HOST='127.0.0.1:11434'
$env:OLLAMA_ORIGINS=$origin

Write-Host 'Restarting Ollama so it picks up the private origin...' -ForegroundColor White
Get-Process -Name 'ollama','ollama app','ollama_llama_server' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
$ollama = (Get-Command ollama).Source
Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden

for($i=0;$i -lt 30;$i++){
  try { Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 | Out-Null; break } catch { Start-Sleep -Seconds 1 }
}

Write-Host 'Configuring one private HTTPS origin for both the app and Ollama...' -ForegroundColor White
# Reset only Tailscale Serve handlers on this machine, then install the two private handlers.
tailscale serve reset | Out-Null
# Mount the API first; Tailscale strips the /ollama mount prefix before forwarding to Ollama.
tailscale serve --bg --https=443 --set-path=/ollama 11434 | Out-Host
# Serve the local app directory at the root of the same HTTPS hostname.
tailscale serve --bg --https=443 --set-path=/ $appDir | Out-Host

Write-Host ''
Write-Host 'Current Serve configuration:' -ForegroundColor Cyan
tailscale serve status

Write-Host ''
Write-Host 'SETUP COMPLETE' -ForegroundColor Green
Write-Host 'On your iPhone, keep Tailscale connected and open:' -ForegroundColor White
Write-Host "$origin/" -ForegroundColor Cyan
Write-Host ''
Write-Host 'This version does not use the GitHub page to talk to Ollama, so browser CORS is removed from the path.' -ForegroundColor Green

Start-Process "$origin/"
Read-Host 'Press Enter to close'
