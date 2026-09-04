(function(){
'use strict';
if(window.__UPC_MOBILE_BRIDGE_V117__) return;
window.__UPC_MOBILE_BRIDGE_V117__=true;

const IS_MOBILE=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (window.matchMedia&&window.matchMedia('(max-width: 760px)').matches);
const STORAGE_KEY='upc_mobile_ollama_endpoint_v117';
const $=id=>document.getElementById(id);

function savedEndpoint(){
  try{return (localStorage.getItem(STORAGE_KEY)||'').trim().replace(/\/$/,'')}catch(_){return ''}
}
function saveEndpoint(v){
  try{localStorage.setItem(STORAGE_KEY,String(v||'').trim().replace(/\/$/,''))}catch(_){ }
}
function goodRemoteEndpoint(v){
  v=String(v||'').trim();
  return /^https:\/\//i.test(v) || /^http:\/\/(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(v);
}
function isLoopback(v){return /\/\/(?:127\.0\.0\.1|localhost)(?::|\/|$)/i.test(String(v||''));}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function applyEndpoint(){
  const ep=savedEndpoint();
  const input=$('aiRoastEndpoint');
  if(input && ep){ input.value=ep; input.dispatchEvent(new Event('change',{bubbles:true})); }
  if(input){
    input.addEventListener('change',()=>{ if(goodRemoteEndpoint(input.value)) saveEndpoint(input.value); });
    input.addEventListener('blur',()=>{ if(goodRemoteEndpoint(input.value)) saveEndpoint(input.value); });
  }
  const prof=$('aiRoastPerformance');
  if(prof){
    try{const p=localStorage.getItem('upc_mobile_director_profile_v117');if(p){prof.value=p;prof.dispatchEvent(new Event('change',{bubbles:true}))}}catch(_){ }
  }
}

function installMobileBanner(){
  if(!IS_MOBILE || $('upcMobileBanner')) return;
  const ep=savedEndpoint();
  const anchor=$('studioLite') || document.querySelector('.wrap')?.firstElementChild || document.body.firstElementChild;
  if(!anchor) return;
  const card=document.createElement('div');
  card.id='upcMobileBanner';
  card.className='card';
  card.style.cssText='border:1px solid #bfdbfe;background:#eff6ff;border-radius:18px;padding:12px;margin:10px 0;';
  card.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><b>📱 Mobile Ollama Connection</b><div class="help" style="margin-top:3px">${ep?`Saved endpoint: <code>${escapeHtml(ep)}</code>`:'Your iPhone cannot use 127.0.0.1 because Ollama is running on your PC.'}</div></div><a href="mobile-v117.html" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;border-radius:999px;padding:9px 13px;font-weight:800;font-size:12px">${ep?'Manage Connection':'Set Up Mobile'}</a></div>`;
  anchor.parentNode.insertBefore(card,anchor);
}

function overrideVisionButton(){
  if(!IS_MOBILE) return;
  const b=$('slOpenVision');
  if(b){ b.onclick=()=>window.open('vision-mobile-v117.html','_blank'); }
}

function guardLocalhost(){
  if(!IS_MOBILE) return;
  document.addEventListener('click',e=>{
    const t=e.target?.closest?.('#aiRoastRun,#aiRoastConnect');
    if(!t) return;
    const input=$('aiRoastEndpoint');
    const ep=(input?.value||savedEndpoint()||'').trim();
    if(!ep || isLoopback(ep)){
      e.preventDefault();e.stopImmediatePropagation();
      location.href='mobile-v117.html?return=prompt';
    }
  },true);
}

function watch(){
  applyEndpoint(); installMobileBanner(); overrideVisionButton();
  const obs=new MutationObserver(()=>{ applyEndpoint(); installMobileBanner(); overrideVisionButton(); });
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>obs.disconnect(),120000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{watch();guardLocalhost()});else{watch();guardLocalhost()}
})();
