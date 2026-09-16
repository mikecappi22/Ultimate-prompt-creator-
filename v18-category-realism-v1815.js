/* UPC V18.15 REALISM / TEXTURE EXPANSION */
(function(g){'use strict';if(g.__UPC_V1815_REALISM__)return;g.__UPC_V1815_REALISM__=1;
const SOURCE='V18.15 Realism / Texture Master';
const CORE=[
['maximum photorealism','maximum photorealistic fidelity'],
['documentary realism','documentary-grade realism with believable imperfections'],
['captured-not-created look','image should feel captured rather than computer-generated'],
['anti-AI look','avoid the common synthetic AI look'],
['true optical realism','realistic optical behavior and believable physics'],
['photographic realism','strong photographic realism over illustration'],
['camera-captured feel','final result should feel authentically camera-captured'],
['premium commercial realism','high-end commercial realism with controlled polish'],
['editorial photo realism','realistic editorial-fashion or magazine-photo feel'],
['award-winning documentary photo feel','credible documentary-photograph realism'],
['stills archive feel','archival still-photography realism'],
['raw photo realism','unfinished realistic raw-photography fidelity'],
['hyper-detailed realism','dense realistic detail without artificial gloss'],
['lifelike realism','convincingly lifelike realism'],
['film-still realism','realism like a genuine film still'],
['natural visual truthfulness','truthful believable visual rendering']
];
const SKIN=[
['visible skin pores','clearly visible skin pores'],
['natural skin texture','authentic natural skin texture'],
['ordinary skin imperfections','everyday skin imperfections retained'],
['subtle facial asymmetry','retain subtle human facial asymmetry'],
['natural under-eye texture','realistic texture under the eyes'],
['soft under-eye shadows','slight under-eye shadows for realism'],
['fine facial lines','fine facial lines preserved naturally'],
['natural lip texture','realistic lip texture and surface detail'],
['slight forehead shine','subtle realistic shine on the forehead'],
['slight nose shine','subtle realistic shine on the nose'],
['realistic skin sheen','believable skin sheen instead of waxiness'],
['micro skin detail','tiny realistic skin detail'],
['true-to-life complexion','natural believable complexion'],
['visible peach fuzz','subtle peach-fuzz facial hair visible where appropriate'],
['realistic blush and skin variation','natural tonal variation across the skin'],
['non-waxy skin rendering','skin must not appear waxy or plastic']
];
const HAIR=[
['loose flyaway hairs','natural loose flyaway hairs'],
['individual hair strands','individual hair strands visible'],
['natural hair separation','realistic hair separation and grouping'],
['root texture visible','visible natural root texture'],
['soft frizz detail','subtle realistic frizz detail'],
['baby hairs visible','small baby hairs visible around the hairline'],
['realistic hair density','believable hair density'],
['subtle strand irregularity','slight irregularity in hair strands'],
['wind-affected stray hairs','realistic wind-affected stray hairs'],
['non-CGI hair rendering','hair should not look CGI or helmet-like']
];
const FABRIC=[
['realistic fabric texture','fabric should show authentic texture'],
['microscopic textile texture','very fine textile texture visible'],
['natural clothing wrinkles','realistic clothing wrinkles and creases'],
['fabric tension lines','authentic tension lines in fabric'],
['compression folds','realistic folds from compression or stretch'],
['stitched seam detail','visible seam and stitching detail'],
['material-specific behavior','fabric should behave according to its material'],
['subtle lint and wear','minor lint or wear for realism'],
['authentic drape','believable fabric drape'],
['realistic stretch behavior','stretch fabrics should behave realistically'],
['non-plastic textile rendering','textiles should not look plastic or rubbery']
];
const ENV=[
['realistic contact shadows','believable contact shadows'],
['physically believable reflections','reflections should obey believable physics'],
['natural shadow falloff','smooth natural shadow falloff'],
['minor exposure imperfections','realistic slight exposure imperfections'],
['ambient depth cues','natural ambient depth cues in the scene'],
['subtle atmospheric depth','slight atmospheric depth for realism'],
['ordinary environmental clutter','realistic everyday clutter when appropriate'],
['surface scuffs and wear','minor wear on surfaces'],
['dust motes in light','subtle dust motes visible in light rays'],
['everyday lived-in detail','space should feel naturally lived-in'],
['believable material response','materials respond convincingly to light'],
['true-to-life color response','color should feel natural and believable'],
['natural glass reflections','glass reflections should feel genuine'],
['realistic specular behavior','surfaces should show believable specular response']
];
const CAMERA_ARTIFACTS=[
['smartphone sharpening','subtle smartphone-style sharpening'],
['smartphone compression','light realistic smartphone compression'],
['natural sensor noise','subtle natural sensor noise'],
['low-light grain','credible low-light grain'],
['film grain texture','tasteful realistic film grain texture'],
['lens falloff','subtle lens vignetting or falloff'],
['chromatic realism','natural optical color behavior'],
['real lens softness at edges','subtle edge softness consistent with optics'],
['halation around highlights','slight halation around bright highlights'],
['realistic motion blur','motion blur should feel optically plausible'],
['focus falloff realism','depth-of-field falloff should feel real'],
['highlight rolloff','smooth realistic highlight rolloff'],
['shadow noise detail','retain realistic shadow noise detail'],
['slight white-balance imperfection','minor realistic white-balance imperfection']
];
const METRICSMULE_INSPIRED=[
['the most realistic photograph ever captured','push toward a truly photographic result'],
['the sharpest photo ever taken','extreme perceived sharpness without artificial overprocessing'],
['captured in a stills archive style','archival still-photography aesthetic'],
['premium commercial lighting polish','premium high-end commercial polish'],
['realistic product-photography fidelity','authentic high-fidelity product-photo realism'],
['feels more real than reality','heightened realism while remaining believable'],
['full-frame optical realism','full-frame photographic realism'],
['documentary-photo authenticity','credible documentary-photo authenticity']
];
const RUNWAY_MJ_INSPIRED=[
['photo-like raw mode feel','more literal photo-like rendering'],
['detailed texture emphasis','extra emphasis on texture and detail'],
['camera-language realism','use realistic camera language and physical cues'],
['literal prompt adherence','favor literal prompt adherence over stylization'],
['enhanced specificity realism','greater specificity in light texture and material behavior']
];
const NEGATIVE_HELPERS=[
['no waxy skin','avoid waxy skin'],
['no beauty-filter smoothing','avoid beauty-filter smoothing'],
['no CGI sheen','avoid glossy CGI sheen'],
['no plastic texture','avoid plastic-looking surfaces'],
['no overpolished AI finish','avoid an overpolished artificial finish'],
['no texture smearing','avoid smeared fine texture'],
['no synthetic symmetry','avoid unnaturally perfect symmetry'],
['no fake HDR effect','avoid exaggerated fake HDR appearance']
];
function status(message, good=true){
  setTimeout(()=>{
    const box=document.getElementById('v181_box_realism');
    if(!box) return;
    let e=document.getElementById('v1815_realism_status');
    if(!e){
      e=document.createElement('div');
      e.id='v1815_realism_status';
      e.style.cssText='font-size:10px;font-weight:800;margin-top:6px;padding:6px 8px;border-radius:9px';
      box.appendChild(e);
    }
    e.textContent=message;
    e.style.background=good?'#dcfce7':'#fff7ed';
    e.style.color=good?'#166534':'#9a3412';
  },900);
}
function load(){
  const core=g.UPCV18Core;
  if(!core||!Array.isArray(core.records)||typeof core.search!=='function'){
    status('V18.15 realism expansion could not find the V18 core.', false);
    return;
  }
  const before=core.records.filter(r=>r.field==='realism').length;
  const existing=new Set(core.records.filter(r=>r.field==='realism').map(r=>String(r.keyword||'').toLowerCase().trim()));
  let added=0;
  function add(keyword,subcategory,phrase,tags='realism'){
    keyword=String(keyword||'').trim();
    if(!keyword) return;
    const key=keyword.toLowerCase();
    if(existing.has(key)) return;
    existing.add(key);
    core.records.push({keyword,field:'realism',subcategory,source:SOURCE,confidence:1,phrase:String(phrase||keyword),tags});
    added++;
  }
  CORE.forEach(x=>add(x[0],'Core Realism',x[1],'realism core'));
  SKIN.forEach(x=>add(x[0],'Skin / Face Texture',x[1],'realism skin'));
  HAIR.forEach(x=>add(x[0],'Hair Realism',x[1],'realism hair'));
  FABRIC.forEach(x=>add(x[0],'Fabric / Material Realism',x[1],'realism fabric material'));
  ENV.forEach(x=>add(x[0],'Environmental Fidelity',x[1],'realism environment'));
  CAMERA_ARTIFACTS.forEach(x=>add(x[0],'Optical / Sensor Artifacts',x[1],'realism optical sensor'));
  METRICSMULE_INSPIRED.forEach(x=>add(x[0],'Realism Trigger Phrases',x[1],'realism trigger metricsmule'));
  RUNWAY_MJ_INSPIRED.forEach(x=>add(x[0],'Prompting Strategy Terms',x[1],'realism strategy'));
  NEGATIVE_HELPERS.forEach(x=>add(x[0],'Anti-Fake Texture Helpers',x[1],'realism anti fake'));
  SKIN.slice(0,10).forEach(s=>CAMERA_ARTIFACTS.slice(0,8).forEach(c=>add(`${s[0]} with ${c[0]}`,'Skin + Camera Artifact',`${s[1]} combined with ${c[1]}`,'realism skin artifact')));
  FABRIC.slice(0,8).forEach(f=>ENV.slice(0,8).forEach(e=>add(`${f[0]} with ${e[0]}`,'Material + Environment',`${f[1]} with ${e[1]}`,'realism fabric environment')));
  CORE.slice(0,8).forEach(r=>NEGATIVE_HELPERS.slice(0,6).forEach(n=>add(`${r[0]}, ${n[0]}`,'Realism + Anti-Fake',`${r[1]}, and ${n[1]}`,'realism anti fake combo')));
  const after=core.records.filter(r=>r.field==='realism').length;
  const tests=[
    {name:'realism grew',pass:after>before,value:after-before},
    {name:'pore search',pass:core.search('realism','pores').length>0,value:core.search('realism','pores').length},
    {name:'documentary search',pass:core.search('realism','documentary').length>0,value:core.search('realism','documentary').length},
    {name:'waxy search',pass:core.search('realism','waxy').length>0,value:core.search('realism','waxy').length},
    {name:'smartphone search',pass:core.search('realism','smartphone').length>0,value:core.search('realism','smartphone').length},
    {name:'metricsmule trigger search',pass:core.search('realism','realistic photograph ever captured').length>0,value:core.search('realism','realistic photograph ever captured').length},
    {name:'camera isolation',pass:core.search('camera','visible skin pores').length===0,value:core.search('camera','visible skin pores').length},
    {name:'lighting isolation',pass:core.search('lighting','no waxy skin').length===0,value:core.search('lighting','no waxy skin').length},
    {name:'bottom isolation',pass:core.search('bottom','documentary realism').length===0,value:core.search('bottom','documentary realism').length}
  ];
  g.UPCV1815Realism={version:'18.15',before,after,added,source:SOURCE,tests,passed:tests.every(t=>t.pass)};
  console.log('[UPC V18.15 Realism]',g.UPCV1815Realism);
  console.table(tests);
  status(`Realism expanded: ${after.toLocaleString()} verified realism terms (${added.toLocaleString()} added).`, g.UPCV1815Realism.passed);
}
load();
})(window);
