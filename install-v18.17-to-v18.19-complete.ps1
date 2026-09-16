$ErrorActionPreference='Stop'
$base='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
$steps=@('install-v18.17-final-audit.ps1','install-v18.18-smart-stack.ps1','install-v18.19-platform-presets.ps1')
foreach($s in $steps){
  $p=Join-Path $env:TEMP $s
  Write-Host ""
  Write-Host "=== Running $s ===" -ForegroundColor Cyan
  Invoke-WebRequest "$base/$s" -OutFile $p -UseBasicParsing
  & powershell -NoProfile -ExecutionPolicy Bypass -File $p
  if($LASTEXITCODE -ne 0){throw "$s failed with exit code $LASTEXITCODE"}
}
Write-Host ""
Write-Host 'PASS  UPC FINAL SUITE COMPLETE: steps 1 through 5 installed' -ForegroundColor Green
Write-Host 'Open UPC with ?v=1819final' -ForegroundColor Cyan
Write-Host 'Buttons: PRESETS | STACK BUILDER | UPC HEALTH' -ForegroundColor Cyan
