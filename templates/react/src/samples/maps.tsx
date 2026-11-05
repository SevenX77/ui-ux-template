import {Fragment, useCallback, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties} from 'react';
import maps from '@core/content/maps.json';
import {roleMapView, roleMapEdges, roleMapDetail, roleMapNext, fanLayout, fanGeometry, fanDetail} from '@core/behavior/maps.js';
import {UX, useIntent, useLanguage} from '../ui';

type Selection = {k: string | null; i: number};
type RoleEdges = {base: {id: string; d: string}[]; active: {id: string; d: string; color: string; current: boolean; x1: number; y1: number; x2: number; y2: number; gradientY2: number}[]};
type FanGeometry = {nar: boolean; x0: number; y0: number; x1: number; w: number; h: number; points: {y: number; d: string; gradientY2: number; delay: string; left: string; top: string}[]; signature: string};
function IntentButton({preview, back, ...props}: ButtonHTMLAttributes<HTMLButtonElement> & {preview: () => void; back: () => void}) {
 const ref = useRef<HTMLButtonElement>(null), latest = useRef({preview, back}); latest.current = {preview, back};
 useIntent(ref, () => latest.current.preview(), () => latest.current.back(), []);
 return <button {...props} ref={ref} />;
}
function RoleMap() {
 const c = maps, {lang, t} = useLanguage(), hostRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null), detailRef = useRef<HTMLDivElement>(null);
 const [current, setCurrent] = useState<Selection>({k: null, i: -1}), savedRef = useRef<Selection | null>(null), currentRef = useRef(current); currentRef.current = current;
 const [detail, setDetail] = useState<Selection | null>(null), [detailOpen, setDetailOpen] = useState(false), [detailVersion, setDetailVersion] = useState(0), [auto, setAuto] = useState(false);
 const timerRef = useRef<ReturnType<typeof setInterval> | null>(null), [edges, setEdges] = useState<RoleEdges>({base: [], active: []});
 const view = roleMapView(c, current), selected = detail ? roleMapDetail(c, detail) : null;
 const stop = useCallback(() => {if (timerRef.current !== null) clearInterval(timerRef.current); timerRef.current = null; setAuto(false);}, []);
 const commit = useCallback((k: string, i: number) => {const next = {k, i}; savedRef.current = next; setCurrent(next); setDetail(next); setDetailOpen(true); setDetailVersion(version => version + 1);}, []);
 const rest = useCallback(() => {savedRef.current = null; setCurrent({k: null, i: -1}); stop(); setDetailOpen(false);}, [stop]);
 const preview = (k: string, i: number) => setCurrent({k, i});
 const back = () => setCurrent(savedRef.current ? {...savedRef.current} : {k: null, i: -1});
 const draw = useCallback(() => {
  const stage = stageRef.current!; const rect = stage.getBoundingClientRect();
  const pos = (element: Element, right: boolean): [number, number] => {const b = element.getBoundingClientRect(); return [(right ? b.right : b.left) - rect.left, b.top + b.height / 2 - rect.top];};
  const categories = Array.from(stage.querySelectorAll('.rm-cat')).map(button => ({left: pos(button, false), right: pos(button, true)}));
  const roles = Array.from(stage.querySelectorAll('.rm-role')).map(button => pos(button, false));
  setEdges(roleMapEdges(c, currentRef.current, {core: pos(stage.querySelector('.rm-core')!, true), categories, roles}));
 }, []);
 useLayoutEffect(draw, [current, lang]);
 useLayoutEffect(() => {const observer = new ResizeObserver(draw); observer.observe(stageRef.current!); return () => observer.disconnect();}, [draw]);
 useLayoutEffect(() => {const host = hostRef.current!; const blur = (event: Event) => {if (event.target === host) rest();}; host.addEventListener('ux:blur', blur); return () => {host.removeEventListener('ux:blur', blur); if (timerRef.current !== null) clearInterval(timerRef.current);};}, [rest]);
 useLayoutEffect(() => {if (!detail) return; const element = detailRef.current!; element.style.animation = 'none'; void element.offsetWidth; element.style.animation = c.styles.detailAnimation;}, [detailVersion]);
 const toggleAuto = () => {
  if (timerRef.current !== null) {stop(); return;}
  setAuto(true); let index = savedRef.current ? savedRef.current.i : -1;
  timerRef.current = setInterval(() => {index = roleMapNext(c, index); commit(c.roles[index].category, index);}, c.timing.auto);
 };
 return <div className="rolemap" id="rolemap" ref={hostRef} data-scope="rm" data-dim="none" data-hold="" data-cmp="">
<div className="between" style={c.styles.header as CSSProperties}><div><b>{t(c.text.mapTitle)}</b><div className="xs mute">{c.text.router}</div></div><button className="btn ghost sm" id="rmAuto" data-tool="" onClick={toggleAuto}>{auto ? <><i className="ic-pause" />{t(c.text.pause)}</> : t(c.text.auto)}</button></div><div className="rm-body"><div className="rm-stage" id="rmS" ref={stageRef}><svg className="rm-svg" id="rmSvg"><defs>{edges.active.map(edge => <linearGradient key={edge.id} id={edge.id} gradientUnits="userSpaceOnUse" x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.gradientY2}><stop offset="0" stopColor={edge.color} /><stop offset="1" stopColor={edge.color} stopOpacity={c.geometry.roleGradientOpacity} /></linearGradient>)}</defs>{edges.base.map(edge => <path key={edge.id} className="l" d={edge.d} />)}{edges.active.map(edge => <Fragment key={edge.id}><path className={'l on' + (edge.current ? ' cur' : '')} style={{stroke: `url(#${edge.id})`}} d={edge.d} />{edge.current && <path className="pulse" pathLength={c.geometry.pathLength} style={{'--col': edge.color} as CSSProperties} d={edge.d} />}</Fragment>)}</svg><div className="rm-core" style={{'--col': view.coreColor} as CSSProperties}>{c.text.core}</div>{view.categories.map((category: {k: string; n: string; col: string; top: string; count: number; firstRole: number; on: boolean}) => <IntentButton key={category.k} className={'rm-cat' + (category.on ? ' on' : '')} data-k={category.k} style={{top: category.top, '--col': category.col} as CSSProperties} preview={() => preview(category.k, category.firstRole)} back={back} onClick={() => {stop(); commit(category.k, category.firstRole);}}><b>{category.count}</b><span>{category.n}</span></IntentButton>)}{view.roles.map((role: {name: string; category: string; color: string; top: string; on: boolean; current: boolean}, index: number) => <IntentButton key={role.name} className={'rm-role' + (role.on ? ' on' : '') + (role.current ? ' cur' : '')} data-i={index} style={{top: role.top, '--col': role.color} as CSSProperties} preview={() => preview(role.category, index)} back={back} onClick={() => {stop(); commit(role.category, index);}}>{role.name}</IntentButton>)}</div><div className={'rm-wrap' + (detailOpen ? ' open' : '')} id="rmW"><div className="rm-detail" id="rmD" ref={detailRef} style={detail ? {animation: c.styles.detailAnimation} : undefined}>{selected && <><div className="between"><span className="xs b" style={{color: selected.category.col}}><i className="dotc" style={{...c.styles.detailDot, background: selected.category.col} as CSSProperties} />{selected.category.n}</span><span className="tag">{c.text.active}</span></div><div style={c.styles.detailTitle as CSSProperties}>{t(selected.title)}</div><p className="sm mute">{t(selected.body)}</p><div className="rm-ask"><span style={c.styles.askText as CSSProperties}>{selected.ask}</span><button className="btn ico sm" style={c.styles.askButton as CSSProperties} aria-label={t(c.attrs.ask)}>{c.text.askArrow}</button></div></>}</div></div></div>
</div>;
}
function Fan() {
 const c = maps, {lang, t} = useLanguage(), hostRef = useRef<HTMLDivElement>(null), centerRef = useRef<HTMLDivElement>(null), buttonsRef = useRef<HTMLDivElement>(null);
 const [category, setCategory] = useState(0), [item, setItem] = useState(-1), [hover, setHover] = useState(-1), [open, setOpen] = useState(false), [still, setStill] = useState(false), [generation, setGeneration] = useState(0), [geometry, setGeometry] = useState<(FanGeometry & {category: number}) | null>(null);
 const categoryRef = useRef(category), itemRef = useRef(item); categoryRef.current = category; itemRef.current = item;
 const signatureRef = useRef(''), [detail, setDetail] = useState<{category: string; title: string; progress: number; quotes: number; links: number} | null>(null);
 const measure = useCallback((index: number) => {
  const host = hostRef.current!, center = centerRef.current!, strip = buttonsRef.current!, button = strip.querySelectorAll('button')[index];
  const layout = fanLayout(c, index, {hostWidth: host.clientWidth, buttonOffsetLeft: button.offsetLeft, stripWidth: strip.clientWidth, buttonWidth: button.offsetWidth});
  center.style.height = layout.height;
  if (layout.scrollLeft !== null) strip.scrollLeft = layout.scrollLeft;
  return fanGeometry(c, index, {narrow: layout.narrow, width: center.clientWidth, height: center.clientHeight, centerRect: center.getBoundingClientRect(), buttonRect: button.getBoundingClientRect()});
 }, []);
 const rebuild = useCallback((index: number, keepStill: boolean) => {const next = measure(index); signatureRef.current = next.signature; setGeometry({...next, category: index}); setStill(keepStill); setHover(-1); setGeneration(value => value + 1);}, [measure]);
 useLayoutEffect(() => rebuild(category, false), [category]);
 useLayoutEffect(() => {const observer = new ResizeObserver(() => {const next = measure(categoryRef.current); if (next.signature !== signatureRef.current) rebuild(categoryRef.current, true);}); observer.observe(centerRef.current!); return () => observer.disconnect();}, [measure, rebuild]);
 useLayoutEffect(() => {const host = hostRef.current!; const blur = (event: Event) => {if (event.target === host && itemRef.current >= 0) {setItem(-1); setOpen(false); rebuild(categoryRef.current, true);}}; host.addEventListener('ux:blur', blur); return () => host.removeEventListener('ux:blur', blur);}, [rebuild]);
 // Language changes can resize the category strip without changing the centre.
 // Native code only redraws when its observed centre size changes.
 void lang;
 useLayoutEffect(() => {if (hostRef.current) UX.paint(hostRef.current);});
 const selectedColor = c.fan[category].col;
 return <div className={'fan' + (open ? ' open' : '')} id="fan" ref={hostRef} data-scope="fan" data-dim="none" data-hold="" data-cmp="" style={{'--col': selectedColor} as CSSProperties}>
<div className="fan-l" ref={buttonsRef}>{c.fan.map((group, index) => <button key={group.name} className={category === index ? 'on' : ''} data-i={index} onClick={() => {setItem(-1); setOpen(false); if (category === index) rebuild(index, false); else setCategory(index);}}><b>{group.count}</b>{' ' + t(group.name)}<small>{t(c.text.notes)}</small></button>)}</div><div className={'fan-c' + (still ? ' still' : '')} id="fanC" ref={centerRef}>{geometry && <><svg key={generation}><defs>{geometry.points.map((point, index) => <linearGradient key={index} id={'fg' + index} gradientUnits="userSpaceOnUse" x1={geometry.x0} y1={geometry.y0} x2={geometry.x1} y2={point.gradientY2}><stop offset="0" stopColor={selectedColor} /><stop offset="1" stopColor={selectedColor} stopOpacity={c.geometry.fanGradientOpacity} /></linearGradient>)}</defs>{geometry.points.map((point, index) => <Fragment key={index}><path className={'l ' + (index === item || index === hover ? 'on' : '')} data-k={index} pathLength={c.geometry.pathLength} style={{stroke: `url(#fg${index})`, animationDelay: point.delay}} d={point.d} /><circle cx={geometry.x1} cy={point.y} r={c.geometry.itemRadius} fill={selectedColor} /></Fragment>)}<circle cx={geometry.x0} cy={geometry.y0} r={c.geometry.sourceRadius} fill={selectedColor} /><path className="pulse" id="fanP" pathLength={c.geometry.pathLength} d={item >= 0 ? geometry.points[item].d : ''} style={{display: item >= 0 ? '' : 'none'}} /></svg>{c.fan[geometry.category].items.map((title, index) => <IntentButton key={generation + ':' + index} className={'fan-i ' + (index === item ? 'on' : '')} data-k={index} style={{left: geometry.points[index].left, top: geometry.points[index].top, animationDelay: geometry.points[index].delay}} preview={() => setHover(index)} back={() => setHover(-1)} onClick={() => {setItem(index); setDetail(fanDetail(c, geometry.category, index)); setOpen(true);}}>{t(title)}</IntentButton>)}</>}</div><div className="fan-r"><div id="fanR">{detail && <><div className="label">{t(detail.category)}</div><div style={c.styles.fanTitle as CSSProperties}>{t(detail.title)}</div><div className="fan-big"><div className="label">{t(c.text.read)}</div><div className="big">{detail.progress + '%'}</div></div><div className="grid g2 keep" style={c.styles.fanStats as CSSProperties}><div className="bp-tile"><b>{detail.quotes}</b><div className="xs mute">{t(c.text.quotes)}</div></div><div className="bp-tile"><b>{detail.links}</b><div className="xs mute">{t(c.text.links)}</div></div></div><p className="xs mute" style={c.styles.fanDetail as CSSProperties}>{t(c.text.fanDetail)}</p></>}</div></div>
</div>;
}
export function Maps() {
 const c = maps, {t} = useLanguage();
 return <section className="wrap sec" id="maps">
<div className="sec-h"><div><div className="k">{c.text.kicker}</div><h2>{t(c.text.title)}</h2></div><p>{t(c.text.intro)}</p></div>
<RoleMap />
<div className="sub">{t(c.text.fanTitle)}<small>{t(c.text.fanNote)}</small></div>
<Fan />
</section>;
}
