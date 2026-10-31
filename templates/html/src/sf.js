/* Full Story Forge v5 script. Source: prototype/sfm_ui_draft_v5.html, decisions 0006. */
(()=>{
'use strict';
const sf=window.document.getElementById('sf');
if(!sf)return;

// Decision 7: each name is one generated image, inlined by src/build.py as a CSS variable.
const bg=name=>`var(--sf-${name.replace(/\.jpg$/,'')}) center/cover no-repeat`;

// Decision 0008: stable shot identity is the only join key. Units and record times are derived.
const LOG_LINE='A teenager tries to stop his parents changing while a television insists the world is still normal.';
const SHOT_LIST=[
  {id:'s01',num:1,dur:4,scene:'scene1',beat:'wake',cast:['joe'],desc:'Joe wakes, blue light on his face',picture:'shot-joe-crt-closeup',size:'Close-up',lens:'50mm',move:'Locked',props:['CRT spill']},
  {id:'s02',num:2,dur:5,scene:'scene2',beat:'broadcast',cast:['pete','donna'],desc:'Parents rigid on the sofa',picture:'shot-parents-living-room',size:'Wide',lens:'35mm',move:'Locked symmetrical',props:['CRT television','sofa','cushion','remote']},
  {id:'s03',num:3,dur:3,scene:'scene2',beat:'broadcast',cast:[],desc:'Insert: white street on the TV',picture:'shot-crt-static',size:'Insert',lens:'85mm',move:'Locked',props:['CRT television']},
  {id:'s04',num:4,dur:4,scene:'scene2',beat:'broadcast',cast:['joe'],desc:'Joe in the doorway',picture:'shot-joe-recognition',size:'Medium close-up',lens:'50mm',move:'Slow push',props:['doorway']},
  {id:'s05',num:5,dur:4,scene:'scene2',beat:'morph',cast:['pete'],desc:'Cheek turns to wool',picture:'shot-sheep-morph',size:'Close-up',lens:'85mm',move:'Locked',props:['wool','shirt button']},
  {id:'s06',num:6,dur:3,scene:'scene2',beat:'morph',cast:['joe'],desc:'Hand on the hammer',picture:'shot-hammer-prop',size:'Hand insert',lens:'85mm',move:'Locked',props:['hammer','radiator']},
  {id:'s07',num:7,dur:2,scene:'scene2',beat:'morph',cast:[],desc:'Screen breaks; announcer cuts off',picture:'shot-broken-tv',size:'Insert',lens:'50mm',move:'Impact',props:['broken CRT','glass','hammer']},
  {id:'s08',num:8,dur:4,scene:'scene2',beat:'relief',cast:['pete','donna'],desc:'Parents almost human',picture:'shot-parents-human',size:'Two-shot',lens:'50mm',move:'Locked',props:['sofa','cushion','remote']},
  {id:'s09',num:9,dur:5,scene:'scene3',beat:'reveal',cast:['joe'],desc:'Joe above the flooded street',picture:'shot-sheep-street',size:'Wide',lens:'28mm',move:'Slow reveal',props:['balcony rail']},
  {id:'s10',num:10,dur:4,scene:'scene3',beat:'reveal',cast:[],desc:'The flock, all facing the building',picture:'shot-flock-reveal',size:'Extreme wide',lens:'35mm',move:'Locked',props:[]},
  {id:'s11',num:11,dur:4,scene:'scene3',beat:'hold',cast:['joe'],desc:'Joe between the dead TV, still flickering, and the flock',picture:'shot-joe-hold',size:'Wide',lens:'35mm',move:'Locked hold',props:['broken CRT','balcony rail']},
  {id:'s12',num:12,dur:3,scene:'scene3',beat:'hold',cast:[],desc:'CUT TO BLACK: noise and breath; end card',picture:null,size:'Black',lens:'None',move:'None',props:[]}
].map(s=>({...s,act:s.num<=8?'act1':'act2',format:'16:9',panel:`sb-${String(s.num).padStart(2,'0')}`,n:`Shot ${s.num}`,f:s.desc,line:s.desc,d:`${s.dur}s`,g:s.picture?bg(s.picture+'.jpg'):'#000'}));
const BY_ID=Object.fromEntries(SHOT_LIST.map(s=>[s.id,s]));
const ids=ns=>ns.map(n=>`s${String(n).padStart(2,'0')}`);
const CUTS={
 A:{name:'Picture Lock A',shotIds:SHOT_LIST.map(s=>s.id)},
 B:{name:'Alt Cut B',shotIds:ids([1,2,4,5,6,7,8,9,10,12])},
 C:{name:'Trailer C',shotIds:ids([1,5,7,9])},
 D:{name:'Teaser D',shotIds:ids([1,4,12])},
 E:{name:'Festival Master E',shotIds:SHOT_LIST.map(s=>s.id),deliverableOf:'A'}
};
const VKEYS=Object.keys(CUTS),VNAME=Object.fromEntries(VKEYS.map(k=>[k,CUTS[k].name]));
const SHOTS=Object.fromEntries(VKEYS.map(k=>[k,CUTS[k].shotIds.map(id=>BY_ID[id])]));
const SCENES={
 scene1:{n:'Scene 1',slug:'INT. BEDROOM — BEFORE DAWN',act:'act1',set:'Bedroom',textures:'Bed linen · doorway · CRT blue spill',props:['bed','doorway'],grad:bg('shot-joe-crt-closeup.jpg')},
 scene2:{n:'Scene 2',slug:'INT. LIVING ROOM — BEFORE DAWN',act:'act1',set:'Living room',textures:'Worn sofa · CRT scanlines · amber practical lamps · radiator',props:['CRT television','hammer','sofa','cushion','remote','wool','shirt button'],grad:bg('shot-parents-living-room.jpg')},
 scene3:{n:'Scene 3',slug:'EXT. BALCONY — DAWN',act:'act2',set:'Balcony',textures:'Balcony glass · rail · overexposed flooded street',props:['balcony rail','broken CRT'],grad:bg('shot-sheep-street.jpg')}
};
SHOT_LIST.forEach(s=>{s.loc=SCENES[s.scene].slug;s.set=SCENES[s.scene].set;});
const BEATS={wake:'Wake',broadcast:'Broadcast',morph:'Morph / Hammer',relief:'False relief',reveal:'Reveal',hold:'Hold'};
const CHAR_DB={joe:{name:'Joe',sheet:bg('char-joe.jpg'),voice:'170Hz · sleep-deprived'},pete:{name:'Pete',sheet:bg('char-pete.jpg'),voice:'105Hz · hollow paternal'},donna:{name:'Donna',sheet:bg('char-donna.jpg'),voice:'215Hz · almost human'},announcer:{name:'Announcer (V.O.)',voice:'Off-screen · calm, patient broadcast'}};
const STYLE_REF={grad:bg('lookbook-camera-board.jpg'),rig:'Alexa LF reference · vintage spherical lenses · generated stills · 16:9',light:'CRT face key · dirty tungsten practicals · overexposed white exterior',grade:'Cold cyan signal vs stale amber interiors; texture is in the source image'};
function cutShots(k=ver){return SHOTS[k];}
function duration(members){return members.reduce((t,s)=>t+s.dur,0);}
function recordShots(k=ver){let t=0;return cutShots(k).map(s=>{const r={...s,start:t};t+=s.dur;return r;});}
function tc(t){const f=Math.round(t*24);return [Math.floor(f/86400),Math.floor(f/1440)%60,Math.floor(f/24)%60,f%24].map(n=>String(n).padStart(2,'0')).join(':');}
function makeUnit(id,n,members,line){const dur=duration(members);return {id,n,dur,d:dur+'s',f:dur+'s · '+members.length+' shots',line,shotIds:members.map(s=>s.id),shots:members.map(s=>s.id),chars:[...new Set(members.flatMap(s=>s.cast))],g:members[0]?.g||'#000'};}
function unitsFor(level,k=ver){const shots=cutShots(k);if(level==='Shot')return shots;
 if(level==='Film')return [makeUnit('film','STATIC',shots,LOG_LINE)];
 const field={Act:'act',Scene:'scene',Beat:'beat'}[level];
 return [...new Set(shots.map(s=>s[field]))].map(id=>{const members=shots.filter(s=>s[field]===id);const n=level==='Act'?(id==='act1'?'Act I':'Act II'):level==='Scene'?SCENES[id].n:BEATS[id];const text=level==='Scene'?SCENES[id].slug:members.map(s=>s.desc).join('. ');return makeUnit(id,n,members,text);});
}
const ZOOM_FRAMES=new Proxy({},{get:(_,level)=>unitsFor(level)});
function curArr(){return unitsFor(zoomLevel);}
function memberShots(u){return u.shotIds?u.shotIds.map(id=>BY_ID[id]):[u];}
function sbBg(s){const sh=s?.shotIds?BY_ID[s.shotIds[0]]:s;return sh?bg(sh.panel+'.jpg'):bg('storyboard-source-sheet.jpg');}
function sbArt(s){return `<div class="g" style="background:${sbBg(s)}"></div>`;}
function sbBig(s){return `<div class="hg" style="background:${sbBg(s)}"></div>`;}
function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
const SCRIPT=[
 {id:'scene1',type:'scene',shots:ids([1]),text:SCENES.scene1.slug},
 {id:'joe_wakes',type:'action',shots:ids([1]),text:'A television speaks from another room, low and patient. Joe, sixteen, wakes with blue light moving across his face like water.'},
 {id:'announcer',type:'dialogue',speaker:'announcer',shots:ids([1,2,3,4,5,6]),text:'Everything is normal. Please remain seated.'},
 {id:'scene2',type:'scene',shots:ids([2,3,4,5,6,7,8]),text:SCENES.scene2.slug},
 {id:'parents_sofa',type:'action',shots:ids([2]),text:'In the living room, Pete and Donna sit side by side on the sofa. Their hands rest on their knees. Their eyes do not blink.'},
 {id:'crt_signal',type:'action',shots:ids([3]),text:'The screen shows a perfect white street full of sheep. The apartment is too still to believe the broadcast.'},
 {id:'joe_question',type:'dialogue',speaker:'joe',shots:ids([4]),paren:'(whispering)',text:'Dad. Mom. Can you hear me?'},
 {id:'first_morph',type:'action',shots:ids([5]),text:'The skin along Pete’s cheek tightens, then dimples into pale wool. His lips barely move.'},
 {id:'pete_static',type:'dialogue',speaker:'pete',shots:ids([5]),paren:'(lips barely moving)',text:'We are fine. The world is fine.'},
 {id:'hammer_choice',type:'action',shots:ids([6]),text:'Joe finds the hammer beside the radiator. He lifts it, but the tool becomes impossibly heavy.'},
 {id:'screen_break',type:'action',shots:ids([7]),text:'He swings anyway. Glass flowers outward. The announcer cuts off. The room mutes.'},
 {id:'false_relief',type:'action',shots:ids([8]),text:'Static floods back. For one second Pete and Donna look almost human.'},
 {id:'donna_warning',type:'dialogue',speaker:'donna',shots:ids([8]),paren:'(softly)',text:'Do not go outside, sweetheart.'},
 {id:'scene3',type:'scene',shots:ids([9,10,11,12]),text:SCENES.scene3.slug},
 {id:'balcony_reveal',type:'action',shots:ids([9]),text:'Joe backs through the balcony door. The city below is silent and overexposed.'},
 {id:'flock',type:'action',shots:ids([10]),text:'Thousands of sheep stand in the street, all facing his building.'},
 {id:'final_hold',type:'action',shots:ids([11]),text:'Behind Joe, the broken television keeps flickering. Ahead, the flock waits without moving.'},
 {id:'black',type:'action',shots:ids([12]),text:'CUT TO BLACK. Noise and breath; end card.'}
];
function scriptFor(shotIds){return SCRIPT.filter(e=>e.shots.some(id=>shotIds.includes(id)));}
function scriptText(shotIds){return scriptFor(shotIds).map(e=>(e.speaker?CHAR_DB[e.speaker].name.toUpperCase()+' '+(e.paren||'')+'\n':'')+e.text).join('\n\n');}
// A strip thumbnail fits a few lines, so it shows what belongs to this unit alone, not a cue that spans its neighbours.
function ownScriptText(shotIds){return SCRIPT.filter(e=>e.shots.every(id=>shotIds.includes(id))).map(e=>(e.speaker?CHAR_DB[e.speaker].name.toUpperCase()+' ':'')+e.text).join(' ');}
// Sound cues use master source time, then project onto each cut's record time.
const SOURCE_TRACKS=[
 ...SCRIPT.filter(e=>e.type==='dialogue'&&e.speaker!=='announcer').map(e=>({id:e.id,lane:'voice',kind:'aud',cls:'dial',shotIds:e.shots,speaker:e.speaker,text:CHAR_DB[e.speaker].name+': '+e.text})),
 {id:'announcer',lane:'voice',kind:'aud',cls:'dial',start:0,end:23,text:'ANNOUNCER (V.O.): Everything is normal. Please remain seated.',row:1},
 {id:'hum',lane:'sound',kind:'aud',cls:'sfx',start:0,end:23,text:'CRT hum'},
 {id:'impact',lane:'sound',kind:'aud',cls:'sfx',start:23,end:25,text:'Hammer and glass · room mute'},
 {id:'static',lane:'sound',kind:'aud',cls:'sfx',start:25,end:42,text:'Static flood'},
 {id:'cloth',lane:'sound',kind:'aud',cls:'sfx',start:25,end:42,text:'Sheep cloth and breath · pre-lap',row:1},
 {id:'noise',lane:'sound',kind:'aud',cls:'sfx',start:42,end:45,text:'Noise and breath'},
 {id:'music',lane:'music',kind:'aud',cls:'mus',start:29,end:42,text:'Sparse reveal cue'},
 {id:'title',lane:'graphics',kind:'gfx',cls:'ovl',shotIds:ids([1]),text:'STATIC'},
 {id:'chyron',lane:'graphics',kind:'gfx',cls:'ovl',shotIds:ids([3]),text:'ALL IS NORMAL'},
 {id:'endcard',lane:'graphics',kind:'gfx',cls:'ovl',shotIds:ids([12]),text:'STATIC · The End'},
 ...SCRIPT.filter(e=>e.type==='dialogue').map(e=>({id:'sub-'+e.id,lane:'subtitles',kind:'sub',cls:'sub',shotIds:e.speaker==='announcer'?undefined:e.shots,start:e.speaker==='announcer'?0:undefined,end:e.speaker==='announcer'?23:undefined,text:CHAR_DB[e.speaker].name+': '+e.text,row:e.speaker==='announcer'?1:0}))
];
function tracksFor(k=ver){const master=recordShots('A');return SOURCE_TRACKS.flatMap(c=>{let segments=[];recordShots(k).forEach(s=>{const source=master.find(m=>m.id===s.id);const a=c.shotIds?(c.shotIds.includes(s.id)?source.start:null):Math.max(source.start,c.start);const b=c.shotIds?source.start+s.dur:Math.min(source.start+s.dur,c.end);if(a!==null&&b>a)segments.push({...c,start:s.start+a-source.start,dur:b-a,shotId:s.id});});
 // Coalesce adjacent parts of one source cue; retain gaps when a cut changes its placement.
 return segments.reduce((out,c)=>{const last=out[out.length-1];if(last&&last.start+last.dur===c.start){last.dur+=c.dur;last.shotIds.push(c.shotId);}else out.push({...c,shotIds:[c.shotId]});return out;},[]);
 });}
let ver='A',sel=3,vi=0,layer='script',zoomLevel='Shot',track='video',selClip=null;
const PX_PER_SEC=27.5;
function unitStart(i){return duration(curArr().slice(0,i));}
function unitWidth(s){return s.dur*PX_PER_SEC;}
function setTrack(t,el){track=t;selClip=null;sf.querySelectorAll('#sf-tltrack .tt').forEach(b=>b.classList.toggle('on',b===el));buildStrip();renderView();}
function miniWave(seed,n=10){let b='';for(let k=0;k<n;k++){const v=Math.abs(Math.sin(seed*5.3+k*1.27)+Math.sin(seed*2.1+k*.7)*.5);b+=`<i style="height:${(22+v/1.5*58).toFixed(0)}%"></i>`;}return b;}
function laneClip(c,index){const left=padX+c.start*PX_PER_SEC,w=c.dur*PX_PER_SEC;return `<div class="clip ${c.cls} ${c.row?'subrow':''}" data-sf-call="pickClip" data-value="${index}" data-clip-id="${c.id}" data-start="${c.start}" data-duration="${c.dur}" title="${esc(c.text)}" style="left:${left}px;width:${w}px"><span class="ctx">${esc(c.text)}</span></div>`;}
function laneBg(){return `<div class="lbg">${recordShots().map(s=>`<div class="lblk" style="left:${padX+s.start*PX_PER_SEC}px;width:${s.dur*PX_PER_SEC}px;background:${s.g}"></div>`).join('')}</div>`;}
function buildLanes(){const clips=tracksFor();const lanes=track==='audio'?[['voice','人声'],['sound','声音设计'],['music','音乐']]:[['subtitles','字幕'],['graphics','图形']];const heads=sf.querySelector('#sf-laneHeads');heads.innerHTML=lanes.map(([id,label])=>`<div class="lh ${id}"><span class="dot"></span>${label}</div>`).join('');return laneBg()+lanes.map(([id])=>`<div class="lane" data-lane="${id}">${clips.map((c,i)=>c.lane===id?laneClip(c,i):'').join('')}</div>`).join('');}
function growLane(el,to){el.style.height=to+'px';}
function pickClip(el,index){selClip=tracksFor()[index];if(!selClip)return;activeSel={type:'clip',clip:selClip};sf.querySelectorAll('#sf-frames .clip.sel').forEach(c=>c.classList.remove('sel'));el.classList.add('sel');const lanes=[...el.closest('.lane').parentNode.querySelectorAll('.lane')],picked=lanes.indexOf(el.closest('.lane'));lanes.forEach((l,i)=>growLane(l,i===picked?46:26));sf.querySelectorAll('#sf-laneHeads .lh').forEach((h,i)=>growLane(h,i===picked?46:26));openPanel();renderView();updateCtx();cvSetPill(selClip.text);cvCopilot(true);}
function clipPreviewClick(){if(selClip){activeSel={type:'clip',clip:selClip};openPanel();updateCtx();}}

const FW=110, EDGE=72; let padX=180;  // EDGE = overscroll margin at BOTH ends → symmetric spring-back
const strip=sf.querySelector('#sf-strip');
function picHTML(s){
  if(layer==='storyboard')return `<div class="pic sb">${s.shotIds?`<div class="panel-mosaic">${s.shotIds.map(id=>`<div style="background:${sbBg(BY_ID[id])}"></div>`).join('')}</div>`:sbArt(s)}</div>`;
  if(layer==='script')return `<div class="pic itl">${esc(zoomLevel==='Film'?LOG_LINE:ownScriptText(memberShots(s).map(x=>x.id)))}</div>`;
  return `<div class="pic"><div class="g" style="background:${s.g}"></div></div>`;
}
function buildStrip(){
  const arr=curArr(); sel=Math.max(0,Math.min(arr.length-1,sel));
  padX=Math.max(8,(strip.clientWidth-FW)/2)+EDGE;            // need padX before positioning lane clips
  const frames=sf.querySelector('#sf-frames'), heads=sf.querySelector('#sf-laneHeads');
  strip.classList.toggle('lanes', track!=='video');
  if(track==='video'){
    frames.style.width=(padX*2+duration(cutShots())*PX_PER_SEC)+'px';
    frames.innerHTML=arr.map((s,i)=>
      `<div class="frame" data-shot-id="${s.id}" data-start="${unitStart(i)}" data-duration="${s.dur}" style="width:${unitWidth(s)}px" title="${s.n} · ${tc(unitStart(i))} · ${s.f}" data-sf-call="pickShot" data-value="${i}">${picHTML(s)}<span class="num">${zoomLevel==='Shot'?(unitWidth(s)<80?s.num:s.num+' · '+tc(unitStart(i))):s.n+' · '+s.d}</span></div>`).join('');
    if(heads)heads.classList.remove('show');
  }else{
    frames.style.width=(padX*2+duration(cutShots())*PX_PER_SEC)+'px';
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
  const trackW=padX*2+duration(cutShots())*PX_PER_SEC;const n=Math.ceil(trackW/26)+2;
  let h='';for(let i=0;i<n;i++)h+='<div class="hole"></div>';
  sf.querySelector('#sf-perfTop').innerHTML=h;sf.querySelector('#sf-perfBot').innerHTML=h;
}
function scrollToShot(i,instant){
  const arr=curArr();i=Math.max(0,Math.min(arr.length-1,i));
  const target=padX+unitStart(i)*PX_PER_SEC+unitWidth(arr[i])/2-strip.clientWidth/2;
  strip.scrollTo({left:Math.max(0,target),behavior:instant?'auto':'smooth'});
}
/* click a timeline frame → navigate to it AND tag it on the copilot (@tag + shadow), like picking any material */
function pickShot(i){
  const arr=curArr(); i=Math.max(0,Math.min(arr.length-1,i)); sel=i;
  activeSel=zoomLevel==='Shot'?{type:'shot',shotId:arr[i].id,shotIdx:i}:{type:'unit',unit:arr[i]};
  scrollToShot(i); updateHero(); updatePill(); renderView(); if(sf.querySelector('.browser.panel-open'))updateCtx(); cvCopilot(true);
}
/* clicking a frame must not steal focus from the copilot input (keeps the chat history open) */
strip.addEventListener('pointerdown',e=>{if(document.activeElement===sf.querySelector('#sf-cinput')&&e.target.closest('.frame,.clip'))e.preventDefault();});
function updateHero(){
  const hero=sf.querySelector('#sf-hero');const s=curArr()[sel];
  if(!s||track!=='video'){hero.style.display='none';return;}    // lane tracks: material shows in the browser, not the timeline
  hero.style.display='block';
  hero.className='hero'+(layer==='storyboard'?' sb':layer==='script'?' itl':'');
  if(layer==='storyboard')hero.innerHTML=(s.shotIds?`<div class="panel-mosaic">${s.shotIds.map(id=>`<div style="background:${sbBg(BY_ID[id])}"></div>`).join('')}</div>`:sbBig(s))+`<div class="cap">${s.n} · ${s.f}</div>`;
  else if(layer==='script')hero.innerHTML=`<div>${esc(zoomLevel==='Film'?LOG_LINE:scriptText(memberShots(s).map(x=>x.id)))}</div><div class="cap">${s.n} · ${s.f}</div>`;
  else hero.innerHTML=`<div class="hg" style="background:${s.g}"></div><div class="cap">${s.n} · ${s.f} · ${s.d}</div>`;
  const wrap=sf.querySelector('.stripwrap');
  hero.style.left=(wrap.offsetLeft+wrap.clientWidth/2-hero.offsetWidth/2)+'px';
}
function updatePill(){
  if(!activeSel||!['shot','unit'].includes(activeSel.type)||activeSel.scriptId)return;   // only follow an explicitly-picked shot; no auto-tag from mere scrubbing
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
function commitSel(){if(activeSel&&!activeSel.scriptId&&activeSel.type!=='clip'){const s=curArr()[sel];activeSel=zoomLevel==='Shot'?{type:'shot',shotId:s.id,shotIdx:sel}:{type:'unit',unit:s};}updatePill();renderView();}
strip.addEventListener('scroll',()=>{if(rafid)return;rafid=requestAnimationFrame(()=>{rafid=null;
  const center=strip.scrollLeft+strip.clientWidth/2;const arr=curArr();let best=0,bd=1e9;
  for(let i=0;i<arr.length;i++){const c=padX+unitStart(i)*PX_PER_SEC+unitWidth(arr[i])/2,d=Math.abs(c-center);if(d<bd){bd=d;best=i;}}
  if(best!==sel){sel=best;updateHero();                 // live: the timeline's own focus tracks immediately
    clearTimeout(bindT);bindT=setTimeout(commitSel,160);// debounced: @tag + browser settle after the scroll stops
  }
});},{passive:true});
/* vertical wheel → horizontal film scroll (native, reliable). hero is pointer-events:none so wheel lands on the film. */
strip.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){strip.scrollLeft+=e.deltaY;e.preventDefault();}},{passive:false});

function setLayer(l,el){if(layer!==l)cpClose();layer=l;sf.querySelectorAll('#sf-layerSeg button').forEach(d=>d.classList.remove('on'));el.classList.add('on');buildStrip();renderView();}
function setZoom(z,el){zoomLevel=z;sel=0;sf.querySelectorAll('#sf-zoomSeg button').forEach(d=>d.classList.remove('on'));el.classList.add('on');cpClose();buildStrip();renderView();flash('已切换范围：'+({Film:'全片',Act:'幕级',Scene:'场景级',Beat:'节拍',Shot:'镜头级'}[z]||z));}

/* Timeline cut dropdown: pointer behavior and menu ownership stay shared; keyboard uses a roving item. */
const tlname=sf.querySelector('#sf-tlname'),tlmenu=sf.querySelector('#sf-tlmenu');
tlname.tabIndex=0;tlname.setAttribute('role','button');tlname.setAttribute('aria-haspopup','menu');
tlname.setAttribute('aria-controls','sf-tlmenu');tlname.setAttribute('aria-expanded','false');
tlmenu.setAttribute('role','menu');tlmenu.setAttribute('aria-labelledby','sf-tlnameLabel');tlmenu.setAttribute('aria-hidden','true');
let tlFocusFrame=0,tlOpenVersion=0;
const tlItems=()=>[...tlmenu.querySelectorAll('[role="menuitemradio"]')];
function setCutLabel(){sf.querySelector('#sf-tlnameLabel').textContent=VNAME[ver];}
function buildTlMenu(){
  tlmenu.innerHTML=VKEYS.map((k,i)=>`<div class="mi ${k===ver?'on':''}" role="menuitemradio" tabindex="${k===ver?0:-1}" aria-checked="${k===ver}" data-sf-call="pickTl" data-value="${i}">${VNAME[k]}${CUTS[k].deliverableOf?' · deliverable of A':''}<span class="dot" aria-hidden="true"></span></div>`).join('');
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

function cutTo(i){i=Math.max(0,Math.min(VKEYS.length-1,i)); if(VKEYS[i]===ver){return;}
  vi=i; ver=VKEYS[vi]; sel=0; setCutLabel(); buildStrip(); renderView();
  cpClose();playback.time=0;flash('已载入剪辑：'+VNAME[ver]);}
/* ---- Create: scope-aware browser with selectable elements ---- */
/* the context panel is always bound to whatever the browser is showing: when the timeline
   scrubs the browser to another shot / group, rebind activeSel to it before (re)rendering.
   (script layer keeps its own selScript binding; a closed panel has nothing to bind) */
function syncActiveSel(){
  if(!sf.querySelector('.browser.panel-open')||layer==='script'||activeSel?.type==='clip')return;
  const s=curArr()[sel];if(!s)return;
  activeSel=zoomLevel==='Shot'?{type:'shot',shotId:s.id,shotIdx:cutShots().findIndex(x=>x.id===s.id)}:{type:'unit',unit:s};
}
const TAKES=Object.fromEntries(SHOT_LIST.map(s=>[s.id,[{id:s.id+'-source',shotId:s.id,picture:s.picture,kind:'source-still',label:'源静帧',framing:'center',scale:100},...(s.picture?[{id:s.id+'-study',shotId:s.id,picture:s.picture,kind:'framing-study',sameSource:true,label:'备选构图研究 · 同源静帧',framing:'40% center',scale:115}]:[])]]));
const selectedTakes=Object.fromEntries(SHOT_LIST.map(s=>[s.id,TAKES[s.id][0].id]));
let playback={running:false,time:0,last:0,raf:0};
function stopPlayback(){playback.running=false;cancelAnimationFrame(playback.raf);playback.raf=0;}
function playerPaint(){const shots=recordShots(),total=duration(shots),t=Math.min(playback.time,total),s=shots.find(s=>t<s.start+s.dur)||shots[shots.length-1];const picture=sf.querySelector('#sf-playerPicture');if(!picture)return;picture.style.background=s.g;picture.dataset.shotId=s.id;sf.querySelector('#sf-playerCaption').textContent=s.n+' · '+tc(t)+' / '+tc(total);sf.querySelector('#sf-playerSeek').value=t;sf.querySelector('#sf-playButton').textContent=playback.running?'暂停静帧预览':'播放静帧剪辑';}
function togglePlayback(){if(playback.running){stopPlayback();playerPaint();return;}if(playback.time>=duration(cutShots()))playback.time=0;playback.running=true;playback.last=performance.now();playerPaint();const tick=now=>{if(!playback.running||!sf.querySelector('#sf-playerPicture')){stopPlayback();return;}playback.time+=(now-playback.last)/1000;playback.last=now;if(playback.time>=duration(cutShots()))stopPlayback();playerPaint();if(playback.running)playback.raf=requestAnimationFrame(tick);};playback.raf=requestAnimationFrame(tick);}
function playerHTML(){playback.time=0;return `<div class="cut-player" data-cut="${ver}"><div class="player-picture" id="sf-playerPicture" style="background:${cutShots()[0].g}"></div><div class="player-controls"><button type="button" id="sf-playButton" data-sf-call="togglePlayback">播放静帧剪辑</button><input id="sf-playerSeek" type="range" min="0" max="${duration(cutShots())}" value="0" step="0.01" aria-label="静帧剪辑进度"><span id="sf-playerCaption">${cutShots()[0].n} · ${tc(0)} / ${tc(duration(cutShots()))}</span></div><p class="shot-hint">定时静帧预览，无视频或音频渲染</p>${CUTS[ver].deliverableOf?'<p class="shot-hint">Festival Master E · deliverable of Picture Lock A</p>':''}</div>`;}
function chooseTake(id){const s=curArr()[sel],take=TAKES[s.id]?.find(t=>t.id===id);if(!take)return;selectedTakes[s.id]=id;renderView();}
function renderView(){
 const b=sf.querySelector('#sf-bview');if(!b)return;stopPlayback();syncActiveSel();
 if(track!=='video'&&selClip){const c=selClip;const sh=BY_ID[c.shotIds[0]];b.innerHTML=`<div class="shot-stage clip-detail" data-clip-id="${c.id}"><div class="t">${esc(c.text)}</div><div class="s">${tc(c.start)} · ${c.dur}s</div>${c.kind==='aud'?`<div class="audio-preview">${miniWave(c.start+1,45)}</div><p class="shot-hint">音频提示记录，无音频渲染</p>`:`<div class="shot-frame" data-sf-call="clipPreviewClick"><div class="g" style="background:${sh.g}"></div><div class="clip-overlay">${esc(c.text)}</div></div>`}</div>`;}
 else if(layer==='script'){b.innerHTML=scriptHTML();if(activeSel?.scriptId)b.querySelectorAll('[data-sf-call=selScript]').forEach(e=>e.classList.toggle('on',e.dataset.value===activeSel.scriptId));}
 else if(zoomLevel==='Film'&&layer==='movie'){b.innerHTML=playerHTML();}
 else if(zoomLevel==='Shot'){
  const sh=cutShots()[sel],idx=sel,take=TAKES[sh.id].find(t=>t.id===selectedTakes[sh.id])||TAKES[sh.id][0];
  const media=layer==='storyboard'?sbBig(sh):`<div class="g" style="background:${sh.g};background-position:${take.framing};background-size:${take.scale}% auto"></div>`;
  b.innerHTML=`<div class="shot-stage" data-shot-id="${sh.id}"><div class="shot-frame ${activeSel?.shotId===sh.id?'on':''}" data-sf-call="selShot" data-value="${idx}">${media}</div><div class="shot-meta"><div class="t">${sh.n} · ${tc(recordShots()[sel].start)}</div><div class="s">${sh.desc} · ${sh.d}</div></div>${layer==='movie'?`<p class="shot-hint">静帧构图研究，非视频备选条次</p><div class="take-list">${TAKES[sh.id].map(t=>`<button type="button" class="take-option ${t.id===take.id?'on':''}" aria-pressed="${t.id===take.id}" data-sf-call="chooseTake" data-value="${t.id}"><span class="take-thumb" style="background:${sh.g};background-position:${t.framing};background-size:${t.scale}% auto"></span><span>${t.label}</span></button>`).join('')}</div>`:'<div class="shot-hint">点击画面查看提示词和参数</div>'}</div>`;
 }else{
  const u=curArr()[sel];const tiles=u.shotIds.map(id=>{const sh=BY_ID[id],idx=cutShots().findIndex(s=>s.id===id);return `<div class="unit-tile" data-shot-id="${id}" data-sf-call="selShot" data-value="${idx}"><div class="unit-thumb">${layer==='storyboard'?sbArt(sh):`<div class="g" style="background:${sh.g}"></div>`}<span class="n">${sh.n} · ${tc(recordShots()[idx].start)}</span></div><div class="unit-cap"><div class="t">${sh.n}</div><div class="s">${sh.desc}</div></div></div>`;}).join('');
  b.innerHTML=`<div class="unit-view" data-unit-id="${u.id}"><div class="unit-head" data-sf-call="selUnit"><span class="scope-tag">${zoomLevel}</span><span class="name">${u.n}</span><span class="sub">${u.f}</span></div><div class="unit-grid">${tiles}</div></div>`;
 }
 b.scrollTop=0;if(sf.querySelector('.browser.panel-open'))updateCtx();
}
function scriptHTML(){const u=curArr()[sel],members=memberShots(u).map(s=>s.id);
 if(zoomLevel==='Film')return `<div class="script" data-script-scope="Film"><div class="sl">STATIC · ${VNAME[ver]} · ${duration(cutShots())}s</div><p class="selel" data-sf-call="selUnit">${LOG_LINE}</p></div>`;
 const visible=scriptFor(members),sceneIds=[...new Set(memberShots(u).map(s=>s.scene))];
 // Headings occur once per location, even when a shot-specific view contains just one line.
 const content=sceneIds.map(scene=>{const entries=visible.filter(e=>e.type!=='scene'&&e.shots.some(id=>members.includes(id)&&BY_ID[id].scene===scene));return `<div class="selel head" data-sf-call="selScript" data-type="scene" data-value="${scene}">${SCENES[scene].slug}</div>`+entries.map(e=>{const covered=e.shots.filter(id=>CUTS[ver].shotIds.includes(id)&&members.includes(id));return `<div class="script-element" data-script-id="${e.id}">${e.speaker?`<div class="cue">${CHAR_DB[e.speaker].name.toUpperCase()}</div>${e.paren?`<div class="paren">${e.paren}</div>`:''}`:''}<p class="selel ${e.type==='dialogue'?'dlg':''}" data-sf-call="selScript" data-type="${e.type}" data-value="${e.id}" data-shot-ids="${covered.join(',')}">${esc(e.text)} <small class="coverage">${covered.map(id=>BY_ID[id].n).join(', ')}</small></p></div>`;}).join('');}).join('');
 return `<div class="script" data-script-scope="${zoomLevel}"><div class="sl">STATIC · ${u.n} · ${u.d}</div>${content}</div>`;
}

/* ---- selection → context panel ---- */
let activeSel=null;
function openPanel(){const br=sf.querySelector('#sf-browser');if(br)br.classList.add('panel-open');}
function cpClose(){selClip=null;sf.querySelectorAll('.clip.sel,.cp-sec.sel').forEach(c=>c.classList.remove('sel'));sf.querySelectorAll('.lane,.lh').forEach(c=>c.style.height='');const br=sf.querySelector('#sf-browser');if(br)br.classList.remove('panel-open');activeSel=null;
  sf.querySelectorAll('#sf-bview .on').forEach(x=>x.classList.remove('on'));
  cvClearPill();cvCopilot(false);}   // deselect → drop the @tag and the bar's shadow (same as Explore)
/* clicking empty space ANYWHERE in the browser region (incl. the wide blank gutters either side of the
   centred reading column, which live in .browser but outside #sf-bview) closes the panel — but not when the
   click lands on a selectable element or inside the context panel itself */
(function(){const br=sf.querySelector('#sf-browser');const bv=sf.querySelector('#sf-bview');if(!br)return;
  br.addEventListener('click',e=>{
    if(e.target.closest('.selel,.shot-frame,.unit-tile,.unit-head,.cpanel,.cut-player,.take-list'))return;
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
function selScript(type,id,el){clearSel();if(el)el.classList.add('on');const e=SCRIPT.find(e=>e.id===id);if(!e)return;
 const visibleIds=el?.dataset.shotIds?.split(',')||e.shots;const members=cutShots().filter(s=>e.shots.includes(s.id)&&visibleIds.includes(s.id));if(!members.length)return;
 const label=(e.speaker?CHAR_DB[e.speaker].name+' · ':'')+e.text;const unit=makeUnit(e.id,label,members,(e.speaker?CHAR_DB[e.speaker].name+': ':'')+e.text);if(e.speaker)unit.chars=[e.speaker];
 activeSel={type:'unit',unit,label,scriptType:type,scriptId:id};openPanel();cvSetPill((e.speaker?CHAR_DB[e.speaker].name+' · ':'')+members.map(s=>s.n).join(', '));cvCopilot(true);updateCtx();
 const at=curArr().findIndex(u=>memberShots(u).some(s=>s.id===members[0].id));if(at>=0)scrollToShot(at);
}
function selShot(i,el){const sh=cutShots()[i];if(!sh)return;
 if(sf.querySelector('.browser.panel-open')&&activeSel?.type==='shot'&&activeSel.shotId===sh.id){mediaPreview(layer==='storyboard'?sbBg(sh):sh.g,sh.n+' · '+sh.desc,layer==='storyboard'?'board':'shot');return;}
 clearSel();if(el)el.classList.add('on');activeSel={type:'shot',shotId:sh.id,shotIdx:i};openPanel();cvSetPill(sh.n+' · '+sh.desc);cvCopilot(true);if(zoomLevel==='Shot'){sel=i;scrollToShot(i);updateHero();}updateCtx();
}
function selUnit(el){clearSel();if(el)el.classList.add('on');const u=curArr()[sel];if(!u)return;activeSel={type:'unit',unit:u,label:zoomLevel+' · '+u.n};openPanel();cvSetPill(u.n+' · '+u.f);cvCopilot(true);updateCtx();}

/* visual helpers — borderless, app-palette */
function refThumb(name,label,inner,pg,pk){return `<div class="ref-tile"><div class="ref-thumb" data-pg="${pg||''}" data-pc="${name} · ${label}" data-pk="${pk||''}">${inner}<div class="ref-name">${name}</div></div></div>`;}
function thGrad(g){return `<div class="g" style="background:${g}"></div>`;}
function charThumb(c){return refThumb(CHAR_DB[c].name,'Character',thGrad(CHAR_DB[c].sheet),CHAR_DB[c].sheet,'char');}
function sceneThumb(sceneId){const scene=SCENES[sceneId];return refThumb(scene.set,'Location',thGrad(scene.grad),scene.grad,'scene');}
function styleThumb(){return refThumb('CRT Lookbook','Style',thGrad(STYLE_REF.grad),STYLE_REF.grad,'style');}
function storyboardThumb(s){return refThumb(s.n,'Storyboard',sbArt(s),sbBg(s),'board');}

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
function promptFor(s){const cs=s.cast.map(c=>CHAR_DB[c].name).join(' & ')||'No on-screen cast';return `<span class="tok">${esc(s.desc)}</span> · STATIC · ${s.format}<br><b>${cs}</b><br>${SCENES[s.scene].slug}<br>${s.size} · ${s.lens} · ${s.move}<br>${esc(s.desc)}. ${SCENES[s.scene].textures}. Generated still; use the look target, not a claimed camera capture.`;}
function updateCtx(){const body=sf.querySelector('#sf-cpBody');if(!body)return;if(!activeSel){body.innerHTML='<div class="cp-text">选择镜头、场景组或剧本文字，查看它的全部素材。</div>';return;}
 if(activeSel.type==='clip'){const c=activeSel.clip;body.innerHTML=sec('素材详情','<div class="cp-text">'+esc(c.text)+'</div>')+sec('覆盖范围',rows([['入点',tc(c.start)],['长度',c.dur+'s'],['镜头',c.shotIds.map(id=>BY_ID[id].n).join(', ')]]))+sec('预览说明','<div class="cp-text">'+(c.kind==='aud'?'音频提示记录，无音频渲染':'图形和字幕提示记录')+'</div>');return;}
 if(activeSel.type==='shot'){const s=BY_ID[activeSel.shotId]||cutShots()[activeSel.shotIdx];body.innerHTML=shotAll(s);return;}body.innerHTML=unitAll(activeSel.unit);
}
function shotAll(s){const chars=s.cast,scene=SCENES[s.scene],record=recordShots().find(x=>x.id===s.id);return sec('提示词','<div class="cp-prompt">'+promptFor(s)+'</div>')
 +sec('覆盖范围',rows([['镜头',s.n],['入点',tc(record?.start||0)],['长度',s.d],['画幅',s.format]]))
 +sec('参考素材','<div class="ref-grid">'+chars.map(charThumb).join('')+sceneThumb(s.scene)+storyboardThumb(s)+styleThumb()+'</div>')
 +sec('演员',chars.length?rows(chars.map(c=>[CHAR_DB[c].name,CHAR_DB[c].voice])):'<div class="cp-text">无画内角色</div>')
 +sec('剧本台词','<div class="cp-text">'+esc(scriptText([s.id])).replace(/\n/g,'<br>')+'</div>')
 +sec('布景与道具','<div class="cp-text">'+scene.slug+'<br>'+scene.textures+'<br>'+s.props.join(' · ')+'</div>')
 +sec('镜头与调色',rows([['景别',s.size],['镜头焦距',s.lens],['运镜',s.move],['视觉目标',STYLE_REF.rig],['调色',STYLE_REF.grade]]));}
function unitAll(u){const members=memberShots(u),chars=u.chars||[],scenes=[...new Set(members.map(s=>s.scene))];return sec('内容大纲','<div class="cp-text">'+esc(u.line)+'</div>')
 +sec('覆盖范围',rows([['镜头数',String(members.length)],['镜头',members.map(s=>s.n).join(', ')],['长度',duration(members)+'s']]))
 +sec('演员',chars.length?'<div class="ref-grid">'+chars.filter(c=>CHAR_DB[c].sheet).map(charThumb).join('')+'</div>'+rows(chars.map(c=>[CHAR_DB[c].name,CHAR_DB[c].voice])):'<div class="cp-text">无画内角色</div>')
 +sec('布景','<div class="ref-grid">'+scenes.map(sceneThumb).join('')+'</div>')
 +sec('布景与道具','<div class="cp-text">'+scenes.map(id=>SCENES[id].slug+'<br>'+SCENES[id].textures).join('<br>')+'<br>'+[...new Set(members.flatMap(s=>s.props))].join(' · ')+'</div>')
 +sec('摄影参考',rows([['视觉目标',STYLE_REF.rig],['画幅','16:9'],['光线',STYLE_REF.light],['调色',STYLE_REF.grade]]));}

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
  pushChat('user',esc(v),true);
  setTimeout(()=>{const target=activeSel?.type==='shot'?BY_ID[activeSel.shotId]?.n:activeSel?.unit?.n||curArr()[sel]?.n||'STATIC';
    let r=`Local sample only. Selected <b>${esc(target)}</b>. No generation or edit was run.`;
    const cutMatch=v.match(/(?:cut|trailer|teaser)\s*([a-e])\b/i);const key=cutMatch?cutMatch[1].toUpperCase():/trailer/i.test(v)?'C':/teaser/i.test(v)?'D':ver;
    if(/cut|trailer|teaser|duration|running time/i.test(v))r=`<b>${VNAME[key]}</b>: ${cutShots(key).map(s=>s.n).join(', ')}; <b>${duration(cutShots(key))} seconds</b>.${CUTS[key].deliverableOf?' Deliverable of Picture Lock A.':''} Timed still preview only.`;
    else if(/take|more|variant|option|angle|grade|dark|cold/i.test(v)){
      const selectedIds=activeSel?.type==='shot'?[activeSel.shotId]:activeSel?.type==='unit'?activeSel.unit.shotIds:!activeSel&&zoomLevel==='Shot'?[cutShots()[sel].id]:[];
      const shot=selectedIds.length===1?BY_ID[selectedIds[0]]:null;
      if(shot){const takes=TAKES[shot.id],study=takes.find(t=>t.kind==='framing-study');
        r=shot.picture?`<b>${shot.n}</b>: ${takes.length} available still record${takes.length===1?'':'s'} at Shot / Footage — source still${study?' and same-source framing study':''}. ${study?'A study is not alternate motion footage. ':''}No generation or grading was run.`
          :`<b>${shot.n}</b> is black. It has one black source record, no picture and no alternate framing study. No generation or grading was run.`;
      }else r=`<b>${esc(target)}</b>: select one shot at Shot / Footage to inspect its actual still records. No generation or grading was run.`;
    }
    pushChat('bot',r,true);
  },700);}
let ft;function flash(html){const r=sf.querySelector('#sf-reply');r.innerHTML=html;r.classList.add('show');clearTimeout(ft);ft=setTimeout(()=>r.classList.remove('show'),3600);}

// CSS owns the editable input height.

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

}

const cinputEl = sf.querySelector('#sf-cinput');
if (cinputEl) {
  cinputEl.addEventListener('input', checkInputText);
  cinputEl.addEventListener('keyup', e => {
    checkInputText();
  });
  cinputEl.addEventListener('focus', () => {
    if (typeof startLogStream === 'function') startLogStream();
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
 {r:'bot',t:'The sample contains <b>12 shots / 45 seconds</b>, nested Film / Act / Scene / Beat / Shot scopes, a lined script and production references.'},
 {r:'user',t:'The family wide needs to feel ritualistic. Keep them dead-center on the sofa.'},
 {r:'bot',t:'<b>Shot 2</b> is the symmetrical family wide with Pete and Donna. The character-consistency board is an Explore reference; no generation was run.'},
 {r:'user',t:'Keep the transformation quiet rather than monstrous.'},
 {r:'bot',t:'<b>Shot 5</b> is Pete’s cheek turning to wool. The VFX breakdown remains a planning document, not a shot or a background plate.'},
 {r:'user',t:'Show the reveal options.'},
 {r:'bot',t:'<b>Shot 9</b> has a circled source still and a same-source framing study at Shot / Footage. These are not rendered alternate video takes.'},
 {r:'user',t:'Show the 15-second trailer.'},
 {r:'bot',t:'<b>Trailer C</b>: Joe wake-up (1), morph detail (5), broken CRT (7), then the white street (9), <b>15 seconds</b>. Switch cuts with the timeline name. Festival Master E is a deliverable of Picture Lock A.'}
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
    renderView();
    requestAnimationFrame(()=>{layoutStrip();scrollToShot(sel,true);updateHero();});
  }
}
function startLogStream(){renderChat(false);}   // on copilot focus → show the thread
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
    UX.blur(sf);
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
let cvPan={x:0,y:0}, cvScale=1, cvSelId=null, cvFlt='all', cvInited=false,cvUserMoved=false;
let cvLastWidth=sf.clientWidth;

// Seed material — "STATIC" exploration (tags: char | mood | visual | note)
const PIPELINE=['Seed','Script','Breakdown','Bible','Casting','Locations','Lookbook and colour script','Storyboard','Shot list','Props and continuity','VFX breakdown','Takes','Edit','Picture lock','VFX finals','Sound','Grade','Master QC'];
const CV_ITEMS=[
 {id:'n1',type:'note',tag:'note',title:'Seed · Logline',body:LOG_LINE,phase:'Seed'},
 {id:'pitch',type:'img',tag:'visual',title:'Pitch Deck Cover',g:bg('pitch-deck-cover.jpg'),phase:'Seed'},
 {id:'n7',type:'note',tag:'note',title:'STATIC · Lined Script',body:scriptText(SHOT_LIST.map(s=>s.id)),phase:'Script'},
 {id:'breakdown',type:'img',tag:'visual',title:'Script Breakdown',g:bg('script-breakdown-board.jpg'),phase:'Breakdown'},
 {id:'i2',type:'img',tag:'visual',title:'Production Bible',g:bg('production-bible-spread.jpg'),phase:'Bible'},
 {id:'consistency',type:'img',tag:'char',title:'Character Consistency',g:bg('character-consistency-board.jpg'),phase:'Bible'},
 {id:'i3',type:'img',tag:'char',title:'Casting Contact Sheet',g:bg('casting-contact-sheet.jpg'),phase:'Casting'},
 {id:'i4',type:'img',tag:'visual',title:'Location Scout Board',g:bg('location-scout-board.jpg'),phase:'Locations'},
 {id:'i5',type:'img',tag:'mood',title:'Lookbook · Cinematography',g:bg('lookbook-camera-board.jpg'),phase:'Lookbook and colour script'},
 {id:'i6',type:'img',tag:'mood',title:'Colour Script',g:bg('color-script-strip.jpg'),phase:'Lookbook and colour script'},
 {id:'i7',type:'img',tag:'visual',title:'Storyboard Wall',g:bg('storyboard-wall.jpg'),phase:'Storyboard'},
 {id:'i8',type:'img',tag:'visual',title:'Shot List',g:bg('shot-list-board.jpg'),phase:'Shot list'},
 {id:'i13',type:'img',tag:'visual',title:'Props and Continuity',g:bg('props-continuity-board.jpg'),phase:'Props and continuity'},
 {id:'i11',type:'img',tag:'visual',title:'VFX Breakdown · planning',g:bg('vfx-breakdown-board.jpg'),phase:'VFX breakdown'},
 {id:'i9',type:'img',tag:'visual',title:'Takes · reference contact sheet',g:bg('video-takes-grid.jpg'),phase:'Takes'},
 {id:'i12',type:'img',tag:'visual',title:'Edit Timeline',g:bg('editing-timeline-board.jpg'),phase:'Edit'},
 {id:'lock',type:'note',tag:'note',title:'Picture Lock A',body:cutShots('A').map(s=>s.n).join(' → ')+'\n'+duration(cutShots('A'))+'s. The film is a timed still preview, not rendered motion footage.',phase:'Picture lock'},
 {id:'finals',type:'note',tag:'note',title:'VFX Finals · sample status',body:'Shot 10 is the flock composite. It is not an unaltered background plate. No VFX render was run in this sample.',phase:'VFX finals'},
 {id:'i10',type:'img',tag:'visual',title:'Sound Design Map',g:bg('sound-design-board.jpg'),phase:'Sound'},
 {id:'grade',type:'note',tag:'note',title:'Grade · look target',body:STYLE_REF.grade+'\nReference only; this UI does not grade the stills.',phase:'Grade'},
 {id:'i14',type:'img',tag:'visual',title:'Master QC · reference board',g:bg('final-master-qc-board.jpg'),phase:'Master QC'},
 {id:'n2',type:'note',tag:'char',title:'Joe',body:'Sixteen. Sleep-deprived, observant. Confusion becomes protection, then recognition.',phase:'Bible'},
 {id:'n3',type:'note',tag:'char',title:'Pete & Donna',body:'Parents as almost-normal presences. Their horror is compliance, not aggression.',phase:'Bible'},
 {id:'n4',type:'note',tag:'note',title:'Locations',body:Object.values(SCENES).map(s=>s.slug+'\n'+s.textures).join('\n\n'),phase:'Locations'},
 {id:'n5',type:'note',tag:'note',title:'Look Target · 16:9',body:STYLE_REF.rig+'\n'+STYLE_REF.light,phase:'Lookbook and colour script'},
 {id:'n6',type:'note',tag:'note',title:'Core Contrast',body:'The broadcast says the world is fine; every image says the opposite. The street reveal is a fact that has been waiting.',phase:'Seed'},
 {id:'n8',type:'note',tag:'note',title:'Sound Spine',body:SOURCE_TRACKS.filter(c=>c.kind==='aud').map(c=>c.text).join('\n'),phase:'Sound'},
 {id:'n9',type:'note',tag:'note',title:'Pipeline Structure',body:PIPELINE.join(' → '),phase:'Seed'},
 {id:'workflow',type:'img',tag:'visual',title:'Workflow Overview · reference',g:bg('workflow-overview-board.jpg'),phase:'Seed'},
 {id:'seedboard',type:'img',tag:'visual',title:'Story Seed Board',g:bg('story-seed-board.jpg'),phase:'Seed'}
].map((it,order)=>({...it,order})).sort((a,b)=>PIPELINE.indexOf(a.phase)-PIPELINE.indexOf(b.phase)||a.order-b.order)
 .map(({order,...it},i)=>({...it,x:-860+(i%6)*360,y:-330+Math.floor(i/6)*290}));

const CV_TAGN={char:'Character',mood:'Mood Board',visual:'Visual Ref',note:'Note'};

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
      `<div class="ci-b" spellcheck="false" data-ph="输入一个想法…">${esc(it.body||'')}</div>`;
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
  cvUserMoved=true;
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
    const mv=ev=>{if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)>4){moved=true;cvUserMoved=true;el.classList.remove('zoom');}
      it.x=ox+(ev.clientX-sx)/cvScale; it.y=oy+(ev.clientY-sy)/cvScale;
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
  const mv=ev=>{panned=true;cvUserMoved=true;cvPan.x=ox+(ev.clientX-sx);cvPan.y=oy+(ev.clientY-sy);cvApply();};
  const up=ev=>{if(!panned&&ev.type!=='pointercancel'&&e.pointerType==='touch')cvDeselect();cvVp.classList.remove('grabbing');document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
});
cvVp.addEventListener('wheel',e=>{
  e.preventDefault();cvUserMoved=true;
  if(e.ctrlKey||e.metaKey){
    const r=cvVp.getBoundingClientRect(), mx=e.clientX-r.left, my=e.clientY-r.top;
    const cx=(mx-cvPan.x)/cvScale, cy=(my-cvPan.y)/cvScale;
    cvScale=Math.min(2.5,Math.max(0.1,cvScale*Math.exp(-e.deltaY*0.0015)));
    cvPan.x=mx-cx*cvScale; cvPan.y=my-cy*cvScale;
  }else{cvPan.x-=e.deltaX; cvPan.y-=e.deltaY;}
  cvApply();
},{passive:false});

function cvZoom(factor){
  cvUserMoved=true;
  const r=cvVp.getBoundingClientRect(),mx=r.width/2,my=r.height/2;
  const next=Math.min(2.5,Math.max(.1,cvScale*factor));
  cvPan.x=mx-(mx-cvPan.x)*next/cvScale;cvPan.y=my-(my-cvPan.y)*next/cvScale;
  cvScale=next;cvApply();
}
function cvFit(){
  cvUserMoved=false;
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
  const ci=sf.querySelector('#sf-cinput'); // UX owns the copilot history.
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
    case 'togglePlayback':togglePlayback();break;
    case 'chooseTake':chooseTake(v);break;
    case 'send':send();break;
    case 'cpClose':cpClose();break;
    case 'cvUnfocus':cvUnfocus();break;
  }
});
sf.addEventListener('input',e=>{if(e.target.id==='sf-playerSeek'){playback.time=Number(e.target.value);playerPaint();}});
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


function freezeData(value){if(value&&typeof value==='object'){Object.values(value).forEach(freezeData);Object.freeze(value);}return value;}
Object.defineProperty(window,'SF_DATA',{enumerable:true,configurable:false,get:()=>freezeData(JSON.parse(JSON.stringify({
 fps:24,format:'16:9',shots:SHOT_LIST,cuts:Object.fromEntries(VKEYS.map(k=>[k,{...CUTS[k],duration:duration(cutShots(k)),recordShots:recordShots(k),units:Object.fromEntries(['Film','Act','Scene','Beat','Shot'].map(level=>[level,unitsFor(level,k)]))}])),
 levels:Object.fromEntries(['Film','Act','Scene','Beat','Shot'].map(level=>[level,unitsFor(level,'A')])),
 tracks:Object.fromEntries(VKEYS.map(k=>[k,tracksFor(k)])),sourceTracks:SOURCE_TRACKS,script:SCRIPT,
 takes:Object.fromEntries(SHOT_LIST.map(s=>[s.id,TAKES[s.id].map(t=>({...t,selected:t.id===selectedTakes[s.id]}))])),
 pipeline:PIPELINE,explore:CV_ITEMS,selection:{cut:ver,layer,zoom:zoomLevel,track}
})))});

// Initial setup and event listeners execution
setCutLabel();buildStrip();renderView();renderChat(false);
cvInit();cvDeselect();   // default Explore → no @target until a block is clicked
requestAnimationFrame(()=>{layoutStrip();scrollToShot(sel,true);updateHero();});
window.addEventListener('resize',()=>{layoutStrip();scrollToShot(sel,true);updateHero();const width=sf.clientWidth;if(width!==cvLastWidth){cvLastWidth=width;if(!cvUserMoved&&sf.matches('.mode-explore'))cvFit();}});
})();
