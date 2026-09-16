/* UPC V18.25.3 DATABASE VISIBILITY / NEON CONTRAST PATCH */
(function(g){'use strict';if(g.__UPC_V18253_DB_CONTRAST__)return;g.__UPC_V18253_DB_CONTRAST__=1;
const STYLE_ID='upc-v18253-db-contrast-style';
function mount(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
/* Database dropdowns were inheriting light text while keeping white result rows.
   Force every V18 Create database suggestion surface into a readable neon-dark palette. */
body.upc-neon-portal-v18252 #panel-create [id^="v181_box_"],
body.upc-neon-portal-v18252 #panel-create [id^="v181_results_"],
body.upc-neon-portal-v18252 #panel-create .v18clean-results,
body.upc-neon-portal-v18252 #panel-create .v181-results,
body.upc-neon-portal-v18252 #panel-create .v181-search-results{
  background:rgba(3,9,23,.98)!important;
  color:#eef8ff!important;
  border-color:rgba(54,216,255,.46)!important;
  box-shadow:0 14px 34px rgba(0,0,0,.48),0 0 22px rgba(54,216,255,.10)!important;
  backdrop-filter:blur(14px) saturate(1.15);
  -webkit-backdrop-filter:blur(14px) saturate(1.15);
}
body.upc-neon-portal-v18252 #panel-create [id^="v181_box_"] button,
body.upc-neon-portal-v18252 #panel-create [id^="v181_results_"] button,
body.upc-neon-portal-v18252 #panel-create .v18clean-results button,
body.upc-neon-portal-v18252 #panel-create .v181-results button,
body.upc-neon-portal-v18252 #panel-create .v181-search-results button{
  background:linear-gradient(135deg,rgba(7,17,39,.98),rgba(11,22,48,.98))!important;
  color:#f7fbff!important;
  border:0!important;
  border-bottom:1px solid rgba(73,189,255,.18)!important;
  border-radius:0!important;
  box-shadow:none!important;
  text-align:left!important;
  opacity:1!important;
}
body.upc-neon-portal-v18252 #panel-create [id^="v181_box_"] button:hover,
body.upc-neon-portal-v18252 #panel-create [id^="v181_results_"] button:hover,
body.upc-neon-portal-v18252 #panel-create .v18clean-results button:hover,
body.upc-neon-portal-v18252 #panel-create .v181-results button:hover,
body.upc-neon-portal-v18252 #panel-create .v181-search-results button:hover{
  background:linear-gradient(135deg,rgba(10,49,76,.98),rgba(55,28,91,.98))!important;
  color:#ffffff!important;
  transform:none!important;
  filter:none!important;
  box-shadow:inset 3px 0 0 #36d8ff!important;
}
body.upc-neon-portal-v18252 #panel-create [id^="v181_box_"] button small,
body.upc-neon-portal-v18252 #panel-create [id^="v181_results_"] button small,
body.upc-neon-portal-v18252 #panel-create .v18clean-results button small,
body.upc-neon-portal-v18252 #panel-create .v181-results button small,
body.upc-neon-portal-v18252 #panel-create .v181-search-results button small{
  color:#69ddff!important;
  opacity:1!important;
  font-weight:900!important;
  text-shadow:0 0 10px rgba(54,216,255,.18)!important;
}
body.upc-neon-portal-v18252 #panel-create [id^="v181_box_"] button b,
body.upc-neon-portal-v18252 #panel-create [id^="v181_box_"] button strong,
body.upc-neon-portal-v18252 #panel-create [id^="v181_results_"] button b,
body.upc-neon-portal-v18252 #panel-create [id^="v181_results_"] button strong,
body.upc-neon-portal-v18252 #panel-create .v18clean-results button b,
body.upc-neon-portal-v18252 #panel-create .v18clean-results button strong,
body.upc-neon-portal-v18252 #panel-create .v181-results button b,
body.upc-neon-portal-v18252 #panel-create .v181-results button strong{
  color:#ffffff!important;
  opacity:1!important;
  font-weight:800!important;
}
body.upc-neon-portal-v18252 #panel-create [id^="v181_box_"] button .phrase,
body.upc-neon-portal-v18252 #panel-create [id^="v181_results_"] button .phrase,
body.upc-neon-portal-v18252 #panel-create .v18clean-results button .phrase,
body.upc-neon-portal-v18252 #panel-create .v181-results button .phrase{
  color:#c8d8ef!important;
  opacity:1!important;
}
body.upc-neon-portal-v18252 #panel-create [id^="v181_box_"]::-webkit-scrollbar,
body.upc-neon-portal-v18252 #panel-create [id^="v181_results_"]::-webkit-scrollbar,
body.upc-neon-portal-v18252 #panel-create .v18clean-results::-webkit-scrollbar{width:10px}
body.upc-neon-portal-v18252 #panel-create [id^="v181_box_"]::-webkit-scrollbar-track,
body.upc-neon-portal-v18252 #panel-create [id^="v181_results_"]::-webkit-scrollbar-track,
body.upc-neon-portal-v18252 #panel-create .v18clean-results::-webkit-scrollbar-track{background:#050b18!important}
body.upc-neon-portal-v18252 #panel-create [id^="v181_box_"]::-webkit-scrollbar-thumb,
body.upc-neon-portal-v18252 #panel-create [id^="v181_results_"]::-webkit-scrollbar-thumb,
body.upc-neon-portal-v18252 #panel-create .v18clean-results::-webkit-scrollbar-thumb{background:linear-gradient(#23c7f3,#9354f7)!important;border:2px solid #050b18;border-radius:999px}
`;
  document.head.appendChild(s);
  console.log('[UPC V18.25.3] Database contrast patch active.');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(window);
