import { elt, on } from '../../utils/dom';
import { clamp, nDigits } from '../../utils/misc';
import { STYLES } from '../style-map';
import { COLORS, getStyle } from '../theme';

import { View, ViewOptions, Viewport } from './index';
import ViewController from '../view-controller';
import FontMetrics from './font-metrics';
import LineCache from '../line-cache';

export default class CanvasView implements View {

  // View's wrapper element.
  private wrapper: HTMLElement;

  // The actual canvas.
  private canvas: HTMLCanvasElement;

  // Canvas context.
  private ctx: CanvasRenderingContext2D;

  // Parent ViewController's FontMetrics.
  private metrics: FontMetrics;

  // Parent ViewController's LineCache.
  private lineCache: LineCache;

  // Pixel ratio of the canvas. Used to render canvas appropriately on hi-def
  // screens (retina).
  private scale: number = (window.devicePixelRatio || 1);

  // TODO: getters setters with ratios ?
  // TODO: basically - make it so I don't have to worry about devicePixelRatio?
  private x: number = 0;
  private y: number = 0;

  private width: number = 0;
  private height: number = 0;

  constructor(private controller: ViewController,  _opts: ViewOptions) {
    this.wrapper = controller.wrapper;
    this.metrics = controller.metrics;
    this.lineCache = controller.lineCache;

    this.canvas = (<HTMLCanvasElement>this.wrapper.appendChild(elt('canvas')));
    this.canvas.style.display = 'block';
    on(this.canvas, 'mousewheel', (event) => this.scrollCanvas(event), false);

    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      this.ctx = ctx;
    } else {
      throw new Error('Could not get CanvasRenderingContext2D');
    }

    this.metrics.on('update', () => this.updateViewport());
  }

  private scrollCanvas(event: MouseWheelEvent) {
    let { deltaX, deltaY } = event;
    // TODO: get max width ? currently this is a bit of a hack with `this.nChars`...
    const { charStart, charEnd } = this.getViewport();
    const nChars = this.nChars - (charEnd - charStart);

    const nLines = this.lineCache.height();
    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();

    this.x = clamp(this.x + deltaX, 0, Math.max(nChars * charWidth, 0));
    this.y = clamp(this.y + deltaY, 0, Math.max(((nLines - 1) * lineHeight) / 2, 0));

    // FIXME: the values of deltaX & deltaY are relative to the browsers dpi - ie, the devicePixelRatio
    // so, that's the reason they're out of whack below...

    // TODO: send scroll event to core! (currently via controller - re-factor func names)
    this.controller.updateViewport();

    this.updateViewport();
    this.render();
  }

  private updateViewport() {
    this.width = this.canvas.width / this.scale;
    this.height = this.canvas.height / this.scale;
  }

  // TODO: add in this.scale ??
  public resize(width: number, height: number) {
    this.canvas.width = width * this.scale;
    this.canvas.height = height * this.scale;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.scale, this.scale);

    this.updateViewport();
    this.render();
  }

  /**
   * Returns a [line, char] from the given coordinates.
   * @param  {Number}  x       The x coordinate (relative to the view).
   * @param  {Number}  y       The y coordinate (relative to the view).
   * @param  {Boolean} forRect Whether the click was using rectangular selections.
   * @return {Array}           A [line, char] object of the coordinates at the point.
   */
  public posFromCoords(x: number, y: number, _forRect: boolean): [number, number] {
    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();

    // FIXME: ratio!
    const char = Math.round(((x + this.x) - this.gutterWidth - (charWidth / 2)) / charWidth);
    const line = Math.round(((y + (this.y * this.scale)) - (lineHeight / 2)) / lineHeight);

    return [line, char];
  }

  // TODO: scroll margins
  public scrollTo(line: number, char: number) {
    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();

    const linePos = lineHeight * line;
    const charPos = charWidth * char;

    // FIXME: TODO: WHAT: why is it only for `y` values ???

    if (linePos < (this.y * this.scale)) {  // FIXME: ratio!
      this.y = linePos / this.scale;  // FIXME: ratio!
    } else if (linePos > (this.y * this.scale) + this.height - lineHeight) { // FIXME: ratio!
      this.y = (linePos - this.height + lineHeight) / this.scale; // FIXME: ratio!
    }

    if (charPos < this.x) {
      this.x = charPos;
    } else if (charPos > this.x + this.width - this.gutterWidth - charWidth) {
      this.x = charPos + this.gutterWidth + charWidth - this.width;
    }

    this.updateViewport();
    this.render();
  }

  // Returns an object with measurements about the current viewport: "top" and
  // "height" are measured in lines, "left" and "width" in chars.
  public getViewport(): Viewport {
    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();
    return {
      lineStart: Math.floor((this.y * this.scale) / lineHeight),
      lineEnd: Math.floor((this.height + (this.y * this.scale)) / lineHeight),
      charStart: Math.floor((this.x * this.scale) / charWidth),
      charEnd: Math.floor((this.width - this.gutterWidth + (this.x * this.scale)) / charWidth),
    };
  }

  // Renders the document onto the canvas.
  // TODO: left/right scrolling

  // TODO: make these constants configurable
  private gutterWidth: number = 0;
  private editorPadding: number = 5;
  private gutterPadding: number = 20;

  // HACK: need to find a better way of getting the longest line, right now we just save it whenever
  // we render
  private nChars: number = 0;

  public render() {
    const baseline = this.metrics.baseline();
    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();

    // Reset canvas.
    this.ctx.font = this.metrics.fontString();
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Get lines to draw and screen coords.
    const first = Math.floor(this.y / lineHeight);
    const last = Math.ceil((this.y + this.height) / lineHeight);
    const yDiff = this.y % lineHeight;
    const { editorPadding, gutterPadding } = this;
    const gutterWidth = this.gutterWidth = nDigits(last) * charWidth + gutterPadding;
    const xOffset = gutterWidth + editorPadding - this.x;

    this.lineCache.computeMissing(first, last);

    const getLineData = (i: number) => ({
      y: (lineHeight * i) - yDiff - this.y,
      line: this.lineCache.get(first + i)
    });

    // First pass, for drawing background selections and search highlights.
    for (let i = first; i <= last; ++i) {
      const { line, y } = getLineData(i);
      if (!line || !line.containsReservedStyle()) { continue; }

      // Draw selection(s).
      this.ctx.fillStyle = COLORS.SELECTION;
      const selections = line.styles.filter((span) => span.style == STYLES.SELECTION);
      selections.forEach(({ range: { start, length } }) => {
        this.ctx.fillRect((charWidth * start) + xOffset, y, charWidth * length, lineHeight);
      });

      // Draw highlight(s).
      this.ctx.fillStyle = COLORS.HIGHLIGHT;
      const highlights = line.styles.filter((span) => span.style == STYLES.HIGHLIGHT);
      highlights.forEach(({ range: { start, length } }) => {
        this.ctx.fillRect((charWidth * start) + xOffset, y, charWidth * length, lineHeight);
      });
    }

    // Second pass, for actually rendering text.
    // TODO: currently draws the whole horizontal line, irrespective of viewport/scrol position
    this.ctx.save();
    for (let i = first; i <= last; ++i) {
      const { line, y } = getLineData(i);
      if (!line) { continue; }

      // TODO: bit of a hack atm, will need to reset when longest line is shortened...
      this.nChars = Math.max(this.nChars, line.text.length);

      // Draw cursor(s).
      this.ctx.fillStyle = COLORS.CURSOR;
      line.cursor.forEach((ch) => {
        this.ctx.fillRect((ch * charWidth) + xOffset, y, 2, lineHeight);
      });

      // Draw text.
      const textY = y + baseline;
      line.styles.forEach((styleSpan) => {
        const { style: styleId, range: { start, length } } = styleSpan;

        const style = getStyle(styleId);
        this.ctx.fillStyle = style.fg;
        this.ctx.font = style.fontString(this.metrics);

        const textX = (charWidth * start) + xOffset;
        this.ctx.fillText(line.text.substr(start, length), textX, textY);
      });
    }
    this.ctx.restore();

    // Draw gutter background and vertical separator.
    this.ctx.fillStyle = '#242424';
    this.ctx.fillRect(0, 0, gutterWidth, this.height);
    this.ctx.strokeStyle = '#5a5a5a';
    this.ctx.beginPath();
    this.ctx.moveTo(gutterWidth, 0);
    this.ctx.lineTo(gutterWidth, this.height);
    this.ctx.stroke();

    // Third pass, draw the gutter.
    this.ctx.fillStyle = '#5a5a5a';
    for (let i = first; i <= last; ++i) {
      const { line, y } = getLineData(i);
      if (!line) { continue; }

      this.ctx.fillText(`${first + i + 1}`, gutterPadding / 2, y + baseline);
    }
  }
}
