const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement;
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;$('#toasts').append(e);setTimeout(()=>{e.classList.add('out');setTimeout(()=>e.remove(),CONTENT.chrome.toast.exitDuration)},CONTENT.chrome.toast.duration)}
let scrimReturn=null;
const scrimStops=()=>$$('button:not([disabled]),a[href],input:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])',$('#scrimIn')).filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');
function scrim(html){const s=$('#scrim'),d=$('#scrimIn');if(!s.classList.contains('show'))scrimReturn=document.activeElement;d.innerHTML=html;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label',tr('预览'));d.tabIndex=-1;s.classList.add('show');(scrimStops()[0]||d).focus()}
function closeScrim(){const s=$('#scrim');if(!s.classList.contains('show'))return;s.classList.remove('show');const back=scrimReturn?.isConnected&&!scrimReturn.disabled?scrimReturn:scrimReturn?.closest('[data-cmp]')?.querySelector('button:not([disabled]),input')||$('#barIn button');back?.focus();scrimReturn=null}
$('#scrim').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const a=scrimStops(),first=a[0]||$('#scrimIn'),last=a.at(-1)||first;if(e.shiftKey&&(document.activeElement===first||!a.includes(document.activeElement))){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||!a.includes(document.activeElement))){e.preventDefault();first.focus()}});
document.addEventListener('focusin',e=>{if($('#scrim').classList.contains('show')&&!$('#scrim').contains(e.target))(scrimStops()[0]||$('#scrimIn')).focus()});
$('#scrim').addEventListener('mousedown',e=>{if(e.target.id==='scrim')closeScrim()});
addEventListener('keydown',e=>{if(e.key==='Escape')closeScrim()});
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-seg] button');
  if(s){$$('button',s.parentNode).forEach(b=>b.classList.toggle('on',b===s))}
  const t=e.target.closest('[data-tg]');
  if(t)t.setAttribute('aria-checked',t.getAttribute('aria-checked')!=='true');
  const n=e.target.closest('[data-toast]');
  if(n)toast(n.dataset.toast);

});

/* 主题切换：主题全部来自 themes.json */
const barT=$('#barT');
THEMES.themes.forEach(t=>{const b=document.createElement('button');b.dataset.s=t.id;b.setAttribute('aria-label',t.name.zh);b.innerHTML=`<i style="background:${t.swatch}"></i><span>${t.name.zh}</span>`;b.onclick=e=>switchTheme(t.id,e);barT.append(b)});
function setScheme(k){root.dataset.scheme=k;$$('#barIn button[data-s]').forEach(b=>b.classList.toggle('on',b.dataset.s===k));$$('.th').forEach(c=>c.classList.toggle('cur',c.dataset.scheme===k));try{localStorage.setItem('scheme',k)}catch(e){}window.syncDevice&&syncDevice();document.dispatchEvent(new Event('schemechange'))}
/* 从点击处圆形展开新主题 */
function switchTheme(k,e){if(root.dataset.scheme===k)return;if(!document.startViewTransition||matchMedia('(prefers-reduced-motion:reduce)').matches||!e){setScheme(k);return}const x=e.clientX,y=e.clientY,r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));const t=UX.transition(()=>setScheme(k));t.ready.then(()=>root.animate({clipPath:[`circle(0 at ${x}px ${y}px)`,`circle(${r}px at ${x}px ${y}px)`]},{duration:CONTENT.chrome.themeTransition.duration,easing:CONTENT.chrome.themeTransition.easing,pseudoElement:'::view-transition-new(root)'})).catch(()=>{})}
let saved=new URLSearchParams(location.hash.slice(1)).get('scheme');try{saved=saved||localStorage.getItem('scheme')}catch(e){}
setScheme(saved&&THEMES.themes.some(s=>s.id===saved)?saved:THEMES.default);

/* 目录：刻度是待机的核，悬停展开；手机上是底部胶囊。滚动用脚本完成，任何打开方式都有效 */
const rail=$('#rail'),NAV=CONTENT.chrome.nav;
function goTo(id){document.getElementById(id).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}
rail.innerHTML=NAV.map(([id,n])=>`<a href="#${id}" data-go="${id}" aria-label="${n}"><span>${n}</span></a>`).join('');
$('#pnavL').innerHTML=NAV.map(([id,n])=>`<a href="#${id}" data-go="${id}">${n}</a>`).join('');
document.addEventListener('click',e=>{const a=e.target.closest('#rail [data-go],#pnavL [data-go]');if(a){e.preventDefault();$('#pnav').classList.remove('open');goTo(a.dataset.go)}else if(!e.target.closest('#pnav'))$('#pnav').classList.remove('open')});
$('#pnavB').onclick=()=>$('#pnav').classList.toggle('open');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){$$('#rail a,#pnavL a').forEach(a=>a.classList.toggle('on',a.dataset.go===e.target.id));const n=NAV.find(x=>x[0]===e.target.id);$('#pnavT').textContent=n[1]}}),{rootMargin:'-40% 0px -55% 0px'});$$('section[id]').forEach(s=>io.observe(s));

/* 术语：每条配一句例子 */
const card=(t,en,d,ex)=>`<div class="term"><div><b>${t}</b><code>${en}</code></div><div><p>${d}</p><span>${ex}</span></div></div>`;
$('#terms-a').innerHTML=[
 ['工作台','Workspace','一个应用的整块界面，所有组件都摆在它上面。','例：下面第 05 节的整个深色面板。'],
 ['组件','Component','一个功能单元，有自己的面板和状态，可开可藏。','例：对话组件、时间线组件、上下文面板。'],
 ['控件','Control','组件里的最小操作件。','例：发送按钮、分段切换、开关。'],
 ['触发核','Core','组件待机时留下的最小部分，点它或移上去才展开。','例：对话组件待机只剩一行灰字。']].map(a=>card(...a)).join('');
$('#terms-b').innerHTML=[
 ['静息','Rest','没有人碰它。尽量退到背景。','对话组件：透明度 .72，无阴影，无按钮。'],
 ['悬停','Hover','鼠标移上去，停 .15s 才响应。只预告，不展开内容。','对话组件：浮起，出现阴影，不出现历史。'],
 ['聚焦','Focus','点进去。立刻响应，组件完全展开并固定。','对话组件：加宽到 80%，出现历史和发送。'],
 ['变暗','Dim','鼠标移到别的有交互的组件上时，自己降到透明度 .3，仍可点击。','悬停时间线时，对话组件和正文变暗。'],
 ['纯展示','Display only','组件没有任何可触发的交互。悬停只出阴影，别的组件不变暗。','说明卡、KPI 卡。'],
 ['退场','Retire','因为冲突而完全让出位置，不可点击。','对话聚焦时，时间线高度变 0 并淡出。']].map(a=>card(...a)).join('');
$('#terms-c').innerHTML=[
 ['挤占','Push','别人缩小，把位置让出来。用于两者要同时看。','上下文面板打开，阅读列让位并一起居中。'],
 ['覆盖','Overlay','盖在别人上面，别人不动。用于临时查看。','聊天历史盖住正文下部。'],
 ['退场','Retire','整个离开。用于两者争同一块位置。','Explore 模式下时间线不出现。'],
 ['聚焦范围','Focus scope','算作"还在组件里"的全部区域。点到范围外才退出聚焦。','对话组件的范围包括输入框、发送键、历史记录。'],
 ['持有聚焦','Held focus','点开后展开了内容、占了位置。鼠标移走后别的组件继续变暗，点外面才结束。','对话组件展开历史记录时。'],
 ['注意力锁','Attention lock','互相争整块表面的组件之间，前一个退出 .5s 后才放行。','工作台的时间线和对话组件。'],
 ['意图延迟','Intent delay','进入时先等一下，防止鼠标路过就触发。','.15s；用户主动点击时为 0。']].map(a=>card(...a)).join('');
$('#terms-d').innerHTML=[
 ['配色方案','Scheme','一整套颜色变量。三对，每对一亮一暗。','纯白/荧光，彩光/极光，纸本/余烬。'],
 ['信号','Signal','小块实色，表示当前选中。','Storyboard 按钮、@标签。'],
 ['体积','Volume','大块柔光卡片，每屏最多一张。','Income 卡。'],
 ['图案','Pattern','表达数据的灰色点阵。','now 点阵环。'],
 ['底面','Ground','最底下的页面底色。','页面背景。'],
 ['卡片','Card','比面板略深的成组底色，默认无边框无阴影。','支出分类。'],
 ['浮层','Float','离开文档流、带阴影的表面。','菜单、提示。'],
 ['凹槽 / 凸起','Recess / Raised','被挖低的底座和其中被选中的按钮。','Explore / Create 切换器。']].map(a=>card(...a)).join('');

function sampleStyle(style){return Object.entries(style).map(([key,value])=>`${key.startsWith('--')?key:key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}:${value}`).join(';')}
/* 主题卡：局部固定 data-scheme，直接预览 */
$('#scheme-cards').innerHTML=THEMES.themes.map(t=>`<div class="th" data-cmp data-live data-nofocus data-scheme="${t.id}" onclick="switchTheme('${t.id}',event)">
<div class="vol th-vol"><span class="xs b">${CONTENT.schemes.incomeLabel}</span><div class="big" style="${sampleStyle(CONTENT.schemes.styles.themeIncome)}">${CONTENT.schemes.income}</div></div>
<div class="row" style="${sampleStyle(CONTENT.schemes.styles.themeRow)}"><span class="tag on">${CONTENT.schemes.mode[t.mode]}</span>${CONTENT.schemes.colors.map(color=>`<i class="dotc" style="background:${color}"></i>`).join('')}</div>
<div class="b" style="${sampleStyle(CONTENT.schemes.styles.themeName)}">${t.name.zh}</div><p class="xs mute" style="${sampleStyle(CONTENT.schemes.styles.themeNote)}">${t.note.zh}</p>
<div class="row th-swatch">${CONTENT.schemes.palette.map(v=>`<i style="${sampleStyle({...CONTENT.schemes.styles.swatch,background:`var(--${v})`})}"></i>`).join('')}</div></div>`).join('');
setScheme(root.dataset.scheme);

/* 圆角 */
$('#radii').innerHTML=CONTENT.shape.radii.map(([n,t,u,r])=>`<div class="card" style="${sampleStyle(CONTENT.shape.styles.radiusCard)}"><div style="${sampleStyle({...CONTENT.shape.styles.radiusDemo,borderRadius:r})}"></div><div class="between" style="${sampleStyle(CONTENT.shape.styles.radiusLabel)}"><b class="sm">${t}</b><span class="mono xs mute">${n}</span></div><div class="xs mute" style="${sampleStyle(CONTENT.shape.styles.radiusNote)}">${u}</div></div>`).join('');

/* 点阵环 */
function dial(svg){svg.innerHTML=CONTENT.schemes.dial.map(dot=>`<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="${dot.fill}"/>`).join('')}
$$('[data-dial]').forEach(dial);
let stv=CONTENT.controls.stepper;$('[id="st-"]').onclick=()=>{stv=Math.max(0,stv-1);$('#stv').textContent=stv};$('[id="st+"]').onclick=()=>{stv++;$('#stv').textContent=stv};

/* ========== 动效卡 ========== */
const MO=[
 ['悬停抬起','.2s，只加阴影，不移动',`<div class="card lift mo-demo" style="padding:8px 18px;background:var(--card)">移上来</div>`,'hover'],
 ['意图延迟','.15s 后才响应，路过不触发',`<div class="mo-demo" data-d style="padding:8px 16px;border-radius:16px;background:var(--card);transition:box-shadow .35s var(--ease) .15s,transform .35s var(--ease) .15s" onmouseenter="this.style.boxShadow='var(--e3)'" onmouseleave="this.style.boxShadow=''">快速划过我</div>`,'hover'],
 ['工具浮现','.25s 淡入并下落 4px',`<div class="mo-tool"><div class="seg" style="opacity:0;visibility:hidden;transform:translateY(-4px);transition:opacity .25s,transform .35s var(--ease),visibility 0s;position:absolute;top:6px;left:50%;margin-left:-58px" data-o><button class="on">A</button><button>B</button><button>C</button></div><div style="padding:6px 16px;border-radius:16px;background:var(--card);margin-top:calc(36px*var(--y))">目标</div></div>`,'play'],
 ['挤占','.52s，两者一起重新居中',`<div style="display:flex;width:100%;justify-content:center;gap:0" class="mo-push"><div style="flex:0 1 150px;height:60px;background:var(--card);border-radius:9px"></div><div data-o style="flex:0 0 0;width:0;height:60px;background:var(--signal);border-radius:9px;opacity:0;transition:flex-basis .52s cubic-bezier(.22,1,.3,1),opacity .35s,margin .52s;margin-left:0"></div></div>`,'play'],
 ['覆盖','.35s，底下不动',`<div style="width:100%;height:80px;position:relative"><div class="xs mute" style="padding:6px">正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文</div><div data-o style="position:absolute;left:0;right:0;bottom:0;height:52px;background:var(--glass);backdrop-filter:blur(5px);border-radius:9px;opacity:0;transition:opacity .35s;box-shadow:var(--e2)"></div></div>`,'play'],
 ['退场','.35s 高度变 0，下移 20px',`<div style="width:100%"><div data-o style="height:30px;background:var(--card);border-radius:9px;transition:all .35s var(--ease);margin-bottom:calc(6px*var(--y));overflow:hidden"></div><div style="height:30px;background:var(--sunk);border-radius:9px"></div></div>`,'play'],
 ['输入扩展','.5s 宽度 60% → 80%',`<div data-o style="width:60%;height:38px;background:var(--card);border-radius:16px;transition:width .5s var(--ease),box-shadow .5s var(--ease)"></div>`,'play'],
 ['变暗','.3s 降到 .3，仍可点击',`<div class="row" style="flex-wrap:nowrap"><div style="padding:12px 18px;background:var(--card);border-radius:9px" class="sm b">活动</div><div data-o class="sm" style="padding:12px 18px;background:var(--card);border-radius:9px;transition:opacity .3s">其他</div></div>`,'play'],
 ['通知','.45s 从上滑入，不挤内容',`<div style="width:100%;height:80px;position:relative;overflow:hidden"><div class="xs mute" style="padding-top:28px;text-align:center">内容不动</div><div data-o class="xs" style="position:absolute;left:10%;right:10%;top:6px;padding:6px 10px;background:var(--ink);color:var(--app);border-radius:9px;transform:translateY(-140%);transition:transform .45s var(--ease)">已保存</div></div>`,'play'],
];
const MSP=['s3','s3','s3','s3','s4','s4','s4','s6','s6'];
$('#motion').innerHTML=MO.map((m,i)=>`<div class="card mo ${MSP[i]}" data-cmp data-live><div class="between"><div><b>${m[0]}</b><div class="xs mute">${m[1]}</div></div>${m[3]==='play'?`<button class="btn sec2 sm" data-mo="${i}">播放</button>`:'<span class="xs faint">悬停</span>'}</div><div class="mo-stage" id="mo${i}">${m[2]}</div></div>`).join('');
const STATES={2:()=>[{opacity:1,visibility:'visible',transform:'none'},{opacity:0,visibility:'hidden',transform:'translateY(-4px)'}],3:()=>[{flexBasis:'110px',opacity:1,marginLeft:'6px'},{flexBasis:'0px',opacity:0,marginLeft:'0px'}],4:()=>[{opacity:1},{opacity:0}],5:()=>[{height:'0px',opacity:0,transform:'translateY(20px)',marginBottom:'0px'},{height:'30px',opacity:1,transform:'none',marginBottom:'6px'}],6:()=>[{width:'80%',boxShadow:'var(--e3)'},{width:'60%',boxShadow:'none'}],7:()=>[{opacity:.3},{opacity:1}],8:()=>[{transform:'none'},{transform:'translateY(-140%)'}]};
document.addEventListener('click',e=>{const b=e.target.closest('[data-mo]');if(!b)return;const i=+b.dataset.mo,o=$('[data-o]',$('#mo'+i)),[a,z]=STATES[i]();Object.assign(o.style,a);setTimeout(()=>Object.assign(o.style,z),1300)});

/* 菜单：点开，选完或点外面就收起 */
(function(){const p=$('#mPop'),b=$('#mTrig'),owner='handbook-menu',card=b.closest('[data-cmp]');
const items=$$('div',p);p.setAttribute('role','menu');b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');items.forEach(d=>{d.setAttribute('role','menuitemradio');d.tabIndex=-1;d.setAttribute('aria-checked',d.classList.contains('on'))});
const close=restore=>{const had=p.classList.contains('show');p.classList.remove('show');b.setAttribute('aria-expanded','false');if(restore&&had)b.focus()};
const focusItem=i=>requestAnimationFrame(()=>{if(p.classList.contains('show'))items[i]?.focus()});
b.onclick=e=>{const on=!p.classList.contains('show');if(on)document.dispatchEvent(new CustomEvent('ui:menu-open',{detail:{owner}}));p.classList.toggle('show',on);b.setAttribute('aria-expanded',on);if(on&&e.detail===0)focusItem(0)};
b.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!p.classList.contains('show'))b.click();focusItem(e.key==='ArrowUp'?items.length-1:0)}});
items.forEach((d,i)=>{d.onclick=()=>{const t=d.childNodes[0].textContent.trim();b.textContent=t+' ▾';items.forEach(x=>{const on=x===d;x.classList.toggle('on',on);x.setAttribute('aria-checked',on);$('span',x)?.remove()});const mark=document.createElement('span');mark.textContent='✓';d.append(mark);close(true)};d.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();d.click()}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();items[(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus()}if(e.key==='Home'){e.preventDefault();items[0].focus()}if(e.key==='End'){e.preventDefault();items.at(-1).focus()}}});
document.addEventListener('click',e=>{if(!p.contains(e.target)&&!b.contains(e.target))close(false)});document.addEventListener('ui:menu-open',e=>{if(e.detail?.owner!==owner)close(false)});document.addEventListener('ux:rest',e=>{if(e.target===card)close(false)});addEventListener('keydown',e=>{if(e.key==='Escape')close(true)});
})();
