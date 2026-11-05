/** Bounded initial-reading observation. Does not modify the frozen story-forge.mjs runner.
 * Real pointer actions prepare natural storyboard playback and start script playback.
 * Browser evaluation only reads data/geometry and stores local observation arrays.
 */
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {requireBrowser} from './browser.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const FROZEN='ccb47a5b584d7fcdb3a4a4b5abac54920eedec1d4fdc9a1ce0150bb43d2e3f8b';

const sha=b=>createHash('sha256').update(b).digest('hex');
const sleep=(page,ms)=>page.waitForTimeout(ms); // Observation intervals, not application timing values.
async function centre(page,selector){const r=await page.locator(selector).first().boundingBox();if(!r)throw new Error('No visible box: '+selector);return {x:r.x+r.width/2,y:r.y+r.height/2};}
async function hoverTimeline(page){const xy=await centre(page,'#sf-strip');await page.mouse.move(xy.x,xy.y);await sleep(page,800);}
async function snapshot(page){return page.evaluate(()=>({selection:window.SF_DATA.selection,scriptScope:document.querySelector('#sf .script')?.dataset.scriptScope,scriptCount:document.querySelectorAll('#sf [data-script-id]').length,watching:document.querySelector('#sf').classList.contains('is-watching'),pageScroll:scrollY}));}
async function sampleStart(page,ms){
  return page.evaluate(ms=>new Promise(resolve=>{
    const frames=[],start=performance.now();const tick=rafTimestamp=>{
      const now=performance.now(),d=window.SF_DATA,b=document.querySelector('#sf-bview'),root=b.querySelector('.script'),els=[...root.querySelectorAll('[data-script-id]')],items=[],assigned=new Set();
      for(const shot of d.cuts[d.selection.cut].recordShots){const own=els.filter(e=>!assigned.has(e.dataset.scriptId)&&e.dataset.shotIds.split(',').includes(shot.id)),total=own.reduce((n,e)=>n+d.script.find(x=>x.id===e.dataset.scriptId).text.length,0);let at=shot.start;for(const el of own){assigned.add(el.dataset.scriptId);items.push({el,start:at});at+=shot.dur*d.script.find(x=>x.id===el.dataset.scriptId).text.length/total;}}
      let i=items.length-1;while(i>0&&items[i].start>d.selection.time)i--;const item=items[i],next=items[i+1],r=item.el.getBoundingClientRect(),end=next?next.el.getBoundingClientRect().top:r.bottom,span=(next?.start??d.cuts[d.selection.cut].duration)-item.start,fraction=Math.max(0,Math.min(1,(d.selection.time-item.start)/span)),point=r.top+(end-r.top)*fraction,middle=b.getBoundingClientRect().top+b.clientHeight/2;
      const first=items[0],firstRect=first.el.getBoundingClientRect();frames.push({observedAt:now,at:now-start,rafTimestamp,rafTimestampRelative:rafTimestamp-start,time:d.selection.time,running:d.selection.running,reading:b.classList.contains('is-reading'),owner:item.el.dataset.scriptId,marked:els.filter(e=>e.classList.contains('reading')).map(e=>e.dataset.scriptId),point,middle,error:point-middle,scroll:b.scrollTop,firstElement:{id:first.el.dataset.scriptId,start:first.start,end:items[1]?.start??d.cuts[d.selection.cut].duration,top:firstRect.top,bottom:firstRect.bottom},readingRoom:root.style.getPropertyValue('--reading-room')});
      if(now-start<ms)requestAnimationFrame(tick);else resolve({registeredAt:start,frames});
    };requestAnimationFrame(tick);
  }),ms);
}
/** One target only; caller owns page/browser/server. No app state or clock overrides. */
export async function runFirstLineTrace(page,{url,expectedDocumentSha256,reportPath}){
  if(!url||!expectedDocumentSha256)throw new Error('URL and exact document SHA are required');
  const mainBytes=await readFile(path.join(HERE,'story-forge.mjs'));if(sha(mainBytes)!==FROZEN)throw new Error('Frozen main runner changed');
  const report={kind:'before-click initial script reading observation',startedAt:new Date().toISOString(),url,expectedDocumentSha256,frozenRunnerSha256:FROZEN,viewport:{width:1440,height:900},theme:'pure',language:'zh',actions:[],errors:[],limits:['Pure/zh only. Does not replace the frozen matrices or establish all themes.','Finite frame observations are retained. Review pre-click coverage and first actual reading time before a target-defect claim.']};
  const save=async()=>{if(reportPath){await mkdir(path.dirname(path.resolve(reportPath)),{recursive:true});await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');}};
  try{
    await page.setViewportSize(report.viewport);await page.emulateMedia({reducedMotion:'no-preference'});const target=new URL(url);if(!['http:','https:'].includes(target.protocol))throw new Error('Use HTTP(S)');target.hash='scheme=pure&lang=zh';
    const response=await page.goto(target.href,{waitUntil:'domcontentloaded'});report.document={url:response.url(),status:response.status(),sha256:sha(await response.body())};if(report.document.sha256!==expectedDocumentSha256)throw new Error('Document SHA mismatch');
    await page.waitForSelector('#sf-cvInner .ci');await page.locator('#sf').scrollIntoViewIfNeeded();await sleep(page,800);await page.locator('#sf [data-mode="create"]').click();await sleep(page,800);await hoverTimeline(page);await page.locator('#sf [data-sf-call="setLayer"][data-value="storyboard"]').click();await sleep(page,800);await page.locator('#sf-monitorPicture').click();await sleep(page,800);
    // Reproduce the frozen natural case's exact predecessor with genuine 0-to-45 playback.
    await hoverTimeline(page);await page.locator('#sf-transport').click();await page.mouse.move(4,80);report.actions.push('Natural storyboard0-45s; pointer away; no end seek');
    await page.waitForFunction(()=>{const s=window.SF_DATA.selection;return !s.running&&s.time===45;},null,{polling:100,timeout:55000});await sleep(page,800);report.storyboardEnd=await snapshot(page);
    await hoverTimeline(page);await page.locator('#sf [data-sf-call="setLayer"][data-value="script"]').click();await sleep(page,800);await hoverTimeline(page);const xy=await centre(page,'#sf-transport');await page.mouse.move(xy.x,xy.y);report.beforeStart=await snapshot(page);
    const trace=sampleStart(page,3000);
    // This independent read-only rAF is registered after the sampler's first rAF.
    // Raw pre-click frames below verify that it really ran before the pointer click.
    report.preClickBarrier=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(timestamp=>resolve({rafTimestamp:timestamp,observedAt:performance.now(),running:window.SF_DATA.selection.running,time:window.SF_DATA.selection.time}))));
    await page.mouse.click(xy.x,xy.y);await page.mouse.move(4,80);report.actions.push('Read-only sampler registered before actual script play click; independent rAF barrier awaited');report.trace=await trace;
    const frames=report.trace.frames,firstId=frames[0]?.firstElement.id,firstReading=frames.filter(f=>f.running&&f.reading&&f.marked.includes(firstId));report.observation={preClickNonrunningFrames:frames.filter(f=>!f.running).length,firstRecordedRunning:frames.find(f=>f.running),firstRecordedReading:frames.find(f=>f.reading),firstElementSamples:firstReading.length,firstElementMinAbsError:firstReading.length?Math.min(...firstReading.map(f=>Math.abs(f.error))):null,firstElementHasSampleWithin2px:firstReading.some(f=>Math.abs(f.error)<=2),sampleCount:frames.length};
    report.registrationCoverage=report.preClickBarrier.running===false&&report.observation.preClickNonrunningFrames>0?'pre-click frames verified':'unverified';
    await hoverTimeline(page);await page.locator('#sf-transport').click();report.actions.push('Real pointer pause after observation');report.afterPause=await snapshot(page);
  }catch(e){report.errors.push(e?.stack||String(e));}
  finally{report.finishedAt=new Date().toISOString();await save();}return report;
}
async function cli(){const args={};for(let i=2;i<process.argv.length;i+=2){if(!process.argv[i+1])throw new Error('Missing value');args[process.argv[i].replace(/^--/,'')]=process.argv[i+1];}if(!args.url||!args.report||!args['expected-document-sha256'])throw new Error('--url --report --expected-document-sha256 required');const chrome=await requireBrowser();let browser;try{browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox']});const context=await browser.newContext(),page=await context.newPage(),r=await runFirstLineTrace(page,{url:args.url,reportPath:args.report,expectedDocumentSha256:args['expected-document-sha256']});r.environment={chromeExecutable:chrome,browserVersion:browser.version(),companionSha256:sha(await readFile(fileURLToPath(import.meta.url)))};await writeFile(args.report,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({report:args.report,registrationCoverage:r.registrationCoverage,observation:r.observation,errors:r.errors}));if(r.errors.length||r.registrationCoverage!=='pre-click frames verified')process.exitCode=1;await context.close();}finally{await browser?.close();}}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)cli().catch(e=>{console.error(e?.stack||String(e));process.exitCode=1;});
