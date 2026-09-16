/* UPC V18.25.2 NEON PORTAL PLATFORM THEME */
(function(g){'use strict';if(g.__UPC_V18252_NEON_THEME__)return;g.__UPC_V18252_NEON_THEME__=1;
const VERSION='18.25.2',KEY='upc_neon_portal_theme_v18252',CLASS='upc-neon-portal-v18252';
function style(){if(document.getElementById('upc-v18252-neon-style'))return;const s=document.createElement('style');s.id='upc-v18252-neon-style';s.textContent=`
:root{--upc-neon-cyan:#36d8ff;--upc-neon-blue:#3b82f6;--upc-neon-violet:#8b5cf6;--upc-neon-magenta:#f04cff;--upc-neon-bg:#020817;--upc-glass:rgba(5,12,30,.82);--upc-glass-soft:rgba(8,16,37,.72);--upc-neon-border:rgba(74,205,255,.24)}
html,body{min-height:100%}
body.${CLASS}{background-color:var(--upc-neon-bg)!important;background-image:linear-gradient(180deg,rgba(2,7,19,.30),rgba(2,6,18,.58)),url('./assets/neon-portal-bg-v18252.svg')!important;background-position:center center!important;background-size:cover!important;background-repeat:no-repeat!important;background-attachment:fixed!important;color:#eef8ff!important}
body.${CLASS}::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(circle at 50% 36%,rgba(2,8,23,.03) 0%,rgba(2,8,23,.10) 42%,rgba(0,0,0,.38) 100%)}
body.${CLASS} .wrap,body.${CLASS} main,body.${CLASS} #app{position:relative;z-index:1}
body.${CLASS} .nav,body.${CLASS} .mobile-nav,body.${CLASS} .topbar,body.${CLASS} .toolbar,body.${CLASS} .sidebar{background:linear-gradient(180deg,rgba(3,9,24,.91),rgba(7,12,31,.83))!important;border-color:rgba(54,216,255,.18)!important;backdrop-filter:blur(18px) saturate(1.15);-webkit-backdrop-filter:blur(18px) saturate(1.15);box-shadow:0 10px 32px rgba(0,0,0,.34),0 0 24px rgba(54,216,255,.04)}
body.${CLASS} #panel-create .uc-hero,body.${CLASS} #panel-create .uc-step,body.${CLASS} #v1820_composer,body.${CLASS} #v1821_recipes,body.${CLASS} #v1822_variations,body.${CLASS} #v1823_analyzer,body.${CLASS} #v1824_backup,body.${CLASS} #v1825_release_lock,body.${CLASS} .card,body.${CLASS} .panel-card{background:linear-gradient(145deg,rgba(4,11,28,.88),rgba(10,17,39,.76))!important;border:1px solid var(--upc-neon-border)!important;backdrop-filter:blur(16px) saturate(1.2);-webkit-backdrop-filter:blur(16px) saturate(1.2);box-shadow:0 18px 44px rgba(0,0,0,.36),0 0 0 1px rgba(240,76,255,.035),0 0 30px rgba(54,216,255,.055)!important}
body.${CLASS} #panel-create h1,body.${CLASS} #panel-create h2,body.${CLASS} #panel-create h3,body.${CLASS} #panel-create h4,body.${CLASS} #panel-create b,body.${CLASS} #panel-create label,body.${CLASS} #panel-create summary{color:#f5fbff!important}
body.${CLASS} #panel-create p,body.${CLASS} #panel-create small,body.${CLASS} #panel-create .small,body.${CLASS} #panel-create .muted,body.${CLASS} #panel-create .cat163-hint{color:#b8cae8!important}
body.${CLASS} input,body.${CLASS} textarea,body.${CLASS} select{background:rgba(2,8,22,.82)!important;color:#edf8ff!important;border-color:rgba(86,205,255,.26)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.018)!important}
body.${CLASS} input:focus,body.${CLASS} textarea:focus,body.${CLASS} select:focus{outline:none!important;border-color:rgba(54,216,255,.62)!important;box-shadow:0 0 0 3px rgba(54,216,255,.10),0 0 20px rgba(139,92,246,.08)!important}
body.${CLASS} input::placeholder,body.${CLASS} textarea::placeholder{color:#7186a7!important}
body.${CLASS} #panel-create button.primary,body.${CLASS} #panel-create .primary,body.${CLASS} #v1820_composer button:first-of-type{background:linear-gradient(135deg,#0ea5e9 0%,#4f46e5 54%,#a855f7 100%)!important;color:white!important;border:1px solid rgba(125,211,252,.26)!important;box-shadow:0 7px 20px rgba(14,165,233,.18),0 0 18px rgba(168,85,247,.08)!important}
body.${CLASS} #panel-create button:not(.primary){border-color:rgba(91,192,255,.18)!important}
body.${CLASS} .uc-chips button,body.${CLASS} .chip,body.${CLASS} .tag,body.${CLASS} .pill{background:rgba(39,62,114,.33)!important;color:#dbeafe!important;border-color:rgba(92,196,255,.17)!important}
body.${CLASS} #upc-v1817-health-btn{background:linear-gradient(135deg,#0b1227,#25124a)!important;border:1px solid rgba(54,216,255,.34)!important;box-shadow:0 0 22px rgba(54,216,255,.14),0 0 20px rgba(240,76,255,.10)!important}
body.${CLASS} #upc1818-btn{background:linear-gradient(135deg,#172554,#581c87)!important;border:1px solid rgba(168,85,247,.28)!important}
body.${CLASS} #upc1819-btn{background:linear-gradient(135deg,#075985,#6b21a8)!important;border:1px solid rgba(54,216,255,.24)!important}
body.${CLASS}::-webkit-scrollbar{width:11px}body.${CLASS}::-webkit-scrollbar-track{background:#030817}body.${CLASS}::-webkit-scrollbar-thumb{background:linear-gradient(#16bfea,#a855f7);border:3px solid #030817;border-radius:999px}
#upc-v18252-theme-toggle{position:fixed;left:14px;bottom:14px;z-index:2147483004;border:1px solid rgba(54,216,255,.38);border-radius:999px;padding:9px 12px;background:linear-gradient(135deg,rgba(3,12,31,.94),rgba(45,20,78,.94));color:#eaf9ff;font:800 10px system-ui;letter-spacing:.04em;box-shadow:0 0 22px rgba(54,216,255,.16),0 0 18px rgba(240,76,255,.10);backdrop-filter:blur(10px);cursor:pointer}
#upc-v18252-theme-toggle:hover{border-color:rgba(240,76,255,.55);box-shadow:0 0 28px rgba(54,216,255,.20),0 0 24px rgba(240,76,255,.16)}
@media(max-width:720px){body.${CLASS}{background-position:center center!important}#upc-v18252-theme-toggle{left:8px;bottom:64px;padding:8px 10px}}
`;document.head.appendChild(s)}
function enabled(){return localStorage.getItem(KEY)!=='0'}
function syncButton(){const b=document.getElementById('upc-v18252-theme-toggle');if(b)b.textContent=enabled()?'NEON THEME · ON':'NEON THEME · OFF'}
function apply(){style();document.body.classList.toggle(CLASS,enabled());syncButton()}
function set(v){localStorage.setItem(KEY,v?'1':'0');apply();return v}
function toggle(){return set(!enabled())}
function mount(){style();if(!document.getElementById('upc-v18252-theme-toggle')){const b=document.createElement('button');b.id='upc-v18252-theme-toggle';b.type='button';b.onclick=toggle;document.body.appendChild(b)}apply();g.UPCV18252NeonTheme={version:VERSION,enabled,set,toggle,asset:'assets/neon-portal-bg-v18252.svg'};console.log('[UPC V18.25.2 Neon Portal Theme] active:',enabled())}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,250));else setTimeout(mount,250);
})(window);
