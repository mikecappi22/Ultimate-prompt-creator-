import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const url = process.env.SUBJECT_VAULT_TEST_URL || 'http://127.0.0.1:8000/tests/subject-vault-harness.html';

function assert(cond, msg){ if(!cond) throw new Error(msg); }
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAGElEQVR42mNk+M9QzwAEYBxVSFUBAAAlXQMBx0cAAAAASUVORK5CYII=', 'base64');
page.on('console', m => console.log('BROWSER CONSOLE:', m.type(), m.text()));
page.on('pageerror', e => console.log('BROWSER PAGEERROR:', e.message));

async function rawPhotoState(){
  return page.evaluate(async()=>{
    const active=localStorage.getItem('upc_subject_vault_active_v131');
    const subjects=localStorage.getItem('upc_subject_vault_v131');
    const records=await new Promise((resolve,reject)=>{
      const r=indexedDB.open('UPCSubjectVaultV131',1);
      r.onsuccess=()=>{
        const db=r.result;
        const tx=db.transaction('photos','readonly');
        const q=tx.objectStore('photos').getAll();
        q.onsuccess=()=>resolve(q.result||[]);
        q.onerror=()=>reject(q.error);
      };
      r.onerror=()=>reject(r.error);
    });
    return {active,subjects,records:records.map(x=>({id:x.id,subjectId:x.subjectId,name:x.name,width:x.width,height:x.height,dataPrefix:String(x.dataUrl||'').slice(0,30)}))};
  });
}

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#subjectVaultV132', { timeout: 15000 });
  await page.waitForSelector('#svPasteProfileBtn', { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#svPhotoCount')?.textContent?.includes('0/8'));
  assert(await page.locator('#svName').inputValue() === 'ADDISON', 'ADDISON was not seeded');
  assert(await page.locator('#svType').inputValue() === 'Adult woman', 'ADDISON type is wrong');
  assert(await page.locator('#svFace').inputValue() === '', 'ADDISON face should start blank');
  assert(await page.locator('#svHair').inputValue() === '', 'ADDISON hair should start blank');

  // Verify V13.2 local photo storage first.
  await page.locator('#svPhotoInput').setInputFiles({name:'addison-test-reference.png',mimeType:'image/png',buffer:png});
  await page.waitForFunction(() => document.querySelector('#svPhotoCount')?.textContent?.includes('1/8'), null, {timeout:15000});
  let raw=await rawPhotoState();
  assert(raw.records.length === 1 && raw.records[0].subjectId === 'addison', 'IndexedDB record is missing or assigned to the wrong subject');

  // Now apply a ChatGPT-style profile JSON through V13.3 and ensure the photo is untouched.
  const profile={
    subject_profile_version:'1.0',
    display_name:'ADDISON',
    subject_type:'Adult woman',
    tags:['athletic','editorial'],
    facial_geometry:'soft oval face with defined cheekbones',
    eyes:'light blue-gray eyes, almond-shaped',
    hair:'long brunette hair with dimensional highlights',
    skin_appearance:'warm natural skin tone with visible texture',
    body_proportions:'athletic, lean, toned build',
    distinguishing_features:['small wrist tattoo','subtle nose piercing'],
    personality_camera_presence:['confident','playful','candid'],
    continuity_rules:['preserve established face','preserve eye color','preserve distinguishing features'],
    reference_notes:'Profile generated from visible reference traits only.'
  };
  await page.locator('#svPasteProfileBtn').click();
  await page.locator('#svProfileJson').fill(JSON.stringify(profile,null,2));
  await page.locator('#svProfileApply').click();
  await page.waitForFunction(() => document.querySelector('#svProfilePasteStatus')?.textContent?.includes('applied to ADDISON'));
  assert((await page.locator('#svFace').inputValue()).includes('defined cheekbones'), 'Face was not prefilled');
  assert((await page.locator('#svEyes').inputValue()).includes('blue-gray'), 'Eyes were not prefilled');
  assert((await page.locator('#svHair').inputValue()).includes('dimensional highlights'), 'Hair was not prefilled');
  assert((await page.locator('#svBody').inputValue()).includes('athletic'), 'Body/proportions were not prefilled');
  assert((await page.locator('#svDistinguishing').inputValue()).includes('nose piercing'), 'Distinguishing features were not prefilled');
  assert((await page.locator('#svPhotoCount').textContent()).includes('1/8'), 'Profile prefill disturbed the local photo count');
  raw=await rawPhotoState();
  assert(raw.records.length === 1, 'Profile prefill modified or deleted the local photo record');

  // Reload and verify both text profile and local photo persist together.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#subjectVaultV132', { timeout: 15000 });
  await page.waitForSelector('#svPasteProfileBtn', { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#svPhotoCount')?.textContent?.includes('1/8'));
  assert(await page.locator('#svPhotos .sv-photo img').count() === 1, 'Photo did not survive reload');
  assert((await page.locator('#svFace').inputValue()).includes('defined cheekbones'), 'Prefilled face did not survive reload');
  assert((await page.locator('#svHair').inputValue()).includes('dimensional highlights'), 'Prefilled hair did not survive reload');
  const src = await page.locator('#svPhotos .sv-photo img').getAttribute('src');
  assert(src?.startsWith('data:image/jpeg;base64,'), 'Reference thumbnail is not stored/rendered as a local JPEG data URL');

  // Delete photo and ensure deletion persists without removing the profile text.
  await page.locator('#svPhotos .sv-photo button').click();
  await page.waitForFunction(() => document.querySelector('#svPhotoCount')?.textContent?.includes('0/8'));
  assert(await page.locator('#svPhotos .sv-photo img').count() === 0, 'Photo did not disappear after deletion');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#subjectVaultV132', { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#svPhotoCount')?.textContent?.includes('0/8'));
  assert(await page.locator('#svPhotos .sv-photo img').count() === 0, 'Deleted photo returned after reload');
  assert((await page.locator('#svFace').inputValue()).includes('defined cheekbones'), 'Deleting photo unexpectedly removed profile metadata');
  const afterDelete=await rawPhotoState();
  assert(afterDelete.records.length === 0, 'Deleted IndexedDB record still exists');
  console.log('SUBJECT VAULT V13.3 PROFILE PREFILL + STORAGE TEST PASS');
} finally {
  await browser.close();
}
