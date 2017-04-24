import LineCache from './line-cache';
import Pos from './pos';
import { clamp, el, on, removeChildrenAndAdd } from './utils';

// TODO: scroll editor to show cursor

export default class LineView {
  constructor(view) {
    this.view = view;
    this.lineCache = new LineCache(this);

    this.measure = el('div', null, 'xi-measure');
    this.lineContainer = el('div', null, 'xi-line-container');
    this.el = view.el.appendChild(el('div', [this.lineContainer, this.measure], 'xi-line-view'));

    this.updateViewport();
    on(window, 'resize', () => this.updateViewport(), false);
  }

  get settings() {
    return this.view.settings;
  }

  // Determine how many lines should render, and send this info to xi-core.
  // TODO: don't always request from 0, get "view.firstLine" or something.
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

  // Compute the character position closest to the given coordinates.
  posAt(x, y, forRect) {
    // TODO: make all this relative to the scrolled region.
    // i.e., not from "0" !

    if (y < 0) {
      return new Pos(0, 0);
    }

    let lineNo = this.lineAtHeight(y);
    if (isNaN(lineNo)) return null;

    // Clicked past the end of the document.
    const last = this.lines().length - 1;
    if (lineNo > last) {
      return new Pos(last, this.getLine(last).text.length);
    }

    let line = this.getLine(lineNo);

    let char = Math.round((x < 0 ? 0 : x) / this.charWidth());
    if (forRect) {
      // TODO: rectangular selections.
      // Probably have to wait for xi-core.
    } else {
      char = clamp(char, 0, line.text.length);
    }

    return new Pos(lineNo, char);
  }

  getLine(i) {
    return this.lineCache.lines[i];
  }

  lineAtHeight(y) {
    const textHeight = this.textHeight();
    return Math.round((y - (textHeight / 2)) / textHeight);
  }

  /**
   * External instance methods.
   */

  lines(i) {
    return this.lineCache.lines;
  }

  posFromMouse(e, forRect = false) {
    const { left, top } = this.el.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    return this.posAt(x, y, forRect);
  }
}
