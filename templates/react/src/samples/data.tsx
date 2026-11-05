import {Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {CSSProperties, KeyboardEvent, PointerEvent} from 'react';
import {flushSync} from 'react-dom';
import {UX} from '@core/behavior/ux.js';
import tableData from '@core/content/table.json';
import galleryData from '@core/content/gallery.json';
import web from '@core/dist/gallery.json';
import {Segmented, useLanguage, toast, openModal, closeModal} from '../ui';

const T = tableData;
const G = galleryData;
type MediaRecord = typeof T.records[number] & {note?: string};
type ColumnKey = keyof Pick<MediaRecord, 'name' | 'type' | 'owner' | 'status' | 'len' | 'size' | 'date'>;
type Column = {k: ColumnKey; l: string; w: number; lock?: number; num?: number};
const columns = T.columns as Column[];
const style = (value: object) => value as CSSProperties;
const pixels = (value: number) => `${value}${T.cssUnit}`;
const picture = (art: number) => ({background: `var(--w${art})${T.backgroundSuffix}`});
const minutes = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const fileSize = (size: number) => size >= 1000 ? `${(size / 1000).toFixed(1)} GB` : `${size} MB`;

function RecordPreview({record}: {record: MediaRecord}) {
  const {t} = useLanguage();
  const values = [['负责人', record.owner], ['类型', t(record.type)], ['状态', t(record.status)], ['时长', minutes(record.len)], ['大小', fileSize(record.size)], ['更新', record.date], ['备注', record.note || '—']];
  return <div className="card" style={style(T.styles.previewCard)}>
    <div className="pic" style={{...picture(record.art), ...T.styles.previewPicture}} />
    <div className="between" style={style(T.styles.previewBar)}><b data-noi18n="" style={style(T.styles.previewTitle)}>{record.name}</b><button className="btn ghost sm" data-record-close="" aria-label={t('关闭')} onClick={closeModal}>✕</button></div>
    <div className="dt-kv">{values.map(([label, value]) => <Fragment key={label}><span>{t(label)}</span><b {...(label === '备注' ? {'data-noi18n': ''} : {})}>{value}</b></Fragment>)}</div>
  </div>;
}

function Rename({record, finish}: {record: MediaRecord; finish: (value: string | null) => void}) {
  const {t} = useLanguage();
  const input = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  useLayoutEffect(() => {input.current?.focus(); input.current?.select();}, []);
  const end = (save: boolean) => {
    if (done.current) return;
    done.current = true;
    finish(save ? input.current?.value.trim() || null : null);
  };
  return <input ref={input} defaultValue={record.name} aria-label={t('名称')} onClick={event => event.stopPropagation()} onBlur={() => end(true)} onKeyDown={event => {
    if (event.key === 'Enter') end(true);
    if (event.key === 'Escape') {event.stopPropagation(); end(false);}
  }} />;
}

function RecordDetail({record, hidden, expanded, update}: {record: MediaRecord; hidden: Set<string>; expanded: boolean; update: (id: number, change: Partial<MediaRecord>) => void}) {
  const {t} = useLanguage();
  const [copyError, setCopyError] = useState(false);
  const [copying, setCopying] = useState(false);
  const alive = useRef(true);
  useEffect(() => {alive.current = true; return () => {alive.current = false;};}, []);
  const copyName = async () => {
    setCopyError(false); setCopying(true);
    try {await navigator.clipboard.writeText(record.name); toast(t('已复制名称'));}
    catch {if (alive.current) setCopyError(true);}
    finally {if (alive.current) setCopying(false);}
  };
  return <tr className={`dt-more${expanded ? ' open' : ''}`}><td colSpan={columns.length - hidden.size + 2}><div className="dt-more-w"><div><div className="dt-more-in">
    <div className="pic" style={picture(record.art)} />
    <div className="dt-kv"><span>{t('负责人')}</span><b>{record.owner}</b><span>{t('类型')}</span><b>{t(record.type)}</b><span>{t('时长')}</span><b>{minutes(record.len)}</b><span>{t('大小')}</span><b>{fileSize(record.size)}</b></div>
    <div><div className="xs mute" style={style(T.styles.noteLabel)}>{t('备注')}</div><input className="input" data-note-id={record.id} value={record.note || ''} placeholder={t('给这条记录写点什么')} onChange={event => update(record.id, {note: event.target.value})} />
      <div className="row" style={style(T.styles.noteActions)}><button className="btn sm" data-record-action="open" data-record-id={record.id} onClick={() => openModal(<RecordPreview record={record} />)}>{t('打开')}</button><button className="btn ghost sm" data-record-action="copy" data-record-id={record.id} disabled={copying} onClick={copyName}>{t('复制名称')}</button></div>
      <span className="dt-copy-error xs mute" role="status" aria-live="polite">{copyError ? t('复制失败，请手动复制名称') : ''}</span>
    </div>
  </div></div></div></td></tr>;
}

export function Table() {
  const {lang, t} = useLanguage();
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLTableSectionElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const appeared = useRef(new Set<number>());
  const resizeCleanup = useRef<(() => void) | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urls = useRef(new Set<string>());
  const [records, setRecords] = useState<MediaRecord[]>(() => T.records.map(record => ({...record})));
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('全部');
  const [sort, setSort] = useState<{k: ColumnKey; dir: number} | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set<number>());
  const [anchor, setAnchor] = useState<number | null>(null);
  const [hidden, setHidden] = useState(new Set<string>());
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [dense, setDense] = useState(false);
  const [detail, setDetail] = useState<{id: number; expanded: boolean} | null>(null);
  const [renaming, setRenaming] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const filtered = useMemo(() => {
    const search = query.toLowerCase();
    const list = records.filter(record => (status === '全部' || record.status === status) && (!search || [record.name, record.owner, t(record.type), record.type, t(record.status), record.status].some(value => value.toLowerCase().includes(search))));
    if (sort) list.sort((a, b) => {
      const x = a[sort.k], y = b[sort.k];
      return (typeof x === 'number' && typeof y === 'number' ? x - y : t(String(x)).localeCompare(t(String(y)), lang === 'en' ? 'en' : 'zh-CN', {numeric: true})) * sort.dir;
    });
    return list;
  }, [records, query, status, sort, lang, t]);
  const pages = Math.max(1, Math.ceil(filtered.length / T.pageSize));
  const currentPage = Math.min(page, pages - 1);
  const shown = filtered.slice(currentPage * T.pageSize, currentPage * T.pageSize + T.pageSize);
  const allSelected = shown.filter(record => selected.has(record.id)).length;
  const update = (id: number, change: Partial<MediaRecord>) => setRecords(list => list.map(record => record.id === id ? {...record, ...change} : record));
  const redraw = (action: () => void) => {
    if (body.current) UX.flip(body.current, '.dt-r', () => flushSync(action));
    else action();
  };
  const closeDetail = useCallback((now = false) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (now) {setDetail(null); return;}
    setDetail(value => value ? {...value, expanded: false} : null);
    closeTimer.current = setTimeout(() => {setDetail(null); closeTimer.current = null;}, T.detailCloseDelay);
  }, []);
  const openRecord = (record: MediaRecord) => {
    if (detail?.id === record.id && detail.expanded) {closeDetail(); return;}
    if (closeTimer.current) {clearTimeout(closeTimer.current); closeTimer.current = null;}
    // A same-id row is already mounted while it closes: reverse that collapse.
    // New rows still enter collapsed and open through the layout effect below.
    setDetail({id: record.id, expanded: detail?.id === record.id});
  };
  useLayoutEffect(() => {
    if (detail && !detail.expanded) {
      body.current?.querySelector('.dt-more')?.getBoundingClientRect();
      setDetail(value => value ? {...value, expanded: true} : null);
    }
  }, [detail?.id]);
  useEffect(() => {
    if (detail && !shown.some(record => record.id === detail.id)) closeDetail(true);
  }, [detail?.id, filtered, currentPage, closeDetail]);
  const closeMenu = useCallback((restore = false) => {
    setMenuOpen(was => {if (was && restore) menuButton.current?.focus(); return false;});
  }, []);
  const openMenu = (focus = false, last = false) => {
    document.dispatchEvent(new CustomEvent('ui:menu-open', {detail: {owner: 'dt-columns'}}));
    setMenuOpen(true);
    if (focus) requestAnimationFrame(() => {
      const items = menu.current?.querySelectorAll<HTMLButtonElement>('button');
      if (items?.length) items[last ? items.length - 1 : 0].focus();
    });
  };
  useEffect(() => {
    const element = root.current;
    const blur = () => {closeDetail(); closeMenu();};
    const rest = () => closeMenu();
    const outside = (event: MouseEvent) => {if (!menu.current?.contains(event.target as Node) && !menuButton.current?.contains(event.target as Node)) closeMenu();};
    const otherMenu = (event: Event) => {if ((event as CustomEvent).detail?.owner !== 'dt-columns') closeMenu();};
    const escape = (event: globalThis.KeyboardEvent) => {if (event.key === 'Escape') closeMenu(!!menu.current?.contains(document.activeElement));};
    element?.addEventListener('ux:blur', blur); element?.addEventListener('ux:rest', rest);
    document.addEventListener('click', outside, true); document.addEventListener('ui:menu-open', otherMenu); document.addEventListener('keydown', escape);
    return () => {
      element?.removeEventListener('ux:blur', blur); element?.removeEventListener('ux:rest', rest);
      document.removeEventListener('click', outside, true); document.removeEventListener('ui:menu-open', otherMenu); document.removeEventListener('keydown', escape);
      resizeCleanup.current?.(); if (closeTimer.current) clearTimeout(closeTimer.current);
      urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear();
    };
  }, [closeDetail, closeMenu]);
  useLayoutEffect(() => {
    const scroller = viewport.current;
    if (!scroller) return;
    const sync = () => {
      scroller.style.setProperty('--dt-view-w', pixels(scroller.clientWidth));
      scroller.style.setProperty('--fade-left', scroller.scrollLeft > T.scrollTolerance ? T.fadeSize : T.fadeZero);
      scroller.style.setProperty('--fade-right', scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft > T.scrollTolerance ? T.fadeSize : T.fadeZero);
    };
    sync(); const observer = new ResizeObserver(sync); observer.observe(scroller);
    scroller.addEventListener('scroll', sync, {passive: true});
    return () => {observer.disconnect(); scroller.removeEventListener('scroll', sync);};
  }, [hidden, widths, lang, dense, records]);
  const choosePage = (value: number) => redraw(() => {setPage(value); if (viewport.current) viewport.current.scrollTop = 0;});
  const toggleSelection = (id: number, range: boolean) => redraw(() => {
    const next = new Set(selected), on = !next.has(id);
    if (range && anchor !== null) {
      const ids = filtered.map(record => record.id), a = ids.indexOf(anchor), b = ids.indexOf(id);
      if (a >= 0 && b >= 0) ids.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(value => on ? next.add(value) : next.delete(value));
    } else if (on) next.add(id); else next.delete(id);
    setSelected(next); setAnchor(id);
  });
  const selectPage = () => redraw(() => {
    const next = new Set(selected), on = shown.every(record => next.has(record.id));
    shown.forEach(record => on ? next.delete(record.id) : next.add(record.id)); setSelected(next);
  });
  const approve = (record: MediaRecord) => redraw(() => {update(record.id, {status: '已通过'}); toast(`${t('已通过')} · ${record.name}`);});
  const bulkApprove = () => redraw(() => {
    setRecords(list => list.map(record => selected.has(record.id) ? {...record, status: '已通过'} : record));
    toast(`${t('已通过')} · ${selected.size}`); setSelected(new Set());
  });
  const archive = () => redraw(() => {
    setRecords(list => list.filter(record => !selected.has(record.id))); toast(`${t('已归档')} · ${selected.size}`); setSelected(new Set()); closeDetail(true);
  });
  const resizeColumn = (event: PointerEvent<HTMLSpanElement>, column: Column) => {
    event.preventDefault(); event.stopPropagation(); resizeCleanup.current?.();
    const grip = event.currentTarget, col = root.current?.querySelector<HTMLTableColElement>(`col[data-c="${column.k}"]`);
    const x = event.clientX, width = col?.offsetWidth || grip.parentElement!.offsetWidth;
    grip.classList.add('on'); grip.setPointerCapture(event.pointerId);
    const move = (next: globalThis.PointerEvent) => setWidths(value => ({...value, [column.k]: Math.max(T.minColumnWidth, width + next.clientX - x)}));
    const end = () => {grip.classList.remove('on'); grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', end); grip.removeEventListener('pointercancel', end); resizeCleanup.current = null;};
    grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end); resizeCleanup.current = end;
  };
  const exportCSV = () => {
    const cell = (value: string | number) => {let text = String(value); if (/^\s*[=+@-]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"';};
    const csv = '\ufeff' + [columns.map(column => cell(t(column.l))).join(','), ...filtered.map(record => columns.map(column => cell(column.k === 'len' ? minutes(record.len) : column.k === 'size' ? fileSize(record.size) : column.k === 'type' || column.k === 'status' ? t(String(record[column.k])) : String(record[column.k]))).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'})); urls.current.add(url);
    const link = document.createElement('a'); link.href = url; link.download = 'media-library.csv'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => {URL.revokeObjectURL(url); urls.current.delete(url);}, T.urlRevokeDelay);
  };
  const menuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button') || []), at = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    if (event.key === 'ArrowDown') next = (at + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (at + items.length - 1) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'Tab') {closeMenu(); return;}
    else if (event.key === 'Escape') {event.preventDefault(); event.stopPropagation(); closeMenu(true); return;}
    else return;
    event.preventDefault(); items[next]?.focus();
  };
  const renderCell = (column: Column, record: MediaRecord) => {
    switch (column.k) {
      case 'name': return <span className="dt-nm"><i className="pic" style={picture(record.art)} />{renaming === record.id ? <Rename record={record} finish={value => {if (value) update(record.id, {name: value}); setRenaming(null);}} /> : <span>{record.name}</span>}</span>;
      case 'type': return <span className="tag">{t(record.type)}</span>;
      case 'owner': return <span className="dt-ow"><span className="avatar">{record.owner[0]}</span>{record.owner}</span>;
      case 'status': return <span className="dt-st"><i className="dotc" style={{background: T.statusColors[record.status as keyof typeof T.statusColors]}} />{t(record.status)}</span>;
      case 'len': return minutes(record.len);
      case 'size': return fileSize(record.size);
      case 'date': return record.date;
    }
  };
  return <section className="wrap sec" id="table">
    <div className="sec-h"><div><div className="k">{T.text.t0}</div><h2>{t(T.text.t1)}</h2></div><p>{t(T.text.t2)}</p></div>
    <div className={`dt card${dense ? ' dense' : ''}`} id="dt" ref={root} data-scope="dt" data-dim="none" data-cmp="" data-hold="">
      <div className="dt-bar">
        <b>{t(T.text.t3)}</b>
        <Segmented id="dtSt" role="group" aria-label={t(T.text.t14)}>{['全部', ...T.statuses].map(value => <button key={value} data-s={value} className={value === status ? 'on' : undefined} onClick={() => redraw(() => {setStatus(value); setPage(0);})}>{`${t(value)} `}<small className="xs" style={style(T.styles.statusCount)}>{value === '全部' ? records.length : records.filter(record => record.status === value).length}</small></button>)}</Segmented>
        <span style={style(T.styles.flex)} />
        <span className="sq-w"><input className="input sq" id="dtQ" value={query} placeholder={t(T.text.t15)} aria-label={t(T.text.t15)} onChange={event => redraw(() => {setQuery(event.target.value); setPage(0);})} /></span>
        <Segmented className="seg quiet" id="dtD" role="group" aria-label={t(T.text.t16)}><button className={!dense ? 'on' : undefined} onClick={() => setDense(false)}>{t(T.text.t4)}</button><button className={dense ? 'on' : undefined} onClick={() => setDense(true)}>{t(T.text.t5)}</button></Segmented>
        <div className="menu-host"><button className="btn sec2 sm" id="dtCB" ref={menuButton} aria-haspopup="menu" aria-controls="dtC" aria-expanded={menuOpen} onClick={event => menuOpen ? closeMenu() : openMenu(event.detail === 0)} onKeyDown={event => {if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {event.preventDefault(); openMenu(true, event.key === 'ArrowUp');}}}>{t(T.text.t6)}</button>
          <div className={`menu pop${menuOpen ? ' show' : ''}`} id="dtC" ref={menu} role="menu" aria-labelledby="dtCB" onKeyDown={menuKey}>{columns.filter(column => !column.lock).map(column => <button key={column.k} type="button" role="menuitemcheckbox" aria-checked={!hidden.has(column.k)} tabIndex={-1} data-k={column.k} className={`dt-menu-item${hidden.has(column.k) ? '' : ' on'}`} onClick={() => redraw(() => {setHidden(value => {const next = new Set(value); if (next.has(column.k)) next.delete(column.k); else next.add(column.k); return next;}); closeDetail(true);})}>{t(column.l)}<span aria-hidden="true">{hidden.has(column.k) ? '' : '✓'}</span></button>)}</div>
        </div>
        <button className="btn sec2 sm" id="dtExport" onClick={exportCSV}>{t(T.text.t7)}</button>
      </div>
      <div className="dt-sc fade-xy" id="dtS" ref={viewport}><table className="dt-t"><colgroup id="dtCols"><col style={style(T.styles.selectionColumn)} />{columns.map(column => <col key={column.k} data-c={column.k} style={hidden.has(column.k) ? T.styles.hiddenColumn : widths[column.k] || column.w ? {width: pixels(widths[column.k] || column.w)} : undefined} />)}<col className="act" /></colgroup>
        <thead><tr id="dtH"><th><button className="check" id="dtAll" role="checkbox" aria-label={t('全选本页')} aria-checked={!allSelected ? false : allSelected === shown.length ? true : 'mixed'} onClick={selectPage} /></th>{columns.map(column => <th key={column.k} data-c={column.k} className={column.num ? 'num' : ''} hidden={hidden.has(column.k)} aria-sort={sort?.k === column.k ? sort.dir > 0 ? 'ascending' : 'descending' : undefined}><button className="dt-h" data-k={column.k} onClick={() => redraw(() => {setSort(value => !value || value.k !== column.k ? {k: column.k, dir: 1} : value.dir > 0 ? {k: column.k, dir: -1} : null); setPage(0);})}>{t(column.l)}<i className="dt-ar" /></button>{!column.lock && <span className="dt-rz" data-k={column.k} onPointerDown={event => resizeColumn(event, column)} />}</th>)}<th className="dt-act" /></tr></thead>
        <tbody id="dtB" ref={body}>{shown.length ? shown.map(record => <Fragment key={record.id}>
          <tr className={`dt-r${appeared.current.has(record.id) ? '' : ' in'}${selected.has(record.id) ? ' sel' : ''}${detail?.id === record.id && detail.expanded ? ' open' : ''}`} data-id={record.id} tabIndex={0} onAnimationEnd={event => {appeared.current.add(record.id); event.currentTarget.classList.remove('in');}} onKeyDown={event => {if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {event.preventDefault(); openRecord(record);}}} onClick={event => {if ((event.target as HTMLElement).closest('input,button')) return; openRecord(record);}}>
            <td><button className="check" role="checkbox" aria-checked={selected.has(record.id)} aria-label={t(`选择 ${record.name}`)} onClick={event => toggleSelection(record.id, event.shiftKey)} /></td>
            {columns.map(column => <td key={column.k} data-c={column.k} className={column.num ? 'num' : ''} hidden={hidden.has(column.k)}>{renderCell(column, record)}</td>)}
            <td className="dt-act"><span className="rtool"><button className="btn ghost sm" data-a="rename" onClick={() => setRenaming(record.id)}>{t('重命名')}</button><button className="btn ghost sm" data-a="pass" onClick={() => approve(record)}>{t('审核通过')}</button></span></td>
          </tr>
          {detail?.id === record.id && <RecordDetail record={record} hidden={hidden} expanded={detail.expanded} update={update} />}
        </Fragment>) : <tr className="dt-none"><td colSpan={columns.length + 2}>{t('没有匹配的记录')}</td></tr>}</tbody>
      </table></div>
      <div className={`dt-foot${selected.size ? ' sel' : ''}`}>
        <div className="dt-pg" id="dtPg"><span className="xs mute" id="dtN">{filtered.length ? `${currentPage * T.pageSize + 1}–${currentPage * T.pageSize + shown.length} / ${filtered.length}` : '0 / 0'}</span><span style={style(T.styles.flex)} /><button className="btn ghost sm" id="dtPrev" aria-label={t(T.text.t17)} disabled={currentPage === 0} onClick={() => choosePage(currentPage - 1)}>{T.text.t8}</button><Segmented className="seg quiet" id="dtP" role="group" aria-label={t(T.text.t18)}>{Array.from({length: pages}, (_, index) => <button key={index} data-p={index} className={index === currentPage ? 'on' : undefined} onClick={() => choosePage(index)}>{index + 1}</button>)}</Segmented><button className="btn ghost sm" id="dtNext" aria-label={t(T.text.t19)} disabled={currentPage >= pages - 1} onClick={() => choosePage(currentPage + 1)}>{T.text.t9}</button></div>
        <div className="dt-bulk" id="dtBk"><span className="xs b" id="dtBn">{t(`已选 ${selected.size} 个`)}</span><button className="btn ghost sm" id="dtBc" onClick={() => redraw(() => setSelected(new Set()))}>{t(T.text.t10)}</button><span style={style(T.styles.flex)} /><button className="btn sec2 sm" id="dtBo" onClick={bulkApprove}>{t(T.text.t11)}</button><button className="btn sec2 sm" id="dtBa" onClick={archive}>{t(T.text.t12)}</button></div>
      </div>
    </div>
    <p className="note">{t(T.text.t13)}</p>
  </section>;
}

type GalleryItem = {i: number; t: string; c: string; r: number; o: number};
const images: GalleryItem[] = web.map((item, index) => ({i: index, t: item.t, c: item.c, r: item.r, o: web.slice(0, index).filter(previous => previous.c === item.c).length * G.categories.length + G.categories.indexOf(item.c)})).sort((a, b) => a.o - b.o);
function GalleryLightbox({items, initial, from}: {items: GalleryItem[]; initial: number; from: DOMRect | null}) {
  const {t} = useLanguage();
  const [index, setIndex] = useState(initial);
  const artwork = useRef<HTMLDivElement>(null);
  const item = items[index];
  const step = (direction: number) => setIndex(value => (value + direction + items.length) % items.length);
  const maxWidth = Math.min(G.lightboxMaxWidth, window.innerWidth - G.lightboxGutter), maxHeight = window.innerHeight * G.lightboxHeightRatio;
  const width = Math.min(maxWidth, maxHeight / item.r);
  useLayoutEffect(() => {
    if (!from || !artwork.current) return;
    const rect = artwork.current.getBoundingClientRect();
    const animation = artwork.current.animate([{transformOrigin: G.transformOrigin, transform: `translate(${pixels(from.left - rect.left)},${pixels(from.top - rect.top)}) scale(${from.width / rect.width},${from.height / rect.height})`}, {transformOrigin: G.transformOrigin, transform: 'none'}], G.animation);
    return () => animation.cancel();
  }, []);
  useEffect(() => {
    const key = (event: globalThis.KeyboardEvent) => {if (event.key === 'ArrowRight') step(1); if (event.key === 'ArrowLeft') step(-1);};
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [items.length]);
  return <div className="mg-lb"><div className="mg-art pic" ref={artwork} style={{...picture(item.i), width: pixels(Math.round(width)), height: pixels(Math.round(width * item.r))}} />
    <div className="mg-lbar"><b>{t(item.t)}</b><span className="xs mute"><span>{t(item.c)}</span> · {index + 1} / {items.length}</span><span style={style(G.styles.flex)} /><button className="btn ghost sm" data-m="p" aria-label={t('上一张')} onClick={() => step(-1)}>{T.text.t8}</button><button className="btn ghost sm" data-m="n" aria-label={t('下一张')} onClick={() => step(1)}>{T.text.t9}</button><button className="btn ghost sm" data-m="x" aria-label={t('关闭')} onClick={closeModal}>✕</button></div>
  </div>;
}

export function Gallery() {
  const {t} = useLanguage();
  const masonry = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [count, setCount] = useState(G.first);
  const [filter, setFilter] = useState('全部');
  const [target, setTarget] = useState(G.defaultTarget);
  const [width, setWidth] = useState(0);
  const [still, setStill] = useState(true);
  const [loading, setLoading] = useState(new Set<number>());
  const [favorites, setFavorites] = useState(new Set<number>());
  const previous = useRef(new Map<number, CSSProperties>());
  const tiles = images.slice(0, count);
  const layout = useMemo(() => {
    if (!width) return {positions: previous.current, height: 0};
    const number = Math.max(G.columnMin, Math.floor((width + G.gap) / (target + G.gap))), tileWidth = (width - G.gap * (number - 1)) / number, heights = Array<number>(number).fill(0);
    const positions = new Map(previous.current);
    tiles.forEach(item => {
      if (filter !== '全部' && item.c !== filter) return;
      let column = 0; heights.forEach((height, index) => {if (height < heights[column] - G.heightTolerance) column = index;});
      const height = Math.round(tileWidth * item.r);
      positions.set(item.i, {left: pixels(column * (tileWidth + G.gap)), top: pixels(heights[column]), width: pixels(tileWidth), height: pixels(height)});
      heights[column] += height + G.gap;
    });
    previous.current = positions;
    return {positions, height: Math.max(0, Math.max(...heights) - G.gap)};
  }, [count, filter, target, width]);
  useLayoutEffect(() => {
    const element = masonry.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure(); const observer = new ResizeObserver(measure); observer.observe(element);
    let next = 0;
    const frame = requestAnimationFrame(() => {next = requestAnimationFrame(() => setStill(false));});
    return () => {observer.disconnect(); cancelAnimationFrame(frame); cancelAnimationFrame(next);};
  }, []);
  const loadMore = useCallback(() => {
    if (busy.current || count >= images.length || filter !== '全部') return;
    busy.current = true;
    const end = Math.min(count + G.step, images.length), added = images.slice(count, end).map(item => item.i);
    setLoading(value => new Set([...value, ...added])); setCount(end);
    added.forEach((id, index) => {
      const timer = setTimeout(() => {setLoading(value => {const next = new Set(value); next.delete(id); return next;}); timers.current.delete(timer);}, G.loadBaseDelay + ((count + index) % G.step) * G.loadStaggerDelay);
      timers.current.add(timer);
    });
  }, [count, filter]);
  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {if (entries[0]?.isIntersecting) loadMore();}, {rootMargin: G.rootMargin});
    observer.observe(element);
    const frame = requestAnimationFrame(() => {
      busy.current = false;
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight + G.preloadDistance && rect.bottom > -G.preloadDistance) loadMore();
    });
    return () => {observer.disconnect(); cancelAnimationFrame(frame);};
  }, [loadMore]);
  useEffect(() => () => {timers.current.forEach(timer => clearTimeout(timer)); timers.current.clear();}, []);
  const changeFilter = (value: string) => {setFilter(value); if (value !== '全部') setCount(images.length);};
  const show = (item: GalleryItem, tile: HTMLElement) => {
    const visible = tiles.filter(value => filter === '全部' || value.c === filter);
    openModal(<GalleryLightbox key={item.i} items={visible} initial={visible.findIndex(value => value.i === item.i)} from={tile.getBoundingClientRect()} />);
  };
  const toggleFavorite = (id: number) => setFavorites(value => {const next = new Set(value); if (next.has(id)) next.delete(id); else next.add(id); return next;});
  return <section className="wrap sec" id="gallery">
    <div className="sec-h"><div><div className="k">{G.text.t0}</div><h2>{t(G.text.t1)}</h2></div><p>{t(G.text.t2)}</p></div>
    <div className="mg-bar"><Segmented id="mgF" role="group" aria-label={t(G.text.t6)}>{['全部', ...G.categories].map(value => <button key={value} data-c={value} className={filter === value ? 'on' : undefined} onClick={() => changeFilter(value)}>{t(value)}</button>)}</Segmented><span style={style(G.styles.flex)} /><Segmented className="seg quiet" id="mgZ" role="group" aria-label={t(G.text.t7)}>{G.sizes.map(size => <button key={size.width} data-w={size.width} className={target === size.width ? 'on' : undefined} onClick={() => setTarget(size.width)}>{t(size.label)}</button>)}</Segmented></div>
    <div className={`mg${still ? ' still' : ''}`} id="mg" ref={masonry} data-scope="mg" style={{height: pixels(layout.height)}}>{tiles.map(item => <figure key={item.i} className={`mg-i pic${loading.has(item.i) ? ' load' : ''}${filter !== '全部' && item.c !== filter ? ' off' : ''}`} style={{...picture(item.i), ...layout.positions.get(item.i)}} data-i={item.i} data-cmp="" data-live="" data-nofocus="" data-state="rest">
      <button type="button" className="mg-open" aria-label={t(item.t)} onClick={event => show(item, event.currentTarget.closest('figure')!)} /><button type="button" className="mg-like" data-tool="" aria-pressed={favorites.has(item.i)} aria-label={t('收藏')} onClick={() => toggleFavorite(item.i)}>{favorites.has(item.i) ? '♥' : '♡'}</button><figcaption className="mg-cap" data-tool="">{t(item.t)}<small>{t(item.c)}</small></figcaption>
    </figure>)}</div>
    <div className="mg-s xs faint" id="mgS" ref={sentinel}>{count >= images.length ? t(`已经到底了 · ${images.filter(item => filter === '全部' || item.c === filter).length} 张`) : ''}</div>
  </section>;
}
