import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import chrome from '@core/content/chrome.json';
import htmlReference from '../../html/ui-handbook.html?url';
import {useLanguage, useTheme, useIndicators} from './ui';

export function PageChrome() {
  const {t, lang, setLanguage} = useLanguage();
  const {scheme, themes, setScheme} = useTheme();
  const [active, setActive] = useState('schemes');
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [notes, setNotes] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const embed = new URLSearchParams(location.hash.slice(1)).has('embed');
  const goTo = (id: string) => {
    setOpen(false);
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth'});
    else location.href = htmlReference + '#' + id;
  };
  useIndicators(bar, [scheme, lang, phone, notes]);
  useEffect(() => {document.body.classList.toggle('embed', embed);}, [embed]);
  useEffect(() => {document.body.classList.toggle('phone-mode', phone); document.body.classList.toggle('ux-notes', notes); return () => {document.body.classList.remove('phone-mode', 'ux-notes');};}, [phone, notes]);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {if (entry.isIntersecting) setActive(entry.target.id);}), chrome.observer);
    document.querySelectorAll('section[id]').forEach(section => observer.observe(section));
    const outside = (event: MouseEvent) => {if (!(event.target as HTMLElement).closest('#pnav')) setOpen(false);};
    document.addEventListener('click', outside);
    return () => {observer.disconnect(); document.removeEventListener('click', outside);};
  }, []);
  useEffect(() => {
    const resize = () => {if (shell.current) shell.current.style.height = Math.min(chrome.phone.heightCap, innerHeight - chrome.phone.heightInset) + 'px';};
    resize(); addEventListener('resize', resize); return () => removeEventListener('resize', resize);
  }, [phone]);
  useEffect(() => {frame.current?.contentWindow?.postMessage({scheme, lang}, location.origin);}, [scheme, lang, phone]);
  useEffect(() => {
    if (!embed) return;
    const receive = (event: MessageEvent) => {if (event.source !== parent || event.origin !== location.origin) return; const message = event.data || {}; if (message.scheme) setScheme(message.scheme); if (message.lang) setLanguage(message.lang, true); if (message.go) goTo(message.go);};
    addEventListener('message', receive); return () => removeEventListener('message', receive);
  }, [embed, setScheme, setLanguage]);
  const links = (rail: boolean) => chrome.nav.map(([id, name]) => <a key={id} href={'#' + id} data-go={id} className={active === id ? 'on' : ''} aria-label={rail ? t(name) : undefined} onClick={event => {event.preventDefault(); goTo(id);}}>{rail ? <span>{t(name)}</span> : t(name)}</a>);
  return <>
    <div className="bar"><div className="bar-in" id="barIn" role="group" aria-label={t('配色方案')} data-scope="bar" data-dim="none" data-cmp="" data-nofocus="" ref={bar}>
      <div className="seg" id="barT"><i className="seg-ind" />{themes.map(theme => <button key={theme.id} data-s={theme.id} aria-label={t(theme.name.zh)} className={scheme === theme.id ? 'on' : undefined} onClick={event => setScheme(theme.id, event)}><i style={{background: theme.swatch}} /><span>{t(theme.name.zh)}</span></button>)}</div>
      <span className="sep" /><div className="seg quiet"><i className="seg-ind" /><button data-l="zh" className={lang === 'zh' ? 'on' : undefined} onClick={() => setLanguage('zh')}>中</button><button data-l="en" className={lang === 'en' ? 'on' : undefined} onClick={() => setLanguage('en')}>EN</button></div>
      {!embed && <><span className="sep" data-dev="" /><div className="seg quiet" data-dev=""><i className="seg-ind" /><button data-dev="web" className={!phone ? 'on' : undefined} onClick={() => setPhone(false)}>Web</button><button data-dev="phone" className={phone ? 'on' : undefined} onClick={() => setPhone(true)}>{t('手机')}</button></div><span className="sep" data-dev="" /><button data-dev="notes" className={notes ? 'on' : undefined} onClick={() => setNotes(!notes)}>{t('标注')}</button></>}
    </div></div>
    <nav className="rail" id="rail" aria-label={t('目录')} data-scope="chrome" data-dim="none" data-cmp="" data-nofocus="">{links(true)}</nav>
    <div className={'pnav' + (open ? ' open' : '')} id="pnav"><div className="pnav-list" id="pnavL">{links(false)}</div><button className="pnav-b" id="pnavB" onClick={() => setOpen(!open)}><i /><span id="pnavT">{t(chrome.nav.find(([id]) => id === active)?.[1] || '目录')}</span></button></div>
    <div className="device" id="device"><nav className="device-nav" id="devNav" aria-label={t('目录')}><div className="xs mute">390 × 844</div>{chrome.nav.map(([id, name]) => <a key={id} data-go={id} onClick={() => frame.current?.contentWindow?.postMessage({go: id}, location.origin)}>{t(name)}</a>)}</nav><div className="device-shell" id="devShell" ref={shell}>{phone && <iframe id="devFrame" ref={frame} title="Phone view" src={`./index.html#embed=1&scheme=${scheme}&lang=${lang}`} />}</div></div>
  </>;
}
