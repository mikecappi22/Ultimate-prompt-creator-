(function(){
'use strict';
const LABEL='V9.3 FAST DATABASE';
function apply(){
  document.title='Ultimate Prompt Creator V9.3 Fast Database';
  const badge=document.querySelector('.badge');
  if(badge) badge.textContent=LABEL;
  const sub=document.querySelector('.sub');
  if(sub && !sub.textContent.includes('fast compressed database')) sub.textContent += ' · fast compressed database';
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
const obs=new MutationObserver(()=>apply());
obs.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
setTimeout(()=>obs.disconnect(),30000);
})();
