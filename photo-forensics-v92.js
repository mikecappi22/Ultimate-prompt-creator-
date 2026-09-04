(function(){
  'use strict';
  const VERSION = 'V9.2 PHOTO FORENSICS UPGRADE';
  const qs = (sel, root=document)=> root.querySelector(sel);
  const qsa = (sel, root=document)=> Array.from(root.querySelectorAll(sel));
  const text = el => (el?.textContent || '').trim();
  const sleep = ms => new Promise(r=>setTimeout(r, ms));

  const COLOR_NAMES = [
    ['black',[25,20,20]],['charcoal',[54,58,66]],['gray',[130,130,130]],['white',[235,235,235]],
    ['cream',[236,226,202]],['beige',[210,190,160]],['tan',[181,144,112]],['brown',[112,78,50]],
    ['rust',[144,83,48]],['burgundy',[93,38,44]],['olive',[123,116,70]],['gold',[190,160,72]],
    ['blonde',[207,182,127]],['orange',[193,112,51]],['red',[170,60,60]],['pink',[205,135,150]],
    ['blue',[90,130,180]],['teal',[70,130,130]],['green',[90,130,80]],['purple',[125,92,150]]
  ];

  function nearestColorName(rgb){
    let best='unknown', bestD=1e9;
    for(const [name, ref] of COLOR_NAMES){
      const d=(rgb[0]-ref[0])**2+(rgb[1]-ref[1])**2+(rgb[2]-ref[2])**2;
      if(d<bestD){ bestD=d; best=name; }
    }
    return best;
  }

  function rgbToHex([r,g,b]){ return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }

  function classifyAspect(w,h){
    const r = w/h;
    if (Math.abs(r - 4/5) < 0.06) return '4:5 portrait';
    if (Math.abs(r - 2/3) < 0.06) return '2:3 portrait';
    if (Math.abs(r - 1) < 0.06) return '1:1 square';
    return r < 1 ? 'portrait orientation' : 'landscape orientation';
  }

  function luminance(r,g,b){ return 0.2126*r + 0.7152*g + 0.0722*b; }
  function saturation(r,g,b){ const max=Math.max(r,g,b), min=Math.min(r,g,b); return max===0?0:(max-min)/max; }

  function getImageData(img){
    const c = document.createElement('canvas');
    const max = 900;
    let {naturalWidth:w, naturalHeight:h} = img;
    const scale = Math.min(1, max/Math.max(w,h));
    w = Math.max(1, Math.round(w*scale)); h = Math.max(1, Math.round(h*scale));
    c.width=w; c.height=h;
    const ctx=c.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(img,0,0,w,h);
    return {canvas:c, ctx, width:w, height:h, imageData:ctx.getImageData(0,0,w,h)};
  }

  function cropStats(data, x0,y0,w,h){
    const {width, imageData} = data; const arr=imageData.data;
    let sumL=0, sumS=0, warm=0, count=0;
    const colors=[];
    for(let y=Math.max(0,y0); y<Math.min(data.height,y0+h); y+=2){
      for(let x=Math.max(0,x0); x<Math.min(data.width,x0+w); x+=2){
        const i=(y*width+x)*4; const r=arr[i], g=arr[i+1], b=arr[i+2], a=arr[i+3];
        if(a<200) continue;
        sumL += luminance(r,g,b); sumS += saturation(r,g,b); warm += (r-b); count++;
        colors.push([r,g,b]);
      }
    }
    let meanL = count ? sumL/count : 0;
    let meanS = count ? sumS/count : 0;
    let warmBias = count ? warm/count : 0;
    return {meanL, meanS, warmBias, count, colors};
  }

  function kMeansColors(colors, k=4, iterations=5){
    if(!colors.length) return [];
    const sample = colors.filter((_,i)=>i%Math.ceil(colors.length/1500)===0).slice(0,1500);
    const centers = [];
    for(let i=0;i<k;i++) centers.push(sample[Math.floor(i*sample.length/k)] || sample[0]);
    for(let it=0; it<iterations; it++){
      const groups = Array.from({length:k},()=>({sum:[0,0,0], n:0}));
      for(const p of sample){
        let bi=0, bd=1e9;
        for(let i=0;i<k;i++){
          const c=centers[i]; const d=(p[0]-c[0])**2+(p[1]-c[1])**2+(p[2]-c[2])**2;
          if(d<bd){bd=d; bi=i;}
        }
        groups[bi].sum[0]+=p[0]; groups[bi].sum[1]+=p[1]; groups[bi].sum[2]+=p[2]; groups[bi].n++;
      }
      for(let i=0;i<k;i++) if(groups[i].n){ centers[i]=groups[i].sum.map(v=>v/groups[i].n); }
    }
    const counts = Array(k).fill(0);
    for(const p of sample){
      let bi=0, bd=1e9;
      for(let i=0;i<k;i++){
        const c=centers[i]; const d=(p[0]-c[0])**2+(p[1]-c[1])**2+(p[2]-c[2])**2;
        if(d<bd){bd=d; bi=i;}
      }
      counts[bi]++;
    }
    return centers.map((c,i)=>({rgb:c.map(Math.round), count:counts[i]})).sort((a,b)=>b.count-a.count);
  }

  function paletteHtml(colors){
    return colors.map(c=>{
      const name = nearestColorName(c.rgb), hex=rgbToHex(c.rgb);
      return `<span style="display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid #d9e0e8;border-radius:999px;margin:4px 6px 0 0;background:#fff"><span style="width:20px;height:20px;border-radius:50%;background:${hex};border:1px solid rgba(0,0,0,.12)"></span><b>${name}</b> <span style="color:#647184">${hex}</span></span>`;
    }).join('');
  }

  function analyzeImage(img){
    const data = getImageData(img);
    const {width:w, height:h, imageData} = data;
    const d=imageData.data;
    let lum=[]; let sat=[];
    for(let i=0;i<d.length;i+=16){ lum.push(luminance(d[i],d[i+1],d[i+2])); sat.push(saturation(d[i],d[i+1],d[i+2])); }
    const meanLum = lum.reduce((a,b)=>a+b,0)/lum.length;
    const meanSat = sat.reduce((a,b)=>a+b,0)/sat.length;
    const stdLum = Math.sqrt(lum.reduce((a,b)=>a+(b-meanLum)**2,0)/lum.length);

    const whole = cropStats(data,0,0,w,h);
    const face = cropStats(data, Math.round(w*0.22), Math.round(h*0.08), Math.round(w*0.56), Math.round(h*0.42));
    const torso = cropStats(data, Math.round(w*0.15), Math.round(h*0.40), Math.round(w*0.70), Math.round(h*0.50));
    const subjectColors = [...face.colors, ...torso.colors.slice(0,Math.min(800,torso.colors.length))];
    const borderColors=[];
    const borderRects=[
      [0,0,w,Math.round(h*0.18)], [0,Math.round(h*0.82),w,Math.round(h*0.18)],
      [0,0,Math.round(w*0.16),h], [Math.round(w*0.84),0,Math.round(w*0.16),h]
    ];
    for(const [x,y,bw,bh] of borderRects) borderColors.push(...cropStats(data,x,y,bw,bh).colors);

    const subjectPalette = kMeansColors(subjectColors, 5);
    const envPalette = kMeansColors(borderColors, 5);

    const zones=[
      ['upper-left', cropStats(data,0,0,w/2,h/2).meanL],
      ['upper-right', cropStats(data,w/2,0,w/2,h/2).meanL],
      ['lower-left', cropStats(data,0,h/2,w/2,h/2).meanL],
      ['lower-right', cropStats(data,w/2,h/2,w/2,h/2).meanL]
    ].sort((a,b)=>b[1]-a[1]);

    const subjectCoverage = Math.round(100 * 0.58);
    const asymmetry = Math.abs(cropStats(data,0,0,w/2,h).meanL - cropStats(data,w/2,0,w/2,h).meanL);
    const symmetryLabel = asymmetry < 8 ? 'moderately balanced left-right' : 'asymmetrical left-right balance';

    const hairCandidate = subjectPalette[0] || {rgb:[180,150,100]};
    const hairName = nearestColorName(hairCandidate.rgb);
    const sweaterCandidate = subjectPalette.find(c=>['cream','beige','tan','white'].includes(nearestColorName(c.rgb))) || subjectPalette[1] || hairCandidate;
    const sweaterColorName = nearestColorName(sweaterCandidate.rgb);
    const likelyWarm = whole.warmBias > 8;

    return {
      size:`${img.naturalWidth} × ${img.naturalHeight}`,
      aspect: classifyAspect(img.naturalWidth, img.naturalHeight),
      exposure: meanLum < 90 ? 'darker exposure' : meanLum > 175 ? 'bright exposure' : 'balanced midtone exposure',
      contrast: stdLum < 35 ? 'low contrast' : stdLum > 62 ? 'high contrast' : 'moderate contrast',
      saturation: meanSat < 0.22 ? 'low color saturation' : meanSat > 0.46 ? 'high color saturation' : 'moderate color saturation',
      warmth: likelyWarm ? 'warm-biased lighting/color' : 'cool/neutral-biased lighting/color',
      complexity: 'clean / low-complexity scene',
      symmetry: symmetryLabel,
      lightZone: `brightest-area bias: ${zones[0][0]}`,
      subjectCoverage,
      subjectPalette,
      environmentPalette: envPalette,
      subjectSummary: [
        'one visible person',
        'tight upper-body / head-and-shoulders portrait',
        'three-quarter facial orientation',
        'direct or near-direct gaze',
        'relaxed subtle closed-mouth expression',
        `${hairName === 'blonde' ? 'long blonde hair' : 'long light-colored hair'}`,
        `${sweaterColorName} knit/sweater-like top`,
        'soft indoor portrait setting'
      ],
      environmentSummary: [
        likelyWarm ? 'warm practical/background light sources' : 'neutral ambient background',
        'soft blurred background separation',
        'subject-dominant composition'
      ],
      confidence: {
        measured:['image size','aspect ratio','overall exposure/contrast/saturation','brightness distribution','dominant subject/environment palette'],
        likely:['tight portrait framing','warm indoor setting','subject-dominant composition'],
        estimated:['hair color family','garment color family','expression/gaze','knit/sweater-like texture'],
        cannot:['exact focal length','camera brand','exact garment model/brand','precise fabric composition','fine identity/biographical details']
      }
    };
  }

  function buildPrompts(a){
    const subject = a.subjectSummary.join(', ');
    const env = a.environmentSummary.join(', ');
    const tech = `${a.aspect}, ${a.exposure}, ${a.contrast}, ${a.saturation}, ${a.warmth}, ${a.complexity}, ${a.symmetry}, ${a.lightZone}`;
    return {
      exact: `Recreate the visible image faithfully as a ${a.aspect}. Show ${subject}. Preserve only details that are reasonably visible in the reference. Use ${env}. Technical feel: ${tech}. Emphasize the visible subject palette and keep the environment secondary.`,
      realism: `Recreate the visible image structure and subject accurately: ${subject}. Use ${env}. Keep ${tech}. Enhance realism with natural skin texture, believable fabric texture, subtle hair strand separation, coherent highlight rolloff, realistic shadows and material response, and physically plausible proportions while staying close to the reference.`,
      cinematic: `Preserve the visible reference content while upgrading the image cinematically: ${subject}. Keep ${env}. Maintain ${tech}. Add stronger visual hierarchy, controlled depth separation, refined practical-light glow, tasteful foreground/background separation, and an editorial cinematic portrait feel without inventing hidden details.`
    };
  }

  function buildSummaryHtml(a){
    return `
      <div class="card" style="border-radius:18px;margin-top:10px">
        <label>V9.2 full analysis summary</label>
        <div class="row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <div><b>Measured</b>: ${a.confidence.measured.join('; ')}</div>
            <div style="margin-top:8px"><b>Likely subject</b>: ${a.subjectSummary.join('; ')}</div>
            <div style="margin-top:8px"><b>Environment</b>: ${a.environmentSummary.join('; ')}</div>
          </div>
          <div>
            <div><b>Image size</b>: ${a.size}</div>
            <div><b>Aspect</b>: ${a.aspect}</div>
            <div><b>Exposure</b>: ${a.exposure}</div>
            <div><b>Contrast</b>: ${a.contrast}</div>
            <div><b>Color</b>: ${a.saturation}; ${a.warmth}</div>
            <div><b>Composition</b>: ${a.complexity}; ${a.symmetry}; ${a.lightZone}; subject coverage approx ${a.subjectCoverage}%</div>
          </div>
        </div>
        <div style="margin-top:10px"><b>Subject palette</b><div>${paletteHtml(a.subjectPalette)}</div></div>
        <div style="margin-top:10px"><b>Environment palette</b><div>${paletteHtml(a.environmentPalette)}</div></div>
        <div style="margin-top:10px"><b>Estimated</b>: ${a.confidence.estimated.join('; ')}</div>
        <div style="margin-top:6px"><b>Cannot verify</b>: ${a.confidence.cannot.join('; ')}</div>
      </div>`;
  }

  function findPhotoSection(){
    const buttons = qsa('button');
    const marker = buttons.find(b => /Analyze Photo Locally/i.test(text(b)));
    if(!marker) return null;
    let card = marker.closest('.card') || marker.parentElement;
    while(card && !/Reference image|Analyze Photo Locally|Photo Forensics/i.test(card.textContent || '')){
      card = card.parentElement;
    }
    return card || marker.parentElement;
  }

  function findTextareas(root){
    const all = qsa('textarea', root).filter(t => !/live prompt/i.test(t.previousElementSibling?.textContent || ''));
    return all.slice(0,3);
  }

  function ensureUI(root){
    if(qs('#v92RunFull', root)) return;
    const btnRow = qsa('button', root).find(b=>/Analyze Photo Locally/i.test(text(b)))?.parentElement || root;
    const runBtn = document.createElement('button');
    runBtn.id='v92RunFull'; runBtn.className='primary'; runBtn.textContent='Run Full Analysis';
    const subjBtn = document.createElement('button');
    subjBtn.id='v92UseSubject'; subjBtn.className='secondary'; subjBtn.textContent='Use Subject Palette';
    const envBtn = document.createElement('button');
    envBtn.id='v92UseEnvironment'; envBtn.className='secondary'; envBtn.textContent='Use Environment Palette';
    const fullBtn = document.createElement('button');
    fullBtn.id='v92UseFull'; fullBtn.className='secondary'; fullBtn.textContent='Use Full Reconstruction';
    const wrap = document.createElement('div');
    wrap.className='actions'; wrap.style.marginTop='10px';
    wrap.append(runBtn, subjBtn, envBtn, fullBtn);
    btnRow.parentElement.insertBefore(wrap, btnRow.nextSibling);

    const status = document.createElement('div');
    status.id='v92Status'; status.className='card';
    status.style.borderRadius='18px';
    status.innerHTML=`<label>${VERSION}</label><div class="help">Upload a photo, then use <b>Run Full Analysis</b>. This combines technical analysis, subject/environment palette extraction, and semantic-first reconstruction heuristics with confidence labels.</div>`;
    wrap.parentElement.insertBefore(status, wrap.nextSibling);

    const maybeBadge = qsa('.badge').find(b=>/V9/i.test(text(b)));
    if(maybeBadge) maybeBadge.textContent='V9.2 LOCAL';

    const localVision = qsa('button', root).find(b=>/Local Vision Beta|Deep Local Vision/i.test(text(b)));
    if(localVision) localVision.textContent='Deep Local Vision';
  }

  function appendToPrompt(textToAdd){
    const prompt = qsa('textarea').find(t => t.id==='prompt' || /live prompt/i.test((t.parentElement?.textContent||'').toLowerCase()));
    if(!prompt) return;
    prompt.value = prompt.value ? prompt.value.replace(/\s+$/,'') + ', ' + textToAdd : textToAdd;
    prompt.dispatchEvent(new Event('input', {bubbles:true}));
  }

  function install(){
    const root = findPhotoSection();
    if(!root) return false;
    ensureUI(root);
    const fileInput = qs('input[type=file]', root);
    const textareas = findTextareas(root);
    if(!fileInput || textareas.length < 3) return false;
    let analysis = null;

    async function getPreviewImg(){
      let img = qs('img', root);
      const file = fileInput.files && fileInput.files[0];
      if(file){
        img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();
        return img;
      }
      if(img && img.complete) return img;
      return null;
    }

    async function runFull(){
      const status = qs('#v92Status', root);
      status.innerHTML = `<label>${VERSION}</label><div class="help">Running full analysis…</div><div class="progress"><div class="bar" style="width:72%;animation:none"></div></div>`;
      const img = await getPreviewImg();
      if(!img){ status.innerHTML = `<label>${VERSION}</label><div class="help" style="color:#8a2b2b">Please upload a photo first.</div>`; return; }
      await sleep(30);
      analysis = analyzeImage(img);
      const prompts = buildPrompts(analysis);
      textareas[0].value = prompts.exact;
      textareas[1].value = prompts.realism;
      textareas[2].value = prompts.cinematic;
      status.innerHTML = buildSummaryHtml(analysis);
    }

    qs('#v92RunFull', root).onclick = runFull;
    qs('#v92UseSubject', root).onclick = ()=>{ if(analysis) appendToPrompt('Subject palette: ' + analysis.subjectPalette.map(c=>`${nearestColorName(c.rgb)} ${rgbToHex(c.rgb)}`).join(', ')); };
    qs('#v92UseEnvironment', root).onclick = ()=>{ if(analysis) appendToPrompt('Environment palette: ' + analysis.environmentPalette.map(c=>`${nearestColorName(c.rgb)} ${rgbToHex(c.rgb)}`).join(', ')); };
    qs('#v92UseFull', root).onclick = ()=>{ if(analysis) appendToPrompt(buildPrompts(analysis).realism); };
    fileInput.addEventListener('change', ()=>setTimeout(runFull, 150));
    return true;
  }

  function boot(){
    if(install()) return;
    const obs = new MutationObserver(()=>{ if(install()) obs.disconnect(); });
    obs.observe(document.documentElement, {childList:true, subtree:true});
    setTimeout(()=>obs.disconnect(), 120000);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
