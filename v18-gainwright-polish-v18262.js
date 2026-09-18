/* Gainwright Visual Studio V18.26.2 - polish pass */
(function(g){
'use strict';
if(g.__GAINWRIGHT_VISUAL_STUDIO_V18262__)return;
g.__GAINWRIGHT_VISUAL_STUDIO_V18262__=1;
var CLASS='gainwright-visual-studio-v1826';

function addCss(){
 if(document.getElementById('gvs-v18262-style'))return;
 var s=document.createElement('style');s.id='gvs-v18262-style';
 s.textContent=[
 'body.'+CLASS+' .sidebar button[data-nav="home"]{background:transparent!important;color:#b7aea0!important;border:0!important;border-left:2px solid transparent!important;border-radius:0!important;box-shadow:none!important}',
 'body.'+CLASS+' .sidebar button[data-nav="home"].active{background:#171109!important;color:#f3eee6!important;border-left-color:var(--gvs-gold)!important}',
 'body.'+CLASS+' .sidebar button[data-nav="home"]:hover{background:#14100a!important;color:#fff!important}',
 'body.'+CLASS+':has(#panel-create.active) .topbar{display:none!important}',
 'body.'+CLASS+' .gvs-clear-all{background:#21100d!important;color:#e6a195!important;border:1px solid #6e3c35!important;border-radius:0!important;box-shadow:none!important;text-transform:uppercase!important;letter-spacing:.06em!important}',
 'body.'+CLASS+' .gvs-clear-all:hover{background:#2a1511!important;color:#ffd3cb!important}',
 '#gvs-v18262-tools{position:fixed;right:16px;bottom:16px;z-index:2147482500;display:flex;gap:8px;align-items:center;padding:7px;background:rgba(8,6,3,.94);border:1px solid #4a3a23;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}',
 '#gvs-v18262-tools button{position:static!important;inset:auto!important;margin:0!important;transform:none!important;min-height:38px!important;padding:9px 12px!important;background:#17120b!important;color:#f1b24b!important;border:1px solid #5b431f!important;border-radius:0!important;box-shadow:none!important;font-size:10px!important;font-weight:900!important;letter-spacing:.06em!important;text-transform:uppercase!important;white-space:nowrap!important}',
 '#gvs-v18262-tools button:hover{background:#21180b!important;color:#ffd27a!important;border-color:#8a642b!important}',
 '#gvs-v18262-tools .diag-fab{display:inline-flex!important;align-items:center!important;justify-content:center!important}',
 'body.'+CLASS+' .uc161-meta{font-variant-numeric:tabular-nums!important}',
 'body.'+CLASS+' #panel-create .uc-step{border-color:#40372b!important}',
 'body.'+CLASS+' #panel-create .uc-step h3{letter-spacing:-.01em!important}',
 'body.'+CLASS+' #panel-create .small{color:#8e877d!important}',
 '@media(max-width:900px){#gvs-v18262-tools{left:10px;right:10px;bottom:calc(78px + env(safe-area-inset-bottom));overflow-x:auto;justify-content:flex-start}#gvs-v18262-tools button{flex:0 0 auto!important;font-size:9px!important;padding:8px 10px!important}}'
 ].join('\n');
 document.head.appendChild(s);
}

function textFix(){
 var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];
 while(w.nextNode())nodes.push(w.currentNode);
 nodes.forEach(function(n){
  if(!n.nodeValue||!n.parentElement)return;
  var tag=n.parentElement.tagName;
  if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'||tag==='OPTION')return;
  var t=n.nodeValue;
  t=t.replace(/Â·/g,'·').replace(/Â /g,' ').replace(/â€¢/g,'·');
  t=t.replace(/Ultimate Create/g,'Visual Builder');
  if(t!==n.nodeValue)n.nodeValue=t;
 });
}

function markClear(){
 Array.prototype.slice.call(document.querySelectorAll('button')).forEach(function(b){
  if((b.textContent||'').trim().toLowerCase()==='clear all')b.classList.add('gvs-clear-all');
 });
}

function dockTools(){
 var ids=['upc1819-btn','upc1818-btn','upc-v1817-health-btn'];
 var buttons=ids.map(function(id){return document.getElementById(id)}).filter(Boolean);
 var diag=document.querySelector('.diag-fab');
 if(diag)buttons.push(diag);
 if(!buttons.length)return;

 var dock=document.getElementById('gvs-v18262-tools');
 if(!dock){
   dock=document.createElement('div');dock.id='gvs-v18262-tools';
   dock.setAttribute('aria-label','Studio tools');
   document.body.appendChild(dock);
 }
 buttons.forEach(function(b){
   if(b.parentElement!==dock)dock.appendChild(b);
 });
 var p=document.getElementById('upc1819-btn');if(p)p.textContent='Presets';
 var s=document.getElementById('upc1818-btn');if(s)s.textContent='Stack Builder';
 var h=document.getElementById('upc-v1817-health-btn');if(h)h.textContent='Studio Health';
 if(diag)diag.textContent='Diagnostics';
}

function refineCopy(){
 var brand=document.querySelector('.brand h1');
 if(brand)brand.textContent='Gainwright Visual Studio';
 var intro=document.querySelector('#panel-create .uc-hero h2');
 if(intro)intro.textContent='Visual Builder';
 var p=document.querySelector('#panel-create .uc-hero p');
 if(p)p.textContent='Reference Identity > Hair & Beauty > Clothing > Pose > Scene > Camera > Lighting > Final Prompt.';
}

function run(){
 addCss();textFix();markClear();dockTools();refineCopy();
}
function mount(){
 run();
 [350,800,1500,2600,4200,6500].forEach(function(ms){setTimeout(run,ms)});
 g.GainwrightVisualStudioPolish={version:'18.26.2',reapply:run};
 console.log('[Gainwright Visual Studio V18.26.2] polish active');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(mount,180)});
else setTimeout(mount,180);
})(window);