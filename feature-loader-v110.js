(function(){
'use strict';
const VERSION='V11.2 EXTREME VISION';
let lastTransferTs=0;
function setVersion(){const b=document.querySelector('.badge');if(b)b.textContent=VERSION;document.title='Ultimate Prompt Creator V11.2 Extreme Vision';}
function load(src){return new Promise((res,rej)=>{if([...document.scripts].some(s=>s.src.includes(src.split('?')[0])))return res();const s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=()=>rej(new Error('Failed to load '+src));document.body.appendChild(s)})}
function appendVisionTransfer(payload){
  if(!payload||payload.type!=='append-to-prompt'||!payload.text)return;
  if(payload.ts&&payload.ts<=lastTransferTs)return;
  if(payload.ts)lastTransferTs=payload.ts;
  const p=document.getElementById('prompt');if(!p)return;
  const add=String(payload.text).trim();if(!add)return;
  const base=String(p.value||'').replace(/\s+$/,'');
  p.value=base?base+', '+add:add;
  p.dispatchEvent(new Event('input',{bubbles:true}));
  if(typeof window.showStatus==='function')window.showStatus('Extreme Vision keywords added to the live prompt.');
}
function installVisionReturnChannel(){
  try{if('BroadcastChannel'in window){const bc=new BroadcastChannel('upc-vision-lab');bc.onmessage=e=>appendVisionTransfer(e.data);window.__UPC_VISION_CHANNEL__=bc}}catch(e){console.warn('Vision BroadcastChannel unavailable',e)}
  window.addEventListener('storage',e=>{if(e.key==='upc_vision_transfer_v112'&&e.newValue){try{appendVisionTransfer(JSON.parse(e.newValue))}catch(_){}}});
}
async function boot(){
  setVersion();installVisionReturnChannel();
  try{
    await load('studio-lite-v110.js?v=20260904-v112');
    await load('photo-forensics-describer-v111.js?v=20260904-v112');
  }catch(e){
    console.warn(e);
    const loadCard=document.getElementById('loadCard');
    if(loadCard)loadCard.insertAdjacentHTML('afterend',`<div class="card"><strong>Creative Studio / Detailed Forensics could not load.</strong><div class="help">${String(e.message||e)}</div></div>`);
  }
  setVersion();
}
function wait(){if(window.__UPC_CORE_READY__)boot();else document.addEventListener('upc:core-ready',boot,{once:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})();
