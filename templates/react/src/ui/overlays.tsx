import {useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode} from 'react';
import chrome from '@core/content/chrome.json';
import {useLanguage} from './providers';

type ModalContent = ReactNode | (() => ReactNode);
let content: ModalContent = null;
let returnFocus: HTMLElement | null = null;
const modalListeners = new Set<() => void>();
const notifyModal = () => modalListeners.forEach(listener => listener());
export function openModal(node: ModalContent) {
  if (!content) returnFocus = document.activeElement as HTMLElement;
  content = node; notifyModal();
}
export function closeModal() {
  if (!content) return;
  content = null; notifyModal();
  const target = returnFocus?.isConnected && !(returnFocus as HTMLButtonElement).disabled ? returnFocus : returnFocus?.closest('[data-cmp]')?.querySelector<HTMLElement>('button:not([disabled]),input') || document.querySelector<HTMLElement>('#barIn button');
  target?.focus(); returnFocus = null;
}
export function ModalHost() {
  const node = useSyncExternalStore(listener => {modalListeners.add(listener); return () => {modalListeners.delete(listener);};}, () => content);
  const ref = useRef<HTMLDivElement>(null);
  const {t} = useLanguage();
  const stops = () => [...(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])') || [])].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  useLayoutEffect(() => {if (node) (stops()[0] || ref.current)?.focus();}, [node]);
  useEffect(() => {
    if (!node) return;
    const key = (e: KeyboardEvent) => {if (!content) return; if (e.key === 'Escape') closeModal(); if (e.key !== 'Tab') return; const all = stops(), first = all[0] || ref.current!, last = all.at(-1) || first; if (e.shiftKey && (document.activeElement === first || !all.includes(document.activeElement as HTMLElement))) {e.preventDefault(); last.focus();} else if (!e.shiftKey && (document.activeElement === last || !all.includes(document.activeElement as HTMLElement))) {e.preventDefault(); first.focus();}};
    const focus = (e: FocusEvent) => {if (content && !ref.current?.contains(e.target as Node)) (stops()[0] || ref.current)?.focus();};
    document.addEventListener('keydown', key); document.addEventListener('focusin', focus);
    return () => {document.removeEventListener('keydown', key); document.removeEventListener('focusin', focus);};
  }, [node]);
  return <div className={'scrim' + (node ? ' show' : '')} id="scrim" onMouseDown={e => {if (e.target === e.currentTarget) closeModal();}}><div id="scrimIn" ref={ref} role={node ? 'dialog' : undefined} aria-modal={node ? true : undefined} aria-label={node ? t('预览') : undefined} tabIndex={node ? -1 : undefined}>{typeof node === 'function' ? node() : node}</div></div>;
}
type Toast = {id: number; text: string; out: boolean};
let nextToast = 0;
const toastListeners = new Set<(text: string) => void>();
export function toast(text: string) {toastListeners.forEach(listener => listener(text));}
export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  const {t} = useLanguage();
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const receive = (text: string) => {const id = nextToast++; setItems(items => [...items, {id, text, out: false}]); timers.add(setTimeout(() => {setItems(items => items.map(item => item.id === id ? {...item, out: true} : item)); timers.add(setTimeout(() => setItems(items => items.filter(item => item.id !== id)), chrome.toast.exitDuration));}, chrome.toast.duration));};
    toastListeners.add(receive); return () => {toastListeners.delete(receive); timers.forEach(clearTimeout);};
  }, []);
  return <div className="toast-host" id="toasts">{items.map(item => <div key={item.id} className={'toast' + (item.out ? ' out' : '')}>{t(item.text)}</div>)}</div>;
}
