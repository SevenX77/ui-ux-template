import {useEffect, useRef, useState, type CSSProperties} from 'react';
import schemes from '@core/content/schemes.json';
import shape from '@core/content/shape.json';
import controls from '@core/content/controls.json';
import {useLanguage, useTheme, useIndicators, toast} from '../ui';

export function Dial() {return <>{schemes.dial.map((dot, index) => <circle key={index} {...dot} />)}</>;}

export function Schemes() {
const c = schemes, {lang, t} = useLanguage(), {scheme, themes, setScheme} = useTheme();
const ref = useRef<HTMLElement>(null), [selected, setSelected] = useState(c.segments);
useIndicators(ref, [selected, lang, scheme]);
return (<section className="wrap sec" id="schemes" ref={ref}>
<div className="sec-h"><div><div className="k">{t(c.text.t0)}</div><h2>{t(c.text.t1)}</h2></div><p>{t(c.text.t2)}</p></div>
<div className="th-row" id="scheme-cards" data-scope="themes">{themes.map(theme => <div key={theme.id} className={'th' + (scheme === theme.id ? ' cur' : '')} data-cmp="" data-live="" data-nofocus="" data-scheme={theme.id} onClick={event => setScheme(theme.id, event)}>
<div className="vol th-vol"><span className="xs b">{c.incomeLabel}</span><div className="big" style={c.styles.themeIncome as CSSProperties}>{c.income}</div></div>
<div className="row" style={c.styles.themeRow as CSSProperties}><span className="tag on">{t(theme.mode === 'dark' ? c.mode.dark : c.mode.light)}</span>{c.colors.map(color => <i key={color} className="dotc" style={{background: color}} />)}</div>
<div className="b" style={c.styles.themeName as CSSProperties}>{theme.name[lang]}</div><p className="xs mute" style={c.styles.themeNote as CSSProperties}>{theme.note[lang]}</p>
<div className="row th-swatch">{c.palette.map(token => <i key={token} style={{...c.styles.swatch, background: `var(--${token})`}} />)}</div></div>)}</div>
<div className="bento" style={c.styles.s0 as CSSProperties}>
<div className="card s5"><b className="sm">{t(c.text.t3)}</b><p className="xs mute" style={c.styles.s1 as CSSProperties}>{t(c.text.t4)}</p></div>
<div className="card s7"><span className="lab">{t(c.text.t5)}</span><div className="code" style={c.styles.s2 as CSSProperties}>{t(c.text.t6)}<b>{t(c.text.t7)}</b>{t(c.text.t8)}<b>{t(c.text.t9)}</b>{t(c.text.t10)}<b>{t(c.text.t11)}</b>{t(c.text.t12)}<b>{t(c.text.t13)}</b>{t(c.text.t14)}<b>{t(c.text.t15)}</b>{t(c.text.t16)}</div></div>
</div>
<div className="sub">{t(c.text.t17)}<small>{t(c.text.t18)}</small></div>
<div className="bento">
<div className="card s5"><div className="b">{t(c.text.t19)}</div><p className="sm mute" style={c.styles.s3 as CSSProperties}>{t(c.text.t20)}</p><div className="row"><div className="seg" data-seg=""><i className="seg-ind" /><button className={selected[0] === 0 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 0 ? 0 : value))}>{t(c.text.t21)}</button><button className={selected[0] === 1 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 0 ? 1 : value))}>{t(c.text.t22)}</button><button className={selected[0] === 2 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 0 ? 2 : value))}>{t(c.text.t23)}</button></div><span className="tag on">{t(c.text.t24)}</span></div></div>
<div className="vol s4" style={c.styles.s4 as CSSProperties}><div className="between"><span className="b">{t(c.text.t25)}</span><span className="xs" style={c.styles.s5 as CSSProperties}>{t(c.text.t26)}</span></div><div><div className="big">{t(c.text.t27)}</div><div className="xs" style={c.styles.s6 as CSSProperties}>{t(c.text.t28)}</div></div></div>
<div className="card s3" style={c.styles.s7 as CSSProperties}><svg className="dial-svg" data-dial="" viewBox={c.attrs.a0} style={c.styles.s8 as CSSProperties}><Dial /></svg><div><div className="b">{t(c.text.t29)}</div><p className="sm mute" style={c.styles.s9 as CSSProperties}>{t(c.text.t30)}</p></div></div>
</div>
</section>);
}

export function Shape() {
const c = shape, {lang, t} = useLanguage();
const ref = useRef<HTMLElement>(null), [selected, setSelected] = useState(c.segments);
useIndicators(ref, [selected, lang]);
return (<section className="wrap sec" id="shape" ref={ref}>
<div className="sec-h"><div><div className="k">{t(c.text.t0)}</div><h2>{t(c.text.t1)}</h2></div><p>{t(c.text.t2)}</p></div>
<div className="bento">
<div className="s7"><span className="lab">{t(c.text.t3)}</span><div className="grid g5" id="radii">{c.radii.map(([number, title, usage, radius]) => <div key={number} className="card" style={c.styles.radiusCard as CSSProperties}><div style={{...c.styles.radiusDemo, borderRadius: radius}} /><div className="between" style={c.styles.radiusLabel as CSSProperties}><b className="sm">{t(title)}</b><span className="mono xs mute">{number}</span></div><div className="xs mute" style={c.styles.radiusNote as CSSProperties}>{t(usage)}</div></div>)}</div></div>
<div className="s5"><span className="lab">{t(c.text.t4)}</span><div className="card" style={c.styles.s0 as CSSProperties}><div className="notch" data-seg=""><i className="seg-ind" /><svg viewBox={c.attrs.a0} preserveAspectRatio={c.attrs.a1} aria-hidden={c.attrs.a2 === "true"}><defs><filter id="rim" x={c.attrs.a3} y={c.attrs.a3} width={c.attrs.a4} height={c.attrs.a4} colorInterpolationFilters={c.attrs.a5 as "sRGB"}><feComponentTransfer in={c.attrs.a6}><feFuncA type={c.attrs.a7} tableValues={c.attrs.a8}></feFuncA></feComponentTransfer><feGaussianBlur stdDeviation={c.attrs.a9}></feGaussianBlur><feOffset dy={c.attrs.a10} result={c.attrs.a11}></feOffset><feFlood floodColor={c.attrs.a12}></feFlood><feComposite in2={c.attrs.a11} operator={c.attrs.a13}></feComposite><feComposite in2={c.attrs.a6} operator={c.attrs.a13}></feComposite><feMerge><feMergeNode in={c.attrs.a14}></feMergeNode><feMergeNode></feMergeNode></feMerge></filter></defs><path filter={c.attrs.a15} d={c.attrs.a16}></path></svg><button className={selected[0] === 0 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 0 ? 0 : value))}>{t(c.text.t5)}</button><button className={selected[0] === 1 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 0 ? 1 : value))}>{t(c.text.t6)}</button></div></div></div>
</div>
<div className="sub">{t(c.text.t7)}<small>{t(c.text.t8)}</small></div>
<div className="grid g4">
<div className="card"><span className="lab">{t(c.text.t9)}</span><button className="btn sec2 sm">{t(c.text.t10)}</button></div>
<div className="card"><span className="lab">{t(c.text.t11)}</span><div className="row" style={c.styles.s1 as CSSProperties}><input className="input" style={c.styles.s2 as CSSProperties} defaultValue={t(c.attrs.a17)} /><input className="input err" style={c.styles.s3 as CSSProperties} defaultValue={t(c.attrs.a18)} /></div></div>
<div className="card"><span className="lab">{t(c.text.t12)}</span><div style={c.styles.s4 as CSSProperties} className="mute">{t(c.text.t13)}</div></div>
<div className="card"><span className="lab">{t(c.text.t14)}</span><div className="sm"><div className="between"><span className="mute">{t(c.text.t15)}</span><b>{t(c.text.t16)}</b></div><div style={c.styles.s5 as CSSProperties} className="between"><span className="mute">{t(c.text.t17)}</span><b>{t(c.text.t18)}</b></div></div></div>
</div>
<div className="sub">{t(c.text.t19)}<small>{t(c.text.t20)}</small></div>
<div className="bento" id="depths">
<div className="card s2"><div className="b">{t(c.text.t21)}</div><div className="xs mute">{t(c.text.t22)}</div></div>
<div className="card lift s2" style={c.styles.s6 as CSSProperties}><div className="b">{t(c.text.t23)}</div><div className="xs mute">{t(c.text.t24)}</div></div>
<div className="float s2" style={c.styles.s7 as CSSProperties}><div className="b">{t(c.text.t25)}</div><div className="xs mute">{t(c.text.t26)}</div></div>
<div className="recess s2" style={c.styles.s8 as CSSProperties}><div className="b">{t(c.text.t27)}</div><div className="xs mute">{t(c.text.t28)}</div></div>
<div className="card s2" style={c.styles.s9 as CSSProperties}><div className="raised" style={c.styles.s10 as CSSProperties}>{t(c.text.t29)}</div></div>
<div className="vol s2" style={c.styles.s11 as CSSProperties}><div className="b">{t(c.text.t30)}</div><div className="xs" style={c.styles.s12 as CSSProperties}>{t(c.text.t31)}</div></div>
</div>
<div className="sub">{t(c.text.t32)}<small>{t(c.text.t33)}</small></div>
<div className="bento">
<div className="card s3" style={c.styles.s13 as CSSProperties}><div className="huge">{t(c.text.t34)}</div><div className="xs mute">{t(c.text.t35)}</div></div>
<div className="card s5"><div style={c.styles.s14 as CSSProperties}>{t(c.text.t36)}</div><div style={c.styles.s15 as CSSProperties}>{t(c.text.t37)}</div><div style={c.styles.s16 as CSSProperties} className="mute">{t(c.text.t38)}</div><div className="label" style={c.styles.s17 as CSSProperties}>{t(c.text.t39)}</div><div className="mono" style={c.styles.s18 as CSSProperties}>{t(c.text.t40)}</div></div>
<div className="card s4"><div className="xs mute" style={c.styles.s19 as CSSProperties}>{t(c.text.t41)}</div><div className="row" style={c.styles.s20 as CSSProperties}><i style={c.styles.s21 as CSSProperties}></i><i style={c.styles.s22 as CSSProperties}></i><i style={c.styles.s23 as CSSProperties}></i><i style={c.styles.s24 as CSSProperties}></i></div></div>
</div>
</section>);
}

export function Controls() {
const c = controls, {lang, t} = useLanguage();
const ref = useRef<HTMLElement>(null), [selected, setSelected] = useState(c.segments);
const [toggles, setToggles] = useState(c.initialToggles), [fov, setFov] = useState(c.fov), [stepper, setStepper] = useState(c.stepper);
const menuRef = useRef<HTMLDivElement>(null), [menuOpen, setMenuOpen] = useState(false), [menuChoice, setMenuChoice] = useState(0);
const focusMenu = (index: number) => requestAnimationFrame(() => menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]')[index]?.focus());
useIndicators(ref, [selected, lang]);
useEffect(() => {
 const close = (event: Event) => {if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);};
 const key = (event: KeyboardEvent) => {if (event.key === 'Escape') {setMenuOpen(false); if (menuOpen) menuRef.current?.querySelector<HTMLButtonElement>('#mTrig')?.focus();}};
 const other = (event: Event) => {if ((event as CustomEvent).detail?.owner !== 'handbook-menu') setMenuOpen(false);};
 const rest = (event: Event) => {if (event.target === menuRef.current?.closest('[data-cmp]')) setMenuOpen(false);};
 document.addEventListener('click', close); document.addEventListener('keydown', key); document.addEventListener('ui:menu-open', other); document.addEventListener('ux:rest', rest);
 return () => {document.removeEventListener('click', close); document.removeEventListener('keydown', key); document.removeEventListener('ui:menu-open', other); document.removeEventListener('ux:rest', rest);};
}, [menuOpen]);
return (<section className="wrap sec" id="controls" ref={ref}>
<div className="sec-h"><div><div className="k">{t(c.text.t0)}</div><h2>{t(c.text.t1)}</h2></div><p>{t(c.text.t2)}</p></div>
<div className="bento" id="ctrl" data-scope="ctrl">
<div className="card s5" data-cmp=""><div className="lab">{t(c.text.t3)}</div><div className="row"><button className="btn" data-toast={t(c.attrs.a0)} onClick={() => toast(t(c.attrs.a0))}>{t(c.text.t4)}</button><span className="btn sec2" style={c.styles.s0 as CSSProperties}>{t(c.text.t5)}</span><span className="btn ghost" style={c.styles.s0 as CSSProperties}>{t(c.text.t6)}</span><span className="btn danger" style={c.styles.s0 as CSSProperties}>{t(c.text.t7)}</span><button className="btn" disabled>{t(c.text.t8)}</button></div></div>
<div className="card s4" data-cmp=""><div className="lab">{t(c.text.t9)}</div><div className="seg" data-seg=""><i className="seg-ind" /><button className={selected[0] === 0 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 0 ? 0 : value))}>{t(c.text.t10)}</button><button className={selected[0] === 1 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 0 ? 1 : value))}>{t(c.text.t11)}</button><button className={selected[0] === 2 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 0 ? 2 : value))}>{t(c.text.t12)}</button><button className={selected[0] === 3 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 0 ? 3 : value))}>{t(c.text.t13)}</button></div><div style={c.styles.s1 as CSSProperties} className="seg" data-seg=""><i className="seg-ind" /><button className={selected[1] === 0 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 1 ? 0 : value))}>{t(c.text.t14)}</button><button className={selected[1] === 1 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 1 ? 1 : value))}>{t(c.text.t15)}</button><button className={selected[1] === 2 ? "on" : undefined} onClick={() => setSelected(values => values.map((value, index) => index === 1 ? 2 : value))}>{t(c.text.t16)}</button></div></div>
<div className="card s3" data-cmp=""><div className="lab">{t(c.text.t17)}</div><input className="input" placeholder={t(c.attrs.a1)} /><div className="row" style={c.styles.s2 as CSSProperties}><input className="input err" defaultValue={t(c.attrs.a2)} style={c.styles.s3 as CSSProperties} /><span className="xs" style={c.styles.s4 as CSSProperties}>{t(c.text.t18)}</span></div></div>
<div className="card s3" data-cmp=""><div className="lab">{t(c.text.t19)}</div><div className="between sm" style={c.styles.s5 as CSSProperties}><span>{t(c.text.t20)}</span><button className="switch" role={c.attrs.a3} aria-checked={toggles[0]} onClick={() => setToggles(values => values.map((value, index) => index === 0 ? !value : value))} data-tg="" aria-label={t(c.attrs.a5)}></button></div><div className="between sm" style={c.styles.s5 as CSSProperties}><span>{t(c.text.t21)}</span><button className="switch" role={c.attrs.a3} aria-checked={toggles[1]} onClick={() => setToggles(values => values.map((value, index) => index === 1 ? !value : value))} data-tg="" aria-label={t(c.attrs.a7)}></button></div><div className="row sm" style={c.styles.s6 as CSSProperties}><button className="check" role={c.attrs.a8} aria-checked={toggles[2]} onClick={() => setToggles(values => values.map((value, index) => index === 2 ? !value : value))} data-tg="" aria-label={t(c.attrs.a9)}></button>{t(c.text.t22)}<button className="check" role={c.attrs.a8} aria-checked={toggles[3]} onClick={() => setToggles(values => values.map((value, index) => index === 3 ? !value : value))} data-tg="" aria-label={t(c.attrs.a10)} style={c.styles.s7 as CSSProperties}></button>{t(c.text.t23)}</div></div>
<div className="card s4" data-cmp=""><div className="lab">{t(c.text.t24)}</div><div className="sm between"><span>{t(c.text.t25)}</span><b className="num-t" id="fov">{fov + c.text.t26.replace(/\d+/, "")}</b></div><input className="slider" type={c.attrs.a11} aria-label={t(c.attrs.a12)} min={c.attrs.a13} max={c.attrs.a14} value={fov} onChange={event => setFov(Number(event.target.value))} style={c.styles.s1 as CSSProperties} /><div className="row" style={c.styles.s8 as CSSProperties}><button className="btn sec2 sm" id="st-" onClick={() => setStepper(value => Math.max(0, value - 1))} aria-label={t(c.attrs.a16)}>{t(c.text.t27)}</button><b className="num-t" id="stv">{stepper}</b><button className="btn sec2 sm" id="st+" onClick={() => setStepper(value => value + 1)} aria-label={t(c.attrs.a17)}>{t(c.text.t29)}</button><span className="xs mute">{t(c.text.t30)}</span></div></div>
<div className="card s5" data-cmp=""><div className="lab">{t(c.text.t31)}</div><div className="row"><span className="tag on">{t(c.text.t32)}</span><span className="tag">{t(c.text.t33)}</span><span className="tag"><i className="dotc" style={c.styles.s9 as CSSProperties}></i>{t(c.text.t34)}</span><span className="tag"><i className="dotc" style={c.styles.s10 as CSSProperties}></i>{t(c.text.t35)}</span><span className="tag"><i className="dotc" style={c.styles.s11 as CSSProperties}></i>{t(c.text.t36)}</span></div><div className="row" style={c.styles.s12 as CSSProperties}><span className="tip btn sec2 sm" data-tip={t(c.attrs.a18)}>{t(c.text.t37)}</span><button className="btn sec2 sm" data-toast={t(c.attrs.a19)} onClick={() => toast(t(c.attrs.a19))}>{t(c.text.t38)}</button></div></div>
<div className="card s3" data-cmp=""><div className="lab">{t(c.text.t39)}</div><div className="menu-host" ref={menuRef}><button className="btn sec2" id="mTrig" aria-haspopup="menu" aria-expanded={menuOpen} onClick={event => {setMenuOpen(!menuOpen); if (!menuOpen) {document.dispatchEvent(new CustomEvent('ui:menu-open', {detail: {owner: 'handbook-menu'}})); if (!event.detail) requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('[role="menuitemradio"]')?.focus());}}} onKeyDown={event => {if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {event.preventDefault(); setMenuOpen(true); focusMenu(event.key === 'ArrowUp' ? c.menu.length - 1 : 0);}}}>{c.menu[menuChoice] + c.menuSuffix}</button><div className={'menu pop' + (menuOpen ? ' show' : '')} id="mPop" role="menu">{c.menu.map((label, index) => <div key={label} className={menuChoice === index ? 'on' : undefined} role="menuitemradio" tabIndex={-1} aria-checked={menuChoice === index} onClick={() => {setMenuChoice(index); setMenuOpen(false); menuRef.current?.querySelector<HTMLButtonElement>('#mTrig')?.focus();}} onKeyDown={event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); event.currentTarget.click();} else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {event.preventDefault(); focusMenu(event.key === 'Home' ? 0 : event.key === 'End' ? c.menu.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + c.menu.length) % c.menu.length);}}}>{label}{menuChoice === index && <span>{c.menuMark}</span>}</div>)}</div></div></div>
<div className="card s5" data-cmp=""><div className="lab">{t(c.text.t45)}</div><div className="sm between"><span>{t(c.text.t46)}</span><span className="mute">{t(c.text.t47)}</span></div><div style={c.styles.s13 as CSSProperties}><i style={c.styles.s14 as CSSProperties}></i></div><div className="xs mute" style={c.styles.s15 as CSSProperties}>{t(c.text.t48)}</div><div className="skel" style={c.styles.s16 as CSSProperties}></div><div className="skel" style={c.styles.s17 as CSSProperties}></div><div className="skel" style={c.styles.s18 as CSSProperties}></div></div>
<div className="card s4" data-cmp="" style={c.styles.s19 as CSSProperties}><div className="xs mute">{t(c.text.t49)}</div><div className="b" style={c.styles.s20 as CSSProperties}>{t(c.text.t50)}</div><p className="xs mute" style={c.styles.s21 as CSSProperties}>{t(c.text.t51)}</p><button className="btn sm" id="newTask" onClick={() => document.dispatchEvent(new Event("sample:new-task"))}>{t(c.text.t52)}</button></div>
</div>
</section>);
}
