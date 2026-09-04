(function(){
'use strict';
if(window.__UPC_AI_ROAST_V113__) return;
window.__UPC_AI_ROAST_V113__ = true;

const VERSION='V11.3 AI CREATIVE DIRECTOR';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let controller=null,lastResult=null;

const SCORE_KEYS=['overall','clarity','subject','wardrobe','pose_anatomy','camera','composition','lighting','depth_focus','material_realism','environment','narrative','fascination','model_directness'];

const ROAST_SCHEMA={
  type:'object',
  required:['intent','scores','roast','creative_direction','recommended_keywords','final_prompt','variants','avoid'],
  properties:{
    intent:{type:'object',required:['summary','preserved_requirements','assumptions'],properties:{
      summary:{type:'string'},
      preserved_requirements:{type:'array',items:{type:'string'}},
      assumptions:{type:'array',items:{type:'string'}}
    }},
    scores:{type:'object',required:SCORE_KEYS,properties:Object.fromEntries(SCORE_KEYS.map(k=>[k,{type:'integer',minimum:0,maximum:100}]))},
    roast:{type:'object',required:['strengths','weaknesses','conflicts','ambiguities','redundancies','missed_opportunities'],properties:{
      strengths:{type:'array',items:{type:'string'}},
      weaknesses:{type:'array',items:{type:'string'}},
      conflicts:{type:'array',items:{type:'string'}},
      ambiguities:{type:'array',items:{type:'string'}},
      redundancies:{type:'array',items:{type:'string'}},
      missed_opportunities:{type:'array',items:{type:'string'}}
    }},
    creative_direction:{type:'object',required:['visual_hook','viewpoint','composition','lighting','environment_story','color_strategy','texture_realism','emotion'],properties:{
      visual_hook:{type:'string'},viewpoint:{type:'string'},composition:{type:'string'},lighting:{type:'string'},environment_story:{type:'string'},color_strategy:{type:'string'},texture_realism:{type:'string'},emotion:{type:'string'}
    }},
    recommended_keywords:{type:'array',items:{type:'object',required:['category','keyword','prompt_phrase','reason','priority'],properties:{
      category:{type:'string'},keyword:{type:'string'},prompt_phrase:{type:'string'},reason:{type:'string'},priority:{type:'string',enum:['essential','strong','optional']}
    }}},
    final_prompt:{type:'string'},
    variants:{type:'object',required:['faithful','cinematic','wildcard'],properties:{faithful:{type:'string'},cinematic:{type:'string'},wildcard:{type:'string'}}},
    avoid:{type:'array',items:{type:'string'}}
  }
};

const SYSTEM_PROMPT=`You are an elite AI image prompt creative director, cinematographer, photographer, fashion stylist, production designer, lighting designer, pose/anatomy analyst, material-realism specialist, and prompt engineer.

Your job is to ROAST and REBUILD a user's rough image concept into an unusually compelling, coherent, model-ready image prompt.

PRIMARY RULE: preserve the user's core intent. Do not casually replace the subject, wardrobe, action, environment, identity requirements, or emotional idea. Improve the execution around those requirements.

Think like a world-class editorial photographer and cinematographer. A fascinating image is not created by adjective stuffing. It comes from deliberate visual decisions: viewpoint, camera distance, focal-length character, framing, foreground/midground/background layering, body language, gesture, expression, motivated light, color relationships, material texture, environmental storytelling, believable physics, and one or two memorable visual hooks.

ROAST FOR:
- vague subject or wardrobe descriptions
- physically inconsistent pose/anatomy
- conflicting lenses, camera heights, focus or motion instructions
- generic lighting
- flat composition
- no foreground depth or visual hierarchy
- missing environment/story clues
- repetitive realism buzzwords
- impossible material behavior
- overlong or internally contradictory wording
- model ambiguity

REBUILD FOR:
- a clearly dominant subject
- biologically plausible anatomy and posture
- exact garment construction when the idea calls for it
- authentic fabric tension, folds, seams, compression, gravity and material response
- natural skin texture, hair strand behavior and subtle asymmetry
- coherent camera/lens/perspective choices
- motivated lighting with clear direction and shadow logic
- foreground/midground/background depth
- controlled color strategy
- one memorable but physically plausible story detail
- no plastic skin, fake CGI sheen, or meaningless quality-token stacking

Do not pad the prompt just to make it longer. Every added phrase must change the likely image in a useful way.

Return only valid JSON matching the supplied schema.`;

function userInstruction(idea){
  const mode=$('aiRoastMode')?.value||'fascinating';
  const intensity=$('aiRoastIntensity')?.value||'3';
  const target=$('aiRoastTarget')?.value||'universal';
  const preserve=$('aiPreserveIntent')?.checked!==false;
  const extra=$('aiRoastExtra')?.value.trim()||'';
  return `USER IDEA:\n${idea}\n\nCREATIVE DIRECTION MODE: ${mode}\nCREATIVE INTENSITY: ${intensity}/4\nTARGET IMAGE MODEL: ${target}\nPRESERVE CORE INTENT: ${preserve?'YES':'NO — tasteful reinterpretation allowed'}\n${extra?`EXTRA INSTRUCTION:\n${extra}\n`:''}\n
Produce a rigorous diagnosis and the strongest physically believable image prompt you can. The final prompt should be immediately copy/paste ready. Prefer distinctive visual choices over generic "masterpiece/8k/best quality" token stuffing. For the wildcard variant, be surprising but still physically plausible and faithful to the core idea.`;
}

function css(){
  if($('aiRoastV113Style')) return;
  const s=document.createElement('style');s.id='aiRoastV113Style';s.textContent=`
  .air-card{border:1px solid #c7d2fe;background:linear-gradient(180deg,#fafaff,#fff);border-radius:20px;padding:13px;margin-bottom:12px}
  .air-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.air-title{font-size:17px;font-weight:900}.air-badge{font-size:10px;font-weight:900;background:#ede9fe;color:#6d28d9;padding:5px 8px;border-radius:999px;border:1px solid #ddd6fe}
  .air-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.air-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.air-actions button{min-height:38px}.air-actions .danger{background:#fee2e2;color:#b91c1c;border:1px solid #fecaca}
  .air-status{font-size:12px;color:#64748b;margin-top:7px}.air-status.good{color:#15803d;font-weight:800}.air-status.bad{color:#b91c1c;font-weight:800}
  .air-progress{height:7px;background:#e8edf5;border-radius:999px;overflow:hidden;margin-top:8px}.air-bar{height:100%;width:0;background:linear-gradient(90deg,#2563eb,#7c3aed,#db2777);transition:width .25s}
  .air-scores{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:10px 0}.air-score{border:1px solid #e2e8f0;border-radius:14px;padding:8px;background:#fff}.air-score b{display:block;font-size:18px}.air-score span{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.03em}
  .air-section{border:1px solid #e2e8f0;border-radius:16px;padding:10px;margin:8px 0;background:#fff}.air-section h4{margin:0 0 6px}.air-list{margin:0;padding-left:18px;font-size:12px;line-height:1.45}
  .air-bubbles{display:flex;flex-wrap:wrap;gap:6px}.air-bubble{border:1px solid #bfdbfe!important;background:#dbeafe!important;color:#1d4ed8!important;box-shadow:none!important;padding:7px 10px!important;min-height:32px!important;font-size:11px!important}.air-bubble.optional{background:#f1f5f9!important;color:#475569!important;border-color:#e2e8f0!important}.air-bubble.essential{background:#dcfce7!important;color:#166534!important;border-color:#bbf7d0!important}.air-bubble.selected{outline:3px solid rgba(37,99,235,.18)}
  .air-output{min-height:190px}.air-variant{min-height:150px}
  @media(max-width:700px){.air-grid,.air-scores{grid-template-columns:1fr}.air-actions button{flex:1}}
  `;document.head.appendChild(s);
}

function waitForRoast(cb){
  if($('sl-roast')) return cb();
  const o=new MutationObserver(()=>{if($('sl-roast')){o.disconnect();cb();}});o.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>o.disconnect(),120000);
}

async function listModels(){
  const endpoint=($('aiRoastEndpoint')?.value||'http://127.0.0.1:11434').replace(/\/$/,'');
  const st=$('aiRoastStatus');
  try{
    st.textContent='Checking local Ollama…';st.className='air-status';
    const r=await fetch(endpoint+'/api/tags',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
    const j=await r.json(),names=(j.models||[]).map(x=>x.name).filter(Boolean);
    const sel=$('aiRoastModel'),cur=sel.value;sel.innerHTML='';
    for(const n of names)sel.add(new Option(n,n));
    if(names.includes(cur))sel.value=cur;else if(names.find(n=>n.startsWith('qwen3-vl:4b')))sel.value=names.find(n=>n.startsWith('qwen3-vl:4b'));else if(names[0])sel.value=names[0];
    st.textContent=`Ollama connected · ${names.length} model${names.length===1?'':'s'} available.`;st.className='air-status good';
    return true;
  }catch(e){st.textContent='Cannot reach Ollama: '+e.message;st.className='air-status bad';return false;}
}

function cleanJson(s){
  s=String(s||'').trim();
  if(s.startsWith('```'))s=s.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)s=s.slice(a,b+1);return JSON.parse(s);
}

function progress(on){
  const bar=$('aiRoastBar'),btn=$('aiRoastRun'),cancel=$('aiRoastCancel');
  if(on){bar.style.width='18%';btn.disabled=true;cancel.disabled=false;let p=18;bar._t=setInterval(()=>{p=Math.min(88,p+Math.random()*6);bar.style.width=p+'%'},700)}
  else{clearInterval(bar._t);bar.style.width='100%';setTimeout(()=>bar.style.width='0',450);btn.disabled=false;cancel.disabled=true;}
}

function renderList(title,items){return `<div class="air-section"><h4>${esc(title)}</h4>${items?.length?`<ul class="air-list">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<div class="sl-note">None.</div>'}</div>`}

function renderResult(r){
  lastResult=r;
  const score=$('aiRoastScores');score.innerHTML=SCORE_KEYS.map(k=>`<div class="air-score"><b>${clamp(+r.scores?.[k]||0,0,100)}</b><span>${esc(k.replaceAll('_',' '))}</span></div>`).join('');
  $('aiRoastDiagnosis').innerHTML=`${renderList('Strengths',r.roast?.strengths)}${renderList('Weaknesses',r.roast?.weaknesses)}${renderList('Conflicts',r.roast?.conflicts)}${renderList('Ambiguities',r.roast?.ambiguities)}${renderList('Redundancies',r.roast?.redundancies)}${renderList('Missed opportunities',r.roast?.missed_opportunities)}`;
  const cd=r.creative_direction||{};$('aiCreativeDirection').innerHTML=`<div class="air-section"><h4>Creative Direction</h4><ul class="air-list"><li><b>Visual hook:</b> ${esc(cd.visual_hook||'')}</li><li><b>Viewpoint:</b> ${esc(cd.viewpoint||'')}</li><li><b>Composition:</b> ${esc(cd.composition||'')}</li><li><b>Lighting:</b> ${esc(cd.lighting||'')}</li><li><b>Story detail:</b> ${esc(cd.environment_story||'')}</li><li><b>Color:</b> ${esc(cd.color_strategy||'')}</li><li><b>Texture/realism:</b> ${esc(cd.texture_realism||'')}</li><li><b>Emotion:</b> ${esc(cd.emotion||'')}</li></ul></div>`;
  const kb=$('aiKeywordBubbles');kb.innerHTML='';for(const x of r.recommended_keywords||[]){const b=document.createElement('button');b.className=`air-bubble ${x.priority||''} selected`;b.dataset.phrase=x.prompt_phrase||x.keyword;b.title=`${x.category||''}: ${x.reason||''}`;b.textContent=x.keyword||x.prompt_phrase;b.onclick=()=>{b.classList.toggle('selected');rebuildFromKeywords()};kb.appendChild(b)}
  $('aiRoastFinal').value=r.final_prompt||'';$('aiVarFaithful').value=r.variants?.faithful||'';$('aiVarCinematic').value=r.variants?.cinematic||'';$('aiVarWildcard').value=r.variants?.wildcard||'';
  $('aiAvoid').value=(r.avoid||[]).join(', ');
  rebuildFromKeywords(false);
}

function rebuildFromKeywords(appendToFinal=false){
  const phrases=[...document.querySelectorAll('#aiKeywordBubbles .air-bubble.selected')].map(b=>b.dataset.phrase).filter(Boolean);
  $('aiSelectedKeywords').value=phrases.join(', ');
  if(appendToFinal&&lastResult){$('aiRoastFinal').value=[lastResult.final_prompt,...phrases].filter(Boolean).join(', ')}
}

async function runRoast(){
  const idea=$('aiRawIdea').value.trim();if(!idea){$('aiRoastStatus').textContent='Type your idea first.';$('aiRoastStatus').className='air-status bad';return;}
  const endpoint=$('aiRoastEndpoint').value.trim().replace(/\/$/,'');const model=$('aiRoastModel').value||'qwen3-vl:4b-instruct';const st=$('aiRoastStatus');
  controller=new AbortController();progress(true);st.textContent=`${model} is roasting and rebuilding your concept…`;st.className='air-status';
  try{
    const payload={model,stream:false,format:ROAST_SCHEMA,options:{temperature:0.68,top_p:0.9},messages:[{role:'system',content:SYSTEM_PROMPT},{role:'user',content:userInstruction(idea)}]};
    const r=await fetch(endpoint+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});if(!r.ok){const t=await r.text();throw new Error(`Ollama HTTP ${r.status}: ${t.slice(0,220)}`)}
    const j=await r.json(),obj=cleanJson(j.message?.content||j.response||'');renderResult(obj);st.textContent=`AI roast complete · overall ${obj.scores?.overall??'?'} · fascination ${obj.scores?.fascination??'?'}.`;st.className='air-status good';
  }catch(e){if(e.name==='AbortError'){st.textContent='AI roast cancelled.';st.className='air-status'}else{st.textContent='AI roast failed: '+e.message;st.className='air-status bad'}}finally{progress(false);controller=null;}
}

function setLive(v){const p=$('prompt');if(!p)return;p.value=v;p.dispatchEvent(new Event('input',{bubbles:true}));p.scrollIntoView({behavior:'smooth',block:'center'});}
function copyText(v){navigator.clipboard?.writeText(v).catch(()=>{});}
function useLive(){const p=$('prompt');$('aiRawIdea').value=p?.value||'';}
function useVariant(id){setLive($(id).value.trim())}

function install(){
  if($('aiRawIdea'))return;css();const panel=$('sl-roast');if(!panel)return;
  const box=document.createElement('div');box.className='air-card';box.innerHTML=`
    <div class="air-head"><div><div class="air-title">AI Prompt Roast + Creative Director</div><div class="sl-note">Type a rough idea. Your local Ollama model critiques, scores, and rebuilds it in the background.</div></div><span class="air-badge">OLLAMA AI</span></div>
    <label>My raw idea</label><textarea id="aiRawIdea" rows="6" placeholder="Example: athletic woman on a football field wearing white 3-inch volleyball spandex shorts, holding a football at sunset"></textarea>
    <div class="air-actions"><button id="aiUseLive" class="secondary">Use Current Live Prompt</button><button id="aiRoastRun" class="primary">🔥 AI Roast + Rebuild</button><button id="aiRoastCancel" class="danger" disabled>Cancel</button></div>
    <div class="air-grid" style="margin-top:9px"><div><label>Creative mode</label><select id="aiRoastMode"><option value="fascinating" selected>Maximum fascination</option><option value="cinematic">Cinematic</option><option value="photoreal">Photorealistic</option><option value="editorial">Fashion editorial</option><option value="candid">Candid / spontaneous</option><option value="balanced">Balanced</option></select></div><div><label>Creative intensity</label><select id="aiRoastIntensity"><option value="1">1 — restrained</option><option value="2">2 — polished</option><option value="3" selected>3 — bold</option><option value="4">4 — fearless but plausible</option></select></div></div>
    <div class="air-grid"><div><label>Target image model</label><select id="aiRoastTarget"><option value="universal" selected>Universal</option><option>Grok Imagine</option><option>Flux</option><option>Midjourney</option><option>Seedream</option><option>Nano Banana</option><option>Stable Diffusion</option></select></div><div><label>Ollama model</label><select id="aiRoastModel"><option>qwen3-vl:4b-instruct</option></select></div></div>
    <div class="air-grid"><div><label>Ollama address</label><input id="aiRoastEndpoint" value="http://127.0.0.1:11434"></div><div style="display:flex;align-items:end"><button id="aiRoastConnect" class="secondary" style="width:100%">Check Ollama</button></div></div>
    <label style="display:flex;align-items:center;gap:7px;margin-top:8px"><input id="aiPreserveIntent" type="checkbox" checked style="width:auto"> Preserve my core intent</label>
    <label>Extra direction (optional)</label><textarea id="aiRoastExtra" rows="2" placeholder="Example: prioritize unusual camera perspective and environmental storytelling, but keep the wardrobe exact."></textarea>
    <div id="aiRoastStatus" class="air-status">Ready. Ollama is only called when you press AI Roast + Rebuild.</div><div class="air-progress"><div id="aiRoastBar" class="air-bar"></div></div>
    <div id="aiRoastScores" class="air-scores"></div>
    <div id="aiRoastDiagnosis"></div><div id="aiCreativeDirection"></div>
    <div class="air-section"><h4>Recommended database/prompt keywords</h4><div id="aiKeywordBubbles" class="air-bubbles"></div><textarea id="aiSelectedKeywords" rows="3" readonly placeholder="Selected prompt phrases"></textarea><div class="air-actions"><button id="aiSearchKeywords" class="secondary">Search These in Database</button></div></div>
    <label>Final rebuilt prompt</label><textarea id="aiRoastFinal" class="air-output" placeholder="AI-built final prompt appears here."></textarea>
    <div class="air-actions"><button id="aiUseFinal" class="primary">Use Final as Live Prompt</button><button id="aiAppendFinal" class="secondary">Append Final to Live Prompt</button><button id="aiCopyFinal" class="secondary">Copy Final</button></div>
    <div class="air-grid" style="margin-top:10px"><div><label>Faithful variant</label><textarea id="aiVarFaithful" class="air-variant"></textarea><button id="aiUseFaithful" class="secondary">Use Faithful</button></div><div><label>Cinematic variant</label><textarea id="aiVarCinematic" class="air-variant"></textarea><button id="aiUseCinematic" class="secondary">Use Cinematic</button></div></div>
    <label>Wildcard variant</label><textarea id="aiVarWildcard" class="air-variant"></textarea><button id="aiUseWildcard" class="secondary">Use Wildcard</button>
    <label style="margin-top:9px">Avoid / negative guidance</label><textarea id="aiAvoid" rows="3" readonly></textarea>
  `;
  panel.insertBefore(box,panel.firstChild);
  $('aiUseLive').onclick=useLive;$('aiRoastRun').onclick=runRoast;$('aiRoastCancel').onclick=()=>controller?.abort();$('aiRoastConnect').onclick=listModels;
  $('aiUseFinal').onclick=()=>setLive($('aiRoastFinal').value.trim());$('aiAppendFinal').onclick=()=>{const p=$('prompt');setLive([p?.value.trim(),$('aiRoastFinal').value.trim()].filter(Boolean).join(', '))};$('aiCopyFinal').onclick=()=>copyText($('aiRoastFinal').value);
  $('aiUseFaithful').onclick=()=>useVariant('aiVarFaithful');$('aiUseCinematic').onclick=()=>useVariant('aiVarCinematic');$('aiUseWildcard').onclick=()=>useVariant('aiVarWildcard');
  $('aiSearchKeywords').onclick=()=>{const q=$('aiSelectedKeywords').value.trim();const s=$('search');if(s&&q){s.value=q;s.dispatchEvent(new Event('input',{bubbles:true}));s.scrollIntoView({behavior:'smooth',block:'center'})}};
  setTimeout(listModels,500);
}

waitForRoast(install);
})();
