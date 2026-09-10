(function(){
'use strict';
const VERSION='V14.2 SUBJECT VAULT';
function setVersion(){
  const b=document.querySelector('.badge');if(b)b.textContent=VERSION;
  document.title='Ultimate Prompt Creator V14.2 Subject Vault';
  const cards=[...document.querySelectorAll('.wrap > .card')];
  const info=cards.find(c=>/Stable worker|Creative Studio|heavy|Text-only platform|Subject Vault/i.test(c.textContent||''));
  if(info)info.innerHTML='<strong>Subject Vault + text-only platform active.</strong> Bundled subjects load automatically. Subject profiles, continuity rules, Creative Director, and Prompt workspace remain active. Reference images stay in your normal photo library instead of browser storage.';
}
function load(src){return new Promise((res,rej)=>{if([...document.scripts].some(s=>s.src.includes(src.split('?')[0])))return res();const s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=()=>rej(new Error('Failed to load '+src));document.body.appendChild(s)})}
function ensureDirectorHost(){
  if(document.getElementById('sl-roast'))return;
  const card=document.createElement('div');card.className='card';card.id='textDirectorCard';card.innerHTML='<div id="sl-roast"></div>';
  const anchor=document.getElementById('promptCard')||document.querySelector('.wrap')?.lastElementChild;
  if(anchor?.parentNode)anchor.parentNode.insertBefore(card,anchor);else document.querySelector('.wrap')?.appendChild(card);
}
async function boot(){
  setVersion();ensureDirectorHost();
  try{
    await load('subject-defaults-v134.js?v=20260910-v134');
    await load('subject-vault-v142.js?v=20260910-v142');
    await load('subject-profile-paste-v142.js?v=20260910-v142');
    await load('text-director-v130.js?v=20260909-v130');
    await load('mobile-bridge-v117.js?v=20260909-v130');
  }catch(e){
    console.warn(e);
    const host=document.getElementById('sl-roast');
    if(host)host.innerHTML='<div class="help">Platform feature could not load: '+String(e.message||e)+'</div>';
  }
  setVersion();
}
function wait(){if(window.__UPC_CORE_READY__)boot();else document.addEventListener('upc:core-ready',boot,{once:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})();
