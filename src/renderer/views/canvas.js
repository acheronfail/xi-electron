// @flow

import { elt } from '../../utils/dom';
import { STYLES } from '../style-map';
import { COLORS } from '../theme';

import type { View, ViewOptions, Viewport } from './index';
import type ViewController from '../view-controller';
import type FontMetrics from '../font-metrics';
import type LineCache from '../line-cache';

export default class CanvasView implements View {

  // View's wrapper element.
  _wrapper: any;

  // The actual canvas.
  _canvas: any;

  // Canvas context.
  _ctx: any;

  // Parent ViewController's FontMetrics.
  _metrics: FontMetrics;

  // Parent ViewController's LineCache.
  _lineCache: LineCache;

  // Pixel ratio of the canvas. Used to render canvas appropriately on hi-def
  // screens (retina).
  _devicePixelRatio: number = (window.devicePixelRatio || 1);

  // The line at the top of the view, and character at the left.
  _viewTop: number = 0;
  _viewLeft: number = 0;

  // How many lines/chars are visible in the view.
  _viewLines: number = 0;
  _viewChars: number = 0;

  constructor(controller: ViewController,  opts: ViewOptions) {
    this._wrapper = controller._wrapper;
    this._metrics = controller._metrics;
    this._lineCache = controller._lineCache;

    this._canvas = this._wrapper.appendChild(elt('canvas'));
    this._canvas.style.display = 'block';
    this._ctx = this._canvas.getContext('2d');

    this.resize();

    this._metrics.on('update', () => this._updateViewport());
  }

  // Calculates how many lines/chars fit in the canvas.
  _updateViewport() {
    const charWidth = this._metrics.charWidth();
    const lineHeight = this._metrics.lineHeight();
    this._viewChars = Math.floor((this._canvas.width / charWidth) / this._devicePixelRatio);
    this._viewLines = Math.floor((this._canvas.height / lineHeight) / this._devicePixelRatio);
  }

  resize() {
    const { width, height } = this._wrapper.getBoundingClientRect();

    this._canvas.width = width * this._devicePixelRatio;
    this._canvas.height = height * this._devicePixelRatio;
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;
    this._ctx.scale(this._devicePixelRatio, this._devicePixelRatio);

    this._updateViewport();
    this._ctx.font = this._metrics.fontString();
    this.render();
  }

  // TODO: more sophisticated scrolling: ie, momentum scrolling, use native div
  // wrapper, scrollbars, etc
  scrollTo(line: number, char: number) {
    if (line < this._viewTop) {
      this._viewTop = line;
    } else if (line >= this._viewTop + this._viewLines) {
      this._viewTop = line - this._viewLines + 1;
    }

    if (char < this._viewLeft) {
      this._viewLeft = char;
    } else if (char >= this._viewLeft + this._viewChars) {
      this._viewLeft = char - this._viewChars + 1;
    }

    this.render();
  }

  // Returns an object with measurements about the current viewport: "top" and
  // "height" are measured in lines, "left" and "width" in chars.
  getViewport(): Viewport {
    return {
      top:    this._viewTop,
      height: this._viewLines,
      left:   this._viewLeft,
      width:  this._viewChars
    }
  }

  // Renders the document onto the canvas.
  // TODO: left/right scrolling
  render() {
    const baseline = this._metrics.baseline();
    const charWidth = this._metrics.charWidth();
    const lineHeight = this._metrics.lineHeight();

    // Clear canvas.
    this._ctx.fillStyle = COLORS.BACKGROUND;
    this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    const first = this._viewTop;
    const last = first + this._viewLines;

    this._lineCache.computeMissing(first, last).forEach((tuple) => {
      console.log(`[TODO] Requesting missing: ${tuple[0]}..${tuple[1]}`);
      // TODO: sendRpcAsync("request_lines", params: [f, l])
    });

    // First pass, for drawing background selections and search highlights.
    for (let i = 0; i <= this._viewLines; ++i) {
      const line = this._lineCache.get(first + i);
      if (!line || !line.containsReservedStyle()) continue;

      const y = lineHeight * (i);

      // Draw selection(s).
      this._ctx.fillStyle = COLORS.SELECTION;
      const selections = line.styles.filter((span) => span.style == STYLES.SELECTION);
      selections.forEach((span) => {
        const start = span.range.start * charWidth;
        const end = span.range.length * charWidth;
        this._ctx.fillRect(start, y, end, lineHeight);
      });

      // Draw highlight(s).
      this._ctx.fillStyle = COLORS.HIGHLIGHT;
      const highlights = line.styles.filter((span) => span.style == STYLES.HIGHLIGHT);
      highlights.forEach((span) => {
        const start = span.range.start * charWidth;
        const end = span.range.length * charWidth;
        this._ctx.fillRect(start, y, end, lineHeight);
      });
    }

    // Second pass, for actually rendering text.
    for (let i = 0; i <= this._viewLines; ++i) {
      const line = this._lineCache.get(first + i);
      if (!line) continue;

      const y = lineHeight * (i);

      // Draw cursor(s).
      this._ctx.fillStyle = COLORS.CURSOR;
      line.cursor.forEach((ch) => {
        this._ctx.fillRect((ch * charWidth), y, 2, lineHeight);
      });

      // Draw text.
      this._ctx.fillStyle = COLORS.FOREGROUND;
      this._ctx.fillText(line.text, 0, y + baseline);
    }
  }
}
