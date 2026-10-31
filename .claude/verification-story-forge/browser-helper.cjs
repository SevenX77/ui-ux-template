const {chromium}=require("C:\\Users\\test\\AppData\\Local\\Temp\\claude\\D--coding-ui-ux-template\\d9b07a12-8681-417f-b459-fcb66c19488d\\scratchpad\\sf-port-evidence\\node_modules\\playwright-core");
const fs=require('fs'),assert=require('assert/strict'),path=require('path');
const out=__dirname;
const launch=()=>chromium.launch({headless:true,executablePath:"C:/Users/test/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe"});
async function open(browser,viewport={width:1440,height:1080},opts={}) {
 const context=await browser.newContext({viewport,reducedMotion:'reduce',...opts});
 // Fonts are not under test; serve an empty stylesheet instead of introducing external network noise.
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push({kind:'pageerror',text:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({kind:'console',text:m.text()})});
 page.setDefaultTimeout(6000);await page.goto('http://127.0.0.1:8793/templates/html/ui-handbook.html',{waitUntil:'load'});
 await page.evaluate(()=>{setDev('web');setLang('en',true)});return {context,page,errors};
}
async function click(page,selector){const loc=page.locator(selector).first();await loc.scrollIntoViewIfNeeded();await loc.click();}
async function hover(page,selector){const loc=page.locator(selector).first();await loc.scrollIntoViewIfNeeded();await loc.hover();await page.waitForTimeout(180);}
async function settle(page){await page.waitForTimeout(80)}
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2));
module.exports={launch,open,click,hover,settle,save,assert};
