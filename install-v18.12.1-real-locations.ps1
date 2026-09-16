$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-category-environment-verified-realplaces-v18121.js'

if (-not (Test-Path $app)) { throw "Ultimate Prompt Creator index.html was not found at $app" }
$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if ($html.Contains('__UPC_V18121_REAL_LOCATIONS__')) { Write-Host 'V18.12.1 Verified Real-Location Packs are already installed.' -ForegroundColor Yellow; exit 0 }
if (-not ($html.Contains('__UPC_V181_CLEAN_DB__') -or $html.Contains('__UPC_V18_CLEAN__'))) { throw 'V18 clean core marker was not found.' }
if (-not $html.Contains('__UPC_V1812_ENVIRONMENT__')) { throw 'V18.12 Environment is not installed yet. Install Environment first.' }
$backup = Join-Path $dir ('index-before-v18.12.1-real-locations-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force
Write-Host 'Downloading V18.12.1 verified real-location packs...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content
if (-not $module.Contains('__UPC_V18121_REAL_LOCATIONS__')) { throw 'Downloaded real-location module failed marker verification.' }
$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace('</body>', $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))
$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains('__UPC_V18121_REAL_LOCATIONS__')) { Copy-Item $backup $app -Force; throw 'Install verification failed. The backup was restored automatically.' }
Write-Host ''
Write-Host 'PASS  V18 clean core found' -ForegroundColor Green
Write-Host 'PASS  V18.12 Environment found' -ForegroundColor Green
Write-Host 'PASS  V18.12.1 Verified Real-Location Packs installed' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open the app with ?v=18121real and search Environment for:' -ForegroundColor Cyan
Write-Host '  Primanti'
Write-Host '  Target'
Write-Host '  South Hills'
Write-Host '  Bellagio'
Write-Host '  Venetian'
Write-Host '  Pittsburgh'
Write-Host '  Las Vegas Strip'
