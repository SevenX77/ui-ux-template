/** Deterministic HTML/React acceptance checks. No browser download is used. */
import {createServer} from 'node:http';
import {createServer as createNetServer} from 'node:net';
import {spawn} from 'node:child_process';
import {readFile, writeFile, mkdir, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright-core';
import {PNG} from 'pngjs';
import {measureHoverTrace,analyzeHoverTrace,settleIndicator} from './timeline.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(HERE, '..');
const REPO = path.resolve(TEMPLATE, '../..');
// Acceptance constants are frozen here, before any observations. These are test
// inputs/oracles, not template styling or a second implementation of core UX.
const SPEC = Object.freeze({
  sections: ['schemes', 'shape', 'controls', 'dash', 'work', 'table', 'gallery'],
  themes: ['pure', 'neon', 'prism', 'aurora', 'paper', 'ember'],
  languages: ['zh', 'en'],
  viewports: [{width:1440, height:1080}, {width:390, height:844}],
  properties: ['font-family','font-size','font-weight','line-height','color',
    'background-color','background-image','border-radius','box-shadow',
    'padding-top','padding-right','padding-bottom','padding-left','width','height'],
  sizeTolerance: 1,
  pixelChannelTolerance: 0, // Count every differing RGBA pixel; do not mask.
  hoverSamples: [60, 220],
  hoverSampleLateness: 35, // A late timer is invalid evidence, not a product pass.
  dimOpacity: 0.3,
  opacityTolerance: 0.005,
  languagePinTolerance: 2,
  readinessTimeout: 20000,
  settleTimeout: 12000,
  assetTimeout: 12000,
  chrome: ['.bar', '.rail', '.pnav'],
});
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const OUT = path.join(HERE, 'out', runId);
const CHROME = process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const report = {runId, startedAt: new Date().toISOString(), spec: SPEC,
  environment: {chromeExecutable: CHROME, node:process.version},
  artifacts: {}, cases: [], chrome: [], chromeSupplement: [], interactions: [], diagnostics: [], fatal: null};
const handles = {staticServer:null, preview:null, browser:null};
const network = [];
let previewLog = '';
const hash = data => createHash('sha256').update(data).digest('hex');
const rel = file => path.relative(HERE, file).split(path.sep).join('/');
const errorText = error => error?.stack || String(error);
class AcceptanceStop extends Error{
  constructor(check,observation){super('Acceptance evidence stopped for review: '+check);this.name='AcceptanceStop';this.acceptanceStop=true;this.check=check;this.observation=observation;}
}
const json = async (file, data) => writeFile(file, JSON.stringify(data, null, 2)+'\n');
async function bounded(promise, ms, label) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: timed out after ${ms}ms`)), ms);
  })]); } finally { clearTimeout(timer); }
}
async function freePort() {
  const server = createNetServer();
  await new Promise((resolve,reject) => {server.once('error',reject); server.listen(0,'127.0.0.1',resolve);});
  const port = server.address().port;
  await new Promise((resolve,reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}
async function startServers() {
  // Verify targets before starting owned resources. No arbitrary existing server
  // is trusted; Vite uses strictPort and both ports are loopback-only.
  for (const file of [CHROME, path.join(TEMPLATE,'dist/index.html'),
    path.join(TEMPLATE,'node_modules/vite/bin/vite.js'),
    path.join(REPO,'templates/html/ui-handbook.html')]) await stat(file);
  const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript',
    '.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png',
    '.svg':'image/svg+xml','.woff2':'font/woff2'};
  const server = createServer(async (req,res) => {
    try {
      const file = path.resolve(REPO, '.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if (file !== REPO && !file.startsWith(REPO+path.sep)) {res.writeHead(403).end();return;}
      const body = await readFile(file);
      res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream',
        'Cache-Control':'no-store'}).end(body);
    } catch {res.writeHead(404).end('Not found');}
  });
  handles.staticServer = server;
  await new Promise((resolve,reject) => {server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const html = `http://127.0.0.1:${server.address().port}/templates/html/ui-handbook.html`;
  const port = await freePort();
  const preview = spawn(process.execPath, [path.join(TEMPLATE,'node_modules/vite/bin/vite.js'),
    'preview','--host','127.0.0.1','--port',String(port),'--strictPort'],
    {cwd:TEMPLATE, stdio:['ignore','pipe','pipe']});
  handles.preview = preview;
  preview.stdout.on('data', bytes => {previewLog += bytes.toString();});
  preview.stderr.on('data', bytes => {previewLog += bytes.toString();});
  let spawnError = null;
  preview.on('error', error => {spawnError=error;});
  const react = `http://127.0.0.1:${port}/`;
  const until = Date.now()+SPEC.readinessTimeout;
  while (true) {
    if (spawnError) throw spawnError;
    if (preview.exitCode !== null || preview.signalCode) throw new Error(`Owned Vite preview exited: ${previewLog}`);
    try {const response = await fetch(react);if(response.ok) break;} catch {}
    if(Date.now()>until) throw new Error(`Owned Vite preview not ready: ${previewLog}`);
    await delay(80);
  }
  report.environment.servers = {html, react, previewPid:preview.pid};
  return {html,react};
}
async function cleanup() {
  const cleanupErrors=[];
  try {await handles.browser?.close();} catch(error) {cleanupErrors.push(errorText(error));}
  if (handles.preview && handles.preview.exitCode===null && !handles.preview.signalCode) {
    const child=handles.preview;
    const ended=new Promise(resolve => child.once('exit',resolve));
    child.kill('SIGTERM');
    try {await bounded(ended,3000,'Vite cleanup');}
    catch {child.kill('SIGKILL');try {await bounded(ended,3000,'Vite forced cleanup');}
      catch(error){cleanupErrors.push(errorText(error));}}
  }
  try {if(handles.staticServer?.listening) await new Promise((resolve,reject) => {
    handles.staticServer.close(error=>error?reject(error):resolve());
    handles.staticServer.closeAllConnections();
  });} catch(error) {cleanupErrors.push(errorText(error));}
  report.cleanup={browserClosed:!handles.browser?.isConnected(),
    previewEnded:!handles.preview || handles.preview.exitCode!==null || !!handles.preview.signalCode,
    staticServerClosed:!handles.staticServer?.listening, errors:cleanupErrors};
}
function observe(page, side) {
  page.on('pageerror', error=>network.push({side,kind:'pageerror',url:page.url(),message:errorText(error)}));
  page.on('console', message=>{if(message.type()==='error')network.push({side,kind:'console',url:page.url(),message:message.text()});});
  page.on('requestfailed', req=>network.push({side,kind:'requestfailed',url:req.url(),message:req.failure()?.errorText}));
  page.on('response', response=>{if(response.status()>=400)network.push({side,kind:'http',url:response.url(),status:response.status()});});
}
let navigationId=0;
async function pageReady(page, url, theme, language) {
  await page.bringToFront();
  const fresh=new URL(url);
  fresh.searchParams.set('parity',`${runId}-${++navigationId}`);
  fresh.hash=`scheme=${theme}&lang=${language}`;
  const response=await page.goto(fresh.href, {waitUntil:'domcontentloaded'});
  if(!response || !response.ok() || response.request().resourceType()!=='document')
    throw new Error('Fresh Document navigation was not verified: '+fresh.href);
  await page.waitForFunction(() => typeof window.setLang==='function' && typeof window.setScheme==='function');
  await page.evaluate(({theme,language})=>{window.setScheme(theme);window.setLang(language,true);}, {theme,language});
  await page.waitForFunction(({theme,language}) => document.documentElement.dataset.scheme===theme &&
    document.documentElement.lang===language, {theme,language});
  try {await bounded(page.evaluate(()=>document.fonts.ready.then(()=>true)),SPEC.assetTimeout,'font readiness');}
  catch(error){report.diagnostics.push({url:page.url(),kind:'font-readiness',message:errorText(error)});}
  await page.waitForFunction(expected=>{
    const columns=[...document.querySelectorAll('#kan .kcol')];
    return columns.length===expected.length && columns.every((column,i)=>
      column.querySelectorAll('.kcard').length===expected[i] && Number(column.querySelector('.kn')?.textContent)===expected[i]);
  },report.environment.initialKanbanCounts);
  await settle(page,'.bar',false);
  return page.evaluate(()=>({lang:document.documentElement.lang,scheme:document.documentElement.dataset.scheme,
    documentURL:location.href,visibilityState:document.visibilityState,
    initialKanbanCounts:[...document.querySelectorAll('#kan .kcol')].map(c=>c.querySelectorAll('.kcard').length),
    fonts:[...document.fonts].map(f=>({family:f.family,status:f.status,weight:f.weight})),
    viewport:{width:innerWidth,height:innerHeight},devicePixelRatio,
    reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches}));
}
async function settle(page, selector, scroll=true) {
  await page.waitForSelector(selector,{state:'attached'});
  if(scroll) await page.evaluate(selector=>{
    const element=document.querySelector(selector),r=element.getBoundingClientRect();
    scrollTo({top:scrollY+r.top-90,behavior:'instant'});
  },selector);
  // Observe genuine reveal/count/layout completion. Do not force CSS states,
  // disable motion, remove nodes, mask pixels or assign a different data state.
  await page.evaluate(async ({selector,timeout})=>{
    const root=document.querySelector(selector), deadline=performance.now()+timeout;
    const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
    let old='',stable=0;
    while(performance.now()<deadline){
      await frame();
      const nodes=[root,...root.querySelectorAll('*')];
      const geometry=nodes.map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height,e.textContent?.length].join(',');}).join('|');
      const animations=[...root.getAnimations({subtree:true})];
      for(let ancestor=root.parentElement;ancestor;ancestor=ancestor.parentElement)
        animations.push(...ancestor.getAnimations({subtree:false}));
      // Pseudo-elements are not DOM descendants (for example rail tick width).
      // Include their finite animations from the document animation registry.
      for(const animation of document.getAnimations()){
        const target=animation.effect?.target;
        const element=target instanceof Element?target:target?.element;
        if(element&&(root.contains(element)||element.contains(root)))animations.push(animation);
      }
      const active=animations.some(a=>a.playState==='running' &&
        Number.isFinite(a.effect?.getComputedTiming().endTime));
      const pending=nodes.some(e=>e.classList.contains('pre') && (()=>{
        const r=e.getBoundingClientRect();return r.bottom>0 && r.top<innerHeight*.94;})());
      const counting=nodes.some(e=>{
        if(!e.hasAttribute('data-count'))return false;
        const r=e.getBoundingClientRect();if(r.bottom<=0||r.top>=innerHeight)return false;
        const expected=(e.dataset.pre||'')+Number(e.dataset.count).toLocaleString('en-US')+(e.dataset.suf||'');
        return e.textContent!==expected;
      });
      stable=geometry===old&&!active&&!pending&&!counting?stable+1:0;old=geometry;
      if(stable>=6)return;
    }
    throw new Error(`Unsettled real layout/reveal at ${selector}`);
  },{selector,timeout:SPEC.settleTimeout});
}
async function revealSection(page,id) {
  const selector='#'+id;
  await settle(page,selector);
  // Visit every part of a tall section naturally so off-screen reveal classes
  // cannot make an apparently equal blank screenshot. Stop at its real bottom.
  let last=-Infinity;
  for(let step=0;step<160;step++) {
    const state=await page.evaluate(selector=>{
      const root=document.querySelector(selector),r=root.getBoundingClientRect();
      return {remaining:r.bottom-innerHeight,scroll:scrollY,step:innerHeight*.72};
    },selector);
    if(state.remaining<=0 || state.scroll===last) break;
    last=state.scroll;
    await page.evaluate(amount=>scrollBy({top:amount,behavior:'instant'}),Math.min(state.step,state.remaining));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  }
  if(id==='gallery') {
    // The original lazy gallery has 54 items. Use its public category controls
    // to materialize the complete shared dataset on both sides, then return to
    // the original All state. This is disclosed setup, not a loading claim.
    const count=await page.locator('#mg .mg-i').count();
    if(count<report.environment.galleryCount) {
      await page.locator('#mgF button').nth(1).click();
      await page.locator('#mgF button').first().click();
    }
    await page.waitForFunction(expected=>document.querySelectorAll('#mg .mg-i').length===expected,
      report.environment.galleryCount);
  }
  await settle(page,selector);
  const assets=await page.evaluate(async ({selector,timeout})=>{
    const nodes=[document.querySelector(selector),...document.querySelectorAll(selector+' *')],urls=new Set();
    nodes.forEach(e=>{const s=getComputedStyle(e).backgroundImage;for(const m of s.matchAll(/url\(["']?(.*?)["']?\)/g))urls.add(m[1]);});
    const results=await Promise.all([...urls].map(url=>new Promise(resolve=>{
      const img=new Image(),timer=setTimeout(()=>resolve({url:url.startsWith('data:')?'inline:'+url.length:url,ok:false,error:'timeout'}),timeout);
      const end=(ok,error)=>{clearTimeout(timer);resolve({url:url.startsWith('data:')?'inline:'+url.length:url,ok,error});};
      img.onload=()=>end(true);img.onerror=()=>end(false,'load error');img.src=url;
      if(img.complete&&img.naturalWidth)end(true);
    })));
    return results;
  },{selector,timeout:SPEC.assetTimeout});
  await settle(page,selector);
  return assets;
}
async function snapshot(page,selector) {
  return page.evaluate(({selector,properties})=>{
    const root=document.querySelector(selector),out=[];
    function walk(element,domPath){
      const cs=getComputedStyle(element),styles={};
      properties.forEach(key=>styles[key]=key==='background-image'?cs.getPropertyValue(key)!=='none':cs.getPropertyValue(key));
      const attrs={};
      for(const a of [...element.attributes].sort((a,b)=>a.name.localeCompare(b.name)))
        if(a.name==='class'||a.name.startsWith('data-'))attrs[a.name]=a.name==='class'?a.value.split(/\s+/).filter(Boolean).sort().join(' '):a.value;
      const bounds=element.getBoundingClientRect(),rootBounds=root.getBoundingClientRect();
      out.push({path:domPath,tag:element.tagName.toLowerCase(),attrs,styles,
        bounds:{x:bounds.x-rootBounds.x,y:bounds.y-rootBounds.y,width:bounds.width,height:bounds.height},
        text:[...element.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').replace(/\s+/g,' ').trim()});
      [...element.children].forEach((child,i)=>walk(child,domPath==='@'?String(i):domPath+'/'+i));
    }
    if(!root)throw new Error('Missing '+selector);walk(root,'@');return out;
  },{selector,properties:SPEC.properties});
}
function compareSnapshots(html,react) {
  const a=new Map(html.map(n=>[n.path,n])),b=new Map(react.map(n=>[n.path,n]));
  const styles=[],structure=[];
  for(const domPath of new Set([...a.keys(),...b.keys()])) {
    const x=a.get(domPath),y=b.get(domPath);
    if(!x||!y){structure.push({path:domPath,kind:'missing-element',html:x?.tag??null,react:y?.tag??null});continue;}
    if(x.tag!==y.tag)structure.push({path:domPath,kind:'tag',html:x.tag,react:y.tag});
    for(const key of SPEC.properties){
      const av=x.styles[key],bv=y.styles[key];
      let equal=av===bv;
      if((key==='width'||key==='height') && Number.isFinite(parseFloat(av)) && Number.isFinite(parseFloat(bv)))
        equal=Math.abs(parseFloat(av)-parseFloat(bv))<=SPEC.sizeTolerance;
      if(!equal)styles.push({path:domPath,tag:x.tag,property:key,html:av,react:bv});
    }
    for(const key of ['attrs','text'])if(JSON.stringify(x[key])!==JSON.stringify(y[key]))
      structure.push({path:domPath,kind:key,html:x[key],react:y[key]});
  }
  return {elementCounts:{html:html.length,react:react.length},styleMismatches:styles,structureMismatches:structure};
}
function pixelDifference(aBytes,bBytes) {
  const a=PNG.sync.read(aBytes),b=PNG.sync.read(bBytes);
  const width=Math.max(a.width,b.width),height=Math.max(a.height,b.height);
  const diff=new PNG({width,height});let changed=0,maxChannel=0,total=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const k=(y*width+x)*4,ai=(y*a.width+x)*4,bi=(y*b.width+x)*4;
    const presentA=x<a.width&&y<a.height,presentB=x<b.width&&y<b.height;
    let different=!presentA||!presentB;
    for(let c=0;c<4;c++){
      const av=presentA?a.data[ai+c]:0,bv=presentB?b.data[bi+c]:0,d=Math.abs(av-bv);
      if(d>SPEC.pixelChannelTolerance)different=true;
      maxChannel=Math.max(maxChannel,d);total+=d;
      diff.data[k+c]=c===3?255:d;
    }
    if(different)changed++;
  }
  return {metrics:{html:{width:a.width,height:a.height},react:{width:b.width,height:b.height},
    comparedPixels:width*height,differentPixels:changed,differentPixelRatio:changed/(width*height),
    maxChannelDifference:maxChannel,meanAbsoluteChannelDifference:total/(width*height*4)},diff:PNG.sync.write(diff)};
}
async function capturePair(pages,selector,key,directory='screenshots') {
  const files={html:path.join(OUT,directory,key+'-html.png'),react:path.join(OUT,directory,key+'-react.png'),
    diff:path.join(OUT,directory,key+'-diff.png')};
  await mkdir(path.dirname(files.html),{recursive:true});
  const visible=await Promise.all(pages.map(page=>page.locator(selector).isVisible()));
  if(!visible[0]&&!visible[1])return {skipped:'Both elements have display:none or no visible box under this viewport.',files:{}};
  if(!visible.every(Boolean))return {error:'Only one corresponding element is visible',visible,files:{}};
  const bytes=[],boxes=[];
  for(let i=0;i<pages.length;i++){
    const page=pages[i];await page.bringToFront();await settle(page,selector,false);
    boxes.push(await page.locator(selector).boundingBox());
    bytes.push(await page.locator(selector).screenshot({path:files[i?'react':'html'],animations:'allow'}));
  }
  const result=pixelDifference(...bytes);await writeFile(files.diff,result.diff);
  return {...result.metrics,captureBounds:{html:boxes[0],react:boxes[1]},files:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,rel(v)]))};
}
async function sectionCase(pages,configuration,id) {
  const key=`${configuration.key}-${id}`,row={...configuration,section:id,key,errors:[]};
  try{
    row.assets=[];row.snapshots=[];
    for(const page of pages){
      await page.bringToFront();row.assets.push(await revealSection(page,id));
      row.snapshots.push(await snapshot(page,'#'+id));
    }
    Object.assign(row,compareSnapshots(...row.snapshots));
    const rawFile=path.join(OUT,'raw',key+'.json');await json(rawFile,{configuration,section:id,html:row.snapshots[0],react:row.snapshots[1]});
    row.raw=rel(rawFile);delete row.snapshots;
    row.pixels=await capturePair(pages,'#'+id,key);
  } catch(error){row.errors.push(errorText(error));delete row.snapshots;}
  report.cases.push(row);
}

async function settleVisibleTopbar(page){
  await page.bringToFront();await away(page);
  if(!await page.locator('.bar-in').isVisible())throw new Error('Visible topbar descendant is unavailable');
  const box=await page.locator('.bar-in').boundingBox();
  if(!box||box.width<=0||box.height<=0)throw new Error('Visible topbar descendant has an empty box');
  await settle(page,'.bar-in',false);
  const hosts=await page.evaluate(()=>[...document.querySelectorAll('#barIn .seg')].filter(host=>{
    const selected=host.querySelector(':scope > button.on'),r=selected?.getBoundingClientRect();return r&&r.width>0&&r.height>0;
  }).map(host=>{
    if(!host.querySelector(':scope > .seg-ind'))throw new Error('Visible topbar selector has no indicator');
    const path=[];let node=host;
    while(node.id!=='barIn'){path.unshift(':nth-child('+([...node.parentElement.children].indexOf(node)+1)+')');node=node.parentElement;}
    return '#barIn > '+path.join(' > ');
  }));
  if(!hosts.length)throw new Error('No visible topbar selectors');
  const indicators=[];
  for(const host of hosts){
    const observation=await settleIndicator(page,{host,timeout:SPEC.settleTimeout});indicators.push({host,...observation});
    if(!observation.settled)throw new Error('Topbar selector did not naturally settle: '+host);
  }
  const finalBox=await page.locator('.bar-in').boundingBox();
  if(!finalBox||finalBox.width<=0||finalBox.height<=0)throw new Error('Topbar vanished after settlement');
  return {box:finalBox,indicators};
}
async function topbarSupplement(pages,configuration){
  const row={...configuration,selector:'.bar',captureSelector:'.bar-in',errors:[],
    observationKind:'fresh-visible-topbar-supplement',origin:{runId,observedAt:new Date().toISOString(),staticReuse:false,
      preserves:'Original .bar root style/DOM rows and their skipped image records remain unchanged.'}};
  try{
    row.settlement=[];
    for(const page of pages)row.settlement.push(await settleVisibleTopbar(page));
    row.pixels=await capturePair(pages,'.bar-in',configuration.key+'-visible-topbar','chrome-supplement');
    if(row.pixels.skipped||row.pixels.error||Object.keys(row.pixels.files||{}).length!==3||
      ![row.pixels.html?.width,row.pixels.html?.height,row.pixels.react?.width,row.pixels.react?.height].every(value=>Number.isFinite(value)&&value>0))
      throw new Error('Missing nonempty paired visible-topbar screenshots');
    report.chromeSupplement.push(row);
  }catch(error){
    row.errors.push(errorText(error));report.chromeSupplement.push(row);
    const stop=new AcceptanceStop('visible-topbar-capture',row);stop.configuration=configuration;throw stop;
  }
}

async function chromeCase(pages,configuration) {
  // Measure chrome at the same visible section, including phone capsule.
  for(const page of pages){await page.bringToFront();await settle(page,'#dash');}
  for(const selector of SPEC.chrome){
    const row={...configuration,selector,errors:[]};
    try{
      const snapshots=[];
      for(const page of pages){await page.bringToFront();await settle(page,selector,false);snapshots.push(await snapshot(page,selector));}
      Object.assign(row,compareSnapshots(...snapshots));
      const key=configuration.key+'-chrome-'+selector.slice(1),rawFile=path.join(OUT,'raw',key+'.json');
      await json(rawFile,{configuration,selector,html:snapshots[0],react:snapshots[1]});row.raw=rel(rawFile);
      row.captureSelector=selector==='.bar'?'.bar-in':selector;
      if(selector==='.bar')for(const page of pages)await settleVisibleTopbar(page);
      row.pixels=await capturePair(pages,row.captureSelector,key,'chrome');
      if(selector==='.bar'&&(row.pixels.skipped||row.pixels.error||Object.keys(row.pixels.files||{}).length!==3))
        throw new Error('Visible topbar screenshot pair is missing');
    }catch(error){row.errors.push(errorText(error));}
    report.chrome.push(row);
  }
}
async function away(page){await page.mouse.move(0,0);await page.keyboard.press('Escape');await page.waitForTimeout(550);}
async function clickVisible(page,selector){
  const box=await page.locator(selector).boundingBox();
  const viewport=page.viewportSize();
  if(!box||box.x<0||box.y<0||box.x+box.width>viewport.width||box.y+box.height>viewport.height)
    throw new Error('Real pointer target is not fully visible: '+selector);
  const x=box.x+box.width/2,y=box.y+box.height/2;
  const hit=await page.evaluate(({selector,x,y})=>{
    const target=document.querySelector(selector),actual=document.elementFromPoint(x,y);
    return target===actual||target?.contains(actual);
  },{selector,x,y});
  if(!hit)throw new Error('Real pointer target is occluded: '+selector);
  await page.mouse.click(x,y);
}
async function hoverCheck(page,id) {
  const selector=id==='dash'?'#incCard':'#fileCard';
  await settle(page,selector);await away(page);
  const pointSelector=id==='dash'?'#incCard .inc-core':'#fileCard .between > b';
  const target=page.locator(pointSelector).first();
  let timeline;
  try{timeline=await measureHoverTrace(page,{selector,pointSelector});}
  catch(error){
    const partial=await page.evaluate(()=>window.__parityTracePromise).catch(()=>null);
    throw new AcceptanceStop('hover-'+id,{hoverPass:false,error:errorText(error),timeline:partial?{raw:partial,analysis:analyzeHoverTrace(partial)}:null});
  }
  const timing={before:timeline.raw.initial.hover,samples:timeline.analysis.evidence.samples||[]};
  // Old scheduled samples are retained as diagnostics, not erased or retimed.
  const timingValid=timing.samples.every(s=>s.elapsedMs>=s.requestedMs && s.elapsedMs-s.requestedMs<=SPEC.hoverSampleLateness);
  if(!timeline.analysis.pass)throw new AcceptanceStop('hover-'+id,{hoverPass:false,timingValid,timing,timeline});
  await page.waitForTimeout(380);
  const peers=await page.evaluate(selector=>{
    const element=document.querySelector(selector),scope=element.closest('[data-scope]');
    return [...scope.querySelectorAll('[data-cmp]')].filter(e=>e!==element&&e.closest('[data-scope]')===scope)
      .map(e=>({tag:e.tagName,id:e.id,state:e.dataset.state,dim:e.classList.contains('ux-dim'),opacity:parseFloat(getComputedStyle(e).opacity)}));
  },selector);
  const hoverPass=timeline.analysis.pass;
  const dimPass=peers.length>0&&peers.every(p=>p.dim&&Math.abs(p.opacity-SPEC.dimOpacity)<=SPEC.opacityTolerance);
  // Use a real expanding action, not synthetic UX.focus().
  if(id==='work')await page.locator('#upBtn').click();else await target.click();
  const focused=await page.locator(selector).evaluate(e=>e.classList.contains('ux-focus'));
  await page.locator('#'+id+' .sec-h h2').click();
  await page.mouse.move(0,0);await page.waitForTimeout(600);
  const rest=await page.evaluate(selector=>{
    const element=document.querySelector(selector),scope=element.closest('[data-scope]');
    return [...scope.querySelectorAll('[data-cmp]')].filter(e=>e.closest('[data-scope]')===scope)
      .map(e=>({id:e.id,state:e.dataset.state,hover:e.classList.contains('ux-hover'),focus:e.classList.contains('ux-focus'),dim:e.classList.contains('ux-dim')}));
  },selector);
  return {hoverPass,dimPass,outsideClickPass:focused&&rest.every(e=>e.state==='rest'&&!e.hover&&!e.focus&&!e.dim),
    timingValid,timing,timeline,peers,focusedBeforeOutsideClick:focused,afterOutsideClick:rest};
}
async function dragCheck(page,key,side){
  await page.locator('#kan').scrollIntoViewIfNeeded();await away(page);
  await page.evaluate(()=>{const r=document.querySelector('#kan').getBoundingClientRect();scrollBy({top:r.top-120,behavior:'instant'});});
  const counts=()=>page.locator('#kan .kcol').evaluateAll(cols=>cols.map(c=>({column:c.dataset.c,count:Number(c.querySelector('.kn').textContent),cards:c.querySelectorAll('.kcard').length})));
  const before=await counts();
  const card=page.locator('#kan .kcol').first().locator('.kcard').first();
  const source=await card.boundingBox(),destination=await page.locator('#kan .kcol').nth(1).boundingBox();
  if(!source||!destination)throw new Error('Missing drag source or destination');
  const sx=source.x+source.width/2,sy=source.y+Math.min(12,source.height/2);
  const dx=destination.x+destination.width/2,dy=destination.y+Math.min(45,destination.height-8);
  if(dy<70||dy>page.viewportSize().height-65)throw new Error(`Drag target outside safe viewport: ${dy}`);
  let during,after;
  await page.mouse.move(sx,sy);await page.mouse.down();
  try{
    await page.mouse.move(sx+8,sy+8,{steps:2});
    await page.mouse.move(dx,dy,{steps:12});
    await page.waitForTimeout(160);
    during={counts:await counts(),slot:await page.locator('#kan .ux-slot').count(),ghost:await page.locator('body > .ux-ghost').count(),
      slotColumn:await page.locator('#kan .ux-slot').evaluate(e=>e.closest('.kcol')?.dataset.c)};
    const screenshot=path.join(OUT,'interactions',`${key}-${side}-drag-held.png`);
    await page.screenshot({path:screenshot});during.screenshot=rel(screenshot);
  } finally{await page.mouse.up();}
  await page.waitForTimeout(550);
  after={counts:await counts(),slot:await page.locator('#kan .ux-slot').count(),ghost:await page.locator('body > .ux-ghost').count()};
  const expected=before.map((c,i)=>({...c,count:c.count+(i===0?-1:i===1?1:0),cards:c.cards+(i===0?-1:i===1?1:0)}));
  return {pass:during.slot===1&&during.ghost===1&&during.slotColumn===before[1].column&&
    JSON.stringify(during.counts)===JSON.stringify(expected)&&JSON.stringify(after.counts)===JSON.stringify(expected)&&after.slot===0&&after.ghost===0,
    before,during,after,expected};
}
async function themeCheck(page,theme){
  await away(page);
  const target=SPEC.themes[(SPEC.themes.indexOf(theme)+1)%SPEC.themes.length];
  const before=await page.locator('#barT > .seg-ind').boundingBox();
  await clickVisible(page,`#barT button[data-s="${target}"]`);
  await page.waitForFunction(target=>document.documentElement.dataset.scheme===target,target);
  const settlement=await settleIndicator(page,{timeout:SPEC.settleTimeout});
  const indicator=settlement.indicator,button=settlement.button;
  const moved=!!before&&!!indicator&&Math.hypot(indicator.x-before.x,indicator.y-before.y)>1;
  const aligned=!!indicator&&!!button&&['x','y','width','height'].every(k=>Math.abs(indicator[k]-button[k])<=1);
  const observation={pass:settlement.settled&&moved&&aligned,target,before,indicator,button,moved,aligned,settlement};
  if(!settlement.settled)throw new AcceptanceStop('theme-settlement',observation);
  await page.evaluate(theme=>window.setScheme(theme),theme);
  return observation;
}
async function languageCheck(page,language){
  await away(page);await settle(page,'#dash');
  const anchor=await page.evaluate(()=>{
    const el=[...document.querySelectorAll('#page .wrap>*,#page .wrap>*>*')].find(e=>{const r=e.getBoundingClientRect();return r.height>0&&r.top>=70;});
    if(!el)throw new Error('No language anchor');
    const indexes=[];let e=el;while(e!==document.querySelector('#page')){indexes.unshift([...e.parentElement.children].indexOf(e));e=e.parentElement;}
    const r=el.getBoundingClientRect();return {path:indexes,y:r.top,bottom:r.bottom,fullyVisible:r.bottom<=innerHeight,text:el.textContent.slice(0,100)};
  });
  const target=language==='zh'?'en':'zh';
  await clickVisible(page,`#barIn button[data-l="${target}"]`);
  await page.waitForFunction(target=>document.documentElement.lang===target,target);
  await page.waitForFunction(()=>!document.documentElement.classList.contains('vt-lang'));
  await page.waitForTimeout(200);
  const after=await page.evaluate(indexes=>{let el=document.querySelector('#page');for(const i of indexes)el=el.children[i];return {y:el.getBoundingClientRect().top,text:el.textContent.slice(0,100)};},anchor.path);
  const delta=Math.abs(after.y-anchor.y);
  await page.evaluate(language=>window.setLang(language,true),language);
  return {pass:anchor.fullyVisible&&delta<=SPEC.languagePinTolerance,from:language,to:target,anchor,after,delta};
}
async function interactionCases(pages,configuration){
  for(let i=0;i<pages.length;i++){
    const page=pages[i];await page.bringToFront();
    const side=i?'react':'html',row={...configuration,side,errors:[],visibilityState:await page.evaluate(()=>document.visibilityState)};
    const stop=(check,error)=>{
      row.errors.push({check,message:errorText(error)});row.pass=false;
      if(error.observation)row[check]=error.observation;
      report.interactions.push(row);
      const failure=error.acceptanceStop?error:new AcceptanceStop(check,{error:errorText(error)});
      failure.configuration=configuration;failure.side=side;throw failure;
    };
    if(row.visibilityState!=='visible')stop('foreground',new Error('Foreground timing prerequisite unavailable: '+side));
    for(const id of ['dash','work']){
      try{row[id]=await hoverCheck(page,id);}catch(error){stop(id,error);}
    }
    for(const [name,fn] of [['drag',()=>dragCheck(page,configuration.key,side)],['theme',()=>themeCheck(page,configuration.theme)],['language',()=>languageCheck(page,configuration.language)]]){
      try{row[name]=await fn();}catch(error){stop(name,error);}
    }
    row.pass=!row.errors.length&&['dash','work'].every(id=>row[id]?.hoverPass&&row[id]?.dimPass&&row[id]?.outsideClickPass)&&['drag','theme','language'].every(id=>row[id]?.pass);
    report.interactions.push(row);
  }
}
function mismatchGroups(rows){
  const groups=new Map();
  for(const row of rows){
    for(const m of row.styleMismatches||[]){
      const key=JSON.stringify([m.property,m.html,m.react]);
      if(!groups.has(key))groups.set(key,{property:m.property,html:m.html,react:m.react,count:0,cases:new Set(),examples:[]});
      const g=groups.get(key);g.count++;g.cases.add(row.key||row.selector);
      if(g.examples.length<3)g.examples.push(`${row.key||row.selector}:${m.path}`);
    }
  }
  return [...groups.values()].map(g=>({...g,cases:[...g.cases]}));
}
function emptyClassOnly(mismatch){
  if(mismatch.kind!=='attrs')return false;
  const a=mismatch.html,b=mismatch.react,keys=[...new Set([...Object.keys(a),...Object.keys(b)])];
  return keys.every(key=>key==='class'?!(a[key]||'').trim()&&!(b[key]||'').trim():a[key]===b[key]);
}
function markdown(){
  const lines=['# HTML / React parity report','',`Run: ${runId}`,`Script SHA-256: \`${report.artifacts.script}\``,
    '',`Automated style/DOM-meaning/interaction phase: **${report.summary?.requiredAutomatedChecksPass?'attained for the stated finite conditions':report.stop?'stopped; see the actual trace and unmet/unverified criterion':report.fatal?'unverified (run error)':'partially attained; see remaining checks'}**. Parent fidelity acceptance still requires review of the reported visual differences.`,
    '',`Strict extra diagnostics: allChecksPass=${report.summary?.allChecksPass}; exit code remains nonzero for unequal raw pixels or even empty class attributes. These extra diagnostics do not create a user requirement for bit-identical screenshots.`,
    '', '## Fixed method','',
    '- Seven sections × six themes × two languages × two viewports = 168 section cases.',
    '- Viewports: 1440×1080 and 390×844. CSS-pixel scale is 1. Normal motion stays enabled.',
    '- Every section element is paired by child-index DOM path. All listed computed properties match exactly, except width/height tolerate at most 1px. Background images compare presence, not stack-specific URLs.',
    '- Screenshots are unmasked. Every unequal RGBA pixel is counted (channel tolerance 0). The pixel ratio and maximum channel delta are descriptive; a zero-difference pass is strict and no visual difference is silently excused.',
    '- Real pointer actions check the actual ux-hover class at 60/220ms. Target-local native forwarding wrappers bracket real class writes; native ux:hover/rest events and MutationRecords corroborate them. Exact descriptors are restored and the same target must stay connected. The old scheduled samples and actual callback times remain diagnostics. Any late write or unsupported/disagreeing trace stops execution for review.',
    '- Other checks retain peer opacity .3, outside-click rest, a held kanban drag with live counts, theme indicator movement plus <=1px alignment after its actual RAF layout settles, and language pin within 2px. A fixed 900ms observation is not a new theme deadline.',
    '- Readiness waits for font loading, background images, actual geometry and finite animations. Sections are visited by scrolling. The gallery category control then All materializes the full shared dataset if lazy scrolling has not loaded it. This is setup, not evidence of natural lazy-load completeness.',
    '- Each configuration requires a new Document response and asserts source-derived initial kanban counts [3, 2, 1, 2]. Each side is brought to the foreground. Fixed chrome is not scrolled by measurement. Ancestor and relevant pseudo-element finite animations finish naturally.',
    '- Theme/language switches use real mouse coordinates on visible, hit-tested controls. This avoids the verified locator auto-scroll artifact on the sticky top bar.',
    '- Page chrome keeps .bar/.rail/.pnav as its computed-style/DOM roots. Visible topbar screenshots target its nonempty .bar-in descendant. Real pointer leave/Esc setup and natural RAF indicator settlement precede capture; no indicator state is forced. Historical zero-height .bar skipped records remain untouched. Targeted reuse adds 24 fresh visible-topbar pairs below, rather than rewriting those old records.',
    '- No real phone, touch hardware or unported samples are claimed.', '', '## Section results','',
    '| Section | Cases | Style mismatches | DOM/content differences | Max pixel ratio | Max channel delta | Interaction results | Errors |',
    '|---|---:|---:|---:|---:|---:|---|---:|'];
  for(const id of SPEC.sections){
    const rows=report.cases.filter(r=>r.section===id),sum=k=>rows.reduce((n,r)=>n+(r[k]?.length||0),0);
    const ratios=rows.map(r=>r.pixels?.differentPixelRatio).filter(Number.isFinite),channels=rows.map(r=>r.pixels?.maxChannelDifference).filter(Number.isFinite);
    let interaction='Not applicable';
    if(id==='dash'||id==='work'){
      const checks=report.interactions.map(r=>r[id]);const pass=checks.filter(c=>c?.hoverPass&&c?.dimPass&&c?.outsideClickPass).length;
      interaction=`${pass}/${report.interactions.length} scope checks pass${id==='work'?`; drag ${report.interactions.filter(r=>r.drag?.pass).length}/${report.interactions.length}`:''}`;
    }
    lines.push(`| #${id} | ${rows.length}/24 | ${sum('styleMismatches')} | ${sum('structureMismatches')} | ${ratios.length?(100*Math.max(...ratios)).toFixed(4)+'%':'unverified'} | ${channels.length?Math.max(...channels):'unverified'} | ${interaction} | ${rows.reduce((n,r)=>n+r.errors.length,0)} |`);
  }
  lines.push('', '## Chrome and interactions','',
    `Chrome: ${report.chrome.length}/72 cases; ${report.chrome.reduce((n,r)=>n+(r.styleMismatches?.length||0),0)} style differences; ${report.chrome.reduce((n,r)=>n+(r.structureMismatches?.length||0),0)} DOM/content differences.`,
    `Interactions: ${report.interactions.filter(r=>r.pass).length}/${report.interactions.length} complete configuration/side checks pass (48 expected).`,
    `Theme indicator: ${report.interactions.filter(r=>r.theme?.pass).length}/48. Language pin: ${report.interactions.filter(r=>r.language?.pass).length}/48.`,
    '');
  if(report.chromeSupplement.length){
    lines.push('', '## Fresh visible-topbar supplement','',
      'These images capture .bar-in. Old .bar style/DOM observations and old skipped-image records remain unchanged. Every unequal RGBA pixel is counted with tolerance 0.',
      '', '| Configuration | Capture | Different pixels | Max channel delta | Evidence |','|---|---|---:|---:|---|');
    for(const row of report.chromeSupplement){
      const p=row.pixels,files=p?.files;
      lines.push(`| ${row.key} | ${row.errors.length?'unverified / stopped':'nonempty paired .bar-in'} | ${Number.isFinite(p?.differentPixelRatio)?(p.differentPixelRatio*100).toFixed(4)+'%':'unverified'} | ${p?.maxChannelDifference??'unverified'} | ${files?`[HTML](${files.html}) · [React](${files.react}) · [diff](${files.diff})`:'missing'} |`);
    }
  }
  lines.push('', '## Remaining differences and explanations','');
  const groups=mismatchGroups([...report.cases,...report.chrome]);
  if(groups.length){
    lines.push('Each group below accounts for every occurrence of that exact property/value difference. These are observed differences, not inferred causes. Causes remain unresolved unless a verified diagnosis is added by the acceptance owner. Full per-element evidence is in raw JSON.','');
    for(const g of groups)lines.push(`- **${g.property}**: HTML \`${String(g.html).replaceAll('`','\\`')}\`; React \`${String(g.react).replaceAll('`','\\`')}\`. ${g.count} occurrence(s). Example: \`${g.examples.join('`, `')}\`. Cause not yet verified; unresolved.`);
  }else lines.push('No observed computed-style differences in completed cases. Incomplete cases are not passes.');
  const structure=[...report.cases,...report.chrome].filter(r=>r.structureMismatches?.length);
  const allStructure=structure.flatMap(r=>r.structureMismatches),emptyClass=allStructure.filter(emptyClassOnly).length;
  if(structure.length)lines.push('',`DOM attribute diagnostics: ${allStructure.length} total, of which ${emptyClass} are solely absent versus empty class attributes. Those leave class membership unchanged; listed computed styles are compared independently. All raw differences remain listed in results.json. Other meaningful DOM/content differences: ${allStructure.length-emptyClass}.`);
  const pixels=[...report.cases,...report.chrome].filter(r=>r.pixels?.differentPixels);
  if(pixels.length)lines.push('',`${pixels.length} screenshot pair(s) contain unequal pixels. Each pair has HTML, React and difference images. Unequal screenshot sizes are compared on the union canvas; absent pixels count as differences. Causes require visual review; no anti-aliasing, alignment or loading explanation is assumed.`);
  const failed=report.interactions.filter(r=>!r.pass);
  for(const row of failed)lines.push('',`- **Interaction ${row.key}/${row.side}**: ${['dash','work'].map(id=>`${id}: hover=${row[id]?.hoverPass??'unverified'}, dim=${row[id]?.dimPass??'unverified'}, outside=${row[id]?.outsideClickPass??'unverified'}`).join('; ')}; drag=${row.drag?.pass??'unverified'}, theme=${row.theme?.pass??'unverified'}, language=${row.language?.pass??'unverified'}. ${row.errors.map(e=>e.check+': '+e.message.split('\n')[0]).join('; ')}. See raw observations; unresolved.`);
  const errors=[...report.cases,...report.chrome].filter(r=>r.errors.length);
  for(const row of errors)lines.push('',`- **Incomplete ${row.key||row.selector}**: ${row.errors.map(e=>e.split('\n')[0]).join('; ')}`);
  if(report.stop)lines.push('',`Execution stopped for review: ${report.stop.message}. Native event time is corroboration, not a replacement user deadline; the class-write bounds and disagreement details remain in the raw trace.`);
  if(report.fatal)lines.push('',`Fatal invocation/environment error: \`${report.fatal.split('\n')[0]}\`. Untested cases are unverified, not target defects.`);
  if(report.reuse)lines.push('', '## Static evidence reuse','',
    `This run reuses exactly 168 section and 72 chrome observations from ${report.reuse.originalRunId}. It does not retake, normalize or rescore their screenshots. Fresh interaction checks are separate observations under the unchanged application/build closure.`,
    `Fresh visible-topbar supplement: ${report.chromeSupplement.length}/24 pairs. This is separately labeled new evidence, not a replacement pixel score for any original row.`,
    `Original results: [bound full run](${rel(report.reuse.originalResults.path)}) (SHA-256 ${report.reuse.originalResults.sha256}). Verified unchanged application inputs: ${report.reuse.applicationFileCount}; immutable static evidence files: ${report.reuse.evidenceFileCount}.`,
    `Reuse plan: ${report.reuse.plan.path} (SHA-256 ${report.reuse.plan.sha256}). Each reused row records its original run, observation time, source results hash and key. All artifact paths are relative to templates/react/parity/, not the new results.json directory.`,
    `Finish verification: ${report.reuse.finishError?'FAILED: '+report.reuse.finishError:report.reuse.finishVerification?.ok?'passed':'unverified'}.`);
  lines.push('', '## Instrument history and qualification','',
    '- Visible chrome correction: the original full2 .bar root had zero height but visible .bar-in children. Its 24 skipped image records remain historical. The replacement reuse plan adds only 24 fresh descendant captures, with the same raw algorithm; default full runs also capture .bar-in while retaining .bar style/DOM paths.',
    '- [Qualified timeline controls](out/timeline-controls-2026-10-31T09-34-05Z/results.json): all ten frozen expected verdicts matched, including planted early/late activation, delayed observer, early write with delayed event, unwrapped write, disagreement and target detachment. This establishes bounded instrument discrimination, not application parity.',
    '- [Actual-entry pilot](out/timeline-pilot-2026-10-31T09-35-47Z/results.json): one pure/zh/1440×1080 configuration on both stacks showed actual class admission intervals 154.6–160.4ms and matching native/MO state; indicators naturally settled and aligned. This alone is not the full interaction matrix.',
    '- [First full run](out/2026-10-31T08-04-50-225Z/results.json): all 168 section comparisons had zero listed style mismatches, but later configurations shared DOM state because hash-only navigation did not reload. Its interaction timing also sampled background pages. It is historical evidence of those observed states, not clean-state matrix acceptance. Exact old script/report are retained beside the raw results.',
    '- First-run DOM differences were exhaustively classified: 864 missing gallery data-state=rest attributes, 412 absent-to-empty class attributes, and 378 empty-to-absent class attributes. Empty class versus absent class changes no CSS class membership. There were no tag or direct-text differences. The 51 style differences were rail widths while active tick pseudo-elements could still change; their cause was not established by the first run.',
    '- [Second-full section geometry diagnostic](out/second-full-relative-geometry.recompute.json), independently recomputed from all 44,160 paired element boxes across 168 cases: maximum differences x=0.046875px, y=0.734375px, width=0.046875px, height=0px; none exceeds 1px. Schemes/controls are exact. This rules out a missed large relative-layout difference within those observations; it does not establish one universal raster cause or erase unequal pixels.',
    '- Gallery pixel-origin diagnosis (table-gallery worker evidence, read and hash-verified by parity worker; pure/zh/1440×1080 only): all 54 source/HTML-inline/React-built image bytes match, and all tile order, relative geometry and CSS geometry match. The section document origins differ by a fractional 0.46875px because React omits upstream sections. This supports crop/raster-origin sampling as the explanation for the first gallery raw 66.1113% difference, not a different image set or masonry layout. It does not explain every sample or every theme/viewport.',
    '- Diagnostic only: a +1 vertical-pixel comparison of the archived gallery pair lowered unequal pixels to 5.7203% and mean absolute RGB-channel delta from 6.7683 to 0.2681. The unshifted raw metric remains the acceptance evidence; no mask, shift or normalized score replaces it. [Asset identity](out/2026-10-31T08-04-50-225Z/table-gallery.gallery-asset-identity.json), [geometry](out/2026-10-31T08-04-50-225Z/table-gallery.gallery-geometry.json), [archived shift diagnosis](out/2026-10-31T08-04-50-225Z/table-gallery.gallery-pixel-shift-diagnosis.json).',
    '- [Initial language probe](out/2026-10-31T08-35-08-949Z/probe-language.json) retained an overbroad whole-body settle error for HTML. This was an instrument scope error, not an HTML defect.',
    '- [Corrected sequencing probe](out/2026-10-31T08-37-00-881Z/probe-language.json): locator clicks moved the viewport before language changed. Genuine mouse clicks kept the same anchor within 0.109375px (HTML) and 0.4375px (React), both isolated and after other interactions. Built artifacts were unchanged; owned resources closed. No core change or acceptance tolerance change was needed.',
    '', '## Resource and loading evidence','',
    `Browser/request/console diagnostics: ${network.length}. Readiness/configuration errors: ${report.diagnostics.filter(d=>d.kind!=='ready').length}. Font statuses and successful readiness observations are retained separately. Errors may limit resource-loading claims even when both renderings agree.`,
    `Owned-resource cleanup: \`${JSON.stringify(report.cleanup)}\`.`, '', '## Evidence','',
    `- [Full results and all mismatches](${rel(path.join(OUT,'results.json'))})`,
    `- [Run environment and exact artifact hashes](${rel(path.join(OUT,'results.json'))}#artifacts)`,
    `- [Preview output](${rel(path.join(OUT,'preview.log'))})`,
    '- Per-case raw JSON and screenshot paths are listed in the full results.',
    '', 'A complete command or generated report is not proof of parity. Any unresolved difference, failed interaction or incomplete case blocks an unconditional parity claim.');
  return lines.join('\n')+'\n';
}

const STATIC_ORACLE_KEYS=['sections','themes','languages','viewports','properties','sizeTolerance','pixelChannelTolerance','chrome'];
async function readBound(reference,label){
  if(!reference||!path.isAbsolute(reference.path)||!/^[a-f0-9]{64}$/.test(reference.sha256))throw new Error('Invalid bound '+label);
  const bytes=await readFile(reference.path);
  if(hash(bytes)!==reference.sha256)throw new Error('Changed bound '+label+': '+reference.path);
  return {bytes,data:JSON.parse(bytes)};
}
async function validateStaticReuse(planPath,apply=false){
  if(!path.isAbsolute(planPath))throw new Error('Reuse plan path must be absolute');
  const planBytes=await readFile(planPath),plan=JSON.parse(planBytes);
  if(plan.profile!=='parity-static-reuse/v1')throw new Error('Unsupported reuse plan');
  const supplement={selector:'.bar',captureSelector:'.bar-in',caseCount:24,pixelChannelTolerance:0,naturallySettledIndicators:true};
  if(JSON.stringify(plan.freshChromeSupplement)!==JSON.stringify(supplement))throw new Error('Visible-topbar supplement is not exactly bound');
  if(JSON.stringify(plan.excludedInstrumentPaths)!==JSON.stringify(['templates/react/parity/check.mjs']))
    throw new Error('Reuse may exclude only the replaced original checker, never application inputs');
  const original=await readBound(plan.originalResults,'original full results');
  const closure=await readBound(plan.originalClosureManifest,'original application closure');
  const evidence=await readBound(plan.staticEvidenceManifest,'original static evidence manifest');
  if(plan.expectedClosureCount!==Object.keys(closure.data).length)throw new Error('Wrong original closure size');
  if(original.data.fatal||original.data.summary?.caseErrors||original.data.cases.length!==168||original.data.chrome.length!==72)
    throw new Error('Original static matrix is incomplete');
  const originalOracles=Object.fromEntries(STATIC_ORACLE_KEYS.map(k=>[k,original.data.spec[k]]));
  const currentOracles=Object.fromEntries(STATIC_ORACLE_KEYS.map(k=>[k,SPEC[k]]));
  if(JSON.stringify(originalOracles)!==JSON.stringify(currentOracles)||JSON.stringify(plan.staticOracles)!==JSON.stringify(currentOracles))
    throw new Error('Original/current/plan static oracles differ');
  const expectedSectionKeys=[],expectedChromeKeys=[];
  for(const viewport of SPEC.viewports)for(const theme of SPEC.themes)for(const language of SPEC.languages){
    const key=`${theme}-${language}-${viewport.width}x${viewport.height}`;
    SPEC.sections.forEach(section=>expectedSectionKeys.push(key+'-'+section));
    SPEC.chrome.forEach(selector=>expectedChromeKeys.push(key+'|'+selector));
  }
  if(JSON.stringify(original.data.cases.map(row=>row.key).sort())!==JSON.stringify(expectedSectionKeys.sort())||
    JSON.stringify(original.data.chrome.map(row=>row.key+'|'+row.selector).sort())!==JSON.stringify(expectedChromeKeys.sort()))
    throw new Error('Original matrix coverage has missing or duplicate cases');
  const originalRawFiles=new Set();
  for(const row of [...original.data.cases,...original.data.chrome]){
    if(row.errors?.length||!row.raw||!Array.isArray(row.styleMismatches)||!Array.isArray(row.structureMismatches))
      throw new Error('Original case is missing checkable static evidence');
    originalRawFiles.add(row.raw);
    for(const file of Object.values(row.pixels?.files||{}))originalRawFiles.add(file);
  }
  if(JSON.stringify([...originalRawFiles].sort())!==JSON.stringify(Object.keys(evidence.data).sort()))
    throw new Error('Evidence manifest does not exactly cover original rows');
  const checkedApplication=[];
  for(const [file,expected] of Object.entries(closure.data)){
    if(plan.excludedInstrumentPaths.includes(file))continue;
    const target=path.resolve(REPO,file);
    if(!target.startsWith(REPO+path.sep)||hash(await readFile(target))!==expected)throw new Error('Changed application/build input: '+file);
    checkedApplication.push(file);
  }
  const checkedEvidence=[];
  for(const [file,expected] of Object.entries(evidence.data)){
    const target=path.resolve(HERE,file);
    if(!target.startsWith(path.join(HERE,'out')+path.sep)||hash(await readFile(target))!==expected)throw new Error('Changed original evidence: '+file);
    checkedEvidence.push(file);
  }
  const expectedInstrumentPaths=['templates/react/parity/check.mjs','templates/react/parity/timeline.mjs'];
  if(JSON.stringify(Object.keys(plan.currentInstruments).sort())!==JSON.stringify(expectedInstrumentPaths.sort()))
    throw new Error('Current instrument manifest is incomplete');
  for(const [file,expected] of Object.entries(plan.currentInstruments))
    if(hash(await readFile(path.join(REPO,file)))!==expected)throw new Error('Changed current instrument: '+file);
  const control=await readBound(plan.controlResults,'qualified controls');
  const controlKey=await readBound(plan.controlKey,'control answer key');
  const pilot=await readBound(plan.pilotResults,'qualified pilot');
  const pilotPlan=await readBound(plan.pilotPlan,'pilot plan');
  const geometry=await readBound(plan.geometryDiagnostic,'relative geometry diagnostic');
  if(geometry.data.sourceSha256!==plan.originalResults.sha256)throw new Error('Geometry diagnostic has a different original result binding');
  const fixtureBytes=await readFile(plan.controlFixture.path);
  if(hash(fixtureBytes)!==plan.controlFixture.sha256||controlKey.data.fixtureSha256!==plan.controlFixture.sha256)
    throw new Error('Qualified control fixture changed');
  if(!control.data.pass||!pilot.data.pass||control.data.answerKeyHash!==plan.controlKey.sha256||pilot.data.planHash!==plan.pilotPlan.sha256)
    throw new Error('Control/pilot qualification is not bound to its exact key/plan');
  const qualified=plan.qualifiedTimelineSha256;
  if(plan.currentInstruments['templates/react/parity/timeline.mjs']!==qualified||controlKey.data.instrument.sha256!==qualified||pilotPlan.data.instrument.sha256!==qualified)
    throw new Error('Qualified timeline was replaced');
  if(pilotPlan.data.controlResults.sha256!==plan.controlResults.sha256||
    pilotPlan.data.sourceManifestSha256!==plan.originalClosureManifest.sha256||controlKey.data.sourceManifestSha256!==plan.originalClosureManifest.sha256)
    throw new Error('Qualification and reused static evidence have different input bindings');
  const receipt={ok:true,checkedAt:new Date().toISOString(),plan:{path:planPath,sha256:hash(planBytes)},
    originalResults:plan.originalResults,originalClosureManifest:plan.originalClosureManifest,
    staticEvidenceManifest:plan.staticEvidenceManifest,staticOracles:currentOracles,
    applicationFileCount:checkedApplication.length,evidenceFileCount:checkedEvidence.length,
    currentInstruments:plan.currentInstruments,controlResults:plan.controlResults,pilotResults:plan.pilotResults,geometryDiagnostic:plan.geometryDiagnostic,freshChromeSupplement:plan.freshChromeSupplement,
    mechanicalOnly:true,semanticReviewRequired:true};
  if(apply){
    report.mode='interactions-only';report.evidencePathsBase='templates/react/parity (repository-relative)';
    report.reuse={...receipt,originalRunId:original.data.runId,originalStartedAt:original.data.startedAt,originalFinishedAt:original.data.finishedAt};
    const origin={runId:original.data.runId,results:rel(plan.originalResults.path),resultsSha256:plan.originalResults.sha256,
      observedAt:original.data.finishedAt,evidencePathsBase:report.evidencePathsBase,staticOnly:true};
    // Paths in rows remain relative to parity/, as in the original report.
    // No pixels are readjusted or rescored and old artifacts are never rewritten.
    report.cases=original.data.cases.map(row=>({...row,origin:{...origin,key:row.key}}));
    report.chrome=original.data.chrome.map(row=>({...row,origin:{...origin,key:row.key,selector:row.selector}}));
  }
  return receipt;
}
function runOptions(){
  const args=process.argv.slice(2),interactionsOnly=args.includes('--interactions-only'),verifyOnly=args.includes('--verify-reuse');
  const at=args.indexOf('--reuse'),reuse=at>=0?args[at+1]:null;
  const allowed=new Set(['--interactions-only','--verify-reuse','--reuse',reuse].filter(Boolean));
  if(args.some(arg=>!allowed.has(arg))||((interactionsOnly||verifyOnly)&&!reuse)||(!interactionsOnly&&!verifyOnly&&reuse))
    throw new Error('Usage: node parity/check.mjs [--interactions-only|--verify-reuse --reuse <absolute-plan.json>]');
  if(interactionsOnly&&verifyOnly)throw new Error('Choose execution or read-only verification');
  return {interactionsOnly,verifyOnly,reuse};
}

async function main(options={interactionsOnly:false,reuse:null}){
  await mkdir(OUT,{recursive:true});await mkdir(path.join(OUT,'raw'),{recursive:true});await mkdir(path.join(OUT,'interactions'),{recursive:true});
  report.artifacts.script=hash(await readFile(fileURLToPath(import.meta.url)));
  report.artifacts.timeline=hash(await readFile(path.join(HERE,'timeline.mjs')));
  report.mode=options.interactionsOnly?'interactions-only':'full';
  if(options.interactionsOnly)await validateStaticReuse(options.reuse,true);
  report.artifacts.html=hash(await readFile(path.join(REPO,'templates/html/ui-handbook.html')));
  report.artifacts.reactEntry=hash(await readFile(path.join(TEMPLATE,'dist/index.html')));
  report.artifacts.gallery=hash(await readFile(path.join(REPO,'core/dist/gallery.json')));
  report.environment.galleryCount=JSON.parse(await readFile(path.join(REPO,'core/dist/gallery.json'),'utf8')).length;
  const work=JSON.parse(await readFile(path.join(REPO,'core/content/work.json'),'utf8'));
  report.environment.initialKanbanCounts=work.columns.map(column=>column.tasks.length);
  const urls=await startServers();
  handles.browser=await chromium.launch({executablePath:CHROME,headless:true});
  report.environment.browserVersion=handles.browser.version();
  for(const viewport of SPEC.viewports){
    const context=await handles.browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'no-preference'});
    const pages=[await context.newPage(),await context.newPage()];
    pages.forEach((page,i)=>{observe(page,i?'react':'html');page.setDefaultTimeout(SPEC.settleTimeout);});
    try{
      for(const theme of SPEC.themes)for(const language of SPEC.languages){
        const configuration={theme,language,viewport,key:`${theme}-${language}-${viewport.width}x${viewport.height}`};
        console.log(`Parity ${configuration.key}`);
        try{
          const ready=[];
          for(let i=0;i<pages.length;i++)ready.push(await pageReady(pages[i],i?urls.react:urls.html,theme,language));
          report.diagnostics.push({configuration,kind:'ready',html:ready[0],react:ready[1]});
          if(!options.interactionsOnly){
            for(const id of SPEC.sections)await sectionCase(pages,configuration,id);
            await chromeCase(pages,configuration);
          }else await topbarSupplement(pages,configuration);
          await interactionCases(pages,configuration);
        }catch(error){
          report.diagnostics.push({configuration,kind:'configuration-error',message:errorText(error)});
          if(error.acceptanceStop)throw error;
          if(options.interactionsOnly)throw new AcceptanceStop('configuration-readiness',{configuration,error:errorText(error)});
          for(const id of SPEC.sections)if(!report.cases.some(r=>r.key===configuration.key+'-'+id))report.cases.push({...configuration,key:configuration.key+'-'+id,section:id,errors:[errorText(error)]});
        }
        // Keep evidence usable if the operator cancels a long matrix run.
        await json(path.join(OUT,'checkpoint.json'),report);
      }
    }finally{await context.close();}
  }
}
export {SPEC,OUT,HERE,REPO,TEMPLATE,CHROME,report,handles,startServers,cleanup,pageReady,settle,away,
  hoverCheck,dragCheck,themeCheck,languageCheck,observe};
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
const options=runOptions();
if(options.verifyOnly){
  try{console.log(JSON.stringify(await validateStaticReuse(options.reuse,false),null,2));}
  catch(error){console.error(JSON.stringify({ok:false,error:errorText(error),mechanicalOnly:true,semanticReviewRequired:true},null,2));process.exitCode=1;}
}else{
try{await main(options);}catch(error){
  if(error.acceptanceStop){report.stop={check:error.check,configuration:error.configuration,side:error.side,observation:error.observation,message:error.message};console.error(error.message);}
  else{report.fatal=errorText(error);console.error(report.fatal);}
}
finally{
  await cleanup();
  report.finishedAt=new Date().toISOString();report.network=network;
  if(report.reuse)try{report.reuse.finishVerification=await validateStaticReuse(report.reuse.plan.path,false);}
  catch(error){report.reuse.finishError=errorText(error);report.fatal=report.fatal||'Reuse binding changed during run: '+errorText(error);}
  const rows=[...report.cases,...report.chrome];
  report.summary={sectionCases:report.cases.length,expectedSectionCases:168,chromeCases:report.chrome.length,
    styleMismatches:rows.reduce((n,r)=>n+(r.styleMismatches?.length||0),0),
    structureMismatches:rows.reduce((n,r)=>n+(r.structureMismatches?.length||0),0),
    unequalScreenshots:rows.filter(r=>r.pixels?.differentPixels).length,
    caseErrors:rows.reduce((n,r)=>n+r.errors.length,0),interactionPasses:report.interactions.filter(r=>r.pass).length,
    interactionCases:report.interactions.length,
    freshTopbarCases:report.chromeSupplement.length,
    freshTopbarUnequalScreenshots:report.chromeSupplement.filter(row=>row.pixels?.differentPixels).length};
  const topbarSupplementComplete=report.mode!=='interactions-only'||report.chromeSupplement.length===24&&
    report.chromeSupplement.every(row=>!row.errors.length&&!row.pixels?.skipped&&!row.pixels?.error&&Object.keys(row.pixels?.files||{}).length===3);
  report.summary.meaningfulDOMMismatches=rows.reduce((n,row)=>n+(row.structureMismatches||[]).filter(m=>!emptyClassOnly(m)).length,0);
  report.summary.requiredAutomatedChecksPass=!report.fatal&&!report.stop&&topbarSupplementComplete&&report.cases.length===168&&report.chrome.length===72&&
    report.interactions.length===48&&report.interactions.every(row=>row.pass)&&!report.summary.styleMismatches&&!report.summary.meaningfulDOMMismatches&&
    !report.summary.caseErrors&&!rows.some(row=>row.pixels?.error||row.assets?.flat().some(asset=>!asset.ok))&&
    !network.length&&!report.diagnostics.some(d=>d.kind!=='ready')&&!report.cleanup.errors.length;
  report.summary.allChecksPass=!report.fatal&&!report.stop&&topbarSupplementComplete&&!report.summary.freshTopbarUnequalScreenshots&&report.cases.length===168&&report.chrome.length===72&&
    report.interactions.length===48&&report.interactions.every(r=>r.pass)&&
    !report.summary.styleMismatches&&!report.summary.structureMismatches&&!report.summary.unequalScreenshots&&
    !report.summary.caseErrors&&!rows.some(r=>r.pixels?.error||r.assets?.flat().some(a=>!a.ok))&&
    !network.length&&!report.diagnostics.some(d=>d.kind!=='ready')&&report.cleanup.errors.length===0;
  await mkdir(OUT,{recursive:true});
  await writeFile(path.join(OUT,'preview.log'),previewLog);
  await json(path.join(OUT,'results.json'),report);
  await json(path.join(HERE,'out','latest.json'),{runId,results:rel(path.join(OUT,'results.json'))});
  await writeFile(path.join(HERE,'report.md'),markdown());
  console.log(JSON.stringify(report.summary,null,2));
  console.log(`Evidence: ${OUT}`);
  process.exitCode=report.summary.allChecksPass?0:1;
}
}
}
