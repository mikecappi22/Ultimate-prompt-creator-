/* UPC V18.20 FINAL PROMPT COMPOSER 2.0 — single authoritative output composer. */
(function(g){'use strict';if(g.__UPC_V1820_COMPOSER__)return;g.__UPC_V1820_COMPOSER__=1;

const VERSION='18.20';
const $=id=>document.getElementById(id);
const FIELD_IDS={
 hair:'uc_hair', makeup:'uc_makeup', expression:'uc_expression', nails:'uc_nails',
 top:'uc_top', bottom:'uc_bottom', footwear:'uc_footwear', accessories:'uc_accessories',
 pose:'uc_pose', scene:'uc_scene', environment:'uc_environment', camera:'uc_camera',
 lighting:'uc_lighting', realism:'uc_realism', constraints:'uc_constraints'
};
const OUTPUT_ORDER=['hair','makeup','expression','nails','top','bottom','footwear','accessories','pose','scene','environment','camera','lighting','realism','constraints'];
const PRESET_MAP={
 'Seedance':'Seedance Multi-Shot Video',
 'Grok Imagine':'Grok Imagine Realism',
 'Midjourney':'Midjourney Raw Photo',
 'Nano Banana':'Nano Banana Edit / Identity Lock'
};

function val(id){return String($(id)?.value||'').trim()}
function norm(s){return String(s||'').toLowerCase().replace(/[\s,;:.\-–—_/]+/g,' ').trim()}
function esc(s){return String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m))}
function unique(values){const seen=new Set;const out=[];for(const raw of values){const s=String(raw||'').trim();if(!s)continue;const k=norm(s);if(!k||seen.has(k))continue;seen.add(k);out.push(s)}return out}
function linesOf(s){return String(s||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)}
function joinUnique(values,sep='\n'){return unique(values.flatMap(linesOf)).join(sep)}
function selections(){const o={};for(const [k,id] of Object.entries(FIELD_IDS))o[k]=val(id);o.target=val('uc_target')||'Universal';o.aspect=val('uc_aspect')||'2:3';return o}

function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch(_){return fallback}}
function activeSubject(){
 const st=readJSON('upc_create_flow_v160',{})||{};
 const list=readJSON('upc_subject_vault_v131',[])||[];
 const activeId=st.subjectId||localStorage.getItem('upc_subject_vault_active_v131');
 return Array.isArray(list)?(list.find(x=>x&&x.id===activeId)||list[0]||null):null;
}
function subjectLock(){
 const direct=val('uc_subject_lock')||val('subjectLock')||val('subject-lock');if(direct)return direct;
 const s=activeSubject();
 if(s){
  const fn=g.SubjectVaultV143Internals?.buildLock||g.SubjectVaultV142Internals?.buildLock;
  if(typeof fn==='function'){try{const t=String(fn(s,'full')||'').trim();if(t)return t}catch(_){}}
  const lines=[`Use ${String(s.name||'the selected subject')} as the locked subject identity.`];
  const pairs=[['FACE',s.face],['EYES',s.eyes],['HAIR IDENTITY',s.hair],['SKIN',s.skin],['BODY / PROPORTIONS',s.body],['DISTINGUISHING FEATURES',s.distinguishing],['CONTINUITY',s.continuity]];
  for(const [k,v] of pairs)if(String(v||'').trim())lines.push(`${k}: ${String(v).trim()}`);
  lines.push('Preserve recognizable facial geometry, apparent adult age, natural asymmetry, proportions, and distinguishing details. Do not invent unsupported biography or unseen traits.');
  return lines.join('\n');
 }
 const id=val('uc_subject')||val('uc_subjectId');
 return id?`Use ${id} as the locked subject identity. Preserve recognizable facial geometry, apparent adult age, eye appearance, skin tone, hair identity, body proportions, and natural asymmetry.`:'';
}

function platformPresets(){return g.UPCV1819Presets&&typeof g.UPCV1819Presets==='object'?g.UPCV1819Presets:{}}
function defaultPresetForTarget(target){return PRESET_MAP[target]||''}
function presetText(name){const p=platformPresets()[name];return p?String(p.text||'').trim():''}

function fieldEntries(s){
 return {
  beauty:unique([s.hair&&`HAIR: ${s.hair}`,s.makeup&&`MAKEUP: ${s.makeup}`,s.expression&&`EXPRESSION: ${s.expression}`,s.nails&&`NAILS: ${s.nails}`]),
  wardrobe:unique([s.top&&`TOP: ${s.top}`,s.bottom&&`BOTTOM: ${s.bottom}`,s.footwear&&`FOOTWEAR: ${s.footwear}`,s.accessories&&`ACCESSORIES: ${s.accessories}`]),
  pose:unique([s.pose]), scene:unique([s.scene]), environment:unique([s.environment]),
  camera:unique([s.camera]), lighting:unique([s.lighting]), realism:unique([s.realism]), constraints:unique([s.constraints])
 };
}

function contradictionWarnings(s,preset=''){
 const w=[];const cam=norm(s.camera),light=norm(s.lighting),env=norm(s.environment+' '+s.scene),cons=norm(s.constraints),pre=norm(preset);
 const has=(txt,a)=>a.some(x=>txt.includes(norm(x)));
 if(has(cam,['deep focus'])&&has(cam,['shallow depth','shallow focus']))w.push('Camera requests both deep focus and shallow depth of field.');
 if(has(cam,['static camera','locked off','lock-off'])&&has(cam,['handheld','tracking','orbit','dolly','crane','pan ','tilt ','push-in','pull-back']))w.push('Camera mixes a locked/static shot with active camera movement.');
 if(has(env,['night','midnight'])&&has(light,['midday sunlight','morning sunlight','golden-hour sunlight','golden hour sunlight']))w.push('Scene/environment reads as night while lighting requests daylight/sunlight.');
 if(has(env,['midday','noon'])&&has(light,['blue-hour','blue hour','moonlit']))w.push('Environment reads as midday while lighting requests blue-hour/moonlit light.');
 if(has(cons,['no artificial portrait blur','no portrait mode'])&&has(cam,['portrait mode','artificial portrait blur']))w.push('Camera requests portrait-mode/artificial blur that the constraints reject.');
 if(has(cons,['no random background people','single subject only','one subject only'])&&has(env,['crowd','busy crowd','packed','group of people']))w.push('Subject-count constraints conflict with a crowd-heavy scene/environment.');
 if(has(cons,['no text','no readable text'])&&has(env,['signage','store sign','logo','billboard']))w.push('Text constraints may conflict with visible signage in the environment.');
 if(pre.includes('video')&&s.target==='Universal')w.push('A video-oriented preset is selected while target model is Universal.');
 return unique(w);
}

function completeness(s,lock){
 const groups=[
  !!lock,
  !!(s.top||s.bottom||s.footwear||s.accessories),
  !!s.pose,
  !!(s.scene||s.environment),
  !!s.camera,
  !!s.lighting,
  !!s.realism,
  !!s.constraints
 ];
 return Math.round(groups.filter(Boolean).length/groups.length*100);
}

function section(title,items){const body=joinUnique(items);return body?`[${title}]\n${body}`:''}
function compactPieces(s,lock,preset){
 const e=fieldEntries(s);return unique([
  lock,
  ...e.beauty,...e.wardrobe,...e.pose,...e.scene,...e.environment,...e.camera,...e.lighting,...e.realism,...e.constraints,
  preset,
  'physically believable photographic rendering; coherent anatomy, lighting, materials, reflections, contact shadows, and subject continuity'
 ]);
}
function buildStructured(opts={}){
 const s=selections();const lock=subjectLock();const presetName=opts.presetName??val('v1820_preset');const preset=presetText(presetName);const e=fieldEntries(s);
 const blocks=[];
 blocks.push(section('GENERATION GOAL',[`Create a ${opts.mediaType||val('v1820_media')||'photographic'} result using the selected UPC settings.`,`TARGET MODEL: ${s.target}`,`ASPECT RATIO: ${s.aspect}`]));
 if(lock)blocks.push(section('SUBJECT LOCK',[lock]));
 if(e.beauty.length)blocks.push(section('HAIR & BEAUTY',e.beauty));
 if(e.wardrobe.length)blocks.push(section('WARDROBE',e.wardrobe));
 if(e.pose.length)blocks.push(section('POSE / ACTION',e.pose));
 if(e.scene.length)blocks.push(section('SCENE / CONCEPT',e.scene));
 if(e.environment.length)blocks.push(section('ENVIRONMENT',e.environment));
 if(e.camera.length)blocks.push(section('CAMERA',e.camera));
 if(e.lighting.length)blocks.push(section('LIGHTING',e.lighting));
 if(e.realism.length)blocks.push(section('REALISM / TEXTURE',e.realism));
 if(e.constraints.length)blocks.push(section('CONSTRAINTS / NEGATIVE RULES',e.constraints));
 if(preset)blocks.push(section('PLATFORM FINISHING PRESET',[preset]));
 blocks.push(section('FINAL CONSISTENCY LOCK',['Keep subject identity, wardrobe, pose mechanics, environment, camera logic, lighting direction, material response, reflections, shadows, and anatomy mutually coherent. Preserve natural human micro-imperfections. Do not introduce unrequested objects, people, accessories, tattoos, piercings, text, or identity changes.']));
 return unique(blocks).join('\n\n').trim();
}
function buildCompact(opts={}){
 const s=selections();const lock=subjectLock();const presetName=opts.presetName??val('v1820_preset');const preset=presetText(presetName);
 return compactPieces(s,lock,preset).join(', ').replace(/\s+/g,' ').trim();
}
function build(opts={}){return (opts.format||val('v1820_format')||'Structured')==='Compact'?buildCompact(opts):buildStructured(opts)}

function copy(text){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve()}
function findFinalCard(){const cards=[...document.querySelectorAll('#panel-create .uc-step,#panel-create .uc160-card')];return cards.find(c=>/^8\./.test((c.querySelector('h3,h2')?.textContent||'').trim()))||cards[cards.length-1]||document.querySelector('#panel-create')}
function hideLegacyOutput(card){
 const old=$('final171');if(old){old.style.display='none';old.dataset.retiredBy='v18.20'}
 const preview=$('ucPreview');if(preview)preview.style.display='none';
 ['ucCopy','ucWorkspace','ucDirector','ucLibrary'].forEach(id=>{const e=$(id);if(e)e.style.display='none'});
 const oldAction=$('ucCopy')?.closest('.uc-actions');if(oldAction)oldAction.style.display='none';
}
function syncNative(text){const n=$('ucPreview')||$('uc_final_prompt')||$('uc_prompt');if(n){n.value=text;n.dispatchEvent(new Event('input',{bubbles:true}))}}
function sendWorkspace(text){const w=$('workspace')||$('promptWorkspace')||$('prompt-workspace');if(w){w.value=text;w.dispatchEvent(new Event('input',{bubbles:true}))}g.UPCShowPanel?.('prompt')}
function sendDirector(text){const d=$('directorInput')||$('director-input')||$('idea')||$('aiRawIdea')||document.querySelector('#panel-director textarea');if(d){d.value=text;d.dispatchEvent(new Event('input',{bubbles:true}))}document.querySelector('[data-nav="director"]')?.click();g.UPCShowPanel?.('director')}

function mount(){
 const card=findFinalCard();if(!card)return setTimeout(mount,300);if($('v1820_composer'))return;
 hideLegacyOutput(card);
 const box=document.createElement('div');box.id='v1820_composer';box.style.cssText='margin-top:12px;border:1px solid #cbd5e1;border-radius:16px;padding:14px;background:#fff';
 const presets=platformPresets(),target=val('uc_target')||'Universal',auto=defaultPresetForTarget(target);
 box.innerHTML=`<div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><b style="font-size:18px">Final Prompt Composer 2.0</b><div style="color:#64748b;font-size:11px;margin-top:2px">Single authoritative output engine — orders sections, removes exact duplicates, checks contradictions, and applies platform finishing presets.</div></div><div id="v1820_score" style="font-weight:900;font-size:23px">0%</div></div>
 <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px">
  <div><label style="font-weight:800;font-size:11px">Format</label><select id="v1820_format" style="width:100%"><option>Structured</option><option>Compact</option></select></div>
  <div><label style="font-weight:800;font-size:11px">Media</label><select id="v1820_media" style="width:100%"><option>photographic image</option><option>cinematic video</option></select></div>
  <div><label style="font-weight:800;font-size:11px">Platform preset</label><select id="v1820_preset" style="width:100%"><option value="">None / Universal</option>${Object.keys(presets).map(n=>`<option value="${esc(n)}" ${n===auto?'selected':''}>${esc(n)}</option>`).join('')}</select></div>
 </div>
 <div id="v1820_warn" style="margin-top:10px"></div>
 <textarea id="v1820_text" style="width:100%;min-height:390px;box-sizing:border-box;margin-top:10px;padding:11px;border:1px solid #cbd5e1;border-radius:11px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:1.45"></textarea>
 <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"><button id="v1820_build" type="button">Build / Refresh</button><button id="v1820_copy" type="button">Copy Prompt</button><button id="v1820_workspace" type="button">Use in Workspace</button><button id="v1820_director" type="button">Send to Director</button><button id="v1820_save" type="button">Save Last Prompt</button></div>`;
 card.appendChild(box);
 box.querySelectorAll('button').forEach((b,i)=>{b.style.cssText=`border:0;border-radius:9px;padding:9px 12px;font-weight:800;${i===0?'background:#1d4ed8;color:white':'background:#e2e8f0;color:#0f172a'}`});
 box.querySelectorAll('select').forEach(e=>e.style.cssText+=';padding:8px;border:1px solid #cbd5e1;border-radius:8px;background:white');
 function refresh(){
  const t=build();$('v1820_text').value=t;syncNative(t);
  const s=selections(),lock=subjectLock(),pre=presetText(val('v1820_preset')),warnings=contradictionWarnings(s,pre),score=completeness(s,lock);
  $('v1820_score').textContent=score+'%';
  $('v1820_warn').innerHTML=warnings.length?`<div style="padding:9px;border:1px solid #f59e0b;border-radius:10px;background:#fffbeb"><b>Check ${warnings.length} possible conflict${warnings.length===1?'':'s'}:</b><br>${warnings.map(x=>'• '+esc(x)).join('<br>')}</div>`:`<div style="padding:9px;border:1px solid #bbf7d0;border-radius:10px;background:#f0fdf4;color:#166534"><b>Composer healthy:</b> no obvious contradictions detected.</div>`;
  g.UPCV1820Last={text:t,score,warnings,preset:val('v1820_preset'),format:val('v1820_format'),target:s.target,aspect:s.aspect};
  return t;
 }
 $('v1820_build').onclick=refresh;$('v1820_copy').onclick=()=>copy(refresh());$('v1820_workspace').onclick=()=>sendWorkspace(refresh());$('v1820_director').onclick=()=>sendDirector(refresh());$('v1820_save').onclick=()=>{const t=refresh();localStorage.setItem('upc_last_final_prompt_v1820',t);localStorage.setItem('upc_last_final_prompt_v1820_meta',JSON.stringify(g.UPCV1820Last));const b=$('v1820_save');b.textContent='Saved';setTimeout(()=>b.textContent='Save Last Prompt',1000)};
 ['v1820_format','v1820_media','v1820_preset'].forEach(id=>$(id).addEventListener('change',refresh));
 Object.values(FIELD_IDS).concat(['uc_target','uc_aspect','uc_subjectId','uc_subject_lock']).forEach(id=>{const e=$(id);if(e){e.addEventListener('input',()=>queueMicrotask(refresh));e.addEventListener('change',()=>queueMicrotask(refresh))}});
 if(g.UPCV1818Stack?.build){const stackBtn=document.createElement('button');stackBtn.type='button';stackBtn.textContent='Apply Smart Stack';stackBtn.style.cssText='border:0;border-radius:9px;padding:9px 12px;font-weight:800;background:#312e81;color:#fff';stackBtn.onclick=()=>{const mode=Object.keys(g.UPCV1818Stack.modes||{})[0]||'RAW iPhone Realism';const extra=g.UPCV1818Stack.build(mode,{});const r=$('uc_realism');if(r&&extra){r.value=unique([r.value,extra]).join(', ');r.dispatchEvent(new Event('input',{bubbles:true}))}};box.querySelector('div:last-child').appendChild(stackBtn)}
 refresh();
 g.UPCV1820Composer={version:VERSION,build,buildStructured,buildCompact,selections,subjectLock,contradictionWarnings,completeness,refresh};
 console.log('[UPC V18.20 Final Prompt Composer 2.0] mounted');
}
function boot(){setTimeout(mount,1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
