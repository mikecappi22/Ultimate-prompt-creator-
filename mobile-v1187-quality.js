/* Ultimate Prompt Creator V11.8.7 Director Quality Engine */
(function(){
'use strict';

document.title='Ultimate Prompt Creator V11.8.7 Quality Director';
const badge=document.querySelector('.badge'); if(badge) badge.textContent='V11.8.7 QUALITY DIRECTOR';

const $q=id=>document.getElementById(id);
const SCORE_KEYS87=['overall','clarity','subject','wardrobe','pose_anatomy','camera','composition','lighting','material_realism','environment','fascination'];
const BANNED87=/^(short label|label|test|keyword|prompt phrase|prompt-ready phrase|example|placeholder)$/i;
let directorCtl87=null;

const DIRECTOR_SCHEMA87={
  type:'object',
  additionalProperties:false,
  required:['scores','creative_direction','keywords','final_prompt'],
  properties:{
    scores:{
      type:'object',additionalProperties:false,required:SCORE_KEYS87,
      properties:Object.fromEntries(SCORE_KEYS87.map(k=>[k,{type:'integer',minimum:1,maximum:100}]))
    },
    creative_direction:{type:'string'},
    keywords:{
      type:'array',minItems:8,maxItems:14,
      items:{
        type:'object',additionalProperties:false,required:['keyword','prompt_phrase'],
        properties:{keyword:{type:'string'},prompt_phrase:{type:'string'}}
      }
    },
    final_prompt:{type:'string'}
  }
};

function status87(id,msg,type=''){const e=$q(id);if(!e)return;e.textContent=msg;e.className='status '+type}
function parse87(s){
  s=String(s||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)s=s.slice(a,b+1);
  return JSON.parse(s)
}
function apiError87(txt,status){try{const j=JSON.parse(txt);return String(j.error?.message||j.error||j.message||('HTTP '+status))}catch(_){return (txt||('HTTP '+status)).slice(0,1400)}}
async function api87(path,body,signal){
  const r=await fetch('/ollama/api'+path,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},cache:'no-store',signal,body:JSON.stringify(body)});
  const txt=await r.text();if(!r.ok)throw new Error(apiError87(txt,r.status));
  try{return JSON.parse(txt)}catch(_){throw new Error('Invalid JSON envelope from Ollama: '+txt.slice(0,500))}
}
function isVision87(m){return /qwen3-vl|llava|vision|gemma3/i.test(m)}
function availableModels87(){
  const set=new Set();
  try{(window.models||[]).forEach(m=>set.add(m))}catch(_){}
  const d=$q('dModel');if(d)[...d.options].forEach(o=>set.add(o.value));
  return [...set].filter(Boolean)
}
function preferredText87(){
  const a=availableModels87();
  return a.find(m=>m==='qwen3:1.7b')||a.find(m=>m==='qwen3:4b')||a.find(m=>!isVision87(m))||''
}
function perf87(){
  const v=$q('dPerf')?.value||'turbo';
  if(v==='maximum')return {tok:3200,ctx:8192,temp:.50};
  if(v==='balanced')return {tok:2300,ctx:6144,temp:.42};
  return {tok:1800,ctx:4096,temp:.34}
}
function rawIdea87(){return ($q('idea')?.value||'').trim()}
function prompt87(){
  const idea=rawIdea87(),mode=$q('dMode')?.value||'balanced',target=$q('dTarget')?.value||'Universal',extra=($q('dExtra')?.value||'').trim()||'none';
  return `Act as an elite AI image-prompt creative director and prompt engineer. Analyze the RAW IDEA first, then rebuild it into one detailed production-ready image prompt.\n\nRAW IDEA:\n${idea}\n\nCREATIVE MODE: ${mode}\nTARGET IMAGE MODEL: ${target}\nEXTRA DIRECTION: ${extra}\n\nRULES:\n1. Preserve every explicit user fact. Never silently change subject traits, colors, clothing, action, count, or relationships.\n2. Scores evaluate the RAW IDEA before enhancement. Return an integer 1-100 for every score field. A missing camera/lighting/environment should score low-to-moderate, never zero.\n3. Produce 8-14 CONCRETE recommended keywords. Each keyword must be a real visual, camera, lighting, material, pose, composition, environment, realism, or styling concept appropriate to this exact idea. Never output words such as short label, label, test, keyword, prompt phrase, example, or placeholder.\n4. Each prompt_phrase must be immediately usable inside an image prompt and must be more specific than its keyword label.\n5. Creative direction should be 3-5 concise sentences explaining the strongest visual strategy and what was missing from the raw idea.\n6. The final prompt must be approximately 170-300 words for Turbo/Balanced and may be longer for Maximum. It should specify subject, visible appearance, clothing/material construction, pose/action, environment, camera/framing/angle/lens, composition, lighting, depth, physical realism, texture, and natural imperfections where relevant.\n7. Do not pad with vague phrases such as high quality, realistic materials, visual hierarchy, masterpiece, best quality, 8K, or stunning. Convert those ideas into observable photographic details instead.\n8. If the user did not specify an environment, you MAY choose one only when it clearly strengthens the selected creative mode. Make it specific and coherent, not generic. Do not invent identity facts, tattoos, logos, body measurements, or hidden details.\n9. Return JSON only. No markdown and no commentary outside the JSON object.`
}
function normalizeScores87(o){
  o.scores=o.scores||{};
  for(const k of SCORE_KEYS87){let n=Number(o.scores[k]);if(!Number.isFinite(n)||n<1)n=35;if(n>100)n=100;o.scores[k]=Math.round(n)}
}
function issues87(o){
  const issues=[];
  if(!o||typeof o!=='object')return ['output is not an object'];
  if(!o.scores||SCORE_KEYS87.some(k=>!Number.isFinite(Number(o.scores[k]))||Number(o.scores[k])<1||Number(o.scores[k])>100))issues.push('all 11 scores must be integers from 1 to 100');
  const kw=Array.isArray(o.keywords)?o.keywords:[];
  if(kw.length<8)issues.push('fewer than 8 keywords');
  if(kw.some(x=>BANNED87.test(String(x?.keyword||'').trim())||BANNED87.test(String(x?.prompt_phrase||'').trim())))issues.push('placeholder keyword text detected');
  const unique=new Set(kw.map(x=>String(x?.keyword||'').toLowerCase().trim()).filter(Boolean));if(unique.size<Math.min(8,kw.length))issues.push('keywords are repetitive');
  if(String(o.creative_direction||'').trim().length<120)issues.push('creative direction is too thin');
  const fp=String(o.final_prompt||'').trim();if(fp.length<700)issues.push('final prompt is too short');
  if(/\b(short label|prompt-ready phrase|placeholder)\b/i.test(fp))issues.push('placeholder language leaked into final prompt');
  return issues
}
async function schemaCall87(userPrompt,model,p,signal){
  const j=await api87('/chat',{model,messages:[{role:'user',content:userPrompt}],stream:false,think:false,format:DIRECTOR_SCHEMA87,keep_alive:'30m',options:{num_predict:p.tok,num_ctx:p.ctx,temperature:p.temp}},signal);
  return parse87(j.message?.content||'')
}
async function repair87(previous,problems,model,p,signal){
  const fixPrompt=`Repair the JSON below. It failed these quality checks:\n- ${problems.join('\n- ')}\n\nRAW IDEA:\n${rawIdea87()}\n\nPREVIOUS JSON:\n${JSON.stringify(previous)}\n\nRewrite the entire object, not just the broken fields. Preserve every explicit fact from the raw idea. Use all 11 score keys with values 1-100, 8-14 concrete non-placeholder keywords, a 3-5 sentence creative direction, and a detailed 170-300 word final prompt. Avoid generic filler. Return JSON only.`;
  return schemaCall87(fixPrompt,model,{tok:Math.max(p.tok,2200),ctx:Math.max(p.ctx,6144),temp:.30},signal)
}
function render87(o,mode){
  normalizeScores87(o);
  $q('dResults')?.classList.remove('hidden');
  const scores=$q('dScores');if(scores)scores.innerHTML=SCORE_KEYS87.map(k=>`<div class="score"><b>${o.scores[k]}</b><span>${k.replaceAll('_',' ')}</span></div>`).join('');
  if($q('dDirection'))$q('dDirection').value=o.creative_direction||'';
  const bubbles=$q('dBubbles');if(bubbles){bubbles.innerHTML='';for(const x of (o.keywords||[])){if(!x||BANNED87.test(String(x.keyword||'').trim()))continue;const b=document.createElement('button');b.className='bubble selected';b.dataset.p=x.prompt_phrase||x.keyword;b.textContent=x.keyword||x.prompt_phrase;b.title=x.prompt_phrase||'';b.onclick=()=>b.classList.toggle('selected');bubbles.appendChild(b)}}
  if($q('dFinal'))$q('dFinal').value=o.final_prompt||'';
  status87('dStatus','Creative Director complete · validated '+mode+'.','good')
}
async function director87(){
  if(!rawIdea87()){status87('dStatus','Type an idea first.','bad');return}
  let model=$q('dModel')?.value||preferredText87();
  if(!model||isVision87(model)){model=preferredText87();if(model&&$q('dModel'))$q('dModel').value=model}
  if(!model||isVision87(model)){status87('dStatus','A dedicated text model is required. Run the V11.8.6/11.8.7 Windows setup so qwen3:1.7b is installed.','bad');return}
  directorCtl87=new AbortController();window.dCtl=directorCtl87;
  if($q('dRun'))$q('dRun').disabled=true;if($q('dCancel'))$q('dCancel').disabled=false;
  status87('dStatus','Creative Director is analyzing and rebuilding your idea…');
  try{
    const p=perf87();let o=await schemaCall87(prompt87(),model,p,directorCtl87.signal);let problems=issues87(o),mode='schema pass';
    if(problems.length){status87('dStatus','Quality check caught '+problems.length+' issue'+(problems.length===1?'':'s')+' — repairing automatically…');o=await repair87(o,problems,model,p,directorCtl87.signal);problems=issues87(o);mode='schema + auto-repair'}
    normalizeScores87(o);
    if(problems.length){
      // Do not throw away an otherwise usable result. Remove obvious placeholders and report remaining soft warnings.
      o.keywords=(Array.isArray(o.keywords)?o.keywords:[]).filter(x=>x&&!BANNED87.test(String(x.keyword||'').trim())&&!BANNED87.test(String(x.prompt_phrase||'').trim()));
      render87(o,mode+'; '+problems.length+' soft warning'+(problems.length===1?'':'s'));
    }else render87(o,mode)
  }catch(e){status87('dStatus',e.name==='AbortError'?'Cancelled.':'Director failed: '+e.message,'bad')}
  finally{if($q('dRun'))$q('dRun').disabled=false;if($q('dCancel'))$q('dCancel').disabled=true;directorCtl87=null;window.dCtl=null}
}

if($q('dRun'))$q('dRun').onclick=director87;
if($q('dCancel'))$q('dCancel').onclick=()=>directorCtl87?.abort();

// Upgrade the visible self-test name without replacing the transport test implementation.
const st=$q('selftest1184');if(st)st.textContent='Run V11.8.7 Full Self-Test';
})();
