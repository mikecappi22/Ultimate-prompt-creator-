/* Gainwright Visual Studio V19.0 - Gainwright Core */
(function(g){
'use strict';
if(g.__GAINWRIGHT_CORE_V190__)return;
g.__GAINWRIGHT_CORE_V190__=1;

var VERSION='19.0';
var DRAFT_KEY='gainwright_core_v190_draft';
var VAULT_KEY='gainwright_core_v190_vault';
var PANEL_ID='gvs-v19-core';

var FIELD_IDS={
 hair:'uc_hair',makeup:'uc_makeup',expression:'uc_expression',nails:'uc_nails',
 top:'uc_top',bottom:'uc_bottom',footwear:'uc_footwear',accessories:'uc_accessories',
 pose:'uc_pose',scene:'uc_scene',environment:'uc_environment',camera:'uc_camera',
 lighting:'uc_lighting',realism:'uc_realism',constraints:'uc_constraints'
};
var FIELDS=['hair','makeup','expression','nails','top','bottom','footwear','accessories','pose','scene','environment','camera','lighting','realism','constraints'];
var LABELS={
 hair:'Hair',makeup:'Makeup',expression:'Expression',nails:'Nails',
 top:'Top',bottom:'Bottom',footwear:'Footwear',accessories:'Accessories',
 pose:'Pose / Action',scene:'Scene Support',environment:'Environment',
 camera:'Camera',lighting:'Lighting',realism:'Realism / Texture',constraints:'Constraints'
};
var GROUPS=[
 ['IDENTITY + BEAUTY',['hair','makeup','expression','nails']],
 ['WARDROBE',['top','bottom','footwear','accessories']],
 ['ACTION + WORLD',['pose','scene','environment']],
 ['CAPTURE + REALISM',['camera','lighting','realism','constraints']]
];
var TARGETS=[
 'Universal','ChatGPT Image / Natural Photo','RAW iPhone Photo','Grok Imagine Realism',
 'Nano Banana Edit / Identity Lock','Seedance Multi-Shot Video','Kling Video',
 'Runway Video','Midjourney Raw Photo','Commercial Editorial Photo'
];
var FALLBACK_PRESETS={
 'ChatGPT Image / Natural Photo':'Photographic natural-language prompt. Prioritize physical realism, believable materials, natural skin texture, coherent lighting and anatomy.',
 'RAW iPhone Photo':'ordinary unedited iPhone 1x camera, automatic exposure, no portrait mode, realistic smartphone sharpening and compression, minor exposure imperfections, natural shadow noise',
 'Grok Imagine Realism':'direct photographic description, candid camera-captured realism, natural skin texture, visible pores, authentic fabric tension and wrinkles, physically believable reflections and shadows',
 'Nano Banana Edit / Identity Lock':'Preserve the reference identity exactly. Change only explicitly requested wardrobe, pose, object, camera, lighting or environment details.',
 'Seedance Multi-Shot Video':'Use explicit shot continuity, stable identity and wardrobe, believable body mechanics, inertia, contact, cloth motion and coherent camera movement.',
 'Kling Video':'Use a clearly defined subject action and controlled camera path with stable identity, realistic physics and consistent lighting.',
 'Runway Video':'Describe subject, environment, framing, camera movement, subject movement, lighting, texture and mood directly and coherently.',
 'Midjourney Raw Photo':'photographic realism, literal scene description, natural imperfections, realistic skin and materials, controlled lighting, restrained stylization --raw',
 'Commercial Editorial Photo':'premium commercial editorial photography, tactile materials, precise lighting, clean composition, realistic reflections and natural skin texture'
};

var state={idea:'',referenceNotes:'',referenceLock:false,target:'Universal',aspect:'2:3',fields:{},included:{},structured:'',master:'',analysisSummary:'',updatedAt:''};
var refs=[];
var textModels=[];
var buildTimer=null;

function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function norm(s){return String(s||'').toLowerCase().replace(/[\s,;:.\-–—_/]+/g,' ').trim()}
function uniq(a){var seen={};return (a||[]).filter(function(x){x=String(x||'').trim();if(!x)return false;var k=norm(x);if(!k||seen[k])return false;seen[k]=1;return true})}
function readJSON(k,d){try{var x=JSON.parse(localStorage.getItem(k)||'null');return x==null?d:x}catch(e){return d}}
function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function val(id){var e=$(id);return e?String(e.value||'').trim():''}
function setStatus(id,msg,type){var e=$(id);if(!e)return;e.textContent=msg||'';e.setAttribute('data-type',type||'')}
function now(){return new Date().toISOString()}
function cleanJSON(s){s=String(s||'').trim().replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/,'');var a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)s=s.slice(a,b+1);return JSON.parse(s)}
function included(k){return state.included[k]!==false}
function fv(k){return included(k)?String(state.fields[k]||'').trim():''}
function debounceBuild(){clearTimeout(buildTimer);buildTimer=setTimeout(function(){buildStructured(false)},220)}

function saveDraft(){
 state.idea=val('g19-idea')||state.idea;
 state.referenceNotes=val('g19-refnotes')||state.referenceNotes;
 state.target=val('g19-target')||state.target;
 state.aspect=val('g19-aspect')||state.aspect;
 var rl=$('g19-reflock');state.referenceLock=rl?!!rl.checked:state.referenceLock;
 state.updatedAt=now();
 writeJSON(DRAFT_KEY,state);
 var a=$('g19-autosave');if(a){a.textContent='Draft saved';setTimeout(function(){if(a)a.textContent='Autosave on'},800)}
}
function loadDraft(){
 var d=readJSON(DRAFT_KEY,null);if(!d||typeof d!=='object')return;
 state=Object.assign(state,d);state.fields=Object.assign({},d.fields||{});state.included=Object.assign({},d.included||{});
}
function hydrate(){
 var e;
 e=$('g19-idea');if(e)e.value=state.idea||'';
 e=$('g19-refnotes');if(e)e.value=state.referenceNotes||'';
 e=$('g19-target');if(e)e.value=state.target||'Universal';
 e=$('g19-aspect');if(e)e.value=state.aspect||'2:3';
 e=$('g19-reflock');if(e)e.checked=!!state.referenceLock;
 e=$('g19-structured');if(e)e.value=state.structured||'';
 e=$('g19-master');if(e)e.value=state.master||'';
 e=$('g19-summary');if(e)e.textContent=state.analysisSummary||'';
}
function resetDraft(){
 if(!confirm('Start a new Gainwright creation? Saved Vault items will remain.'))return;
 state={idea:'',referenceNotes:'',referenceLock:false,target:'Universal',aspect:'2:3',fields:{},included:{},structured:'',master:'',analysisSummary:'',updatedAt:''};
 refs.forEach(function(r){try{URL.revokeObjectURL(r.url)}catch(e){}});refs=[];localStorage.removeItem(DRAFT_KEY);
 hydrate();renderRefs();renderDecisions();buildStructured(false);
}

function addCss(){
 if($('gvs-v19-style'))return;
 var s=document.createElement('style');s.id='gvs-v19-style';s.textContent=[
 '#'+PANEL_ID+'{color:#f5efe7;padding:4px 0 120px}',
 'body.gainwright-visual-studio-v1826:has(#'+PANEL_ID+'.active) .topbar{display:none!important}',
 '.g19-shell{display:grid;gap:12px}',
 '.g19-card{background:linear-gradient(180deg,#17130d,#0f0c08);border:1px solid #40372b;padding:18px}',
 '.g19-card h2,.g19-card h3{margin:0;color:#f7f2ea!important}',
 '.g19-eyebrow{color:#efa52c;font:900 10px/1.2 system-ui;letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}',
 '.g19-head{display:flex;justify-content:space-between;gap:16px;align-items:start}',
 '.g19-head p{max-width:760px;color:#a69e92;margin:5px 0 0;font-size:12px;line-height:1.55}',
 '.g19-badges{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}',
 '.g19-badge{border:1px solid #4c402f;background:#100d08;color:#b9ad9c;padding:7px 9px;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}',
 '.g19-badge.ok{color:#b7d99a;border-color:#40582f;background:#10180d}',
 '.g19-badge.warn{color:#e8b55e;border-color:#6d4d22;background:#1b1308}',
 '.g19-grid2{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;margin-top:14px}',
 '.g19-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}',
 '.g19-card label{display:block;color:#d9d0c3!important;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin:8px 0 5px}',
 '.g19-card textarea,.g19-card input,.g19-card select{width:100%;box-sizing:border-box;background:#0c0a07!important;color:#f5eee4!important;border:1px solid #4a4033!important;border-radius:0!important;padding:11px!important;font:13px/1.45 system-ui!important}',
 '.g19-card textarea:focus,.g19-card input:focus,.g19-card select:focus{outline:none!important;border-color:#efa52c!important;box-shadow:0 0 0 1px #efa52c!important}',
 '.g19-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}',
 '.g19-actions button,.g19-mini{border:1px solid #594522!important;background:#1a140c!important;color:#efb24b!important;border-radius:0!important;box-shadow:none!important;padding:9px 11px!important;min-height:38px!important;font-size:10px!important;font-weight:900!important;letter-spacing:.05em!important;text-transform:uppercase!important}',
 '.g19-actions button.primary{background:#efa52c!important;color:#110b03!important;border-color:#efa52c!important}',
 '.g19-actions button:hover,.g19-mini:hover{filter:brightness(1.12)!important;transform:none!important}',
 '.g19-refstrip{display:flex;gap:8px;overflow:auto;margin-top:8px;padding-bottom:4px}',
 '.g19-ref{position:relative;flex:0 0 92px;border:1px solid #40372b;background:#0a0805;padding:5px}',
 '.g19-ref img{display:block;width:80px;height:80px;object-fit:cover}',
 '.g19-ref small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8f877b;margin-top:4px}',
 '.g19-ref button{position:absolute;right:3px;top:3px;width:22px;height:22px;min-height:0!important;padding:0!important;border:1px solid #784237!important;background:#25110e!important;color:#f2b1a7!important;border-radius:0!important}',
 '.g19-lock{display:flex!important;align-items:flex-start;gap:8px;margin-top:8px!important;color:#bdb4a8!important;font-size:11px!important;line-height:1.45;text-transform:none!important;letter-spacing:0!important}',
 '.g19-lock input{width:auto!important;margin-top:2px}',
 '.g19-decisions{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}',
 '.g19-group{border:1px solid #352f26;background:#0e0b07;padding:10px}',
 '.g19-group-title{color:#efa52c;font-size:9px;font-weight:900;letter-spacing:.16em;margin-bottom:6px}',
 '.g19-row{display:grid;grid-template-columns:24px 115px minmax(0,1fr) auto;gap:7px;align-items:center;padding:7px 0;border-top:1px solid #272219}',
 '.g19-row:first-of-type{border-top:0}',
 '.g19-row .g19-check{width:auto!important}',
 '.g19-row .g19-label{color:#d9d1c5;font-size:11px;font-weight:800}',
 '.g19-row input[type=text]{padding:8px 9px!important;font-size:12px!important}',
 '.g19-row .g19-db{padding:7px 8px!important;min-height:34px!important}',
 '.g19-suggestions{grid-column:3/5;display:flex;gap:5px;flex-wrap:wrap}',
 '.g19-suggestions button{border:1px solid #4b3d27!important;background:#171108!important;color:#d7bc8d!important;border-radius:0!important;padding:5px 7px!important;min-height:28px!important;font-size:9px!important}',
 '.g19-source{grid-column:3/5;color:#6f685e;font-size:9px;margin-top:-3px}',
 '.g19-outputs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}',
 '.g19-output{min-height:420px!important;font-family:ui-monospace,SFMono-Regular,Consolas,monospace!important;font-size:11px!important;line-height:1.48!important}',
 '.g19-meter{height:6px;background:#272116;margin-top:7px;overflow:hidden}',
 '.g19-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#b87316,#efa52c)}',
 '.g19-vault-list{display:grid;gap:7px;margin-top:10px}',
 '.g19-vault-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:10px;border:1px solid #342e24;background:#0d0a07}',
 '.g19-vault-item b{display:block;color:#eee7dc!important;font-size:12px}',
 '.g19-vault-item small{display:block;color:#81796e;margin-top:3px}',
 '.g19-vault-actions{display:flex;gap:5px;align-items:center}',
 '.g19-vault-actions button{min-height:30px!important;padding:6px 7px!important;font-size:8px!important}',
 '.g19-vars{display:grid;gap:8px;margin-top:10px}',
 '.g19-var{border:1px solid #3a3227;background:#0d0a07;padding:9px}',
 '.g19-var b{color:#efb24b!important;font-size:10px}',
 '.g19-var textarea{min-height:140px!important;margin-top:6px!important;font-size:10px!important}',
 '@media(max-width:900px){.g19-grid2,.g19-outputs,.g19-decisions{grid-template-columns:1fr}.g19-row{grid-template-columns:24px 88px minmax(0,1fr) auto}.g19-output{min-height:300px!important}}',
 '@media(max-width:560px){.g19-head{display:block}.g19-badges{justify-content:flex-start;margin-top:9px}.g19-row{grid-template-columns:22px 1fr auto}.g19-row .g19-label{grid-column:2/4}.g19-row input[type=text]{grid-column:2/3}.g19-row .g19-db{grid-column:3/4}.g19-suggestions,.g19-source{grid-column:2/4}.g19-grid3{grid-template-columns:1fr}}'
 ].join('\n');document.head.appendChild(s);
}

function searchAdapter(field,q,limit){
 limit=limit||8;var out=[],seen={};
 function add(rows,source){
  (rows||[]).forEach(function(r){var k=String((r&&r.keyword)||(r&&r.phrase)||r||'').trim();if(!k)return;var n=norm(k);if(seen[n])return;seen[n]=1;out.push({keyword:k,source:source||((r&&r.source)||'V18')})});
 }
 try{if(g.UPCV18Core&&typeof g.UPCV18Core.search==='function')add(g.UPCV18Core.search(field,q,limit),'V18 Expanded')}catch(e){}
 try{
  if(g.UPCDatabase18&&typeof g.UPCDatabase18.search==='function'){
   var m=(g.UPCDatabase18.aliases&&g.UPCDatabase18.aliases['uc_'+field])||field;
   add(g.UPCDatabase18.search(m,q,limit),'V18 Canonical');
  }
 }catch(e){}
 try{if(g.UPCV18Clean&&typeof g.UPCV18Clean.search==='function')add(g.UPCV18Clean.search(field,q),'V18 Clean')}catch(e){}
 if(!out.length&&q){
  norm(q).split(' ').filter(function(w){return w.length>3}).slice(0,4).forEach(function(w){
   try{if(g.UPCV18Core&&typeof g.UPCV18Core.search==='function')add(g.UPCV18Core.search(field,w,limit),'V18 Expanded')}catch(e){}
  });
 }
 return out.slice(0,limit);
}
function renderDecisions(){
 var h=$('g19-decisions');if(!h)return;
 h.innerHTML=GROUPS.map(function(gr){
  var rows=gr[1].map(function(k){
   if(state.included[k]===undefined)state.included[k]=true;
   var v=String(state.fields[k]||'');
   return '<div class="g19-row">'+
    '<input class="g19-check" type="checkbox" data-inc="'+k+'" '+(included(k)?'checked':'')+'>'+
    '<div class="g19-label">'+esc(LABELS[k])+'</div>'+
    '<input type="text" data-field="'+k+'" value="'+esc(v)+'" placeholder="Type or analyze to suggest...">'+
    '<button type="button" class="g19-mini g19-db" data-db="'+k+'">DB</button>'+
    '<div class="g19-suggestions" id="g19-sug-'+k+'"></div>'+
    '<div class="g19-source" id="g19-src-'+k+'">'+(v?'Custom / AI decision':'Not specified')+'</div></div>';
  }).join('');
  return '<div class="g19-group"><div class="g19-group-title">'+gr[0]+'</div>'+rows+'</div>';
 }).join('');
 h.querySelectorAll('[data-field]').forEach(function(e){e.addEventListener('input',function(){state.fields[e.getAttribute('data-field')]=e.value;saveDraft();debounceBuild()})});
 h.querySelectorAll('[data-inc]').forEach(function(e){e.addEventListener('change',function(){state.included[e.getAttribute('data-inc')]=e.checked;saveDraft();debounceBuild()})});
 h.querySelectorAll('[data-db]').forEach(function(b){b.onclick=function(){showSuggestions(b.getAttribute('data-db'))}});
}
function showSuggestions(field){
 var input=document.querySelector('[data-field="'+field+'"]'),box=$('g19-sug-'+field),src=$('g19-src-'+field);if(!input||!box)return;
 var q=input.value.trim();if(!q){box.innerHTML='<span style="color:#776f64;font-size:9px">Type a few words first.</span>';return}
 var rows=searchAdapter(field,q,8);
 box.innerHTML=rows.length?rows.map(function(r,i){return'<button type="button" data-pick="'+i+'">'+esc(r.keyword)+'</button>'}).join(''):'<span style="color:#776f64;font-size:9px">No category-safe V18 match. Custom wording remains allowed.</span>';
 box.querySelectorAll('[data-pick]').forEach(function(b){b.onclick=function(){var r=rows[Number(b.getAttribute('data-pick'))];state.fields[field]=r.keyword;input.value=r.keyword;if(src)src.textContent=r.source;box.innerHTML='';saveDraft();buildStructured(false)}});
 if(src&&rows.length)src.textContent=rows.length+' V18 alternative'+(rows.length===1?'':'s')+' found';
}

async function loadModels(){
 var badge=$('g19-ai-badge');
 try{
  var r=await fetch('/ollama/api/tags',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);
  var j=await r.json();textModels=(j.models||[]).map(function(x){return x.name||x.model}).filter(Boolean);
  var model=pickModel();if(badge){badge.textContent=model?'Local AI: '+model:'Local AI: unavailable';badge.className='g19-badge '+(model?'ok':'warn')}
  return textModels;
 }catch(e){textModels=[];if(badge){badge.textContent='Local AI: offline';badge.className='g19-badge warn'}return[]}
}
function pickModel(){
 for(var i=0;i<textModels.length;i++)if(textModels[i]==='qwen3:1.7b')return textModels[i];
 for(var j=0;j<textModels.length;j++)if(/^qwen3:/i.test(textModels[j]))return textModels[j];
 return textModels[0]||'';
}
async function chat(body){
 var r=await fetch('/ollama/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
 var t=await r.text();if(!r.ok)throw Error('HTTP '+r.status+' '+t.slice(0,220));return t?JSON.parse(t):{};
}
var IDEA_SCHEMA={type:'object',additionalProperties:false,required:['concept_summary','fields'],properties:{concept_summary:{type:'string'},fields:{type:'object',additionalProperties:false,required:FIELDS,properties:(function(){var o={};FIELDS.forEach(function(k){o[k]={type:'string'}});return o})()}}};
async function analyzeIdea(){
 var idea=val('g19-idea');if(!idea){setStatus('g19-ai-status','Describe the idea first.','warn');return}
 if(!textModels.length)await loadModels();var model=pickModel();if(!model){setStatus('g19-ai-status','No local text model is available. Manual building still works.','warn');return}
 var b=$('g19-analyze');if(b)b.disabled=true;setStatus('g19-ai-status','Separating the idea into visual decisions...','');
 var p=[
  'Act as Gainwright Visual Studio visual-intent parser. Return JSON only.',
  'Preserve every explicit user fact.',
  'Never invent identity facts, ethnicity, health traits, tattoos, piercings, body measurements, hidden features or biography.',
  'If hair, makeup, nails, wardrobe or accessories are not explicitly stated, leave those strings empty.',
  'You may make restrained compatible suggestions for pose/action, environment, camera, lighting, realism and constraints.',
  'Use concrete prompt-ready wording. Scene Support should summarize place/action only; never replace the original idea.',
  'USER IDEA:',idea
 ].join('\n');
 try{
  var j=await chat({model:model,messages:[{role:'user',content:p}],stream:false,think:false,format:IDEA_SCHEMA,keep_alive:'30m',options:{num_predict:1100,num_ctx:4096,temperature:.22}});
  var o=cleanJSON(j.message&&j.message.content||'');state.analysisSummary=String(o.concept_summary||'').trim();
  FIELDS.forEach(function(k){var x=String(o.fields&&o.fields[k]||'').trim();if(x&&!String(state.fields[k]||'').trim())state.fields[k]=x});
  renderDecisions();var sum=$('g19-summary');if(sum)sum.textContent=state.analysisSummary;saveDraft();buildStructured(false);
  setStatus('g19-ai-status','Idea analyzed with '+model+'. Manual decisions were preserved.','ok');
 }catch(e){setStatus('g19-ai-status','Idea analysis failed: '+e.message,'warn')}
 finally{if(b)b.disabled=false}
}

function onFiles(files){
 Array.prototype.slice.call(files||[]).slice(0,6).forEach(function(file){if(!/^image\//.test(file.type))return;refs.push({file:file,url:URL.createObjectURL(file)})});
 if(refs.length)state.referenceLock=true;var l=$('g19-reflock');if(l)l.checked=state.referenceLock;renderRefs();saveDraft();buildStructured(false);
}
function renderRefs(){
 var h=$('g19-refstrip');if(!h)return;
 h.innerHTML=refs.map(function(r,i){return'<div class="g19-ref"><img src="'+esc(r.url)+'" alt=""><button type="button" data-rm="'+i+'">×</button><small>'+esc(r.file.name)+'</small></div>'}).join('');
 h.querySelectorAll('[data-rm]').forEach(function(b){b.onclick=function(){var i=Number(b.getAttribute('data-rm')),r=refs[i];try{URL.revokeObjectURL(r.url)}catch(e){}refs.splice(i,1);renderRefs();saveDraft()}});
 var c=$('g19-refcount');if(c)c.textContent=refs.length?refs.length+' reference image'+(refs.length===1?'':'s')+' in browser memory':'No photos selected';
}

function presetText(){
 var p=g.UPCV1819Presets&&g.UPCV1819Presets[state.target];return String((p&&p.text)||FALLBACK_PRESETS[state.target]||'').trim();
}
function identityLock(){
 if(!state.referenceLock)return'';
 try{if(g.UPCV1822Variations&&typeof g.UPCV1822Variations.identityText==='function')return String(g.UPCV1822Variations.identityText()||'').trim()}catch(e){}
 return 'Use the uploaded reference image as the sole identity source. Preserve the visible face, apparent adult age, facial geometry, eye appearance, hair identity, skin tone, natural asymmetry, visible body composition and distinguishing features exactly as shown. Do not invent traits that are not visible in the reference.';
}
function section(title,lines){var body=uniq(lines).join('\n');return body?'['+title+']\n'+body:''}
function buildStructured(runQA){
 state.idea=val('g19-idea')||state.idea;state.referenceNotes=val('g19-refnotes')||state.referenceNotes;state.target=val('g19-target')||state.target;state.aspect=val('g19-aspect')||state.aspect;
 var rl=$('g19-reflock');if(rl)state.referenceLock=!!rl.checked;
 var f={};FIELDS.forEach(function(k){f[k]=fv(k)});
 var b=[];
 b.push(section('GAINWRIGHT VISUAL BRIEF',['TARGET: '+state.target,'ASPECT RATIO: '+state.aspect]));
 if(state.referenceLock)b.push(section('REFERENCE IDENTITY LOCK',[identityLock()]));
 if(state.referenceNotes)b.push(section('REFERENCE NOTES',[state.referenceNotes]));
 if(state.idea)b.push(section('CORE IDEA',[state.idea]));
 if(f.hair||f.makeup||f.expression||f.nails)b.push(section('HAIR + BEAUTY',[f.hair&&'HAIR: '+f.hair,f.makeup&&'MAKEUP: '+f.makeup,f.expression&&'EXPRESSION: '+f.expression,f.nails&&'NAILS: '+f.nails]));
 if(f.top||f.bottom||f.footwear||f.accessories)b.push(section('WARDROBE',[f.top&&'TOP: '+f.top,f.bottom&&'BOTTOM: '+f.bottom,f.footwear&&'FOOTWEAR: '+f.footwear,f.accessories&&'ACCESSORIES: '+f.accessories]));
 if(f.pose)b.push(section('POSE / ACTION',[f.pose]));if(f.scene)b.push(section('SCENE SUPPORT',[f.scene]));if(f.environment)b.push(section('ENVIRONMENT',[f.environment]));
 if(f.camera)b.push(section('CAMERA',[f.camera]));if(f.lighting)b.push(section('LIGHTING',[f.lighting]));if(f.realism)b.push(section('REALISM / TEXTURE',[f.realism]));if(f.constraints)b.push(section('CONSTRAINTS',[f.constraints]));
 var pre=presetText();if(pre)b.push(section('MODEL ADAPTATION',[pre]));
 b.push(section('GAINWRIGHT CONSISTENCY LOCK',['Preserve all explicit user facts and accepted visual decisions. Keep identity, body proportions, wardrobe, pose mechanics, environment, camera logic, lighting direction, materials, reflections, shadows and anatomy mutually coherent. Do not introduce unrequested people, objects, logos, text, tattoos, piercings, biography or identity changes.']));
 state.structured=b.filter(Boolean).join('\n\n').trim();var o=$('g19-structured');if(o)o.value=state.structured;syncLegacy();updateCoverage();saveDraft();if(runQA!==false)runQuality();return state.structured;
}
function legacyTarget(){
 if(/^Grok/i.test(state.target))return'Grok Imagine';if(/^Nano/i.test(state.target))return'Nano Banana';if(/^Seedance/i.test(state.target))return'Seedance';if(/^Midjourney/i.test(state.target))return'Midjourney';return'Universal';
}
function setLegacy(id,v){var e=$(id);if(!e)return;e.value=String(v||'');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}
function syncLegacy(){
 FIELDS.forEach(function(k){var id=FIELD_IDS[k];if(!id)return;setLegacy(id,k==='scene'?(state.idea||fv('scene')):fv(k))});
 setLegacy('uc_target',legacyTarget());setLegacy('uc_aspect',state.aspect||'2:3');var l=$('uc_subject_lock');if(l)setLegacy('uc_subject_lock',state.referenceLock?identityLock():'');
 try{if(g.UPCV1820Composer&&typeof g.UPCV1820Composer.refresh==='function')g.UPCV1820Composer.refresh()}catch(e){}
}
function coverage(){
 var n=0;if(state.idea)n+=24;if(state.referenceLock||state.referenceNotes)n+=8;if(fv('pose'))n+=10;if(fv('scene')||fv('environment'))n+=10;if(fv('camera'))n+=12;if(fv('lighting'))n+=12;if(fv('realism'))n+=10;if(fv('constraints'))n+=8;if(fv('top')||fv('bottom')||fv('footwear')||fv('accessories'))n+=6;return Math.min(100,n);
}
function updateCoverage(){
 var n=coverage(),e=$('g19-coverage'),m=$('g19-meter');if(e)e.textContent=n+'%';if(m)m.style.width=n+'%';var w=state.structured?state.structured.trim().split(/\s+/).length:0;e=$('g19-words');if(e)e.textContent=w+' words';
}
function runQuality(){
 var e=$('g19-qa');
 try{
  var t=$('v1820_text');if(t)t.value=state.structured;
  if(g.UPCV1823Analyzer&&typeof g.UPCV1823Analyzer.analyze==='function'){var r=g.UPCV1823Analyzer.analyze();if(e)e.textContent='V18 QA '+r.score+'/100 · '+r.status;return r}
 }catch(x){}
 if(e)e.textContent='QA available after analyzer loads';return null;
}
async function refineMaster(){
 var src=buildStructured(true);if(!src){setStatus('g19-master-status','Build the structured prompt first.','warn');return}
 if(!textModels.length)await loadModels();var model=pickModel();if(!model){setStatus('g19-master-status','No local text model is available. Structured prompt remains ready to use.','warn');return}
 var b=$('g19-refine');if(b)b.disabled=true;setStatus('g19-master-status','Refining with '+model+' while preserving every accepted decision...','');
 var p=['You are Gainwright Visual Studio Master Prompt Composer.','Rewrite the structured source into one polished copy/paste-ready prompt for the stated target.','Preserve EVERY explicit fact and accepted visual decision. Do not invent identity facts, body measurements, tattoos, piercings, people, objects, logos, text, biography or hidden traits.','Do not remove constraints. Remove redundancy without changing meaning. Output the prompt only.','STRUCTURED SOURCE:',src].join('\n\n');
 try{var j=await chat({model:model,messages:[{role:'user',content:p}],stream:false,think:false,keep_alive:'30m',options:{num_predict:2300,num_ctx:6144,temperature:.28}});state.master=String(j.message&&j.message.content||'').trim();var o=$('g19-master');if(o)o.value=state.master;saveDraft();setStatus('g19-master-status','Gainwright Master completed with '+model+'. Structured source remains unchanged.','ok')}
 catch(e){setStatus('g19-master-status','AI refinement failed: '+e.message+'. Structured prompt is still usable.','warn')}
 finally{if(b)b.disabled=false}
}
function copyText(t){t=String(t||'');if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t);var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();return Promise.resolve()}
function sendWorkspace(){var t=String(state.master||state.structured||'').trim();if(!t)return;var w=$('workspace')||$('promptWorkspace');if(w){w.value=t;w.dispatchEvent(new Event('input',{bubbles:true}))}try{if(g.UPCShowPanel)g.UPCShowPanel('prompt')}catch(e){}var b=document.querySelector('[data-nav="prompt"]');if(b)b.click()}

function vault(){var v=readJSON(VAULT_KEY,[]);return Array.isArray(v)?v:[]}
function saveVault(){
 buildStructured(true);if(!String(state.master||state.structured||'').trim()){setStatus('g19-vault-status','Nothing to save yet.','warn');return}
 var list=vault(),item={id:'G'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),createdAt:now(),title:(state.idea||'Untitled Gainwright creation').trim().slice(0,90),idea:state.idea,referenceNotes:state.referenceNotes,referenceLock:state.referenceLock,target:state.target,aspect:state.aspect,fields:JSON.parse(JSON.stringify(state.fields)),included:JSON.parse(JSON.stringify(state.included)),structured:state.structured,master:state.master,analysisSummary:state.analysisSummary};
 list.unshift(item);writeJSON(VAULT_KEY,list.slice(0,100));renderVault();setStatus('g19-vault-status','Saved to Gainwright Vault. Reference photo files were not saved.','ok');
}
function loadVaultItem(id){
 var item=vault().find(function(x){return x.id===id});if(!item)return;state=Object.assign(state,item);state.fields=Object.assign({},item.fields||{});state.included=Object.assign({},item.included||{});
 refs.forEach(function(r){try{URL.revokeObjectURL(r.url)}catch(e){}});refs=[];hydrate();renderRefs();renderDecisions();buildStructured(false);saveDraft();showCore();setStatus('g19-vault-status','Loaded. Reselect reference photos if needed.','ok');
}
function deleteVaultItem(id){if(!confirm('Delete this Gainwright Vault item?'))return;writeJSON(VAULT_KEY,vault().filter(function(x){return x.id!==id}));renderVault()}
function renderVault(){
 var h=$('g19-vault-list');if(!h)return;var list=vault();
 h.innerHTML=list.length?list.slice(0,20).map(function(x){return'<div class="g19-vault-item"><div><b>'+esc(x.title||'Untitled')+'</b><small>'+esc(new Date(x.createdAt).toLocaleString())+' · '+esc(x.target||'Universal')+' · '+esc(x.aspect||'')+'</small></div><div class="g19-vault-actions"><button class="g19-mini" data-load="'+esc(x.id)+'">Load</button><button class="g19-mini" data-copy="'+esc(x.id)+'">Copy</button><button class="g19-mini" data-del="'+esc(x.id)+'">Delete</button></div></div>'}).join(''):'<div style="color:#7c7468;font-size:11px">No saved creations yet.</div>';
 h.querySelectorAll('[data-load]').forEach(function(b){b.onclick=function(){loadVaultItem(b.getAttribute('data-load'))}});
 h.querySelectorAll('[data-copy]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-copy'),x=vault().find(function(v){return v.id===id});if(x)copyText(x.master||x.structured||'')}});
 h.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){deleteVaultItem(b.getAttribute('data-del'))}});
}
function exportVault(){var d={product:'Gainwright Visual Studio',version:VERSION,exportedAt:now(),vault:vault()},blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='gainwright-v19-vault.json';a.click();setTimeout(function(){URL.revokeObjectURL(u)},1000)}

function variations(){
 syncLegacy();var h=$('g19-vars');if(!h)return;
 try{
  if(!g.UPCV1822Variations||typeof g.UPCV1822Variations.generate!=='function')throw Error('Controlled Variations is not loaded yet');
  var rows=g.UPCV1822Variations.generate({mode:'Pose + Camera',count:3,guidance:''});
  h.innerHTML=rows.map(function(v,i){return'<div class="g19-var"><b>VARIATION '+(i+1)+' · '+esc(Object.entries(v.changes||{}).map(function(x){return x[0]+': '+x[1]}).join(' · '))+'</b><textarea readonly>'+esc(v.prompt||'')+'</textarea><div class="g19-actions"><button type="button" data-vcopy="'+i+'">Copy</button><button type="button" data-vapply="'+i+'">Apply Decisions</button></div></div>'}).join('');
  h.querySelectorAll('[data-vcopy]').forEach(function(b){b.onclick=function(){copyText(rows[Number(b.getAttribute('data-vcopy'))].prompt)}});
  h.querySelectorAll('[data-vapply]').forEach(function(b){b.onclick=function(){var v=rows[Number(b.getAttribute('data-vapply'))];if(g.UPCV1822Variations.applyVariation)g.UPCV1822Variations.applyVariation(v);setTimeout(function(){['pose','camera','lighting'].forEach(function(k){var e=$(FIELD_IDS[k]);if(e&&e.value)state.fields[k]=e.value});renderDecisions();buildStructured(false)},120)}});
 }catch(e){h.innerHTML='<div style="color:#d7a35c;font-size:11px">'+esc(e.message)+'</div>'}
}

function showLegacy(){document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active')});var p=$('panel-create');if(p)p.classList.add('active');document.querySelectorAll('[data-nav]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-nav')==='create')});if(p)p.scrollIntoView({behavior:'smooth',block:'start'})}
function showCore(){var p=$(PANEL_ID);if(!p)return;document.querySelectorAll('.panel').forEach(function(x){x.classList.remove('active')});p.classList.add('active');document.querySelectorAll('[data-nav]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-nav')==='create')});p.scrollIntoView({behavior:'smooth',block:'start'})}
function bindCreateNav(){document.querySelectorAll('[data-nav="create"]').forEach(function(b){if(b.getAttribute('data-g19'))return;b.setAttribute('data-g19','1');b.onclick=function(e){if(e){e.preventDefault();e.stopPropagation()}showCore()}})}

function mountPanel(){
 if($(PANEL_ID))return;
 var p=document.createElement('section');p.id=PANEL_ID;p.className='panel';
 p.innerHTML=
 '<div class="g19-shell">'+
 '<div class="g19-card"><div class="g19-head"><div><div class="g19-eyebrow">Gainwright Core · V19</div><h2>Idea-first visual creation</h2><p>Start with the creative truth. Gainwright separates it into controllable visual decisions, searches your existing V18 knowledge system, builds a deterministic source prompt, and optionally refines that prompt with your local AI.</p></div><div class="g19-badges"><span class="g19-badge ok">V18 knowledge connected</span><span id="g19-ai-badge" class="g19-badge">Local AI: checking</span></div></div></div>'+
 '<div class="g19-card"><div class="g19-eyebrow">01 · Idea + References</div><div class="g19-grid2"><div><label>What do you imagine?</label><textarea id="g19-idea" rows="8" placeholder="Describe the image or video in plain language. Gainwright organizes the idea without replacing it."></textarea><div class="g19-actions"><button id="g19-analyze" class="primary" type="button">Analyze / Suggest Decisions</button><button id="g19-new" type="button">New Creation</button><span id="g19-autosave" style="align-self:center;color:#736c61;font-size:9px">Autosave on</span></div><div id="g19-ai-status" style="margin-top:7px;color:#9e9588;font-size:10px"></div><div id="g19-summary" style="margin-top:7px;color:#c4baad;font-size:11px"></div></div>'+
 '<div><label>Reference photos</label><input id="g19-files" type="file" accept="image/*" multiple><div id="g19-refstrip" class="g19-refstrip"></div><div id="g19-refcount" style="color:#7f776b;font-size:9px">No photos selected</div><div style="margin-top:7px;color:#8c8478;font-size:10px;line-height:1.45">V19.0 keeps selected photos only in browser memory and does not analyze or upload them. Use them in your target image/video generator. Local vision analysis will be added separately when a vision model is configured.</div><label>Reference notes</label><textarea id="g19-refnotes" rows="4" placeholder="Optional visible details or continuity notes."></textarea><label class="g19-lock"><input id="g19-reflock" type="checkbox">Use strict reference identity lock. Invisible traits are never invented.</label></div></div></div>'+
 '<div class="g19-card"><div class="g19-head"><div><div class="g19-eyebrow">02 · Visual Decisions</div><h3>Control every useful detail</h3><p>AI suggestions remain editable. DB searches are category-isolated. Unchecked rows are omitted from the master prompt.</p></div><div style="min-width:300px"><div class="g19-grid3"><div><label>Target</label><select id="g19-target">'+TARGETS.map(function(x){return'<option>'+esc(x)+'</option>'}).join('')+'</select></div><div><label>Aspect</label><select id="g19-aspect"><option>2:3</option><option>9:16</option><option>1:1</option><option>4:5</option><option>16:9</option></select></div><div><label>Coverage</label><div id="g19-coverage" style="font-size:23px;font-weight:900;color:#efa52c;margin-top:5px">0%</div></div></div><div class="g19-meter"><i id="g19-meter"></i></div></div></div><div id="g19-decisions" class="g19-decisions"></div></div>'+
 '<div class="g19-card"><div class="g19-eyebrow">03 · Master Prompt</div><div class="g19-head"><div><h3>Structured source + Gainwright Master</h3><p>The structured source is authoritative. Local AI refinement creates a second version and never overwrites the source.</p></div><div class="g19-badges"><span id="g19-words" class="g19-badge">0 words</span><span id="g19-qa" class="g19-badge">QA pending</span></div></div><div class="g19-outputs"><div><label>Structured source</label><textarea id="g19-structured" class="g19-output"></textarea></div><div><label>Gainwright Master</label><textarea id="g19-master" class="g19-output" placeholder="Optional local-AI refined version appears here."></textarea></div></div><div class="g19-actions"><button id="g19-build" class="primary" type="button">Build / Refresh</button><button id="g19-refine" type="button">Refine with Local AI</button><button id="g19-copy" type="button">Copy Best Prompt</button><button id="g19-workspace" type="button">Send to Workspace</button><button id="g19-save" type="button">Save to Vault</button><button id="g19-variations" type="button">3 Controlled Variations</button><button id="g19-legacy" type="button">Advanced V18 Engine</button></div><div id="g19-master-status" style="margin-top:7px;color:#9e9588;font-size:10px"></div><div id="g19-vars" class="g19-vars"></div></div>'+
 '<div class="g19-card"><div class="g19-head"><div><div class="g19-eyebrow">04 · Gainwright Vault</div><h3>Saved creations</h3><p>Stores the idea, decisions, prompts and metadata in this browser. Reference photo files are never stored.</p></div><div class="g19-actions" style="margin-top:0"><button id="g19-export" type="button">Export Vault JSON</button></div></div><div id="g19-vault-status" style="margin-top:7px;color:#9e9588;font-size:10px"></div><div id="g19-vault-list" class="g19-vault-list"></div></div>'+
 '</div>';
 var anchor=$('panel-create'),parent=anchor&&anchor.parentNode;if(parent)parent.insertBefore(p,anchor);else (document.querySelector('.wrap')||document.body).appendChild(p);

 $('g19-idea').addEventListener('input',function(){state.idea=this.value;saveDraft();debounceBuild()});
 $('g19-refnotes').addEventListener('input',function(){state.referenceNotes=this.value;saveDraft();debounceBuild()});
 $('g19-reflock').addEventListener('change',function(){state.referenceLock=this.checked;saveDraft();buildStructured(false)});
 $('g19-target').addEventListener('change',function(){state.target=this.value;saveDraft();buildStructured(false)});
 $('g19-aspect').addEventListener('change',function(){state.aspect=this.value;saveDraft();buildStructured(false)});
 $('g19-files').addEventListener('change',function(){onFiles(this.files);this.value=''});
 $('g19-analyze').onclick=analyzeIdea;$('g19-new').onclick=resetDraft;$('g19-build').onclick=function(){buildStructured(true)};$('g19-refine').onclick=refineMaster;
 $('g19-copy').onclick=function(){copyText(state.master||state.structured||'')};$('g19-workspace').onclick=sendWorkspace;$('g19-save').onclick=saveVault;$('g19-variations').onclick=variations;$('g19-legacy').onclick=showLegacy;$('g19-export').onclick=exportVault;
 $('g19-structured').addEventListener('input',function(){state.structured=this.value;saveDraft();updateCoverage()});$('g19-master').addEventListener('input',function(){state.master=this.value;saveDraft()});

 hydrate();renderRefs();renderDecisions();renderVault();buildStructured(false);loadModels();
}
function boot(){
 addCss();loadDraft();mountPanel();bindCreateNav();
 [500,1200,2400,4200,7000].forEach(function(ms){setTimeout(function(){bindCreateNav();if(!$(PANEL_ID))mountPanel()},ms)});
 setTimeout(function(){var ac=document.querySelector('[data-nav="create"].active'),pc=$('panel-create');if(ac||(pc&&pc.classList.contains('active')))showCore()},2800);
 g.GainwrightCoreV19={version:VERSION,show:showCore,showLegacy:showLegacy,build:buildStructured,analyzeIdea:analyzeIdea,refine:refineMaster,search:searchAdapter,saveVault:saveVault,vault:vault,variations:variations};
 console.log('[Gainwright Visual Studio V19.0 Core] loaded');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,500)});else setTimeout(boot,500);
})(window);