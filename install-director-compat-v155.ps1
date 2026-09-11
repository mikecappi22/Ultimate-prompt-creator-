$ErrorActionPreference='Stop'
$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$App=Join-Path $Dir 'index.html'
$Bridge=Join-Path $Dir 'private-mobile-proxy-v1187.ps1'
$Backup=Join-Path $Dir ('index-before-v155-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
$Url='https://laptop-5efmmkr5.tail97be36.ts.net/'
$Utf8NoBom=New-Object System.Text.UTF8Encoding($false)

Write-Host '=== UPC V15.5 Creative Director Compatibility Fix ===' -ForegroundColor Cyan
if(-not(Test-Path $App)){throw "App not found: $App"}
if(-not(Test-Path $Bridge)){throw "Bridge not found: $Bridge"}
Copy-Item $App $Backup -Force

$html=[IO.File]::ReadAllText($App,[Text.Encoding]::UTF8)
$old="think:false,format:SCHEMA,keep_alive:'30m'"
$new="think:false,format:'json',keep_alive:'30m'"
if($html.Contains($old)){
  $html=$html.Replace($old,$new)
} elseif($html.Contains("format:SCHEMA")) {
  $html=$html.Replace("format:SCHEMA","format:'json'")
} elseif($html.Contains("format:'json'")) {
  Write-Host 'Director JSON compatibility patch already present.' -ForegroundColor Yellow
} else {
  throw 'Could not locate the Creative Director format option. No changes were made.'
}
[IO.File]::WriteAllText($App,$html,$Utf8NoBom)

Write-Host 'Restarting bridge...'
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
  Where-Object {$_.CommandLine -match 'private-mobile-proxy-v1187\.ps1' -and $_.CommandLine -match '8765'} |
  ForEach-Object {Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}
Start-Sleep -Milliseconds 700
Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')
Start-Sleep -Seconds 3
& tailscale serve --bg http://127.0.0.1:8765 | Out-Null

Write-Host 'Testing bridge + Ollama JSON mode...'
$testBody=@{
  model='qwen3:1.7b'
  messages=@(@{role='user';content='Return JSON only with one field named status whose value is OK.'})
  stream=$false
  think=$false
  format='json'
  options=@{num_predict=64;num_ctx=1024;temperature=0}
}|ConvertTo-Json -Depth 10
try{
  $r=Invoke-RestMethod 'http://127.0.0.1:8765/ollama/api/chat' -Method Post -ContentType 'application/json' -Body $testBody -TimeoutSec 60
  if(-not $r.message.content){throw 'Ollama returned no message content.'}
  Write-Host ('JSON MODE PASS: '+$r.message.content) -ForegroundColor Green
}catch{
  Write-Host 'Patch test failed. Restoring previous page...' -ForegroundColor Yellow
  Copy-Item $Backup $App -Force
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object {$_.CommandLine -match 'private-mobile-proxy-v1187\.ps1' -and $_.CommandLine -match '8765'} |
    ForEach-Object {Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}
  Start-Process powershell -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Bridge`"",'-AppFile',"`"$App`"",'-Port','8765')
  throw
}

Write-Host ''
Write-Host 'V15.5 DIRECTOR FIX INSTALLED' -ForegroundColor Green
Write-Host ($Url+'?v=1550') -ForegroundColor Cyan
Write-Host 'Change: Creative Director now requests plain JSON mode instead of sending a full JSON schema to Ollama.'
Write-Host 'This leaves Subjects, Projects, Guide, Library and all other modules unchanged.'
Start-Process ($Url+'?v=1550')