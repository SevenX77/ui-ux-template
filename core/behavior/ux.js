/* ========== UX 层：所有样张共用的显隐和注意力规则 ==========
   声明方式：
   data-scope            一块表面，其中的组件互相竞争注意力
   data-dim="none"       这块表面不变暗；默认是鼠标移上有交互的组件，其他组件就变暗
   data-lock             组件彼此争整块表面：前一个离开 500ms 后才放行下一个
   data-hold             点开会展开内容、占位置：鼠标移走后别人继续变暗，点外面才结束。可写在表面或组件上
   data-cmp              组件。状态写在 data-state：rest / hover / focus / dim
   data-nofocus          组件只有悬停，没有聚焦
   data-passive          只接收同一表面的变暗状态，不获取悬停或聚焦
   data-live             组件没有控件，但指针或点击会让它变化（拖动、悬停演示、点击切换）
   data-tool             组件的工具：静息隐藏，悬停或聚焦时出现
   data-keep             点到这里不算离开聚焦范围
   data-canvas           无限画布的舞台：拖空白处平移，点空白处才算离开。用 UX.canvas 接管视图
   UX.canvas(stage, {world,panel,root})  组件坐标只属于 world；视图可以让开，坐标不变（规则 26）
   UX.dimOthers()/UX.dimOthers(on)  读写全局开关：关掉后别的组件不变暗，被关注的组件照常浮起（规则 27）
   UX.hitRegion(c, {enter,exit,bounds,enabled})  可见实体组成的命中范围；enter/exit 返回元素；bounds 使用包围框。返回清理函数
   没有 data-hold 的组件点不点都一样：鼠标在它上面时别人变暗，移走就恢复。
   纯展示组件（没有控件，也没有 data-live）只出阴影，别人不变暗，也没有聚焦。
   事件：ux:hover ux:rest ux:focus ux:blur，会冒泡 */
const UX=(()=>{
  const INTENT=150,RELEASE=500,LINGER=150,touch=()=>matchMedia('(hover:none)').matches;
  const store=new WeakMap(),focused=new Set(),regions=new Map();
  const get=s=>{let d=store.get(s);if(!d){d={hover:null,last:null,over:null,pend:0,exit:0,linger:0,focus:null,quiet:false};store.set(s,d)}return d};
  const cmpOf=n=>n&&n.closest?n.closest('[data-cmp]'):null;
  const scopeOf=c=>c.closest('[data-scope]')||document.body;
  const LIVE='button,a[href],input,select,textarea,[contenteditable],[role=switch],[role=slider],[tabindex],[draggable=true],[data-hold],[data-tool],[data-live]';
  const lively=c=>c.matches(LIVE)||!!c.querySelector(LIVE);
  const holds=c=>!!c.closest('[data-hold]'),locked=s=>s.hasAttribute('data-lock');
  const typing=c=>{const a=document.activeElement;return !!a&&c.contains(a)&&a.matches('input:not([type=range]),textarea,[contenteditable]')};
  const emit=(c,t)=>c.dispatchEvent(new CustomEvent('ux:'+t,{bubbles:true}));
  const root=document.documentElement,dimming=()=>root.dataset.attention!=='raise';
  try{if(localStorage.getItem('dimOthers')==='0')root.dataset.attention='raise'}catch(e){}
  function dimOthers(on){
    if(on===undefined)return dimming();
    if(on)delete root.dataset.attention;else root.dataset.attention='raise';
    try{localStorage.setItem('dimOthers',on?'1':'0')}catch(e){}
    document.querySelectorAll('[data-scope]').forEach(paint);paint(document.body);
  }
  function paint(s){
    const d=get(s),mode=s.dataset.dim;
    s.classList.toggle('ux-busy',!!d.hover);s.classList.toggle('ux-active',!!d.focus);
    s.querySelectorAll('[data-cmp]').forEach(c=>{
      if(scopeOf(c)!==s)return;
      let st='rest';
      if(c===d.focus)st='focus';else if(c===d.hover)st='hover';
      else if(mode!=='none'&&dimming()&&((d.focus&&!d.quiet)||(d.hover&&lively(d.hover))))st='dim';
      /* 每次都按状态重写全部类名：框架重渲染改写 className 后，状态不会丢 */
      c.dataset.state=st;c.classList.toggle('ux-dim',st==='dim');c.classList.toggle('ux-hover',c===d.hover);c.classList.toggle('ux-focus',c===d.focus);
    });
  }
  function admit(s,c){const d=get(s);clearTimeout(d.linger);d.linger=0;d.hover=d.last=c;c.classList.add('ux-hover');paint(s);emit(c,'hover')}
  function enter(c){
    if(touch()||c.hasAttribute('data-passive'))return;
    const s=scopeOf(c),d=get(s);d.over=c;clearTimeout(d.pend);
    if(d.focus===c&&d.quiet){d.quiet=false;paint(s)}
    if(d.hover===c)return;
    /* 注意力锁：只用在 data-lock 的表面 */
    if(locked(s)){if(d.exit){if(d.last===c){clearTimeout(d.exit);d.exit=0;admit(s,c)}return}if(d.hover)return}
    /* 别的组件已经变暗时，从一块直接移到另一块不用再等，也不闪 */
    if(d.linger){admit(s,c);return}
    d.pend=setTimeout(()=>admit(s,c),INTENT);
  }
  function leave(c){
    const s=scopeOf(c),d=get(s);if(d.over===c)d.over=null;clearTimeout(d.pend);
    /* 没展开内容的组件：鼠标移走，聚焦结束；正在输入时保留工具 */
    if(d.focus===c&&!holds(c)){if(typing(c)){d.quiet=true;paint(s)}else blur(s)}
    if(d.hover!==c)return;
    d.hover=null;c.classList.remove('ux-hover');
    if(locked(s)){paint(s);emit(c,'rest');d.exit=setTimeout(()=>{d.exit=0;d.last=null;if(d.over)admit(s,d.over)},RELEASE);return}
    if(s.dataset.dim!=='none'&&lively(c)){c.dataset.state='rest';d.linger=setTimeout(()=>{d.linger=0;paint(s);emit(c,'rest')},LINGER);return}
    paint(s);emit(c,'rest');
  }
  document.addEventListener('mouseover',e=>{const c=cmpOf(e.target);if(c&&!regions.has(c)&&!c.contains(e.relatedTarget))enter(c)});
  document.addEventListener('mouseout',e=>{const c=cmpOf(e.target);if(c&&!regions.has(c)&&!c.contains(e.relatedTarget))leave(c)});
  /* Opt-in hit geometry. Defaults remain unchanged for every other sample.
     The caller supplies real bodies, not another hover/lock implementation. */
  function hitRegion(c,o){
    let inside=false;
    const hit=(parts,x,y)=>{
      const rs=parts.filter(Boolean).filter(e=>{
        const st=getComputedStyle(e);return st.display!=='none'&&st.visibility!=='hidden';
      }).map(e=>e.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
      if(!rs.length)return false;
      if(o.bounds)return x>=Math.min(...rs.map(r=>r.left))&&x<=Math.max(...rs.map(r=>r.right))&&y>=Math.min(...rs.map(r=>r.top))&&y<=Math.max(...rs.map(r=>r.bottom));
      return rs.some(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom);
    };
    const move=e=>{
      const allowed=!o.enabled||o.enabled();
      const now=allowed&&hit((inside?(o.exit||o.enter):o.enter)(),e.clientX,e.clientY);
      if(now===inside)return;inside=now;now?enter(c):leave(c);
    };
    regions.set(c,move);
    const cleanup=()=>{if(inside)leave(c);regions.delete(c);};
    return cleanup;
  }
  document.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;regions.forEach(move=>move(e))},{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget)regions.forEach((move)=>move({clientX:-1e6,clientY:-1e6}))});
  /* 聚焦：立刻响应。展开内容的组件要点到范围外或按 Esc 才结束 */
  function blur(s){const d=get(s);if(!d.focus)return;const c=d.focus;d.focus=null;d.quiet=false;c.classList.remove('ux-focus');focused.delete(s);paint(s);emit(c,'blur')}
  function focus(c){if(c.hasAttribute('data-passive'))return;const s=scopeOf(c),d=get(s);if(d.focus===c)return;blur(s);d.focus=c;d.quiet=touch()&&!holds(c);c.classList.add('ux-focus');focused.add(s);paint(s);emit(c,'focus')}
  const outside=t=>t.closest&&t.closest('#scrim,.bar,.rail,.pnav,.toast-host');
  const focusFromTap=e=>{
    if(outside(e.target)||e.button>0)return;
    const dragged=e.target.closest?.('[data-dragged]');if(e.type==='click'&&dragged){delete dragged.dataset.dragged;return}
    const c=cmpOf(e.target),keep=e.target.closest&&e.target.closest('[data-keep]');
    [...focused].forEach(s=>{const d=get(s);if(d.focus.contains(e.target))return;if(keep&&s.contains(keep))return;if(c&&scopeOf(c)===s&&!c.hasAttribute('data-nofocus')&&lively(c))return;blur(s)});
    if(c&&!c.hasAttribute('data-nofocus')&&lively(c))focus(c);
  };
  /* 画布空白处可能是平移的开始，要等 click 才算点到空白 */
  const blank=e=>!!e.target.closest?.('[data-canvas]')&&!e.target.closest('[data-cmp],[data-keep],button');
  document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&!blank(e))focusFromTap(e)},true);
  document.addEventListener('click',e=>{if(blank(e)||e.pointerType==='touch'||e.sourceCapabilities?.firesTouchEvents||e.detail===0)focusFromTap(e)},true);
  /* 切走窗口再回来时浏览器会把焦点还给输入框，这不算用户聚焦 */
  let away=false;addEventListener('blur',e=>{if(e.target===window)away=true});['pointerdown','keydown'].forEach(t=>addEventListener(t,()=>{away=false},true));
  document.addEventListener('focusin',e=>{if(away||!e.target.matches(':focus-visible'))return;const c=cmpOf(e.target);if(c&&!c.hasAttribute('data-nofocus')&&!(e.target===c&&c.hasAttribute('data-hold')))focus(c)});
  document.addEventListener('focusout',e=>{const c=cmpOf(e.target);if(!c||holds(c))return;const s=scopeOf(c),d=get(s);if(d.focus===c&&!c.contains(e.relatedTarget)&&!c.matches(':hover'))blur(s)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')[...focused].forEach(blur)});
  /* 组件内部的条目：只有意图延迟，没有注意力锁。预览中从一项移到相邻一项直接切换，不先闪回原状 */
  const groups=new WeakMap();
  function intent(el,on,off){
    const key=cmpOf(el)||el.parentNode;let g=groups.get(key);if(!g){g={live:false,back:0};groups.set(key,g)}
    let t=0,disposed=false;const owner={};
    const enter=()=>{if(touch())return;if(g.back){clearTimeout(g.back);g.back=0;g.owner=owner;on();return}t=setTimeout(()=>{g.live=true;g.owner=owner;on()},INTENT)};
    const leave=()=>{clearTimeout(t);if(!g.live||g.back)return;g.back=setTimeout(()=>{g.back=0;g.live=false;g.owner=null;off&&off()},LINGER)};
    el.addEventListener('mouseenter',enter);el.addEventListener('mouseleave',leave);
    return ()=>{if(disposed)return;disposed=true;clearTimeout(t);el.removeEventListener('mouseenter',enter);el.removeEventListener('mouseleave',leave);if(g.owner===owner){clearTimeout(g.back);g.back=0;g.live=false;g.owner=null}};
  }
  /* 位置变化用 FLIP 补间，元素不会跳 */
  const flips=new WeakMap();
  function flip(host,sel,fn){
    const els=[...host.querySelectorAll(sel)],a=new Map(els.map(e=>[e,e.getBoundingClientRect()]));fn();
    /* 上一段补间还没走完就又变位时，从当前看到的位置接着走 */
    els.forEach(e=>{const o=flips.get(e);if(o)o.cancel();flips.delete(e)});
    els.forEach(e=>{if(!e.isConnected)return;const r=a.get(e),b=e.getBoundingClientRect(),dx=r.left-b.left,dy=r.top-b.top;if(dx||dy)flips.set(e,e.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'}))});
  }
  /* 拖动排序：卡片跟着指针走，原位留空槽；空槽实时移到离卡片最近的位置，其他卡片让开，所以松手前就能看到结果。
     item 条目；zone 可放入的容器，默认只有 host；handle 抓手；on 每次变位后调用。Esc 取消，回到原位。
     commit(order) 可选：松手时先恢复原 DOM，再提交 [{zone: Element, items: Element[]}] 的目标顺序，交给框架渲染。
     返回清理函数：移除监听器，取消待开始或正在进行的拖动，并清理浮层与空槽。 */
  const layoutOf=e=>{const p=e.offsetParent||document.body,r=p.getBoundingClientRect();return {x:r.left+p.clientLeft+e.offsetLeft-p.scrollLeft,y:r.top+p.clientTop+e.offsetTop-p.scrollTop}};
  function sortable(host,o){
    const zones=()=>o.zone?[...host.querySelectorAll(o.zone)]:[host];
    const itemsIn=z=>[...z.children].filter(c=>c.matches(o.item));
    let land=null,cur=null,disposed=false;const pending=new Set(),artifacts=new Set();
    function nearest(x,y){let best=null,bd=1/0;zones().forEach(z=>{const r=z.getBoundingClientRect(),dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom),v=dx*dx+dy*dy;if(v<bd){bd=v;best=z}});return best}
    function place(d){
      const z=nearest(d.x,d.y),s=d.el,sibs=itemsIn(z).filter(c=>c!==s),cs=getComputedStyle(s),gap=parseFloat(cs.marginTop)+parseFloat(cs.marginBottom),h=s.offsetHeight;
      /* 每个位置的顶边按「空槽不在这一列」算，所以结果只取决于卡片在哪，来回不会抖 */
      const at=c=>layoutOf(c).y-(s.parentNode===z&&(s.compareDocumentPosition(c)&4)?h+gap:0);
      const tops=sibs.map(at);if(sibs.length)tops.push(tops[sibs.length-1]+sibs[sibs.length-1].offsetHeight+gap);
      const gy=d.y-d.oy;let i=0;tops.forEach((t,k)=>{if(Math.abs(t-gy)<Math.abs(tops[i]-gy))i=k});
      const ref=sibs[i]||null;
      if(s.parentNode===z&&s.nextElementSibling===ref)return;
      flip(host,o.item,()=>{z.insertBefore(s,ref);zones().forEach(q=>q.classList.toggle('ux-over',q===z))});
      o.on&&o.on();
    }
    function tick(d){
      if(cur!==d)return;
      const m=56,v=d.y<m?d.y-m:d.y>innerHeight-m?d.y-innerHeight+m:0;
      if(v)scrollBy({top:v*.35,behavior:'instant'});
      d.g.style.transform=`translate(${d.x-d.ox}px,${d.y-d.oy}px)`;
      if(v||d.moved){d.moved=false;place(d)}
      d.raf=requestAnimationFrame(()=>tick(d));
    }
    function lift(d,e){
      const s=d.el,r=s.getBoundingClientRect(),g=s.cloneNode(true);
      s.querySelectorAll('input,textarea').forEach((f,i)=>{g.querySelectorAll('input,textarea')[i].value=f.value});
      d.ox=d.x-r.left;d.oy=d.y-r.top;
      g.classList.add('ux-ghost');g.style.width=r.width+'px';g.style.height=r.height+'px';g.style.transform=`translate(${r.left}px,${r.top}px)`;
      d.g=g;d.from=[s.parentNode,s.nextElementSibling];artifacts.add(d);document.body.append(g);
      s.classList.add('ux-slot');host.classList.add('ux-sorting');s.parentNode.classList.add('ux-over');
      if(e)try{host.setPointerCapture(e.pointerId)}catch(_){}
      cur=d;tick(d);
    }
    function drop(d,back){
      cur=null;cancelAnimationFrame(d.raf);const s=d.el;
      if(back&&(s.parentNode!==d.from[0]||s.nextElementSibling!==d.from[1])){flip(host,o.item,()=>d.from[0].insertBefore(s,d.from[1]));o.on&&o.on()}
      host.classList.remove('ux-sorting');zones().forEach(q=>q.classList.remove('ux-over'));
      const p=layoutOf(s),g=d.g,order=!back&&o.commit?zones().map(zone=>({zone,items:itemsIn(zone)})):null;
      if(order)d.from[0].insertBefore(s,d.from[1]);
      const a=g.animate([{transform:g.style.transform},{transform:`translate(${p.x}px,${p.y}px)`}],{duration:220,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
      const end=()=>{g.remove();s.classList.remove('ux-slot');artifacts.delete(d);if(land===a)land=null};land=a;a.onfinish=end;a.oncancel=end;
      if(order)o.commit(order);
    }
    const dragstart=e=>e.preventDefault(),touchmove=e=>{if(cur)e.preventDefault()},contextmenu=e=>{if(cur)e.preventDefault()};
    const down=e=>{
      if(e.button)return;
      const t=e.target,el=t.closest(o.item);if(!el||!host.contains(el))return;
      if(o.handle?!t.closest(o.handle):t.closest('button,input,textarea,select,a,[data-tool]'))return;
      if(land)land.finish();
      /* 鼠标移 4px 算开始拖；手指按住 180ms 才算，否则是在滚动页面；抓手上的手指不用等 */
      const d={el,x:e.clientX,y:e.clientY,moved:false,pointerId:e.pointerId},fx=e.clientX,fy=e.clientY,finger=e.pointerType==='touch',wait=finger&&!o.handle;
      let hold=finger&&!wait?setTimeout(()=>lift(d,e)):wait?setTimeout(()=>lift(d,e),180):0;
      const off=()=>{clearTimeout(hold);removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);removeEventListener('keydown',esc,true);pending.delete(off)};
      const mv=m=>{
        if(m.pointerId!==e.pointerId)return;
        d.x=m.clientX;d.y=m.clientY;d.moved=true;
        if(cur===d)return;
        const far=Math.hypot(d.x-fx,d.y-fy);
        if(wait){if(far>8)off();return}
        if(far>4)lift(d,e);
      };
      const up=u=>{if(u.pointerId!==e.pointerId)return;off();if(cur===d)drop(d,false)};
      const esc=k=>{if(k.key!=='Escape'||cur!==d)return;k.stopPropagation();off();drop(d,true)};
      pending.add(off);addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);addEventListener('keydown',esc,true);
    };
    host.addEventListener('dragstart',dragstart);host.addEventListener('touchmove',touchmove,{passive:false});host.addEventListener('contextmenu',contextmenu);host.addEventListener('pointerdown',down);
    return ()=>{
      if(disposed)return;disposed=true;
      host.removeEventListener('dragstart',dragstart);host.removeEventListener('touchmove',touchmove);host.removeEventListener('contextmenu',contextmenu);host.removeEventListener('pointerdown',down);
      [...pending].forEach(off=>off());
      if(cur){const d=cur;cur=null;cancelAnimationFrame(d.raf);d.from[0].insertBefore(d.el,d.from[1]);try{if(host.hasPointerCapture(d.pointerId))host.releasePointerCapture(d.pointerId)}catch(_){}}
      if(land){land.cancel();land=null}
      artifacts.forEach(d=>{d.g.remove();d.el.classList.remove('ux-slot')});artifacts.clear();
      host.classList.remove('ux-sorting');zones().forEach(q=>q.classList.remove('ux-over'));
      host.querySelectorAll(o.item).forEach(el=>{const a=flips.get(el);if(a){a.cancel();flips.delete(el)}});
    };
  }
  /* 整页转场期间，浏览器把所有点击都交给 <html>。按下时立刻结束转场，抬手时把点击补发给鼠标下的真实元素 */
  const html=document.documentElement;let active=null,eaten=false;
  function transition(fn){const t=document.startViewTransition(fn);active=t;t.ready.catch(()=>{});t.finished.catch(()=>{}).finally(()=>{if(active===t)active=null});return t}
  document.addEventListener('pointerdown',e=>{if(!active)return;eaten=e.target===html;active.skipTransition()},true);
  document.addEventListener('click',e=>{
    if(!eaten)return;eaten=false;e.stopPropagation();
    const x=e.clientX,y=e.clientY;
    (active?active.finished.catch(()=>{}):Promise.resolve()).then(()=>{
      const el=document.elementFromPoint(x,y);if(!el||el===html)return;
      const o={bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:e.pointerId||1,pointerType:e.pointerType||'mouse',isPrimary:true};
      el.dispatchEvent(new PointerEvent('pointerdown',o));
      if(el.matches('input,textarea,[contenteditable]'))el.focus();
      el.dispatchEvent(new PointerEvent('pointerup',o));
      el.dispatchEvent(new MouseEvent('click',o));
    });
  },true);
  /* 无限画布：平移缩放只改世界层的一个变换，从不改组件坐标。叠层打开时放不下才缩小视图，关闭后回到原视图 */
  const CANVAS={min:.4,max:2,fitMax:1.25,step:1.25,wheel:.002,margin:24,gap:12,pan:4,ms:520};
  function canvas(stage,{world,panel,root}){
    const v={x:0,y:0,z:1},grid=parseFloat(getComputedStyle(stage).backgroundSize)||0,label=root.querySelector('[data-cv=z]');
    let auto=true,moved=false,saved=null,timer=0,held=false,pending=false;
    const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),calm=()=>matchMedia('(prefers-reduced-motion:reduce)').matches,open=()=>root.classList.contains('ux-active');
    const apply=anim=>{clearTimeout(timer);const on=!!anim&&!calm();stage.classList.toggle('cv-anim',on);if(on)timer=setTimeout(()=>stage.classList.remove('cv-anim'),CANVAS.ms);world.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.z})`;if(grid){stage.style.backgroundSize=`${grid*v.z}px ${grid*v.z}px`;stage.style.backgroundPosition=`${v.x}px ${v.y}px`}if(label)label.textContent=Math.round(v.z*100)+'%'};
    const bounds=()=>{const c=[...world.querySelectorAll('[data-cmp]')];return{l:Math.min(...c.map(e=>e.offsetLeft)),t:Math.min(...c.map(e=>e.offsetTop)),r:Math.max(...c.map(e=>e.offsetLeft+e.offsetWidth)),b:Math.max(...c.map(e=>e.offsetTop+e.offsetHeight))}};
    /* 叠层没盖住的区域。宽到占满舞台的是底部抽屉，否则在右侧 */
    const area=()=>{const w=stage.clientWidth,h=stage.clientHeight,sheet=panel.offsetWidth>=w-2*CANVAS.margin,on=open();return{w:w-(on&&!sheet?panel.offsetWidth+CANVAS.gap:0),h:h-(on&&sheet?panel.offsetHeight+CANVAS.gap:0),pad:parseFloat(getComputedStyle(root).getPropertyValue('--cv-pad-b'))||0}};
    const frame=(a,b,cap)=>{const m=CANVAS.margin,bw=b.r-b.l,bh=b.b-b.t,z=clamp(Math.min((a.w-2*m)/bw,(a.h-2*m-a.pad)/bh),CANVAS.min,cap);v.z=z;v.x=(a.w-bw*z)/2-b.l*z;v.y=(a.h-a.pad-bh*z)/2-b.t*z};
    const fit=anim=>{if(!stage.clientWidth)return;frame(area(),bounds(),CANVAS.fitMax);apply(anim)};
    const zoom=(k,px,py)=>{const z=clamp(v.z*k,CANVAS.min,CANVAS.max);v.x=px-(px-v.x)*z/v.z;v.y=py-(py-v.y)*z/v.z;v.z=z;auto=false;moved=true;apply()};
    /* 视图让开放到指针抬起后：按住节点拖动时，视图不能在指针下面变 */
    const settle=()=>{if(!open()){if(saved&&!moved){Object.assign(v,saved);apply(true)}saved=null;return}if(!saved){saved={...v};moved=false}const a=area(),b=bounds(),m=CANVAS.margin,fits=v.x+b.l*v.z>=m&&v.x+b.r*v.z<=a.w-m&&v.y+b.t*v.z>=m&&v.y+b.b*v.z<=a.h-m;if(fits)return;frame(a,b,v.z);apply(true)};
    const sync=e=>{if(!stage.contains(e.target))return;if(held)pending=true;else settle()};
    root.addEventListener('ux:focus',sync);root.addEventListener('ux:blur',sync);
    addEventListener('pointerdown',()=>{held=true},true);
    ['pointerup','pointercancel'].forEach(t=>addEventListener(t,()=>{held=false;if(pending){pending=false;settle()}},true));
    stage.addEventListener('pointerdown',e=>{delete stage.dataset.dragged;if(e.button||e.target.closest('[data-cmp],[data-keep],button'))return;const sx=e.clientX,sy=e.clientY,ox=v.x,oy=v.y;let far=false;stage.setPointerCapture(e.pointerId);stage.classList.add('cv-grabbing');
      const mv=ev=>{if(!far&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<CANVAS.pan)return;far=true;auto=false;moved=true;v.x=ox+ev.clientX-sx;v.y=oy+ev.clientY-sy;apply()};
      const end=()=>{stage.classList.remove('cv-grabbing');stage.removeEventListener('pointermove',mv);stage.removeEventListener('pointerup',end);stage.removeEventListener('pointercancel',end);if(far)stage.dataset.dragged='true'};
      stage.addEventListener('pointermove',mv);stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end)});
    stage.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();const r=stage.getBoundingClientRect();zoom(Math.exp(-e.deltaY*CANVAS.wheel),e.clientX-r.left,e.clientY-r.top)},{passive:false});
    root.querySelectorAll('[data-cv]').forEach(b=>{if(b.dataset.cv==='z')return;b.addEventListener('click',()=>{const a=area();if(b.dataset.cv==='fit'){auto=!open();moved=true;fit(true)}else zoom(b.dataset.cv==='in'?CANVAS.step:1/CANVAS.step,a.w/2,a.h/2)})});
    new ResizeObserver(()=>{if(auto&&!open())fit()}).observe(stage);fit();
    return{fit,scale:()=>v.z,view:()=>({...v})};
  }
  return {intent,flip,sortable,blur:s=>blur(s),focus,paint,transition,hitRegion,canvas,dimOthers};
})();

/* ========== 选择器：同一块底滑过去，不闪现。按钮自己在变宽时也跟得上 ========== */
(function(){
  const HOST='.seg,.notch,.cv-rail,.cal,.sf .bctl,.sf .tltrack,.fan-l,#slots',SETTLE=200,st=new WeakMap();
  const read=b=>({x:b.offsetLeft,y:b.offsetTop,w:b.offsetWidth,h:b.offsetHeight});
  const same=(a,b)=>a.x===b.x&&a.y===b.y&&a.w===b.w&&a.h===b.h;
  const draw=(i,c)=>{i.style.width=c.w+'px';i.style.height=c.h+'px';i.style.transform=`translate(${c.x}px,${c.y}px)`};
  /* 动画交给 CSS 过渡，transform 在合成线程上跑，主线程忙时滑块也不掉帧。只有选项自己还在变大小时才继续改目标 */
  function follow(s,d){
    d.until=performance.now()+SETTLE;if(d.raf)return;
    const step=t=>{
      d.raf=0;const on=s.querySelector(':scope>button.on');if(!on||!on.offsetWidth){place(s);return}
      const g=read(on);if(!same(g,d.c)){d.c=g;draw(s.querySelector(':scope>.seg-ind'),g);d.until=t+SETTLE}
      if(t<d.until)d.raf=requestAnimationFrame(step);
    };
    d.raf=requestAnimationFrame(step);
  }
  function place(s){
    const i=s.querySelector(':scope>.seg-ind');if(!i)return;
    const b=s.querySelector(':scope>button.on');let d=st.get(s);if(!d){d={c:null,raf:0,until:0};st.set(s,d)}
    if(!b||!b.offsetWidth){i.style.opacity=0;d.c=null;return}
    i.style.opacity=1;const g=read(b);
    /* 第一次出现直接就位，不从左上角滑进来 */
    if(!d.c){i.style.transition='none';draw(i,g);i.getBoundingClientRect();i.style.transition='';d.c=g;return}
    if(same(g,d.c))return;
    d.c=g;draw(i,g);follow(s,d);
  }
  const ro=new ResizeObserver(es=>es.forEach(e=>place(e.target)));
  const init=s=>{if(s.querySelector(':scope>.seg-ind'))return;const i=document.createElement('i');i.className='seg-ind';s.prepend(i);place(s);ro.observe(s)};
  const scan=r=>r.querySelectorAll&&r.querySelectorAll(HOST).forEach(init);
  new MutationObserver(ms=>ms.forEach(m=>{
    if(m.type==='attributes'){const p=m.target.parentElement;if(p&&p.matches(HOST))place(p)}
    else m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;scan(n);if(n.matches(HOST))init(n)});
  })).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('DOMContentLoaded',()=>scan(document));
  document.addEventListener('langchange',()=>document.querySelectorAll(HOST).forEach(place));
  window.segScan=()=>scan(document);
})();

/* ========== 进入视野：错开浮现，数字计数，图表绘入 ========== */
function whenSeen(el,fn,opt){const o=new IntersectionObserver((es,ob)=>{if(es[0].isIntersecting){ob.disconnect();fn()}},opt);o.observe(el)}
function countUp(el){const z=+el.dataset.count,pre=el.dataset.pre||'',suf=el.dataset.suf||'',t0=performance.now();(function f(t){const p=Math.min(1,(t-t0)/900),v=1-Math.pow(1-p,3);el.textContent=pre+Math.round(z*v).toLocaleString('en-US')+suf;if(p<1)requestAnimationFrame(f)})(t0)}
/* sel 由页面给出：哪些容器的子元素错开浮现 */
function revealAll(sel){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const groups=document.querySelectorAll(sel);
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io.unobserve(e.target);[...e.target.children].forEach((c,i)=>{c.classList.remove('pre');c.style.animationDelay=Math.min(i,8)*30+'ms';c.classList.add('rise');c.addEventListener('animationend',()=>{c.classList.remove('rise');c.style.animationDelay=''},{once:true})})}),{rootMargin:'0px 0px -6% 0px'});
  groups.forEach(g=>{[...g.children].forEach(c=>c.classList.add('pre'));io.observe(g)});
}

/* 语言切换：保留原页面首个可见元素的位置，整页交叉淡入。
   apply 必须同步更新语言和布局；框架可在其中同步提交渲染。now 用于首次载入。 */
let languageTransitionId=0;
function transitionLanguage(apply,now=false){
  const root=document.documentElement;
  const pin=()=>{
    const el=[...document.querySelectorAll('#page .wrap>*,#page .wrap>*>*')].find(e=>{const r=e.getBoundingClientRect();return r.height>0&&r.top>=70}),y=el?el.getBoundingClientRect().top:0;
    apply();
    if(el)scrollBy({top:el.getBoundingClientRect().top-y,behavior:'instant'});
  };
  if(now||!document.startViewTransition||matchMedia('(prefers-reduced-motion:reduce)').matches){pin();return}
  const my=++languageTransitionId;root.classList.add('vt-lang');
  return UX.transition(pin).finished.catch(()=>{}).finally(()=>{if(my===languageTransitionId)root.classList.remove('vt-lang')});
}

/* 模块出口：HTML 模版内联时去掉这一行，React 等模版按 ES 模块导入 */
export {UX,whenSeen,countUp,revealAll,transitionLanguage};
