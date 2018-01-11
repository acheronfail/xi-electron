import { elt } from '../../utils/dom';
import { STYLES } from '../style-map';
import { COLORS } from '../theme';

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

  // The line at the top of the view, and character at the left.
  private viewTop: number = 0;
  private viewLeft: number = 0;

  // How many lines/chars are visible in the view.
  private viewLines: number = 0;
  private viewChars: number = 0;

  constructor(controller: ViewController,  _opts: ViewOptions) {
    this.wrapper = controller.wrapper;
    this.metrics = controller.metrics;
    this.lineCache = controller.lineCache;

    this.canvas = (<HTMLCanvasElement>this.wrapper.appendChild(elt('canvas')));
    this.canvas.style.display = 'block';

    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      this.ctx = ctx;
    } else {
      throw new Error('Could not get CanvasRenderingContext2D');
    }

    this.resize();

    this.metrics.on('update', () => this._updateViewport());
  }

  // Calculates how many lines/chars fit in the canvas.
  _updateViewport() {
    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();
    this.viewChars = Math.floor((this.canvas.width / charWidth) / this.devicePixelRatio);
    this.viewLines = Math.floor((this.canvas.height / lineHeight) / this.devicePixelRatio);
  }

  resize() {
    const { width, height } = this.wrapper.getBoundingClientRect();

    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

    this._updateViewport();
    this.ctx.font = this.metrics.fontString();
    this.render();
  }

  // TODO: more sophisticated scrolling: ie, momentum scrolling, use native div
  // wrapper, scrollbars, etc
  scrollTo(line: number, char: number) {
    if (line < this.viewTop) {
      this.viewTop = line;
    } else if (line >= this.viewTop + this.viewLines) {
      this.viewTop = line - this.viewLines + 1;
    }

    if (char < this.viewLeft) {
      this.viewLeft = char;
    } else if (char >= this.viewLeft + this.viewChars) {
      this.viewLeft = char - this.viewChars + 1;
    }

    this.render();
  }

  // Returns an object with measurements about the current viewport: "top" and
  // "height" are measured in lines, "left" and "width" in chars.
  getViewport(): Viewport {
    return {
      top:    this.viewTop,
      height: this.viewLines,
      left:   this.viewLeft,
      width:  this.viewChars
    };
  }

  // Renders the document onto the canvas.
  // TODO: left/right scrolling
  render() {
    const baseline = this.metrics.baseline();
    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();

    // Clear canvas.
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const first = this.viewTop;
    const last = first + this.viewLines;

    this.lineCache.computeMissing(first, last).forEach((tuple) => {
      console.log(`[TODO] Requesting missing: ${tuple[0]}..${tuple[1]}`);
      // TODO: sendRpcAsync("request_lines", params: [f, l])
    });

    // First pass, for drawing background selections and search highlights.
    for (let i = 0; i <= this.viewLines; ++i) {
      const line = this.lineCache.get(first + i);
      if (!line || !line.containsReservedStyle()) { continue; }

      const y = lineHeight * (i);

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
    for (let i = 0; i <= this.viewLines; ++i) {
      const line = this.lineCache.get(first + i);
      if (!line) { continue; }

      const y = lineHeight * (i);

      // Draw cursor(s).
      this.ctx.fillStyle = COLORS.CURSOR;
      line.cursor.forEach((ch) => {
        this.ctx.fillRect((ch * charWidth), y, 2, lineHeight);
      });

      // Draw text.
      this.ctx.fillStyle = COLORS.FOREGROUND;
      this.ctx.fillText(line.text, 0, y + baseline);
    }
  }
}
