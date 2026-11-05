import {createRoot} from 'react-dom/client';
import {useLayoutEffect} from 'react';
import chrome from '@core/content/chrome.json';
import {UIProvider, ModalHost, ToastHost, UX, revealAll, refreshIndicators} from './ui';
import {PageChrome} from './chrome';
import {Hero} from './hero';
import {Schemes, Shape, Controls} from './samples/found';
import {Dashboard, Work} from './samples/dash-work';
import {Table, Gallery} from './samples/data';
import {Workspace} from './samples/workspace';
import {Canvas} from './samples/canvas';
import {Maps} from './samples/maps';
import {Agents} from './samples/agents';
import {More} from './samples/more';
import {Daily} from './samples/daily';
import {Terms} from './samples/terms';
import {Values} from './samples/values';
import {Refs} from './samples/refs';

function Handbook() {
  useLayoutEffect(() => {
    window.UX = UX;
    document.querySelectorAll<HTMLElement>('.sec>.bento:not([data-scope]),.sec>.grid:not([data-scope])').forEach(scope => {
      scope.dataset.scope = scope.id || 'cards';
      scope.querySelectorAll<HTMLElement>('.card,.vol,.float,.recess').forEach(component => {
        if (component.closest('[data-scope]') === scope && !component.parentElement?.closest('.card,.vol,[data-cmp]') && !component.hasAttribute('data-cmp')) {component.dataset.cmp = ''; component.dataset.nofocus = '';}
      });
    });
    document.querySelectorAll<HTMLElement>('[data-cmp]').forEach(component => {if (!component.dataset.state) component.dataset.state = 'rest';});
    revealAll(chrome.revealSelector);
    refreshIndicators();
    return () => {delete window.UX;};
  }, []);
  return <><PageChrome /><main id="page"><Hero /><Terms /><Schemes /><Shape /><Controls /><Workspace /><Dashboard /><Canvas /><Maps /><Agents /><More /><Work /><Table /><Gallery /><Daily /><Values /><Refs /></main><ModalHost /><ToastHost /></>;
}
// #nodeName is required for HTML parity; prevent its window named property from
// masquerading as window.nodeName in React's delegated event path.
Object.defineProperty(window, 'nodeName', {value: undefined, configurable: true});
createRoot(document.getElementById('root')!).render(<UIProvider><Handbook /></UIProvider>);
