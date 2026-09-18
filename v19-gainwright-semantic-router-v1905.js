/* Gainwright Visual Studio V19.0.5 - Semantic Decision Router */
(function(g){
'use strict';
if(g.__GAINWRIGHT_SEMANTIC_ROUTER_V1905__)return;
g.__GAINWRIGHT_SEMANTIC_ROUTER_V1905__=1;

var VERSION='19.0.5';
var core=null,guard=null;

function $(id){return document.getElementById(id)}
function val(id){var e=$(id);return e?String(e.value||'').trim():''}
function norm(s){return String(s||'').toLowerCase().replace(/[\s,;:.\-–—_/]+/g,' ').trim()}
function words(s){return norm(s).split(/\s+/).filter(Boolean)}
function uniq(a){var seen={};return (a||[]).map(function(x){return String(x||'').trim()}).filter(function(x){var k=norm(x);if(!k||seen[k])return false;seen[k]=1;return true})}
function setField(name,text){
 var e=document.querySelector('#gvs-v19-core [data-field="'+name+'"]');if(!e)return;
 e.value=String(text||'').trim();
 e.dispatchEvent(new Event('input',{bubbles:true}));
 e.dispatchEvent(new Event('change',{bubbles:true}));
}
function getField(name){var e=document.querySelector('#gvs-v19-core [data-field="'+name+'"]');return e?String(e.value||'').trim():''}
function included(name){var e=document.querySelector('#gvs-v19-core [data-inc="'+name+'"]');return !e||e.checked}
function appendField(name,text){
 var cur=getField(name),next=uniq([cur,text]).join(', ');setField(name,next);
}
function setStatus(msg,type){
 var e=$('g19-ai-status');if(e){e.textContent=msg||'';e.setAttribute('data-type',type||'')}
}
function setMasterStatus(msg,type){
 var e=$('g19-master-status');if(e){e.textContent=msg||'';e.setAttribute('data-type',type||'')}
}
function constraintLike(t){
 var n=norm(t);return /\b(no|avoid|without|exclude|prevent|must not|do not|dont|never|only|preserve|keep|lock|disable|forbid|reject)\b/.test(n);
}
function extractIdeaBits(){
 var idea=val('g19-idea'),n=norm(idea),bits=[];
 if(/\blight rain\b/.test(n))bits.push('light rain');
 else if(/\brain\b/.test(n))bits.push('rain');
 if(/\bwet pavement\b/.test(n))bits.push('wet pavement');
 if(/\bwet pavement reflections\b/.test(n))bits.push('wet pavement reflections');
 if(/\bnight\b/.test(n))bits.push('night');
 if(/\bcity shopping district\b/.test(n))bits.push('city shopping district');
 if(/\bstreet lighting\b/.test(n))bits.push('street lighting');
 return uniq(bits);
}
function rerouteConstraint(t,changes){
 if(!t||constraintLike(t))return;
 var n=norm(t),moved=false;
 if(/reflection|pavement|sidewalk|street|storefront|rain|snow|fog|city|district|night|background|environment/.test(n)){
  appendField('environment',t);changes.push('Moved "'+t+'" from Constraints to Environment');moved=true;
 }else if(/texture|skin|fabric|material|grain|noise|realism|compression|imperfection/.test(n)){
  appendField('realism',t);changes.push('Moved "'+t+'" from Constraints to Realism');moved=true;
 }else if(/light|lighting|shadow|sunlight|streetlight|lamp|neon|rim light/.test(n)){
  appendField('lighting',t);changes.push('Moved "'+t+'" from Constraints to Lighting');moved=true;
 }else if(/camera|lens|framing|shot|angle|handheld|candid/.test(n)){
  appendField('camera',t);changes.push('Moved "'+t+'" from Constraints to Camera');moved=true;
 }
 if(moved){
  setField('constraints','no plastic skin, no CGI appearance, no impossible anatomy, no identity drift');
  changes.push('Replaced Constraints with actual negative rules');
 }
}
function improveEnvironment(changes){
 var env=getField('environment'),scene=getField('scene'),ideaBits=extractIdeaBits(),n=norm(env);
 if(!scene)return;
 var weak=!env||words(env).length<=2||/^(night|day|evening|morning|afternoon|outdoor|indoors?|urban|city)$/.test(n);
 if(!weak)return;
 var parts=[scene];
 if(env)parts.push(env);
 ideaBits.forEach(function(x){if(norm(x)!==norm(scene)&&norm(x)!==norm(env))parts.push(x)});
 var next=uniq(parts).join(', ');
 if(next&&norm(next)!==norm(env)){setField('environment',next);changes.push('Expanded Environment from context')}
}
function improveRealism(changes){
 var r=getField('realism'),n=norm(r),idea=norm(val('g19-idea'));
 var weak=!r||words(r).length<=2||/^(high|realistic|photorealistic|realism|detailed|detail|quality|high quality|maximum|max)$/.test(n);
 if(!weak)return;
 var next='candid photographic realism, natural skin and material texture, physically believable reflections and shadows';
 if(/rain|wet pavement|reflection/.test(idea))next='candid photographic realism, natural skin and material texture, physically believable wet-surface reflections, realistic rain response and coherent shadows';
 setField('realism',next);changes.push('Expanded Realism / Texture into prompt-ready language');
}
function improveCamera(changes){
 var c=getField('camera'),n=norm(c);
 var weak=!c||words(c).length<=3||/^(candid realistic photography|realistic photography|candid photography|photo|photography)$/.test(n);
 if(!weak)return;
 var next='eye-level environmental framing, handheld candid snapshot, natural perspective';
 setField('camera',next);changes.push('Expanded Camera into usable framing and capture language');
}
function improveLighting(changes){
 var l=getField('lighting'),n=norm(l);
 if(n==='street lighting'||n==='natural street lighting')return;
 if(!l||words(l).length<=1){
  var idea=norm(val('g19-idea'));
  if(/night/.test(idea)){setField('lighting','natural street lighting with realistic wet-pavement reflections');changes.push('Expanded Lighting from the core idea')}
 }
}
function semanticAudit(){
 var changes=[];
 rerouteConstraint(getField('constraints'),changes);
 improveEnvironment(changes);
 improveRealism(changes);
 improveCamera(changes);
 improveLighting(changes);
 return changes;
}
function paintSemanticSources(){
 ['hair','makeup','expression','nails','top','bottom','footwear','accessories','pose','scene','environment','camera','lighting','realism','constraints'].forEach(function(f){
  var row=document.querySelector('#gvs-v19-core [data-field="'+f+'"]');row=row&&row.closest('.g19-row');
  var src=row&&row.querySelector('.g19-source');
  if(src&&getField(f))src.textContent='AI suggestion · semantically validated';
 });
}
async function analyze(){
 if(!guard||typeof guard.analyze!=='function')return;
 await guard.analyze();
 var changes=semanticAudit();
 paintSemanticSources();
 if(core&&typeof core.build==='function')core.build(false);
 setStatus(changes.length?'Analysis complete · semantic router corrected '+changes.length+' decision issue'+(changes.length===1?'':'s')+'.':'Analysis complete · decision routing validated.','ok');
}
function decisionLock(){
 var order=['hair','makeup','expression','nails','top','bottom','footwear','accessories','pose','scene','environment','camera','lighting','realism','constraints'];
 var lines=[];
 order.forEach(function(f){
  var v=getField(f);if(!v||!included(f))return;
  var label={
   hair:'HAIR',makeup:'MAKEUP',expression:'EXPRESSION',nails:'NAILS',top:'TOP',bottom:'BOTTOM',
   footwear:'FOOTWEAR',accessories:'ACCESSORIES',pose:'POSE / ACTION',scene:'SCENE SUPPORT',
   environment:'ENVIRONMENT',camera:'CAMERA',lighting:'LIGHTING',realism:'REALISM / TEXTURE',constraints:'CONSTRAINTS'
  }[f]||f.toUpperCase();
  lines.push(label+': '+v);
 });
 return lines.length?'[GAINWRIGHT ACCEPTED DECISIONS]\n'+lines.join('\n'):'';
}
async function refine(){
 if(!guard||typeof guard.refine!=='function')return;
 await guard.refine();
 var m=$('g19-master');if(!m)return;
 var lock=decisionLock(),current=String(m.value||'').trim();
 if(lock&&current.indexOf('[GAINWRIGHT ACCEPTED DECISIONS]')<0){
  m.value=[current,lock].filter(Boolean).join('\n\n');
  m.dispatchEvent(new Event('input',{bubbles:true}));
 }
 setMasterStatus(lock?'Gainwright Master verified and explicit decision lock appended.':'Gainwright Master verified.','ok');
}
function badge(){
 var host=document.querySelector('#gvs-v19-core .g19-badges');if(!host||$('g19-semantic-badge'))return;
 var b=document.createElement('span');b.id='g19-semantic-badge';b.className='g19-badge ok';b.textContent='Semantic Router: ON';host.appendChild(b);
}
function bind(){
 core=g.GainwrightCoreV19;guard=g.GainwrightIntegrityV1904;
 if(!core||!guard||!$('gvs-v19-core'))return false;
 badge();
 var a=$('g19-analyze');if(a&&!a.getAttribute('data-g1905')){a.setAttribute('data-g1905','1');a.onclick=analyze}
 var r=$('g19-refine');if(r&&!r.getAttribute('data-g1905')){r.setAttribute('data-g1905','1');r.onclick=refine}
 g.GainwrightSemanticRouterV1905={version:VERSION,audit:semanticAudit,analyze:analyze,refine:refine,decisionLock:decisionLock};
 console.log('[Gainwright V19.0.5 Semantic Decision Router] active');
 return true;
}
function boot(){if(!bind())setTimeout(boot,500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,4200)});else setTimeout(boot,4200);
})(window);