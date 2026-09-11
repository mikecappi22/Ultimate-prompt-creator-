/* UPC V15.2 Mobile Polish + Director Proxy Fix */
(function(g){'use strict';if(g.__UPC_MOBILE152__)return;g.__UPC_MOBILE152__=1;
function css(){if(document.getElementById('v152style'))return;const s=document.createElement('style');s.id='v152style';s.textContent=`
@supports(padding:max(0px)){
 @media(max-width:700px){
  body{padding-top:max(0px,env(safe-area-inset-top));padding-bottom:max(110px,calc(90px + env(safe-area-inset-bottom)))}
  .guide-fab{right:12px!important;bottom:max(96px,calc(82px + env(safe-area-inset-bottom)))!important;padding:9px 12px!important;font-size:14px!important;min-height:42px!important;box-shadow:0 4px 14px rgba(15,23,42,.22)!important}
 }
}
`;document.head.appendChild(s)}
function proxyUrl(){return location.origin.replace(/\/$/,'')+'/ollama'}
function fixDirector(){const ep=document.getElementById('aiRoastEndpoint');if(ep){ep.value=proxyUrl();ep.readOnly=true;ep.title='Automatically routed through the private UPC bridge';const lab=ep.closest('div')?.querySelector('label');if(lab)lab.textContent='Ollama route (private bridge)';}
 const st=document.getElementById('aiRoastStatus');if(st&&/load failed/i.test(st.textContent||''))st.textContent='Director route repaired. Tap Check Ollama, then Roast + Rebuild.';
}
function addGuideNav(){const fab=document.querySelector('.guide-fab');if(!fab)return;fab.setAttribute('aria-label','Open platform guide');fab.textContent='? Guide';}
function observe(){css();fixDirector();addGuideNav();const mo=new MutationObserver(()=>{fixDirector();addGuideNav()});mo.observe(document.body,{childList:true,subtree:true});g.addEventListener('pageshow',()=>{fixDirector();addGuideNav()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe);else observe();
})(window);