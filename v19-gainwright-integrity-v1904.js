/* Gainwright Visual Studio V19.0.4 - End-to-End Integrity Guard */
(function(g){
'use strict';
if(g.__GAINWRIGHT_INTEGRITY_V1904__)return;
g.__GAINWRIGHT_INTEGRITY_V1904__=1;

var VERSION='19.0.4';
var SOURCE_KEY='gainwright_core_v1904_field_sources';
var ANALYSIS_KEY='gainwright_core_v1904_last_analysis_idea';
var sources={};
var suppress=false;
var core=null;

function $(id){return document.getElementById(id)}
function read(k,d){try{var x=JSON.parse(localStorage.getItem(k)||'null');return x==null?d:x}catch(e){return d}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function norm(s){return String(s||'').toLowerCase().replace(/[\s,;:.\-–—_/]+/g,' ').trim()}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function val(id){var e=$(id);return e?String(e.value||'').trim():''}
function setStatus(msg,type){var e=$('g19-master-status');if(!e)return;e.textContent=msg||'';e.setAttribute('data-type',type||'')}
function fieldInputs(){return Array.prototype.slice.call(document.querySelectorAll('#gvs-v19-core [data-field]'))}
function fieldName(input){return input&&input.getAttribute('data-field')}
function included(field){
 var c=document.querySelector('#gvs-v19-core [data-inc="'+field+'"]');return !c||c.checked;
}
function saveSources(){write(SOURCE_KEY,sources)}
function hash(s){s=String(s||'');var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)}return (h>>>0).toString(16)}
function currentStructured(){return val('g19-structured')}
function updateBadge(){
 var host=document.querySelector('#gvs-v19-core .g19-badges');
 if(!host||$('g19-integrity-badge'))return;
 var b=document.createElement('span');b.id='g19-integrity-badge';b.className='g19-badge ok';b.textContent='Integrity Guard: ON';host.appendChild(b);
}
function markVisibleSources(){
 fieldInputs().forEach(function(i){var f=fieldName(i);if(!f)return;if(!sources[f])sources[f]=i.value.trim()?'legacy':'empty'});
 saveSources();paintSources();
}
function paintSources(){
 fieldInputs().forEach(function(i){
  var f=fieldName(i),row=i.closest('.g19-row'),src=row&&row.querySelector('.g19-source');if(!f||!src)return;
  var s=sources[f]||'empty';
  if(i.value.trim())src.textContent=(s==='manual'?'Manual decision':s==='database'?'V18 database decision':s==='ai'?'AI suggestion':s==='legacy'?'Legacy decision — reanalyze to refresh':'Custom decision');
 });
}
function setMaster(text,status){
 var m=$('g19-master');if(!m)return;suppress=true;m.value=String(text||'');m.dispatchEvent(new Event('input',{bubbles:true}));suppress=false;
 if(status)setStatus(status,text?'ok':'warn');
}
function invalidateMaster(reason){
 var m=$('g19-master');if(!m||!m.value.trim())return;
 setMaster('',reason||'Source changed. Previous Gainwright Master was cleared; refine again.');
 localStorage.removeItem('gainwright_core_v1904_master_source_hash');
}
function sourceChanged(){
 if(suppress)return;setTimeout(function(){if(!suppress)invalidateMaster('Source changed. Previous Gainwright Master was cleared; refine again.')},0);
}
function ideaChangedSignificantly(){
 var last=String(localStorage.getItem(ANALYSIS_KEY)||''),idea=val('g19-idea');
 return !!last&&norm(last)!==norm(idea);
}
function clearReplaceableDecisions(){
 suppress=true;
 fieldInputs().forEach(function(i){
  var f=fieldName(i),s=sources[f]||'legacy';
  if(s==='manual'||s==='database')return;
  if(i.value){
   i.value='';
   i.dispatchEvent(new Event('input',{bubbles:true}));
   i.dispatchEvent(new Event('change',{bubbles:true}));
  }
  sources[f]='empty';
 });
 suppress=false;saveSources();paintSources();
}
async function guardedAnalyze(){
 if(!core||typeof core.analyzeIdea!=='function')return;
 var idea=val('g19-idea');if(!idea)return core.analyzeIdea();
 invalidateMaster('Idea analysis started. Previous Gainwright Master was cleared.');
 clearReplaceableDecisions();
 var before={};fieldInputs().forEach(function(i){before[fieldName(i)]=i.value});
 await core.analyzeIdea();
 fieldInputs().forEach(function(i){
  var f=fieldName(i),after=i.value.trim();
  if(!after){if(!sources[f])sources[f]='empty';return}
  if(sources[f]!=='manual'&&sources[f]!=='database'){
   if(after!==String(before[f]||'').trim())sources[f]='ai';
  }
 });
 localStorage.setItem(ANALYSIS_KEY,idea);saveSources();paintSources();
 setTimeout(function(){invalidateMaster('Visual decisions were refreshed. Refine the Gainwright Master from the new source.')},0);
}
function acceptedFacts(){
 var facts=[],idea=val('g19-idea');if(idea)facts.push({label:'CORE IDEA',text:idea});
 fieldInputs().forEach(function(i){var f=fieldName(i);if(included(f)&&i.value.trim())facts.push({label:f.toUpperCase(),text:i.value.trim()})});
 var notes=val('g19-refnotes');if(notes)facts.push({label:'REFERENCE NOTES',text:notes});
 return facts;
}
function masterPreserves(master,facts){
 var m=norm(master),missing=[];
 facts.forEach(function(f){var n=norm(f.text);if(n&&m.indexOf(n)<0)missing.push(f)});
 return{pass:missing.length===0,missing:missing};
}
async function models(){
 var r=await fetch('/ollama/api/tags',{cache:'no-store'});if(!r.ok)throw Error('Ollama tags HTTP '+r.status);
 var j=await r.json(),names=(j.models||[]).map(function(x){return x.name||x.model}).filter(Boolean);
 return names.indexOf('qwen3:1.7b')>=0?'qwen3:1.7b':names.find(function(n){return /^qwen3:/i.test(n)})||names[0]||'';
}
async function chat(model,prompt,temp){
 var r=await fetch('/ollama/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:model,messages:[{role:'user',content:prompt}],stream:false,think:false,keep_alive:'30m',options:{num_predict:2600,num_ctx:6144,temperature:temp}})});
 var t=await r.text();if(!r.ok)throw Error('Ollama chat HTTP '+r.status+' '+t.slice(0,180));var j=t?JSON.parse(t):{};return String(j.message&&j.message.content||'').trim();
}
function refinementPrompt(structured,facts,retry){
 var locks=facts.map(function(f,i){return 'LOCKED FACT '+(i+1)+' ['+f.label+']: '+f.text}).join('\n');
 return[
  'You are Gainwright Visual Studio Guarded Master Composer.',
  'Write one polished, copy/paste-ready image/video prompt.',
  'ABSOLUTE RULE: every LOCKED FACT below must appear VERBATIM in your output. Do not paraphrase, shorten, replace, contradict, or omit any locked fact.',
  'You may add connective photographic language around those facts, but do not add identity facts, body measurements, tattoos, piercings, people, objects, logos, readable text, biography, location changes, wardrobe changes, or action changes.',
  'Keep constraints intact. Preserve target and aspect ratio.',
  retry?'A previous attempt failed the fact-preservation check. Be literal and conservative.':'',
  '',
  locks,
  '',
  'STRUCTURED SOURCE:',
  structured,
  '',
  'OUTPUT THE PROMPT ONLY.'
 ].filter(Boolean).join('\n');
}
async function guardedRefine(){
 if(!core||typeof core.build!=='function')return;
 var structured=core.build(true)||currentStructured();if(!String(structured||'').trim()){setStatus('Build a structured source first.','warn');return}
 invalidateMaster();
 var facts=acceptedFacts(),model='';
 try{model=await models()}catch(e){setMaster(structured,'Local AI unavailable; Structured Source was kept as the safe Master.');return}
 if(!model){setMaster(structured,'No local AI model found; Structured Source was kept as the safe Master.');return}
 var btn=$('g19-refine');if(btn)btn.disabled=true;setStatus('Guarded refinement running with '+model+'...','');
 try{
  var out=await chat(model,refinementPrompt(structured,facts,false),.18);
  var check=masterPreserves(out,facts);
  if(!check.pass){
   setStatus('First refinement drifted from '+check.missing.length+' locked fact(s); retrying conservatively...','warn');
   out=await chat(model,refinementPrompt(structured,facts,true),0);
   check=masterPreserves(out,facts);
  }
  if(!check.pass){
   var names=check.missing.slice(0,4).map(function(f){return f.label}).join(', ');
   setMaster(structured,'Integrity Guard blocked AI drift ('+names+'). Structured Source was promoted as the safe Master.');
  }else{
   setMaster(out,'Gainwright Master verified: all '+facts.length+' accepted fact(s) preserved.');
   localStorage.setItem('gainwright_core_v1904_master_source_hash',hash(structured));
  }
 }catch(e){setMaster(structured,'Refinement failed; Structured Source was promoted as the safe Master. '+e.message)}
 finally{if(btn)btn.disabled=false}
}
function bind(){
 core=g.GainwrightCoreV19;if(!core||!$('gvs-v19-core'))return false;
 sources=read(SOURCE_KEY,{})||{};markVisibleSources();updateBadge();

 var panel=$('gvs-v19-core');
 if(!panel.getAttribute('data-g1904-bound')){
  panel.setAttribute('data-g1904-bound','1');
  panel.addEventListener('input',function(e){
   if(suppress)return;
   var f=e.target&&e.target.getAttribute&&e.target.getAttribute('data-field');
   if(f&&e.isTrusted){sources[f]='manual';saveSources();paintSources()}
   if(e.target&&e.target.id!=='g19-master'&&e.target.id!=='g19-structured')sourceChanged();
  });
  panel.addEventListener('change',function(e){
   if(suppress)return;
   var id=e.target&&e.target.id||'';
   if(id==='g19-target'||id==='g19-aspect'||id==='g19-reflock'||id==='g19-refnotes')sourceChanged();
  });
  panel.addEventListener('click',function(e){
   var p=e.target&&e.target.closest&&e.target.closest('[data-pick]');
   if(p){setTimeout(function(){var row=p.closest('.g19-row'),i=row&&row.querySelector('[data-field]'),f=fieldName(i);if(f){sources[f]='database';saveSources();paintSources();sourceChanged()}},0)}
  });
 }

 var a=$('g19-analyze');if(a&&!a.getAttribute('data-g1904')){a.setAttribute('data-g1904','1');a.onclick=guardedAnalyze}
 var r=$('g19-refine');if(r&&!r.getAttribute('data-g1904')){r.setAttribute('data-g1904','1');r.onclick=guardedRefine}

 var m=$('g19-master');
 if(m&&m.value.trim()&&!localStorage.getItem('gainwright_core_v1904_master_source_hash')){
  setMaster('','Integrity Guard cleared an unverified older Master. Refine it again from the current Structured Source.');
 }
 if(ideaChangedSignificantly())setStatus('Idea changed since the last analysis. Click Analyze / Suggest Decisions to refresh AI-generated decisions.','warn');

 g.GainwrightIntegrityV1904={version:VERSION,analyze:guardedAnalyze,refine:guardedRefine,sources:function(){return Object.assign({},sources)},acceptedFacts:acceptedFacts,verify:masterPreserves};
 console.log('[Gainwright V19.0.4 Integrity Guard] active');
 return true;
}
function boot(){if(!bind())setTimeout(boot,600)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,3400)});else setTimeout(boot,3400);
})(window);