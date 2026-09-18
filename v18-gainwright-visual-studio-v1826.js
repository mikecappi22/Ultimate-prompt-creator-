/* Gainwright Visual Studio V18.26 - editorial rebrand/theme layer */
(function(g){
'use strict';
if(g.__GAINWRIGHT_VISUAL_STUDIO_V1826__)return;
g.__GAINWRIGHT_VISUAL_STUDIO_V1826__=1;
var VERSION='18.26',CLASS='gainwright-visual-studio-v1826';
function style(){
 if(document.getElementById('gvs-v1826-style'))return;
 var s=document.createElement('style');s.id='gvs-v1826-style';
 s.textContent=[
 ':root{--gvs-bg:#0b0906;--gvs-bg2:#100d08;--gvs-panel:#15110b;--gvs-ink:#f4f0e8;--gvs-muted:#9f978a;--gvs-line:#3b3428;--gvs-gold:#efa52c;--gvs-gold2:#c9851f;--gvs-rose:#d68173;--gvs-green:#9dca72}',
 'html,body{min-height:100%}',
 'body.'+CLASS+'{margin:0!important;padding-top:0!important;background:radial-gradient(circle at 115% 19%,transparent 0 275px,rgba(239,165,44,.065) 277px 318px,transparent 320px),radial-gradient(circle at 110% 19%,transparent 0 370px,rgba(239,165,44,.035) 372px 405px,transparent 407px),linear-gradient(180deg,var(--gvs-bg) 0%,var(--gvs-bg2) 58%,#090704 100%)!important;color:var(--gvs-ink)!important;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important}',
 'body.'+CLASS+'::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:linear-gradient(90deg,rgba(255,255,255,.01) 1px,transparent 1px);background-size:72px 100%}',
 'body.'+CLASS+' .wrap,body.'+CLASS+' main,body.'+CLASS+' #app{position:relative;z-index:1}',
 'body.'+CLASS+' #upc-v18252-theme-toggle{display:none!important}',
 '#gvs-v1826-masthead{position:relative;z-index:2147482000;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:22px 30px;border-bottom:1px solid var(--gvs-line);background:rgba(5,4,2,.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}',
 '#gvs-v1826-brand{display:flex;align-items:center;gap:16px;min-width:0}',
 '#gvs-v1826-mark{width:54px;height:54px;flex:0 0 54px;display:grid;place-items:center;background:var(--gvs-gold);color:#090604;font:900 33px/1 Georgia,"Times New Roman",serif;letter-spacing:-.08em}',
 '#gvs-v1826-name{color:#fff;font-size:23px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}',
 '#gvs-v1826-sub{margin-top:4px;color:#857d70;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}',
 '#gvs-v1826-status{border:1px solid #6a4037;background:#17100d;color:#e6a89d;padding:13px 16px;font-size:11px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}',
 '#gvs-v1826-hero{position:relative;z-index:2;overflow:hidden;padding:78px 40px 64px;border-bottom:1px solid var(--gvs-line)}',
 '#gvs-v1826-hero::after{content:"";position:absolute;right:-235px;top:-5px;width:650px;height:650px;border:42px solid rgba(239,165,44,.07);border-radius:50%;pointer-events:none}',
 '#gvs-v1826-kicker{position:relative;z-index:1;margin-bottom:25px;color:var(--gvs-gold);font-size:12px;font-weight:900;letter-spacing:.22em;text-transform:uppercase}',
 '#gvs-v1826-title{position:relative;z-index:1;max-width:930px;color:#f7f3ec;font-size:clamp(54px,8.2vw,116px);line-height:.89;font-weight:950;letter-spacing:-.055em;text-transform:uppercase}',
 '#gvs-v1826-title em{display:block;color:var(--gvs-gold);font-family:Georgia,"Times New Roman",serif;font-weight:500;font-style:italic;text-transform:none;letter-spacing:-.055em}',
 '#gvs-v1826-copy{position:relative;z-index:1;max-width:790px;margin-top:31px;color:#b9b1a5;font-size:18px;line-height:1.72}',
 '#gvs-v1826-stats{position:relative;z-index:1;display:flex;gap:25px;flex-wrap:wrap;margin-top:32px;color:#767064;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}',
 '#gvs-v1826-stats .live{color:var(--gvs-green)}',
 '#gvs-v1826-stats .live::before{content:"";display:inline-block;width:9px;height:9px;margin-right:8px;border-radius:50%;background:var(--gvs-green);box-shadow:0 0 0 6px rgba(157,202,114,.10);vertical-align:-1px}',
 'body.'+CLASS+' .card,body.'+CLASS+' .panel-card,body.'+CLASS+' .uc-step,body.'+CLASS+' .uc-hero,body.'+CLASS+' #v1820_composer,body.'+CLASS+' #v1821_recipes,body.'+CLASS+' #v1822_variations,body.'+CLASS+' #v1823_analyzer,body.'+CLASS+' #v1824_backup,body.'+CLASS+' #v1825_release_lock{background:linear-gradient(180deg,rgba(24,19,11,.97),rgba(15,12,8,.97))!important;border:1px solid var(--gvs-line)!important;border-radius:0!important;box-shadow:none!important}',
 'body.'+CLASS+' .card{padding:18px!important}',
 'body.'+CLASS+' h1,body.'+CLASS+' h2,body.'+CLASS+' h3,body.'+CLASS+' h4,body.'+CLASS+' label,body.'+CLASS+' strong,body.'+CLASS+' b,body.'+CLASS+' summary{color:#f6f1e9!important}',
 'body.'+CLASS+' .sub,body.'+CLASS+' .help,body.'+CLASS+' .status,body.'+CLASS+' .count,body.'+CLASS+' .muted,body.'+CLASS+' small,body.'+CLASS+' .src,body.'+CLASS+' .cat163-hint{color:var(--gvs-muted)!important}',
 'body.'+CLASS+' a{color:#f0b24b!important}',
 'body.'+CLASS+' input,body.'+CLASS+' textarea,body.'+CLASS+' select{background:#0d0b08!important;color:#f4eee5!important;border:1px solid #484033!important;border-radius:0!important;box-shadow:none!important}',
 'body.'+CLASS+' input:focus,body.'+CLASS+' textarea:focus,body.'+CLASS+' select:focus{outline:none!important;border-color:var(--gvs-gold)!important;box-shadow:0 0 0 1px var(--gvs-gold)!important}',
 'body.'+CLASS+' input::placeholder,body.'+CLASS+' textarea::placeholder{color:#6e665b!important}',
 'body.'+CLASS+' select option{background:#100d09!important;color:#f4eee5!important}',
 'body.'+CLASS+' button{border-radius:0!important;box-shadow:none!important;font-weight:850!important;letter-spacing:.035em!important}',
 'body.'+CLASS+' button:hover{filter:brightness(1.08)!important;transform:none!important}',
 'body.'+CLASS+' .primary,body.'+CLASS+' button.primary,body.'+CLASS+' .add{background:var(--gvs-gold)!important;color:#100b04!important;border:1px solid var(--gvs-gold)!important}',
 'body.'+CLASS+' .secondary{background:#18140d!important;color:#e9e2d7!important;border:1px solid #4b4235!important}',
 'body.'+CLASS+' .remove{background:#24120f!important;color:#e3a095!important;border:1px solid #704038!important}',
 'body.'+CLASS+' .chip,body.'+CLASS+' .tag,body.'+CLASS+' .pill,body.'+CLASS+' .uc-chips button,body.'+CLASS+' .quick button{background:#1a150d!important;color:#d7c9b1!important;border:1px solid #54442d!important;border-radius:0!important}',
 'body.'+CLASS+' .result{background:#110e09!important;color:#eee7dc!important;border:1px solid #3f372c!important;border-radius:0!important;box-shadow:none!important}',
 'body.'+CLASS+' .result strong,body.'+CLASS+' .result b{color:#fff6e8!important}',
 'body.'+CLASS+' .result .phrase,body.'+CLASS+' .result div,body.'+CLASS+' .result span{color:#d7d0c6!important}',
 'body.'+CLASS+' .stage{background:#110e09!important;border-color:#3f372c!important;border-radius:0!important}',
 'body.'+CLASS+' .stagehead{background:#20170b!important;color:var(--gvs-gold)!important;border-radius:0!important;text-transform:uppercase;letter-spacing:.08em}',
 'body.'+CLASS+' .item{border-color:#332c23!important;color:#e6ded2!important}',
 'body.'+CLASS+' .manual{background:#171109!important;border-color:#55422b!important;border-radius:0!important}',
 'body.'+CLASS+' .badge{background:#20170a!important;color:#f2b347!important;border:1px solid #60461d!important;border-radius:0!important}',
 'body.'+CLASS+' #panel-create{counter-reset:gvsstep}',
 'body.'+CLASS+' #panel-create .uc-step{position:relative!important}',
 'body.'+CLASS+' #panel-create .uc-step::before{counter-increment:gvsstep;content:"0" counter(gvsstep);display:block;margin-bottom:10px;color:var(--gvs-gold);font-size:11px;font-style:italic;font-weight:900;letter-spacing:.08em}',
 'body.'+CLASS+' #uc161back{background:#15120d!important;color:#d7cec1!important;border:1px solid #4a4134!important}',
 'body.'+CLASS+' #uc161next{background:var(--gvs-gold)!important;color:#110b03!important;border:1px solid var(--gvs-gold)!important}',
 'body.'+CLASS+' #uc161advanced{background:#21180b!important;color:#efb44f!important;border:1px solid #6c5129!important}',
 'body.'+CLASS+' .nav,body.'+CLASS+' .mobile-nav,body.'+CLASS+' .topbar,body.'+CLASS+' .toolbar,body.'+CLASS+' .sidebar{background:rgba(8,6,3,.96)!important;color:#eae3d8!important;border-color:var(--gvs-line)!important;box-shadow:none!important;backdrop-filter:blur(14px)}',
 'body.'+CLASS+' .nav button,body.'+CLASS+' .mobile-nav button{background:transparent!important;color:#aaa194!important;border:0!important;border-bottom:2px solid transparent!important}',
 'body.'+CLASS+' .nav button.active,body.'+CLASS+' .mobile-nav button.active{color:#fff1d5!important;border-bottom-color:var(--gvs-gold)!important}',
 'body.'+CLASS+' #upc-v1817-health-btn,body.'+CLASS+' #upc1818-btn,body.'+CLASS+' #upc1819-btn{background:#17120b!important;color:#f2b24a!important;border:1px solid #594324!important;box-shadow:none!important;border-radius:0!important}',
 'body.'+CLASS+'::-webkit-scrollbar{width:10px}',
 'body.'+CLASS+'::-webkit-scrollbar-track{background:#080603}',
 'body.'+CLASS+'::-webkit-scrollbar-thumb{background:#5c4320;border:2px solid #080603}',
 '@media(max-width:720px){#gvs-v1826-masthead{padding:16px 18px}#gvs-v1826-mark{width:46px;height:46px;flex-basis:46px;font-size:28px}#gvs-v1826-name{font-size:17px;letter-spacing:.09em}#gvs-v1826-sub{display:none}#gvs-v1826-status{padding:11px 10px;font-size:9px}#gvs-v1826-hero{padding:56px 22px 48px}#gvs-v1826-title{font-size:clamp(48px,15vw,76px)}#gvs-v1826-copy{font-size:16px;line-height:1.65}#gvs-v1826-hero::after{right:-330px;top:30px}}'
 ].join('\n');
 document.head.appendChild(s);
}
function visibleBrand(){
 var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];
 while(w.nextNode())nodes.push(w.currentNode);
 nodes.forEach(function(n){
   if(!n.nodeValue||!n.parentElement)return;
   var tag=n.parentElement.tagName;
   if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'||tag==='OPTION')return;
   var t=n.nodeValue;
   t=t.replace(/Ultimate Prompt Creator/gi,'Gainwright Visual Studio');
   if(t==='UPC HEALTH')t='STUDIO HEALTH';
   if(t!==n.nodeValue)n.nodeValue=t;
 });
}
function hideOldTitle(){
 Array.prototype.slice.call(document.querySelectorAll('h1')).forEach(function(h){
   if(h.closest('#gvs-v1826-hero')||h.closest('#gvs-v1826-masthead'))return;
   if(/Gainwright Visual Studio|Ultimate Prompt Creator/i.test(h.textContent||'')){
     h.style.display='none';
     var n=h.nextElementSibling;if(n&&n.classList.contains('sub'))n.style.display='none';
   }
 });
}
function shell(){
 document.body.classList.add(CLASS);
 document.body.classList.remove('upc-neon-portal-v18252');
 try{localStorage.setItem('upc_neon_portal_theme_v18252','0')}catch(e){}
 document.title='Gainwright Visual Studio';
 if(!document.getElementById('gvs-v1826-masthead')){
   var head=document.createElement('header');head.id='gvs-v1826-masthead';
   head.innerHTML='<div id="gvs-v1826-brand"><div id="gvs-v1826-mark">G</div><div><div id="gvs-v1826-name">Gainwright Visual Studio</div><div id="gvs-v1826-sub">Precision prompt architecture</div></div></div><div id="gvs-v1826-status">Studio Ready</div>';
   document.body.insertBefore(head,document.body.firstChild);
 }
 if(!document.getElementById('gvs-v1826-hero')){
   var hero=document.createElement('section');hero.id='gvs-v1826-hero';
   hero.innerHTML='<div id="gvs-v1826-kicker">One idea. Every visual decision.</div><div id="gvs-v1826-title">Build the image before it <em>exists.</em></div><div id="gvs-v1826-copy">Describe what you imagine, combine curated visual language, lock the details that matter, and turn every useful decision into a structured, model-ready master prompt.</div><div id="gvs-v1826-stats"><span class="live">Prompt engine ready</span><span>V18 production system</span><span>Gainwright Visual Studio</span></div>';
   document.getElementById('gvs-v1826-masthead').insertAdjacentElement('afterend',hero);
 }
 visibleBrand();hideOldTitle();
}
function polish(){
 visibleBrand();hideOldTitle();
 var h=document.getElementById('upc-v1817-health-btn');if(h)h.textContent='STUDIO HEALTH';
}
function mount(){
 style();shell();polish();
 [500,1200,2500,4500].forEach(function(ms){setTimeout(polish,ms)});
 g.GainwrightVisualStudio={version:VERSION,brand:'Gainwright Visual Studio',reapply:function(){style();shell();polish()}};
 console.log('[Gainwright Visual Studio V18.26] active');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(mount,120)});
else setTimeout(mount,120);
})(window);