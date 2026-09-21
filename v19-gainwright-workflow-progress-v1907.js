/* Gainwright Visual Studio V19.0.7 - Workflow Progress Bars */
(function(g){
'use strict';
if(g.__GAINWRIGHT_WORKFLOW_PROGRESS_V1907__)return;
g.__GAINWRIGHT_WORKFLOW_PROGRESS_V1907__=1;

var VERSION='19.0.7';
var timers={};

function $(id){return document.getElementById(id)}
function addCss(){
 if($('g19-progress-style'))return;
 var s=document.createElement('style');s.id='g19-progress-style';
 s.textContent=[
  '.g19-progress{margin-top:9px;border:1px solid #3b3328;background:#0b0906;padding:9px 10px}',
  '.g19-progress-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:6px}',
  '.g19-progress-name{color:#d8cfc2;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}',
  '.g19-progress-pct{color:#efa52c;font-size:10px;font-weight:950;font-variant-numeric:tabular-nums}',
  '.g19-progress-track{height:7px;background:#272116;overflow:hidden}',
  '.g19-progress-fill{height:100%;width:0;background:linear-gradient(90deg,#9b6213,#efa52c);transition:width .28s ease}',
  '.g19-progress[data-state="done"] .g19-progress-fill{background:linear-gradient(90deg,#6b8e4b,#a9cf83)}',
  '.g19-progress[data-state="warn"] .g19-progress-fill{background:linear-gradient(90deg,#8f5f21,#e0a54c)}',
  '.g19-progress-stage{margin-top:6px;color:#81786c;font-size:9px;line-height:1.35}',
  '.g19-progress[data-state="done"] .g19-progress-stage{color:#9fbd86}',
  '.g19-progress[data-state="warn"] .g19-progress-stage{color:#d6aa67}'
 ].join('\n');
 document.head.appendChild(s);
}
function makeProgress(id,name,anchor){
 if($(id)||!anchor)return $(id);
 var box=document.createElement('div');box.id=id;box.className='g19-progress';box.setAttribute('data-state','idle');
 box.innerHTML='<div class="g19-progress-head"><span class="g19-progress-name">'+name+'</span><span class="g19-progress-pct">0%</span></div><div class="g19-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="g19-progress-fill"></div></div><div class="g19-progress-stage">Ready.</div>';
 anchor.insertAdjacentElement('afterend',box);return box;
}
function setProgress(id,pct,stage,state){
 var box=$(id);if(!box)return;
 pct=Math.max(0,Math.min(100,Math.round(Number(pct)||0)));
 box.querySelector('.g19-progress-pct').textContent=pct+'%';
 box.querySelector('.g19-progress-fill').style.width=pct+'%';
 box.querySelector('.g19-progress-stage').textContent=stage||'';
 var track=box.querySelector('.g19-progress-track');track.setAttribute('aria-valuenow',String(pct));
 box.setAttribute('data-state',state||'working');
}
function clearTimer(key){if(timers[key]){clearInterval(timers[key]);delete timers[key]}}
function timedStages(key,id,stages){
 clearTimer(key);var idx=0,start=Date.now();
 setProgress(id,stages[0].pct,stages[0].label,'working');
 timers[key]=setInterval(function(){
  var elapsed=Date.now()-start;
  while(idx+1<stages.length&&elapsed>=stages[idx+1].at){idx++;setProgress(id,stages[idx].pct,stages[idx].label,'working')}
 },180);
}
function statusWarn(text){
 return /\b(fail|failed|error|offline|unavailable|blocked|could not|no local text model|nothing to)\b/i.test(String(text||''));
}
async function runWrapped(btn,handler,id,key,stages,statusId,doneLabel){
 timedStages(key,id,stages);btn.disabled=true;
 try{
  var result=handler&&handler.call(btn);
  if(result&&typeof result.then==='function')await result;
  clearTimer(key);
  var status=statusId&&$(statusId)?$(statusId).textContent:'';
  var warn=statusWarn(status);
  setProgress(id,100,warn?(status||'Completed with a warning.'):(doneLabel||'Complete.'),warn?'warn':'done');
  return result;
 }catch(e){
  clearTimer(key);setProgress(id,100,'Completed with error: '+(e&&e.message?e.message:String(e)),'warn');throw e;
 }finally{btn.disabled=false}
}
function mount(){
 var panel=$('gvs-v19-core');if(!panel)return false;
 addCss();

 var analyze=$('g19-analyze');
 if(analyze){
  var actions=analyze.closest('.g19-actions');
  makeProgress('g19-progress-analyze','Analyze / Suggest Decisions',actions);
  if(!analyze.getAttribute('data-g1907')){
   var oldAnalyze=analyze.onclick;analyze.setAttribute('data-g1907','1');
   analyze.onclick=function(){
    return runWrapped(analyze,oldAnalyze,'g19-progress-analyze','analyze',[
     {at:0,pct:6,label:'Preparing current idea and clearing stale AI decisions...'},
     {at:450,pct:20,label:'Sending idea to local AI...'},
     {at:1400,pct:43,label:'Separating the idea into visual decisions...'},
     {at:3000,pct:66,label:'Validating categories and semantic routing...'},
     {at:5200,pct:86,label:'Rebuilding the structured decision state...'},
     {at:8500,pct:94,label:'Finishing analysis...'}
    ],'g19-ai-status','Analysis complete.');
   };
  }
 }

 var build=$('g19-build');
 if(build){
  var masterActions=build.closest('.g19-actions');
  makeProgress('g19-progress-build','Build / Refresh',masterActions);
  if(!build.getAttribute('data-g1907')){
   var oldBuild=build.onclick;build.setAttribute('data-g1907','1');
   build.onclick=async function(){
    setProgress('g19-progress-build',12,'Collecting accepted visual decisions...','working');build.disabled=true;
    try{
     await new Promise(function(r){setTimeout(r,90)});
     setProgress('g19-progress-build',42,'Assembling structured source...','working');
     var result=oldBuild&&oldBuild.call(build);
     if(result&&typeof result.then==='function')await result;
     setProgress('g19-progress-build',78,'Synchronizing model adaptation and QA...','working');
     await new Promise(function(r){setTimeout(r,180)});
     setProgress('g19-progress-build',100,'Structured Source refreshed.','done');
     return result;
    }catch(e){
     setProgress('g19-progress-build',100,'Build completed with error: '+(e&&e.message?e.message:String(e)),'warn');throw e;
    }finally{build.disabled=false}
   };
  }
 }

 var refine=$('g19-refine');
 if(refine){
  var ma=refine.closest('.g19-actions');
  if(!$('g19-progress-refine')){
   var b=$('g19-progress-build');
   var box=document.createElement('div');box.id='g19-progress-refine';box.className='g19-progress';box.setAttribute('data-state','idle');
   box.innerHTML='<div class="g19-progress-head"><span class="g19-progress-name">Refine with Local AI</span><span class="g19-progress-pct">0%</span></div><div class="g19-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="g19-progress-fill"></div></div><div class="g19-progress-stage">Ready.</div>';
   if(b)b.insertAdjacentElement('afterend',box);else ma.insertAdjacentElement('afterend',box);
  }
  if(!refine.getAttribute('data-g1907')){
   var oldRefine=refine.onclick;refine.setAttribute('data-g1907','1');
   refine.onclick=function(){
    return runWrapped(refine,oldRefine,'g19-progress-refine','refine',[
     {at:0,pct:5,label:'Preparing Structured Source and accepted fact locks...'},
     {at:500,pct:18,label:'Connecting to local AI...'},
     {at:1500,pct:36,label:'Local AI is rewriting for flow and model readiness...'},
     {at:4000,pct:58,label:'Preserving accepted decisions and constraints...'},
     {at:7000,pct:76,label:'Running Integrity Guard verification...'},
     {at:10500,pct:90,label:'Finalizing Gainwright Master...'},
     {at:16000,pct:96,label:'Waiting for local AI to finish...'}
    ],'g19-master-status','Gainwright Master complete.');
   };
  }
 }

 var badgeHost=document.querySelector('#gvs-v19-core .g19-badges');
 if(badgeHost&&!$('g19-progress-badge')){
  var badge=document.createElement('span');badge.id='g19-progress-badge';badge.className='g19-badge ok';badge.textContent='Workflow Status: ON';badgeHost.appendChild(badge);
 }
 g.GainwrightWorkflowProgressV1907={version:VERSION,set:setProgress};
 console.log('[Gainwright V19.0.7 Workflow Progress] active');
 return true;
}
function boot(){if(!mount())setTimeout(boot,500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,5400)});else setTimeout(boot,5400);
})(window);