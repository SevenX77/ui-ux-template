/* ========== UX 层：所有样张共用的显隐和注意力规则 ==========
   声明方式：
   data-scope            一块表面，其中的组件互相竞争注意力
   data-dim="focus|hover|none"  别人在什么时候变暗，默认 focus
   data-cmp              组件。状态写在 data-state：rest / hover / focus / dim
   data-nofocus          组件只有悬停，没有聚焦
   data-tool             组件的工具：静息隐藏，悬停或聚焦时出现
   data-keep             点到这里不算离开聚焦范围
   事件：ux:hover ux:rest ux:focus ux:blur，会冒泡 */
const UX=(()=>{
  const INTENT=150,RELEASE=500,touch=()=>matchMedia('(hover:none)').matches;
  const store=new WeakMap(),focused=new Set();
  const get=s=>{let d=store.get(s);if(!d){d={hover:null,last:null,over:null,pend:0,exit:0,focus:null};store.set(s,d)}return d};
  const cmpOf=n=>n&&n.closest?n.closest('[data-cmp]'):null;
  const scopeOf=c=>c.closest('[data-scope]')||document.body;
  const emit=(c,t)=>c.dispatchEvent(new CustomEvent('ux:'+t,{bubbles:true}));
  function paint(s){
    const d=get(s),mode=s.dataset.dim||'focus';
    s.classList.toggle('ux-busy',!!d.hover);s.classList.toggle('ux-active',!!d.focus);
    s.querySelectorAll('[data-cmp]').forEach(c=>{
      if(scopeOf(c)!==s)return;
      let st='rest';
      if(c===d.focus)st='focus';else if(c===d.hover)st='hover';
      else if(mode!=='none'&&(d.focus||(mode==='hover'&&d.hover)))st='dim';
      c.dataset.state=st;c.classList.toggle('ux-dim',st==='dim');
    });
  }
  /* 注意力锁：同一表面一次一个悬停，前一个离开 500ms 后才放行 */
  function admit(s,c){const d=get(s);d.hover=d.last=c;c.classList.add('ux-hover');paint(s);emit(c,'hover')}
  function enter(c){
    if(touch())return;
    const s=scopeOf(c),d=get(s);d.over=c;clearTimeout(d.pend);
    if(d.hover===c)return;
    if(d.exit){if(d.last===c){clearTimeout(d.exit);d.exit=0;admit(s,c)}return}
    if(d.hover)return;
    d.pend=setTimeout(()=>admit(s,c),INTENT);
  }
  function leave(c){
    const s=scopeOf(c),d=get(s);if(d.over===c)d.over=null;clearTimeout(d.pend);
    if(d.hover!==c)return;
    d.hover=null;c.classList.remove('ux-hover');paint(s);emit(c,'rest');
    d.exit=setTimeout(()=>{d.exit=0;d.last=null;if(d.over)admit(s,d.over)},RELEASE);
  }
  document.addEventListener('mouseover',e=>{const c=cmpOf(e.target);if(c&&!c.contains(e.relatedTarget))enter(c)});
  document.addEventListener('mouseout',e=>{const c=cmpOf(e.target);if(c&&!c.contains(e.relatedTarget))leave(c)});
  /* 聚焦：立刻响应；只有点到范围外或按 Esc 才结束 */
  function blur(s){const d=get(s);if(!d.focus)return;const c=d.focus;d.focus=null;c.classList.remove('ux-focus');focused.delete(s);paint(s);emit(c,'blur')}
  function focus(c){const s=scopeOf(c),d=get(s);if(d.focus===c)return;blur(s);d.focus=c;c.classList.add('ux-focus');focused.add(s);paint(s);emit(c,'focus')}
  const outside=t=>t.closest&&t.closest('#scrim,.bar,.rail,.pnav,.toast-host');
  document.addEventListener('pointerdown',e=>{
    if(outside(e.target))return;
    const c=cmpOf(e.target),keep=e.target.closest&&e.target.closest('[data-keep]');
    [...focused].forEach(s=>{const d=get(s);if(d.focus.contains(e.target))return;if(keep&&s.contains(keep))return;if(c&&scopeOf(c)===s&&!c.hasAttribute('data-nofocus'))return;blur(s)});
    if(c&&!c.hasAttribute('data-nofocus'))focus(c);
  },true);
  document.addEventListener('focusin',e=>{if(!e.target.matches(':focus-visible'))return;const c=cmpOf(e.target);if(c&&!c.hasAttribute('data-nofocus'))focus(c)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')[...focused].forEach(blur)});
  /* 组件内部的条目：只有意图延迟，没有注意力锁 */
  function intent(el,on,off){let t=0;el.addEventListener('mouseenter',()=>{if(touch())return;t=setTimeout(on,INTENT)});el.addEventListener('mouseleave',()=>{clearTimeout(t);off&&off()})}
  /* 位置变化用 FLIP 补间，元素不会跳 */
  function flip(host,sel,fn){
    const els=[...host.querySelectorAll(sel)],a=new Map(els.map(e=>[e,e.getBoundingClientRect()]));fn();
    els.forEach(e=>{const r=a.get(e),b=e.getBoundingClientRect(),dx=r.left-b.left,dy=r.top-b.top;if(dx||dy)e.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'})});
  }
  return {intent,flip,blur:s=>blur(s),focus,paint};
})();

/* ========== 分段切换：同一块信号滑过去，不闪现 ========== */
(function(){
  const place=s=>{const i=s.querySelector(':scope>.seg-ind'),b=s.querySelector(':scope>button.on');if(!i)return;if(!b||!b.offsetWidth){i.style.opacity=0;return}i.style.opacity=1;i.style.width=b.offsetWidth+'px';i.style.height=b.offsetHeight+'px';i.style.transform=`translate(${b.offsetLeft}px,${b.offsetTop}px)`};
  const ro=new ResizeObserver(es=>es.forEach(e=>place(e.target)));
  const init=s=>{if(s.querySelector(':scope>.seg-ind'))return;const i=document.createElement('i');i.className='seg-ind';s.prepend(i);i.style.transition='none';place(s);requestAnimationFrame(()=>i.style.transition='');ro.observe(s)};
  const scan=r=>r.querySelectorAll&&r.querySelectorAll('.seg,.notch').forEach(init);
  new MutationObserver(ms=>ms.forEach(m=>{
    if(m.type==='attributes'){const p=m.target.parentElement;if(p&&p.matches('.seg,.notch'))place(p)}
    else m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;scan(n);if(n.matches('.seg,.notch'))init(n)});
  })).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('DOMContentLoaded',()=>scan(document));
  document.addEventListener('langchange',()=>document.querySelectorAll('.seg,.notch').forEach(place));
  window.segScan=()=>scan(document);
})();

/* ========== 进入视野：错开浮现，数字计数，图表绘入 ========== */
function whenSeen(el,fn,opt){const o=new IntersectionObserver((es,ob)=>{if(es[0].isIntersecting){ob.disconnect();fn()}},opt);o.observe(el)}
function countUp(el){const z=+el.dataset.count,pre=el.dataset.pre||'',suf=el.dataset.suf||'',t0=performance.now();(function f(t){const p=Math.min(1,(t-t0)/900),v=1-Math.pow(1-p,3);el.textContent=pre+Math.round(z*v).toLocaleString('en-US')+suf;if(p<1)requestAnimationFrame(f)})(t0)}
function revealAll(){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const groups=document.querySelectorAll('.sec>.bento,.sec>.grid,.sec>.daily,.sec>.kan,.dash-r,#scheme-cards,.top>.bento');
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io.unobserve(e.target);[...e.target.children].forEach((c,i)=>{c.classList.remove('pre');c.style.animationDelay=Math.min(i,8)*38+'ms';c.classList.add('rise');c.addEventListener('animationend',()=>{c.classList.remove('rise');c.style.animationDelay=''},{once:true})})}),{rootMargin:'0px 0px -6% 0px'});
  groups.forEach(g=>{[...g.children].forEach(c=>c.classList.add('pre'));io.observe(g)});
}
