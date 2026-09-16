/* UPC V18.22 CONTROLLED VARIATIONS + REFERENCE IDENTITY LOCK */
(function(g){'use strict';if(g.__UPC_V1822_VARIATIONS__)return;g.__UPC_V1822_VARIATIONS__=1;

const VERSION='18.22';
const IDENTITY_KEY='upc_reference_identity_lock_v1822';
const DEFAULT_IDENTITY_LOCK=`[REFERENCE IDENTITY LOCK]
Use the uploaded/reference subject image or images as the sole visual source of the person's identity. Preserve the exact recognizable person shown in the reference rather than redesigning or idealizing them.

FACE / AGE / SKIN: preserve facial geometry, apparent adult age, face shape, cheekbones, jawline, chin, brows, eye shape and visible eye color, nose structure, lips, skin tone and undertone, ordinary skin texture, visible pores, natural asymmetry, and distinctive visible features.

HAIR IDENTITY: preserve the reference hairline, base color, dimensional color pattern, density, texture, and other identity-defining hair traits unless the prompt explicitly requests a temporary hairstyle change. A hairstyle change must not change the person's underlying hair identity.

BODY COMPOSITION LOCK: when the body is visible in the reference, preserve the same overall body composition and silhouette, including relative muscle mass, softness/leanness, shoulder width, torso proportions, waist-to-hip relationship, chest/bust proportions, arm and leg proportions, visible muscular development, fat distribution, posture tendencies, and height impression. Do not automatically slim, bulk, enlarge, reduce, reshape, or idealize the body.

DISTINGUISHING FEATURES: preserve visible tattoos, scars, freckles, piercings, moles, and other reference-confirmed identifying details. Do not invent details that are not visible or otherwise provided.

CONTINUITY: wardrobe, pose, expression, camera, lighting, scene, and environment may change as requested, but the person's identity and body composition must remain the same. Preserve believable anatomy and natural human asymmetry across every shot or variation.

DO NOT: face-swap into a different-looking person, beautify away identity traits, age-shift, change ethnicity, change facial proportions, alter body shape, create synthetic symmetry, or infer unseen physical traits. If a trait is not visible in the reference, do not invent it. Reference identity takes priority over generic beauty or style language.`;

const $=id=>document.getElementById(id);
const VAR_FIELDS={expression:'uc_expression',pose:'uc_pose',camera:'uc_camera',lighting:'uc_lighting'};
const FALLBACKS={
 expression:['soft smile','big natural smile','subtle smirk','relaxed expression','confident expression','focused expression','direct gaze','looking off-camera'],
 pose:['relaxed standing','one hand on hip','looking over shoulder','walking toward camera','candid mid-motion','seated upright','leaning against wall','kneeling','crouching','arms crossed'],
 camera:['eye-level camera','front three-quarter angle','rear three-quarter angle','low-angle camera','high-angle camera','35mm lens','50mm lens','85mm portrait lens','full-body framing','close-up framing','environmental portrait framing','handheld camera'],
 lighting:['soft natural window light','golden-hour sunlight','overcast daylight','open shade','three-quarter side light','rim light','soft studio key light','large diffused softbox','dramatic cinematic side light','blue hour']
};
const MODES={
 'Pose only':['pose'],
 'Camera only':['camera'],
 'Lighting only':['lighting'],
 'Expression + Pose':['expression','pose'],
 'Pose + Camera':['pose','camera'],
 'Camera + Lighting':['camera','lighting'],
 'Pose + Camera + Lighting':['pose','camera','lighting'],
 'Expression + Pose + Camera':['expression','pose','camera'],
 'Full controlled variation':['expression','pose','camera','lighting']
};

function esc(s){return String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m))}
function value(id){return String($(id)?.value||'').trim()}
function setValue(id,v,notify=true){const e=$(id);if(!e)return false;e.value=String(v??'');if(notify){e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));if(e.tagName==='SELECT')e.dispatchEvent(new Event('input',{bubbles:true}))}return true}
function core(){return g.UPCV18Core}
function fieldRecords(field){const c=core();return c&&Array.isArray(c.records)?c.records.filter(r=>r&&r.field===field&&String(r.keyword||'').trim()):[]}
function normalized(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function matchesGuidance(row,guidance){const words=normalized(guidance).split(/\s+/).filter(Boolean);if(!words.length)return true;const hay=normalized([row.keyword,row.phrase,row.subcategory,row.tags].join(' '));return words.some(w=>hay.includes(w))}
function uniqueRows(rows){const seen=new Set;return rows.filter(r=>{const k=normalized(r.keyword);if(!k||seen.has(k))return false;seen.add(k);return true})}
function candidateRows(field,guidance=''){
 const all=fieldRecords(field);
 let rows=guidance?all.filter(r=>matchesGuidance(r,guidance)):[];
 if(rows.length<4){
  const c=core();
  for(const q of FALLBACKS[field]||[]){
   if(c&&typeof c.search==='function'){
    const found=c.search(field,q,8)||[];rows.push(...found);
   }
  }
 }
 if(rows.length<4)rows.push(...all.slice(0,80));
 return uniqueRows(rows);
}
function phrase(row){return String(row?.phrase||row?.keyword||'').trim()}
function pickDistinct(field,index,guidance,current){
 const rows=candidateRows(field,guidance).filter(r=>normalized(phrase(r))!==normalized(current));
 if(!rows.length)return current;
 const step=Math.max(1,Math.floor(rows.length/11));
 return phrase(rows[(index*step)%rows.length]);
}
function identityText(){return localStorage.getItem(IDENTITY_KEY)||DEFAULT_IDENTITY_LOCK}
function saveIdentityText(text){const t=String(text||'').trim()||DEFAULT_IDENTITY_LOCK;localStorage.setItem(IDENTITY_KEY,t);const hidden=$('uc_subject_lock');if(hidden)hidden.value=t;g.UPCV1820Composer?.refresh?.();return t}
function ensureIdentityInput(){
 let e=$('uc_subject_lock');
 if(!e){e=document.createElement('textarea');e.id='uc_subject_lock';e.style.display='none';document.body.appendChild(e)}
 e.value=identityText();e.dataset.v1822ReferenceLock='1';
 return e;
}
function hideLegacySubjectControls(){
 const subject=$('uc_subjectId');
 const step=subject?.closest('.uc-step,.uc160-card');if(step){step.style.display='none';step.dataset.hiddenBy='v18.22-reference-identity'}
 const hero=document.querySelector('#panel-create .uc-hero p');if(hero)hero.textContent='Simple flow: Reference Identity → Hair & Beauty → Clothing → Pose → Scene → Camera → Lighting → Final Prompt.';
 const recipeSubject=$('v1821_subject');if(recipeSubject){recipeSubject.checked=false;const lab=recipeSubject.closest('label');if(lab)lab.style.display='none'}
}
function makeIdentityCard(){
 const panel=$('panel-create');if(!panel||$('v1822_identity_card'))return;
 const hero=panel.querySelector('.uc-hero');
 const card=document.createElement('div');card.id='v1822_identity_card';card.className='uc-step';
 card.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><div><h3 style="margin:0">1. Reference Identity Lock</h3><div style="font-size:11px;color:#64748b;margin-top:3px">Always applied to the final prompt. Upload the subject reference image directly to the image/video generator; UPC preserves precise identity and visible body composition without storing the photo.</div></div><span style="font-size:9px;font-weight:900;background:#dcfce7;color:#166534;border-radius:999px;padding:5px 8px;white-space:nowrap">ALWAYS ON</span></div>
 <details style="margin-top:9px"><summary style="cursor:pointer;font-weight:800">View / edit global identity stack</summary><textarea id="v1822_identity_text" style="width:100%;box-sizing:border-box;min-height:260px;margin-top:8px;padding:10px;border:1px solid #cbd5e1;border-radius:10px;font-size:11px;line-height:1.4"></textarea><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:7px"><button id="v1822_identity_save" type="button">Save Identity Stack</button><button id="v1822_identity_reset" type="button">Reset Standard Lock</button></div></details>`;
 if(hero)hero.insertAdjacentElement('afterend',card);else panel.prepend(card);
 $('v1822_identity_text').value=identityText();
 for(const b of card.querySelectorAll('button'))b.style.cssText='border:0;border-radius:8px;padding:8px 10px;font-weight:800;background:#e2e8f0;color:#0f172a';
 $('v1822_identity_save').onclick=()=>{saveIdentityText($('v1822_identity_text').value);flashIdentity('Saved')};
 $('v1822_identity_reset').onclick=()=>{$('v1822_identity_text').value=DEFAULT_IDENTITY_LOCK;saveIdentityText(DEFAULT_IDENTITY_LOCK);flashIdentity('Reset')};
}
function flashIdentity(msg){const b=$('v1822_identity_save');if(!b)return;const old=b.textContent;b.textContent=msg;setTimeout(()=>b.textContent=old,1000)}
function snapshot(ids){const o={};for(const id of ids){const e=$(id);if(e)o[id]=e.value}return o}
function restore(o){for(const [id,v] of Object.entries(o)){const e=$(id);if(e)e.value=v}}
function buildWith(changes){
 const ids=Object.values(VAR_FIELDS),snap=snapshot(ids);
 try{for(const [field,v] of Object.entries(changes)){const id=VAR_FIELDS[field];if(id&&$(id))$(id).value=v}return g.UPCV1820Composer?.build?.({})||''}finally{restore(snap)}
}
function generate(opts={}){
 const mode=opts.mode||'Pose + Camera';const fields=MODES[mode]||MODES['Pose + Camera'];
 const count=Math.max(1,Math.min(10,Number(opts.count)||5));const guidance=String(opts.guidance||'').trim();
 const current={};for(const [f,id] of Object.entries(VAR_FIELDS))current[f]=value(id);
 const variations=[];
 for(let i=0;i<count;i++){
  const changes={};for(const f of fields)changes[f]=pickDistinct(f,i+(f.length%3),guidance,current[f]);
  const prompt=buildWith(changes);variations.push({number:i+1,changes,prompt});
 }
 g.UPCV1822LastVariations={at:new Date().toISOString(),mode,count,guidance,variations};
 return variations;
}
function applyVariation(v){for(const [f,x] of Object.entries(v.changes||{})){const id=VAR_FIELDS[f];if(id)setValue(id,x,true)}setTimeout(()=>g.UPCV1820Composer?.refresh?.(),40)}
function copyText(text){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve()}
function renderVariations(rows){
 const out=$('v1822_results');if(!out)return;out.innerHTML='';
 for(const v of rows){
  const card=document.createElement('div');card.className='v1822-var';
  card.innerHTML=`<div class="v1822-var-head"><div><b>Variation ${v.number}</b><small>${Object.entries(v.changes).map(([k,x])=>`${esc(k)}: ${esc(x)}`).join(' · ')}</small></div><div><button data-a="apply">Apply</button><button data-a="copy">Copy</button></div></div><textarea readonly>${esc(v.prompt)}</textarea>`;
  card.querySelector('[data-a="apply"]').onclick=()=>{applyVariation(v);card.querySelector('[data-a="apply"]').textContent='Applied'};
  card.querySelector('[data-a="copy"]').onclick=()=>copyText(v.prompt);
  out.appendChild(card);
 }
}
function mountGenerator(){
 const host=$('v1820_composer');if(!host||$('v1822_variations'))return setTimeout(mountGenerator,400);
 const box=document.createElement('div');box.id='v1822_variations';
 box.innerHTML=`<div class="v1822-head"><div><b>Controlled Variations Generator</b><small>Identity is always locked. Vary only the selected visual dimensions while preserving everything else.</small></div><button id="v1822_toggle" type="button">Open Variations</button></div><div id="v1822_panel" hidden><div class="v1822-grid"><div><label>Variation mode</label><select id="v1822_mode">${Object.keys(MODES).map(x=>`<option>${esc(x)}</option>`).join('')}</select></div><div><label>Count</label><select id="v1822_count"><option>3</option><option selected>5</option><option>8</option><option>10</option></select></div></div><label style="margin-top:8px">Optional direction / filter</label><input id="v1822_guidance" placeholder="e.g. rear three-quarter, standing, golden hour, close-up"><div class="v1822-locks"><b>Locks:</b> Identity ✓ · Wardrobe ✓ · Hair/Beauty ✓ · Scene/Environment ✓ · Realism/Constraints ✓</div><div class="v1822-actions"><button id="v1822_generate" type="button">Generate Variations</button><button id="v1822_copyall" type="button">Copy All</button></div><div id="v1822_results"></div></div>`;
 host.appendChild(box);
 const style=document.createElement('style');style.id='v1822_style';style.textContent=`
 #v1822_variations{margin-top:12px;border:1px solid #cbd5e1;border-radius:14px;padding:12px;background:#f8fafc;font:12px system-ui}.v1822-head,.v1822-var-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.v1822-head b{font-size:15px}.v1822-head small,.v1822-var-head small{display:block;color:#64748b;margin-top:2px}.v1822-grid{display:grid;grid-template-columns:2fr 1fr;gap:8px}.v1822-grid label,#v1822_panel>label{display:block;font-weight:800;font-size:11px;margin-bottom:3px}#v1822_mode,#v1822_count,#v1822_guidance{width:100%;box-sizing:border-box;padding:8px;border:1px solid #cbd5e1;border-radius:8px;background:white}.v1822-locks{margin:9px 0;padding:8px;border-radius:8px;background:#ecfdf5;color:#166534}.v1822-actions{display:flex;gap:7px;flex-wrap:wrap}.v1822-actions button,#v1822_toggle,.v1822-var-head button{border:0;border-radius:8px;padding:8px 10px;font-weight:800;background:#1d4ed8;color:white}.v1822-var{background:white;border:1px solid #e2e8f0;border-radius:11px;padding:10px;margin-top:9px}.v1822-var-head>div:last-child{display:flex;gap:5px}.v1822-var-head button{background:#e2e8f0;color:#0f172a;padding:6px 8px}.v1822-var textarea{width:100%;box-sizing:border-box;min-height:230px;margin-top:8px;padding:9px;border:1px solid #e2e8f0;border-radius:9px;font:11px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;background:#f8fafc}@media(max-width:650px){.v1822-grid{grid-template-columns:1fr}.v1822-var-head{display:block}.v1822-var-head>div:last-child{margin-top:6px}}
 `;document.head.appendChild(style);
 const panel=$('v1822_panel');$('v1822_toggle').onclick=()=>{panel.hidden=!panel.hidden;$('v1822_toggle').textContent=panel.hidden?'Open Variations':'Close Variations'};
 $('v1822_generate').onclick=()=>renderVariations(generate({mode:value('v1822_mode'),count:value('v1822_count'),guidance:value('v1822_guidance')}));
 $('v1822_copyall').onclick=()=>{const rows=g.UPCV1822LastVariations?.variations||[];const text=rows.map(v=>`VARIATION ${v.number}\n${v.prompt}`).join('\n\n====================\n\n');if(text)copyText(text)};
}
function boot(){
 ensureIdentityInput();
 setTimeout(()=>{hideLegacySubjectControls();makeIdentityCard();mountGenerator();g.UPCV1820Composer?.refresh?.();},1900);
 setTimeout(hideLegacySubjectControls,3200);
 g.UPCV1822Variations={version:VERSION,identityText,saveIdentityText,generate,applyVariation,modes:MODES,defaultIdentityLock:DEFAULT_IDENTITY_LOCK};
 console.log('[UPC V18.22 Controlled Variations + Reference Identity Lock] loaded');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
