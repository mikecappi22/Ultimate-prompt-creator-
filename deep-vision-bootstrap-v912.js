(function(){
'use strict';
if(window.__DV912_BOOTSTRAP__)return;
window.__DV912_BOOTSTRAP__=true;
let loading=false;
function setTopBadge(){
 const badge=document.querySelector('.badge');
 if(badge&&badge.textContent!=='V9.1 DEEP VISION')badge.textContent='V9.1 DEEP VISION';
}
function tryInit(){
 setTopBadge();
 const btn=document.getElementById('csLocalVision');
 if(!btn)return false;
 if(btn.textContent.trim()==='Deep Local Vision'&&document.getElementById('dv91Progress'))return true;
 if(loading)return true;
 loading=true;
 btn.textContent='Initializing Deep Local Vision…';
 btn.disabled=true;
 const script=document.createElement('script');
 script.src='deep-vision-v91.js?v=20260904-v912-runtime';
 script.onload=()=>{
   setTimeout(()=>{
     const b=document.getElementById('csLocalVision');
     if(b){b.disabled=false;if(b.textContent.includes('Initializing'))b.textContent='Deep Local Vision';}
     setTopBadge();
     const status=document.getElementById('csPhotoStatus');
     if(!document.getElementById('dv91Progress')&&status){
       status.textContent='Deep Vision module loaded, but the Photo Forensics controls did not initialize. Reload the page once.';
     }
   },250);
 };
 script.onerror=()=>{
   loading=false;
   const b=document.getElementById('csLocalVision');
   if(b){b.disabled=false;b.textContent='Retry Deep Local Vision';}
   const status=document.getElementById('csPhotoStatus');
   if(status)status.textContent='Deep Vision failed to load. Check the connection and retry.';
 };
 document.body.appendChild(script);
 return true;
}
if(!tryInit()){
 const observer=new MutationObserver(()=>{
   if(tryInit())observer.disconnect();
 });
 observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('load',()=>tryInit(),{once:true});
}
})();
