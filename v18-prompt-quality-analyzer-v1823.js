/* UPC V18.23 PROMPT QUALITY ANALYZER */
(function(g){'use strict';if(g.__UPC_V1823_ANALYZER__)return;g.__UPC_V1823_ANALYZER__=1;

const VERSION='18.23';
const $=id=>document.getElementById(id);
const FIELD_IDS={
 hair:'uc_hair',makeup:'uc_makeup',expression:'uc_expression',nails:'uc_nails',
 top:'uc_top',bottom:'uc_bottom',footwear:'uc_footwear',accessories:'uc_accessories',
 pose:'uc_pose',scene:'uc_scene',environment:'uc_environment',camera:'uc_camera',
 lighting:'uc_lighting',realism:'uc_realism',constraints:'uc_constraints'
};
const WEIGHTS={identity:15,cameraLighting:20,realism:20,continuity:15,composition:10,conflicts:10,efficiency:10};

function val(id){return String($(id)?.value||'').trim()}
function norm(s){return String(s||'').toLowerCase().replace(/[\s,;:.\-–—_/()\[\]]+/g,' ').trim()}
function hasAny(text,terms){const t=norm(text);return terms.some(x=>t.includes(norm(x)))}
function esc(s){return String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m))}
function words(text){return String(text||'').trim().split(/\s+/).filter(Boolean)}
function fields(){const o={};for(const [k,id] of Object.entries(FIELD_IDS))o[k]=val(id);o.target=val('uc_target')||'Universal';o.aspect=val('uc_aspect')||'2:3';return o}
function promptText(){return String($('v1820_text')?.value||g.UPCV1820Composer?.build?.({})||'').trim()}
function identityText(){return String(val('uc_subject_lock')||localStorage.getItem('upc_reference_identity_lock_v1822')||'').trim()}
function pushIssue(list,severity,category,message,fix){list.push({severity,category,message,fix})}
function clamp(n){return Math.max(0,Math.min(100,Math.round(n)))}

function duplicateAnalysis(text){
 const raw=String(text||'');
 const chunks=raw.split(/[\n,;]+/).map(x=>norm(x)).filter(x=>x.length>=10);
 const seen=new Map(),dups=[];
 for(const c of chunks){const n=(seen.get(c)||0)+1;seen.set(c,n)}
 for(const [phrase,count] of seen)if(count>1)dups.push({phrase,count});
 const tokens=words(norm(raw));const grams=new Map();
 for(let n=3;n<=5;n++)for(let i=0;i<=tokens.length-n;i++){const gram=tokens.slice(i,i+n).join(' ');if(gram.length<18)continue;grams.set(gram,(grams.get(gram)||0)+1)}
 const repeatedNgrams=[...grams.entries()].filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([phrase,count])=>({phrase,count}));
 return {exactChunks:dups,repeatedNgrams};
}
function contradictionChecks(s,text){
 const issues=[];const cam=norm(s.camera),light=norm(s.lighting),env=norm(s.scene+' '+s.environment),cons=norm(s.constraints),full=norm(text);
 if(hasAny(cam,['deep focus'])&&hasAny(cam,['shallow depth','shallow focus']))pushIssue(issues,'high','Camera','Deep focus and shallow depth of field are both requested.','Choose one depth-of-field behavior for the shot.');
 if(hasAny(cam,['static camera','locked off','lock-off'])&&hasAny(cam,['handheld','tracking','orbit','dolly','crane','push in','pull back','pan','tilt']))pushIssue(issues,'high','Camera','Static/locked camera conflicts with active camera movement.','Keep either a locked camera or a defined moving-camera instruction.');
 if(hasAny(env,['night','midnight'])&&hasAny(light,['midday','morning sunlight','golden hour sunlight']))pushIssue(issues,'high','Lighting','Night environment conflicts with daylight-specific lighting.','Align lighting time-of-day with the scene.');
 if(hasAny(env,['midday','noon'])&&hasAny(light,['moonlit','blue hour']))pushIssue(issues,'high','Lighting','Midday scene conflicts with moonlight/blue-hour lighting.','Use one coherent time-of-day.');
 if(hasAny(cons,['no portrait mode','no artificial portrait blur'])&&hasAny(cam,['portrait mode','artificial portrait blur']))pushIssue(issues,'high','Camera','Constraint rejects the same portrait-blur behavior requested by Camera.','Remove the contradictory camera or constraint phrase.');
 if(hasAny(cons,['single subject only','one subject only','no random background people'])&&hasAny(env,['crowd','packed venue','group of people']))pushIssue(issues,'medium','Continuity','Subject-count constraint may conflict with a crowd-heavy environment.','Specify background people only if intentionally required.');
 if(hasAny(cons,['no text','no readable text'])&&hasAny(env,['signage','billboard','store sign','logo']))pushIssue(issues,'medium','Environment','Text restrictions may conflict with requested signage.','Clarify whether signage should be unreadable, generic, or accurate.');
 if(hasAny(full,['no blur'])&&hasAny(full,['motion blur','shallow depth of field']))pushIssue(issues,'medium','Optics','A broad “no blur” rule can fight legitimate optical or motion blur.','Use a narrower rule such as “no artificial portrait blur.”');
 const upstream=g.UPCV1820Composer?.contradictionWarnings?.(s,val('v1820_preset'))||[];
 for(const m of upstream)if(!issues.some(x=>x.message===m))pushIssue(issues,'medium','Composer',m,'Resolve the contradictory selections before generation.');
 return issues;
}

function analyze(inputText){
 const text=String(inputText??promptText()).trim(),s=fields(),id=identityText(),issues=[];
 const breakdown={identity:0,cameraLighting:0,realism:0,continuity:0,composition:0,conflicts:0,efficiency:0};

 let idPts=0;
 if(id)idPts+=4;else pushIssue(issues,'high','Identity','Reference Identity Lock is missing.','Restore the always-on reference identity stack.');
 if(hasAny(id,['facial geometry','recognizable','identity']))idPts+=3;else pushIssue(issues,'medium','Identity','Identity instructions do not explicitly preserve recognizable facial geometry.','Add a precise facial identity preservation rule.');
 if(hasAny(id,['body composition','silhouette','muscle mass','waist to hip','body proportions']))idPts+=4;else pushIssue(issues,'high','Body Composition','Body composition is not explicitly locked.','Preserve the reference body composition, silhouette and relative proportions.');
 if(hasAny(id,['do not invent','not visible','unseen traits']))idPts+=2;else pushIssue(issues,'medium','Identity','The prompt does not clearly prohibit inventing unseen traits.','Add “if a trait is not visible in the reference, do not invent it.”');
 if(hasAny(id,['tattoos','scars','freckles','piercings','distinguishing']))idPts+=2;
 breakdown.identity=Math.round(idPts/15*100);

 let clPts=0;
 if(s.camera){clPts+=6;if(hasAny(s.camera,['mm','iphone','lens','camera']))clPts+=2;if(hasAny(s.camera,['angle','eye level','low angle','high angle','three quarter','framing','close up','full body','waist up','rear','front']))clPts+=2;}else pushIssue(issues,'high','Camera','No camera/framing instruction is selected.','Add camera perspective, framing and/or lens language.');
 if(s.lighting){clPts+=6;if(hasAny(s.lighting,['side','back','rim','front','window','overhead','three quarter','45']))clPts+=2;if(hasAny(s.lighting,['soft','hard','diffused','natural','studio','golden','overcast','practical']))clPts+=2;}else pushIssue(issues,'high','Lighting','No lighting instruction is selected.','Add a coherent lighting source, direction and quality.');
 breakdown.cameraLighting=Math.round(clPts/20*100);

 let realPts=0;
 if(s.realism)realPts+=5;else pushIssue(issues,'high','Realism','Realism / Texture is empty.','Add a small realism stack instead of relying on “photorealistic” alone.');
 const realismCorpus=norm(s.realism+' '+s.constraints+' '+text);
 const realGroups=[
  ['skin texture','visible skin pores','pores','ordinary skin imperfections'],
  ['fabric texture','clothing wrinkles','material response','tactile materials'],
  ['contact shadows','shadow falloff','physically believable reflections','realistic reflections'],
  ['sensor noise','smartphone compression','film grain','highlight rolloff','minor exposure imperfections'],
  ['natural asymmetry','flyaway hairs','individual hair strands','micro imperfections']
 ];
 for(const group of realGroups)if(hasAny(realismCorpus,group))realPts+=3;
 breakdown.realism=Math.round(Math.min(20,realPts)/20*100);
 if(realPts<11)pushIssue(issues,'medium','Realism','Realism stack is thin; it may produce a polished synthetic look.','Add 2–3 physical texture cues plus 1 optical imperfection cue.');

 let contPts=0;
 const cont=norm(s.constraints+' '+id+' '+text);
 if(hasAny(cont,['identity','identity drift','same person','reference identity']))contPts+=3;
 if(hasAny(cont,['body composition','body proportions','silhouette']))contPts+=3;
 if(hasAny(cont,['anatomy','hands','fingers','limbs']))contPts+=3;else pushIssue(issues,'medium','Anatomy','No explicit anatomy/hand safeguard detected.','Add realistic anatomy plus correct hands/fingers.');
 if(hasAny(cont,['wardrobe continuity','maintain wardrobe','wardrobe']))contPts+=2;
 if(hasAny(cont,['environment continuity','maintain environment','scene continuity','lighting continuity']))contPts+=2;
 if(hasAny(cont,['no duplicate','duplicate limbs','extra fingers','extra limbs']))contPts+=2;
 breakdown.continuity=Math.round(contPts/15*100);

 let compPts=0;
 if(s.pose)compPts+=2;else pushIssue(issues,'medium','Pose','No pose/action instruction is selected.','Add the intended body action or candid behavior.');
 if(s.scene||s.environment)compPts+=2;else pushIssue(issues,'medium','Scene','Scene and environment are both empty.','Describe where the subject is and what is happening.');
 if(s.top||s.bottom||s.footwear||s.accessories)compPts+=2;
 if(s.expression)compPts+=1;
 if(s.aspect)compPts+=1;
 if(s.target)compPts+=1;
 if(val('v1820_preset'))compPts+=1;
 breakdown.composition=Math.round(compPts/10*100);

 const conflicts=contradictionChecks(s,text);issues.push(...conflicts);
 let conflictPts=10;
 conflictPts-=conflicts.filter(x=>x.severity==='high').length*4;
 conflictPts-=conflicts.filter(x=>x.severity==='medium').length*2;
 conflictPts-=conflicts.filter(x=>x.severity==='low').length;
 breakdown.conflicts=Math.round(Math.max(0,conflictPts)/10*100);

 const dup=duplicateAnalysis(text),wc=words(text).length,chars=text.length;
 let effPts=10;
 if(dup.exactChunks.length){effPts-=Math.min(4,dup.exactChunks.length*2);pushIssue(issues,'medium','Repetition',`${dup.exactChunks.length} exact prompt phrase${dup.exactChunks.length===1?'':'s'} repeat.`,`Remove duplicate phrases: ${dup.exactChunks.slice(0,3).map(x=>'“'+x.phrase+'”').join(', ')}`)}
 if(dup.repeatedNgrams.length>=4){effPts-=2;pushIssue(issues,'low','Repetition','Several 3–5 word phrases recur repeatedly.','Condense redundant quality/identity language while keeping the strongest instruction once.');}
 if(wc>950||chars>6500){effPts-=4;pushIssue(issues,'medium','Prompt Length',`Prompt is ${wc} words / ${chars} characters and may be overstuffed.`,'Use the Compact format or remove repeated modifiers and overlapping constraints.');}
 else if(wc>700||chars>5000){effPts-=2;pushIssue(issues,'low','Prompt Length',`Prompt is fairly long at ${wc} words / ${chars} characters.`,'Keep each concept once and prefer concrete visual instructions over stacked synonyms.');}
 if(wc<80){effPts-=2;pushIssue(issues,'low','Prompt Depth',`Prompt is only ${wc} words.`,'Add missing scene, camera, lighting, realism or continuity detail if the result is under-specified.');}
 breakdown.efficiency=Math.round(Math.max(0,effPts)/10*100);

 const weighted=(breakdown.identity*WEIGHTS.identity+breakdown.cameraLighting*WEIGHTS.cameraLighting+breakdown.realism*WEIGHTS.realism+breakdown.continuity*WEIGHTS.continuity+breakdown.composition*WEIGHTS.composition+breakdown.conflicts*WEIGHTS.conflicts+breakdown.efficiency*WEIGHTS.efficiency)/100;
 const score=clamp(weighted);
 const high=issues.filter(x=>x.severity==='high').length,medium=issues.filter(x=>x.severity==='medium').length,low=issues.filter(x=>x.severity==='low').length;
 const status=score>=92&&high===0?'Excellent':score>=82&&high===0?'Strong':score>=70?'Needs polish':'Needs attention';
 const result={version:VERSION,score,status,breakdown,issues,stats:{words:wc,characters:chars,exactDuplicates:dup.exactChunks.length,repeatedNgrams:dup.repeatedNgrams.length,high,medium,low},prompt:text};
 g.UPCV1823Last=result;return result;
}

function color(score){return score>=90?'#166534':score>=78?'#1d4ed8':score>=65?'#a16207':'#b91c1c'}
function render(result){
 const score=$('v1823_score'),status=$('v1823_status'),dims=$('v1823_dims'),issues=$('v1823_issues'),stats=$('v1823_stats');if(!score)return;
 score.textContent=result.score;score.style.color=color(result.score);status.textContent=result.status;status.style.color=color(result.score);
 dims.innerHTML=Object.entries(result.breakdown).map(([k,v])=>`<div class="v1823-dim"><div><b>${esc(k.replace(/([A-Z])/g,' $1'))}</b><span>${v}%</span></div><div class="v1823-bar"><i style="width:${v}%;background:${color(v)}"></i></div></div>`).join('');
 stats.textContent=`${result.stats.words} words · ${result.stats.characters} characters · ${result.stats.high} high · ${result.stats.medium} medium · ${result.stats.low} low`;
 const order={high:0,medium:1,low:2};
 const sorted=[...result.issues].sort((a,b)=>order[a.severity]-order[b.severity]);
 issues.innerHTML=sorted.length?sorted.map(x=>`<div class="v1823-issue ${x.severity}"><div><b>${esc(x.category)}</b><span>${esc(x.severity.toUpperCase())}</span></div><p>${esc(x.message)}</p><small>${esc(x.fix)}</small></div>`).join(''):'<div class="v1823-clean">✓ No quality problems detected by the V18.23 heuristic analyzer.</div>';
}
function run(){const result=analyze();render(result);return result}
function reportText(r){return [`UPC V18.23 PROMPT QUALITY REPORT`,`Score: ${r.score}/100 — ${r.status}`,`Words: ${r.stats.words} | Characters: ${r.stats.characters}`,``,`BREAKDOWN`,...Object.entries(r.breakdown).map(([k,v])=>`${k}: ${v}%`),``,`ISSUES`,...(r.issues.length?r.issues.map(x=>`[${x.severity.toUpperCase()}] ${x.category}: ${x.message}\nFix: ${x.fix}`):['None'])].join('\n')}
function copyReport(){const r=run(),text=reportText(r);if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}

let timer=null;function schedule(){clearTimeout(timer);timer=setTimeout(run,180)}
function mount(){
 const host=$('v1820_composer');if(!host)return setTimeout(mount,350);if($('v1823_analyzer'))return;
 const box=document.createElement('div');box.id='v1823_analyzer';box.innerHTML=`<div class="v1823-head"><div><b>Prompt Quality Analyzer</b><small>Preflight check for identity, body composition, camera, lighting, realism, continuity, conflicts, repetition and prompt efficiency.</small></div><div class="v1823-grade"><strong id="v1823_score">0</strong><span>/100</span><em id="v1823_status"></em></div></div><div id="v1823_stats" class="v1823-stats"></div><div id="v1823_dims" class="v1823-dims"></div><div class="v1823-actions"><button id="v1823_run" type="button">Run Analyzer</button><button id="v1823_copy" type="button">Copy Quality Report</button></div><div id="v1823_issues"></div>`;
 host.appendChild(box);
 const style=document.createElement('style');style.id='v1823_style';style.textContent=`
 #v1823_analyzer{margin-top:12px;border:1px solid #cbd5e1;border-radius:14px;padding:12px;background:#fff;font:12px system-ui}.v1823-head{display:flex;justify-content:space-between;gap:12px;align-items:start}.v1823-head>b,.v1823-head div>b{font-size:15px}.v1823-head small{display:block;color:#64748b;margin-top:2px;max-width:560px}.v1823-grade{display:grid;grid-template-columns:auto auto;align-items:baseline;justify-content:end}.v1823-grade strong{font-size:30px;line-height:1}.v1823-grade>span{color:#64748b}.v1823-grade em{grid-column:1/3;font-style:normal;font-weight:900;font-size:10px;text-align:right;margin-top:2px}.v1823-stats{margin:9px 0;padding:7px 9px;border-radius:8px;background:#f8fafc;color:#475569}.v1823-dims{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v1823-dim{border:1px solid #e2e8f0;border-radius:9px;padding:7px}.v1823-dim>div:first-child{display:flex;justify-content:space-between;gap:8px;text-transform:capitalize}.v1823-bar{height:5px;background:#e2e8f0;border-radius:99px;margin-top:5px;overflow:hidden}.v1823-bar i{display:block;height:100%;border-radius:99px}.v1823-actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.v1823-actions button{border:0;border-radius:8px;padding:8px 10px;font-weight:800;background:#1d4ed8;color:#fff}.v1823-actions button+button{background:#e2e8f0;color:#0f172a}.v1823-issue{border-radius:9px;padding:9px;margin-top:7px;border:1px solid}.v1823-issue>div{display:flex;justify-content:space-between;gap:8px}.v1823-issue>div span{font-size:9px;font-weight:900}.v1823-issue p{margin:4px 0}.v1823-issue small{color:#475569}.v1823-issue.high{background:#fef2f2;border-color:#fecaca}.v1823-issue.medium{background:#fffbeb;border-color:#fde68a}.v1823-issue.low{background:#f8fafc;border-color:#e2e8f0}.v1823-clean{padding:9px;border:1px solid #bbf7d0;background:#f0fdf4;color:#166534;border-radius:9px;font-weight:800}@media(max-width:650px){.v1823-dims{grid-template-columns:1fr}.v1823-head{display:block}.v1823-grade{display:flex;justify-content:flex-start;gap:3px;margin-top:8px}.v1823-grade em{margin-left:8px}}
 `;document.head.appendChild(style);
 $('v1823_run').onclick=run;$('v1823_copy').onclick=copyReport;
 const prompt=$('v1820_text');if(prompt)prompt.addEventListener('input',schedule);
 Object.values(FIELD_IDS).concat(['uc_target','uc_aspect','uc_subject_lock','v1820_format','v1820_media','v1820_preset']).forEach(id=>{const e=$(id);if(e){e.addEventListener('input',schedule);e.addEventListener('change',schedule)}});
 ['v1820_build','v1820_copy','v1820_workspace','v1820_director','v1822_generate'].forEach(id=>{const b=$(id);if(b)b.addEventListener('click',()=>setTimeout(run,80))});
 run();
 g.UPCV1823Analyzer={version:VERSION,analyze,run,reportText,duplicateAnalysis,contradictionChecks};
 console.log('[UPC V18.23 Prompt Quality Analyzer] mounted');
}
function boot(){setTimeout(mount,1900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
