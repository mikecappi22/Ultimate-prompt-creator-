(function(){
'use strict';
let loaded=false;
function ready(){
  const loadedEl=document.getElementById('loaded');
  const search=document.getElementById('search');
  const dbReady=!!(loadedEl && !loadedEl.hidden && search && !search.disabled);
  return dbReady;
}
function loadV92(){
  if(loaded || document.querySelector('script[data-v921-photo-forensics]')) return;
  loaded=true;
  const s=document.createElement('script');
  s.src='photo-forensics-v92.js?v=20260904-v921';
  s.async=true;
  s.dataset.v921PhotoForensics='1';
  s.onload=()=>{
    document.title='Ultimate Prompt Creator V9.2.1 Safe Load';
    const badge=document.querySelector('.badge');
    if(badge && /V9/i.test(badge.textContent||'')) badge.textContent='V9.2.1 SAFE LOAD';
  };
  s.onerror=()=>{console.warn('V9.2 Photo Forensics failed to load; core generator remains available.');};
  document.body.appendChild(s);
}
function check(){ if(ready()) loadV92(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',check,{once:true}); else check();
const obs=new MutationObserver(check);
obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','disabled']});
const timer=setInterval(()=>{
  check();
  if(loaded){ clearInterval(timer); obs.disconnect(); }
},500);
setTimeout(()=>{ if(!loaded){ clearInterval(timer); obs.disconnect(); console.warn('V9.2 Photo Forensics was deferred because the core database did not become ready.'); } },120000);
})();
