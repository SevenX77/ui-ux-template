/* Full Story Forge v5 script. Source: prototype/sfm_ui_draft_v5.html, decisions 0006. */
(()=>{
'use strict';
const sf=window.document.getElementById('sf');
if(!sf)return;

// Decision 7: deterministic, local theme art; no network or fragment dependency.
const bg=name=>{
  let h=2166136261;for(const c of name)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
  const x=18+h%65,y=16+(h>>>8)%62,a=95+h%170;
  // Picture tokens are complete background stacks, not gradient-stop colours.
  const picture=['a','b','c'][h%3];
  return `radial-gradient(ellipse at ${x}% ${y}%,color-mix(in srgb,var(--ink) 12%,transparent),transparent 56%),linear-gradient(${a}deg,transparent 32%,color-mix(in srgb,var(--app) 28%,transparent) 33% 36%,transparent 37%),var(--pic-${picture},linear-gradient(${a}deg,var(--ink3),var(--sunk) 60%,var(--ink2)))`;
};

const _A=[
  {n:'Shot 1',f:'Bedroom · Wake',d:'4s',line:'JOE WAKES TO CRT STATIC',g:bg('shot-joe-crt-closeup.jpg')},
  {n:'Shot 2',f:'Living room · Parents',d:'5s',line:'PETE AND DONNA STARE INTO THE TV',g:bg('shot-parents-living-room.jpg')},
  {n:'Shot 3',f:'Insert · CRT signal',d:'3s',line:'THE BROADCAST SHOWS A WHITE STREET',g:bg('shot-crt-static.jpg')},
  {n:'Shot 4',f:'Close-up · Recognition',d:'4s',line:'JOE REALIZES THE WORLD IS TOO QUIET',g:bg('shot-joe-crt-closeup.jpg')},
  {n:'Shot 5',f:'Makeup · First morph',d:'4s',line:'PETE’S FACE BEGINS TO PULL INTO WOOL',g:bg('shot-sheep-morph.jpg')},
  {n:'Shot 6',f:'Prop · Hammer',d:'3s',line:'JOE GRIPS THE HAMMER BUT CANNOT SWING',g:bg('shot-hammer-prop.jpg')},
  {n:'Shot 7',f:'Impact · Television',d:'3s',line:'THE SCREEN BREAKS; THE ROOM DOES NOT WAKE',g:bg('shot-broken-tv.jpg')},
  {n:'Shot 8',f:'False relief · Sofa',d:'4s',line:'FOR ONE SECOND HIS PARENTS LOOK HUMAN AGAIN',g:bg('shot-parents-living-room.jpg')},
  {n:'Shot 9',f:'Balcony · Street',d:'5s',line:'THE STREET BELOW FILLS WITH SHEEP',g:bg('shot-sheep-street.jpg')},
  {n:'Shot 10',f:'Storyboard · Locked pass',d:'3s',line:'THE PAPER PASS MATCHES THE GENERATED CUT',g:bg('storyboard-wall.jpg')},
  {n:'Shot 11',f:'VFX · Crowd plate',d:'4s',line:'THE FLOCK COMPOSITE FLOODS THE FRAME',g:bg('vfx-breakdown-board.jpg')},
  {n:'Shot 12',f:'Final · Master QC',d:'5s',line:'STATIC HOLDS ON WHITE NOISE AND BREATH',g:bg('final-master-qc-board.jpg')}
];
const _pick=ids=>ids.map(i=>_A[i]);
const SHOTS={
  A:_A,
  B:_pick([0,2,3,5,4,6,7,8,10,11]),
  C:_pick([0,4,9,10,11]),
  D:_pick([0,3,11]),
  E:_pick([0,1,2,3,4,5,6,7,8,9,10,11])
};
const VKEYS=['A','B','C','D','E'], VNAME={A:'Master Cut A',B:"Director's Cut B",C:'Trailer C',D:'Teaser D',E:'Festival Cut E'};
const VGRAD={A:'var(--c1)',B:'var(--c2)',C:'var(--c3)',D:'var(--c4)',E:'var(--c5)'};
function sbArt(){return `<div class="g" style="background:${bg('storyboard-source-sheet.jpg')}"></div>`;}
function sbBig(){return `<div class="hg" style="background:${bg('storyboard-source-sheet.jpg')}"></div>`;}

let ver='A', sel=3, vi=0, layer='script';
let track='video';   // timeline track: 'video' | 'audio' | 'graphics'
let selClip=null;    // the picked clip on a non-video track {kind:'aud'|'sub'|'gfx', tx}
function setTrack(t,el){track=t;selClip=null;sf.querySelectorAll('#sf-tltrack .tt').forEach(b=>b.classList.toggle('on',b===el));buildStrip();renderView();}
/* small deterministic waveform for audio clips */
function miniWave(seed,n){let b='';n=n||10;for(let k=0;k<n;k++){const v=Math.abs(Math.sin(seed*5.3+k*1.27)+Math.sin(seed*2.1+k*0.7)*0.5);b+=`<i style="height:${(22+v/1.5*58).toFixed(0)}%"></i>`;}return b;}
function isDial(s){return /Dialogue|Confession|Reverse/.test(s.f||'')||/[“”"]/.test(s.line||'');}
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}
/* one positioned clip inside a lane (spans `span` shot-columns from `startIdx`); kind/lab drive the popped hero */
function laneClip(startIdx,span,cls,inner,kind,lab){
  const left=padX+startIdx*FW+3, w=span*FW-6;
  return `<div class="clip ${cls}" data-kind="${kind}" data-cls="${cls}" data-tx="${esc(lab)}" style="left:${left}px;width:${Math.max(14,w)}px" data-sf-call="pickClip" data-value="${startIdx}">${inner||''}</div>`;
}
/* faint footage blocks behind the lanes — widths follow shot duration, so they do NOT line up with the lane grid */
function laneBg(arr){
  const totalW=arr.length*FW, durs=arr.map(s=>parseFloat(s.d)||1), sum=durs.reduce((a,b)=>a+b,0)||1;
  let x=padX,blks='';
  arr.forEach((s,i)=>{const w=durs[i]/sum*totalW;blks+=`<div class="lblk" style="left:${x.toFixed(1)}px;width:${(w-2).toFixed(1)}px;background:${s.g}"></div>`;x+=w;});
  return `<div class="lbg">${blks}</div>`;
}
/* build the stacked lanes for the audio / graphics tracks */
function buildLanes(arr){
  const L=arr.length; selClip=null;
  let dial=arr.map((s,i)=>isDial(s)?i:-1).filter(i=>i>=0);
  if(!dial.length)dial=arr.map((s,i)=>i).filter(i=>i%2===1);
  const sfx=[...new Set([0,Math.floor(L/2),Math.max(0,L-2)])].filter(i=>i>=0&&i<L);
  const musStart=Math.floor(L*0.18), musSpan=Math.max(1,Math.ceil(L*0.84)-musStart);
  const lanes = track==='audio' ? [
    {label:'对白',cls:'dial', clips:dial.map(i=>laneClip(i,1,'dial',`<div class="cw">${miniWave(i+1,9)}</div>`,'aud','Dialogue'))},
    {label:'音乐',cls:'mus',     clips:[laneClip(musStart,musSpan,'mus',`<div class="cw flat">${miniWave(7,Math.max(12,musSpan*7))}</div>`,'aud','Music')]},
    {label:'音效',cls:'sfx',       clips:sfx.map(i=>laneClip(i,1,'sfx',`<div class="cw">${miniWave(i+9,7)}</div>`,'aud','SFX'))},
  ] : [
    {label:'字幕',cls:'sub', clips:dial.map(i=>laneClip(i,1,'sub',`<span class="ctx">${arr[i].line||''}</span>`,'sub',arr[i].line||''))},
    {label:'图形',cls:'ovl', clips:[
      laneClip(0,Math.min(2,L),'ovl',`<span class="ctx">◆ Main Title</span>`,'gfx','STATIC'),
      laneClip(Math.min(L-1,Math.max(1,Math.floor(L*0.35))),1,'ovl',`<span class="ctx">▭ Lower Third</span>`,'gfx','Joe'),
      laneClip(Math.max(0,L-1),1,'ovl',`<span class="ctx">✦ End Card</span>`,'gfx','The End')]},
  ];
  const heads=sf.querySelector('#sf-laneHeads');
  if(heads)heads.innerHTML=lanes.map(ln=>`<div class="lh ${ln.cls}"><span class="dot"></span>${ln.label}</div>`).join('');
  return laneBg(arr)+lanes.map(ln=>`<div class="lane">${ln.clips.join('')}</div>`).join('');
}
/* resize a lane / its label to `to` px */
function growLane(el,to){el.style.height=to+'px';}
/* click a track clip → tag it AND show the material in the BROWSER above: video playback frame + this material */
function pickClip(el,startIdx){
  selClip={kind:el.dataset.kind,tx:el.dataset.tx,cls:el.dataset.cls};
  sf.querySelectorAll('#sf-frames .clip.sel').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  // grow the picked lane (and its label), squeeze the others — animated via WAAPI (reliable across browsers)
  const laneEl=el.closest('.lane');
  if(laneEl){const lanes=[...laneEl.parentNode.querySelectorAll('.lane')];const idx=lanes.indexOf(laneEl);
    lanes.forEach(l=>growLane(l, l===laneEl?46:26));
    sf.querySelectorAll('#sf-laneHeads .lh').forEach((h,i)=>growLane(h, i===idx?46:26));}
  sel=Math.max(0,Math.min(curArr().length-1,startIdx));
  activeSel={type:'shot',shotIdx:sel};
  scrollToShot(sel);updateHero();openPanel();renderView();updateCtx();updatePill();cvCopilot(true);
}
/* clicking the material shown in the browser behaves like the video shot-frame: open the linked video shot's
   context panel (or, if already open, the full preview). Audio/graphics clips have no settings of their own —
   they borrow the underlying video shot's, so always (re)link activeSel to that shot before showing it. */
function clipPreviewClick(){
  const s=curArr()[sel];
  if(sf.querySelector('.browser.panel-open')){if(s)mediaPreview(s.g,s.n+' · '+s.f,'shot');return;}
  activeSel={type:'shot',shotIdx:Math.max(0,Math.min(SHOTS[ver].length-1,sel))};
  openPanel();updateCtx();
}

/* timeline scope (drives both the filmstrip AND the browser view).
   each non-Shot unit lists the member shot indices it groups + the characters present. */
let zoomLevel='Shot';
const ZOOM_FRAMES={
  'Film':[{n:'STATIC',f:'Full Film · 45s',d:'45s',line:'A teenager tries to stop his parents changing while a television insists the world is still normal.',g:bg('pitch-deck-cover.jpg'),shots:[0,1,2,3,4,5,6,7,8,9,10,11],chars:['joe','pete','donna']}],
  'Act':[
    {n:'Act I',f:'Signal & Family · 22s',d:'22s',line:'Joe wakes, finds Pete and Donna entranced by the CRT, and sees the first signs of the flock.',g:bg('script-breakdown-board.jpg'),shots:[0,1,2,3,4,5],chars:['joe','pete','donna']},
    {n:'Act II',f:'Rupture & Street · 23s',d:'23s',line:'Joe breaks the screen, loses the last human moment, and discovers the street has already changed.',g:bg('final-master-qc-board.jpg'),shots:[6,7,8,9,10,11],chars:['joe','pete','donna']}],
  /* Beat = the coarser story-rhythm skeleton (节拍骨架) → fewer, larger units */
  'Beat':[
    {n:'Beat 1',f:'Wake / Signal · 12s',d:'12s',line:'The apartment is lit by a broadcast that keeps repeating impossible normality.',g:bg('story-seed-board.jpg'),shots:[0,1,2],chars:['joe','pete','donna']},
    {n:'Beat 2',f:'Morph / Refusal · 16s',d:'16s',line:'Joe realizes Pete and Donna are changing, but the family ritual keeps them seated and obedient.',g:bg('character-consistency-board.jpg'),shots:[3,4,5,6,7],chars:['joe','pete','donna']},
    {n:'Beat 3',f:'Street / Delivery · 17s',d:'17s',line:'The personal horror widens into an entire city-scale flock and becomes the final master.',g:bg('workflow-overview-board.jpg'),shots:[8,9,10,11],chars:['joe']}],
  /* Scene = the finer breakdown (分场) → each beat splits into scenes */
  'Scene':[
    {n:'Scene 1',f:'Bedroom Signal · 8s',d:'8s',line:'Joe wakes to blue television light crawling under the bedroom door.',g:bg('shot-joe-crt-closeup.jpg'),shots:[0,1],chars:['joe']},
    {n:'Scene 2',f:'Living Room Broadcast · 13s',d:'13s',line:'Pete and Donna stare at the TV while the screen describes a normal world that is no longer there.',g:bg('shot-parents-living-room.jpg'),shots:[2,3,4],chars:['joe','pete','donna']},
    {n:'Scene 3',f:'The Hammer · 10s',d:'10s',line:'Joe chooses violence against the signal, but breaking the object cannot undo the transformation.',g:bg('props-continuity-board.jpg'),shots:[5,6,7],chars:['joe','pete','donna']},
    {n:'Scene 4',f:'White Street · 14s',d:'14s',line:'The balcony opens onto a street already packed with sheep; the film leaves family scale behind.',g:bg('shot-sheep-street.jpg'),shots:[8,9,10,11],chars:['joe']}]
};
function curArr(){return zoomLevel==='Shot'?SHOTS[ver]:(ZOOM_FRAMES[zoomLevel]||SHOTS[ver]);}

/* characters per master shot + character DB + scene/style data (drive the context panel) */
const SHOT_CHARS=[['joe'],['joe','pete','donna'],['joe'],['joe'],['pete','donna'],['joe'],['joe','pete','donna'],['joe','pete','donna'],['joe'],['joe'],['joe'],['joe']];
const CHAR_DB={
  joe:{name:'Joe',sheet:bg('shot-joe-crt-closeup.jpg'),voice:'Low · 170Hz · sleep-deprived'},
  pete:{name:'Pete',sheet:bg('casting-contact-sheet.jpg'),voice:'Flat · 105Hz · hollow paternal'},
  donna:{name:'Donna',sheet:bg('character-consistency-board.jpg'),voice:'Soft · 215Hz · almost human'}
};
const SCENE_DESIGN={grad:bg('location-scout-board.jpg'),set:'INT. Suburban Apartment — Night',
  textures:'Worn couch · CRT scanlines · nicotine amber lamps · balcony glass · white street glare',
  props:'CRT television · hammer · cigarette · family sofa · production bible boards'};
const STYLE_REF={grad:bg('lookbook-camera-board.jpg'),
  rig:'ARRI Alexa LF · vintage anamorphic, 2:1 frame package',
  light:'CRT face key · dirty tungsten practicals · overexposed white exterior',
  grade:'Cold cyan signal vs stale amber interiors, crushed blacks, heavy grain'};

const FW=110, EDGE=72; let padX=180;  // EDGE = overscroll margin at BOTH ends → symmetric spring-back
const strip=sf.querySelector('#sf-strip');
function picHTML(s){
  if(layer==='storyboard')return `<div class="pic sb">${sbArt()}</div>`;
  if(layer==='script')return `<div class="pic itl">${s.line}</div>`;
  return `<div class="pic"><div class="g" style="background:${s.g}"></div></div>`;
}
function buildStrip(){
  const arr=curArr(); sel=Math.max(0,Math.min(arr.length-1,sel));
  padX=Math.max(8,(strip.clientWidth-FW)/2)+EDGE;            // need padX before positioning lane clips
  const frames=sf.querySelector('#sf-frames'), heads=sf.querySelector('#sf-laneHeads');
  strip.classList.toggle('lanes', track!=='video');
  if(track==='video'){
    frames.style.width='';
    frames.innerHTML=arr.map((s,i)=>
      `<div class="frame" title="${s.n} · ${s.f}" data-sf-call="pickShot" data-value="${i}">${picHTML(s)}<span class="num">${zoomLevel==='Shot'?((i+1)*8+'A'):s.d}</span></div>`).join('');
    if(heads)heads.classList.remove('show');
  }else{
    frames.style.width=(padX*2+arr.length*FW)+'px';
    frames.innerHTML=buildLanes(arr);
    if(heads)heads.classList.add('show');
  }
  layoutStrip();scrollToShot(sel,true);updateHero();updatePill();
}
function layoutStrip(){
  padX=Math.max(8,(strip.clientWidth-FW)/2)+EDGE;
  sf.querySelector('#sf-frames').style.setProperty('--pad',padX+'px');
  fillPerfs();
}
function fillPerfs(){
  const trackW=padX*2+curArr().length*FW;const n=Math.ceil(trackW/26)+2;
  let h='';for(let i=0;i<n;i++)h+='<div class="hole"></div>';
  sf.querySelector('#sf-perfTop').innerHTML=h;sf.querySelector('#sf-perfBot').innerHTML=h;
}
function scrollToShot(i,instant){
  const arr=curArr();i=Math.max(0,Math.min(arr.length-1,i));
  const target=padX+i*FW+FW/2-strip.clientWidth/2;
  strip.scrollTo({left:Math.max(0,target),behavior:instant?'auto':'smooth'});
}
function pick(i){scrollToShot(i);}
/* click a timeline frame → navigate to it AND tag it on the copilot (@tag + shadow), like picking any material */
function pickShot(i){
  const arr=curArr(); i=Math.max(0,Math.min(arr.length-1,i)); sel=i;
  activeSel={type:'shot',shotIdx:i};   // a real selection → the @tag sticks and follows further scrubbing
  scrollToShot(i); updateHero(); updatePill(); cvCopilot(true);
}
/* clicking a frame must not steal focus from the copilot input (keeps the chat history open) */
strip.addEventListener('pointerdown',e=>{if(document.activeElement===sf.querySelector('#sf-cinput')&&e.target.closest('.frame,.clip'))e.preventDefault();});
function updateHero(){
  const hero=sf.querySelector('#sf-hero');const s=curArr()[sel];
  if(!s||track!=='video'){hero.style.display='none';return;}    // lane tracks: material shows in the browser, not the timeline
  hero.style.display='block';
  hero.className='hero'+(layer==='storyboard'?' sb':layer==='script'?' itl':'');
  if(layer==='storyboard')hero.innerHTML=sbBig()+`<div class="cap">${s.n} · ${s.f}</div>`;
  else if(layer==='script')hero.innerHTML=`<div>${s.line}</div><div class="cap">${s.n} · ${s.f}</div>`;
  else hero.innerHTML=`<div class="hg" style="background:${s.g}"></div><div class="cap">${s.n} · ${s.f} · ${s.d}</div>`;
  const wrap=sf.querySelector('.stripwrap');
  hero.style.left=(wrap.offsetLeft+wrap.clientWidth/2-hero.offsetWidth/2)+'px';
}
function updatePill(){
  if(!activeSel||activeSel.type!=='shot')return;   // only follow an explicitly-picked shot; no auto-tag from mere scrubbing
  const s=curArr()[sel];
  if(!s)return;
  let p=sf.querySelector('#sf-selpill');
  if (!p) {
    const cinput = sf.querySelector('#sf-cinput');
    if (cinput) {
      p = document.createElement('span');
      p.id = 'sf-selpill';
      p.contentEditable = 'false';
      p.className = 'selpill';
      cinput.insertBefore(p, cinput.firstChild);
    }
  }
  if (p) {
    p.classList.add('show');
    p.textContent=`@${s.n} · ${s.f}`;
    if(typeof checkInputText === 'function') checkInputText();
  }
}
/* native scroll → sync centered frame into the focus (hero) overlay */
let rafid, bindT;
/* the elements bound to the picked material — copilot @tag + the browser material/cpanel —
   are debounced so they only commit once the scrub settles, not on every scroll frame */
function commitSel(){updatePill();if(layer!=='script')renderView();}
strip.addEventListener('scroll',()=>{if(rafid)return;rafid=requestAnimationFrame(()=>{rafid=null;
  const center=strip.scrollLeft+strip.clientWidth/2;const arr=curArr();let best=0,bd=1e9;
  for(let i=0;i<arr.length;i++){const c=padX+i*FW+FW/2,d=Math.abs(c-center);if(d<bd){bd=d;best=i;}}
  if(best!==sel){sel=best;updateHero();                 // live: the timeline's own focus tracks immediately
    clearTimeout(bindT);bindT=setTimeout(commitSel,160);// debounced: @tag + browser settle after the scroll stops
  }
});},{passive:true});
/* vertical wheel → horizontal film scroll (native, reliable). hero is pointer-events:none so wheel lands on the film. */
strip.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){strip.scrollLeft+=e.deltaY;e.preventDefault();}},{passive:false});

function setLayer(l,el){layer=l;sf.querySelectorAll('#sf-layerSeg button').forEach(d=>d.classList.remove('on'));el.classList.add('on');buildStrip();renderView();}
function setZoom(z,el){zoomLevel=z;sel=0;sf.querySelectorAll('#sf-zoomSeg button').forEach(d=>d.classList.remove('on'));el.classList.add('on');cpClose();buildStrip();renderView();flash(`Scope → <b>${z}</b> — browser & timeline reframed together.`);}

/* timeline name (top-center) + dropdown to switch / add timeline */
const tlname=sf.querySelector('#sf-tlname'), tlmenu=sf.querySelector('#sf-tlmenu');
function setReelLabel(){sf.querySelector('#sf-tlnameLabel').textContent=VNAME[ver];}
function buildTlMenu(){
  tlmenu.innerHTML=VKEYS.map((k,i)=>`<div class="mi ${k===ver?'on':''}" data-sf-call="pickTl" data-value="${i}">${VNAME[k]}<span class="dot"></span></div>`).join('')
    +`<div class="mi add" data-sf-call="addTimeline"><b>+</b> 新增时间线</div>`;
}
function toggleTlMenu(e){e.stopPropagation();const open=tlmenu.classList.toggle('show');tlname.classList.toggle('open',open);if(open)buildTlMenu();}
function closeTlMenu(){tlmenu.classList.remove('show');tlname.classList.remove('open');}
document.addEventListener('click',e=>{if(!tlmenu.contains(e.target)&&!tlname.contains(e.target))closeTlMenu();});
function pickTl(i){closeTlMenu();reelTo(i);}
function reelTo(i){i=Math.max(0,Math.min(VKEYS.length-1,i)); if(VKEYS[i]===ver){return;}
  vi=i; ver=VKEYS[vi]; sel=0; setReelLabel(); buildStrip(); renderView();
  flash(`Loaded <b>${VNAME[ver]}</b> — another cut from the same asset pool.`);}
function addTimeline(){
  const key='T'+VKEYS.length; VKEYS.push(key); VNAME[key]='New Timeline '+VKEYS.length; VGRAD[key]='var(--ink2)';
  SHOTS[key]=_A.slice();              // start from the full master shot list
  closeTlMenu(); reelTo(VKEYS.indexOf(key));
  flash(`Created <b>${VNAME[key]}</b> — edit it freely; it shares the same asset pool.`);
}

/* ---- Create: scope-aware browser with selectable elements ---- */
/* the context panel is always bound to whatever the browser is showing: when the timeline
   scrubs the browser to another shot / group, rebind activeSel to it before (re)rendering.
   (script layer keeps its own selScript binding; a closed panel has nothing to bind) */
function syncActiveSel(){
  if(!sf.querySelector('.browser.panel-open'))return;
  if(layer==='script')return;
  if(zoomLevel==='Shot'){
    activeSel={type:'shot',shotIdx:Math.max(0,Math.min(SHOTS[ver].length-1,sel))};
  }else{
    const units=ZOOM_FRAMES[zoomLevel];
    activeSel={type:'unit',unit:units[Math.max(0,Math.min(units.length-1,sel))]};
  }
}
function renderView(){
  const b=sf.querySelector('#sf-bview'); if(!b)return;
  syncActiveSel();
  if(track!=='video'&&selClip){                                  // a track clip is picked → player shows the video frame + this material
    const arr=curArr(); const s=arr[Math.max(0,Math.min(arr.length-1,sel))];
    if(s){
      let ov;
      if(selClip.kind==='sub')ov=`<div class="ov-sub">${esc(selClip.tx)}</div>`;
      else if(selClip.kind==='gfx')ov=`<div class="ov-gfx">${esc(selClip.tx)}</div>`;
      else ov=`<div class="ov-tag">${esc(selClip.tx)}</div><div class="ov-aud ${selClip.cls||''}">${miniWave(sel+1,52)}</div>`;
      const on=sf.querySelector('.browser.panel-open')?'on':'';
      b.innerHTML=`<div class="shot-stage"><div class="screen shot-frame ${on}" data-sf-call="clipPreviewClick" style="background:var(--sunk)"><div class="g" style="background:${s.g}"></div>${ov}<div class="cap">${s.n} · ${s.f}</div></div>`+
        `<div class="shot-meta"><div class="t">${esc(selClip.tx)||s.n}</div><div class="s">${s.n} · ${s.f} · ${s.d}</div></div>`+
        `<div class="shot-hint">点击画面查看上下文 · 当前轨道的素材显示在播放画面中</div></div>`;
      b.scrollTop=0;return;
    }
  }
  if(layer==='script'){
    b.innerHTML=scriptHTML();
    if(activeSel?.scriptId)b.querySelectorAll('[data-sf-call=selScript]').forEach(e=>e.classList.toggle('on',e.dataset.type===activeSel.scriptType&&e.dataset.value===activeSel.scriptId));
  }else if(zoomLevel==='Shot'){
    // one focused shot
    const idx=Math.max(0,Math.min(SHOTS[ver].length-1,sel)); const sh=SHOTS[ver][idx];
    const on=(activeSel&&activeSel.type==='shot')?'on':'';
    const media=layer==='storyboard'?sbBig()
      :`<div class="g" style="background:${sh.g}"></div><div class="pl"><div data-sf-call="mediaPreview" data-bg="${sh.g}" data-caption="${sh.n} · ${sh.f}" data-kind="shot"><svg width="18" height="18" viewBox="0 0 24 24" fill="var(--ink)"><path d="M8 5v14l11-7z"/></svg></div></div>`;
    b.innerHTML=`<div class="shot-stage">
      <div class="shot-frame ${on}" data-sf-call="selShot" data-value="${idx}">${media}</div>
      <div class="shot-meta"><div class="t">${sh.n}</div><div class="s">${sh.f} · ${sh.d}</div></div>
      <div class="shot-hint">${layer==='storyboard'?'点击画面查看提示词和参数':'播放预览 · 点击画面查看参数'}</div></div>`;
  }else{
    // a group's member shots
    const units=ZOOM_FRAMES[zoomLevel]; const u=units[Math.max(0,Math.min(units.length-1,sel))];
    const headOn=(activeSel&&activeSel.type==='unit'&&activeSel.unit===u)?'on':'';
    const tiles=(u.shots||[]).map(si=>{
      const sh=SHOTS[ver][si]; if(!sh)return '';
      const tOn=(activeSel&&activeSel.type==='shot'&&activeSel.shotIdx===si)?'on':'';
      const media=layer==='storyboard'?sbArt():`<div class="g" style="background:${sh.g}"></div>`;
      return `<div class="unit-tile ${tOn}" data-sf-call="selShot" data-value="${si}"><div class="unit-thumb">${media}<span class="n">${sh.n}</span></div>`+
        `<div class="unit-cap"><div class="t">${sh.n}</div><div class="s">${sh.f}</div></div></div>`;
    }).join('');
    b.innerHTML=`<div class="unit-view"><div class="unit-head ${headOn}" data-sf-call="selUnit">`+
      `<span class="scope-tag">${zoomLevel}</span><span class="name">${u.n}</span><span class="sub">${u.f}</span></div>`+
      `<div class="unit-grid">${tiles}</div></div>`;
  }
  b.scrollTop=0;
  if(sf.querySelector('.browser.panel-open'))updateCtx();   // keep the bound context panel in sync
}
function S(type,id,txt,cls){return `<span class="selel ${cls||''}" data-sf-call="selScript" data-type="${type}" data-value="${id}">${txt}</span>`;}
function scriptHTML(){
  return `<div class="script"><div class="sl">STATIC · SEQUENCE 03</div>
    <div class="selel head" data-sf-call="selScript" data-type="scene" data-value="scene_apartment">INT. SUBURBAN APARTMENT — NIGHT</div>
    <p class="selel" data-sf-call="selScript" data-type="action" data-value="joe_wakes">A television speaks from another room, low and patient. ${S('character','joe','JOE')}, sixteen, wakes with blue light moving across his face like water.</p>
    <p class="selel" data-sf-call="selScript" data-type="action" data-value="crt_signal">The screen shows a perfect white street full of sheep. A calm announcer insists everything is normal. The apartment is too still to believe her.</p>
    <p class="selel" data-sf-call="selScript" data-type="action" data-value="parents_sofa">In the living room, ${S('character','pete','PETE')} and ${S('character','donna','DONNA')} sit side by side on the sofa. Their hands rest on their knees. Their eyes do not blink.</p>
    <div class="selel cue" data-sf-call="selScript" data-type="character" data-value="joe">JOE</div><div class="paren">(whispering)</div>
    <p class="selel dlg" data-sf-call="selScript" data-type="dialogue" data-value="joe_question"><span class="hl">Dad. Mom. Can you hear me?</span></p>
    <p class="selel" data-sf-call="selScript" data-type="action" data-value="first_morph">Pete smiles without opening his mouth. The skin along his cheek tightens, then dimples into a pale wool texture. Donna keeps watching the broadcast.</p>
    <div class="selel cue" data-sf-call="selScript" data-type="character" data-value="pete">PETE</div>
    <p class="selel dlg" data-sf-call="selScript" data-type="dialogue" data-value="pete_static">We are fine. The world is fine.</p>
    <p class="selel" data-sf-call="selScript" data-type="action" data-value="hammer_choice">Joe finds the hammer beside the radiator. He lifts it, but the broadcast seems to lower the room's air pressure. The tool becomes impossibly heavy.</p>
    <p class="selel" data-sf-call="selScript" data-type="action" data-value="screen_break">He swings anyway. Glass flowers outward. Static fills the room like weather. For one second Pete and Donna look almost human.</p>
    <div class="selel cue" data-sf-call="selScript" data-type="character" data-value="donna">DONNA</div><div class="paren">(softly)</div>
    <p class="selel dlg" data-sf-call="selScript" data-type="dialogue" data-value="donna_warning">Do not go outside, sweetheart.</p>
    <p class="selel" data-sf-call="selScript" data-type="action" data-value="balcony_reveal">Joe backs through the balcony door. The city below is silent and overexposed. Thousands of sheep stand in the street, all facing his building.</p>
    <p class="selel" data-sf-call="selScript" data-type="action" data-value="final_hold">Behind him, the broken television keeps glowing. Ahead of him, the flock waits without moving. Joe understands that rescue was never on the broadcast.</p>
    <div class="head" style="text-align:center;margin-top:24px">CUT TO BLACK.</div></div>`;
}

/* ---- selection → context panel ---- */
let currentBook='bible', cpMode='related', activeSel=null;
const BOOK_TITLE={bible:'Production Bible',casting:'Casting Book',design:'Production Design',camera:'Cinematography'};
function openPanel(){const br=sf.querySelector('#sf-browser');if(br)br.classList.add('panel-open');}
function cpClose(){selClip=null;sf.querySelectorAll('.clip.sel,.cp-sec.sel').forEach(c=>c.classList.remove('sel'));sf.querySelectorAll('.lane,.lh').forEach(c=>c.style.height='');const br=sf.querySelector('#sf-browser');if(br)br.classList.remove('panel-open');activeSel=null;
  sf.querySelectorAll('#sf-bview .on').forEach(x=>x.classList.remove('on'));
  cvClearPill();cvCopilot(false);}   // deselect → drop the @tag and the bar's shadow (same as Explore)
/* clicking empty space ANYWHERE in the browser region (incl. the wide blank gutters either side of the
   centred reading column, which live in .browser but outside #sf-bview) closes the panel — but not when the
   click lands on a selectable element or inside the context panel itself */
(function(){const br=sf.querySelector('#sf-browser');const bv=sf.querySelector('#sf-bview');if(!br)return;
  br.addEventListener('click',e=>{
    if(e.target.closest('.selel,.shot-frame,.unit-tile,.unit-head,.cpanel'))return;
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
      cvSetPill(block.dataset.tag||'Block'); cvCopilot(true);
    }
  });
})();
function clearSel(){sf.querySelectorAll('#sf-bview .on').forEach(x=>x.classList.remove('on'));
  sf.querySelectorAll('#sf-cpBody .cp-sec.sel').forEach(s=>s.classList.remove('sel'));}  // picking another material clears the cpanel block selection
function selScript(type,id,el){clearSel();if(el)el.classList.add('on');
  const chars=id==='joe'?['joe']:id==='pete'?['pete']:id==='donna'?['donna']:['joe','pete','donna'];
  const label=id==='joe'?'Joe':id==='pete'?'Pete':id==='donna'?'Donna':'Sequence 03 · Apartment Signal';
  const unit={n:label,line:'STATIC sequence package: a bedroom wake-up, a living-room broadcast, the hammer rupture, and the white-street reveal.',f:'Apartment Signal · 45s',shots:[0,1,2,3,4,5,6,7,8,9,10,11],chars};
  activeSel={type:'unit',unit,label,scriptType:type,scriptId:id};openPanel();cvSetPill(label);cvCopilot(true);updateCtx();
  if(zoomLevel==='Shot'){
    if(id==='joe_question'||id==='joe_wakes')scrollToShot(0);
    else if(id==='first_morph'||id==='pete_static')scrollToShot(4);
    else if(id==='hammer_choice'||id==='screen_break')scrollToShot(6);
    else if(id==='balcony_reveal'||id==='final_hold')scrollToShot(8);
  }
}
function selShot(i,el){
  // if the cpanel is already open and showing this shot, a click opens the full preview;
  // if the panel is closed, the click first selects the shot & opens the panel (no preview)
  if(sf.querySelector('.browser.panel-open')&&activeSel&&activeSel.type==='shot'&&activeSel.shotIdx===i){const s=SHOTS[ver][i];mediaPreview(s.g,s.n+' · '+s.f,layer==='storyboard'?'board':'shot');return;}
  clearSel();if(el)el.classList.add('on');activeSel={type:'shot',shotIdx:i};openPanel();
  const sh=SHOTS[ver][i]; cvSetPill(sh.n+' · '+sh.f); cvCopilot(true);   // @target follows the picked material
  if(zoomLevel==='Shot'){sel=i;scrollToShot(i);updateHero();}
  updateCtx();}
function selUnit(el){clearSel();if(el)el.classList.add('on');const units=ZOOM_FRAMES[zoomLevel];
  const u=units[Math.max(0,Math.min(units.length-1,sel))];activeSel={type:'unit',unit:u,label:zoomLevel+' · '+u.n};openPanel();
  cvSetPill(u.n+' · '+u.f); cvCopilot(true);
  updateCtx();}
function cpBook(book,el){currentBook=book;sf.querySelectorAll('.cpb').forEach(b=>b.classList.remove('on'));if(el)el.classList.add('on');updateCtx();}
function cpFilter(mode){cpMode=mode;sf.querySelector('#sf-cpRel')?.classList.toggle('on',mode==='related');sf.querySelector('#sf-cpAll')?.classList.toggle('on',mode==='all');updateCtx();}

/* visual helpers — borderless, app-palette */
function refThumb(name,label,inner,pg,pk){return `<div class="ref-tile"><div class="ref-thumb" data-pg="${pg||''}" data-pc="${name} · ${label}" data-pk="${pk||''}">${inner}<div class="ref-name">${name}</div></div></div>`;}
function thGrad(g){return `<div class="g" style="background:${g}"></div>`;}
function figureSVG(){return `<svg viewBox="0 0 60 60" fill="none" stroke="var(--on-signal)" stroke-width="2"><circle cx="30" cy="22" r="9"/><path d="M14 50c0-11 32-11 32 0"/></svg>`;}
function sceneSketch(){return `<svg viewBox="0 0 60 45" fill="none" stroke="var(--on-signal)" stroke-width="1.6" stroke-linejoin="round"><path d="M4 4 24 16 24 30 4 42"/><path d="M56 4 36 16 36 30 56 42"/><path d="M24 16h12M24 30h12"/><circle cx="30" cy="9" r="1.8"/></svg>`;}
function charThumb(c){return refThumb(CHAR_DB[c].name,'Character',thGrad(CHAR_DB[c].sheet)+figureSVG(),CHAR_DB[c].sheet,'char');}
function sceneThumb(){return refThumb('Apartment','Location',thGrad(SCENE_DESIGN.grad)+sceneSketch(),SCENE_DESIGN.grad,'scene');}
function styleThumb(){return refThumb('CRT Lookbook','Style',thGrad(STYLE_REF.grad),STYLE_REF.grad,'style');}
function storyboardThumb(name){return refThumb(name,'Storyboard',sbArt(),bg('storyboard-source-sheet.jpg'),'board');}

/* full-screen media preview — same lightbox as Explore, used for Create's videos & reference images;
   drops the app into dark mode (no separate dark viewer) and restores on close */
function mediaPreview(bg,cap,kind){
  if(typeof cvUnfocus==='function' && cvFocusId){/* already open */}
  cvFocusId='__media';
  const fo=sf.querySelector('#sf-cvFocus'),stage=sf.querySelector('#sf-cvFocusStage');
  let overlay='';
  if(kind==='board')overlay='';
  else if(kind==='char')overlay='<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 120 120" width="40%" fill="none" stroke="var(--on-signal)" stroke-width="3"><circle cx="60" cy="44" r="18"/><path d="M28 100c0-22 64-22 64 0"/></svg></div>';
  else if(kind==='scene')overlay='<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 120 90" width="46%" fill="none" stroke="var(--on-signal)" stroke-width="2.6" stroke-linejoin="round"><path d="M8 8 48 32 48 60 8 84"/><path d="M112 8 72 32 72 60 112 84"/><path d="M48 32h24M48 60h24"/><circle cx="60" cy="18" r="3.4"/></svg></div>';
  stage.innerHTML='<div class="cv-photo"><div class="g" style="background:'+(bg||'var(--sunk)')+'"></div><div class="ci-grain"></div>'+overlay+'</div>'+
    '<div class="cv-photo-cap">'+(cap||'')+'</div>';
  fo.classList.add('media','show');
}
function sec(label,body){return `<div class="cp-sec" data-tag="${label.split(' — ')[0]}"><h5>${label}</h5>${body}</div>`;}
function rows(arr){return `<div class="cp-block">`+arr.map(r=>`<div class="cp-row"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')+`</div>`;}
function promptFor(s,idx){const cs=(SHOT_CHARS[idx]||[]).map(c=>CHAR_DB[c].name.split(' ')[0]).join(' & ')||'empty apartment';
  return `<span class="tok">${s.f}</span> · STATIC short film · <b>${cs}</b><br>CRT blue face light, stale tungsten practicals, suburban analog horror, sheep-body transformation, dense film grain.<br>beat: “${s.line}”`;}

/* no more book filter — everything related to the selection is shown together */
function updateCtx(){
  const body=sf.querySelector('#sf-cpBody'); if(!body)return;
  if(!activeSel){body.innerHTML=`<div class="cp-text" style="color:var(--ink3)">选择镜头、场景组或剧本文字，查看它的全部素材。</div>`;return;}
  if(activeSel.type==='shot'){const s=SHOTS[ver][activeSel.shotIdx]||SHOTS[ver][0];body.innerHTML=shotAll(s,activeSel.shotIdx);return;}
  body.innerHTML=unitAll(activeSel.unit);
}
function shotAll(s,idx){
  const chars=SHOT_CHARS[idx]||[];
  return sec('提示词','<div class="cp-prompt">'+promptFor(s,idx)+'</div>')
    +sec('参考素材','<div class="ref-grid">'+chars.map(charThumb).join('')+sceneThumb()+storyboardThumb(s.n)+styleThumb()+'</div>')
    +(chars.length?sec('角色与声音',rows(chars.map(c=>[CHAR_DB[c].name.split(' ')[0],CHAR_DB[c].voice]))):'')
    +sec('布景与道具','<div class="cp-text">'+SCENE_DESIGN.textures+'<br>'+SCENE_DESIGN.props+'</div>')
    +sec('镜头与调色',rows([['画面',s.f],['摄影机',STYLE_REF.rig],['调色',STYLE_REF.grade]]));
}
function unitAll(u){
  const chars=u.chars||['joe','pete','donna'];
  return sec('内容大纲','<div class="cp-text">'+u.line+'</div>')
    +sec('覆盖范围',rows([['镜头数',(u.shots?u.shots.length:0)+''],['长度',u.f]]))
    +sec('演员','<div class="ref-grid">'+chars.map(charThumb).join('')+'</div>')
    +sec('声音',rows(chars.map(c=>[CHAR_DB[c].name.split(' ')[0],CHAR_DB[c].voice])))
    +sec('布景','<div class="ref-grid one">'+sceneThumb()+'</div>')
    +sec('详情','<div class="cp-text">'+SCENE_DESIGN.textures+'<br>'+SCENE_DESIGN.props+'</div>')
    +sec('视觉风格','<div class="ref-grid one">'+styleThumb()+'</div>')
    +sec('摄影参考',rows([['摄影机',STYLE_REF.rig],['光线',STYLE_REF.light],['调色',STYLE_REF.grade]]));
}

function send(){
  const cinput=sf.querySelector('#sf-cinput');
  const pill=sf.querySelector('#sf-selpill');
  let v=cinput.textContent;
  if(pill && pill.classList.contains('show')){
    v=v.replace(pill.textContent,'');
  }
  const placeholder=cinput.querySelector('.cplaceholder');
  if(placeholder){
    v=v.replace(placeholder.textContent,'');
  }
  v=v.trim();
  if(!v)return;

  cinput.innerHTML='';
  if(pill) cinput.appendChild(pill);
  if(placeholder) cinput.appendChild(placeholder);
  if(typeof checkInputText==='function') checkInputText();
  pushChat('user', v.replace(/</g,'&lt;'), true);
  setTimeout(()=>{let r=`Got it. I'll work from this scene and the Lookbook, then update the matching shots on the strip.`;
    const s=SHOTS[ver][sel];const nm=s?s.n:'that shot';
    if(/low.?angle|tilt up|look up/i.test(v))r=`Switching <b>${nm}</b> to a low-angle setup and regenerating — character & style stay locked. Only this shot invalidates.`;
    else if(/dark|cold|cool|grade|moody/i.test(v))r=`Grading the scene one stop darker and cooler (soft-lock + DI fallback). Nothing else changes.`;
    else if(/take|more|variant|option/i.test(v))r=`Spinning up more takes for <b>${nm}</b>; they clear the 60-pt gate, then rank by taste so you pick the GT.`;
    pushChat('bot', r, true);},700);}
let ft;function flash(html){const r=sf.querySelector('#sf-reply');r.innerHTML=html;r.classList.add('show');clearTimeout(ft);ft=setTimeout(()=>r.classList.remove('show'),3600);}

let inputFocused = false;

// Rich Text Input and Placeholder Handling and Dynamic Height Adjustments
function adjustHeights(forceFocusState) {
  // Height is handled natively by CSS min-height/max-height/height:auto.
}

function checkInputText() {
  const cinput = sf.querySelector('#sf-cinput');
  if (!cinput) return;

  let selpill = sf.querySelector('#sf-selpill');
  if (!selpill) {
    selpill = document.createElement('span');
    selpill.id = 'sf-selpill';
    selpill.contentEditable = 'false';
    selpill.className = 'selpill';
    cinput.insertBefore(selpill, cinput.firstChild);
  } else if (selpill.parentNode !== cinput || cinput.firstChild !== selpill) {
    cinput.insertBefore(selpill, cinput.firstChild);
  }

  // Ensure there is always a space after the pill when shown
  if (selpill.classList.contains('show')) {
    let next = selpill.nextSibling;
    if (!next || next.nodeType !== Node.TEXT_NODE) {
      const spaceNode = document.createTextNode('\u00A0');
      cinput.insertBefore(spaceNode, next);
    } else if (!next.textContent.startsWith('\u00A0')) {
      next.textContent = '\u00A0' + next.textContent;
    }
  }

  let text = cinput.textContent;
  if (selpill && selpill.classList.contains('show')) {
    text = text.replace(selpill.textContent, '');
  }
  const placeholder = cinput.querySelector('.cplaceholder');
  if (placeholder) {
    text = text.replace(placeholder.textContent, '');
  }
  // Remove the non-breaking space prefix from text length calculation
  if (selpill && selpill.classList.contains('show') && text.startsWith('\u00A0')) {
    text = text.substring(1);
  }
  text = text.trim();
  cinput.classList.toggle('has-text', text.length > 0);
  adjustHeights(inputFocused);
  if (typeof handleTypingLog === 'function') handleTypingLog();
}

const cinputEl = sf.querySelector('#sf-cinput');
if (cinputEl) {
  cinputEl.addEventListener('input', checkInputText);
  cinputEl.addEventListener('keyup', e => {
    checkInputText();
  });
  cinputEl.addEventListener('focus', () => {
    inputFocused = true;
    adjustHeights(true);
    if (typeof startLogStream === 'function') startLogStream();
  });
  cinputEl.addEventListener('blur', () => {
    inputFocused = false;
    setTimeout(() => adjustHeights(false), 0);
    if (typeof clearLogTimeouts === 'function') clearLogTimeouts();
  });
  cinputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const sendBtn = sf.querySelector('.cbar .send');
      if (sendBtn) {
        sendBtn.focus();
      }
    } else if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range.collapsed) {
          const startContainer = range.startContainer;
          const startOffset = range.startOffset;
          const pill = sf.querySelector('#sf-selpill');

          if (pill && pill.classList.contains('show')) {
            // Case 1: Cursor is inside the main input container, near the start
            if (startContainer === cinputEl && startOffset <= 1) {
              e.preventDefault();
              if(sf.classList.contains('mode-explore'))cvDeselect();else cpClose();
              let next = pill.nextSibling;
              if (next && next.nodeType === Node.TEXT_NODE && next.textContent.startsWith('\u00A0')) {
                next.textContent = next.textContent.substring(1);
                const newRange = document.createRange();
                newRange.setStart(next, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
              checkInputText();
              return;
            }

            // Case 2: Cursor is in the text node right after the pill
            let node = startContainer;
            if (node.nodeType === Node.TEXT_NODE) {
              let prev = node.previousSibling;
              while (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent === '') {
                prev = prev.previousSibling;
              }
              if (prev === pill) {
                // Cursor is right after the non-breaking space (offset 1)
                if (startOffset === 1 && node.textContent.startsWith('\u00A0')) {
                  e.preventDefault();
                  if(sf.classList.contains('mode-explore'))cvDeselect();else cpClose();
                  node.textContent = node.textContent.substring(1);
                  const newRange = document.createRange();
                  newRange.setStart(node, 0);
                  newRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                  checkInputText();
                  return;
                }
                // Cursor is at offset 0 (directly touching the pill)
                if (startOffset === 0) {
                  e.preventDefault();
                  if(sf.classList.contains('mode-explore'))cvDeselect();else cpClose();
                  checkInputText();
                  return;
                }
              }
            }
          }
        }
      }
    }
  });
}

// Copilot chat history (mock — like a normal copilot thread)
const CHAT=[
  {r:'user',t:'Let’s build STATIC: Joe wakes up, his parents are changing, and the TV keeps saying the world is normal.'},
  {r:'bot',t:"Set up the sequence from the screenplay — <b>12 shots</b>, Film / Act / Beat / Scene scopes. Pulled the <b>CRT Lookbook</b>, casting sheet, location scout, and storyboard wall into the asset pool."},
  {r:'user',t:'The family wide needs to feel more ritualistic. Keep them dead-center on the sofa.'},
  {r:'bot',t:"Updated <b>Shot 2</b> with locked symmetrical blocking for Pete and Donna. Character consistency stayed tied to the casting contact sheet."},
  {r:'user',t:'Make the first transformation less monster and more quiet body horror.'},
  {r:'bot',t:"Adjusted <b>Shot 5</b> toward subtle wool texture and cheek deformation; the VFX breakdown and makeup board were refreshed from the same source."},
  {r:'user',t:'Regenerate the hammer moment with more hesitation.'},
  {r:'bot',t:"Done — <b>Shot 6</b> now prioritizes Joe’s frozen hand and CRT spill. Only the prop continuity board and the edit timeline went stale."},
  {r:'user',t:'Give me more video takes on the street reveal.'},
  {r:'bot',t:"Spun up ranked takes for <b>Shot 9</b>; the top pick is loaded into the master, and the rejected variants remain on the takes grid."},
  {r:'user',t:'Cut a 15-second teaser from the most legible beats.'},
  {r:'bot',t:"Built <b>Trailer C</b> from the same asset pool: Joe wake-up, morph detail, broken CRT, then the white street. Switch reels from the timeline name to view it."}
];
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
  let i=0;const timer=setInterval(()=>{box.textContent=plain.slice(0,i+=3);
    const body=sf.querySelector('#sf-ctraceBody');body.scrollTop=body.scrollHeight;
    if(i>=plain.length){clearInterval(timer);box.innerHTML=text;}
  },24);
}
// Decision 4: the handbook owns the theme pair; toggleTheme is intentionally removed.
function bMode(el){
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
    renderView();
    requestAnimationFrame(()=>{layoutStrip();scrollToShot(sel,true);updateHero();});
  }
}
function startLogStream(){renderChat(false);}   // on copilot focus → show the thread
function clearLogTimeouts(){}
function handleTypingLog(){}
/* clicking the box's blank / tag / placeholder → put the caret at the END, not jumping before the pill */
const _cbar=sf.querySelector('.cbar');
if(_cbar)_cbar.addEventListener('pointerdown',e=>{
  if(e.target.id==='sf-cinput') return;                        // clicking the editable text → default caret
  if(e.target.closest && e.target.closest('.send')) return; // send button → normal
  const ci=sf.querySelector('#sf-cinput');
  const onPill = !!(e.target.closest && e.target.closest('.selpill'));
  // When the box is already open, a click on any non-text chrome (placeholder text, blank padding —
  // anything but the pill) should DISMISS it. The placeholder is a separate <span>, so without this
  // it used to fall through and re-focus the input, which is why it took a second click to blur.
  if(document.activeElement===ci && !onPill){
    e.preventDefault();
    ci.blur();
    return;
  }
  e.preventDefault();                                       // closed (or clicking the pill) → caret to end
  ci.focus();
  const r=document.createRange(); r.selectNodeContents(ci); r.collapse(false);
  const s=getSelection(); s.removeAllRanges(); s.addRange(r);
});

/* ============================================================
   EXPLORE · infinite freeform canvas engine
   ============================================================ */
const cvVp=sf.querySelector('#sf-cvVp');
const cvInner=sf.querySelector('#sf-cvInner');
let cvPan={x:0,y:0}, cvScale=1, cvSelId=null, cvFlt='all', cvInited=false;

// Seed material — "STATIC" exploration (tags: char | mood | visual | note)
const CV_ITEMS=[
  {id:'n1',type:'note',tag:'note',title:'Logline',body:'A teenage boy wakes to a television broadcast insisting everything is normal while his parents quietly transform into sheep. He tries to break the signal, only to discover the city outside has already joined the flock.',x:-860,y:-310},
  {id:'n2',type:'note',tag:'char',title:'Joe',body:'Sixteen. Sleep-deprived, observant, trying to stay rational longer than the world deserves. His face is always keyed by CRT blue, so every close-up feels watched by the machine. Performance spine: confusion becomes protection, then protection collapses into recognition.',x:-590,y:-370},
  {id:'n3',type:'note',tag:'char',title:'Pete & Donna',body:'Parents as almost-normal presences. They do not attack Joe; they keep obeying the broadcast. Their horror is compliance, not aggression. Their final human flashes should hurt because they still feel like family.',x:-590,y:-130},
  {id:'n4',type:'note',tag:'note',title:'Set · Apartment',body:'INT. SUBURBAN APARTMENT — NIGHT. Worn sofa, old CRT, amber practical lamps, balcony glass, dirty carpet, a hammer near the radiator. The living room is framed as a family ritual space: symmetrical, stale, too calm.',x:-860,y:20},
  {id:'n5',type:'note',tag:'note',title:'Style & Lens',body:'2:1 frame package, vintage anamorphic feel, CRT face key, nicotine tungsten, overexposed white exterior. Grade locks cyan signal against sick amber interiors. Grain, scanlines, slight gate weave, no glossy sci-fi cleanliness.',x:-590,y:160},
  {id:'n6',type:'note',tag:'note',title:'Core Contrast',body:'The broadcast says the world is fine; every image says the opposite. Keep the parents seated and polite while their bodies betray them. The street reveal must feel less like surprise and more like a fact that has been waiting.',x:-300,y:-30},
  {id:'n8',type:'note',tag:'note',title:'Sound Spine',body:'CRT hum is the emotional motor. Dialogue stays dry and close; sheep texture enters as cloth, breath, and distant body noise before the audience sees the full street. The hammer hit should briefly mute the room, then static floods back louder.',x:-300,y:210},
  {id:'n9',type:'note',tag:'note',title:'Pipeline Structure',body:'Story seed -> production bible -> casting lock -> location scout -> shot list -> storyboard pass -> generated takes -> edit timeline -> sound design -> VFX breakdown -> final master QC. Every artifact should feel like it belongs to the same short.',x:-30,y:110},
  {id:'n7',type:'note',tag:'note',title:'Sequence 03 — Script',body:`INT. SUBURBAN APARTMENT — NIGHT

A television speaks from another room, low and patient. JOE wakes with blue light moving across his face.

The screen shows a perfect white street full of sheep. A calm announcer insists everything is normal.

In the living room, PETE and DONNA sit side by side on the sofa. Their eyes do not blink.

JOE
Dad. Mom. Can you hear me?

Pete smiles without opening his mouth. The skin along his cheek tightens, then dimples into a pale wool texture. Donna keeps watching the broadcast.

PETE
We are fine. The world is fine.

Joe finds the hammer beside the radiator. He lifts it, but the tool becomes impossibly heavy.

He swings anyway. Glass flowers outward. Static fills the room like weather. For one second Pete and Donna look almost human.

DONNA
Do not go outside, sweetheart.

Joe backs through the balcony door. The city below is silent and overexposed. Thousands of sheep stand in the street, all facing his building.

CUT TO BLACK.`,x:-300,y:-330},
  /* production artifacts — clustered as a real workflow pool */
  {id:'i1',type:'img',tag:'visual',title:'Story Seed Board',g:bg('story-seed-board.jpg'),x:230,y:-330},
  {id:'i2',type:'img',tag:'visual',title:'Production Bible Spread',g:bg('production-bible-spread.jpg'),x:455,y:-330},
  {id:'i3',type:'img',tag:'char',title:'Casting Contact Sheet',g:bg('casting-contact-sheet.jpg'),x:680,y:-330},
  {id:'i4',type:'img',tag:'visual',title:'Location Scout Board',g:bg('location-scout-board.jpg'),x:905,y:-330},
  {id:'i5',type:'img',tag:'mood',title:'Lookbook · Cinematography',g:bg('lookbook-camera-board.jpg'),x:1180,y:-330},
  {id:'i6',type:'img',tag:'mood',title:'Color Script',g:bg('color-script-strip.jpg'),x:245,y:-150},
  {id:'i7',type:'img',tag:'visual',title:'Storyboard Wall',g:bg('storyboard-wall.jpg'),x:470,y:-145},
  {id:'i8',type:'img',tag:'visual',title:'Shot List Board',g:bg('shot-list-board.jpg'),x:695,y:-150},
  {id:'i9',type:'img',tag:'visual',title:'Video Takes Grid',g:bg('video-takes-grid.jpg'),x:920,y:-150},
  {id:'i10',type:'img',tag:'mood',title:'Sound Design Map',g:bg('sound-design-board.jpg'),x:1150,y:-145},
  {id:'i11',type:'img',tag:'visual',title:'VFX Breakdown',g:bg('vfx-breakdown-board.jpg'),x:245,y:30},
  {id:'i12',type:'img',tag:'visual',title:'Edit Timeline Board',g:bg('editing-timeline-board.jpg'),x:470,y:35},
  {id:'i13',type:'img',tag:'visual',title:'Prop Continuity',g:bg('props-continuity-board.jpg'),x:695,y:30},
  {id:'i14',type:'img',tag:'visual',title:'Final Master QC',g:bg('final-master-qc-board.jpg'),x:920,y:35},
  {id:'i15',type:'img',tag:'mood',title:'Workflow Overview',g:bg('workflow-overview-board.jpg'),x:1150,y:30}
];
const CV_TAGN={char:'Character',mood:'Mood Board',visual:'Visual Ref',note:'Note'};

function cvApply(){cvInner.style.transform=`translate(${cvPan.x}px,${cvPan.y}px) scale(${cvScale})`;}

function cvMakeEl(it){
  const el=document.createElement('div');
  el.className=`ci ${it.type==='img'?'img':'note'}`+(it.id===cvSelId?' sel':'');
  el.dataset.id=it.id; el.dataset.tag=it.tag;
  el.setAttribute('data-cmp','');el.setAttribute('data-live','');el.setAttribute('data-nofocus','');
  el.style.left=it.x+'px'; el.style.top=it.y+'px';
  if(it.type==='img'){
    el.innerHTML=`<div class="ci-pic"><div class="g" style="background:${it.g}"></div><div class="ci-grain"></div></div>`;
  }else{
    el.innerHTML=`<div class="ci-tag">${CV_TAGN[it.tag]}</div>`+
      `<div class="ci-h" spellcheck="false">${it.title||''}</div>`+
      `<div class="ci-b" spellcheck="false" data-ph="输入一个想法…">${it.body||''}</div>`;
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
function cvPillName(it){return it.title||(it.type==='img'?'Reference':'Note');}
function cvSetPill(name){const p=sf.querySelector('#sf-selpill');if(!p)return;p.classList.add('show');p.textContent='@'+name;if(typeof checkInputText==='function')checkInputText();}
function cvClearPill(){const p=sf.querySelector('#sf-selpill');if(!p)return;p.classList.remove('show');p.textContent='';if(typeof checkInputText==='function')checkInputText();}
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
  cvInner.style.transition='transform .42s cubic-bezier(.16,1,.3,1)';
  cvPan.x=r.width/2-(it.x+w/2)*cvScale;
  cvPan.y=r.height/2-(it.y+h/2)*cvScale;
  cvApply();
  setTimeout(()=>{cvInner.style.transition='';},440);
}

function cvBindItem(el,it){
  el.addEventListener('pointerdown',e=>{
    if(e.button)return;
    e.stopPropagation(); e.preventDefault();el.setPointerCapture(e.pointerId);
    const wasSel=(cvSelId===it.id);
    const sx=e.clientX, sy=e.clientY, ox=it.x, oy=it.y; let moved=false;
    el.classList.add('dragging');
    const mv=ev=>{if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)>4){moved=true;el.classList.remove('zoom');}
      it.x=ox+(ev.clientX-sx)/cvScale; it.y=oy+(ev.clientY-sy)/cvScale;
      el.style.left=it.x+'px'; el.style.top=it.y+'px';};
    const up=()=>{el.classList.remove('dragging');document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);
      if(moved)return;                                              // a drag → just reposition
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
  cvDeselect();
  const sx=e.clientX, sy=e.clientY, ox=cvPan.x, oy=cvPan.y;
  cvVp.classList.add('grabbing');
  const mv=ev=>{cvPan.x=ox+(ev.clientX-sx);cvPan.y=oy+(ev.clientY-sy);cvApply();};
  const up=()=>{cvVp.classList.remove('grabbing');document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
});
cvVp.addEventListener('wheel',e=>{
  e.preventDefault();
  if(e.ctrlKey||e.metaKey){
    const r=cvVp.getBoundingClientRect(), mx=e.clientX-r.left, my=e.clientY-r.top;
    const cx=(mx-cvPan.x)/cvScale, cy=(my-cvPan.y)/cvScale;
    cvScale=Math.min(2.5,Math.max(0.1,cvScale*Math.exp(-e.deltaY*0.0015)));
    cvPan.x=mx-cx*cvScale; cvPan.y=my-cy*cvScale;
  }else{cvPan.x-=e.deltaX; cvPan.y-=e.deltaY;}
  cvApply();
},{passive:false});

function cvZoom(factor){
  const r=cvVp.getBoundingClientRect(),mx=r.width/2,my=r.height/2;
  const next=Math.min(2.5,Math.max(.1,cvScale*factor));
  cvPan.x=mx-(mx-cvPan.x)*next/cvScale;cvPan.y=my-(my-cvPan.y)*next/cvScale;
  cvScale=next;cvApply();
}
function cvFit(){
  const els=cvInner.querySelectorAll('.ci'); if(!els.length)return;
  let a=1e9,b=1e9,c=-1e9,d=-1e9;
  els.forEach(el=>{const x=parseFloat(el.style.left),y=parseFloat(el.style.top),w=el.offsetWidth,h=el.offsetHeight;
    a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x+w);d=Math.max(d,y+h);});
  const pad=90, r=cvVp.getBoundingClientRect();
  cvScale=Math.min(1.3,Math.max(0.1,Math.min(r.width/(c-a+pad*2),r.height/(d-b+pad*2))));
  cvPan.x=r.width/2-(a+(c-a)/2)*cvScale;
  cvPan.y=r.height/2-(b+(d-b)/2)*cvScale;
  cvApply();
}

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
    // viewing an image: drop the whole app into dark mode (no separate dark viewer); restore on close
      fo.classList.add('media');fo.classList.remove('doc');
    stage.innerHTML=`<div class="cv-photo"><div class="g" style="background:${it.g}"></div><div class="ci-grain"></div></div>`+
      `<div class="cv-photo-cap" contenteditable="true" spellcheck="false">${it.title||''}</div>`;
  }else{
    // text: read-only document column (like Create's browser) — clicking it keeps the copilot/chat open
    fo.classList.remove('media');fo.classList.add('doc');
    stage.innerHTML=`<div class="cv-doc">`+
      `<div class="cv-art-tag">${CV_TAGN[it.tag]}</div>`+
      `<div class="cv-art-h">${it.title||''}</div>`+
      `<div class="cv-art-b">${(it.body||'').replace(/</g,'&lt;')}</div>`+
      `</div>`;
  }
  stage.querySelectorAll('[contenteditable]').forEach(ed=>ed.addEventListener('blur',()=>{
    if(ed.classList.contains('cv-art-b'))it.body=ed.textContent.trim(); else it.title=ed.textContent.trim();
    cvSetPill(cvPillName(it));
  }));
  fo.classList.add('show');
  cvSetPill(cvPillName(it)); cvCopilot(true);
  const ci=sf.querySelector('#sf-cinput');                       // input shows the cursor; full copilot history pops via :focus-within
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
  e.stopPropagation();const v=el.dataset.value;
  switch(el.dataset.sfCall){
    case 'bMode':bMode(el);break;
    case 'cvFilter':cvFilter(v,el);break;
    case 'cvFit':cvFit();break;
    case 'cvZoomOut':cvZoom(.85);break;
    case 'cvZoomIn':cvZoom(1.15);break;
    case 'setTrack':setTrack(v,el);break;
    case 'setLayer':setLayer(v,el);break;
    case 'setZoom':setZoom(v,el);break;
    case 'pickClip':pickClip(el,+v);break;
    case 'pickShot':pickShot(+v);break;
    case 'pickTl':pickTl(+v);break;
    case 'selShot':selShot(+v,el);break;
    case 'selScript':selScript(el.dataset.type,v,el);break;
    case 'selUnit':selUnit(el);break;
    case 'mediaPreview':mediaPreview(el.dataset.bg,el.dataset.caption,el.dataset.kind);break;
    case 'clipPreviewClick':clipPreviewClick();break;
    case 'toggleTlMenu':toggleTlMenu(e);break;
    case 'addTimeline':addTimeline();break;
    case 'send':send();break;
    case 'cpClose':cpClose();break;
    case 'cvUnfocus':cvUnfocus();break;
  }
});
const timeline=sf.querySelector('.timeline'),copilot=sf.querySelector('.copilot');
// Decision 5: geometric hit areas and the 500ms lock are owned by UX, not this sample.
UX.hitRegion(timeline,{
  enter:()=>[sf.querySelector('.tlrow')],
  exit:()=>[...sf.querySelectorAll('.tlctl,.filmstrip,.hero,.tlhead,.tlmenu.show')],
  bounds:true,
  enabled:()=>!cvFocusId&&sf.classList.contains('mode-create')&&!copilot.classList.contains('ux-focus')
});
UX.hitRegion(copilot,{enter:()=>[sf.querySelector('.cbar')],exit:()=>[sf.querySelector('.cbar')]});
sf.querySelector('#sf-cinput').addEventListener('focus',()=>UX.focus(copilot));
// One held owner spans input, send, history and preview-preserving data-keep controls.
copilot.addEventListener('ux:blur',()=>{
  if(copilot.contains(document.activeElement))document.activeElement.blur();
});
copilot.addEventListener('keydown',e=>{if(e.key==='Escape'){UX.blur(sf);if(cvFocusId)cvUnfocus();}});
sf.querySelector('.timeline').setAttribute('data-keep','');
sf.querySelector('.cpanel').setAttribute('data-keep','');
sf.querySelector('.cv-focus-stage').setAttribute('data-keep','');
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

// Initial setup and event listeners execution
setReelLabel();buildStrip();renderView();renderChat(false);
cvInit();cvDeselect();   // default Explore → no @target until a block is clicked
requestAnimationFrame(()=>{layoutStrip();scrollToShot(sel,true);updateHero();adjustHeights();});
window.addEventListener('resize',()=>{layoutStrip();scrollToShot(sel,true);updateHero();adjustHeights();if(sf.matches('.mode-explore'))cvFit();});
})();
