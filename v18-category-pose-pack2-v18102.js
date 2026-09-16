/* UPC V18.10.2 POSE ADD-ON PACK 2 — floor, lying/lounging, bent-over, stretching/yoga. */
(function(g){'use strict';if(g.__UPC_V18102_POSE_PACK2__)return;g.__UPC_V18102_POSE_PACK2__=1;
const SOURCE='V18.10.2 Pose Add-On Pack 2';
const FLOOR=[
['seated on floor with legs extended','sitting on the floor with both legs extended naturally forward'],
['seated on floor with legs to one side','sitting on the floor with both legs folded toward one side'],
['kneeling on floor','kneeling naturally on the floor with upright posture'],
['kneeling and leaning forward','kneeling while the torso leans slightly forward'],
['deep crouch on floor','settled into a low compact crouch close to the floor'],
['floor squat with elbows on knees','holding a low squat with elbows resting lightly on the knees'],
['one knee down floor pose','posed low to the floor with one knee down and one foot planted'],
['cross-legged floor pose','sitting cross-legged on the floor with relaxed posture'],
['side-seated floor pose','sitting on the floor in a side-seated pose'],
['reclining on floor','reclining on the floor with relaxed limb placement'],
['lying on stomach on floor','lying face-down on the floor with natural body placement'],
['lying on back on floor','lying flat on the back on the floor with relaxed posture'],
['side-lying floor pose','lying on one side on the floor with relaxed alignment'],
['prone floor pose on elbows','lying face-down on the floor supported by the elbows'],
['supine floor pose knees bent','lying on the back with knees bent and feet planted'],
['floor pose with one knee raised','posed low on the floor with one knee raised upward'],
['floor pose with legs tucked','posed on the floor with both legs tucked comfortably inward'],
['floor pose with legs stretched long','posed on the floor with both legs stretched long'],
['floor pose with torso twist','posed low on the floor with a gentle torso twist'],
['curling into floor pose','curled gently into a compact pose close to the floor']
];
const LOUNGE=[
['lying on side propped on elbow','lying on one side with the upper body propped on one elbow'],
['lying on stomach propped on elbows','lying on the stomach while supported by both elbows'],
['lying on back with one knee bent','lying on the back with one knee bent and the other leg relaxed'],
['lying on back with legs crossed at ankles','lying on the back with ankles crossed naturally'],
['lying on side with knees bent','lying on one side with knees bent comfortably'],
['reclining on sofa','reclining naturally on a sofa with a relaxed torso'],
['lounging on sofa','lounging casually across a sofa in an unforced pose'],
['lounging on bed','lounging casually on a bed with natural body placement'],
['lying across bed','lying diagonally or horizontally across a bed'],
['sprawled across bed','sprawled casually across a bed with relaxed limbs'],
['curled up on sofa','curled up on a sofa in a compact lounging pose'],
['reclining against pillows','reclining with the upper body supported by pillows'],
['side-lying on sofa','lying on one side on a sofa with relaxed support'],
['stomach-down lounging pose','lounging face-down with the head lifted slightly'],
['lounging with legs kicked up','lounging with lower legs bent upward behind the body'],
['reclining with one arm behind head','reclining while one arm rests behind the head'],
['reclining with both arms overhead','reclining with both arms extended overhead naturally'],
['laying on side looking back','lying on one side while turning the head back toward camera'],
['resting on chaise lounge','resting in a relaxed pose on a chaise lounge'],
['casual lounging pose','a natural relaxed lounging pose with believable asymmetry']
];
const BENT=[
['bent over at waist','hinged forward at the waist with realistic spinal alignment'],
['bent forward with hands on knees','leaning forward with both hands resting on the knees'],
['bent forward with hands on thighs','leaning forward with hands braced lightly on the thighs'],
['forward hip hinge pose','folded forward from the hips in a controlled hinge'],
['touching toes pose','bending forward toward the toes with natural flexibility'],
['slight forward bend','a gentle forward bend through the torso'],
['bent over looking back','bent forward while turning the head to look back'],
['hands-on-knees bent pose','bent forward with both hands planted on the knees'],
['athletic bent-over stance','in a ready athletic bent-over stance with knees slightly flexed'],
['bent-over pose with arched back','a bent-over pose with controlled back arch'],
['bent-over pose with straight back','a bent-over pose maintaining a flatter back line'],
['bent-over side angle pose','bending forward while torso angles slightly to one side'],
['resting bent over after workout','bent forward in a recovery posture after exertion'],
['bending to pick something up','reaching downward in a natural bending motion'],
['bending over counter','leaning forward over a counter with hands supported'],
['bending over bed','leaning forward over the edge of a bed'],
['stooped forward candid pose','a candid slightly stooped forward posture'],
['leaning forward from seated position','folding forward naturally while seated'],
['seated bent-over stretch','seated while bending forward over the legs'],
['bent-over glance over shoulder','bent over while glancing back over one shoulder']
];
const STRETCH=[
['downward dog pose','an inverted V yoga pose with hands and feet grounded'],
['childs pose','kneeling and folding back into a child’s-pose stretch'],
['cobra pose','lying prone and pressing the chest upward into a cobra pose'],
['sphinx pose','lying prone propped on forearms in a sphinx stretch'],
['cat pose','rounded-spine tabletop cat pose'],
['cow pose','arched-spine tabletop cow pose'],
['cat-cow stretch','alternating between cat and cow spinal movement'],
['tabletop stretch','a stable tabletop position used for stretching'],
['seated forward fold','sitting with legs extended and folding forward over them'],
['standing quad stretch','standing while holding one foot behind to stretch the quad'],
['hamstring stretch','stretching through the hamstrings with controlled posture'],
['calf stretch','stretching the calf with one leg extended back'],
['hip flexor stretch','lunging stretch targeting the hip flexors'],
['lunge stretch','a long lunge used as a stretch position'],
['pigeon pose','a yoga pigeon pose opening the hip'],
['butterfly stretch','seated with soles together in a butterfly stretch'],
['side stretch standing','standing while reaching into a side-body stretch'],
['overhead stretch','arms lifted overhead in a full-body stretch'],
['torso twist stretch','a controlled stretch with the torso rotating'],
['side-bending stretch','a gentle side-bending stretch through the torso'],
['back arch stretch','arching through the spine in a controlled stretch'],
['bridge pose','lifting the hips into a yoga bridge pose'],
['happy baby pose','lying on the back holding the feet in a happy baby pose'],
['supine twist stretch','lying on the back in a gentle spinal twist'],
['standing toe-touch stretch','standing and folding forward to reach toward the toes'],
['wall stretch','using a wall for support during a stretch'],
['shoulder stretch across chest','drawing one arm across the chest in a shoulder stretch'],
['triceps stretch overhead','one arm bent overhead in a triceps stretch'],
['neck stretch','gently tilting the head for a neck stretch'],
['yoga flow transition','caught naturally transitioning between yoga poses']
];
function status(message, good=true){
  setTimeout(()=>{
    const box=document.getElementById('v181_box_pose');
    if(!box) return;
    let e=document.getElementById('v18102_pose_status');
    if(!e){
      e=document.createElement('div');
      e.id='v18102_pose_status';
      e.style.cssText='font-size:10px;font-weight:800;margin-top:6px;padding:6px 8px;border-radius:9px';
      box.appendChild(e);
    }
    e.textContent=message;
    e.style.background=good?'#dcfce7':'#fff7ed';
    e.style.color=good?'#166534':'#9a3412';
  },900);
}
function load(){
  const core=g.UPCV18Core;
  if(!core || !Array.isArray(core.records) || typeof core.search!=='function'){
    status('V18.10.2 pose add-on could not find the V18 core.', false);
    return;
  }
  const before=core.records.filter(r=>r.field==='pose').length;
  const existing=new Set(core.records.filter(r=>r.field==='pose').map(r=>String(r.keyword||'').toLowerCase().trim()));
  let added=0;
  function add(keyword,subcategory,phrase,tags='pose add-on pack 2'){
    keyword=String(keyword||'').trim();
    if(!keyword) return;
    const key=keyword.toLowerCase();
    if(existing.has(key)) return;
    existing.add(key);
    core.records.push({keyword,field:'pose',subcategory,source:SOURCE,confidence:1,phrase:String(phrase||keyword),tags});
    added++;
  }
  FLOOR.forEach(x=>add(x[0],'Floor Poses',x[1],'pose floor ground'));
  LOUNGE.forEach(x=>add(x[0],'Lying / Lounging',x[1],'pose lying lounging reclining'));
  BENT.forEach(x=>add(x[0],'Bent-Over Poses',x[1],'pose bent-over forward hinge'));
  STRETCH.forEach(x=>add(x[0],'Stretching / Yoga',x[1],'pose stretch yoga flexibility'));
  const after=core.records.filter(r=>r.field==='pose').length;
  const tests=[
    {name:'pose grew',pass:after>before,value:after-before},
    {name:'floor search',pass:core.search('pose','floor').length>0,value:core.search('pose','floor').length},
    {name:'lounging search',pass:core.search('pose','lounging').length>0,value:core.search('pose','lounging').length},
    {name:'bent search',pass:core.search('pose','bent').length>0,value:core.search('pose','bent').length},
    {name:'yoga search',pass:core.search('pose','yoga').length>0 || core.search('pose','downward dog').length>0,value:core.search('pose','downward dog').length},
    {name:'bottom isolation',pass:core.search('bottom','downward dog').length===0,value:core.search('bottom','downward dog').length},
    {name:'camera isolation',pass:core.search('camera','lounging on sofa').length===0,value:core.search('camera','lounging on sofa').length},
    {name:'nails isolation',pass:core.search('nails','bridge pose').length===0,value:core.search('nails','bridge pose').length}
  ];
  g.UPCV18102PosePack2={version:'18.10.2',before,after,added,source:SOURCE,tests,passed:tests.every(t=>t.pass)};
  console.log('[UPC V18.10.2 Pose Pack 2]',g.UPCV18102PosePack2);
  console.table(tests);
  status(`Pose expanded with floor / lying / bent-over / stretching-yoga terms: ${after.toLocaleString()} verified pose terms (${added.toLocaleString()} added).`, g.UPCV18102PosePack2.passed);
}
load();
})(window);
