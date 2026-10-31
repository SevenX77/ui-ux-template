/** Candidate measurement instrument. It does not implement production UX. */
export function installHoverTrace({selector,horizon=700,samples=[60,220]}){
  const target=document.querySelector(selector);
  if(!target)throw new Error('No trace target '+selector);
  const snapshot=()=>({hover:target.classList.contains('ux-hover'),state:target.getAttribute('data-state'),class:target.getAttribute('class')||'',connected:target.isConnected,sameTarget:document.querySelector(selector)===target});
  const raw={version:'native-dom-timeline-v1',selector,initial:snapshot(),input:null,
    operations:[],mutations:[],events:[],samples:[],frames:[],errors:[],sourceContract:'ux.js admit: class add -> paint -> ux:hover; rest event may linger'};
  const restore=[],restorationChecks=[],timers=[];let raf=0,done=false,resolve;
  const sameDescriptor=(a,b)=>!a&&!b||!!a&&!!b&&['value','get','set','writable','enumerable','configurable'].every(k=>a[k]===b[k]);
  const promise=new Promise(r=>resolve=r);
  const operation=(method,fn)=>{
    const beforeAt=performance.now(),before=snapshot();let value;
    try{value=fn();}catch(error){raw.errors.push({method,error:String(error)});throw error;}
    raw.operations.push({method,beforeAt,afterAt:performance.now(),before,after:snapshot()});return value;
  };
  function wrapMethod(object,name,shouldRecord=()=>true){
    const own=Object.getOwnPropertyDescriptor(object,name),native=object[name];
    if(typeof native!=='function'){raw.errors.push({method:name,error:'native method unavailable'});return;}
    const wrapped=function(...args){return shouldRecord(args)?operation(name,()=>native.apply(this,args)):native.apply(this,args);};
    try{Object.defineProperty(object,name,{configurable:true,writable:true,value:wrapped});
      restore.push(()=>own?Object.defineProperty(object,name,own):delete object[name]);
      restorationChecks.push({method:name,check:()=>sameDescriptor(Object.getOwnPropertyDescriptor(object,name),own)});}
    catch(error){raw.errors.push({method:name,error:String(error)});}
  }
  function wrapSetter(object,name){
    const own=Object.getOwnPropertyDescriptor(object,name);let p=object,descriptor;
    while(p&&!descriptor){descriptor=Object.getOwnPropertyDescriptor(p,name);p=Object.getPrototypeOf(p);}
    if(!descriptor?.get||!descriptor?.set){raw.errors.push({method:name,error:'native accessor unavailable'});return;}
    try{Object.defineProperty(object,name,{configurable:true,enumerable:descriptor.enumerable,
      get(){return descriptor.get.call(this);},set(value){return operation(name,()=>descriptor.set.call(this,value));}});
      restore.push(()=>own?Object.defineProperty(object,name,own):delete object[name]);
      restorationChecks.push({method:name,check:()=>sameDescriptor(Object.getOwnPropertyDescriptor(object,name),own)});}
    catch(error){raw.errors.push({method:name,error:String(error)});}
  }
  const list=target.classList;
  for(const name of ['add','remove','toggle','replace'])wrapMethod(list,name);
  wrapSetter(list,'value');wrapSetter(target,'className');
  wrapMethod(target,'setAttribute',args=>String(args[0]).toLowerCase()==='class');
  wrapMethod(target,'removeAttribute',args=>String(args[0]).toLowerCase()==='class');
  wrapMethod(target,'setAttributeNS',args=>String(args[1]).toLowerCase()==='class');
  wrapMethod(target,'removeAttributeNS',args=>String(args[1]).toLowerCase()==='class');
  function mutations(records){
    const at=performance.now();
    records.forEach((record,i)=>{
      const next=records.slice(i+1).find(r=>r.attributeName===record.attributeName);
      raw.mutations.push({attribute:record.attributeName,oldValue:record.oldValue,
        newValue:next?next.oldValue:target.getAttribute(record.attributeName),deliveredAt:at});
    });
  }
  const observer=new MutationObserver(mutations);
  observer.observe(target,{attributes:true,attributeOldValue:true,attributeFilter:['class','data-state']});
  const onCore=event=>{if(event.target===target)raw.events.push({type:event.type,at:performance.now(),eventTimeStamp:event.timeStamp,state:snapshot()});};
  target.addEventListener('ux:hover',onCore);target.addEventListener('ux:rest',onCore);
  function finish(){
    if(done)return;done=true;mutations(observer.takeRecords());observer.disconnect();
    cancelAnimationFrame(raf);timers.forEach(clearTimeout);
    target.removeEventListener('mouseover',onInput,true);target.removeEventListener('mouseout',onLeave,true);
    target.removeEventListener('ux:hover',onCore);target.removeEventListener('ux:rest',onCore);
    raw.endAt=performance.now();raw.final=snapshot();
    for(const fn of restore.reverse())try{fn();}catch(error){raw.errors.push({method:'restore',error:String(error)});}
    raw.restoration=restorationChecks.map(r=>({method:r.method,exact:r.check()}));
    resolve(raw);
  }
  const onLeave=event=>{if(!target.contains(event.relatedTarget))raw.events.push({type:'boundary-mouseout',at:performance.now(),state:snapshot()});};
  const onInput=event=>{
    if(raw.input||target.contains(event.relatedTarget))return;
    raw.input={eventTimeStamp:event.timeStamp,observedAt:performance.now(),trusted:event.isTrusted,state:snapshot(),visibility:document.visibilityState};
    samples.forEach(ms=>timers.push(setTimeout(()=>raw.samples.push({requestedMs:ms,at:performance.now(),...snapshot()}),ms)));
    const frame=()=>{if(done)return;raw.frames.push({at:performance.now(),...snapshot()});raf=requestAnimationFrame(frame);};
    raf=requestAnimationFrame(frame);timers.push(setTimeout(finish,horizon));
  };
  target.addEventListener('mouseover',onInput,true);target.addEventListener('mouseout',onLeave,true);
  window.__parityTracePromise=promise;window.__parityTraceFinish=finish;
  return {version:raw.version,initial:raw.initial,capabilityErrors:raw.errors};
}
const hoverIn=value=>String(value||'').split(/\s+/).includes('ux-hover');
export function analyzeHoverTrace(raw,{early=60,late=220}={}){
  const result={judgment:'unverified',pass:false,noHoverAt60:false,hoverBy220:false,reasons:[],evidence:{}};
  const gap=reason=>result.reasons.push(reason);
  if(raw.errors.length||!raw.restoration?.length||raw.restoration.some(r=>!r.exact))gap('instrument-capability-or-restoration-error');
  if(!raw.initial.connected||!raw.final.connected||!raw.final.sameTarget||raw.frames.some(f=>!f.connected||!f.sameTarget))gap('target-detached-or-replaced');
  if(!raw.input?.trusted||raw.input.visibility!=='visible')gap('untrusted-or-not-visible-input');
  if(raw.initial.hover||raw.input?.state.hover)gap('not-at-rest-before-entry');
  if(!raw.input)return {...result,reasons:[...result.reasons,'missing-real-mouseover']};
  const base=raw.input.eventTimeStamp;
  if(!Number.isFinite(base)||base>raw.input.observedAt+1)gap('unsupported-clock-origin');
  const on=raw.operations.filter(o=>!o.before.hover&&o.after.hover),off=raw.operations.filter(o=>o.before.hover&&!o.after.hover);
  const mutationTransitions=raw.mutations.filter(m=>m.attribute==='class'&&hoverIn(m.oldValue)!==hoverIn(m.newValue)).map(m=>hoverIn(m.newValue));
  const operationTransitions=raw.operations.filter(o=>o.before.hover!==o.after.hover).map(o=>o.after.hover);
  if(JSON.stringify(mutationTransitions)!==JSON.stringify(operationTransitions))gap('unwrapped-or-disagreeing-class-write');
  const events=raw.events.filter(e=>e.type==='ux:hover');
  if(on.length!==1)gap('missing-or-multiple-class-admission');
  if(events.length!==1)gap('missing-or-multiple-native-admission');
  if(raw.events.some(e=>e.type==='boundary-mouseout'))gap('pointer-left-before-trace-ended');
  if(events.some(e=>!e.state.hover||e.state.state!=='hover'))gap('event-class-state-disagreement');
  if(off.length||!raw.final.hover)gap('hover-not-continuous-through-deadline');
  result.evidence={input:raw.input,operationTransitions,mutationTransitions,
    admissionBounds:on[0]?{lowerMs:on[0].beforeAt-base,upperMs:on[0].afterAt-base}:null,
    nativeAdmissionMs:events[0]?events[0].at-base:null,
    samples:raw.samples.map(s=>({...s,elapsedMs:s.at-base})),
    maximumObservedForwardingDurationMs:Math.max(0,...raw.operations.map(o=>o.afterAt-o.beforeAt))};
  if(result.reasons.length)return result;
  const bounds=result.evidence.admissionBounds,eventMs=result.evidence.nativeAdmissionMs;
  if(eventMs<bounds.lowerMs||events[0].at<on[0].afterAt)gap('event-precedes-observed-class-write');
  if(bounds.upperMs<=early){result.judgment='fail';gap('early-activation');}
  else if(bounds.lowerMs<=early){gap('activation-interval-straddles-early-deadline');}
  else result.noHoverAt60=true;
  if(bounds.lowerMs>late){result.judgment='fail';gap('late-class-activation');}
  else if(bounds.upperMs>late){gap('activation-interval-straddles-late-deadline');}
  else result.hoverBy220=true;
  if(eventMs>late)gap('late-corroborating-event-needs-review');
  if(!result.reasons.length&&result.noHoverAt60&&result.hoverBy220){result.pass=true;result.judgment='pass';}
  return result;
}
export async function measureHoverTrace(page,{selector,pointSelector=selector,horizon=700}){
  const installed=await page.evaluate(installHoverTrace,{selector,horizon});
  let timer;
  try{
    const box=await page.locator(pointSelector).first().boundingBox();
    if(!box)throw new Error('No real pointer target '+pointSelector);
    await page.mouse.move(box.x+box.width/2,box.y+Math.min(12,box.height/2));
    const raw=await Promise.race([page.evaluate(()=>window.__parityTracePromise),new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error('Trace did not complete')),horizon+12000);
    })]);
    return {installed,raw,analysis:analyzeHoverTrace(raw)};
  }finally{clearTimeout(timer);await page.evaluate(()=>window.__parityTraceFinish?.());}
}
export async function settleIndicator(page,{host='#barT',timeout=12000}={}){
  return page.evaluate(async({host,timeout})=>{
    const root=document.querySelector(host),trace=[];let prior=null,stable=0;
    const start=performance.now();
    while(performance.now()-start<timeout){
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const indicator=root.querySelector(':scope > .seg-ind'),button=root.querySelector(':scope > button.on');
      if(!indicator||!button)throw new Error('Missing selector indicator/selected option');
      const read=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
      const i=read(indicator),b=read(button),aligned=['x','y','width','height'].every(k=>Math.abs(i[k]-b[k])<=1);
      const finite=document.getAnimations().some(a=>{
        const t=a.effect?.target,e=t instanceof Element?t:t?.element;
        return e&&(root.contains(e)||e.contains(root))&&a.playState==='running'&&Number.isFinite(a.effect.getComputedTiming().endTime);
      });
      const same=prior&&['x','y','width','height'].every(k=>Math.abs(i[k]-prior[k])<.01);
      stable=aligned&&same&&!finite?stable+1:0;prior=i;
      trace.push({elapsedMs:performance.now()-start,indicator:i,button:b,aligned,finite,stable});
      if(stable>=6)return {settled:true,elapsedMs:performance.now()-start,indicator:i,button:b,trace};
    }
    return {settled:false,elapsedMs:performance.now()-start,trace};
  },{host,timeout});
}
