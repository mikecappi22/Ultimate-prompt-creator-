$ErrorActionPreference='Stop'
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
$principal=New-Object Security.Principal.WindowsPrincipal($identity)
$isAdmin=$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if(-not $isAdmin){
  Write-Host 'Administrator rights are required. Opening an elevated PowerShell window...' -ForegroundColor Yellow
  $self=$MyInvocation.MyCommand.Path
  Start-Process powershell.exe -Verb RunAs -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$self`"")
  exit
}
$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$App=Join-Path $Dir 'index.html'
$Bridge=Join-Path $Dir 'private-mobile-proxy-v1188.ps1'
$BridgeTask='Ultimate Prompt Creator - Bridge'
$WatchTask='Ultimate Prompt Creator - Watchdog'
Write-Host '=== UPC ALWAYS-ON UPDATE TO V11.8.8 V2 ===' -ForegroundColor Cyan
if(-not(Test-Path $Bridge)){throw "Missing bridge: $Bridge"}
if(-not(Test-Path $App)){throw "Missing app: $App"}
$bridgeAction=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ("-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Bridge`" -AppFile `"$App`" -Port 8765")
$bt=Get-ScheduledTask -TaskName $BridgeTask -ErrorAction SilentlyContinue
if($bt){Set-ScheduledTask -TaskName $BridgeTask -Action $bridgeAction | Out-Null;Write-Host 'Updated Bridge scheduled task.' -ForegroundColor Green}else{Write-Host 'Bridge scheduled task not found; skipping task update.' -ForegroundColor Yellow}
$wt=Get-ScheduledTask -TaskName $WatchTask -ErrorAction SilentlyContinue
if($wt){
  $changed=$false
  $newActions=@()
  foreach($a in $wt.Actions){
    $args=$a.Arguments
    if($args -and $args -match 'private-mobile-proxy-v1187\.ps1'){$args=$args -replace 'private-mobile-proxy-v1187\.ps1','private-mobile-proxy-v1188.ps1';$changed=$true}
    $newActions+=New-ScheduledTaskAction -Execute $a.Execute -Argument $args -WorkingDirectory $a.WorkingDirectory
  }
  if($changed){Set-ScheduledTask -TaskName $WatchTask -Action $newActions | Out-Null;Write-Host 'Updated Watchdog scheduled task action.' -ForegroundColor Green}else{Write-Host 'Watchdog task action does not directly reference v1187.' -ForegroundColor Yellow}
}
$watchCandidates=Get-ChildItem $Dir -Filter '*watch*.ps1' -File -ErrorAction SilentlyContinue
foreach($f in $watchCandidates){
  $txt=[IO.File]::ReadAllText($f.FullName)
  if($txt -match 'private-mobile-proxy-v1187\.ps1'){
    $bak=$f.FullName+'.before-v1188.bak'
    Copy-Item $f.FullName $bak -Force
    $txt=$txt -replace 'private-mobile-proxy-v1187\.ps1','private-mobile-proxy-v1188.ps1'
    [IO.File]::WriteAllText($f.FullName,$txt,(New-Object Text.UTF8Encoding($false)))
    Write-Host ("Updated watchdog script: "+$f.Name) -ForegroundColor Green
  }
}
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'private-mobile-proxy-v1187\.ps1' -or $_.CommandLine -match 'private-mobile-proxy-v1188\.ps1' } | ForEach-Object { if($_.ProcessId -ne $PID){Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue} }
Start-Sleep -Seconds 1
Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')
Start-Sleep -Seconds 3
$health=Invoke-WebRequest 'http://127.0.0.1:8765/health' -UseBasicParsing -TimeoutSec 15
Write-Host ''
Write-Host ('Health: '+$health.Content) -ForegroundColor Green
Write-Host ''
Write-Host 'Scheduled task actions:' -ForegroundColor Cyan
Get-ScheduledTask -TaskName $BridgeTask,$WatchTask -ErrorAction SilentlyContinue | ForEach-Object { Write-Host ('TASK: '+$_.TaskName) -ForegroundColor Cyan; $_.Actions | Format-List Execute,Arguments }
Write-Host ''
Write-Host 'UPC always-on now targets V11.8.8.' -ForegroundColor Green
Write-Host 'You may close this window.' -ForegroundColor DarkGray