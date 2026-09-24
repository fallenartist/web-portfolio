/* Local comparison harness. Both renderers use identical seeded live-site data. */
const prototypeWeight = d3.randomInt.source(d3.randomLcg(0.314159))(50, 250);
window.prototypeHTML = new URLSearchParams(location.search).get('renderer') !== 'svg';
if (prototypeHTML) {
  const svg = document.querySelector('#chart');
  const chart = document.createElement('div');
  chart.id = 'chart'; chart.className = 'html-chart';
  svg.replaceWith(chart);
}
d3.history = () => ({ call(_event, _context, url) {
  const next = new URL(url, location.href);
  next.search = location.search;
  history.pushState({}, '', next);
}});
for (const button of document.querySelectorAll('[data-mode]')) {
  button.setAttribute('aria-pressed', String((button.dataset.mode === 'html') === prototypeHTML));
  button.onclick = () => {
    const url = new URL(location.href);
    url.searchParams.set('renderer', button.dataset.mode);
    location.href = url;
  };
}
document.querySelector('#hide-comparison').onclick = () => document.querySelector('#comparison').hidden = true;
document.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 'c' && !event.ctrlKey && !event.metaKey) {
    const controls = document.querySelector('#comparison'); controls.hidden = !controls.hidden;
  }
});

function createHTMLCells(chart, nodes, color, lightbox, navigate) {
  // Match the original ordinal colour registration, including the hidden root.
  const colors = new Map();
  for (const node of nodes.descendants()) {
    let category = node;
    while (category.depth > 1) category = category.parent;
    colors.set(node, color(category.data.slug));
  }
  const cells = chart.selectAll('.html-node').data(nodes.descendants().reverse()).join('div')
    .attr('class', d => `node html-node level-${d.depth}`)
    .attr('role', 'button').attr('aria-label', d => d.data.title || 'View image');
  cells.each(function(d) {
    const background = document.createElement('div');
    background.className = 'tile-background'; background.style.backgroundColor = colors.get(d);
    this.append(background);
    if (d.depth < 3) {
      const label = document.createElement('span'); label.className = 'html-label';
      label.textContent = d.data.title || '?';
      const clip = document.createElement('div'); clip.className = 'label-clip';
      clip.append(label); this.append(clip);
    }
    if (d.depth === 2 || d.depth === 3) {
      const image = document.createElement('img');
      image.className = d.depth === 2 ? 'thumb' : 'tile-image';
      image.alt = ''; image.decoding = 'async'; image.draggable = false;
      image.src = 'https://lenart.pl/img/' + (d.data.thumb || d.data.image || '__pixel.png');
      const clip = document.createElement('div');
      clip.className = d.depth === 3 ? 'image-clip gallery-clip' : 'image-clip';
      clip.append(image);
      this.append(clip);
    }
  });
  cells.on('click', (event, d) => {
    if (d.depth === 3) lightbox.open(d, d.parent.children || []);
    else navigate(d);
  }).on('keydown', function(event) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.click(); }
  });
  document.fonts.ready.then(() => {
    const context = document.createElement('canvas').getContext('2d');
    for (const label of document.querySelectorAll('.html-label')) {
      const style = getComputedStyle(label);
      const size = parseFloat(style.fontSize);
      context.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
      const metrics = context.measureText(label.textContent);
      const ascent = metrics.fontBoundingBoxAscent ?? size * .8;
      const descent = metrics.fontBoundingBoxDescent ?? size * .2;
      // Match SVG's alphabetic baseline at centre + .35em.
      label.style.translate = `-50% ${size * .35 - (size + ascent - descent) / 2}px`;
    }
  });
  return cells;
}

// Retain the current image until a replacement is decoded. Native object-fit
// handles intrinsic dimensions, including a thumbnail/full-size aspect change.
function upgradeImage(image, source) {
  if (image.dataset.requestedSource === source || image.src === source) return;
  image.dataset.requestedSource = source;
  const replacement = new Image();
  replacement.decoding = 'async';
  replacement.src = source;
  replacement.decode().then(() => {
    if (image.dataset.requestedSource === source && image.isConnected) image.src = source;
  }).catch(() => {
    if (image.dataset.requestedSource === source) delete image.dataset.requestedSource;
  });
}

function animateHTMLCells(cells, x, y, gap, duration, selected) {
  const chart = d3.select('#chart');
  // One D3 clock; each element retains the exact last painted rectangle.
  // Interrupt only geometry, leaving hover/opacity CSS transitions intact.
  chart.interrupt('html-zoom');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vw = chart.node().clientWidth, vh = chart.node().clientHeight;
  const intersects = b => b.x < vw && b.y < vh && b.x + b.w > 0 && b.y + b.h > 0;
  const states = [];
  cells.each(function(node) {
    const target = {
      x: x(node.x0), y: y(node.y0),
      w: Math.max(0, x(node.x1) - x(node.x0)),
      h: Math.max(0, y(node.y1) - y(node.y0)),
    };
    const before = this._box || target;
    // A tile can cross the viewport even if both endpoints are outside it.
    const swept = {
      x: Math.min(before.x, target.x), y: Math.min(before.y, target.y),
      w: Math.max(before.x + before.w, target.x + target.w) - Math.min(before.x, target.x),
      h: Math.max(before.y + before.h, target.y + target.h) - Math.min(before.y, target.y),
    };
    const visible = node.depth > 0 && intersects(swept);
    const active = node.depth > selected.depth && intersects(target);
    this.tabIndex = active ? 0 : -1;
    this.setAttribute('aria-hidden', String(!active));
    this.style.visibility = visible ? 'visible' : 'hidden';
    this.style.setProperty('--gap', `${gap}px`);
    // Request image upgrades after motion; decoding/uploading large textures
    // during the zoom competes with its frame budget. Returning to an overview
    // restores thumbnails instead of retaining every previously opened original.
    const image = node.depth === 3 ? this.querySelector('img') : null;
    const source = image ? 'https://lenart.pl/img/' +
      ((node.parent === selected ? node.data.image : node.data.thumb) || node.data.image) : null;
    if (image && image.dataset.requestedSource !== source) delete image.dataset.requestedSource;
    states.push({ el: this, node, image, source, before, target, visible });
  });
  function paint(state, t) {
    const box = {};
    for (const key of ['x', 'y', 'w', 'h']) {
      box[key] = state.before[key] + (state.target[key] - state.before[key]) * t;
    }
    state.el._box = box;
    // No layout reads here. Each cell contains its own layout work.
    state.el.style.transform = `translate(${box.x}px,${box.y}px)`;
    state.el.style.width = `${box.w}px`;
    state.el.style.height = `${box.h}px`;
  }
  for (const state of states) paint(state, state.visible && !reduced ? 0 : 1);
  function finish() {
    for (const state of states) {
      paint(state, 1);
      // Ancestors have completed their fade and have no visible content now.
      state.el.style.visibility = state.node.depth > selected.depth && intersects(state.target) ? 'visible' : 'hidden';
      if (state.image && state.source) upgradeImage(state.image, state.source);
    }
  }
  if (reduced) { finish(); return; }
  chart.transition('html-zoom').duration(duration).ease(d3.easeExpInOut)
    .tween('geometry', () => t => {
      for (const state of states) if (state.visible) paint(state, t);
    })
    .on('end', finish);
}
