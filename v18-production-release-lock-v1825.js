/* UPC V18.25 FINAL PRODUCTION / RELEASE LOCK */
(function(g){'use strict';if(g.__UPC_V1825_RELEASE_LOCK__)return;g.__UPC_V1825_RELEASE_LOCK__=1;

const VERSION='18.25';
const RELEASE_ID='UPC-V18.25-PRODUCTION';
const RELEASE_KEY='upc_production_release_v1825';
const $=id=>document.getElementById(id);

const REQUIRED_MARKERS=[
 ['V18.1 Clean Core',['__UPC_V181_CLEAN_DB__','__UPC_V18_CLEAN__']],
 ['V18.2 Hair',['__UPC_V182_HAIR__']],
 ['V18.3 Makeup',['__UPC_V183_MAKEUP__']],
 ['V18.4 Expression',['__UPC_V184_EXPRESSION__']],
 ['V18.5 Nails',['__UPC_V185_NAILS__']],
 ['V18.6 Top',['__UPC_V186_TOP__']],
 ['V18.7 Bottom',['__UPC_V187_BOTTOM__']],
 ['V18.8 Footwear',['__UPC_V188_FOOTWEAR__']],
 ['V18.9 Accessories',['__UPC_V189_ACCESSORIES__']],
 ['V18.10 Pose',['__UPC_V1810_POSE__']],
 ['V18.11 Scene',['__UPC_V1811_SCENE__']],
 ['V18.12 Environment',['__UPC_V1812_ENVIRONMENT__']],
 ['V18.13 Camera',['__UPC_V1813_CAMERA__']],
 ['V18.14 Lighting',['__UPC_V1814_LIGHTING__']],
 ['V18.15 Realism',['__UPC_V1815_REALISM__']],
 ['V18.16 Constraints',['__UPC_V1816_CONSTRAINTS__']],
 ['V18.17 Integration Audit',['__UPC_V1817_AUDIT__']],
 ['V18.18 Smart Stack',['__UPC_V1818_STACK__']],
 ['V18.19 Platform Presets',['__UPC_V1819_PRESETS__']],
 ['V18.20 Final Composer',['__UPC_V1820_COMPOSER__']],
 ['V18.21 Saved Recipes',['__UPC_V1821_RECIPES__']],
 ['V18.22 Controlled Variations',['__UPC_V1822_VARIATIONS__']],
 ['V18.23 Quality Analyzer',['__UPC_V1823_ANALYZER__']],
 ['V18.24 Workspace Backup',['__UPC_V1824_BACKUP__']]
];
const OPTIONAL_MARKERS=[
 ['V18.10.1 Crawling',['__UPC_V18101_POSE_CRAWL__']],
 ['V18.10.2 Pose Pack 2',['__UPC_V18102_POSE_PACK2__']],
 ['V18.12.1 Verified Real Locations',['__UPC_V18121_REAL_LOCATIONS__']]
];
const LEGACY_MARKERS=['__UPC_LIVE_DB162__','__UPC_CATALOG163__','__UPC_CATEGORY174__'];
const EXPECTED_FIELDS=['hair','makeup','expression','nails','top','bottom','footwear','accessories','pose','scene','environment','camera','lighting','realism','constraints'];

function esc(s){return String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m))}
function now(){return new Date().toISOString()}
function markerPresent(options){return options.some(m=>!!g[m])}
function moduleState(list){return list.map(([name,markers])=>({name,markers,present:markerPresent(markers)}))}
function core(){return g.UPCV18Core}
function recordCounts(){
 const out={};EXPECTED_FIELDS.forEach(f=>out[f]=0);
 const rows=core()&&Array.isArray(core().records)?core().records:[];
 for(const r of rows)if(r&&Object.prototype.hasOwnProperty.call(out,r.field))out[r.field]++;
 return{total:rows.length,fields:out,empty:EXPECTED_FIELDS.filter(f=>!out[f])};
}
function interfaceTests(){
 const tests=[
  ['V18 core search',()=>!!core()&&Array.isArray(core().records)&&typeof core().search==='function'],
  ['Integration audit API',()=>typeof g.UPCV1817?.audit==='function'],
  ['Smart stack API',()=>typeof g.UPCV1818Stack?.build==='function'],
  ['Platform presets API',()=>!!g.UPCV1819Presets&&typeof g.UPCV1819Presets==='object'],
  ['Final composer API',()=>typeof g.UPCV1820Composer?.build==='function'&&typeof g.UPCV1820Composer?.refresh==='function'],
  ['Saved recipes API',()=>typeof g.UPCV1821Recipes?.all==='function'&&typeof g.UPCV1821Recipes?.apply==='function'],
  ['Controlled variations API',()=>typeof g.UPCV1822Variations?.generate==='function'],
  ['Quality analyzer API',()=>typeof g.UPCV1823Analyzer?.analyze==='function'&&typeof g.UPCV1823Analyzer?.run==='function'],
  ['Workspace backup API',()=>typeof g.UPCV1824Backup?.makeBackup==='function'&&typeof g.UPCV1824Backup?.verifyBackup==='function']
 ];
 return tests.map(([name,fn])=>{let pass=false,error='';try{pass=!!fn()}catch(e){error=e.message}return{name,pass,error}});
}
function isolationSmoke(){
 const c=core();if(!c||typeof c.search!=='function')return[];
 const checks=[
  ['hair','ponytail','bottom'],['makeup','eyeliner','hair'],['nails','manicure','accessories'],['bottom','dolphin shorts','nails'],
  ['footwear','boots','top'],['accessories','earrings','nails'],['pose','hands and knees','camera'],['scene','bedroom','camera'],
  ['environment','shopping plaza','camera'],['camera','dolly zoom','lighting'],['lighting','Rembrandt','camera'],['realism','skin pores','camera'],['constraints','extra fingers','camera']
 ];
 return checks.map(([field,q,other])=>{let good=0,bad=0;try{good=c.search(field,q,25).length;bad=c.search(other,q,25).length}catch(_){}return{field,query:q,other,good,bad,pass:good>0&&bad===0}});
}
function runAudit(){
 const required=moduleState(REQUIRED_MARKERS),optional=moduleState(OPTIONAL_MARKERS);
 const missing=required.filter(x=>!x.present),legacy=LEGACY_MARKERS.filter(m=>!!g[m]);
 const counts=recordCounts(),interfaces=interfaceTests(),smoke=isolationSmoke();
 let v1817=null;try{v1817=typeof g.UPCV1817?.audit==='function'?g.UPCV1817.audit():null}catch(e){v1817={passed:false,error:e.message}};
 const releaseChecks={
  requiredMarkers:missing.length===0,
  noLegacySearchAuthority:legacy.length===0,
  allCategoryFieldsPopulated:counts.empty.length===0,
  interfaces:interfaces.every(x=>x.pass),
  isolationSmoke:smoke.length>0&&smoke.every(x=>x.pass),
  v1817Audit:!!v1817&&v1817.passed===true
 };
 const passed=Object.values(releaseChecks).every(Boolean);
 const report={release:RELEASE_ID,version:VERSION,generatedAt:now(),passed,releaseChecks,required,optional,missing,legacy,counts,interfaces,smoke,v1817};
 g.UPCV1825ReleaseReport=report;
 localStorage.setItem(RELEASE_KEY,JSON.stringify({release:RELEASE_ID,version:VERSION,lastAuditAt:report.generatedAt,passed,requiredModules:required.length,totalRecords:counts.total}));
 console.log('[UPC V18.25 Production Release Audit]',report);
 return report;
}
function reportText(r){
 const lines=[`${RELEASE_ID} RELEASE REPORT`,`Generated: ${r.generatedAt}`,`Status: ${r.passed?'PRODUCTION HEALTHY':'NEEDS ATTENTION'}`,`Records: ${r.counts.total}`,'','RELEASE CHECKS'];
 Object.entries(r.releaseChecks).forEach(([k,v])=>lines.push(`${v?'PASS':'FAIL'}  ${k}`));
 lines.push('','REQUIRED MODULES');r.required.forEach(x=>lines.push(`${x.present?'PASS':'FAIL'}  ${x.name}`));
 lines.push('','OPTIONAL MODULES');r.optional.forEach(x=>lines.push(`${x.present?'PASS':'SKIP'}  ${x.name}`));
 if(r.missing.length)lines.push('','MISSING',...r.missing.map(x=>x.name));
 if(r.legacy.length)lines.push('','LEGACY SEARCH MARKERS ACTIVE',...r.legacy);
 lines.push('','CATEGORY COUNTS',...Object.entries(r.counts.fields).map(([k,v])=>`${k}: ${v}`));
 lines.push('','INTERFACE TESTS',...r.interfaces.map(x=>`${x.pass?'PASS':'FAIL'}  ${x.name}${x.error?' — '+x.error:''}`));
 lines.push('','ISOLATION SMOKE',...r.smoke.map(x=>`${x.pass?'PASS':'FAIL'}  ${x.field}:${x.query} => ${x.good}; ${x.other} => ${x.bad}`));
 return lines.join('\n');
}
function copyText(text){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve()}
function productionSnapshotPath(){return '%LOCALAPPDATA%\\UltimatePromptCreatorMobile\\ProductionReleases\\V18.25\\index-v18.25-production.html'}
function restoreCommand(){return 'powershell -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\\UltimatePromptCreatorMobile\\ProductionReleases\\V18.25\\restore-v18.25-production.ps1"'}

function render(report){
 const summary=$('v1825_summary'),checks=$('v1825_checks'),mods=$('v1825_modules'),counts=$('v1825_counts');if(!summary)return;
 summary.className=report.passed?'v1825-summary good':'v1825-summary bad';
 summary.innerHTML=`<b>${report.passed?'✓ V18.25 PRODUCTION HEALTHY':'⚠ V18.25 NEEDS ATTENTION'}</b><small>${report.counts.total.toLocaleString()} records · ${report.missing.length} required modules missing · ${report.legacy.length} legacy search markers active</small>`;
 checks.innerHTML=Object.entries(report.releaseChecks).map(([k,v])=>`<div class="v1825-check"><span>${esc(k.replace(/([A-Z])/g,' $1'))}</span><b class="${v?'pass':'fail'}">${v?'PASS':'FAIL'}</b></div>`).join('');
 mods.innerHTML=report.required.map(x=>`<span class="${x.present?'on':'off'}">${x.present?'✓':'✕'} ${esc(x.name)}</span>`).join('')+report.optional.map(x=>`<span class="optional">${x.present?'✓':'○'} ${esc(x.name)}</span>`).join('');
 counts.innerHTML=Object.entries(report.counts.fields).map(([k,v])=>`<div><b>${esc(k)}</b><small>${v.toLocaleString()} records</small></div>`).join('');
}
function mount(){
 const host=$('v1820_composer')||document.querySelector('#panel-create');if(!host)return setTimeout(mount,400);if($('v1825_release_lock'))return;
 const box=document.createElement('div');box.id='v1825_release_lock';
 box.innerHTML=`<div class="v1825-head"><div><b>V18.25 Production Release Lock</b><small>Frozen software baseline + full runtime health audit + recoverable local production snapshot.</small></div><span>PRODUCTION</span></div>
 <div class="v1825-note"><b>Release lock means baseline protection, not a read-only app.</b> You can keep changing prompts, recipes and settings. The installer saved this exact software build separately so later development can be rolled back safely.</div>
 <div id="v1825_summary"></div>
 <div class="v1825-actions"><button id="v1825_audit" type="button">Run Production Audit</button><button id="v1825_report" type="button">Copy Release Report</button><button id="v1825_backup" type="button">Export Workspace Backup</button><button id="v1825_restore" type="button">Copy Restore Command</button></div>
 <details><summary>Release checks</summary><div id="v1825_checks"></div></details>
 <details><summary>Module lock</summary><div id="v1825_modules"></div></details>
 <details><summary>Database counts</summary><div id="v1825_counts"></div></details>
 <div class="v1825-path"><b>Production snapshot:</b><code>${esc(productionSnapshotPath())}</code></div>`;
 host.appendChild(box);
 const style=document.createElement('style');style.id='v1825_style';style.textContent=`
 #v1825_release_lock{margin-top:12px;border:2px solid #0f172a;border-radius:15px;padding:13px;background:#f8fafc;font:12px system-ui;color:#0f172a}.v1825-head{display:flex;justify-content:space-between;gap:12px;align-items:start}.v1825-head b{font-size:16px}.v1825-head small{display:block;color:#64748b;margin-top:2px}.v1825-head>span{font-size:9px;font-weight:950;background:#0f172a;color:white;border-radius:999px;padding:6px 9px}.v1825-note{margin:10px 0;padding:9px;border-radius:9px;background:#e0f2fe;color:#075985}.v1825-summary{padding:10px;border-radius:10px;margin-bottom:9px}.v1825-summary.good{background:#dcfce7;color:#166534}.v1825-summary.bad{background:#fee2e2;color:#991b1b}.v1825-summary small{display:block;margin-top:2px}.v1825-actions{display:flex;gap:7px;flex-wrap:wrap}.v1825-actions button{border:0;border-radius:8px;padding:8px 10px;font-weight:800;background:#1d4ed8;color:white}.v1825-actions #v1825_restore{background:#475569}.v1825-actions #v1825_backup{background:#0f766e}#v1825_release_lock details{margin-top:9px;border-top:1px solid #e2e8f0;padding-top:8px}#v1825_release_lock summary{cursor:pointer;font-weight:850}.v1825-check{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid #f1f5f9}.v1825-check .pass{color:#15803d}.v1825-check .fail{color:#b91c1c}#v1825_modules{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}#v1825_modules span{font-size:10px;border-radius:999px;padding:5px 7px;background:#dcfce7;color:#166534}#v1825_modules .off{background:#fee2e2;color:#991b1b}#v1825_modules .optional{background:#e0e7ff;color:#3730a3}#v1825_counts{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px;margin-top:7px}#v1825_counts>div{border:1px solid #e2e8f0;background:white;border-radius:8px;padding:7px}#v1825_counts small{display:block;color:#64748b}.v1825-path{margin-top:10px;padding:8px;border-radius:8px;background:#f1f5f9}.v1825-path code{display:block;word-break:break-all;margin-top:3px;font-size:10px}@media(max-width:650px){.v1825-actions>*{width:100%}}
 `;document.head.appendChild(style);
 function refresh(){const r=runAudit();render(r);return r}
 $('v1825_audit').onclick=refresh;
 $('v1825_report').onclick=()=>copyText(reportText(refresh()));
 $('v1825_backup').onclick=async()=>{try{if(typeof g.UPCV1824Backup?.exportBackup!=='function')throw new Error('Workspace Backup API is unavailable.');await g.UPCV1824Backup.exportBackup();const b=$('v1825_backup');const old=b.textContent;b.textContent='Backup Exported';setTimeout(()=>b.textContent=old,1200)}catch(e){alert(e.message)}};
 $('v1825_restore').onclick=()=>{copyText(restoreCommand());const b=$('v1825_restore'),old=b.textContent;b.textContent='Restore Command Copied';setTimeout(()=>b.textContent=old,1200)};
 refresh();
 g.UPCV1825Release={version:VERSION,releaseId:RELEASE_ID,runAudit,reportText,restoreCommand,productionSnapshotPath};
 console.log('[UPC V18.25 Production Release Lock] mounted');
}
function boot(){setTimeout(mount,2200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
