/* ========== AI 与小组件 ========== */
(function(){
/* 流式回复 */
const R=[['Shot 9 建议用缓慢推近：街道先静下来，音乐再回来。这样观众的注意力会被带到窗口，而不是对白。','高','good',['换成手持','再冷一点','生成三个版本']],['可以把推近改到第二拍之后。前两拍保持静止，让磁带上的灰尘先被看见。不过这版节奏更慢，需要配合配乐判断。','中','c3',['对比两版','缩短 1 秒','配乐一起看']]];
let ri=0,st=null,rt='';document.addEventListener('langchange',()=>{const el=$('#streamT');if(rt&&el.classList.contains('done'))el.textContent=tr(rt)});
function play(){clearInterval(st);const [t0,c,col,ch]=R[ri%R.length];rt=t0;ri++;const el=$('#streamT');el.setAttribute('data-noi18n','');el.textContent='';el.classList.remove('done');$('#chips').innerHTML='';$('#confTag').innerHTML=`<i class="dotc" style="background:var(--${col})"></i>把握${c}`;let i=0;st=setInterval(()=>{const t=tr(rt);el.textContent=t.slice(0,++i);if(i>=t.length){clearInterval(st);el.classList.add('done');$('#chips').innerHTML=ch.map(x=>`<button class="chip">${x}</button>`).join('');$$('#chips .chip').forEach(b=>b.onclick=play)}},38)}
$('#regen').onclick=play;
new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){play();o.disconnect()}}).observe($('#streamT'));
/* Effort */
const EV=[['Low','推荐：日常问题'],['Medium','适合多文件搜索'],['High','适合实现和审查'],['Extra','适合设计取舍'],['Max','最慢，也最彻底']];
const ef=$('#eff');ef.insertAdjacentHTML('afterbegin','<b></b><b></b><b></b><b></b><b></b>');
function setE(i){i=Math.max(0,Math.min(4,i));$('#effT').style.transform=`translateX(${i*100}%)`;$('#effV').textContent=EV[i][0];$('#effN').textContent=EV[i][1];ef.setAttribute('aria-valuenow',i)}
const eAt=e=>{const r=ef.getBoundingClientRect();setE(Math.floor((e.clientX-r.left)/r.width*5))};
ef.addEventListener('pointerdown',e=>{ef.setPointerCapture(e.pointerId);eAt(e);ef.onpointermove=eAt});ef.addEventListener('pointerup',()=>ef.onpointermove=null);
ef.addEventListener('keydown',e=>{const v=+ef.getAttribute('aria-valuenow');if(e.key==='ArrowRight')setE(v+1);if(e.key==='ArrowLeft')setE(v-1)});
/* 语音 */
let vt=null,vs=0;$('#vB').onclick=function(){const v=$('#voice');if(vt){clearInterval(vt);vt=null;v.classList.remove('on');this.textContent='●';$('#vS').textContent='已转成文字（示例）';return}v.classList.add('on');this.textContent='■';$('#vS').textContent='正在听…';vs=0;vt=setInterval(()=>{vs++;$('#vT').textContent='00:'+String(vs).padStart(2,'0')},1000)};
/* 命令面板 */
const CM=[['新建时间线','Ctrl N'],['切换配色：荧光','S N'],['切换配色：彩光','S P'],['打开上下文面板','Ctrl .'],['问 AI：这一幕节奏对吗？','↵'],['导出 Trailer C','Ctrl E'],['查找素材','Ctrl P']];
let cq='',ci=0;function cl(){const L=CM.filter(c=>c[0].includes(cq)||tr(c[0]).toLowerCase().includes(cq.toLowerCase()));ci=Math.min(ci,Math.max(0,L.length-1));$('#cmdL').innerHTML=L.length?L.map((c,i)=>`<div class="cmd-r ${i===ci?'on':''}" data-i="${i}"><span>${c[0]}</span><kbd>${c[1]}</kbd></div>`).join(''):`<div class="cmd-r on"><span>问 AI："${cq.replace(/</g,'&lt;')}"</span><kbd>↵</kbd></div>`;$$('#cmdL .cmd-r').forEach(r=>{r.onmouseenter=()=>{ci=+r.dataset.i||0;$$('#cmdL .cmd-r').forEach(x=>x.classList.toggle('on',x===r))};r.onclick=()=>run(r)})}
function run(r){const t=$('span',r).textContent;if(t.includes('荧光')||t.includes('Neon'))setScheme('neon');if(t.includes('彩光')||t.includes('Prism'))setScheme('prism');toast(tr('已执行：')+t);$('#cmdI').blur()}
$('#cmdI').oninput=e=>{cq=e.target.value;ci=0;cl()};$('#cmdI').onkeydown=e=>{const n=$$('#cmdL .cmd-r').length;if(e.key==='ArrowDown'){ci=(ci+1)%n;cl();e.preventDefault()}if(e.key==='ArrowUp'){ci=(ci-1+n)%n;cl();e.preventDefault()}if(e.key==='Enter')run($('#cmdL .cmd-r.on'))};cl();addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#cmdI').focus();$('#cmdI').scrollIntoView({block:'center',behavior:'smooth'})}});
const cmdC=$('#cmd').closest('[data-cmp]'),cmdS=cmdC.closest('[data-scope]'),cmdIn=$('#cmdI');cmdIn.addEventListener('focus',()=>UX.focus(cmdC));cmdIn.addEventListener('blur',()=>{if(cmdC.classList.contains('ux-focus'))UX.blur(cmdS)});cmdIn.addEventListener('keydown',e=>{if(e.key==='Escape')cmdIn.blur()});$('#cmdL').addEventListener('mousedown',e=>e.preventDefault());
$$('#cmdRc button').forEach(b=>b.onclick=()=>{const i=$('#cmdI');i.value=b.textContent;cq=i.value;ci=0;cl();i.focus()});
/* 按住打开 */
const h=$('#hold'),rd=$('#radar'),pk=$('#pack');let ht=null;
const hEnd=()=>{h.classList.remove('down');rd.classList.remove('holding')};
const dn=e=>{if(ht)return;if(e.pointerId!=null)h.setPointerCapture(e.pointerId);h.classList.add('down');rd.classList.add('holding');ht=setTimeout(()=>{ht=null;pk.classList.toggle('open');hEnd();h.textContent=pk.classList.contains('open')?'按住合上':'按住打开'},900)};
const upf=()=>{clearTimeout(ht);ht=null;hEnd()};
h.addEventListener('pointerdown',dn);h.addEventListener('pointerup',upf);h.addEventListener('pointercancel',upf);h.addEventListener('blur',upf);h.addEventListener('contextmenu',e=>e.preventDefault());
h.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat)dn(e)});h.addEventListener('keyup',upf);
/* 时间刻度 */
const EVT=['第一次演示','图形界面','鼠标普及','网页出现','触屏手机','生成式 AI'];const sb=$('#sB'),N=60;sb.innerHTML=Array.from({length:N},()=>'<i style="height:16%"></i>').join('');const bs=$$('i',sb);
function sc(k){bs.forEach((b,i)=>{const d=Math.abs(i-k);b.style.height=Math.max(14,100-d*d*2.6)+'%';b.classList.toggle('on',i===k)});$('#sY').textContent=1968+Math.round(k/(N-1)*58);$('#sT').textContent=EVT[Math.floor(k/N*EVT.length)]}
$('#scrub').addEventListener('pointermove',e=>{const r=sb.getBoundingClientRect();sc(Math.max(0,Math.min(N-1,Math.floor((e.clientX-r.left)/r.width*N))))});sc(4);
/* 参数 */
$('#params').innerHTML=[['Exposure',60,' EV'],['Bloom',35,''],['Field of view',52,'°'],['Samples',24,'']].map(([n,v,u])=>`<div class="par"><div class="between"><span class="mute">${n}</span><span class="val">${v}${u}</span></div><input class="slider" type="range" value="${v}" aria-label="${n}" style="margin-top:calc(6px*var(--y))" oninput="this.previousElementSibling.lastElementChild.textContent=this.value+'${u}'"></div>`).join('');
/* 小件 */
const pl=$('#pillDl'),po=$('#pillOpen');pl.onclick=()=>{pl.style.display='none';po.style.display='flex'};$('#pillCopy').onclick=()=>{toast('已复制');setTimeout(()=>{po.style.display='none';pl.style.display='flex'},600)};
let cnOn=false;$('#cnB').onclick=()=>{cnOn=!cnOn;$('#cn').textContent=cnOn?'4485 0192 8841 7516':'4485 •••• •••• 7516';$('#cnB').setAttribute('aria-label',cnOn?'隐藏卡号':'显示卡号')};
$('#cpB').onclick=function(){this.textContent='✓';$('#cp').textContent='已复制';setTimeout(()=>{this.textContent='⧉';$('#cp').textContent='复制这段链接'},1400)};
$('#icong').innerHTML='<i></i>'.repeat(20);$('#steps').innerHTML=[30,45,60,75,90,100,85,70,55,40].map(h=>`<i style="height:${h}%"></i>`).join('');
/* 点云：只在可见时绘制 */
const cv=$('#dots'),g=cv.getContext('2d');let mx=-999,my=-999,vis=false,raf=0;
function fr(t){if(!vis)return;const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;if(cv.width!==Math.round(r.width*d)){cv.width=r.width*d;cv.height=r.height*d}g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,r.width,r.height);const s=getComputedStyle(root),c1=s.getPropertyValue('--c1').trim(),c0=s.getPropertyValue('--dot').trim();for(let y=0;y<26;y++)for(let x=0;x<56;x++){const bx=x/55*r.width,w=Math.sin(x*.28+t/1400)*Math.cos(y*.3+t/1900)*16,by=(y/25*.7+.2)*r.height+w,dx=bx-mx,dy=by-my,q=Math.hypot(dx,dy),near=Math.max(0,1-q/90);g.fillStyle=near>.2?c1:c0;g.fillRect(bx+dx/(q||1)*near*18,by+dy/(q||1)*near*18,1.6+near*1.8,1.6+near*1.8)}raf=requestAnimationFrame(fr)}
cv.parentNode.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top});cv.parentNode.addEventListener('pointerleave',()=>{mx=my=-999});
new IntersectionObserver(e=>{vis=e[0].isIntersecting;cancelAnimationFrame(raf);if(vis)raf=requestAnimationFrame(fr)}).observe(cv);

/* ========== 新想法：数字、像素、票根、材质、点阵、圆环、切片、文字 ========== */
$$('[data-count]').forEach(x=>whenSeen(x,()=>countUp(x)));
const odo=$('#odo');function setOdo(n){const s=n.toLocaleString('en-US');if(odo.children.length!==s.length)odo.innerHTML=[...s].map(ch=>/\d/.test(ch)?`<span class="odo"><i>${[...'0123456789'].map(d=>`<span>${d}</span>`).join('')}</i></span>`:`<span>${ch}</span>`).join('');[...s].forEach((ch,i)=>{const c=odo.children[i],w=$('i',c);if(w)w.style.transform=`translateY(-${ch}em)`})}
setOdo(10000);setTimeout(()=>setOdo(32023),400);$('#odoCard').onclick=()=>setOdo(10000+Math.floor(Math.random()*80000));
$('#heat').innerHTML=Array.from({length:168},(_,i)=>{const d=Math.floor(i/24),h=i%24,v=Math.max(.06,Math.pow(Math.max(0,Math.sin((h-7)/14*Math.PI)),1.6)*(d>4?.35:1)*(.55+.45*Math.abs(Math.sin(i*2.1))));return `<i data-v="${Math.round(v*40)}" style="opacity:${v.toFixed(2)}"></i>`}).join('');
$('#heat').addEventListener('mouseover',e=>{if(e.target.dataset.v)$('#heatT').textContent=e.target.dataset.v+' / 40'});$('#heat').addEventListener('mouseleave',()=>$('#heatT').textContent='7 天 × 24 小时');
const TK={1:'repeating-radial-gradient(circle at 42% 52%,var(--c2) 0 10px,var(--c3) 10px 20px,var(--c1) 20px 30px,var(--c4) 30px 40px)',2:'repeating-linear-gradient(0deg,var(--c1) 0 16px,var(--c5) 16px 32px,var(--c2) 32px 48px,var(--c3) 48px 64px)',3:'linear-gradient(135deg,var(--sunk),var(--sel))'};
const tkc=$('#tkCover');tkc.style.background=TK[1];$$('#tkSeg button').forEach(b=>b.addEventListener('click',()=>tkc.style.background=TK[b.dataset.v]));
const sil=$('#silver');sil.addEventListener('pointermove',e=>{const r=sil.getBoundingClientRect();sil.style.setProperty('--sx',((e.clientX-r.left)/r.width*100).toFixed(0)+'%')});
const canvasLoop=(c,draw)=>{const x=c.getContext('2d');let v=false,raf=0;const f=t=>{if(!v)return;const r=c.getBoundingClientRect(),d=devicePixelRatio||1;if(c.width!==Math.round(r.width*d)){c.width=r.width*d;c.height=r.height*d}x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,r.width,r.height);draw(x,r.width,r.height,t,getComputedStyle(root));raf=requestAnimationFrame(f)};new IntersectionObserver(e=>{v=e[0].isIntersecting;cancelAnimationFrame(raf);if(v)raf=requestAnimationFrame(f)}).observe(c)};
const MN=640,rnd=i=>{const s=Math.sin(i*12.9898)*43758.5453;return s-Math.floor(s)};
const SH=[i=>{const a=i/MN*Math.PI*2*5,r=.28+.1*(i%5)/5;return[Math.cos(a)*r*1.3,Math.sin(a)*r*1.3]},(i,t)=>{const x=i/MN*2-1,row=i%6;return[x,(row-2.5)*.1+Math.sin(x*4+t/700)*.16]},(i,t)=>{const u=rnd(i),v=rnd(i+7)*2-1;if(i%5===0){const k=rnd(i+3);return[-.4-k*.36,v*k*.34+Math.sin(t/300)*.05*k]}const x=u*1.1-.42,hh=.3*Math.sqrt(Math.max(0,1-Math.pow((x-.13)/.56,2)));return[x,v*hh+Math.sin(x*5+t/260)*.03]},(i,t)=>{const p=Math.acos(1-2*(i+.5)/MN),th=i*2.399+t/1800,s=.42;return[Math.sin(p)*Math.cos(th)*s*1.2,Math.cos(p)*s*1.2]}];
let ms=0,cur=[];for(let i=0;i<MN;i++)cur.push([0,0]);
canvasLoop($('#morph'),(x,w,h,t,s)=>{const c1=s.getPropertyValue('--c1').trim(),c0=s.getPropertyValue('--ink2').trim(),k=Math.min(w,h*1.6)*.56;for(let i=0;i<MN;i++){const g=SH[ms](i,t),e=.03+.05*rnd(i+11);cur[i][0]+=(g[0]-cur[i][0])*e;cur[i][1]+=(g[1]-cur[i][1])*e;x.fillStyle=i%9===0?c1:c0;x.fillRect(w/2+cur[i][0]*k,h/2+cur[i][1]*k,1.5,1.5)}});
$('#morph').onclick=()=>{ms=(ms+1)%SH.length};
const RG=Array.from({length:96},(_,i)=>({a:rnd(i)*6.283,b:Math.acos(2*rnd(i+50)-1),r:.03+.13*rnd(i+90)*rnd(i+130),c:1+i%5}));let rs=1,ra=0,rl=0;const rc=$('#rings');rc.onmouseenter=()=>rs=3.5;rc.onmouseleave=()=>rs=1;
canvasLoop(rc,(x,w,h,t,s)=>{ra+=.004*rs;const R=Math.min(w,h)*.46;x.lineWidth=1.2;RG.forEach(g=>{const th=g.a+ra,X=Math.sin(g.b)*Math.cos(th),Y=Math.cos(g.b),Z=Math.sin(g.b)*Math.sin(th);x.strokeStyle=s.getPropertyValue('--c'+g.c).trim();x.globalAlpha=.3+.7*(Z+1)/2;x.beginPath();x.ellipse(w/2+X*R*1.5,h/2+Y*R,g.r*R*1.5,g.r*R*Math.max(.12,Math.abs(Z)),Math.atan2(Y,X*1.5)+1.571,0,6.283);x.stroke()});x.globalAlpha=1});
const sl=$('#slice');sl.innerHTML=Array.from({length:84},(_,i)=>{const c=i%12,r=Math.floor(i/12);return `<i data-c="${c}" data-r="${r}" style="background-position:${c/11*100}% ${r/6*100}%"></i>`}).join('');
let ss=0;sl.onclick=()=>{ss=(ss+1)%3;$$('i',sl).forEach(e=>{const c=+e.dataset.c,r=+e.dataset.r;e.style.transitionDelay=(c*26+r*8)+'ms';if(ss===0){e.style.transform='none';e.style.borderRadius='0'}if(ss===1){e.style.transform=`translateY(${(c%2?-1:1)*10}px) scaleX(.72)`;e.style.borderRadius='0'}if(ss===2){e.style.transform='scale(.24)';e.style.borderRadius='50%'}})};
function blur(){const b=$('#blurin'),s=tr('每个动作都交代它从哪里来。'),parts=/[\u3400-\u9fff]/.test(s)?[...s]:s.split(/(?<= )/);b.setAttribute('data-noi18n','');b.classList.remove('blur-on');b.innerHTML=parts.map((c,i)=>`<span style="--n:${i}">${c.replace(/ /g,'&nbsp;')}</span>`).join('');b.offsetWidth;b.classList.add('blur-on')}
$('#blurGo').onclick=blur;new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){blur();o.disconnect()}}).observe($('#blurin'));document.addEventListener('langchange',blur);
$('#iconw').innerHTML=Array.from({length:24},(_,i)=>`<i style="--n:${i%8+Math.floor(i/8)}"></i>`).join('');
})();
