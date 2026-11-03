/** HTML-preservation acceptance. Uses the unchanged parity snapshots/capture helpers. */
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {PNG} from 'pngjs';
import {SPEC,REPO,HERE,CHROME,report,pageReady,observe,revealSection,snapshot,compareSnapshots,capturePair,pixelDifference,network} from './check.mjs';

const ALL=['terms','schemes','shape','controls','workspace','dash','canvas','maps','agents','more','work','table','gallery','daily','values','refs'];
const args=process.argv.slice(2),options={sections:ALL,baseline:null};
for(let i=0;i<args.length;i++){
  if(args[i]==='--baseline')options.baseline=path.resolve(args[++i]||'');
  else if(args[i]==='--sections')options.sections=(args[++i]||'').split(',');
  else throw new Error('Unknown option '+args[i]);
}
if(!options.baseline||!options.sections.length||new Set(options.sections).size!==options.sections.length||options.sections.some(id=>!ALL.includes(id)))
  throw new Error('Usage: node parity/baseline.mjs --baseline <before.html> [--sections <comma-separated-ids>]');
const runId='html-baseline-'+new Date().toISOString().replace(/[:.]/g,'-'),out=path.join(HERE,'out',runId);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=(file,data)=>writeFile(file,JSON.stringify(data,null,2)+'\n');
const results={runId,startedAt:new Date().toISOString(),kind:'HTML-before-after',sections:options.sections,spec:SPEC,artifacts:{},cases:[],diagnostics:[],fatal:null};
let server,browser;
// No raw pair is called equal because it is inside control variation. Keep both
// raw metrics, plus the exact per-coordinate/channel excess over an independent
// baseline-baseline pair and an unchanged baseline page captured twice.
// No pixels, selectors or images are masked; the original independent excess stays visible.
async function aboveVariation(pair,control,temporal=null){
  const a=PNG.sync.read(await readFile(path.join(HERE,pair.files.diff))),b=PNG.sync.read(await readFile(path.join(HERE,control.files.diff))),t=temporal?PNG.sync.read(await readFile(path.join(HERE,temporal.files.diff))):null;
  if(a.width!==b.width||a.height!==b.height||(t&&(a.width!==t.width||a.height!==t.height)))return {pixelsAboveSameStackVariation:a.width*a.height,error:'Control image dimensions differ'};
  let pixelsAboveSameStackVariation=0,pixelsAboveIndependentControl=0,maxExcess=0;
  for(let i=0;i<a.data.length;i+=4){let excess=false,independent=false;for(let c=0;c<3;c++){const d=a.data[i+c]-Math.max(b.data[i+c],t?.data[i+c]??0);if(a.data[i+c]>b.data[i+c])independent=true;if(d>0){excess=true;maxExcess=Math.max(maxExcess,d);}}if(excess)pixelsAboveSameStackVariation++;if(independent)pixelsAboveIndependentControl++;}
  return {pixelsAboveSameStackVariation,pixelsAboveIndependentControl,maxExcess,method:'Per coordinate, RGB channel difference must not exceed the maximum measured independent baseline-baseline or same-page temporal baseline-baseline difference; raw counts remain.'};
}
try{
  await mkdir(out,{recursive:true});
  for(const file of [CHROME,options.baseline,path.join(REPO,'templates/html/ui-handbook.html')])await stat(file);
  results.artifacts={script:sha(await readFile(fileURLToPath(import.meta.url))),parityScript:sha(await readFile(path.join(HERE,'check.mjs'))),baseline:{path:options.baseline,sha256:sha(await readFile(options.baseline))},current:{path:path.join(REPO,'templates/html/ui-handbook.html'),sha256:sha(await readFile(path.join(REPO,'templates/html/ui-handbook.html')))}};
  report.environment.initialKanbanCounts=JSON.parse(await readFile(path.join(REPO,'core/content/work.json'),'utf8')).columns.map(c=>c.tasks.length);
  report.environment.galleryCount=JSON.parse(await readFile(path.join(REPO,'core/dist/gallery.json'),'utf8')).length;
  server=createServer(async(req,res)=>{try{const route=new URL(req.url,'http://localhost').pathname;if(!['/before.html','/after.html'].includes(route)){res.writeHead(404).end();return;}const bytes=await readFile(route==='/before.html'?options.baseline:results.artifacts.current.path);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}).end(bytes);}catch(e){res.writeHead(500).end(String(e));}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({executablePath:CHROME,headless:true});results.browser=browser.version();
  for(const viewport of SPEC.viewports){
    const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'no-preference'});
    const pages=[await context.newPage(),await context.newPage(),await context.newPage()];
    pages.forEach((page,i)=>{observe(page,['baseline','current','control'][i]);page.setDefaultTimeout(SPEC.settleTimeout);});
    try{for(const theme of SPEC.themes)for(const language of SPEC.languages){
      const configuration={theme,language,viewport,key:`${theme}-${language}-${viewport.width}x${viewport.height}`};
      console.log('HTML preservation '+configuration.key+' '+options.sections.join(','));
      try{
        for(let i=0;i<pages.length;i++)await pageReady(pages[i],base+(i===1?'/after.html':'/before.html'),theme,language);
        for(const section of options.sections){
          const row={...configuration,section,errors:[]},snapshots=[],assets=[];
          try{
            for(const page of pages){await page.bringToFront();assets.push(await revealSection(page,section));snapshots.push(await snapshot(page,'#'+section));}
            const compared=compareSnapshots(snapshots[0],snapshots[1]);Object.assign(row,compared);
            row.controlDOM=compareSnapshots(snapshots[0],snapshots[2]);row.assets=assets;
            const raw=path.join(out,configuration.key+'-'+section+'.json');await json(raw,{configuration,section,before:snapshots[0],after:snapshots[1],control:snapshots[2]});row.raw=path.relative(HERE,raw).split(path.sep).join('/');
            row.pixels=await capturePair(pages.slice(0,2),'#'+section,'before-after-'+configuration.key+'-'+section,'html-baseline');
            row.controlPixels=await capturePair([pages[0],pages[2]],'#'+section,'control-'+configuration.key+'-'+section,'html-baseline');
            const temporal=pixelDifference(await readFile(path.join(HERE,row.pixels.files.html)),await readFile(path.join(HERE,row.controlPixels.files.html)));
            const temporalPath=path.join(out,configuration.key+'-'+section+'-temporal-control.png');await writeFile(temporalPath,temporal.diff);
            row.temporalControlPixels={...temporal.metrics,files:{diff:path.relative(HERE,temporalPath).split(path.sep).join('/')}};
            row.variation=await aboveVariation(row.pixels,row.controlPixels,row.temporalControlPixels);
            row.pass=!row.styleMismatches.length&&!row.structureMismatches.length&&!row.controlDOM.styleMismatches.length&&!row.controlDOM.structureMismatches.length&&
              !row.variation.error&&row.variation.pixelsAboveSameStackVariation===0&&assets.flat().every(a=>a.ok);
          }catch(error){row.errors.push(error.stack||String(error));row.pass=false;}
          results.cases.push(row);await json(path.join(out,'checkpoint.json'),results);
        }
      }catch(error){results.diagnostics.push({configuration,error:error.stack||String(error)});}
    }}finally{await context.close();}
  }
}catch(error){results.fatal=error.stack||String(error);console.error(results.fatal);}
finally{
  const errors=[];try{await browser?.close();}catch(e){errors.push(String(e));}
  try{if(server?.listening)await new Promise((resolve,reject)=>{server.close(e=>e?reject(e):resolve());server.closeAllConnections();});}catch(e){errors.push(String(e));}
  results.cleanup={browserClosed:!browser?.isConnected(),serverClosed:!server?.listening,errors};
  results.finishedAt=new Date().toISOString();results.diagnostics.push(...report.diagnostics);results.network=network;
  results.summary={expectedCases:options.sections.length*24,cases:results.cases.length,styleMismatches:results.cases.reduce((n,r)=>n+(r.styleMismatches?.length||0),0),DOMMismatches:results.cases.reduce((n,r)=>n+(r.structureMismatches?.length||0),0),unequalRawPairs:results.cases.filter(r=>r.pixels?.differentPixels).length,unequalControlPairs:results.cases.filter(r=>r.controlPixels?.differentPixels).length,pairsAboveSameStackVariation:results.cases.filter(r=>r.variation?.pixelsAboveSameStackVariation).length,passes:results.cases.filter(r=>r.pass).length};
  results.summary.pass=!results.fatal&&!results.diagnostics.some(record=>record.kind!=='ready')&&!network.length&&!errors.length&&results.cases.length===results.summary.expectedCases&&results.cases.every(r=>r.pass);
  results.perSection=Object.fromEntries(options.sections.map(id=>{const rows=results.cases.filter(r=>r.section===id);return[id,{cases:rows.length,styleMismatches:rows.reduce((n,r)=>n+(r.styleMismatches?.length||0),0),DOMMismatches:rows.reduce((n,r)=>n+(r.structureMismatches?.length||0),0),unequalRawPairs:rows.filter(r=>r.pixels?.differentPixels).length,unequalControlPairs:rows.filter(r=>r.controlPixels?.differentPixels).length,pairsAboveVariation:rows.filter(r=>r.variation?.pixelsAboveSameStackVariation).length,passes:rows.filter(r=>r.pass).length}];}));
  await mkdir(out,{recursive:true});await json(path.join(out,'results.json'),results);await json(path.join(HERE,'out','html-baseline.latest.json'),{runId,results:path.relative(HERE,path.join(out,'results.json')).split(path.sep).join('/')});
  console.log(JSON.stringify({summary:results.summary,perSection:results.perSection,evidence:out},null,2));process.exitCode=results.summary.pass?0:1;
}
