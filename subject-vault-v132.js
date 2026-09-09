/* Ultimate Prompt Creator V13.2 Subject Vault — reusable text profiles + verified local reference gallery */
(function(global){
'use strict';
if(global.__UPC_SUBJECT_VAULT_V132__)return;global.__UPC_SUBJECT_VAULT_V132__=true;

const VERSION='V13.2 SUBJECT VAULT';
// Keep V13.1 keys/DB so existing subject text and any valid local records migrate automatically.
const STORAGE_KEY='upc_subject_vault_v131';
const ACTIVE_KEY='upc_subject_vault_active_v131';
const PHOTO_DB='UPCSubjectVaultV131';
const PHOTO_STORE='photos';
const MAX_PHOTOS=8;
const $=id=>typeof document!=='undefined'?document.getElementById(id):null;
const uid=()=>`sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

function seedAddison(){return {
  id:'addison',name:'ADDISON',type:'Adult woman',tags:'',face:'',eyes:'',hair:'',skin:'',body:'',distinguishing:'',personality:'',
  continuity:"Keep Addison's defined face, apparent adult age, eye color, hair identity, skin tone, body proportions, distinguishing features, and natural asymmetry consistent across prompts. Never silently change established traits, and do not invent traits that have not been defined in this profile.",
  referenceNotes:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
}}
function saveSubjects(a){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(a))}catch(_){}}
function loadSubjects(){try{const raw=localStorage.getItem(STORAGE_KEY),a=raw?JSON.parse(raw):null;if(Array.isArray(a)&&a.length)return a}catch(_){}const a=[seedAddison()];saveSubjects(a);return a}
function loadActive(a){try{const id=localStorage.getItem(ACTIVE_KEY);if(id&&a.some(x=>x.id===id))return id}catch(_){}return a[0]?.id||''}
function saveActive(id){try{localStorage.setItem(ACTIVE_KEY,id)}catch(_){}}
function fieldLine(label,value){value=String(value||'').trim();return value?`${label}: ${value}`:''}
function buildLock(s,mode='full'){
  if(!s)return'';
  const name=String(s.name||'SUBJECT').trim();
  const lines=[`[SUBJECT LOCK — ${name.toUpperCase()}]`,fieldLine('SUBJECT',`${name}${s.type?` — ${String(s.type).trim()}`:''}`)];
  const traits=[['FACE',s.face],['EYES',s.eyes],['HAIR',s.hair],['SKIN',s.skin],['BODY / PROPORTIONS',s.body],['DISTINGUISHING FEATURES',s.distinguishing],['REFERENCE NOTES',s.referenceNotes]].filter(([,v])=>String(v||'').trim());
  if(traits.length)traits.forEach(([k,v])=>lines.push(fieldLine(k,v)));
  else lines.push('IDENTITY STATUS: No appearance traits have been defined yet. Do not invent facial, hair, eye, skin, body, tattoo, accessory, or other identity details.');
  if((mode==='persona'||mode==='full')&&String(s.personality||'').trim())lines.push(fieldLine('PERSONALITY / CAMERA PRESENCE',s.personality));
  if(mode==='full'&&String(s.continuity||'').trim())lines.push(fieldLine('CONTINUITY RULES',s.continuity));
  lines.push('LOCK RULE: Preserve only established subject traits. Do not silently redesign the subject or add undefined identity details.');
  return lines.filter(Boolean).join('\n')
}
function normalizeImported(raw){
  const arr=Array.isArray(raw)?raw:Array.isArray(raw?.subjects)?raw.subjects:[];
  return arr.map(x=>({id:String(x.id||uid()),name:String(x.name||'New Subject').trim()||'New Subject',type:String(x.type||'Adult woman'),tags:String(x.tags||''),face:String(x.face||''),eyes:String(x.eyes||''),hair:String(x.hair||''),skin:String(x.skin||''),body:String(x.body||''),distinguishing:String(x.distinguishing||''),personality:String(x.personality||''),continuity:String(x.continuity||''),referenceNotes:String(x.referenceNotes||''),createdAt:x.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()}))
}
const Internals={VERSION,seedAddison,buildLock,normalizeImported,MAX_PHOTOS,STORAGE_KEY,ACTIVE_KEY,PHOTO_DB,PHOTO_STORE};
global.SubjectVaultV132Internals=Internals;
if(typeof document==='undefined')return;

let subjects=loadSubjects(),activeId=loadActive(subjects),photoDbPromise=null;
function active(){return subjects.find(x=>x.id===activeId)||subjects[0]}
function persist(){saveSubjects(subjects);saveActive(activeId)}
function status(msg,type=''){const e=$('svStatus');if(!e)return;e.textContent=msg;e.style.color=type==='bad'?'#b91c1c':type==='good'?'#15803d':'#64748b'}
function photoState(msg,type=''){const e=$('svPhotoState');if(!e)return;e.textContent=msg;e.className='sv-photo-state '+type}
function css(){if($('svStyle'))return;const s=document.createElement('style');s.id='svStyle';s.textContent=`
.sv-card{background:#fff;border:1px solid #ddd6fe;border-radius:22px;padding:14px;margin:10px 0;box-shadow:0 5px 18px rgba(23,32,51,.05)}.sv-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.sv-title{font-size:18px;font-weight:900}.sv-badge{font-size:10px;font-weight:900;background:#ede9fe;color:#6d28d9;padding:5px 8px;border-radius:999px}.sv-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.sv-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.sv-actions button{min-height:40px}.sv-save{background:#2563eb;color:#fff}.sv-add{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}.sv-copy{background:#ede9fe;color:#5b21b6}.sv-delete{background:#fee2e2;color:#b91c1c;border:1px solid #fecaca}.sv-apply{background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff}.sv-director{background:#ffedd5;color:#9a3412;border:1px solid #fed7aa}.sv-lock{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;min-height:170px;background:#f8fafc}.sv-note{font-size:11px;color:#64748b;line-height:1.45}.sv-photos{display:flex;gap:8px;overflow-x:auto;padding:8px 0}.sv-photo{position:relative;flex:0 0 112px}.sv-photo img{width:112px;height:112px;object-fit:cover;border-radius:14px;border:1px solid #dbe3ee;background:#f8fafc}.sv-photo button{position:absolute;right:4px;top:4px;width:26px;height:26px;min-height:0;padding:0;border-radius:50%;background:rgba(15,23,42,.8);color:#fff}.sv-subject-strip{display:flex;gap:7px;overflow-x:auto;padding:7px 0}.sv-pill{white-space:nowrap;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;box-shadow:none!important}.sv-pill.active{background:#ede9fe;color:#6d28d9;border-color:#c4b5fd}.sv-photo-input{border:1px dashed #94a3b8;background:#f8fafc;padding:12px}.sv-section{border-top:1px solid #eef2f7;margin-top:12px;padding-top:12px}.sv-photo-state{display:inline-block;margin-top:7px;padding:5px 9px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:11px;font-weight:850}.sv-photo-state.saving{background:#fff7ed;color:#c2410c}.sv-photo-state.good{background:#dcfce7;color:#166534}.sv-photo-state.bad{background:#fee2e2;color:#b91c1c}
@media(max-width:700px){.sv-grid{grid-template-columns:1fr}.sv-actions button{flex:1}}
`;document.head.appendChild(s)}
function mount(){
  css();if($('subjectVaultV132'))return;
  const old=$('subjectVaultV131');if(old)old.remove();
  const box=document.createElement('div');box.id='subjectVaultV132';box.className='sv-card';
  box.innerHTML=`<div class="sv-head"><div><div class="sv-title">👤 Subject Vault</div><div class="sv-note">Reusable subject identities, continuity rules, and verified local reference photos.</div></div><span class="sv-badge">V13.2 · ADDISON</span></div>
  <div id="svStrip" class="sv-subject-strip"></div>
  <div class="sv-actions"><button id="svNew" class="sv-add">+ New Subject</button><button id="svExport" class="sv-copy">Export Subjects JSON</button><button id="svImportBtn" class="sv-copy">Import Subjects JSON</button><input id="svImport" type="file" accept="application/json" hidden></div>
  <div class="sv-grid"><div><label>Display name</label><input id="svName"></div><div><label>Subject type</label><input id="svType"></div></div>
  <label>Tags</label><input id="svTags" placeholder="athletic, brunette, editorial, tattoos…">
  <div class="sv-grid"><div><label>Face / facial geometry</label><textarea id="svFace" rows="3" placeholder="Only enter traits you want treated as established."></textarea></div><div><label>Eyes</label><textarea id="svEyes" rows="3" placeholder="Color, shape, notable appearance…"></textarea></div></div>
  <div class="sv-grid"><div><label>Hair</label><textarea id="svHair" rows="3" placeholder="Color, length, texture, highlights…"></textarea></div><div><label>Skin</label><textarea id="svSkin" rows="3" placeholder="Visible tone/texture traits you want preserved…"></textarea></div></div>
  <div class="sv-grid"><div><label>Body / proportions</label><textarea id="svBody" rows="3" placeholder="Athletic build, proportions, physique notes…"></textarea></div><div><label>Distinguishing features</label><textarea id="svDistinguishing" rows="3" placeholder="Tattoos, piercings, freckles, unique features…"></textarea></div></div>
  <label>Personality / camera presence</label><textarea id="svPersonality" rows="3" placeholder="Confident, playful, warm, candid, competitive…"></textarea>
  <label>Continuity rules</label><textarea id="svContinuity" rows="4"></textarea>
  <label>Reference notes</label><textarea id="svReferenceNotes" rows="3" placeholder="Manual notes about reference photos or recurring styling."></textarea>
  <div class="sv-actions"><button id="svSave" class="sv-save">Save Subject</button><button id="svDelete" class="sv-delete">Delete Subject</button></div>
  <div class="sv-section"><div class="sv-head"><div><b>Local reference photos</b><div class="sv-note">Stored only in this browser. They are not analyzed, sent to Ollama, or uploaded to GitHub.</div></div><b id="svPhotoCount" class="sv-note"></b></div><input id="svPhotoInput" class="sv-photo-input" type="file" accept="image/jpeg,image/png,image/webp" multiple><div id="svPhotoState" class="sv-photo-state">Checking local gallery…</div><div id="svPhotos" class="sv-photos"></div></div>
  <div class="sv-section"><div class="sv-grid"><div><label>Lock strength</label><select id="svLockMode"><option value="identity">Identity only</option><option value="persona">Identity + persona</option><option value="full" selected>Full character lock</option></select></div><div></div></div><label>Generated subject lock</label><textarea id="svLockPreview" class="sv-lock" rows="9" readonly></textarea><div class="sv-actions"><button id="svApply" class="sv-apply">Add Subject Lock to Prompt</button><button id="svDirector" class="sv-director">Send to Director</button><button id="svCopy" class="sv-copy">Copy Lock</button></div><div id="svStatus" class="sv-note">ADDISON is ready for you to define.</div></div>`;
  const anchor=$('loadCard')||$('textDirectorCard')||$('promptCard')||document.querySelector('.wrap')?.children?.[2];
  if(anchor?.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);else document.querySelector('.wrap')?.appendChild(box);
  bind();renderAll();
}
function renderStrip(){const w=$('svStrip');if(!w)return;w.innerHTML='';for(const s of subjects){const b=document.createElement('button');b.className='sv-pill'+(s.id===activeId?' active':'');b.textContent=s.name||'Unnamed';b.onclick=()=>{saveCurrent(false);activeId=s.id;persist();renderAll()};w.appendChild(b)}}
const fieldMap={svName:'name',svType:'type',svTags:'tags',svFace:'face',svEyes:'eyes',svHair:'hair',svSkin:'skin',svBody:'body',svDistinguishing:'distinguishing',svPersonality:'personality',svContinuity:'continuity',svReferenceNotes:'referenceNotes'};
function renderEditor(){const s=active();if(!s)return;for(const [id,key] of Object.entries(fieldMap)){if($(id))$(id).value=s[key]||''}updateLock()}
function saveCurrent(show=true){const s=active();if(!s)return;for(const [id,key] of Object.entries(fieldMap)){const e=$(id);if(e)s[key]=e.value}s.name=String(s.name||'').trim()||'Unnamed Subject';s.type=String(s.type||'').trim()||'Adult woman';s.updatedAt=new Date().toISOString();persist();renderStrip();updateLock();if(show)status(`${s.name} saved.`,'good')}
function updateLock(){const s=active(),mode=$('svLockMode')?.value||'full';if($('svLockPreview'))$('svLockPreview').value=buildLock(s,mode)}
function newSubject(){saveCurrent(false);const s={...seedAddison(),id:uid(),name:'New Subject',continuity:'Preserve only the subject traits defined in this profile. Keep established face, apparent adult age, eye color, hair identity, skin tone, body proportions, distinguishing features, and natural asymmetry consistent across prompts. Do not invent undefined identity details.',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};subjects.push(s);activeId=s.id;persist();renderAll();$('svName')?.focus();$('svName')?.select();status('New subject created. Rename and define the profile.','good')}
async function deleteSubject(){const s=active();if(!s)return;if(!confirm(`Delete ${s.name}? Text profile and its local reference photos will be removed.`))return;await deleteSubjectPhotos(s.id);subjects=subjects.filter(x=>x.id!==s.id);if(!subjects.length)subjects=[seedAddison()];activeId=subjects[0].id;persist();renderAll();status('Subject deleted.','good')}
function copyText(t){navigator.clipboard?.writeText(t).then(()=>status('Subject lock copied.','good')).catch(()=>status('Copy failed.','bad'))}
function applyToPrompt(){saveCurrent(false);const lock=buildLock(active(),$('svLockMode')?.value||'full');const manual=$('manualText'),add=$('addManual'),stage=$('manualStage');if(manual&&add){manual.value=lock;if(stage){const opt=[...stage.options].find(o=>/identity|subject|character/i.test(o.text+' '+o.value));if(opt)stage.value=opt.value}add.click();const im=$('identityMode');if(im&&[...im.options].some(o=>o.value==='strong'))im.value='strong';status(`${active().name} lock added as a removable prompt component.`,'good');return}const p=$('prompt')||$('workspace');if(p){if(!String(p.value||'').includes(`[SUBJECT LOCK — ${active().name.toUpperCase()}]`))p.value=[lock,String(p.value||'').trim()].filter(Boolean).join('\n\n');p.dispatchEvent(new Event('input',{bubbles:true}));status(`${active().name} lock added to the prompt.`,'good');return}status('Prompt workspace was not found. Copy the lock instead.','bad')}
function sendDirector(){saveCurrent(false);const lock=buildLock(active(),$('svLockMode')?.value||'full'),live=String(($('prompt')||$('workspace'))?.value||'').trim(),field=$('aiRawIdea')||$('idea');if(!field){status('Director field is not available yet. Try again after the Director finishes loading.','bad');return}field.value=[lock,live?`CURRENT PROMPT / IDEA:\n${live}`:''].filter(Boolean).join('\n\n');field.dispatchEvent(new Event('input',{bubbles:true}));field.scrollIntoView({behavior:'smooth',block:'center'});status(`${active().name} sent to the Director.`,'good')}
function exportSubjects(){saveCurrent(false);const payload={version:'1.1',exportedAt:new Date().toISOString(),subjects};const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(payload,null,2));a.download='ultimate-prompt-creator-subjects.json';document.body.appendChild(a);a.click();a.remove();status('Subject profiles exported. Reference photos stay local and are not included.','good')}
async function importSubjects(file){try{const text=await file.text(),incoming=normalizeImported(JSON.parse(text));if(!incoming.length)throw new Error('No subjects found in JSON.');const ids=new Set(subjects.map(x=>x.id));for(const s of incoming){if(ids.has(s.id))s.id=uid();subjects.push(s)}activeId=incoming[0].id;persist();renderAll();status(`${incoming.length} subject profile${incoming.length===1?'':'s'} imported.`,'good')}catch(e){status('Import failed: '+e.message,'bad')}}

function openPhotoDb(){if(photoDbPromise)return photoDbPromise;photoDbPromise=new Promise((resolve,reject)=>{if(!('indexedDB'in global)){reject(new Error('IndexedDB unavailable'));return}const r=indexedDB.open(PHOTO_DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(PHOTO_STORE)){const st=db.createObjectStore(PHOTO_STORE,{keyPath:'id'});st.createIndex('subjectId','subjectId',{unique:false})}};r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result)};r.onerror=()=>reject(r.error||new Error('Could not open photo storage'));r.onblocked=()=>reject(new Error('Photo database is blocked by another tab'))});return photoDbPromise}
async function allPhotos(){const db=await openPhotoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readonly'),r=tx.objectStore(PHOTO_STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error||new Error('Could not read local photo store'))})}
async function photoList(subjectId){const all=await allPhotos();return all.filter(x=>String(x.subjectId)===String(subjectId)).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')))}
async function getPhoto(id){const db=await openPhotoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readonly'),r=tx.objectStore(PHOTO_STORE).get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error||new Error('Could not verify photo'))})}
async function putPhoto(rec){const db=await openPhotoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite'),r=tx.objectStore(PHOTO_STORE).put(rec);let err=null;r.onerror=()=>{err=r.error};tx.oncomplete=()=>resolve(rec.id);tx.onerror=()=>reject(tx.error||err||new Error('Photo write failed'));tx.onabort=()=>reject(tx.error||err||new Error('Photo write aborted'))})}
async function removePhoto(id){const db=await openPhotoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite'),r=tx.objectStore(PHOTO_STORE).delete(id);let err=null;r.onerror=()=>{err=r.error};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||err||new Error('Photo delete failed'));tx.onabort=()=>reject(tx.error||err||new Error('Photo delete aborted'))})}
async function deleteSubjectPhotos(subjectId){try{const list=await photoList(subjectId);for(const p of list)await removePhoto(p.id)}catch(_){}}
function fileToDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Could not read photo'));r.readAsDataURL(file)})}
function loadImg(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Could not decode photo'));i.src=src})}
async function compressPhoto(file){const src=await fileToDataURL(file),img=await loadImg(src),max=900,iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,scale=Math.min(1,max/Math.max(iw,ih)),w=Math.max(1,Math.round(iw*scale)),h=Math.max(1,Math.round(ih*scale)),cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas is unavailable');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);const dataUrl=cv.toDataURL('image/jpeg',.80);if(!dataUrl.startsWith('data:image/jpeg'))throw new Error('Could not encode reference photo');return {dataUrl,width:w,height:h}}
async function addPhotos(files){
  const s=active(),snapshot=Array.from(files||[]);if(!s||!snapshot.length)return;
  try{
    const before=await photoList(s.id),room=MAX_PHOTOS-before.length;if(room<=0){status(`${s.name} already has ${MAX_PHOTOS} local reference photos.`,'bad');photoState(`${MAX_PHOTOS}/${MAX_PHOTOS} saved locally`,'bad');return}
    const selected=snapshot.slice(0,room);let saved=0;photoState(`Saving 0/${selected.length}…`,'saving');status(`Saving ${selected.length} local reference photo${selected.length===1?'':'s'}…`);
    for(const file of selected){
      const c=await compressPhoto(file),id=`photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,rec={id,subjectId:s.id,name:file.name||'reference.jpg',dataUrl:c.dataUrl,width:c.width,height:c.height,createdAt:new Date().toISOString()};
      await putPhoto(rec);const verify=await getPhoto(id);if(!verify||String(verify.subjectId)!==String(s.id))throw new Error('IndexedDB write verification failed');saved++;photoState(`Saving ${saved}/${selected.length}…`,'saving');
    }
    const after=await photoList(s.id);if(after.length<before.length+saved)throw new Error('Saved-photo count verification failed');await renderPhotos();status(`${saved} reference photo${saved===1?'':'s'} saved locally and verified.`,'good');photoState(`${after.length}/${MAX_PHOTOS} saved locally · verified`,'good')
  }catch(e){status('Could not save reference photo: '+e.message,'bad');photoState('Save failed — photo was not confirmed','bad')}
}
async function renderPhotos(){const w=$('svPhotos'),c=$('svPhotoCount');if(!w)return;w.innerHTML='';try{const list=await photoList(active()?.id);if(c)c.textContent=`${list.length}/${MAX_PHOTOS} saved locally`;for(const p of list){const box=document.createElement('div');box.className='sv-photo';const img=document.createElement('img');img.src=p.dataUrl;img.alt=p.name||'Reference';img.title=p.name||'Reference';const b=document.createElement('button');b.type='button';b.textContent='×';b.title='Remove reference';b.onclick=async()=>{try{await removePhoto(p.id);await renderPhotos();const left=await photoList(active()?.id);status('Reference photo removed.','good');photoState(`${left.length}/${MAX_PHOTOS} saved locally · verified`,'good')}catch(e){status('Could not remove reference photo: '+e.message,'bad')}};box.append(img,b);w.appendChild(box)}if(!list.length)w.innerHTML='<div class="sv-note">No local reference photos yet.</div>';photoState(`${list.length}/${MAX_PHOTOS} saved locally${list.length?' · verified':''}`,list.length?'good':'')}catch(e){if(c)c.textContent='Local photo storage unavailable';w.innerHTML='<div class="sv-note">Reference gallery unavailable in this browser.</div>';photoState('Local gallery unavailable','bad')}}
function renderAll(){renderStrip();renderEditor();renderPhotos()}
function bind(){
  $('svSave').onclick=()=>saveCurrent(true);$('svNew').onclick=newSubject;$('svDelete').onclick=deleteSubject;$('svCopy').onclick=()=>copyText($('svLockPreview').value);$('svApply').onclick=applyToPrompt;$('svDirector').onclick=sendDirector;$('svExport').onclick=exportSubjects;$('svImportBtn').onclick=()=>$('svImport').click();$('svImport').onchange=e=>{const f=e.target.files?.[0];e.target.value='';if(f)importSubjects(f)};
  $('svPhotoInput').onchange=e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(files.length)addPhotos(files)};
  $('svLockMode').onchange=updateLock;for(const id of Object.keys(fieldMap))$(id)?.addEventListener('input',updateLock)
}
function wait(){if(document.querySelector('.wrap'))mount();else setTimeout(wait,250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})(typeof window!=='undefined'?window:globalThis);
