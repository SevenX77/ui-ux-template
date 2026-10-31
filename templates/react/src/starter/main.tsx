import {createRoot} from 'react-dom/client';
import {useRef} from 'react';
import chrome from '@core/content/chrome.json';
import {UIProvider, useTheme, useLanguage, Scope, Component, useIndicators} from '../ui';

function Starter() {
  const {scheme, themes, setScheme} = useTheme();
  const {t} = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const theme = themes.find(theme => theme.id === scheme)!;
  const pair = themes.filter(item => item.id === theme.id || item.id === theme.pair);
  useIndicators(ref, [scheme]);
  return <main id="page"><section className="wrap sec"><div className="sec-h"><h2>{t(chrome.starter.title)}</h2><div className="seg" ref={ref}><i className="seg-ind" />{pair.map(item => <button key={item.id} className={item.id === scheme ? 'on' : ''} onClick={event => setScheme(item.id, event)}>{t(item.name.zh)}</button>)}</div></div><Scope as="div" name="starter" className="grid g2">{chrome.starter.cards.map(title => <Component key={title} as="article" className="card"><h3>{t(title)}</h3></Component>)}</Scope></section></main>;
}
createRoot(document.getElementById('root')!).render(<UIProvider><Starter /></UIProvider>);
