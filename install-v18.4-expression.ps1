$ErrorActionPreference = "Stop"

$dir = Join-Path $env:LOCALAPPDATA "UltimatePromptCreatorMobile"
$app = Join-Path $dir "index.html"
$url = "https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-category-expression-v184.js"

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)

$required = @(
    "__UPC_V181_CLEAN_DB__",
    "__UPC_V182_HAIR__",
    "__UPC_V183_MAKEUP__"
)
foreach ($marker in $required) {
    if (-not $html.Contains($marker)) {
        throw "Required prior module $marker is missing. Finish the earlier category before Expressions."
    }
}

if ($html.Contains("__UPC_V184_EXPRESSION__")) {
    Write-Host "V18.4 Expression Expansion is already installed." -ForegroundColor Yellow
    exit 0
}

$legacy = @("__UPC_LIVE_DB162__", "__UPC_CATALOG163__", "__UPC_CATEGORY174__")
foreach ($marker in $legacy) {
    if ($html.Contains($marker)) {
        throw "Legacy search marker $marker is still present. Stop here rather than mixing search engines."
    }
}

$backup = Join-Path $dir ("index-before-v18.4-expression-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".html")
Copy-Item $app $backup -Force

Write-Host "Downloading strict Expression category expansion..." -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content
if (-not $module.Contains("__UPC_V184_EXPRESSION__")) {
    throw "Downloaded Expression module did not pass marker verification."
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace("</body>", $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains("__UPC_V184_EXPRESSION__")) {
    Copy-Item $backup $app -Force
    throw "Install verification failed. The backup was restored automatically."
}

Write-Host ""
Write-Host "PASS  V18.1 Clean core present" -ForegroundColor Green
Write-Host "PASS  V18.2 Hair preserved" -ForegroundColor Green
Write-Host "PASS  V18.3 Makeup preserved" -ForegroundColor Green
Write-Host "PASS  Legacy global Create search engines absent" -ForegroundColor Green
Write-Host "PASS  V18.4 strict Expression expansion installed" -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Open the app with ?v=184expression and search Expression for:" -ForegroundColor Cyan
Write-Host "  smile"
Write-Host "  side-eye"
Write-Host "  caught off guard"
Write-Host "  head tilted"
Write-Host "  surprised"
Write-Host "  skeptical"
Write-Host ""
Write-Host "The Expression box will display the exact verified Expression keyword count after the CSV loads." -ForegroundColor Green
