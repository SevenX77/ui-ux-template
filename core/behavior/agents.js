/* Shared agents content/state/geometry policies; stack adapters own DOM, input, clocks and drawing. */
function agentQueue(index,data){const s=data.scenes[index];return data.queue.map((q,i)=>({label:q[0],type:q[1],className:i===s.q?'now':i<s.q?'ok':'',mark:i<s.q?data.queueMarks.complete:i===s.q?data.queueMarks.current:data.queueMarks.idle}));}
function agentSnapshot(index,data){const s=data.scenes[index],p=(index+1)/data.scenes.length;return {...s,task:Math.round(data.totals.tasks*p),taps:Math.round(data.totals.taps*p),apps:Math.round(data.totals.apps*p),progress:p,width:p*100+'%',time:'00:'+String(Math.round(data.totals.seconds*p)).padStart(2,'0'),queue:agentQueue(index,data)};}
function agentLogColor(text){if(/OK|complete/.test(text))return 'good';if(/FAIL/.test(text))return 'bad';return '';}
function mobileSeriesNext(series,random,data){const next=[...series,Math.max(10,Math.min(78,series.at(-1)+random*7-2.4))];if(next.length>24)next.shift();return next;}
function mobilePlot(series,data){const g=data.mobilePlot,n=series.length,d=series.map((v,i)=>(i?'L':'M')+(i/(n-1)*g.width).toFixed(0)+' '+(g.baseline-v).toFixed(1)).join('');return {path:d,area:d+` L${g.width} ${g.height} L0 ${g.height}Z`,cy:g.baseline-series[n-1],balance:'$'+(78+series[n-1]*1.7).toFixed(2)};}
export {agentQueue,agentSnapshot,agentLogColor,mobileSeriesNext,mobilePlot};
