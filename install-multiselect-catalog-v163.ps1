$ErrorActionPreference='Stop'
$Dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$App=Join-Path $Dir 'index.html'
$Backup=Join-Path $Dir ('index-before-v163-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html')
$Tmp=Join-Path $env:TEMP 'catalog-multiselect-v163.js'
$Url='https://laptop-5efmmkr5.tail97be36.ts.net/?v=1630'
$Utf8NoBom=New-Object System.Text.UTF8Encoding($false)

Write-Host '=== UPC V16.3 Multi-Select Catalog Installer ===' -ForegroundColor Cyan
if(-not(Test-Path $App)){throw 'UPC app not found'}
Copy-Item $App $Backup -Force
Invoke-WebRequest 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/catalog-multiselect-v163.js' -OutFile $Tmp -UseBasicParsing
$html=[IO.File]::ReadAllText($App,[Text.Encoding]::UTF8)
if(-not$html.Contains('__UPC_CREATE160__')){throw 'V16 Ultimate Create is not installed.'}
if(-not$html.Contains('__UPC_CATALOG163__')){
  $addon=[IO.File]::ReadAllText($Tmp,[Text.Encoding]::UTF8)
  $html=$html.Replace('</body>',("<script>`r`n"+$addon+"`r`n</script>`r`n</body>"))
  [IO.File]::WriteAllText($App,$html,$Utf8NoBom)
}
$check=[IO.File]::ReadAllText($App,[Text.Encoding]::UTF8)
if(-not$check.Contains('__UPC_CATALOG163__')){Copy-Item $Backup $App -Force;throw 'V16.3 marker missing; previous page restored'}
Write-Host 'V16.3 MULTI-SELECT CATALOG INSTALLED' -ForegroundColor Green
Write-Host $Url -ForegroundColor Cyan
Write-Host 'Refresh the page with the V16.3 URL. No bridge restart is required.'