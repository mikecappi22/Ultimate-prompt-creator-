/* Ultimate Prompt Creator V11.8.4 self-healing patch */
(function(){
'use strict';

document.title='Ultimate Prompt Creator V11.8.4 Self-Healing Mobile';
const badge=document.querySelector('.badge'); if(badge) badge.textContent='V11.8.4 SELF-HEALING MOBILE';

const diag=document.createElement('div');
diag.id='diag1184';diag.className='status';diag.style.cssText='font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#0f172a;color:#dbeafe;border-radius:14px;padding:10px;margin-top:9px;white-space:pre-wrap;max-height:260px;overflow:auto;display:none';
const connCard=document.getElementById('conn')?.closest('.card');
if(connCard){
  const actions=connCard.querySelector('.actions');
  const st=document.createElement('button');st.id='selftest1184';st.className='success';st.textContent='Run Full Self-Test';
  actions?.insertBefore(st,actions.children[1]||null);
  connCard.appendChild(diag);
}

const DP1184={turbo:{tok:900,ctx:3072,temp:.35},balanced:{tok:1400,ctx:4096,temp:.45},maximum:{tok:2200,ctx:6144,temp:.55}};

function errText1184(txt,status){
  try{const j=JSON.parse(txt);return j.error?.message||j.error||j.message||`HTTP ${status}`}
  catch(_){return (txt||`HTTP ${status}`).slice(0,900)}
}
async function api1184(path,body=null,signal=null){
  const opt={method:body?'POST':'GET',headers:{Accept:'application/json'},cache:'no-store',signal};
  if(body){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}
  const r=await fetch('/ollama/api'+path,opt),txt=await r.text();
  if(!r.ok)throw new Error(errText1184(txt,r.status));
  try{return txt?JSON.parse(txt):{}}catch(_){throw new Error('Invalid JSON from Ollama: '+txt.slice(0,300))}
}
function isVision1184(m){return /qwen3-vl|llava|vision|gemma3/i.test(m)}
function pickText1184(){
  return models.find(m=>m==='qwen3:1.7b')||models.find(m=>m==='qwen3:4b')||models.find(m=>!isVision1184(m))||models[0]||''
}
function pickVision1184(){
  return models.find(m=>/qwen3-vl.*2b/i.test(m))||models.find(m=>/qwen3-vl.*4b/i.test(m))||models.find(isVision1184)||models[0]||''
}
function fillModels1184(){
  const d=document.getElementById('dModel'),v=document.getElementById('vModel'); if(!d||!v)return;
  d.innerHTML='';v.innerHTML='';
  const text=models.filter(m=>!isVision1184(m));(text.length?text:models).forEach(m=>d.add(new Option(m,m)));
  const vis=models.filter(isVision1184);(vis.length?vis:models).forEach(m=>v.add(new Option(m,m)));
  const tm=pickText1184(),vm=pickVision1184();
  if([...d.options].some(o=>o.value===tm))d.value=tm;
  if([...v.options].some(o=>o.value===vm))v.value=vm;
}
async function check1184(){
  try{
    setStatus('conn','Checking private Ollama connection…');
    const j=await api1184('/tags');
    models=(j.models||[]).map(x=>x.name||x.model).filter(Boolean);
    fillModels1184();
    const tm=pickText1184();
    const note=tm&&isVision1184(tm)?' (warning: no dedicated text model installed)':'';
    setStatus('conn','Connected to Ollama on your Windows PC.'+note,tm&&isVision1184(tm)?'':'good');
    document.getElementById('models').textContent=models.length?'Models: '+models.join(' · '):'No models installed.';
    return true
  }catch(e){setStatus('conn','Connection failed: '+e.message,'bad');return false}
}
async function warm1184(){
  if(!models.length&&!(await check1184()))return;
  setStatus('conn','Warming models…');
  for(const m of [...new Set([document.getElementById('dModel').value,document.getElementById('vModel').value].filter(Boolean))]){
    try{await api1184('/generate',{model:m,prompt:'Reply READY',stream:false,keep_alive:'30m',options:{num_predict:4,num_ctx:1024,temperature:0}})}catch(_){}
  }
  setStatus('conn','Models warmed.','good')
}
async function selfTest1184(){
  const out=[];diag.style.display='block';diag.textContent='Running full self-test…';
  try{
    const tags=await api1184('/tags');out.push('✓ private bridge + /api/tags');
    models=(tags.models||[]).map(x=>x.name||x.model).filter(Boolean);fillModels1184();
    const tm=pickText1184();if(!tm)throw new Error('No model installed');
    out.push('Text model: '+tm);
    const g=await api1184('/generate',{model:tm,prompt:'Reply with exactly OK /no_think',stream:false,keep_alive:'5m',options:{num_predict:16,num_ctx:1024,temperature:0}});
    out.push('✓ /api/generate plain: '+String(g.response||'').trim().slice(0,60));
    try{
      const gj=await api1184('/generate',{model:tm,prompt:'Return only JSON: {"ok":true} /no_think',stream:false,format:'json',keep_alive:'5m',options:{num_predict:64,num_ctx:1024,temperature:0}});
      cleanJSON(gj.response||'');out.push('✓ /api/generate JSON mode')
    }catch(e){out.push('! generate JSON fallback needed: '+e.message)}
    try{
      const c=await api1184('/chat',{model:tm,messages:[{role:'user',content:'Reply with exactly OK'}],stream:false,keep_alive:'5m',options:{num_predict:16,num_ctx:1024,temperature:0}});
      out.push('✓ /api/chat plain: '+String(c.message?.content||'').trim().slice(0,60))
    }catch(e){out.push('! chat plain unavailable: '+e.message)}
    setStatus('conn','Full self-test passed enough checks for mobile use.','good')
  }catch(e){out.push('✗ '+e.message);setStatus('conn','Self-test found a problem: '+e.message,'bad')}
  diag.textContent=out.join('\n')
}

function directorPrompt1184(){
  return `You are an elite AI image prompt creative director. Preserve the user's core intent while making it visually specific, realistic and fascinating. Improve camera, composition, lighting, pose, wardrobe/material realism, environmental storytelling and visual hierarchy. Avoid generic quality-token stuffing.

USER IDEA:
${document.getElementById('idea').value.trim()}

MODE: ${document.getElementById('dMode').value}
TARGET MODEL: ${document.getElementById('dTarget').value}
EXTRA: ${document.getElementById('dExtra').value.trim()||'none'}

Return ONLY one JSON object using this exact shape:
{"scores":{"overall":0,"clarity":0,"subject":0,"wardrobe":0,"pose_anatomy":0,"camera":0,"composition":0,"lighting":0,"material_realism":0,"environment":0,"fascination":0},"creative_direction":"short diagnosis and direction","keywords":[{"keyword":"short label","prompt_phrase":"prompt-ready phrase"}],"final_prompt":"one polished copy/paste-ready image prompt"}
Use 8-14 keyword items. No markdown. /no_think`
}
async function textJSON1184(prompt,model,perf,signal){
  const p=DP1184[perf]||DP1184.turbo,attempts=[
    ['generate-json',async()=>{const j=await api1184('/generate',{model,prompt,stream:false,format:'json',keep_alive:'30m',options:{num_predict:p.tok,num_ctx:p.ctx,temperature:p.temp}},signal);return cleanJSON(j.response||'')}],
    ['chat-json',async()=>{const j=await api1184('/chat',{model,messages:[{role:'user',content:prompt}],stream:false,format:'json',think:false,keep_alive:'30m',options:{num_predict:p.tok,num_ctx:p.ctx,temperature:p.temp}},signal);return cleanJSON(j.message?.content||'')}],
    ['generate-plain',async()=>{const j=await api1184('/generate',{model,prompt,stream:false,keep_alive:'30m',options:{num_predict:p.tok,num_ctx:p.ctx,temperature:p.temp}},signal);return cleanJSON(j.response||'')}]
  ];let errs=[];
  for(const [name,fn] of attempts){try{return {data:await fn(),mode:name}}catch(e){if(e.name==='AbortError')throw e;errs.push(name+': '+e.message)}}
  throw new Error(errs.join(' | '))
}
async function dRun1184(){
  const idea=document.getElementById('idea').value.trim();if(!idea){setStatus('dStatus','Type an idea first.','bad');return}
  if(!models.length&&!(await check1184()))return;
  dCtl=new AbortController();document.getElementById('dRun').disabled=true;document.getElementById('dCancel').disabled=false;setStatus('dStatus','Creative Director is rebuilding your idea…');
  try{
    const r=await textJSON1184(directorPrompt1184(),document.getElementById('dModel').value,document.getElementById('dPerf').value,dCtl.signal),o=r.data;
    document.getElementById('dResults').classList.remove('hidden');
    document.getElementById('dScores').innerHTML=scoreKeys.map(k=>`<div class="score"><b>${Number(o.scores?.[k]||0)}</b><span>${k.replaceAll('_',' ')}</span></div>`).join('');
    document.getElementById('dDirection').value=o.creative_direction||'';document.getElementById('dBubbles').innerHTML='';
    for(const x of o.keywords||[]){const b=document.createElement('button');b.className='bubble selected';b.dataset.p=x.prompt_phrase||x.keyword;b.textContent=x.keyword||x.prompt_phrase;b.onclick=()=>b.classList.toggle('selected');document.getElementById('dBubbles').appendChild(b)}
    document.getElementById('dFinal').value=o.final_prompt||'';setStatus('dStatus','Creative Director complete via '+r.mode+'.','good')
  }catch(e){setStatus('dStatus',e.name==='AbortError'?'Cancelled.':'Failed: '+e.message,'bad')}
  finally{document.getElementById('dRun').disabled=false;document.getElementById('dCancel').disabled=true;dCtl=null}
}

function visionPrompt1184(){
  return `${document.getElementById('vGoal').value.trim()}

Return ONLY JSON:
{"image_summary":"concise factual summary","facts":[{"section":"Subject","fact":"visually supported detail","confidence":"CLEARLY_VISIBLE","evidence":"what in the image supports it"}]}
Use sections such as Subject, Face, Hair, Skin, Body, Wardrobe, Fabric, Accessories, Pose, Hands, Camera, Composition, Lighting, Environment, Color, Material realism, Text/objects when applicable.
Confidence must be CLEARLY_VISIBLE, HIGHLY_PROBABLE, ESTIMATED, or CANNOT_VERIFY.
Do not identify the person or invent hidden details. No markdown.`
}
async function visionJSON1184(model,b64,p,signal){
  const attempts=[
    async()=>{const j=await api1184('/chat',{model,messages:[{role:'user',content:visionPrompt1184(),images:[b64]}],stream:false,format:'json',keep_alive:'30m',options:{temperature:0,num_predict:p.vTok,num_ctx:p.ctx}},signal);return cleanJSON(j.message?.content||'')},
    async()=>{const j=await api1184('/chat',{model,messages:[{role:'user',content:visionPrompt1184(),images:[b64]}],stream:false,keep_alive:'30m',options:{temperature:0,num_predict:p.vTok,num_ctx:p.ctx}},signal);return cleanJSON(j.message?.content||'')}
  ];let errs=[];for(const fn of attempts){try{return await fn()}catch(e){if(e.name==='AbortError')throw e;errs.push(e.message)}}throw new Error(errs.join(' | '))
}
function synthPrompt1184(raw){
  return `Convert these visually grounded facts into prompt-ready reconstruction language. Do not add unsupported details.

FACTS:
${JSON.stringify(raw)}

Return ONLY JSON:
{"image_summary":"factual summary","reconstruction_summary":"short reconstruction strategy","sections":[{"section":"Subject","items":[{"keyword":"short label","prompt_phrase":"prompt-ready phrase","confidence":"CLEARLY_VISIBLE"}]}]}
Keep confidence labels from the facts. No markdown. /no_think`
}
async function vRun1184(){
  if(!vFile)return;if(!models.length&&!(await check1184()))return;
  vCtl=new AbortController();document.getElementById('vRun').disabled=true;document.getElementById('vCancel').disabled=false;setStatus('vStatus','Preparing image…');
  try{
    if(!vB64)vB64=await compress(vFile);const p=VP[document.getElementById('vPerf').value];
    setStatus('vStatus','Visual extraction…');const raw=await visionJSON1184(document.getElementById('vModel').value,vB64,p,vCtl.signal);
    setStatus('vStatus','Building keyword reconstruction…');
    const perf=document.getElementById('vPerf').value==='extreme'?'maximum':document.getElementById('vPerf').value;
    const r=await textJSON1184(synthPrompt1184(raw),document.getElementById('dModel').value||pickText1184(),perf,vCtl.signal);
    vResult=r.data;renderVision();setStatus('vStatus','Vision analysis complete.','good')
  }catch(e){setStatus('vStatus',e.name==='AbortError'?'Cancelled.':'Failed: '+e.message,'bad')}
  finally{document.getElementById('vRun').disabled=false;document.getElementById('vCancel').disabled=true;vCtl=null}
}

document.getElementById('check').onclick=check1184;
document.getElementById('warm').onclick=warm1184;
document.getElementById('selftest1184').onclick=selfTest1184;
document.getElementById('dRun').onclick=dRun1184;
document.getElementById('vRun').onclick=vRun1184;

check1184();
})();
