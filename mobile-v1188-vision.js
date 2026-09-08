/* Ultimate Prompt Creator V11.8.8 Safari-Safe Vision */
(function(){
'use strict';

document.title='Ultimate Prompt Creator V11.8.8 Safari Vision';
const badge=document.querySelector('.badge');
if(badge) badge.textContent='V11.8.8 SAFARI VISION';

const $v88=id=>document.getElementById(id);
const state88={file:null,originalDataURL:'',base64:'',controller:null,result:null,selected:new Set()};
const PERF88={
  turbo:{px:896,q:.82,vTok:1800,vCtx:4096,sTok:2200,sCtx:4096},
  balanced:{px:1152,q:.86,vTok:2800,vCtx:6144,sTok:3400,sCtx:6144},
  extreme:{px:1400,q:.90,vTok:4200,vCtx:8192,sTok:5000,sCtx:8192}
};
const CONF88=['CLEARLY_VISIBLE','HIGHLY_PROBABLE','ESTIMATED','CANNOT_VERIFY'];

const SYN_SCHEMA88={
  type:'object',additionalProperties:false,
  required:['image_summary','reconstruction_summary','sections'],
  properties:{
    image_summary:{type:'string'},
    reconstruction_summary:{type:'string'},
    sections:{type:'array',minItems:6,maxItems:24,items:{
      type:'object',additionalProperties:false,required:['section','items'],
      properties:{
        section:{type:'string'},
        items:{type:'array',minItems:1,maxItems:7,items:{
          type:'object',additionalProperties:false,required:['keyword','description','confidence','evidence','prompt_phrase'],
          properties:{
            keyword:{type:'string'},description:{type:'string'},
            confidence:{type:'string',enum:CONF88},
            evidence:{type:'string'},prompt_phrase:{type:'string'}
          }
        }}
      }
    }}
  }
};

function status88(msg,type=''){
  const e=$v88('vStatus');if(!e)return;e.textContent=msg;e.className='status '+type;
}
function parseJSON88(s){
  s=String(s||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)s=s.slice(a,b+1);
  return JSON.parse(s);
}
function errorText88(txt,status){
  try{const j=JSON.parse(txt);return String(j.error?.message||j.error||j.message||('HTTP '+status))}
  catch(_){return (txt||('HTTP '+status)).slice(0,1400)}
}
async function api88(path,body=null,signal=null){
  const opt={method:body?'POST':'GET',headers:{Accept:'application/json'},cache:'no-store',signal};
  if(body){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}
  const r=await fetch('/ollama/api'+path,opt);const txt=await r.text();
  if(!r.ok)throw new Error(errorText88(txt,r.status));
  try{return txt?JSON.parse(txt):{}}catch(_){throw new Error('Invalid JSON from Ollama: '+txt.slice(0,500))}
}
function readAsDataURL88(file){
  return new Promise((resolve,reject)=>{
    if(!(file instanceof Blob)){reject(new Error('Selected image is not a valid File/Blob.'));return}
    const fr=new FileReader();
    fr.onload=()=>resolve(String(fr.result||''));
    fr.onerror=()=>reject(new Error('Safari could not read the selected image.'));
    fr.readAsDataURL(file);
  });
}
function loadImage88(dataURL){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error('Safari could not decode this image format. Try JPEG, PNG, or WebP.'));
    img.src=dataURL;
  });
}
async function prepareImage88(file,profileName){
  const p=PERF88[profileName]||PERF88.turbo;
  const original=await readAsDataURL88(file);
  const img=await loadImage88(original);
  const nw=img.naturalWidth||img.width,nh=img.naturalHeight||img.height;
  if(!nw||!nh)throw new Error('Image dimensions could not be read.');
  const scale=Math.min(1,p.px/Math.max(nw,nh));
  const w=Math.max(1,Math.round(nw*scale)),h=Math.max(1,Math.round(nh*scale));
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const ctx=cv.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('Canvas is unavailable in this browser.');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
  let processed;
  try{processed=cv.toDataURL('image/jpeg',p.q)}catch(e){throw new Error('Safari image compression failed: '+e.message)}
  const comma=processed.indexOf(',');
  if(comma<0)throw new Error('Compressed image could not be converted to base64.');
  const base64=processed.slice(comma+1);
  if(!base64)throw new Error('Compressed image base64 is empty.');
  return {original,processed,base64,width:w,height:h,originalWidth:nw,originalHeight:nh};
}
function visionModel88(){return $v88('vModel')?.value||''}
function textModel88(){
  const d=$v88('dModel')?.value;
  if(d && !/qwen3-vl|llava|vision|gemma3/i.test(d))return d;
  const modelText=$v88('models')?.textContent||'';
  if(modelText.includes('qwen3:1.7b'))return 'qwen3:1.7b';
  if(modelText.includes('qwen3:4b'))return 'qwen3:4b';
  return d||'';
}
function rawPrompt88(){
  const goal=$v88('vGoal')?.value.trim()||'Reverse-engineer this image for faithful AI image recreation.';
  return `${goal}\n\nPerform a strict visual forensic analysis. Record only details that are supported by visible evidence. Do not identify the person. Do not infer biography, ethnicity, occupation, brand, exact camera model, exact focal length, or hidden anatomy unless visibly supported.\n\nPay special attention to: subject count and apparent adult age range; facial structure; eye appearance; brows; nose; lips; skin texture and finish; hair color, highlights, roots, length, part, texture and styling; visible makeup; body build and proportions; wardrobe construction, color, fit, seams, neckline, sleeves, fabric texture and folds; jewelry/accessories; pose; head angle; gaze; hands; visible nails; camera framing and angle; perspective; depth of field; composition; foreground/background; environment; lighting direction and softness; shadows; reflections; dominant colors; visible objects/text; material realism and imperfections.\n\nReturn ONLY JSON with this shape:\n{"image_summary":"concise factual overview","facts":[{"section":"Hair","fact":"specific visible detail","confidence":"CLEARLY_VISIBLE","evidence":"what visibly supports the observation"}]}\n\nUse 24-60 useful facts depending on how much is actually visible. Confidence must be one of CLEARLY_VISIBLE, HIGHLY_PROBABLE, ESTIMATED, CANNOT_VERIFY. Prefer CLEARLY_VISIBLE. No markdown.`;
}
async function extractFacts88(model,base64,p,signal){
  const body={model,messages:[{role:'user',content:rawPrompt88(),images:[base64]}],stream:false,think:false,keep_alive:'30m',options:{temperature:0,num_predict:p.vTok,num_ctx:p.vCtx}};
  const errors=[];
  for(const mode of ['json','plain']){
    try{
      const b={...body};if(mode==='json')b.format='json';
      const j=await api88('/chat',b,signal);
      const raw=parseJSON88(j.message?.content||'');
      if(!Array.isArray(raw.facts)||!raw.facts.length)throw new Error('Vision returned no fact list.');
      return raw;
    }catch(e){if(e.name==='AbortError')throw e;errors.push(mode+': '+e.message)}
  }
  throw new Error('Vision extraction failed — '+errors.join(' | '));
}
function synthPrompt88(raw){
  return `You are converting a visual-forensics fact list into a faithful AI image reconstruction specification. Preserve only supported details; do not invent missing information. Group related facts into useful sections. Create concise prompt-ready phrases that describe what is visibly supported. Keep uncertainty labels.\n\nRAW VISUAL FACTS:\n${JSON.stringify(raw)}\n\nReturn a detailed reconstruction object matching the provided JSON schema. Make the reconstruction_summary explain framing, subject presentation, lighting, and environment. Each keyword must be a real descriptive label, never placeholders such as "short label", "test", "example", or "prompt phrase".`;
}
async function synthesize88(raw,p,signal){
  const model=textModel88();
  if(!model)return fallback88(raw);
  const body={model,messages:[{role:'user',content:synthPrompt88(raw)}],stream:false,think:false,format:SYN_SCHEMA88,keep_alive:'30m',options:{temperature:.15,num_predict:p.sTok,num_ctx:p.sCtx}};
  try{
    const j=await api88('/chat',body,signal);const o=parseJSON88(j.message?.content||'');
    if(!Array.isArray(o.sections)||!o.sections.length)throw new Error('Synthesis returned no sections.');
    return o;
  }catch(e){
    if(e.name==='AbortError')throw e;
    return fallback88(raw,'Text synthesis fallback used: '+e.message);
  }
}
function fallback88(raw,note=''){
  const groups=new Map();
  for(const f of raw.facts||[]){
    const section=String(f.section||'Visual details');if(!groups.has(section))groups.set(section,[]);
    const fact=String(f.fact||'').trim();if(!fact)continue;
    groups.get(section).push({keyword:fact.split(/[,.;]/)[0].trim().slice(0,58)||section,description:fact,confidence:CONF88.includes(f.confidence)?f.confidence:'ESTIMATED',evidence:String(f.evidence||''),prompt_phrase:fact});
  }
  return {image_summary:String(raw.image_summary||''),reconstruction_summary:(note?note+' ':'')+'Faithful reconstruction using only the visually supported observations extracted from the reference.',sections:[...groups].map(([section,items])=>({section,items:items.slice(0,7)})).slice(0,24)};
}
function rebuildPrompt88(){
  const phrases=[...document.querySelectorAll('#vSections .bubble.selected')].map(b=>b.dataset.p).filter(Boolean);
  const intro=state88.result?.reconstruction_summary?.trim();
  $v88('vPrompt').value=[intro,phrases.join(', ')].filter(Boolean).join('\n\n');
}
function render88(result){
  state88.result=result;state88.selected.clear();
  $v88('vResults')?.classList.remove('hidden');
  if($v88('vSummary'))$v88('vSummary').value=result.image_summary||'';
  if($v88('vRecon'))$v88('vRecon').value=result.reconstruction_summary||'';
  const root=$v88('vSections');if(!root)return;root.innerHTML='';
  (result.sections||[]).forEach((s,si)=>{
    const box=document.createElement('div');box.className='section';
    const h=document.createElement('h3');h.textContent=s.section||'Visual details';box.appendChild(h);
    const wrap=document.createElement('div');wrap.className='bubbles';box.appendChild(wrap);
    (s.items||[]).forEach((x,ii)=>{
      const b=document.createElement('button');b.type='button';b.className='bubble';b.dataset.c=x.confidence||'ESTIMATED';b.dataset.p=x.prompt_phrase||x.description||x.keyword||'';
      b.title=[x.description,x.evidence].filter(Boolean).join(' — ');b.textContent=x.keyword||x.prompt_phrase||x.description||'detail';
      if(['CLEARLY_VISIBLE','HIGHLY_PROBABLE'].includes(x.confidence)){b.classList.add('selected');state88.selected.add(si+'-'+ii)}
      b.onclick=()=>{b.classList.toggle('selected');rebuildPrompt88()};wrap.appendChild(b);
    });root.appendChild(box);
  });
  rebuildPrompt88();
}
async function onFile88(e){
  try{
    const file=e.target.files?.[0]||null;state88.file=file;state88.originalDataURL='';state88.base64='';state88.result=null;
    const preview=$v88('vPreview');if(preview)preview.innerHTML='';
    if(!file){if($v88('vRun'))$v88('vRun').disabled=true;status88('Upload a photo.');return}
    status88('Reading image with Safari-safe FileReader…');
    const dataURL=await readAsDataURL88(file);state88.originalDataURL=dataURL;
    const img=await loadImage88(dataURL);img.alt='Reference preview';
    if(preview)preview.appendChild(img);
    if($v88('vRun'))$v88('vRun').disabled=false;
    status88(`Image ready (${img.naturalWidth}×${img.naturalHeight}). No object URL used.`,'good');
  }catch(err){state88.file=null;if($v88('vRun'))$v88('vRun').disabled=true;status88('Upload failed: '+err.message,'bad')}
}
async function run88(){
  if(!state88.file){status88('Choose an image first.','bad');return}
  const model=visionModel88();if(!model){status88('No vision model is selected.','bad');return}
  const perfName=$v88('vPerf')?.value||'turbo',p=PERF88[perfName]||PERF88.turbo;
  state88.controller=new AbortController();if($v88('vRun'))$v88('vRun').disabled=true;if($v88('vCancel'))$v88('vCancel').disabled=false;
  try{
    status88('Safari-safe preprocessing…');
    const prepared=await prepareImage88(state88.file,perfName);state88.base64=prepared.base64;
    status88(`Visual extraction with ${model} (${prepared.width}×${prepared.height})…`);
    const raw=await extractFacts88(model,prepared.base64,p,state88.controller.signal);
    status88('Building detailed reconstruction…');
    const result=await synthesize88(raw,p,state88.controller.signal);render88(result);
    status88(`Vision complete. ${raw.facts?.length||0} grounded observations extracted.`,'good');
  }catch(err){status88(err.name==='AbortError'?'Cancelled.':'Failed: '+err.message,'bad')}
  finally{if($v88('vRun'))$v88('vRun').disabled=!state88.file;if($v88('vCancel'))$v88('vCancel').disabled=true;state88.controller=null}
}
async function diag88(){
  const model=visionModel88();if(!model){status88('Select a vision model first.','bad');return}
  try{
    status88('Running synthetic Safari-safe Vision diagnostic…');
    const cv=document.createElement('canvas');cv.width=320;cv.height=320;const c=cv.getContext('2d',{alpha:false});c.fillStyle='#fff';c.fillRect(0,0,320,320);c.fillStyle='#d00';c.fillRect(55,70,210,160);c.fillStyle='#000';c.beginPath();c.arc(160,250,32,0,Math.PI*2);c.fill();
    const b64=cv.toDataURL('image/jpeg',.82).split(',')[1];
    const j=await api88('/chat',{model,messages:[{role:'user',content:'Briefly describe the dominant shapes and colors in this synthetic test image.',images:[b64]}],stream:false,think:false,keep_alive:'5m',options:{num_predict:120,num_ctx:2048,temperature:0}});
    const text=String(j.message?.content||'').trim();if(!text)throw new Error('Vision model returned no final content.');
    status88('Vision diagnostic PASS: '+text.slice(0,220),'good');
  }catch(e){status88('Vision diagnostic failed: '+e.message,'bad')}
}

const input=$v88('vFile');if(input){input.onchange=null;input.addEventListener('change',onFile88)}
const run=$v88('vRun');if(run)run.onclick=run88;
const cancel=$v88('vCancel');if(cancel)cancel.onclick=()=>state88.controller?.abort();
if(run?.parentElement && !$v88('vDiag88')){const b=document.createElement('button');b.id='vDiag88';b.type='button';b.className='secondary';b.textContent='Test Vision';b.onclick=diag88;run.parentElement.insertBefore(b,cancel||null)}
const modelsLine=$v88('models');if(modelsLine&&!modelsLine.dataset.vision88){modelsLine.dataset.vision88='1';modelsLine.textContent=(modelsLine.textContent?modelsLine.textContent+' · ':'')+'Vision V11.8.8 FileReader/DataURL';}
})();
