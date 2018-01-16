import { elt, on, off } from '../../../utils/dom';
import { clamp, nDigits } from '../../../utils/misc';
import { COLORS, StyleSpan } from '../../style-map';

import { View, ViewOptions, Viewport } from '../index';
import ViewController from '../../view-controller';
import LineCache, { Line } from '../../line-cache';
import FontMetrics from './font-metrics';

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

  // Pixel ratio of the canvas. Used to render canvas appropriately on hi-def screens (retina).
  private scale: number = (window.devicePixelRatio || 1);

  // Amount of horizontal pixels the canvas has been scrolled.
  private x: number = 0;

  // Amount of vertical pixels the canvas has been scrolled.
  private y: number = 0;

  // Current width of the canvas's view.
  private width: number = 0;

  // Current height of the canvas's view.
  private height: number = 0;

  // How many characters are in the gutter.
  private gutterChars: number = 0;

  // The current width of the gutter.
  private gutterWidth: number = 0;

  // The editor's padding [x, y].
  private editorPadding: [number, number] = [5, 0];

  // The gutter's padding [x, y].
  private gutterPadding: [number, number] = [20, 0];

  // Whether to scroll past the end of the document or not.
  private scrollPastEnd: boolean = false;

  // Whether or not to draw the gutter.
  private drawGutter: boolean = true;

  // The character length of the longest line of the editor.
  // HACK: need to find a better way of getting the longest line, right now we just update it
  // whenever we render... (also won't decrease it longest line changes)
  private nChars: number = 0;

  constructor(private controller: ViewController,  opts: ViewOptions) {
    this.wrapper = controller.wrapper;
    this.lineCache = controller.lineCache;

    this.metrics = new FontMetrics(this.wrapper, {
      family: 'monospace',
      size: 20
    });

    // Apply custom options.
    ['drawGutter', 'gutterPadding', 'editorPadding', 'scrollPastEnd'].forEach((key) => {
      if (opts[key]) {
        this[key] = opts[key];
      }
    });

    // Create canvas and listen for "mousewheel" events on it.
    this.canvas = (<HTMLCanvasElement>this.wrapper.appendChild(elt('canvas')));
    this.canvas.style.display = 'block';
    on(this.canvas, 'mousewheel', (event) => this.scrollCanvas(event), false);

    // Create a 2D context for rendering.
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      this.ctx = ctx;
    } else {
      throw new Error('Could not get CanvasRenderingContext2D');
    }

    // Listen for updates to `metrics` and `lineCache` and update the view accordingly.
    this.metrics.on('update', () => {
      this.measureGutter();
      // TODO: scrollTo: current position, trigger re-render
      console.warn('unimplemented');
    });
    this.lineCache.on('update', () => this.measureGutter());
  }

  // Measures the size of the gutter.
  private measureGutter() {
    if (this.drawGutter) {
      const asciiWidth = this.metrics.asciiWidth();
      this.gutterChars = nDigits(this.lineCache.height());
      this.gutterWidth = this.gutterChars * asciiWidth + this.gutterPadding[0];
    } else {
      this.gutterWidth = 0;
    }
  }

  // Smoothly scrolls the canvas after MouseWheelEvents.
  private scrollCanvas(event: MouseWheelEvent) {
    let { deltaX, deltaY } = event;
    const { charStart, charEnd, lineStart, lineEnd } = this.getViewport();

    // TODO: how to get max width? currently this is a bit of a hack with `this.nChars`...
    const nChars = this.nChars + (charStart - charEnd);
    let nLines;
    if (this.scrollPastEnd) {
      nLines = this.lineCache.height();
    } else {
      nLines = this.lineCache.height() + lineStart - lineEnd;
    }

    const asciiWidth = this.metrics.asciiWidth();
    const lineHeight = this.metrics.lineHeight();

    this.x = clamp(this.x + deltaX, 0, Math.max(nChars * asciiWidth, 0));
    this.y = clamp(this.y + deltaY, 0, Math.max((nLines - 1) * lineHeight, 0));

    // Send scroll event to inform xi-core of our current viewport.
    this.controller.updateViewport();
    this.render();
  }

  /**
   * Public API
   */

  /**
   * Called whenever the view is resized.
   */
  public resize(width: number, height: number) {
    this.canvas.width = width * this.scale;
    this.canvas.height = height * this.scale;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
     this.ctx.scale(this.scale, this.scale);

    this.width = width;
    this.height = height;
    this.render();
  }

  /**
   * Returns a [line, char] from the given coordinates.
   * @param  {Number}  x       The x coordinate (relative to the view).
   * @param  {Number}  y       The y coordinate (relative to the view).
   * @return {Array}           A [line, char] object of the coordinates at the point.
   */
  public posFromCoords(x: number, y: number): [number, number] {
    const lineHeight = this.metrics.lineHeight();
    const lineNo = Math.round(((y + this.y) - (lineHeight / 2)) / lineHeight);
    const line = this.lineCache.get(lineNo);
    if (!line) {
      throw new Error(`Failed to find line at [x, y]: [${x}, ${y}]`);
    }

    // Account for horizontal scroll and gutter.
    x += this.x - this.gutterWidth;

    // Search from left to right (computing character widths as we go) and find the `x` position.
    // There are better ways to do this (caching character positions in each line, having a B-Tree
    // structure (see CodeMirror), etc) but we'll wait and see if xi-core handles these cases before
    // spending too much time implementing an optimisation that may be overruled by xi-core.
    let left = 0, pos = 0;
    for (const ch of line.text) {
      const charWidth = this.metrics.charWidth(ch);
      if (left < x && x < (left + charWidth)) {
        return [lineNo, line.chTo8Indices[pos]];
      }
      left += charWidth;
      pos += 1;
    }

    // Position wasn't found, return the last character position in the line.
    return [lineNo, line.chTo8Indices[line.chTo8Indices.length - 1]];
  }

  // TODO: scroll margins
  /**
   * Scrolls so that the given "line" and "char" are visible in the view.
   * @param  {number} line Line number.
   * @param  {number} char Column number.
   */
  public scrollTo(line: number, char: number) {
    const asciiWidth = this.metrics.asciiWidth();
    const lineHeight = this.metrics.lineHeight();

    const linePos = lineHeight * line;
    const charPos = asciiWidth * char;

    if (linePos < this.y) {
      this.y = linePos;
    } else if (linePos > this.y + this.height - lineHeight) {
      this.y = linePos - this.height + lineHeight;
    }

    if (charPos < this.x) {
      this.x = charPos;
    } else if (charPos > this.x + this.width - this.gutterWidth - asciiWidth) {
      this.x = charPos + this.gutterWidth + asciiWidth - this.width;
    }

    this.render();
  }

  /**
   * Get information about the currently visible viewport of the editor.
   * @return {Object} An object with measurements about the current viewport.
   */
  public getViewport(): Viewport {
    const asciiWidth = this.metrics.asciiWidth();
    const lineHeight = this.metrics.lineHeight();
    const xOffset = this.gutterWidth - this.editorPadding[0];
    return {
      lineStart: Math.floor(this.y / lineHeight),
      lineEnd: Math.floor((this.height + this.y) / lineHeight),
      charStart: Math.floor(this.x / asciiWidth),
      charEnd: Math.floor((this.width + this.x - xOffset) / asciiWidth),
    };
  }

  /**
   * Renders the document onto the canvas.
   */
  public render() {
    const baseline = this.metrics.baseline();
    const lineHeight = this.metrics.lineHeight();
    const { editorPadding, gutterPadding, gutterWidth } = this;
    const xOffset = gutterWidth + editorPadding[0] - this.x;

    // Reset canvas.
    // TODO: at some stage in the future we could employ a tiling approach. Only draw tiles, cache
    // their contents, and invalidate/redraw them only when necessary. This way we only redraw what's
    // necessary rather than triggering a redraw each and every render.
    this.ctx.font = this.metrics.fontString();
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const { lineStart, lineEnd, charStart, charEnd } = this.getViewport();
    this.lineCache.computeMissing(lineStart, lineEnd);

    const getLineData = (i: number) => ({
      y: (lineHeight * i) - this.y,
      line: this.lineCache.get(i)
    });

    // First pass, for drawing background selections and search highlights.
    for (let i = lineStart; i <= lineEnd; ++i) {
      const { line, y } = getLineData(i);
      if (!line || !line.containsReservedStyle()) { continue; }

      // Draw selection(s) and highlight(s).
      const renderBlock = (styleSpans: StyleSpan[]) => {
        if (styleSpans.length) {
          this.ctx.fillStyle = styleSpans[0].style.bg;
          styleSpans.forEach(({ range: { start, length } }) => {
            const a = line.chTo16Indices[start];
            const b = line.chTo16Indices[start + length];
            const beforeTextWidth = this.metrics.stringWidth(line.text.substring(0, a));
            const textWidth = this.metrics.stringWidth(line.text.substring(a, b));
            this.ctx.fillRect(beforeTextWidth + xOffset, y, textWidth, lineHeight);
          });
        }
      };

      renderBlock(line.styles.filter((span) => span.style.isSelection()));
      renderBlock(line.styles.filter((span) => span.style.isHighlight()));
    }

    // Second pass, for actually rendering text.
    this.ctx.save();
    for (let i = lineStart; i <= lineEnd; ++i) {
      const { line, y } = getLineData(i);
      if (!line) { continue; }

      // FIXME: TODO: bit of a hack atm, will need to reset when longest line is shortened...
      this.nChars = Math.max(this.nChars, line.text.length);

      // Draw cursor(s).
      // TODO: blinking cursors, potential solutions:
      //      - partially invalidate canvas (redraw dirty lines)?
      //      - introduce tiling and re-draw dirty tiles?
      //      - have another transparent canvas on top for selections/highlights/cursors? *
      this.ctx.fillStyle = COLORS.CURSOR;
      line.cursors.forEach((ch) => {
        const textWidth = this.metrics.stringWidth(line.text.substring(0, line.chTo16Indices[ch]));
        this.ctx.fillRect(textWidth + xOffset, y, 2, lineHeight);
      });

      // Draw text.
      // NOTE: batching similar font styles (across all lines) may increase performance because
      // switching the canvas state can be expensive.
      const textY = y + baseline;
      for (let i = 0; i < line.styles.length; ++i) {
        const { style, range: { start, length } } = line.styles[i];
        if (style.isReservedStyle() || start + length < charStart) { continue; }
        if (start > charEnd) { break; }

        this.ctx.fillStyle = style.fg;
        this.ctx.font = style.fontString(this.metrics);

        const a = line.chTo16Indices[Math.max(charStart, start)];
        const b = line.chTo16Indices[Math.min(charEnd, start + length)];
        const textX = this.metrics.stringWidth(line.text.substring(0, a)) + xOffset;

        const text = line.text.substring(a, b);
        if (text.length > 0) {
          this.ctx.fillText(text, textX, textY);
        }
      }
    }
    this.ctx.restore();

    if (this.drawGutter) {
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
      for (let i = lineStart; i <= lineEnd; ++i) {
        const { line, y } = getLineData(i);
        if (!line) { continue; }

        // Right-align gutter text by prepending whitespace.
        const text = `${i + 1}`.padStart(this.gutterChars, ' ');
        this.ctx.fillText(text, gutterPadding[0] / 2, y + baseline);
      }
    }
  }
}

/**
 * TODO:
 *  - implement blinking cursors
 *  - find a better way to get the longest line in editor
 *  - invalidate parts of the canvas, to decrease load
 *  - introduce custom dpi scaling? (https://github.com/niklasvh/html2canvas/pull/1087/files)
 *  - when `metrics` are updated, get current scrollTo pos then `scrollTo` and `render`
 */