/* UPC V16.4 finalizer: preserve master vocabulary badge and one-step-at-a-time Create flow */
(function(g){'use strict';if(g.__UPC_V164_FINALIZE__)return;g.__UPC_V164_FINALIZE__=1;
function currentStep(){const t=document.getElementById('uc161step')?.textContent||'';const m=t.match(/Step\s+(\d+)\s+of\s+8/i);return m?Math.max(0,Math.min(7,Number(m[1])-1)):0}
function numberedCards(){const root=document.getElementById('panel-create');if(!root)return[];const cards=[...root.querySelectorAll('.uc160-card')];return Array.from({length:8},(_,i)=>cards.find(c=>{const h=c.querySelector('h2,h3');return h&&String(h.textContent||'').trim().startsWith((i+1)+'.')})).filter(Boolean)}
function apply(){const vocab=g.UPCMasterVocabulary164,cat=g.UPCCatalogV163;if(vocab&&cat){const badge=document.querySelector('.brand .version');if(badge)badge.textContent='V16.4 MASTER VOCABULARY';document.title='Ultimate Prompt Creator V16.4';}
 const cards=numberedCards();if(cards.length){const s=currentStep();cards.forEach((c,i)=>c.classList.toggle('uc161-hide',i!==s));}
}
setInterval(apply,300);document.addEventListener('click',()=>setTimeout(apply,30),true);document.addEventListener('input',()=>setTimeout(apply,30),true);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})(window);