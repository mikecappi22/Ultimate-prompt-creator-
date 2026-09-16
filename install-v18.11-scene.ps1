$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-category-scene-v1811.js'

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)

if ($html.Contains('__UPC_V1811_SCENE__')) {
    Write-Host 'V18.11 Scene / Concept is already installed.' -ForegroundColor Yellow
    exit 0
}

if (-not ($html.Contains('__UPC_V181_CLEAN_DB__') -or $html.Contains('__UPC_V18_CLEAN__'))) {
    throw 'V18 clean core marker was not found. This installer expects the clean V18.1 database build.'
}

if (-not $html.Contains('__UPC_V1810_POSE__')) {
    throw 'V18.10 Pose / Action was not found. Finish Pose before installing Scene / Concept.'
}

$backup = Join-Path $dir ('index-before-v18.11-scene-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force

Write-Host 'Downloading V18.11 Scene / Concept expansion...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content
if (-not $module.Contains('__UPC_V1811_SCENE__')) {
    throw 'Downloaded Scene module failed marker verification.'
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace('</body>', $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains('__UPC_V1811_SCENE__')) {
    Copy-Item $backup $app -Force
    throw 'Install verification failed. The backup was restored automatically.'
}

Write-Host ''
Write-Host 'PASS  V18 clean core found' -ForegroundColor Green
Write-Host 'PASS  V18.10 Pose / Action found' -ForegroundColor Green
Write-Host 'PASS  V18.11 Scene / Concept expansion installed' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open the app with ?v=1811scene and search Scene for:' -ForegroundColor Cyan
Write-Host '  morning routine'
Write-Host '  nail salon'
Write-Host '  arm wrestling'
Write-Host '  car push'
Write-Host '  Christmas cookie'
Write-Host '  walking vlog'
