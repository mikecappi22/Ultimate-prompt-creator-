import { chromium } from 'playwright';
import fs from 'node:fs';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({acceptDownloads:true});
const page=await context.newPage();
const url=process.env.TEST_URL||'http://127.0.0.1:8000/tests/photo-backup-harness-v141.html';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAGElEQVR42mNk+M9QzwAEYBxVSFUBAAAlXQMBx0cAAAAASUVORK5CYII=','base64');
function assert(cond,msg){if(!cond)throw new Error(msg)}
try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#subjectVaultV132',{timeout:15000});
  await page.waitForSelector('#svExportPhotoBackup',{timeout:15000});
  await page.locator('#svPhotoInput').setInputFiles({name:'addison-reference.png',mimeType:'image/png',buffer:png});
  await page.waitForFunction(()=>document.querySelector('#svPhotoCount')?.textContent?.includes('1/8'),null,{timeout:15000});
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#svExportPhotoBackup').click();
  const download=await downloadPromise;
  const backupPath=await download.path();
  assert(backupPath,'Backup download path missing');
  const payload=JSON.parse(fs.readFileSync(backupPath,'utf8'));
  assert(payload.type==='UPC_SUBJECT_PHOTO_BACKUP','Wrong backup type');
  assert(payload.photoCount===1,'Expected one exported photo');
  assert(payload.photos?.[0]?.subjectId==='addison','Photo subjectId not preserved');
  assert(String(payload.photos?.[0]?.dataUrl||'').startsWith('data:image/jpeg;base64,'),'Photo data missing from backup');

  await page.locator('#svPhotos .sv-photo button').click();
  await page.waitForFunction(()=>document.querySelector('#svPhotoCount')?.textContent?.includes('0/8'));

  const beforeReload=page.waitForEvent('load');
  await page.locator('#svPhotoBackupFile').setInputFiles({name:'subject-photos.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
  await beforeReload;
  await page.waitForSelector('#subjectVaultV132',{timeout:15000});
  await page.waitForFunction(()=>document.querySelector('#svPhotoCount')?.textContent?.includes('1/8'),null,{timeout:15000});
  assert(await page.locator('#svPhotos .sv-photo img').count()===1,'Imported backup thumbnail missing');
  const raw=await page.evaluate(async()=>new Promise((resolve,reject)=>{const r=indexedDB.open('UPCSubjectVaultV131',1);r.onsuccess=()=>{const tx=r.result.transaction('photos','readonly'),q=tx.objectStore('photos').getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error)};r.onerror=()=>reject(r.error)}));
  assert(raw.length===1&&raw[0].subjectId==='addison','Imported IndexedDB record missing/wrong subject');
  console.log('V14.1 PHOTO BACKUP ROUND TRIP PASS');
} finally {
  await browser.close();
}
