/* ========== 数据表 ========== */
(function(){
const dt=$('#dt'),sc=$('#dtS'),tb=$('#dtB'),PAGE=8;
const rnd=i=>{const x=Math.sin(i*12.9898+4.1)*43758.5453;return x-Math.floor(x)};
const TY=['视频','音频','图片','文档'],ST=['待审','处理中','已通过','已退回'],OW=['Mara','Jun','Dana','Leo'],ART=['a','b','c','d'];
const ST_C={待审:'var(--ink3)',处理中:'var(--c1)',已通过:'var(--good)',已退回:'var(--bad)'};
const NM=['Scene %s rough cut','Shot %s master','Trailer %s mix','Storyboard %s','Score cue %s','Grade pass %s','Interview %s','Moodboard %s','Script draft %s','Location plate %s','Foley take %s','Titles %s'];
let R=Array.from({length:46},(_,i)=>({id:i,name:NM[i%NM.length].replace('%s',String(1+Math.floor(rnd(i)*38)).padStart(2,'0')),type:TY[Math.floor(rnd(i+60)*4)],owner:OW[Math.floor(rnd(i+90)*4)],status:ST[Math.floor(rnd(i+120)*4)],len:20+Math.floor(rnd(i+150)*520),size:12+Math.floor(rnd(i+180)*1900),date:`10/${String(1+Math.floor(rnd(i+210)*29)).padStart(2,'0')}`,art:ART[i%4]}));
const COLS=[{k:'name',l:'名称',w:0,lock:1},{k:'type',l:'类型',w:100},{k:'owner',l:'负责人',w:112},{k:'status',l:'状态',w:104},{k:'len',l:'时长',w:76,num:1},{k:'size',l:'大小',w:88,num:1},{k:'date',l:'更新',w:76,num:1}];
const hide=new Set(),sel=new Set(),rows=new Map();
let q='',stF='全部',sort=null,page=0,open=null,anchor=null,view=[];
const mm=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const size=m=>m>=1000?(m/1000).toFixed(1)+' GB':m+' MB';
const cell={
 name:r=>`<span class="dt-nm"><i class="pic ${r.art}"></i><span>${r.name}</span></span>`,
 type:r=>`<span class="tag">${r.type}</span>`,
 owner:r=>`<span class="dt-ow"><span class="avatar">${r.owner[0]}</span>${r.owner}</span>`,
 status:r=>`<span class="dt-st"><i class="dotc" style="background:${ST_C[r.status]}"></i>${r.status}</span>`,
 len:r=>mm(r.len),size:r=>size(r.size),date:r=>r.date};
function fillRow(tr,r){tr.innerHTML=`<td><button class="check" role="checkbox" aria-checked="${sel.has(r.id)}" aria-label="选择 ${r.name}"></button></td>`+COLS.map(c=>`<td data-c="${c.k}" class="${c.num?'num':''}" ${hide.has(c.k)?'hidden':''}>${cell[c.k](r)}</td>`).join('')+`<td class="dt-act"><span class="rtool"><button class="btn ghost sm" data-a="rename">重命名</button><button class="btn ghost sm" data-a="pass">通过</button></span></td>`;tr.classList.toggle('sel',sel.has(r.id))}
function rowOf(r){let tr=rows.get(r.id);if(!tr){tr=document.createElement('tr');tr.className='dt-r in';tr.dataset.id=r.id;tr.tabIndex=0;tr.addEventListener('animationend',()=>tr.classList.remove('in'));rows.set(r.id,tr);fillRow(tr,r)}return tr}
function head(){
 $('#dtCols').innerHTML='<col style="width:40px">'+COLS.map(c=>`<col data-c="${c.k}" ${hide.has(c.k)?'style="display:none"':c.w?`style="width:${c.w}px"`:''}>`).join('')+'<col class="act">';
 $('#dtH').innerHTML='<th><button class="check" id="dtAll" role="checkbox" aria-label="全选本页"></button></th>'+COLS.map(c=>`<th data-c="${c.k}" class="${c.num?'num':''}" ${hide.has(c.k)?'hidden':''} ${sort&&sort.k===c.k?`aria-sort="${sort.dir>0?'ascending':'descending'}"`:''}><button class="dt-h" data-k="${c.k}">${c.l}<i class="dt-ar"></i></button>${c.lock?'':`<span class="dt-rz" data-k="${c.k}"></span>`}</th>`).join('')+'<th class="dt-act"></th>';
}
function filtered(){const s=q.toLowerCase();let a=R.filter(r=>(stF==='全部'||r.status===stF)&&(!s||[r.name,r.owner,tr(r.type),r.type,tr(r.status),r.status].some(v=>v.toLowerCase().includes(s))));if(sort){const k=sort.k;a=[...a].sort((x,y)=>(typeof x[k]==='number'?x[k]-y[k]:String(x[k]).localeCompare(String(y[k])))*sort.dir)}return a}
function segs(){const host=$('#dtSt');const n={全部:R.length};ST.forEach(s=>n[s]=R.filter(r=>r.status===s).length);[...host.querySelectorAll('button')].forEach((b,i)=>{b.querySelector('small').textContent=n[b.dataset.s]});}
function draw(){
 const a=filtered(),pages=Math.max(1,Math.ceil(a.length/PAGE));page=Math.min(page,pages-1);view=a;
 const shown=a.slice(page*PAGE,page*PAGE+PAGE);
 if(open!==null&&!shown.some(r=>r.id===open))closeRow(true);
 UX.flip(tb,'.dt-r',()=>{
  const kids=[];shown.forEach(r=>{kids.push(rowOf(r));if(open===r.id&&more)kids.push(more)});
  if(!shown.length){const e=document.createElement('tr');e.className='dt-none';e.innerHTML=`<td colspan="${COLS.length+2}">没有匹配的记录</td>`;kids.push(e)}
  tb.replaceChildren(...kids);
 });
 const st=page*PAGE;$('#dtN').textContent=a.length?`${st+1}–${st+shown.length} / ${a.length}`:'0 / 0';
 const P=$('#dtP');P.querySelectorAll('button').forEach(b=>b.remove());
 for(let i=0;i<pages;i++){const b=document.createElement('button');b.textContent=i+1;b.dataset.p=i;P.append(b);if(i===page)b.classList.add('on')}
 $('#dtPrev').disabled=page===0;$('#dtNext').disabled=page>=pages-1;
 const on=shown.filter(r=>sel.has(r.id)).length;const all=$('#dtAll');all.setAttribute('aria-checked',!on?'false':on===shown.length?'true':'mixed');
 $('#dtBn').textContent=`已选 ${sel.size} 个`;$('.dt-foot',dt).classList.toggle('sel',sel.size>0);
 segs();
}
/* 展开详情：把下面的行挤开 */
let more=null;
function openRow(r){closeRow();open=r.id;const tr=rows.get(r.id);tr.classList.add('open');more=document.createElement('tr');more.className='dt-more';more.innerHTML=`<td colspan="${COLS.length-hide.size+2}"><div class="dt-more-w"><div><div class="dt-more-in"><div class="pic ${r.art}"></div><div class="dt-kv"><span>负责人</span><b>${r.owner}</b><span>类型</span><b>${r.type}</b><span>时长</span><b>${mm(r.len)}</b><span>大小</span><b>${size(r.size)}</b></div><div><div class="xs mute" style="margin-bottom:calc(4px*var(--y))">备注</div><input class="input" placeholder="给这条记录写点什么"><div class="row" style="margin-top:calc(6px*var(--y))"><button class="btn sm" data-toast="已打开（示例）">打开</button><button class="btn ghost sm" data-toast="已复制链接（示例）">复制链接</button></div></div></div></div></div></td>`;tr.after(more);more.offsetWidth;more.classList.add('open')}
function closeRow(now){if(open===null)return;const tr=rows.get(open),m=more;open=null;more=null;if(tr)tr.classList.remove('open');if(!m)return;if(now){m.remove();return}m.classList.remove('open');setTimeout(()=>m.remove(),360)}
dt.addEventListener('ux:blur',()=>closeRow());
/* 行内重命名：Enter 保存，Esc 取消 */
function rename(r,tr){const s=$('.dt-nm span',tr),old=r.name,i=document.createElement('input');i.value=old;i.setAttribute('aria-label','名称');s.replaceWith(i);i.focus();i.select();let done=false;const end=ok=>{if(done)return;done=true;if(ok&&i.value.trim())r.name=i.value.trim();fillRow(tr,r)};i.addEventListener('keydown',e=>{if(e.key==='Enter')end(true);if(e.key==='Escape'){e.stopPropagation();end(false)}});i.addEventListener('blur',()=>end(true));i.addEventListener('click',e=>e.stopPropagation())}
tb.addEventListener('click',e=>{
 const tr=e.target.closest('.dt-r');if(!tr)return;const r=R.find(x=>x.id===+tr.dataset.id);
 const c=e.target.closest('.check');
 if(c){const on=!sel.has(r.id);if(e.shiftKey&&anchor!==null){const ids=view.map(x=>x.id),a=ids.indexOf(anchor),b=ids.indexOf(r.id);if(a>=0&&b>=0)ids.slice(Math.min(a,b),Math.max(a,b)+1).forEach(id=>on?sel.add(id):sel.delete(id))}else on?sel.add(r.id):sel.delete(r.id);anchor=r.id;rows.forEach((t,id)=>{const m=R.find(x=>x.id===id);if(m){t.classList.toggle('sel',sel.has(id));const k=$('.check',t);if(k)k.setAttribute('aria-checked',sel.has(id))}});draw();return}
 const a=e.target.closest('[data-a]');
 if(a){if(a.dataset.a==='rename')rename(r,tr);if(a.dataset.a==='pass'){r.status='已通过';fillRow(tr,r);toast(tr_('已通过')+' · '+r.name);draw()}return}
 if(e.target.closest('input,button'))return;
 if(open===r.id)closeRow();else openRow(r);
});
const tr_=s=>tr(s);
tb.addEventListener('keydown',e=>{const t=e.target;if(t.matches('.dt-r')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();t.click()}});
/* 表头：排序、全选、改列宽 */
$('#dtH').addEventListener('click',e=>{
 const all=e.target.closest('#dtAll');
 if(all){const shown=view.slice(page*PAGE,page*PAGE+PAGE),on=shown.every(r=>sel.has(r.id));shown.forEach(r=>on?sel.delete(r.id):sel.add(r.id));shown.forEach(r=>{const t=rows.get(r.id);t.classList.toggle('sel',sel.has(r.id));$('.check',t).setAttribute('aria-checked',sel.has(r.id))});draw();return}
 const h=e.target.closest('.dt-h');if(!h)return;const k=h.dataset.k;
 sort=!sort||sort.k!==k?{k,dir:1}:sort.dir>0?{k,dir:-1}:null;page=0;head();draw();
});
$('#dtH').addEventListener('pointerdown',e=>{
 const z=e.target.closest('.dt-rz');if(!z)return;e.preventDefault();e.stopPropagation();
 const c=COLS.find(x=>x.k===z.dataset.k),col=$(`col[data-c=${c.k}]`,dt),x0=e.clientX,w0=col.offsetWidth||z.parentElement.offsetWidth;z.classList.add('on');z.setPointerCapture(e.pointerId);
 const mv=m=>{c.w=Math.max(56,w0+m.clientX-x0);col.style.width=c.w+'px'};
 const up=()=>{z.classList.remove('on');z.removeEventListener('pointermove',mv);z.removeEventListener('pointerup',up);z.removeEventListener('pointercancel',up)};
 z.addEventListener('pointermove',mv);z.addEventListener('pointerup',up);z.addEventListener('pointercancel',up);
});
/* 工具栏 */
const stH=$('#dtSt');['全部',...ST].forEach((s,i)=>{const b=document.createElement('button');b.dataset.s=s;b.innerHTML=`${s} <small class="xs" style="opacity:.6;font-weight:500"></small>`;stH.append(b);if(!i)b.classList.add('on')});
stH.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',stH).forEach(x=>x.classList.toggle('on',x===b));stF=b.dataset.s;page=0;draw()});
$('#dtQ').addEventListener('input',e=>{q=e.target.value;page=0;draw()});
$('#dtD').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('#dtD button').forEach(x=>x.classList.toggle('on',x===b));dt.classList.toggle('dense',b===$$('#dtD button')[1])});
$('#dtP').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(b){page=+b.dataset.p;sc.scrollTop=0;draw()}});
$('#dtPrev').onclick=()=>{page--;sc.scrollTop=0;draw()};$('#dtNext').onclick=()=>{page++;sc.scrollTop=0;draw()};
$('#dtBc').onclick=()=>{sel.clear();rows.forEach((t,id)=>{t.classList.remove('sel');const k=$('.check',t);if(k)k.setAttribute('aria-checked',false)});draw()};
$('#dtBo').onclick=()=>{const n=sel.size;R.forEach(r=>{if(sel.has(r.id)){r.status='已通过';fillRow(rows.get(r.id)||rowOf(r),r)}});$('#dtBc').click();toast(tr('已通过')+' · '+n)};
$('#dtBa').onclick=()=>{const n=sel.size;R=R.filter(r=>!sel.has(r.id));sel.clear();closeRow(true);draw();toast(tr('已归档')+' · '+n)};
const menu=$('#dtC');menu.innerHTML=COLS.filter(c=>!c.lock).map(c=>`<div data-k="${c.k}" class="on">${c.l}<span>✓</span></div>`).join('');
$('#dtCB').onclick=e=>{e.stopPropagation();menu.classList.toggle('show')};
menu.addEventListener('click',e=>{e.stopPropagation();const d=e.target.closest('[data-k]');if(!d)return;const k=d.dataset.k,on=hide.has(k);on?hide.delete(k):hide.add(k);d.classList.toggle('on',on);$('span',d).textContent=on?'✓':'';closeRow(true);head();rows.forEach((t,id)=>{const r=R.find(x=>x.id===id);if(r)fillRow(t,r)});draw()});
document.addEventListener('click',()=>menu.classList.remove('show'));addEventListener('keydown',e=>{if(e.key==='Escape')menu.classList.remove('show')});
head();draw();
})();

/* ========== 图片瀑布流 ========== */
(function(){
const mg=$('#mg'),CAT=['人物','场景','道具','分镜'],ART=['a','b','c','d'],GAP=10,FIRST=18,STEP=12;
const rnd=i=>{const x=Math.sin(i*78.233+1.7)*23421.631;return x-Math.floor(x)};
const TT=['Mara at the window','Empty corridor','The tape','Frame 12','Jun, close','Rooftop at dusk','CRT on the floor','Frame 31','Dana waiting','Night market','Shutter','Frame 44','Old friend','Stairwell','Dust in the beam','Frame 58'];
const G=Array.from({length:42},(_,i)=>({i,t:TT[i%TT.length],c:CAT[i%TT.length%4],a:ART[Math.floor(rnd(i)*4)],r:.62+rnd(i+40)*.98,bs:`${130+Math.floor(rnd(i+80)*90)}% ${110+Math.floor(rnd(i+120)*80)}%`,bp:`${Math.floor(rnd(i+160)*100)}% ${Math.floor(rnd(i+200)*100)}%`,like:false}));
let n=0,fil='全部',target=240,W=0,busy=false;
function add(k,stagger){const end=Math.min(n+k,G.length);for(;n<end;n++){const g=G[n],f=document.createElement('figure');f.className='mg-i pic '+g.a+(stagger?' load':'');f.dataset.i=g.i;f.dataset.cmp='';f.dataset.live='';f.dataset.nofocus='';f.dataset.state='rest';f.tabIndex=0;f.setAttribute('role','button');f.setAttribute('aria-label',g.t);f.style.setProperty('--bs',g.bs);f.style.setProperty('--bp',g.bp);f.innerHTML=`<button class="mg-like" data-tool aria-pressed="false" aria-label="收藏">♡</button><figcaption class="mg-cap" data-tool>${g.t}<small>${g.c}</small></figcaption>`;if(fil!=='全部'&&g.c!==fil)f.classList.add('off');mg.append(f);if(stagger)setTimeout(()=>f.classList.remove('load'),320+(n%STEP)*70)}}
function layout(){
 W=mg.clientWidth;if(!W)return;
 const cols=Math.max(2,Math.floor((W+GAP)/(target+GAP))),w=(W-GAP*(cols-1))/cols,h=Array(cols).fill(0);
 $$('.mg-i',mg).forEach(f=>{if(f.classList.contains('off'))return;const g=G[+f.dataset.i];let c=0;h.forEach((v,k)=>{if(v<h[c]-.5)c=k});const H=Math.round(w*g.r);f.style.left=c*(w+GAP)+'px';f.style.top=h[c]+'px';f.style.width=w+'px';f.style.height=H+'px';h[c]+=H+GAP});
 mg.style.height=Math.max(0,Math.max(...h)-GAP)+'px';
}
function foot(){$('#mgS').textContent=n>=G.length?`已经到底了 · ${G.length} 张`:''}
mg.classList.add('still');add(FIRST,false);layout();requestAnimationFrame(()=>requestAnimationFrame(()=>mg.classList.remove('still')));
new ResizeObserver(()=>{if(mg.clientWidth!==W)layout()}).observe(mg);
new IntersectionObserver(es=>{if(!es[0].isIntersecting||busy||n>=G.length)return;busy=true;add(STEP,true);layout();foot();setTimeout(()=>{busy=false},700)},{rootMargin:'240px 0px'}).observe($('#mgS'));
/* 筛选、换图大小 */
const F=$('#mgF');['全部',...CAT].forEach((c,i)=>{const b=document.createElement('button');b.textContent=c;b.dataset.c=c;F.append(b);if(!i)b.classList.add('on')});
F.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',F).forEach(x=>x.classList.toggle('on',x===b));fil=b.dataset.c;$$('.mg-i',mg).forEach(f=>f.classList.toggle('off',fil!=='全部'&&G[+f.dataset.i].c!==fil));layout()});
$('#mgZ').addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(!b)return;$$('#mgZ button').forEach(x=>x.classList.toggle('on',x===b));target=+b.dataset.w;layout()});
/* 大图：从缩略图的位置放大过去 */
let at=-1;const shown=()=>$$('.mg-i',mg).filter(f=>!f.classList.contains('off'));
function lbHTML(g,k,all){const vw=Math.min(860,innerWidth-40),vh=innerHeight*.74,w=Math.min(vw,vh/g.r);return `<div class="mg-lb"><div class="mg-art pic ${g.a}" style="width:${Math.round(w)}px;height:${Math.round(w*g.r)}px;--bs:${g.bs};--bp:${g.bp}"></div><div class="mg-lbar"><b>${g.t}</b><span class="xs mute">${g.c} · ${k+1} / ${all}</span><span style="flex:1"></span><button class="btn ghost sm" data-m="p" aria-label="上一张">‹</button><button class="btn ghost sm" data-m="n" aria-label="下一张">›</button><button class="btn ghost sm" data-m="x" aria-label="关闭">✕</button></div></div>`}
function show(f,from){const all=shown(),k=all.indexOf(f),g=G[+f.dataset.i];at=+f.dataset.i;const r=from&&f.getBoundingClientRect();scrim(lbHTML(g,k,all.length));if(r){const art=$('.mg-art'),b=art.getBoundingClientRect();art.animate([{transformOrigin:'0 0',transform:`translate(${r.left-b.left}px,${r.top-b.top}px) scale(${r.width/b.width},${r.height/b.height})`},{transformOrigin:'0 0',transform:'none'}],{duration:350,easing:'cubic-bezier(.16,1,.3,1)'})}}
function step(d){const all=shown(),k=all.findIndex(f=>+f.dataset.i===at);if(k<0)return;show(all[(k+d+all.length)%all.length],false)}
mg.addEventListener('click',e=>{const l=e.target.closest('.mg-like');if(l){const on=l.getAttribute('aria-pressed')!=='true';l.setAttribute('aria-pressed',on);l.textContent=on?'♥':'♡';G[+l.parentElement.dataset.i].like=on;return}const f=e.target.closest('.mg-i');if(f)show(f,true)});
mg.addEventListener('keydown',e=>{const f=e.target;if(f.matches('.mg-i')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();show(f,true)}});
$('#scrimIn').addEventListener('click',e=>{const m=e.target.closest('[data-m]');if(!m||!$('.mg-lb'))return;if(m.dataset.m==='x')closeScrim();else step(m.dataset.m==='n'?1:-1)});
addEventListener('keydown',e=>{if(!$('#scrim').classList.contains('show')||!$('.mg-lb'))return;if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)});
})();
