// Pure canvas sample data/geometry. Measured DOM/input/rendering belongs to each stack.
const CanvasCore = (() => {
 function nodeStyle(n){return {left:n.x+'px',top:n.y+'px'};}
 function previewStyle(n){return {background:`var(--w${n.p}) center/cover`};}
 function drag(c,origin,start,point,scale){return {x:origin.x+(point.x-start.x)/scale,y:origin.y+(point.y-start.y)/scale,moved:Math.hypot(point.x-start.x,point.y-start.y)>c.nodeGeometry.dragThreshold};}
 function related(c,id){const out=new Set(id?[id]:[]);c.edges.forEach(([a,b])=>{if(a===id)out.add(b);if(b===id)out.add(a)});return [...out];}
 function wire(c,A,B){const g=c.nodeGeometry,ax=A.x,ay=A.y,aw=A.w,ah=A.h,bx=B.x,by=B.y,bw=B.w,bh=B.h;
  if(bx>=ax+aw+g.gap){const x1=ax+aw,y1=ay+ah*g.mid,x2=bx,y2=by+bh*g.mid,k=Math.max(g.bendX,(x2-x1)*g.mid);return `M${x1} ${y1} C${x1+k} ${y1},${x2-k} ${y2},${x2} ${y2}`;}
  const x1=ax+aw*g.mid,y1=ay+ah,x2=bx+bw*g.mid,y2=by,k=Math.max(g.bendY,Math.abs(y2-y1)*g.mid);return `M${x1} ${y1} C${x1} ${y1+k},${x2} ${y2-k},${x2} ${y2}`;
 }
 function moveConfig(order,index,delta){const at=order.indexOf(index),to=at+delta;if(to<0||to>=order.length)return order;const next=[...order];next.splice(at,1);next.splice(to,0,index);return next;}
 function route(c,A,B){const g=c.blueprint,ac=[A.x+A.w/2,A.y+A.h/2],bc=[B.x+B.w/2,B.y+B.h/2];let P,dir;
  if(B.x>=A.x+A.w+g.gap||A.x>=B.x+B.w+g.gap){const s=B.x>A.x?1:-1,sx=s>0?A.x+A.w:A.x,ex=s>0?B.x:B.x+B.w;dir=[s,0];P=ac[1]===bc[1]?[[sx,ac[1]],[ex,bc[1]]]:[[sx,ac[1]],[(sx+ex)/2,ac[1]],[(sx+ex)/2,bc[1]],[ex,bc[1]]];}
  else{const s=B.y>A.y?1:-1,sy=s>0?A.y+A.h:A.y,ey=s>0?B.y:B.y+B.h;dir=[0,s];P=ac[0]===bc[0]?[[ac[0],sy],[bc[0],ey]]:[[ac[0],sy],[ac[0],(sy+ey)/2],[bc[0],(sy+ey)/2],[bc[0],ey]];}
  const e=P[P.length-1],tip=[...e];e[0]-=dir[0]*g.arrowLength;e[1]-=dir[1]*g.arrowLength;let d='M'+P[0].join(' ');
  for(let i=1;i<P.length-1;i++){const [p,q,r]=[P[i-1],P[i],P[i+1]],u=(a,b)=>{const l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [(b[0]-a[0])/l,(b[1]-a[1])/l]},v1=u(q,p),v2=u(q,r),rad=Math.min(g.corner,Math.hypot(q[0]-p[0],q[1]-p[1])/2,Math.hypot(r[0]-q[0],r[1]-q[1])/2);d+=` L${q[0]+v1[0]*rad} ${q[1]+v1[1]*rad} Q${q[0]} ${q[1]} ${q[0]+v2[0]*rad} ${q[1]+v2[1]*rad}`;}
  d+=` L${e[0]} ${e[1]}`;const n=[-dir[1],dir[0]],ah=`M${tip[0]} ${tip[1]} L${e[0]+n[0]*g.arrowHalf} ${e[1]+n[1]*g.arrowHalf} L${e[0]-n[0]*g.arrowHalf} ${e[1]-n[1]*g.arrowHalf}Z`;return {d,ah,lx:(P[0][0]+e[0])/2,ly:(P[0][1]+e[1])/2};
 }
 function blueprint(c){const g=c.blueprint,R={},own={};g.groups.forEach((group,i)=>{for(const k in group.nodes){const [x,y]=group.nodes[k];R[k]={x:group.x+x,y:group.y+y,w:g.nodeWidth,h:g.nodeHeight};own[k]=i;}for(const k in group.dia){const [x,y]=group.dia[k];R[k]={x:group.x+x-g.diamondSize/2,y:group.y+y-g.diamondSize/2,w:g.diamondSize,h:g.diamondSize};own[k]=i;}});const edges=[];g.groups.forEach((group,i)=>group.edges.forEach(e=>edges.push({a:e[0],b:e[1],l:e[2],g:[i],x:false})));g.cross.forEach(e=>edges.push({a:e[0],b:e[1],l:e[2],g:[own[e[0]],own[e[1]]],x:true}));edges.forEach(e=>Object.assign(e,route(c,R[e.a],R[e.b])));return {rects:R,owner:own,edges};}
 function groupStyle(group){return {left:group.x+'px',top:group.y+'px',width:group.w+'px',height:group.h+'px','--col':`var(--${group.c})`};}
 function itemStyle(rect,group){return {left:rect.x+'px',top:rect.y+'px','--col':`var(--${group.c})`};}
 function labelStyle(c,edge){return {left:edge.lx-c.blueprint.labelX+'px',top:edge.ly-c.blueprint.labelY+'px'};}
 function edgeStyle(c,edge,index){const on=edge.g.includes(index),color=on?`var(--${c.blueprint.groups[index].c})`:'var(--ink3)';return {on,path:on?{'--col':color}:undefined,arrow:{fill:color}};}
 function detail(c,index){const g=c.blueprint.groups[index];return {g,steps:Object.values(g.nodes).map(n=>n[2]),values:[[g.hours,c.labels.time],[g.cost,c.labels.cost],[g.month,c.labels.month],[g.year,c.labels.year]],color:{background:`var(--${g.c})`}};}
 return {nodeStyle,previewStyle,drag,related,wire,moveConfig,route,blueprint,groupStyle,itemStyle,labelStyle,edgeStyle,detail};
})();
export {CanvasCore};
