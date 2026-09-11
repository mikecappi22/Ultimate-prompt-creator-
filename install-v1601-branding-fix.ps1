$ErrorActionPreference='Stop'
$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$App=Join-Path $Dir 'index.html'
$Bridge=Join-Path $Dir 'private-mobile-proxy-v1187.ps1'
$Backup=Join-Path $Dir ('index-before-v1601-branding-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
$Url='https://laptop-5efmmkr5.tail97be36.ts.net/'
$U=New-Object Text.UTF8Encoding($false)

Write-Host '=== UPC V16.0.1 Branding Fix ===' -ForegroundColor Cyan
if(-not(Test-Path $App)){throw "App not found: $App"}
if(-not(Test-Path $Bridge)){throw "Bridge not found: $Bridge"}
Copy-Item $App $Backup -Force

$html=[IO.File]::ReadAllText($App,[Text.Encoding]::UTF8)
if(-not $html.Contains('__UPC_CREATE160__')){throw 'V16 Ultimate Create marker is not installed. Run the V16 installer first.'}

# Update only visible branding/version strings; do not remove or rebuild any modules.
$replacements=@{
  'V15.1 PRODUCT STUDIO + GUIDE'='V16 ULTIMATE CREATE'
  'V15 PRODUCT STUDIO'='V16 ULTIMATE CREATE'
  'V14.3 UNIFIED'='V16 ULTIMATE CREATE'
  'Ultimate Prompt Creator V15.1'='Ultimate Prompt Creator V16'
  'Ultimate Prompt Creator V15 Product Studio'='Ultimate Prompt Creator V16 Ultimate Create'
  '<title>Ultimate Prompt Creator V14.3 Unified</title>'='<title>Ultimate Prompt Creator V16 Ultimate Create</title>'
}
foreach($k in $replacements.Keys){$html=$html.Replace($k,$replacements[$k])}

# Ensure the sidebar badge clearly reflects the running generation.
$html=$html -replace '<span class="version">[^<]*</span>','<span class="version">V16 ULTIMATE CREATE</span>'

[IO.File]::WriteAllText($App,$html,$U)

Write-Host 'Restarting private bridge...'
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
  Where-Object {$_.CommandLine -match 'private-mobile-proxy-v1187\.ps1' -and $_.CommandLine -match '8765'} |
  ForEach-Object {Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}
Start-Sleep -Milliseconds 700
Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')
Start-Sleep -Seconds 3
& tailscale serve --bg http://127.0.0.1:8765 | Out-Null

$p=Invoke-WebRequest 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 15
if(-not $p.Content.Contains('__UPC_CREATE160__')){Copy-Item $Backup $App -Force;throw 'V16 marker disappeared after branding patch; previous page restored.'}
if(-not $p.Content.Contains('V16 ULTIMATE CREATE')){Copy-Item $Backup $App -Force;throw 'V16 branding was not found after patch; previous page restored.'}

Write-Host ''
Write-Host 'V16.0.1 BRANDING FIX INSTALLED' -ForegroundColor Green
Write-Host ($Url+'?v=1601') -ForegroundColor Cyan
Write-Host 'No Subjects, Projects, Library data, Director settings, or advanced modules were changed.'
Start-Process ($Url+'?v=1601')