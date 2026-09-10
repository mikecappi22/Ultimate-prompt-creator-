/* Ultimate Prompt Creator V14.3 Subject Profile Prefill - text only */
(function(global){
'use strict';
if(global.__UPC_SUBJECT_PROFILE_PASTE_V143__)return;global.__UPC_SUBJECT_PROFILE_PASTE_V143__=true;
const VERSION='V14.3 PROFILE PREFILL';
const STORAGE_KEY='upc_subject_vault_v131';
const ACTIVE_KEY='upc_subject_vault_active_v131';
const ALLOWED=['name','type','tags','face','eyes','hair','skin','body','distinguishing','personality','continuity','referenceNotes'];
const $=id=>typeof document!=='undefined'?document.getElementById(id):null;
function valueText(v){if(v===null||v===undefined)return'';if(Array.isArray(v))return v.map(valueText).filter(Boolean).join(', ');if(typeof v==='object')return Object.entries(v).map(([k,val])=>`${k}: ${valueText(val)}`).filter(x=>!/:\s*$/.test(x)).join('; ');return String(v).trim()}
function first(obj,keys){for(const k of keys){if(Object.prototype.hasOwnProperty.call(obj||{},k)&&obj[k]!==null&&obj[k]!==undefined)return obj[k]}return undefined}
function unwrapProfile(raw){if(Array.isArray(raw))return raw[0]||{};if(raw&&typeof raw==='object'){if(raw.subject&&typeof raw.subject==='object')return raw.subject;if(raw.profile&&typeof raw.profile==='object')return raw.profile;if(Array.isArray(raw.subjects))return raw.subjects[0]||{}}return raw||{}}
function normalizePastedProfile(raw){
  const src=unwrapProfile(raw);if(!src||typeof src!=='object'||Array.isArray(src))throw new Error('Profile JSON must contain one subject object.');
  const map={name:['name','display_name','displayName','subject_name','subjectName'],type:['type','subject_type','subjectType'],tags:['tags','keywords'],face:['face','facial_geometry','facialGeometry','face_geometry','faceGeometry'],eyes:['eyes','eye_details','eyeDetails'],hair:['hair','hair_details','hairDetails'],skin:['skin','skin_appearance','skinAppearance'],body:['body','body_proportions','bodyProportions','physique','build'],distinguishing:['distinguishing','distinguishing_features','distinguishingFeatures','unique_features','uniqueFeatures'],personality:['personality','personality_camera_presence','personalityCameraPresence','camera_presence','cameraPresence'],continuity:['continuity','continuity_rules','continuityRules'],referenceNotes:['referenceNotes','reference_notes','reference','notes']};
  const out={};for(const [dest,keys] of Object.entries(map)){const v=first(src,keys),text=valueText(v);if(text)out[dest]=text}
  if(!Object.keys(out).length)throw new Error('No recognized Subject Vault fields were found in this JSON.');return out
}
function mergeProfileIntoSubject(subject,profile,mode='overwrite'){
  if(!subject||typeof subject!=='object')throw new Error('Active subject is unavailable.');const out={...subject};let changed=0;
  for(const key of ALLOWED){if(!Object.prototype.hasOwnProperty.call(profile,key))continue;const v=valueText(profile[key]);if(!v)continue;if(mode==='blanks'&&valueText(out[key]))continue;if(valueText(out[key])!==v){out[key]=v;changed++}}
  out.id=subject.id;out.createdAt=subject.createdAt;out.updatedAt=new Date().toISOString();return{subject:out,changed}
}
function templateFor(name='SUBJECT'){return JSON.stringify({subject_profile_version:'1.0',name:String(name||'SUBJECT').toUpperCase(),type:'Adult woman',tags:[],face:'',eyes:'',hair:'',skin:'',body_proportions:'',distinguishing_features:'',personality_camera_presence:'',continuity_rules:'',reference_notes:''},null,2)}
global.SubjectProfilePasteV143Internals={VERSION,valueText,unwrapProfile,normalizePastedProfile,mergeProfileIntoSubject,templateFor,ALLOWED:[...ALLOWED]};
if(typeof document==='undefined')return;
function subjects(){try{const a=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}}
function activeId(){try{return localStorage.getItem(ACTIVE_KEY)||''}catch(_){return''}}
function activeRecord(){const a=subjects(),id=activeId();return a.find(x=>x.id===id)||a[0]||null}
function saveArray(a){localStorage.setItem(STORAGE_KEY,JSON.stringify(a))}
function setMiniStatus(msg,type=''){const e=$('svProfilePasteStatus');if(!e)return;e.textContent=msg;e.className='sv-prefill-status '+type}
function css(){if($('svPrefillStyle143'))return;const s=document.createElement('style');s.id='svPrefillStyle143';s.textContent=`.sv-prefill-btn{background:#fef3c7!important;color:#92400e!important;border:1px solid #fde68a!important}.sv-prefill-panel{margin-top:10px;padding:12px;border:1px solid #fde68a;border-radius:16px;background:#fffbeb}.sv-prefill-hidden{display:none!important}.sv-prefill-panel textarea{width:100%;box-sizing:border-box;min-height:230px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.sv-prefill-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:end}.sv-prefill-status{display:inline-block;margin-top:8px;padding:6px 9px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:11px;font-weight:800}.sv-prefill-status.good{background:#dcfce7;color:#166534}.sv-prefill-status.bad{background:#fee2e2;color:#b91c1c}.sv-prefill-status.info{background:#dbeafe;color:#1d4ed8}@media(max-width:700px){.sv-prefill-row{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function currentName(){return String(activeRecord()?.name||$('svName')?.value||'SUBJECT').trim()||'SUBJECT'}
function fillEditor(s){const m={svName:'name',svType:'type',svTags:'tags',svFace:'face',svEyes:'eyes',svHair:'hair',svSkin:'skin',svBody:'body',svDistinguishing:'distinguishing',svPersonality:'personality',svContinuity:'continuity',svReferenceNotes:'referenceNotes'};for(const [id,key] of Object.entries(m)){const e=$(id);if(e){e.value=s[key]||'';e.dispatchEvent(new Event('input',{bubbles:true}))}}}
function togglePanel(open){const p=$('svProfilePastePanel');if(!p)return;const show=open!==undefined?open:p.classList.contains('sv-prefill-hidden');p.classList.toggle('sv-prefill-hidden',!show);if(show){$('svProfileApply').textContent=`Apply & Save to ${currentName()}`;$('svProfileJson')?.focus();setMiniStatus(`Paste the Subject Vault JSON for ${currentName()} below.`,'info')}}
function loadTemplate(){$('svProfileJson').value=templateFor(currentName());setMiniStatus('Template loaded. Replace the blank values with the profile generated in ChatGPT.','info')}
function applyPasted(){
  try{
    const text=String($('svProfileJson')?.value||'').trim();if(!text)throw new Error('Paste a profile JSON object first.');
    const profile=normalizePastedProfile(JSON.parse(text)),a=subjects(),id=activeId(),rawIdx=a.findIndex(x=>x.id===id),idx=rawIdx>=0?rawIdx:0;
    if(!a.length||!a[idx])throw new Error('No active Subject Vault record was found.');
    const current=a[idx],incomingName=valueText(profile.name);
    if(incomingName&&valueText(current.name)&&incomingName.toLowerCase()!==valueText(current.name).toLowerCase()){
      if(!confirm(`This JSON is named ${incomingName}, but the active subject is ${current.name}. Apply it to ${current.name} anyway?`))return
    }
    const mode=$('svProfileMergeMode')?.value||'overwrite',merged=mergeProfileIntoSubject(current,profile,mode);a[idx]=merged.subject;saveArray(a);fillEditor(merged.subject);$('svSave')?.click();
    setMiniStatus(`${merged.changed} field${merged.changed===1?'':'s'} applied to ${merged.subject.name}.`,'good');
    const host=$('svStatus');if(host){host.textContent=`${merged.subject.name} profile prefilled from pasted JSON. ${merged.changed} field${merged.changed===1?'':'s'} updated.`;host.style.color='#15803d'}
  }catch(e){setMiniStatus('Could not apply profile: '+e.message,'bad')}
}
function install(){
  const vault=$('subjectVaultV143');if(!vault){setTimeout(install,250);return}if($('svPasteProfileBtn'))return;css();
  const top=vault.querySelector('.sv-top-actions')||vault.querySelector('.sv-actions');if(!top){setTimeout(install,250);return}
  const btn=document.createElement('button');btn.id='svPasteProfileBtn';btn.type='button';btn.className='sv-copy sv-prefill-btn';btn.textContent='Paste Profile JSON';top.appendChild(btn);
  const panel=document.createElement('div');panel.id='svProfilePastePanel';panel.className='sv-prefill-panel sv-prefill-hidden';panel.innerHTML=`<div class="sv-head"><div><b>ChatGPT Profile Prefill</b><div class="sv-note">Paste one subject JSON profile. Only recognized text fields are merged into the active subject.</div></div><span class="sv-badge">TEXT ONLY</span></div><div class="sv-prefill-row"><div><label>Merge behavior</label><select id="svProfileMergeMode"><option value="overwrite" selected>Overwrite only fields provided in JSON</option><option value="blanks">Fill blank fields only</option></select></div><div class="sv-actions"><button id="svProfileTemplate" type="button" class="sv-copy">Load JSON Template</button><button id="svProfileClose" type="button" class="sv-copy">Close</button></div></div><label>Subject profile JSON</label><textarea id="svProfileJson" spellcheck="false" placeholder="Paste the JSON generated by ChatGPT here..."></textarea><div class="sv-actions"><button id="svProfileApply" type="button" class="sv-save">Apply & Save</button></div><div id="svProfilePasteStatus" class="sv-prefill-status">Ready for profile JSON.</div>`;
  top.insertAdjacentElement('afterend',panel);btn.onclick=()=>togglePanel();$('svProfileClose').onclick=()=>togglePanel(false);$('svProfileTemplate').onclick=loadTemplate;$('svProfileApply').onclick=applyPasted
}
function wait(){if($('subjectVaultV143'))install();else setTimeout(wait,250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})(typeof window!=='undefined'?window:globalThis);
