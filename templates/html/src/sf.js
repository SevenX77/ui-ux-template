/* Full Story Forge v5 script. Source: prototype/sfm_ui_draft_v5.html, decisions 0006. */
(()=>{
'use strict';
const sf=window.document.getElementById('sf');
if(!sf)return;
const coreValue=name=>getComputedStyle(sf).getPropertyValue('--sf-'+name).trim();
const design=name=>parseFloat(coreValue(name));
const notch=sf.querySelector('#sf-bctlRim');['x','y'].forEach(a=>notch.setAttribute(a,coreValue('notch-region-start')));['width','height'].forEach(a=>notch.setAttribute(a,coreValue('notch-region-size')));
notch.querySelector('feGaussianBlur').setAttribute('stdDeviation',design('notch-blur'));notch.querySelector('feOffset').setAttribute('dy',design('notch-offset-y'));

// Core owns production data, non-DOM schedules and geometry; this stack owns rendering.
const labels=CONTENT.workspace.labels,renderLabels=CONTENT.workspace.renderLabels;
const model=createStoryForge(CONTENT.workspace,design);
const {DEFAULTS,LOG_LINE,SHOT_LIST,BY_ID,CUTS,VKEYS,VNAME,SHOTS,SCENES,BEATS,CHAR_DB,STYLE_REF,SCRIPT,SOURCE_TRACKS,PIPELINE,CV_ITEMS,CV_TAGN,TAKES,PX_PER_SEC,VIDEO_PAD,LANE_HEIGHTS,memberShots,sbBg,scriptFor,scriptText,ownScriptText}=model;
const cutShots=(k=ver)=>model.cutShots(k),recordShots=(k=ver)=>model.recordShots(k),unitsFor=(level,k=ver)=>model.unitsFor(level,k),tracksFor=(k=ver)=>model.tracksFor(k);
const curArr=()=>unitsFor(zoomLevel);
const sbArt=s=>`<div class="g" style="background:${sbBg(s)}"></div>`;
const sbBig=s=>`<div class="hg" style="background:${sbBg(s)}"></div>`;
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let ver=DEFAULTS.cut,sel=0,vi=0,layer=DEFAULTS.layer,zoomLevel=DEFAULTS.zoom,track=DEFAULTS.track,selClip=null;
const ROW_H=design('lane-row-height');
let padX=VIDEO_PAD,playback={running:DEFAULTS.running,time:DEFAULTS.time,last:0,raf:0},drag=null,hoverBlock=-1,pointerX=0,bindT=0,viewKey='';
const strip=sf.querySelector('#sf-strip'),hero=sf.querySelector('#sf-hero');
const currentShot=(t=playback.time)=>model.currentShot(t,ver);
const derivedSel=()=>model.derivedSelection(playback.time,zoomLevel,ver);
const unitStart=i=>model.unitStart(i,zoomLevel,ver),unitWidth=model.unitWidth;
const videoTimeToX=(t,shots=recordShots(),pad=padX)=>model.videoTimeToX(t,shots,pad);
const laneTimeToX=(t,pad=padX)=>model.laneTimeToX(t,pad);
const timeToX=t=>track==='video'?videoTimeToX(t):laneTimeToX(t);
const xToTime=x=>model.xToTime(x,track,padX,ver);
function setTrack(t,el){track=t;selClip=null;sf.querySelectorAll('#sf-tltrack .tt').forEach(b=>b.classList.toggle('on',b===el));buildStrip();renderView();keepPlayhead(true);}
function miniWave(seed,n=design('wave-count')){return model.waveform(seed,n).map(height=>`<i style="height:${height}"></i>`).join('');}
function laneClip(c,index){return `<div class="clip ${c.cls}" data-sf-call="pickClip" data-value="${index}" data-clip-id="${c.id}" data-start="${c.start}" data-duration="${c.dur}" title="${esc(c.text)}" style="left:${padX+c.start*PX_PER_SEC}px;width:${c.dur*PX_PER_SEC}px;top:${(c.row||0)*ROW_H}px"><span class="ctx">${esc(c.text)}</span></div>`;}
function laneBg(){return `<div class="lbg">${recordShots().map(s=>`<div class="lblk" style="left:${padX+s.start*PX_PER_SEC}px;width:${s.dur*PX_PER_SEC}px;background:${s.g}"></div>`).join('')}</div>`;}
function buildLanes(){const clips=tracksFor(),lanes=model.timelineLayout(track,ver).lanes;
 sf.querySelector('#sf-laneHeads').innerHTML=lanes.map(([id,label])=>`<div class="lh lh-${id}" style="height:${LANE_HEIGHTS[id]}px"><span class="dot"></span>${label}</div>`).join('');
 return laneBg()+lanes.map(([id])=>`<div class="lane" data-lane="${id}" style="height:${LANE_HEIGHTS[id]}px">${clips.map((c,i)=>c.lane===id?laneClip(c,i):'').join('')}</div>`).join('');}
function pickClip(el,index){selClip=tracksFor()[index];if(!selClip)return;activeSel={type:'clip',clip:selClip};sf.querySelectorAll('#sf-frames .clip.sel').forEach(c=>c.classList.remove('sel'));el.classList.add('sel');openPanel();renderView();updateCtx();cvSetPill(selClip.text,'clip:'+selClip.id);cvCopilot(true);}
function clipPreviewClick(){if(selClip){activeSel={type:'clip',clip:selClip};openPanel();updateCtx();}}
function picHTML(s){const members=memberShots(s);
 if(layer==='script')return `<div class="pic itl"><div class="strip-text">${esc(zoomLevel==='Film'?LOG_LINE:ownScriptText(members.map(x=>x.id)))}</div></div>`;
 return `<div class="pic${layer==='storyboard'?' sb':''}"><div class="shot-join">${members.map(sh=>`<div class="slot" data-slot-shot="${sh.id}" style="background:${layer==='storyboard'?sbBg(sh):sh.g}"></div>`).join('')}</div></div>`;}
function buildStrip(){sel=derivedSel();padX=model.timelineLayout(track,ver).pad;hoverBlock=-1;const arr=curArr(),frames=sf.querySelector('#sf-frames'),heads=sf.querySelector('#sf-laneHeads');
 strip.classList.toggle('lanes',track!=='video');sf.dataset.track=track;
 frames.style.width=model.timelineLayout(track,ver).width+'px';
 frames.innerHTML=track==='video'?arr.map((s,i)=>`<div class="frame" data-shot-id="${s.id}" data-members="${memberShots(s).map(s=>s.id).join(',')}" data-start="${unitStart(i)}" data-duration="${s.dur}" style="width:${unitWidth(s)}px" title="${esc(s.n)} · ${tc(unitStart(i))} · ${s.f}" data-sf-call="pickShot" data-value="${i}">${picHTML(s)}<span class="num">${zoomLevel==='Shot'?s.num+' · '+tc(unitStart(i)):s.n+' · '+s.d}</span></div>`).join(''):buildLanes();
 heads.classList.toggle('show',track!=='video');layoutStrip();paintPosition();updateHero();requestAnimationFrame(measureOverflow);}
function layoutStrip(){sf.querySelector('#sf-frames').style.setProperty('--pad',padX+'px');fillPerfs();}
function fillPerfs(){const n=model.timelineLayout(track,ver).perfCount,h='<div class="hole"></div>'.repeat(n);sf.querySelector('#sf-perfTop').innerHTML=h;sf.querySelector('#sf-perfBot').innerHTML=h;}
function keepPlayhead(force=false){const x=timeToX(playback.time),left=strip.scrollLeft,w=strip.clientWidth,next=model.playheadScroll(x,left,w,strip.scrollWidth,force);if(next!==null)strip.scrollLeft=next;}
function scrollToShot(i){setTime(unitStart(i));keepPlayhead(true);}
function pickShot(i){const s=curArr()[clamp(i,0,curArr().length-1)];activeSel=zoomLevel==='Shot'?{type:'shot',shotId:s.id,shotIdx:cutShots().findIndex(x=>x.id===s.id)}:{type:'unit',unit:s};sf.querySelectorAll('.frame').forEach(el=>el.classList.toggle('picked',el.dataset.shotId===s.id));openPanel();cvSetPill(s.n+' · '+s.f,(zoomLevel==='Shot'?'shot:':'unit:')+s.id);updateCtx();cvCopilot(true);highlightScript();}
function updateHero(){if(!strip.matches(':hover')||track!=='video'||playback.running||drag||hoverBlock<0||!matchMedia('(hover:hover)').matches){hero.classList.remove('is-visible');return;}
 const s=curArr()[hoverBlock];if(!s)return;const wrap=sf.querySelector('.stripwrap'),r=strip.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),natural=unitWidth(s),start=model.unitX(hoverBlock,zoomLevel,ver,padX),geometry=model.magnifier(natural,start,pointerX,strip.scrollLeft,r.left,wr.left,wr.right),w=geometry.width,left=geometry.left,shift=geometry.shift;
 if(hero.dataset.key!==layer+':'+zoomLevel+':'+s.id){hero.innerHTML=`<div class="hero-content">${picHTML(s)}</div><div class="cap">${esc(s.n+' · '+s.f)}</div>`;hero.dataset.key=layer+':'+zoomLevel+':'+s.id;}
 hero.className='hero is-visible'+(layer==='script'?' itl':layer==='storyboard'?' sb':'');hero.style.width=w+'px';hero.style.left=(left-sf.querySelector('.tlrow').getBoundingClientRect().left)+'px';hero.style.setProperty('--hero-content-width',natural+'px');hero.style.setProperty('--hero-shift',-shift+'px');}
function pointerBlock(x){const p=x-strip.getBoundingClientRect().left+strip.scrollLeft-padX;return model.unitAtX(p,zoomLevel,ver);}
strip.addEventListener('pointermove',e=>{pointerX=e.clientX;if(drag){drag.x=e.clientX;drag.moved=Math.max(drag.moved,Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy));setTime(xToTime(e.clientX-strip.getBoundingClientRect().left+strip.scrollLeft));}else{hoverBlock=pointerBlock(e.clientX);updateHero();}});
strip.addEventListener('pointerleave',()=>{if(!drag){hoverBlock=-1;updateHero();}});
strip.addEventListener('scroll',()=>{if(!drag){hoverBlock=pointerBlock(pointerX);updateHero();}},{passive:true});
strip.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){strip.scrollLeft+=e.deltaY;e.preventDefault();}},{passive:false});
strip.addEventListener('pointerdown',e=>{if(e.button)return;e.preventDefault();stopPlayback();strip.setPointerCapture(e.pointerId);drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,x:e.clientX,moved:0,target:e.target.closest('.frame,.clip'),raf:0};setTime(xToTime(e.clientX-strip.getBoundingClientRect().left+strip.scrollLeft));updateWatching();updateHero();
 const tick=()=>{if(!drag)return;const r=strip.getBoundingClientRect(),x=drag.x,v=model.dragScroll(x,r.left,r.right);if(v){strip.scrollLeft+=v;setTime(xToTime(x-r.left+strip.scrollLeft));}drag.raf=requestAnimationFrame(tick);};drag.raf=requestAnimationFrame(tick);});
function endDrag(e){if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;cancelAnimationFrame(d.raf);if(strip.hasPointerCapture(e.pointerId))strip.releasePointerCapture(e.pointerId);if(e.type==='pointerup'&&d.moved<design('pick-distance')&&d.target){if(d.target.classList.contains('clip'))pickClip(d.target,+d.target.dataset.value);else pickShot(+d.target.dataset.value);}updateWatching();updateHero();highlightScript();}
strip.addEventListener('pointerup',endDrag);strip.addEventListener('pointercancel',endDrag);strip.addEventListener('lostpointercapture',endDrag);
function paintPosition(){sel=derivedSel();sf.querySelector('#sf-playhead').style.left=timeToX(playback.time)+'px';sf.querySelectorAll('.frame').forEach(el=>el.classList.toggle('current',Number(el.dataset.value)===sel));paintMonitor();highlightScript();}
function setTime(t){const previous=sel;playback.time=clamp(t,0,duration(cutShots()));paintPosition();if(sel!==previous&&!sf.classList.contains('is-watching')){clearTimeout(bindT);bindT=setTimeout(()=>renderView(),design('unit-debounce'));}}
function updateWatching(){const on=sf.classList.contains('mode-create')&&((historyState!=='pinned'&&sf.querySelector('.timeline').classList.contains('ux-focus'))||!!drag||playback.running),was=sf.classList.contains('is-watching');sf.classList.toggle('is-watching',on);if(was&&!on){clearTimeout(bindT);bindT=setTimeout(()=>renderView(),design('unit-debounce'));}measureMonitor();}
function stopPlayback(){playback.running=false;cancelAnimationFrame(playback.raf);playback.raf=0;const b=sf.querySelector('#sf-transport');b.textContent='▶';b.setAttribute('aria-label',labels.l5);b.setAttribute('aria-pressed','false');updateWatching();highlightScript();}
function transport(){if(playback.running){stopPlayback();return;}if(playback.time>=duration(cutShots()))setTime(0);playback.running=true;playback.last=performance.now();const b=sf.querySelector('#sf-transport');b.innerHTML='<i class="ic-pause"></i>';b.setAttribute('aria-label',labels.l6);b.setAttribute('aria-pressed','true');updateWatching();updateHero();
 const tick=now=>{if(!playback.running)return;setTime(playback.time+(now-playback.last)/1000);playback.last=now;keepPlayhead();if(playback.time>=duration(cutShots())){stopPlayback();return;}playback.raf=requestAnimationFrame(tick);};playback.raf=requestAnimationFrame(tick);}
function setLayer(l,el){if(layer!==l)cpClose();layer=l;viewKey='';sf.querySelectorAll('#sf-layerSeg button').forEach(d=>d.classList.toggle('on',d===el));buildStrip();renderView();}
function setZoom(z,el){zoomLevel=z;sel=derivedSel();viewKey='';sf.querySelectorAll('#sf-zoomSeg button').forEach(d=>d.classList.toggle('on',d===el));cpClose();buildStrip();renderView();flash(labels.l7+({Film:labels.l8,Act:labels.l9,Scene:labels.l10,Beat:labels.l11,Shot:labels.l12}[z]||z));}

/* Timeline cut dropdown: pointer behavior and menu ownership stay shared; keyboard uses a roving item. */
const tlname=sf.querySelector('#sf-tlname'),tlmenu=sf.querySelector('#sf-tlmenu');
tlname.tabIndex=0;tlname.setAttribute('role','button');tlname.setAttribute('aria-haspopup','menu');
tlname.setAttribute('aria-controls','sf-tlmenu');tlname.setAttribute('aria-expanded','false');
tlmenu.setAttribute('role','menu');tlmenu.setAttribute('aria-labelledby','sf-tlnameLabel');tlmenu.setAttribute('aria-hidden','true');
let tlFocusFrame=0,tlOpenVersion=0;
const tlItems=()=>[...tlmenu.querySelectorAll('[role="menuitemradio"]')];
function setCutLabel(){sf.querySelector('#sf-tlnameLabel').textContent=VNAME[ver];}
function buildTlMenu(){
  tlmenu.innerHTML=VKEYS.map((k,i)=>`<div class="mi ${k===ver?'on':''}" role="menuitemradio" tabindex="${k===ver?0:-1}" aria-checked="${k===ver}" data-sf-call="pickTl" data-value="${i}">${VNAME[k]}${CUTS[k].deliverableOf?renderLabels.deliverableSuffix:''}<span class="dot" aria-hidden="true"></span></div>`).join('');
}
function focusTlItem(index,defer){
  cancelAnimationFrame(tlFocusFrame);const version=tlOpenVersion;
  const focus=()=>{tlFocusFrame=0;if(version!==tlOpenVersion||!tlmenu.classList.contains('show')||!tlmenu.isConnected)return;
    const items=tlItems();if(!items.length)return;const at=(index%items.length+items.length)%items.length;
    items.forEach((item,i)=>item.tabIndex=i===at?0:-1);items[at].focus({preventScroll:true});
  };
  // visibility:hidden is removed by .show; wait one frame before the first focus attempt.
  if(defer)tlFocusFrame=requestAnimationFrame(focus);else focus();
}
function openTlMenu(focusIndex){
  document.dispatchEvent(new CustomEvent('ui:menu-open',{detail:{owner:'sf-timeline'}}));buildTlMenu();
  tlmenu.classList.add('show');tlname.classList.add('open');tlname.setAttribute('aria-expanded','true');tlmenu.setAttribute('aria-hidden','false');tlOpenVersion++;
  if(Number.isInteger(focusIndex))focusTlItem(focusIndex,true);
}
function toggleTlMenu(){if(tlmenu.classList.contains('show'))closeTlMenu();else openTlMenu();}
function closeTlMenu(restoreFocus){
  tlOpenVersion++;cancelAnimationFrame(tlFocusFrame);tlFocusFrame=0;
  tlmenu.classList.remove('show');tlname.classList.remove('open');tlname.setAttribute('aria-expanded','false');tlmenu.setAttribute('aria-hidden','true');
  tlItems().forEach(item=>item.tabIndex=-1);if(restoreFocus===true)tlname.focus({preventScroll:true});
}
function pickTl(i,restoreFocus=false){closeTlMenu(restoreFocus);cutTo(i);tlItems().forEach(item=>{const checked=VKEYS[Number(item.dataset.value)]===ver;item.setAttribute('aria-checked',String(checked));item.classList.toggle('on',checked);});}
tlname.addEventListener('keydown',e=>{
  const open=tlmenu.classList.contains('show');
  if(e.key==='Tab'){if(open)closeTlMenu();return;}
  if(e.key==='Escape'){if(open){e.preventDefault();e.stopPropagation();closeTlMenu(true);}return;}
  if(!['Enter',' ','ArrowDown','ArrowUp'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();
  if(e.key==='Enter'||e.key===' '){if(open)closeTlMenu(true);else openTlMenu(VKEYS.indexOf(ver));}
  else {const index=e.key==='ArrowDown'?0:VKEYS.length-1;if(open)focusTlItem(index,true);else openTlMenu(index);}
});
tlmenu.addEventListener('keydown',e=>{
  const item=e.target.closest('[role="menuitemradio"]');if(!item||!tlmenu.contains(item))return;
  const items=tlItems(),index=items.indexOf(item);
  if(e.key==='Tab'){closeTlMenu(true);return;} // restore the trigger, then let normal Tab/Shift+Tab leave the menu.
  if(!['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();
  if(e.key==='Escape')closeTlMenu(true);
  else if(e.key==='Enter'||e.key===' ')pickTl(Number(item.dataset.value),true);
  else focusTlItem(e.key==='Home'?0:e.key==='End'?items.length-1:index+(e.key==='ArrowDown'?1:-1),false);
});
document.addEventListener('click',e=>{if(!tlmenu.contains(e.target)&&!tlname.contains(e.target))closeTlMenu();},true);
document.addEventListener('ui:menu-open',e=>{if(e.detail?.owner!=='sf-timeline')closeTlMenu();});
sf.querySelector('.timeline').addEventListener('ux:rest',closeTlMenu);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeTlMenu();if(!cvFocusId)cpClose();}});

function cutTo(i){i=clamp(i,0,VKEYS.length-1);if(VKEYS[i]===ver)return;stopPlayback();vi=i;ver=VKEYS[i];playback.time=0;sel=0;viewKey='';setCutLabel();cpClose();buildStrip();renderView();keepPlayhead(true);flash(labels.l13+VNAME[ver]);}
/* The monitor and lined script keep their DOM identity while the playhead moves. */
const selectedTakes=model.initialTakes();

function measureMonitor(){const br=sf.querySelector('#sf-browser'),info=sf.querySelector('.monitor-info');if(br&&info)sf.style.setProperty('--monitor-fit',model.monitorFit(br.clientHeight,info.offsetHeight)+'px');}
function paintMonitor(){const mon=sf.querySelector('.monitor'),picture=sf.querySelector('#sf-monitorPicture');if(!picture)return;mon.hidden=layer==='script';sf.classList.toggle('layer-script',layer==='script');const s=currentShot();
 const image=s.picture?(layer==='storyboard'?sbBg(s):s.g):s.g;if(picture.dataset.image!==image){picture.style.background=image;picture.dataset.image=image;}picture.dataset.shotId=s.id;picture.dataset.value=cutShots().findIndex(x=>x.id===s.id);
 sf.querySelector('#sf-monitorTime').textContent=tc(playback.time)+' / '+tc(duration(cutShots()));sf.querySelector('#sf-monitorName').textContent=s.n+' · '+s.desc+' · '+s.d;const note=sf.querySelector('#sf-monitorNote');if(!note.textContent)note.textContent=labels.l14;}
function chooseTake(id){const sh=currentShot(),take=TAKES[sh.id]?.find(t=>t.id===id);if(!take)return;selectedTakes[sh.id]=id;viewKey='';renderView();}
function renderView(){const b=sf.querySelector('#sf-bview');if(!b)return;paintMonitor();const u=curArr()[sel],key=[ver,layer,zoomLevel,layer==='script'?'cut':u.id,selClip?.id||''].join(':');
 if(key===viewKey){highlightScript();return;}if(sf.classList.contains('is-watching')&&viewKey&&layer!=='script')return;viewKey=key;
 if(layer==='script')b.innerHTML=scriptHTML();
 else if(track!=='video'&&selClip){const c=selClip,sh=BY_ID[c.shotIds[0]];b.innerHTML=`<div class="shot-stage clip-detail" data-clip-id="${c.id}"><div class="t">${esc(c.text)}</div><div class="s">${tc(c.start)} · ${c.dur}s</div>${c.kind==='aud'?`<div class="audio-preview">${model.clipWaveform(c.start,design('wave-detail-count')).map(height=>`<i style="height:${height}"></i>`).join('')}</div><p class="shot-hint">${labels.l22}</p>`:`<div class="shot-frame" data-sf-call="clipPreviewClick"><div class="g" style="background:${sh.g}"></div><div class="clip-overlay">${esc(c.text)}</div></div>`}</div>`;}
 else if(zoomLevel==='Shot'){const sh=currentShot(),take=TAKES[sh.id].find(t=>t.id===selectedTakes[sh.id])||TAKES[sh.id][0];b.innerHTML=layer==='movie'?`<div class="unit-view" data-shot-id="${sh.id}"><p class="shot-hint">${labels.l42}</p><div class="take-list">${TAKES[sh.id].map(t=>`<button type="button" class="take-option ${t.id===take.id?'on':''}" aria-pressed="${t.id===take.id}" data-sf-call="chooseTake" data-value="${t.id}"><span class="take-thumb" style="background:${sh.g};background-position:${t.framing};background-size:${t.scale}% auto"></span><span>${t.label}</span></button>`).join('')}</div></div>`:'<div class="unit-view">'+'<p class="shot-hint">'+labels.l15+'</p>'+'</div>';}
 else{const tiles=memberShots(u).map(sh=>{const idx=cutShots().findIndex(s=>s.id===sh.id);return `<div class="unit-tile" data-shot-id="${sh.id}" data-sf-call="selShot" data-value="${idx}"><div class="unit-thumb">${layer==='storyboard'?sbArt(sh):`<div class="g" style="background:${sh.g}"></div>`}<span class="n">${sh.n} · ${tc(recordShots()[idx].start)}</span></div><div class="unit-cap"><div class="t">${sh.n}</div><div class="s">${sh.desc}</div></div></div>`;}).join('');b.innerHTML=`<div class="unit-view" data-unit-id="${u.id}"><div class="unit-head" data-sf-call="selUnit"><span class="scope-tag">${zoomLevel}</span><span class="name">${u.n}</span><span class="sub">${u.f}</span></div><div class="unit-grid">${tiles}</div></div>`;}
 b.scrollTop=0;highlightScript();requestAnimationFrame(measureOverflow);}
function scriptHTML(){const ids=CUTS[ver].shotIds,visible=scriptFor(ids),content=visible.map(e=>{const covered=e.shots.filter(id=>ids.includes(id));if(e.type==='scene')return `<div class="selel head" data-script-id="${e.id}" data-sf-call="selScript" data-type="scene" data-value="${e.id}" data-shot-ids="${covered.join(',')}">${esc(e.text)}</div>`;
 return `<div class="script-element" data-script-id="${e.id}" data-shot-ids="${covered.join(',')}">${e.speaker?`<div class="cue">${CHAR_DB[e.speaker].name.toUpperCase()}</div>${e.paren?`<div class="paren">${e.paren}</div>`:''}`:''}<p class="selel ${e.type==='dialogue'?'dlg':''}" data-sf-call="selScript" data-type="${e.type}" data-value="${e.id}" data-shot-ids="${covered.join(',')}">${esc(e.text)} <small class="coverage">${covered.map(id=>BY_ID[id].n).join(', ')}</small></p></div>`;}).join('');
 return `<div class="script" data-script-scope="cut" data-level="${zoomLevel}"><div class="sl">${CONTENT.workspace.text.t3} · ${VNAME[ver]} · ${duration(cutShots())}s</div>${zoomLevel==='Film'?`<p class="selel logline" data-sf-call="selUnit">${LOG_LINE}</p>`:''}${content}</div>`;}
let highlighted='',readingPlan=null,readingWas=false,readingOffset=0,readingLast=0;
// Each element is read during the first shot that covers it; elements sharing a shot divide its time by text length.
function planReading(root){if(readingPlan?.root===root)return readingPlan;const items=model.readingSchedule(ver).map(it=>({...it,el:root.querySelector(`[data-script-id="${it.id}"]`)})).filter(it=>it.el);items.forEach(it=>it.el.dataset.owner=it.owner);return readingPlan={root,items};}
function paintReading(b,root,plan){const items=plan.items;if(!items.length)return;const room=model.readingRoom(b.clientHeight)+'px';
 if(root.style.getPropertyValue('--reading-room')!==room){const before=items[0].el.getBoundingClientRect().top;root.style.setProperty('--reading-room',room);root.classList.add('has-reading-room');b.scrollTop+=items[0].el.getBoundingClientRect().top-before;}
 const position=model.readingPosition(items,playback.time,duration(cutShots())),i=position.index,cur=items[i],next=items[i+1],rect=cur.el.getBoundingClientRect(),end=next?next.el.getBoundingClientRect().top:rect.bottom;
 const target=model.readingTarget({scroll:b.scrollTop,viewportTop:b.getBoundingClientRect().top,height:b.clientHeight,currentTop:rect.top,currentBottom:rect.bottom,nextTop:end,fraction:position.fraction}),now=performance.now(),reading=model.readingScroll({scroll:b.scrollTop,target,was:readingWas,offset:readingOffset,last:readingLast,now,reduced:!readingWas&&matchMedia('(prefers-reduced-motion:reduce)').matches});readingOffset=reading.offset;readingLast=now;b.scrollTop=reading.scroll;
 items.forEach(it=>it.el.classList.toggle('reading',it===cur));}
function highlightScript(){if(layer!=='script')return;const b=sf.querySelector('#sf-bview'),root=b.querySelector('.script');if(!root)return;const plan=planReading(root),picked=model.pickedShotIds(activeSel),reading=playback.running||(!!drag&&drag.moved>=design('pick-distance'));let first=null;
 plan.items.forEach(it=>{const on=picked.includes(it.owner);it.el.classList.toggle('hl',on);if(on&&!first)first=it.el;});
 root.querySelectorAll('.selel').forEach(el=>{const on=!!activeSel?.scriptId&&el.dataset.value===activeSel.scriptId;el.classList.toggle('on',on);if(on)first=el.closest('[data-script-id]');});
 b.classList.toggle('is-reading',reading);if(reading)paintReading(b,root,plan);else plan.items.forEach(it=>it.el.classList.remove('reading'));readingWas=reading;
 const key=[ver,zoomLevel,activeSel?.scriptId||picked.join()].join(':');if(reading||key===highlighted)return;highlighted=key;if(first){const r=first.getBoundingClientRect(),br=b.getBoundingClientRect();const next=model.scriptSelectionScroll({scroll:b.scrollTop,top:r.top,bottom:r.bottom,height:r.height,viewportTop:br.top,viewportBottom:br.bottom,viewportHeight:br.height});if(next!==null)b.scrollTop=next;}}
function measureOverflow(){sf.querySelectorAll('.clip .ctx,#sf-cinput,.tlname>span,.ci-b,.bview,.cp-body,.ctrace-body,.cv-doc').forEach(el=>el.classList.toggle('is-overflow',model.isOverflow(el.scrollWidth,el.clientWidth,el.scrollHeight,el.clientHeight)));}

/* ---- selection → context panel ---- */
let activeSel=null;
function openPanel(){const br=sf.querySelector('#sf-browser');if(br)br.classList.add('panel-open');}
function cpClose(){selClip=null;sf.querySelectorAll('.clip.sel,.cp-sec.sel').forEach(c=>c.classList.remove('sel'));sf.querySelectorAll('.frame.picked').forEach(c=>c.classList.remove('picked'));const br=sf.querySelector('#sf-browser');if(br)br.classList.remove('panel-open');activeSel=null;highlightScript();
  sf.querySelectorAll('#sf-bview .on').forEach(x=>x.classList.remove('on'));
  cvClearPill();cvCopilot(false);}   // deselect → drop the @tag and the bar's shadow (same as Explore)
/* clicking empty space ANYWHERE in the browser region (incl. the wide blank gutters either side of the
   centred reading column, which live in .browser but outside #sf-bview) closes the panel — but not when the
   click lands on a selectable element or inside the context panel itself */
(function(){const br=sf.querySelector('#sf-browser');const bv=sf.querySelector('#sf-bview');if(!br)return;
  br.addEventListener('click',e=>{
    if(e.target.closest('.selel,.shot-frame,.monitor,.unit-tile,.unit-head,.cpanel,.take-list'))return;
    if(sf.querySelector('.browser.panel-open'))cpClose();
  });
  /* picking a browser material must NOT steal focus from the copilot input (keeps the chat/history open) */
  if(bv)bv.addEventListener('pointerdown',e=>{
    if(document.activeElement===sf.querySelector('#sf-cinput')
       && e.target.closest('.selel,.shot-frame,.unit-tile,.unit-head')) e.preventDefault();
  });})();
/* cppanel: reference thumbs open the media preview; clicking the panel never steals the copilot focus */
(function(){const cp=sf.querySelector('#sf-cpanel');if(!cp)return;
  cp.addEventListener('pointerdown',e=>{if(document.activeElement===sf.querySelector('#sf-cinput'))e.preventDefault();});
  cp.addEventListener('click',e=>{
    const block=e.target.closest('.cp-sec'); if(!block)return;
    const wasSel=block.classList.contains('sel');               // single-select the setting block, keep its shadow
    cp.querySelectorAll('.cp-sec.sel').forEach(s=>{if(s!==block)s.classList.remove('sel');});
    block.classList.add('sel');
    const thumb=e.target.closest('.ref-thumb');
    if(thumb&&wasSel){                                          // image only enlarges once its block is already selected
      cvSetPill(thumb.dataset.pc.split(' · ')[0]); cvCopilot(true);
      mediaPreview(thumb.dataset.pg,thumb.dataset.pc,thumb.dataset.pk);
    }else{                                                       // first click just selects the block & targets it in the copilot
      cvSetPill(block.dataset.tag||renderLabels.block); cvCopilot(true);
    }
  });
})();
function clearSel(){sf.querySelectorAll('#sf-bview .on').forEach(x=>x.classList.remove('on'));
  sf.querySelectorAll('#sf-cpBody .cp-sec.sel').forEach(s=>s.classList.remove('sel'));}  // picking another material clears the cpanel block selection
function selScript(type,id,el){clearSel();if(el)el.classList.add('on');const selection=model.scriptSelection(type,id,el?.dataset.shotIds?.split(','),ver,zoomLevel);if(!selection)return;
 activeSel=selection.active;openPanel();cvSetPill(selection.chipName);cvCopilot(true);updateCtx();
 if(selection.index>=0)scrollToShot(selection.index);
}
function selShot(i,el){const sh=cutShots()[i];if(!sh)return;
 if(sf.querySelector('.browser.panel-open')&&activeSel?.type==='shot'&&activeSel.shotId===sh.id){mediaPreview(layer==='storyboard'?sbBg(sh):sh.g,sh.n+' · '+sh.desc,layer==='storyboard'?'board':'shot');return;}
 clearSel();if(el)el.classList.add('on');activeSel={type:'shot',shotId:sh.id,shotIdx:i};openPanel();cvSetPill(sh.n+' · '+sh.desc,'shot:'+sh.id);cvCopilot(true);if(currentShot()?.id!==sh.id){setTime(recordShots()[i].start);keepPlayhead(true);}updateCtx();
}
function selUnit(el){clearSel();if(el)el.classList.add('on');const u=curArr()[sel];if(!u)return;activeSel={type:'unit',unit:u,label:zoomLevel+' · '+u.n};openPanel();cvSetPill(u.n+' · '+u.f);cvCopilot(true);updateCtx();}

/* visual helpers — borderless, app-palette */
function refThumb(name,label,inner,pg,pk){return `<div class="ref-tile"><div class="ref-thumb" data-pg="${pg||''}" data-pc="${name} · ${label}" data-pk="${pk||''}">${inner}<div class="ref-name">${name}</div></div></div>`;}
function thGrad(g){return `<div class="g" style="background:${g}"></div>`;}
function charThumb(c){return refThumb(CHAR_DB[c].name,renderLabels.character,thGrad(CHAR_DB[c].sheet),CHAR_DB[c].sheet,'char');}
function sceneThumb(sceneId){const scene=SCENES[sceneId];return refThumb(scene.set,renderLabels.location,thGrad(scene.grad),scene.grad,'scene');}
function styleThumb(){return refThumb(renderLabels.lookbook,renderLabels.style,thGrad(STYLE_REF.grad),STYLE_REF.grad,'style');}
function storyboardThumb(s){return refThumb(s.n,renderLabels.storyboard,sbArt(s),sbBg(s),'board');}

/* full-screen media preview — same lightbox as Explore, used for Create's videos & reference images;
   uses the current handbook theme and closes without changing that theme. */
function mediaPreview(bg,cap,kind){
  if(typeof cvUnfocus==='function' && cvFocusId){/* already open */}
  cvFocusId='__media';
  const fo=sf.querySelector('#sf-cvFocus'),stage=sf.querySelector('#sf-cvFocusStage');
  stage.innerHTML='<div class="cv-photo"><div class="g" style="background:'+(bg||'var(--sunk)')+'"></div></div><div class="cv-photo-cap">'+esc(cap||'')+'</div>';
  fo.classList.add('media','show');
}
function sec(label,body){return `<div class="cp-sec" data-tag="${label.split(' — ')[0]}"><h5>${label}</h5>${body}</div>`;}
function rows(arr){return `<div class="cp-block">`+arr.map(r=>`<div class="cp-row"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')+`</div>`;}
function promptFor(s){const cs=s.cast.map(c=>CHAR_DB[c].name).join(' & ')||renderLabels.noCast;return `<span class="tok">${esc(s.desc)}</span> · ${CONTENT.workspace.text.t3} · ${s.format}<br><b>${cs}</b><br>${SCENES[s.scene].slug}<br>${s.size} · ${s.lens} · ${s.move}<br>${esc(s.desc)}. ${SCENES[s.scene].textures}. ${renderLabels.generatedStill}`;}
function updateCtx(){const body=sf.querySelector('#sf-cpBody');if(!body)return;if(!activeSel){body.innerHTML='<div class="cp-text">'+labels.l16+'</div>';return;}
 if(activeSel.type==='clip'){const c=activeSel.clip;body.innerHTML=sec(labels.l17,'<div class="cp-text">'+esc(c.text)+'</div>')+sec(labels.l18,rows([[labels.l19,tc(c.start)],[labels.l20,c.dur+'s'],[labels.l12,c.shotIds.map(id=>BY_ID[id].n).join(', ')]]))+sec(labels.l21,'<div class="cp-text">'+(c.kind==='aud'?labels.l22:labels.l23)+'</div>');return;}
 if(activeSel.type==='shot'){const s=BY_ID[activeSel.shotId]||cutShots()[activeSel.shotIdx];body.innerHTML=shotAll(s);return;}body.innerHTML=unitAll(activeSel.unit);
}
function shotAll(s){const chars=s.cast,scene=SCENES[s.scene],record=recordShots().find(x=>x.id===s.id);return sec(labels.l24,'<div class="cp-prompt">'+promptFor(s)+'</div>')
 +sec(labels.l18,rows([[labels.l12,s.n],[labels.l19,tc(record?.start||0)],[labels.l20,s.d],[labels.l25,s.format]]))
 +sec(labels.l26,'<div class="ref-grid">'+chars.map(charThumb).join('')+sceneThumb(s.scene)+storyboardThumb(s)+styleThumb()+'</div>')
 +sec(labels.l27,chars.length?rows(chars.map(c=>[CHAR_DB[c].name,CHAR_DB[c].voice])):'<div class="cp-text">'+labels.l28+'</div>')
 +sec(labels.l29,'<div class="cp-text">'+esc(scriptText([s.id])).replace(/\n/g,'<br>')+'</div>')
 +sec(labels.l30,'<div class="cp-text">'+scene.slug+'<br>'+scene.textures+'<br>'+s.props.join(' · ')+'</div>')
 +sec(labels.l31,rows([[labels.l32,s.size],[labels.l33,s.lens],[labels.l34,s.move],[labels.l35,STYLE_REF.rig],[labels.l36,STYLE_REF.grade]]));}
function unitAll(u){const members=memberShots(u),chars=u.chars||[],scenes=[...new Set(members.map(s=>s.scene))];return sec(labels.l37,'<div class="cp-text">'+esc(u.line)+'</div>')
 +sec(labels.l18,rows([[labels.l38,String(members.length)],[labels.l12,members.map(s=>s.n).join(', ')],[labels.l20,duration(members)+'s']]))
 +sec(labels.l27,chars.length?'<div class="ref-grid">'+chars.filter(c=>CHAR_DB[c].sheet).map(charThumb).join('')+'</div>'+rows(chars.map(c=>[CHAR_DB[c].name,CHAR_DB[c].voice])):'<div class="cp-text">'+labels.l28+'</div>')
 +sec(labels.l39,'<div class="ref-grid">'+scenes.map(sceneThumb).join('')+'</div>')
 +sec(labels.l30,'<div class="cp-text">'+scenes.map(id=>SCENES[id].slug+'<br>'+SCENES[id].textures).join('<br>')+'<br>'+[...new Set(members.flatMap(s=>s.props))].join(' · ')+'</div>')
 +sec(labels.l40,rows([[labels.l35,STYLE_REF.rig],[labels.l25,SHOT_LIST[0].format],[labels.l41,STYLE_REF.light],[labels.l36,STYLE_REF.grade]]));}

function send(){
  const cinput=sf.querySelector('#sf-cinput'),v=cinput.textContent.replace(/\u200b/g,'').trim();if(!v)return;
  cinput.innerHTML='';lastCaret=null;closeMention();checkInputText();if(historyState==='closed')setHistory('peek');
  pushChat('user',esc(v),true);
  setTimeout(()=>{pushChat('bot',model.reply(v,{selection:activeSel,cut:ver,zoom:zoomLevel,index:sel}),true);
  },design('chat-reply-delay'));}
let ft;function flash(html){const r=sf.querySelector('#sf-reply');r.innerHTML=html;r.classList.add('show');clearTimeout(ft);ft=setTimeout(()=>r.classList.remove('show'),design('toast-duration'));}

// Native contenteditable owns wrapping and atomic Backspace; ranges own insertion at the last caret.
const cinputEl=sf.querySelector('#sf-cinput'),mentionMenu=sf.querySelector('#sf-mentions');
let lastCaret=null,mentionRange=null,mentionIndex=0,mentionItems=[],historyState=DEFAULTS.history,historyTimer=0;
function chatFocused(){return sf.querySelector('.copilot').classList.contains('ux-focus');}
function saveCaret(){const s=getSelection();if(s.rangeCount&&cinputEl.contains(s.anchorNode)){lastCaret=s.getRangeAt(0).cloneRange();}}
function caretEnd(){const r=document.createRange();r.selectNodeContents(cinputEl);r.collapse(false);return r;}
function putChip(name,key,committed=chatFocused(),range=null){key=key||name;const old=[...cinputEl.querySelectorAll('.selpill')].find(p=>p.dataset.material===key);if(old){if(committed)delete old.dataset.tentative;return;}
 if(!committed)cinputEl.querySelectorAll('.selpill[data-tentative]').forEach(p=>p.remove());
 const p=document.createElement('span');p.className='selpill show';p.contentEditable='false';p.dataset.material=key;p.dataset.name=name;p.textContent='@'+name;if(!committed)p.dataset.tentative='';
 const r=range||(committed&&lastCaret&&cinputEl.contains(lastCaret.startContainer)?lastCaret.cloneRange():caretEnd());r.deleteContents();r.insertNode(p);r.setStartAfter(p);r.collapse(true);lastCaret=r.cloneRange();
 if(committed){const s=getSelection();s.removeAllRanges();s.addRange(r);}checkInputText();}
function checkInputText(){if(!cinputEl)return;const text=cinputEl.textContent.replace(/\u200b/g,'').trim();if(!text&&!cinputEl.querySelector('.selpill'))cinputEl.innerHTML='';cinputEl.classList.toggle('has-text',!!text);requestAnimationFrame(measureOverflow);}
function closeMention(){mentionMenu.hidden=true;mentionRange=null;mentionItems=[];}
function paintMentions(){mentionMenu.innerHTML=mentionItems.map((m,i)=>`<button type="button" role="option" aria-selected="${i===mentionIndex}" class="${i===mentionIndex?'on':''}" data-mention-index="${i}"><b>${esc(m.name)}</b><small>${esc(m.detail)}</small></button>`).join('');}
function updateMention(){saveCaret();const s=getSelection();if(!s.rangeCount||!s.isCollapsed||s.anchorNode?.nodeType!==Node.TEXT_NODE||!cinputEl.contains(s.anchorNode)){closeMention();return;}
 const text=s.anchorNode.textContent.slice(0,s.anchorOffset),query=model.mentionQuery(text);if(query===null){closeMention();return;}
 mentionRange=s.getRangeAt(0).cloneRange();mentionRange.setStart(s.anchorNode,s.anchorOffset-query.length-1);mentionItems=model.mentionMatches(query,ver);if(!mentionItems.length){closeMention();return;}
 mentionIndex=0;paintMentions();mentionMenu.hidden=false;const r=s.getRangeAt(0).getBoundingClientRect(),bar=sf.querySelector('.cbar').getBoundingClientRect();const position=model.mentionPosition({caretLeft:r.left,caretTop:r.top,inputTop:r.top?undefined:cinputEl.getBoundingClientRect().top,barLeft:bar.left,barBottom:bar.bottom,barWidth:bar.width});mentionMenu.style.left=position.left+'px';mentionMenu.style.bottom=position.bottom+'px';}
function insertMention(i){const m=mentionItems[i],r=mentionRange;if(!m||!r)return;closeMention();putChip(m.name,m.key,true,r);cinputEl.focus({preventScroll:true});}
mentionMenu.addEventListener('pointerdown',e=>{e.preventDefault();const b=e.target.closest('[data-mention-index]');if(b)insertMention(+b.dataset.mentionIndex);});
document.addEventListener('selectionchange',saveCaret);
cinputEl.addEventListener('input',()=>{checkInputText();updateMention();});
cinputEl.addEventListener('focus',()=>{cinputEl.querySelectorAll('.selpill[data-tentative]').forEach(p=>delete p.dataset.tentative);saveCaret();});
cinputEl.addEventListener('keydown',e=>{if(!mentionMenu.hidden&&['Enter','Escape','ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();e.stopPropagation();if(e.key==='Escape')closeMention();else if(e.key==='Enter')insertMention(mentionIndex);else{mentionIndex=(mentionIndex+(e.key==='ArrowDown'?1:-1)+mentionItems.length)%mentionItems.length;paintMentions();}return;}
 if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}else if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();sf.querySelector('.cbar .send').focus();}});
function setHistory(state){historyState=state;sf.classList.toggle('history-peek',state==='peek');sf.classList.toggle('history-pinned',state==='pinned');const b=sf.querySelector('#sf-historyToggle');b.setAttribute('aria-expanded',String(state!=='closed'));b.setAttribute('aria-pressed',String(state==='pinned'));if(state!=='closed')renderChat(false);updateWatching();}
function toggleHistory(){clearTimeout(historyTimer);setHistory(historyState==='pinned'?'closed':'pinned');}
function peekHistory(){clearTimeout(historyTimer);if(historyState!=='pinned')setHistory('peek');}
function leaveHistory(){clearTimeout(historyTimer);historyTimer=setTimeout(()=>{if(historyState==='peek')setHistory('closed');},design('history-grace'));}
[sf.querySelector('#sf-historyToggle'),sf.querySelector('.ctrace')].forEach(el=>{el.addEventListener('pointerenter',peekHistory);el.addEventListener('pointerleave',leaveHistory);});

// Copilot chat history (mock — like a normal copilot thread)
const CHAT=CONTENT.workspace.chat.map(m=>({...m}));

function renderChat(animateLast){
  const c=sf.querySelector('#sf-ctraceInner'); if(!c)return;
  c.innerHTML=CHAT.map((m,i)=>`<div class="cmsg ${m.r} ${animateLast&&i===CHAT.length-1?'in':''}"><div class="b">${m.t}</div></div>`).join('');
  const body=sf.querySelector('#sf-ctraceBody'); if(body)body.scrollTop=body.scrollHeight;
}
function pushChat(role,text,animate){
  const message={r:role,t:text};CHAT.push(message);renderChat(animate);
  if(role!=='bot'||!animate)return;
  const box=sf.querySelector('#sf-ctraceInner .cmsg:last-child .b');
  const holder=document.createElement('div');holder.innerHTML=text;
  const plain=holder.textContent;box.textContent='';box.setAttribute('aria-live','polite');
  let i=0;const timer=setInterval(()=>{box.textContent=plain.slice(0,i+=design('chat-stream-step'));
    const body=sf.querySelector('#sf-ctraceBody');body.scrollTop=body.scrollHeight;
    if(i>=plain.length){clearInterval(timer);box.innerHTML=text;}
  },design('chat-stream-interval'));
}
// Decision 4: the handbook owns the theme pair; toggleTheme is intentionally removed.
function bMode(el){
  stopPlayback();
  el.parentNode.querySelectorAll('button').forEach(d=>d.classList.remove('on'));
  el.classList.add('on');
  const mode=el.dataset.mode;
  const app=sf;
  if(typeof cvUnfocus==='function')cvUnfocus();
  if(typeof cpClose==='function')cpClose();
  if(mode==='explore'){
    app.classList.remove('mode-create');app.classList.add('mode-explore');
    cvInit();cvDeselect();requestAnimationFrame(cvApply);
  }else{
    app.classList.remove('mode-explore');app.classList.add('mode-create');
    cvClearPill();cvCopilot(false);   // default Create → no @tag, no shadow (cpClose above already deselected)
    renderView();updateWatching();
    requestAnimationFrame(()=>{layoutStrip();keepPlayhead(true);updateHero();});
  }
}
/* The blank padding is part of the bar; its invisible side gutters are not. */
const _cbar=sf.querySelector('.cbar');
_cbar.addEventListener('pointerdown',e=>{if(e.target===cinputEl||e.target.closest('.send,.mention-menu'))return;e.preventDefault();cinputEl.focus({preventScroll:true});const r=caretEnd(),s=getSelection();s.removeAllRanges();s.addRange(r);saveCaret();});

/* ============================================================
   EXPLORE · infinite freeform canvas engine
   ============================================================ */
const cvVp=sf.querySelector('#sf-cvVp');
const cvInner=sf.querySelector('#sf-cvInner');
let cvPan={x:DEFAULTS.view.x,y:DEFAULTS.view.y}, cvScale=DEFAULTS.view.z, cvSelId=null, cvFlt=DEFAULTS.filter, cvInited=false,cvUserMoved=false;
let cvLastWidth=sf.clientWidth;

function cvApply(){cvInner.style.transform=`translate(${cvPan.x}px,${cvPan.y}px) scale(${cvScale})`;}

function cvMakeEl(it){
  const el=document.createElement('div');
  el.className=`ci ${it.type==='img'?'img':'note'}`+(it.id===cvSelId?' sel':'');
  el.dataset.id=it.id;el.dataset.tag=it.tag;el.dataset.phase=it.phase||'';el.setAttribute('aria-label',it.title||'');
  el.setAttribute('data-cmp','');el.setAttribute('data-live','');el.setAttribute('data-nofocus','');
  el.style.left=it.x+'px'; el.style.top=it.y+'px';
  if(it.type==='img'){
    el.innerHTML=`<div class="ci-pic"><div class="g" style="background:${it.g}"></div></div>`;
  }else{
    el.innerHTML=`<div class="ci-tag">${CV_TAGN[it.tag]}</div>`+
      `<div class="ci-h" spellcheck="false">${esc(it.title||'')}</div>`+
      `<div class="ci-b" spellcheck="false" data-ph="${labels.l43}">${esc(it.body||'')}</div>`;
  }
  cvBindItem(el,it);
  return el;
}
function cvRender(){
  cvInner.querySelectorAll('.ci').forEach(e=>e.remove());
  CV_ITEMS.forEach(it=>cvInner.appendChild(cvMakeEl(it)));
  cvApplyFilter();
}

/* ---- selection ↔ copilot @target ---- */
function cvPillName(it){return it.title||(it.type==='img'?renderLabels.reference:renderLabels.note);}
function cvSetPill(name,key){putChip(name,key);}
function cvClearPill(){cinputEl.querySelectorAll('.selpill[data-tentative]').forEach(p=>p.remove());checkInputText();}
function cvCopilot(on){const c=sf.querySelector('.cbar');if(c)c.classList.toggle('cv-active',!!on);}

function cvSelect(id,focus){
  cvResetFilter();                                      // touching material releases any active filter
  cvSelId=id;
  const it=CV_ITEMS.find(x=>x.id===id);
  cvInner.querySelectorAll('.ci').forEach(e=>{const on=e.dataset.id===id;e.classList.toggle('sel',on);if(!on)e.classList.remove('zoom');});
  const el=cvInner.querySelector(`.ci[data-id="${id}"]`);
  if(el)el.classList.toggle('zoom',!!focus);
  if(it){cvSetPill(cvPillName(it));cvCopilot(true);}   // chat box targets this material
  if(focus)cvCenterOn(id);
}
function cvDeselect(){
  cvResetFilter();                                      // click the empty board → release filter too
  cvSelId=null;
  cvInner.querySelectorAll('.ci').forEach(e=>e.classList.remove('sel','zoom'));
  cvClearPill();cvCopilot(false);                       // and the @target disappears
}
function cvCenterOn(id){
  const el=cvInner.querySelector(`.ci[data-id="${id}"]`), it=CV_ITEMS.find(x=>x.id===id);
  if(!el||!it)return;
  const w=el.offsetWidth,h=el.offsetHeight,r=cvVp.getBoundingClientRect();
  cvInner.classList.add('is-centering');
  cvUserMoved=true;
  const view=model.canvasCenter({...it,w,h},r.width,r.height,{...cvPan,z:cvScale});cvPan={x:view.x,y:view.y};
  cvApply();
  setTimeout(()=>{cvInner.classList.remove('is-centering');},design('canvas-center-release'));
}

function cvBindItem(el,it){
  el.addEventListener('pointerdown',e=>{
    if(e.button)return;
    e.stopPropagation(); e.preventDefault();el.setPointerCapture(e.pointerId);
    const wasSel=(cvSelId===it.id);
    const sx=e.clientX, sy=e.clientY, ox=it.x, oy=it.y; let moved=false;
    el.classList.add('dragging');
    const mv=ev=>{if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)>design('pick-distance')){moved=true;cvUserMoved=true;el.classList.remove('zoom');}
      const position=model.canvasTranslate({x:ox,y:oy},ev.clientX-sx,ev.clientY-sy,cvScale);it.x=position.x;it.y=position.y;
      el.style.left=it.x+'px'; el.style.top=it.y+'px';};
    const up=ev=>{el.classList.remove('dragging');document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);
      if(moved||ev.type==='pointercancel')return;                                              // a drag → just reposition
      if(wasSel)cvFocus(it.id);                                     // click an already-selected block → edit mode
      else cvSelect(it.id,true);                                    // first click → enlarge + centre + cue copilot
    };
    document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
  });
  el.addEventListener('dblclick',()=>cvFocus(it.id));               // double-click → straight to edit mode
}

/* ---- pan & zoom (drag = pan, scroll = pan, ⌘/ctrl-scroll = zoom) ---- */
cvVp.addEventListener('pointerdown',e=>{
  if(e.button||e.target.closest('.ci')||e.target.closest('.cv-rail-zone'))return;cvVp.setPointerCapture(e.pointerId);
  if(e.pointerType!=='touch')cvDeselect();
  const sx=e.clientX, sy=e.clientY, ox=cvPan.x, oy=cvPan.y;let panned=false;
  cvVp.classList.add('grabbing');
  const mv=ev=>{panned=true;cvUserMoved=true;const position=model.canvasTranslate({x:ox,y:oy},ev.clientX-sx,ev.clientY-sy);cvPan.x=position.x;cvPan.y=position.y;cvApply();};
  const up=ev=>{if(!panned&&ev.type!=='pointercancel'&&e.pointerType==='touch')cvDeselect();cvVp.classList.remove('grabbing');document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
});
cvVp.addEventListener('wheel',e=>{
  e.preventDefault();cvUserMoved=true;
  if(e.ctrlKey||e.metaKey){
    const r=cvVp.getBoundingClientRect(), mx=e.clientX-r.left, my=e.clientY-r.top;
    const view=model.canvasZoom({...cvPan,z:cvScale},model.canvasWheelFactor(e.deltaY),mx,my);cvScale=view.z;cvPan={x:view.x,y:view.y};
  }else{const position=model.canvasTranslate(cvPan,-e.deltaX,-e.deltaY);cvPan.x=position.x;cvPan.y=position.y;}
  cvApply();
},{passive:false});

function cvZoom(factor){
  cvUserMoved=true;
  const r=cvVp.getBoundingClientRect(),mx=r.width/2,my=r.height/2;
  const view=model.canvasZoom({...cvPan,z:cvScale},factor,mx,my);cvScale=view.z;cvPan={x:view.x,y:view.y};cvApply();
}
function cvFit(){cvUserMoved=false;const els=[...cvInner.querySelectorAll('.ci')];if(!els.length)return;const r=cvVp.getBoundingClientRect(),view=model.canvasFit(els.map(el=>({x:parseFloat(el.style.left),y:parseFloat(el.style.top),w:el.offsetWidth,h:el.offsetHeight})),r.width,r.height);cvScale=view.z;cvPan={x:view.x,y:view.y};cvApply();}

/* ---- material filter (left rail) ---- */
function cvFilter(f,el){cvFlt=f;sf.querySelectorAll('.cv-rail .rb').forEach(b=>b.classList.remove('on'));el.classList.add('on');cvApplyFilter();}
function cvResetFilter(){
  if(cvFlt==='all')return;
  cvFlt='all';
  sf.querySelectorAll('.cv-rail .rb').forEach(b=>b.classList.toggle('on',b.dataset.flt==='all'));
  cvApplyFilter();
}
function cvApplyFilter(){
  if(cvFlt==='all'){cvInner.classList.remove('flt');cvInner.querySelectorAll('.ci').forEach(e=>e.classList.remove('match'));return;}
  cvInner.classList.add('flt');
  cvInner.querySelectorAll('.ci').forEach(e=>e.classList.toggle('match',e.dataset.tag===cvFlt));
}

/* ---- focus / edit lightbox ---- */
let cvFocusId=null;
function cvFocus(id){
  const it=CV_ITEMS.find(x=>x.id===id); if(!it)return;
  cvFocusId=id; cvSelId=id;
  const fo=sf.querySelector('#sf-cvFocus'), stage=sf.querySelector('#sf-cvFocusStage');
  if(it.type==='img'){
    // Viewing an image keeps the handbook's current theme.
      fo.classList.add('media');fo.classList.remove('doc');
    stage.innerHTML=`<div class="cv-photo"><div class="g" style="background:${it.g}"></div></div>`+
      `<div class="cv-photo-cap" contenteditable="true" spellcheck="false">${esc(it.title||'')}</div>`;
  }else{
    // text: read-only document column (like Create's browser) — clicking it keeps the copilot/chat open
    fo.classList.remove('media');fo.classList.add('doc');
    stage.innerHTML=`<div class="cv-doc">`+
      `<div class="cv-art-tag">${CV_TAGN[it.tag]}</div>`+
      `<div class="cv-art-h">${esc(it.title||'')}</div>`+
      `<div class="cv-art-b">${esc(it.body||'')}</div>`+
      `</div>`;
  }
  stage.querySelectorAll('[contenteditable]').forEach(ed=>ed.addEventListener('blur',()=>{
    if(ed.classList.contains('cv-art-b'))it.body=ed.textContent.trim(); else it.title=ed.textContent.trim();
    cvSetPill(cvPillName(it));
  }));
  fo.classList.add('show');
  cvSetPill(cvPillName(it)); cvCopilot(true);
  const ci=sf.querySelector('#sf-cinput'); // Focus only changes the bar; history has its own state.
  if(ci){ci.focus();const r=document.createRange();r.selectNodeContents(ci);r.collapse(false);const s=getSelection();s.removeAllRanges();s.addRange(r);}
}
function cvUnfocus(){
  const fo=sf.querySelector('#sf-cvFocus');
  fo.classList.remove('show','media','doc');
  sf.querySelector('#sf-cvFocusStage').innerHTML='';
  cvFocusId=null;
  const ci=sf.querySelector('#sf-cinput'); if(ci)ci.blur();
}
// preview exits when focus leaves it — click outside both the preview & the copilot, Esc, or window blur
document.addEventListener('pointerdown',e=>{if(cvFocusId&&!e.target.closest('.cv-focus-stage,.preview-close')&&!e.target.closest('.copilot'))cvUnfocus();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&cvFocusId)cvUnfocus();});
window.addEventListener('blur',()=>{if(cvFocusId)cvUnfocus();});
// clicking the material itself must not steal focus from the copilot (keeps the chat history open);
// only an editable field (title / body / caption) is allowed to take focus for editing
sf.querySelector('#sf-cvFocusStage').addEventListener('pointerdown',e=>{if(!e.target.closest('[contenteditable]'))e.preventDefault();});

function cvInit(){
  if(cvInited)return; cvInited=true;
  cvRender();
  requestAnimationFrame(cvFit);
}

// Delegated routing also covers content generated after language/theme changes.
sf.addEventListener('click',e=>{
  const el=e.target.closest('[data-sf-call]');if(!el||!sf.contains(el))return;
  if(el.dataset.sfCall!=='toggleTlMenu'&&el.dataset.sfCall!=='pickTl')closeTlMenu();const v=el.dataset.value;
  switch(el.dataset.sfCall){
    case 'bMode':bMode(el);break;
    case 'cvFilter':cvFilter(v,el);break;
    case 'cvFit':cvFit();break;
    case 'cvZoomOut':cvZoom(design('canvas-zoom-out'));break;
    case 'cvZoomIn':cvZoom(design('canvas-zoom-in'));break;
    case 'setTrack':setTrack(v,el);break;
    case 'setLayer':setLayer(v,el);break;
    case 'setZoom':setZoom(v,el);break;
    case 'pickClip':if(e.detail===0)pickClip(el,+v);break;
    case 'pickShot':if(e.detail===0){setTime(unitStart(+v));pickShot(+v);}break;
    case 'pickTl':pickTl(+v);break;
    case 'selShot':selShot(+v,el);break;
    case 'selScript':selScript(el.dataset.type,v,el);break;
    case 'selUnit':selUnit(el);break;
    case 'mediaPreview':mediaPreview(el.dataset.bg,el.dataset.caption,el.dataset.kind);break;
    case 'clipPreviewClick':clipPreviewClick();break;
    case 'toggleTlMenu':toggleTlMenu(e);break;
    case 'transport':transport();break;
    case 'toggleHistory':toggleHistory();break;
    case 'chooseTake':chooseTake(v);break;
    case 'send':send();break;
    case 'cpClose':cpClose();break;
    case 'cvUnfocus':cvUnfocus();break;
  }
});
const timeline=sf.querySelector('.timeline'),copilot=sf.querySelector('.copilot');
// Attention uses stable visible bounds, never the bounds of tools that are appearing.
UX.hitRegion(timeline,{enter:()=>[timeline],exit:()=>[timeline,sf.querySelector('.tlmenu.show')],enabled:()=>!cvFocusId&&sf.classList.contains('mode-create')&&historyState!=='pinned'});
UX.hitRegion(copilot,{enter:()=>[sf.querySelector('.cbar'),sf.querySelector('#sf-historyToggle'),sf.querySelector('.ctrace')],exit:()=>[sf.querySelector('.cbar'),sf.querySelector('#sf-historyToggle'),sf.querySelector('.ctrace')]});
// Hover only shows the tools; a press on the strip or keyboard entry to the timeline holds focus, and that focus is what enlarges the monitor (0014).
timeline.addEventListener('ux:focus',updateWatching);
timeline.addEventListener('ux:blur',updateWatching);
// Esc leaves one layer: ending the timeline's focus restores the panel rather than closing it.
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&timeline.classList.contains('ux-focus')&&!cvFocusId&&!sf.querySelector('.tlmenu.show')){e.stopPropagation();UX.blur(sf);}},true);
strip.addEventListener('pointerdown',e=>{if(!e.button&&!chatFocused()&&!cvFocusId)UX.focus(timeline);});
timeline.addEventListener('focusin',()=>{if(timeline.matches(':focus-visible')&&!chatFocused())UX.focus(timeline);});
timeline.addEventListener('focusout',e=>{const to=e.relatedTarget;if(to&&!timeline.contains(to)&&!to.closest('[data-keep]')&&timeline.classList.contains('ux-focus'))UX.blur(sf);});
timeline.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.target.matches('button,[contenteditable]')){e.preventDefault();e.stopPropagation();transport();}});
cinputEl.addEventListener('focus',()=>UX.focus(copilot));
copilot.addEventListener('ux:focus',()=>{cinputEl.querySelectorAll('.selpill[data-tentative]').forEach(p=>delete p.dataset.tentative);});
copilot.addEventListener('ux:blur',()=>{if(copilot.contains(document.activeElement))document.activeElement.blur();closeMention();if(historyState==='peek')setHistory('closed');});
copilot.addEventListener('keydown',e=>{if(e.key==='Escape'){UX.blur(sf);if(cvFocusId)cvUnfocus();}});
timeline.setAttribute('data-keep','');sf.querySelector('.monitor').setAttribute('data-keep','');sf.querySelector('.cv-focus').setAttribute('data-keep','');sf.querySelector('.cpanel').setAttribute('data-keep','');sf.querySelector('.cv-focus-stage').setAttribute('data-keep','');
sf.querySelector('#sf-monitorPicture').addEventListener('pointerdown',e=>{if(chatFocused())e.preventDefault();});
const overflowObserver=new ResizeObserver(()=>{measureOverflow();measureMonitor();});[cinputEl,sf.querySelector('#sf-bview'),sf.querySelector('#sf-cpBody'),sf.querySelector('#sf-browser')].forEach(el=>overflowObserver.observe(el));
// Keyboard can reach every material without requiring a pointer or a hover.
const keyboardItems=new MutationObserver(()=>{
  sf.querySelectorAll('.ci,.frame,.clip,.selel,.shot-frame,.unit-tile,.unit-head,.cp-sec,.ref-thumb,.tlname,.mi').forEach(el=>{
    if(!el.hasAttribute('tabindex')){el.tabIndex=0;el.setAttribute('role','button');}
    if(el.closest('.bview'))el.setAttribute('data-keep','');
  });
});
keyboardItems.observe(sf,{childList:true,subtree:true});
sf.addEventListener('keydown',e=>{
  if(e.target.isContentEditable||e.target.matches('button'))return;
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button]')){
    e.preventDefault();const card=e.target.closest('.ci');
    if(card){if(cvSelId===card.dataset.id)cvFocus(card.dataset.id);else cvSelect(card.dataset.id,true);}
    else e.target.click();
  }
});


Object.defineProperty(window,'SF_DATA',{enumerable:true,configurable:false,get:()=>model.snapshot({cut:ver,layer,zoom:zoomLevel,track,sel,time:playback.time,running:playback.running,activeSel,history:historyState},selectedTakes,CV_ITEMS,padX)});

// Initial setup and event listeners execution
setCutLabel();buildStrip();renderView();renderChat(false);
cvInit();cvDeselect();   // default Explore → no @target until a block is clicked
requestAnimationFrame(()=>{layoutStrip();scrollToShot(sel,true);updateHero();});
window.addEventListener('resize',()=>{layoutStrip();keepPlayhead();updateHero();measureMonitor();const width=sf.clientWidth;if(width!==cvLastWidth){cvLastWidth=width;if(!cvUserMoved&&sf.matches('.mode-explore'))cvFit();}});
})();
