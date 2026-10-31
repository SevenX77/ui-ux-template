import {createElement, forwardRef, useLayoutEffect, useRef, type ElementType, type HTMLAttributes, type ReactNode, type RefObject, type DependencyList, type ForwardedRef} from 'react';
import {UX} from './core';

type DeclarationProps = HTMLAttributes<HTMLElement> & {as?: ElementType; children?: ReactNode};
// React can replace className during a state commit. Ask the single core to
// reassert its stored state after that commit; never reconstruct UX state here.
function useDeclarationRef(forwarded: ForwardedRef<HTMLElement>) {
  const local = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (local.current) UX.paint(local.current.closest('[data-scope]') || document.body);
  });
  return (node: HTMLElement | null) => {
    local.current = node;
    if (typeof forwarded === 'function') forwarded(node);
    else if (forwarded) forwarded.current = node;
  };
}
export const Scope = forwardRef<HTMLElement, DeclarationProps & {name: string; dim?: string; lock?: boolean; hold?: boolean}>(function Scope({as = 'div', name, dim, lock, hold, ...props}, ref) {
  const declaredRef = useDeclarationRef(ref);
  return createElement(as, {...props, ref: declaredRef, 'data-scope': name, 'data-dim': dim, 'data-lock': lock ? '' : undefined, 'data-hold': hold ? '' : undefined});
});
export const Component = forwardRef<HTMLElement, DeclarationProps & {live?: boolean; hold?: boolean; nofocus?: boolean; passive?: boolean}>(function Component({as = 'div', live, hold, nofocus, passive, ...props}, ref) {
  const declaredRef = useDeclarationRef(ref);
  return createElement(as, {...props, ref: declaredRef, 'data-cmp': '', 'data-live': live ? '' : undefined, 'data-hold': hold ? '' : undefined, 'data-nofocus': nofocus ? '' : undefined, 'data-passive': passive ? '' : undefined});
});
export function Tool({as = 'button', ...props}: DeclarationProps) {return createElement(as, {...props, 'data-tool': ''});}

// The core watches selected-option classes. The indicator is React-owned; a
// no-op class mutation asks the existing core observer to measure it, not clone it.
export function refreshIndicators(root: ParentNode = document) {
  root.querySelectorAll('.seg>button.on,.notch>button.on,.cal>button.on').forEach(button => button.setAttribute('class', button.getAttribute('class') || ''));
}
export function useIndicators(ref: RefObject<HTMLElement | null>, dependencies: DependencyList = []) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    refreshIndicators(root);
    const observer = new ResizeObserver(() => refreshIndicators(root));
    if (root.matches('.seg,.notch,.cal')) observer.observe(root);
    root.querySelectorAll('.seg,.notch,.cal').forEach(host => observer.observe(host));
    return () => observer.disconnect();
  }, dependencies);
}
type Option = {value: string; label: ReactNode; disabled?: boolean};
export function Segmented({options, value, onChange, children, className = 'seg', ...props}: Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {options?: Option[]; value?: string; onChange?: (value: string) => void}) {
  const ref = useRef<HTMLDivElement>(null);
  useIndicators(ref, [value, options, children]);
  return <div {...props} className={className} ref={ref}><i className="seg-ind" />{options ? options.map(option => <button key={option.value} className={value === option.value ? 'on' : ''} disabled={option.disabled} onClick={() => onChange?.(option.value)}>{option.label}</button>) : children}</div>;
}
export type SortableOrder = {zone: Element; items: Element[]}[];
export type SortableOptions = {item: string; zone?: string; handle?: string; on?: () => void; commit?: (order: SortableOrder) => void};
export function useSortable(ref: RefObject<HTMLElement | null>, options: SortableOptions, dependencies: DependencyList = []) {
  const latest = useRef(options); latest.current = options;
  useLayoutEffect(() => {
    if (!ref.current) return;
    const cleanup = UX.sortable(ref.current, {...options, on: () => latest.current.on?.(), commit: options.commit ? (order: SortableOrder) => latest.current.commit?.(order) : undefined});
    return cleanup;
  }, dependencies);
}
export function useIntent(ref: RefObject<HTMLElement | null>, on: () => void, off?: () => void, dependencies: DependencyList = []) {
  useLayoutEffect(() => ref.current ? UX.intent(ref.current, on, off) : undefined, dependencies);
}
