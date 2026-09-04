(function(){
  'use strict';
  if(window.__UPC_FAST_DB_V93__) return;
  window.__UPC_FAST_DB_V93__=true;
  const nativeFetch=window.fetch.bind(window);
  const isMasterDb=(input)=>{
    try{
      const u=typeof input==='string'?input:(input&&input.url)||'';
      return /(^|\/)db-v8-mobile\.json(?:\?|$)/.test(u);
    }catch(_){return false;}
  };
  window.fetch=async function(input,init){
    if(isMasterDb(input) && typeof DecompressionStream==='function'){
      try{
        const r=await nativeFetch('db-v8-mobile.v93.json.gz?v=20260904-v93',{cache:'no-store'});
        if(!r.ok) throw new Error('compressed DB HTTP '+r.status);
        const stream=r.body.pipeThrough(new DecompressionStream('gzip'));
        const txt=await new Response(stream).text();
        if(!txt || txt[0]!=='{') throw new Error('compressed DB produced invalid JSON text');
        return new Response(txt,{status:200,headers:{'Content-Type':'application/json','X-UPC-DB':'compressed-v93'}});
      }catch(err){
        console.warn('V9.3 compressed DB fallback failed; retrying original database.',err);
      }
    }
    return nativeFetch(input,init);
  };
})();
