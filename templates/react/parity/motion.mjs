/** Motion-card acceptance. Pointer input is real; page evaluation only reads.
 * Test observation allowances are not template design or interaction timings.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {SPEC,REPO,CHROME,pageReady,report} from './check.mjs';
const CONTENT=JSON.parse(await readFile(path.join(REPO,'core/content/workspace.json'),'utf8'));
const OBSERVATION={settleMargin:80,timeout:12000};
const hash=b=>createHash('sha256').update(b).digest('hex');
const same=(observed,expected)=>Object.entries(expected).every(([k,v])=>observed[k]===String(v));
const errorText=e=>e?.stack||String(e);
async function observe(page,selector,keys=[]){
  return page.locator(selector).evaluate((e,keys)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {inline:Object.fromEntries(keys.map(k=>[k,e.style[k]])),shadow:s.boxShadow,transform:s.transform,box:{x:r.x,y:r.y,width:r.width,height:r.height},scroll:{x:scrollX,y:scrollY},documentBox:{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height},duration:s.transitionDuration,delay:s.transitionDelay};},keys);
}
async function settleTransition(page,selector){
  const ms=await page.locator(selector).evaluate(e=>{const s=getComputedStyle(e),parse=v=>v.trim().endsWith('ms')?parseFloat(v):parseFloat(v)*1000,d=s.transitionDuration.split(',').map(parse),t=s.transitionDelay.split(',').map(parse);return Math.max(0,...d.map((v,i)=>v+t[i%t.length]));});
  await page.waitForTimeout(ms+OBSERVATION.settleMargin);
}
/** Existing caller owns page, context, navigation and server. */
export async function runMotion(page){
  const checks=[],evidence={hover:[],plays:[]},check=(id,pass,observation)=>checks.push({id,pass:!!pass,observation});
  const lift='#motion .mo:nth-child(1) .mo-demo';await page.locator(lift).scrollIntoViewIfNeeded();await page.mouse.move(4,80);await settleTransition(page,lift);
  const rest=await observe(page,lift);await page.locator(lift).hover();await settleTransition(page,lift);const raised=await observe(page,lift);
  check('motion.hover-shadow-only',rest.shadow!==raised.shadow&&rest.transform===raised.transform&&Math.abs(rest.documentBox.x-raised.documentBox.x)<=SPEC.sizeTolerance&&Math.abs(rest.documentBox.y-raised.documentBox.y)<=SPEC.sizeTolerance,{rest,raised});
  await page.mouse.move(4,80);await settleTransition(page,lift);const left=await observe(page,lift);check('motion.hover-shadow-restores',left.shadow===rest.shadow,{rest,left});evidence.hover.push({rest,raised,left});
  const delayed='#motion [data-d]';await page.locator(delayed).scrollIntoViewIfNeeded();await page.mouse.move(4,80);await settleTransition(page,delayed);await page.locator(delayed).hover();
  const on=await observe(page,delayed,Object.keys(CONTENT.motionHover.on));check('motion.delayed-shadow-on',same(on.inline,CONTENT.motionHover.on),on);
  await page.mouse.move(4,80);const off=await observe(page,delayed,Object.keys(CONTENT.motionHover.off));check('motion.delayed-shadow-off',same(off.inline,CONTENT.motionHover.off),off);evidence.hover.push({on,off});
  for(const [id,states] of Object.entries(CONTENT.motionStates)){
    const selector='#mo'+id+' [data-o]',keys=[...new Set(states.flatMap(s=>Object.keys(s)))];
    await page.locator('#motion [data-mo="'+id+'"]').click();const active=await observe(page,selector,keys);
    check('motion.play-'+id,same(active.inline,states[0]),{expected:states[0],active});
    await page.waitForFunction(({selector,expected})=>{const e=document.querySelector(selector);return !!e&&Object.entries(expected).every(([k,v])=>e.style[k]===String(v));},{selector,expected:states[1]},{timeout:CONTENT.motionReset+OBSERVATION.timeout});
    const reset=await observe(page,selector,keys);check('motion.reset-'+id,same(reset.inline,states[1]),{expected:states[1],reset});evidence.plays.push({id,active,reset});
  }
  return {checks,evidence,allChecksPass:checks.every(c=>c.pass)};
}
function args(values){const o={};for(let i=0;i<values.length;i++){const a=values[i];if(!['--url','--report','--expected-document-sha256','--configuration'].includes(a)||!values[i+1])throw new Error('Usage: node parity/motion.mjs --url URL --report PATH --expected-document-sha256 SHA [--configuration pure-zh-1440x1080]');o[a.slice(2)]=values[++i];}return o;}
async function cli(){
  const o=args(process.argv.slice(2));if(!o.url||!o.report||!/^[0-9a-f]{64}$/.test(o['expected-document-sha256']||''))throw new Error('URL, report and exact document SHA required');
  const configurations=SPEC.viewports.flatMap(viewport=>SPEC.themes.flatMap(theme=>SPEC.languages.map(language=>({theme,language,viewport,key:`${theme}-${language}-${viewport.width}x${viewport.height}`}))));
  const selected=o.configuration?configurations.filter(c=>c.key===o.configuration):configurations;if(!selected.length)throw new Error('Unknown configuration');
  report.environment.initialKanbanCounts=JSON.parse(await readFile(path.join(REPO,'core/content/work.json'),'utf8')).columns.map(c=>c.tasks.length);report.environment.galleryCount=JSON.parse(await readFile(path.join(REPO,'core/dist/gallery.json'),'utf8')).length;
  const out={kind:'motion-pointer-acceptance/v1',url:o.url,expectedDocumentSha256:o['expected-document-sha256'],runnerSha256:hash(await readFile(fileURLToPath(import.meta.url))),contentSha256:hash(await readFile(path.join(REPO,'core/content/workspace.json'))),startedAt:new Date().toISOString(),expectedCases:selected.length,cases:[],fatal:null};let browser;
  const persist=async()=>{await mkdir(path.dirname(path.resolve(o.report)),{recursive:true});await writeFile(o.report,JSON.stringify(out,null,2)+'\n');};
  try{browser=await chromium.launch({executablePath:CHROME,headless:true});out.browserVersion=browser.version();
    for(const config of selected){const context=await browser.newContext({viewport:config.viewport,deviceScaleFactor:1,reducedMotion:'no-preference'}),page=await context.newPage(),row={...config,checks:[],errors:[]};page.on('pageerror',e=>row.errors.push(errorText(e)));
      try{const navigation=page.waitForResponse(r=>r.request().isNavigationRequest()&&r.frame()===page.mainFrame());await pageReady(page,o.url,config.theme,config.language);const response=await navigation;row.documentSha256=hash(await response.body());if(row.documentSha256!==out.expectedDocumentSha256)throw new Error('Actual navigated document SHA differs from expected');
        const entry=await page.evaluate(()=>({theme:document.documentElement.dataset.scheme,language:document.documentElement.lang}));row.checks.push({id:'entry.theme-language',pass:entry.theme===config.theme&&entry.language===config.language,observation:entry});const observed=await runMotion(page);row.checks.push(...observed.checks);row.evidence=observed.evidence;
      }catch(e){row.errors.push(errorText(e));}finally{await context.close();}
      row.status=row.errors.length?'unverified':row.checks.some(c=>!c.pass)?'not attained':'attained';out.cases.push(row);out.summary={cases:out.cases.length,checks:out.cases.reduce((n,r)=>n+r.checks.length,0),passes:out.cases.reduce((n,r)=>n+r.checks.filter(c=>c.pass).length,0),unverified:out.cases.filter(r=>r.status==='unverified').length,notAttained:out.cases.filter(r=>r.status==='not attained').length};await persist();
    }
  }catch(e){out.fatal=errorText(e);}finally{await browser?.close();out.finishedAt=new Date().toISOString();out.browserClosed=!browser?.isConnected();out.allSelectedChecksPass=!out.fatal&&out.cases.length===out.expectedCases&&out.cases.every(r=>r.status==='attained');await persist();console.log(JSON.stringify({report:o.report,summary:out.summary,allSelectedChecksPass:out.allSelectedChecksPass,fatal:out.fatal}));process.exitCode=out.allSelectedChecksPass?0:1;}
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)cli().catch(e=>{console.error(errorText(e));process.exitCode=1;});
