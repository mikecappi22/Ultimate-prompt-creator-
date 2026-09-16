/* UPC V18.16 CONSTRAINTS / NEGATIVE RULES EXPANSION */
(function(g){'use strict';if(g.__UPC_V1816_CONSTRAINTS__)return;g.__UPC_V1816_CONSTRAINTS__=1;
const SOURCE='V18.16 Constraints / Negative Rules Master';

const IDENTITY=[
['preserve subject identity exactly','preserve the same recognizable identity, facial geometry, apparent age, eye appearance, hair identity, skin tone, and natural asymmetry'],
['identity lock','lock the subject identity across the entire image or sequence'],
['same face throughout','keep the exact same face throughout all shots and frames'],
['no face drift','do not alter facial proportions, age, ethnicity, eye spacing, jawline, nose, or mouth shape'],
['no identity blending','do not blend the subject with another face or generic model features'],
['preserve apparent age','keep the same apparent adult age without aging up or down'],
['preserve eye color','keep eye color consistent and natural'],
['preserve hair identity','keep hair color family, root depth, length, and core hairstyle identity consistent'],
['preserve tattoos and markings','keep tattoos, scars, freckles, piercings, and other defining markings consistent'],
['preserve body proportions','keep body proportions and overall build consistent with the reference'],
['no beautification drift','do not redesign the face into a more generic beauty-model face'],
['no face slimming or widening','do not unnaturally narrow or widen the face'],
['no eye enlargement','do not enlarge the eyes beyond the reference proportions'],
['no lip inflation','do not exaggerate lip volume beyond the intended appearance']
];

const ANATOMY=[
['anatomically correct human proportions','maintain believable human anatomy and joint relationships'],
['natural limb lengths','keep arm and leg lengths anatomically plausible'],
['correct joint placement','keep shoulders, elbows, wrists, hips, knees, and ankles correctly placed'],
['natural shoulder anatomy','avoid collapsed, doubled, or dislocated-looking shoulders'],
['natural elbow anatomy','elbows bend in anatomically correct directions'],
['natural wrist anatomy','wrists remain aligned and believable'],
['natural knee anatomy','knees remain correctly oriented and proportioned'],
['natural ankle anatomy','ankles remain stable and correctly attached'],
['natural torso anatomy','avoid warped ribcage, waist, spine, or pelvis geometry'],
['believable spine alignment','maintain plausible spinal posture for the selected pose'],
['no duplicate limbs','do not add extra arms, legs, hands, or feet'],
['no missing limbs','do not omit visible limbs required by the pose'],
['no fused limbs','do not merge arms or legs into each other or nearby objects'],
['no impossible bending','avoid impossible joint angles or rubber-limb deformation'],
['no broken anatomy','avoid dislocations, twisted joints, or physically impossible anatomy'],
['no body-part duplication','avoid duplicated shoulders, knees, elbows, torsos, or heads'],
['no floating body parts','all visible body parts remain naturally attached'],
['no torso warping','do not stretch, compress, twist, or melt the torso unnaturally']
];

const HANDS=[
['five fingers per visible hand','each visible hand has exactly five anatomically plausible fingers'],
['natural hand anatomy','hands have believable palm, knuckle, finger, and thumb structure'],
['correct thumb placement','thumbs attach and bend naturally'],
['natural finger lengths','finger lengths and proportions remain realistic'],
['clean finger separation','fingers remain visually separate without merging'],
['no extra fingers','do not generate additional fingers'],
['no missing fingers','do not omit visible fingers unless naturally occluded'],
['no fused fingers','do not fuse adjacent fingers together'],
['no duplicated hands','do not create additional hands'],
['no warped hands','avoid melted, twisted, stretched, or malformed hands'],
['natural grip mechanics','hands grip objects with physically plausible contact points'],
['hands contact objects correctly','fingers wrap around held objects with believable pressure and placement'],
['manicure consistency','preserve nail shape, length, color, and finish across visible fingers'],
['no nail duplication artifacts','avoid duplicate nails, floating nails, or polish outside nail boundaries']
];

const FACE=[
['natural facial anatomy','maintain realistic facial proportions and feature placement'],
['natural teeth','teeth remain individually plausible without fused or repeated patterns'],
['no duplicate teeth','avoid duplicated rows or repeated tooth artifacts'],
['natural smile geometry','smile follows believable cheek, lip, and jaw movement'],
['natural eyelids','eyelids and lash lines remain anatomically plausible'],
['matched eye direction','both eyes track consistently toward the intended gaze point'],
['no crossed-eye artifact','avoid accidental eye misalignment'],
['no asymmetry overcorrection','preserve natural asymmetry rather than forcing perfect symmetry'],
['natural ears','ears remain proportionate and correctly attached'],
['no duplicate facial features','avoid extra eyes, mouths, noses, or eyebrows'],
['no facial melting','avoid blended, smeared, or melted facial details'],
['no beauty-filter face','avoid airbrushed or over-smoothed face rendering']
];

const WARDROBE=[
['wardrobe lock','keep the intended wardrobe unchanged unless explicitly instructed'],
['garment count lock','preserve the correct number of garments and layers'],
['no wardrobe substitution','do not replace garments with similar but unintended clothing'],
['preserve garment color','keep garment colors consistent'],
['preserve garment material','keep fabric type and material behavior consistent'],
['preserve logos only when requested','do not invent brand logos or alter requested logos'],
['no random accessories','do not add hats, glasses, jewelry, bags, belts, or props unless requested'],
['no disappearing accessories','requested accessories remain present and consistent'],
['no clothing fusion','do not merge garments into skin or other garments'],
['no warped hems','keep waistbands, hems, sleeves, and necklines structurally believable'],
['natural fabric coverage','fabric covers the body according to the intended garment design'],
['realistic clothing tension','fabric tension follows pose and body contact naturally'],
['no texture morphing','do not change fabric pattern or texture across the image or sequence'],
['no random text on clothing','avoid invented words, letters, or logos on plain garments']
];

const SCENE=[
['environment lock','keep the selected environment consistent across the image or sequence'],
['background continuity','maintain background layout and major objects consistently'],
['no random background people','do not add unintended people in the background'],
['no duplicate background people','avoid repeating identical people in the environment'],
['no random props','do not add unrequested props or objects'],
['no duplicate props','avoid duplicate copies of the same object unless intended'],
['object permanence','requested objects remain present and stable'],
['consistent object placement','major props keep coherent positions unless movement is described'],
['no architecture warping','keep walls, doors, windows, shelves, and buildings structurally plausible'],
['straight structural lines','keep architectural lines and edges coherent unless lens distortion is intentionally requested'],
['no floating objects','objects rest or move according to believable physics'],
['realistic contact with surfaces','subjects and objects make believable contact with floors, furniture, walls, and equipment'],
['no impossible intersections','avoid bodies or objects passing through solid surfaces'],
['reflection consistency','mirrors and reflective surfaces agree with visible scene geometry'],
['shadow consistency','cast shadows correspond to subject and object placement'],
['no random signage','do not invent storefront or environmental text unless requested']
];

const CAMERA=[
['camera lock','preserve the requested camera position, framing, lens feel, and angle'],
['framing lock','do not drift away from the requested shot size'],
['angle lock','maintain the requested camera angle'],
['lens lock','keep the specified focal-length look consistent'],
['perspective lock','maintain coherent perspective and vanishing points'],
['no unintended zoom','do not zoom unless explicitly requested'],
['no unintended camera orbit','do not circle the subject unless explicitly requested'],
['no unintended camera tilt','avoid accidental dutch angle or tilted horizon'],
['level horizon','keep horizon level unless otherwise requested'],
['no fake portrait blur','avoid artificial portrait-mode blur unless requested'],
['depth of field remains optical','depth of field should follow believable lens behavior'],
['no cut-off hands or feet','keep hands and feet inside frame when full-body framing is requested'],
['no accidental crop','do not crop important body parts or props unexpectedly'],
['preserve rear three-quarter geometry','when requested, keep the subject or vehicle in a true rear three-quarter view'],
['preserve front three-quarter geometry','when requested, keep the subject or vehicle in a true front three-quarter view']
];

const REALISM=[
['no CGI sheen','avoid glossy computer-generated surface sheen'],
['no waxy skin','avoid waxy or plastic skin'],
['no beauty-filter smoothing','retain realistic pores and ordinary skin texture'],
['no plastic texture','materials should not look uniformly plastic'],
['no overprocessed HDR','avoid exaggerated HDR tone mapping'],
['no oversharpening halos','avoid crunchy edge halos and artificial sharpening'],
['no texture smearing','retain fine texture rather than smearing details'],
['no synthetic symmetry','avoid unnaturally perfect bilateral symmetry'],
['no artificial skin glow','avoid unrealistic luminous skin unless requested'],
['no excessive bloom','keep highlight bloom controlled unless requested'],
['no fake bokeh','background blur must follow plausible optics'],
['no painterly artifacts','avoid brush-like or illustrated texture in photographic outputs'],
['no 3D-render look','avoid video-game or 3D-render appearance'],
['no doll-like face','avoid porcelain or doll-like skin and features'],
['no mannequin body','avoid rigid mannequin-like anatomy or posing'],
['retain natural imperfections','keep subtle real-world imperfections that make the image believable']
];

const TEXT=[
['text accuracy lock','render requested text exactly as supplied'],
['no invented text','do not add random words, letters, numbers, or labels'],
['no gibberish typography','avoid illegible pseudo-text'],
['correct spelling','preserve exact requested spelling'],
['single-instance sign text','requested sign text appears once unless repetition is explicitly requested'],
['logo accuracy when requested','preserve the requested logo appearance without inventing extra branding'],
['no watermark','do not add watermarks or signatures'],
['no fake UI text','avoid random interface labels or pseudo-UI text']
];

const COUNT=[
['single-subject lock','exactly one intended subject unless otherwise requested'],
['two-subject lock','exactly two intended subjects unless otherwise requested'],
['character count lock','preserve the explicitly requested number of people'],
['no duplicate subject','do not create clones or duplicate versions of the subject'],
['no extra faces','do not add unintended faces'],
['no background clone','do not repeat the main subject in the background'],
['prop count lock','preserve the requested number of key props'],
['vehicle count lock','preserve the requested number of vehicles'],
['no object cloning','avoid accidental repeated copies of objects']
];

const MOTION=[
['motion continuity','movement remains continuous and physically plausible across frames'],
['pose continuity','body pose evolves smoothly without sudden anatomical jumps'],
['wardrobe continuity across frames','clothing remains consistent throughout the clip'],
['identity continuity across frames','face and identity remain stable throughout the clip'],
['background continuity across frames','environment remains coherent throughout the clip'],
['prop continuity across frames','props do not randomly appear, disappear, or change shape'],
['no temporal morphing','avoid melting, reshaping, or identity drift between frames'],
['no frame-to-frame anatomy drift','hands, limbs, and facial features remain stable across time'],
['no sudden camera teleport','camera movement remains physically continuous'],
['realistic acceleration and deceleration','camera and subject motion ease naturally'],
['no foot sliding','feet maintain believable contact with the ground during stationary poses'],
['no object jitter','stationary objects remain stable rather than vibrating or changing shape']
];

function status(message,good=true){setTimeout(()=>{const box=document.getElementById('v181_box_constraints');if(!box)return;let e=document.getElementById('v1816_constraints_status');if(!e){e=document.createElement('div');e.id='v1816_constraints_status';e.style.cssText='font-size:10px;font-weight:800;margin-top:6px;padding:6px 8px;border-radius:9px';box.appendChild(e);}e.textContent=message;e.style.background=good?'#dcfce7':'#fff7ed';e.style.color=good?'#166534':'#9a3412';},900);}

function load(){
 const core=g.UPCV18Core;
 if(!core||!Array.isArray(core.records)||typeof core.search!=='function'){status('V18.16 constraints expansion could not find the V18 core.',false);return;}
 const before=core.records.filter(r=>r.field==='constraints').length;
 const existing=new Set(core.records.filter(r=>r.field==='constraints').map(r=>String(r.keyword||'').toLowerCase().trim()));
 let added=0;
 function add(keyword,subcategory,phrase,tags='constraints negative rules'){
   keyword=String(keyword||'').trim(); if(!keyword)return; const key=keyword.toLowerCase(); if(existing.has(key))return;
   existing.add(key); core.records.push({keyword,field:'constraints',subcategory,source:SOURCE,confidence:1,phrase:String(phrase||keyword),tags}); added++;
 }
 const groups=[
   ['Identity Preservation',IDENTITY,'constraints identity lock'],['Anatomy',ANATOMY,'constraints anatomy'],['Hands / Fingers',HANDS,'constraints hands fingers'],
   ['Face / Teeth / Eyes',FACE,'constraints face'],['Wardrobe / Accessories',WARDROBE,'constraints wardrobe'],['Scene / Object Continuity',SCENE,'constraints scene object'],
   ['Camera / Framing',CAMERA,'constraints camera framing'],['Realism / Anti-AI',REALISM,'constraints realism anti-ai'],['Text / Logos',TEXT,'constraints text typography'],
   ['Count / Duplication',COUNT,'constraints count duplicate'],['Video / Temporal Continuity',MOTION,'constraints video continuity']
 ];
 groups.forEach(([sub,arr,tags])=>arr.forEach(x=>add(x[0],sub,x[1],tags)));

 IDENTITY.slice(0,8).forEach(i=>ANATOMY.slice(0,8).forEach(a=>add(`${i[0]} + ${a[0]}`,'Identity + Anatomy',`${i[1]}; ${a[1]}`,'constraints identity anatomy combo')));
 HANDS.slice(0,8).forEach(h=>REALISM.slice(0,8).forEach(r=>add(`${h[0]} + ${r[0]}`,'Hands + Realism',`${h[1]}; ${r[1]}`,'constraints hands realism combo')));
 WARDROBE.slice(0,8).forEach(w=>SCENE.slice(0,8).forEach(s=>add(`${w[0]} + ${s[0]}`,'Wardrobe + Scene',`${w[1]}; ${s[1]}`,'constraints wardrobe scene combo')));
 CAMERA.slice(0,8).forEach(c=>MOTION.slice(0,8).forEach(m=>add(`${c[0]} + ${m[0]}`,'Camera + Continuity',`${c[1]}; ${m[1]}`,'constraints camera video combo')));

 const after=core.records.filter(r=>r.field==='constraints').length;
 const tests=[
   {name:'constraints grew',pass:after>before,value:after-before},
   {name:'identity search',pass:core.search('constraints','identity').length>0,value:core.search('constraints','identity').length},
   {name:'finger search',pass:core.search('constraints','fingers').length>0,value:core.search('constraints','fingers').length},
   {name:'duplicate search',pass:core.search('constraints','duplicate').length>0,value:core.search('constraints','duplicate').length},
   {name:'waxy search',pass:core.search('constraints','waxy').length>0,value:core.search('constraints','waxy').length},
   {name:'camera isolation',pass:core.search('camera','five fingers per visible hand').length===0,value:core.search('camera','five fingers per visible hand').length},
   {name:'realism isolation',pass:core.search('realism','character count lock').length===0,value:core.search('realism','character count lock').length},
   {name:'pose isolation',pass:core.search('pose','no duplicate limbs').length===0,value:core.search('pose','no duplicate limbs').length}
 ];
 g.UPCV1816Constraints={version:'18.16',before,after,added,source:SOURCE,tests,passed:tests.every(t=>t.pass)};
 console.log('[UPC V18.16 Constraints]',g.UPCV1816Constraints); console.table(tests);
 status(`Constraints expanded: ${after.toLocaleString()} verified constraint terms (${added.toLocaleString()} added).`,g.UPCV1816Constraints.passed);
}
load();
})(window);
