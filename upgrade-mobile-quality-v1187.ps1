$ErrorActionPreference='Stop'

function Is-Admin {
  $id=[Security.Principal.WindowsIdentity]::GetCurrent()
  $p=New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
if(-not (Is-Admin)){
  Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoExit -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  exit
}

$log="$env:TEMP\UltimatePromptCreator-V1187-Upgrade.log"
Start-Transcript -Path $log -Force | Out-Null

function Find-Exe([string]$cmd,[string[]]$candidates){
  $g=Get-Command $cmd -ErrorAction SilentlyContinue
  if($g){return $g.Source}
  return ($candidates|Where-Object{Test-Path $_}|Select-Object -First 1)
}
function Post-Json([string]$url,$obj,[int]$timeout=240){
  $body=$obj|ConvertTo-Json -Depth 60 -Compress
  try{return Invoke-RestMethod $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec $timeout}
  catch{
    $detail=$_.Exception.Message
    try{if($_.ErrorDetails.Message){$detail="$detail | Server: $($_.ErrorDetails.Message)"}}catch{}
    throw "POST $url failed: $detail"
  }
}
function Parse-JsonText([string]$text){
  $s=[string]$text;$a=$s.IndexOf('{');$b=$s.LastIndexOf('}')
  if($a -ge 0 -and $b -gt $a){$s=$s.Substring($a,$b-$a+1)}
  return $s|ConvertFrom-Json
}

try{
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V11.8.7 Quality Director Upgrade ===' -ForegroundColor Cyan
  Write-Host 'Transport stays on the proven V11.8.6 StreamContent bridge. This upgrade fixes scoring, placeholders, and thin prompts.' -ForegroundColor White
  Write-Host ''

  $repoRaw='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $appFile=Join-Path $appDir 'index.html'
  $baseFile=Join-Path $appDir 'base-v118.html'
  $p84f=Join-Path $appDir 'mobile-selfheal-v1184.js'
  $p85f=Join-Path $appDir 'mobile-v1185-hotfix.js'
  $p86f=Join-Path $appDir 'mobile-v1186-hotfix.js'
  $p87f=Join-Path $appDir 'mobile-v1187-quality.js'
  $bridgeFile=Join-Path $appDir 'private-mobile-proxy-v1186.ps1'
  $port=8765

  $tailscale=Find-Exe 'tailscale' @("$env:ProgramFiles\Tailscale\tailscale.exe","$env:LOCALAPPDATA\Tailscale\tailscale.exe")
  if(-not $tailscale){throw 'Could not locate tailscale.exe.'}
  $ts=& $tailscale status --json|ConvertFrom-Json
  $dns=([string]$ts.Self.DNSName).TrimEnd('.')
  if(-not $dns){throw 'Could not determine the Tailscale MagicDNS hostname.'}
  $origin="https://$dns"
  Write-Host "Private URL: $origin/" -ForegroundColor Green

  Write-Host 'Step 1/5 - Downloading V11.8.7 quality engine...' -ForegroundColor White
  Invoke-WebRequest "$repoRaw/mobile-private-v118.html" -OutFile $baseFile -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-selfheal-v1184.js" -OutFile $p84f -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-v1185-hotfix.js" -OutFile $p85f -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-v1186-hotfix.js" -OutFile $p86f -UseBasicParsing
  Invoke-WebRequest "$repoRaw/mobile-v1187-quality.js" -OutFile $p87f -UseBasicParsing
  Invoke-WebRequest "$repoRaw/private-mobile-proxy-v1186.ps1" -OutFile $bridgeFile -UseBasicParsing

  $base=[IO.File]::ReadAllText($baseFile)
  $base=$base.Replace('Ultimate Prompt Creator V11.8 Private Mobile','Ultimate Prompt Creator V11.8.7 Quality Director').Replace('V11.8 PRIVATE MOBILE','V11.8.7 QUALITY DIRECTOR')
  $scripts=@($p84f,$p85f,$p86f,$p87f)|ForEach-Object{"<script>`r`n$([IO.File]::ReadAllText($_))`r`n</script>"}
  $combined=$base.Replace('</body>',(($scripts -join "`r`n")+"`r`n</body>"))
  [IO.File]::WriteAllText($appFile,$combined,[Text.Encoding]::UTF8)
  Write-Host 'V11.8.7 app assembled.' -ForegroundColor Green

  Write-Host 'Step 2/5 - Restarting proven V11.8.6 StreamContent bridge with new app...' -ForegroundColor White
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object{$_.CommandLine -like '*private-mobile-proxy-v118*.ps1*'} |
    ForEach-Object{try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}}
  Start-Sleep 2
  $args="-NoProfile -ExecutionPolicy Bypass -File `"$bridgeFile`" -AppFile `"$appFile`" -Port $port"
  Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden
  $ready=$false
  for($i=0;$i -lt 30;$i++){
    try{$info=Invoke-RestMethod "http://127.0.0.1:$port/bridge-info" -TimeoutSec 2;if($info.version -eq 'V11.8.6' -and $info.transport -eq 'StreamContent'){$ready=$true;break}}catch{}
    Start-Sleep 1
  }
  if(-not $ready){throw 'V11.8.6 StreamContent bridge did not start.'}
  Write-Host 'StreamContent bridge READY.' -ForegroundColor Green

  Write-Host 'Step 3/5 - Re-pointing private Tailscale root to the known-good bridge...' -ForegroundColor White
  & $tailscale serve reset|Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port"|Out-Host
  $tags=Invoke-RestMethod "$origin/ollama/api/tags" -TimeoutSec 30
  $names=@($tags.models|ForEach-Object{$_.name})
  if($names -notcontains 'qwen3:1.7b'){throw 'qwen3:1.7b is not available through the private bridge.'}
  Write-Host 'Private model check PASS.' -ForegroundColor Green

  Write-Host 'Step 4/5 - Running V11.8.7 schema-quality probe through the exact private HTTPS path...' -ForegroundColor White
  $keys=@('overall','clarity','subject','wardrobe','pose_anatomy','camera','composition','lighting','material_realism','environment','fascination')
  $scoreProps=@{};foreach($k in $keys){$scoreProps[$k]=@{type='integer';minimum=1;maximum=100}}
  $schema=@{
    type='object';additionalProperties=$false;required=@('scores','creative_direction','keywords','final_prompt');
    properties=@{
      scores=@{type='object';additionalProperties=$false;required=$keys;properties=$scoreProps};
      creative_direction=@{type='string'};
      keywords=@{type='array';minItems=8;maxItems=14;items=@{type='object';additionalProperties=$false;required=@('keyword','prompt_phrase');properties=@{keyword=@{type='string'};prompt_phrase=@{type='string'}}}};
      final_prompt=@{type='string'}
    }
  }
  $probe='RAW IDEA: athletic tall platinum blonde woman wearing lime green dolphin shorts. Return JSON only. Score the raw idea with every required score 1-100. Produce 8-14 concrete non-placeholder visual keywords and prompt phrases. Never use the words short label, label, test, example, placeholder, or prompt-ready phrase. Write a specific 3-5 sentence creative direction and a detailed final image prompt with subject, wardrobe material, pose, environment, camera, composition, lighting, texture and realism.'
  $r=Post-Json "$origin/ollama/api/chat" @{
    model='qwen3:1.7b';messages=@(@{role='user';content=$probe});stream=$false;think=$false;format=$schema;keep_alive='10m';
    options=@{num_predict=1800;num_ctx=4096;temperature=.3}
  } 240
  $o=Parse-JsonText ([string]$r.message.content)
  foreach($k in $keys){$n=[int]$o.scores.$k;if($n -lt 1 -or $n -gt 100){throw "Quality probe invalid score $k=$n"}}
  $kw=@($o.keywords);if($kw.Count -lt 8){throw "Quality probe returned only $($kw.Count) keywords."}
  $bad=@($kw|Where-Object{([string]$_.keyword) -match '^(short label|label|test|keyword|example|placeholder)$'})
  if($bad.Count){throw 'Quality probe copied a placeholder keyword.'}
  if(([string]$o.final_prompt).Length -lt 450){Write-Host 'Quality probe final prompt was shorter than ideal; browser auto-repair will handle short production results.' -ForegroundColor Yellow}
  Write-Host 'Schema-quality probe PASS.' -ForegroundColor Green

  Write-Host 'Step 5/5 - Ready.' -ForegroundColor White
  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'V11.8.7 QUALITY DIRECTOR IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host "Open: $origin/?v=1187" -ForegroundColor Cyan
  Write-Host 'Turbo uses qwen3:1.7b. Bad schema output is validated and auto-repaired once.' -ForegroundColor White
  Start-Process "$origin/?v=1187"
}
catch{
  Write-Host ''
  Write-Host 'V11.8.7 UPGRADE STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
}
finally{
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
