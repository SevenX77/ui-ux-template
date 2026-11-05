/* Stack-neutral Story Forge data, schedules and geometry. Decision 0017.
   Measurements and rendering remain with the calling stack. */
const STORY_FORGE_FPS=24;
function freezeData(value){if(value&&typeof value==='object'){Object.values(value).forEach(freezeData);Object.freeze(value);}return value;}
function isOverflow(scrollWidth,clientWidth,scrollHeight,clientHeight){return scrollWidth>clientWidth+1||scrollHeight>clientHeight+1;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const bg=name=>`var(--sf-${name.replace(/\.jpg$/,'')}) center/cover no-repeat`;
function duration(members){return members.reduce((t,s)=>t+s.dur,0);}
function tc(t){const f=Math.round(t*STORY_FORGE_FPS);return [Math.floor(f/(STORY_FORGE_FPS*60*60)),Math.floor(f/(STORY_FORGE_FPS*60))%60,Math.floor(f/STORY_FORGE_FPS)%60,f%STORY_FORGE_FPS].map(n=>String(n).padStart(2,'0')).join(':');}
function createStoryForge(content,design){
 const DEFAULTS=freezeData({...content.defaults,view:{...content.defaults.view}}),LEVELS=freezeData(['Film','Act','Scene','Beat','Shot']);
 const LOG_LINE=content.logLine,SCENES=content.scenes,BEATS=content.beats,CHAR_DB=content.characters,STYLE_REF=content.look,SCRIPT=content.script,PIPELINE=content.pipeline,CV_TAGN=content.tagNames;
 const SHOT_LIST=content.shots.map(s=>({...s,act:s.num<=8?'act1':'act2',format:'16:9',panel:`sb-${String(s.num).padStart(2,'0')}`,n:`Shot ${s.num}`,f:s.desc,line:s.desc,d:`${s.dur}s`,g:s.picture?bg(s.picture+'.jpg'):'#000',loc:SCENES[s.scene].slug,set:SCENES[s.scene].set}));
 const BY_ID=Object.fromEntries(SHOT_LIST.map(s=>[s.id,s]));
 const CUTS=content.cuts,VKEYS=Object.keys(CUTS),VNAME=Object.fromEntries(VKEYS.map(k=>[k,CUTS[k].name]));
 const SHOTS=Object.fromEntries(VKEYS.map(k=>[k,CUTS[k].shotIds.map(id=>BY_ID[id])]));
function cutShots(k='A'){return SHOTS[k];}
function recordShots(k='A'){let t=0;return cutShots(k).map(s=>{const r={...s,start:t};t+=s.dur;return r;});}
function makeUnit(id,n,members,line){const dur=duration(members);return {id,n,dur,d:dur+'s',f:dur+'s · '+members.length+' shots',line,shotIds:members.map(s=>s.id),shots:members.map(s=>s.id),chars:[...new Set(members.flatMap(s=>s.cast))],g:members[0]?.g||'#000'};}
function unitsFor(level,k='A'){const shots=cutShots(k);if(level==='Shot')return shots;
 if(level==='Film')return [makeUnit('film',content.text.t3,shots,LOG_LINE)];
 const field={Act:'act',Scene:'scene',Beat:'beat'}[level];
 return [...new Set(shots.map(s=>s[field]))].map(id=>{const members=shots.filter(s=>s[field]===id);const n=level==='Act'?(id==='act1'?'Act I':'Act II'):level==='Scene'?SCENES[id].n:BEATS[id];const text=level==='Scene'?SCENES[id].slug:members.map(s=>s.desc).join('. ');return makeUnit(id,n,members,text);});
}
function memberShots(u){return u.shotIds?u.shotIds.map(id=>BY_ID[id]):[u];}
function sbBg(s){const sh=s?.shotIds?BY_ID[s.shotIds[0]]:s;return sh?bg(sh.panel+'.jpg'):bg('storyboard-source-sheet.jpg');}
function scriptFor(shotIds){return SCRIPT.filter(e=>e.shots.some(id=>shotIds.includes(id)));}
function scriptText(shotIds){return scriptFor(shotIds).map(e=>(e.speaker?CHAR_DB[e.speaker].name.toUpperCase()+' '+(e.paren||'')+'\n':'')+e.text).join('\n\n');}
// A strip thumbnail fits a few lines, so it shows what belongs to this unit alone, not a cue that spans its neighbours.
function ownScriptText(shotIds){return SCRIPT.filter(e=>e.shots.every(id=>shotIds.includes(id))).map(e=>(e.speaker?CHAR_DB[e.speaker].name.toUpperCase()+' ':'')+e.text).join(' ');}
 const SOURCE_TRACKS=[...SCRIPT.filter(e=>e.type==='dialogue'&&e.speaker!=='announcer').map(e=>({id:e.id,lane:'voice',kind:'aud',cls:'dial',shotIds:e.shots,speaker:e.speaker,text:CHAR_DB[e.speaker].name+': '+e.text})),...content.sourceCues,...SCRIPT.filter(e=>e.type==='dialogue').map(e=>({id:'sub-'+e.id,lane:'subtitles',kind:'sub',cls:'sub',shotIds:e.speaker==='announcer'?undefined:e.shots,start:e.speaker==='announcer'?0:undefined,end:e.speaker==='announcer'?23:undefined,text:CHAR_DB[e.speaker].name+': '+e.text,row:e.speaker==='announcer'?1:0}))];
function tracksFor(k='A'){const master=recordShots('A');return SOURCE_TRACKS.flatMap(c=>{let segments=[];recordShots(k).forEach(s=>{const source=master.find(m=>m.id===s.id);const a=c.shotIds?(c.shotIds.includes(s.id)?source.start:null):Math.max(source.start,c.start);const b=c.shotIds?source.start+s.dur:Math.min(source.start+s.dur,c.end);if(a!==null&&b>a)segments.push({...c,start:s.start+a-source.start,dur:b-a,shotId:s.id});});
 // Coalesce adjacent parts of one source cue; retain gaps when a cut changes its placement.
 return segments.reduce((out,c)=>{const last=out[out.length-1];if(last&&last.start+last.dur===c.start){last.dur+=c.dur;last.shotIds.push(c.shotId);}else out.push({...c,shotIds:[c.shotId]});return out;},[]);
 });}const TAKES=Object.fromEntries(SHOT_LIST.map(s=>[s.id,[{id:s.id+'-source',shotId:s.id,picture:s.picture,kind:'source-still',label:content.takeLabels[0],framing:'center',scale:100},...(s.picture?[{id:s.id+'-study',shotId:s.id,picture:s.picture,kind:'framing-study',sameSource:true,label:content.takeLabels[1],framing:'40% center',scale:115}]:[])]]));

 const bodies={n1:LOG_LINE,n7:scriptText(SHOT_LIST.map(s=>s.id)),lock:cutShots('A').map(s=>s.n).join(' → ')+'\n'+duration(cutShots('A'))+'s. The film is a timed still preview, not rendered motion footage.',grade:STYLE_REF.grade+'\nReference only; this UI does not grade the stills.',n4:Object.values(SCENES).map(s=>s.slug+'\n'+s.textures).join('\n\n'),n5:STYLE_REF.rig+'\n'+STYLE_REF.light,n8:SOURCE_TRACKS.filter(c=>c.kind==='aud').map(c=>c.text).join('\n'),n9:PIPELINE.join(' → ')};
 const CV_ITEMS=content.explore.map((it,order)=>({...it,...(it.bodyFrom?{body:bodies[it.bodyFrom]}:{}),order})).sort((a,b)=>PIPELINE.indexOf(a.phase)-PIPELINE.indexOf(b.phase)||a.order-b.order).map(({order,bodyFrom,...it},i)=>({...it,x:design('canvas-origin-x')+(i%design('canvas-columns'))*design('canvas-column-pitch'),y:design('canvas-origin-y')+Math.floor(i/design('canvas-columns'))*design('canvas-row-pitch')}));
 const SLOT_W=design('slot-width'),PX_PER_SEC=design('lane-px-per-second'),VIDEO_PAD=design('video-pad');
 const LANE_ROWS=Object.fromEntries(['voice','sound','music','subtitles','graphics'].map(id=>[id,design('lane-'+id+'-rows')]));
 const LANE_HEIGHTS=Object.fromEntries(Object.entries(LANE_ROWS).map(([id,rows])=>[id,rows*design('lane-row-height')]));
 function currentShot(t,k='A'){const shots=recordShots(k);return shots.find(s=>t<s.start+s.dur)||shots[shots.length-1];}
 function derivedSelection(t,level,k='A'){const id=currentShot(t,k).id;return Math.max(0,unitsFor(level,k).findIndex(u=>memberShots(u).some(s=>s.id===id)));}
 function unitStart(i,level,k='A'){return duration(unitsFor(level,k).slice(0,i));}
 function unitWidth(s){return memberShots(s).length*SLOT_W;}
 function videoTimeToX(t,shots=recordShots(),pad=VIDEO_PAD){const s=shots.find(s=>t<s.start+s.dur)||shots[shots.length-1];return pad+shots.indexOf(s)*SLOT_W+clamp((t-s.start)/s.dur,0,1)*SLOT_W;}
 function laneTimeToX(t,pad=VIDEO_PAD){return pad+t*PX_PER_SEC;}
 function xToTime(x,track,pad,k='A'){const shots=recordShots(k),p=Math.max(0,x-pad);if(track!=='video')return clamp(p/PX_PER_SEC,0,duration(shots));const i=Math.min(shots.length-1,Math.floor(p/SLOT_W));return clamp(shots[i].start+clamp((p-i*SLOT_W)/SLOT_W,0,1)*shots[i].dur,0,duration(shots));}
 function waveform(seed,n=design('wave-count')){return Array.from({length:n},(_,k)=>{const mix=design('wave-mix'),v=Math.abs(Math.sin(seed*design('wave-seed-a')+k*design('wave-step-a'))+Math.sin(seed*design('wave-seed-b')+k*design('wave-step-b'))*mix);return (design('wave-min')+v/(1+mix)*design('wave-range')).toFixed(0)+'%';});}
 function readingSchedule(k='A'){const visible=scriptFor(CUTS[k].shotIds),items=[],owned=new Set();recordShots(k).forEach(shot=>{const own=visible.filter(e=>!owned.has(e.id)&&e.shots.includes(shot.id)),total=own.reduce((n,e)=>n+e.text.length,0);let at=shot.start;own.forEach(e=>{owned.add(e.id);items.push({id:e.id,owner:shot.id,start:at});at+=shot.dur*e.text.length/total;});});return items;}
 function readingPosition(items,time,total){let i=items.length-1;while(i>0&&items[i].start>time)i--;const cur=items[i],next=items[i+1],span=(next?next.start:total)-cur.start;return {index:i,fraction:clamp(span>0?(time-cur.start)/span:0,0,1)};}
 function canvasZoom(view,factor,mx,my){const z=clamp(view.z*factor,design('canvas-scale-min'),design('canvas-scale-max'));return {x:mx-(mx-view.x)*z/view.z,y:my-(my-view.y)*z/view.z,z};}
 function canvasFit(boxes,width,height){const a=Math.min(...boxes.map(b=>b.x)),b=Math.min(...boxes.map(b=>b.y)),c=Math.max(...boxes.map(b=>b.x+b.w)),d=Math.max(...boxes.map(b=>b.y+b.h)),pad=design('canvas-fit-pad'),z=Math.min(design('canvas-fit-max'),Math.max(design('canvas-scale-min'),Math.min(width/(c-a+pad*2),height/(d-b+pad*2))));return {x:width/2-(a+(c-a)/2)*z,y:height/2-(b+(d-b)/2)*z,z};}
 function canvasCenter(item,width,height,view){return {x:width/2-(item.x+item.w/2)*view.z,y:height/2-(item.y+item.h/2)*view.z,z:view.z};}
 function dragScroll(x,left,right){const edge=design('drag-edge');return x<left+edge?-design('drag-speed')*clamp((left+edge-x)/edge,0,1):x>right-edge?design('drag-speed')*clamp((x-right+edge)/edge,0,1):0;}
 function magnifier(natural,start,pointer,scroll,left,wrapLeft,wrapRight){const scaled=natural*design('magnifier-height')/design('slot-height'),width=Math.min(scaled,wrapRight-wrapLeft),center=left+start-scroll+natural/2,x=clamp(center-width/2,wrapLeft,wrapRight-width),fraction=clamp((pointer-(left+start-scroll))/natural,0,1);return {width,left:x,shift:scaled>width?(scaled-width)*fraction:0};}
 function mentionCatalog(k='A'){return [...cutShots(k).map(s=>({key:'shot:'+s.id,name:s.n,detail:s.desc})),...Object.entries(CHAR_DB).map(([id,c])=>({key:'char:'+id,name:c.name,detail:content.renderLabels.character})),...Object.entries(SCENES).map(([id,s])=>({key:'location:'+id,name:s.set,detail:s.slug}))];}

 function reply(text,{selection,cut,zoom,index}){const templates=content.replyTemplates,format=(key,values={})=>templates[key].replace(/\{(\w+)\}/g,(_,k)=>values[k]??''),target=selection?.type==='shot'?BY_ID[selection.shotId]?.n:selection?.unit?.n||unitsFor(zoom,cut)[index]?.n||content.text.t3;
  const match=text.match(/(?:cut|trailer|teaser)\s*([a-e])\b/i),key=match?match[1].toUpperCase():/trailer/i.test(text)?'C':/teaser/i.test(text)?'D':cut;
  if(/cut|trailer|teaser|duration|running time/i.test(text))return format('cut',{cut:VNAME[key],shots:cutShots(key).map(s=>s.n).join(', '),duration:duration(cutShots(key)),deliverable:CUTS[key].deliverableOf?templates.deliverable:''});
  if(/take|more|variant|option|angle|grade|dark|cold/i.test(text)){const ids=selection?.type==='shot'?[selection.shotId]:selection?.type==='unit'?selection.unit.shotIds:!selection&&zoom==='Shot'?[cutShots(cut)[index].id]:[],shot=ids.length===1?BY_ID[ids[0]]:null;
   if(!shot)return format('pick',{target});if(!shot.picture)return format('black',{shot:shot.n});const takes=TAKES[shot.id],study=takes.some(t=>t.kind==='framing-study');return format('records',{shot:shot.n,count:takes.length,plural:takes.length===1?'':'s',study:study?templates.study:'',studyNote:study?templates.studyNote:''});}
  return format('local',{target});}

 // Numeric/data policy only. Adapters own measurements, state and conditional DOM writes.
 function initialTakes(){return Object.fromEntries(SHOT_LIST.map(s=>[s.id,TAKES[s.id][0].id]));}
 function timelineLayout(track,k=DEFAULTS.cut){const pad=track==='video'?VIDEO_PAD:design('lane-gutter')+design('lane-pad'),width=pad*2+(track==='video'?cutShots(k).length*SLOT_W:duration(cutShots(k))*PX_PER_SEC),labels=content.labels;return {pad,width,perfCount:Math.ceil(width/(design('perf-width')+design('perf-gap')))+2,lanes:track==='audio'?[['voice',labels.l0],['sound',labels.l1],['music',labels.l2]]:[['subtitles',labels.l3],['graphics',labels.l4]]};}
 function playheadScroll(x,left,width,scrollWidth,force=false){const inset=design('playhead-inset');return force||x<left+width*inset||x>left+width*(1-inset)?clamp(x-width*(force ? .5 : x<left+width*inset ? inset : 1-inset),0,scrollWidth-width):null;}
 function unitAtX(x,level,k=DEFAULTS.cut){let at=0;return unitsFor(level,k).findIndex(u=>{const a=at;at+=unitWidth(u);return x>=a&&x<at;});}
 function unitX(index,level,k,pad){return pad+unitsFor(level,k).slice(0,index).reduce((x,u)=>x+unitWidth(u),0);}
 function clipWaveform(start,n){return waveform(start+1,n);}
 function readingRoom(height){return height/2;}
 function readingTarget({scroll,viewportTop,height,currentTop,currentBottom,nextTop,fraction}){const end=nextTop??currentBottom,point=currentTop+(end-currentTop)*fraction;return scroll+point-viewportTop-height/2;}
 function readingScroll({scroll,target,was,offset,last,now,reduced}){const nextOffset=was?offset*Math.exp((last-now)/design('script-catchup')):reduced?0:scroll-target;return {offset:nextOffset,scroll:target+nextOffset};}
 function scriptSelectionScroll({scroll,top,bottom,height,viewportTop,viewportBottom,viewportHeight}){const clearance=design('script-clearance');return top<viewportTop+clearance||bottom>viewportBottom-clearance?scroll+(top-viewportTop-Math.max(clearance,(viewportHeight-height)/2)):null;}
 function monitorFit(height,infoHeight){const [w,h]=SHOT_LIST[0].format.split(':').map(Number);return Math.max(0,(height-infoHeight-design('monitor-clearance'))*w/h);}
 function mentionQuery(text){const match=text.match(/(?:^|\s)@([^\s@]*)$/);return match?match[1]:null;}
 function mentionMatches(query,k=DEFAULTS.cut){return mentionCatalog(k).filter(m=>(m.name+' '+m.detail).toLowerCase().includes(query.toLowerCase())).slice(0,design('mention-limit'));}
 function mentionPosition({caretLeft,caretTop,inputTop,barLeft,barBottom,barWidth}){return {left:clamp(caretLeft-barLeft,0,Math.max(0,barWidth-design('mention-width')-design('mention-inset'))),bottom:barBottom-(caretTop||inputTop)+design('mention-gap')};}
 function canvasTranslate(origin,dx,dy,scale=1){return {x:origin.x+dx/scale,y:origin.y+dy/scale};}
 function canvasWheelFactor(deltaY){return Math.exp(-deltaY*design('canvas-wheel-rate'));}
 function pickedShotIds(selection){if(!selection||selection.scriptId)return [];if(selection.type==='shot')return [selection.shotId];if(selection.unit)return memberShots(selection.unit).map(s=>s.id);return selection.clip?.shotIds||[];}
 function scriptSelection(type,id,visibleIds,k,level){const e=SCRIPT.find(e=>e.id===id);if(!e)return null;const ids=visibleIds||e.shots,members=cutShots(k).filter(s=>e.shots.includes(s.id)&&ids.includes(s.id));if(!members.length)return null;const label=(e.speaker?CHAR_DB[e.speaker].name+' · ':'')+e.text,unit=makeUnit(e.id,label,members,(e.speaker?CHAR_DB[e.speaker].name+': ':'')+e.text);if(e.speaker)unit.chars=[e.speaker];return {active:{type:'unit',unit,label,scriptType:type,scriptId:id},chipName:(e.speaker?CHAR_DB[e.speaker].name+' · ':'')+members.map(s=>s.n).join(', '),index:unitsFor(level,k).findIndex(u=>memberShots(u).some(s=>s.id===members[0].id))};}
 function snapshot(selection,selectedTakes,explore,pad){const {cut,layer,zoom,track,sel,time,running,activeSel,history}=selection;return freezeData(JSON.parse(JSON.stringify({
  fps:STORY_FORGE_FPS,format:SHOT_LIST[0].format,shots:SHOT_LIST,cuts:Object.fromEntries(VKEYS.map(k=>[k,{...CUTS[k],duration:duration(cutShots(k)),recordShots:recordShots(k),units:Object.fromEntries(LEVELS.map(level=>[level,unitsFor(level,k)]))}])),
  levels:Object.fromEntries(LEVELS.map(level=>[level,unitsFor(level,'A')])),tracks:Object.fromEntries(VKEYS.map(k=>[k,tracksFor(k)])),sourceTracks:SOURCE_TRACKS,script:SCRIPT,
  takes:Object.fromEntries(SHOT_LIST.map(s=>[s.id,TAKES[s.id].map(t=>({...t,selected:t.id===selectedTakes[s.id]}))])),pipeline:PIPELINE,explore,
  selection:{cut,layer,zoom,track,sel,time,running,shotId:currentShot(time,cut).id,activeSel,history},timeline:{slotWidth:SLOT_W,pxPerSec:PX_PER_SEC,pad,videoX:videoTimeToX(time,recordShots(cut),pad),laneX:laneTimeToX(time,pad),exampleVideoX:videoTimeToX(10.5,recordShots('A'),VIDEO_PAD),laneHeights:LANE_HEIGHTS}
 })));}

 return {fps:STORY_FORGE_FPS,DEFAULTS,LEVELS,initialTakes,timelineLayout,playheadScroll,unitAtX,unitX,clipWaveform,readingRoom,readingTarget,readingScroll,scriptSelectionScroll,monitorFit,isOverflow,mentionQuery,mentionMatches,mentionPosition,canvasTranslate,canvasWheelFactor,pickedShotIds,scriptSelection,snapshot,reply,LOG_LINE,SHOT_LIST,BY_ID,CUTS,VKEYS,VNAME,SHOTS,SCENES,BEATS,CHAR_DB,STYLE_REF,SCRIPT,SOURCE_TRACKS,TAKES,PIPELINE,CV_ITEMS,CV_TAGN,SLOT_W,PX_PER_SEC,VIDEO_PAD,LANE_ROWS,LANE_HEIGHTS,cutShots,recordShots,makeUnit,unitsFor,memberShots,sbBg,scriptFor,scriptText,ownScriptText,tracksFor,currentShot,derivedSelection,unitStart,unitWidth,videoTimeToX,laneTimeToX,xToTime,waveform,readingSchedule,readingPosition,canvasZoom,canvasFit,canvasCenter,dragScroll,magnifier,mentionCatalog};
}
export {createStoryForge,clamp,bg,duration,tc,STORY_FORGE_FPS,freezeData,isOverflow};
