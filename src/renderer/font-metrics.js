// @flow

import { elt, removeChildrenAndAdd } from '../utils/dom';

type FontOptions = {
  family?: string,
  size?: number
};


export default class FontMetrics {
  // Currently selected font family.
  _family: string = "Monaco, 'Courier New', Courier, monospace";

  // Current font size.
  _size: number = 16;

  // Measuring container.
  _measure: HTMLElement;

  //
  _cachedBaseline: ?number = null;

  //
  _cachedCharWidth: ?number = null;

  //
  _cachedLineHeight: ?number = null;

  constructor(element: HTMLElement, opts: FontOptions) {
    this._measure = element.appendChild(elt('div', null, 'xi-measure'));
    this._measure.style.position = 'absolute';
    this._measure.style.whiteSpace = 'nowrap';
    this._measure.style.visibility = 'hidden';

    this.update(opts);
  }

  /**
   * Public API
   */

  // Called when there're new font settings applied.
  update(opts: FontOptions) {
    if (opts.family) this._family = opts.family;
    if (opts.size) this._size = opts.size;

    this._measure.style.font = `${this._size}px ${this._family}`;

    this._computeBaseline();
    this._computeCharWidth();
    this._computeLineHeight();
  }

  baseline(force: boolean = false) {
    if (!force && this._cachedBaseline != null) return this._cachedBaseline;
    return this._computeBaseline();
  }

  charWidth(force: boolean = false) {
    if (!force && this._cachedCharWidth != null) return this._cachedCharWidth;
    return this._computeCharWidth();
  }

  lineHeight(force: boolean = false) {
    if (!force && this._cachedLineHeight != null) return this._cachedLineHeight;
    return this._computeLineHeight();
  }

  fontString() {
    return `${this._size}px ${this._family}`;
  }

  family() {
    return this._family;
  }

  size() {
    return this._size;
  }

  /**
   * Private API
   */

  _computeBaseline() {
    const span = elt('span');
    span.style.display = 'inline-block';
    span.style.overflow = 'hidden';
    span.style.width = '1px';
    span.style.height = '1px';

    removeChildrenAndAdd(this._measure, span);

    this._cachedBaseline = span.offsetTop + span.offsetHeight;
  }

  _computeCharWidth() {
    const anchor = elt('span', 'x'.repeat(10));
    const pre = elt('pre', [anchor]);

    removeChildrenAndAdd(this._measure, pre);

    const rect = anchor.getBoundingClientRect(),
          width = (rect.right - rect.left) / 10;

    if (width > 2) this._cachedCharWidth = width;
    return width || 10;
  }

  _computeLineHeight() {
    const pre = elt('pre', null);
    for (let i = 0; i < 49; ++i) {
      pre.appendChild(document.createTextNode('x'));
      pre.appendChild(elt('br'));
    }
    pre.appendChild(document.createTextNode('x'));

    removeChildrenAndAdd(this._measure, pre);

    const height = pre.offsetHeight / 50;
    if (height > 3) this._cachedLineHeight = height;
    return height || 1;
  }
}
