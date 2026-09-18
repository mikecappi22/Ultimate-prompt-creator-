/* Gainwright Visual Studio V19.0.6 - Variation Identity Isolation */
(function(g){
'use strict';
if(g.__GAINWRIGHT_VARIATION_IDENTITY_V1906__)return;
g.__GAINWRIGHT_VARIATION_IDENTITY_V1906__=1;

var VERSION='19.0.6';
var wrapped=false;

function $(id){return document.getElementById(id)}
function readJSON(k,d){try{var x=JSON.parse(localStorage.getItem(k)||'null');return x==null?d:x}catch(e){return d}}
function subjectNames(){
 var a=readJSON('upc_subject_vault_v131',[]);if(!Array.isArray(a))return[];
 return a.map(function(x){return String(x&&x.name||'').trim()}).filter(Boolean);
}
function containsLegacySubject(text){
 var t=String(text||'').toLowerCase();
 return subjectNames().some(function(n){return n&&t.indexOf(n.toLowerCase())>=0});
}
function genericReferenceLock(){
 var v=g.UPCV1822Variations;
 var d=v&&v.defaultIdentityLock?String(v.defaultIdentityLock).trim():'';
 if(d&&!containsLegacySubject(d))return d;
 return '[REFERENCE IDENTITY LOCK]\nUse only the current uploaded/reference image as the identity source. Preserve the visible face, apparent adult age, facial geometry, eye appearance, hair identity, skin tone, natural asymmetry, visible body composition and distinguishing features shown in the reference. Do not use any legacy Subject Vault identity or named saved subject. Do not invent unseen traits.';
}
function noLegacyLock(){
 return '[GAINWRIGHT CORE IDENTITY SCOPE]\nNo named legacy Subject Vault identity is active for this creation. Do not use Addison or any other saved Subject Vault profile. Preserve only identity information explicitly present in the current Gainwright Core idea, accepted decisions, or a current uploaded reference image.';
}
function currentLock(){
 var useRef=$('g19-reflock');
 if(useRef&&useRef.checked){
  var hidden=$('uc_subject_lock'),t=hidden?String(hidden.value||'').trim():'';
  if(!t||containsLegacySubject(t))return genericReferenceLock();
  return t;
 }
 return noLegacyLock();
}
function mark(){
 var host=document.querySelector('#gvs-v19-core .g19-badges');
 if(!host||$('g19-var-id-badge'))return;
 var b=document.createElement('span');b.id='g19-var-id-badge';b.className='g19-badge ok';b.textContent='Variation Identity: Isolated';host.appendChild(b);
}
function wrap(){
 if(wrapped)return true;
 var api=g.UPCV1822Variations;
 if(!api||typeof api.generate!=='function')return false;
 var original=api.generate;
 api.generate=function(opts){
  var lock=$('uc_subject_lock'),made=false;
  if(!lock){lock=document.createElement('textarea');lock.id='uc_subject_lock';lock.style.display='none';document.body.appendChild(lock);made=true}
  var old=lock.value;
  lock.value=currentLock();
  lock.dispatchEvent(new Event('input',{bubbles:true}));
  try{
   var rows=original.call(api,opts);
   (rows||[]).forEach(function(v){
    if(v&&v.prompt&&containsLegacySubject(v.prompt)){
      v.prompt=String(v.prompt).replace(/\bAddison\b/gi,'the current Gainwright subject');
    }
   });
   return rows;
  }finally{
   lock.value=old;
   if(made&&!old)lock.remove();
  }
 };
 wrapped=true;
 mark();
 g.GainwrightVariationIdentityV1906={version:VERSION,currentLock:currentLock,containsLegacySubject:containsLegacySubject};
 console.log('[Gainwright V19.0.6 Variation Identity Isolation] active');
 return true;
}
function boot(){if(!wrap())setTimeout(boot,500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,4700)});else setTimeout(boot,4700);
})(window);