/* Ultimate Prompt Creator V11.8.5 permanent Qwen3 hotfix */
(function(){
'use strict';

document.title='Ultimate Prompt Creator V11.8.5 Permanent Mobile';
const badge=document.querySelector('.badge'); if(badge) badge.textContent='V11.8.5 PERMANENT MOBILE';

const $x=id=>document.getElementById(id);
const scoreKeys85=['overall','clarity','subject','wardrobe','pose_anatomy','camera','composition','lighting','material_realism','environment','fascination'];
let ctl85=null;

function set85(id,msg,type=''){const e=$x(id);if(!e)return;e.textContent=msg;e.className='status '+type}
function err85(txt,status){try{const j=JSON.parse(txt);return String(j.error?.message||j.error||j.message||('HTTP '+status))}catch(_){return (txt||('HTTP '+status)).slice(0,1200)}}
async function api85(path,body=null,signal=null){
  const opt={method:body?'POST':'GET',headers:{Accept:'application/json'},cache:'no-store',signal};
  if(body){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}
  const r=await fetch('/ollama/api'+path,opt),txt=await r.text();
  if(!r.ok)throw new Error(err85(txt,r.status));
  try{return txt?JSON.parse(txt):{}}catch(_){throw new Error('Invalid JSON from Ollama: '+txt.slice(0,500))}
}
function parse85(s){s=String(s||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)s=s.slice(a,b+1);return JSON.parse(s)}
function isVis85(m){return /qwen3-vl|llava|vision|gemma3/i.test(m)}
function textModel85(){return (window.models||[]).find(m=>m==='qwen3:1.7b')||(window.models||[]).find(m=>m==='qwen3:4b')||(window.models||[]).find(m=>!isVis85(m))||''}
function visionModel85(){return (window.models||[]).find(m=>/qwen3-vl.*2b/i.test(m))||(window.models||[]).find(m=>/qwen3-vl.*4b/i.test(m))||(window.models||[]).find(isVis85)||''}
function refill85(){
  const d=$x('dModel'),v=$x('vModel');if(!d||!v)return;
  const all=window.models||[],text=all.filter(m=>!isVis85(m)),vis=all.filter(isVis85);
  d.innerHTML='';(text.length?text:all).forEach(m=>d.add(new Option(m,m)));
  v.innerHTML='';(vis.length?vis:all).forEach(m=>v.add(new Option(m,m)));
  const tm=textModel85(),vm=visionModel85();if(tm)d.value=tm;if(vm)v.value=vm;
}
async function check85(){
  try{set85('conn','Checking private Ollama connection…');const j=await api85('/tags');window.models=(j.models||[]).map(x=>x.name||x.model).filter(Boolean);refill85();const tm=textModel85();if(!tm)throw new Error('Dedicated text model missing. Run the V11.8.5 Windows repair.');set85('conn','Connected to Ollama on your Windows PC. Text model: '+tm,'good');if($x('models'))$x('models').textContent='Models: '+window.models.join(' · ');return true}catch(e){set85('conn','Connection/model check failed: '+e.message,'bad');return false}
}
async function warm85(){
  if(!(await check85()))return;set85('conn','Warming models…');
  for(const m of [...new Set([$x('dModel')?.value,$x('vModel')?.value].filter(Boolean))]){
    try{await api85('/chat',{model:m,messages:[{role:'user',content:'Reply READY'}],stream:false,think:false,keep_alive:'30m',options:{num_predict:24,num_ctx:1024,temperature:0}})}catch(_){}
  }
  set85('conn','Models warmed and kept loaded.','good')
}
const PERF85={turbo:{tok:1100,ctx:3072,temp:.35},balanced:{tok:1700,ctx:4096,temp:.45},maximum:{tok:2600,ctx:6144,temp:.55}};
async function textJson85(prompt,model,perf,signal){
  const p=PERF85[perf]||PERF85.turbo,tries=[
    ['chat-json',async()=>{const j=await api85('/chat',{model,messages:[{role:'user',content:prompt}],stream:false,think:false,format:'json',keep_alive:'30m',options:{num_predict:p.tok,num_ctx:p.ctx,temperature:p.temp}},signal);return parse85(j.message?.content||'')}],
    ['generate-json',async()=>{const j=await api85('/generate',{model,prompt,stream:false,think:false,format:'json',keep_alive:'30m',options:{num_predict:p.tok,num_ctx:p.ctx,temperature:p.temp}},signal);return parse85(j.response||'')}],
    ['chat-plain',async()=>{const j=await api85('/chat',{model,messages:[{role:'user',content:prompt}],stream:false,think:false,keep_alive:'30m',options:{num_predict:p.tok,num_ctx:p.ctx,temperature:p.temp}},signal);return parse85(j.message?.content||'')}],
    ['generate-plain',async()=>{const j=await api85('/generate',{model,prompt,stream:false,think:false,keep_alive:'30m',options:{num_predict:p.tok,num_ctx:p.ctx,temperature:p.temp}},signal);return parse85(j.response||'')}]
  ];const errors=[];for(const [name,fn] of tries){try{return {data:await fn(),mode:name}}catch(e){if(e.name==='AbortError')throw e;errors.push(name+': '+e.message)}}throw new Error(errors.join(' | '))
}
function directorPrompt85(){return `You are an elite AI image prompt creative director. Preserve the user's core idea while making it visually specific, physically believable, realistic, and compelling. Improve camera choice, composition, lighting, subject pose, wardrobe and material realism, environmental storytelling, depth, and visual hierarchy. Avoid generic quality-token stuffing.\n\nUSER IDEA:\n${$x('idea').value.trim()}\n\nMODE: ${$x('dMode').value}\nTARGET MODEL: ${$x('dTarget').value}\nEXTRA DIRECTION: ${$x('dExtra').value.trim()||'none'}\n\nReturn ONLY JSON in this exact shape:\n{"scores":{"overall":0,"clarity":0,"subject":0,"wardrobe":0,"pose_anatomy":0,"camera":0,"composition":0,"lighting":0,"material_realism":0,"environment":0,"fascination":0},"creative_direction":"short diagnosis and direction","keywords":[{"keyword":"short label","prompt_phrase":"prompt-ready phrase"}],"final_prompt":"one polished copy/paste-ready image prompt"}\nUse 8-14 useful keyword items. No markdown.`}
async function director85(){
  const idea=$x('idea')?.value.trim();if(!idea){set85('dStatus','Type an idea first.','bad');return}
  if(!(await check85()))return;const model=$x('dModel').value||textModel85();if(isVis85(model)){set85('dStatus','Director requires the text model qwen3:1.7b. Run the V11.8.5 repair.','bad');return}
  ctl85=new AbortController();window.dCtl=ctl85;$x('dRun').disabled=true;$x('dCancel').disabled=false;set85('dStatus','Creative Director is rebuilding your idea…');
  try{const r=await textJson85(directorPrompt85(),model,$x('dPerf').value,ctl85.signal),o=r.data;$x('dResults').classList.remove('hidden');$x('dScores').innerHTML=scoreKeys85.map(k=>`<div class="score"><b>${Number(o.scores?.[k]||0)}</b><span>${k.replaceAll('_',' ')}</span></div>`).join('');$x('dDirection').value=o.creative_direction||'';$x('dBubbles').innerHTML='';for(const x of o.keywords||[]){const b=document.createElement('button');b.className='bubble selected';b.dataset.p=x.prompt_phrase||x.keyword;b.textContent=x.keyword||x.prompt_phrase;b.onclick=()=>b.classList.toggle('selected');$x('dBubbles').appendChild(b)}$x('dFinal').value=o.final_prompt||'';set85('dStatus','Creative Director complete via '+r.mode+'.','good')}
  catch(e){set85('dStatus',e.name==='AbortError'?'Cancelled.':'Failed: '+e.message,'bad')}
  finally{$x('dRun').disabled=false;$x('dCancel').disabled=true;ctl85=null;window.dCtl=null}
}
async function self85(){
  let d=$x('diag1184');if(!d){d=document.createElement('div');d.id='diag1184';d.className='status';($x('conn')?.closest('.card')||document.body).appendChild(d)}d.style.display='block';const out=[];d.textContent='Running V11.8.5 production-path self-test…';
  try{const j=await api85('/tags');window.models=(j.models||[]).map(x=>x.name||x.model).filter(Boolean);refill85();out.push('✓ private bridge GET /api/tags');const tm=textModel85();if(!tm)throw new Error('qwen3:1.7b not installed');out.push('✓ text model '+tm);
    const c=await api85('/chat',{model:tm,messages:[{role:'user',content:'Reply with exactly OK'}],stream:false,think:false,keep_alive:'5m',options:{num_predict:64,num_ctx:1024,temperature:0}});const ct=String(c.message?.content||'').trim();if(!ct)throw new Error('Chat returned no final content; thinking length='+String(c.message?.thinking||'').length);out.push('✓ chat think:false: '+ct.slice(0,80));
    const g=await api85('/generate',{model:tm,prompt:'Reply with exactly OK',stream:false,think:false,keep_alive:'5m',options:{num_predict:64,num_ctx:1024,temperature:0}});const gt=String(g.response||'').trim();out.push(gt?'✓ generate think:false: '+gt.slice(0,80):'! generate returned empty; Director will use chat primary');
    const probe=await textJson85('Return ONLY JSON: {"scores":{"overall":88},"creative_direction":"ok","keywords":[{"keyword":"test","prompt_phrase":"test phrase"}],"final_prompt":"test prompt"}',tm,'turbo',null);if(!probe.data?.final_prompt)throw new Error('Director JSON probe missing final_prompt');out.push('✓ Director production JSON: '+probe.mode);set85('conn','V11.8.5 full production-path self-test PASSED.','good')
  }catch(e){out.push('✗ '+e.message);set85('conn','V11.8.5 self-test failed: '+e.message,'bad')}d.textContent=out.join('\n')
}

async function vision85(){
  if(!window.vFile)return;if(!(await check85()))return;const vm=$x('vModel').value||visionModel85();if(!vm){set85('vStatus','No vision model installed.','bad');return}
  window.vCtl=new AbortController();$x('vRun').disabled=true;$x('vCancel').disabled=false;set85('vStatus','Preparing image…');
  try{if(!window.vB64)window.vB64=await window.compress(window.vFile);const p=window.VP[$x('vPerf').value];const prompt=`${$x('vGoal').value.trim()}\n\nReturn ONLY JSON: {"image_summary":"concise factual summary","facts":[{"section":"Subject","fact":"visually supported detail","confidence":"CLEARLY_VISIBLE","evidence":"visible evidence"}]}. Use useful sections for face, hair, wardrobe, pose, camera, lighting and environment. No markdown.`;let raw=null,errs=[];for(const fmt of ['json',null]){try{const body={model:vm,messages:[{role:'user',content:prompt,images:[window.vB64]}],stream:false,think:false,keep_alive:'30m',options:{temperature:0,num_predict:p.vTok,num_ctx:p.ctx}};if(fmt)body.format=fmt;const j=await api85('/chat',body,window.vCtl.signal);raw=parse85(j.message?.content||'');break}catch(e){errs.push(e.message)}}if(!raw)throw new Error('Vision extraction failed: '+errs.join(' | '));set85('vStatus','Building reconstruction…');const synth=`Convert these visually grounded facts into prompt-ready reconstruction language. Do not invent unsupported details. FACTS: ${JSON.stringify(raw)} Return ONLY JSON: {"image_summary":"summary","reconstruction_summary":"strategy","sections":[{"section":"Subject","items":[{"keyword":"label","prompt_phrase":"prompt phrase","confidence":"CLEARLY_VISIBLE"}]}]}. No markdown.`;const r=await textJson85(synth,textModel85(),$x('vPerf').value==='extreme'?'maximum':$x('vPerf').value,window.vCtl.signal);window.vResult=r.data;window.renderVision();set85('vStatus','Vision analysis complete.','good')}
  catch(e){set85('vStatus',e.name==='AbortError'?'Cancelled.':'Failed: '+e.message,'bad')}
  finally{$x('vRun').disabled=false;$x('vCancel').disabled=true;window.vCtl=null}
}

if($x('check'))$x('check').onclick=check85;
if($x('warm'))$x('warm').onclick=warm85;
if($x('selftest1184')){$x('selftest1184').textContent='Run V11.8.5 Full Self-Test';$x('selftest1184').onclick=self85}
if($x('dRun'))$x('dRun').onclick=director85;
if($x('dCancel'))$x('dCancel').onclick=()=>ctl85?.abort();
if($x('vRun'))$x('vRun').onclick=vision85;
check85();
})();
