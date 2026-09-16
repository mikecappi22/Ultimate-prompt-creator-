$ErrorActionPreference = 'Stop'
$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-production-audit-feedback-v18251.js'
if (-not (Test-Path $app)) { throw "Ultimate Prompt Creator index.html was not found at $app" }
$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
if ($html.Contains('__UPC_V18251_AUDIT_FEEDBACK__')) { Write-Host 'V18.25.1 Audit Feedback Patch is already installed.' -ForegroundColor Yellow; exit 0 }
if (-not $html.Contains('__UPC_V1825_RELEASE_LOCK__')) { throw 'V18.25 Production Release Lock is required before V18.25.1.' }
$backup = Join-Path $dir ('index-before-v18.25.1-audit-feedback-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force
Write-Host 'Downloading V18.25.1 Audit Feedback Patch...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content
if (-not $module.Contains('__UPC_V18251_AUDIT_FEEDBACK__')) { throw 'Downloaded V18.25.1 module failed marker verification.' }
$html = $html.Replace('</body>',"<script>`r`n$module`r`n</script>`r`n</body>")
[IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))
$verify=[IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
if(-not $verify.Contains('__UPC_V18251_AUDIT_FEEDBACK__')){Copy-Item $backup $app -Force;throw 'Install verification failed. Backup restored.'}
Write-Host ''
Write-Host 'PASS  V18.25 Production Release Lock found' -ForegroundColor Green
Write-Host 'PASS  V18.25.1 Audit Feedback Patch installed' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open UPC with ?v=18251audit' -ForegroundColor Cyan
Write-Host 'Click Run Production Audit. A visible RUNNING then AUDIT COMPLETE status will now appear.' -ForegroundColor Cyan
