$ErrorActionPreference='Stop'

Write-Host ''
Write-Host '=== Vision V12.1 Quality + Speed Release Launcher ===' -ForegroundColor Cyan
Write-Host 'Preparing the validated transactional installer with the corrected Moondream exclusion check.' -ForegroundColor White
Write-Host ''

$installerCommit='324d5dfc6261a310f94383279d22bf06753a8421'
$url="https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/$installerCommit/install-vision-v121-quality-speed.ps1"
$base=Join-Path $env:TEMP 'install-vision-v121-quality-speed-base.ps1'
$patched=Join-Path $env:TEMP 'install-vision-v121-quality-speed-RELEASE.ps1'

Remove-Item $base,$patched -Force -ErrorAction SilentlyContinue
Invoke-WebRequest $url -OutFile $base -UseBasicParsing
$lines=@(Get-Content $base)
$bad=@($lines|Where-Object{$_ -match 'Moondream routing unexpectedly found in V12\.1'})
if($bad.Count -ne 1){throw "Expected exactly one obsolete Moondream validation line; found $($bad.Count)."}
$filtered=@($lines|Where-Object{$_ -notmatch 'Moondream routing unexpectedly found in V12\.1'})
$filtered|Set-Content $patched -Encoding UTF8

$tokens=$null
$errors=$null
[System.Management.Automation.Language.Parser]::ParseFile($patched,[ref]$tokens,[ref]$errors)|Out-Null
if($errors -and $errors.Count -gt 0){
  $errors|ForEach-Object{Write-Error $_.Message}
  throw 'Corrected transactional installer failed local Windows PowerShell parsing.'
}

$release=Get-Content $patched -Raw
$required=@(
  '589c1a9267e3ea96cafc28820a1db8a677d4535e',
  'index-v121-candidate.html',
  'Rollback backup',
  'ROLLBACK PASS',
  'Restart-PrivateBridge',
  'BANNED_CERTAINTY',
  'format:STRUCT_SCHEMA',
  'px:320',
  'V12.1 QUALITY + SPEED IS READY'
)
foreach($m in $required){if(-not $release.Contains($m)){throw "Corrected installer is missing safeguard: $m"}}
if($release -match 'Moondream routing unexpectedly found in V12\.1'){throw 'Obsolete false-positive check is still present.'}

Write-Host 'RELEASE INSTALLER LOCAL PARSER + SAFEGUARDS PASS' -ForegroundColor Green
Write-Host 'Starting transactional installer...' -ForegroundColor White
Write-Host ''

powershell -NoProfile -ExecutionPolicy Bypass -File $patched
