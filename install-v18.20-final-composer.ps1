$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-final-prompt-composer-v1820.js'

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)

if ($html.Contains('__UPC_V1820_COMPOSER__')) {
    Write-Host 'V18.20 Final Prompt Composer 2.0 is already installed.' -ForegroundColor Yellow
    exit 0
}

if (-not ($html.Contains('__UPC_V181_CLEAN_DB__') -or $html.Contains('__UPC_V18_CLEAN__'))) {
    throw 'V18 clean core marker was not found.'
}

if (-not $html.Contains('__UPC_V1816_CONSTRAINTS__')) {
    throw 'V18.16 Constraints is required before installing Final Prompt Composer 2.0.'
}

if (-not $html.Contains('__UPC_V1819_PRESETS__')) {
    throw 'V18.19 Platform Presets was not found. Run the V18.17-to-V18.19 final suite first.'
}

$backup = Join-Path $dir ('index-before-v18.20-final-composer-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading V18.20 Final Prompt Composer 2.0...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content

if (-not $module.Contains('__UPC_V1820_COMPOSER__')) {
    throw 'Downloaded Final Prompt Composer module failed marker verification.'
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace('</body>', $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains('__UPC_V1820_COMPOSER__')) {
    Copy-Item $backup $app -Force
    throw 'Install verification failed. The backup was restored automatically.'
}

Write-Host ''
Write-Host 'PASS  V18 clean core found' -ForegroundColor Green
Write-Host 'PASS  V18.16 Constraints found' -ForegroundColor Green
Write-Host 'PASS  V18.19 Platform Presets found' -ForegroundColor Green
Write-Host 'PASS  V18.20 Final Prompt Composer 2.0 installed' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open UPC with ?v=1820composer' -ForegroundColor Cyan
Write-Host 'Go to Create > Step 8. Final Prompt.' -ForegroundColor Cyan
