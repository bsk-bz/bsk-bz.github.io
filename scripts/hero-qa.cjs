require('node:fs').mkdirSync('qa', { recursive: true });
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
 for(const colorScheme of ['light','dark']) for(const width of [375,390,430,768,1024,1440,1920]) {
  const page=await browser.newPage({viewport:{width,height:width<701?844:1000},colorScheme});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);
  assert.match(await page.title(),/AI-first Engineering Leader & Product Builder/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
  if([390,1440].includes(width)) {await page.screenshot({path:`qa/${colorScheme}-hero-${width}.png`});await page.locator('.hero').screenshot({path:`qa/${colorScheme}-hero-complete-${width}.png`});}
  assert.equal(await page.locator('.lens-stack,.hero-depth,.hero-experience').count(),0);
  const portrait=await page.locator('.hero-portrait img').boundingBox();
  const title=await page.locator('#hero-title').boundingBox();
  assert.ok(width<701 ? portrait.y>=title.y+title.height : portrait.x>=title.x+title.width, 'Portrait and title overlap');
  await page.locator('.hero-index a[href="#fareye"]').focus();await page.keyboard.press('Enter');assert.ok(page.url().endsWith('#fareye'));
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.hero-portrait img').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.deepEqual(errors,[]);results.push({colorScheme,width,noOverflow:true,keyboardCaseLinks:true,reducedMotion:true,errors});await page.close();
 }
 const page=await browser.newPage({javaScriptEnabled:false});await page.goto('http://127.0.0.1:8000/');assert.ok(await page.locator('.hero-portrait img').isVisible());assert.ok(await page.locator('.hero-index').isVisible());await page.close();
 await browser.close();fs.writeFileSync('qa/hero-results.json',JSON.stringify(results,null,2));console.log('PASS: 14 viewport/theme combinations, keyboard case links, reduced motion, no-JavaScript fallback');
})();
