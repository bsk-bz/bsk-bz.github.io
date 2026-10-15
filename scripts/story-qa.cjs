require('node:fs').mkdirSync('qa', { recursive: true });
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const fs=require('fs');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
for(const colorScheme of ['light','dark'])for(const width of [375,390,430,768,1024,1440,1920]){
 const page=await browser.newPage({viewport:{width,height:1000},colorScheme,reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8000/',{waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert.deepEqual(errors,[]);
 await page.emulateMedia({reducedMotion:'no-preference'});
 for(const [scene,index] of [['founder',1],['platform',2],['product',3]]){
  await page.locator(`#story-${scene}`).evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top+el.offsetHeight/2-innerHeight*.5,behavior:'instant'}));
  await page.waitForFunction(scene=>document.querySelector('.story-stage').dataset.chapter===scene,scene);
  if([390,1440].includes(width)){await page.waitForTimeout(800);await page.screenshot({path:`qa/story-${colorScheme}-${width}-${index}.png`});}
 }
 await page.locator('#founder').scrollIntoViewIfNeeded();
 if([390,1440].includes(width))await page.locator('#founder').screenshot({path:`qa/founder-${colorScheme}-${width}.png`});
 let violations=[];
 if([390,1440].includes(width)){await page.emulateMedia({reducedMotion:'reduce'});await page.addScriptTag({path:process.env.AXE_PATH||require.resolve('axe-core/axe.min.js')});const r=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));violations=r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));}
 results.push({colorScheme,width,overflow:false,chaptersPassed:true,violations,errors});await page.close();
}
fs.writeFileSync('qa/story-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();assert.ok(results.every(r=>r.violations.length===0));})();
