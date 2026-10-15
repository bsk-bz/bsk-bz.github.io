require('node:fs').mkdirSync('qa', { recursive: true });
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();await page.goto('http://127.0.0.1:8000/',{waitUntil:'networkidle'});
const links=await page.locator('a[href]').evaluateAll(els=>els.map(e=>({href:e.getAttribute('href'),target:e.target,rel:e.rel,hint:e.getAttribute('aria-describedby')})));
const external=links.filter(l=>/^https?:/.test(l.href));
const internal=links.filter(l=>l.href.startsWith('#'));
assert.ok(external.every(l=>l.target==='_blank'&&l.rel.includes('noopener')&&l.rel.includes('noreferrer')&&l.hint==='new-tab-hint'));
assert.ok(internal.every(l=>!l.target&&!l.hint));
await page.emulateMedia({reducedMotion:'reduce'});
await page.locator('.hero .button').click();assert.ok(page.url().endsWith('#story'));
await page.locator('footer a').click();await page.waitForFunction(()=>scrollY===0);
assert.equal(page.context().pages().length,1);
// Stub the external destination to test tab behavior without contacting a third party.
await page.context().route('https://strapi.io/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<title>Link behavior test</title>'}));
const popupPromise=page.waitForEvent('popup');await page.locator('a[href^="https://strapi.io/"]').click();const popup=await popupPromise;await popup.waitForLoadState();assert.ok(popup.url().startsWith('https://strapi.io/'));assert.equal(await popup.evaluate(()=>window.opener),null);await popup.close();
const metadata=await page.locator('meta').evaluateAll(els=>Object.fromEntries(els.filter(e=>e.name||e.getAttribute('property')).map(e=>[e.name||e.getAttribute('property'),e.content])));
for(const key of ['description','og:title','og:description','og:type','og:site_name','og:image','og:image:secure_url','og:image:type','og:image:width','og:image:height','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt'])assert.ok(metadata[key],key);
assert.equal(metadata['twitter:card'],'summary_large_image');assert.equal(metadata['og:url'],'https://bsk.bz/');assert.equal(metadata['og:image'],metadata['twitter:image']);assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://bsk.bz/');
const schema=await page.locator('script[type="application/ld+json"]').evaluateAll(els=>els.map(e=>JSON.parse(e.textContent)));assert.equal(schema[1].mainEntity['@id'],schema[0]['@id']);
for(const agent of ['WhatsApp/2.24','Twitterbot/1.0','LinkedInBot/1.0']){const response=await page.request.get('http://127.0.0.1:8000/',{headers:{'User-Agent':agent}});assert.equal(response.status(),200);assert.ok((await response.text()).includes('og:image'));}
const img=await page.request.get('http://127.0.0.1:8000/assets/social-preview.jpg');assert.equal(img.status(),200);assert.ok(img.headers()['content-type'].includes('image/jpeg'));
const result={linksChecked:links.length,externalLinksNewTabs:true,internalLinksSameTab:true,backToTopVerified:true,newTabOpened:true,openerNull:true,metadata:true,linkedProfileSchema:true,localCrawlerFetches:true,socialImageStatus:img.status(),socialImageBytes:(await img.body()).length,productionPlatformPreviewVerified:false};fs.writeFileSync('qa/seo-results.json',JSON.stringify(result,null,2));console.log(result);await browser.close();})();
