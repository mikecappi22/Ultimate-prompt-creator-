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

$log="$env:TEMP\UltimatePromptCreator-V1195-QUALITY.log"
Start-Transcript -Path $log -Force | Out-Null

function Find-Exe([string]$cmd,[string[]]$candidates){
  $g=Get-Command $cmd -ErrorAction SilentlyContinue
  if($g){return $g.Source}
  return ($candidates|Where-Object{Test-Path $_}|Select-Object -First 1)
}
function Replace-One([string]$text,[string]$pattern,[string]$replacement,[string]$name){
  $rx=New-Object System.Text.RegularExpressions.Regex($pattern,[System.Text.RegularExpressions.RegexOptions]::Singleline)
  $m=$rx.Matches($text)
  if($m.Count -ne 1){throw "Patch '$name' expected 1 match but found $($m.Count)."}
  return $rx.Replace($text,$replacement,1)
}

try {
  Write-Host ''
  Write-Host '=== Ultimate Prompt Creator V11.9.5 Smart Quality Upgrade ===' -ForegroundColor Cyan
  Write-Host 'Turbo now prioritizes useful detail: Qwen VL 2B at 384px + evidence quality gate + structuring repair.' -ForegroundColor White
  Write-Host ''

  $repo='https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main'
  $appDir=Join-Path $env:LOCALAPPDATA 'UltimatePromptCreatorMobile'
  New-Item -ItemType Directory -Force -Path $appDir | Out-Null
  $shell=Join-Path $appDir 'mobile-v1195-shell.html'
  $baseJs=Join-Path $appDir 'mobile-v1194-fast-cpu.base.js'
  $patchedJs=Join-Path $appDir 'mobile-v1195-smart-quality.js'
  $app=Join-Path $appDir 'index.html'
  $bridge=Join-Path $appDir 'private-mobile-proxy-v1186.ps1'
  $port=8765

  $tailscale=Find-Exe 'tailscale' @(
    "$env:ProgramFiles\Tailscale\tailscale.exe",
    "$env:LOCALAPPDATA\Tailscale\tailscale.exe"
  )
  if(-not $tailscale){throw 'Could not locate tailscale.exe.'}

  $ts=& $tailscale status --json | ConvertFrom-Json
  $dns=([string]$ts.Self.DNSName).TrimEnd('.')
  if(-not $dns){throw 'Could not determine Tailscale hostname.'}
  $origin="https://$dns"
  Write-Host "Private URL: $origin/" -ForegroundColor Green

  Write-Host 'Step 1/5 - Downloading clean V11.9.4 base...' -ForegroundColor White
  Invoke-WebRequest "$repo/mobile-v1193-shell.html" -OutFile $shell -UseBasicParsing
  Invoke-WebRequest "$repo/mobile-v1194-fast-cpu.js" -OutFile $baseJs -UseBasicParsing
  Invoke-WebRequest "$repo/private-mobile-proxy-v1186.ps1" -OutFile $bridge -UseBasicParsing
  $html=[IO.File]::ReadAllText($shell)
  $code=[IO.File]::ReadAllText($baseJs)

  Write-Host 'Step 2/5 - Applying Smart Quality engine...' -ForegroundColor White

  $newPerf=@'
const PERF={
  turbo:{px:384,q:.72,vTok:620,vCtx:2048,sTok:1500,sCtx:3072},
  balanced:{px:512,q:.78,vTok:900,vCtx:2560,sTok:1900,sCtx:3584},
  extreme:{px:640,q:.82,vTok:1300,vCtx:3584,sTok:2500,sCtx:4608}
};
'@
  $code=Replace-One $code 'const PERF=\{.*?\};\r?\n' $newPerf 'performance settings'

  $newModel=@'
function modelForPerf(perf){const v=models.filter(isVision);if(perf==='turbo')return qwen2Vision()||v.find(m=>/moondream/i.test(m))||v[0]||'';if(perf==='balanced')return qwen2Vision()||v.find(m=>/qwen3-vl.*4b/i.test(m))||v[0]||'';return v.find(m=>/qwen3-vl:4b-instruct/i.test(m))||v.find(m=>/qwen3-vl.*4b/i.test(m))||qwen2Vision()||v[0]||''}
function fillModels
'@
  $code=Replace-One $code 'function modelForPerf\(perf\)\{.*?\}\r?\nfunction fillModels' $newModel 'Turbo model routing'

  $newEvidence=@'
function evidencePrompt(perf){const goal=$('vGoal').value.trim();if(perf==='turbo')return `${goal}\n\nPLAIN TEXT ONLY. Produce a detailed evidence report for image reconstruction. Write a separate labeled line for every category that is clearly visible: SUBJECT, FACE, EYES, SKIN, HAIR, MAKEUP, BODY/PROPORTIONS, WARDROBE, FABRIC/MATERIAL, ACCESSORIES, POSE/GAZE, HANDS/NAILS, CAMERA/FRAMING, DEPTH/FOCUS, COMPOSITION, LIGHTING/SHADOWS, BACKGROUND/ENVIRONMENT, COLORS, REALISM/IMPERFECTIONS. Aim for 12-18 factual lines. If a category cannot be seen, omit it. Do not identify the person. Do not infer hidden details.`;return `${goal}\n\nPLAIN TEXT ONLY. Produce a forensic visual evidence report with separate labeled lines for SUBJECT, FACE, EYES, BROWS, NOSE, LIPS, SKIN, HAIR, MAKEUP, BODY/PROPORTIONS, WARDROBE, FABRIC/MATERIAL, ACCESSORIES, POSE/GAZE, HANDS/NAILS, CAMERA/FRAMING, DEPTH/FOCUS, COMPOSITION, LIGHTING/SHADOWS, BACKGROUND/ENVIRONMENT, COLORS, OBJECTS/TEXT, REALISM/IMPERFECTIONS. Use only visible evidence; mark uncertain claims [ESTIMATED].`}
function usefulText(j,kind){if(kind==='generate')return String(j?.response||j?.thinking||'').trim();return String(j?.message?.content||j?.message?.thinking||'').trim()}
function evidenceStats(text){const t=String(text||'').trim();const words=t.split(/\s+/).filter(Boolean).length;const lines=t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).length;const labels=['subject','face','eyes','skin','hair','makeup','body','wardrobe','clothing','fabric','material','pose','gaze','camera','framing','focus','composition','lighting','shadow','background','environment','color','texture','realism'];const cats=labels.filter(x=>new RegExp('\\b'+x+'\\b','i').test(t)).length;return {chars:t.length,words,lines,categories:cats}}
function evidenceComplete(text){const s=evidenceStats(text);return s.chars>=280&&s.words>=45&&s.categories>=6}
function qualityRetryPrompt(){return `PLAIN TEXT ONLY. The previous image description was too shallow. Inspect the image again and write a reconstruction-grade evidence report with 12-18 separate labeled factual lines. Cover as many visibly supported categories as possible: SUBJECT, FACE, EYES, SKIN, HAIR, MAKEUP, BODY/PROPORTIONS, WARDROBE, FABRIC/MATERIAL, ACCESSORIES, POSE/GAZE, HANDS/NAILS, CAMERA/FRAMING, DEPTH/FOCUS, COMPOSITION, LIGHTING/SHADOWS, BACKGROUND/ENVIRONMENT, COLORS, REALISM/IMPERFECTIONS. Describe specific visible colors, shapes, textures, angles, expression, hairstyle, garment construction and lighting. Omit anything not visible. Do not identify the person or invent hidden details.`}
'@
  $code=Replace-One $code 'function evidencePrompt\(perf\)\{.*?\}\r?\nfunction usefulText\(j,kind\)\{.*?\}\r?\n' $newEvidence 'evidence quality gate'

  $newQwen=@'
async function qwenVisionFallback(b64,prompt,perf,signal,reason=''){const q=qwen2Vision();if(!q)throw new Error('Qwen VL 2B quality model is not installed.');const p=PERF[perf];const run=async(content,tok)=>{const j=await api('/chat',{model:q,messages:[{role:'user',content,images:[b64]}],stream:false,think:false,keep_alive:'10m',options:{temperature:0,num_predict:tok,num_ctx:Math.max(2048,p.vCtx)}},signal,3);return usefulText(j,'chat')};let text=await run(prompt,Math.max(520,p.vTok));let retried=false;if(!evidenceComplete(text)){retried=true;text=await run(qualityRetryPrompt(),Math.max(700,p.vTok))}const st=evidenceStats(text);if(st.chars<160||st.words<28)throw new Error('Qwen VL 2B could not produce enough visual evidence after retry.');return {text,path:'Qwen VL 2B quality'+(retried?' retry':'')+(reason?' · '+reason:'')+` · ${st.categories} categories`} }
async function visionText(model,b64,prompt,perf,signal){const p=PERF[perf];if(/moondream/i.test(model)){
  const errs=[];
  try{const g=await api('/generate',{model,prompt,images:[b64],stream:false,keep_alive:'10m',options:{temperature:0,num_predict:p.vTok,num_ctx:p.vCtx}},signal,3);const text=usefulText(g,'generate');if(evidenceComplete(text)){const st=evidenceStats(text);return {text,path:`Moondream detailed · ${st.categories} categories`}}if(text.length>=40)return await qwenVisionFallback(b64,prompt,perf,signal,'Moondream evidence rejected as too sparse');errs.push('generate returned empty')}catch(e){if(e.name==='AbortError')throw e;errs.push('generate: '+e.message)}
  try{const c=await api('/chat',{model,messages:[{role:'user',content:prompt,images:[b64]}],stream:false,keep_alive:'10m',options:{temperature:0,num_predict:p.vTok,num_ctx:p.vCtx}},signal,2);const text=usefulText(c,'chat');if(evidenceComplete(text)){const st=evidenceStats(text);return {text,path:`Moondream chat detailed · ${st.categories} categories`}}if(text.length>=40)return await qwenVisionFallback(b64,prompt,perf,signal,'Moondream chat evidence rejected as too sparse');errs.push('chat returned empty')}catch(e){if(e.name==='AbortError')throw e;errs.push('chat: '+e.message)}
  return await qwenVisionFallback(b64,prompt,perf,signal,'Moondream unavailable: '+errs.join('; '));
 }
 const j=await api('/chat',{model,messages:[{role:'user',content:prompt,images:[b64]}],stream:false,think:false,keep_alive:'10m',options:{temperature:0,num_predict:p.vTok,num_ctx:p.vCtx}},signal,3);let text=usefulText(j,'chat');let retried=false;if(!evidenceComplete(text)){retried=true;const r=await api('/chat',{model,messages:[{role:'user',content:qualityRetryPrompt(),images:[b64]}],stream:false,think:false,keep_alive:'10m',options:{temperature:0,num_predict:Math.max(700,p.vTok),num_ctx:Math.max(2048,p.vCtx)}},signal,3);text=usefulText(r,'chat')}const st=evidenceStats(text);if(st.chars<160||st.words<28)throw new Error(model+' returned insufficient visual evidence after quality retry.');return {text,path:model+(retried?' quality retry':'')+` · ${st.categories} categories`}
}
function structurePrompt
'@
  $code=Replace-One $code 'async function qwenVisionFallback\(b64,prompt,perf,signal\).*?\r?\nfunction structurePrompt' $newQwen 'vision quality routing'

  $newStructure=@'
function validStructured(o){if(!o||!Array.isArray(o.sections)||String(o.image_summary||'').length<20)return false;const items=o.sections.reduce((n,s)=>n+(Array.isArray(s.items)?s.items.length:0),0);return o.sections.length>=3&&items>=6}
function fallbackStructured(evidence,note=''){const lines=String(evidence||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const sections=[];let current=null;const add=(section,fact)=>{let s=sections.find(x=>x.section===section);if(!s){s={section,items:[]};sections.push(s)}if(fact&&fact.length>3)s.items.push({keyword:fact.split(/[,.;:]/)[0].replace(/^[-•*]\s*/,'').slice(0,55),description:fact,confidence:/\[ESTIMATED\]/i.test(fact)?'ESTIMATED':'CLEARLY_VISIBLE',evidence:fact,prompt_phrase:fact.replace(/\[ESTIMATED\]/ig,'').trim()})};for(const line of lines){const labeled=line.match(/^[-•*]?\s*([A-Z][A-Z /&_-]{2,28})\s*:\s*(.+)$/);if(labeled){current=labeled[1].replaceAll('_',' ').trim();add(current,labeled[2].trim());continue}const heading=line.replace(/^[-•*#\s]+/,'').replace(/:$/,'').trim();if(heading.length<35&&/^[A-Z][A-Z /&_-]{2,}$/.test(heading)){current=heading.replaceAll('_',' ');continue}const facts=line.replace(/^[-•*]\s*/,'').split(/(?<=[.!?])\s+/).filter(Boolean);for(const fact of facts)add(current||'Visual Evidence',fact)}const use=sections.filter(s=>s.items.length).slice(0,20);const all=use.flatMap(s=>s.items);return {image_summary:all.slice(0,4).map(x=>x.description).join(' '),reconstruction_summary:(note?note+' ':'')+'Reconstruction assembled from the detailed visual evidence report.',sections:use.length?use:[{section:'Visual Evidence',items:[{keyword:'reference image',description:evidence,confidence:'CLEARLY_VISIBLE',evidence,prompt_phrase:evidence}]}]}}
async function structurePass(evidence,perf,signal){const model=textModel();if(!model)return fallbackStructured(evidence,'Text model unavailable.');const p=PERF[perf];let firstError='';try{const j=await api('/chat',{model,messages:[{role:'user',content:structurePrompt(evidence)}],stream:false,think:false,format:'json',keep_alive:'10m',options:{temperature:.04,num_predict:p.sTok,num_ctx:p.sCtx}},signal,3),o=cleanJSON(j.message?.content||'');if(validStructured(o))return o;firstError='first structure was incomplete'}catch(e){if(e.name==='AbortError')throw e;firstError=e.message}try{const repair=`Return ONLY complete JSON with keys image_summary, reconstruction_summary, sections. Create at least 4 sections and 8-18 total items from the supplied evidence. Each item must contain keyword, description, confidence, evidence, prompt_phrase. Confidence is CLEARLY_VISIBLE, HIGHLY_PROBABLE, ESTIMATED, or CANNOT_VERIFY. Do not add facts absent from the evidence. VISUAL EVIDENCE:\n${evidence}`;const j=await api('/chat',{model,messages:[{role:'user',content:repair}],stream:false,think:false,format:'json',keep_alive:'10m',options:{temperature:0,num_predict:Math.max(1700,p.sTok),num_ctx:Math.max(3072,p.sCtx)}},signal,3),o=cleanJSON(j.message?.content||'');if(validStructured(o)){o.reconstruction_summary=(o.reconstruction_summary||'')+' Structured on repair pass.';return o}}catch(e){if(e.name==='AbortError')throw e;firstError+='; repair: '+e.message}return fallbackStructured(evidence,'Local evidence parser used after two structuring attempts ('+firstError+').')}
function rebuildVision
'@
  $code=Replace-One $code 'function validStructured\(o\).*?\r?\nfunction rebuildVision' $newStructure 'structuring repair and fallback parser'

  $code=$code.Replace("document.title='Ultimate Prompt Creator V11.9.4 Fast CPU';","document.title='Ultimate Prompt Creator V11.9.5 Smart Quality';")
  $code=$code.Replace("badge.textContent='V11.9.4 FAST CPU'","badge.textContent='V11.9.5 SMART QUALITY'")
  $code=$code.Replace("Turbo is CPU-first: 384px Moondream /api/generate first, then chat, then automatic Qwen VL 2B fallback. qwen3:1.7b structures the result.","Turbo Smart Quality uses Qwen VL 2B at 384px, rejects shallow evidence, retries weak analysis once, and repairs structuring before any local fallback.")
  $code=$code.Replace("$('vRun').textContent='Run Fast CPU Analysis';","$('vRun').textContent='Run Smart Quality Analysis';")
  $code=$code.Replace("$('selftest').textContent='Run Fast CPU Test';","$('selftest').textContent='Run Smart Quality Test';")
  $code=$code.Replace("Turbo adapter ready: Moondream generate → chat → Qwen 2B fallback.","Turbo Smart Quality ready: Qwen VL 2B 384px + evidence quality gate + repair.")
  $code=$code.Replace("Moondream missing; Turbo will use Qwen VL 2B.","Turbo Smart Quality will use Qwen VL 2B.")
  $code=$code.Replace("Turbo: 384px Moondream generate → chat → Qwen 2B fallback. Fastest CPU path.","Turbo Smart Quality: Qwen VL 2B at 384px with detail gate and automatic retry.")

  if(-not $code.Contains('function evidenceComplete')){throw 'Smart Quality evidence gate was not injected.'}
  if(-not $code.Contains('Structured on repair pass')){throw 'Structuring repair was not injected.'}
  if(-not $code.Contains('Qwen VL 2B quality')){throw 'Qwen quality routing was not injected.'}
  [IO.File]::WriteAllText($patchedJs,$code,[Text.Encoding]::UTF8)

  $html=$html.Replace('V11.9.3 CPU Edition','V11.9.5 Smart Quality')
  $html=$html.Replace('V11.9.3 CPU EDITION','V11.9.5 SMART QUALITY')
  $html=$html.Replace('⚡ Turbo — Moondream','⚡ Turbo — Smart Quality')
  if(-not $html.Contains('<!-- UPC_APP_SCRIPT -->')){throw 'App shell injection marker missing.'}
  $html=$html.Replace('<!-- UPC_APP_SCRIPT -->',"<script>`r`n$code`r`n</script>")
  [IO.File]::WriteAllText($app,$html,[Text.Encoding]::UTF8)
  Write-Host 'V11.9.5 Smart Quality page built.' -ForegroundColor Green

  Write-Host 'Step 3/5 - Restarting private bridge...' -ForegroundColor White
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object{$_.CommandLine -like '*private-mobile-proxy-v118*.ps1*'} |
    ForEach-Object{try{Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue}catch{}}
  Start-Sleep 2
  $args="-NoProfile -ExecutionPolicy Bypass -File `"$bridge`" -AppFile `"$app`" -Port $port"
  Start-Process powershell.exe -ArgumentList $args -WindowStyle Hidden
  $ready=$false
  for($i=0;$i -lt 30;$i++){
    try{$info=Invoke-RestMethod "http://127.0.0.1:$port/bridge-info" -TimeoutSec 2;if($info.version -eq 'V11.8.6'){$ready=$true;break}}catch{}
    Start-Sleep 1
  }
  if(-not $ready){throw 'StreamContent bridge did not start.'}
  & $tailscale serve reset | Out-Null
  & $tailscale serve --bg "http://127.0.0.1:$port" | Out-Host
  Write-Host 'Private bridge ready.' -ForegroundColor Green

  Write-Host 'Step 4/5 - Clearing old Vision model RAM...' -ForegroundColor White
  $ollama=Find-Exe 'ollama' @("$env:LOCALAPPDATA\Programs\Ollama\ollama.exe","$env:LOCALAPPDATA\Ollama\ollama.exe","$env:ProgramFiles\Ollama\ollama.exe")
  if($ollama){foreach($m in @('moondream:latest','moondream','qwen3-vl:4b-instruct')){try{& $ollama stop $m | Out-Null}catch{}}}
  Write-Host 'RAM cleared; Turbo will load Qwen VL 2B on first analysis.' -ForegroundColor Green

  Write-Host 'Step 5/5 - Checking private page...' -ForegroundColor White
  $page=Invoke-WebRequest "$origin/?v=1195" -UseBasicParsing -TimeoutSec 30
  if($page.StatusCode -ne 200 -or $page.Content -notmatch 'V11.9.5'){throw 'Private V11.9.5 page check failed.'}
  Write-Host 'Private V11.9.5 page PASS.' -ForegroundColor Green

  Write-Host ''
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'V11.9.5 SMART QUALITY IS READY' -ForegroundColor Green
  Write-Host '============================================================' -ForegroundColor Green
  Write-Host 'Turbo = Qwen VL 2B @ 384px + evidence quality gate + one Vision retry + one structuring repair.' -ForegroundColor White
  Write-Host "Open: $origin/?v=1195" -ForegroundColor Cyan
  Start-Process "$origin/?v=1195"
}
catch {
  Write-Host ''
  Write-Host 'V11.9.5 SMART QUALITY UPGRADE STOPPED WITH AN ERROR' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ''
  Write-Host "Diagnostic log: $log" -ForegroundColor Yellow
  Write-Host 'Leave this window open and send the visible error to ChatGPT.' -ForegroundColor Yellow
}
finally {
  try{Stop-Transcript|Out-Null}catch{}
  Read-Host 'Press Enter to close this window'
}
