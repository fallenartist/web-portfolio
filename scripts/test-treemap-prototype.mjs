import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/treemap-prototype/comparison.js', import.meta.url), 'utf8');
let tween, end, interrupts = 0;
const pendingImages = [];
const transition = {
  duration() { return this; }, ease() { return this; },
  tween(_name, factory) { tween = factory(); return this; },
  on(_name, callback) { end = callback; return this; },
};
const chart = {
  interrupt(name) { assert.equal(name, 'html-zoom'); interrupts++; },
  node: () => ({clientWidth: 100, clientHeight: 100}),
  transition(name) { assert.equal(name, 'html-zoom'); return transition; },
};
const context = vm.createContext({
  d3: { select: () => chart, easeExpInOut: t => t },
  matchMedia: () => ({matches: false}),
  Image: class {
    decode() { return new Promise(resolve => pendingImages.push({image: this, resolve})); }
  },
});
vm.runInContext(source.slice(source.indexOf('function upgradeImage(')), context);
const node = {depth: 2, x0: 0, x1: 20, y0: 0, y1: 30, data: {}};
const element = {
  style: {setProperty() {}}, setAttribute() {},
  // Regression: geometry must never cancel unrelated CSS hover animations.
  getAnimations() { throw Error('Must not cancel CSS transitions'); },
};
const cells = {each(callback) { callback.call(element, node); }};
const identity = x => x;
context.animateHTMLCells(cells, identity, identity, 4, 600, {depth:0});
tween(1); end();
assert.equal(element._box.w, 20);
context.animateHTMLCells(cells, x => x * 4, x => x * 2, 4, 600, {depth:0});
tween(.4);
const interruptedWidth = element._box.w;
context.animateHTMLCells(cells, identity, identity, 4, 600, {depth:0});
tween(0);
assert.equal(element._box.w, interruptedWidth, 'Interrupted zoom must start at the last painted box');
tween(1); end();
assert.equal(element._box.w, 20);
assert.equal(element.style.height, '30px');
assert.equal(interrupts, 3);

// Crossing tiles cannot be culled just because both endpoints are offscreen.
element._box = {x:-50,y:0,w:20,h:30};
context.animateHTMLCells(cells, x => x + 150, identity, 4, 600, {depth:0});
assert.equal(element.style.visibility, 'visible');
tween(.5);
assert.equal(element._box.x, 50);

const image = {src: 'thumbnail', dataset: {}, isConnected: true};
context.upgradeImage(image, 'full-a');
context.upgradeImage(image, 'full-b');
assert.equal(image.src, 'thumbnail', 'Keep decoded thumbnail while full-size image loads');
pendingImages[0].resolve();
await Promise.resolve();
assert.equal(image.src, 'thumbnail', 'Stale image request must not replace current image');
pendingImages[1].resolve();
await Promise.resolve();
assert.equal(image.src, 'full-b');
console.log('Passed: interruption continuity, final geometry, swept visibility, CSS transition isolation, decoded image swap and stale-request protection.');

// Full-size image work starts after geometry settles, then returns to a thumbnail.
const selectedProject = {depth: 2};
node.depth = 3; node.parent = selectedProject;
node.data = {image: 'full.jpg', thumb: 'thumb.jpg'};
const tileImage = {src: 'https://lenart.pl/img/thumb.jpg', dataset: {}, isConnected: true};
element.querySelector = () => tileImage;
const pendingCount = pendingImages.length;
context.animateHTMLCells(cells, identity, identity, 4, 600, selectedProject);
assert.equal(pendingImages.length, pendingCount, 'Do not start full-size image decoding during geometry animation');
tween(1); end();
assert.equal(pendingImages.length, pendingCount + 1);
pendingImages.at(-1).resolve();
await Promise.resolve();
assert.equal(tileImage.src, 'https://lenart.pl/img/full.jpg');
context.animateHTMLCells(cells, identity, identity, 4, 600, {depth: 0});
tween(1); end();
pendingImages.at(-1).resolve();
await Promise.resolve();
assert.equal(tileImage.src, 'https://lenart.pl/img/thumb.jpg', 'Restore thumbnail outside the selected project');
console.log('Passed: deferred image upgrade and thumbnail restoration.');
