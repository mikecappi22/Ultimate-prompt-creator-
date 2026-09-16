$ErrorActionPreference = 'Stop'
$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-integration-audit-health-v1817.js'
if (-not (Test-Path $app)) { throw "UPC index.html not found at $app" }
$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
if (-not ($html.Contains('__UPC_V181_CLEAN_DB__') -or $html.Contains('__UPC_V18_CLEAN__'))) { throw 'V18 clean core marker was not found.' }
if (-not $html.Contains('__UPC_V1816_CONSTRAINTS__')) { throw 'V18.16 Constraints is required before final integration audit.' }
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$goldDir=Join-Path $dir 'GoldenMasters'
New-Item -ItemType Directory -Path $goldDir -Force | Out-Null
$gold=Join-Path $goldDir ("index-v18.17-golden-master-$stamp.html")
$fixed=Join-Path $goldDir 'index-v18.17-golden-master.html'
Copy-Item $app $gold -Force
if (-not (Test-Path $fixed)) { Copy-Item $app $fixed -Force }
$hash=(Get-FileHash $gold -Algorithm SHA256).Hash
"Created: $stamp`r`nSHA256: $hash`r`nSource: $app" | Set-Content (Join-Path $goldDir ("index-v18.17-golden-master-$stamp.sha256.txt")) -Encoding UTF8
if (-not $html.Contains('__UPC_V1817_AUDIT__')) {
  $module=(Invoke-WebRequest $url -UseBasicParsing).Content
  if (-not $module.Contains('__UPC_V1817_AUDIT__')) { throw 'Downloaded V18.17 audit module failed marker verification.' }
  $html=$html.Replace('</body>',"<script>`r`n$module`r`n</script>`r`n</body>")
  [IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))
}
Write-Host ''
Write-Host 'PASS  Golden Master created' -ForegroundColor Green
Write-Host "      $gold" -ForegroundColor DarkGray
Write-Host "PASS  SHA256 $hash" -ForegroundColor Green
Write-Host 'PASS  V18.17 Audit + Health Panel installed' -ForegroundColor Green
