import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent} from 'react';
import content from '@core/content/daily.json';
import calendar from '@core/content/work.json';
import {dailyVisibleMessages, dailyReadMessage, dailyBackupStep, dailyBooking} from '@core/behavior/daily.js';
import {useLanguage, useIndicators, Scope, Component, Tool, UX, toast} from '../ui';

type Message = [string, string, number];
type ChatMessage = {id: number; text: string; me: boolean};
type Note = {id: number; text: string};
export function Daily() {
 const c = content, {lang, t} = useLanguage(), rootRef = useRef<HTMLElement>(null), calendarRef = useRef<HTMLDivElement>(null), mapRef = useRef<HTMLDivElement>(null), inputRef = useRef<HTMLInputElement>(null), noteRefs = useRef(new Map<number, HTMLDivElement>());
 const [day, setDay] = useState(c.initial.calendarDay), [chat, setChat] = useState<ChatMessage[]>([{id: 0, text: c.text.t8, me: false}, {id: 1, text: c.text.t9, me: true}]), [reply, setReply] = useState('');
 const chatId = useRef(chat.length), chatTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
 const [messages, setMessages] = useState<Message[]>(() => c.messages.map(message => [...message] as Message)), [onlyUnread, setOnlyUnread] = useState(false);
 const [slot, setSlot] = useState<string | null>(null), [confirmed, setConfirmed] = useState(false), bookedTitle = useRef<string | null>(null);
 const [pinned, setPinned] = useState(c.initial.selectedPin), [previewPin, setPreviewPin] = useState(c.initial.selectedPin), pinnedRef = useRef(pinned); pinnedRef.current = pinned;
 const [notes, setNotes] = useState<Note[]>(() => c.notes.map((text, id) => ({text, id})).reverse()), noteId = useRef(notes.length), focusNote = useRef<number | null>(null);
 const [settings, setSettings] = useState(c.initial.settings), savedSettings = useRef(c.initial.settings), [dirty, setDirty] = useState(false);
 const [backup, setBackup] = useState({progress: c.backup.initial, width: c.backup.initial, count: 0, complete: false}), backupRef = useRef(backup); backupRef.current = backup;
 const backupTimer = useRef<ReturnType<typeof setInterval> | null>(null), [backupLabel, setBackupLabel] = useState(c.text.t23), tRef = useRef(t); tRef.current = t;
 useIndicators(calendarRef, [day, lang]);
 useEffect(() => {
  const cleanups = [...mapRef.current!.querySelectorAll('button')].map((button, index) => UX.intent(button, () => setPreviewPin(index), () => setPreviewPin(pinnedRef.current)));
  return () => cleanups.forEach(cleanup => cleanup?.());
 }, []);
 useEffect(() => () => {chatTimers.current.forEach(timer => clearTimeout(timer)); if (backupTimer.current !== null) clearInterval(backupTimer.current);}, []);
 // Contenteditable owns its native caret. State/language changes write text only
 // when it differs, rather than rewriting the text node after each input.
 useLayoutEffect(() => {
  notes.forEach(note => {const node = noteRefs.current.get(note.id), text = t(note.text); if (node && node.textContent !== text) node.textContent = text;});
  if (focusNote.current !== null) {noteRefs.current.get(focusNote.current)?.focus(); focusNote.current = null;}
 }, [notes, t]);
 const send = (event: FormEvent) => {
  event.preventDefault(); const text = reply.trim(); if (!text) return;
  setChat(rows => [...rows, {id: chatId.current++, text, me: true}]); setReply('');
  const timer = setTimeout(() => {chatTimers.current.delete(timer); setChat(rows => [...rows, {id: chatId.current++, text: c.labels.chatReply, me: false}]);}, c.timing.chatReply); chatTimers.current.add(timer);
 };
 const book = () => {
  if (slot === null) return;
  const booking = dailyBooking({}, null, slot, c.booking), previousBooking = bookedTitle.current;
  document.dispatchEvent(new CustomEvent('sample:daily-booked', {detail: {day: booking.day, booking: booking.booked, previousBooking, slot}}));
  bookedTitle.current = booking.booked; setConfirmed(true); toast(t(c.labels.booked) + ' · ' + booking.booked);
 };
 const toggleBackup = () => {
  if (backupRef.current.complete) return;
  if (backupTimer.current !== null) {clearInterval(backupTimer.current); backupTimer.current = null; setBackupLabel(c.labels.backupResume); return;}
  setBackupLabel(c.labels.backupPause);
  backupTimer.current = setInterval(() => {
   const next = dailyBackupStep(backupRef.current.progress, c.backup); backupRef.current = next; setBackup(next);
   if (next.complete) {clearInterval(backupTimer.current!); backupTimer.current = null; setBackupLabel(c.labels.backupDone); toast(tRef.current(c.labels.backupComplete));}
  }, c.timing.backupTick);
 };
 const changeSetting = (index: number) => {setSettings(value => ({...value, switches: value.switches.map((on, key) => key === index ? !on : on)})); setDirty(true);};
 const pin = c.pins[previewPin];
 return (
<section className="wrap sec" id="daily" ref={rootRef}>
 <div className="sec-h"><div><div className="k">{t(c.text.t0)}</div><h2>{t(c.text.t1)}</h2></div><p>{t(c.text.t2)}</p></div>
 <Scope className="daily" name="daily">
  <Component className="card d-cal"><div className="between"><b>{t(c.text.t3)}</b><span className="xs mute">{t(c.text.t4)}</span></div><div className="cal mini" id="cal2" ref={calendarRef}><i className="seg-ind" />{[...calendar.weekdays[lang]].map((label, index) => <span data-noi18n="" data-wk="" key={'weekday' + index}>{label}</span>)}{Array.from({length: calendar.leadingDays}, (_, index) => <i key={'leading' + index} />)}{Array.from({length: calendar.days}, (_, index) => index + 1).map(value => <button key={value} className={(calendar.hasTasks.includes(value) ? 'has' : '') + (value === day ? ' on' : '')} onClick={() => setDay(value)}>{value}</button>)}</div></Component>
  <Component className="card d-chat"><div className="row" style={c.styles.s0 as CSSProperties}><span className="avatar">{t(c.text.t5)}</span><div><div className="b sm">{t(c.text.t6)}</div><div className="xs mute">{t(c.text.t7)}</div></div></div><div className="chatlog" id="chatlog">{chat.map(message => <div className={'cmsg' + (message.me ? ' me' : '')} key={message.id}><span className={message.me ? undefined : 'bub'}>{t(message.text)}</span></div>)}</div><form className="row" id="chatf" style={c.styles.s1 as CSSProperties} onSubmit={send}><input className="input" ref={inputRef} value={reply} onChange={event => setReply(event.target.value)} placeholder={t(c.attrs.a0)} aria-label={t(c.attrs.a1)} /><Tool className="btn ico" aria-label={t(c.attrs.a2)}>{t(c.text.t10)}</Tool></form></Component>
  <Component className="card d-msg"><div className="between"><b>{t(c.text.t11)}</b><button className="switch" role="switch" aria-checked={onlyUnread} aria-label={t(c.attrs.a3)} data-tg="" onClick={() => setOnlyUnread(value => !value)} /></div><div id="msgs">{(dailyVisibleMessages(messages, onlyUnread) as Message[]).map(message => <div className={'msgi ' + (message[2] ? 'un' : '')} key={message[0]}><span className="avatar">{message[0][0]}</span><div><div className="b sm">{t(message[0])}</div><div className="xs mute">{t(message[1])}</div></div>{message[2] ? <i className="dotc" style={c.styles.messageDot as CSSProperties} /> : <span />}<span className="rtool"><button className="btn ghost sm" data-m={message[0]} onClick={() => {if (message[2]) setMessages(rows => dailyReadMessage(rows, message[0]) as Message[]); else {setReply(t(c.labels.reply) + ' ' + message[0] + ': '); inputRef.current?.focus();}}}>{t(message[2] ? c.labels.read : c.labels.reply)}</button></span></div>)}</div></Component>
  <Component className="card d-book"><b>{t(c.text.t12)}</b><div className="xs mute" style={c.styles.s2 as CSSProperties}>{t(c.text.t13)}</div><div className="row" id="slots">{c.slots.map(value => <button className={'slot' + (slot === value ? ' on' : '')} key={value} onClick={() => {setSlot(value); setConfirmed(false);}}>{value}</button>)}</div><button className={'btn need' + (slot === null ? '' : ' show')} id="bookGo" disabled={confirmed} onClick={book}>{t(confirmed ? c.labels.booked : c.labels.confirmBooking)}</button></Component>
  <Component className="d-home card" style={c.styles.s3 as CSSProperties}><div className="pic" style={c.styles.s4 as CSSProperties}><Tool as="span" className="tag on" style={c.styles.s5 as CSSProperties}>{t(c.text.t15)}</Tool></div><div style={c.styles.s6 as CSSProperties}><div className="between"><b>{t(c.text.t16)}</b><b className="num-t">{t(c.text.t17)}</b></div><div className="xs mute">{t(c.text.t18)}</div></div></Component>
  <Component className="card d-map"><div className="map" id="map" ref={mapRef}>{c.pins.map((item, index) => <button className={'pin ' + (index === previewPin ? 'on' : '')} key={item.name} style={item.style as CSSProperties} aria-label={t(item.name)} onClick={() => {setPinned(index); setPreviewPin(index);}}>{index + 1}</button>)}</div><div id="mapList" className="sm"><div className="between" style={c.styles.pinDetail as CSSProperties}><b>{t(pin.name)}</b><span className="xs mute">{t(pin.travel)}</span></div></div></Component>
  <Component className="card d-note"><div className="between"><b>{t(c.text.t19)}</b><Tool className="btn sec2 sm" id="noteAdd" onClick={() => {const id = noteId.current++; focusNote.current = id; setNotes(rows => [{id, text: ''}, ...rows]);}}>{t(c.text.t20)}</Tool></div><div className="notes" id="notes">{notes.map(note => <div contentEditable suppressContentEditableWarning key={note.id} ref={node => {if (node) noteRefs.current.set(note.id, node); else noteRefs.current.delete(note.id);}} onInput={event => {const text = event.currentTarget.textContent || ''; setNotes(rows => rows.map(row => row.id === note.id ? {...row, text} : row));}} />)}</div></Component>
  <Component className="card d-back"><div className="between"><b>{t(c.text.t21)}</b><span className="xs mute" id="bkS">{backup.progress === c.backup.initial ? t(c.text.t22) : c.backup.labelFormat.replace('{count}', String(backup.count))}</span></div><div className="thumbs" id="thumbs">{c.thumbnails.map((style, index) => <div className="pic" style={style as CSSProperties} key={index} />)}</div><div style={c.styles.s7 as CSSProperties}><i id="bkB" style={{...c.styles.s8, width: backup.progress === c.backup.initial ? c.styles.s8.width : backup.width + '%'} as CSSProperties} /></div><button className="btn sm" id="bkGo" onClick={toggleBackup}>{t(backupLabel)}</button></Component>
  <Component className="card d-set" id="setCard"><b>{t(c.text.t24)}</b><label className="sm" style={c.styles.s9 as CSSProperties}><span className="xs mute">{t(c.text.t25)}</span><input className="input" value={settings.name} onChange={event => {setSettings(value => ({...value, name: event.target.value})); setDirty(true);}} style={c.styles.s10 as CSSProperties} /></label><div className="between sm" style={c.styles.s11 as CSSProperties}><span>{t(c.text.t26)}</span><button className="switch" role="switch" aria-checked={settings.switches[0]} data-tg="" aria-label={t(c.attrs.a4)} onClick={() => changeSetting(0)} /></div><div className="between sm" style={c.styles.s12 as CSSProperties}><span>{t(c.text.t27)}</span><button className="switch" role="switch" aria-checked={settings.switches[1]} data-tg="" aria-label={t(c.attrs.a5)} onClick={() => changeSetting(1)} /></div><div className={'row need' + (dirty ? ' show' : '')} id="setBar"><button className="btn sm" id="setSave" onClick={() => {savedSettings.current = settings; setDirty(false); toast(t(c.labels.saved));}}>{t(c.text.t28)}</button><button className="btn ghost sm" id="setDrop" onClick={() => {setSettings(savedSettings.current); setDirty(false);}}>{t(c.text.t29)}</button></div></Component>
 </Scope>
</section>);
}
