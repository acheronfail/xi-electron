import { elt, removeChildrenAndAdd, removeChildren } from '../../../utils/dom';
import EventEmitter from '../../../utils/emitter';

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
  private measure: HTMLElement;

  // Cached value for baseline.
  private cachedBaseline: number;

  // Cached value for character width.
  private cachedAsciiWidth: number;

  // Cached value for line height.
  private cachedLineHeight: number;

  private cachedWidths: { [char: string]: number } = {};
  private ctx: CanvasRenderingContext2D;

  /**
   * Create a FontMetrics instance.
   * @param  {HTMLElement} element Parent's wrapper.
   * @param  {FontOptions} opts    Options for the given font.
   */
  constructor(element: HTMLElement, opts: FontOptions) {
    super();

    this.measure = element.appendChild(elt('div', null, 'xi-measure'));
    this.measure.style.position = 'absolute';
    this.measure.style.whiteSpace = 'nowrap';
    this.measure.style.visibility = 'hidden';

    const canvas = (<HTMLCanvasElement>elt('canvas'));
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.ctx = ctx;
      this.ctx.font = this.fontString();
    } else {
      throw new Error('Could not get CanvasRenderingContext2D');
    }

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

    const fontString = this.fontString();
    this.ctx.font = this.measure.style.font = fontString;

    // Purge cached values which are now inaccurate.
    this.cachedWidths = {};
    if (this.cachedBaseline != null) { this.baseline(true); }
    if (this.cachedAsciiWidth != null) { this.asciiWidth(true); }
    if (this.cachedLineHeight != null) { this.lineHeight(true); }

    this.emit('update');
  }

  /**
   * Get the font's baseline - useful for drawing text on a canvas.
   * @param  {Boolean} force Whether to force a recalculation.
   * @return {Number}        The font's baseline (in pixels).
   */
  public baseline(force: boolean = false): number {
    if (!force && this.cachedBaseline != null) { return this.cachedBaseline; }
    return this.computeBaseline();
  }

  /**
   * Get the width of the given character.
   * @param  {String}  char  The desired char.
   * @param  {Boolean} force Whether to force a recalculation.
   * @return {Number}        The character width (in pixels).
   */
  public charWidth(char: string, force: boolean = false): number {
    if (char.length > 1) { throw new Error('Cannot pass a multi-character string to `charWidth`!'); }
    if (!force && this.cachedWidths[char] != null) { return this.cachedWidths[char]; }
    return this.computeCharWidth(char);
  }

  /**
   * Calculate the width of the given string - reading character widths from the cache.
   * @param {String} str The string to measure.
   * @return {Number}    The string's width (in pixels).
   */
  public stringWidth(str: string): number {
    let width = 0;
    for (const ch of str) {
      width += this.charWidth(ch);
    }
    return width;
  }

  /**
   * Get the width of a (monospace) ascii character.
   * @param  {Boolean} force Whether to force a recalculation.
   * @return {Number}        The character width (in pixels).
   */
  public asciiWidth(force: boolean = false): number {
    if (!force && this.cachedAsciiWidth != null) { return this.cachedAsciiWidth; }
    return this.computeAsciiWidth();
  }

  /**
   * Get the line height of the chosen font..
   * @param  {Boolean} force Whether to force a recalculation.
   * @return {Number}        The line height (in pixels).
   */
  public lineHeight(force: boolean = false): number {
    if (!force && this.cachedLineHeight != null) { return this.cachedLineHeight; }
    return this.computeLineHeight();
  }

  /**
   * Generate a css font string for the given font settings.
   * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font
   * @return {String} A CSS font value of the given font.
   */
  public fontString(): string {
    return `${this.sizeValue}px ${this.familyValue}`;
  }

  /**
   * Get the current font family.
   * @return {String} The font family.
   */
  public family(): string {
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

  // TODO: support different styles
  public computeCharWidth(char: string) {
    if (this.cachedWidths[char] != null) { return this.cachedWidths[char]; }
    const width = this.ctx.measureText(char).width;
    this.cachedWidths[char] = width;
    return width;
  }

  /**
   * Calculate the character width of a given font.
   * @return {Number} Value in pixels.
   */
  private computeAsciiWidth() {
    const anchor = elt('span', 'x'.repeat(10));
    const pre = elt('pre', [anchor]);

    removeChildrenAndAdd(this.measure, pre);

    const rect = anchor.getBoundingClientRect(),
          width = (rect.right - rect.left) / 10;

    if (width > 2) { this.cachedAsciiWidth = width; }
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

  private computeTextHeight(): { ascent: number, descent: number, height: number } {
    const span = elt('span', 'Hg', null, `font-family: ${this.familyValue}`);
    const div = elt('div', null, null, 'display: inline-block; width: 1px; height: 0');

    removeChildrenAndAdd(this.measure, [span, div]);
    const result = { ascent: 0, descent: 0, height: 0 };

    div.style.verticalAlign = 'baseline';
    result.ascent = div.getBoundingClientRect().top - span.getBoundingClientRect().top;

    div.style.verticalAlign = 'bottom';
    result.height = div.getBoundingClientRect().top - span.getBoundingClientRect().top;

    result.descent = result.height - result.ascent;
    return result;
  }
}
