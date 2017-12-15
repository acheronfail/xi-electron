import { elt, removeChildrenAndAdd } from '../utils/dom';
import EventEmitter from '../utils/emitter';

type FontOptions = {
  family?: string,
  size?: number
};

/**
 * This class calculates font widths, heights and baselines. It also provides
 * some utility options like generating css style font strings (e.g., used when
 * setting the font of a canvas' context).
 */
export default class FontMetrics extends EventEmitter {

  // Currently selected font family.
  _family: string = "Monaco, 'Courier New', Courier, monospace";

  // Current font size.
  _size: number = 16;

  // Measuring container. Used to calculate and measure the chosen font.
  _measure: any;

  // Cached value for baseline.
  _cachedBaseline: ?number = null;

  // Cached value for character width.
  _cachedCharWidth: ?number = null;

  // Cached value for line height.
  _cachedLineHeight: ?number = null;

  /**
   * Create a FontMetrics instance.
   * @param  {HTMLElement} element Parent's wrapper.
   * @param  {FontOptions} opts    Options for the given font.
   */
  constructor(element: any, opts: FontOptions) {
    super();

    this._measure = element.appendChild(elt('div', null, 'xi-measure'));
    this._measure.style.position = 'absolute';
    this._measure.style.whiteSpace = 'nowrap';
    this._measure.style.visibility = 'hidden';

    this.update(opts);
  }

  /**
   * Public API
   */

  /**
   * Called when there're new font settings applied.
   * @param  {FontOptions} opts Options for the new settings.
   */
  update(opts: FontOptions) {
    if (opts.family) this._family = opts.family;
    if (opts.size) this._size = opts.size;

    this._measure.style.font = `${this._size}px ${this._family}`;

    this._computeBaseline();
    this._computeCharWidth();
    this._computeLineHeight();

    this.emit('update');
  }

  /**
   * Get the font's baseline - useful for drawing text on a canvas.
   * @param  {Boolean} force Whether to force a recalculation.
   * @return {Number}        The font's baseline (in pixels).
   */
  baseline(force: boolean = false) {
    if (!force && this._cachedBaseline != null) return this._cachedBaseline;
    return this._computeBaseline();
  }

  /**
   * Get the width of a (monospace) character.
   * @param  {Boolean} force Whether to force a recalculation.
   * @return {Number}        The character width (in pixels).
   */
  charWidth(force: boolean = false) {
    if (!force && this._cachedCharWidth != null) return this._cachedCharWidth;
    return this._computeCharWidth();
  }

  /**
   * Get the line height of the chosen font..
   * @param  {Boolean} force Whether to force a recalculation.
   * @return {Number}        The line height (in pixels).
   */
  lineHeight(force: boolean = false) {
    if (!force && this._cachedLineHeight != null) return this._cachedLineHeight;
    return this._computeLineHeight();
  }

  /**
   * Generate a css font string for the given font settings.
   * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font
   * @return {String} A CSS font value of the given font.
   */
  fontString() {
    return `${this._size}px ${this._family}`;
  }

  /**
   * Get the current font family.
   * @return {String} The font family.
   */
  family() {
    return this._family;
  }

  /**
   * Get the current font size.
   * @return {Number} The font size (in pixels).
   */
  size() {
    return this._size;
  }

  /**
   * Private API
   */

  /**
   * Calculate the baseline of a given font.
   * @return {Number} Value in pixels.
   */
  _computeBaseline() {
    const span = elt('span');
    span.style.display = 'inline-block';
    span.style.overflow = 'hidden';
    span.style.width = '1px';
    span.style.height = '1px';

    removeChildrenAndAdd(this._measure, span);

    return this._cachedBaseline = span.offsetTop + span.offsetHeight;
  }

  /**
   * Calculate the character width of a given font.
   * @return {Number} Value in pixels.
   */
  _computeCharWidth() {
    const anchor = elt('span', 'x'.repeat(10));
    const pre = elt('pre', [anchor]);

    removeChildrenAndAdd(this._measure, pre);

    const rect = anchor.getBoundingClientRect(),
          width = (rect.right - rect.left) / 10;

    if (width > 2) this._cachedCharWidth = width;
    return width || 10;
  }

  /**
   * Calculate the line height of a given font.
   * @return {Number} Value in pixels.
   */
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
