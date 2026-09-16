/* UPC V18.25.1 PRODUCTION AUDIT FEEDBACK PATCH */
(function(g){'use strict';if(g.__UPC_V18251_AUDIT_FEEDBACK__)return;g.__UPC_V18251_AUDIT_FEEDBACK__=1;
const VERSION='18.25.1';
const $=id=>document.getElementById(id);
function esc(s){return String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m))}
function localTime(){try{return new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'})}catch(_){return new Date().toLocaleTimeString()}}
function makeFeedback(){
 const host=$('v1825_release_lock');if(!host)return null;
 let box=$('v18251_feedback');if(box)return box;
 box=document.createElement('div');box.id='v18251_feedback';box.hidden=true;
 const actions=host.querySelector('.v1825-actions');if(actions)actions.insertAdjacentElement('afterend',box);else host.prepend(box);
 const style=document.createElement('style');style.id='v18251_style';style.textContent=`
 #v18251_feedback{margin:10px 0;padding:10px 12px;border-radius:10px;border:1px solid #cbd5e1;font:12px system-ui}
 #v18251_feedback.running{background:#eff6ff;color:#1e40af;border-color:#bfdbfe}
 #v18251_feedback.good{background:#dcfce7;color:#166534;border-color:#bbf7d0}
 #v18251_feedback.bad{background:#fee2e2;color:#991b1b;border-color:#fecaca}
 #v18251_feedback b{display:block;font-size:13px;margin-bottom:3px}#v18251_feedback small{display:block;margin-top:3px;line-height:1.4}
 #v18251_feedback .v18251-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;margin-top:8px}
 #v18251_feedback .v18251-grid span{background:#fff9;border-radius:8px;padding:6px 8px;font-weight:750}
 `;document.head.appendChild(style);return box;
}
function renderRunning(){const box=makeFeedback();if(!box)return;box.hidden=false;box.className='running';box.innerHTML='<b>RUNNING PRODUCTION AUDIT…</b><small>Checking required modules, database populations, search isolation, feature APIs, legacy search authority, and the V18.17 integration audit.</small>'}
function renderDone(r){const box=makeFeedback();if(!box)return;const requiredPass=(r.required||[]).filter(x=>x.present).length,requiredTotal=(r.required||[]).length;const fieldsPass=Object.values(r.counts?.fields||{}).filter(n=>Number(n)>0).length,fieldsTotal=Object.keys(r.counts?.fields||{}).length;const smokePass=(r.smoke||[]).filter(x=>x.pass).length,smokeTotal=(r.smoke||[]).length;const interfacesPass=(r.interfaces||[]).filter(x=>x.pass).length,interfacesTotal=(r.interfaces||[]).length;box.hidden=false;box.className=r.passed?'good':'bad';box.innerHTML=`<b>${r.passed?'✓ AUDIT COMPLETE':'⚠ AUDIT COMPLETE — ATTENTION NEEDED'} — ${esc(localTime())}</b><div class="v18251-grid"><span>${requiredPass}/${requiredTotal} required systems</span><span>${fieldsPass}/${fieldsTotal} databases populated</span><span>${smokePass}/${smokeTotal} isolation tests</span><span>${interfacesPass}/${interfacesTotal} feature APIs</span><span>${(r.legacy||[]).length===0?'✓ No legacy search engines':(r.legacy||[]).length+' legacy markers active'}</span><span>${Number(r.counts?.total||0).toLocaleString()} total records</span></div><small>${r.passed?'Production runtime checks passed. The frozen V18.25 snapshot remains unchanged.':'Failed sections were opened below. Review the red FAIL rows before treating this build as healthy.'}</small>`;
 if(!r.passed){for(const d of $('v1825_release_lock')?.querySelectorAll('details')||[])d.open=true;box.scrollIntoView({behavior:'smooth',block:'nearest'})}
 localStorage.setItem('upc_last_production_audit_feedback_v18251',JSON.stringify({at:new Date().toISOString(),passed:!!r.passed,requiredPass,requiredTotal,fieldsPass,fieldsTotal,smokePass,smokeTotal,interfacesPass,interfacesTotal,legacy:(r.legacy||[]).length,totalRecords:r.counts?.total||0}));
}
function patch(){
 const host=$('v1825_release_lock'),btn=$('v1825_audit');if(!host||!btn||typeof btn.onclick!=='function')return setTimeout(patch,300);
 if(btn.dataset.v18251Patched)return;
 btn.dataset.v18251Patched='1';makeFeedback();
 const old=btn.onclick;
 btn.onclick=async function(ev){
   const original=btn.textContent;renderRunning();btn.disabled=true;btn.textContent='Running Audit…';
   await new Promise(r=>setTimeout(r,90));
   let report=null;
   try{report=old.call(btn,ev)||g.UPCV1825ReleaseReport||g.UPCV1825Release?.runAudit?.();if(report)renderDone(report);else throw new Error('Audit did not return a report.')}catch(e){const box=makeFeedback();box.hidden=false;box.className='bad';box.innerHTML=`<b>⚠ AUDIT ERROR</b><small>${esc(e.message||e)}</small>`}finally{btn.disabled=false;btn.textContent=original}
 };
 const head=host.querySelector('.v1825-head>div');if(head&&!head.querySelector('.v18251-badge')){const badge=document.createElement('small');badge.className='v18251-badge';badge.textContent='Audit feedback patch V18.25.1 active';badge.style.cssText='color:#1d4ed8;font-weight:800;margin-top:4px';head.appendChild(badge)}
 g.UPCV18251AuditFeedback={version:VERSION,run:()=>btn.click(),renderDone};console.log('[UPC V18.25.1 Audit Feedback Patch] active');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(patch,2500));else setTimeout(patch,2500);
})(window);
