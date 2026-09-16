$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-saved-recipes-master-stacks-v1821.js'

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)

if ($html.Contains('__UPC_V1821_RECIPES__')) {
    Write-Host 'V18.21 Saved Recipes / Master Stacks is already installed.' -ForegroundColor Yellow
    exit 0
}

if (-not $html.Contains('__UPC_V1820_COMPOSER__')) {
    throw 'V18.20 Final Prompt Composer 2.0 is required before installing V18.21.'
}

$backup = Join-Path $dir ('index-before-v18.21-recipes-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading V18.21 Saved Recipes / Master Stacks...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content

if (-not $module.Contains('__UPC_V1821_RECIPES__')) {
    throw 'Downloaded V18.21 module failed marker verification.'
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace('</body>', $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains('__UPC_V1821_RECIPES__')) {
    Copy-Item $backup $app -Force
    throw 'Install verification failed. The backup was restored automatically.'
}

Write-Host ''
Write-Host 'PASS  V18.20 Final Prompt Composer found' -ForegroundColor Green
Write-Host 'PASS  V18.21 Saved Recipes / Master Stacks installed' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open UPC with ?v=1821recipes' -ForegroundColor Cyan
Write-Host 'Go to Create > Step 8 and open Saved Recipes + Master Stacks.' -ForegroundColor Cyan
