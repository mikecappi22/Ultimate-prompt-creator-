(function(){
'use strict';
const VERSION='V10.0 STABLE WORKER';
function setVersion(){const b=document.querySelector('.badge');if(b)b.textContent=VERSION;document.title='Ultimate Prompt Creator V10 Stable Worker';}
function load(src){return new Promise((res,rej)=>{if([...document.scripts].some(s=>s.src.includes(src.split('?')[0])))return res();const s=document.createElement('script');s.src=src;s.defer=true;s.onload=res;s.onerror=()=>rej(new Error('Failed to load '+src));document.body.appendChild(s)})}
async function boot(){
 setVersion();
 try{
   await load('creative-studio-v90.js?v=20260904-v100');setVersion();
   await new Promise(r=>setTimeout(r,50));
   await load('deep-vision-v91.js?v=20260904-v100');setVersion();
   await new Promise(r=>setTimeout(r,50));
   await load('photo-forensics-v92.js?v=20260904-v100');setVersion();
 }catch(e){console.warn('Optional Creative Studio feature load:',e);}
 setVersion();setTimeout(setVersion,1000);setTimeout(setVersion,5000);
}
function wait(){if(window.__UPC_CORE_READY__)return boot();document.addEventListener('upc:core-ready',boot,{once:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})();
