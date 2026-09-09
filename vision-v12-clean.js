/* Vision V12 Clean Room — single controller, no legacy Vision stack */
(function(global){
'use strict';

const API='/ollama/api';
const STRUCT_MODEL='qwen3:1.7b';
const MODES={
  turbo:{label:'Turbo',model:'qwen3-vl:2b-instruct',px:384,jpeg:.74,vTok:780,vCtx:2560,sTok:1800,sCtx:3584,visionMs:210000,structMs:75000},
  balanced:{label:'Balanced',model:'qwen3-vl:2b-instruct',px:512,jpeg:.80,vTok:1050,vCtx:3072,sTok:2200,sCtx:4096,visionMs:300000,structMs:90000},
  extreme:{label:'Extreme',model:'qwen3-vl:4b-instruct',px:640,jpeg:.84,vTok:1450,vCtx:4096,sTok:2800,sCtx:5120,visionMs:480000,structMs:120000}
};
const SECTION_ORDER=['SUBJECT','FACE','EYES','SKIN','HAIR','MAKEUP','BODY / PROPORTIONS','WARDROBE','FABRIC / MATERIALS','ACCESSORIES','POSE / GAZE','HANDS / NAILS','CAMERA / FRAMING','DEPTH / FOCUS','COMPOSITION','LIGHTING / SHADOWS','BACKGROUND / ENVIRONMENT','COLORS','OBJECTS / TEXT','REALISM / IMPERFECTIONS'];
const STRUCT_SCHEMA={type:'object',additionalProperties:false,required:['image_summary','reconstruction_summary','sections','keywords','reconstruction_prompt'],properties:{image_summary:{type:'string'},reconstruction_summary:{type:'string'},sections:{type:'array',minItems:4,items:{type:'object',additionalProperties:false,required:['name','summary'],properties:{name:{type:'string'},summary:{type:'string'}}}},keywords:{type:'array',minItems:8,items:{type:'string'}},reconstruction_prompt:{type:'string'}}};

const CATEGORY_PATTERNS={
  subject:/\b(subject|person|woman|man|adult|child|object|animal|scene)\b/i,
  face:/\b(face|facial|cheek|jaw|chin|nose|lip|mouth|brow)\b/i,
  eyes:/\b(eye|eyes|iris|gaze|eyelid)\b/i,
  skin:/\b(skin|complexion|freckle|pores?|shine|tan|tone)\b/i,
  hair:/\b(hair|blonde|brunette|black hair|red hair|streak|highlight|curl|wave)\b/i,
  wardrobe:/\b(wardrobe|clothing|garment|shirt|top|sweater|jacket|dress|pants|shorts|fabric)\b/i,
  pose:/\b(pose|posture|gaze|head angle|shoulder|turned|seated|standing|leaning)\b/i,
  camera:/\b(camera|framing|close-up|closeup|portrait|angle|perspective|lens|crop)\b/i,
  focus:/\b(focus|depth of field|bokeh|blur|sharp|soft background)\b/i,
  lighting:/\b(light|lighting|shadow|highlight|glow|illumin|warm light|cool light)\b/i,
  background:/\b(background|environment|interior|exterior|room|street|studio|outdoor|indoor)\b/i,
  color:/\b(color|palette|blue|red|green|yellow|orange|purple|pink|cream|white|black|brown|gray|grey|amber|gold)\b/i,
  material:/\b(texture|material|fabric|knit|denim|leather|metal|wood|glass|fuzzy|wool|cotton)\b/i,
  realism:/\b(realism|realistic|natural texture|imperfection|pores|flyaway|wrinkle|compression|noise)\b/i
};

function textStats(text){
  const t=String(text||'').trim();
  const words=t?t.split(/\s+/).filter(Boolean).length:0;
  const lines=t?t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).length:0;
  const categories=Object.entries(CATEGORY_PATTERNS).filter(([,rx])=>rx.test(t)).map(([k])=>k);
  const labels=SECTION_ORDER.filter(label=>new RegExp('^\\s*'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:', 'im').test(t));
  return {chars:t.length,words,lines,categories,categoryCount:categories.length,labelCount:labels.length};
}

function validateEvidence(text,opts={}){
  const s=textStats(text);
  if(opts.synthetic){
    const t=String(text||'');
    const colorOK=/red/i.test(t)&&/blue/i.test(t);
    const shapeOK=/(rectangle|square|box)/i.test(t)&&/(circle|ellipse|round)/i.test(t);
    return {ok:s.chars>=35&&colorOK&&shapeOK,reason:`synthetic chars=${s.chars}, colors=${colorOK}, shapes=${shapeOK}`,stats:s};
  }
  if(s.chars<300)return {ok:false,reason:`Evidence too short (${s.chars} chars; need 300+).`,stats:s};
  if(s.words<55)return {ok:false,reason:`Evidence too brief (${s.words} words; need 55+).`,stats:s};
  if(s.categoryCount<6)return {ok:false,reason:`Evidence covers only ${s.categoryCount} visual categories; need 6+.`,stats:s};
  if(/visually compelling|high quality image|beautiful image|vibrant color palette without/i.test(String(text)))return {ok:false,reason:'Generic filler detected.',stats:s};
  return {ok:true,reason:'Evidence quality gate passed.',stats:s};
}

function safeJSON(raw){
  let s=String(raw||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const a=s.indexOf('{'),b=s.lastIndexOf('}');
  if(a>=0&&b>a)s=s.slice(a,b+1);
  try{return JSON.parse(s)}catch(_){return null}
}

function validateStructured(o){
  if(!o||typeof o!=='object')return {ok:false,reason:'No structured object.'};
  const sections=Array.isArray(o.sections)?o.sections.filter(x=>x&&String(x.summary||'').trim().length>=12):[];
  const keywords=Array.isArray(o.keywords)?o.keywords.filter(x=>String(x||'').trim().length>=2):[];
  if(String(o.image_summary||'').trim().length<35)return {ok:false,reason:'Image summary too short.'};
  if(String(o.reconstruction_summary||'').trim().length<45)return {ok:false,reason:'Reconstruction summary too short.'};
  if(sections.length<4)return {ok:false,reason:`Only ${sections.length} useful sections.`};
  if(keywords.length<8)return {ok:false,reason:`Only ${keywords.length} keywords.`};
  if(String(o.reconstruction_prompt||'').trim().length<180)return {ok:false,reason:'Reconstruction prompt too short.'};
  if(keywords.some(x=>/placeholder|short label|keyword\s*\d/i.test(String(x))))return {ok:false,reason:'Placeholder keywords detected.'};
  return {ok:true,reason:'Structured result passed.',sectionCount:sections.length,keywordCount:keywords.length};
}

function normalizeHeading(raw){
  const x=String(raw||'').toUpperCase().replace(/_/g,' ').replace(/\s+/g,' ').trim();
  const aliases={CLOTHING:'WARDROBE',FABRIC:'FABRIC / MATERIALS',MATERIALS:'FABRIC / MATERIALS',MATERIAL:'FABRIC / MATERIALS',POSE:'POSE / GAZE',GAZE:'POSE / GAZE',CAMERA:'CAMERA / FRAMING',FRAMING:'CAMERA / FRAMING',FOCUS:'DEPTH / FOCUS',DEPTH:'DEPTH / FOCUS',LIGHTING:'LIGHTING / SHADOWS',SHADOWS:'LIGHTING / SHADOWS',BACKGROUND:'BACKGROUND / ENVIRONMENT',ENVIRONMENT:'BACKGROUND / ENVIRONMENT',COLOR:'COLORS',COLOURS:'COLORS',REALISM:'REALISM / IMPERFECTIONS'};
  if(aliases[x])return aliases[x];
  const exact=SECTION_ORDER.find(h=>x===h||x.startsWith(h+' '));
  return exact||x.slice(0,36)||'VISUAL EVIDENCE';
}

function fallbackStructured(evidence,note=''){
  const sections=[];
  const byName=new Map();
  const add=(name,fact)=>{
    const n=normalizeHeading(name||'VISUAL EVIDENCE');
    if(!byName.has(n)){const s={name:n,summary:''};byName.set(n,s);sections.push(s)}
    const s=byName.get(n); const clean=String(fact||'').replace(/^[-•*]\s*/,'').trim();
    if(clean)s.summary+=(s.summary?' ':'')+clean;
  };
  let current='VISUAL EVIDENCE';
  for(const raw of String(evidence||'').split(/\r?\n/)){
    const line=raw.trim(); if(!line)continue;
    const labeled=line.match(/^[-•*#\s]*([A-Za-z][A-Za-z /&_-]{2,38})\s*:\s*(.+)$/);
    if(labeled){current=normalizeHeading(labeled[1]);add(current,labeled[2]);continue}
    const heading=line.replace(/^[-•*#\s]+/,'').replace(/:$/,'').trim();
    if(heading.length<40&&/^[A-Z][A-Z /&_-]{2,}$/.test(heading)){current=normalizeHeading(heading);continue}
    add(current,line);
  }
  const useful=sections.filter(s=>s.summary.length>5);
  const allText=useful.map(s=>s.summary).join(' ');
  const keywords=[];
  for(const s of useful){
    const chunk=s.summary.split(/[.;]/)[0].trim();
    if(chunk)keywords.push(chunk.length>60?chunk.slice(0,60):chunk);
    if(keywords.length>=14)break;
  }
  const fixedKeywords=[...new Set(keywords)].slice(0,14);
  while(fixedKeywords.length<8){fixedKeywords.push(['natural camera framing','visible material texture','physically believable lighting','faithful color palette','natural skin or surface texture','realistic depth and focus','environmental context','reference-matched composition'][fixedKeywords.length]||'visible reference detail')}
  const imageSummary=useful.slice(0,4).map(s=>s.summary).join(' ').slice(0,900)||'Visual evidence extracted from the reference image.';
  const reconstructionSummary=(note?note+' ':'')+'Reconstruction organized directly from the validated visual evidence; no hidden identity details were added.';
  const reconstructionPrompt=[...useful.map(s=>`${s.name}: ${s.summary}`),'Preserve only visually supported details, natural textures, physically believable lighting, realistic optics, and the reference composition.'].join('\n');
  return {image_summary:imageSummary,reconstruction_summary:reconstructionSummary,sections:useful,keywords:fixedKeywords,reconstruction_prompt:reconstructionPrompt};
}

function evidencePrompt(goal,retry=false){
  const base=`VISUAL EVIDENCE ONLY — PLAIN TEXT, NEVER JSON. Reverse-engineer the uploaded reference for faithful AI image recreation. Use only directly visible evidence; do not identify the person and do not invent hidden details. Write separate labeled lines using every applicable heading from this list: SUBJECT, FACE, EYES, SKIN, HAIR, MAKEUP, BODY / PROPORTIONS, WARDROBE, FABRIC / MATERIALS, ACCESSORIES, POSE / GAZE, HANDS / NAILS, CAMERA / FRAMING, DEPTH / FOCUS, COMPOSITION, LIGHTING / SHADOWS, BACKGROUND / ENVIRONMENT, COLORS, OBJECTS / TEXT, REALISM / IMPERFECTIONS. Be concrete about visible colors, shapes, facial geometry, expression, hairstyle, garment construction, fabric texture, pose, crop, angle, focus falloff, light direction/quality, background elements, and ordinary imperfections. Omit headings that truly cannot be seen. Aim for 12–20 useful factual lines. User goal: ${String(goal||'').trim()}`;
  return retry?base+'\nQUALITY RETRY: The previous evidence was too shallow. Inspect again more carefully. Each labeled line should contain specific reconstruction-ready observations rather than generic adjectives.':base;
}

function structurePrompt(evidence,retry=false){
  const rules=`Use ONLY facts present in the visual evidence. Do not identify the person and do not add hidden traits. Produce a useful image-reconstruction result. image_summary: 2–4 specific sentences. reconstruction_summary: 2–4 sentences describing the recreation strategy. sections: 6–16 useful visual sections with concise reconstruction-ready summaries. keywords: 8–18 concrete prompt phrases. reconstruction_prompt: a polished 180–350 word prompt preserving the visible subject, pose, wardrobe/materials, camera/framing, lighting, background, palette, focus, and realism.`;
  return `${retry?'REPAIR PASS. The prior structured result was incomplete. ':''}${rules}\n\nVISUAL EVIDENCE:\n${evidence}`;
}

function fmtTime(ms){
  if(!Number.isFinite(ms)||ms<0)return '—';
  const s=Math.max(0,Math.round(ms/1000));
  if(s<60)return `${s}s`;
  const m=Math.floor(s/60),r=s%60; return `${m}m ${String(r).padStart(2,'0')}s`;
}

class ProgressTracker{
  constructor(dom,mode){this.dom=dom;this.mode=mode;this.timer=null;this.stage=null;this.stageStart=0;this.stageFrom=0;this.stageTo=0;this.stageExpected=0;this.futureMs=0}
  key(stage){return `vision-v12:${this.mode}:${stage}:ms`}
  estimate(stage,fallback){try{const v=Number(localStorage.getItem(this.key(stage)));return Number.isFinite(v)&&v>3000?v:fallback}catch(_){return fallback}}
  record(stage,actual){try{const old=this.estimate(stage,actual);localStorage.setItem(this.key(stage),String(Math.round(old*.65+actual*.35)))}catch(_){}}
  render(pct,title,stage,remaining){const d=this.dom;d.overlay.classList.remove('hidden');d.pct.textContent=`${Math.round(pct)}%`;d.bar.style.width=`${Math.max(0,Math.min(100,pct))}%`;d.title.textContent=title;d.stage.textContent=stage;d.eta.textContent=remaining>0?`Estimated remaining ${fmtTime(remaining)}`:'Finishing…'}
  begin(stage,from,to,label,expected,futureMs=0){this.stop(false);this.stage=stage;this.stageStart=Date.now();this.stageFrom=from;this.stageTo=to;this.stageExpected=this.estimate(stage,expected);this.futureMs=futureMs;const tick=()=>{const elapsed=Date.now()-this.stageStart;const ratio=Math.min(.985,elapsed/this.stageExpected);const eased=1-Math.pow(1-ratio,1.7);const pct=this.stageFrom+(this.stageTo-this.stageFrom-1)*eased;const remaining=Math.max(0,this.stageExpected-elapsed)+this.futureMs;this.render(pct,'Vision analysis running',label,remaining)};tick();this.timer=setInterval(tick,500)}
  finish(label){if(!this.stage)return;const actual=Date.now()-this.stageStart;this.record(this.stage,actual);if(this.timer)clearInterval(this.timer);this.timer=null;this.render(this.stageTo,'Vision analysis running',label,this.futureMs);this.stage=null}
  complete(elapsed){this.stop(false);this.render(100,'Analysis complete',`Total ${fmtTime(elapsed)}`,0);setTimeout(()=>this.hide(),900)}
  stop(hide=true){if(this.timer)clearInterval(this.timer);this.timer=null;this.stage=null;if(hide)this.hide()}
  hide(){this.dom.overlay.classList.add('hidden')}
}

const Internals={MODES,SECTION_ORDER,textStats,validateEvidence,safeJSON,validateStructured,normalizeHeading,fallbackStructured,evidencePrompt,structurePrompt,fmtTime};
global.VisionV12Internals=Internals;

if(typeof document==='undefined')return;

const $=id=>document.getElementById(id);
let models=[],file=null,controller=null,runStarted=0,progress=null,lastDiagnostics=[];
const progressDom={overlay:$('progressOverlay'),title:$('progressTitle'),pct:$('progressPct'),bar:$('progressBar'),stage:$('progressStage'),eta:$('progressEta')};

function status(id,msg,type=''){const e=$(id);if(!e)return;e.textContent=msg;e.className='status '+type}
function logDiag(line){lastDiagnostics.push(`[${new Date().toLocaleTimeString()}] ${line}`);$('diagnostics').textContent=lastDiagnostics.join('\n')}
function clearResults(){lastDiagnostics=[];$('diagnostics').textContent='';$('imageSummary').value='';$('reconSummary').value='';$('reconPrompt').value='';$('rawEvidence').value='';$('keywords').innerHTML='';$('sections').innerHTML='';$('results').classList.add('hidden')}

async function api(path,body=null,signal=null,timeoutMs=900000){
  const ac=new AbortController();const t=setTimeout(()=>ac.abort('timeout'),timeoutMs);
  const relay=()=>ac.abort(); if(signal)signal.addEventListener('abort',relay,{once:true});
  try{
    const opt={method:body?'POST':'GET',headers:{Accept:'application/json'},cache:'no-store',signal:ac.signal};
    if(body){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}
    const r=await fetch(API+path,opt);const txt=await r.text();
    if(!r.ok)throw new Error(`HTTP ${r.status}: ${txt.slice(0,700)}`);
    try{return txt?JSON.parse(txt):{}}catch(_){throw new Error('Invalid JSON from Ollama bridge: '+txt.slice(0,350))}
  }finally{clearTimeout(t);if(signal)signal.removeEventListener('abort',relay)}
}

async function checkConnection(){
  try{status('connStatus','Checking private Ollama connection…');const [tags,bridge]=await Promise.all([api('/tags',null,null,30000),fetch('/bridge-info',{cache:'no-store'}).then(r=>r.ok?r.json():({version:'unknown'}))]);models=(tags.models||[]).map(x=>x.name||x.model).filter(Boolean);fillModels();const has2=models.includes('qwen3-vl:2b-instruct')||models.some(m=>/qwen3-vl.*2b/i.test(m));const hasText=models.includes(STRUCT_MODEL);if(!has2||!hasText)throw new Error(`Required models missing: ${!has2?'qwen3-vl:2b-instruct ':''}${!hasText?STRUCT_MODEL:''}`);status('connStatus',`Connected · Bridge ${bridge.version||'unknown'} · V12 models ready.`,'good');$('modelList').textContent='Installed: '+models.join(' · ');return true}catch(e){status('connStatus','Connection/model check failed: '+e.message,'bad');return false}
}

function findModel(rx,exact){return models.find(m=>m===exact)||models.find(m=>rx.test(m))||''}
function fillModels(){
  const sel=$('visionModel');sel.innerHTML='';
  const candidates=models.filter(m=>/qwen3-vl/i.test(m));candidates.forEach(m=>sel.add(new Option(m,m)));
  if(!candidates.length)sel.add(new Option('No Qwen Vision model found',''));
  syncModeModel();
}
function syncModeModel(){
  const m=MODES[$('mode').value]||MODES.turbo;let wanted=m.model;
  if(!models.includes(wanted))wanted=$('mode').value==='extreme'?findModel(/qwen3-vl.*4b/i,'qwen3-vl:4b-instruct'):findModel(/qwen3-vl.*2b/i,'qwen3-vl:2b-instruct');
  if(!wanted&&$('mode').value==='extreme')wanted=findModel(/qwen3-vl.*2b/i,'qwen3-vl:2b-instruct');
  if(wanted)$('visionModel').value=wanted;
  $('modeInfo').textContent=`${m.label}: ${wanted||m.model} at ${m.px}px. Vision produces plain evidence only; ${STRUCT_MODEL} performs structured reconstruction. Progress/ETA learns from completed ${m.label} runs.`;
}

function fileToDataURL(f){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('FileReader could not read the image.'));r.readAsDataURL(f)})}
function decodeImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Browser could not decode the image.'));img.src=src})}
async function preprocess(f,mode){
  const src=await fileToDataURL(f),img=await decodeImage(src),nw=img.naturalWidth||img.width,nh=img.naturalHeight||img.height,scale=Math.min(1,mode.px/Math.max(nw,nh)),w=Math.max(1,Math.round(nw*scale)),h=Math.max(1,Math.round(nh*scale));
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d',{alpha:false});if(!c)throw new Error('Canvas is unavailable.');c.fillStyle='#fff';c.fillRect(0,0,w,h);c.drawImage(img,0,0,w,h);const data=cv.toDataURL('image/jpeg',mode.jpeg),b64=data.slice(data.indexOf(',')+1);if(!b64)throw new Error('Image compression returned no data.');return {preview:src,b64,w,h,nw,nh,approxBytes:Math.round(b64.length*.75)}
}

async function runVision(model,b64,goal,mode,retry,signal){
  const body={model,messages:[{role:'user',content:evidencePrompt(goal,retry),images:[b64]}],stream:false,think:false,keep_alive:'15m',options:{temperature:0,num_predict:retry?Math.max(1000,mode.vTok):mode.vTok,num_ctx:retry?Math.max(3072,mode.vCtx):mode.vCtx}};
  const j=await api('/chat',body,signal,900000);return String(j?.message?.content||j?.message?.thinking||'').trim();
}

async function runStructure(evidence,mode,retry,signal){
  const body={model:STRUCT_MODEL,messages:[{role:'user',content:structurePrompt(evidence,retry)}],stream:false,think:false,keep_alive:'15m',options:{temperature:retry?0:.05,num_predict:retry?Math.max(2300,mode.sTok):mode.sTok,num_ctx:retry?Math.max(4096,mode.sCtx):mode.sCtx}};
  if(!retry)body.format=STRUCT_SCHEMA;else body.format='json';
  const j=await api('/chat',body,signal,900000);return safeJSON(j?.message?.content||j?.message?.thinking||'');
}

function render(o,evidence){
  $('results').classList.remove('hidden');$('imageSummary').value=o.image_summary||'';$('reconSummary').value=o.reconstruction_summary||'';$('reconPrompt').value=o.reconstruction_prompt||'';$('rawEvidence').value=evidence||'';
  $('keywords').innerHTML='';for(const k of o.keywords||[]){const b=document.createElement('span');b.className='bubble';b.textContent=String(k);$('keywords').appendChild(b)}
  $('sections').innerHTML='';for(const s of o.sections||[]){const box=document.createElement('div');box.className='section';const h=document.createElement('h4');h.textContent=s.name||'Visual Detail';const p=document.createElement('p');p.textContent=s.summary||'';box.append(h,p);$('sections').appendChild(box)}
}

async function runAnalysis(){
  if(!file){status('runStatus','Choose an image first.','bad');return}if(!models.length&&!(await checkConnection()))return;
  const modeName=$('mode').value,mode=MODES[modeName]||MODES.turbo,model=$('visionModel').value||mode.model;if(!model){status('runStatus','No Vision model selected.','bad');return}
  clearResults();controller=new AbortController();$('runBtn').disabled=true;$('cancelBtn').disabled=false;runStarted=Date.now();progress=new ProgressTracker(progressDom,modeName);
  try{
    progress.begin('preprocess',0,6,'Preparing and compressing image',2500,mode.visionMs+mode.structMs);status('runStatus','Preparing image…');const prep=await preprocess(file,mode);progress.finish('Image prepared');logDiag(`Preprocess: ${prep.nw}×${prep.nh} → ${prep.w}×${prep.h}, ~${Math.round(prep.approxBytes/1024)} KB JPEG.`);

    progress.begin('vision',6,66,`Stage 1/2 · ${model} extracting visual evidence`,mode.visionMs,mode.structMs);status('runStatus',`Stage 1/2: detailed visual evidence with ${model}…`);let evidence=await runVision(model,prep.b64,$('goal').value,mode,false,controller.signal);let ev=validateEvidence(evidence);logDiag(`Vision pass 1: ${ev.stats.chars} chars, ${ev.stats.words} words, ${ev.stats.categoryCount} categories. ${ev.reason}`);
    if(!ev.ok){status('runStatus','Stage 1 quality gate rejected shallow evidence; retrying once…');logDiag('Vision quality retry triggered.');evidence=await runVision(model,prep.b64,$('goal').value,mode,true,controller.signal);ev=validateEvidence(evidence);logDiag(`Vision pass 2: ${ev.stats.chars} chars, ${ev.stats.words} words, ${ev.stats.categoryCount} categories. ${ev.reason}`)}
    if(!ev.ok)throw new Error('Vision evidence failed the quality gate after retry: '+ev.reason);progress.finish(`Stage 1 complete · ${ev.stats.categoryCount} categories`);

    progress.begin('structure',66,94,`Stage 2/2 · ${STRUCT_MODEL} structuring evidence`,mode.structMs,8000);status('runStatus',`Stage 2/2: structuring with ${STRUCT_MODEL}…`);let structured=null,sv={ok:false,reason:'not run'};
    try{structured=await runStructure(evidence,mode,false,controller.signal);sv=validateStructured(structured);logDiag('Structuring pass 1: '+sv.reason)}catch(e){if(e.name==='AbortError')throw e;logDiag('Structuring pass 1 error: '+e.message)}
    if(!sv.ok){status('runStatus','Stage 2 result incomplete; running one repair pass…');try{structured=await runStructure(evidence,mode,true,controller.signal);sv=validateStructured(structured);logDiag('Structuring repair: '+sv.reason)}catch(e){if(e.name==='AbortError')throw e;logDiag('Structuring repair error: '+e.message)}}
    if(!sv.ok){structured=fallbackStructured(evidence,'Local evidence parser used after two structuring attempts.');const fv=validateStructured(structured);logDiag('Local fallback parser: '+fv.reason)}
    progress.finish('Stage 2 complete');

    progress.begin('render',94,99,'Rendering reconstruction results',4000,0);render(structured,evidence);progress.finish('Results rendered');const elapsed=Date.now()-runStarted;progress.complete(elapsed);status('runStatus',`Complete in ${fmtTime(elapsed)} · ${model} → ${STRUCT_MODEL}.`,'good');logDiag(`TOTAL: ${fmtTime(elapsed)}. Pipeline: ${model} plain evidence → ${STRUCT_MODEL} structure.`);
  }catch(e){progress?.stop();if(e.name==='AbortError'||controller?.signal.aborted){status('runStatus','Analysis cancelled.');logDiag('Run cancelled by user.')}else{status('runStatus','Analysis failed: '+e.message,'bad');logDiag('ERROR: '+e.message)}}finally{$('runBtn').disabled=!file;$('cancelBtn').disabled=true;controller=null}
}

function cancel(){if(controller)controller.abort();progress?.stop();status('runStatus','Cancelling…')}

async function syntheticImage(){const cv=document.createElement('canvas');cv.width=180;cv.height=140;const c=cv.getContext('2d',{alpha:false});c.fillStyle='#fff';c.fillRect(0,0,180,140);c.fillStyle='#d22';c.fillRect(20,25,72,52);c.fillStyle='#2463d4';c.beginPath();c.arc(132,82,28,0,Math.PI*2);c.fill();return cv.toDataURL('image/jpeg',.85).split(',')[1]}

async function selfTest(){
  if(!models.length&&!(await checkConnection()))return;const model=findModel(/qwen3-vl.*2b/i,'qwen3-vl:2b-instruct');if(!model){status('connStatus','Self-test cannot run: qwen3-vl:2b-instruct missing.','bad');return}
  controller=new AbortController();runStarted=Date.now();progress=new ProgressTracker(progressDom,'turbo');lastDiagnostics=[];$('diagnostics').textContent='';
  try{
    progress.begin('selfvision',0,58,'Self-test · synthetic Vision image',90000,50000);status('connStatus','Self-test: testing Qwen Vision through the private bridge…');const b64=await syntheticImage();const j=await api('/chat',{model,messages:[{role:'user',content:'PLAIN TEXT ONLY. Describe the two visible colored shapes and white background in 3–5 factual sentences.',images:[b64]}],stream:false,think:false,keep_alive:'5m',options:{temperature:0,num_predict:220,num_ctx:1536}},controller.signal,600000);const txt=String(j?.message?.content||j?.message?.thinking||'').trim();const tv=validateEvidence(txt,{synthetic:true});logDiag('Synthetic Vision: '+tv.reason);if(!tv.ok)throw new Error('Synthetic Vision check failed: '+txt.slice(0,250));progress.finish('Synthetic Vision PASS');

    progress.begin('selfstructure',58,93,'Self-test · qwen3:1.7b JSON structuring',60000,5000);status('connStatus','Self-test: testing structure model…');const sample='OBJECTS / TEXT: A red rectangle appears on the left and a blue circle appears on the right. BACKGROUND / ENVIRONMENT: Plain white background. COLORS: Red, blue, and white. COMPOSITION: Two separated geometric shapes centered in the frame. CAMERA / FRAMING: Straight-on full-frame view.';let o=await runStructure(sample,MODES.turbo,true,controller.signal);if(!o)throw new Error('Structure model returned invalid JSON.');const basic=Array.isArray(o.sections)&&String(o.image_summary||'').length>15;if(!basic)throw new Error('Structure model output was incomplete.');progress.finish('Structuring PASS');

    progress.begin('selfroute',93,99,'Self-test · private page / bridge route',5000,0);const bi=await fetch('/bridge-info',{cache:'no-store'});if(!bi.ok)throw new Error('bridge-info route returned HTTP '+bi.status);progress.finish('Private route PASS');const elapsed=Date.now()-runStarted;progress.complete(elapsed);status('connStatus',`Full self-test PASS in ${fmtTime(elapsed)} · Vision + structuring + private route.`,'good');logDiag('SELF-TEST PASS.');
  }catch(e){progress?.stop();status('connStatus','Full self-test failed: '+e.message,'bad');logDiag('SELF-TEST ERROR: '+e.message)}finally{controller=null}
}

$('fileInput').addEventListener('change',async e=>{try{file=e.target.files?.[0]||null;$('preview').innerHTML='';if(!file){$('runBtn').disabled=true;$('preview').innerHTML='<div class="small">Choose a JPG, PNG, or WebP image.</div>';return}const src=await fileToDataURL(file),img=await decodeImage(src);img.alt='Reference image preview';$('preview').appendChild(img);$('runBtn').disabled=false;status('runStatus',`Image ready: ${img.naturalWidth}×${img.naturalHeight}.`,'good')}catch(err){file=null;$('runBtn').disabled=true;status('runStatus','Image load failed: '+err.message,'bad')}});
$('mode').addEventListener('change',syncModeModel);$('checkBtn').addEventListener('click',checkConnection);$('selfTestBtn').addEventListener('click',selfTest);$('runBtn').addEventListener('click',runAnalysis);$('cancelBtn').addEventListener('click',cancel);$('copyPromptBtn').addEventListener('click',async()=>{const t=$('reconPrompt').value;try{await navigator.clipboard.writeText(t);status('runStatus','Reconstruction prompt copied.','good')}catch(_){const x=document.createElement('textarea');x.value=t;document.body.appendChild(x);x.select();document.execCommand('copy');x.remove();status('runStatus','Reconstruction prompt copied.','good')}});

checkConnection();
})(typeof globalThis!=='undefined'?globalThis:this);
