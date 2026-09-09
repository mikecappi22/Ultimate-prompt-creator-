/* Vision V12.1 Quality + Speed — confidence-aware, CPU-tuned, single controller */
(function(global){
'use strict';

const VERSION='12.1';
const API='/ollama/api';
const STRUCT_MODEL='qwen3:1.7b';
const CONF_CLEAR='CLEARLY_VISIBLE';
const CONF_EST='ESTIMATED';
const MODES={
  turbo:{label:'Turbo',model:'qwen3-vl:2b-instruct',px:320,jpeg:.72,vTok:520,vCtx:2048,sTok:1050,sCtx:2560,visionMs:300000,structMs:65000},
  balanced:{label:'Balanced',model:'qwen3-vl:2b-instruct',px:512,jpeg:.80,vTok:820,vCtx:2816,sTok:1500,sCtx:3328,visionMs:360000,structMs:85000},
  extreme:{label:'Extreme',model:'qwen3-vl:4b-instruct',px:640,jpeg:.84,vTok:1180,vCtx:3840,sTok:2100,sCtx:4352,visionMs:540000,structMs:115000}
};
const SECTION_ORDER=['SUBJECT','FACE','EYES','SKIN','HAIR','MAKEUP','BODY / PROPORTIONS','WARDROBE','FABRIC / MATERIALS','ACCESSORIES','POSE / GAZE','HANDS / NAILS','CAMERA / FRAMING','DEPTH / FOCUS','COMPOSITION','LIGHTING / SHADOWS','BACKGROUND / ENVIRONMENT','COLORS','OBJECTS / TEXT','REALISM / IMPERFECTIONS'];
const BANNED_CERTAINTY=/\b(no visible blemishes|no blemishes|no artifacts|no visible artifacts|no visible accessories|no accessories|no objects in (?:the )?background|nothing in (?:the )?background|perfect(?:ly)? smooth skin|flawless skin|poreless skin)\b/i;
const STRUCT_SCHEMA={
  type:'object',additionalProperties:false,
  required:['image_summary','reconstruction_summary','sections','keywords','reconstruction_prompt'],
  properties:{
    image_summary:{type:'string'},
    reconstruction_summary:{type:'string'},
    sections:{type:'array',minItems:4,maxItems:16,items:{type:'object',additionalProperties:false,required:['name','summary','confidence'],properties:{name:{type:'string'},summary:{type:'string'},confidence:{type:'string',enum:[CONF_CLEAR,CONF_EST]}}}},
    keywords:{type:'array',minItems:8,maxItems:16,items:{type:'object',additionalProperties:false,required:['text','confidence'],properties:{text:{type:'string'},confidence:{type:'string',enum:[CONF_CLEAR,CONF_EST]}}}},
    reconstruction_prompt:{type:'string'}
  }
};

const CATEGORY_PATTERNS={
  subject:/\b(subject|person|woman|man|adult|child|object|animal|scene)\b/i,
  face:/\b(face|facial|cheek|jaw|chin|nose|lip|mouth|brow)\b/i,
  eyes:/\b(eye|eyes|iris|gaze|eyelid)\b/i,
  skin:/\b(skin|complexion|freckle|pores?|shine|tan|tone)\b/i,
  hair:/\b(hair|blonde|brunette|black hair|red hair|streak|highlight|curl|wave)\b/i,
  wardrobe:/\b(wardrobe|clothing|garment|shirt|top|sweater|jacket|dress|pants|shorts|fabric)\b/i,
  pose:/\b(pose|posture|gaze|head angle|shoulder|turned|seated|standing|leaning|tilted)\b/i,
  camera:/\b(camera|framing|close-up|closeup|portrait|angle|perspective|lens|crop)\b/i,
  focus:/\b(focus|depth of field|bokeh|blur|sharp|soft background)\b/i,
  lighting:/\b(light|lighting|shadow|highlight|glow|illumin|warm light|cool light)\b/i,
  background:/\b(background|environment|interior|exterior|room|street|studio|outdoor|indoor)\b/i,
  color:/\b(color|palette|blue|red|green|yellow|orange|purple|pink|cream|white|black|brown|gray|grey|amber|gold)\b/i,
  material:/\b(texture|material|fabric|knit|denim|leather|metal|wood|glass|fuzzy|wool|cotton)\b/i,
  realism:/\b(realism|realistic|natural texture|imperfection|pores|flyaway|wrinkle|compression|noise|sheen)\b/i
};

function normalizeHeading(raw){
  const x=String(raw||'').toUpperCase().replace(/_/g,' ').replace(/\s+/g,' ').trim();
  const aliases={CLOTHING:'WARDROBE',FABRIC:'FABRIC / MATERIALS',MATERIALS:'FABRIC / MATERIALS',MATERIAL:'FABRIC / MATERIALS',POSE:'POSE / GAZE',GAZE:'POSE / GAZE',CAMERA:'CAMERA / FRAMING',FRAMING:'CAMERA / FRAMING',FOCUS:'DEPTH / FOCUS',DEPTH:'DEPTH / FOCUS',LIGHTING:'LIGHTING / SHADOWS',SHADOWS:'LIGHTING / SHADOWS',BACKGROUND:'BACKGROUND / ENVIRONMENT',ENVIRONMENT:'BACKGROUND / ENVIRONMENT',COLOR:'COLORS',COLOURS:'COLORS',REALISM:'REALISM / IMPERFECTIONS'};
  if(aliases[x])return aliases[x];
  const exact=SECTION_ORDER.find(h=>x===h||x.startsWith(h+' '));
  return exact||x.slice(0,40)||'VISUAL EVIDENCE';
}
function parseConfidence(raw){
  const s=String(raw||'').toUpperCase();
  if(/\[(?:ESTIMATED|UNCERTAIN)\]/.test(s))return CONF_EST;
  if(/\[(?:CLEAR|CLEARLY_VISIBLE|VISIBLE)\]/.test(s))return CONF_CLEAR;
  return null;
}
function stripConfidence(raw){return String(raw||'').replace(/^\s*\[(?:CLEAR|CLEARLY_VISIBLE|VISIBLE|ESTIMATED|UNCERTAIN)\]\s*/i,'').trim()}
function parseEvidenceLine(raw){
  const line=String(raw||'').trim(); if(!line)return null;
  const confidence=parseConfidence(line);
  const clean=stripConfidence(line);
  const m=clean.match(/^[-•*#\s]*([A-Za-z][A-Za-z /&_-]{2,42})\s*:\s*(.+)$/);
  if(!m)return {name:null,summary:clean,confidence:confidence||CONF_EST};
  return {name:normalizeHeading(m[1]),summary:m[2].trim(),confidence:confidence||CONF_EST};
}
function textStats(text){
  const t=String(text||'').trim();
  const words=t?t.split(/\s+/).filter(Boolean).length:0;
  const lines=t?t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean):[];
  const categories=Object.entries(CATEGORY_PATTERNS).filter(([,rx])=>rx.test(t)).map(([k])=>k);
  const parsed=lines.map(parseEvidenceLine).filter(Boolean);
  const labeled=parsed.filter(x=>x.name);
  const confidenceTagged=lines.filter(x=>/^\s*\[(?:CLEAR|CLEARLY_VISIBLE|VISIBLE|ESTIMATED|UNCERTAIN)\]/i.test(x));
  return {chars:t.length,words,lineCount:lines.length,categories,categoryCount:categories.length,labelCount:labeled.length,confidenceCount:confidenceTagged.length};
}
function validateEvidence(text,opts={}){
  const s=textStats(text);
  if(opts.synthetic){
    const t=String(text||'');
    const colorOK=/red/i.test(t)&&/blue/i.test(t);
    const shapeOK=/(rectangle|square|box)/i.test(t)&&/(circle|ellipse|round)/i.test(t);
    return {ok:s.chars>=35&&colorOK&&shapeOK,reason:`synthetic chars=${s.chars}, colors=${colorOK}, shapes=${shapeOK}`,stats:s};
  }
  if(s.chars<260)return {ok:false,reason:`Evidence too short (${s.chars} chars; need 260+).`,stats:s};
  if(s.words<45)return {ok:false,reason:`Evidence too brief (${s.words} words; need 45+).`,stats:s};
  if(s.categoryCount<6)return {ok:false,reason:`Evidence covers only ${s.categoryCount} visual categories; need 6+.`,stats:s};
  if(s.labelCount<6)return {ok:false,reason:`Evidence contains only ${s.labelCount} labeled visual sections; need 6+.`,stats:s};
  if(s.confidenceCount<4)return {ok:false,reason:`Confidence labeling is incomplete (${s.confidenceCount} tagged lines; need 4+).`,stats:s};
  if(/visually compelling|high quality image|beautiful image|vibrant color palette without/i.test(String(text)))return {ok:false,reason:'Generic filler detected.',stats:s};
  if(BANNED_CERTAINTY.test(String(text)))return {ok:false,reason:'Unsupported negative-certainty language detected.',stats:s};
  return {ok:true,reason:'Evidence quality + confidence gate passed.',stats:s};
}
function safeJSON(raw){
  let s=String(raw||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)s=s.slice(a,b+1);
  try{return JSON.parse(s)}catch(_){return null}
}
function evidenceConfidenceMap(evidence){
  const map=new Map();
  for(const raw of String(evidence||'').split(/\r?\n/)){
    const p=parseEvidenceLine(raw);if(!p||!p.name)continue;
    const old=map.get(p.name);
    if(!old||p.confidence===CONF_EST)map.set(p.name,p.confidence);
  }
  return map;
}
function validateStructured(o,evidence=''){
  if(!o||typeof o!=='object')return {ok:false,reason:'No structured object.'};
  const sections=Array.isArray(o.sections)?o.sections.filter(x=>x&&String(x.summary||'').trim().length>=12):[];
  const keywords=Array.isArray(o.keywords)?o.keywords.filter(x=>x&&String(x.text||'').trim().length>=2):[];
  if(String(o.image_summary||'').trim().length<35)return {ok:false,reason:'Image summary too short.'};
  if(String(o.reconstruction_summary||'').trim().length<45)return {ok:false,reason:'Reconstruction summary too short.'};
  if(sections.length<4)return {ok:false,reason:`Only ${sections.length} useful sections.`};
  if(keywords.length<8)return {ok:false,reason:`Only ${keywords.length} useful keywords.`};
  if(String(o.reconstruction_prompt||'').trim().length<160)return {ok:false,reason:'Reconstruction prompt too short.'};
  const joined=[o.image_summary,o.reconstruction_summary,o.reconstruction_prompt,...sections.map(x=>x.summary),...keywords.map(x=>x.text)].join(' ');
  if(BANNED_CERTAINTY.test(joined))return {ok:false,reason:'Structured output contains banned certainty/absence claims.'};
  const eMap=evidenceConfidenceMap(evidence);
  for(const s of sections){
    const n=normalizeHeading(s.name);
    const ec=eMap.get(n);
    if(ec===CONF_EST&&s.confidence!==CONF_EST)return {ok:false,reason:`Confidence drift: ${n} was ESTIMATED in evidence but promoted to ${s.confidence}.`};
    if(![CONF_CLEAR,CONF_EST].includes(s.confidence))return {ok:false,reason:`Invalid confidence for ${n}.`};
  }
  if(keywords.some(x=>/placeholder|short label|keyword\s*\d/i.test(String(x.text))))return {ok:false,reason:'Placeholder keywords detected.'};
  if(keywords.some(x=>![CONF_CLEAR,CONF_EST].includes(x.confidence)))return {ok:false,reason:'Invalid keyword confidence.'};
  return {ok:true,reason:'Structured result passed confidence validation.',sectionCount:sections.length,keywordCount:keywords.length};
}
function fallbackStructured(evidence,note=''){
  const sections=[];const byName=new Map();
  const add=(name,fact,confidence)=>{
    const n=normalizeHeading(name||'VISUAL EVIDENCE');
    const clean=String(fact||'').replace(/^[-•*]\s*/,'').trim();if(!clean)return;
    if(BANNED_CERTAINTY.test(clean))return;
    if(!byName.has(n)){const s={name:n,summary:'',confidence:confidence||CONF_EST};byName.set(n,s);sections.push(s)}
    const s=byName.get(n);if(confidence===CONF_EST)s.confidence=CONF_EST;s.summary+=(s.summary?' ':'')+clean;
  };
  let current='VISUAL EVIDENCE',currentConf=CONF_EST;
  for(const raw of String(evidence||'').split(/\r?\n/)){
    const line=raw.trim();if(!line)continue;
    const parsed=parseEvidenceLine(line);
    if(parsed&&parsed.name){current=parsed.name;currentConf=parsed.confidence;add(current,parsed.summary,currentConf);continue}
    const heading=stripConfidence(line).replace(/^[-•*#\s]+/,'').replace(/:$/,'').trim();
    if(heading.length<42&&/^[A-Z][A-Z /&_-]{2,}$/.test(heading)){current=normalizeHeading(heading);currentConf=parseConfidence(line)||CONF_EST;continue}
    add(current,stripConfidence(line),parseConfidence(line)||currentConf);
  }
  const useful=sections.filter(s=>s.summary.length>5).slice(0,16);
  const keywords=[];
  for(const s of useful){
    const chunk=s.summary.split(/[.;]/)[0].trim();if(!chunk||BANNED_CERTAINTY.test(chunk))continue;
    keywords.push({text:(s.confidence===CONF_EST?'possibly ':'')+(chunk.length>64?chunk.slice(0,64):chunk),confidence:s.confidence});
    if(keywords.length>=14)break;
  }
  const defaults=[
    {text:'natural camera framing',confidence:CONF_CLEAR},{text:'visible material texture',confidence:CONF_CLEAR},{text:'physically believable lighting',confidence:CONF_CLEAR},{text:'faithful color palette',confidence:CONF_CLEAR},{text:'natural surface texture',confidence:CONF_CLEAR},{text:'realistic depth and focus',confidence:CONF_CLEAR},{text:'environmental context',confidence:CONF_CLEAR},{text:'reference-matched composition',confidence:CONF_CLEAR}
  ];
  for(const d of defaults){if(keywords.length>=8)break;if(!keywords.some(k=>k.text===d.text))keywords.push(d)}
  const imageSummary=useful.slice(0,4).map(s=>(s.confidence===CONF_EST?'Estimated: ':'')+s.summary).join(' ').slice(0,900)||'Visual evidence extracted from the reference image.';
  const reconstructionSummary=(note?note+' ':'')+'Reconstruction organized directly from validated visual evidence. Estimated details remain explicitly uncertain and are not promoted to facts.';
  const reconstructionPrompt=[...useful.map(s=>`${s.name}${s.confidence===CONF_EST?' [ESTIMATED]':''}: ${s.summary}`),'Preserve only visually supported details. Keep estimated details tentative; do not invent hidden traits or unsupported absences. Use natural textures, physically believable lighting, realistic optics, and the reference composition.'].join('\n');
  return {image_summary:imageSummary,reconstruction_summary:reconstructionSummary,sections:useful,keywords:keywords.slice(0,14),reconstruction_prompt:reconstructionPrompt};
}
function evidencePrompt(goal,retry=false){
  const base=`VISUAL EVIDENCE ONLY — PLAIN TEXT, NEVER JSON. Reverse-engineer the uploaded reference for faithful AI image recreation using only directly visible evidence. Do not identify the person and do not invent hidden details. Every factual line MUST begin with [CLEAR] if directly resolved at this image size or [ESTIMATED] if visible but uncertain. Eye color, subtle makeup, fine skin condition, tiny accessories, and small background details should be [ESTIMATED] unless genuinely clear. Never state negative absence claims such as "no blemishes", "no artifacts", "no accessories", or "nothing in the background"; omit unsupported absences instead. Write 10–14 compact labeled lines using applicable headings from: SUBJECT, FACE, EYES, SKIN, HAIR, MAKEUP, BODY / PROPORTIONS, WARDROBE, FABRIC / MATERIALS, ACCESSORIES, POSE / GAZE, HANDS / NAILS, CAMERA / FRAMING, DEPTH / FOCUS, COMPOSITION, LIGHTING / SHADOWS, BACKGROUND / ENVIRONMENT, COLORS, OBJECTS / TEXT, REALISM / IMPERFECTIONS. Prioritize reconstruction-critical details: colors, shapes, facial geometry, expression, hairstyle, garment construction, material texture, pose, crop, angle, focus falloff, light direction/quality, background structure, and ordinary imperfections. User goal: ${String(goal||'').trim()}`;
  return retry?base+'\nQUALITY RETRY: The prior evidence failed validation. Inspect again carefully, keep each line compact, include confidence tags, and supply at least six distinct labeled visual categories without generic filler.':base;
}
function structurePrompt(evidence,retry=false){
  const rules=`Use ONLY facts present in the visual evidence. Preserve evidence confidence: anything tagged [ESTIMATED] must remain ESTIMATED and use tentative wording such as "appears", "possibly", or "approximately" where appropriate. Never promote uncertainty to certainty. Do not identify the person, invent hidden traits, or add unsupported negative/absence claims. image_summary: 2–4 specific sentences. reconstruction_summary: 2–4 concise recreation-strategy sentences. sections: 5–12 reconstruction-critical sections with confidence. keywords: 8–14 concise prompt phrases with confidence. reconstruction_prompt: a polished 140–260 word prompt preserving supported subject, pose, wardrobe/materials, camera/framing, lighting, background, palette, focus, realism, and tentative wording for estimated details.`;
  return `${retry?'REPAIR PASS. The previous structured result failed validation. ':''}${rules}\n\nVISUAL EVIDENCE:\n${evidence}`;
}
function fmtTime(ms){if(!Number.isFinite(ms)||ms<0)return '—';const s=Math.max(0,Math.round(ms/1000));if(s<60)return `${s}s`;const m=Math.floor(s/60),r=s%60;return `${m}m ${String(r).padStart(2,'0')}s`}

class ProgressTracker{
  constructor(dom,mode){this.dom=dom;this.mode=mode;this.timer=null;this.stage=null;this.stageStart=0;this.stageFrom=0;this.stageTo=0;this.stageExpected=0;this.futureMs=0}
  key(stage){return `vision-v121:${this.mode}:${stage}:ms`}
  estimate(stage,fallback){try{const v=Number(localStorage.getItem(this.key(stage)));return Number.isFinite(v)&&v>3000?v:fallback}catch(_){return fallback}}
  record(stage,actual){try{const old=this.estimate(stage,actual);localStorage.setItem(this.key(stage),String(Math.round(old*.6+actual*.4)))}catch(_){}}
  render(pct,title,stage,remaining){const d=this.dom;d.overlay.classList.remove('hidden');d.pct.textContent=`${Math.round(pct)}%`;d.bar.style.width=`${Math.max(0,Math.min(100,pct))}%`;d.title.textContent=title;d.stage.textContent=stage;d.eta.textContent=remaining>0?`Estimated remaining ${fmtTime(remaining)}`:'Finishing…'}
  begin(stage,from,to,label,expected,futureMs=0){this.stop(false);this.stage=stage;this.stageStart=Date.now();this.stageFrom=from;this.stageTo=to;this.stageExpected=this.estimate(stage,expected);this.futureMs=futureMs;const tick=()=>{const elapsed=Date.now()-this.stageStart;const ratio=Math.min(.985,elapsed/this.stageExpected);const eased=1-Math.pow(1-ratio,1.65);const pct=this.stageFrom+(this.stageTo-this.stageFrom-1)*eased;const remaining=Math.max(0,this.stageExpected-elapsed)+this.futureMs;this.render(pct,'Vision V12.1 running',label,remaining)};tick();this.timer=setInterval(tick,500)}
  finish(label){if(!this.stage)return;const actual=Date.now()-this.stageStart;this.record(this.stage,actual);if(this.timer)clearInterval(this.timer);this.timer=null;this.render(this.stageTo,'Vision V12.1 running',label,this.futureMs);this.stage=null}
  complete(elapsed){this.stop(false);this.render(100,'Analysis complete',`Total ${fmtTime(elapsed)}`,0);setTimeout(()=>this.hide(),900)}
  stop(hide=true){if(this.timer)clearInterval(this.timer);this.timer=null;this.stage=null;if(hide)this.hide()}
  hide(){this.dom.overlay.classList.add('hidden')}
}

const Internals={VERSION,MODES,SECTION_ORDER,STRUCT_SCHEMA,BANNED_CERTAINTY,normalizeHeading,parseConfidence,stripConfidence,parseEvidenceLine,textStats,validateEvidence,safeJSON,evidenceConfidenceMap,validateStructured,fallbackStructured,evidencePrompt,structurePrompt,fmtTime};
global.VisionV121Internals=Internals;
if(typeof document==='undefined')return;

const $=id=>document.getElementById(id);
let models=[],file=null,controller=null,runStarted=0,progress=null,lastDiagnostics=[];
const progressDom={overlay:$('progressOverlay'),title:$('progressTitle'),pct:$('progressPct'),bar:$('progressBar'),stage:$('progressStage'),eta:$('progressEta')};
function status(id,msg,type=''){const e=$(id);if(!e)return;e.textContent=msg;e.className='status '+type}
function logDiag(line){lastDiagnostics.push(`[${new Date().toLocaleTimeString()}] ${line}`);if(lastDiagnostics.length>80)lastDiagnostics=lastDiagnostics.slice(-80);$('diagnostics').textContent=lastDiagnostics.join('\n')}
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function modeCfg(){return MODES[$('mode').value]||MODES.turbo}
function isVision(m){return /qwen3-vl|llava|vision|gemma3/i.test(m)}
function selectedVisionModel(){return $('visionModel').value||modeCfg().model}
async function fetchJSON(url,opt={},attempts=2){
  let last;for(let i=0;i<attempts;i++){
    try{const r=await fetch(url,opt);const txt=await r.text();if([502,503,504].includes(r.status)&&i<attempts-1){last=new Error(`HTTP ${r.status}`);await new Promise(x=>setTimeout(x,700*(i+1)));continue}if(!r.ok)throw new Error(txt||`HTTP ${r.status}`);return txt?JSON.parse(txt):{}}
    catch(e){last=e;if(e.name==='AbortError')throw e;if(i<attempts-1){await new Promise(x=>setTimeout(x,700*(i+1)));continue}throw e}
  }throw last||new Error('Request failed')
}
async function apiChat(body,signal,attempts=2){return fetchJSON(API+'/chat',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body),signal,cache:'no-store'},attempts)}
function chatText(j){return String(j?.message?.content||j?.message?.thinking||'').trim()}
function fileToDataURL(f){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Could not read image.'));r.readAsDataURL(f)})}
function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Could not decode image.'));i.src=src})}
async function prepImage(f,cfg){
  const src=await fileToDataURL(f),img=await loadImage(src),nw=img.naturalWidth||img.width,nh=img.naturalHeight||img.height,scale=Math.min(1,cfg.px/Math.max(nw,nh)),w=Math.max(1,Math.round(nw*scale)),h=Math.max(1,Math.round(nh*scale)),cv=document.createElement('canvas');
  cv.width=w;cv.height=h;const c=cv.getContext('2d',{alpha:false});if(!c)throw new Error('Canvas unavailable.');c.fillStyle='#fff';c.fillRect(0,0,w,h);c.drawImage(img,0,0,w,h);const data=cv.toDataURL('image/jpeg',cfg.jpeg),b64=data.slice(data.indexOf(',')+1);if(!b64)throw new Error('Compressed image was empty.');return {src,data,b64,w,h,nw,nh}
}
async function checkConnection(){
  try{status('connStatus','Checking private Ollama connection…');const [tags,bridge]=await Promise.all([fetchJSON(API+'/tags',{cache:'no-store'},2),fetchJSON('/bridge-info',{cache:'no-store'},2)]);models=(tags.models||[]).map(x=>x.name||x.model).filter(Boolean);fillModels();const required=models.includes('qwen3:1.7b')&&models.some(m=>m==='qwen3-vl:2b-instruct'||/qwen3-vl.*2b/i.test(m));if(!required)throw new Error('Required qwen3:1.7b and qwen3-vl:2b-instruct models are not both available.');status('connStatus',`Connected · Bridge ${bridge.version||'?'} ${bridge.transport||''}`,'good');$('modelList').textContent='Models: '+models.join(' · ');return true}catch(e){status('connStatus','Connection failed: '+e.message,'bad');return false}
}
function fillModels(){
  const v=$('visionModel'),current=v.value;v.innerHTML='';const vision=models.filter(isVision).filter(m=>!/moondream/i.test(m));vision.forEach(m=>v.add(new Option(m,m)));const target=modeCfg().model;v.value=vision.includes(current)?current:(vision.find(m=>m===target)||vision.find(m=>target.includes('2b')&&/2b/i.test(m))||vision[0]||'')
}
function updateMode(){fillModels();const c=modeCfg();$('modeInfo').textContent=`${c.label}: ${c.model} at ${c.px}px · Vision budget ${c.vTok} tokens · structured budget ${c.sTok} tokens. Confidence tags prevent uncertain details from being promoted to facts. Progress/ETA learns from completed ${c.label} runs.`}
async function onFile(e){
  try{file=e.target.files?.[0]||null;$('preview').innerHTML='';if(!file){$('runBtn').disabled=true;status('runStatus','Upload an image to begin.');return}const src=await fileToDataURL(file),img=await loadImage(src);img.alt='Reference preview';$('preview').appendChild(img);$('runBtn').disabled=false;status('runStatus',`Image ready (${img.naturalWidth}×${img.naturalHeight}).`,'good')}catch(err){file=null;$('runBtn').disabled=true;status('runStatus','Upload failed: '+err.message,'bad')}
}
async function runVision(pr,cfg,signal){
  const model=selectedVisionModel();const firstPrompt=evidencePrompt($('goal').value,false);
  const run=async(prompt,tok,ctx)=>{const j=await apiChat({model,messages:[{role:'user',content:prompt,images:[pr.b64]}],stream:false,think:false,keep_alive:'5m',options:{num_predict:tok,num_ctx:ctx,temperature:0}},signal,2);return chatText(j)};
  let text=await run(firstPrompt,cfg.vTok,cfg.vCtx),v=validateEvidence(text),retried=false;logDiag(`Vision pass 1: ${v.reason}`);
  if(!v.ok){retried=true;text=await run(evidencePrompt($('goal').value,true),Math.min(cfg.vTok+150,900),Math.min(cfg.vCtx+256,3072));v=validateEvidence(text);logDiag(`Vision retry: ${v.reason}`)}
  if(!v.ok)throw new Error('Vision evidence failed quality/confidence gate after retry: '+v.reason);
  return {text,retried,stats:v.stats,model}
}
async function runStructure(evidence,cfg,signal){
  const run=async(retry,tok,ctx)=>{const j=await apiChat({model:STRUCT_MODEL,messages:[{role:'user',content:structurePrompt(evidence,retry)}],stream:false,think:false,format:STRUCT_SCHEMA,keep_alive:'5m',options:{num_predict:tok,num_ctx:ctx,temperature:0}},signal,2);return safeJSON(chatText(j))};
  let o=await run(false,cfg.sTok,cfg.sCtx),v=validateStructured(o,evidence),repaired=false;logDiag(`Structure pass 1: ${v.reason}`);
  if(!v.ok){repaired=true;o=await run(true,Math.min(cfg.sTok+450,1800),Math.min(cfg.sCtx+512,3584));v=validateStructured(o,evidence);logDiag(`Structure repair: ${v.reason}`)}
  if(!v.ok){logDiag('Using local confidence-preserving parser after two structuring attempts.');o=fallbackStructured(evidence,'Local parser used after two schema attempts ('+v.reason+').');return {output:o,repaired:true,fallback:true}}
  return {output:o,repaired,fallback:false}
}
function render(o,evidence){
  $('results').classList.remove('hidden');$('imageSummary').value=o.image_summary||'';$('reconSummary').value=o.reconstruction_summary||'';$('reconPrompt').value=o.reconstruction_prompt||'';$('rawEvidence').value=evidence||'';$('keywords').innerHTML='';
  for(const k of o.keywords||[]){const item=typeof k==='string'?{text:k,confidence:CONF_EST}:k;const b=document.createElement('span');b.className='bubble '+(item.confidence===CONF_EST?'estimated':'');b.textContent=item.text||'';b.title=item.confidence===CONF_EST?'Estimated from visible evidence':'Clearly supported by visible evidence';$('keywords').appendChild(b)}
  $('sections').innerHTML='';for(const s of o.sections||[]){const box=document.createElement('div');box.className='section';const conf=s.confidence===CONF_EST?CONF_EST:CONF_CLEAR;box.innerHTML=`<h4>${escapeHtml(s.name||'Visual detail')} <span class="confidence ${conf===CONF_EST?'estimated':'clear'}">${conf===CONF_EST?'ESTIMATED':'CLEAR'}</span></h4><p>${escapeHtml(s.summary||'')}</p>`;$('sections').appendChild(box)}
}
async function runAnalysis(){
  if(!file){status('runStatus','Choose an image first.','bad');return}if(!models.length&&!(await checkConnection()))return;
  const cfg=modeCfg();controller=new AbortController();$('runBtn').disabled=true;$('cancelBtn').disabled=false;$('results').classList.add('hidden');lastDiagnostics=[];runStarted=Date.now();progress=new ProgressTracker(progressDom,$('mode').value);
  try{
    progress.render(2,'Preparing image','CPU preprocessing',cfg.visionMs+cfg.structMs);status('runStatus','Preparing image…');const pr=await prepImage(file,cfg);logDiag(`Preprocessed ${pr.nw}×${pr.nh} → ${pr.w}×${pr.h} JPEG q=${cfg.jpeg}`);
    progress.begin('vision',7,68,`Stage 1/2 · ${selectedVisionModel()} · ${pr.w}×${pr.h}`,cfg.visionMs,cfg.structMs);status('runStatus',`Stage 1/2: confidence-aware visual evidence with ${selectedVisionModel()} (${pr.w}×${pr.h})…`);
    const vr=await runVision(pr,cfg,controller.signal);progress.finish(`Vision complete · ${vr.stats.categoryCount} categories`);logDiag(`Vision model ${vr.model}; retry=${vr.retried}; chars=${vr.stats.chars}; words=${vr.stats.words}; labels=${vr.stats.labelCount}; confidence tags=${vr.stats.confidenceCount}`);
    progress.begin('structure',68,96,`Stage 2/2 · ${STRUCT_MODEL} schema reconstruction`,cfg.structMs,0);status('runStatus',`Stage 2/2: schema reconstruction with ${STRUCT_MODEL}…`);
    const sr=await runStructure(vr.text,cfg,controller.signal);progress.finish(sr.fallback?'Local parser complete':'Structured reconstruction complete');render(sr.output,vr.text);const elapsed=Date.now()-runStarted;progress.complete(elapsed);status('runStatus',`Complete in ${fmtTime(elapsed)} · ${vr.model} → ${STRUCT_MODEL}${sr.fallback?' → local parser':''}.`,'good');logDiag(`Completed ${fmtTime(elapsed)}; structure repair=${sr.repaired}; local fallback=${sr.fallback}`)
  }catch(e){progress?.stop();if(e.name==='AbortError'){status('runStatus','Analysis cancelled.')}else{status('runStatus','Analysis failed: '+e.message,'bad');logDiag('ERROR: '+e.message)}}finally{$('runBtn').disabled=!file;$('cancelBtn').disabled=true;controller=null}
}
function cancel(){controller?.abort();progress?.stop();status('runStatus','Cancelling…')}
async function copyPrompt(){const t=$('reconPrompt').value;try{await navigator.clipboard.writeText(t);status('runStatus','Reconstruction prompt copied.','good')}catch(_){const x=document.createElement('textarea');x.value=t;document.body.appendChild(x);x.select();document.execCommand('copy');x.remove();status('runStatus','Reconstruction prompt copied.','good')}}
async function selfTest(){
  if(!models.length&&!(await checkConnection()))return;const cfg=MODES.turbo;lastDiagnostics=[];runStarted=Date.now();progress=new ProgressTracker(progressDom,'selftest');try{
    const cv=document.createElement('canvas');cv.width=128;cv.height=96;const c=cv.getContext('2d',{alpha:false});c.fillStyle='#fff';c.fillRect(0,0,128,96);c.fillStyle='#d22';c.fillRect(14,18,50,36);c.fillStyle='#2563eb';c.beginPath();c.arc(96,52,18,0,Math.PI*2);c.fill();const b64=cv.toDataURL('image/jpeg',.72).split(',')[1];
    progress.begin('vision-test',8,58,'Testing private Vision route',120000,50000);const j=await apiChat({model:cfg.model,messages:[{role:'user',content:'PLAIN TEXT ONLY. In 3 factual sentences describe the red rectangle, blue circle, and white background.',images:[b64]}],stream:false,think:false,keep_alive:'2m',options:{num_predict:180,num_ctx:1280,temperature:0}},null,2);const t=chatText(j);const sv=validateEvidence(t,{synthetic:true});if(!sv.ok)throw new Error('Synthetic Vision test failed: '+sv.reason);progress.finish('Synthetic Vision PASS');logDiag('Synthetic Vision PASS: '+t.replace(/\s+/g,' ').slice(0,220));
    progress.begin('struct-test',58,92,'Testing confidence schema',50000,0);const sample='[CLEAR] SUBJECT: One portrait subject.\n[ESTIMATED] EYES: Eye color appears light but exact hue is uncertain.\n[CLEAR] HAIR: Light hair with visible blue streaks.\n[CLEAR] WARDROBE: Cream knit sweater.\n[CLEAR] CAMERA / FRAMING: Tight portrait crop.\n[CLEAR] LIGHTING / SHADOWS: Soft warm light.\n[CLEAR] BACKGROUND / ENVIRONMENT: Warm blurred interior.';const sj=await apiChat({model:STRUCT_MODEL,messages:[{role:'user',content:structurePrompt(sample,false)}],stream:false,think:false,format:STRUCT_SCHEMA,keep_alive:'2m',options:{num_predict:650,num_ctx:2048,temperature:0}},null,2);const so=safeJSON(chatText(sj));const ss=validateStructured(so,sample);if(!ss.ok)throw new Error('Structuring self-test failed: '+ss.reason);progress.finish('Confidence schema PASS');progress.complete(Date.now()-runStarted);status('connStatus','Full V12.1 self-test PASS.','good');logDiag(`Self-test PASS · sections=${ss.sectionCount} · keywords=${ss.keywordCount}`)
  }catch(e){progress?.stop();status('connStatus','Self-test failed: '+e.message,'bad');logDiag('SELF-TEST ERROR: '+e.message)}
}

$('fileInput').addEventListener('change',onFile);$('mode').addEventListener('change',updateMode);$('checkBtn').addEventListener('click',checkConnection);$('selfTestBtn').addEventListener('click',selfTest);$('runBtn').addEventListener('click',runAnalysis);$('cancelBtn').addEventListener('click',cancel);$('copyPromptBtn').addEventListener('click',copyPrompt);
checkConnection().then(updateMode);
})(typeof window!=='undefined'?window:globalThis);
