require('node:fs').mkdirSync('qa', { recursive: true });
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ channel:'chrome', headless:true });
 const results = [];
 for (const colorScheme of ['light', 'dark']) {
  for (const width of [375,390,430,768,1024,1440,1920]) {
   const page = await browser.newPage({ viewport:{width,height:1000}, colorScheme, reducedMotion:'reduce' });
   const errors = [];
   page.on('pageerror', error => errors.push(error.message));
   page.on('response', response => {if(response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);});
   await page.goto('http://127.0.0.1:8000/', {waitUntil:'networkidle'});
   await page.evaluate(() => document.fonts.ready);
   const state = await page.evaluate(() => ({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,background:getComputedStyle(document.body).backgroundColor,missingImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length}));
   assert.equal(state.scrollWidth,width,'Page overflow');
   assert.equal(state.background,colorScheme==='dark'?'rgb(16, 27, 23)':'rgb(246, 244, 237)');
   assert.equal(state.missingImages,0);assert.deepEqual(errors,[]);
   await page.screenshot({path:`qa/${colorScheme}-${width}.png`,fullPage:true});
   if([390,1440].includes(width)) await page.screenshot({path:`qa/${colorScheme}-hero-${width}.png`});
   await page.locator('.release-button').click();
   assert.equal(await page.locator('.architecture').getAttribute('data-tracing'),'true');
   assert.match(await page.locator('.release-explanation').innerText(),/Only Connector B/);
   await page.locator('[data-architecture=before]').click();
   assert.match(await page.locator('.release-explanation').innerText(),/deployed together/);
   if([390,1440].includes(width)) await page.locator('#fareye').screenshot({path:`qa/${colorScheme}-architecture-${width}.png`});
   await page.locator('[data-architecture=after]').click();
   for(const step of ['build','review','deploy','plan']) {
    await page.locator(`[data-step=${step}]`).focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator(`#${step}`).isVisible(),true);
   }
   if(width<=700){await page.getByRole('button',{name:/Menu/}).click();assert.equal(await page.locator('#navigation').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#navigation').isVisible(),false);}
   assert.equal(await page.locator('.recommendation').count(),5);
   await page.locator('.recommendation details summary').click();
   assert.equal(await page.locator('.recommendation details').getAttribute('open'),'');
   if([390,1440].includes(width)){
    await page.locator('#recommendations').screenshot({path:`qa/${colorScheme}-recommendations-${width}.png`});
    await page.addScriptTag({path:process.env.AXE_PATH||require.resolve('axe-core/axe.min.js')});
    await page.locator('details').evaluateAll(els=>els.forEach(el=>el.open=true));
    await page.locator('#luma').screenshot({path:`qa/${colorScheme}-luma-expanded-${width}.png`});
    const audit = await page.evaluate(() => axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
    state.accessibility = audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
   }
   await page.emulateMedia({colorScheme:colorScheme==='dark'?'light':'dark'});
   assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),colorScheme==='dark'?'rgb(246, 244, 237)':'rgb(16, 27, 23)');
   results.push({colorScheme,...state,errors});
   await page.close();
  }
 }
 // Delaying the main stylesheet demonstrates the initial dark canvas from head metadata.
 const early = await browser.newPage({colorScheme:'dark',javaScriptEnabled:false,viewport:{width:390,height:844}});
 await early.route('**/assets/site.css',route=>route.abort());
 await early.goto('http://127.0.0.1:8000/',{waitUntil:'domcontentloaded'});
 assert.equal(await early.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor),'rgb(16, 27, 23)');
 await early.close();
 const fallback = await browser.newPage({colorScheme:'dark',javaScriptEnabled:false,viewport:{width:390,height:844}});
 await fallback.goto('http://127.0.0.1:8000/',{waitUntil:'networkidle'});
 assert.equal(await fallback.locator('.workflow-panel:visible').count(),4);
 assert.equal(await fallback.locator('#navigation').isVisible(),true);
 results.push({firstPaintDarkCanvas:true,noJavaScriptNavigation:true,noJavaScriptWorkflow:true});
 fs.writeFileSync('qa/theme-results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));await browser.close();
 results.filter(r=>r.accessibility).forEach(r=>assert.equal(r.accessibility.length,0,'Accessibility violations')); 
})();
