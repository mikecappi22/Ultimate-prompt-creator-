$ErrorActionPreference='Stop'
$Repo='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-';$Ref='cde3042aaaf7c57ac704ee827277f6beeec82b21';$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile';$App=Join-Path $Dir 'index.html';$Backup=Join-Path $Dir ('index-before-subject-roster-v153-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html');$Bridge=Join-Path $Dir 'private-mobile-proxy-v1187.ps1';$Tmp=Join-Path $env:TEMP 'UPC-SUBJECT-V153';$Url='https://laptop-5efmmkr5.tail97be36.ts.net/';$U=New-Object Text.UTF8Encoding($false)
Write-Host '=== UPC V15.3 Subject Roster Installer ===' -ForegroundColor Cyan
if(-not(Test-Path $App)){throw 'UPC index.html not found. Install V15.1 first.'}
New-Item -ItemType Directory -Force -Path $Tmp|Out-Null
$src=Join-Path $Tmp 'subject-roster-v153.js';Invoke-WebRequest "$Repo/$Ref/subject-roster-v153.js" -OutFile $src -UseBasicParsing
Copy-Item $App $Backup -Force
$html=[IO.File]::ReadAllText($App,[Text.Encoding]::UTF8)
if($html.Contains('subject-roster-v153.js') -or $html.Contains('Full subject roster already present.')){Write-Host 'Roster patch already installed.'}else{$code=[IO.File]::ReadAllText($src,[Text.Encoding]::UTF8);$html=$html.Replace('</body>',("<script>`r`n$code`r`n</script>`r`n</body>"));[IO.File]::WriteAllText($App,$html,$U)}
function StopB{Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue|?{$_.CommandLine-match'private-mobile-proxy-v1187\.ps1'-and$_.CommandLine-match'8765'}|%{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}}
function StartB{Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')}
StopB;Start-Sleep -Milliseconds 700;StartB;Start-Sleep -Seconds 3;& tailscale serve --bg http://127.0.0.1:8765|Out-Null
$p=Invoke-WebRequest 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 15;if(-not$p.Content.Contains('BETHANY')-or-not$p.Content.Contains('DAISY')){throw 'Roster patch verification failed.'}
Write-Host '';Write-Host 'V15.3 SUBJECT ROSTER PATCH READY' -ForegroundColor Green;Write-Host ($Url+'?v=1530') -ForegroundColor Cyan;Write-Host 'Missing subjects are added only when absent. Existing local subject records are preserved.';Start-Process ($Url+'?v=1530')