import { elt, on, clamp } from '../../utils/dom';
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

    this.resize();

    this.metrics.on('update', () => this.updateViewport());
  }

  private scrollCanvas(event: MouseWheelEvent) {
    const { deltaX, deltaY } = event;
    const nLines = this.lineCache.lines.length;
    const lineHeight = this.metrics.lineHeight();

    this.x = clamp(this.x + deltaX, 0, 0);
    this.y = clamp(this.y + deltaY, 0, Math.max(nLines * lineHeight - this.height, 0));

    this.updateViewport();
    this.render();
  }

  private updateViewport() {
    this.width = this.canvas.width / this.devicePixelRatio;
    this.height = this.canvas.height / this.devicePixelRatio;
  }

  public resize() {
    const { width, height } = this.wrapper.getBoundingClientRect();

    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

    this.updateViewport();
    this.render();
  }

  // TODO: more sophisticated scrolling: ie, momentum scrolling, use native div
  // wrapper, scrollbars, etc
  public scrollTo(line: number, char: number) {
    const lineHeight = this.metrics.lineHeight();
    const charWidth = this.metrics.charWidth();

    const linePos = lineHeight * line;
    const charPos = charWidth * char;

    if (linePos < this.y) {
      this.y = linePos;
    } else if (linePos > this.y + this.height - lineHeight) {
      this.y = linePos - this.height + lineHeight;
    }

    if (charPos < this.x) {
      this.x = charPos;
    } else if (charPos > this.x + this.width - charWidth) {
      this.x = charPos - this.width + charWidth;
    }

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
      x: 0,
      y: lineHeight * i - yDiff,
      line: this.lineCache.get(first + i)
    });

    // First pass, for drawing background selections and search highlights.
    for (let i = 0; i <= last; ++i) {
      const { x, y, line } = getLineData(i);
      if (!line || !line.containsReservedStyle()) { continue; }

      // Draw selection(s).
      this.ctx.fillStyle = COLORS.SELECTION;
      const selections = line.styles.filter((span) => span.style == STYLES.SELECTION);
      selections.forEach((span) => {
        const start = span.range.start * charWidth;
        const end = span.range.length * charWidth;
        this.ctx.fillRect(start, y, end, lineHeight);
      });

      // Draw highlight(s).
      this.ctx.fillStyle = COLORS.HIGHLIGHT;
      const highlights = line.styles.filter((span) => span.style == STYLES.HIGHLIGHT);
      highlights.forEach((span) => {
        const start = span.range.start * charWidth;
        const end = span.range.length * charWidth;
        this.ctx.fillRect(start, y, end, lineHeight);
      });
    }

    // Second pass, for actually rendering text.
    for (let i = 0; i <= last; ++i) {
      const { x, y, line } = getLineData(i);
      if (!line) { continue; }

      // Draw cursor(s).
      this.ctx.fillStyle = COLORS.CURSOR;
      line.cursor.forEach((ch) => {
        this.ctx.fillRect((ch * charWidth), y, 2, lineHeight);
      });

      const textY = y + baseline;
      line.styles.forEach((styleSpan) => {
        const { style: styleId, range: { start, length } } = styleSpan;

        const style = getStyle(styleId);
        this.ctx.fillStyle = style.fg;
        this.ctx.font = style.fontString(this.metrics);

        const textX = charWidth * start;
        this.ctx.fillText(line.text.substr(start, length), textX, textY);
      });
    }
  }
}

const colors = {
  '2': 'green',
  '3': 'red',
  '4': 'blue',
  '5': 'black',
  '6': 'orange',
};