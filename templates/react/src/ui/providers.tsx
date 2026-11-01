import {createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {flushSync} from 'react-dom';
import themesData from '@core/tokens/themes.json';
import dictionary from '@core/dist/dictionary.json';
import chrome from '@core/content/chrome.json';
import {LANG, tr, useDictionary} from '@core/i18n/i18n.js';
import {transitionLanguage} from '@core/behavior/ux.js';
import {UX} from './core';

useDictionary(dictionary);
export type Language = 'zh' | 'en';
export type Theme = typeof themesData.themes[number];
type ThemeEvent = {clientX: number; clientY: number};
const read = (key: string) => {try {return new URLSearchParams(location.hash.slice(1)).get(key) || localStorage.getItem(key);} catch {return null;}};
const save = (key: string, value: string) => {try {localStorage.setItem(key, value);} catch { /* Storage can be unavailable in embedded projects. */ }};
type ThemeValue = {scheme: string; themes: Theme[]; pairs: Theme[][]; setScheme: (scheme: string, event?: ThemeEvent) => void; togglePair: () => void};
const ThemeContext = createContext<ThemeValue | null>(null);
export function ThemeProvider({children}: {children: ReactNode}) {
  const [scheme, update] = useState(() => {const saved = read('scheme'); return themesData.themes.some(theme => theme.id === saved) ? saved! : themesData.default;});
  const current = useRef(scheme); current.current = scheme;
  const apply = useCallback((next: string) => {
    if (!themesData.themes.some(theme => theme.id === next)) return;
    document.documentElement.dataset.scheme = next;
    current.current = next; flushSync(() => update(next)); save('scheme', next);
    document.dispatchEvent(new Event('schemechange'));
  }, []);
  const setScheme = useCallback((next: string, event?: ThemeEvent) => {
    if (next === current.current) return;
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion:reduce)').matches || !event) {apply(next); return;}
    const x = event.clientX, y = event.clientY;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = UX.transition(() => apply(next));
    transition.ready.then(() => document.documentElement.animate({clipPath: [chrome.themeTransition.start.replaceAll('{x}', String(x)).replaceAll('{y}', String(y)), `circle(${radius}px at ${x}px ${y}px)`]}, {...chrome.themeTransition, pseudoElement: '::view-transition-new(root)'})).catch(() => {});
  }, [apply]);
  useLayoutEffect(() => {document.documentElement.dataset.scheme = scheme;}, [scheme]);
  useLayoutEffect(() => {window.setScheme = setScheme; window.switchTheme = setScheme; return () => {delete window.setScheme; delete window.switchTheme;};}, [setScheme]);
  const togglePair = () => {const theme = themesData.themes.find(theme => theme.id === current.current)!; setScheme(theme.pair);};
  return <ThemeContext.Provider value={{scheme, themes: themesData.themes, pairs: themesData.themes.filter(theme => theme.mode === 'light').map(theme => [theme, themesData.themes.find(pair => pair.id === theme.pair)!]), setScheme, togglePair}}>{children}</ThemeContext.Provider>;
}
export function useTheme() {const value = useContext(ThemeContext); if (!value) throw new Error('Wrap the page in ThemeProvider.'); return value;}
type LanguageValue = {lang: Language; t: (text: string) => string; setLanguage: (language: Language, now?: boolean) => void};
const LanguageContext = createContext<LanguageValue | null>(null);
export function LanguageProvider({children}: {children: ReactNode}) {
  const [lang, update] = useState<Language>(() => read('lang') === 'en' ? 'en' : 'zh');
  const current = useRef(lang); current.current = lang;
  LANG.cur = lang; document.documentElement.lang = lang;
  const setLanguage = useCallback((next: Language, now = false) => {
    if (next !== 'zh' && next !== 'en') return;
    if (next === current.current && !now) return;
    transitionLanguage(() => {LANG.cur = next; document.documentElement.lang = next; current.current = next; flushSync(() => update(next)); save('lang', next); document.dispatchEvent(new Event('langchange'));}, now);
  }, []);
  useLayoutEffect(() => {window.setLang = setLanguage; return () => {delete window.setLang;};}, [setLanguage]);
  const t = useCallback((text: string) => tr(text), [lang]);
  return <LanguageContext.Provider value={{lang, t, setLanguage}}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {const value = useContext(LanguageContext); if (!value) throw new Error('Wrap the page in LanguageProvider.'); return value;}
export function UIProvider({children}: {children: ReactNode}) {return <ThemeProvider><LanguageProvider>{children}</LanguageProvider></ThemeProvider>;}

declare global {
  interface Window {
    setScheme?: (scheme: string, event?: ThemeEvent) => void;
    switchTheme?: (scheme: string, event?: ThemeEvent) => void;
    setLang?: (language: Language, now?: boolean) => void;
    UX?: typeof UX;
    segScan?: () => void;
  }
}
