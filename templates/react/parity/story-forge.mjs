/** Story Forge decision acceptance. Actions are real Playwright pointer/keyboard input.
 * evaluate() is read-only: geometry, computed style, selection and SF_DATA observations.
 * No application functions, synthetic events, clock overrides or state writes are used.
 * This runner does not own/start/stop HTTP servers. Natural playback is opt-in.
 */
import {mkdir, writeFile, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {requireBrowser} from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// These are acceptance inputs/tolerances, not template design or interaction timings.
export const STORY_FORGE_SPEC = Object.freeze({
  themes:['pure','neon','prism','aurora','paper','ember'], languages:['zh','en'],
  viewport:{width:1440,height:900}, geometryTolerance:1, readingTolerance:2,
  settleObservationMs:800, hoverObservationMs:700, readinessTimeoutMs:20000,
  reducedMotion:'no-preference', defaultCases:['data','explore','layers','geometry','lanes','magnifier','watch','tools','chat','reading','drag'],
});

export const STORY_FORGE_COVERAGE = Object.freeze({
  data:['0008/data: shots, units, partitions and cut running times','0008/decisions 1,4,5,9-12 production-data invariants','0008/pointer Shot 3 no cast and Donna line bound to Shot 8'],
  explore:['0006/Explore pan, wheel-pan, pointer-anchored modifier zoom, fit, drag, selection, filters, preview','0011/Story Forge Explore world-coordinate preservation','0012/A4 no text selection during canvas drag'],
  layers:['0006/Create layers and levels','0008/decision 8 effective layer contents','0010/A5 labels, A9 script surface, A11 monitor layers/levels'],
  geometry:['0010/A3 black strip','0010/A6 fixed shot slots and merged blocks','0010/A12 toolbar alignment'],
  lanes:['0010/A1 lane-head centres','0010/A8 gutter, separators, clip overflow, colours, contrast and footage','0010/A10 clip pick and playhead'],
  magnifier:['0010/A7 shot, beat and full-film magnification; playing/dragging suppression'],
  watch:['0014/A1 hover, A2 held strip focus, A3 monitor/preview/outside/Esc','0016/A1-7 lights layer, input exclusion, restoration, script exception, square monitor','0010/A4 cinema preview'],
  tools:['0014/A8 tools do not enter or end watching','0014/A4 actual Tab reaches timeline, Esc restores','0014/A6 play vs held-focus pause semantics','0014/A7 drawn transport pause'],
  chat:['0006/Chat streamed reply and scope','0008/cut C chat claim','0010/A13 exact scope, chips at caret, @ menu and duplicate suppression','0010/A14 history closed/peek/pinned, multi-line push','0014/A5 chat-focused pick does not watch'],
  reading:['0015/A1 no rest highlight, A2 whole grey selection, A3 Shot 4 ownership','0015/A4 single reading mark/no grey, A5 sampled reading point/motion, A7 pause restoration','0015/A9 mark differs from selection'],
  drag:['0010/A10 pointer mapping, drag, edge scroll and release','0015/A8 forward/backward drag reading vs plain click'],
  playback:['0010/A8 natural transport end, A11 storyboard panel sequence/restoration','0014/A6 pointer-away playback watching','0015/A5-6 full-cut first/last reading point and monotone paper','0016/A2 pointer-away playback lights'],
});

export const STORY_FORGE_LIMITS = Object.freeze([
  'Finite implementation acceptance, not a general rate or causal claim. Parent must compare raw runs on both stacks after their last relevant edit.',
  '0006 prototype side-by-side and every-function inventory are not re-run; old prototype/historical scripts are not authority for amendments.',
  '0008 all-handbook focus-ring inventory, gallery filters and other-section unchanged claims are outside this Story Forge runner.',
  '0011 node/blueprint panels and wire-port attachment and 0012 non-Story-Forge borders/Edges/input checks belong to their section checks.',
  '0013 all-sample dim switch, kanban drag, rail and persistence are not established by this runner; watch checks ensure Story Forge browser/timeline stay readable.',
  'Phone, narrow width, touch-flick and reduced-motion results require explicit corresponding runs; a desktop run does not establish them. Real phones remain outside 0017.',
  '0010/A2 watch records a 2-second per-animation-frame hover/sweep/wheel trace and checks toolbar/strip stability. Monitor-growth monotonicity and fixed magnifier top across every transition are not yet acceptance assertions.',
  '0006 adding a named timeline is not exercised (the current reference exposes five cut choices, not an add control). 0008 exhaustive all:unset Tab focus inventory, narrow/touch forms and full language-row audit are not yet asserted.',
  '0015 drag asserts reading classes and direction; its exact 2px point centring forwards/backwards is not yet asserted. CSS colour interpolation at a reading handoff is retained as a failed computed-colour check, not masked.',
  '0015 first/last and 0010 natural end-to-end playback require --include-playback and --cases playback (long). Default reading case uses bounded short real playback.',
]);

const textError = e => e?.stack || String(e);
const close = (a,b,t=1) => Math.abs(a-b)<=t;
const transparent = s => s === 'transparent' || /^rgba\([^)]*,\s*0\)$/.test(s);
// Custom properties retain hex spelling; computed colours serialize to rgb().
const sameColour = (a,b) => {const parse=s=>{s=s.trim();if(/^#[0-9a-f]{3}$/i.test(s))s='#'+s.slice(1).split('').map(c=>c+c).join('');if(/^#[0-9a-f]{6}$/i.test(s))return [1,3,5].map(i=>parseInt(s.slice(i,i+2),16)).concat(1);const m=s.match(/^rgba?\((.*)\)$/);if(m){const v=m[1].split(',').map(Number);return v.length===3?v.concat(1):v;}return null;};const x=parse(a),y=parse(b);return x&&y?x.every((v,i)=>Math.abs(v-y[i])<.001):a===b;};
const rgb = s => (s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
function luminance(s) {const c=rgb(s).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
const contrast = (a,b) => {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const ctl = (kind,value) => `#sf [data-sf-call="${kind}"]${value===undefined?'':`[data-value="${value}"]`}`;
const point = r => ({x:r.x+r.width/2,y:r.y+r.height/2});
async function box(page,selector) {const b=await page.locator(selector).first().boundingBox();if(!b)throw new Error(`No visible box: ${selector}`);return b;}
async function move(page,selector) {await page.mouse.move(...Object.values(point(await box(page,selector))));}
async function click(page,selector) {await page.locator(selector).first().click();}
async function observe(page,ms=STORY_FORGE_SPEC.settleObservationMs) {await page.waitForTimeout(ms);}
async function data(page) {return page.evaluate(()=>window.SF_DATA);}
async function state(page) {
  return page.evaluate(()=>{
    const sf=document.querySelector('#sf'),q=s=>sf.querySelector(s),rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
    const style=e=>{if(!e)return null;const c=getComputedStyle(e);return {opacity:+c.opacity,pointerEvents:c.pointerEvents,visibility:c.visibility,display:c.display,background:c.backgroundColor,color:c.color,radius:c.borderRadius,shadow:c.boxShadow,outline:c.outlineStyle,mask:c.maskImage};};
    return {scheme:document.documentElement.dataset.scheme,lang:document.documentElement.lang,sfClass:sf.className,watching:sf.classList.contains('is-watching'),
      timelineState:q('.timeline').dataset.state,chatState:q('.copilot').dataset.state,focusId:document.activeElement?.id,
      monitor:{box:rect(q('.monitor-picture')),style:style(q('.monitor-picture')),hidden:q('.monitor').hidden,shot:q('.monitor-picture').dataset.shotId},
      panel:{box:rect(q('.cpanel')),style:style(q('.cpanel')),open:q('.browser').classList.contains('panel-open'),text:q('#sf-cpBody').innerText},
      browser:{box:rect(q('.browser')),style:style(q('.browser'))},secondary:{box:rect(q('.bview')),scroll:q('.bview').scrollTop},
      timeline:{box:rect(q('.timeline')),style:style(q('.timeline'))},toolbar:{box:rect(q('.tlctl')),style:style(q('.tlctl'))},
      title:{box:rect(q('.titlebar')),style:style(q('.titlebar'))},chat:{box:rect(q('.cbar')),style:style(q('.copilot')),input:q('#sf-cinput').innerText},
      strip:{box:rect(q('#sf-strip')),scroll:q('#sf-strip').scrollLeft,width:q('#sf-strip').scrollWidth,style:style(q('#sf-strip'))},
      hero:{box:rect(q('#sf-hero')),style:style(q('#sf-hero')),visible:q('#sf-hero').classList.contains('is-visible')},
      lights:style(document.querySelector('.sf-lights')),selection:window.SF_DATA?.selection,
      pageScroll:scrollY,bodyWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
  });
}
async function hoverTimeline(page) {await move(page,'#sf-strip');await observe(page,STORY_FORGE_SPEC.hoverObservationMs);}
async function choose(page,kind,value) {await hoverTimeline(page);await click(page,ctl(kind,value));await observe(page);}
async function create(page) {await click(page,'#sf [data-mode="create"]');await observe(page);}
async function outside(page) {await page.mouse.click(4,innerSafeY(page));await observe(page);}
function innerSafeY() {return 80;}
async function stripPoint(page,time) {
  const d=await data(page),r=await box(page,'#sf-strip'),shots=d.cuts[d.selection.cut].recordShots;
  const t=Math.max(0,Math.min(d.cuts[d.selection.cut].duration,time)),s=shots.find(s=>t<s.start+s.dur)||shots.at(-1);
  const x=d.selection.track==='video'?d.timeline.pad+shots.indexOf(s)*d.timeline.slotWidth+(t-s.start)/s.dur*d.timeline.slotWidth:d.timeline.pad+t*d.timeline.pxPerSec;
  const left=await page.locator('#sf-strip').evaluate(e=>e.scrollLeft);
  return {x:r.x+x-left,y:r.y+r.height/2,worldX:x,visible:x-left>1&&x-left<r.width-1};
}
async function seek(page,time,{release=true}={}) {
  let p=await stripPoint(page,time);
  if(!p.visible){await move(page,'#sf-strip');for(let n=0;n<20&&!p.visible;n++){const r=await box(page,'#sf-strip');await page.mouse.wheel(p.x<r.x?-r.width/2:r.width/2,0); // horizontal wheel is native scroll
      await observe(page,40);p=await stripPoint(page,time);}}
  if(!p.visible)throw new Error(`Time ${time} is not visible after real wheel input`);
  await page.mouse.move(p.x,p.y);await page.mouse.down();if(release)await page.mouse.up();return p;
}
async function emptyPoint(page,selector,excluded) {
  return page.locator(selector).evaluate((el,excluded)=>{const r=el.getBoundingClientRect();for(let y=r.top+8;y<r.bottom-8;y+=19)for(let x=r.left+8;x<r.right-8;x+=23){const e=document.elementFromPoint(x,y);if(e&&el.contains(e)&&!e.closest(excluded))return {x,y};}throw new Error('No exposed empty point');},excluded);
}
async function world(page) {return page.evaluate(()=>{const el=document.querySelector('#sf-cvInner'),m=new DOMMatrixReadOnly(getComputedStyle(el).transform);return {x:m.e,y:m.f,z:m.a,nodes:[...el.querySelectorAll('.ci')].map(e=>({id:e.dataset.id,x:parseFloat(e.style.left),y:parseFloat(e.style.top),tag:e.dataset.tag,sel:e.classList.contains('sel')}))};});}
async function trace(page,ms=2000) {
  // Read-only per-frame sampling. Promise resolution and local records do not modify application state.
  return page.evaluate(ms=>new Promise(resolve=>{const out=[],start=performance.now();const tick=now=>{const r=s=>{const e=document.querySelector(s),b=e?.getBoundingClientRect();return b?{x:b.x,y:b.y,width:b.width,height:b.height}:null;};out.push({at:now-start,groups:['#sf-layerSeg','#sf .tlhead','#sf-zoomSeg'].map(r),strip:r('#sf-strip'),monitor:r('#sf-monitorPicture'),hero:r('#sf-hero'),watching:document.querySelector('#sf').classList.contains('is-watching')});if(now-start<ms)requestAnimationFrame(tick);else resolve(out);};requestAnimationFrame(tick);}),ms);
}
function stableTrace(samples) {
  const range=(getter)=>{const a=samples.map(getter).filter(Number.isFinite);return a.length?Math.max(...a)-Math.min(...a):Infinity;};
  return {groupPositionRanges:[0,1,2].map(i=>({x:range(s=>s.groups[i]?.x),y:range(s=>s.groups[i]?.y)})),stripX:range(s=>s.strip?.x),stripY:range(s=>s.strip?.y),heroTop:range(s=>s.hero?.y)};
}
async function readingSamples(page,ms) {
  return page.evaluate(ms=>new Promise(resolve=>{
    const out=[],start=performance.now();const tick=now=>{
      const d=window.SF_DATA,b=document.querySelector('#sf-bview'),root=b.querySelector('.script'),els=root?[...root.querySelectorAll('[data-script-id]')]:[],items=[];
      const assigned=new Set();for(const shot of d.cuts[d.selection.cut].recordShots){const own=els.filter(el=>!assigned.has(el.dataset.scriptId)&&el.dataset.shotIds.split(',').includes(shot.id));const total=own.reduce((n,el)=>n+d.script.find(e=>e.id===el.dataset.scriptId).text.length,0);let at=shot.start;for(const el of own){assigned.add(el.dataset.scriptId);items.push({el,start:at});at+=shot.dur*d.script.find(e=>e.id===el.dataset.scriptId).text.length/total;}}
      let i=items.length-1;while(i>0&&items[i].start>d.selection.time)i--;const it=items[i],next=items[i+1],r=it?.el.getBoundingClientRect(),end=next?.el.getBoundingClientRect().top??r?.bottom,span=(next?.start??d.cuts[d.selection.cut].duration)-(it?.start??0),fraction=Math.max(0,Math.min(1,(d.selection.time-(it?.start??0))/span)),point=r?r.top+(end-r.top)*fraction:null,mid=b.getBoundingClientRect().top+b.clientHeight/2;
      const colour=el=>getComputedStyle(el).backgroundColor;
      out.push({at:now-start,time:d.selection.time,running:d.selection.running,reading:b.classList.contains('is-reading'),marked:els.filter(e=>e.classList.contains('reading')).map(e=>e.dataset.scriptId),markedBackground:els.filter(e=>e.classList.contains('reading')).map(colour),owner:it?.el.dataset.scriptId,point,middle:mid,error:point===null?null:point-mid,scroll:b.scrollTop,backgrounds:els.map(e=>({id:e.dataset.scriptId,bg:colour(e),inner:e.querySelector('p')?colour(e.querySelector('p')):null})),mark:getComputedStyle(root).getPropertyValue('--mark').trim(),sel:getComputedStyle(root).getPropertyValue('--sel').trim()});
      if(now-start<ms)requestAnimationFrame(tick);else resolve(out);
    };requestAnimationFrame(tick);
  }),ms);
}

const CASES = [
  {id:'data',run:async c=>{
    const d=await data(c.page);c.evidence.data=d;
    c.check('0008.shot-total',d.shots.length===12&&d.shots.reduce((n,s)=>n+s.dur,0)===45,{count:d.shots.length,duration:d.shots.reduce((n,s)=>n+s.dur,0)});
    const times={A:45,B:38,C:15,D:11,E:45},counts={Film:1,Act:2,Scene:3,Beat:6,Shot:12};
    for(const [key,cut] of Object.entries(d.cuts)){
      c.check(`0008.cut-${key}`,cut.duration===times[key]&&cut.recordShots.reduce((n,s)=>n+s.dur,0)===times[key],{duration:cut.duration,ids:cut.shotIds});
      for(const [level,units] of Object.entries(cut.units)){const members=units.flatMap(u=>u.shotIds||[u.id]);c.check(`0008.${key}.${level}.partition`,members.length===cut.shotIds.length&&new Set(members).size===cut.shotIds.length&&members.every(x=>cut.shotIds.includes(x))&&units.every(u=>u.dur===d.shots.filter(s=>(u.shotIds||[u.id]).includes(s.id)).reduce((n,s)=>n+s.dur,0)),{members,durations:units.map(u=>u.dur)});}
    }
    for(const [level,count] of Object.entries(counts))c.check(`0008.A.${level}.count`,d.levels[level].length===count,{actual:d.levels[level].length,expected:count});
    c.check('0008.shot-3-no-cast',d.shots.find(s=>s.id==='s03').cast.length===0,d.shots.find(s=>s.id==='s03'));
    c.check('0008.no-board-as-shot',d.shots.every(s=>!/(board|sheet|qc)/i.test(s.picture||'')),d.shots.map(s=>s.picture));
    c.check('0008.festival-deliverable',d.cuts.E.deliverableOf==='A',d.cuts.E.deliverableOf);
    const p=c.page;await create(p);await click(p,'#sf [data-script-id="donna_warning"] .selel');await observe(p);const donna={selection:(await data(p)).selection,panel:await p.locator('#sf-cpBody').innerText()};c.check('0008.donna-line-binds-donna-shot8',donna.selection.activeSel?.scriptId==='donna_warning'&&donna.panel.includes('Donna')&&donna.panel.includes('Do not go outside, sweetheart.')&&donna.panel.includes('Shot 8'),donna);
    await p.keyboard.press('Escape');await choose(p,'setLayer','movie');await seek(p,10.5);await p.keyboard.press('Escape');await observe(p);const shot3={selection:(await data(p)).selection,panel:await p.locator('#sf-cpBody').innerText()};c.check('0008.shot3-pointer-no-cast',shot3.selection.activeSel?.shotId==='s03'&&shot3.panel.includes(c.language==='zh'?'无画内角色':'No on-screen cast'),shot3);
  }},
  {id:'explore',run:async c=>{
    const p=c.page,w0=await world(p),empty=await emptyPoint(p,'#sf-cvVp','.ci,.cv-rail-zone,button,.copilot');
    await p.mouse.move(empty.x,empty.y);await p.mouse.down();await p.mouse.move(empty.x+65,empty.y+40,{steps:12});await p.mouse.up();const w1=await world(p);
    c.check('0006.empty-drag-pans',close(w1.x-w0.x,65)&&close(w1.y-w0.y,40),{before:w0,after:w1});
    c.check('0011.pan-preserves-world',JSON.stringify(w0.nodes)===JSON.stringify(w1.nodes),{before:w0.nodes,after:w1.nodes});
    const empty2=await emptyPoint(p,'#sf-cvVp','.ci,.cv-rail-zone,button,.copilot');await p.mouse.move(empty2.x,empty2.y);await p.mouse.wheel(20,60);await observe(p,100);const w2=await world(p);
    c.check('0006.wheel-pans',close(w2.x-w1.x,-20)&&close(w2.y-w1.y,-60),{before:w1,after:w2});
    const vp=await box(p,'#sf-cvVp'),anchor={x:empty2.x-vp.x,y:empty2.y-vp.y};await p.keyboard.down('Control');await p.mouse.wheel(0,-100);await p.keyboard.up('Control');await observe(p,100);const w3=await world(p);
    c.check('0011.modifier-zoom-about-pointer',w3.z>w2.z&&close((anchor.x-w2.x)/w2.z,(anchor.x-w3.x)/w3.z)&&close((anchor.y-w2.y)/w2.z,(anchor.y-w3.y)/w3.z),{anchor,before:w2,after:w3});
    await click(p,ctl('cvFit'));await observe(p);const fitted=await world(p);c.check('0006.fit-preserves-world',JSON.stringify(fitted.nodes)===JSON.stringify(w0.nodes),fitted);
    const card=p.locator('#sf-cvInner .ci').first(),id=await card.getAttribute('data-id'),b=await card.boundingBox();if(!b)throw new Error('First Explore card not visible after fit');
    await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2+40,b.y+b.height/2+25,{steps:12});await p.mouse.up();const dragged=await world(p),a=fitted.nodes.find(n=>n.id===id),z=dragged.nodes.find(n=>n.id===id);
    c.check('0006.card-drag-in-world',close(z.x-a.x,40/fitted.z)&&close(z.y-a.y,25/fitted.z)&&dragged.nodes.filter(n=>n.id!==id).every(n=>{const o=fitted.nodes.find(o=>o.id===n.id);return n.x===o.x&&n.y===o.y;}),{before:a,after:z,scale:fitted.z});
    c.check('0012.canvas-drag-no-text-selection',await p.evaluate(()=>getSelection().toString()===''),{});
    await card.click();await observe(p);const picked=await p.evaluate(()=>({selected:document.querySelector('#sf .ci.sel')?.dataset.id,chips:[...document.querySelectorAll('#sf-cinput .selpill')].map(e=>e.textContent)}));c.check('0006.card-pick-tags-chat',picked.selected===id&&picked.chips.length===1,picked);
    await card.click();await observe(p);const preview=await p.locator('#sf-cvFocus').getAttribute('class');c.check('0006.focus-preview-opens',preview.includes('show'),preview);await p.keyboard.press('Escape');await observe(p);c.check('0006.focus-preview-closes',!(await p.locator('#sf-cvFocus').getAttribute('class')).includes('show'),{});
    const clear=await emptyPoint(p,'#sf-cvVp','.ci,.cv-rail-zone,button,.copilot');await p.mouse.click(clear.x,clear.y);await observe(p);c.check('0006.empty-click-deselects',await p.locator('#sf .ci.sel').count()===0&&await p.locator('#sf-cinput .selpill[data-tentative]').count()===0,{});
    await move(p,'#sf-cvRailZone');await observe(p);
    for(const filter of ['all','char','mood','visual','note']){await click(p,`#sf-cvFilter [data-flt="${filter}"]`);await observe(p,100);const actual=await p.evaluate(()=>({active:document.querySelector('#sf-cvFilter .on')?.dataset.flt,filtered:document.querySelector('#sf-cvInner').classList.contains('flt'),items:[...document.querySelectorAll('#sf-cvInner .ci')].map(e=>({tag:e.dataset.tag,match:e.classList.contains('match')}))}));c.check(`0006.filter-${filter}`,actual.active===filter&&actual.filtered===(filter!=='all')&&actual.items.every(e=>e.match===(filter!=='all'&&e.tag===filter)),actual);}
  }},
  {id:'layers',run:async c=>{
    const p=c.page;await create(p);c.evidence.layers=[];
    for(const layer of ['script','storyboard','movie'])for(const level of ['Film','Act','Scene','Beat','Shot']){
      await choose(p,'setLayer',layer);await choose(p,'setZoom',level);const s=await state(p),obs=await p.evaluate(()=>({scriptScope:document.querySelector('#sf .script')?.dataset.scriptScope,scriptCount:document.querySelectorAll('#sf [data-script-id]').length,logline:!!document.querySelector('#sf .logline'),tiles:document.querySelectorAll('#sf .unit-tile').length,takes:document.querySelectorAll('#sf .take-option').length}));c.evidence.layers.push({layer,level,state:s,view:obs});
      c.check(`0010.${layer}.${level}.monitor`,s.monitor.hidden===(layer==='script'),s.monitor);
      if(layer==='script')c.check(`0010.script.${level}.whole-cut`,obs.scriptScope==='cut'&&obs.scriptCount===(await data(p)).script.length&&obs.logline===(level==='Film'),obs);
      else if(level==='Shot'&&layer==='movie')c.check('0008.movie.Shot.actual-takes',obs.takes>=1,obs);
      else if(level!=='Shot')c.check(`0008.${layer}.${level}.members`,obs.tiles===(await data(p)).cuts.A.units[level][0].shotIds.length,obs);
    }
    const labels=await p.evaluate(()=>({layers:[...document.querySelectorAll('#sf-layerSeg button')].map(e=>e.textContent),levels:[...document.querySelectorAll('#sf-zoomSeg button')].map(e=>e.textContent)}));c.evidence.labels=labels;
    c.check('0010.exact-labels',c.language==='zh'?JSON.stringify(labels.layers)===JSON.stringify(['剧本','故事板','影片'])&&JSON.stringify(labels.levels)===JSON.stringify(['全片','幕','场','节拍','镜头']):labels.layers.join('|')==='Script|Storyboard|Film'&&labels.levels.join('|')==='Full film|Act|Scene|Beat|Shot',labels);
  }},
  {id:'geometry',run:async c=>{
    const p=c.page;await create(p);await choose(p,'setLayer','movie');const geometries=[];
    for(const level of ['Film','Act','Scene','Beat','Shot']){await choose(p,'setZoom',level);const g=await p.evaluate(()=>{const f=document.querySelector('#sf-frames'),origin=f.getBoundingClientRect().left;return [...f.querySelectorAll('.frame')].map(e=>({id:e.dataset.shotId,members:e.dataset.members.split(','),width:e.getBoundingClientRect().width,slots:[...e.querySelectorAll('[data-slot-shot]')].map(e=>({id:e.dataset.slotShot,x:e.getBoundingClientRect().left-origin,width:e.getBoundingClientRect().width}))}));});const d=await data(p);geometries.push({level,frames:g});c.check(`0010.${level}.merged-slot-width`,g.every(e=>close(e.width,e.members.length*d.timeline.slotWidth)&&e.slots.length===e.members.length&&e.slots.every(s=>close(s.width,d.timeline.slotWidth))),g);}
    const shot=geometries.at(-1).frames.flatMap(e=>e.slots);for(const g of geometries)c.check(`0010.${g.level}.shot-x-invariant`,g.frames.flatMap(e=>e.slots).every(e=>close(e.x,shot.find(s=>s.id===e.id).x)),g);c.evidence.geometries=geometries;
    const styles=await p.evaluate(()=>{const r=s=>{const e=document.querySelector(s),b=e.getBoundingClientRect();return {bottom:b.bottom,top:b.top,width:b.width,height:b.height,bg:getComputedStyle(e).backgroundColor,radius:getComputedStyle(e).borderRadius};};return {strip:r('#sf-strip'),groups:['#sf-layerSeg','#sf .tlhead','#sf-zoomSeg'].map(r),picture:r('#sf-monitorPicture')};});
    c.check('0010.strip-black-square',styles.strip.bg==='rgb(0, 0, 0)'&&parseFloat(styles.strip.radius)===0,styles.strip);
    c.check('0010.toolbar-baseline-gap',Math.max(...styles.groups.map(x=>x.bottom))-Math.min(...styles.groups.map(x=>x.bottom))<=1&&styles.strip.top-Math.max(...styles.groups.map(x=>x.bottom))>=6,styles);
    c.check('0016.monitor-square-at-rest',parseFloat(styles.picture.radius)===0,styles.picture);
    await choose(p,'setLayer','script');const surfaces=await p.evaluate(()=>[...document.querySelectorAll('#sf .frame')].map(e=>{const pic=e.querySelector('.pic'),text=e.querySelector('.strip-text');return {frame:e.getBoundingClientRect().height,pic:pic.getBoundingClientRect().height,textBackground:getComputedStyle(text).backgroundColor};}));c.check('0010.script-full-height-one-surface',surfaces.every(s=>s.pic>=s.frame-1&&/rgba\(.*0\)/.test(s.textBackground)),surfaces);
  }},
  {id:'lanes',run:async c=>{
    const p=c.page;await create(p);await choose(p,'setLayer','movie');c.evidence.tracks=[];
    for(const track of ['audio','graphics']){await choose(p,'setTrack',track);const g=await p.evaluate(()=>{
      const lanes=[...document.querySelectorAll('#sf .lane')],heads=[...document.querySelectorAll('#sf-laneHeads .lh')];
      return {lanes:lanes.map((e,i)=>{const r=e.getBoundingClientRect(),h=heads[i].getBoundingClientRect(),s=getComputedStyle(e),hs=getComputedStyle(heads[i]);return {id:e.dataset.lane,center:r.y+r.height/2,headCenter:h.y+h.height/2,height:r.height,headHeight:h.height,labelColor:hs.color,dot:getComputedStyle(heads[i].querySelector('.dot')).backgroundColor,border:s.borderBottomWidth,clips:[...e.querySelectorAll('.clip')].map(el=>{const c=getComputedStyle(el),ctx=el.querySelector('.ctx'),cs=getComputedStyle(ctx);return {id:el.dataset.clipId,start:+el.dataset.start,duration:+el.dataset.duration,left:parseFloat(el.style.left),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,bg:c.backgroundColor,text:c.color,mask:cs.maskImage,overflow:ctx.scrollWidth>ctx.clientWidth+1||ctx.scrollHeight>ctx.clientHeight+1};})};}),backgroundOpacity:+getComputedStyle(document.querySelector('#sf .lbg')).opacity,pictureOpacities:[...document.querySelectorAll('#sf .lblk')].map(e=>+getComputedStyle(e).opacity),gutter:getComputedStyle(document.querySelector('#sf-laneHeads')).backgroundColor};});
      const d=await data(p);c.evidence.tracks.push({track,geometry:g});for(const lane of g.lanes){c.check(`0010.${lane.id}.head-alignment`,close(lane.center,lane.headCenter)&&close(lane.height,lane.headHeight),lane);c.check(`0010.${lane.id}.same-colour`,lane.labelColor===lane.dot&&lane.clips.every(e=>e.bg===lane.labelColor),lane);c.check(`0010.${lane.id}.contrast`,contrast(lane.labelColor,'rgb(0, 0, 0)')>=4.5&&lane.clips.every(e=>contrast(e.bg,e.text)>=4.5),{lane:lane.id,onBlack:contrast(lane.labelColor,'rgb(0, 0, 0)'),clips:lane.clips.map(e=>({id:e.id,contrast:contrast(e.bg,e.text)}))});c.check(`0010.${lane.id}.axis-and-overflow`,lane.clips.every(e=>close(e.left,d.timeline.pad+e.start*d.timeline.pxPerSec)&&close(e.width,e.duration*d.timeline.pxPerSec)&&e.height>=23&&(e.overflow||e.mask==='none')),lane.clips);}
      c.check(`0010.${track}.background-and-gutter`,g.pictureOpacities.length>0&&g.pictureOpacities.every(x=>x===.5)&&g.gutter==='rgb(0, 0, 0)',g);
      const clip=p.locator('#sf .clip').first(),beforeHeight=await p.locator('#sf .lane').first().evaluate(e=>e.getBoundingClientRect().height);await clip.click();await p.keyboard.press('Escape');await observe(p);const afterHeight=await p.locator('#sf .lane').first().evaluate(e=>e.getBoundingClientRect().height),picked=await data(p),panelText=await p.locator('#sf-cpBody').innerText();c.check(`0010.${track}.clip-pick-no-lane-growth`,close(beforeHeight,afterHeight),{beforeHeight,afterHeight});c.check(`0008.${track}.clip-own-detail`,picked.selection.activeSel?.type==='clip'&&panelText.includes(picked.selection.activeSel.clip.text)&& (track!=='audio'||!panelText.includes('Generated still;')),{selection:picked.selection,panelText});
    }
  }},
  {id:'magnifier',run:async c=>{
    const p=c.page;await create(p);await choose(p,'setLayer','movie');c.evidence.magnifiers=[];
    for(const level of ['Shot','Beat','Film']){await choose(p,'setZoom',level);const frame=await box(p,'#sf .frame'),strip=await box(p,'#sf-strip');await p.mouse.move(Math.max(strip.x+30,Math.min(strip.x+strip.width/2,frame.x+frame.width/2)),strip.y+strip.height/2);await observe(p);const s=await state(p),wrap=await box(p,'#sf .stripwrap'),d=await data(p);c.evidence.magnifiers.push({level,frame,wrap,hero:s.hero});const scale=await p.locator('#sf').evaluate(e=>parseFloat(getComputedStyle(e).getPropertyValue('--sf-magnifier-height'))/parseFloat(getComputedStyle(e).getPropertyValue('--sf-slot-height')));c.check(`0010.${level}.magnifier-scaled-clamped`,s.hero.visible&&close(s.hero.box.width,Math.min(frame.width*scale,wrap.width))&&s.hero.box.left>=wrap.x-1&&s.hero.box.right<=wrap.x+wrap.width+1,{frame,wrap,hero:s.hero,scale,slot:d.timeline.slotWidth});}
    await p.mouse.move(4,80);await observe(p);c.check('0010.magnifier-leave-hides',!(await state(p)).hero.visible,{});
    await choose(p,'setZoom','Shot');await hoverTimeline(p);await click(p,'#sf-transport');await observe(p,100);await move(p,'#sf-strip');const running=await state(p);c.check('0010.playing-no-magnifier',running.selection.running&&!running.hero.visible,running);await click(p,'#sf-transport');
  }},
  {id:'watch',run:async c=>{
    const p=c.page;await create(p);await choose(p,'setLayer','movie');await click(p,'#sf-monitorPicture');await p.mouse.move(4,80);await observe(p);const before=await state(p);c.evidence.before=before;
    const pending=trace(p);await hoverTimeline(p);const strip=await box(p,'#sf-strip');for(let i=0;i<8;i++)await p.mouse.move(strip.x+30+i*(strip.width-60)/7,strip.y+strip.height/2,{steps:3});await p.mouse.wheel(0,80);const samples=await pending;c.evidence.hoverTrace=samples;const summary=stableTrace(samples),hovered=await state(p);c.evidence.hoverSummary=summary;
    c.check('0014.hover-does-not-watch',!hovered.watching&&close(before.monitor.box.width,hovered.monitor.box.width)&&close(before.panel.box.width,hovered.panel.box.width)&&hovered.toolbar.style.opacity===1,{before,hovered});
    c.check('0010.hover-toolbar-strip-stable',summary.groupPositionRanges.every(r=>r.x<=.01&&r.y<=.01)&&summary.stripX<=.01&&summary.stripY<=.01,summary);
    await seek(p,4.5);await p.mouse.move(4,80);await observe(p);const watched=await state(p);c.evidence.watched=watched;
    c.check('0014.strip-click-held-watch',watched.watching&&watched.timelineState==='focus'&&watched.monitor.box.width>before.monitor.box.width&&watched.panel.box.width<=1&&watched.toolbar.style.opacity===1,watched);
    c.check('0016.lights-opaque-black-hit-layer',watched.lights.opacity===1&&watched.lights.background==='rgb(0, 0, 0)'&&watched.lights.pointerEvents==='auto',watched.lights);
    const corners=await p.evaluate(()=>[[2,2],[innerWidth-2,2],[2,innerHeight-2],[innerWidth-2,innerHeight-2]].map(([x,y])=>{const e=document.elementFromPoint(x,y);return {x,y,class:e?.className,bg:e?getComputedStyle(e).backgroundColor:null};}));c.evidence.cornerHits=corners;c.check('0016.window-corners-black',corners.every(e=>typeof e.class==='string'&&e.class.includes('sf-lights')&&e.bg==='rgb(0, 0, 0)'),corners);
    c.check('0016.only-monitor-timeline-input',watched.title.style.opacity===0&&watched.title.style.pointerEvents==='none'&&watched.chat.style.opacity===0&&watched.chat.style.pointerEvents==='none'&&watched.panel.style.pointerEvents==='none'&&watched.monitor.style.opacity===1&&watched.timeline.style.opacity===1,watched);
    c.check('0016.monitor-square-watching',parseFloat(watched.monitor.style.radius)===0,watched.monitor);
    await click(p,'#sf-monitorPicture');await observe(p);const preview=await p.evaluate(()=>{const e=document.querySelector('#sf-cvFocus'),p=e.querySelector('.cv-photo'),r=p?.getBoundingClientRect(),s=getComputedStyle(e);return {class:e.className,bg:getComputedStyle(e.querySelector('.cv-focus-bd')).backgroundColor,width:r?.width,workspace:document.querySelector('#sf').getBoundingClientRect().width};});c.evidence.preview=preview;c.check('0010.cinema-preview',preview.class.includes('media')&&preview.class.includes('show')&&preview.bg==='rgba(8, 8, 10, 0.84)'&&preview.width>before.monitor.box.width&&preview.width<preview.workspace,preview);await click(p,'#sf .preview-close');await observe(p);c.check('0014.preview-close-keeps-watch',(await state(p)).watching,await state(p));
    // Click the real layer, not an arbitrary page coordinate that might hit the workspace.
    const target=await p.locator('.bar [data-s]').first().boundingBox(),lightsPoint=target?point(target):{x:2,y:2};const hit=await p.evaluate(({x,y})=>document.elementFromPoint(x,y)?.className,lightsPoint);c.check('0016.exit-click-targets-lights',typeof hit==='string'&&hit.includes('sf-lights'),{lightsPoint,hit});await p.mouse.click(lightsPoint.x,lightsPoint.y);await observe(p);const restored=await state(p);c.evidence.restored=restored;
    c.check('0016.lights-click-restores-without-underlying-control',!restored.watching&&restored.lights.opacity===0&&restored.scheme===before.scheme&&restored.panel.open===before.panel.open&&restored.panel.text===watched.panel.text&&close(restored.panel.box.width,before.panel.box.width)&&restored.chat.style.opacity>0,restored);
    await seek(p,4.5);await observe(p);await p.keyboard.press('Escape');await observe(p);c.check('0014.escape-restores-panel',!(await state(p)).watching&&(await state(p)).panel.open,await state(p));
    await choose(p,'setLayer','script');await seek(p,4.5);await observe(p);c.check('0016.script-never-black',(await state(p)).lights.opacity===0,await state(p));
  }},
  {id:'tools',run:async c=>{
    const p=c.page;await create(p);await choose(p,'setLayer','movie');await click(p,'#sf-monitorPicture');await p.mouse.move(4,80);await observe(p);const initial=await state(p);c.evidence.tools=[];
    // Each tool is intentionally compared with the actual pre-click panel state, even
    // if the HTML reference violates an effective decision. Failures are not waived.
    for(const [kind,value] of [['setTrack','audio'],['setTrack','video'],['setZoom','Beat'],['setZoom','Shot'],['setLayer','storyboard'],['setLayer','movie'],['toggleTlMenu',undefined]]){
      const before=await state(p);await choose(p,kind,value);const after=await state(p);c.evidence.tools.push({kind,value,before,after});c.check(`0014.unfocused-tool-${kind}-${value??'name'}`,!after.watching&&close(before.monitor.box.width,after.monitor.box.width)&&close(before.panel.box.width,after.panel.box.width)&&before.panel.open===after.panel.open,{before,after});if(kind==='toggleTlMenu')await p.keyboard.press('Escape');
    }
    await seek(p,1);await observe(p);for(const [kind,value] of [['setTrack','audio'],['setTrack','video'],['setZoom','Beat'],['setZoom','Shot'],['setLayer','storyboard'],['setLayer','movie'],['toggleTlMenu',undefined]]){await choose(p,kind,value);c.check(`0014.focused-tool-${kind}-${value??'name'}`,(await state(p)).watching&&(await state(p)).timelineState==='focus',await state(p));if(kind==='toggleTlMenu')await p.keyboard.press('Escape');}
    await p.keyboard.press('Escape');await observe(p);await hoverTimeline(p);await click(p,'#sf-transport');await p.mouse.move(4,80);await observe(p);const playing=await state(p);const pause=await p.evaluate(()=>{const e=document.querySelector('#sf-transport');return {text:e.textContent,drawn:!!e.querySelector('.ic-pause')};});c.check('0014.play-watches-drawn-pause',playing.watching&&playing.selection.running&&pause.drawn&&!/[Ⅱ❚]/.test(pause.text),{playing,pause});await hoverTimeline(p);await click(p,'#sf-transport');await p.mouse.move(4,80);await observe(p);c.check('0014.pause-unheld-restores',!(await state(p)).watching,await state(p));
    await seek(p,1);await hoverTimeline(p);await click(p,'#sf-transport');await observe(p,100);await click(p,'#sf-transport');await p.mouse.move(4,80);await observe(p);c.check('0014.pause-held-keeps-watch',(await state(p)).watching,await state(p));await p.keyboard.press('Escape');await observe(p);
    // Tab through real focus order; no focus() call or app-state mutation.
    await click(p,'#sf [data-mode="create"]');let reached=false,seen=[];for(let n=0;n<140;n++){await p.keyboard.press('Tab');const f=await p.evaluate(()=>({id:document.activeElement?.id,cls:document.activeElement?.className,timeline:document.activeElement===document.querySelector('#sf .timeline')}));seen.push(f);if(f.timeline){reached=true;break;}}
    await observe(p);c.evidence.tabOrder=seen;c.check('0014.tab-into-timeline-watches',reached&&(await state(p)).watching,{reached,state:await state(p)});await p.keyboard.press('Escape');await observe(p);c.check('0014.tab-escape-restores',!(await state(p)).watching,{initial,final:await state(p)});
  }},
  {id:'chat',run:async c=>{
    const p=c.page;await create(p);const before=await state(p);await click(p,'#sf-cinput');await p.keyboard.type('alpha omega');await p.keyboard.press('Home');for(let n=0;n<5;n++)await p.keyboard.press('ArrowRight');const focused=await state(p);
    c.check('0010.chat-focus-layout-unchanged',!focused.watching&&close(before.timeline.box.y,focused.timeline.box.y)&&close(before.browser.box.y,focused.browser.box.y)&&!focused.sfClass.includes('history-'),{before,focused});
    await click(p,'#sf [data-script-id="joe_wakes"] .selel');await observe(p);await click(p,'#sf [data-script-id="announcer"] .selel');await observe(p);
    const chips=await p.evaluate(()=>({html:document.querySelector('#sf-cinput').innerHTML,text:document.querySelector('#sf-cinput').textContent,materials:[...document.querySelectorAll('#sf-cinput .selpill')].map(e=>({text:e.textContent,editable:e.contentEditable,tentative:e.hasAttribute('data-tentative')})),chat:document.querySelector('#sf .copilot').dataset.state,watching:document.querySelector('#sf').classList.contains('is-watching')}));c.evidence.caretChips=chips;
    c.check('0010.two-chips-at-mid-text-caret',chips.materials.length===2&&chips.text.startsWith('alpha@')&&chips.text.endsWith(' omega')&&chips.materials.every(e=>e.editable==='false'&&!e.tentative)&&chips.chat==='focus'&&!chips.watching,chips);
    await click(p,'#sf [data-script-id="announcer"] .selel');c.check('0010.duplicate-material-not-reinserted',await p.locator('#sf-cinput .selpill').count()===2,{});
    await seek(p,12.5);await observe(p);const picked=await state(p);c.check('0014.chat-focused-strip-pick-not-watch',picked.chatState==='focus'&&!picked.watching&&await p.locator('#sf-cinput .selpill').count()>=3,picked);
    c.evidence.sideClicks=[];for(const side of ['left','right']){await click(p,'#sf-cinput');await observe(p);const bar=await box(p,'#sf .cbar'),xy={x:side==='left'?bar.x-12:bar.x+bar.width+12,y:bar.y+bar.height/2},hit=await p.evaluate(({x,y})=>{const e=document.elementFromPoint(x,y);return {tag:e?.tagName,id:e?.id,cls:e?.className,insideVisibleChat:!!e?.closest('.cbar,.ctrace,.history-toggle')};},xy);if(hit.insideVisibleChat)throw new Error('Side-click setup landed in visible chat body: '+JSON.stringify({bar,xy,hit}));await p.mouse.click(xy.x,xy.y);await observe(p);const after=await state(p);c.evidence.sideClicks.push({side,bar,xy,hit,after});c.check(`0010.click-${side}-of-visible-bar-blurs`,after.chatState!=='focus',{side,bar,xy,hit,after});}
    await click(p,'#sf-cinput');await p.keyboard.press('Control+KeyA');await p.keyboard.press('Backspace');await p.keyboard.type('@Joe');await observe(p,100);const mentions=await p.locator('#sf-mentions').isVisible();await p.keyboard.press('Enter');c.check('0010.at-menu-inserts-chip',mentions&&await p.locator('#sf-cinput .selpill').count()===1,{html:await p.locator('#sf-cinput').innerHTML()});await p.keyboard.press('Backspace');c.check('0010.native-backspace-removes-chip',await p.locator('#sf-cinput .selpill').count()===0,{html:await p.locator('#sf-cinput').innerHTML()});
    await p.keyboard.type('cut C duration');await p.keyboard.press('Enter');await observe(p,900);const started=await p.locator('#sf-ctraceInner .cmsg.bot').last().innerText();await p.waitForFunction(()=>{const e=document.querySelector('#sf-ctraceInner .cmsg.bot:last-child .b');return e?.textContent.includes('Timed still preview only.')&&!!e.querySelector('b');},{},{timeout:15000});const reply=await p.locator('#sf-ctraceInner .cmsg.bot').last().innerText();c.evidence.reply={started,reply};c.check('0008.chat-cut-C-honest',reply.includes('Trailer C')&&reply.includes('15 seconds')&&reply.includes('Shot 1, Shot 5, Shot 7, Shot 9'),{started,reply});c.check('0006.reply-streamed',started.length>0&&started.length<reply.length,{startedLength:started.length,finalLength:reply.length});
    // Sending opened peek. Blur closes it; focus alone must not open history.
    await p.keyboard.press('Escape');await observe(p);await click(p,'#sf-cinput');await observe(p);const historyBefore=await state(p);c.check('0010.history-closed-on-focus',!historyBefore.sfClass.includes('history-peek')&&!historyBefore.sfClass.includes('history-pinned'),historyBefore);
    await move(p,'#sf-historyToggle');await observe(p);c.check('0010.history-hover-peek',(await state(p)).sfClass.includes('history-peek'),await state(p));await p.mouse.move(4,80);await observe(p);c.check('0010.history-leave-closes',!(await state(p)).sfClass.includes('history-peek'),await state(p));
    await click(p,'#sf-historyToggle');await observe(p);c.check('0010.history-click-pins-and-retires',(await state(p)).sfClass.includes('history-pinned')&&(await state(p)).timeline.style.visibility==='hidden',await state(p));await p.keyboard.press('Escape');await observe(p);c.check('0010.history-pinned-survives-blur',(await state(p)).sfClass.includes('history-pinned'),await state(p));await click(p,'#sf-historyToggle');await observe(p);c.check('0010.history-unpin-restores',!(await state(p)).sfClass.includes('history-pinned')&&(await state(p)).timeline.box.height>0,await state(p));
    await click(p,'#sf-cinput');const one=await state(p);await p.keyboard.type('one');for(const line of ['two','three','four']){await p.keyboard.press('Shift+Enter');await p.keyboard.type(line);}await observe(p);const four=await state(p);c.check('0010.multiline-pushes-strip-up',four.chat.box.height>one.chat.box.height&&four.timeline.box.y+four.pageScroll<one.timeline.box.y+one.pageScroll,{one,four});
  }},
  {id:'reading',run:async c=>{
    const p=c.page;await create(p);const rest=await readingSamples(p,0);c.evidence.rest=rest;c.check('0015.rest-no-highlight',rest[0].marked.length===0&&rest[0].backgrounds.every(e=>transparent(e.bg)&&(!e.inner||transparent(e.inner))),rest);
    c.evidence.selections=[];for(const id of ['joe_wakes','joe_question']){await click(p,`#sf [data-script-id="${id}"] .selel`);await observe(p);const r=await p.locator(`#sf [data-script-id="${id}"]`).evaluate(e=>{const p=e.querySelector('p'),s=getComputedStyle(e);return {background:s.backgroundColor,sel:s.getPropertyValue('--sel').trim(),mark:s.getPropertyValue('--mark').trim(),inner:p?getComputedStyle(p).backgroundColor:null};});c.evidence.selections.push({id,...r});c.check(`0015.${id}.whole-grey-not-mark`,sameColour(r.background,r.sel)&&!sameColour(r.background,r.mark)&&transparent(r.inner),r);}
    await p.keyboard.press('Escape');await observe(p);await seek(p,12.5);await p.keyboard.press('Escape');await observe(p);const selection=await p.evaluate(()=>[...document.querySelectorAll('#sf [data-script-id]')].filter(e=>e.classList.contains('hl')).map(e=>e.dataset.scriptId));c.check('0015.shot4-only-joe-grey',JSON.stringify(selection)===JSON.stringify(['joe_question']),selection);
    // Re-select Shot 4 after Esc (Esc restores layout and preserves the picked panel).
    await seek(p,12.5);await hoverTimeline(p);await click(p,'#sf-transport');await p.mouse.move(4,80);await observe(p,2300);const samples=await readingSamples(p,2000);c.evidence.playback=samples;
    c.check('0015.playback-exactly-one-reading-mark',samples.every(s=>s.running&&s.reading&&s.marked.length===1&&s.marked[0]===s.owner&&sameColour(s.markedBackground[0],s.mark)&&s.backgrounds.every(e=>e.id===s.owner||transparent(e.bg))),{sampleCount:samples.length,violations:samples.filter(s=>!s.running||!s.reading||s.marked.length!==1||s.marked[0]!==s.owner||!sameColour(s.markedBackground[0],s.mark)||s.backgrounds.some(e=>e.id!==s.owner&&!transparent(e.bg)))});
    c.check('0015.reading-point-centred-after-glide',samples.every(s=>Math.abs(s.error)<=2),{maxError:Math.max(...samples.map(s=>Math.abs(s.error))),sampleCount:samples.length});c.check('0015.paper-only-increases',samples.every((s,i)=>!i||s.scroll>=samples[i-1].scroll-.01),{first:samples[0].scroll,last:samples.at(-1).scroll});
    await hoverTimeline(p);const transportPoint=point(await box(p,'#sf-transport'));await p.mouse.move(transportPoint.x,transportPoint.y);const pauseTrace=readingSamples(p,500);await observe(p,70);await p.mouse.click(transportPoint.x,transportPoint.y);const pause=await pauseTrace,firstStopped=pause.findIndex(s=>!s.running),lastRunning=firstStopped>0?pause[firstStopped-1]:null,stopped=pause.filter(s=>!s.running);c.evidence.pause={samples:pause,lastRunning,firstStopped:stopped[0]};c.check('0015.pause-unmarks-no-scroll-jump',!!lastRunning&&stopped.length>0&&stopped.every(s=>s.marked.length===0&&s.scroll===stopped[0].scroll)&&Math.abs(stopped[0].scroll-lastRunning.scroll)<=2,{lastRunning,stopped});await observe(p,200);const settledPause=(await readingSamples(p,0))[0];c.evidence.settledPause=settledPause;c.check('0015.pause-restores-picked-grey',settledPause.backgrounds.some(e=>e.id==='joe_question'&&sameColour(e.bg,settledPause.sel))&&settledPause.backgrounds.every(e=>e.id==='joe_question'||transparent(e.bg)),settledPause);c.check('0015.mark-differs-from-selection',samples.every(s=>s.mark&&s.mark!==s.sel),{mark:samples[0].mark,sel:samples[0].sel});
  }},
  {id:'drag',run:async c=>{
    const p=c.page;await create(p);const start=await seek(p,4.5,{release:false});const d=await data(p),r=await box(p,'#sf-strip'),head=await p.locator('#sf-playhead').boundingBox();c.check('0010.press-maps-to-pointer',head&&close(head.x+head.width/2,start.x),{pointer:start,head,data:d.selection});
    const forward=[];for(let n=2;n<=25;n++){await p.mouse.move(start.x+n*3,start.y);await observe(p,30);forward.push((await readingSamples(p,0))[0]);}const dragState=await state(p);c.check('0015.forward-drag-reads',forward.every(s=>s.reading&&s.marked.length===1)&&forward.at(-1).time>forward[0].time,{first:forward[0],last:forward.at(-1)});c.check('0010.drag-no-magnifier',!dragState.hero.visible,dragState.hero);
    const backward=[];for(let n=24;n>=0;n--){await p.mouse.move(start.x+n*3,start.y);await observe(p,30);backward.push((await readingSamples(p,0))[0]);}c.evidence.drag={forward,backward};c.check('0015.backward-drag-reads',backward.every(s=>s.reading&&s.marked.length===1)&&backward.at(-1).time<backward[0].time,{first:backward[0],last:backward.at(-1)});
    await p.mouse.move(r.x+r.width-4,r.y+r.height/2);const edgeBefore=await state(p);await observe(p,600);const edgeAfter=await state(p);c.check('0010.edge-hold-scrolls-and-advances',edgeAfter.strip.scroll>edgeBefore.strip.scroll&&edgeAfter.selection.time>edgeBefore.selection.time,{before:edgeBefore,after:edgeAfter});await p.mouse.up();const released=await state(p);await observe(p,300);const later=await state(p);c.check('0010.release-stops-edge-scroll',released.strip.scroll===later.strip.scroll&&released.selection.time===later.selection.time,{released,later});
    await seek(p,12.5);c.check('0015.plain-click-no-reading-mark',(await p.locator('#sf .reading').count())===0,await state(p));
  }},
  {id:'playback',long:true,run:async c=>{
    const p=c.page;await create(p);await choose(p,'setLayer','storyboard');await click(p,'#sf-monitorPicture');await p.mouse.move(4,80);await observe(p);const before=await state(p);await hoverTimeline(p);await click(p,'#sf-transport');await p.mouse.move(4,80);const samples=[];const end=Date.now()+55000;
    while(Date.now()<end){const s=await state(p);samples.push(s);if(!s.selection.running&&s.selection.time>=45)break;await observe(p,100);}
    const after=await state(p);c.evidence.storyboardPlayback={before,samples,after};c.check('0010.natural-end-at-cut-duration',!after.selection.running&&after.selection.time===45,after);c.check('0010.storyboard-shots-in-order',JSON.stringify([...new Set(samples.map(s=>s.monitor.shot))])===JSON.stringify((await data(p)).cuts.A.shotIds),{shots:[...new Set(samples.map(s=>s.monitor.shot))]});c.check('0016.playback-pointer-away-lights',samples.filter(s=>s.selection.running&&s.selection.time>1).every(s=>s.watching&&s.lights.opacity===1),{});await observe(p);const restored=await state(p);c.check('0010.playback-end-restores-panel',!restored.watching&&restored.panel.open===before.panel.open&&restored.panel.text===before.panel.text&&close(restored.panel.box.width,before.panel.box.width),restored);
    await choose(p,'setLayer','script');await hoverTimeline(p);await click(p,'#sf-transport');await p.mouse.move(4,80);const reading=await readingSamples(p,47000);c.evidence.fullReading=reading;const moving=reading.filter(s=>s.running&&s.at>3000),owners=[...new Set(moving.flatMap(s=>s.marked))];c.check('0015.full-reading-centred-monotone',moving.every(s=>Math.abs(s.error)<=2)&&moving.every((s,i)=>!i||s.scroll>=moving[i-1].scroll-.01),{samples:moving.length,maxError:Math.max(...moving.map(s=>Math.abs(s.error)))});c.check('0015.first-last-reach-middle',reading.some(s=>s.marked[0]==='scene1'&&Math.abs(s.error)<=2)&&reading.some(s=>s.marked[0]==='black'&&Math.abs(s.error)<=2),{owners});
  }},
];

/** Run selected cases against an already-owned Playwright page and HTTP URL.
 * The page is navigated afresh per case. Caller owns browser/context/server cleanup.
 * options: url, reportPath, artifactDir, cases, themes, languages, viewport,
 * includePlayback, reducedMotion, expectedDocumentSha256. Returns the complete raw JSON report.
 */
export async function runStoryForge(page,options={}) {
  if(!options.url)throw new Error('runStoryForge requires options.url');
  const url=new URL(options.url);if(!['http:','https:'].includes(url.protocol))throw new Error('Use an owned HTTP(S) URL, not file:');
  const selected=typeof options.cases==='string'?options.cases.split(','):(options.cases||STORY_FORGE_SPEC.defaultCases);
  const unknown=selected.filter(id=>!CASES.some(c=>c.id===id));if(unknown.length)throw new Error('Unknown cases: '+unknown.join(','));
  if(selected.includes('playback')&&!options.includePlayback)throw new Error('Natural playback requires includePlayback:true / --include-playback');
  const themes=options.themes||['pure','neon'],languages=options.languages||['zh'],viewport=options.viewport||STORY_FORGE_SPEC.viewport;
  if(themes.some(x=>!STORY_FORGE_SPEC.themes.includes(x))||languages.some(x=>!STORY_FORGE_SPEC.languages.includes(x)))throw new Error('Unsupported theme/language');
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:options.reducedMotion||STORY_FORGE_SPEC.reducedMotion});
  const report={profile:'story-forge-pointer-acceptance/v1',runId:new Date().toISOString().replace(/[:.]/g,'-'),startedAt:new Date().toISOString(),url:options.url,node:process.version,viewport,themes,languages,reducedMotion:options.reducedMotion||STORY_FORGE_SPEC.reducedMotion,selectedCases:selected,coverage:STORY_FORGE_COVERAGE,limits:STORY_FORGE_LIMITS,unselectedCases:CASES.filter(c=>!selected.includes(c.id)).map(c=>c.id),cases:[],fatal:null};
  const artifactDir=options.artifactDir|| (options.reportPath?path.join(path.dirname(path.resolve(options.reportPath)),path.basename(options.reportPath,'.json')+'-cases'):null);
  if(artifactDir)await mkdir(artifactDir,{recursive:true});
  const persist=async()=>{if(options.reportPath){await mkdir(path.dirname(path.resolve(options.reportPath)),{recursive:true});await writeFile(options.reportPath,JSON.stringify(report,null,2)+'\n');}};
  let current=null;const errors=[];const onError=e=>errors.push({at:new Date().toISOString(),case:current,error:textError(e)});const onConsole=m=>{if(m.type()==='error')errors.push({at:new Date().toISOString(),case:current,console:m.text()});};page.on('pageerror',onError);page.on('console',onConsole);
  try{
    for(const theme of themes)for(const language of languages)for(const definition of CASES.filter(c=>selected.includes(c.id))){
      current=`${theme}-${language}-${viewport.width}-${definition.id}`;const result={id:definition.id,key:current,theme,language,viewport,startedAt:new Date().toISOString(),requirements:STORY_FORGE_COVERAGE[definition.id],actions:'Real Playwright mouse/keyboard only; DOM evaluation read-only',checks:[],evidence:{},errors:[],status:'unverified'};const errorStart=errors.length;
      const c={page,theme,language,evidence:result.evidence,check:(id,pass,observation)=>result.checks.push({id,pass:!!pass,observation})};
      try{
        await page.goto('about:blank');const target=new URL(options.url);target.hash=`scheme=${theme}&lang=${language}`;const entryResponse=await page.goto(target.href,{waitUntil:'domcontentloaded',timeout:20000});result.evidence.document=entryResponse?{url:entryResponse.url(),status:entryResponse.status(),sha256:createHash('sha256').update(await entryResponse.body()).digest('hex')}:null;await page.waitForSelector('#sf-cvInner .ci',{timeout:20000});await page.locator('#sf').scrollIntoViewIfNeeded();await observe(page);
        if(options.expectedDocumentSha256&&result.evidence.document?.sha256!==options.expectedDocumentSha256)throw new Error('Loaded document identity differs from expected: '+JSON.stringify(result.evidence.document));const entry=await state(page);result.evidence.entry=entry;c.check('entry.correct-theme-language',entry.scheme===theme&&entry.lang===language,{actual:{scheme:entry.scheme,lang:entry.lang},expected:{theme,language}});
        await definition.run(c);
      }catch(error){result.errors.push({type:'action-or-observation-error',error:textError(error)});}
      finally {try{await page.mouse.up();await page.keyboard.up('Control');await page.keyboard.press('Escape');}catch{} }
      result.errors.push(...errors.slice(errorStart));result.finishedAt=new Date().toISOString();result.status=result.errors.length?'unverified':result.checks.some(c=>!c.pass)?'not attained':'attained';
      if(artifactDir){const file=path.join(artifactDir,current+'.json');await writeFile(file,JSON.stringify(result,null,2)+'\n');result.artifact=file;try{const shot=path.join(artifactDir,current+'.png');await page.screenshot({path:shot});result.screenshot=shot;}catch(e){result.screenshotError=textError(e);}}
      report.cases.push(result);report.summary={cases:report.cases.length,attained:report.cases.filter(c=>c.status==='attained').length,notAttained:report.cases.filter(c=>c.status==='not attained').length,unverified:report.cases.filter(c=>c.status==='unverified').length,checks:report.cases.reduce((n,c)=>n+c.checks.length,0),passed:report.cases.reduce((n,c)=>n+c.checks.filter(c=>c.pass).length,0)};await persist();
    }
  }catch(error){report.fatal=textError(error);}
  finally{page.off('pageerror',onError);page.off('console',onConsole);report.finishedAt=new Date().toISOString();report.allSelectedChecksPass=!report.fatal&&report.cases.length===themes.length*languages.length*selected.length&&report.cases.every(c=>c.status==='attained');await persist();}
  return report;
}

function parseArgs(args){const o={};for(let i=0;i<args.length;i++){const a=args[i];if(a==='--include-playback')o.includePlayback=true;else if(a==='--help')o.help=true;else if(['--url','--report','--cases','--themes','--languages','--viewport','--chrome','--reduced-motion','--expected-document-sha256'].includes(a)){if(!args[i+1])throw new Error('Missing value for '+a);o[a.slice(2)]=args[++i];}else throw new Error('Unknown argument '+a);}return o;}
async function cli(){
  const args=parseArgs(process.argv.slice(2));if(args.help){console.log('node parity/story-forge.mjs --url HTTP_URL --report PATH [--cases data,explore,layers,geometry,lanes,magnifier,watch,tools,chat,reading,drag] [--themes pure,neon | all] [--languages zh,en] [--viewport 1440x900] [--chrome PATH] [--expected-document-sha256 HASH] [--reduced-motion reduce] [--include-playback --cases playback]');return;}
  if(!args.url||!args.report)throw new Error('--url and --report are required');const chrome=await requireBrowser(args.chrome);const bytes=await readFile(fileURLToPath(import.meta.url));
  const size=(args.viewport||'1440x900').split('x').map(Number);if(size.length!==2||size.some(x=>!Number.isFinite(x)||x<=0))throw new Error('Invalid viewport');let browser;
  try{browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:size[0],height:size[1]}}),page=await context.newPage();const report=await runStoryForge(page,{url:args.url,reportPath:args.report,cases:args.cases,themes:args.themes==='all'?STORY_FORGE_SPEC.themes:args.themes?.split(','),languages:args.languages?.split(','),viewport:{width:size[0],height:size[1]},includePlayback:args.includePlayback,reducedMotion:args['reduced-motion'],expectedDocumentSha256:args['expected-document-sha256']});report.environment={chromeExecutable:chrome,browserVersion:browser.version(),runnerSha256:createHash('sha256').update(bytes).digest('hex')};await writeFile(args.report,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({report:path.resolve(args.report),...report.summary,allSelectedChecksPass:report.allSelectedChecksPass,fatal:report.fatal}));if(!report.allSelectedChecksPass)process.exitCode=1;await context.close();}finally{await browser?.close();}
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)cli().catch(e=>{console.error(textError(e));process.exitCode=1;});
