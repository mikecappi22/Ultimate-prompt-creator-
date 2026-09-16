$ErrorActionPreference = "Stop"

$dir = Join-Path $env:LOCALAPPDATA "UltimatePromptCreatorMobile"
$app = Join-Path $dir "index.html"
$url = "https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-category-pose-v1810.js"

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
    "__UPC_V186_TOP__",
    "__UPC_V187_BOTTOM__",
    "__UPC_V188_FOOTWEAR__",
    "__UPC_V189_ACCESSORIES__"
)
foreach ($marker in $required) {
    if (-not $html.Contains($marker)) {
        throw "Required prior module $marker is missing. Finish the earlier category before Pose / Action."
    }
}

if ($html.Contains("__UPC_V1810_POSE__")) {
    Write-Host "V18.10 Pose / Action Expansion is already installed." -ForegroundColor Yellow
    exit 0
}

$legacy = @("__UPC_LIVE_DB162__", "__UPC_CATALOG163__", "__UPC_CATEGORY174__")
foreach ($marker in $legacy) {
    if ($html.Contains($marker)) {
        throw "Legacy search marker $marker is still present. Stop here rather than mixing search engines."
    }
}

$backup = Join-Path $dir ("index-before-v18.10-pose-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".html")
Copy-Item $app $backup -Force

Write-Host "Downloading strict Pose / Action category expansion..." -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content
if (-not $module.Contains("__UPC_V1810_POSE__")) {
    throw "Downloaded Pose / Action module did not pass marker verification."
}

$injected = "<script>`r`n$module`r`n</script>`r`n</body>"
$html = $html.Replace("</body>", $injected)
[IO.File]::WriteAllText($app, $html, (New-Object System.Text.UTF8Encoding($false)))

$verify = [IO.File]::ReadAllText($app, [Text.Encoding]::UTF8)
if (-not $verify.Contains("__UPC_V1810_POSE__")) {
    Copy-Item $backup $app -Force
    throw "Install verification failed. The backup was restored automatically."
}

Write-Host ""
Write-Host "PASS  V18.1 Clean core present" -ForegroundColor Green
Write-Host "PASS  Hair / Makeup / Expression / Nails preserved" -ForegroundColor Green
Write-Host "PASS  Top / Bottom / Footwear / Accessories preserved" -ForegroundColor Green
Write-Host "PASS  Legacy global Create search engines absent" -ForegroundColor Green
Write-Host "PASS  V18.10 strict Pose / Action expansion installed" -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Open the app with ?v=1810pose and search Pose / Action for:" -ForegroundColor Cyan
Write-Host "  over-the-shoulder"
Write-Host "  walking"
Write-Host "  biceps curl"
Write-Host "  pushing stalled car"
Write-Host "  arm-wrestling"
Write-Host "  salsa"
Write-Host "  seated"
Write-Host ""
Write-Host "The Pose / Action box will display the exact verified keyword count after loading." -ForegroundColor Green
