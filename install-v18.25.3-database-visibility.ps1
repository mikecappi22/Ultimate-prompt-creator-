$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-database-contrast-v18253.js'

if (-not (Test-Path $app)) { throw "UPC index.html not found at $app" }
$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)

if (-not $html.Contains('__UPC_V18252_NEON_THEME__')) {
  throw 'V18.25.2 Neon Portal Theme must be installed first.'
}
if ($html.Contains('__UPC_V18253_DB_CONTRAST__')) {
  Write-Host 'V18.25.3 Database Visibility patch is already installed.' -ForegroundColor Yellow
  exit 0
}

$backup = Join-Path $dir ('index-before-v18.25.3-database-visibility-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading V18.25.3 Database Visibility patch...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content
if (-not $module.Contains('__UPC_V18253_DB_CONTRAST__')) { throw 'Downloaded patch failed marker verification.' }

$html = $html.Replace('</body>',"<script>`r`n$module`r`n</script>`r`n</body>")
[IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
if (-not $verify.Contains('__UPC_V18253_DB_CONTRAST__')) {
  Copy-Item $backup $app -Force
  throw 'Install verification failed. Backup restored automatically.'
}

Write-Host ''
Write-Host 'PASS  V18.25.2 Neon Theme found' -ForegroundColor Green
Write-Host 'PASS  V18.25.3 Database Visibility patch installed' -ForegroundColor Green
Write-Host 'PASS  V18 Create database result text forced to high contrast' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Reload UPC with ?v=18253dbfix' -ForegroundColor Cyan
