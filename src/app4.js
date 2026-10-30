/* ========== 语言切换：记住原文，整页替换，动态内容由观察器接手 ========== */
(function(){
const ATTRS=['placeholder','aria-label','data-tip','data-t','data-ph','data-toast','value'];
const textOrig=new Map(),attrOrig=new Map();let writing=false;
const skip=n=>n.parentElement&&n.parentElement.closest('script,style,[data-noi18n]');
function doText(n){if(skip(n))return;if(!HAS_ZH.test(n.data))return;textOrig.set(n,n.data);const v=tr(n.data);if(v!==n.data)n.data=v}
function doAttrs(el){for(const a of ATTRS){if(!el.hasAttribute||!el.hasAttribute(a))continue;const v=el.getAttribute(a);if(!HAS_ZH.test(v))continue;let o=attrOrig.get(el);if(!o){o={};attrOrig.set(el,o)}o[a]=v;const t=tr(v);if(t!==v)el.setAttribute(a,t)}}
function walk(r){if(r.nodeType===3){doText(r);return}if(r.nodeType!==1)return;doAttrs(r);const w=document.createTreeWalker(r,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))n.nodeType===3?doText(n):doAttrs(n)}
const ob=new MutationObserver(ms=>{if(LANG.cur==='zh')return;writing=true;ms.forEach(m=>{if(m.type==='characterData'){if(!HAS_ZH.test(m.target.data))textOrig.delete(m.target);doText(m.target)}else if(m.type==='attributes')doAttrs(m.target);else m.addedNodes.forEach(walk)});ob.takeRecords();writing=false});
function applyLang(l){
  LANG.cur=l;root.lang=l;
  ob.disconnect();
  if(l==='zh'){textOrig.forEach((v,n)=>{if(n.isConnected)n.data=v});textOrig.clear();attrOrig.forEach((o,el)=>{for(const a in o)el.setAttribute(a,o[a])});attrOrig.clear()}
  else{walk(document.body);ob.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS})}
  $$('#barIn button[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l===l));
  try{localStorage.setItem('lang',l)}catch(e){}
  window.syncDevice&&syncDevice();
  document.dispatchEvent(new Event('langchange'));
}
/* 钉住屏幕上第一个完整的元素：两种语言高度不同，它在屏幕上的位置不能变 */
function pinScroll(fn){
  const el=$$('#page .wrap>*,#page .wrap>*>*').find(e=>{const r=e.getBoundingClientRect();return r.height>0&&r.top>=70}),y=el?el.getBoundingClientRect().top:0;
  fn();
  if(el)scrollBy({top:el.getBoundingClientRect().top-y,behavior:'instant'});
}
/* 换语言：整页交叉淡入，布局的变化藏在淡入里，不会看到跳动 */
let lvt=0;
function setLang(l,now){
  if(now){pinScroll(()=>applyLang(l));return}
  if(l===LANG.cur)return;
  if(!document.startViewTransition||matchMedia('(prefers-reduced-motion:reduce)').matches){pinScroll(()=>applyLang(l));return}
  const my=++lvt;root.classList.add('vt-lang');
  UX.transition(()=>pinScroll(()=>applyLang(l))).finished.catch(()=>{}).finally(()=>{if(my===lvt)root.classList.remove('vt-lang')});
}
window.setLang=setLang;

/* 顶栏：语言、设备 */
const barIn=$('#barIn'),mk=(html,attr,val,fn,host)=>{const b=document.createElement('button');b.innerHTML=html;b.dataset[attr]=val;b.onclick=fn;(host||barIn).append(b);return b},sep=dev=>{const s=document.createElement('span');s.className='sep';if(dev)s.dataset.dev='';barIn.append(s)},group=dev=>{const g=document.createElement('div');g.className='seg quiet';if(dev)g.dataset.dev='';barIn.append(g);return g};
sep();const gl=group();mk('中','l','zh',()=>setLang('zh'),gl);mk('EN','l','en',()=>setLang('en'),gl);
const params=new URLSearchParams(location.hash.slice(1)),embed=!!params.get('embed');
const frame=$('#devFrame'),shell=$('#devShell');
function size(){shell.style.height=Math.min(864,innerHeight-80)+'px'}
window.syncDevice=()=>{if(frame.contentWindow&&frame.src)frame.contentWindow.postMessage({scheme:root.dataset.scheme,lang:LANG.cur},'*')};
function setDev(d){document.body.classList.toggle('phone-mode',d==='phone');$$('#barIn button[data-dev]:not([data-dev=notes])').forEach(b=>b.classList.toggle('on',b.dataset.dev===d));if(d==='phone'){size();if(!frame.src)frame.src=`${location.protocol==='data:'?location.href.split('#')[0]:location.href.split(/[?#]/)[0]+'?embed=1'}#embed=1&scheme=${root.dataset.scheme}&lang=${LANG.cur}`;else syncDevice()}try{localStorage.setItem('device',d)}catch(e){}}
window.setDev=setDev;
if(!embed){sep(true);const gd=group(true);mk('Web','dev','web',()=>setDev('web'),gd);mk('手机','dev','phone',()=>setDev('phone'),gd);addEventListener('resize',size);sep(true);const nb=mk('标注','dev','notes',()=>{const on=document.body.classList.toggle('ux-notes');nb.classList.toggle('on',on)})}
$('#devNav').innerHTML='<div class="xs mute">390 × 844</div>'+$$('#rail a').map(a=>`<a data-go="${a.dataset.go}">${a.textContent}</a>`).join('');
$('#devNav').addEventListener('click',e=>{const a=e.target.closest('[data-go]');if(a)frame.contentWindow.postMessage({go:a.dataset.go},'*')});
addEventListener('message',e=>{if(e.source!==parent||!embed)return;const m=e.data||{};if(m.scheme)setScheme(m.scheme);if(m.lang&&m.lang!==LANG.cur)setLang(m.lang);if(m.go)goTo(m.go)});

let sl=params.get('lang');try{sl=sl||localStorage.getItem('lang')}catch(e){}
setLang(sl==='en'?'en':'zh',true);
let sd=null;try{sd=localStorage.getItem('device')}catch(e){}
if(!embed)setDev(sd==='phone'?'phone':'web');
/* 说明性的卡片也是组件：移上去出阴影；没有可触发的交互时，别的组件不变暗 */
$$('.sec>.bento:not([data-scope]),.sec>.grid:not([data-scope])').forEach(s=>{s.dataset.scope=s.id||'cards';$$('.card,.vol,.float,.recess',s).forEach(c=>{if(c.closest('[data-scope]')===s&&!c.parentElement.closest('.card,.vol,[data-cmp]')&&!c.hasAttribute('data-cmp')){c.dataset.cmp='';c.dataset.nofocus=''}})});
$$('[data-cmp]').forEach(c=>{if(!c.dataset.state)c.dataset.state='rest'});
revealAll();
})();
