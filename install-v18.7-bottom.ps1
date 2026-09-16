$ErrorActionPreference = "Stop"

$dir = Join-Path $env:LOCALAPPDATA "UltimatePromptCreatorMobile"
$app = Join-Path $dir "index.html"
$url = "https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-category-bottom-v187.js"

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)

$required = @(
    "__UPC_V181_CLEAN_DB__",
    "__UPC_V182_HAIR__",
    "__UPC_V183_MAKEUP__",
    "__UPC_V184_EXPRESSION__",
    "__UPC_V185_NAILS__",
    "__UPC_V186_TOP__"
)
foreach ($marker in $required) {
    if (-not $html.Contains($marker)) {
        throw "Required prior module $marker is missing. Finish the earlier category before Clothing Bottom."
    }
}

if ($html.Contains("__UPC_V187_BOTTOM__")) {
    Write-Host "V18.7 Clothing Bottom Expansion is already installed." -ForegroundColor Yellow
    exit 0
}

$legacy = @("__UPC_LIVE_DB162__", "__UPC_CATALOG163__", "__UPC_CATEGORY174__")
foreach ($marker in $legacy) {
    if ($html.Contains($marker)) {
        throw "Legacy search marker $marker is still present. Stop here rather than mixing search engines."
    }
}

$backup = Join-Path $dir ("index-before-v18.7-bottom-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".html")
Copy-Item $app $backup -Force

Write-Host "Downloading strict Clothing Bottom category expansion..." -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content
if (-not $module.Contains("__UPC_V187_BOTTOM__")) {
    throw "Downloaded Clothing Bottom module did not pass marker verification."
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace("</body>", $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains("__UPC_V187_BOTTOM__")) {
    Copy-Item $backup $app -Force
    throw "Install verification failed. The backup was restored automatically."
}

Write-Host ""
Write-Host "PASS  V18.1 Clean core present" -ForegroundColor Green
Write-Host "PASS  Hair / Makeup / Expression / Nails / Top preserved" -ForegroundColor Green
Write-Host "PASS  Legacy global Create search engines absent" -ForegroundColor Green
Write-Host "PASS  V18.7 strict Clothing Bottom expansion installed" -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Open the app with ?v=187bottom and search Bottom for:" -ForegroundColor Cyan
Write-Host "  dolphin"
Write-Host "  3-inch"
Write-Host "  leggings"
Write-Host "  softball pants"
Write-Host "  low-rise jeans"
Write-Host "  glossy nylon"
Write-Host ""
Write-Host "The Bottom box will display the exact verified Bottom keyword count after loading." -ForegroundColor Green
