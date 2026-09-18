/* Gainwright Visual Studio V19.0.2 - Core Runtime Test Suite */
(function(g){
'use strict';
if(g.__GAINWRIGHT_CORE_TESTS_V1902__)return;
g.__GAINWRIGHT_CORE_TESTS_V1902__=1;

var VERSION='19.0.2';
var results=[];
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pass(name,msg,group){return{name:name,pass:true,msg:msg||'',group:group||'Core'}}
function fail(name,msg,group){return{name:name,pass:false,msg:msg||'',group:group||'Core'}}
async function safe(name,group,fn){
 try{var r=await fn();if(r&&typeof r==='object'&&Object.prototype.hasOwnProperty.call(r,'pass'))return r;return r?pass(name,String(r===true?'OK':r),group):fail(name,'Check returned false',group)}
 catch(e){return fail(name,e&&e.message?e.message:String(e),group)}
}
function add(r){results.push(r);renderRow(r);renderSummary()}

function css(){
 if($('g19test-style'))return;
 var s=document.createElement('style');s.id='g19test-style';s.textContent=[
 '#g19test-btn{border:1px solid #5b431f!important;background:#17120b!important;color:#f1b24b!important;border-radius:0!important;box-shadow:none!important;min-height:38px!important;padding:9px 12px!important;font-size:10px!important;font-weight:900!important;letter-spacing:.06em!important;text-transform:uppercase!important}',
 '#g19test-modal{position:fixed;inset:0;z-index:2147483640;background:rgba(3,2,1,.84);padding:18px;overflow:auto}',
 '#g19test-card{max-width:940px;margin:24px auto;background:#100d08;color:#eee7dc;border:1px solid #55452f;padding:16px;font:12px system-ui;box-shadow:0 24px 80px rgba(0,0,0,.45)}',
 '#g19test-head{display:flex;justify-content:space-between;gap:12px;align-items:start}',
 '#g19test-head h2{margin:0;color:#f8f3eb;font-size:22px}',
 '#g19test-head p{margin:5px 0 0;color:#948b7f;line-height:1.5}',
 '#g19test-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:14px 0}',
 '.g19test-stat{border:1px solid #3f3529;background:#0c0a07;padding:10px}',
 '.g19test-stat b{display:block;color:#efb24b!important;font-size:22px}.g19test-stat span{color:#8f877b;font-size:9px;text-transform:uppercase;letter-spacing:.08em}',
 '#g19test-actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}',
 '#g19test-actions button,#g19test-close{border:1px solid #5c4625;background:#1a140c;color:#efb24b;border-radius:0;padding:9px 11px;font-weight:900;font-size:10px;text-transform:uppercase;letter-spacing:.05em}',
 '#g19test-run{background:#efa52c!important;color:#100b04!important;border-color:#efa52c!important}',
 '#g19test-results{display:grid;gap:5px;margin-top:10px}',
 '.g19test-row{display:grid;grid-template-columns:90px minmax(190px,.8fr) 90px minmax(0,1.5fr);gap:8px;align-items:center;padding:8px;border:1px solid #30291f;background:#0b0906}',
 '.g19test-row .group{color:#8e8578;font-size:9px;text-transform:uppercase;letter-spacing:.07em}',
 '.g19test-row .name{color:#ded6ca;font-weight:800}',
 '.g19test-row .state{font-weight:950;text-align:center;border:1px solid;padding:5px}',
 '.g19test-row .state.pass{color:#b9dc9a;border-color:#3d5b2e;background:#0f180d}',
 '.g19test-row .state.fail{color:#efa69b;border-color:#704037;background:#23110e}',
 '.g19test-row .msg{color:#91897e;font-size:10px;overflow-wrap:anywhere}',
 '#g19test-note{margin-top:10px;color:#847c70;font-size:10px;line-height:1.5}',
 '@media(max-width:700px){#g19test-summary{grid-template-columns:1fr 1fr}.g19test-row{grid-template-columns:1fr auto}.g19test-row .group,.g19test-row .msg{grid-column:1/3}.g19test-card{margin:0}}'
 ].join('\n');document.head.appendChild(s);
}
function modal(){
 if($('g19test-modal'))return $('g19test-modal');
 var m=document.createElement('div');m.id='g19test-modal';m.hidden=true;
 m.innerHTML='<div id="g19test-card"><div id="g19test-head"><div><h2>Gainwright Core Test Suite</h2><p>Live read-only integration checks for V19 Core, V18 knowledge, local bridge, Ollama, prompt generation, QA, variations, storage, references and workspace wiring.</p></div><button id="g19test-close" type="button">Close</button></div>'+
 '<div id="g19test-summary"><div class="g19test-stat"><b id="g19test-total">0</b><span>Total</span></div><div class="g19test-stat"><b id="g19test-pass">0</b><span>Passed</span></div><div class="g19test-stat"><b id="g19test-fail">0</b><span>Failed</span></div><div class="g19test-stat"><b id="g19test-pct">0%</b><span>Health</span></div></div>'+
 '<div id="g19test-actions"><button id="g19test-run" type="button">Run Full Core Test</button><button id="g19test-copy" type="button">Copy Report</button></div><div id="g19test-results"></div>'+
 '<div id="g19test-note">The suite does not delete Vault items, modify reference files, or overwrite your draft. It uses a temporary storage key and a tiny local Ollama request for the AI transport check.</div></div>';
 document.body.appendChild(m);
 $('g19test-close').onclick=function(){m.hidden=true};m.onclick=function(e){if(e.target===m)m.hidden=true};
 $('g19test-run').onclick=runAll;$('g19test-copy').onclick=copyReport;return m;
}
function renderRow(r){
 var h=$('g19test-results');if(!h)return;
 var d=document.createElement('div');d.className='g19test-row';
 d.innerHTML='<div class="group">'+esc(r.group)+'</div><div class="name">'+esc(r.name)+'</div><div class="state '+(r.pass?'pass':'fail')+'">'+(r.pass?'PASS':'FAIL')+'</div><div class="msg">'+esc(r.msg||'')+'</div>';
 h.appendChild(d);
}
function renderSummary(){
 var p=results.filter(function(x){return x.pass}).length,f=results.length-p,pct=results.length?Math.round(p/results.length*100):0;
 $('g19test-total').textContent=results.length;$('g19test-pass').textContent=p;$('g19test-fail').textContent=f;$('g19test-pct').textContent=pct+'%';
}
function report(){
 var p=results.filter(function(x){return x.pass}).length;
 return ['GAINWRIGHT VISUAL STUDIO V19.0.2 CORE TEST REPORT','Run: '+new Date().toLocaleString(),'Passed: '+p+'/'+results.length+' ('+(results.length?Math.round(p/results.length*100):0)+'%)',''].concat(results.map(function(r){return '['+(r.pass?'PASS':'FAIL')+'] '+r.group+' — '+r.name+(r.msg?' — '+r.msg:'')})).join('\n');
}
function copyReport(){
 var t=report();if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t);
 var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();
}

function databaseSearch(field,q,limit){
 if(g.GainwrightCoreV19&&typeof g.GainwrightCoreV19.search==='function')return g.GainwrightCoreV19.search(field,q,limit||10)||[];
 return[];
}
async function bridgeHealth(){
 var r=await fetch('/health',{cache:'no-store'});var t=await r.text();return r.ok?pass('Private bridge','HTTP '+r.status+' · '+t.slice(0,80),'Infrastructure'):fail('Private bridge','HTTP '+r.status,'Infrastructure');
}
async function ollamaTags(){
 var r=await fetch('/ollama/api/tags',{cache:'no-store'});if(!r.ok)return fail('Ollama API','HTTP '+r.status,'AI');
 var j=await r.json(),names=(j.models||[]).map(function(x){return x.name||x.model}).filter(Boolean);
 g.__G19TEST_MODELS=names;return pass('Ollama API',names.length+' model(s): '+names.join(', '),'AI');
}
async function ollamaExpectedModel(){
 var n=g.__G19TEST_MODELS||[];return n.indexOf('qwen3:1.7b')>=0?pass('Expected text model','qwen3:1.7b installed','AI'):fail('Expected text model','qwen3:1.7b not found; installed: '+n.join(', '),'AI');
}
async function ollamaChat(){
 var models=g.__G19TEST_MODELS||[],model=models.indexOf('qwen3:1.7b')>=0?'qwen3:1.7b':models.find(function(x){return /^qwen3:/i.test(x)})||models[0];
 if(!model)return fail('AI chat transport','No local model available','AI');
 var r=await fetch('/ollama/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:model,messages:[{role:'user',content:'Return JSON only with this exact structure: {"status":"OK"}'}],stream:false,think:false,format:'json',options:{num_predict:30,num_ctx:1024,temperature:0}})});
 if(!r.ok)return fail('AI chat transport','HTTP '+r.status,'AI');
 var j=await r.json(),c=String(j.message&&j.message.content||'');return /OK/i.test(c)?pass('AI chat transport',model+' returned a valid response','AI'):fail('AI chat transport','Unexpected response from '+model+': '+c.slice(0,100),'AI');
}

async function runAll(){
 var m=modal();m.hidden=false;results=[];$('g19test-results').innerHTML='';renderSummary();$('g19test-run').disabled=true;$('g19test-run').textContent='Running...';
 var tests=[
  function(){return safe('V19 Core API','Core',function(){return !!(g.GainwrightCoreV19&&g.GainwrightCoreV19.version==='19.0')&&pass('V19 Core API','GainwrightCoreV19 '+g.GainwrightCoreV19.version,'Core')})},
  function(){return safe('V19 Create panel','Core',function(){return $('gvs-v19-core')?pass('V19 Create panel','Idea-first panel mounted','Core'):fail('V19 Create panel','Panel missing','Core')})},
  function(){return safe('Reference uploader','Core',function(){var e=$('g19-files');return e&&String(e.accept).indexOf('image')>=0?pass('Reference uploader','Image uploader present','Core'):fail('Reference uploader','Uploader missing or misconfigured','Core')})},
  function(){return safe('Workspace handoff target','Core',function(){return $('workspace')?pass('Workspace handoff target','Prompt Workspace present','Core'):fail('Workspace handoff target','Workspace element missing','Core')})},
  function(){return safe('Advanced V18 fallback','Core',function(){return $('panel-create')?pass('Advanced V18 fallback','Legacy V18 Create panel preserved','Core'):fail('Advanced V18 fallback','Legacy Create panel missing','Core')})},

  function(){return safe('V18 canonical database fallback','Knowledge',function(){if(g.UPCDatabase18&&typeof g.UPCDatabase18.search==='function')return pass('V18 canonical database fallback',(g.UPCDatabase18.records||[]).length+' canonical records loaded','Knowledge');if(g.UPCV18Core&&typeof g.UPCV18Core.search==='function')return pass('V18 canonical database fallback','Optional legacy fallback not loaded; expanded V18 knowledge engine is active','Knowledge');return fail('V18 canonical database fallback','Neither canonical nor expanded V18 database is available','Knowledge')})},
  function(){return safe('V18 expanded database','Knowledge',function(){return g.UPCV18Core&&typeof g.UPCV18Core.search==='function'?pass('V18 expanded database',(g.UPCV18Core.records||[]).length+' expanded records loaded','Knowledge'):fail('V18 expanded database','UPCV18Core missing','Knowledge')})},
  function(){return safe('Hair search','Knowledge',function(){var n=databaseSearch('hair','ponytail',10).length;return n>0?pass('Hair search',n+' ponytail result(s)','Knowledge'):fail('Hair search','No ponytail results','Knowledge')})},
  function(){return safe('Camera search','Knowledge',function(){var n=databaseSearch('camera','85mm',10).length;return n>0?pass('Camera search',n+' 85mm result(s)','Knowledge'):fail('Camera search','No 85mm results','Knowledge')})},
  function(){return safe('Category isolation','Knowledge',function(){var n=databaseSearch('bottom','ponytail',10).length;return n===0?pass('Category isolation','Bottom search correctly rejected ponytail','Knowledge'):fail('Category isolation','Bottom returned '+n+' ponytail result(s)','Knowledge')})},
  function(){return safe('Platform presets','Knowledge',function(){var n=g.UPCV1819Presets?Object.keys(g.UPCV1819Presets).length:0;return n>=8?pass('Platform presets',n+' model presets loaded','Knowledge'):fail('Platform presets','Only '+n+' preset(s) loaded','Knowledge')})},
  function(){return safe('Smart Stack Builder','Knowledge',function(){return g.UPCV1818Stack&&typeof g.UPCV1818Stack.build==='function'?pass('Smart Stack Builder',Object.keys(g.UPCV1818Stack.modes||{}).length+' modes loaded','Knowledge'):fail('Smart Stack Builder','Stack API missing','Knowledge')})},

  function(){return safe('Final Prompt Composer','Prompt Engine',function(){return g.UPCV1820Composer&&typeof g.UPCV1820Composer.build==='function'?pass('Final Prompt Composer','V18.20 composer connected','Prompt Engine'):fail('Final Prompt Composer','Composer API missing','Prompt Engine')})},
  function(){return safe('Gainwright structured build','Prompt Engine',function(){var t=g.GainwrightCoreV19.build(false);return /^\[GAINWRIGHT VISUAL BRIEF\]/.test(String(t||''))?pass('Gainwright structured build',String(t).split(/\s+/).length+' words generated','Prompt Engine'):fail('Gainwright structured build','Expected Gainwright header not produced','Prompt Engine')})},
  function(){return safe('Prompt Quality Analyzer','Prompt Engine',function(){if(!(g.UPCV1823Analyzer&&typeof g.UPCV1823Analyzer.analyze==='function'))return fail('Prompt Quality Analyzer','Analyzer API missing','Prompt Engine');var r=g.UPCV1823Analyzer.analyze();return typeof r.score==='number'?pass('Prompt Quality Analyzer','Score '+r.score+'/100 · '+r.status,'Prompt Engine'):fail('Prompt Quality Analyzer','Analyzer returned no score','Prompt Engine')})},
  function(){return safe('Controlled Variations','Prompt Engine',function(){if(!(g.UPCV1822Variations&&typeof g.UPCV1822Variations.generate==='function'))return fail('Controlled Variations','Variations API missing','Prompt Engine');var r=g.UPCV1822Variations.generate({mode:'Pose + Camera',count:1,guidance:''});return r&&r.length===1&&r[0].prompt?pass('Controlled Variations','1 test variation generated','Prompt Engine'):fail('Controlled Variations','No test variation generated','Prompt Engine')})},

  function(){return safe('Browser storage','Storage',function(){var k='__g19_core_test__',old=localStorage.getItem(k);localStorage.setItem(k,'1');var ok=localStorage.getItem(k)==='1';if(old===null)localStorage.removeItem(k);else localStorage.setItem(k,old);return ok?pass('Browser storage','Temporary write/read succeeded','Storage'):fail('Browser storage','Temporary write/read failed','Storage')})},
  function(){return safe('Gainwright Vault API','Storage',function(){var v=g.GainwrightCoreV19.vault();return Array.isArray(v)?pass('Gainwright Vault API',v.length+' saved creation(s)','Storage'):fail('Gainwright Vault API','Vault API did not return an array','Storage')})},
  function(){return safe('Reference privacy','Storage',function(){var d=localStorage.getItem('gainwright_core_v190_draft')||'';return d.indexOf('data:image/')<0&&d.indexOf('blob:')<0?pass('Reference privacy','Draft contains no image bytes/blob URLs','Storage'):fail('Reference privacy','Image data or blob URL found in saved draft','Storage')})},

  bridgeHealth,
  ollamaTags,
  ollamaExpectedModel,
  ollamaChat
 ];
 for(var i=0;i<tests.length;i++){var r=await tests[i]();add(r)}
 delete g.__G19TEST_MODELS;
 $('g19test-run').disabled=false;$('g19test-run').textContent='Run Full Core Test';
 localStorage.setItem('gainwright_core_last_test_v1902',JSON.stringify({at:new Date().toISOString(),version:VERSION,results:results}));
}
function mount(){
 css();modal();
 if($('g19test-btn'))return;
 var b=document.createElement('button');b.id='g19test-btn';b.type='button';b.textContent='Core Tests';b.onclick=function(){modal().hidden=false};
 var dock=$('gvs-v18262-tools');if(dock)dock.appendChild(b);else{b.style.position='fixed';b.style.right='16px';b.style.bottom='64px';b.style.zIndex='2147482500';document.body.appendChild(b)}
 g.GainwrightCoreTestsV1902={version:VERSION,run:runAll,report:report,results:function(){return results.slice()}};
 console.log('[Gainwright Core Tests V19.0.2] ready');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(mount,4500)});else setTimeout(mount,4500);
})(window);