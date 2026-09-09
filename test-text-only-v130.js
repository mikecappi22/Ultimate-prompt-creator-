const fs=require('fs');
const cp=require('child_process');
function read(p){return fs.readFileSync(p,'utf8')}
function assert(ok,msg){if(!ok)throw new Error(msg)}
const active={
  loader:read('feature-loader-v110.js'),
  director:read('text-director-v130.js'),
  mobileBridge:read('mobile-bridge-v117.js'),
  mobileSetup:read('mobile-v117.html'),
  privateApp:read('private-text-only-v130.html'),
  index:read('index.html'),
  prompt:read('prompt-v8-mobile.html')
};
assert(/V13 TEXT ONLY/.test(active.loader),'Active loader is not V13 TEXT ONLY');
assert(/text-director-v130\.js/.test(active.loader),'Text Director is not loaded');
assert(!/(studio-lite|photo-forensics|deep-vision|vision-lab|upc-vision-lab)/i.test(active.loader),'Active loader still references image-analysis stack');
assert(!/(FileReader|createObjectURL|type=["']file["']|images\s*:|\/api\/generate|qwen3-vl|llava|gemma3)/i.test(active.director),'Text Director contains image/multimodal code');
assert(!/(slOpenVision|vision-mobile|overrideVisionButton|upc-vision-lab)/i.test(active.mobileBridge),'Mobile bridge still contains image-analysis routing');
assert(!/(Vision default|Open Mobile Vision|visionProfile|vision-mobile|type=["']file["'])/i.test(active.mobileSetup),'Mobile setup still exposes image analysis');
assert(!/(type=["']file["']|\/api\/generate|images\s*:|qwen3-vl|llava|moondream)/i.test(active.privateApp),'Private V13 app contains image/multimodal code');
assert(/Director/.test(active.privateApp)&&/Prompt/.test(active.privateApp),'Private V13 app lost Director or Prompt');
assert(!/(deep-vision|photo-forensics|vision-lab|studio-lite-v110)/i.test(active.index),'Public index directly references removed image-analysis modules');
assert(!/(deep-vision|photo-forensics|vision-lab|studio-lite-v110)/i.test(active.prompt),'Prompt page directly references removed image-analysis modules');
const files=cp.execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const forbiddenPath=/(^|\/)(?:deep-vision|photo-forensics|vision-lab|vision-mobile|vision-v12|vision-v121|mobile-v1188-vision|mobile-v1189-fast-vision|mobile-v1190-verified-vision|mobile-v1191-resilient-vision|mobile-v1192-clean-vision|test-vision|install-vision|upgrade-mobile-vision|v1188-vision|v1189-fast-vision)/i;
const leftovers=files.filter(f=>forbiddenPath.test(f));
assert(leftovers.length===0,'Removed image-analysis files remain: '+leftovers.join(', '));
console.log('V13 text-only regression PASS');
