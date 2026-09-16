/* UPC V18.21 SAVED RECIPES / MASTER STACKS */
(function(g){'use strict';if(g.__UPC_V1821_RECIPES__)return;g.__UPC_V1821_RECIPES__=1;

const VERSION='18.21';
const STORAGE_KEY='upc_saved_recipes_v1821';
const FIELD_IDS={
 hair:'uc_hair', makeup:'uc_makeup', expression:'uc_expression', nails:'uc_nails',
 top:'uc_top', bottom:'uc_bottom', footwear:'uc_footwear', accessories:'uc_accessories',
 pose:'uc_pose', scene:'uc_scene', environment:'uc_environment', camera:'uc_camera',
 lighting:'uc_lighting', realism:'uc_realism', constraints:'uc_constraints'
};
const BUILT_INS=[
 {
  id:'builtin-raw-iphone',name:'RAW iPhone Master Stack',kind:'Master Stack',builtin:true,
  fields:{
   camera:'iPhone 1x camera, eye-level camera, handheld camera, deep focus',
   lighting:'soft natural window light, natural automatic exposure',
   realism:'camera-captured feel, visible skin pores, natural skin texture, loose flyaway hairs, natural clothing wrinkles, smartphone sharpening, smartphone compression, minor exposure imperfections, shadow noise detail',
   constraints:'no beauty-filter smoothing, no CGI sheen, no overpolished AI finish, no fake HDR effect'
  },
  composer:{format:'Structured',media:'photographic image',preset:'RAW iPhone Photo'}
 },
 {
  id:'builtin-god-tier-realism',name:'God-Tier Realism Stack',kind:'Master Stack',builtin:true,
  fields:{
   realism:'maximum photorealism, captured-not-created look, true optical realism, camera-captured feel, visible skin pores, natural skin texture, subtle facial asymmetry, natural under-eye texture, natural lip texture, loose flyaway hairs, individual hair strands, realistic fabric texture, natural clothing wrinkles, realistic contact shadows, physically believable reflections, highlight rolloff, natural sensor noise',
   constraints:'no waxy skin, no beauty-filter smoothing, no CGI sheen, no plastic texture, no overpolished AI finish, no texture smearing, no synthetic symmetry, no fake HDR effect'
  },
  composer:{format:'Structured',media:'photographic image',preset:'ChatGPT Image / Natural Photo'}
 },
 {
  id:'builtin-gym-editorial',name:'Gym Editorial',kind:'Master Stack',builtin:true,
  fields:{
   scene:'commercial gym',
   camera:'50mm lens, eye-level camera, environmental portrait framing',
   lighting:'soft studio key light, three-quarter side light',
   realism:'editorial photo realism, realistic skin sheen, realistic fabric texture, realistic contact shadows',
   constraints:'preserve subject identity, realistic hand anatomy, no duplicate limbs, no warped clothing'
  },
  composer:{format:'Structured',media:'photographic image',preset:'Commercial Editorial Photo'}
 },
 {
  id:'builtin-candid-apartment',name:'Candid Apartment',kind:'Master Stack',builtin:true,
  fields:{
   scene:'lived-in apartment',
   environment:'realistic everyday clutter, casual candid atmosphere',
   camera:'35mm lens, handheld camera, environmental portrait framing',
   lighting:'soft natural window light',
   realism:'documentary realism, ordinary skin imperfections, loose flyaway hairs, natural clothing wrinkles, everyday lived-in detail',
   constraints:'no mannequin-like posing, preserve subject identity, no random background people'
  },
  composer:{format:'Structured',media:'photographic image',preset:'RAW iPhone Photo'}
 },
 {
  id:'builtin-seedance',name:'Seedance Multi-Shot',kind:'Master Stack',builtin:true,
  fields:{
   camera:'continuous seamless shot, handheld camera',
   realism:'true optical realism, realistic motion blur, realistic fabric texture',
   constraints:'maintain identity across frames, maintain wardrobe continuity, maintain environment continuity, maintain lighting continuity, no temporal identity drift'
  },
  target:'Seedance',aspect:'2:3',
  composer:{format:'Structured',media:'cinematic video',preset:'Seedance Multi-Shot Video'}
 }
];

const $=id=>document.getElementById(id);
function now(){return new Date().toISOString()}
function esc(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function read(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}}
function write(v){localStorage.setItem(STORAGE_KEY,JSON.stringify(v))}
function uid(){return 'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function value(id){return String($(id)?.value||'').trim()}
function setValue(id,v){
 const e=$(id);if(!e)return false;
 e.value=String(v??'');
 e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));
 if(e.tagName==='SELECT')e.dispatchEvent(new Event('input',{bubbles:true}));
 return true;
}
function uniqCSV(a,b){
 const parts=[a,b].filter(Boolean).join(', ').split(',').map(x=>x.trim()).filter(Boolean);
 const seen=new Set(),out=[];
 for(const p of parts){const k=p.toLowerCase().replace(/\s+/g,' ');if(!seen.has(k)){seen.add(k);out.push(p)}}
 return out.join(', ');
}
function snapshot(name,includeSubject=false){
 const fields={};for(const [k,id] of Object.entries(FIELD_IDS))fields[k]=value(id);
 return {
  id:uid(),name:String(name||'Untitled Recipe').trim()||'Untitled Recipe',kind:'Saved Recipe',builtin:false,
  createdAt:now(),updatedAt:now(),includeSubject:!!includeSubject,
  subjectId:includeSubject?value('uc_subjectId'):'',
  fields,target:value('uc_target')||'Universal',aspect:value('uc_aspect')||'2:3',
  composer:{
   format:value('v1820_format')||'Structured',
   media:value('v1820_media')||'photographic image',
   preset:value('v1820_preset')||''
  }
 };
}
function saveCurrent(name,includeSubject=false){
 const list=read(),r=snapshot(name,includeSubject);list.unshift(r);write(list);renderList();return r;
}
function deleteRecipe(id){const list=read().filter(x=>x.id!==id);write(list);renderList()}
function renameRecipe(id,name){const list=read();const r=list.find(x=>x.id===id);if(!r)return false;r.name=String(name||'').trim()||r.name;r.updatedAt=now();write(list);renderList();return true}
function duplicateRecipe(id){
 const src=[...BUILT_INS,...read()].find(x=>x.id===id);if(!src)return null;
 const copy=JSON.parse(JSON.stringify(src));copy.id=uid();copy.name=src.name+' Copy';copy.kind='Saved Recipe';copy.builtin=false;copy.createdAt=now();copy.updatedAt=now();
 const list=read();list.unshift(copy);write(list);renderList();return copy;
}
function apply(recipe,mode='merge'){
 if(!recipe)return false;
 const replace=mode==='replace';
 for(const [k,id] of Object.entries(FIELD_IDS)){
   const incoming=String(recipe.fields?.[k]??'');
   if(replace)setValue(id,incoming);
   else if(incoming)setValue(id,uniqCSV(value(id),incoming));
 }
 if(recipe.includeSubject&&recipe.subjectId)setValue('uc_subjectId',recipe.subjectId);
 if(recipe.target)setValue('uc_target',recipe.target);
 if(recipe.aspect)setValue('uc_aspect',recipe.aspect);
 if(recipe.composer){
   if(recipe.composer.format)setValue('v1820_format',recipe.composer.format);
   if(recipe.composer.media)setValue('v1820_media',recipe.composer.media);
   if(recipe.composer.preset!==undefined)setValue('v1820_preset',recipe.composer.preset);
 }
 setTimeout(()=>g.UPCV1820Composer?.refresh?.(),50);
 localStorage.setItem('upc_last_applied_recipe_v1821',JSON.stringify({id:recipe.id,name:recipe.name,at:now(),mode}));
 return true;
}
function allRecipes(){return [...BUILT_INS,...read()]}
function byId(id){return allRecipes().find(x=>x.id===id)||null}

let root=null;
function renderList(filter=''){
 if(!root)return;
 const list=root.querySelector('#v1821_list');if(!list)return;
 const q=String(filter||'').toLowerCase().trim();
 const items=allRecipes().filter(r=>!q||r.name.toLowerCase().includes(q)||r.kind.toLowerCase().includes(q));
 list.innerHTML=items.length?items.map(r=>`
 <div class="v1821-card" data-id="${esc(r.id)}">
  <div class="v1821-row">
   <div><b>${esc(r.name)}</b><small>${esc(r.kind)}${r.builtin?' · built-in':' · saved locally'}</small></div>
   <span>${r.includeSubject?'SUBJECT LOCKED':'SUBJECT-NEUTRAL'}</span>
  </div>
  <div class="v1821-fields">${Object.entries(r.fields||{}).filter(([,v])=>String(v||'').trim()).slice(0,5).map(([k,v])=>`<em>${esc(k)}: ${esc(String(v).slice(0,75))}${String(v).length>75?'…':''}</em>`).join('')}</div>
  <div class="v1821-actions">
   <button data-act="merge">Merge</button><button data-act="replace">Replace</button><button data-act="duplicate">Duplicate</button>${r.builtin?'':`<button data-act="rename">Rename</button><button data-act="delete" class="danger">Delete</button>`}
  </div>
 </div>`).join(''):'<div class="v1821-empty">No recipes match this search.</div>';
 list.querySelectorAll('.v1821-card').forEach(card=>{
  const r=byId(card.dataset.id);
  card.querySelector('[data-act="merge"]').onclick=()=>{apply(r,'merge');flash('Merged '+r.name)};
  card.querySelector('[data-act="replace"]').onclick=()=>{if(confirm('Replace current Create selections with this recipe?')){apply(r,'replace');flash('Loaded '+r.name)}};
  card.querySelector('[data-act="duplicate"]').onclick=()=>{duplicateRecipe(r.id);flash('Duplicated '+r.name)};
  const ren=card.querySelector('[data-act="rename"]');if(ren)ren.onclick=()=>{const n=prompt('Rename recipe:',r.name);if(n)renameRecipe(r.id,n)};
  const del=card.querySelector('[data-act="delete"]');if(del)del.onclick=()=>{if(confirm('Delete saved recipe "'+r.name+'"?'))deleteRecipe(r.id)};
 });
}
function flash(msg){const e=root?.querySelector('#v1821_flash');if(!e)return;e.textContent=msg;e.hidden=false;setTimeout(()=>e.hidden=true,1300)}
function mount(){
 const composer=$('v1820_composer');if(!composer)return setTimeout(mount,350);if($('v1821_recipes'))return;
 root=document.createElement('div');root.id='v1821_recipes';root.innerHTML=`
 <div class="v1821-head"><div><b>Saved Recipes + Master Stacks</b><small>Save complete Create setups or merge reusable stacks without rebuilding them by hand.</small></div><button id="v1821_toggle" type="button">Open Recipes</button></div>
 <div id="v1821_flash" hidden></div>
 <div id="v1821_panel" hidden>
  <div class="v1821-save">
   <input id="v1821_name" placeholder="Recipe name — e.g. Hailey Gym Editorial">
   <label><input id="v1821_subject" type="checkbox"> Include selected subject</label>
   <button id="v1821_save" type="button">Save Current Setup</button>
  </div>
  <div class="v1821-search"><input id="v1821_search" placeholder="Search recipes and master stacks"></div>
  <div class="v1821-tip"><b>Merge</b> adds a stack to your current selections. <b>Replace</b> loads the recipe as the active Create setup.</div>
  <div id="v1821_list"></div>
 </div>`;
 composer.appendChild(root);
 const style=document.createElement('style');style.id='v1821_style';style.textContent=`
 #v1821_recipes{margin-top:12px;border:1px solid #cbd5e1;border-radius:14px;padding:12px;background:#f8fafc;font:12px system-ui}
 .v1821-head,.v1821-row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.v1821-head>b,.v1821-head div>b{font-size:15px}.v1821-head small,.v1821-row small{display:block;color:#64748b;margin-top:2px}
 #v1821_toggle,#v1821_save,.v1821-actions button{border:0;border-radius:8px;padding:8px 10px;font-weight:800;background:#1d4ed8;color:white}.v1821-actions button{background:#e2e8f0;color:#0f172a;padding:6px 8px}.v1821-actions .danger{background:#fee2e2;color:#991b1b}
 #v1821_panel{margin-top:12px}.v1821-save{display:grid;grid-template-columns:minmax(180px,1fr) auto auto;gap:8px;align-items:center}.v1821-save input[type=text],#v1821_name,#v1821_search{width:100%;box-sizing:border-box;padding:8px;border:1px solid #cbd5e1;border-radius:8px;background:white}
 .v1821-search{margin-top:8px}.v1821-tip{margin:8px 0;padding:8px;border-radius:8px;background:#eef2ff;color:#3730a3}
 .v1821-card{background:white;border:1px solid #e2e8f0;border-radius:11px;padding:10px;margin-top:8px}.v1821-row span{font-size:9px;font-weight:900;color:#475569;background:#f1f5f9;border-radius:999px;padding:4px 7px;white-space:nowrap}.v1821-fields{display:grid;gap:3px;margin:7px 0}.v1821-fields em{font-style:normal;color:#475569;font-size:10px}.v1821-actions{display:flex;gap:6px;flex-wrap:wrap}
 #v1821_flash{margin-top:8px;padding:7px 9px;border-radius:8px;background:#dcfce7;color:#166534;font-weight:800}.v1821-empty{padding:16px;text-align:center;color:#64748b}
 @media(max-width:650px){.v1821-save{grid-template-columns:1fr}.v1821-row{align-items:start}.v1821-row span{white-space:normal}}
 `;
 document.head.appendChild(style);
 const panel=$('v1821_panel');$('v1821_toggle').onclick=()=>{panel.hidden=!panel.hidden;$('v1821_toggle').textContent=panel.hidden?'Open Recipes':'Close Recipes';if(!panel.hidden)renderList($('v1821_search').value)};
 $('v1821_save').onclick=()=>{const n=$('v1821_name').value.trim();if(!n){alert('Enter a recipe name first.');return}const r=saveCurrent(n,$('v1821_subject').checked);$('v1821_name').value='';flash('Saved '+r.name)};
 $('v1821_search').addEventListener('input',e=>renderList(e.target.value));
 renderList();
 g.UPCV1821Recipes={version:VERSION,builtIns:BUILT_INS,all:allRecipes,saveCurrent,apply,deleteRecipe,renameRecipe,duplicateRecipe,byId};
 console.log('[UPC V18.21 Saved Recipes / Master Stacks] mounted');
}
function boot(){setTimeout(mount,1700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
