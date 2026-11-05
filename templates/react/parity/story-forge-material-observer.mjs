/** r9 material diagnostic: exact frozen572 workflow + a scoped Node Page observer.
 * API only. The caller owns Page/browser/context creation and closure.
 * No browser launches, native UI helpers or application lifecycle are copied here.
 */
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const FROZEN_SHA='572e1dbacd460efa6c0387072b077df5244c1f67b1dee2beee162d89a8e284c7';
const frozenURL=new URL('./story-forge-supplement.mjs',import.meta.url);
const sha=value=>createHash('sha256').update(value).digest('hex');
const errorData=e=>({name:e?.name||'Error',message:String(e?.message||e),stack:e?.stack});
const descData=d=>d?{configurable:d.configurable,enumerable:d.enumerable,writable:d.writable,kind:'value'in d?'data':'accessor',functionName:typeof d.value==='function'?d.value.name:null}:null;

/** Standard own-object descriptor hook, NOT an option/callback in frozen572.
 * Observer failures disable further observations, but never replace native output/error.
 * The unchanged frozen workflow can then finish its own cleanup. The outer diagnostic
 * is unverified even if frozen mechanical checks pass. There are no observer retries.
 */
export function installPageScreenshotObserver(page,observer={}){
 const own=Object.getOwnPropertyDescriptor(page,'screenshot');
 let owner=page,inherited=own;
 while(!inherited&&(owner=Object.getPrototypeOf(owner)))inherited=Object.getOwnPropertyDescriptor(owner,'screenshot');
 if(!inherited||!('value'in inherited)||typeof inherited.value!=='function')throw Error('Unsupported Page screenshot data method');
 if(own&&!own.configurable)throw Error('Unsupported nonconfigurable own screenshot descriptor');
 if(!own&&!Object.isExtensible(page))throw Error('Unsupported nonextensible Page without own screenshot');
 const original=Reflect.get(page,'screenshot');
 const state={installed:false,restored:false,inFlight:0,originalCalls:0,extraNativeCalls:0,observerDisabled:false,observerErrors:[],nativeErrors:[],capability:{own:descData(own),method:descData(inherited),inherited:!own,extensible:Object.isExtensible(page)}};
 const observerFailure=(phase,e)=>{state.observerDisabled=true;state.observerErrors.push({phase,...errorData(e)});};
 const callOriginal=(...args)=>{if(state.restored)throw Error('Observer lifetime ended');state.extraNativeCalls++;return Reflect.apply(original,page,args);};
 const wrapper=async function(...args){
  if(this!==page)throw Error('Scoped screenshot called with foreign receiver');
  state.originalCalls++;state.inFlight++;
  const concurrent=state.inFlight!==1;
  if(concurrent)observerFailure('concurrent-call',Error('Concurrent screenshot boundary unsupported'));
  let token;
  try{
   if(!state.observerDisabled){try{token=await observer.before?.({page,args,callOriginal});}catch(e){observerFailure('before',e);}}
   let output;
   try{output=await Reflect.apply(original,page,args);}catch(e){state.nativeErrors.push(errorData(e));throw e;}
   if(!state.observerDisabled){try{await observer.after?.({page,args,callOriginal,token,output});}catch(e){observerFailure('after',e);}}
   return output;
  }finally{state.inFlight--;}
 };
 Object.defineProperty(page,'screenshot',{value:wrapper,configurable:true,writable:true,enumerable:own?.enumerable??false});
 if(Object.getOwnPropertyDescriptor(page,'screenshot')?.value!==wrapper)throw Error('Scoped hook installation did not hold');
 state.installed=true;
 return {state,callOriginal,restore(){
  if(state.restored)return;
  if(state.inFlight)throw Error('Cannot restore while screenshot observer is active');
  const current=Object.getOwnPropertyDescriptor(page,'screenshot');
  if(current?.value!==wrapper)throw Error('Screenshot owner conflict: will not overwrite another descriptor');
  if(own)Object.defineProperty(page,'screenshot',own);else if(!Reflect.deleteProperty(page,'screenshot'))throw Error('Cannot remove scoped screenshot property');
  const restored=Object.getOwnPropertyDescriptor(page,'screenshot');
  if(Reflect.get(page,'screenshot')!==original||!!restored!==!!own)throw Error('Original screenshot identity not restored');
  if(own&&['configurable','enumerable','writable','value','get','set'].some(k=>restored[k]!==own[k]))throw Error('Original screenshot descriptor not restored');
  state.restored=true;
 }};
}

async function phaseSnapshot(page,index){
 return page.locator('#sf-cvFocus .cv-photo .g').evaluate((image,index)=>{
  const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
  const view=e=>{const s=getComputedStyle(e);return {tag:e.tagName,id:e.id,class:e.className,rect:r(e),style:{opacity:s.opacity,display:s.display,visibility:s.visibility,transform:s.transform,filter:s.filter,backdropFilter:s.backdropFilter,backgroundImage:s.backgroundImage,backgroundPosition:s.backgroundPosition,backgroundSize:s.backgroundSize,transitionDuration:s.transitionDuration,transitionDelay:s.transitionDelay,animationName:s.animationName,animationDuration:s.animationDuration}};};
  const chain=[];for(let e=image;e;e=e.parentElement){chain.push(view(e));if(e.id==='sf')break;}
  const thumb=document.querySelectorAll('#sf .cpanel .ref-thumb')[index];
  return {browserNow:performance.now(),documentURL:location.href,baseURI:document.baseURI,index,caption:document.querySelector('#sf-cvFocus .cv-photo-cap')?.textContent,thumb:thumb?{name:thumb.dataset.pc,kind:thumb.dataset.pk,sourceBackground:thumb.dataset.pg}:null,chain};
 },index);
}

async function resourceRead(locator,includeSelf){
 return locator.evaluate(async (e,includeSelf)=>{
  const image=(includeSelf?[e,...e.querySelectorAll('*')]:[...e.querySelectorAll('*')]).find(n=>getComputedStyle(n).backgroundImage!=='none');
  if(!image)throw Error('No computed material background');
  const cs=getComputedStyle(image),raw=cs.backgroundImage,m=raw.match(/^url\(["']?(.*?)["']?\)$/);
  if(!m)throw Error('Expected one actual CSS URL: '+raw);
  const literalURL=m[1],resolvedURL=new URL(literalURL,document.baseURI).href;
  const response=await fetch(resolvedURL);if(!response.ok)throw Error('Actual resource status '+response.status);
  const blob=await response.blob(),bytes=await blob.arrayBuffer();
  const digest=async a=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',a))].map(v=>v.toString(16).padStart(2,'0')).join('');
  const bitmap=await createImageBitmap(blob);let decoded;
  try{const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d');if(!ctx)throw Error('Private observer2D context unavailable');ctx.drawImage(bitmap,0,0);const rgba=ctx.getImageData(0,0,bitmap.width,bitmap.height);decoded={width:bitmap.width,height:bitmap.height,colorSpace:rgba.colorSpace,byteLength:rgba.data.byteLength,rgbaSha256:await digest(rgba.data.buffer)};}finally{bitmap.close();}
  const resourceBase64=await new Promise((resolve,reject)=>{const f=new FileReader();f.onload=()=>resolve(f.result.slice(f.result.indexOf(',')+1));f.onerror=()=>reject(f.error);f.readAsDataURL(blob);});
  const inlineStyle=image.getAttribute('style'),token=(inlineStyle||'').match(/var\((--[\w-]+)/)?.[1]||null;
  return {browserNow:performance.now(),computedBackgroundRaw:raw,urlStringSha256:await digest(new TextEncoder().encode(raw)),literalURL,resolvedURL,responseURL:response.url,status:response.status,mime:response.headers.get('content-type'),blobType:blob.type,baseURI:document.baseURI,documentURL:location.href,inlineStyle,sourceToken:token,sourceTokenComputed:token?getComputedStyle(document.documentElement).getPropertyValue(token):null,resourceByteLength:bytes.byteLength,resourceSha256:await digest(bytes),resourceBase64,decoded};
 },includeSelf);
}

async function finitePhotoWait(page){
 const animations=await page.locator('#sf-cvFocus').evaluate(async e=>{
  const all=e.getAnimations({subtree:true});const info=a=>({playState:a.playState,currentTime:a.currentTime,startTime:a.startTime,timing:a.effect?.getComputedTiming()});
  const before=all.map(info),finite=all.filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime));
  if(finite.some(a=>a.playState==='paused'||a.playState==='idle'))throw Error('Cannot qualify settled phase with paused/idle finite animation');
  await Promise.all(finite.map(a=>a.finished.catch(()=>{})));
  return {before,after:all.map(info),ignoredNonfinite:all.length-finite.length};
 });
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 return animations;
}

async function freshFile(p){try{await access(p);throw Error('Refusing to overwrite existing artifact '+p);}catch(e){if(e.code!=='ENOENT')throw e;}}
async function saveJSON(p,value){await writeFile(p,JSON.stringify(value,null,2)+'\n');return {path:p,sha256:sha(await readFile(p))};}

/** Takes a caller-owned real Page. No launcher/context/lifecycle implementation here. */
export async function runMaterialResourceObservation(page,options={}){
 const {url,reportPath,expectedDocumentSha256}=options;
 // Temporary r9 diagnostic execution boundary, not a permanent A7 runner restriction.
 const qualified={
  'http://127.0.0.1:62878/baseline.html':'bead02fe98f432aa72cc626c11a2fcfb3e79b7ce436b2dce2918a913264a1a65',
  'http://127.0.0.1:62878/templates/html/ui-handbook.html':'df98cb6facf236bd98c8c35ae377950d62e8214dabee14cb186199d9a35631e4'
 };
 if(typeof url!=='string'||!Object.hasOwn(qualified,url)||
    typeof expectedDocumentSha256!=='string'||!/^[0-9a-f]{64}$/i.test(expectedDocumentSha256)||
    qualified[url]!==expectedDocumentSha256||typeof reportPath!=='string'||!reportPath.length)
  throw Error('Only the two exact r9 qualified material inputs are authorized');
 const frozenBytes=await readFile(frozenURL);if(sha(frozenBytes)!==FROZEN_SHA)throw Error('Frozen572 source changed');
 const native=await import(frozenURL.href);if(typeof native.runStoryForgeSupplement!=='function')throw Error('Actual frozen public export missing');
 if(sha(await readFile(frozenURL))!==FROZEN_SHA)throw Error('Frozen source changed during import');
 const out=path.resolve(reportPath),dir=out.replace(/\.json$/,'')+'-files',nativeReport=out.replace(/\.json$/,'')+'.native.json',nativeDir=path.join(dir,'native-boundary-cases');
 await freshFile(out);await freshFile(nativeReport);await freshFile(dir);await mkdir(dir,{recursive:true});
 const nativeOptions={url,reportPath:nativeReport,expectedDocumentSha256,cases:['material-paths'],themes:['pure'],languages:['zh'],viewport:{width:1440,height:900},artifactDir:nativeDir};
 const report={kind:'r9 exact572 material-only read-only boundary observer; not parity acceptance',startedAt:new Date().toISOString(),source:{path:fileURLToPath(frozenURL),sha256:FROZEN_SHA},observerSha256:sha(await readFile(fileURLToPath(import.meta.url))),nativeOptions,captures:[],hook:null,errors:[],cleanup:{hookRestored:false,callerOwnsPageBrowserContext:true},limits:['Original Native screenshot call/options/Buffer/error remain unchanged.','Pre-read adds measured observation latency before the new replay boundary capture; not identical timing to old572smoke.','Resource reads/native animation waits and new settled screenshots delay later original inputs. This is a diagnostic replay, not a timing-parity run.','Original572smokes/screenshots remain immutable. New replay boundary images and new settled images are separate.','Observer errors disable all further observations without changing native output; frozen workflow may finish its own input/reader cleanup. Outer diagnostic remains unverified.','Only5r9materials; no matrix/React/normalization/application acceptance.']};
 let hook;
 const persist=()=>saveJSON(out,report);
 try{
  // Actual instance capability is checked before invoking frozen572/app work.
  hook=installPageScreenshotObserver(page,{
   before:async({args})=>{
    const indexMatch=path.basename(args[0]?.path||'').match(/^pure-zh-1440-material-paths-context-preview-(\d+)-(char|scene|board|style)\.png$/);
    if(!indexMatch)throw Error('Unexpected frozen screenshot boundary '+String(args[0]?.path));
    const index=Number(indexMatch[1]);if(index!==report.captures.length||index>4)throw Error('Unexpected material boundary order/count');
    const record={index,kind:indexMatch[2],phase:'new-replay-original572-boundary',hostHookEnter:performance.now(),nativeOptions:{...args[0]},originalPhaseScreenshot:args[0].path};
    report.captures.push(record);
    const before=await phaseSnapshot(page,index);record.preNative=await saveJSON(path.join(dir,index+'-pre-native-state.json'),before);record.hostBeforeNative=performance.now();
    return record;
   },
   after:async({args,callOriginal,token,output})=>{
    const record=token;record.hostNativeReturned=performance.now();record.originalReturnedBufferSha256=sha(output);record.originalFileSha256=sha(await readFile(args[0].path));
    record.postNative=await saveJSON(path.join(dir,record.index+'-post-native-state.json'),await phaseSnapshot(page,record.index));
    if(!report.readCapabilities){
     report.readCapabilities=await page.evaluate(()=>({fetch:typeof fetch,digest:typeof crypto?.subtle?.digest,imageBitmap:typeof createImageBitmap,offscreenCanvas:typeof OffscreenCanvas}));
     if(Object.values(report.readCapabilities).some(v=>v!=='function'))throw Error('Actual application-context read/decode capability unavailable before resource observation');
    }
    for(const role of ['source','preview']){
     const locator=role==='source'?page.locator('#sf .cpanel .ref-thumb').nth(record.index):page.locator('#sf-cvFocus .cv-photo .g');
     const value=await resourceRead(locator,role==='preview'),binary=Buffer.from(value.resourceBase64,'base64');if(sha(binary)!==value.resourceSha256)throw Error('Actual browser/Node resource digest differs');
     const resourceFile=path.join(dir,record.index+'-'+role+'.webp');await writeFile(resourceFile,binary);delete value.resourceBase64;
     record[role]={...value,resourceFile};record[role+'Sidecar']=await saveJSON(path.join(dir,record.index+'-'+role+'-resource.json'),record[role]);
    }
    record.finiteAnimationWait=await finitePhotoWait(page);
    record.settled=[];
    for(let capture=0;capture<2;capture++){
     const before=await phaseSnapshot(page,record.index),file=path.join(dir,record.index+'-new-settled-'+capture+'.png');
     const shotOptions={...args[0],path:file};const hostBefore=performance.now(),bytes=await callOriginal(shotOptions),hostAfter=performance.now();
     const after=await phaseSnapshot(page,record.index);
     record.settled.push({phase:'new-after-existing-finite-css-and-native-frames',path:file,options:shotOptions,hostBefore,hostAfter,returnedSha256:sha(bytes),fileSha256:sha(await readFile(file)),states:await saveJSON(path.join(dir,record.index+'-settled-'+capture+'-states.json'),{before,after})});
     if(capture===0)await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    }
    record.hostObservationDone=performance.now();await persist();
   }
  });
  report.hook=hook.state;
  report.nativeResult=await native.runStoryForgeSupplement(page,nativeOptions);
  report.nativeReport={path:nativeReport,sha256:sha(await readFile(nativeReport))};
  if(report.captures.length!==5||hook.state.observerErrors.length||!report.nativeResult.allSelectedChecksPass)report.errors.push({name:'DiagnosticUnverified',message:'Missing5complete resource captures, observer error, or native case failure'});
 }catch(e){report.errors.push(errorData(e));}
 finally{
  if(hook){try{hook.restore();report.cleanup.hookRestored=hook.state.restored;}catch(e){report.errors.push({phase:'descriptor-restoration',...errorData(e)});}}
  report.finishedAt=new Date().toISOString();report.status=report.errors.length||report.captures.length!==5||!report.cleanup.hookRestored?'unverified':'bounded observations recorded';await persist();
 }
 return report;
}
