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
  sections: ['terms', 'schemes', 'shape', 'controls', 'workspace', 'dash', 'canvas', 'maps', 'agents', 'more', 'work', 'table', 'gallery', 'daily', 'values', 'refs'],
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
  stableShotAttempts: 8,
  stableShotDelay: 350,
  nearestNeighbourWait: 2500,
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
      // The phone tap repeats a transform forever. Its painted bounds cannot
      // settle, but its actual layout can. Keep every node in snapshots and
      // screenshots; use the natural layout box only for this repeating marker.
      const geometry=nodes.map(e=>{
        const repeatingTap=e.matches('#agents .ph-tap')&&e.getAnimations().some(a=>a.playState==='running'&&a.effect?.getComputedTiming().endTime===Infinity);
        if(repeatingTap)return [e.offsetLeft,e.offsetTop,e.offsetWidth,e.offsetHeight,e.textContent?.length].join(',');
        const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height,e.textContent?.length].join(',');
      }).join('|');
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
  if(id==='agents'){
    // Match the shared default series through real visibility, not a seeded
    // random source or altered DOM oracle. Live updates are checked separately.
    const state=await page.evaluate(()=>({theme:document.documentElement.dataset.scheme,language:document.documentElement.lang}));
    const fresh=await pageReady(page,page.url(),state.theme,state.language);
    await page.locator('#mob-grid').evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.evaluate(()=>{const root=document.querySelector('#agents');scrollTo({top:Math.max(0,scrollY+root.getBoundingClientRect().top-innerHeight),behavior:'instant'});});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await settle(page,selector,false);
    const fixture=await page.evaluate(()=>({balance:document.querySelector('#mb').textContent,offscreen:document.querySelector('#mob').getBoundingClientRect().top>=innerHeight,unrevealed:[...document.querySelector('#mob-grid').children].filter(node=>node.classList.contains('pre')).length}));
    if(fixture.balance!=='$134.10'||!fixture.offscreen||fixture.unrevealed)throw new Error('Native Agent default visibility fixture not established: '+JSON.stringify(fixture));
    report.diagnostics.push({kind:'ready',scope:'agents-native-default-visibility',document:fresh,fixture});
  }else{
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
  }
  await settle(page,selector,id!=='agents');
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
  await settle(page,selector,id!=='agents');
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
        if(a.name.startsWith('data-'))attrs[a.name]=a.value;
        else if(a.name==='class'){
          // class is compared as its token set: an empty attribute and an absent one select the same CSS rules.
          const tokens=a.value.split(/\s+/).filter(Boolean).sort().join(' ');
          if(tokens)attrs.class=tokens;
        }
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
// Places a section on a whole document pixel on both sides. React omits unported
// sections, so without this the same section starts at a different pixel fraction
// and text rasterises differently. Only body padding above the section changes.
async function alignOrigin(page,selector) {
  const offset=await page.evaluate(selector=>{
    const body=document.body;body.style.removeProperty('padding-top');
    const top=document.querySelector(selector).getBoundingClientRect().top+scrollY;
    const shift=Math.ceil(top)-top;
    if(shift)body.style.paddingTop=parseFloat(getComputedStyle(body).paddingTop)+shift+'px';
    return document.querySelector(selector).getBoundingClientRect().top+scrollY;
  },selector);
  if(offset!==Math.round(offset))throw new Error(`Section origin ${offset} is not whole at ${selector}`);
  await settle(page,selector);
}
// Removes the section's siblings for the capture, so it sits at the same document position on both sides.
// React omits unported sections; otherwise a neighbour's shadow can fall inside the capture, and gradient
// dithering and image raster, which follow document coordinates, differ by a level or two.
async function isolate(page,selector,on) {
  await page.evaluate(({selector,on})=>{
    const section=document.querySelector(selector);
    [...section.parentElement.children].filter(e=>e!==section&&!e.matches('.bar,.rail,.pnav,script,style')).forEach(e=>{
      if(on){e.dataset.parityStyle=e.getAttribute('style')||'';e.style.setProperty('display','none','important');}
      else{e.setAttribute('style',e.dataset.parityStyle||'');delete e.dataset.parityStyle;}
    });
    if(on){
      scrollTo({top:0,behavior:'instant'});
      // Composited layers keep the pixel snapping of their old page position; rebuilding them at the new one removes it.
      section.style.setProperty('display','none');section.getBoundingClientRect();section.style.removeProperty('display');
    }
  },{selector,on});
  if(on)await settle(page,selector,false);
}
// Infinite loops such as the skeleton shimmer sit at the same time on both sides for one frame; their keyframes still show.
async function holdLoops(page,hold) {
  await page.evaluate(async hold=>{
    if(hold){
      window.__parityHeld=document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getComputedTiming().endTime===Infinity);
      window.__parityHeld.forEach(a=>{a.pause();a.currentTime=0;});
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    }else{(window.__parityHeld||[]).forEach(a=>a.play());window.__parityHeld=[];}
  },hold);
}
// Fixed chrome is clipped from the viewport: a locator screenshot of the top bar scrolls the page by 540px.
async function captureClip(page,selector,file) {
  const box=await page.locator(selector).boundingBox();
  const x=Math.floor(box.x),y=Math.floor(box.y),clip={x,y,width:Math.ceil(box.x+box.width)-x,height:Math.ceil(box.y+box.height)-y};
  return {box,bytes:await page.screenshot({path:file,clip,animations:'allow'})};
}
// Text in a composited sticky cell can repaint after the first frame, so capture until two frames agree.
async function stableShot(page,selector,file) {
  let last=await page.locator(selector).screenshot({path:file,animations:'allow'});
  for(let attempt=0;attempt<SPEC.stableShotAttempts;attempt++){
    await page.waitForTimeout(SPEC.stableShotDelay);
    const next=await page.locator(selector).screenshot({path:file,animations:'allow'});
    if(Buffer.compare(last,next)===0)return next;
    last=next;
  }
  return last;
}
// Chromium's smoothed downscale of one image varies with what else the page has drawn from that image.
// Nearest-neighbour sampling has no such state: zero here means the same image, box and text, whatever the raw count.
async function nearestNeighbourDifference(pages,selector) {
  const bytes=[];
  for(const page of pages){
    await page.bringToFront();
    const style=await page.addStyleTag({content:'.pic{image-rendering:pixelated!important}'});
    await isolate(page,selector,true);await page.waitForTimeout(SPEC.nearestNeighbourWait);await holdLoops(page,true);
    bytes.push(await stableShot(page,selector,undefined));
    await isolate(page,selector,false);await holdLoops(page,false);
    await style.evaluate(node=>node.remove());
  }
  const {differentPixels,maxChannelDifference}=pixelDifference(...bytes).metrics;
  return {differentPixels,maxChannelDifference};
}
async function capturePair(pages,selector,key,directory='screenshots',fixed=false) {
  const files={html:path.join(OUT,directory,key+'-html.png'),react:path.join(OUT,directory,key+'-react.png'),
    diff:path.join(OUT,directory,key+'-diff.png')};
  await mkdir(path.dirname(files.html),{recursive:true});
  const visible=await Promise.all(pages.map(page=>page.locator(selector).isVisible()));
  if(!visible[0]&&!visible[1])return {skipped:'Both elements have display:none or no visible box under this viewport.',files:{}};
  if(!visible.every(Boolean))return {error:'Only one corresponding element is visible',visible,files:{}};
  const bytes=[],boxes=[];
  for(let i=0;i<pages.length;i++){
    const page=pages[i];await page.bringToFront();await settle(page,selector,false);
    const file=files[i?'react':'html'];
    await holdLoops(page,true);
    if(fixed){const shot=await captureClip(page,selector,file);boxes.push(shot.box);bytes.push(shot.bytes);}
    else{
      await holdLoops(page,false);await isolate(page,selector,true);await holdLoops(page,true);
      boxes.push(await page.locator(selector).boundingBox());
      bytes.push(await stableShot(page,selector,file));
      await isolate(page,selector,false);
    }
    await holdLoops(page,false);
  }
  const result=pixelDifference(...bytes);await writeFile(files.diff,result.diff);
  if(result.metrics.differentPixels&&!fixed)result.metrics.nearestNeighbour=await nearestNeighbourDifference(pages,selector);
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
    row.pixels=await capturePair(pages,'.bar-in',configuration.key+'-visible-topbar','chrome-supplement',true);
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
  for(const page of pages){await page.bringToFront();await settle(page,'#dash');await alignOrigin(page,'#dash');
    // The top bar blurs what lies behind it, so that must be #dash on both sides, not the differing section above it.
    await page.evaluate(()=>scrollBy({top:100,behavior:'instant'}));await settle(page,'#dash',false);}
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
      row.pixels=await capturePair(pages,row.captureSelector,key,'chrome',true);
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
async function canvasCheck(page){
  const data=JSON.parse(await readFile(path.join(REPO,'core/content/canvas.json'),'utf8'));
  const checks=[],add=(id,pass,observation)=>checks.push({id,pass:!!pass,observation});
  await page.keyboard.press('Escape');
  const camera=page.locator('#nodeStage .nd[data-id="cam"]');
  await camera.scrollIntoViewIfNeeded();await camera.click();
  await page.waitForFunction(()=>document.querySelector('#nodeStage .nd[data-id="cam"]')?.classList.contains('ux-focus')&&document.querySelectorAll('#wires .wire.rel').length>0,null,{timeout:SPEC.settleTimeout});
  const focus=await page.evaluate(()=>({name:document.querySelector('#nodeName').textContent,related:document.querySelectorAll('#nodeStage .nd.rel').length,wires:document.querySelectorAll('#wires .wire.rel').length,pulses:document.querySelectorAll('#wires .pulse').length}));
  const related=new Set(['cam']);data.edges.forEach(([a,b])=>{if(a==='cam')related.add(b);if(b==='cam')related.add(a);});
  add('camera-focus',focus.name===data.nodes.find(n=>n.id==='cam').t&&focus.related===related.size&&focus.wires===data.edges.filter(e=>e.includes('cam')).length&&focus.pulses===focus.wires,focus);
  const toggle=page.locator('#cfg .cfg[data-i="0"] .cfg-toggle'),before=await toggle.getAttribute('aria-expanded');await toggle.click();
  await page.waitForFunction(before=>document.querySelector('#cfg .cfg[data-i="0"] .cfg-toggle')?.getAttribute('aria-expanded')!==before,before,{timeout:SPEC.settleTimeout});
  const folded=await toggle.getAttribute('aria-expanded');add('config-fold',folded!==before,{before,after:folded});
  await page.locator('#cfg .cfg[data-i="0"] .grip').press('ArrowDown');
  await page.waitForFunction(()=>document.querySelector('#cfg .cfg')?.dataset.i==='1',null,{timeout:SPEC.settleTimeout});
  const order=await page.locator('#cfg .cfg').evaluateAll(items=>items.map(item=>Number(item.dataset.i)));add('config-keyboard-order',JSON.stringify(order)===JSON.stringify([1,0,...data.configItems.slice(2).map((_,i)=>i+2)]),order);
  await camera.scrollIntoViewIfNeeded();const dragBefore=await camera.evaluate(el=>({x:el.offsetLeft,y:el.offsetTop,paths:[...document.querySelectorAll('#wires .wire')].map(p=>p.getAttribute('d'))})),box=await camera.boundingBox();
  if(!box)throw new Error('Canvas camera has no visible drag box');const sx=box.x+box.width/2,sy=box.y+box.height/2;
  await page.mouse.move(sx,sy);await page.mouse.down();try{await page.mouse.move(sx+28,sy+16,{steps:8});}finally{await page.mouse.up();}
  await page.waitForFunction(before=>{const el=document.querySelector('#nodeStage .nd[data-id="cam"]');return el.dataset.dragged==='true'&&(el.offsetLeft!==before.x||el.offsetTop!==before.y);},dragBefore,{timeout:SPEC.settleTimeout});
  const dragAfter=await camera.evaluate(el=>({x:el.offsetLeft,y:el.offsetTop,paths:[...document.querySelectorAll('#wires .wire')].map(p=>p.getAttribute('d')),dragged:el.dataset.dragged,dragClass:el.classList.contains('drag')}));
  add('node-drag-wires',dragAfter.dragged==='true'&&!dragAfter.dragClass&&(dragAfter.x!==dragBefore.x||dragAfter.y!==dragBefore.y)&&JSON.stringify(dragAfter.paths)!==JSON.stringify(dragBefore.paths),{before:dragBefore,after:dragAfter});
  await page.locator('#canvas .sec-h h2').click();
  await page.waitForFunction(()=>!document.querySelector('#nodeStage .nd.ux-focus'),null,{timeout:SPEC.settleTimeout});
  const output=page.locator('#nodeApp [data-cv="z"]'),zoomBefore=await output.textContent();await page.locator('#nodeApp [data-cv="in"]').click();
  await page.waitForFunction(before=>document.querySelector('#nodeApp [data-cv="z"]').textContent!==before,zoomBefore,{timeout:SPEC.settleTimeout});const zoomAfter=await output.textContent();await page.locator('#nodeApp [data-cv="fit"]').click();add('canvas-zoom',zoomBefore!==zoomAfter,{before:zoomBefore,after:zoomAfter});
  await page.locator('#runBtn').click();await page.waitForFunction(()=>document.querySelector('#runBtn').disabled&&document.querySelectorAll('#nodeStage .nd.run').length>0,null,{timeout:SPEC.settleTimeout});add('run-start',true,{disabled:await page.locator('#runBtn').isDisabled()});
  await page.keyboard.press('Escape');const group=page.locator('#bp .bp-g').first();await group.scrollIntoViewIfNeeded();await group.click();
  await page.waitForFunction(()=>document.querySelector('#bp .bp-g')?.classList.contains('ux-focus')&&document.querySelectorAll('#bpSide .bp-tile').length===4&&document.querySelectorAll('#bpSvg .pulse').length>0,null,{timeout:SPEC.settleTimeout});
  await settle(page,'#bpSide',false);
  const detail=await page.evaluate(()=>({text:document.querySelector('#bpSide').textContent.replace(/\s+/g,' ').trim(),title:document.querySelector('#bpSide .between b').textContent,tiles:document.querySelectorAll('#bpSide .bp-tile').length,steps:[...document.querySelectorAll('#bpSide .row.sm .tag')].map(el=>el.textContent),off:document.querySelectorAll('#bp .off').length,pulses:document.querySelectorAll('#bpSvg .pulse').length}));
  add('blueprint-summary',detail.title===data.blueprint.groups[0].n&&detail.tiles===4&&detail.steps.length===Object.keys(data.blueprint.groups[0].nodes).length&&detail.off>0&&detail.pulses>0,detail);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#bp .bp-g.ux-focus')&&!document.querySelector('#bpSvg .pulse'),null,{timeout:SPEC.settleTimeout});
  const retained=await page.locator('#bpSide').evaluate(el=>el.textContent.replace(/\s+/g,' ').trim());add('blueprint-blur-retains-detail',retained===detail.text,{before:detail.text,after:retained});
  await page.waitForFunction(()=>!document.querySelector('#runBtn').disabled&&!document.querySelector('#nodeStage .nd.run')&&!document.querySelector('#wires .wire.on'),null,{timeout:SPEC.settleTimeout});add('run-finish',true,{disabled:await page.locator('#runBtn').isDisabled(),running:await page.locator('#nodeStage .nd.run').count()});
  return {checks,pass:checks.every(check=>check.pass),signature:{name:focus.name,related:focus.related,wires:focus.wires,folded,order,moved:checks.find(c=>c.id==='node-drag-wires').pass,zoomed:zoomBefore!==zoomAfter,detail:detail.text,steps:detail.steps,retained:retained===detail.text,runFinished:checks.at(-1).pass}};
}


// Section-owned checks use public DOM and real input. No clocks, random sources,
// application state or style are replaced. Static sections have no invented action.
const REMAINING_SECTIONS=['maps','agents','more','daily','terms','values','refs'];
async function remainingCheck(page,section){
  const checks=[],add=(id,pass,observation)=>checks.push({id,pass:!!pass,observation});
  const c=JSON.parse(await readFile(path.join(REPO,'core/content',section+'.json'),'utf8'));
  const click=async selector=>{
    const target=page.locator(selector);await target.scrollIntoViewIfNeeded();
    // Core tools appear on genuine component intent. A locator click cannot
    // establish that intent while it is waiting for a hidden tool to be visible.
    if(await target.getAttribute('data-tool')!==null){const component=target.locator('xpath=ancestor::*[@data-cmp][1]');if(await component.count())await component.hover();}
    await target.click();
  };
  const outside=async()=>{await page.keyboard.press('Escape');await click('#'+section+' .sec-h h2');};
  const text=selector=>page.locator(selector).evaluate(node=>node.textContent.replace(/\s+/g,' ').trim());
  let signature;
  try{
    await outside();
    if(section==='maps'){
      await click('#rolemap .rm-cat[data-k="res"]');
      await page.waitForFunction(()=>document.querySelector('#rmW').classList.contains('open'));
      add('category-detail',await text('#rmD .xs.b')==='Research',{roles:await page.locator('#rolemap .rm-role.on').count()});
      await outside();await click('#rolemap .rm-role[data-i="0"]');
      await page.waitForFunction(()=>document.querySelector('#rmW').classList.contains('open'));
      const role=await text('#rmD');add('role-commit',role.includes(c.roles[0].name)&&await page.locator('#rmSvg .pulse').count()>0,role);
      await page.mouse.move(1,1);add('role-saved-on-leave',await text('#rmD')===role,role);
      await outside();await click('#rolemap .rm-cat[data-k="all"]');
      await page.waitForFunction(()=>document.querySelectorAll('#rolemap .rm-role.on').length===10);
      add('all-roles',await page.locator('#rolemap .rm-role.on').count()===c.roles.length,await text('#rmD'));
      await outside();await page.locator('#rolemap .between').first().hover();await click('#rmAuto');await page.waitForFunction(()=>document.querySelector('#rmW').classList.contains('open'));await click('#rmAuto');
      add('auto-tour-start-stop',await page.locator('#rolemap .rm-role.cur').count()===1&&!await page.locator('#rmAuto .ic-pause').count(),await text('#rmAuto'));
      await outside();await click('#fan .fan-l button[data-i="0"]');
      const first=page.locator('#fan .fan-i[data-k="0"]');await first.scrollIntoViewIfNeeded();await first.hover();await page.waitForFunction(()=>document.querySelector('#fan path.l[data-k="0"]').classList.contains('on'));
      add('fan-hover-preview',true,{paths:await page.locator('#fan path.l.on').count()});await first.click();
      await page.waitForFunction(()=>document.querySelector('#fan').classList.contains('open'));
      const fan=await text('#fanR');add('fan-detail',await text('#fanR .big')==='31%'&&await page.locator('#fan .fan-i.on').count()===1,fan);
      await outside();const retained=await text('#fanR');add('fan-blur-retains-detail',retained===fan&&!await page.locator('#fan.open').count(),retained);
      await click('#fan .fan-l button[data-i="1"]');await page.waitForFunction(()=>document.querySelectorAll('#fan .fan-i').length===11);
      add('fan-category',await page.locator('#fan .fan-i').count()===c.fan[1].items.length,{items:await page.locator('#fan .fan-i').count()});
      signature={role,fan,retained,items:await page.locator('#fan .fan-i').count()};
    }else if(section==='agents'){
      await click('#agRun');await page.waitForFunction(()=>document.querySelector('#kTask').textContent.startsWith('11'));await click('#agRun');
      add('scene-play-pause',!await page.locator('#ag.playing').count()&&await text('#kTask')==='11/42',await text('#agTime'));
      await page.waitForFunction(()=>document.querySelectorAll('#agLog div[data-c="2"]').length>=2);
      await click('#crew .crew[data-i="0"]');
      await page.waitForFunction(()=>[...document.querySelectorAll('#agLog>div')].filter(node=>getComputedStyle(node).display!=='none').every(node=>node.dataset.c==='0'));
      const filtered=await page.locator('#agLog>div').evaluateAll(nodes=>nodes.filter(node=>getComputedStyle(node).display!=='none').map(node=>node.dataset.c));add('crew-log-filter',filtered.length>0&&filtered.every(index=>index==='0'),filtered);
      await click('#agReset');await page.waitForFunction(()=>document.querySelector('#kTask').textContent==='5/42'&&document.querySelectorAll('#agLog>div').length===2);
      add('scene-reset',await text('#kErr')==='0'&&!await page.locator('#ag.playing').count(),{task:await text('#kTask'),phone:await text('#phone')});
      await click('#mseg button:nth-of-type(2)');await page.waitForFunction(()=>document.querySelector('#mp').textContent.includes('COPIED BUY'));
      const panel=await text('#mp');add('mobile-tab',await page.locator('#mp>div').count()===c.mobilePanels.COPY.length,panel);
      const plots=await page.locator('#ms').evaluate(svg=>({paths:svg.querySelectorAll('path').length,circles:svg.querySelectorAll('circle').length,valid:[...svg.querySelectorAll('path')].every(path=>!path.getAttribute('d').includes('NaN'))}));add('mobile-plot',plots.paths===2&&plots.circles===1&&plots.valid,plots);
      const balanceBefore=await text('#mb');await page.locator('#mob').scrollIntoViewIfNeeded();await page.waitForFunction(before=>document.querySelector('#mb').textContent!==before,balanceBefore);
      const live=await page.evaluate(()=>{const cy=+document.querySelector('#ms circle').getAttribute('cy'),balance=document.querySelector('#mb').textContent;return {cy,balance,expected:'$'+(78+(85-cy)*1.7).toFixed(2)};});
      add('mobile-live-series-balance',live.balance!==balanceBefore&&live.balance===live.expected,{before:balanceBefore,...live});
      signature={task:await text('#kTask'),phone:await text('#phone'),panel,reset:true,liveValid:live.balance===live.expected};
    }else if(section==='more'){
      const effort=page.locator('#eff');await effort.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await settle(page,'#eff',false);const er=await effort.boundingBox(),ex=er.x+er.width*.95,ey=er.y+er.height/2;if(!await page.evaluate(({x,y})=>document.querySelector('#eff').contains(document.elementFromPoint(x,y)),{x:ex,y:ey}))throw new Error('Effort pointer target is obscured');await page.mouse.click(ex,ey);await effort.press('ArrowLeft');
      add('effort-pointer-keyboard',await effort.getAttribute('aria-valuenow')==='3',await text('#effV'));
      const command=page.locator('#cmdI');await command.fill('zzzz-no-match');await page.waitForFunction(()=>document.querySelectorAll('#cmdL .cmd-r').length===0);add('command-empty',await page.locator('#cmdL .cmd-empty').count()===1,await text('#cmdL'));
      await command.fill('');await command.press('ArrowUp');await page.waitForFunction(()=>document.querySelector('#cmdL .cmd-r.on')?.dataset.i==='2');add('command-keyboard-wrap',true,{selected:await text('#cmdL .cmd-r.on')});await command.press('Escape');
      await click('#vB');await page.waitForFunction(()=>document.querySelector('#vT').textContent!=='00:00');await click('#vB');add('voice-start-stop',!await page.locator('#voice.on').count()&&await text('#vB')===c.labels.voiceOff,await text('#vS'));
      const hold=page.locator('#hold');await hold.scrollIntoViewIfNeeded();const hr=await hold.boundingBox();await page.mouse.move(hr.x+hr.width/2,hr.y+hr.height/2);await page.mouse.down();try{await page.waitForFunction(()=>document.querySelector('#pack').classList.contains('open'));}finally{await page.mouse.up();}add('hold-opens',await page.locator('#pack.open').count()===1&&!await page.locator('#radar.holding').count(),await text('#hold'));
      await click('#cnB');add('card-reveal',await text('#cn')===c.labels.cardShown,await text('#cn'));await click('#cnB');add('card-hide',await text('#cn')===c.labels.cardHidden,await text('#cn'));
      await click('#slice');await click('#slice');const slices=await page.locator('#slice i').evaluateAll(nodes=>({count:nodes.length,round:nodes.every(node=>node.style.borderRadius==='50%'),small:nodes.every(node=>node.style.transform==='scale(0.24)')}));add('slice-two-modes',slices.count===c.counts.slices&&slices.round&&slices.small,slices);await click('#slice');
      await click('#blurGo');add('blur-replay',await page.locator('#blurin.blur-on span').count()>0,await text('#blurin'));
      await click('#regen');await page.waitForFunction(()=>document.querySelector('#streamT').classList.contains('done'));const stream=await text('#streamT');add('stream-regenerate-completes',stream.length>0&&await page.locator('#chips .chip').count()===1,{text:stream,chips:await page.locator('#chips .chip').count()});
      await click('#pillDl');add('invitation-reveal-focus',await page.locator('#pillOpen').isVisible()&&await page.locator('#pillCopy').evaluate(node=>node===document.activeElement),await text('#pillOpen'));
      signature={effort:await text('#effV'),card:await text('#cn'),stream,blur:await text('#blurin'),sliceRestored:await page.locator('#slice i').first().evaluate(node=>node.style.transform==='none')};
    }else if(section==='daily'){
      await click('#cal2 button:last-child');add('mini-calendar',await text('#cal2 button.on')==='31',await text('#cal2 button.on'));
      await click('#daily .d-msg .switch');await page.waitForFunction(()=>document.querySelectorAll('#msgs .msgi').length===3);await page.locator('#msgs .msgi').first().hover();await click('#msgs button[data-m="City"]');await page.waitForFunction(()=>document.querySelectorAll('#msgs .msgi').length===2);add('unread-read-removes-row',await page.locator('#msgs button[data-m="City"]').count()===0,{rows:await page.locator('#msgs .msgi').count()});await click('#daily .d-msg .switch');
      const chats=await page.locator('#chatlog .cmsg').count();await page.locator('#chatf input').fill('parity note');await click('#chatf button');await page.waitForFunction(count=>document.querySelectorAll('#chatlog .cmsg').length===count+2,chats);add('chat-send-reply',await text('#chatlog .cmsg:nth-last-child(2)')==='parity note',await text('#chatlog .cmsg:last-child'));
      await click('#slots button:nth-of-type(1)');await click('#bookGo');await page.waitForFunction(()=>document.querySelector('#bookGo').disabled);await click('#slots button:nth-of-type(2)');await click('#bookGo');await page.waitForFunction(()=>document.querySelector('#bookGo').disabled);
      const tasks=await page.locator('#calList .row').evaluateAll(nodes=>nodes.map(node=>node.textContent.trim())),booked=c.booking.prefix+c.slots[1],previous=c.booking.prefix+c.slots[0];add('booking-replaces-own-work-task',tasks.includes(booked)&&!tasks.includes(previous)&&await text('#cal button.on')===String(c.booking.day),tasks);
      await click('#map .pin:nth-child(3)');const pin=await page.locator('#map .pin.on').getAttribute('aria-label');add('map-pin',await text('#mapList b')===pin,pin);
      const notes=await page.locator('#notes>div').count();await click('#noteAdd');const note=page.locator('#notes>div').first();await note.fill('owned parity note');add('note-add-edit-caret',await page.locator('#notes>div').count()===notes+1&&await note.evaluate(node=>node===document.activeElement&&node.textContent==='owned parity note'),await text('#notes'));
      const setting=page.locator('#setCard input'),initial=await setting.inputValue();await setting.fill('Discard this');await click('#setDrop');add('settings-discard',await setting.inputValue()===initial&&!await page.locator('#setBar.show').count(),await setting.inputValue());await setting.fill('Saved parity');await click('#setSave');await setting.fill('Discard again');await click('#setDrop');add('settings-save-snapshot',await setting.inputValue()==='Saved parity',await setting.inputValue());
      await click('#bkGo');await page.waitForFunction(()=>parseFloat(document.querySelector('#bkB').style.width)>0);await click('#bkGo');const paused=await page.locator('#bkB').evaluate(node=>node.style.width);await page.waitForTimeout(c.timing.backupTick*2);add('backup-pause',await page.locator('#bkB').evaluate(node=>node.style.width)===paused,paused);await click('#bkGo');await page.waitForFunction(()=>parseFloat(document.querySelector('#bkB').style.width)===100);add('backup-complete',await text('#bkS')==='214 / 214',await text('#bkS'));
      signature={calendar:await text('#cal2 button.on'),reply:await text('#chatlog .cmsg:last-child'),tasks,pin,note:await text('#notes>div:first-child'),settings:await setting.inputValue(),backup:await text('#bkS')};
    }else if(section==='terms'||section==='refs'){
      const selector=section==='terms'?'#terms .card':'#reflist .card',card=page.locator(selector).first();await card.scrollIntoViewIfNeeded();await card.hover();await page.waitForFunction(selector=>document.querySelector(selector).classList.contains('ux-hover'),selector);
      add('display-card-hover',!await card.evaluate(node=>node.classList.contains('ux-focus'))&&await card.getAttribute('data-nofocus')!==null,{state:await card.getAttribute('data-state')});
      if(section==='terms'){const count=await page.locator('#terms .term').count();add('all-terms',count===Object.values(c.groups).reduce((n,rows)=>n+rows.length,0),count);signature={count};}
      else{const links=await page.locator('#reflist a').evaluateAll(nodes=>nodes.map(node=>({href:node.getAttribute('href'),target:node.getAttribute('target')})));add('reference-link-contract',JSON.stringify(links)===JSON.stringify(c.items.filter(item=>item.href).map(item=>({href:item.href,target:'_blank'}))),links);signature={cards:await page.locator('#reflist .card').count(),links};}
    }else if(section==='values'){
      const rows=await page.locator('#vt tr').count();add('complete-table',rows===c.rows.length+1,{rows,headers:await page.locator('#vt th').count()});const box=page.locator('#values .fade-x'),geometry=await box.evaluate(node=>({width:node.clientWidth,total:node.scrollWidth}));
      if(geometry.total>geometry.width){await box.scrollIntoViewIfNeeded();await box.hover();await page.mouse.wheel(350,0);await page.waitForFunction(()=>document.querySelector('#values .fade-x').scrollLeft>0);add('native-horizontal-scroll',true,geometry);}signature={rows,headers:await page.locator('#vt th').count()};
    }
    await outside();return {checks,pass:checks.length>0&&checks.every(check=>check.pass),signature};
  }catch(error){try{await outside();}catch{}return {checks,pass:false,error:errorText(error),signature:null};}
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
    if(report.spec.sections.includes('canvas')){try{row.canvas=await canvasCheck(page);}catch(error){stop('canvas',error);}}
    for(const id of ['dash','work']){
      try{console.log(`Interaction start ${configuration.key}/${side}/${id}`);row[id]=await hoverCheck(page,id);console.log(`Interaction done ${configuration.key}/${side}/${id}`);}catch(error){stop(id,error);}
    }
    for(const [name,fn] of [['drag',()=>dragCheck(page,configuration.key,side)],['theme',()=>themeCheck(page,configuration.theme)],['language',()=>languageCheck(page,configuration.language)]]){
      try{console.log(`Interaction start ${configuration.key}/${side}/${name}`);row[name]=await fn();console.log(`Interaction done ${configuration.key}/${side}/${name}`);}catch(error){stop(name,error);}
    }
    if(report.spec.sections.includes('workspace')){
      try{console.log(`Interaction start ${configuration.key}/${side}/workspaceMotion`);const {runMotion}=await import('./motion.mjs');row.workspaceMotion=await runMotion(page);console.log(`Interaction done ${configuration.key}/${side}/workspaceMotion`);}catch(error){stop('workspaceMotion',error);}
    }
    row.own={};
    for(const section of REMAINING_SECTIONS.filter(id=>report.spec.sections.includes(id))){console.log(`Interaction own ${configuration.key}/${side}/${section}`);row.own[section]=await remainingCheck(page,section);if(row.own[section].error)row.errors.push({check:section,message:row.own[section].error});}
    row.pass=Object.values(row.own).every(result=>result.pass)&&!row.errors.length&&['dash','work'].every(id=>row[id]?.hoverPass&&row[id]?.dimPass&&row[id]?.outsideClickPass)&&['drag','theme','language'].every(id=>row[id]?.pass)&&(!report.spec.sections.includes('workspace')||row.workspaceMotion?.allChecksPass)&&(!report.spec.sections.includes('canvas')||row.canvas?.pass);
    report.interactions.push(row);
  }
  for(const section of REMAINING_SECTIONS.filter(id=>report.spec.sections.includes(id))){const rows=report.interactions.filter(row=>row.key===configuration.key),equal=rows.length===2&&rows.every(row=>row.own?.[section]?.signature)&&JSON.stringify(rows[0].own[section].signature)===JSON.stringify(rows[1].own[section].signature);for(const row of rows){if(row.own?.[section]){row.own[section].pairedStateEqual=!!equal;if(!equal){row.own[section].pass=false;row.pass=false;}}}}
  if(report.spec.sections.includes('canvas')){
    const rows=report.interactions.filter(row=>row.key===configuration.key),equal=JSON.stringify(rows[0]?.canvas?.signature)===JSON.stringify(rows[1]?.canvas?.signature);
    for(const row of rows){row.canvas.pairedStateEqual=equal;if(!equal){row.canvas.pass=false;row.pass=false;}}
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
    '',`Strict verdict: allChecksPass=${report.summary?.allChecksPass}. A screenshot pair passes when its pixels are equal, or equal once images are drawn by nearest-neighbour sampling.`,
    '', '## Fixed method','',
    `- ${report.spec.sections.length} selected sections × six themes × two languages × two viewports = ${report.spec.sections.length*24} section cases. Mode: ${report.mode}; static-only does not establish interactions.`,
    '- Viewports: 1440×1080 and 390×844. CSS-pixel scale is 1. Normal motion stays enabled.',
    '- Every section element is paired by child-index DOM path. All listed computed properties match exactly, except width/height tolerate at most 1px. Background images compare presence, not stack-specific URLs.',
    '- Screenshots are unmasked. Every unequal RGBA pixel is counted (channel tolerance 0).',
    '- Each section is captured with its siblings removed, so it sits at the same document position on both sides. React omits unported sections; otherwise neighbours and document coordinates change the raster. Same-stack control runs show those effects vanish within one stack.',
    '- Infinite loops are held at time 0 for the capture on both sides; their keyframes still show. Sections repeat until two frames agree.',
    '- A pair with unequal pixels is captured again with images drawn by nearest-neighbour sampling. Its raw count stays reported; only a nonzero second count fails it.',
    '- Class attributes compare as token sets: empty and absent select the same CSS rules.',
    '- Fixed chrome is clipped from the viewport with #dash behind the top bar, because a locator screenshot of the bar scrolled the page 540px into differing sections.',
    '- Real pointer actions check the actual ux-hover class at 60/220ms. Target-local native forwarding wrappers bracket real class writes; native ux:hover/rest events and MutationRecords corroborate them. Exact descriptors are restored and the same target must stay connected. The old scheduled samples and actual callback times remain diagnostics. Any late write or unsupported/disagreeing trace stops execution for review.',
    '- Other checks retain peer opacity .3, outside-click rest, a held kanban drag with live counts, theme indicator movement plus <=1px alignment after its actual RAF layout settles, and language pin within 2px. A fixed 900ms observation is not a new theme deadline.',
    '- Readiness waits for font loading, background images, actual geometry and finite animations. Sections are visited by scrolling. The gallery category control then All materializes the full shared dataset if lazy scrolling has not loaded it. This is setup, not evidence of natural lazy-load completeness.',
    '- Each configuration requires a new Document response and asserts source-derived initial kanban counts [3, 2, 1, 2]. Each side is brought to the foreground. Fixed chrome is not scrolled by measurement. Ancestor and relevant pseudo-element finite animations finish naturally.',
    '- Theme/language switches use real mouse coordinates on visible, hit-tested controls. This avoids the verified locator auto-scroll artifact on the sticky top bar.',
    '- Page chrome keeps .bar/.rail/.pnav as its computed-style/DOM roots. Visible topbar screenshots target its nonempty .bar-in descendant. Real pointer leave/Esc setup and natural RAF indicator settlement precede capture; no indicator state is forced. Historical zero-height .bar skipped records remain untouched. Targeted reuse adds 24 fresh visible-topbar pairs below, rather than rewriting those old records.',
    '- No real phone, touch hardware or unported samples are claimed.', '', '## Section results','',
    '| Section | Cases | Style mismatches | DOM/content differences | Max pixel ratio | Max channel delta | Interaction results | Errors |',
    '|---|---:|---:|---:|---:|---:|---|---:|'];
  for(const id of report.spec.sections){
    const rows=report.cases.filter(r=>r.section===id),sum=k=>rows.reduce((n,r)=>n+(r[k]?.length||0),0);
    const ratios=rows.map(r=>r.pixels?.differentPixelRatio).filter(Number.isFinite),channels=rows.map(r=>r.pixels?.maxChannelDifference).filter(Number.isFinite);
    let interaction='Not applicable';
    if(id==='dash'||id==='work'){
      const checks=report.interactions.map(r=>r[id]);const pass=checks.filter(c=>c?.hoverPass&&c?.dimPass&&c?.outsideClickPass).length;
      interaction=`${pass}/${report.interactions.length} scope checks pass${id==='work'?`; drag ${report.interactions.filter(r=>r.drag?.pass).length}/${report.interactions.length}`:''}`;
    }else if(id==='workspace'){
      const checked=report.interactions.flatMap(r=>r.workspaceMotion?.checks||[]),passes=checked.filter(c=>c.pass).length;
      interaction=report.mode==='static-only'?'unverified (static-only)':`motion ${passes}/${checked.length}; Story Forge A7 separate raw/reference reports, not inferred`;
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
  if(pixels.length)lines.push('',`${pixels.length} screenshot pair(s) contain unequal raw pixels; ${pixels.filter(r=>r.pixels.nearestNeighbour?.differentPixels!==0).length} stay unequal under nearest-neighbour sampling. Each pair has HTML, React and difference images.`);
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
  const args=process.argv.slice(2), options={interactionsOnly:false,verifyOnly:false,reuse:null,sections:null,staticOnly:false};
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(arg==='--interactions-only')options.interactionsOnly=true;
    else if(arg==='--verify-reuse')options.verifyOnly=true;
    else if(arg==='--static-only')options.staticOnly=true;
    else if(arg==='--reuse'||arg==='--sections'){
      const value=args[++i];if(!value||value.startsWith('--'))throw new Error('Missing value for '+arg);
      if(arg==='--reuse')options.reuse=value;else options.sections=value.split(',');
    }else throw new Error('Unknown option: '+arg);
  }
  if(((options.interactionsOnly||options.verifyOnly)&&!options.reuse)||(!options.interactionsOnly&&!options.verifyOnly&&options.reuse)||
    options.interactionsOnly&&options.verifyOnly||options.reuse&&(options.sections||options.staticOnly))
    throw new Error('Usage: node parity/check.mjs [--sections <comma-separated-ported-ids>] [--static-only] OR [--interactions-only|--verify-reuse --reuse <absolute-plan.json>]');
  if(options.sections&&(!options.sections.length||new Set(options.sections).size!==options.sections.length||options.sections.some(id=>!SPEC.sections.includes(id))))
    throw new Error('Requested sections must be unique ported SPEC.sections entries');
  return options;
}

async function main(options={interactionsOnly:false,reuse:null}){
  await mkdir(OUT,{recursive:true});await mkdir(path.join(OUT,'raw'),{recursive:true});await mkdir(path.join(OUT,'interactions'),{recursive:true});
  report.artifacts.script=hash(await readFile(fileURLToPath(import.meta.url)));
  report.artifacts.timeline=hash(await readFile(path.join(HERE,'timeline.mjs')));
  report.mode=options.interactionsOnly?'interactions-only':options.staticOnly?'static-only':options.sections?'section':'full';
  report.spec={...SPEC,sections:options.sections||SPEC.sections};
  if(!options.staticOnly&&report.spec.sections.includes('workspace'))report.artifacts.motion=hash(await readFile(path.join(HERE,'motion.mjs')));
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
            for(const id of report.spec.sections)await sectionCase(pages,configuration,id);
            if(!options.sections)await chromeCase(pages,configuration);
          }else await topbarSupplement(pages,configuration);
          if(!options.staticOnly)await interactionCases(pages,configuration);
        }catch(error){
          report.diagnostics.push({configuration,kind:'configuration-error',message:errorText(error)});
          if(error.acceptanceStop)throw error;
          if(options.interactionsOnly)throw new AcceptanceStop('configuration-readiness',{configuration,error:errorText(error)});
          for(const id of report.spec.sections)if(!report.cases.some(r=>r.key===configuration.key+'-'+id))report.cases.push({...configuration,key:configuration.key+'-'+id,section:id,errors:[errorText(error)]});
        }
        // Keep evidence usable if the operator cancels a long matrix run.
        await json(path.join(OUT,'checkpoint.json'),report);
      }
    }finally{await context.close();}
  }
}
export {SPEC,OUT,HERE,REPO,TEMPLATE,CHROME,report,handles,startServers,cleanup,pageReady,settle,away,
  hoverCheck,dragCheck,themeCheck,languageCheck,observe,revealSection,alignOrigin,capturePair,
  snapshot,compareSnapshots,remainingCheck,pixelDifference,holdLoops,isolate,stableShot,network};
async function runCli(){
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
  const matrixSize=SPEC.viewports.length*SPEC.themes.length*SPEC.languages.length;
  const expectedSections=report.spec.sections.length*matrixSize, expectedChrome=options.sections?0:SPEC.chrome.length*matrixSize;
  const expectedInteractions=options.staticOnly?0:matrixSize*2;
  report.summary={sectionCases:report.cases.length,expectedSectionCases:expectedSections,chromeCases:report.chrome.length,expectedChromeCases:expectedChrome,expectedInteractionCases:expectedInteractions,
    styleMismatches:rows.reduce((n,r)=>n+(r.styleMismatches?.length||0),0),
    structureMismatches:rows.reduce((n,r)=>n+(r.structureMismatches?.length||0),0),
    unequalScreenshots:rows.filter(r=>r.pixels?.differentPixels).length,
    unequalAfterNearestNeighbour:rows.filter(r=>r.pixels?.differentPixels&&r.pixels?.nearestNeighbour?.differentPixels!==0).length,
    caseErrors:rows.reduce((n,r)=>n+r.errors.length,0),interactionPasses:report.interactions.filter(r=>r.pass).length,
    interactionCases:report.interactions.length,
    ownChecks:report.interactions.reduce((n,row)=>n+Object.values(row.own||{}).reduce((m,result)=>m+result.checks.length,0),0),
    ownPasses:report.interactions.reduce((n,row)=>n+Object.values(row.own||{}).reduce((m,result)=>m+result.checks.filter(check=>check.pass).length,0),0),
    canvasChecks:report.interactions.reduce((n,r)=>n+(r.canvas?.checks.length||0),0),
    canvasPasses:report.interactions.reduce((n,r)=>n+(r.canvas?.checks.filter(c=>c.pass).length||0),0),
    workspaceMotionChecks:report.interactions.reduce((n,r)=>n+(r.workspaceMotion?.checks.length||0),0),
    workspaceMotionPasses:report.interactions.reduce((n,r)=>n+(r.workspaceMotion?.checks.filter(c=>c.pass).length||0),0),
    freshTopbarCases:report.chromeSupplement.length,
    freshTopbarUnequalScreenshots:report.chromeSupplement.filter(row=>row.pixels?.differentPixels).length};
  const topbarSupplementComplete=report.mode!=='interactions-only'||report.chromeSupplement.length===24&&
    report.chromeSupplement.every(row=>!row.errors.length&&!row.pixels?.skipped&&!row.pixels?.error&&Object.keys(row.pixels?.files||{}).length===3);
  report.summary.meaningfulDOMMismatches=rows.reduce((n,row)=>n+(row.structureMismatches||[]).filter(m=>!emptyClassOnly(m)).length,0);
  report.summary.staticChecksPass=!report.fatal&&!report.stop&&topbarSupplementComplete&&report.cases.length===expectedSections&&report.chrome.length===expectedChrome&&
    !report.summary.styleMismatches&&!report.summary.meaningfulDOMMismatches&&!report.summary.caseErrors&&
    !rows.some(row=>row.pixels?.error||row.assets?.flat().some(asset=>!asset.ok))&&
    !network.length&&!report.diagnostics.some(d=>d.kind!=='ready')&&!report.cleanup.errors.length;
  report.summary.requiredAutomatedChecksPass=!options.staticOnly&&report.summary.staticChecksPass&&
    report.interactions.length===expectedInteractions&&report.interactions.every(row=>row.pass);
  report.summary.allChecksPass=report.summary.requiredAutomatedChecksPass&&!report.summary.freshTopbarUnequalScreenshots&&
    !report.summary.structureMismatches&&!report.summary.unequalAfterNearestNeighbour;
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

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
  runCli().catch(error=>{console.error(errorText(error));process.exitCode=1;});
