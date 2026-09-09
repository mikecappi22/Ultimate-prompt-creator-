const fs=require('fs');
const cp=require('child_process');
const path=require('path');
function read(p){return fs.readFileSync(p,'utf8')}
function assert(ok,msg){if(!ok)throw new Error(msg)}
const active={
  loader:read('feature-loader-v110.js'),
  subject:read('subject-vault-v132.js'),
  prefill:read('subject-profile-paste-v133.js'),
  director:read('text-director-v130.js'),
  mobileBridge:read('mobile-bridge-v117.js'),
  mobileSetup:read('mobile-v117.html'),
  privateApp:read('private-text-only-v130.html'),
  index:read('index.html'),
  prompt:read('prompt-v8-mobile.html')
};
assert(/V13\.3 SUBJECT VAULT/.test(active.loader),'Active loader is not V13.3 SUBJECT VAULT');
assert(/subject-vault-v132\.js/.test(active.loader),'Verified Subject Vault V13.2 core is not loaded');
assert(/subject-profile-paste-v133\.js/.test(active.loader),'V13.3 profile prefill is not loaded');
assert(/text-director-v130\.js/.test(active.loader),'Text Director is not loaded');
assert(!/(studio-lite|photo-forensics|deep-vision|vision-lab|upc-vision-lab)/i.test(active.loader),'Active loader still references image-analysis stack');
assert(!/(FileReader|createObjectURL|type=["']file["']|images\s*:|\/api\/generate|qwen3-vl|llava|gemma3)/i.test(active.director),'Text Director contains image/multimodal code');
assert(!/(slOpenVision|vision-mobile|overrideVisionButton|upc-vision-lab)/i.test(active.mobileBridge),'Mobile bridge still contains image-analysis routing');
assert(!/(Vision default|Open Mobile Vision|visionProfile|vision-mobile|type=["']file["'])/i.test(active.mobileSetup),'Mobile setup still exposes image analysis');
assert(!/(type=["']file["']|\/api\/generate|images\s*:|qwen3-vl|llava|moondream)/i.test(active.privateApp),'Private V13 app contains image/multimodal code');
assert(/Director/.test(active.privateApp)&&/Prompt/.test(active.privateApp),'Private V13 app lost Director or Prompt');
assert(!/(deep-vision|photo-forensics|vision-lab|studio-lite-v110)/i.test(active.index),'Public index directly references removed image-analysis modules');
assert(!/(deep-vision|photo-forensics|vision-lab|studio-lite-v110)/i.test(active.prompt),'Prompt page directly references removed image-analysis modules');

// Subject Vault can store reference images locally, but may never analyze or transmit them.
assert(!/\bfetch\s*\(/.test(active.subject),'Subject Vault must not make network requests');
assert(!/(\/api\/chat|\/api\/generate|images\s*:|qwen3-vl|llava|gemma3|moondream|photo-forensics|vision-lab)/i.test(active.subject),'Subject Vault contains analysis/multimodal routing');
assert(/indexedDB/.test(active.subject),'Subject Vault should use browser-local IndexedDB for reference photos');
assert(/FileReader/.test(active.subject),'Subject Vault local reference storage is missing');
assert(/Array\.from\(e\.target\.files\|\|\[\]\)/.test(active.subject),'Subject Vault must snapshot FileList before clearing the input');
assert(/IndexedDB write verification failed/.test(active.subject),'Subject Vault is missing post-write verification');
assert(/saved locally and verified/.test(active.subject),'Subject Vault is missing verified-save confirmation');

// V13.3 profile prefill is text-only and may not touch image-analysis/network paths.
assert(!/\bfetch\s*\(/.test(active.prefill),'Profile prefill must not make network requests');
assert(!/(indexedDB|FileReader|\/api\/chat|\/api\/generate|images\s*:|qwen3-vl|llava|gemma3|moondream|photo-forensics|vision-lab)/i.test(active.prefill),'Profile prefill must remain text-only and must not touch local photo storage');
assert(/Paste Profile JSON/.test(active.prefill),'Paste Profile JSON UI is missing');
assert(/Overwrite only fields provided in JSON/.test(active.prefill),'Safe merge behavior is missing');
assert(/Local reference photos were untouched/.test(active.prefill),'UI does not explicitly preserve local photos');

require(path.join(process.cwd(),'subject-vault-v132.js'));
const S=globalThis.SubjectVaultV132Internals;
assert(S,'Subject Vault V13.2 internals were not exported');
assert(S.VERSION==='V13.2 SUBJECT VAULT','Subject Vault core version marker mismatch');
const addison=S.seedAddison();
assert(addison.id==='addison'&&addison.name==='ADDISON','ADDISON seed record is missing');
assert(addison.type==='Adult woman','ADDISON should be explicitly adult');
assert(!addison.face&&!addison.eyes&&!addison.hair&&!addison.skin&&!addison.body&&!addison.distinguishing,'ADDISON seed must not invent appearance traits');
const emptyLock=S.buildLock(addison,'full');
assert(/SUBJECT LOCK — ADDISON/.test(emptyLock),'ADDISON lock marker missing');
assert(/No appearance traits have been defined yet/.test(emptyLock),'Blank ADDISON profile must explicitly prevent invented traits');
assert(S.MAX_PHOTOS===8,'Unexpected reference-photo limit');

require(path.join(process.cwd(),'subject-profile-paste-v133.js'));
const P=globalThis.SubjectProfilePasteV133Internals;
assert(P&&P.VERSION==='V13.3 PROFILE PREFILL','V13.3 profile prefill internals missing');
const normalized=P.normalizePastedProfile({subject:{display_name:'ADDISON',subject_type:'Adult woman',facial_geometry:'oval face, high cheekbones',eyes:'blue-gray',hair:'long brunette hair',body_proportions:'athletic build',distinguishing_features:['small wrist tattoo','nose ring'],continuity_rules:['preserve face','preserve tattoos']}});
assert(normalized.name==='ADDISON','display_name synonym failed');
assert(normalized.face.includes('high cheekbones'),'facial_geometry synonym failed');
assert(normalized.body==='athletic build','body_proportions synonym failed');
assert(normalized.distinguishing.includes('wrist tattoo')&&normalized.distinguishing.includes('nose ring'),'array conversion failed');
const base={...addison,id:'addison',hair:'existing hair',skin:'existing skin',createdAt:'keep-me'};
const over=P.mergeProfileIntoSubject(base,{hair:'new hair',eyes:'green eyes'},'overwrite');
assert(over.subject.id==='addison'&&over.subject.createdAt==='keep-me','Merge changed identity metadata');
assert(over.subject.hair==='new hair'&&over.subject.eyes==='green eyes','Overwrite merge failed');
const blanks=P.mergeProfileIntoSubject(base,{hair:'new hair',eyes:'green eyes'},'blanks');
assert(blanks.subject.hair==='existing hair'&&blanks.subject.eyes==='green eyes','Fill-blanks merge failed');
assert(/body_proportions/.test(P.templateFor('ADDISON')),'ChatGPT template is missing expected friendly field names');

const files=cp.execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const forbiddenPath=/(^|\/)(?:deep-vision|photo-forensics|vision-lab|vision-mobile|vision-v12|vision-v121|mobile-v1188-vision|mobile-v1189-fast-vision|mobile-v1190-verified-vision|mobile-v1191-resilient-vision|mobile-v1192-clean-vision|test-vision|install-vision|upgrade-mobile-vision|v1188-vision|v1189-fast-vision)/i;
const leftovers=files.filter(f=>forbiddenPath.test(f));
assert(leftovers.length===0,'Removed image-analysis files remain: '+leftovers.join(', '));
console.log('V13.3 Subject Vault profile prefill + text-only regression PASS');
