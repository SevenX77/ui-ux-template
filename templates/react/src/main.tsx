import {createRoot} from 'react-dom/client';
import {useLayoutEffect} from 'react';
import chrome from '@core/content/chrome.json';
import {UIProvider, ModalHost, ToastHost, UX, revealAll, refreshIndicators} from './ui';
import {PageChrome} from './chrome';
import {Hero} from './hero';
import {Schemes, Shape, Controls} from './samples/found';
import {Dashboard, Work} from './samples/dash-work';
import {Table, Gallery} from './samples/data';

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
  return <><PageChrome /><main id="page"><Hero /><Schemes /><Shape /><Controls /><Dashboard /><Work /><Table /><Gallery /></main><ModalHost /><ToastHost /></>;
}
createRoot(document.getElementById('root')!).render(<UIProvider><Handbook /></UIProvider>);
