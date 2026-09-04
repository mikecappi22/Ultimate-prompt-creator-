(function(){
'use strict';
const VERSION='V10.1 INTERACTIVE CORE';
const $=id=>document.getElementById(id);
function setVersion(){const b=document.querySelector('.badge');if(b)b.textContent=VERSION;document.title='Ultimate Prompt Creator V10.1 Interactive Core';}
function load(src){return new Promise((res,rej)=>{if([...document.scripts].some(s=>s.src.includes(src.split('?')[0])))return res();const s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=()=>rej(new Error('Failed to load '+src));document.body.appendChild(s)})}
function ensureToolsCard(){
 if($('optionalToolsCard'))return;
 const loadCard=$('loadCard'); if(!loadCard)return;
 const card=document.createElement('div'); card.id='optionalToolsCard'; card.className='card';
 card.innerHTML='<label>Optional Creative Studio tools</label><div class="help">The core prompt generator is ready and stays lightweight. Load heavier Creative Studio, Deep Vision and Photo Forensics tools only when you need them.</div><div class="actions"><button id="loadCreativeTools" class="primary">Load Creative Studio Tools</button><span id="optionalToolsStatus" class="status"></span></div>';
 loadCard.insertAdjacentElement('afterend',card);
 $('loadCreativeTools').onclick=async()=>{
   const btn=$('loadCreativeTools'),st=$('optionalToolsStatus'); btn.disabled=true; btn.textContent='Loading tools…'; st.textContent='';
   try{
     await load('creative-studio-v90.js?v=20260904-v101');
     await load('deep-vision-v91.js?v=20260904-v101');
     await load('photo-forensics-v92.js?v=20260904-v101');
     st.textContent='Creative Studio tools loaded.'; btn.textContent='Creative Studio Loaded';
   }catch(e){st.textContent='Optional tool load failed: '+e.message;btn.disabled=false;btn.textContent='Retry Creative Studio Tools';}
   setVersion();
 };
}
function unlockUI(){
 document.documentElement.style.pointerEvents='auto';document.body.style.pointerEvents='auto';
 for(const el of document.querySelectorAll('input,select,textarea,button')){
   if(el.id==='search'||el.id==='source'||el.id==='stageFilter') continue;
   el.style.pointerEvents='auto';
 }
 const loading=$('loading'); if(loading&&loading.hidden){loading.style.display='none';loading.style.pointerEvents='none';}
}
function boot(){setVersion();ensureToolsCard();unlockUI();setTimeout(unlockUI,500);setTimeout(unlockUI,2000);}
function wait(){if(window.__UPC_CORE_READY__)return boot();document.addEventListener('upc:core-ready',boot,{once:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})();