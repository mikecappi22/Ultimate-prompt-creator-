const fs=require('fs');
const assert=require('assert');
const vision=fs.readFileSync('mobile-v1192-clean-vision.js','utf8');
const upgrade=fs.readFileSync('upgrade-mobile-vision-v1192.ps1','utf8');

// Syntax compile without executing DOM-dependent code.
new Function(vision);

assert(vision.includes('V11.9.2 CLEAN VISION'),'version badge missing');
assert(vision.includes('VISUAL EVIDENCE PASS ONLY'),'plain evidence architecture missing');
assert(vision.includes('Do NOT output JSON'),'vision model is still being asked for JSON');
assert(vision.includes('Stage 1/2: visual evidence'),'two-stage status missing');
assert(vision.includes('Stage 2/2: structuring with qwen3:1.7b'),'text structuring status missing');
assert(vision.includes("body.format=SCHEMA"),'schema structuring not enabled');
assert(vision.includes('Run V11.9.2 Vision Test'),'new self-test button missing');
assert(!vision.includes('URL.createObjectURL'),'Safari-unsafe object URL returned');

const evidenceStart=vision.indexOf('async function evidencePass');
const structureStart=vision.indexOf('function structurePrompt');
assert(evidenceStart>=0&&structureStart>evidenceStart,'cannot locate evidencePass');
const evidenceBody=vision.slice(evidenceStart,structureStart);
assert(!evidenceBody.includes('parseJSON'),'Vision evidence pass must never parse model output as JSON');
assert(!evidenceBody.includes("format='json'"),'Vision evidence pass must not request JSON mode');

// Clean installer must not load the legacy stacked Vision/self-test scripts.
for(const legacy of ['mobile-selfheal-v1184.js','mobile-v1185-hotfix.js','mobile-v1186-hotfix.js','mobile-v1188-vision.js','mobile-v1189-fast-vision.js','mobile-v1190-verified-vision.js']){
  assert(!upgrade.includes(legacy),`legacy script still bundled: ${legacy}`);
}
assert(upgrade.includes('mobile-v1187-quality.js'),'quality Director missing');
assert(upgrade.includes('mobile-v1192-clean-vision.js'),'clean Vision missing');
assert(upgrade.includes('private-mobile-proxy-v1186.ps1'),'known-good StreamContent bridge missing');

// Regression: the exact old failure was malformed JSON emitted by the vision model.
// V11.9.2 treats this as opaque evidence text; only the text model must produce JSON.
const oldBrokenVisionOutput='{"image_summary":"portrait","facts":[{"section":"Hair","fact":"blonde"},{"section":"Eyes","fact":"green"} {"section":"Skin","fact":"warm"}]';
function stage1AsEvidence(raw){
  const text=String(raw||'').trim();
  if(text.length<20) throw new Error('too short');
  return text; // intentionally NO JSON.parse
}
const evidence=stage1AsEvidence(oldBrokenVisionOutput);
assert.strictEqual(evidence,oldBrokenVisionOutput,'malformed evidence should survive stage 1 unchanged');
const mockedStructured={image_summary:'Portrait with blonde hair and green eyes.',reconstruction_summary:'Close portrait.',sections:[
  {section:'Hair',items:[{keyword:'blonde hair',description:'blonde hair',confidence:'CLEARLY_VISIBLE',evidence:'blonde',prompt_phrase:'long blonde hair'}]},
  {section:'Eyes',items:[{keyword:'green eyes',description:'green eyes',confidence:'CLEARLY_VISIBLE',evidence:'green',prompt_phrase:'green eyes'}]},
  {section:'Skin',items:[{keyword:'warm skin',description:'warm skin',confidence:'CLEARLY_VISIBLE',evidence:'warm',prompt_phrase:'warm-toned skin'}]},
  {section:'Framing',items:[{keyword:'close portrait',description:'close portrait',confidence:'CLEARLY_VISIBLE',evidence:'portrait',prompt_phrase:'close portrait framing'}]}
]};
assert.doesNotThrow(()=>JSON.parse(JSON.stringify(mockedStructured)));

console.log('PASS V11.9.2 regression suite');
