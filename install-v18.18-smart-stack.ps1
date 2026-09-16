$ErrorActionPreference = 'Stop'
$dir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile';$app=Join-Path $dir 'index.html'
$url='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/v18-smart-stack-builder-v1818.js'
if(-not(Test-Path $app)){throw "UPC index.html not found at $app"}
$html=[IO.File]::ReadAllText($app,[Text.Encoding]::UTF8)
if(-not $html.Contains('__UPC_V1817_AUDIT__')){throw 'Install V18.17 Audit first.'}
if($html.Contains('__UPC_V1818_STACK__')){Write-Host 'V18.18 already installed.' -ForegroundColor Yellow;exit 0}
$backup=Join-Path $dir ('index-before-v18.18-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.html');Copy-Item $app $backup -Force
$module=(Invoke-WebRequest $url -UseBasicParsing).Content
if(-not $module.Contains('__UPC_V1818_STACK__')){throw 'Downloaded V18.18 module failed marker verification.'}
$html=$html.Replace('</body>',"<script>`r`n$module`r`n</script>`r`n</body>");[IO.File]::WriteAllText($app,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'PASS  V18.18 Smart Prompt Stack Builder installed' -ForegroundColor Green
