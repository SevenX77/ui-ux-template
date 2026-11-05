import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties} from 'react';
import c from '@core/content/agents.json';
import {agentSnapshot, agentLogColor, mobileSeriesNext, mobilePlot} from '@core/behavior/agents.js';
import {Component, Scope, Segmented, UX, useLanguage} from '../ui';

function PhoneScreen({index}: {index: number}) {
 const {t} = useLanguage();
 switch (index) {
  case 0: return <><div style={c.styles.s0 as CSSProperties}>{t(c.text.t0)}<br />{t(c.text.t1)}</div><div style={c.styles.s1 as CSSProperties}>{t(c.text.t2)}</div></>;
  case 1: return <><b style={c.styles.s2 as CSSProperties}>{t(c.text.t3)}</b><div style={c.styles.s3 as CSSProperties}>{t(c.text.t4)}</div></>;
  case 2: return <><b style={c.styles.s2 as CSSProperties}>{t(c.text.t3)}</b><div style={c.styles.s3 as CSSProperties}>{t(c.text.t4)}</div><div style={c.styles.s4 as CSSProperties}><span style={c.styles.s5 as CSSProperties}>{t(c.text.t5)}</span></div></>;
  case 3: return <><b style={c.styles.s2 as CSSProperties}>{t(c.text.t6)}</b><div style={c.styles.s6 as CSSProperties}>{t(c.text.t7)}</div><div style={c.styles.s7 as CSSProperties}>{t(c.text.t8)}</div></>;
  case 4: return <><b style={c.styles.s2 as CSSProperties}>{t(c.text.t9)}</b><div style={c.styles.s8 as CSSProperties}></div><div style={c.styles.s9 as CSSProperties}>{t(c.text.t10)}</div></>;
  case 5: return <><b style={c.styles.s2 as CSSProperties}>{t(c.text.t11)}</b><div style={c.styles.s10 as CSSProperties}>{t(c.text.t12)}</div><div style={c.styles.s11 as CSSProperties}>{t(c.text.t13)}</div></>;
  case 6: return <><b style={c.styles.s2 as CSSProperties}>{t(c.text.t14)}</b><div style={c.styles.s12 as CSSProperties}><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i><i style={c.styles.s13 as CSSProperties}></i></div></>;
  case 7: return <><div style={c.styles.s14 as CSSProperties}><div style={c.styles.s15 as CSSProperties}>{t(c.text.t0)}<br />{t(c.text.t1)}</div><div style={c.styles.s16 as CSSProperties}>{t(c.text.t15)}</div><div style={c.styles.s17 as CSSProperties}>{t(c.text.t16)}</div></div></>;
  default: return null;
 }
}
type LogLine = {id: number; text: string; crew: number; color: string};
export function Agents() {
 const {t} = useLanguage(), crewRef = useRef<HTMLElement>(null), agRef = useRef<HTMLDivElement>(null), errorRef = useRef<HTMLDivElement>(null), mobileRef = useRef<HTMLDivElement>(null);
 const [scene, setScene] = useState(0), [runVersion, setRunVersion] = useState(0), [playing, setPlaying] = useState(false), [logs, setLogs] = useState<LogLine[]>([]), [errors, setErrors] = useState(0), [errorPulse, setErrorPulse] = useState(0), [selectedCrew, setSelectedCrew] = useState<number | null>(null);
 const [series, setSeries] = useState(c.mobileSeries), [mobileTab, setMobileTab] = useState('LOG'), [mobilePanelVersion, setMobilePanelVersion] = useState(0), [mobileToast, setMobileToast] = useState(false), [mobileToastText, setMobileToastText] = useState(false);
 const sceneRef = useRef(scene), interval = useRef<ReturnType<typeof setInterval> | null>(null), logTimers = useRef<ReturnType<typeof setTimeout>[]>([]), lineId = useRef(0), mobileTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
 const snapshot = agentSnapshot(scene, c), plot = mobilePlot(series, c);
 const clearLogs = () => {logTimers.current.forEach(clearTimeout); logTimers.current = [];};
 const stop = () => {if (interval.current !== null) clearInterval(interval.current); interval.current = null; setPlaying(false);};
 const reset = () => {clearLogs(); stop(); sceneRef.current = 0; setScene(0); setLogs([]); setErrors(0); setRunVersion(value => value + 1);};
 const toggleRun = () => {
  if (interval.current !== null) {stop(); return;}
  if (sceneRef.current >= c.scenes.length - 1) reset();
  setPlaying(true);
  interval.current = setInterval(() => {sceneRef.current++; setScene(sceneRef.current); if (sceneRef.current >= c.scenes.length - 1) stop();}, c.timing.scene);
 };
 useLayoutEffect(() => {
  const host = crewRef.current!;
  const filter = () => {const chosen = host.querySelector<HTMLElement>('.crew.ux-focus'); setSelectedCrew(chosen ? Number(chosen.dataset.i) : null);};
  host.addEventListener('ux:focus', filter); host.addEventListener('ux:blur', filter);
  return () => {host.removeEventListener('ux:focus', filter); host.removeEventListener('ux:blur', filter);};
 }, []);
 useLayoutEffect(() => {
  const current = c.scenes[scene];
  if ('err' in current && current.err) setErrors(1);
  current.log.forEach((text, index) => logTimers.current.push(setTimeout(() => {
   const color = agentLogColor(text); if (color === 'bad') setErrorPulse(value => value + 1);
   const entry = {id: lineId.current++, text, crew: current.crew, color}; setLogs(rows => [...rows, entry].slice(-c.logLimit));
  }, index * c.timing.log)));
 }, [scene, runVersion]);
 useLayoutEffect(() => {if (!errorPulse || !errorRef.current) return; errorRef.current.classList.remove('err'); void errorRef.current.offsetWidth; errorRef.current.classList.add('err');}, [errorPulse]);
 useEffect(() => {
  const host = mobileRef.current!; let tick: ReturnType<typeof setInterval> | null = null;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
   if (tick !== null) clearInterval(tick); tick = null;
   if (entry.isIntersecting) {let counter = 0; tick = setInterval(() => {
    setSeries(values => mobileSeriesNext(values, Math.random(), c));
    if (++counter % c.mobileToastEvery === 0) {setMobileToastText(true); setMobileToast(true); mobileTimers.current.push(setTimeout(() => setMobileToast(false), c.timing.toast));}
   }, c.timing.mobile);}
  }));
  observer.observe(host); return () => {observer.disconnect(); if (tick !== null) clearInterval(tick); mobileTimers.current.forEach(clearTimeout);};
 }, []);
 useEffect(() => () => {if (interval.current !== null) clearInterval(interval.current); clearLogs();}, []);
 return (<section className="wrap sec" id="agents">
  <div className="sec-h"><div><div className="k">{t(c.text.t28)}</div><h2>{t(c.text.t29)}</h2></div><p>{t(c.text.t30)}</p></div>
  <div className={"ag tools-on" + (playing ? " playing" : "")} id="ag" ref={agRef}>
    <div className="ag-top"><div className="ag-kpis"><div className="ag-k"><span className="label">{t(c.text.t31)}</span><div className="big" id="kTask">{snapshot.task}<small>{t(c.labels.taskTotal)}</small></div></div><div className="ag-k"><span className="label">{t(c.text.t32)}</span><div className="big" id="kTap">{snapshot.taps}</div></div><div className="ag-k"><span className="label">{t(c.text.t33)}</span><div className="big" id="kApp">{snapshot.apps}<small>{t(c.labels.appTotal)}</small></div></div><div className="ag-k" id="kErrC" ref={errorRef}><span className="label">{t(c.text.t34)}</span><div className="big" id="kErr">{errors}</div></div></div><Scope className="ag-crew" id="crew" name="crew" hold ref={crewRef}>{c.crew.map(member => <Component as="button" key={member.index} className={'crew' + (snapshot.crew === member.index ? ' on' : '')} live aria-label={member.name} data-i={member.index} style={{'--col': `var(--${member.color})`} as CSSProperties} onClick={event => UX.focus(event.currentTarget)}><svg viewBox={c.faceAttrs.viewBox}><path d={member.face} fill={c.faceAttrs.fill} /><circle cx={c.faceAttrs.leftX} cy={c.faceAttrs.eyeY} r={c.faceAttrs.eyeRadius} fill={c.faceAttrs.eyeFill} /><circle cx={c.faceAttrs.rightX} cy={c.faceAttrs.eyeY} r={c.faceAttrs.eyeRadius} fill={c.faceAttrs.eyeFill} /></svg>{member.name}</Component>)}</Scope></div>
    <div className="ag-main">
      <div className="ag-left"><div className="ag-log mono" id="agLog">{logs.map(line => <div key={line.id} data-c={line.crew} style={{...line.color ? c.logStyles[line.color as keyof typeof c.logStyles] : {}, ...selectedCrew !== null && line.crew !== selectedCrew ? c.logHidden : {}} as CSSProperties}>{t(line.text)}</div>)}</div><div className="ag-queue" id="agQueue">{snapshot.queue.map((item: {label: string; type: string; className: string; mark: string}, index: number) => <div className={item.className} key={index}><span>{t(item.mark + " " + item.label)}</span><span>{t(item.type)}</span></div>)}</div></div>
      <div className="phone"><div className="phone-in" id="phone"><div className="ph-s" key={runVersion + ":" + scene}>{<PhoneScreen index={scene} />}</div>{snapshot.tap && <i className="ph-tap" key={"tap" + runVersion + ":" + scene} style={{left: snapshot.tap[0] + "%", top: snapshot.tap[1] + "%"}} />}</div></div>
    </div>
    <div className="ag-foot"><button className="btn" id="agRun" onClick={toggleRun}>{playing ? <><i className="ic-pause" />{t(c.labels.pause)}</> : t(c.labels.play)}</button><button className="btn sec2" id="agReset" data-tool="" onClick={reset}>{t(c.text.t35)}</button><div className="ag-prog"><i id="agBar" style={{width: snapshot.width}} /></div><span className="xs mute mono" id="agTime">{snapshot.time}</span></div>
  </div>
  <div className="sub">{t(c.text.t36)}<small>{t(c.text.t37)}</small></div>
  <div className="grid" style={c.styles.s26 as CSSProperties} id="mob-grid" data-scope="mob-grid">
    <div className="mob" id="mob" ref={mobileRef}><div className="mob-in"><div className={"mob-toast" + (mobileToast ? " show" : "")} id="mt">{mobileToastText && <><b>{t(c.text.t17)}</b>{t(c.labels.mobileToast)}</>}</div><div className="between"><b>{t(c.text.t17)}</b><span className="tag"><i className="dotc" style={c.styles.s18 as CSSProperties}></i>{t(c.text.t18)}</span></div><div className="dash-r keep" data-scope="mob" style={c.styles.s19 as CSSProperties}><div className="card" data-cmp="" style={c.styles.s20 as CSSProperties}><span className="label">{t(c.text.t19)}</span><div className="b num-t" style={c.styles.s21 as CSSProperties} id="mb">{plot.balance}</div></div><div className="card" data-cmp="" style={c.styles.s20 as CSSProperties}><span className="label">{t(c.text.t21)}</span><div className="b num-t" style={c.styles.s21 as CSSProperties}>{t(c.text.t22)}</div></div></div><Component className="card" nofocus style={c.styles.s22 as CSSProperties}><span className="label">{t(c.text.t23)}</span><svg id="ms" viewBox={c.mobilePlot.viewBox} style={c.styles.s23 as CSSProperties} preserveAspectRatio="none"><path d={plot.area} fill={c.mobilePlot.fill} opacity={c.mobilePlot.fillOpacity} /><path d={plot.path} fill="none" stroke={c.mobilePlot.fill} strokeWidth={c.mobilePlot.strokeWidth} /><circle cx={c.mobilePlot.width} cy={plot.cy} r={c.mobilePlot.radius} fill={c.mobilePlot.fill} /></svg></Component><Segmented id="mseg" style={c.styles.s24 as CSSProperties} value={mobileTab} onChange={tab => {setMobileTab(tab); setMobilePanelVersion(value => value + 1);}} options={c.mobileTabs.map(tab => ({value: tab, label: tab}))} /><Component className="card mono" nofocus id="mp" style={c.styles.s25 as CSSProperties}>{c.mobilePanels[mobileTab as keyof typeof c.mobilePanels].map((line, index) => <div key={mobileTab + mobilePanelVersion + ":" + index} style={c.mobileLineStyle as CSSProperties}>{t(line)}</div>)}</Component></div></div>
    <div className="grid" style={c.styles.s27 as CSSProperties}>
      <div className="card" data-cmp="" data-nofocus=""><div className="b">{t(c.text.t38)}</div><p className="sm mute" style={c.styles.s28 as CSSProperties}>{t(c.text.t39)}</p></div>
      <div className="vol" style={c.styles.s29 as CSSProperties} data-cmp="" data-nofocus=""><div className="between"><span className="b">{t(c.text.t40)}</span><span className="tag" style={c.styles.s30 as CSSProperties}>{t(c.text.t41)}</span></div><div><div className="huge">{t(c.text.t42)}</div><div className="sm" style={c.styles.s31 as CSSProperties}>{t(c.text.t43)}</div></div></div>
    </div>
  </div>
</section>);
}
