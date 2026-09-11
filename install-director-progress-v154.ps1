$ErrorActionPreference='Stop'
$Repo='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-';$Ref='538f9a8696856c656afe7cfcae6da649c653a79b';$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile';$App=Join-Path $Dir 'index.html';$Bridge=Join-Path $Dir 'private-mobile-proxy-v1187.ps1';$Tmp=Join-Path $env:TEMP 'UPC-DIRECTOR-PROGRESS-V154';$Url='https://laptop-5efmmkr5.tail97be36.ts.net/';$Utf8=New-Object Text.UTF8Encoding($false)
Write-Host '=== UPC V15.4 Director Progress Installer ===' -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Tmp|Out-Null
$Patch=Join-Path $Tmp 'director-progress-v154.js';Invoke-WebRequest "$Repo/$Ref/director-progress-v154.js" -OutFile $Patch -UseBasicParsing
if(-not(Test-Path $App)){throw 'UPC index.html not found.'}
$Backup=Join-Path $Dir ('index-before-director-progress-v154-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html');Copy-Item $App $Backup -Force
$html=[IO.File]::ReadAllText($App,[Text.Encoding]::UTF8)
$js=[IO.File]::ReadAllText($Patch,[Text.Encoding]::UTF8)
if(-not $html.Contains('__UPC_DIRECTOR_PROGRESS154__')){$html=$html.Replace('</body>',("<script>`r`n$js`r`n</script>`r`n</body>"));[IO.File]::WriteAllText($App,$html,$Utf8)}
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue|Where-Object {$_.CommandLine -match 'private-mobile-proxy-v1187\.ps1' -and $_.CommandLine -match '8765'}|ForEach-Object {Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}
Start-Sleep -Milliseconds 600
Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')
Start-Sleep -Seconds 3
& tailscale serve --bg http://127.0.0.1:8765|Out-Null
$page=Invoke-WebRequest 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 15
if(-not $page.Content.Contains('__UPC_DIRECTOR_PROGRESS154__')){throw 'Progress patch did not load.'}
Write-Host 'Director progress bar installed.' -ForegroundColor Green
Write-Host ($Url+'?v=1540') -ForegroundColor Cyan
Start-Process ($Url+'?v=1540')