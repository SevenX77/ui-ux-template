import {useLayoutEffect, useRef} from 'react';
import hero from '@core/content/hero.json';
import {useLanguage, whenSeen, countUp} from './ui';
export function Hero() {
  const {t} = useLanguage();
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {ref.current?.querySelectorAll<HTMLElement>('[data-count]').forEach(element => whenSeen(element, () => countUp(element)));}, []);
  return <header className="wrap top" ref={ref}><div className="bento"><div className="s7"><div className="k mono xs faint" style={hero.style}>{hero.eyebrow}</div><h1>{t(hero.heading[0])}<br />{t(hero.heading[1])}</h1><p className="top-p">{t(hero.description)}</p></div><div className="vol blinds boot s5"><i className="tick a" /><i className="tick b" /><i className="tick c" /><i className="tick d" />{hero.stats.map(([name, count]) => <div key={name}><small>{name}</small><b data-count={count} /></div>)}</div></div></header>;
}
