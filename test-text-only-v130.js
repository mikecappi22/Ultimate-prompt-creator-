const fs=require('fs');
const cp=require('child_process');
const path=require('path');
function read(p){return fs.readFileSync(p,'utf8')}
function assert(ok,msg){if(!ok)throw new Error(msg)}
const active={
  loader:read('feature-loader-v110.js'),
  subject:read('subject-vault-v131.js'),
  director:read('text-director-v130.js'),
  mobileBridge:read('mobile-bridge-v117.js'),
  mobileSetup:read('mobile-v117.html'),
  privateApp:read('private-text-only-v130.html'),
  index:read('index.html'),
  prompt:read('prompt-v8-mobile.html')
};
assert(/V13\.1 SUBJECT VAULT/.test(active.loader),'Active loader is not V13.1 SUBJECT VAULT');
assert(/subject-vault-v131\.js/.test(active.loader),'Subject Vault is not loaded');
assert(/text-director-v130\.js/.test(active.loader),'Text Director is not loaded');
assert(!/(studio-lite|photo-forensics|deep-vision|vision-lab|upc-vision-lab)/i.test(active.loader),'Active loader still references image-analysis stack');
assert(!/(FileReader|createObjectURL|type=["']file["']|images\s*:|\/api\/generate|qwen3-vl|llava|gemma3)/i.test(active.director),'Text Director contains image/multimodal code');
assert(!/(slOpenVision|vision-mobile|overrideVisionButton|upc-vision-lab)/i.test(active.mobileBridge),'Mobile bridge still contains image-analysis routing');
assert(!/(Vision default|Open Mobile Vision|visionProfile|vision-mobile|type=["']file["'])/i.test(active.mobileSetup),'Mobile setup still exposes image analysis');
assert(!/(type=["']file["']|\/api\/generate|images\s*:|qwen3-vl|llava|moondream)/i.test(active.privateApp),'Private V13 app contains image/multimodal code');
assert(/Director/.test(active.privateApp)&&/Prompt/.test(active.privateApp),'Private V13 app lost Director or Prompt');
assert(!/(deep-vision|photo-forensics|vision-lab|studio-lite-v110)/i.test(active.index),'Public index directly references removed image-analysis modules');
assert(!/(deep-vision|photo-forensics|vision-lab|studio-lite-v110)/i.test(active.prompt),'Prompt page directly references removed image-analysis modules');

// Subject Vault may store user-selected reference images locally, but it must never analyze or transmit them.
assert(!/\bfetch\s*\(/.test(active.subject),'Subject Vault must not make network requests');
assert(!/(\/api\/chat|\/api\/generate|images\s*:|qwen3-vl|llava|gemma3|moondream|photo-forensics|vision-lab)/i.test(active.subject),'Subject Vault contains analysis/multimodal routing');
assert(/indexedDB/.test(active.subject),'Subject Vault should use browser-local IndexedDB for reference photos');
assert(/FileReader/.test(active.subject),'Subject Vault local reference storage is missing');

require(path.join(process.cwd(),'subject-vault-v131.js'));
const S=globalThis.SubjectVaultV131Internals;
assert(S,'Subject Vault internals were not exported');
assert(S.VERSION==='V13.1 SUBJECT VAULT','Subject Vault version marker mismatch');
const addison=S.seedAddison();
assert(addison.id==='addison'&&addison.name==='ADDISON','ADDISON seed record is missing');
assert(addison.type==='Adult woman','ADDISON should be explicitly adult');
assert(!addison.face&&!addison.eyes&&!addison.hair&&!addison.skin&&!addison.body&&!addison.distinguishing,'ADDISON seed must not invent appearance traits');
const emptyLock=S.buildLock(addison,'full');
assert(/SUBJECT LOCK — ADDISON/.test(emptyLock),'ADDISON lock marker missing');
assert(/No appearance traits have been defined yet/.test(emptyLock),'Blank ADDISON profile must explicitly prevent invented traits');
const filled={...addison,face:'oval face with high cheekbones',eyes:'blue-gray eyes',hair:'long brunette hair',personality:'confident and playful'};
const full=S.buildLock(filled,'full');
assert(/oval face with high cheekbones/.test(full)&&/blue-gray eyes/.test(full)&&/long brunette hair/.test(full),'Defined ADDISON traits were not included');
assert(/confident and playful/.test(full),'Full lock lost persona');
const identity=S.buildLock(filled,'identity');
assert(!/confident and playful/.test(identity),'Identity-only lock must not include persona');
const imported=S.normalizeImported({subjects:[{name:'TEST',hair:'black hair'}]});
assert(imported.length===1&&imported[0].name==='TEST'&&imported[0].hair==='black hair','Subject import normalization failed');
assert(S.MAX_PHOTOS===8,'Unexpected reference-photo limit');

const files=cp.execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const forbiddenPath=/(^|\/)(?:deep-vision|photo-forensics|vision-lab|vision-mobile|vision-v12|vision-v121|mobile-v1188-vision|mobile-v1189-fast-vision|mobile-v1190-verified-vision|mobile-v1191-resilient-vision|mobile-v1192-clean-vision|test-vision|install-vision|upgrade-mobile-vision|v1188-vision|v1189-fast-vision)/i;
const leftovers=files.filter(f=>forbiddenPath.test(f));
assert(leftovers.length===0,'Removed image-analysis files remain: '+leftovers.join(', '));
console.log('V13.1 Subject Vault + text-only regression PASS');
