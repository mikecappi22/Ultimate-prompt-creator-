/* Ultimate Prompt Creator V14.5 Production Hub - Projects + Prompt History + Shot Builder
   Text-only project orchestration. No image storage. */
(function(global){
'use strict';
if(global.__UPC_PRODUCTION_HUB_V145__)return;global.__UPC_PRODUCTION_HUB_V145__=true;

const VERSION='V14.5 PRODUCTION HUB';
const PROJECTS_KEY='upc_projects_v145';
const ACTIVE_PROJECT_KEY='upc_active_project_v145';
const HISTORY_KEY='upc_prompt_history_v145';
const SHOT_WORK_KEY='upc_shot_builder_v145';
const SUBJECT_KEY='upc_subject_vault_v131';
const ACTIVE_SUBJECT_KEY='upc_subject_vault_active_v131';
const COMPOSER_KEY='upc_smart_composer_v144';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??d}catch(_){return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const uid=p=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const now=()=>new Date().toISOString();
const trimText=(s,max=16000)=>String(s||'').slice(0,max);

const COMPOSER_FIELDS={
  scSubjectLock:'subjectLock',scLockMode:'lockMode',scTarget:'targetModel',scMedia:'media',
  scAspect:'aspect',scOutputStyle:'outputStyle',scScene:'scene',scTop:'top',scBottom:'bottom',
  scFootwear:'footwear',scAccessories:'accessories',scHair:'hair',scMakeup:'makeup',
  scExpression:'expression',scPoseAction:'poseAction',scEnvironment:'environment',
  scLighting:'lighting',scCamera:'camera',scRealism:'realism',scConstraints:'constraints'
};

const DEFAULT_SHOT_SETTINGS={
  targetModel:'Seedance 2.5',
  aspect:'2:3',
  totalDuration:'10–12 sec',
  characterCount:'1',
  generationGoal:'',
  referenceAssignments:'Use the active Subject Vault profile as the written identity source. Upload any required reference images directly to the target image/video generator when generating; reference images are not stored in Ultimate Prompt Creator.',
  environmentLock:'',
  cameraSystem:'',
  continuity:'Preserve subject identity, wardrobe, environment geography, lighting direction, props, tattoos/piercings that are established in the subject profile, and physically believable anatomy across every shot. Keep natural skin texture, facial asymmetry, fabric behavior, hair motion, and spatial continuity.',
  audio:'Natural location sound unless dialogue or music is explicitly specified. Keep dialogue lip sync and room tone coherent between cuts.',
  finalShot:''
};
function blankShot(n=1){
  return {id:uid('shot'),title:`Shot ${n}`,duration:'2–3 sec',framing:'Medium shot',angle:'Eye level',movement:'Gentle handheld or stabilized movement',action:'',expressionDialogue:'',notes:''};
}
let shotState=read(SHOT_WORK_KEY,{settings:{...DEFAULT_SHOT_SETTINGS},shots:[blankShot(1)]});
shotState.settings={...DEFAULT_SHOT_SETTINGS,...(shotState.settings||{})};
if(!Array.isArray(shotState.shots)||!shotState.shots.length)shotState.shots=[blankShot(1)];

let projects=read(PROJECTS_KEY,[]);
if(!Array.isArray(projects))projects=[];
let activeProjectId=localStorage.getItem(ACTIVE_PROJECT_KEY)||projects[0]?.id||'';
let history=read(HISTORY_KEY,[]);
if(!Array.isArray(history))history=[];
let compareA='',compareB='',historyScope='project';

function subjects(){const a=read(SUBJECT_KEY,[]);return Array.isArray(a)?a:[]}
function subjectById(id){return subjects().find(s=>s.id===id)||null}
function activeSubject(){const a=subjects(),id=localStorage.getItem(ACTIVE_SUBJECT_KEY)||'';return a.find(s=>s.id===id)||a[0]||null}
function activeProject(){return projects.find(p=>p.id===activeProjectId)||null}
function saveProjects(){write(PROJECTS_KEY,projects);if(activeProjectId)localStorage.setItem(ACTIVE_PROJECT_KEY,activeProjectId);else localStorage.removeItem(ACTIVE_PROJECT_KEY)}
function saveShots(){write(SHOT_WORK_KEY,shotState)}
function saveHistory(){history=history.slice(0,90);write(HISTORY_KEY,history)}
function status(msg,type=''){const e=$('prodStatus');if(!e)return;e.textContent=msg;e.className='prod-status '+type}
function shotStatus(msg,type=''){const e=$('shotStatus');if(!e)return;e.textContent=msg;e.className='prod-status '+type}
function historyStatus(msg,type=''){const e=$('historyStatus');if(!e)return;e.textContent=msg;e.className='prod-status '+type}

function captureComposer(){
  const stored={...(read(COMPOSER_KEY,{})||{})};
  for(const [id,key] of Object.entries(COMPOSER_FIELDS)){
    const el=$(id);
    if(!el)continue;
    stored[key]=el.type==='checkbox'?!!el.checked:el.value;
  }
  return stored;
}
function applyComposer(snap){
  if(!snap||typeof snap!=='object')return;
  const merged={...(read(COMPOSER_KEY,{})||{}),...snap};
  write(COMPOSER_KEY,merged);
  for(const [id,key] of Object.entries(COMPOSER_FIELDS)){
    const el=$(id); if(!el || !(key in merged))continue;
    if(el.type==='checkbox')el.checked=!!merged[key]; else el.value=merged[key]??'';
    el.dispatchEvent(new Event(el.type==='checkbox'?'change':'input',{bubbles:true}));
    if(el.tagName==='SELECT')el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  global.SmartComposerV144?.activate?.();
}
function subjectLockText(){
  const s=activeSubject();if(!s)return'';
  const fn=global.SubjectVaultV143Internals?.buildLock||global.SubjectVaultV142Internals?.buildLock;
  if(typeof fn==='function')return fn(s,'full');
  const rows=[`[SUBJECT LOCK - ${String(s.name||'SUBJECT').toUpperCase()}]`];
  for(const [k,v] of [['FACE',s.face],['EYES',s.eyes],['HAIR',s.hair],['SKIN',s.skin],['BODY / PROPORTIONS',s.body],['DISTINGUISHING FEATURES',s.distinguishing],['CONTINUITY RULES',s.continuity]])if(String(v||'').trim())rows.push(`${k}: ${v}`);
  return rows.join('\n');
}
function selectSubjectForProject(id){
  if(!id)return true;
  const s=subjectById(id);if(!s)return false;
  if(localStorage.getItem(ACTIVE_SUBJECT_KEY)===id)return true;
  const search=$('svSearch'),browse=$('svBrowse');
  try{
    browse?.click();
    if(search){search.value=s.name;search.dispatchEvent(new Event('input',{bubbles:true}))}
    const cards=[...document.querySelectorAll('.sv-subject-card')];
    const target=cards.find(b=>String(b.querySelector('strong')?.textContent||'').trim().toLowerCase()===String(s.name).trim().toLowerCase());
    if(target){target.click();return true}
  }catch(_){}
  localStorage.setItem(ACTIVE_SUBJECT_KEY,id);
  global.SmartComposerV144?.activate?.();
  return true;
}
function projectTemplate(name='New Project'){
  const s=activeSubject();
  return {
    id:uid('project'),name,tags:'',status:'Active',notes:'',
    subjectId:s?.id||'',workspace:trimText($('workspace')?.value||''),
    composer:captureComposer(),
    shotState:JSON.parse(JSON.stringify(shotState)),
    createdAt:now(),updatedAt:now()
  };
}
function newProject(){
  const p=projectTemplate(`Project ${projects.length+1}`);
  projects.unshift(p);activeProjectId=p.id;saveProjects();renderProjectList();renderProjectEditor();setTimeout(()=>{$('projName')?.focus();$('projName')?.select()},30);status('New project created from the current workspace. Rename it and save when ready.','good')
}
function readProjectForm(){
  const p=activeProject();if(!p)return;
  p.name=String($('projName')?.value||p.name||'Untitled Project').trim()||'Untitled Project';
  p.status=$('projStatus')?.value||p.status||'Active';
  p.tags=String($('projTags')?.value||'');
  p.notes=String($('projNotes')?.value||'');
}
function saveProject(){
  const p=activeProject();if(!p)return status('Create or choose a project first.','bad');
  readProjectForm();
  p.subjectId=activeSubject()?.id||p.subjectId||'';
  p.workspace=trimText($('workspace')?.value||'');
  p.composer=captureComposer();
  p.shotState=JSON.parse(JSON.stringify(shotState));
  p.updatedAt=now();saveProjects();renderProjectList();renderProjectEditor();
  autoSnapshot('Project Save',p.workspace,`Saved ${p.name}`);
  status(`${p.name} saved with current Subject, Smart Build, Prompt Workspace and Shot Builder state.`,'good')
}
function loadProject(){
  const p=activeProject();if(!p)return status('Choose a project first.','bad');
  readProjectForm();
  const ok=selectSubjectForProject(p.subjectId);
  if(p.composer)applyComposer(p.composer);
  if($('workspace')){$('workspace').value=p.workspace||'';$('workspace').dispatchEvent(new Event('input',{bubbles:true}))}
  if(p.shotState){shotState=JSON.parse(JSON.stringify(p.shotState));shotState.settings={...DEFAULT_SHOT_SETTINGS,...(shotState.settings||{})};if(!shotState.shots?.length)shotState.shots=[blankShot(1)];saveShots();syncShotSettingsToUI();renderShots();renderShotPrompt()}
  renderProjectEditor();
  status(ok?`${p.name} loaded into the live workspace.`:`${p.name} loaded, but its saved subject is no longer in Subject Vault.` ,ok?'good':'bad')
}
function duplicateProject(){
  const p=activeProject();if(!p)return;
  const copy=JSON.parse(JSON.stringify(p));copy.id=uid('project');copy.name=`${p.name} Copy`;copy.createdAt=copy.updatedAt=now();
  projects.unshift(copy);activeProjectId=copy.id;saveProjects();renderProjectList();renderProjectEditor();status('Project duplicated.','good')
}
function deleteProject(){
  const p=activeProject();if(!p)return;
  if(!confirm(`Delete project "${p.name}"? Subject Vault profiles are not affected.`))return;
  projects=projects.filter(x=>x.id!==p.id);activeProjectId=projects[0]?.id||'';saveProjects();renderProjectList();renderProjectEditor();renderHistory();status('Project deleted.','good')
}
function exportProjects(){
  readProjectForm();saveProjects();
  const payload={version:'1.0',platform:'Ultimate Prompt Creator V14.5',exportedAt:now(),projects};
  const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(payload,null,2));a.download='ultimate-prompt-creator-projects-v145.json';a.click();status('Projects exported as text-only JSON.','good')
}
async function importProjects(file){
  try{
    const raw=JSON.parse(await file.text()),incoming=Array.isArray(raw)?raw:Array.isArray(raw?.projects)?raw.projects:[];
    if(!incoming.length)throw new Error('No projects found.');
    const ids=new Set(projects.map(p=>p.id));
    const cleaned=incoming.map(x=>({...projectTemplate(String(x.name||'Imported Project')), ...x, id:ids.has(x.id)?uid('project'):String(x.id||uid('project')),updatedAt:now()}));
    projects=[...cleaned,...projects].slice(0,100);activeProjectId=cleaned[0].id;saveProjects();renderProjectList();renderProjectEditor();status(`Imported ${cleaned.length} project${cleaned.length===1?'':'s'}.`,'good')
  }catch(e){status('Project import failed: '+e.message,'bad')}
}
function projectSummary(p){
  const s=subjectById(p.subjectId);const bits=[p.status,s?.name,`${p.shotState?.shots?.length||0} shots`].filter(Boolean);return bits.join(' · ')
}
function renderProjectList(){
  const root=$('projectCards');if(!root)return;
  const q=String($('projectSearch')?.value||'').trim().toLowerCase();
  let list=[...projects].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  if(q)list=list.filter(p=>[p.name,p.tags,p.status,p.notes,subjectById(p.subjectId)?.name].join(' ').toLowerCase().includes(q));
  root.innerHTML='';
  $('projectCount').textContent=`${list.length} shown · ${projects.length} total`;
  if(!list.length){root.innerHTML='<div class="prod-empty">No matching projects. Create one from your current work.</div>';return}
  for(const p of list){
    const b=document.createElement('button');b.className='project-card'+(p.id===activeProjectId?' active':'');
    b.innerHTML=`<strong>${esc(p.name||'Untitled Project')}</strong><span>${esc(projectSummary(p))}</span><small>${esc(formatDate(p.updatedAt))}</small>`;
    b.onclick=()=>{readProjectForm();activeProjectId=p.id;saveProjects();renderProjectList();renderProjectEditor();renderHistory();};
    root.appendChild(b)
  }
}
function renderProjectEditor(){
  const p=activeProject(),empty=$('projectEmpty'),form=$('projectEditor');
  if(!p){if(empty)empty.classList.remove('hidden');if(form)form.classList.add('hidden');return}
  empty?.classList.add('hidden');form?.classList.remove('hidden');
  $('projName').value=p.name||'';$('projStatus').value=p.status||'Active';$('projTags').value=p.tags||'';$('projNotes').value=p.notes||'';
  const s=subjectById(p.subjectId)||activeSubject();$('projSubject').textContent=s?.name||'No subject';
  $('projUpdated').textContent=formatDate(p.updatedAt);
  $('projShots').textContent=String(p.shotState?.shots?.length||0);
  $('projHistory').textContent=String(history.filter(h=>h.projectId===p.id).length)
}
function formatDate(v){if(!v)return'';try{return new Date(v).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch(_){return v}}

function snapshotText(source){
  if(source==='Smart Build')return trimText(global.SmartComposerV144?.buildPrompt?.()||$('scPreview')?.value||'');
  if(source==='Shot Builder')return trimText(buildShotPrompt());
  return trimText($('workspace')?.value||'');
}
function addHistory(source,text,label='',force=false){
  text=trimText(text);
  if(!text.trim())return false;
  const p=activeProject();
  const last=history[0];
  if(!force&&last&&last.text===text&&last.projectId===(p?.id||''))return false;
  history.unshift({id:uid('hist'),projectId:p?.id||'',projectName:p?.name||'',source,label:label||source,text,createdAt:now()});
  saveHistory();renderHistory();renderCompare();return true
}
function autoSnapshot(source,text,label=''){
  if(addHistory(source,text,label,false))historyStatus(`History captured: ${source}.`,'good')
}
function manualSnapshot(source){
  const label=String($('historyLabel')?.value||'').trim();
  const text=snapshotText(source);
  if(addHistory(source,text,label||source,true)){if($('historyLabel'))$('historyLabel').value='';historyStatus(`${source} snapshot saved.`,'good')}
  else historyStatus(`Nothing to save from ${source}.`,'bad')
}
function scopedHistory(){
  let a=[...history],q=String($('historySearch')?.value||'').trim().toLowerCase();
  if(historyScope==='project'&&activeProjectId)a=a.filter(h=>h.projectId===activeProjectId);
  if(q)a=a.filter(h=>[h.label,h.source,h.projectName,h.text].join(' ').toLowerCase().includes(q));
  return a
}
function renderHistory(){
  const root=$('historyList');if(!root)return;
  historyScope=$('historyScope')?.value||historyScope;
  const list=scopedHistory();
  $('historyCount').textContent=`${list.length} shown · ${history.length} stored`;
  root.innerHTML='';
  if(!list.length){root.innerHTML='<div class="prod-empty">No prompt history yet. Save a snapshot or send work into Prompt Workspace.</div>';renderCompare();return}
  for(const h of list.slice(0,40)){
    const row=document.createElement('div');row.className='history-row';
    row.innerHTML=`<div class="history-main"><strong>${esc(h.label||h.source)}</strong><span>${esc(h.source)}${h.projectName?' · '+esc(h.projectName):''} · ${esc(formatDate(h.createdAt))}</span><p>${esc(h.text.slice(0,180))}${h.text.length>180?'…':''}</p></div>`;
    const a=document.createElement('div');a.className='history-actions';
    const ba=mini('A',()=>{compareA=h.id;renderCompare()}),bb=mini('B',()=>{compareB=h.id;renderCompare()}),restore=mini('Restore',()=>restoreHistory(h)),del=mini('Delete',()=>deleteHistory(h.id),'danger');
    a.append(ba,bb,restore,del);row.appendChild(a);root.appendChild(row)
  }
  renderCompare()
}
function mini(text,fn,cls=''){const b=document.createElement('button');b.textContent=text;b.className='prod-mini '+cls;b.onclick=fn;return b}
function restoreHistory(h){
  if(!$('workspace'))return;
  $('workspace').value=h.text;$('workspace').dispatchEvent(new Event('input',{bubbles:true}));
  historyStatus(`Restored "${h.label||h.source}" to Prompt Workspace.`,'good');global.UPCShowPanel?.('prompt')
}
function deleteHistory(id){
  history=history.filter(h=>h.id!==id);if(compareA===id)compareA='';if(compareB===id)compareB='';saveHistory();renderHistory()
}
function renderCompare(){
  const a=history.find(h=>h.id===compareA),b=history.find(h=>h.id===compareB);
  if($('compareALabel'))$('compareALabel').textContent=a?`${a.label||a.source} · ${formatDate(a.createdAt)}`:'Select A from history';
  if($('compareBLabel'))$('compareBLabel').textContent=b?`${b.label||b.source} · ${formatDate(b.createdAt)}`:'Select B from history';
  if($('compareAText'))$('compareAText').value=a?.text||'';
  if($('compareBText'))$('compareBText').value=b?.text||'';
  if($('compareStats')){
    if(a&&b){const delta=b.text.length-a.text.length;$('compareStats').textContent=`A: ${a.text.length.toLocaleString()} chars · B: ${b.text.length.toLocaleString()} chars · Δ ${delta>=0?'+':''}${delta.toLocaleString()}`}
    else $('compareStats').textContent='Pick two history entries using A and B.'
  }
}
function clearHistory(){
  const scoped=historyScope==='project'&&activeProjectId;
  const msg=scoped?'Clear history for the current project?':'Clear ALL saved prompt history?';
  if(!confirm(msg))return;
  history=scoped?history.filter(h=>h.projectId!==activeProjectId):[];
  compareA=compareB='';saveHistory();renderHistory();historyStatus('History cleared.','good')
}

function syncShotSettingsFromUI(){
  const map={shotTarget:'targetModel',shotAspect:'aspect',shotTotalDuration:'totalDuration',shotCharacterCount:'characterCount',shotGenerationGoal:'generationGoal',shotReferenceAssignments:'referenceAssignments',shotEnvironment:'environmentLock',shotCameraSystem:'cameraSystem',shotContinuity:'continuity',shotAudio:'audio',shotFinal:'finalShot'};
  for(const [id,k] of Object.entries(map))if($(id))shotState.settings[k]=$(id).value;
  saveShots();renderShotPrompt()
}
function syncShotSettingsToUI(){
  const map={shotTarget:'targetModel',shotAspect:'aspect',shotTotalDuration:'totalDuration',shotCharacterCount:'characterCount',shotGenerationGoal:'generationGoal',shotReferenceAssignments:'referenceAssignments',shotEnvironment:'environmentLock',shotCameraSystem:'cameraSystem',shotContinuity:'continuity',shotAudio:'audio',shotFinal:'finalShot'};
  for(const [id,k] of Object.entries(map))if($(id))$(id).value=shotState.settings[k]??''
}
function updateShot(id,key,value){const s=shotState.shots.find(x=>x.id===id);if(!s)return;s[key]=value;saveShots();renderShotPrompt()}
function addShot(afterId=''){
  const idx=afterId?shotState.shots.findIndex(s=>s.id===afterId):-1;
  const s=blankShot(shotState.shots.length+1);
  if(idx>=0)shotState.shots.splice(idx+1,0,s);else shotState.shots.push(s);
  renumberShots();saveShots();renderShots();renderShotPrompt();shotStatus('Shot added.','good')
}
function duplicateShot(id){const idx=shotState.shots.findIndex(s=>s.id===id);if(idx<0)return;const s={...shotState.shots[idx],id:uid('shot'),title:shotState.shots[idx].title+' Copy'};shotState.shots.splice(idx+1,0,s);renumberShots(false);saveShots();renderShots();renderShotPrompt()}
function moveShot(id,dir){const i=shotState.shots.findIndex(s=>s.id===id),j=i+dir;if(i<0||j<0||j>=shotState.shots.length)return;[shotState.shots[i],shotState.shots[j]]=[shotState.shots[j],shotState.shots[i]];renumberShots(false);saveShots();renderShots();renderShotPrompt()}
function deleteShot(id){if(shotState.shots.length===1)return shotStatus('Keep at least one shot.','bad');shotState.shots=shotState.shots.filter(s=>s.id!==id);renumberShots(false);saveShots();renderShots();renderShotPrompt()}
function renumberShots(rewriteDefault=true){
  shotState.shots.forEach((s,i)=>{if(rewriteDefault||/^Shot \d+( Copy)?$/.test(s.title||''))s.title=`Shot ${i+1}`})
}
function shotField(s,key,label,rows=2){return`<div class="shot-field"><label>${label}</label><textarea rows="${rows}" data-shot-id="${s.id}" data-shot-key="${key}">${esc(s[key]||'')}</textarea></div>`}
function renderShots(){
  const root=$('shotCards');if(!root)return;root.innerHTML='';
  shotState.shots.forEach((s,i)=>{
    const d=document.createElement('details');d.className='shot-card';d.open=i===0;
    const sum=document.createElement('summary');sum.innerHTML=`<strong>SHOT ${i+1}</strong><span>${esc(s.title||'Untitled')} · ${esc(s.duration||'')}</span>`;
    const body=document.createElement('div');body.className='shot-body';body.innerHTML=`<div class="prod-grid3"><div><label>Shot title</label><input data-shot-id="${s.id}" data-shot-key="title" value="${esc(s.title||'')}"></div><div><label>Duration</label><input data-shot-id="${s.id}" data-shot-key="duration" value="${esc(s.duration||'')}"></div><div><label>Framing</label><input data-shot-id="${s.id}" data-shot-key="framing" value="${esc(s.framing||'')}"></div></div><div class="prod-grid2">${shotField(s,'angle','Camera angle',2)}${shotField(s,'movement','Camera movement',2)}</div>${shotField(s,'action','Action / blocking',3)}${shotField(s,'expressionDialogue','Expression / dialogue',3)}${shotField(s,'notes','Continuity / props / special notes',2)}<div class="prod-actions"><button class="prod-secondary" data-shot-act="up" data-id="${s.id}">Move Up</button><button class="prod-secondary" data-shot-act="down" data-id="${s.id}">Move Down</button><button class="prod-secondary" data-shot-act="duplicate" data-id="${s.id}">Duplicate</button><button class="prod-secondary" data-shot-act="after" data-id="${s.id}">Add After</button><button class="prod-danger" data-shot-act="delete" data-id="${s.id}">Delete</button></div>`;
    d.append(sum,body);root.appendChild(d)
  });
  root.querySelectorAll('[data-shot-key]').forEach(el=>el.addEventListener('input',e=>updateShot(e.target.dataset.shotId,e.target.dataset.shotKey,e.target.value)));
  root.querySelectorAll('[data-shot-act]').forEach(b=>b.onclick=()=>{const id=b.dataset.id;({up:()=>moveShot(id,-1),down:()=>moveShot(id,1),duplicate:()=>duplicateShot(id),after:()=>addShot(id),delete:()=>deleteShot(id)}[b.dataset.shotAct]||(()=>{}))()})
}
function importSmartBuildToShots(){
  const c=captureComposer();
  if(c.scene)shotState.settings.generationGoal=c.scene;
  if(c.aspect)shotState.settings.aspect=c.aspect;
  if(c.targetModel)shotState.settings.targetModel=/seedance/i.test(c.targetModel)?'Seedance 2.5':c.targetModel;
  if(c.environment)shotState.settings.environmentLock=c.environment;
  if(c.camera)shotState.settings.cameraSystem=c.camera;
  const realism=[c.realism,c.constraints].filter(Boolean).join(' ');
  if(realism)shotState.settings.continuity=[shotState.settings.continuity,realism].filter(Boolean).join(' ');
  if(c.poseAction&&!shotState.shots[0].action)shotState.shots[0].action=c.poseAction;
  if(c.expression&&!shotState.shots[0].expressionDialogue)shotState.shots[0].expressionDialogue=c.expression;
  saveShots();syncShotSettingsToUI();renderShots();renderShotPrompt();shotStatus('Smart Build scene, format, environment and camera imported as the Shot Builder base.','good')
}
function buildShotPrompt(){
  const s=shotState.settings,lock=subjectLockText(),parts=[];
  const sec=(name,body)=>{body=String(body||'').trim();if(body)parts.push(`[${name}]\n${body}`)};
  sec('GENERATION GOAL',s.generationGoal||`Create a ${s.aspect} vertical video with coherent multi-shot continuity.`);
  sec('REFERENCE ASSIGNMENTS',s.referenceAssignments);
  if(lock)sec('SUBJECT CONTINUITY',lock);
  sec('ENVIRONMENT LOCK',s.environmentLock);
  sec('FORMAT LOCK',`TARGET MODEL: ${s.targetModel}\nASPECT RATIO: ${s.aspect}\nTOTAL DURATION: ${s.totalDuration}`);
  sec('CHARACTER COUNT LOCK',`Exactly ${s.characterCount||'1'} adult subject${String(s.characterCount)==='1'?'':'s'} / character${String(s.characterCount)==='1'?'':'s'} unless a shot explicitly states otherwise. Do not create duplicate versions of the active subject.`);
  shotState.shots.forEach((sh,i)=>{
    const rows=[
      sh.duration&&`DURATION: ${sh.duration}`,
      sh.framing&&`FRAMING: ${sh.framing}`,
      sh.angle&&`CAMERA ANGLE: ${sh.angle}`,
      sh.movement&&`CAMERA MOVEMENT: ${sh.movement}`,
      sh.action&&`ACTION / BLOCKING: ${sh.action}`,
      sh.expressionDialogue&&`EXPRESSION / DIALOGUE: ${sh.expressionDialogue}`,
      sh.notes&&`SHOT NOTES: ${sh.notes}`
    ].filter(Boolean).join('\n');
    sec(`SHOT ${i+1} - ${sh.title||'UNTITLED'}`,rows)
  });
  sec('FINAL SHOT',s.finalShot);
  sec('CONTINUITY',s.continuity);
  sec('CAMERA SYSTEM',s.cameraSystem);
  sec('AUDIO',s.audio);
  return parts.join('\n\n')
}
function renderShotPrompt(){const e=$('shotPreview');if(e)e.value=buildShotPrompt();if($('shotCount'))$('shotCount').textContent=`${shotState.shots.length} shot${shotState.shots.length===1?'':'s'}`}
function shotToWorkspace(mode='replace'){
  const t=buildShotPrompt(),w=$('workspace');if(!w)return shotStatus('Prompt Workspace was not found.','bad');
  w.value=mode==='append'?[String(w.value||'').trim(),t].filter(Boolean).join('\n\n'):t;w.dispatchEvent(new Event('input',{bubbles:true}));
  addHistory('Shot Builder',t,'Shot sequence',false);shotStatus('Shot sequence sent to Prompt Workspace.','good');global.UPCShowPanel?.('prompt')
}
function resetShots(){
  if(!confirm('Reset the Shot Builder? Projects already saved are not changed.'))return;
  shotState={settings:{...DEFAULT_SHOT_SETTINGS},shots:[blankShot(1)]};saveShots();syncShotSettingsToUI();renderShots();renderShotPrompt();shotStatus('Shot Builder reset.','good')
}

function installAutoHistoryHooks(){
  const hooks=[
    ['scReplaceWorkspace','Smart Build'],['scAppendWorkspace','Smart Build'],
    ['dToPrompt','Director'],['plToWorkspace','Prompt Library']
  ];
  hooks.forEach(([id,source])=>{
    const el=$(id);if(!el||el.dataset.historyHook)return;el.dataset.historyHook='1';
    el.addEventListener('click',()=>setTimeout(()=>autoSnapshot(source,trimText($('workspace')?.value||''),source),120))
  });
  setTimeout(installAutoHistoryHooks,900)
}

function style(){
  if($('prodStyle145'))return;
  const e=document.createElement('style');e.id='prodStyle145';e.textContent=`
.nav button[data-nav="projects"]{background:rgba(79,70,229,.18);color:#c7d2fe;border-color:rgba(165,180,252,.24)}
.nav button[data-nav="projects"].active{background:linear-gradient(135deg,#4338ca,#6366f1);color:#fff;box-shadow:0 8px 24px rgba(79,70,229,.28)}
.prod-shell{display:grid;grid-template-columns:225px minmax(0,1fr);gap:12px}.prod-side,.prod-card{background:#fff;border:1px solid #c7d2fe;border-radius:20px;padding:13px;box-shadow:0 5px 18px rgba(23,32,51,.045)}.prod-side{position:sticky;top:18px;align-self:start}.prod-side h3,.prod-card h3{margin:0 0 6px}.prod-help,.prod-status,.prod-small{font-size:11px;color:#64748b;line-height:1.45}.prod-status.good{color:#15803d;font-weight:800}.prod-status.bad{color:#b91c1c;font-weight:800}.prod-nav{margin-top:10px}.prod-nav button{width:100%;text-align:left;margin:4px 0;background:#f8fafc;color:#334155;border:1px solid #e2e8f0;box-shadow:none}.prod-card{margin-bottom:11px}.prod-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.prod-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.prod-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.prod-actions button{min-height:38px}.prod-primary{background:#4f46e5;color:#fff}.prod-secondary{background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe}.prod-success{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}.prod-danger{background:#fee2e2;color:#b91c1c;border:1px solid #fecaca}.prod-empty{padding:12px;border:1px dashed #cbd5e1;border-radius:14px;color:#64748b;font-size:11px;text-align:center}.project-layout{display:grid;grid-template-columns:280px minmax(0,1fr);gap:10px}.project-list{border-right:1px solid #eef2f7;padding-right:10px}.project-cards{display:grid;gap:7px;margin-top:8px}.project-card{width:100%;text-align:left;white-space:normal;background:#fff;color:#172033;border:1px solid #e2e8f0;border-radius:14px;box-shadow:none;padding:10px}.project-card.active{background:#eef2ff;border-color:#818cf8}.project-card strong,.project-card span,.project-card small{display:block}.project-card span{font-size:10px;color:#64748b;margin-top:4px}.project-card small{font-size:9px;color:#94a3b8;margin-top:4px}.project-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}.project-stat{padding:8px;border:1px solid #e2e8f0;border-radius:13px;background:#f8fafc}.project-stat b{display:block;font-size:16px}.project-stat span{font-size:9px;color:#64748b}.hidden{display:none!important}
.shot-toolbar{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}.shot-card{border:1px solid #e2e8f0;border-radius:16px;background:#fff;margin:8px 0;overflow:hidden}.shot-card summary{cursor:pointer;padding:10px 12px;background:#f8fafc;display:flex;gap:8px;align-items:center}.shot-card summary strong{font-size:11px;color:#4338ca}.shot-card summary span{font-size:11px;color:#475569}.shot-body{padding:11px}.shot-field{margin-top:8px}.shot-preview{min-height:320px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;background:#f8fafc}
.history-toolbar{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:8px}.history-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:10px;border:1px solid #e2e8f0;border-radius:14px;margin:7px 0}.history-main strong,.history-main span{display:block}.history-main span{font-size:9px;color:#64748b;margin-top:3px}.history-main p{margin:5px 0 0;font-size:10px;color:#475569;line-height:1.35}.history-actions{display:flex;gap:4px;align-items:flex-start;flex-wrap:wrap}.prod-mini{min-height:29px!important;padding:4px 8px!important;background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;box-shadow:none!important;font-size:10px}.prod-mini.danger{background:#fee2e2;color:#b91c1c;border-color:#fecaca}.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.compare-box label{font-size:10px;color:#4338ca}.compare-box textarea{min-height:220px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;background:#f8fafc}
.prod-section-tab{display:none}.prod-section-tab.active{display:block}
@media(max-width:900px){.prod-shell{grid-template-columns:1fr}.prod-side{position:static}.prod-nav{display:flex;gap:6px;overflow-x:auto}.prod-nav button{width:auto;white-space:nowrap}.project-layout{grid-template-columns:1fr}.project-list{border-right:0;border-bottom:1px solid #eef2f7;padding-right:0;padding-bottom:10px}.project-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.shot-toolbar{grid-template-columns:1fr 1fr}}
@media(max-width:760px){.mobile-nav{display:flex!important;overflow-x:auto!important;grid-template-columns:none!important;scrollbar-width:none}.mobile-nav::-webkit-scrollbar{display:none}.mobile-nav button{flex:1 0 72px!important;min-width:72px!important}.prod-grid2,.prod-grid3,.history-toolbar,.compare-grid{grid-template-columns:1fr}.project-cards{grid-template-columns:1fr}.project-stats{grid-template-columns:repeat(3,1fr)}}
`;document.head.appendChild(e)
}
function mount(){
  if($('panel-projects'))return;style();
  const subjectPanel=$('panel-subjects'),panel=document.createElement('section');panel.id='panel-projects';panel.className='panel';
  panel.innerHTML=`<div id="productionHubV145" class="prod-shell"><aside class="prod-side"><h3>Production Studio</h3><div class="prod-help">Organize scenes into projects, build multi-shot sequences, and keep prompt revisions without storing reference images.</div><div class="prod-nav"><button data-prod-tab="projectsTab">Projects</button><button data-prod-tab="shotsTab">Shot Builder</button><button data-prod-tab="historyTab">Prompt History</button></div><div class="prod-help" style="margin-top:10px">Everything here is text stored locally in this browser. Subject Vault remains the global identity source.</div></aside><div>
<section id="projectsTab" class="prod-section-tab active"><div class="prod-card"><h3>Projects</h3><div class="prod-help">A project saves pointers to the active Subject plus snapshots of Smart Build, Prompt Workspace and Shot Builder.</div><div class="project-layout" style="margin-top:10px"><div class="project-list"><div class="prod-actions" style="margin-top:0"><button id="newProject" class="prod-primary">+ New Project</button><button id="exportProjects" class="prod-secondary">Export</button><button id="importProjectsBtn" class="prod-secondary">Import</button><input id="importProjectsFile" type="file" accept="application/json" hidden></div><input id="projectSearch" type="search" placeholder="Search projects..." style="margin-top:8px"><div id="projectCount" class="prod-small" style="margin-top:6px"></div><div id="projectCards" class="project-cards"></div></div><div><div id="projectEmpty" class="prod-empty">Create a project from your current workspace to begin.</div><div id="projectEditor" class="hidden"><div class="prod-grid2"><div><label>Project name</label><input id="projName"></div><div><label>Status</label><select id="projStatus"><option>Active</option><option>Draft</option><option>Final</option><option>Archived</option></select></div></div><label>Tags</label><input id="projTags" placeholder="Halloween, home gym, Seedance, client..."><label>Project notes</label><textarea id="projNotes" rows="4" placeholder="Creative goal, continuity notes, generator notes..."></textarea><div class="project-stats"><div class="project-stat"><span>SUBJECT</span><b id="projSubject">—</b></div><div class="project-stat"><span>SHOTS</span><b id="projShots">0</b></div><div class="project-stat"><span>HISTORY</span><b id="projHistory">0</b></div></div><div class="prod-small" style="margin-top:7px">Last saved: <span id="projUpdated">—</span></div><div class="prod-actions"><button id="saveProject" class="prod-primary">Save Current Work</button><button id="loadProject" class="prod-success">Load Project Work</button><button id="duplicateProject" class="prod-secondary">Duplicate</button><button id="deleteProject" class="prod-danger">Delete</button></div></div></div></div><div id="prodStatus" class="prod-status">Projects ready.</div></div></section>
<section id="shotsTab" class="prod-section-tab"><div class="prod-card"><h3>Shot Builder</h3><div class="prod-help">Create a structured multi-shot video prompt using your preferred director-style locks. The active Subject Vault profile is inserted as written continuity; reference images stay external.</div><div class="shot-toolbar" style="margin-top:9px"><div><label>Target model</label><select id="shotTarget"><option>Seedance 2.5</option><option>Seedance</option><option>Universal Video</option><option>Grok Imagine</option></select></div><div><label>Aspect ratio</label><select id="shotAspect"><option>2:3</option><option>9:16</option><option>16:9</option><option>1:1</option></select></div><div><label>Total duration</label><input id="shotTotalDuration" value="10–12 sec"></div><div><label>Character count</label><input id="shotCharacterCount" type="number" min="1" max="12" value="1"></div></div><div class="prod-actions"><button id="importSmartShots" class="prod-success">Use Smart Build as Base</button><button id="addShot" class="prod-primary">+ Add Shot</button><button id="resetShots" class="prod-danger">Reset Shots</button></div><label>Generation goal</label><textarea id="shotGenerationGoal" rows="3" placeholder="What should the complete video accomplish?"></textarea><label>Reference assignments</label><textarea id="shotReferenceAssignments" rows="3"></textarea><label>Environment lock</label><textarea id="shotEnvironment" rows="3"></textarea><div id="shotCount" class="prod-small" style="margin:10px 0 4px"></div><div id="shotCards"></div><label>Final shot</label><textarea id="shotFinal" rows="3" placeholder="Describe the ending shot or final beat."></textarea><div class="prod-grid2"><div><label>Continuity</label><textarea id="shotContinuity" rows="5"></textarea></div><div><label>Camera system</label><textarea id="shotCameraSystem" rows="5"></textarea></div></div><label>Audio</label><textarea id="shotAudio" rows="3"></textarea></div><div class="prod-card"><h3>Generated Shot Prompt</h3><textarea id="shotPreview" class="shot-preview" rows="20"></textarea><div class="prod-actions"><button id="shotReplaceWorkspace" class="prod-primary">Replace Prompt Workspace</button><button id="shotAppendWorkspace" class="prod-secondary">Append to Workspace</button><button id="shotHistory" class="prod-secondary">Save to History</button><button id="shotCopy" class="prod-secondary">Copy</button></div><div id="shotStatus" class="prod-status">Shot Builder ready.</div></div></section>
<section id="historyTab" class="prod-section-tab"><div class="prod-card"><h3>Prompt History</h3><div class="prod-help">Save text revisions, restore earlier prompts, or compare two versions side by side. History is capped to keep browser storage lightweight.</div><div class="history-toolbar" style="margin-top:9px"><input id="historyLabel" placeholder="Optional snapshot label"><select id="historyScope"><option value="project">Current Project</option><option value="all">All History</option></select><input id="historySearch" type="search" placeholder="Search history..."></div><div class="prod-actions"><button id="histWorkspace" class="prod-primary">Save Workspace</button><button id="histSmart" class="prod-secondary">Save Smart Build</button><button id="histShots" class="prod-secondary">Save Shot Prompt</button><button id="histClear" class="prod-danger">Clear History</button></div><div id="historyCount" class="prod-small" style="margin-top:8px"></div><div id="historyList"></div><div id="historyStatus" class="prod-status">Prompt History ready.</div></div><div class="prod-card"><h3>Compare Revisions</h3><div id="compareStats" class="prod-small">Pick two history entries using A and B.</div><div class="compare-grid" style="margin-top:8px"><div class="compare-box"><label id="compareALabel">Select A from history</label><textarea id="compareAText" readonly></textarea><div class="prod-actions"><button id="restoreA" class="prod-secondary">Restore A</button></div></div><div class="compare-box"><label id="compareBLabel">Select B from history</label><textarea id="compareBText" readonly></textarea><div class="prod-actions"><button id="restoreB" class="prod-secondary">Restore B</button></div></div></div></div></section>
</div></div>`;
  if(subjectPanel?.parentNode)subjectPanel.parentNode.insertBefore(panel,subjectPanel);else document.querySelector('.wrap')?.appendChild(panel);
  installNav();bind();syncShotSettingsToUI();renderShots();renderShotPrompt();renderProjectList();renderProjectEditor();renderHistory();installAutoHistoryHooks()
}
function showTab(id){document.querySelectorAll('.prod-section-tab').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelectorAll('[data-prod-tab]').forEach(b=>b.classList.toggle('prod-primary',b.dataset.prodTab===id));$(id)?.scrollIntoView({behavior:'smooth',block:'start'})}
function showProjects(tab='projectsTab'){
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav==='projects'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id==='panel-projects'));
  if($('pageTitle'))$('pageTitle').textContent='Projects';
  if($('pageSub'))$('pageSub').textContent='Projects, multi-shot direction and prompt revision history in one text-only production workspace.';
  showTab(tab);renderProjectList();renderProjectEditor();renderHistory();window.scrollTo({top:0,behavior:'smooth'})
}
function installNav(){
  const nav=document.querySelector('.nav'),first=nav?.querySelector('[data-nav="subjects"]');
  if(nav&&!nav.querySelector('[data-nav="projects"]')){const b=document.createElement('button');b.dataset.nav='projects';b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h7l2 2h9v10H3V7Z"></path><path d="M3 7V5h7l2 2"></path></svg><span class="nav-label">Projects</span>';nav.insertBefore(b,first||nav.firstChild);b.onclick=()=>showProjects()}
  const mob=document.querySelector('.mobile-nav'),mfirst=mob?.querySelector('[data-nav="subjects"]');
  if(mob&&!mob.querySelector('[data-nav="projects"]')){const b=document.createElement('button');b.dataset.nav='projects';b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h7l2 2h9v10H3V7Z"></path><path d="M3 7V5h7l2 2"></path></svg><span>Projects</span>';mob.insertBefore(b,mfirst||mob.firstChild);b.onclick=()=>showProjects()}
  const promptActions=document.querySelector('#panel-prompt .actions');if(promptActions&&!$('openProjects')){const b=document.createElement('button');b.id='openProjects';b.className='secondary';b.textContent='Projects / History';b.onclick=()=>showProjects('projectsTab');promptActions.appendChild(b)}
}
function bind(){
  document.querySelectorAll('[data-prod-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.prodTab));
  $('newProject').onclick=newProject;$('saveProject').onclick=saveProject;$('loadProject').onclick=loadProject;$('duplicateProject').onclick=duplicateProject;$('deleteProject').onclick=deleteProject;
  $('exportProjects').onclick=exportProjects;$('importProjectsBtn').onclick=()=>$('importProjectsFile').click();$('importProjectsFile').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(f)await importProjects(f)};
  $('projectSearch').oninput=renderProjectList;['projName','projTags','projNotes'].forEach(id=>$(id).addEventListener('input',()=>{readProjectForm();renderProjectList()}));$('projStatus').onchange=()=>{readProjectForm();renderProjectList()};
  const shotSettingIds=['shotTarget','shotAspect','shotTotalDuration','shotCharacterCount','shotGenerationGoal','shotReferenceAssignments','shotEnvironment','shotCameraSystem','shotContinuity','shotAudio','shotFinal'];shotSettingIds.forEach(id=>$(id).addEventListener('input',syncShotSettingsFromUI));['shotTarget','shotAspect'].forEach(id=>$(id).addEventListener('change',syncShotSettingsFromUI));
  $('importSmartShots').onclick=importSmartBuildToShots;$('addShot').onclick=()=>addShot();$('resetShots').onclick=resetShots;$('shotReplaceWorkspace').onclick=()=>shotToWorkspace('replace');$('shotAppendWorkspace').onclick=()=>shotToWorkspace('append');$('shotHistory').onclick=()=>manualSnapshot('Shot Builder');$('shotCopy').onclick=()=>navigator.clipboard?.writeText(buildShotPrompt()).then(()=>shotStatus('Shot prompt copied.','good')).catch(()=>shotStatus('Copy failed.','bad'));$('shotPreview').addEventListener('input',()=>shotStatus('Shot preview is generated from shot fields; edit the shot fields to make persistent changes.','bad'));
  $('histWorkspace').onclick=()=>manualSnapshot('Workspace');$('histSmart').onclick=()=>manualSnapshot('Smart Build');$('histShots').onclick=()=>manualSnapshot('Shot Builder');$('histClear').onclick=clearHistory;$('historyScope').onchange=()=>{historyScope=$('historyScope').value;renderHistory()};$('historySearch').oninput=renderHistory;
  $('restoreA').onclick=()=>{const h=history.find(x=>x.id===compareA);if(h)restoreHistory(h)};$('restoreB').onclick=()=>{const h=history.find(x=>x.id===compareB);if(h)restoreHistory(h)};
  window.addEventListener('upc:panel-change',()=>setTimeout(installAutoHistoryHooks,100));
}
function wait(){if(document.querySelector('.nav')&&$('panel-subjects')&&$('workspace')&&global.SmartComposerV144)mount();else setTimeout(wait,150)}
global.ProductionHubV145={VERSION,show:showProjects,showTab,saveProject,loadProject,buildShotPrompt,addHistory,captureComposer};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})(typeof window!=='undefined'?window:globalThis);
