/** One missing 0006 flow: a real context-panel click keeps chat focus.
 * 0010 decision21 and0014 decision6 preserve this behavior. No app functions,
 * state/style/selection writes or synthetic events are used. Range objects below
 * only read the live caret. A block click may insert a chip, so exact caret/text
 * identity is evidence, NOT an extra acceptance criterion.
 * API caller owns its Page/context. CLI owns and closes its browser/context.
 */
import {mkdir,readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';

const CHROME='C:/Users/test/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe';
const THEMES=['pure','neon','prism','aurora','paper','ember'];
const LANGUAGES=['zh','en'];
const failText=e=>e?.stack||String(e);
function inputs(options){
  const {url,expectedDocumentSha256,theme='pure',language='zh'}=options;
  if(typeof url!=='string'||!url.length||typeof expectedDocumentSha256!=='string'||!/^[a-f0-9]{64}$/i.test(expectedDocumentSha256))throw Error('HTTP URL and64hex expectedDocumentSha256 required');
  const target=new URL(url);if(!['http:','https:'].includes(target.protocol))throw Error('Owned HTTP(S) URL required');
  if(!THEMES.includes(theme)||!LANGUAGES.includes(language))throw Error('Unsupported theme/language');
  target.hash=`scheme=${theme}&lang=${language}`;
  return {url,expectedDocumentSha256,theme,language,target:target.href};
}
async function snapshot(page){return page.evaluate(()=>{
  const sf=document.querySelector('#sf'),input=sf.querySelector('#sf-cinput'),panel=sf.querySelector('#sf-cpanel'),body=sf.querySelector('#sf-cpBody'),active=document.activeElement,selection=getSelection();
  const rect=e=>{const r=e?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null;};
  const identity=e=>e?{tag:e.tagName,id:e.id,class:e.className,role:e.getAttribute('role')}:null;
  let visible=!!panel&&panel.getBoundingClientRect().width>0&&panel.getBoundingClientRect().height>0;
  for(let e=panel;e;e=e.parentElement){const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)visible=false;}
  const caret={rangeCount:selection?.rangeCount||0,collapsed:selection?.isCollapsed??null,anchorInInput:!!selection?.anchorNode&&input.contains(selection.anchorNode),focusInInput:!!selection?.focusNode&&input.contains(selection.focusNode),anchorNode:selection?.anchorNode?.nodeName,anchorOffset:selection?.anchorOffset,focusNode:selection?.focusNode?.nodeName,focusOffset:selection?.focusOffset,textBeforeAnchor:null};
  if(caret.anchorInInput){const range=document.createRange();range.selectNodeContents(input);range.setEnd(selection.anchorNode,selection.anchorOffset);caret.textBeforeAnchor=range.toString();}
  const cs=getComputedStyle(panel);
  return {at:performance.now(),documentURL:location.href,activeElement:identity(active),inputIsActive:active===input,chatState:sf.querySelector('.copilot').dataset.state,watching:sf.classList.contains('is-watching'),input:{text:input.textContent,html:input.innerHTML,rect:rect(input)},caret,panel:{open:sf.querySelector('#sf-browser').classList.contains('panel-open'),visible,rect:rect(panel),bodyText:body.innerText,style:{opacity:cs.opacity,display:cs.display,visibility:cs.visibility,pointerEvents:cs.pointerEvents}},activeSelection:window.SF_DATA?.selection?.activeSel??null};
});}

/** Single fresh navigation, one scenario. Evaluations are observations only. */
export async function runPanelChatFocus(page,options={}){
  const config=inputs(options),row={id:'panel-chat-focus',key:`${config.theme}-${config.language}-1440-panel-chat-focus`,theme:config.theme,language:config.language,viewport:{width:1440,height:900},requirements:['0006/Create browser: clicking panel does not take chat focus'],checks:[],evidence:{},errors:[],startedAt:new Date().toISOString()};
  const report={profile:'story-forge-panel-chat-focus/v1',url:config.url,expectedDocumentSha256:config.expectedDocumentSha256,theme:config.theme,language:config.language,startedAt:row.startedAt,cases:[row],fatal:null,limits:['Only this single panel-click/chat-focus flow; no section/A7 acceptance.','Caret may move or chips may be inserted by the real panel block click. Raw caret/text are retained, not required identical.','No screenshot pixel or internal DOM-identity criterion.']};
  const check=(id,pass,observation)=>row.checks.push({id,pass:!!pass,observation});
  const onPageError=e=>row.errors.push({type:'pageerror',error:failText(e)}),onConsole=m=>{if(m.type()==='error')row.errors.push({type:'console',error:m.text()});};
  page.on('pageerror',onPageError);page.on('console',onConsole);
  try{
    await page.setViewportSize(row.viewport);await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto('about:blank');const response=await page.goto(config.target,{waitUntil:'domcontentloaded',timeout:20000});
    const document=response?{url:response.url(),status:response.status(),sha256:createHash('sha256').update(await response.body()).digest('hex')}:null;row.evidence.document=document;
    if(document?.status!==200||document.sha256!==config.expectedDocumentSha256)throw Error('Loaded document differs from expected: '+JSON.stringify(document));
    await page.waitForSelector('#sf-cvInner .ci',{timeout:20000});await page.locator('#sf').scrollIntoViewIfNeeded();
    await page.locator('#sf [data-mode="create"]').click();
    // Same existing public script-material path used by frozen main:data.
    await page.locator('#sf [data-script-id="donna_warning"] .selel').click();
    await page.waitForFunction(()=>{const p=document.querySelector('#sf-cpanel'),c=p&&getComputedStyle(p);return p&&p.getBoundingClientRect().width>0&&+c.opacity===1&&document.querySelector('#sf-browser').classList.contains('panel-open');},{},{timeout:10000});
    row.evidence.opened=await snapshot(page);
    await page.locator('#sf-cinput').click();await page.keyboard.press('End');await page.keyboard.type(' panel focus probe');
    await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
    await page.waitForFunction(()=>document.activeElement===document.querySelector('#sf-cinput')&&document.querySelector('#sf .copilot').dataset.state==='focus',{},{timeout:10000});
    row.evidence.before=await snapshot(page);const before=row.evidence.before;
    const precondition=before.inputIsActive&&before.chatState==='focus'&&before.caret.anchorInInput&&before.caret.collapsed&&before.panel.open&&before.panel.visible&&!before.watching;
    check('setup.actual-chat-caret-and-visible-panel',precondition,before);if(!precondition)throw Error('Required real chat/panel precondition not observed');
    const target=page.locator('#sf-cpBody .cp-sec h5').first();await target.scrollIntoViewIfNeeded();
    row.evidence.clickTarget=await target.evaluate(e=>{const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return {tag:e.tagName,class:e.className,text:e.textContent,rect:{x:r.x,y:r.y,width:r.width,height:r.height},point:{x,y},hit:{tag:hit?.tagName,id:hit?.id,class:hit?.className},insidePanel:!!hit?.closest('#sf-cpanel'),insideBlock:!!hit?.closest('.cp-sec'),insidePreviewThumb:!!hit?.closest('.ref-thumb')};});
    const hit=row.evidence.clickTarget;if(!hit.insidePanel||!hit.insideBlock||hit.insidePreviewThumb)throw Error('Panel heading target is not an exposed ordinary context block');
    await target.click();row.evidence.after=await snapshot(page);const after=row.evidence.after;
    check('0006.panel-click-keeps-chat-focus',after.inputIsActive&&after.chatState==='focus',after);
  }catch(error){row.errors.push({type:'action-or-observation-error',error:failText(error)});}
  finally{page.off('pageerror',onPageError);page.off('console',onConsole);row.finishedAt=new Date().toISOString();row.status=row.errors.length?'unverified':row.checks.some(c=>!c.pass)?'not attained':'attained';report.finishedAt=row.finishedAt;report.summary={cases:1,checks:row.checks.length,passed:row.checks.filter(c=>c.pass).length,unverified:row.errors.length?1:0};report.allSelectedChecksPass=row.status==='attained';}
  return report;
}
function parse(args){const o={};for(let i=0;i<args.length;i++){const key=args[i];if(key==='--help')o.help=true;else if(['--url','--report','--expected-document-sha256','--theme','--language','--chrome'].includes(key)){if(!args[i+1])throw Error('Missing '+key);o[key.slice(2)]=args[++i];}else throw Error('Unknown '+key);}return o;}
async function cli(){
  const a=parse(process.argv.slice(2));if(a.help){console.log('node templates/react/parity/story-forge-panel-chat-focus.mjs --url HTTP_URL --report NEW_PATH --expected-document-sha256 HASH [--theme pure|neon] [--language zh|en] [--chrome PATH]\nOne real panel-click/chat-focus scenario. No server starts/stops. API caller owns Page; CLI closes its own context/browser.');return;}
  const options={url:a.url,expectedDocumentSha256:a['expected-document-sha256'],theme:a.theme,language:a.language};inputs(options);
  if(typeof a.report!=='string'||!a.report.length)throw Error('--report NEW_PATH required');
  try{await stat(a.report);throw Error('Refusing to overwrite existing evidence: '+a.report);}catch(e){if(e.code!=='ENOENT')throw e;}
  const chrome=a.chrome||CHROME;await stat(chrome);let browser,context,report={profile:'story-forge-panel-chat-focus/v1',url:a.url,cases:[],fatal:null,allSelectedChecksPass:false};const lifecycle={context:'not-created',browser:'not-created',errors:[]};
  try{browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});lifecycle.browser='open';context=await browser.newContext({viewport:{width:1440,height:900}});lifecycle.context='open';report=await runPanelChatFocus(await context.newPage(),options);report.environment={node:process.version,chrome,browserVersion:browser.version(),runnerSha256:createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex')};}
  catch(e){report.fatal=failText(e);report.allSelectedChecksPass=false;}
  finally{if(context)try{await context.close();lifecycle.context='closed';}catch(e){lifecycle.errors.push({resource:'context',error:failText(e)});}if(browser)try{await browser.close();lifecycle.browser='closed';}catch(e){lifecycle.errors.push({resource:'browser',error:failText(e)});}report.lifecycle=lifecycle;if(lifecycle.errors.length)report.allSelectedChecksPass=false;}
  await mkdir(path.dirname(path.resolve(a.report)),{recursive:true});await writeFile(a.report,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:path.resolve(a.report),summary:report.summary,fatal:report.fatal,lifecycle,allSelectedChecksPass:report.allSelectedChecksPass}));if(!report.allSelectedChecksPass)process.exitCode=1;
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)cli().catch(e=>{console.error(failText(e));process.exitCode=1;});
