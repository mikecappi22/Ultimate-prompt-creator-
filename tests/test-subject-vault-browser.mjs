import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const url = process.env.SUBJECT_VAULT_TEST_URL || 'http://127.0.0.1:8000/tests/subject-vault-harness.html';

function assert(cond, msg){ if(!cond) throw new Error(msg); }

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAGElEQVR42mNk+M9QzwAEYBxVSFUBAAAlXQMBx0cAAAAASUVORK5CYII=', 'base64');

page.on('console', m => console.log('BROWSER CONSOLE:', m.type(), m.text()));
page.on('pageerror', e => console.log('BROWSER PAGEERROR:', e.message));

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#subjectVaultV131', { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#svPhotoCount')?.textContent?.includes('0/8'));

  assert(await page.locator('#svName').inputValue() === 'ADDISON', 'ADDISON was not seeded');
  assert(await page.locator('#svType').inputValue() === 'Adult woman', 'ADDISON type is wrong');
  assert(await page.locator('#svFace').inputValue() === '', 'ADDISON face should start blank');
  assert(await page.locator('#svHair').inputValue() === '', 'ADDISON hair should start blank');

  await page.locator('#svHair').fill('test hair continuity field');
  await page.locator('#svSave').click();

  await page.locator('#svPhotoInput').setInputFiles({
    name: 'addison-test-reference.png',
    mimeType: 'image/png',
    buffer: png
  });

  await page.waitForTimeout(3000);
  const diagnostic = await page.evaluate(() => ({
    count: document.querySelector('#svPhotoCount')?.textContent || '',
    status: document.querySelector('#svStatus')?.textContent || '',
    thumbs: document.querySelectorAll('#svPhotos .sv-photo img').length,
    gallery: document.querySelector('#svPhotos')?.textContent || ''
  }));
  console.log('UPLOAD DIAGNOSTIC:', JSON.stringify(diagnostic));
  assert(diagnostic.count.includes('1/8'), 'Upload did not save. Diagnostic: '+JSON.stringify(diagnostic));
  assert(diagnostic.thumbs === 1, 'Saved thumbnail did not render');
  assert(diagnostic.status.toLowerCase().includes('saved locally'), 'No visible local-save confirmation');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#subjectVaultV131', { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#svPhotoCount')?.textContent?.includes('1/8'));
  assert(await page.locator('#svPhotos .sv-photo img').count() === 1, 'Photo did not survive reload');
  assert(await page.locator('#svHair').inputValue() === 'test hair continuity field', 'Subject metadata did not survive reload');

  const src = await page.locator('#svPhotos .sv-photo img').getAttribute('src');
  assert(src?.startsWith('data:image/jpeg;base64,'), 'Reference thumbnail is not stored/rendered as a local JPEG data URL');

  await page.locator('#svPhotos .sv-photo button').click();
  await page.waitForFunction(() => document.querySelector('#svPhotoCount')?.textContent?.includes('0/8'));
  assert(await page.locator('#svPhotos .sv-photo img').count() === 0, 'Photo did not disappear after deletion');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#subjectVaultV131', { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#svPhotoCount')?.textContent?.includes('0/8'));
  assert(await page.locator('#svPhotos .sv-photo img').count() === 0, 'Deleted photo returned after reload');

  console.log('SUBJECT VAULT BROWSER STORAGE TEST PASS');
} finally {
  await browser.close();
}
