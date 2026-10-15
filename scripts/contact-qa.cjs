require('node:fs').mkdirSync('qa', { recursive: true });
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
 for(const colorScheme of ['light','dark'])for(const width of [375,390,430,768,1024,1440,1920]){
  const page=await browser.newPage({viewport:{width,height:1000},colorScheme,reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:8000/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('a[href^="mailto:"]').count(),0);assert.equal(await page.locator('#contact-form').getAttribute('autocomplete'),'off');assert.ok(await page.locator('#contact-form input,#contact-form textarea').evaluateAll(els=>els.every(e=>e.autocomplete==='off')));assert.equal(await page.locator('.contact-submit').isEnabled(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
  let violations=[];
  if([390,1440].includes(width)){
   await page.locator('#contact').screenshot({path:`qa/${colorScheme}-contact-${width}.png`});
   await page.addScriptTag({path:process.env.AXE_PATH||require.resolve('axe-core/axe.min.js')});const audit=await page.evaluate(()=>axe.run('#contact',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));violations=audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.failureSummary)}));
  }
  results.push({colorScheme,width,noOverflow:true,configuredSendEnabled:true,violations});await page.close();
 }
 const unconfigured=await browser.newPage();await unconfigured.route('**/assets/contact-config.js',route=>route.fulfill({contentType:'application/javascript',body:"window.contactConfig={endpoint:''};"}));await unconfigured.goto('http://127.0.0.1:8000/');assert.equal(await unconfigured.locator('.contact-submit').isDisabled(),true);await unconfigured.close();
 const page=await browser.newPage();let requests=0;let responseStatus=500;
 await page.route('**/assets/contact-config.js',route=>route.fulfill({contentType:'application/javascript',body:"window.contactConfig={endpoint:'https://formspree.io/f/testfixture'};"}));
 await page.route('https://formspree.io/f/testfixture',async route=>{requests++;assert.equal(route.request().method(),'POST');assert.ok(route.request().postData().includes('QA message'));await new Promise(resolve=>setTimeout(resolve,150));await route.fulfill({status:responseStatus,contentType:'application/json',body:JSON.stringify({ok:responseStatus===200})});});
 await page.goto('http://127.0.0.1:8000/',{waitUntil:'networkidle'});
 await page.locator('.contact-submit').click();assert.equal(requests,0);
 await page.locator('#contact-name').fill('QA Test');await page.locator('#contact-reply').fill('qa@example.test');await page.locator('#contact-message').fill('QA message');
 await page.locator('.contact-submit').click();await page.waitForFunction(()=>document.querySelector('#contact-status').textContent.includes('could not'));
 assert.equal(await page.locator('#contact-message').inputValue(),'QA message');assert.equal(await page.locator('.contact-submit').isEnabled(),true);
 responseStatus=200;await page.locator('.contact-submit').click();await page.waitForFunction(()=>document.querySelector('#contact-status').textContent.includes('Thank you'));
 assert.equal(await page.locator('#contact-message').inputValue(),'');assert.equal(requests,2);
 assert.equal(await page.locator('.contact-submit').isEnabled(),true);await page.close();
 const fallback=await browser.newPage({javaScriptEnabled:false});await fallback.goto('http://127.0.0.1:8000/');assert.equal(await fallback.locator('.contact-submit').isDisabled(),true);await fallback.close();
 await browser.close();assert.ok(results.every(r=>r.violations.length===0),JSON.stringify(results));
 fs.writeFileSync('qa/contact-results.json',JSON.stringify({viewports:results,validation:true,mockedSuccess:true,mockedFailurePreservesMessage:true,actualDeliveryVerified:false},null,2));console.log('PASS: contact layout at 14 width/theme combinations, accessibility, validation, mocked success/failure, no-JavaScript safety. No live submissions sent.');
})();
