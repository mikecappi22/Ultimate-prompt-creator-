'use strict';
let DB=null, sources=[], stages=[], records=[];
const norm=s=>String(s||'').toLowerCase();
const aliases={grey:['gray','grey'],blonde:['blonde','blond'],ponytail:['ponytail','pony tail'],shorts:['short','shorts'],spandex:['spandex','compression'],volleyball:['volleyball','volley'],crop:['crop','cropped'],tee:['tee','tshirt','t-shirt','shirt'],lowrise:['lowrise','low rise','low-rise'],highrise:['highrise','high rise','high-rise'],bw:['black white','black and white']};
const stop=new Set('a an the and or with for to of in on at from that this these those show me looking look like want need very really just some type kind style styles image photo video'.split(' '));
function terms(t){return aliases[t]||[t]}
function sg(t){return t.endsWith('s')&&t.length>3?t.slice(0,-1):t}
function variants(t){const x=new Set([t,sg(t)]);for(const v of terms(t))x.add(v);for(const v of terms(sg(t)))x.add(v);return [...x].filter(Boolean)}
function sourceName(r){return sources[r[0]]||''}
function stageName(r){return stages[r[1]]||''}
function hay(r){return norm((r[2]||'')+' '+(r[3]||'')+' '+sourceName(r)+' '+(r[4]||''))}
async function fetchJsonWorker(){
  if(typeof DecompressionStream==='function'){
    try{
      const r=await fetch('db-v8-mobile.v93.json.gz?v=20260904-v100',{cache:'no-store'});
      if(!r.ok)throw new Error('compressed DB HTTP '+r.status);
      const stream=r.body.pipeThrough(new DecompressionStream('gzip'));
      const txt=await new Response(stream).text();
      return JSON.parse(txt);
    }catch(e){postMessage({type:'warn',message:'Compressed database fallback: '+e.message});}
  }
  const r=await fetch('db-v8-mobile.json?v=20260904-v100',{cache:'no-store'});
  if(!r.ok)throw new Error('database HTTP '+r.status);
  return JSON.parse(await r.text());
}
async function loadCamera(){
  try{
    const rs=await Promise.all([1,2,3,4,5].map(n=>fetch(`camera-addon-v81.part${n}.txt?v=20260904-v100`,{cache:'no-store'})));
    if(rs.some(r=>!r.ok))throw new Error('camera add-on HTTP failure');
    const packed=(await Promise.all(rs.map(r=>r.text()))).join('').trim();
    if(!packed)return;
    const bytes=Uint8Array.from(atob(packed),c=>c.charCodeAt(0));
    let txt;
    if(typeof DecompressionStream==='function'){
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      txt=await new Response(stream).text();
    }else{return;}
    const cam=JSON.parse(txt);
    if(!cam?.name||sources.includes(cam.name))return;
    const srcIndex=sources.length;sources.push(cam.name);
    let stageIndex=stages.indexOf(cam.stage);if(stageIndex<0)stageIndex=Math.min(5,stages.length-1);
    const slug=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    for(const [category,rows] of Object.entries(cam.groups||{}))for(const r of rows){
      const media=r[2]||'Both', id=`CAM_${slug(category)}_${slug(r[0])}`, ctx=`ID:${id} | Category:${category} | Media:${media}`;
      records.push([srcIndex,stageIndex,r[0],r[1],ctx]);
    }
  }catch(e){postMessage({type:'warn',message:'Camera add-on unavailable: '+e.message});}
}
async function init(){
  postMessage({type:'progress',message:'Loading database in background worker…'});
  DB=await fetchJsonWorker();sources=[...(DB.sources||[])];stages=[...(DB.stages||[])];records=[...(DB.records||[])];
  postMessage({type:'progress',message:`Parsed ${records.length.toLocaleString()} core choices off the page thread.`});
  await loadCamera();
  postMessage({type:'ready',sources,stages,count:records.length});
}
function search(payload){
  const q=norm(payload.q||'').trim(), src=payload.source||'', stage=payload.stage||'', limit=Math.max(1,Math.min(+payload.limit||1000,1000));
  const toks=q.split(/\s+/).filter(Boolean), out=[];
  for(const r of records){
    if(src&&sourceName(r)!==src)continue;if(stage&&stageName(r)!==stage)continue;
    if(toks.length){const h=hay(r);let ok=true;for(const t of toks){if(!terms(t).some(a=>h.includes(a))){ok=false;break}}if(!ok)continue;}
    out.push(r);if(out.length>=limit+1)break;
  }
  return {rows:out.slice(0,limit),hasMore:out.length>limit};
}
function tokenize(s){const a=norm(s).replace(/["“”]/g,' inch ').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean).map(sg).filter(t=>!stop.has(t)),o=[];for(const t of a)if(!o.includes(t))o.push(t);for(let i=0;i<a.length-1;i++){const b=a[i]+' '+a[i+1];if(!o.includes(b))o.push(b)}return o.slice(0,18)}
function recommend(payload){
  const ts=tokenize(payload.q||''),src=payload.source||'',stage=payload.stage||'',limit=Math.max(1,Math.min(+payload.limit||20,50)), hits=[],seen=new Set();
  for(const r of records){
    if(src&&sourceName(r)!==src)continue;if(stage&&stageName(r)!==stage)continue;
    const k=norm(r[2]),p=norm(r[3]),c=norm(r[4]),s=norm(sourceName(r)),st=norm(stageName(r));let z=0,m=0;
    for(const t of ts){let b=0;for(const v of variants(t)){if(k===v)b=Math.max(b,18);else if(k.includes(v))b=Math.max(b,12);if(p.includes(v))b=Math.max(b,8);if(c.includes(v)||s.includes(v)||st.includes(v))b=Math.max(b,4)}if(b){z+=b;m++}}
    if(!m)continue;if(m===ts.length)z+=12;else if(m>=Math.min(3,ts.length))z+=7;
    const key=norm((r[2]||'')+'|'+sourceName(r)+'|'+stageName(r));if(seen.has(key))continue;seen.add(key);hits.push([z,r]);
  }
  hits.sort((a,b)=>b[0]-a[0]||String(a[1][2]).localeCompare(String(b[1][2])));
  return hits.slice(0,limit).map(x=>x[1]);
}
self.onmessage=async e=>{
  const {type,id,payload={}}=e.data||{};
  try{
    if(type==='init'){await init();return;}
    if(type==='search'){postMessage({type:'response',id,result:search(payload)});return;}
    if(type==='recommend'){postMessage({type:'response',id,result:recommend(payload)});return;}
    if(type==='chunk'){
      const start=Math.max(0,+payload.start||0), count=Math.max(1,Math.min(+payload.count||500,1000));
      postMessage({type:'response',id,result:{rows:records.slice(start,start+count),next:start+count,done:start+count>=records.length}});return;
    }
  }catch(err){postMessage({type:'error',id,message:String(err?.message||err)});}
};
