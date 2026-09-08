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
Write-Host '=== Ultimate Prompt Creator V11.8.1 Private Mobile Setup ===' -ForegroundColor Cyan

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

$localReady = $false
for($i=0;$i -lt 30;$i++){
  try { Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 | Out-Null; $localReady=$true; break } catch { Start-Sleep -Seconds 1 }
}
if (-not $localReady) { throw 'Local Ollama API did not become ready on 127.0.0.1:11434.' }

Write-Host 'Configuring one private HTTPS origin for both the app and Ollama...' -ForegroundColor White
# Reset only Tailscale Serve handlers on this machine, then install two private handlers.
tailscale serve reset | Out-Null
# IMPORTANT: trailing slash makes /ollama/ a subtree route so /ollama/api/* reaches Ollama.
tailscale serve --bg --https=443 --set-path=/ollama/ http://127.0.0.1:11434 | Out-Host
# Serve the local app directory at the root of the same HTTPS hostname.
tailscale serve --bg --https=443 --set-path=/ $appDir | Out-Host

Write-Host ''
Write-Host 'Current Serve configuration:' -ForegroundColor Cyan
tailscale serve status

Write-Host ''
Write-Host 'Testing the private Ollama route...' -ForegroundColor White
try {
  $test = Invoke-WebRequest "$origin/ollama/api/tags" -UseBasicParsing -TimeoutSec 15
  if ($test.StatusCode -eq 200) {
    Write-Host 'Private Ollama route: WORKING (HTTP 200)' -ForegroundColor Green
  } else {
    Write-Host "Private Ollama route returned HTTP $($test.StatusCode)" -ForegroundColor Yellow
  }
} catch {
  Write-Host "Private Ollama route test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'SETUP COMPLETE' -ForegroundColor Green
Write-Host 'On your iPhone, keep Tailscale connected and open:' -ForegroundColor White
Write-Host "$origin/" -ForegroundColor Cyan
Write-Host ''
Write-Host 'The app now calls Ollama at /ollama/api/* on the same private HTTPS origin.' -ForegroundColor Green

Start-Process "$origin/"
Read-Host 'Press Enter to close'
