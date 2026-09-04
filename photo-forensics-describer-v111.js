(function(){
  'use strict';
  if(window.__UPC_PHOTO_DESCRIBER_V111__) return;
  window.__UPC_PHOTO_DESCRIBER_V111__ = true;

  const $ = id => document.getElementById(id);
  const q = (sel, root=document) => root.querySelector(sel);
  const qa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const NAMED_COLORS = [
    ['black',[20,20,22]],['charcoal',[55,58,64]],['gray',[132,132,136]],['white',[236,236,236]],
    ['cream',[235,225,200]],['beige',[210,190,158]],['tan',[184,146,111]],['brown',[112,77,51]],
    ['blonde',[209,184,127]],['golden blonde',[217,191,117]],['light brown',[153,111,79]],['auburn',[145,83,58]],
    ['burgundy',[95,38,48]],['rust',[160,86,50]],['olive',[122,118,73]],['red',[183,58,56]],
    ['orange',[211,122,48]],['yellow',[225,203,75]],['green',[73,136,84]],['teal',[58,130,136]],['blue',[72,107,182]],
    ['purple',[122,82,155]],['pink',[210,130,155]]
  ];

  function nearestColorName(rgb){
    let best = NAMED_COLORS[0][0], bestD = Infinity;
    for(const [name, ref] of NAMED_COLORS){
      const d = (rgb[0]-ref[0])**2 + (rgb[1]-ref[1])**2 + (rgb[2]-ref[2])**2;
      if(d < bestD){ bestD = d; best = name; }
    }
    return best;
  }
  function hex(rgb){ return '#'+rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''); }
  function lum(r,g,b){ return .2126*r + .7152*g + .0722*b; }
  function sat(r,g,b){ const mx=Math.max(r,g,b), mn=Math.min(r,g,b); return mx ? (mx-mn)/mx : 0; }
  function warmBias(r,g,b){ return r-b; }
  function variance(arr){ if(!arr.length) return 0; const m=arr.reduce((a,b)=>a+b,0)/arr.length; return arr.reduce((a,b)=>a+(b-m)*(b-m),0)/arr.length; }
  function ratioName(r){ if(Math.abs(r-4/5)<0.06) return '4:5 portrait'; if(Math.abs(r-2/3)<0.06) return '2:3 portrait'; if(Math.abs(r-1)<0.06) return '1:1 square'; return r < 1 ? 'portrait' : 'landscape'; }

  function skinLike(r,g,b){
    const L = lum(r,g,b), S = sat(r,g,b);
    return r > 60 && g > 35 && b > 20 && r > g && g > b*0.8 && (r-g) < 95 && (r-b) < 140 && S > 0.12 && S < 0.68 && L > 45 && L < 235;
  }

  function makeCanvas(img){
    const max = 900;
    const sc = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const w = Math.max(1, Math.round((img.naturalWidth || img.width) * sc));
    const h = Math.max(1, Math.round((img.naturalHeight || img.height) * sc));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(img, 0, 0, w, h);
    return {cv, ctx, w, h, data: ctx.getImageData(0,0,w,h).data};
  }

  function sampleRect(buf, x0,y0,x1,y1, step=2, filterFn=null){
    const {w,h,data} = buf;
    const out = [];
    x0 = clamp(Math.floor(x0),0,w-1); y0 = clamp(Math.floor(y0),0,h-1);
    x1 = clamp(Math.ceil(x1),1,w); y1 = clamp(Math.ceil(y1),1,h);
    for(let y=y0; y<y1; y+=step){
      for(let x=x0; x<x1; x+=step){
        const i=(y*w+x)*4; const r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
        if(a < 200) continue;
        if(filterFn && !filterFn(r,g,b,x,y)) continue;
        out.push([r,g,b]);
      }
    }
    return out;
  }

  function kmeans(points, k=4, iters=5){
    if(!points.length) return [];
    const s = points.filter((_,i)=>i % Math.max(1, Math.ceil(points.length/1800)) === 0).slice(0,1800);
    let c = Array.from({length:k}, (_,i)=> [...(s[Math.floor(i * s.length / k)] || s[0])]);
    for(let it=0; it<iters; it++){
      const g = Array.from({length:k}, ()=>({v:[0,0,0], n:0}));
      for(const p of s){
        let bi=0, bd=Infinity;
        for(let i=0;i<k;i++){
          const d=(p[0]-c[i][0])**2+(p[1]-c[i][1])**2+(p[2]-c[i][2])**2;
          if(d<bd){bd=d;bi=i;}
        }
        g[bi].v[0]+=p[0]; g[bi].v[1]+=p[1]; g[bi].v[2]+=p[2]; g[bi].n++;
      }
      for(let i=0;i<k;i++) if(g[i].n) c[i]=g[i].v.map(v=>v/g[i].n);
    }
    const counts = Array(k).fill(0);
    for(const p of s){
      let bi=0, bd=Infinity;
      for(let i=0;i<k;i++){
        const d=(p[0]-c[i][0])**2+(p[1]-c[i][1])**2+(p[2]-c[i][2])**2;
        if(d<bd){bd=d;bi=i;}
      }
      counts[bi]++;
    }
    return c.map((rgb,i)=>({rgb:rgb.map(Math.round), name:nearestColorName(rgb), hex:hex(rgb), count:counts[i]})).sort((a,b)=>b.count-a.count);
  }

  async function detectFaces(img){
    try{
      if(!('FaceDetector' in window)) return [];
      const fd = new FaceDetector({fastMode:true, maxDetectedFaces:5});
      const faces = await fd.detect(img);
      return faces || [];
    }catch(_){
      return [];
    }
  }

  function faceBoxToRect(face){
    const b = face.boundingBox || face;
    return {x:b.x, y:b.y, width:b.width, height:b.height};
  }

  function likelyFraming(faceRect, w, h){
    if(!faceRect) return h > w ? 'portrait photograph' : 'photograph';
    const fh = faceRect.height / h;
    if(fh > 0.42) return 'tight close-up portrait';
    if(fh > 0.28) return 'head-and-shoulders portrait';
    if(fh > 0.18) return 'medium close portrait';
    return 'portrait with more environment visible';
  }

  function likelyPosition(faceRect, w, h){
    if(!faceRect) return 'subject position cannot be verified precisely';
    const cx = faceRect.x + faceRect.width/2, cy = faceRect.y + faceRect.height/2;
    const horiz = cx < w*0.42 ? 'left-of-center' : cx > w*0.58 ? 'right-of-center' : 'near center';
    const vert = cy < h*0.36 ? 'upper frame' : cy > h*0.64 ? 'lower frame' : 'mid frame';
    return `${horiz}, ${vert}`;
  }

  function bestLightZone(buf){
    const {w,h,data} = buf;
    function quad(x0,y0,x1,y1){
      let s=0,n=0;
      for(let y=Math.floor(y0*h); y<Math.floor(y1*h); y+=3){
        for(let x=Math.floor(x0*w); x<Math.floor(x1*w); x+=3){
          const i=(y*w+x)*4; s += lum(data[i],data[i+1],data[i+2]); n++;
        }
      }
      return n?s/n:0;
    }
    return [
      ['upper-left', quad(0,0,.5,.5)],
      ['upper-right', quad(.5,0,1,.5)],
      ['lower-left', quad(0,.5,.5,1)],
      ['lower-right', quad(.5,.5,1,1)]
    ].sort((a,b)=>b[1]-a[1])[0][0];
  }

  function describeFromPixels(buf, faceRect){
    const {w,h,data} = buf;
    const allL=[], allS=[]; let warm=0;
    for(let i=0;i<data.length;i+=16){ allL.push(lum(data[i],data[i+1],data[i+2])); allS.push(sat(data[i],data[i+1],data[i+2])); warm += warmBias(data[i],data[i+1],data[i+2]); }
    const meanL = allL.reduce((a,b)=>a+b,0)/allL.length;
    const stdL = Math.sqrt(variance(allL));
    const meanS = allS.reduce((a,b)=>a+b,0)/allS.length;
    const meanW = warm / allL.length;

    const center = sampleRect(buf, w*.18, h*.08, w*.84, h*.88, 2);
    const edges = [
      ...sampleRect(buf, 0, 0, w, h*.14, 3),
      ...sampleRect(buf, 0, h*.86, w, h, 3),
      ...sampleRect(buf, 0, 0, w*.14, h, 3),
      ...sampleRect(buf, w*.86, 0, w, h, 3)
    ];

    let hairSamples=[], clothingSamples=[], faceSamples=[];
    if(faceRect){
      const fx=faceRect.x, fy=faceRect.y, fw=faceRect.width, fh=faceRect.height;
      faceSamples = sampleRect(buf, fx, fy, fx+fw, fy+fh, 2, (r,g,b)=>skinLike(r,g,b));
      hairSamples = sampleRect(buf, fx-fw*0.35, fy-fh*0.38, fx+fw*1.35, fy+fh*0.28, 2, (r,g,b)=> !skinLike(r,g,b) && lum(r,g,b) > 18);
      clothingSamples = sampleRect(buf, fx-fw*0.45, fy+fh*1.02, fx+fw*1.45, fy+fh*2.55, 2, (r,g,b)=>lum(r,g,b) > 18);
    } else {
      hairSamples = sampleRect(buf, w*.2, h*.02, w*.8, h*.38, 2, (r,g,b)=>!skinLike(r,g,b));
      clothingSamples = sampleRect(buf, w*.22, h*.45, w*.78, h*.95, 2, (r,g,b)=>lum(r,g,b) > 18);
      faceSamples = sampleRect(buf, w*.28, h*.12, w*.72, h*.46, 2, (r,g,b)=>skinLike(r,g,b));
    }

    const subjectPalette = kmeans([...faceSamples, ...hairSamples.slice(0,600), ...clothingSamples.slice(0,600), ...center.slice(0,300)], 5);
    const envPalette = kmeans(edges, 5);
    const hairPalette = kmeans(hairSamples, 3);
    const clothingPalette = kmeans(clothingSamples, 3);
    const skinPalette = kmeans(faceSamples, 2);

    const lightZone = bestLightZone(buf);
    const orientation = h >= w ? 'portrait' : 'landscape';
    const aspect = ratioName(w/h);
    const exposure = meanL < 85 ? 'dark' : meanL > 175 ? 'bright' : 'balanced midtone';
    const contrast = stdL < 35 ? 'low' : stdL > 65 ? 'high' : 'moderate';
    const saturation = meanS < 0.22 ? 'low' : meanS > 0.46 ? 'high' : 'moderate';
    const temperature = meanW > 8 ? 'warm-biased' : meanW < -8 ? 'cool-biased' : 'neutral-balanced';

    const hairColor = hairPalette[0]?.name || 'indeterminate hair color';
    const clothingColor = clothingPalette[0]?.name || subjectPalette[0]?.name || 'indeterminate garment color';
    const skinColor = skinPalette[0]?.name || 'tan';
    const faceCount = faceRect ? 1 : 0;

    let garmentTexture = 'fabric texture not safely classifiable';
    if(clothingSamples.length){
      const bright = clothingSamples.map(([r,g,b])=>lum(r,g,b));
      const tex = Math.sqrt(variance(bright));
      if(tex > 120) garmentTexture = 'textured or knit-like upper garment';
      else if(tex > 70) garmentTexture = 'soft fabric upper garment';
      else garmentTexture = 'smooth fabric upper garment';
    }

    const framing = likelyFraming(faceRect, w, h);
    const facePosition = likelyPosition(faceRect, w, h);
    const indoorGuess = ['upper-right','upper-left'].includes(lightZone) && temperature === 'warm-biased';
    const bgSummary = indoorGuess ? 'warm indoor background with a brighter practical light source' : 'background details remain broadly visible but not fully classifiable';

    const concise = [
      faceCount ? 'single visible person portrait' : 'single-subject portrait-like image',
      framing,
      faceCount ? `one detected face positioned ${facePosition}` : 'no browser face detector result; central portrait heuristics used',
      `${hairColor.includes('indeterminate') ? 'visible hair around the face' : hairColor + ' hair'}`,
      `${clothingColor} upper garment`,
      garmentTexture,
      bgSummary
    ].join(', ');

    const detailed = {
      measured: [
        `${w} × ${h} working analysis size`,
        `${aspect} / ${orientation} orientation`,
        `${exposure} exposure`, `${contrast} contrast`, `${saturation} saturation`, `${temperature} color balance`,
        `brightest region ${lightZone}`,
        faceCount ? 'one face detected by browser face detector' : 'no face detection result; used central-subject heuristic sampling'
      ],
      estimated: [
        framing,
        faceCount ? `subject appears ${facePosition}` : 'likely centrally framed subject',
        hairColor.includes('indeterminate') ? 'hair color not confidently classifiable' : `${hairColor} hair visible around the face`,
        `${clothingColor} upper garment`,
        garmentTexture,
        bgSummary,
        skinColor !== 'indeterminate hair color' ? `${skinColor} skin-tone family in visible face region` : 'visible face color sampled'
      ],
      cannotVerify: [
        'exact age, identity, ethnicity, or biography',
        'exact garment brand/model',
        'exact focal length or camera model',
        'fine pose landmarks, eye color, or precise expression without a semantic vision model'
      ],
      subjectPalette, environmentPalette: envPalette,
      subjectLine: concise,
      aspect, orientation, exposure, contrast, saturation, temperature, lightZone, hairColor, clothingColor, garmentTexture, framing
    };

    return detailed;
  }

  function buildNarrativeDescription(r){
    return [
      `Measured image characteristics: ${r.aspect}, ${r.exposure} exposure, ${r.contrast} contrast, ${r.saturation} saturation, ${r.temperature} color balance, brightest area in the ${r.lightZone}.`,
      `Estimated visible subject description: ${r.subjectLine}.`,
      `Subject palette: ${r.subjectPalette.slice(0,5).map(c=>`${c.name} ${c.hex}`).join(', ')}.`,
      `Environment palette: ${r.environmentPalette.slice(0,5).map(c=>`${c.name} ${c.hex}`).join(', ')}.`,
      `Cannot safely verify: ${r.cannotVerify.join('; ')}.`
    ].join(' ');
  }

  function buildPromptTrio(r, subjectOverride=''){
    const subj = subjectOverride.trim() || r.subjectLine;
    const measured = `${r.aspect}, ${r.exposure} exposure, ${r.contrast} contrast, ${r.saturation} saturation, ${r.temperature} color balance, brightest area ${r.lightZone}`;
    const pal = `subject palette ${r.subjectPalette.slice(0,4).map(c=>c.name).join(', ')}; environment palette ${r.environmentPalette.slice(0,4).map(c=>c.name).join(', ')}`;
    return {
      exact: `Recreate the visible image as a ${measured}. Show ${subj}. Preserve only details that are reasonably visible in the reference. Keep ${pal}. Do not invent exact hidden wardrobe details, camera metadata, or identity-specific facts not clearly visible.`,
      realism: `Recreate the visible image faithfully. Show ${subj}. Preserve ${measured}. Keep ${pal}. Add natural skin texture, realistic hair strand separation, believable fabric behavior, subtle optical imperfections, coherent shadows, and physically plausible material response without plastic skin or CGI appearance.`,
      cinema: `Preserve the visible reference content while upgrading it cinematically. Show ${subj}. Maintain ${measured} and ${pal}. Add stronger visual hierarchy, refined background separation, controlled practical-light glow, and a deliberate photographic composition without redesigning the visible subject.`
    };
  }

  function paletteBadges(colors){
    return colors.map(c=>`<span class="sl-color"><i style="background:${c.hex}"></i>${esc(c.name)} ${esc(c.hex)}</span>`).join('');
  }

  function ensureStyles(){
    if($('pfdV111Style')) return;
    const s = document.createElement('style');
    s.id = 'pfdV111Style';
    s.textContent = `
      #slAutoDesc, #slStructuredDesc { min-height: 130px; }
      .pfd-structured { margin-top:10px; display:grid; grid-template-columns:1fr; gap:10px; }
      .pfd-structured .result { border:1px solid #d9e0e8; border-radius:16px; padding:12px; background:#fff; }
      .pfd-structured b { display:block; margin-bottom:4px; }
      .pfd-palette-wrap { margin-top:8px; }
      .pfd-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
      .pfd-note { font-size:12px; color:#647184; }
    `;
    document.head.appendChild(s);
  }

  function waitForStudio(cb){
    const found = $('studioLite') && $('slPhotoInput');
    if(found){ cb(); return; }
    const obs = new MutationObserver(()=>{
      if($('studioLite') && $('slPhotoInput')){ obs.disconnect(); cb(); }
    });
    obs.observe(document.documentElement, {childList:true, subtree:true});
    setTimeout(()=>obs.disconnect(), 120000);
  }

  function install(){
    if($('slAutoDesc')) return;
    ensureStyles();
    const photoPanel = $('sl-photo');
    if(!photoPanel) return;
    const hint = $('slSubjectHint');
    if(!hint) return;

    const block = document.createElement('div');
    block.className = 'pfd-structured';
    block.innerHTML = `
      <div>
        <label>Auto-generated visible subject description</label>
        <textarea id="slAutoDesc" readonly placeholder="Detailed automatic description will appear here after you upload a photo."></textarea>
      </div>
      <div>
        <label>Structured reconstruction notes</label>
        <textarea id="slStructuredDesc" readonly placeholder="Measured / estimated / cannot verify analysis will appear here."></textarea>
      </div>
      <div id="slStructuredHtml"></div>
      <div class="pfd-actions">
        <button id="slGenerateDesc" class="secondary">Generate Detailed Description</button>
        <button id="slUseAutoDesc" class="secondary">Use Auto Description</button>
        <button id="slUseAutoPrompts" class="secondary">Rebuild Prompts from Auto Description</button>
      </div>
      <div class="pfd-note">This no-key description uses browser-side face detection when available plus color/composition heuristics. Measured items are reliable; semantic appearance details are labeled as estimates when inferred.</div>
    `;
    hint.parentElement.insertAdjacentElement('afterend', block);

    const state = {file:null, report:null};

    async function currentImageEl(){
      const preview = q('#slPreview img');
      if(preview && preview.complete) return preview;
      const file = $('slPhotoInput')?.files?.[0];
      if(!file) return null;
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();
      return img;
    }

    function renderReport(report){
      $('slAutoDesc').value = buildNarrativeDescription(report);
      $('slStructuredDesc').value = [
        'MEASURED',
        ...report.measured.map(x=>'- '+x),
        '',
        'ESTIMATED',
        ...report.estimated.map(x=>'- '+x),
        '',
        'CANNOT VERIFY',
        ...report.cannotVerify.map(x=>'- '+x)
      ].join('\n');
      $('slStructuredHtml').innerHTML = `
        <div class="result"><b>Measured</b>${esc(report.measured.join('; '))}</div>
        <div class="result"><b>Estimated visible subject description</b>${esc(report.subjectLine)}</div>
        <div class="result"><b>Cannot verify</b>${esc(report.cannotVerify.join('; '))}</div>
        <div class="pfd-palette-wrap"><b>Subject palette</b><div>${paletteBadges(report.subjectPalette)}</div></div>
        <div class="pfd-palette-wrap"><b>Environment palette</b><div>${paletteBadges(report.environmentPalette)}</div></div>
      `;
      if(!$('slSubjectHint').value.trim()) $('slSubjectHint').value = report.subjectLine;
    }

    async function analyzeDetailed(){
      const metrics = $('slPhotoMetrics');
      try{
        const img = await currentImageEl();
        if(!img){ $('slAutoDesc').value = 'Please upload a photo first.'; return; }
        if(metrics) metrics.textContent = 'Analyzing photo locally for detailed description…';
        const buf = makeCanvas(img);
        const faces = await detectFaces(buf.cv);
        const faceRect = faces[0] ? faceBoxToRect(faces[0]) : null;
        const report = describeFromPixels(buf, faceRect);
        state.report = report;
        renderReport(report);
        const prompts = buildPromptTrio(report, $('slSubjectHint').value || report.subjectLine);
        if($('slExact')) $('slExact').value = prompts.exact;
        if($('slReal')) $('slReal').value = prompts.realism;
        if($('slCinema')) $('slCinema').value = prompts.cinema;
        if(metrics) metrics.innerHTML = `<b>Measured:</b> ${report.measured.slice(0,7).join(', ')}.`;
      } catch(err){
        if(metrics) metrics.textContent = 'Detailed photo analysis failed: ' + err.message;
        $('slAutoDesc').value = 'Detailed photo analysis failed: ' + err.message;
      }
    }

    $('slGenerateDesc').onclick = analyzeDetailed;
    $('slUseAutoDesc').onclick = ()=>{
      const txt = $('slAutoDesc').value.trim();
      if(!txt) return;
      const prompt = $('prompt');
      if(prompt){ prompt.value = prompt.value ? prompt.value.replace(/\s+$/,'') + ', ' + txt : txt; prompt.dispatchEvent(new Event('input',{bubbles:true})); }
    };
    $('slUseAutoPrompts').onclick = ()=>{
      if(!state.report) return analyzeDetailed();
      const prompts = buildPromptTrio(state.report, $('slSubjectHint').value || state.report.subjectLine);
      if($('slExact')) $('slExact').value = prompts.exact;
      if($('slReal')) $('slReal').value = prompts.realism;
      if($('slCinema')) $('slCinema').value = prompts.cinema;
    };

    $('slPhotoInput').addEventListener('change', ()=>setTimeout(analyzeDetailed, 350), {passive:true});
    if($('slBuildPhoto')) $('slBuildPhoto').addEventListener('click', ()=>setTimeout(()=>{
      if($('slPhotoInput')?.files?.[0]) analyzeDetailed();
    }, 50));
  }

  waitForStudio(install);
})();
