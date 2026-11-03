/* Shared maps content/state/geometry policies; stack adapters own DOM, input, clocks and drawing. */
// Source: frozen app2.js:103-145. Requires core/content/maps.json supplied as c.
// Child must not install this into core/behavior; Root owns that action and HTML wiring.
function roleMapView(c, current) {
 const g = c.geometry;
 const categories = c.categories.map((category, index) => ({...category,
  count: category.k === 'all' ? c.roles.length : c.roles.filter(role => role.category === category.k).length,
  top: g.categoryTop + index * g.categoryStep + '%',
  firstRole: category.k === 'all' ? 0 : c.roles.findIndex(role => role.category === category.k),
  on: category.k === current.k
 }));
 return {
  coreColor: c.categories.find(category => category.k === current.k)?.col || c.styles.coreIdleColor,
  categories,
  roles: c.roles.map((role, index) => ({...role,
   color: c.categories.find(category => category.k === role.category).col,
   top: g.roleTop + index * g.roleStep + '%',
   on: current.k === 'all' || role.category === current.k,
   current: index === current.i && current.k !== 'all'
  }))
 };
}
function roleMapEdges(c, current, positions) {
 const base = [], active = [], g = c.geometry;
 const link = (id, x1, y1, x2, y2, color, on, selected) => {
  const mx = (x1 + x2) * g.midpoint, d = `M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2}`;
  const edge = {id, d, color, current: !!selected, x1, y1, x2, y2, gradientY2: y2 + g.gradientEndOffset};
  (on ? active : base).push(edge);
 };
 const [cx, cy] = positions.core;
 c.categories.forEach((category, index) => {
  const [x, y] = positions.categories[index].left;
  link('rmc' + category.k, cx, cy, x, y, category.col, category.k === current.k, category.k === current.k);
 });
 c.roles.forEach((role, index) => {
  const k = current.k === 'all' ? 'all' : role.category, ci = c.categories.findIndex(category => category.k === k), category = c.categories[ci];
  const [x, y] = positions.categories[ci].right, [x2, y2] = positions.roles[index], on = current.k === 'all' || role.category === current.k;
  link('rmr' + index, x, y, x2 + g.roleEndpointOffset, y2, category.col, on, on && index === current.i && current.k !== 'all');
 });
 return {base, active};
}
function roleMapDetail(c, current) {
 const category = c.categories.find(category => category.k === current.k), role = c.roles[current.i];
 const title = current.k === 'all' ? c.text.allTitle : role.name, body = current.k === 'all' ? c.text.allDescription : role.description;
 return {category, title, body, ask: c.text.askPrefix + title + c.text.askSuffix};
}
function roleMapNext(c, index) {return (index + 1) % c.roles.length;}
function fanLayout(c, index, measurement) {
 const g = c.geometry, narrow = measurement.hostWidth < g.narrowAt;
 return {narrow,
  height: narrow ? g.fanPad + g.fanStep * c.fan[index].items.length + g.fanHeightPad + 'px' : '',
  scrollLeft: narrow ? measurement.buttonOffsetLeft - (measurement.stripWidth - measurement.buttonWidth) * g.midpoint : null
 };
}
function fanGeometry(c, index, measurement) {
 const g = c.geometry, nar = measurement.narrow, L = c.fan[index].items, pad = nar ? g.fanPad : 0, step = nar ? g.fanStep : 0;
 const {width: w, height: h, centerRect: cr, buttonRect: br} = measurement;
 const x0 = nar ? br.left + br.width * g.midpoint - cr.left : br.right - cr.left;
 const y0 = nar ? br.bottom - cr.top : br.top + br.height * g.midpoint - cr.top;
 const rail = g.rail, corner = g.corner, x1 = nar ? g.mobileEnd : Math.min(w * g.desktopEndFraction, g.desktopEndMax);
 const points = L.map((_, k) => {
  const y = nar ? pad + step * (k + g.midpoint) : (k + g.midpoint) / L.length * h;
  const d = nar
   ? `M${x0} ${y0} V${corner} Q${x0} 0 ${x0 - (x0 > rail ? corner : -corner)} 0 H${rail + corner} Q${rail} 0 ${rail} ${corner} V${y - corner} Q${rail} ${y} ${rail + corner} ${y} H${x1}`
   : `M${x0} ${y0} C${x0 + (x1 - x0) * g.midpoint} ${y0},${x0 + (x1 - x0) * g.midpoint} ${y},${x1} ${y}`;
  return {y, d, gradientY2: y + g.gradientEndOffset, delay: k * c.timing.fanStagger + 'ms', left: x1 + g.itemOffset + 'px', top: y + 'px'};
 });
 return {nar, x0, y0, x1, w, h, points, signature: [nar, x1, h, y0 | 0, x0 | 0].join()};
}
function fanDetail(c, index, item) {
 const g = c.geometry;
 return {category: c.fan[index].name, title: c.fan[index].items[item], progress: (item * g.progressStep + g.progressStart) % g.progressMod, quotes: item * g.quotesStep + g.quotesStart, links: item + g.linksStart};
}
export {roleMapView, roleMapEdges, roleMapDetail, roleMapNext, fanLayout, fanGeometry, fanDetail};
