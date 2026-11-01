// Import the generated tokens and the five original stylesheets, in HTML build order.
import '@core/dist/tokens.css';
import '@core/styles/base.css';
import '@core/styles/scenes.css';
import '@core/styles/more.css';
import '@core/styles/sf.css';
import '@core/styles/data.css';
import gallery from '@core/dist/gallery.json';

const sf = import.meta.glob('@core/content/assets/sf/*.webp', {eager: true, query: '?url', import: 'default'}) as Record<string, string>;
const web = import.meta.glob('@core/content/assets/gallery/*.webp', {eager: true, query: '?url', import: 'default'}) as Record<string, string>;
for (const [path, url] of Object.entries(sf).sort(([a], [b]) => a.localeCompare(b))) {
  const stem = path.split('/').pop()!.replace(/\.webp$/, '');
  document.documentElement.style.setProperty(`--sf-${stem}`, `url("${url}")`);
}
gallery.forEach((item, i) => {
  const path = Object.keys(web).find(key => key.endsWith('/' + item.f));
  if (path) document.documentElement.style.setProperty(`--w${i}`, `url("${web[path]}")`);
});
// ES modules are singletons: every binding uses this one engine instance.
export {UX, whenSeen, countUp, revealAll} from '@core/behavior/ux.js';
