$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-workspace-backup-v1824.js'

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)

if ($html.Contains('__UPC_V1824_BACKUP__')) {
    Write-Host 'V18.24 Workspace Backup is already installed.' -ForegroundColor Yellow
    exit 0
}

if (-not $html.Contains('__UPC_V1823_ANALYZER__')) {
    throw 'V18.23 Prompt Quality Analyzer is required before installing V18.24.'
}

$backup = Join-Path $dir ('index-before-v18.24-workspace-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading V18.24 Workspace Backup...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content

if (-not $module.Contains('__UPC_V1824_BACKUP__')) {
    throw 'Downloaded V18.24 module failed marker verification.'
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace('</body>', $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains('__UPC_V1824_BACKUP__')) {
    Copy-Item $backup $app -Force
    throw 'Install verification failed. The backup was restored automatically.'
}

Write-Host ''
Write-Host 'PASS  V18.23 Prompt Quality Analyzer found' -ForegroundColor Green
Write-Host 'PASS  V18.24 Workspace Backup installed' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open UPC with ?v=1824backup' -ForegroundColor Cyan
Write-Host 'Create > Step 8 now includes Workspace Backup.' -ForegroundColor Cyan
