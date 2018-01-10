import { elt, removeChildrenAndAdd } from '../utils/dom';
import EventEmitter from '../utils/emitter';

export type FontOptions = {
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
  private familyValue: string = "Monaco, 'Courier New', Courier, monospace";

  // Current font size.
  private sizeValue: number = 16;

  // Measuring container. Used to calculate and measure the chosen font.
  private measure: any;

  // Cached value for baseline.
  private cachedBaseline: number;

  // Cached value for character width.
  private cachedCharWidth: number;

  // Cached value for line height.
  private cachedLineHeight: number;

  /**
   * Create a FontMetrics instance.
   * @param  {HTMLElement} element Parent's wrapper.
   * @param  {FontOptions} opts    Options for the given font.
   */
  constructor(element: any, opts: FontOptions) {
    super();

    this.measure = element.appendChild(elt('div', null, 'xi-measure'));
    this.measure.style.position = 'absolute';
    this.measure.style.whiteSpace = 'nowrap';
    this.measure.style.visibility = 'hidden';

    this.update(opts);
  }

  /**
   * Public API
   */

  /**
   * Called when there're new font settings applied.
   * @param  {FontOptions} opts Options for the new settings.
   */
  public update(opts: FontOptions) {
    if (opts.family) { this.familyValue = opts.family; }
    if (opts.size) { this.sizeValue = opts.size; }

    this.measure.style.font = `${this.sizeValue}px ${this.familyValue}`;

    this.computeBaseline();
    this.computeCharWidth();
    this.computeLineHeight();

    this.emit('update');
  }

  /**
   * Get the font's baseline - useful for drawing text on a canvas.
   * @param  {Boolean} force Whether to force a recalculation.
   * @return {Number}        The font's baseline (in pixels).
   */
  public baseline(force: boolean = false) {
    if (!force && this.cachedBaseline != null) { return this.cachedBaseline; }
    return this.computeBaseline();
  }

  /**
   * Get the width of a (monospace) character.
   * @param  {Boolean} force Whether to force a recalculation.
   * @return {Number}        The character width (in pixels).
   */
  public charWidth(force: boolean = false) {
    if (!force && this.cachedCharWidth != null) { return this.cachedCharWidth; }
    return this.computeCharWidth();
  }

  /**
   * Get the line height of the chosen font..
   * @param  {Boolean} force Whether to force a recalculation.
   * @return {Number}        The line height (in pixels).
   */
  public lineHeight(force: boolean = false) {
    if (!force && this.cachedLineHeight != null) { return this.cachedLineHeight; }
    return this.computeLineHeight();
  }

  /**
   * Generate a css font string for the given font settings.
   * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font
   * @return {String} A CSS font value of the given font.
   */
  public fontString() {
    return `${this.sizeValue}px ${this.familyValue}`;
  }

  /**
   * Get the current font family.
   * @return {String} The font family.
   */
  public family() {
    return this.familyValue;
  }

  /**
   * Get the current font size.
   * @return {Number} The font size (in pixels).
   */
  public size() {
    return this.sizeValue;
  }

  /**
   * Private API
   */

  /**
   * Calculate the baseline of a given font.
   * @return {Number} Value in pixels.
   */
  private computeBaseline() {
    const span = elt('span');
    span.style.display = 'inline-block';
    span.style.overflow = 'hidden';
    span.style.width = '1px';
    span.style.height = '1px';

    removeChildrenAndAdd(this.measure, span);

    return this.cachedBaseline = span.offsetTop + span.offsetHeight;
  }

  /**
   * Calculate the character width of a given font.
   * @return {Number} Value in pixels.
   */
  private computeCharWidth() {
    const anchor = elt('span', 'x'.repeat(10));
    const pre = elt('pre', [anchor]);

    removeChildrenAndAdd(this.measure, pre);

    const rect = anchor.getBoundingClientRect(),
          width = (rect.right - rect.left) / 10;

    if (width > 2) { this.cachedCharWidth = width; }
    return width || 10;
  }

  /**
   * Calculate the line height of a given font.
   * @return {Number} Value in pixels.
   */
  private computeLineHeight() {
    const pre = elt('pre', null);
    for (let i = 0; i < 49; ++i) {
      pre.appendChild(document.createTextNode('x'));
      pre.appendChild(elt('br'));
    }
    pre.appendChild(document.createTextNode('x'));

    removeChildrenAndAdd(this.measure, pre);

    const height = pre.offsetHeight / 50;
    if (height > 3) { this.cachedLineHeight = height; }
    return height || 1;
  }
}
