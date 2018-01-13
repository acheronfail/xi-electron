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
  private devicePixelRatio: number = (window.devicePixelRatio || 1);

  // TODO: getters setters with ratios ?
  // TODO: basically - make it so I don't have to worry about devicePixelRatio!
  private x: number = 0;
  private y: number = 0;

  private width: number = 0;
  private height: number = 0;

  constructor(controller: ViewController,  _opts: ViewOptions) {
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
    const { deltaX, deltaY } = event;
    const nLines = 100;
    const lineHeight = this.metrics.lineHeight();

    // TODO: get max width ?
    this.x = clamp(this.x + deltaX, 0, 0);
    this.y = clamp(this.y + deltaY, 0, Math.max(nLines * lineHeight - this.height, 0));

    this.updateViewport();
    this.render();
  }

  private updateViewport() {
    this.width = this.canvas.width / this.devicePixelRatio;
    this.height = this.canvas.height / this.devicePixelRatio;
  }

  public resize(width: number, height: number) {
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    // this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    this.ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);

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

    const char = Math.round(((this.x * this.devicePixelRatio) + x - (charWidth / 2)) / charWidth);
    const line = Math.round(((this.y * this.devicePixelRatio) + y - (lineHeight / 2)) / lineHeight);

    return [line, char];
  }

  // TODO: scroll margins
  public scrollTo(line: number, char: number) {
    const lineHeight = this.metrics.lineHeight();
    const charWidth = this.metrics.charWidth();

    // TODO: this doesn't work!!!
    const linePos = lineHeight * line;
    const charPos = charWidth * char;

    if (linePos < this.y) {
      this.y = linePos;
    } else if (linePos > (this.y * this.devicePixelRatio) + this.height - lineHeight) {
      this.y = linePos - this.height + lineHeight;
    }

    if (charPos < this.x) {
      this.x = charPos;
    } else if (charPos > (this.x * this.devicePixelRatio) + this.width - charWidth) {
      this.x = charPos - this.width + charWidth;
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
      top: Math.floor(this.y / lineHeight),
      height: Math.floor((this.height + this.y) / lineHeight),
      left: Math.floor(this.x / charWidth),
      width: Math.floor((this.width + this.x) / charWidth),
    };
  }

  // Renders the document onto the canvas.
  // TODO: left/right scrolling
  // TODO: draw gutters
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
    const xDiff = this.x % charWidth;
    const yDiff = this.y % lineHeight;

    this.lineCache.computeMissing(first, last);

    const getLineData = (i: number) => ({
      x: (charWidth * i) - xDiff - this.x,
      y: (lineHeight * i) - yDiff - this.y,
      line: this.lineCache.get(first + i)
    });

    // TODO: make these constants configurable
    const editorPadding = 5;
    const gutterPadding = 20;
    const gutterWidth = nDigits(last) * charWidth + gutterPadding;

    // First pass, for drawing background selections and search highlights.
    for (let i = first; i <= last; ++i) {
      const { x, y, line } = getLineData(i);
      if (!line || !line.containsReservedStyle()) { continue; }

      // Draw selection(s).
      this.ctx.fillStyle = COLORS.SELECTION;
      const selections = line.styles.filter((span) => span.style == STYLES.SELECTION);
      selections.forEach((span) => {
        const start = span.range.start * charWidth + gutterWidth + editorPadding;
        const end = span.range.length * charWidth + gutterWidth + editorPadding;
        this.ctx.fillRect(start, y, end, lineHeight);
      });

      // Draw highlight(s).
      this.ctx.fillStyle = COLORS.HIGHLIGHT;
      const highlights = line.styles.filter((span) => span.style == STYLES.HIGHLIGHT);
      highlights.forEach((span) => {
        const start = span.range.start * charWidth + gutterWidth + editorPadding;
        const end = span.range.length * charWidth + gutterWidth + editorPadding;
        this.ctx.fillRect(start, y, end, lineHeight);
      });
    }

    // Second pass, for actually rendering text.
    this.ctx.save();
    for (let i = first; i <= last; ++i) {
      const { x, y, line } = getLineData(i);
      if (!line) { continue; }

      // Draw cursor(s).
      this.ctx.fillStyle = COLORS.CURSOR;
      line.cursor.forEach((ch) => {
        this.ctx.fillRect((ch * charWidth) + gutterWidth + editorPadding, y, 2, lineHeight);
      });

      // Draw text.
      const textY = y + baseline;
      line.styles.forEach((styleSpan) => {
        const { style: styleId, range: { start, length } } = styleSpan;

        const style = getStyle(styleId);
        this.ctx.fillStyle = style.fg;
        this.ctx.font = style.fontString(this.metrics);

        const textX = charWidth * start + gutterWidth + editorPadding;
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

      this.ctx.fillText(`${i + 1}`, gutterPadding / 2, y + baseline);
    }
  }
}
