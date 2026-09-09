'use strict';
const fs=require('fs');
const assert=require('assert');
const source=fs.readFileSync('vision-v12-clean.js','utf8');
require('./vision-v12-clean.js');
const V=globalThis.VisionV12Internals;
assert(V,'VisionV12Internals should be exported in Node');

const shallow='A woman with blonde hair and blue streaks.';
const sv=V.validateEvidence(shallow);
assert.strictEqual(sv.ok,false,'Shallow one-line evidence must be rejected');

const detailed=`SUBJECT: One adult woman is shown in a tight indoor portrait from the upper torso upward.
FACE: Her face is turned slightly three-quarter toward camera with defined cheek contours, a tapered jaw, and relaxed glossy lips.
EYES: Light-colored eyes look close to the camera with a calm near-direct gaze.
SKIN: Warm tan skin shows natural tonal variation, small highlights, and visible ordinary surface texture rather than a plastic finish.
HAIR: Long blonde hair has darker roots, loose waves, and distinct cool blue face-framing streaks running through the front sections.
WARDROBE: She wears a cream fuzzy knit sweater with a soft rounded neckline and visible knit loft across the shoulder and chest.
FABRIC / MATERIALS: The sweater has coarse fuzzy yarn texture, small fibers, and uneven knitted surface detail.
POSE / GAZE: Shoulders angle slightly away while the head turns back toward camera; expression is relaxed and composed.
CAMERA / FRAMING: Tight portrait crop from roughly mid-torso upward with the face near the upper center of frame.
DEPTH / FOCUS: Face and front hair are sharp while the indoor background falls into pronounced soft blur.
COMPOSITION: The subject dominates the frame with hair forming diagonal lines over both shoulders and negative space kept minimal.
LIGHTING / SHADOWS: Warm soft frontal-side illumination creates gentle facial highlights and mild shadow modeling without harsh edges.
BACKGROUND / ENVIRONMENT: Warm indoor environment is heavily blurred with an amber practical light visible behind the subject.
COLORS: Dominant cream, warm tan, blonde, cool blue accent streaks, brown, and amber.
REALISM / IMPERFECTIONS: Natural hair flyaways, fabric fuzz, skin sheen, and realistic focus falloff support a candid photographic look.`;
const dv=V.validateEvidence(detailed);
assert.strictEqual(dv.ok,true,`Detailed evidence should pass: ${dv.reason}`);
assert(dv.stats.categoryCount>=10,'Detailed evidence should cover many categories');

const fb=V.fallbackStructured(detailed,'test fallback');
assert(Array.isArray(fb.sections)&&fb.sections.length>=8,'Fallback parser should create multiple labeled sections');
assert(fb.sections.some(s=>s.name==='HAIR'),'Fallback should retain HAIR section');
assert(fb.sections.some(s=>s.name==='LIGHTING / SHADOWS'),'Fallback should retain lighting section');
assert(Array.isArray(fb.keywords)&&fb.keywords.length>=8,'Fallback should create 8+ keyword phrases');
assert(fb.reconstruction_prompt.length>=180,'Fallback should create a substantial reconstruction prompt');

const goodStructured={
 image_summary:'A close indoor portrait of an adult woman with long blonde waves, cool blue face-framing streaks, warm natural skin, and a cream fuzzy knit sweater.',
 reconstruction_summary:'Recreate the tight three-quarter portrait with warm soft indoor light, shallow depth of field, natural skin texture, visible knit fibers, and the same restrained amber background.',
 sections:[
  {name:'SUBJECT',summary:'One adult woman fills most of a tight upper-body portrait.'},
  {name:'HAIR',summary:'Long blonde waves with darker roots and cool blue face-framing streaks.'},
  {name:'WARDROBE',summary:'Cream fuzzy knit sweater with visible yarn texture and soft rounded neckline.'},
  {name:'CAMERA / FRAMING',summary:'Tight upper-body portrait with a slight three-quarter head angle.'},
  {name:'LIGHTING / SHADOWS',summary:'Warm soft directional indoor light with gentle facial modeling.'},
  {name:'BACKGROUND / ENVIRONMENT',summary:'Warm heavily blurred interior with an amber practical light.'}
 ],
 keywords:['tight portrait','three-quarter head angle','long blonde waves','blue face-framing streaks','warm natural skin texture','cream fuzzy knit sweater','shallow depth of field','amber practical background','soft directional light','natural flyaway hairs'],
 reconstruction_prompt:'Create a faithful close indoor portrait of one adult woman framed from the upper torso upward. Preserve the long blonde hair with darker roots, loose natural waves, and cool blue face-framing streaks. Keep a slight three-quarter head turn and calm near-direct gaze. Render warm tan skin with ordinary tonal variation, subtle sheen, and natural texture rather than smoothing. Dress her in a cream fuzzy knit sweater with visible yarn fibers and soft knitted loft. Use a tight portrait composition, natural perspective, and shallow depth of field so the face and forward hair remain crisp while the interior recedes into soft blur. Light the subject with warm, soft directional illumination that creates gentle cheek and jaw modeling without hard shadows. Keep the background warm brown and amber with a small practical light blurred behind her. Preserve believable flyaway hairs, knit fuzz, realistic focus falloff, and restrained photographic imperfections.'
};
const gs=V.validateStructured(goodStructured);
assert.strictEqual(gs.ok,true,`Good structured result should pass: ${gs.reason}`);

assert.strictEqual(V.safeJSON('```json\n{"a":1}\n```').a,1,'safeJSON should parse fenced JSON');
assert(V.evidencePrompt('test',false).includes('PLAIN TEXT, NEVER JSON'),'Vision prompt must prohibit Vision JSON');
assert(!source.includes('URL.createObjectURL'),'Safari-risky object URLs must not appear');
assert(!/moondream/i.test(source),'Moondream routing must not appear in V12 clean controller');
assert(!/V11\.9|v119/i.test(source),'Legacy V11 version routing must not appear in V12 controller');
assert(source.includes("model:'qwen3-vl:2b-instruct'"),'Turbo must default to qwen3-vl:2b-instruct');
assert(source.includes('class ProgressTracker'),'Progress tracker must be present');
assert(source.includes('Estimated remaining'),'ETA display must be present');
console.log('Vision V12 regression tests PASS');
