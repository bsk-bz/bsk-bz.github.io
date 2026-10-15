require('node:fs').mkdirSync('qa', { recursive: true });
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
(async () => {
 const browser = await chromium.launch({channel:'chrome',headless:true});
 const results=[];
 for(const width of [375,390,430,768,1024,1440,1920]) {
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.addInitScript(()=>{window.metrics={cls:0,lcp:0};new PerformanceObserver(l=>l.getEntries().forEach(e=>window.metrics.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.metrics.cls+=e.value})).observe({type:'layout-shift',buffered:true})});
  await page.goto('http://127.0.0.1:8000/',{waitUntil:'networkidle'}); await page.evaluate(()=>document.fonts.ready); await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished)));
  await page.screenshot({path:`qa/desktop-${width}.png`,fullPage:true});
  const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,metrics:window.metrics,missingImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length}));
  await page.getByRole('button',{name:'Before',exact:true}).click(); if(await page.locator('.architecture').getAttribute('data-mode')!=='before') throw Error('Before failed');
  await page.getByRole('button',{name:'After',exact:true}).click();
  for(const step of ['build','review','deploy','plan']){await page.locator(`[data-step=${step}]`).click();if(!await page.locator(`#${step}`).isVisible())throw Error('Workflow failed');}
  if(width<=700){await page.getByRole('button',{name:/Menu/}).click();if(!await page.locator('#navigation').isVisible())throw Error('Menu failed');await page.keyboard.press('Escape');if(await page.locator('#navigation').isVisible())throw Error('Escape failed');}
  await page.locator('summary').first().click();if(await page.locator('details').first().getAttribute('open')===null)throw Error('Details failed');
  results.push({...layout,errors}); await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});await page.goto('http://127.0.0.1:8000/');results.push({noJavaScriptWorkflowPanels:await page.locator('.workflow-panel:visible').count()});await page.close();
 fs.writeFileSync('qa/browser-results.json',JSON.stringify(results,null,2));await browser.close();console.log(JSON.stringify(results,null,2));
})();
