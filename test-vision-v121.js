const fs=require('fs');
const path=require('path');
const srcPath=path.join(__dirname,'vision-v121-quality-speed.js');
const src=fs.readFileSync(srcPath,'utf8');
require(srcPath);
const I=globalThis.VisionV121Internals;
function assert(cond,msg){if(!cond)throw new Error(msg)}
assert(I,'VisionV121Internals was not exported');
assert(I.VERSION==='12.1','Wrong version marker');
assert(I.MODES.turbo.px===320,'Turbo must use 320px');
assert(I.MODES.turbo.vTok<=520,'Turbo Vision token budget regressed');
assert(I.MODES.turbo.vCtx<=2048,'Turbo Vision context budget regressed');
assert(I.MODES.turbo.sTok<=1050,'Turbo structuring token budget regressed');
assert(I.MODES.turbo.sCtx<=2560,'Turbo structuring context budget regressed');
assert(!/moondream/i.test(src),'Moondream must not exist in V12.1 controller');
assert(!/URL\.createObjectURL/.test(src),'Safari-unsafe createObjectURL found');
assert(/format:STRUCT_SCHEMA/.test(src),'Schema-constrained structuring is missing');
assert(/Estimated details remain visibly marked/.test(fs.readFileSync(path.join(__dirname,'vision-v121-shell.html'),'utf8')),'Confidence UI marker missing');

const shallow='A woman with blonde hair and blue streaks.';
assert(!I.validateEvidence(shallow).ok,'Shallow one-line evidence must fail');

const detailed=`[CLEAR] SUBJECT: One adult woman is shown in a tight portrait, turned slightly to one side with a relaxed expression.
[ESTIMATED] EYES: The eyes appear light in tone, but the exact iris hue is uncertain at this resolution.
[ESTIMATED] SKIN: The skin appears warm-toned with a natural sheen; very fine skin detail is not fully resolved.
[CLEAR] HAIR: Long light-blonde hair falls in loose waves with noticeable cool blue face-framing streaks.
[CLEAR] WARDROBE: She wears a cream knit sweater covering the shoulders and upper torso.
[CLEAR] FABRIC / MATERIALS: The sweater has a fuzzy knitted texture with visible loops and soft pile.
[CLEAR] POSE / GAZE: Her head is slightly tilted and turned, with a relaxed expression and near-direct gaze.
[CLEAR] CAMERA / FRAMING: Tight close portrait framing from the upper torso upward at a slight three-quarter angle.
[CLEAR] DEPTH / FOCUS: The face and hair are sharper than the strongly blurred background.
[CLEAR] LIGHTING / SHADOWS: Soft warm front-side lighting creates gentle highlights without hard shadow edges.
[CLEAR] BACKGROUND / ENVIRONMENT: A warm indoor background is heavily blurred, including an amber practical light.
[CLEAR] COLORS: Cream, blonde, cool blue accents, warm skin tones, and amber background light dominate the frame.
[CLEAR] REALISM / IMPERFECTIONS: Natural hair strand separation, soft fabric texture, and ordinary skin sheen are visible.`;
const ev=I.validateEvidence(detailed);
assert(ev.ok,'Detailed confidence-tagged evidence should pass: '+ev.reason);
assert(ev.stats.categoryCount>=6,'Detailed fixture did not cover enough categories');
assert(ev.stats.confidenceCount>=4,'Confidence tags were not counted');

const badEvidence=detailed+'\n[CLEAR] ACCESSORIES: No visible accessories.';
assert(!I.validateEvidence(badEvidence).ok,'Unsupported negative certainty should fail evidence validation');

function keywords(){return Array.from({length:8},(_,i)=>({text:'supported prompt detail '+(i+1),confidence:'CLEARLY_VISIBLE'}));}
const baseStructured={
  image_summary:'A close portrait shows a woman with light blonde wavy hair, cool blue streaks, a cream knit sweater, and warm indoor lighting.',
  reconstruction_summary:'Recreate the tight portrait crop, visible hair and sweater textures, warm soft lighting, blurred interior depth, and the observed relaxed pose.',
  sections:[
    {name:'EYES',summary:'The eyes appear light in tone, while the exact iris hue remains uncertain.',confidence:'ESTIMATED'},
    {name:'HAIR',summary:'Long light-blonde hair with cool blue streaks falls in loose waves.',confidence:'CLEARLY_VISIBLE'},
    {name:'WARDROBE',summary:'A cream textured knit sweater covers the shoulders and upper torso.',confidence:'CLEARLY_VISIBLE'},
    {name:'CAMERA / FRAMING',summary:'A tight portrait crop frames the subject from the upper torso upward.',confidence:'CLEARLY_VISIBLE'},
    {name:'LIGHTING / SHADOWS',summary:'Soft warm front-side light creates gentle highlights and low-contrast shadows.',confidence:'CLEARLY_VISIBLE'}
  ],
  keywords:keywords(),
  reconstruction_prompt:'Create a realistic tight portrait matching the visible reference. Preserve the long light-blonde hair with cool blue face-framing streaks, loose waves, cream textured knit sweater, relaxed pose, slight head angle, warm front-side light, shallow depth of field, and softly blurred indoor background. Keep the eye color tentative because the exact iris hue is not clearly resolved. Preserve visible material texture, natural hair separation, ordinary skin sheen, realistic optics, and the observed crop. Avoid invented identity traits, unsupported absences, beauty-filter smoothing, or details not supported by the reference image.'
};
assert(I.validateStructured(baseStructured,detailed).ok,'Valid structured fixture should pass');

const promoted=JSON.parse(JSON.stringify(baseStructured));
promoted.sections[0].confidence='CLEARLY_VISIBLE';
assert(!I.validateStructured(promoted,detailed).ok,'Estimated eye evidence must not be promoted to clear');

const banned=JSON.parse(JSON.stringify(baseStructured));
banned.reconstruction_prompt+=' There are no visible blemishes and no artifacts.';
assert(!I.validateStructured(banned,detailed).ok,'Banned certainty must fail structured validation');

const fb=I.fallbackStructured(detailed,'regression test');
const eye=fb.sections.find(s=>I.normalizeHeading(s.name)==='EYES');
assert(eye&&eye.confidence==='ESTIMATED','Fallback parser must preserve ESTIMATED eye confidence');
assert(Array.isArray(fb.keywords)&&fb.keywords.length>=8,'Fallback must create usable keywords');
assert(!I.BANNED_CERTAINTY.test(fb.reconstruction_prompt),'Fallback prompt contains banned certainty');
assert(/\[ESTIMATED\]/.test(fb.reconstruction_prompt),'Fallback prompt should visibly mark estimated sections');
assert(/Every factual line MUST begin with \[CLEAR\]/.test(I.evidencePrompt('test',false)),'Evidence prompt lost confidence instruction');
assert(/Never promote uncertainty to certainty/.test(I.structurePrompt(detailed,false)),'Structure prompt lost uncertainty rule');
console.log('Vision V12.1 regression suite PASS');