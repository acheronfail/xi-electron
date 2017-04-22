import LineCache from './line-cache';
import { el, on, removeChildrenAndAdd } from './utils';

// TODO: scroll editor to show cursor

export default class LineView {
  constructor(view) {
    this.view = view;
    this.lineCache = new LineCache(this);

    this.measure = el('div', null, 'xi-measure');
    this.lineContainer = el('div', null, 'xi-line-container');
    this.el = view.el.appendChild(el('div', [this.lineContainer, this.measure], 'xi-line-view'));

    this.updateViewport();
  }

  // Determine how many lines should render, and send this info to xi-core.
  // TODO: call this on window resize
  updateViewport() {
    const nVisibleLines = Math.ceil(this.el.offsetHeight / this.textHeight(true));
    this.view.edit('scroll', [0, nVisibleLines]);
  }

  textHeight(force) {
    if (!force && this.cachedTextHeight != null) return this.cachedTextHeight;
    return this._computeTextHeight();
  }

  _computeTextHeight() {
    const pre = el('pre', null, 'xi-line');
    for (let i = 0; i < 49; ++i) {
      pre.appendChild(document.createTextNode('x'));
      pre.appendChild(el('br'));
    }
    pre.appendChild(document.createTextNode('x'));
    removeChildrenAndAdd(this.measure, pre);
    const height = pre.offsetHeight / 50;
    if (height > 3) this.cachedTextHeight = height;
    return height || 1;
  }

  charWidth(force) {
    if (!force && this.cachedCharWidth != null) return this.cachedCharWidth;
    return this._computeCharWidth();
  }

  _computeCharWidth() {
    const anchor = el('span', 'xxxxxxxxxx');
    const pre = el('pre', [anchor], 'xi-line');

    removeChildrenAndAdd(this.measure, pre);

    const rect = anchor.getBoundingClientRect(),
          width = (rect.right - rect.left) / 10;

    if (width > 2) this.cachedCharWidth = width;
    return width || 10;
  }

  update(data) {
    this.lineCache.applyUpdate(data);
    // TODO: queue renders ? mark dirty ?
    this.render();
  }

  // FIXME: naive method. Very inefficient.
  render() {
    this.lines().forEach((line) => line.render());
  }

  lines() {
    return this.lineCache.lines;
  }
}
