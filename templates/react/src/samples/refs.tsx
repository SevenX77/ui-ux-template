import type {CSSProperties} from 'react';
import content from '@core/content/refs.json';
import {useLanguage, Scope, Component} from '../ui';

export function Refs() {
 const c = content, {t} = useLanguage();
 return (<section className="wrap sec" id="refs" style={c.styles.s0 as CSSProperties}><div className="sec-h"><div><div className="k">{t(c.text.t0)}</div><h2>{t(c.text.t1)}</h2></div><p>{t(c.text.t2)}</p></div><Scope className="grid g4" id="reflist" name="refs">{c.items.map(item => <Component className="card" nofocus key={item.title}><b>{t(item.title)}</b><div className="xs faint" style={c.styles.source as CSSProperties}>{t(item.source)}</div><p className="sm">{t(item.description)}</p>{item.note ? <p className="xs mute" style={c.styles.note as CSSProperties}>{t(item.note)}</p> : null}{item.href ? <a className="xs" style={c.styles.link as CSSProperties} href={item.href} target="_blank">{t(c.labels.frames)}</a> : null}</Component>)}</Scope></section>);
}
