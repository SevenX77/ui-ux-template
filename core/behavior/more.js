/* Shared more content/state/geometry policies; stack adapters own DOM, input, clocks and drawing. */
function streamFrame(text,position){return {text:text.slice(0,position),done:position>=text.length};}
function clampEffort(index,data){return Math.max(0,Math.min(data.efforts.length-1,index));}
function effortAt(ratio,data){return clampEffort(Math.floor(ratio*data.efforts.length),data);}
function effortTransform(index){return `translateX(${index*100}%)`;}
function filterCommands(commands,q,translate){return commands.filter(c=>c.label.includes(q)||translate(c.label).toLowerCase().includes(q.toLowerCase()));}
function commandIndex(index,delta,length){return (index+delta+length)%length;}
function clampCommandIndex(index,length){return Math.min(index,Math.max(0,length-1));}
function formatClock(seconds){return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
function scrubIndex(ratio,data){return Math.max(0,Math.min(data.counts.scrub-1,Math.floor(ratio*data.counts.scrub)));}
function scrubState(index,data){const N=data.counts.scrub;return {year:1968+Math.round(index/(N-1)*58),label:data.events[Math.floor(index/N*data.events.length)],bars:Array.from({length:N},(_,i)=>({height:Math.max(14,100-Math.abs(i-index)**2*2.6)+'%',on:i===index}))};}
function odometerParts(number){return [...number.toLocaleString('en-US')].map(char=>({char,digit:/\d/.test(char),transform:`translateY(-${char}em)`}));}
function randomOdometer(random,data){return data.odometer.randomBase+Math.floor(random*data.odometer.randomRange);}
function heatCells(){return Array.from({length:168},(_,i)=>{const d=Math.floor(i/24),h=i%24,v=Math.max(.06,Math.pow(Math.max(0,Math.sin((h-7)/14*Math.PI)),1.6)*(d>4?.35:1)*(.55+.45*Math.abs(Math.sin(i*2.1))));return {value:Math.round(v*40),opacity:v.toFixed(2)};});}
function sliceCells(data){return Array.from({length:data.counts.slices},(_,i)=>{const c=i%12,r=Math.floor(i/12);return {c,r,backgroundPosition:c/11*100+'% '+r/6*100+'%'};});}
function sliceState(mode,column,row){return {transitionDelay:(column*26+row*8)+'ms',transform:mode===0?'none':mode===1?`translateY(${(column%2?-1:1)*10}px) scaleX(.72)`:'scale(.24)',borderRadius:mode===2?'50%':'0'};}
function blurParts(text){return (/[\u3400-\u9fff]/.test(text)?[...text]:text.split(/(?<= )/)).map(part=>part.replace(/ /g,'\u00a0'));}
function silverPosition(ratio){return (ratio*100).toFixed(0)+'%';}
function nextMode(mode,length){return (mode+1)%length;}
function waveIconIndex(i){return i%8+Math.floor(i/8);}
function rnd(i){const s=Math.sin(i*12.9898)*43758.5453;return s-Math.floor(s);}
const MORPH_N=640;
function morphPoint(mode,i,t){if(mode===0){const a=i/MORPH_N*Math.PI*2*5,r=.28+.1*(i%5)/5;return [Math.cos(a)*r*1.3,Math.sin(a)*r*1.3];}if(mode===1){const x=i/MORPH_N*2-1,row=i%6;return [x,(row-2.5)*.1+Math.sin(x*4+t/700)*.16];}if(mode===2){const u=rnd(i),v=rnd(i+7)*2-1;if(i%5===0){const k=rnd(i+3);return [-.4-k*.36,v*k*.34+Math.sin(t/300)*.05*k];}const x=u*1.1-.42,hh=.3*Math.sqrt(Math.max(0,1-Math.pow((x-.13)/.56,2)));return [x,v*hh+Math.sin(x*5+t/260)*.03];}const p=Math.acos(1-2*(i+.5)/MORPH_N),th=i*2.399+t/1800,s=.42;return [Math.sin(p)*Math.cos(th)*s*1.2,Math.cos(p)*s*1.2];}
function createMorphState(){return {mode:0,points:Array.from({length:MORPH_N},()=>[0,0])};}
function morphFrame(w,h,t,colors,state){const k=Math.min(w,h*1.6)*.56;return state.points.map((p,i)=>{const g=morphPoint(state.mode,i,t),e=.03+.05*rnd(i+11);p[0]+=(g[0]-p[0])*e;p[1]+=(g[1]-p[1])*e;return {x:w/2+p[0]*k,y:h/2+p[1]*k,width:1.5,height:1.5,fill:i%9===0?colors.c1:colors.ink2};});}
function createRingsState(){return {speed:1,angle:0,rings:Array.from({length:96},(_,i)=>({a:rnd(i)*6.283,b:Math.acos(2*rnd(i+50)-1),r:.03+.13*rnd(i+90)*rnd(i+130),c:1+i%5}))};}
function ringsFrame(w,h,t,colors,state){state.angle+=.004*state.speed;const R=Math.min(w,h)*.46;return {lineWidth:1.2,finalAlpha:1,rings:state.rings.map(g=>{const th=g.a+state.angle,X=Math.sin(g.b)*Math.cos(th),Y=Math.cos(g.b),Z=Math.sin(g.b)*Math.sin(th);return {stroke:colors['c'+g.c],alpha:.3+.7*(Z+1)/2,x:w/2+X*R*1.5,y:h/2+Y*R,rx:g.r*R*1.5,ry:g.r*R*Math.max(.12,Math.abs(Z)),rotation:Math.atan2(Y,X*1.5)+1.571,start:0,end:6.283};})};}
function ringsHover(state,on){state.speed=on?3.5:1;}
function dotsFrame(w,h,t,colors,pointer){const cells=[];for(let y=0;y<26;y++)for(let x=0;x<56;x++){const bx=x/55*w,wave=Math.sin(x*.28+t/1400)*Math.cos(y*.3+t/1900)*16,by=(y/25*.7+.2)*h+wave,dx=bx-pointer.x,dy=by-pointer.y,q=Math.hypot(dx,dy),near=Math.max(0,1-q/90);cells.push({x:bx+dx/(q||1)*near*18,y:by+dy/(q||1)*near*18,width:1.6+near*1.8,height:1.6+near*1.8,fill:near>.2?colors.c1:colors.dot});}return cells;}
export {streamFrame,clampEffort,effortAt,effortTransform,filterCommands,commandIndex,clampCommandIndex,formatClock,scrubIndex,scrubState,odometerParts,randomOdometer,heatCells,sliceCells,sliceState,blurParts,silverPosition,nextMode,waveIconIndex,createMorphState,morphFrame,createRingsState,ringsFrame,ringsHover,dotsFrame};
