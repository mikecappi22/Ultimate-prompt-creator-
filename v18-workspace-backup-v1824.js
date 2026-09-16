/* UPC V18.24 EXPORT / IMPORT WORKSPACE BACKUP */
(function(g){'use strict';if(g.__UPC_V1824_BACKUP__)return;g.__UPC_V1824_BACKUP__=1;

const VERSION='18.24';
const SCHEMA='UPC_WORKSPACE_BACKUP';
const SNAP_KEY='UPC1824_PRE_IMPORT_SNAPSHOT';
const FIELD_IDS={
 hair:'uc_hair',makeup:'uc_makeup',expression:'uc_expression',nails:'uc_nails',
 top:'uc_top',bottom:'uc_bottom',footwear:'uc_footwear',accessories:'uc_accessories',
 pose:'uc_pose',scene:'uc_scene',environment:'uc_environment',camera:'uc_camera',
 lighting:'uc_lighting',realism:'uc_realism',constraints:'uc_constraints',
 target:'uc_target',aspect:'uc_aspect',format:'v1820_format',media:'v1820_media',preset:'v1820_preset',identity:'uc_subject_lock'
};
const $=id=>document.getElementById(id);
function esc(s){return String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m))}
function now(){return new Date().toISOString()}
function safeName(s){return String(s||'').replace(/[:.]/g,'-').replace(/[^a-z0-9_-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')}
function upcKey(k){return /^upc/i.test(String(k||'')) || /^UPC/i.test(String(k||''))}
function collectLocalStorage(){const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&upcKey(k))o[k]=localStorage.getItem(k)}return o}
function collectLiveFields(){const o={};for(const [k,id] of Object.entries(FIELD_IDS)){const e=$(id);if(e)o[k]=String(e.value??'')}return o}
function moduleMarkers(){const names=['__UPC_V181_CLEAN_DB__','__UPC_V182_HAIR__','__UPC_V183_MAKEUP__','__UPC_V184_EXPRESSION__','__UPC_V185_NAILS__','__UPC_V186_TOP__','__UPC_V187_BOTTOM__','__UPC_V188_FOOTWEAR__','__UPC_V189_ACCESSORIES__','__UPC_V1810_POSE__','__UPC_V1811_SCENE__','__UPC_V1812_ENVIRONMENT__','__UPC_V1813_CAMERA__','__UPC_V1814_LIGHTING__','__UPC_V1815_REALISM__','__UPC_V1816_CONSTRAINTS__','__UPC_V1817_AUDIT__','__UPC_V1818_STACK__','__UPC_V1819_PRESETS__','__UPC_V1820_COMPOSER__','__UPC_V1821_RECIPES__','__UPC_V1822_VARIATIONS__','__UPC_V1823_ANALYZER__'];return names.filter(n=>!!g[n])}
function counts(){let recipes=0,subjects=0;try{const r=JSON.parse(localStorage.getItem('upc_saved_recipes_v1821')||'[]');if(Array.isArray(r))recipes=r.length}catch(_){}try{const s=JSON.parse(localStorage.getItem('upc_subject_vault_v131')||'[]');if(Array.isArray(s))subjects=s.length}catch(_){}return{savedRecipes:recipes,legacySubjectProfiles:subjects,storageKeys:Object.keys(collectLocalStorage()).length}}
function canonical(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}'}
async function sha256(text){try{if(!crypto?.subtle)return null;const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}catch(_){return null}}
async function makeBackup(){
 const backup={schema:SCHEMA,backupVersion:VERSION,exportedAt:now(),app:{title:document.title,url:location.href,markers:moduleMarkers()},summary:counts(),liveFields:collectLiveFields(),localStorage:collectLocalStorage(),notes:'UPC workspace backup. Reference images are not embedded; this file contains text/settings stored by UPC in this browser.'};
 backup.checksum=await sha256(canonical(backup));return backup;
}
function downloadJSON(obj){const stamp=safeName(obj.exportedAt||now());const name=`UPC-workspace-backup-v${VERSION}-${stamp}.json`;const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);return name}
async function exportBackup(){const b=await makeBackup();const name=downloadJSON(b);localStorage.setItem('upc_last_export_v1824',JSON.stringify({name,at:now(),checksum:b.checksum||''}));return b}
async function verifyBackup(b){
 if(!b||b.schema!==SCHEMA)throw new Error('This is not a UPC V18.24 workspace backup.');
 if(!b.localStorage||typeof b.localStorage!=='object')throw new Error('Backup is missing the localStorage payload.');
 if(b.checksum){const clone=JSON.parse(JSON.stringify(b));const expected=clone.checksum;delete clone.checksum;const actual=await sha256(canonical(clone));if(actual&&actual!==expected)throw new Error('Backup checksum does not match. The file may be incomplete or modified.');}
 return true;
}
function snapshotCurrent(){const snap={at:now(),localStorage:collectLocalStorage(),liveFields:collectLiveFields()};sessionStorage.setItem(SNAP_KEY,JSON.stringify(snap));return snap}
function clearUPCStorage(){const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&upcKey(k))keys.push(k)}keys.forEach(k=>localStorage.removeItem(k));return keys.length}
function applyLiveFields(fields){if(!fields||typeof fields!=='object')return 0;let n=0;for(const [k,v] of Object.entries(fields)){const id=FIELD_IDS[k];const e=id&&$(id);if(!e)continue;e.value=String(v??'');e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));if(e.tagName==='SELECT')e.dispatchEvent(new Event('input',{bubbles:true}));n++}return n}
async function importBackup(b,mode='merge'){
 await verifyBackup(b);snapshotCurrent();
 try{
  if(mode==='replace')clearUPCStorage();
  let keys=0;for(const [k,v] of Object.entries(b.localStorage||{})){if(!upcKey(k))continue;localStorage.setItem(k,String(v));keys++}
  const fields=applyLiveFields(b.liveFields||{});
  const identity=localStorage.getItem('upc_reference_identity_lock_v1822');if(identity&&$('uc_subject_lock'))$('uc_subject_lock').value=identity;
  localStorage.setItem('upc_last_import_v1824',JSON.stringify({at:now(),mode,backupVersion:b.backupVersion||'',exportedAt:b.exportedAt||'',keys,fields}));
  setTimeout(()=>{g.UPCV1820Composer?.refresh?.();g.UPCV1823Analyzer?.run?.()},80);
  return{keys,fields,mode};
 }catch(e){rollback();throw e}
}
function rollback(){try{const raw=sessionStorage.getItem(SNAP_KEY);if(!raw)return false;const s=JSON.parse(raw);clearUPCStorage();for(const [k,v] of Object.entries(s.localStorage||{}))if(upcKey(k))localStorage.setItem(k,String(v));applyLiveFields(s.liveFields||{});setTimeout(()=>g.UPCV1820Composer?.refresh?.(),50);return true}catch(_){return false}}
function inspect(b){return{version:b.backupVersion||'unknown',exportedAt:b.exportedAt||'unknown',storageKeys:Object.keys(b.localStorage||{}).length,liveFields:Object.keys(b.liveFields||{}).length,recipes:b.summary?.savedRecipes??'?',subjects:b.summary?.legacySubjectProfiles??'?',checksum:!!b.checksum}}

let pending=null;
function setStatus(msg,good=true){const e=$('v1824_status');if(!e)return;e.textContent=msg;e.style.background=good?'#dcfce7':'#fee2e2';e.style.color=good?'#166534':'#991b1b';e.hidden=false}
function renderPreview(b){const p=$('v1824_preview');if(!p)return;const x=inspect(b);p.innerHTML=`<b>Backup ready</b><small>Version ${esc(x.version)} · exported ${esc(x.exportedAt)}</small><div>${x.storageKeys} UPC storage keys · ${x.liveFields} live fields · ${esc(x.recipes)} saved recipes · ${esc(x.subjects)} preserved legacy subject profiles · checksum ${x.checksum?'yes':'no'}</div>`;p.hidden=false}
function mount(){
 const host=$('v1820_composer');if(!host)return setTimeout(mount,350);if($('v1824_backup'))return;
 const box=document.createElement('div');box.id='v1824_backup';box.innerHTML=`<div class="v1824-head"><div><b>Workspace Backup</b><small>Export or restore UPC settings, recipes, identity lock, custom/local data, and current Create selections in one JSON file.</small></div><span>V18.24</span></div><div class="v1824-note"><b>Reference photos are not included.</b> This backup contains UPC text/settings stored in this browser, including any preserved legacy Subject Vault text profiles.</div><div class="v1824-actions"><button id="v1824_export" type="button">Export Full Workspace</button><label class="v1824-file">Choose Backup<input id="v1824_file" type="file" accept="application/json,.json"></label><button id="v1824_merge" type="button" disabled>Import + Merge</button><button id="v1824_replace" type="button" disabled>Import + Replace</button><button id="v1824_rollback" type="button">Rollback Last Import</button></div><div id="v1824_status" hidden></div><div id="v1824_preview" hidden></div>`;
 host.appendChild(box);
 const style=document.createElement('style');style.id='v1824_style';style.textContent=`#v1824_backup{margin-top:12px;border:1px solid #cbd5e1;border-radius:14px;padding:12px;background:#f8fafc;font:12px system-ui}.v1824-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.v1824-head b{font-size:15px}.v1824-head small{display:block;color:#64748b;margin-top:2px}.v1824-head span{font-size:9px;font-weight:900;background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:5px 8px}.v1824-note{margin:9px 0;padding:8px;border-radius:8px;background:#fffbeb;color:#92400e}.v1824-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.v1824-actions button,.v1824-file{border:0;border-radius:8px;padding:8px 10px;font-weight:800;background:#1d4ed8;color:white;cursor:pointer}.v1824-actions button:disabled{opacity:.45;cursor:not-allowed}.v1824-actions #v1824_replace{background:#7c3aed}.v1824-actions #v1824_rollback{background:#475569}.v1824-file{background:#0f766e;display:inline-block}.v1824-file input{display:none}#v1824_status,#v1824_preview{margin-top:9px;padding:8px 10px;border-radius:9px}#v1824_preview{background:#eef2ff;color:#3730a3}#v1824_preview small{display:block;margin:2px 0 5px;color:#64748b}@media(max-width:650px){.v1824-actions>*{width:100%;box-sizing:border-box;text-align:center}}`;document.head.appendChild(style);
 $('v1824_export').onclick=async()=>{try{const b=await exportBackup();setStatus(`Exported ${b.summary.storageKeys} UPC storage keys successfully.`)}catch(e){setStatus(e.message,false)}};
 $('v1824_file').onchange=async e=>{const f=e.target.files?.[0];pending=null;$('v1824_merge').disabled=true;$('v1824_replace').disabled=true;$('v1824_preview').hidden=true;if(!f)return;try{const b=JSON.parse(await f.text());await verifyBackup(b);pending=b;renderPreview(b);$('v1824_merge').disabled=false;$('v1824_replace').disabled=false;setStatus('Backup verified and ready to import.')}catch(err){setStatus(err.message,false)}};
 $('v1824_merge').onclick=async()=>{if(!pending)return;try{const r=await importBackup(pending,'merge');setStatus(`Merged ${r.keys} UPC storage keys and restored ${r.fields} live fields.`)}catch(e){setStatus(e.message,false)}};
 $('v1824_replace').onclick=async()=>{if(!pending)return;if(!confirm('Replace current UPC local workspace data with this backup? A temporary rollback snapshot will be created first.'))return;try{const r=await importBackup(pending,'replace');setStatus(`Replaced workspace with ${r.keys} backup keys. Reload UPC for a completely clean restore.`);setTimeout(()=>{if(confirm('Restore complete. Reload UPC now?'))location.reload()},350)}catch(e){setStatus(e.message,false)}};
 $('v1824_rollback').onclick=()=>{if(rollback())setStatus('Rolled back to the workspace state from immediately before the last import.');else setStatus('No pre-import rollback snapshot is available in this tab.',false)};
 g.UPCV1824Backup={version:VERSION,makeBackup,exportBackup,verifyBackup,importBackup,rollback,inspect};
 console.log('[UPC V18.24 Workspace Backup] mounted');
}
function boot(){setTimeout(mount,1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
