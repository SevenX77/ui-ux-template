import type {CSSProperties} from 'react';
import content from '@core/content/values.json';
import {useLanguage} from '../ui';

export function Values() {
 const c = content, {t} = useLanguage();
 return (<section className="wrap sec" id="values"><div className="sec-h"><div><div className="k">{t(c.text.t0)}</div><h2>{t(c.text.t1)}</h2></div><p>{t(c.text.t2)}</p></div><div className="card fade-x" style={c.styles.s0 as CSSProperties}><table className="vt" id="vt"><tbody><tr>{c.headers.map(label => <th key={label}>{t(label)}</th>)}</tr>{c.rows.map(row => <tr key={row[0]}><td className="b">{t(row[0])}</td><td>{t(row[1])}</td><td className="mute">{t(row[2])}</td><td className="xs mute">{t(row[3])}</td></tr>)}</tbody></table></div></section>);
}
