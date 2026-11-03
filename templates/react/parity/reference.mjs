/** Finite Story Forge reference comparison, not normative acceptance.
 * Same failing booleans are insufficient. Known reference deviations require
 * matching physical state/profile evidence; action errors never pass.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const hash=b=>createHash('sha256').update(b).digest('hex');
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const validChecks=a=>Array.isArray(a)&&a.length>0&&a.every(c=>c&&typeof c.id==='string'&&typeof c.pass==='boolean')&&new Set(a.map(c=>c.id)).size===a.length;
const unique=a=>[...new Set(a)];
const SHORT_FAILURES=new Set(['0014.unfocused-tool-setTrack-audio','0014.unfocused-tool-setTrack-video','0014.unfocused-tool-setZoom-Beat','0010.click-left-of-visible-bar-blurs','0015.playback-exactly-one-reading-mark']);
const NATURAL_FAILURES=new Set(['0015.first-last-reach-middle']);
const withoutTime=s=>Object.fromEntries(Object.entries(s).filter(([key])=>key!=='time'));
function toolState(s){return {watching:s.watching,panelOpen:s.panel.open,monitorWidth:s.monitor.box.width,monitorDisplay:s.monitor.style.display,selection:withoutTime(s.selection)};}
function chatState(o){return {side:o.side,hit:o.hit,focusId:o.after.focusId,chatState:o.after.chatState,input:o.after.chat.input};}
function readingProfile(row){const f=row.evidence.playback;return {ownerOrder:unique(f.map(s=>s.owner)),allRunningReading:f.every(s=>s.running&&s.reading),allOneCorrectClass:f.every(s=>equal(s.marked,[s.owner])),markTokens:unique(f.map(s=>s.mark)).sort(),selectionTokens:unique(f.map(s=>s.sel)).sort()};}
function naturalState(s){return {scheme:s.scheme,lang:s.lang,watching:s.watching,timelineState:s.timelineState,chatState:s.chatState,focusId:s.focusId,selection:s.selection,panelOpen:s.panel.open,panelText:s.panel.text,input:s.chat.input,monitorShot:s.monitor.shot,monitorHidden:s.monitor.hidden};}
function knownFailureState(check,row){
  if(check.id.startsWith('0014.unfocused-tool-'))return Object.fromEntries(Object.entries(check.observation).map(([phase,s])=>[phase,toolState(s)]));
  if(check.id==='0010.click-left-of-visible-bar-blurs')return chatState(check.observation);
  if(check.id==='0015.playback-exactly-one-reading-mark')return readingProfile(row);
  if(check.id==='0015.first-last-reach-middle')return {observedOwners:check.observation.owners,firstHasCentredSample:row.evidence.fullReading.some(s=>s.marked[0]==='scene1'&&Math.abs(s.error)<=2),lastHasCentredSample:row.evidence.fullReading.some(s=>s.marked[0]==='black'&&Math.abs(s.error)<=2)};
  return null;
}
/** Caller supplies authorized expected scope and independently verified identities.
 * Raw numeric timing trajectories are retained in input files, not averaged or
 * declared equal. Unknown reference failures and every missing row are blockers.
 */
export function compareReferenceRuns(reference,candidate,options){
  const out={kind:'story-forge-reference-comparison/v1',scope:options.profile,referenceUrl:reference.url,candidateUrl:candidate.url,expectedCases:0,cases:[],differences:[],unverified:[],normative:{reference:{passed:0,failed:0},candidate:{passed:0,failed:0}},limits:['Finite named check/reference-state comparison, not all A7 coverage or pixel equality.','Frozen natural first-line observations retain post-click registration limits; separate before-click trace must be reviewed.','Known normative failures remain failures; comparator pass only means tested reference preservation.']};
  const gap=(type,detail)=>out.unverified.push({type,detail}),diff=(key,type,detail)=>out.differences.push({key,type,detail});
  if(!options?.themes?.length||!options?.languages?.length||!options?.caseIds?.length||!options?.viewport||!options?.expectedRunnerSha256||!options?.referenceDocumentSha256||!options?.candidateDocumentSha256)throw new Error('Explicit expected scope and identities required');
  if(!['short','natural'].includes(options.profile))throw new Error('Unknown comparison profile');
  if(reference.fatal||candidate.fatal)gap('fatal',{reference:reference.fatal,candidate:candidate.fatal});
  for(const [side,run] of [['reference',reference],['candidate',candidate]]){
    if(run.environment?.runnerSha256!==options.expectedRunnerSha256)gap('runner-identity',{side,actual:run.environment?.runnerSha256,expected:options.expectedRunnerSha256});
    if(!run.finishedAt)gap('unfinished-report',{side});
    if(!equal(run.viewport,options.viewport))gap('viewport',{side,actual:run.viewport,expected:options.viewport});
  }
  const expected=options.themes.flatMap(theme=>options.languages.flatMap(language=>options.caseIds.map(id=>`${theme}-${language}-${options.viewport.width}-${id}`)));out.expectedCases=expected.length;
  const maps={};
  for(const [side,run,expectedSha] of [['reference',reference,options.referenceDocumentSha256],['candidate',candidate,options.candidateDocumentSha256]]){
    const map=new Map();maps[side]=map;
    for(const row of run.cases||[]){if(map.has(row.key))gap('duplicate-case',{side,key:row.key});map.set(row.key,row);if(!expected.includes(row.key))gap('unexpected-case',{side,key:row.key});
      if(row.errors?.length||row.status==='unverified')gap('action-error',{side,key:row.key,errors:row.errors});
      if(!validChecks(row.checks))gap('invalid-or-empty-check-list',{side,key:row.key});
      if(row.id==='reading'&&!(row.evidence?.playback?.length>0))gap('missing-reading-frames',{side,key:row.key});
      if(row.id==='playback'){const frames=row.evidence?.fullReading,moving=frames?.filter(s=>s.running&&s.at>3000);if(!moving?.length||!moving.every(s=>Number.isFinite(s.error)&&Number.isFinite(s.scroll)&&Math.abs(s.error)<=2)||!frames.some(s=>s.marked[0]==='black'&&Math.abs(s.error)<=2))gap('missing-or-invalid-natural-reading',{side,key:row.key});}
      if(row.evidence?.document?.status!==200||row.evidence?.document?.sha256!==expectedSha)gap('document-identity',{side,key:row.key,actual:row.evidence?.document,expected:expectedSha});
    }
    for(const key of expected)if(!map.has(key))gap('missing-case',{side,key});
  }
  const allowed=options.profile==='natural'?NATURAL_FAILURES:SHORT_FAILURES;
  for(const key of expected){const a=maps.reference.get(key),b=maps.candidate.get(key);if(!a||!b||!validChecks(a.checks)||!validChecks(b.checks))continue;const row={key,normative:{reference:[],candidate:[]},knownReferenceNonattainment:[],semanticChecks:[]};out.cases.push(row);
    for(const [side,r] of [['reference',a],['candidate',b]])for(const check of r.checks||[]){if(check.pass)out.normative[side].passed++;else{out.normative[side].failed++;row.normative[side].push(check.id);}}
    if(!equal(a.checks.map(c=>[c.id,c.pass]),b.checks.map(c=>[c.id,c.pass])))diff(key,'named-check-outcomes',{reference:a.checks.map(c=>[c.id,c.pass]),candidate:b.checks.map(c=>[c.id,c.pass])});
    for(const ac of a.checks.filter(c=>!c.pass)){
      if(!allowed.has(ac.id)){gap('unreviewed-reference-nonattainment',{key,id:ac.id});continue;}
      const bc=b.checks.find(c=>c.id===ac.id);if(!bc||bc.pass)continue;
      try{const as=knownFailureState(ac,a),bs=knownFailureState(bc,b),match=equal(as,bs);row.knownReferenceNonattainment.push({id:ac.id,reference:as,candidate:bs,semanticMatch:match});if(!match)diff(key,'negative-reference-state',{id:ac.id,reference:as,candidate:bs});}catch(e){gap('missing-negative-state',{key,id:ac.id,error:String(e)});}
    }
    if(options.profile==='natural')try{
      const ax=a.evidence.storyboardPlayback,bx=b.evidence.storyboardPlayback;
      for(const phase of ['before','after']){const match=equal(naturalState(ax[phase]),naturalState(bx[phase]));row.semanticChecks.push({id:'natural-'+phase,pass:match});if(!match)diff(key,'natural-'+phase,{reference:naturalState(ax[phase]),candidate:naturalState(bx[phase])});}
      const ar=a.checks.find(c=>c.id==='0010.playback-end-restores-panel'),br=b.checks.find(c=>c.id==='0010.playback-end-restores-panel'),restored=equal(naturalState(ar.observation),naturalState(br.observation));row.semanticChecks.push({id:'natural-restored',pass:restored});if(!restored)diff(key,'natural-restored',{reference:naturalState(ar.observation),candidate:naturalState(br.observation)});
      const ao=unique(ax.samples.map(s=>s.monitor.shot)),bo=unique(bx.samples.map(s=>s.monitor.shot));row.semanticChecks.push({id:'natural-monitor-shot-order',pass:equal(ao,bo)});if(!equal(ao,bo))diff(key,'natural-monitor-shot-order',{reference:ao,candidate:bo});
    }catch(e){gap('missing-natural-state',{key,error:String(e)});}
  }
  out.referencePreservationPass=!out.unverified.length&&!out.differences.length&&out.cases.length===out.expectedCases;
  out.normativeAcceptancePass=out.referencePreservationPass&&out.normative.reference.failed===0&&out.normative.candidate.failed===0;
  return out;
}
async function cli(){const o={};for(let i=2;i<process.argv.length;i+=2){if(!process.argv[i+1])throw new Error('Missing argument value');o[process.argv[i].replace(/^--/,'')]=process.argv[i+1];}
  for(const key of ['reference','candidate','report','reference-document-sha256','candidate-document-sha256'])if(!o[key])throw new Error('Required --'+key);
  const {STORY_FORGE_SPEC}=await import('./story-forge.mjs'),runner=await readFile(new URL('./story-forge.mjs',import.meta.url)),aBytes=await readFile(o.reference),bBytes=await readFile(o.candidate),profile=o.profile||'short';
  const result=compareReferenceRuns(JSON.parse(aBytes),JSON.parse(bBytes),{profile,themes:STORY_FORGE_SPEC.themes,languages:STORY_FORGE_SPEC.languages,caseIds:profile==='natural'?['playback']:STORY_FORGE_SPEC.defaultCases,viewport:STORY_FORGE_SPEC.viewport,expectedRunnerSha256:hash(runner),referenceDocumentSha256:o['reference-document-sha256'],candidateDocumentSha256:o['candidate-document-sha256']});
  result.artifacts={reference:{path:path.resolve(o.reference),sha256:hash(aBytes)},candidate:{path:path.resolve(o.candidate),sha256:hash(bBytes)},comparator:{path:fileURLToPath(import.meta.url),sha256:hash(await readFile(fileURLToPath(import.meta.url)))}};
  await mkdir(path.dirname(path.resolve(o.report)),{recursive:true});await writeFile(o.report,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({report:o.report,pairs:result.cases.length,referencePreservationPass:result.referencePreservationPass,normativeAcceptancePass:result.normativeAcceptancePass,normative:result.normative,differences:result.differences.length,unverified:result.unverified.length}));process.exitCode=result.referencePreservationPass?0:1;
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)cli().catch(e=>{console.error(e?.stack||String(e));process.exitCode=1;});
