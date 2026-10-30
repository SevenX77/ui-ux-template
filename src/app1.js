const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement;
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;$('#toasts').append(e);setTimeout(()=>{e.classList.add('out');setTimeout(()=>e.remove(),350)},2600)}
function scrim(html){$('#scrimIn').innerHTML=html;$('#scrim').classList.add('show')}
function closeScrim(){$('#scrim').classList.remove('show')}
$('#scrim').addEventListener('mousedown',e=>{if(e.target.id==='scrim')closeScrim()});
addEventListener('keydown',e=>{if(e.key==='Escape')closeScrim()});
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-seg] button');
  if(s){$$('button',s.parentNode).forEach(b=>b.classList.toggle('on',b===s))}
  const t=e.target.closest('[data-tg]');
  if(t)t.setAttribute('aria-checked',t.getAttribute('aria-checked')!=='true');
  const n=e.target.closest('[data-toast]');
  if(n)toast(n.dataset.toast);
  if(e.target.closest('[data-confirm]'))scrim(`<div class="float" style="padding:22px 24px;max-width:380px;margin:auto"><b style="font-size:16px">删除所选文件？</b><p class="sm mute" style="margin:calc(6px*var(--y)) 0 calc(16px*var(--y))">删除后可以在 30 天内从回收站恢复。</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" onclick="closeScrim()">保留</button><button class="btn" onclick="closeScrim();toast('已删除，可撤销')">确认删除</button></div></div>`);
});

/* 主题切换：主题全部来自 themes.json */
const barT=$('#barT');
THEMES.themes.forEach(t=>{const b=document.createElement('button');b.dataset.s=t.id;b.setAttribute('aria-label',t.name.zh);b.innerHTML=`<i style="background:${t.swatch}"></i><span>${t.name.zh}</span>`;b.onclick=e=>switchTheme(t.id,e);barT.append(b)});
function setScheme(k){root.dataset.scheme=k;$$('#barIn button[data-s]').forEach(b=>b.classList.toggle('on',b.dataset.s===k));$$('.th').forEach(c=>c.classList.toggle('cur',c.dataset.scheme===k));try{localStorage.setItem('scheme',k)}catch(e){}window.syncDevice&&syncDevice();document.dispatchEvent(new Event('schemechange'))}
/* 从点击处圆形展开新主题 */
function switchTheme(k,e){if(root.dataset.scheme===k)return;if(!document.startViewTransition||matchMedia('(prefers-reduced-motion:reduce)').matches||!e){setScheme(k);return}const x=e.clientX,y=e.clientY,r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));const t=UX.transition(()=>setScheme(k));t.ready.then(()=>root.animate({clipPath:[`circle(0 at ${x}px ${y}px)`,`circle(${r}px at ${x}px ${y}px)`]},{duration:620,easing:'cubic-bezier(.16,1,.3,1)',pseudoElement:'::view-transition-new(root)'})).catch(()=>{})}
let saved=new URLSearchParams(location.hash.slice(1)).get('scheme');try{saved=saved||localStorage.getItem('scheme')}catch(e){}
setScheme(saved&&THEMES.themes.some(s=>s.id===saved)?saved:THEMES.default);

/* 目录：刻度是待机的核，悬停展开；手机上是底部胶囊。滚动用脚本完成，任何打开方式都有效 */
const rail=$('#rail'),NAV=[['terms','术语'],['schemes','主题'],['shape','圆角 · 边框 · 层级'],['controls','控件'],['workspace','工作台'],['dash','数据看板'],['canvas','画布与节点'],['maps','关系图'],['agents','多 Agent'],['more','AI · 小组件'],['work','资料 · 任务'],['daily','日常场景'],['values','数值表'],['refs','参考来源']];
function goTo(id){document.getElementById(id).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}
rail.innerHTML=NAV.map(([id,n])=>`<a href="#${id}" data-go="${id}" aria-label="${n}"><span>${n}</span></a>`).join('');
$('#pnavL').innerHTML=NAV.map(([id,n])=>`<a data-go="${id}">${n}</a>`).join('');
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

/* 主题卡：局部固定 data-scheme，直接预览 */
$('#scheme-cards').innerHTML=THEMES.themes.map(t=>`<div class="th" data-cmp data-live data-nofocus data-scheme="${t.id}" onclick="switchTheme('${t.id}',event)">
<div class="vol th-vol"><span class="xs b">Income</span><div class="big" style="font-size:20px">$32,023</div></div>
<div class="row" style="margin-top:calc(6px*var(--y));gap:4px;flex-wrap:nowrap"><span class="tag on">${t.mode==='dark'?'暗':'亮'}</span>${[1,2,3,4,5].map(i=>`<i class="dotc" style="background:var(--c${i})"></i>`).join('')}</div>
<div class="b" style="margin-top:calc(5px*var(--y))">${t.name.zh}</div><p class="xs mute" style="line-height:var(--lh-t)">${t.note.zh}</p>
<div class="row th-swatch">${['sunk','ground','card','sel','ink2','ink','signal'].map(v=>`<i style="flex:1;height:10px;background:var(--${v});display:block"></i>`).join('')}</div></div>`).join('');
setScheme(root.dataset.scheme);

/* 圆角 */
$('#radii').innerHTML=[['9','控件','按钮、输入框、标签','var(--r-ctl)'],['16','卡片','卡片、菜单、节点','var(--r-card)'],['22','面板','工作台、体积卡、大浮层','var(--r-panel)'],['999','胶囊','开关、头像、圆点','999px'],['0','拼接','胶片帧之间、表格行','0']].map(([n,t,u,r])=>`<div class="card" style="padding:8px 10px"><div style="height:36px;background:var(--app);border-radius:${r};box-shadow:var(--e1)"></div><div class="between" style="margin-top:calc(6px*var(--y))"><b class="sm">${t}</b><span class="mono xs mute">${n}</span></div><div class="xs mute" style="line-height:var(--lh-t)">${u}</div></div>`).join('');

/* 点阵环 */
function dial(svg){let s='';for(let r=0;r<5;r++){const R=50+r*13,n=30+r*7;for(let k=0;k<n;k++){const a=-Math.PI/2+k/n*Math.PI*2,x=110+R*Math.cos(a),y=110+R*Math.sin(a),t=k/n;let c='var(--dot)',d=1.3;if(r===1&&t<.22){c='var(--c1)';d=3}if(r===3&&t>.2&&t<.5&&k%2===0){c='var(--ink)';d=2.6}s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${d}" fill="${c}"/>`}}svg.innerHTML=s}
$$('[data-dial]').forEach(dial);
let stv=2;$('[id="st-"]').onclick=()=>{stv=Math.max(0,stv-1);$('#stv').textContent=stv};$('[id="st+"]').onclick=()=>{stv++;$('#stv').textContent=stv};

/* ========== 工作台 ========== */
(function(){
const sf=$('#sf'),tl=$('#sfTl'),bar=$('#coBar'),co=$('#sfCo'),inp=$('#coIn'),cp=$('#sfCp');
/* 模式 */
$$('#sfMode button').forEach(b=>b.onclick=()=>{$$('#sfMode button').forEach(x=>x.classList.toggle('on',x===b));sf.classList.toggle('explore',b.dataset.m==='explore');clearSel();if(b.dataset.m==='explore')cvFit()});
/* 聚焦范围：点到组件内的非输入区，焦点仍留在组件内；输入栏空白处把光标还给输入框 */
bar.addEventListener('mousedown',e=>{if(e.target===bar){e.preventDefault();inp.focus()}});
$('#coTrace').addEventListener('mousedown',e=>{if(!e.target.closest('#coBody'))$('#coBody').focus()});
co.addEventListener('keydown',e=>{if(e.key==='Escape'){document.activeElement.blur();e.stopPropagation()}});
/* 发送 */
const body=$('#coBody');
function send(){const pill=$('.co-pill',inp);const t=inp.textContent.replace(pill?pill.textContent:'','').trim();if(!t)return;body.insertAdjacentHTML('beforeend',`<div class="cmsg me"><span></span></div>`);body.lastElementChild.firstChild.textContent=t;inp.textContent='';if(pill)inp.append(pill);body.scrollTop=1e5;setTimeout(()=>{body.insertAdjacentHTML('beforeend','<div class="cmsg">收到。这是本地示例回复。</div>');body.scrollTop=1e5},500);inp.focus()}
inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
$('#coSend').onclick=send;
const dropPill=()=>{const p=$('.co-pill',inp);if(p)p.remove()};
const clearClips=()=>{$$('.clip.sel',strip).forEach(x=>x.classList.remove('sel'));$$('.lane',strip).forEach(l=>l.style.height='')};
function clearSel(){cp.classList.remove('open');$$('.selel.on').forEach(x=>x.classList.remove('on'));clearClips();$$('.ci.sel').forEach(x=>x.classList.remove('zoom','sel'));dropPill()}
inp.addEventListener('input',()=>{if(!inp.textContent&&!$('.co-pill',inp))inp.innerHTML=''});
function setPill(n){let p=$('.co-pill',inp);if(!p){p=document.createElement('span');p.className='co-pill';p.contentEditable=false;inp.prepend(p)}p.textContent='@'+n}
/* 选中文字 → 打开上下文面板（挤占），并把 @ 标签放进输入框 */
const NAMES={light:'Shot 07',mara:'Mara',line:'Shot 08',tape:'Tape',jun:'Jun',line2:'Shot 09',push:'Shot 10'};
$$('.selel').forEach(el=>el.onclick=()=>{clearClips();$$('.selel').forEach(x=>x.classList.toggle('on',x===el));const n=NAMES[el.dataset.k];$('#cpT').textContent=n;setPill(n);cp.classList.add('open')});
$('#cpX').onclick=clearSel;
/* 胶片 */
const strip=$('#strip');
function film(){tl.classList.remove('lanes');const f=Array.from({length:18},(_,i)=>`<div class="pic ${'abcd'[i%4]} ${i===8?'cur':''}" data-i="${i}"></div>`).join('');const p=`<div class="perf">${'<i></i>'.repeat(50)}</div>`;strip.innerHTML=p+`<div class="frames" style="transform:translateX(-160px)">${f}</div>`+p}
function lanes(){tl.classList.add('lanes');const L=[['c1',[[2,16],[24,12],[44,22],[74,14]]],['c2',[[0,30],[36,40]]],['c3',[[10,6],[30,8],[52,6],[66,10],[84,8]]]];strip.innerHTML=`<div class="lanes-b">${L.map(([c,cs])=>`<div class="lane">${cs.map(([l,w])=>`<div class="clip" style="left:${l}%;width:${w}%;background:var(--${c})">${Array.from({length:Math.round(w)},(_,k)=>`<i style="height:${20+Math.abs(Math.sin(k*1.3+l))*60}%"></i>`).join('')}</div>`).join('')}</div>`).join('')}</div>`;
 $$('.clip',strip).forEach(c=>c.onclick=()=>{$$('.selel.on').forEach(x=>x.classList.remove('on'));dropPill();$$('.clip',strip).forEach(x=>x.classList.remove('sel'));c.classList.add('sel');const lane=c.parentNode;$$('.lane',strip).forEach(l=>l.style.height=(l===lane?46:18)+'px');$('#cpT').textContent='Audio clip';cp.classList.add('open')})}
$$('.tl-tt button').forEach(b=>b.onclick=()=>{if($('.clip.sel',strip))clearSel();$$('.tl-tt button').forEach(x=>x.classList.toggle('on',x===b));b.dataset.t==='film'?film():lanes()});film();
const menu=$('#tlMenu');$('#tlName').onclick=e=>{e.stopPropagation();menu.classList.toggle('show')};
$$('div',menu).forEach(d=>d.onclick=e=>{e.stopPropagation();menu.classList.remove('show');const t=d.textContent.replace('✓','').trim();if(!t.startsWith('＋')){$('#tlName').textContent=t+' ▾';$$('div',menu).forEach(x=>{x.classList.toggle('on',x===d);const s=$('span',x);if(s)s.remove()});d.insertAdjacentHTML('beforeend','<span>✓</span>')}});
document.addEventListener('click',()=>menu.classList.remove('show'));tl.addEventListener('ux:rest',()=>menu.classList.remove('show'));addEventListener('keydown',e=>{if(e.key==='Escape')menu.classList.remove('show')});
/* Explore 画布 */
const vp=$('#cvVp'),inr=$('#cvIn');let P={x:0,y:0,s:1};const ap=()=>inr.style.transform=`translate(${P.x}px,${P.y}px) scale(${P.s})`;
const items=[['note','note',60,40,'LOGLINE','The quiet city','A couple keeps every tape of a life they stopped living.'],['img','char',310,10,'Mara','a'],['img','mood',540,70,'Night window','c'],['note','note',790,30,'THEME','留白','Nothing is explained. Sound leaves first.'],['img','char',90,240,'Jun','d'],['note','mood',320,220,'TONE','CRT 冷光','Low key, single source, dust in the beam.'],['img','mood',560,290,'Stair','b'],['note','note',800,240,'NOTE','Shot 9','Slow push-in. Hold 2 beats after the line.'],['img','char',1020,120,'Tape','a']];
inr.innerHTML=items.map((t,i)=>t[0]==='note'?`<div class="ci note" data-g="${t[1]}" data-i="${i}" style="left:${t[2]}px;top:${t[3]}px"><div class="ci-t">${t[4]}</div><div class="ci-h">${t[5]}</div><div class="ci-b">${t[6]}</div></div>`:`<div class="ci img" data-g="${t[1]}" data-i="${i}" style="left:${t[2]}px;top:${t[3]}px"><div class="pic ${t[5]}"></div><div class="ci-c">${t[4]}</div></div>`).join('');
window.cvFit=()=>{const w=vp.clientWidth;P.s=Math.min(1,w/1320);P.x=(w-1240*P.s)/2;P.y=70;ap()};
let pan=null;vp.addEventListener('pointerdown',e=>{const c=e.target.closest('.ci');if(c){const sx=e.clientX,sy=e.clientY,ox=parseFloat(c.style.left),oy=parseFloat(c.style.top);let moved=false;c.setPointerCapture(e.pointerId);c.classList.add('drag');const mv=ev=>{const dx=(ev.clientX-sx)/P.s,dy=(ev.clientY-sy)/P.s;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;c.style.left=ox+dx+'px';c.style.top=oy+dy+'px'};const up=()=>{c.classList.remove('drag');c.removeEventListener('pointermove',mv);c.removeEventListener('pointerup',up);if(!moved){const on=c.classList.contains('zoom');$$('.ci',inr).forEach(x=>x.classList.remove('zoom','sel'));if(!on){c.classList.add('zoom','sel');setPill(($('.ci-h',c)||$('.ci-c',c)).textContent)}else dropPill()}};c.addEventListener('pointermove',mv);c.addEventListener('pointerup',up);return}if($('.ci.sel',inr))dropPill();$$('.ci',inr).forEach(x=>x.classList.remove('zoom','sel'));pan={x:e.clientX-P.x,y:e.clientY-P.y};vp.classList.add('grab');vp.setPointerCapture(e.pointerId)});
vp.addEventListener('pointermove',e=>{if(pan){P.x=e.clientX-pan.x;P.y=e.clientY-pan.y;ap()}});vp.addEventListener('pointerup',()=>{pan=null;vp.classList.remove('grab')});
vp.addEventListener('wheel',e=>{if(!sf.classList.contains('explore'))return;e.preventDefault();const r=vp.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,ns=Math.max(.4,Math.min(2,P.s*(e.deltaY<0?1.08:.92)));P.x=mx-(mx-P.x)*ns/P.s;P.y=my-(my-P.y)*ns/P.s;P.s=ns;ap()},{passive:false});
inr.addEventListener('dblclick',e=>{const c=e.target.closest('.ci');if(!c)return;const h=($('.ci-h',c)||$('.ci-c',c)).textContent,b=$('.ci-b',c);scrim(b?`<div style="max-height:64vh;overflow:auto"><div class="xs faint b" style="letter-spacing:.14em">${$('.ci-t',c).textContent}</div><h2 style="font-size:28px;margin:10px 0">${h}</h2><p style="line-height:1.8">${b.textContent}</p></div>`:`<div class="pic ${$('.pic',c).className.split(' ')[1]}" style="height:min(46vh,320px);box-shadow:var(--e4)"></div><p class="sm" style="text-align:center;margin-top:calc(12px*var(--y))">${h}</p>`)});
$$('#cvRail button').forEach(b=>b.onclick=()=>{$$('#cvRail button').forEach(x=>x.classList.toggle('on',x===b));const f=b.dataset.f;inr.classList.toggle('flt',f!=='all');$$('.ci',inr).forEach(c=>c.classList.toggle('m',c.dataset.g===f))});
})();

/* ========== 动效卡 ========== */
const MO=[
 ['悬停抬起','.2s，只加阴影，不移动',`<div class="card lift mo-demo" style="padding:8px 18px;background:var(--card)">移上来</div>`,'hover'],
 ['意图延迟','.15s 后才响应，路过不触发',`<div class="mo-demo" data-d style="padding:8px 16px;border-radius:12px;background:var(--card);transition:box-shadow .35s var(--ease) .15s,transform .35s var(--ease) .15s" onmouseenter="this.style.boxShadow='var(--e3)'" onmouseleave="this.style.boxShadow=''">快速划过我</div>`,'hover'],
 ['工具浮现','.25s 淡入并下落 8px',`<div class="mo-tool"><div class="seg" style="opacity:0;visibility:hidden;transform:translateY(-8px);transition:opacity .25s,transform .35s var(--ease),visibility 0s;position:absolute;top:6px;left:50%;margin-left:-58px" data-o><button class="on">A</button><button>B</button><button>C</button></div><div style="padding:6px 16px;border-radius:12px;background:var(--card);margin-top:calc(36px*var(--y))">目标</div></div>`,'play'],
 ['挤占','.52s，两者一起重新居中',`<div style="display:flex;width:100%;justify-content:center;gap:0" class="mo-push"><div style="flex:0 1 150px;height:60px;background:var(--card);border-radius:9px"></div><div data-o style="flex:0 0 0;width:0;height:60px;background:var(--signal);border-radius:9px;opacity:0;transition:flex-basis .52s cubic-bezier(.22,1,.3,1),opacity .35s,margin .52s;margin-left:0"></div></div>`,'play'],
 ['覆盖','.35s，底下不动',`<div style="width:100%;height:80px;position:relative"><div class="xs mute" style="padding:6px">正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文</div><div data-o style="position:absolute;left:0;right:0;bottom:0;height:52px;background:var(--glass);backdrop-filter:blur(5px);border-radius:10px;opacity:0;transition:opacity .35s;box-shadow:0 -4px 14px var(--shadow-2)"></div></div>`,'play'],
 ['退场','.35s 高度变 0，下移 20px',`<div style="width:100%"><div data-o style="height:30px;background:var(--card);border-radius:8px;transition:all .35s var(--ease);margin-bottom:calc(6px*var(--y));overflow:hidden"></div><div style="height:30px;background:var(--sunk);border-radius:8px"></div></div>`,'play'],
 ['输入扩展','.5s 宽度 60% → 80%',`<div data-o style="width:60%;height:38px;background:var(--card);border-radius:12px;transition:width .5s var(--ease),box-shadow .5s var(--ease)"></div>`,'play'],
 ['变暗','.3s 降到 .3，仍可点击',`<div class="row" style="flex-wrap:nowrap"><div style="padding:12px 18px;background:var(--card);border-radius:10px" class="sm b">活动</div><div data-o class="sm" style="padding:12px 18px;background:var(--card);border-radius:10px;transition:opacity .3s">其他</div></div>`,'play'],
 ['通知','.45s 从上滑入，不挤内容',`<div style="width:100%;height:80px;position:relative;overflow:hidden"><div class="xs mute" style="padding-top:28px;text-align:center">内容不动</div><div data-o class="xs" style="position:absolute;left:10%;right:10%;top:6px;padding:6px 10px;background:var(--ink);color:var(--app);border-radius:9px;transform:translateY(-140%);transition:transform .45s var(--ease)">已保存</div></div>`,'play'],
];
const MSP=['s3','s3','s3','s3','s4','s4','s4','s6','s6'];
$('#motion').innerHTML=MO.map((m,i)=>`<div class="card mo ${MSP[i]}" data-cmp data-live><div class="between"><div><b>${m[0]}</b><div class="xs mute">${m[1]}</div></div>${m[3]==='play'?`<button class="btn sec2 sm" data-mo="${i}">播放</button>`:'<span class="xs faint">悬停</span>'}</div><div class="mo-stage" id="mo${i}">${m[2]}</div></div>`).join('');
const STATES={2:()=>[{opacity:1,visibility:'visible',transform:'none'},{opacity:0,visibility:'hidden',transform:'translateY(-8px)'}],3:()=>[{flexBasis:'110px',opacity:1,marginLeft:'6px'},{flexBasis:'0px',opacity:0,marginLeft:'0px'}],4:()=>[{opacity:1},{opacity:0}],5:()=>[{height:'0px',opacity:0,transform:'translateY(20px)',marginBottom:'0px'},{height:'30px',opacity:1,transform:'none',marginBottom:'6px'}],6:()=>[{width:'80%',boxShadow:'var(--e3)'},{width:'60%',boxShadow:'none'}],7:()=>[{opacity:.3},{opacity:1}],8:()=>[{transform:'none'},{transform:'translateY(-140%)'}]};
document.addEventListener('click',e=>{const b=e.target.closest('[data-mo]');if(!b)return;const i=+b.dataset.mo,o=$('[data-o]',$('#mo'+i)),[a,z]=STATES[i]();Object.assign(o.style,a);setTimeout(()=>Object.assign(o.style,z),1300)});

/* 菜单：点开，选完或点外面就收起 */
(function(){const p=$('#mPop'),b=$('#mTrig');b.onclick=e=>{e.stopPropagation();p.classList.toggle('show')};$$('div',p).forEach(d=>d.onclick=()=>{p.classList.remove('show');const t=d.childNodes[0].textContent.trim();if(!t.startsWith('＋')){b.textContent=t+' ▾';$$('div',p).forEach(x=>{x.classList.toggle('on',x===d);const s=$('span',x);if(s)s.remove()});d.insertAdjacentHTML('beforeend',' <span>✓</span>')}});document.addEventListener('click',()=>p.classList.remove('show'));addEventListener('keydown',e=>{if(e.key==='Escape')p.classList.remove('show')})})();
