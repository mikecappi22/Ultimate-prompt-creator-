(function(){
'use strict';
const VERSION='V11.0 STABLE STUDIO';
function setVersion(){const b=document.querySelector('.badge');if(b)b.textContent=VERSION;document.title='Ultimate Prompt Creator V11 Stable Studio';}
function load(src){return new Promise((res,rej)=>{if([...document.scripts].some(s=>s.src.includes(src.split('?')[0])))return res();const s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=()=>rej(new Error('Failed to load '+src));document.body.appendChild(s)})}
async function boot(){setVersion();try{await load('studio-lite-v110.js?v=20260904-v110')}catch(e){console.warn(e);const loadCard=document.getElementById('loadCard');if(loadCard)loadCard.insertAdjacentHTML('afterend',`<div class="card"><strong>Creative Studio Lite could not load.</strong><div class="help">${String(e.message||e)}</div></div>`)}setVersion();}
function wait(){if(window.__UPC_CORE_READY__)boot();else document.addEventListener('upc:core-ready',boot,{once:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})();