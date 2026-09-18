/* Gainwright Visual Studio V18.26.1 - refinement patch */
(function(g){
'use strict';
if(g.__GAINWRIGHT_VISUAL_STUDIO_V18261__)return;
g.__GAINWRIGHT_VISUAL_STUDIO_V18261__=1;
var CLASS='gainwright-visual-studio-v1826';

function css(){
 if(document.getElementById('gvs-v18261-style'))return;
 var s=document.createElement('style');s.id='gvs-v18261-style';
 s.textContent=[
 'body.'+CLASS+' .wrap{max-width:1360px!important;margin:0 auto!important}',
 'body.'+CLASS+' .main{min-width:0!important}',
 'body.'+CLASS+' .brand h1{display:block!important;color:#fff!important;font-size:16px!important;line-height:1.12!important;letter-spacing:.08em!important;text-transform:uppercase!important;margin:0 0 8px!important}',
 'body.'+CLASS+' .brand p{color:#968e82!important;font-size:10px!important;line-height:1.5!important}',
 'body.'+CLASS+' .brand .version{background:#21180b!important;color:#efb04a!important;border:1px solid #674a1f!important;border-radius:0!important}',
 'body.'+CLASS+' .side-status{background:#15110b!important;color:#9d9588!important;border:1px solid #342e25!important;border-radius:0!important}',
 'body.'+CLASS+' .nav{gap:2px!important}',
 'body.'+CLASS+' .nav button[data-nav]{background:transparent!important;color:#b7aea0!important;border:0!important;border-left:2px solid transparent!important;border-radius:0!important;box-shadow:none!important;padding:12px 12px!important}',
 'body.'+CLASS+' .nav button[data-nav].active{background:#171109!important;color:#f3eee6!important;border-left-color:var(--gvs-gold)!important;box-shadow:none!important}',
 'body.'+CLASS+' .nav button[data-nav]:hover{background:#14100a!important;color:#fff!important}',
 'body.'+CLASS+' .mobile-nav button[data-nav]{background:transparent!important;color:#b7aea0!important;border:1px solid transparent!important;border-radius:0!important}',
 'body.'+CLASS+' .mobile-nav button[data-nav].active{background:#20170a!important;color:#f4b54e!important;border-color:#5d441f!important}',
 'body.'+CLASS+' #panel-create .uc-hero{background:linear-gradient(180deg,#17120b,#100d08)!important;border-color:#40372b!important;border-radius:0!important}',
 'body.'+CLASS+' #panel-create .uc-hero h2{font-size:27px!important;letter-spacing:-.02em!important}',
 'body.'+CLASS+' #panel-create .uc-health{color:var(--gvs-gold)!important}',
 'body.'+CLASS+' .uc161-head{background:rgba(11,9,6,.97)!important;border:1px solid #3b3428!important;padding:10px 12px!important;backdrop-filter:blur(12px)!important}',
 'body.'+CLASS+' .uc161-meta{color:#d9d0c3!important;text-transform:uppercase!important;letter-spacing:.08em!important;font-size:10px!important}',
 'body.'+CLASS+' .uc161-meta span:last-child{color:var(--gvs-gold)!important}',
 'body.'+CLASS+' .uc161-progress{height:7px!important;background:#282116!important;border-radius:0!important;overflow:hidden!important}',
 'body.'+CLASS+' .uc161-progress span{background:linear-gradient(90deg,#bb7817,var(--gvs-gold))!important}',
 'body.'+CLASS+' .uc161-nav{background:rgba(11,9,6,.98)!important;border:1px solid #4a3e2d!important;border-radius:0!important;padding:7px!important;box-shadow:none!important}',
 'body.'+CLASS+' #uc161back,body.'+CLASS+' #uc161next,body.'+CLASS+' #uc161advanced{border-radius:0!important;min-height:52px!important}',
 'body.'+CLASS+' .danger,body.'+CLASS+' button.danger{background:#26110f!important;color:#e7a096!important;border:1px solid #6d3932!important}',
 'body.'+CLASS+' .success,body.'+CLASS+' button.success{background:#11190d!important;color:#b8d99b!important;border:1px solid #3a542c!important}',
 'body.'+CLASS+' .library-btn,body.'+CLASS+' button.library-btn{background:#17130c!important;color:#e2c18d!important;border:1px solid #554426!important}',
 'body.'+CLASS+' #connPill{background:#11190d!important;color:#b8d99b!important;border:1px solid #3a542c!important;border-radius:0!important}',
 'body.'+CLASS+' .v15-card,body.'+CLASS+' .v15-stat,body.'+CLASS+' .v15-recent button{background:#13100a!important;color:#eee7dc!important;border:1px solid #3a3329!important;border-radius:0!important;box-shadow:none!important}',
 'body.'+CLASS+' .v15-muted,body.'+CLASS+' .v15-stat span,body.'+CLASS+' .v15-recent span{color:#968e82!important}',
 'body.'+CLASS+' .v15-health div{background:#100d09!important;color:#ded6ca!important;border-color:#383027!important;border-radius:0!important}',
 'body.'+CLASS+' .diag-fab{background:#17120b!important;color:#f0b149!important;border:1px solid #5d441f!important;border-radius:0!important;box-shadow:none!important}',
 'body.'+CLASS+' .diag-panel{background:rgba(4,3,2,.78)!important}',
 'body.'+CLASS+' .diag-card{background:#120f0a!important;color:#eee7dc!important;border:1px solid #493d2c!important;border-radius:0!important;box-shadow:none!important}',
 'body.'+CLASS+' .diag-row{border-color:#362f26!important}',
 'body.'+CLASS+' .diag-wait{color:#9c9488!important}',
 'body.'+CLASS+' .diag-pass{color:#a7ce82!important}',
 'body.'+CLASS+' .diag-fail{color:#e38f83!important}',
 '@media(max-width:760px){body.'+CLASS+' .wrap{max-width:none!important}body.'+CLASS+' .uc161-nav{bottom:calc(78px + env(safe-area-inset-bottom))!important}}'
 ].join('\n');
 document.head.appendChild(s);
}

function fixTextNode(n){
 if(!n||!n.nodeValue||!n.parentElement)return;
 var tag=n.parentElement.tagName;
 if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'||tag==='OPTION')return;
 var t=n.nodeValue;
 t=t.replace(/Ultimate Create/g,'Visual Builder');
 t=t.replace(/Ultimate Prompt Creator V15/g,'Gainwright Visual Studio');
 t=t.replace(/Ultimate Prompt Creator/g,'Gainwright Visual Studio');
 t=t.replace(/UPC preserves/g,'Gainwright preserves');
 t=t.replace(/UPC backup/g,'Gainwright backup');
 t=t.replace(/Restore this UPC backup/g,'Restore this Gainwright backup');
 t=t.replace(/V18\.1 CLEAN DATABASE/g,'V18.1 PROMPT ENGINE');
 t=t.replace(/â†’/g,'>');
 t=t.replace(/→/g,'>');
 t=t.replace(/â€”/g,'-');
 t=t.replace(/â€“/g,'-');
 t=t.replace(/â€™/g,"'");
 t=t.replace(/â€œ|â€/g,'"');
 if(/V15 polished creative production system/i.test(t)){
   t='V18 visual prompt production studio with guided creation, projects, Director, Library, continuity, batch tools and model-ready output.';
 }
 if(t!==n.nodeValue)n.nodeValue=t;
}

function copy(){
 var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];
 while(w.nextNode())nodes.push(w.currentNode);
 nodes.forEach(fixTextNode);

 var brand=document.querySelector('.brand h1');
 if(brand){brand.style.display='block';brand.textContent='Gainwright Visual Studio'}
 var bp=document.querySelector('.brand p');
 if(bp)bp.textContent='V18 visual prompt production studio for guided creation, projects, Director, Library, continuity and model-ready output.';
 var ver=document.querySelector('.brand .version');
 if(ver)ver.textContent='V18.26.1 STUDIO';

 var intro=document.querySelector('#panel-create .uc-hero h2');
 if(intro)intro.textContent='Visual Builder';
 var p=document.querySelector('#panel-create .uc-hero p');
 if(p)p.textContent='Reference Identity > Hair & Beauty > Clothing > Pose > Scene > Camera > Lighting > Final Prompt.';

 var title=document.getElementById('pageTitle');
 if(title&&title.textContent==='Ultimate Create')title.textContent='Visual Builder';
 var sub=document.getElementById('pageSub');
 if(sub&&/Build the complete prompt/i.test(sub.textContent||''))sub.textContent='Build a complete model-ready prompt in one guided flow.';

 var d=document.querySelector('.diag-fab');
 if(d)d.textContent='Studio Diagnostics';
}

function mount(){
 css();copy();
 [300,900,1800,3200,5200].forEach(function(ms){setTimeout(copy,ms)});
 g.GainwrightVisualStudioRefinement={version:'18.26.1',reapply:function(){css();copy()}};
 console.log('[Gainwright Visual Studio V18.26.1] refinement active');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(mount,150)});
else setTimeout(mount,150);
})(window);