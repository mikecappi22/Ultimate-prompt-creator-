/* UPC V18.3 MAKEUP EXPANSION — data-only category module. No UI search authority, observers, or global DB routing. */
(function(g){'use strict';if(g.__UPC_V183_MAKEUP__)return;g.__UPC_V183_MAKEUP__=1;
const SOURCES=[
 {name:'Makeup_Color_Database.csv',url:'https://raw.githubusercontent.com/mikecappi22/Ultimate-prompt-creator-/main/Makeup_Color_Database.csv',kind:'makeup'}
];
function parseCSV(text){const rows=[];let row=[],v='',quoted=false;for(let i=0;i<String(text||'').length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){v+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(v);v='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(v);if(row.some(x=>String(x).trim()))rows.push(row);row=[];v='';}else v+=c;}row.push(v);if(row.some(x=>String(x).trim()))rows.push(row);return rows;}
function norm(s){return String(s||'').replace(/^\uFEFF/,'').trim();}
function indexOfAny(headers,names){for(const n of names){const i=headers.indexOf(n);if(i>=0)return i;}return-1;}
function rowsToRecords(text,source){const rows=parseCSV(text);if(rows.length<2)return[];const headers=rows.shift().map(x=>norm(x).toLowerCase());const iMajor=indexOfAny(headers,['major category','category']);const iSub=indexOfAny(headers,['subcategory','sub category']);const iKeyword=indexOfAny(headers,['keyword','term','name','title']);const iPhrase=indexOfAny(headers,['prompt-ready phrase','prompt ready phrase','phrase','description']);const iTags=indexOfAny(headers,['tags','tag']);if(iKeyword<0)throw new Error(source.name+' has no Keyword column');return rows.map(r=>{const keyword=norm(r[iKeyword]);if(!keyword)return null;const major=iMajor>=0?norm(r[iMajor]):'';const sub=iSub>=0?norm(r[iSub]):source.kind;return{keyword,field:'makeup',subcategory:[major,sub].filter(Boolean).join(' / ')||source.kind,source:source.name,confidence:1,phrase:iPhrase>=0?norm(r[iPhrase]):'',tags:iTags>=0?norm(r[iTags]):''};}).filter(Boolean);}
function status(message,good=true){setTimeout(()=>{const box=document.getElementById('v181_box_makeup');if(!box)return;let e=document.getElementById('v183_makeup_status');if(!e){e=document.createElement('div');e.id='v183_makeup_status';e.style.cssText='font-size:10px;font-weight:800;margin-top:6px;padding:6px 8px;border-radius:9px;background:#eef2ff;color:#3730a3';box.appendChild(e);}e.textContent=message;e.style.background=good?'#dcfce7':'#fff7ed';e.style.color=good?'#166534':'#9a3412';},1250);}
async function load(){const core=g.UPCV18Core;if(!core||!Array.isArray(core.records)){status('V18.3 Makeup expansion could not find the V18 core.',false);return;}const before=core.records.filter(r=>r.field==='makeup').length;const existing=new Set(core.records.filter(r=>r.field==='makeup').map(r=>String(r.keyword||'').toLowerCase().trim()));const counts={};const errors=[];for(const source of SOURCES){try{const resp=await fetch(source.url,{cache:'no-store'});if(!resp.ok)throw new Error('HTTP '+resp.status);const recs=rowsToRecords(await resp.text(),source);let added=0;for(const rec of recs){const key=rec.keyword.toLowerCase().trim();if(!key||existing.has(key))continue;existing.add(key);core.records.push(rec);added++;}counts[source.name]={rows:recs.length,added};}catch(e){errors.push(source.name+': '+e.message);counts[source.name]={rows:0,added:0,error:e.message};}}
 const after=core.records.filter(r=>r.field==='makeup').length;const cross=core.records.filter(r=>SOURCES.some(s=>s.name===r.source)&&r.field!=='makeup').length;const tests=[
  {name:'source routing',pass:cross===0,value:cross},
  {name:'makeup grew',pass:after>before,value:after-before},
  {name:'lip color search',pass:core.search('makeup','lipstick').length>0,value:core.search('makeup','lipstick').length},
  {name:'eyeshadow search',pass:core.search('makeup','eyeshadow').length>0,value:core.search('makeup','eyeshadow').length},
  {name:'bronzer search',pass:core.search('makeup','bronzer').length>0,value:core.search('makeup','bronzer').length},
  {name:'bottom isolation',pass:core.search('bottom','lipstick').length===0,value:core.search('bottom','lipstick').length},
  {name:'hair isolation',pass:core.search('hair','eyeshadow').length===0,value:core.search('hair','eyeshadow').length}
 ];
 g.UPCV18Makeup183={version:'18.3',loaded:errors.length===0,before,after,added:after-before,counts,errors,tests,passed:tests.every(t=>t.pass)};
 console.log('[UPC V18.3 Makeup]',g.UPCV18Makeup183);console.table(tests);status(errors.length?`Makeup expanded to ${after.toLocaleString()} verified terms; ${errors.length} source file failed. See console.`:`Makeup expanded: ${after.toLocaleString()} verified category-only terms (${(after-before).toLocaleString()} added).`,errors.length===0);
}
load();
})(window);