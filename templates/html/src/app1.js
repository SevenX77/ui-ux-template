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
for(const [key,rows] of Object.entries(CONTENT.terms.groups))$('#terms-'+key).innerHTML=rows.map(row=>card(...row)).join('');

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
const MO=CONTENT.workspace.motion;
function motionNode(node){if(typeof node==='string')return node;return `<${node.tag}${Object.entries(node.attrs).map(([key,value])=>` ${key}="${key==='style'?sampleStyle(value):value}"`).join('')}>${node.children.map(motionNode).join('')}</${node.tag}>`;}
$('#motion').innerHTML=MO.map((m,i)=>`<div class="card mo ${m.span}" data-cmp data-live><div class="between"><div><b>${m.title}</b><div class="xs mute">${m.note}</div></div>${m.kind==='play'?`<button class="btn sec2 sm" data-mo="${i}">${CONTENT.workspace.motionLabels.play}</button>`:`<span class="xs faint">${CONTENT.workspace.motionLabels.hover}</span>`}</div><div class="mo-stage" id="mo${i}">${m.body.map(motionNode).join('')}</div></div>`).join('');
const STATES=CONTENT.workspace.motionStates;
const delayDemo=$('[data-d]',$('#motion'));delayDemo.addEventListener('mouseenter',()=>Object.assign(delayDemo.style,CONTENT.workspace.motionHover.on));delayDemo.addEventListener('mouseleave',()=>Object.assign(delayDemo.style,CONTENT.workspace.motionHover.off));
document.addEventListener('click',e=>{const b=e.target.closest('[data-mo]');if(!b)return;const i=+b.dataset.mo,o=$('[data-o]',$('#mo'+i)),[a,z]=STATES[i];Object.assign(o.style,a);setTimeout(()=>Object.assign(o.style,z),CONTENT.workspace.motionReset)});

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
