$ErrorActionPreference='Stop'
$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$App=Join-Path $Dir 'index.html'
$Backup=Join-Path $Dir ('index-before-v162-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
$Url='https://laptop-5efmmkr5.tail97be36.ts.net/'
$Utf8NoBom=New-Object System.Text.UTF8Encoding($false)

Write-Host '=== UPC V16.2 Live Database Pickers Installer ===' -ForegroundColor Cyan
if(-not(Test-Path $App)){throw 'UPC app not found'}
Copy-Item $App $Backup -Force

$html=[IO.File]::ReadAllText($App,[Text.Encoding]::UTF8)
if(-not $html.Contains('__UPC_CREATE160__')){throw 'V16 Create is not installed.'}
if(-not $html.Contains('__UPC_CREATE161__')){Write-Warning 'V16.1 wizard marker not found. Live search will still install.'}

$tmp=Join-Path $env:TEMP 'live-db-pickers-v162.js'
Invoke-WebRequest 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/live-db-pickers-v162.js' -OutFile $tmp -UseBasicParsing
$patch=[IO.File]::ReadAllText($tmp,[Text.Encoding]::UTF8)
if(-not $html.Contains('__UPC_LIVE_DB162__')){
  $html=$html.Replace('</body>',("<script>`r`n"+$patch+"`r`n</script>`r`n</body>"))
}
[IO.File]::WriteAllText($App,$html,$Utf8NoBom)

$p=Invoke-WebRequest 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 15
if(-not $p.Content.Contains('__UPC_LIVE_DB162__')){
  Copy-Item $Backup $App -Force
  throw 'V16.2 live-search marker missing; previous page restored.'
}
$db=Invoke-WebRequest 'http://127.0.0.1:8765/db-worker-v100.js' -UseBasicParsing -TimeoutSec 15
if($db.StatusCode -ne 200){
  Copy-Item $Backup $App -Force
  throw 'Prompt database worker is unavailable.'
}

Write-Host 'V16.2 LIVE SEARCH INSTALLED' -ForegroundColor Green
Write-Host ($Url+'?v=1620') -ForegroundColor Cyan
Write-Host 'Type 2+ characters in Create fields to search the prompt database live. Tap a result to use it.'
Start-Process ($Url+'?v=1620')