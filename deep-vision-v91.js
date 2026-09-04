(function(){
'use strict';
const VERSION='V9.1 DEEP LOCAL VISION';
const HF_ESM='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm';
const CLIP_MODEL='Xenova/clip-vit-base-patch32';
const TF_CDN='https://cdn.jsdelivr.net/npm/@tensorflow/tfjs';
const COCO_CDN='https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd';
const POSE_CDN='https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection';
let classifier=null,coco=null,poseDetector=null,hf=null;
let state={img:null,person:null,objects:[],poses:[],semantic:{},garmentColor:null,runId:0};
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const uniq=a=>[...new Set(a.filter(Boolean))];

function loadScript(src,test){
 if(test())return Promise.resolve();
 return new Promise((resolve,reject)=>{
   const old=[...document.scripts].find(s=>s.src===src);
   if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return;}
   const s=document.createElement('script');s.src=src;s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load '+src));document.head.appendChild(s);
 });
}
function getImg(){return $('#csPhotoPreview img')||null;}
function toast(msg){try{if(typeof showStatus==='function')return showStatus(msg)}catch(_){}const x=$('#csPhotoStatus');if(x)x.textContent=msg;}
function status(msg){const x=$('#csPhotoStatus');if(x)x.textContent=msg;}
function installStyle(){
 if($('#dv91Style'))return;
 const s=document.createElement('style');s.id='dv91Style';s.textContent=`
 .dv-progress{height:8px;background:#e8edf5;border-radius:999px;overflow:hidden;margin:8px 0}.dv-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2563eb,#7c3aed,#16a34a);transition:width .2s ease}.dv-semantic{margin-top:10px}.dv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.dv-item{border:1px solid #e2e8f0;border-radius:15px;padding:9px 10px;background:#fff}.dv-item b{display:block;font-size:12px;color:#475569;margin-bottom:3px}.dv-item strong{font-size:13px;color:#172033}.dv-score{font-size:10px;color:#64748b;margin-left:5px}.dv-badge{display:inline-block;border-radius:999px;padding:3px 7px;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;font-size:10px;font-weight:800}.dv-warning{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:8px 10px;font-size:12px;color:#9a3412;margin-top:8px}.dv-good{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:8px 10px;font-size:12px;color:#166534;margin-top:8px}.dv-match{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;border-top:1px solid #edf1f6;padding:8px 0}.dv-match:first-child{border-top:0}.dv-note{font-size:11px;color:#64748b;line-height:1.4}.dv-model-note{background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:8px 10px;font-size:11px;color:#5b21b6;margin-top:8px}@media(max-width:680px){.dv-grid{grid-template-columns:1fr}}
 `;document.head.appendChild(s);
}
function installUI(){
 installStyle();
 const btn=$('#csLocalVision');
 if(btn){btn.textContent='Deep Local Vision';btn.title='Runs local object/pose detection plus CLIP semantic classification in your browser. No API key.';btn.onclick=deepVision;}
 const note=btn?.parentElement?.nextElementSibling;
 if(note&&note.classList.contains('cs-note'))note.innerHTML='<b>Deep Local Vision:</b> runs entirely in your browser with no API key. First use downloads local model files and can be a large download. It analyzes semantic categories such as framing, hair, clothing, expression, lighting and environment, then rebuilds the reconstruction prompts from those findings.';
 const preview=$('#csPhotoPreview');
 if(preview&&!$('#dv91Progress')){
   const box=document.createElement('div');box.id='dv91Progress';box.innerHTML='<div class="dv-progress"><i></i></div><div id="dv91ProgressText" class="dv-note">Deep Local Vision not loaded yet.</div>';preview.after(box);
 }
 const summary=$('#csPhotoSummary');
 if(summary&&!$('#dv91Semantic')){
   const d=document.createElement('div');d.id='dv91Semantic';d.className='dv-semantic';d.innerHTML='<div class="cs-section"><h4>Deep semantic reconstruction <span class="dv-badge">V9.1 LOCAL</span></h4><div class="empty">Run Deep Local Vision to classify visible subject, hair, wardrobe, framing, lighting and photographic style.</div></div>';
   summary.after(d);
 }
 const matchBtn=$('#csMatchDb');if(matchBtn)matchBtn.onclick=matchDeepToDatabase;
 const addAll=$('#csAddAllPhotoMatches');if(addAll)addAll.onclick=addAllDeepMatches;
 document.title='Ultimate Prompt Creator V9.1 Deep Local Vision';
 const badge=document.querySelector('.badge');if(badge)badge.textContent='V9.1 DEEP VISION';
}
function setProgress(p,text){const bar=document.querySelector('#dv91Progress .dv-progress i');if(bar)bar.style.width=clamp(p,0,100)+'%';const t=$('#dv91ProgressText');if(t)t.textContent=text;}
function normalizeBox(box,img){
 let [x,y,w,h]=box.map(Number);const nw=img.naturalWidth||img.width,nh=img.naturalHeight||img.height;const rw=img.width||nw,rh=img.height||nh;
 const fitsRender=x>=-2&&y>=-2&&x+w<=rw*1.08&&y+h<=rh*1.08;
 const renderDiff=Math.abs(rw-nw)/Math.max(1,nw)+Math.abs(rh-nh)/Math.max(1,nh);
 if(fitsRender&&renderDiff>.08){x*=nw/rw;y*=nh/rh;w*=nw/rw;h*=nh/rh;}
 x=clamp(x,0,nw-1);y=clamp(y,0,nh-1);w=clamp(w,1,nw-x);h=clamp(h,1,nh-y);
 return [x,y,w,h];
}
function cropDataUrl(img,box,f={x:0,y:0,w:1,h:1}){
 const [bx,by,bw,bh]=box||[0,0,img.naturalWidth,img.naturalHeight];
 let x=bx+bw*f.x,y=by+bh*f.y,w=bw*f.w,h=bh*f.h;
 x=clamp(x,0,img.naturalWidth-1);y=clamp(y,0,img.naturalHeight-1);w=clamp(w,1,img.naturalWidth-x);h=clamp(h,1,img.naturalHeight-y);
 const max=640,scale=Math.min(1,max/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(img,x,y,w,h,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.9);
}
function sampleColor(img,box,f={x:.18,y:.55,w:.64,h:.38}){
 const [bx,by,bw,bh]=box||[0,0,img.naturalWidth,img.naturalHeight];let x=bx+bw*f.x,y=by+bh*f.y,w=bw*f.w,h=bh*f.h;
 const c=document.createElement('canvas'),max=240,scale=Math.min(1,max/Math.max(w,h));c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(img,x,y,w,h,0,0,c.width,c.height);const d=cx.getImageData(0,0,c.width,c.height).data,bins=new Map();
 for(let i=0;i<d.length;i+=16){const r=d[i],g=d[i+1],b=d[i+2];const mx=Math.max(r,g,b);if(mx<22||mx>247)continue;const skin=r>95&&g>45&&b>25&&r>g&&g>b&&(r-b)>35;if(skin)continue;const q=((r>>4)<<8)|((g>>4)<<4)|(b>>4);bins.set(q,(bins.get(q)||0)+1);}
 const best=[...bins].sort((a,b)=>b[1]-a[1])[0];if(!best)return null;const q=best[0],r=((q>>8)&15)*16+8,g=((q>>4)&15)*16+8,b=(q&15)*16+8;return {r,g,b,hex:'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join(''),name:nearestColor(r,g,b)};
}
const COLORS=[['black',18,18,20],['charcoal',55,60,65],['gray',128,128,128],['white',240,240,238],['cream',235,222,190],['beige',205,185,150],['tan',185,145,105],['brown',110,72,48],['rust',170,78,45],['red',205,45,45],['burgundy',105,30,45],['orange',225,122,38],['yellow',230,205,65],['olive',105,112,55],['green',55,145,75],['sage',145,160,125],['teal',45,135,140],['blue',55,105,190],['navy',30,50,90],['purple',115,70,160],['pink',220,120,155],['rose',190,95,120]];
function nearestColor(r,g,b){let z=COLORS[0],d=1e9;for(const c of COLORS){const q=(r-c[1])**2+(g-c[2])**2+(b-c[3])**2;if(q<d){d=q;z=c}}return z[0]}
async function loadBasicVision(){
 setProgress(5,'Loading local object detector…');await loadScript(TF_CDN,()=>window.tf);await tf.ready();await loadScript(COCO_CDN,()=>window.cocoSsd);if(!coco)coco=await cocoSsd.load();
 setProgress(12,'Detecting people and objects…');const raw=await coco.detect(state.img,20,.3);state.objects=raw.map(o=>({...o,bbox:normalizeBox(o.bbox,state.img)}));state.person=state.objects.filter(o=>o.class==='person').sort((a,b)=>b.score-a.score)[0]||null;
 try{setProgress(18,'Loading body-pose model…');await loadScript(POSE_CDN,()=>window.poseDetection);if(!poseDetector)poseDetector=await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet,{modelType:poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING});state.poses=await poseDetector.estimatePoses(state.img,{flipHorizontal:false});}catch(e){console.warn('Pose model unavailable',e);state.poses=[];}
 state.garmentColor=state.person?sampleColor(state.img,state.person.bbox):null;
}
async function loadClip(){
 if(classifier)return classifier;
 setProgress(22,'Loading Transformers.js semantic vision engine…');
 hf=await import(HF_ESM);if(hf.env){hf.env.useBrowserCache=true;hf.env.allowRemoteModels=true;}
 classifier=await hf.pipeline('zero-shot-image-classification',CLIP_MODEL,{dtype:'q4',progress_callback:x=>{if(x?.progress!=null){const p=22+Math.min(28,Number(x.progress)*.28);setProgress(p,`Downloading CLIP model… ${Math.round(x.progress)}%`)}}});
 return classifier;
}
const GROUPS={
 framing:['extreme close-up portrait','tight close-up portrait','head-and-shoulders portrait','medium close-up portrait','waist-up portrait','three-quarter portrait','full-body portrait','environmental portrait'],
 angle:['eye-level camera angle','slightly high camera angle','high-angle camera','slightly low camera angle','low-angle camera','overhead camera angle'],
 gaze:['direct eye contact with the camera','looking slightly away from the camera','looking off-camera','side-profile face','three-quarter face view','front-facing portrait'],
 expression:['relaxed neutral expression','gentle closed-mouth smile','smiling with teeth','serious expression','concerned expression','playful expression','surprised expression'],
 hairColor:['blonde hair','light brown hair','brown hair','black hair','red hair','gray hair','blue-dyed hair','pink-dyed hair'],
 hairLength:['very long hair','long hair','shoulder-length hair','short hair'],
 hairTexture:['straight hair','wavy hair','curly hair','coily hair'],
 hairPart:['center-parted hair','side-parted hair','hair pulled back','hair with bangs'],
 topGarment:['knit sweater','cardigan','t-shirt','tank top','blouse','hoodie','sweatshirt','jacket','dress','sports bra','button-up shirt','crop top'],
 material:['knit fabric','ribbed knit fabric','cotton jersey fabric','fleece fabric','satin fabric','denim fabric','leather fabric','nylon athletic fabric','linen fabric'],
 pose:['seated portrait','standing portrait','leaning pose','lying-down pose','arms crossed','hand near face','relaxed seated pose'],
 environment:['indoor home interior','studio backdrop','gym interior','bedroom interior','living room interior','office interior','restaurant or bar interior','outdoor street','outdoor nature','beach setting'],
 lighting:['warm indoor practical lighting','soft natural window light','soft diffused studio light','hard direct light','golden-hour sunlight','backlit lighting','low-key dramatic lighting','bright high-key lighting','mixed warm and cool lighting'],
 style:['candid lifestyle portrait','editorial fashion portrait','studio portrait','selfie-style portrait','documentary portrait','commercial beauty portrait','cinematic portrait','casual snapshot']
};
async function classify(input,labels){try{return await classifier(input,labels)}catch(e){console.warn('CLIP classify failed',e);return []}}
function pick(res){if(!res?.length)return null;return {label:res[0].label,score:res[0].score,second:res[1]||null};}
async function runSemantic(){
 const whole=cropDataUrl(state.img,null),person=state.person?cropDataUrl(state.img,state.person.bbox):whole,head=state.person?cropDataUrl(state.img,state.person.bbox,{x:.08,y:0,w:.84,h:.48}):whole,upper=state.person?cropDataUrl(state.img,state.person.bbox,{x:.12,y:.36,w:.76,h:.58}):whole;
 const jobs=[['framing',whole,GROUPS.framing],['angle',whole,GROUPS.angle],['environment',whole,GROUPS.environment],['lighting',whole,GROUPS.lighting],['style',whole,GROUPS.style],['gaze',head,GROUPS.gaze],['expression',head,GROUPS.expression],['hairColor',head,GROUPS.hairColor],['hairLength',head,GROUPS.hairLength],['hairTexture',head,GROUPS.hairTexture],['hairPart',head,GROUPS.hairPart],['topGarment',upper,GROUPS.topGarment],['material',upper,GROUPS.material],['pose',person,GROUPS.pose]];
 state.semantic={};let i=0;for(const [key,input,labels] of jobs){i++;setProgress(52+i/jobs.length*43,`Semantic analysis: ${key.replace(/([A-Z])/g,' $1')} (${i}/${jobs.length})…`);state.semantic[key]=pick(await classify(input,labels));}
}
function scoreText(x){return x?`${Math.round(x.score*100)}% semantic match`:'';}
function sem(key){return state.semantic[key]?.label||'';}
function poseGeom(){
 const p=state.poses?.[0];if(!p?.keypoints?.length)return '';
 const m={};for(const k of p.keypoints)m[k.name||k.part]=k;const ok=n=>m[n]&&(m[n].score??1)>.25?m[n]:null;const ls=ok('left_shoulder'),rs=ok('right_shoulder'),lh=ok('left_hip'),rh=ok('right_hip');const bits=[];
 if(ls&&rs){const a=Math.atan2(rs.y-ls.y,rs.x-ls.x)*180/Math.PI;bits.push(Math.abs(a)>5?`shoulder line tilted about ${Math.abs(a).toFixed(0)}°`:'shoulders approximately level');}
 if(ls&&rs&&lh&&rh){const sx=(ls.x+rs.x)/2,sy=(ls.y+rs.y)/2,hx=(lh.x+rh.x)/2,hy=(lh.y+rh.y)/2,a=Math.atan2(sx-hx,hy-sy)*180/Math.PI;bits.push(Math.abs(a)>5?`torso leaning ${a>0?'right':'left'} about ${Math.abs(a).toFixed(0)}°`:'torso approximately upright');}
 return bits.join('; ');
}
function renderDeepResults(){
 const root=$('#dv91Semantic');if(!root)return;
 const order=[['Framing','framing'],['Camera angle','angle'],['Gaze / face view','gaze'],['Expression','expression'],['Hair color','hairColor'],['Hair length','hairLength'],['Hair texture','hairTexture'],['Hair part','hairPart'],['Top garment','topGarment'],['Material','material'],['Pose','pose'],['Environment','environment'],['Lighting','lighting'],['Photo style','style']];
 const cards=order.map(([label,key])=>{const x=state.semantic[key];return `<div class="dv-item"><b>${label}</b><strong>${esc(x?.label||'unclear')}</strong>${x?`<span class="dv-score">${esc(scoreText(x))}</span>`:''}</div>`}).join('');
 const person=state.person,geom=poseGeom(),color=state.garmentColor;let measured='';
 if(person){const frac=person.bbox[3]/state.img.naturalHeight;measured=`Corrected person box: about ${Math.round(frac*100)}% of frame height; ${Math.round(person.score*100)}% detector score.`;}
 root.innerHTML=`<div class="cs-section"><h4>Deep semantic reconstruction <span class="dv-badge">V9.1 LOCAL</span></h4><div class="dv-grid">${cards}</div>${measured?`<div class="dv-good">${esc(measured)} ${color?`Central clothing-region color: ${esc(color.name)} ${esc(color.hex)}.`:''} ${geom?`Pose geometry: ${esc(geom)}.`:''}</div>`:''}<div class="dv-model-note">These are local CLIP semantic matches, not verified facts. They are much more image-specific than the old generic reconstruction, but exact brand, facial identity, eye color, lens metadata and hidden details still cannot be verified without a stronger vision model.</div></div>`;
}
function buildDeepPrompts(){
 const details=uniq([sem('framing'),sem('angle'),sem('gaze'),sem('expression'),sem('hairColor'),sem('hairLength'),sem('hairTexture'),sem('hairPart'),sem('topGarment'),state.garmentColor?`${state.garmentColor.name} clothing-region color`:null,sem('material'),sem('pose'),sem('environment'),sem('lighting'),sem('style'),poseGeom()]);
 const visible=details.join(', ');
 const exact=`Recreate only the visible photographic information from the reference: ${visible}. Preserve the measured aspect ratio, exposure, contrast, dominant palette and light distribution from the local photo analysis. Keep subject placement, crop, gaze, expression, hair silhouette, visible wardrobe, pose and environment consistent with the reference. Do not invent brand names, exact lens metadata, hidden anatomy, unseen clothing, or identity details that are not visibly supported.`;
 const real=`${exact} Render as a real photograph with biologically plausible proportions and natural asymmetry, visible micro-skin texture and pores, realistic hair strand separation with subtle flyaways, physically accurate fabric tension, stitching, wrinkles and gravity, coherent contact shadows, believable reflections and material response, subtle sensor noise and natural optical imperfections without plastic skin or CGI appearance.`;
 const cinema=`${exact} Preserve the reference identity-independent visual DNA while increasing cinematic impact through deliberate foreground-midground-background separation, motivated directional light, controlled highlight rolloff, natural lens character, subtle atmospheric depth, refined color separation, stronger visual hierarchy, purposeful negative space and a physically believable viewpoint. Do not replace the reference wardrobe, hairstyle, expression or environment with unrelated creative choices.`;
 if($('#csReconExact'))$('#csReconExact').value=exact;if($('#csReconReal'))$('#csReconReal').value=real;if($('#csReconCinema'))$('#csReconCinema').value=cinema;
}
function semanticSummary(){return uniq(Object.values(state.semantic).map(x=>x?.label).concat(state.garmentColor?`${state.garmentColor.name} garment color`:null,poseGeom())).join(', ');}
function deepTokens(){return uniq(semanticSummary().toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(t=>t.length>2&&!['portrait','camera','angle','hair','fabric','lighting','photo','style','the','with','and','about'].includes(t)));}
function matchDeepToDatabase(){
 if(!state.semantic||!Object.keys(state.semantic).length)return toast('Run Deep Local Vision first.');
 const toks=deepTokens(),hits=[],seen=new Set();
 try{for(const r of META.records){const hay=norm(keyword(r)+' '+phrase(r)+' '+sourceName(r)+' '+context(r));let score=0;for(const t of toks){if(hay.includes(t))score+=t.length>6?3:1;}if(score<2)continue;const key=norm(keyword(r)+'|'+sourceName(r));if(seen.has(key))continue;seen.add(key);hits.push({r,score});}}catch(e){console.warn(e);return toast('Database is not ready yet.');}
 hits.sort((a,b)=>b.score-a.score);state.matches=hits.slice(0,20);renderMatches();
}
function renderMatches(){const root=$('#csPhotoDbMatches');if(!root)return;const arr=state.matches||[];root.innerHTML=arr.length?'':'<div class="empty">No deep semantic matches yet.</div>';for(const {r,score} of arr){const d=document.createElement('div');d.className='dv-match';d.innerHTML=`<div><strong>${esc(keyword(r))}</strong><div class="dv-note">${esc(sourceName(r))} · lexical score ${score}</div></div><button class="add">Add</button>`;d.querySelector('button').onclick=()=>addRecord(r);root.appendChild(d);}}
function addRecord(r){try{selected.push(r);if(typeof renderSelectedManualSafe==='function')renderSelectedManualSafe();else if(typeof renderSelected==='function')renderSelected();if(typeof updatePromptManualSafe==='function')updatePromptManualSafe();else if(typeof updatePrompt==='function')updatePrompt();}catch(e){console.warn(e)}}
function addAllDeepMatches(){for(const x of (state.matches||[]).slice(0,12))addRecord(x.r);toast('Added deep semantic database matches.');}
async function deepVision(){
 const img=getImg();if(!img)return toast('Upload a photo first.');state={...state,img,person:null,objects:[],poses:[],semantic:{},garmentColor:null,matches:[],runId:state.runId+1};const run=state.runId;
 try{
   setProgress(1,'Starting corrected local analysis…');const baseBtn=$('#csAnalyzePhoto');if(baseBtn)baseBtn.click();await loadBasicVision();if(run!==state.runId)return;await loadClip();if(run!==state.runId)return;await runSemantic();if(run!==state.runId)return;setProgress(97,'Building image-specific reconstruction prompts…');renderDeepResults();buildDeepPrompts();matchDeepToDatabase();setProgress(100,'Deep Local Vision complete. Semantic results are image-specific local estimates.');status('Deep Local Vision complete — corrected geometry + semantic reconstruction ready.');
 }catch(e){console.error(e);setProgress(0,'Deep Local Vision failed: '+e.message);status('Deep Local Vision could not finish. Basic local analysis is still available.');}
}
function wait(){let n=0;const t=setInterval(()=>{n++;if($('#csStudio')&&$('#csLocalVision')){clearInterval(t);installUI();}if(n>150)clearInterval(t)},100)}
wait();
})();
