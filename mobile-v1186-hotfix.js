/* Ultimate Prompt Creator V11.8.6 bridge transport hotfix */
(function(){
'use strict';
document.title='Ultimate Prompt Creator V11.8.6 Permanent Mobile';
const badge=document.querySelector('.badge');if(badge)badge.textContent='V11.8.6 PERMANENT MOBILE';
const btn=document.getElementById('selftest1184');if(btn)btn.textContent='Run V11.8.6 Full Self-Test';
async function addBridgeInfo(){
  try{
    const r=await fetch('/bridge-info',{cache:'no-store'});if(!r.ok)return;
    const j=await r.json();
    const m=document.getElementById('models');
    if(m && !m.dataset.bridge86){m.dataset.bridge86='1';m.textContent=(m.textContent?m.textContent+' · ':'')+'Bridge '+(j.version||'')+' '+(j.transport||'');}
  }catch(_){ }
}
addBridgeInfo();
})();
