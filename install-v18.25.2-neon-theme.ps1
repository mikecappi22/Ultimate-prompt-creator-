$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
$app = Join-Path $dir 'index.html'
$assetDir = Join-Path $dir 'assets'
$asset = Join-Path $assetDir 'neon-portal-bg-v18252.svg'
$url = 'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-neon-portal-theme-v18252.js'

if (-not (Test-Path $app)) {
    throw "Ultimate Prompt Creator index.html was not found at $app"
}

$html = [IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
if (-not ($html.Contains('__UPC_V1825_RELEASE_LOCK__') -or $html.Contains('__UPC_V18251_AUDIT_FEEDBACK__'))) {
    throw 'V18.25 Production Release Lock was not found. Install V18.25 first.'
}

if ($html.Contains('__UPC_V18252_NEON_THEME__')) {
    Write-Host 'V18.25.2 Neon Portal Theme is already installed.' -ForegroundColor Yellow
    Write-Host "Background asset: $asset" -ForegroundColor DarkGray
    exit 0
}

$backup = Join-Path $dir ('index-before-v18.25.2-neon-theme-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.html')
Copy-Item $app $backup -Force
New-Item -ItemType Directory -Path $assetDir -Force | Out-Null

$svg = @'
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
<defs>
 <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020817"/><stop offset=".58" stop-color="#031126"/><stop offset="1" stop-color="#01040c"/></linearGradient>
 <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07172b"/><stop offset="1" stop-color="#01040a"/></linearGradient>
 <radialGradient id="center"><stop offset="0" stop-color="#07152b" stop-opacity=".72"/><stop offset=".62" stop-color="#020817" stop-opacity=".92"/><stop offset="1" stop-color="#00030a"/></radialGradient>
 <linearGradient id="cyanMag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#16d9ff"/><stop offset=".47" stop-color="#2d7dff"/><stop offset=".66" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ff4bfa"/></linearGradient>
 <filter id="glowC" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <filter id="glowS" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <filter id="fog"><feGaussianBlur stdDeviation="24"/></filter>
 <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#127cf3" stroke-opacity=".14" stroke-width="1"/></pattern>
</defs>
<rect width="1600" height="900" fill="url(#bg)"/>
<rect x="230" y="70" width="1140" height="650" rx="420" fill="url(#center)"/>
<!-- giant portal architecture -->
<g fill="none" stroke-linecap="round">
 <ellipse cx="800" cy="454" rx="690" ry="570" stroke="#071327" stroke-width="120"/>
 <ellipse cx="800" cy="454" rx="662" ry="548" stroke="#111a32" stroke-width="52"/>
 <ellipse cx="800" cy="454" rx="637" ry="526" stroke="url(#cyanMag)" stroke-width="15" filter="url(#glowC)" opacity=".98"/>
 <ellipse cx="800" cy="454" rx="606" ry="500" stroke="#28c8ff" stroke-width="7" filter="url(#glowS)" opacity=".92"/>
 <ellipse cx="800" cy="454" rx="576" ry="476" stroke="#1667ff" stroke-width="4" opacity=".8"/>
 <ellipse cx="800" cy="454" rx="548" ry="452" stroke="#46dcff" stroke-width="2" opacity=".5"/>
 <ellipse cx="800" cy="454" rx="704" ry="583" stroke="#ff43f3" stroke-width="4" filter="url(#glowS)" opacity=".52"/>
</g>
<!-- segmented metallic side structures -->
<g fill="#07101f" stroke="#14325c" stroke-width="2" opacity=".98">
 <path d="M0 108 L145 155 198 291 164 418 65 485 0 476Z"/>
 <path d="M0 540 L105 511 194 575 219 698 133 780 0 803Z"/>
 <path d="M1600 108 L1455 155 1402 291 1436 418 1535 485 1600 476Z"/>
 <path d="M1600 540 L1495 511 1406 575 1381 698 1467 780 1600 803Z"/>
</g>
<!-- tech seams -->
<g fill="none" stroke="#2fcfff" stroke-width="3" opacity=".8" filter="url(#glowS)">
 <path d="M58 178L132 205 156 273"/><path d="M66 648L133 625 167 669"/><path d="M1542 178L1468 205 1444 273"/><path d="M1534 648L1467 625 1433 669"/>
</g>
<g fill="none" stroke="#ff46f4" stroke-width="3" opacity=".72" filter="url(#glowS)">
 <path d="M31 333L82 347 105 402"/><path d="M1569 333L1518 347 1495 402"/>
</g>
<!-- floor -->
<path d="M0 646 Q800 606 1600 646 L1600 900H0Z" fill="url(#floor)"/>
<path d="M0 646 Q800 608 1600 646" fill="none" stroke="url(#cyanMag)" stroke-width="5" filter="url(#glowS)" opacity=".92"/>
<path d="M0 900V646 Q800 608 1600 646V900" fill="url(#grid)" opacity=".9"/>
<!-- stage rings -->
<g fill="none" transform="translate(800 735)">
 <ellipse rx="620" ry="122" stroke="#1f71ff" stroke-opacity=".22" stroke-width="2"/>
 <ellipse rx="510" ry="94" stroke="url(#cyanMag)" stroke-width="4" filter="url(#glowS)" opacity=".76"/>
 <ellipse rx="378" ry="65" stroke="#2fdcff" stroke-width="2" opacity=".6"/>
 <ellipse rx="245" ry="38" stroke="#1d56a8" stroke-width="2" opacity=".55"/>
</g>
<!-- neon reflections -->
<g opacity=".2" filter="url(#fog)">
 <path d="M114 661L330 900" stroke="#0ccfff" stroke-width="34"/><path d="M1486 661L1270 900" stroke="#ff42f0" stroke-width="34"/>
</g>
<!-- fog -->
<g filter="url(#fog)" opacity=".34">
 <ellipse cx="230" cy="642" rx="260" ry="70" fill="#19cfff"/><ellipse cx="1370" cy="642" rx="260" ry="70" fill="#ff43f0"/>
</g>
<!-- micro tech lights -->
<g fill="#5eeaff" opacity=".82">
 <rect x="116" y="118" width="8" height="36" rx="4"/><rect x="132" y="106" width="8" height="54" rx="4"/><rect x="150" y="126" width="8" height="28" rx="4"/>
</g>
<g fill="#ff60f6" opacity=".82">
 <rect x="1442" y="118" width="8" height="36" rx="4"/><rect x="1460" y="106" width="8" height="54" rx="4"/><rect x="1478" y="126" width="8" height="28" rx="4"/>
</g>
<!-- dark central usability veil -->
<rect x="310" y="150" width="980" height="470" rx="160" fill="#020817" opacity=".19"/>
</svg>
'@
[IO.File]::WriteAllText($asset,$svg,(New-Object System.Text.UTF8Encoding($false)))
if (-not (Test-Path $asset) -or (Get-Item $asset).Length -lt 4000) {
    Copy-Item $backup $app -Force
    throw 'Neon background asset creation failed.'
}

Write-Host 'Downloading V18.25.2 Neon Portal Theme...' -ForegroundColor Cyan
$module = (Invoke-WebRequest $url -UseBasicParsing).Content
if (-not $module.Contains('__UPC_V18252_NEON_THEME__')) {
    Copy-Item $backup $app -Force
    throw 'Downloaded V18.25.2 theme module failed marker verification.'
}

$html = $html.Replace('</body>',"<script>`r`n$module`r`n</script>`r`n</body>")
[IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))
$verify=[IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
if(-not $verify.Contains('__UPC_V18252_NEON_THEME__')){
    Copy-Item $backup $app -Force
    throw 'Theme install verification failed. Backup restored.'
}

Write-Host ''
Write-Host 'PASS  V18.25 production baseline found' -ForegroundColor Green
Write-Host 'PASS  Neon portal background asset created locally' -ForegroundColor Green
Write-Host 'PASS  V18.25.2 Neon Portal Theme installed' -ForegroundColor Green
Write-Host "Background: $asset" -ForegroundColor DarkGray
Write-Host "Backup:     $backup" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Open UPC with ?v=18252neon' -ForegroundColor Cyan
Write-Host 'The neon portal theme is ON by default. Use the NEON THEME button to toggle it.' -ForegroundColor Cyan
