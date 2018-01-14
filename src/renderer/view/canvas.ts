import { elt, on } from '../../utils/dom';
import { clamp, nDigits } from '../../utils/misc';
import { COLORS } from '../style-map';

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
    this.metrics = controller.metrics;
    this.lineCache = controller.lineCache;

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
      const charWidth = this.metrics.charWidth();
      this.gutterChars = nDigits(this.lineCache.height());
      this.gutterWidth = this.gutterChars * charWidth + this.gutterPadding[0];
    } else {
      this.gutterWidth = 0;
    }
  }

  // Smoothly scrolls the canvas after MouseWheelEvents.
  private scrollCanvas(event: MouseWheelEvent) {
    let { deltaX, deltaY } = event;
    // TODO: how to get max width? currently this is a bit of a hack with `this.nChars`...
    const { charStart, charEnd, lineStart, lineEnd } = this.getViewport();
    const nChars = this.nChars + (charStart - charEnd);

    let nLines;
    if (this.scrollPastEnd) {
      nLines = this.lineCache.height();
    } else {
      nLines = this.lineCache.height() + lineStart - lineEnd;
    }

    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();

    // FIXME: the value of deltaY are relative to the browsers dpi - ie, the devicePixelRatio
    // so, that's the reason it's out of whack below...
    this.x = clamp(this.x + deltaX, 0, Math.max(nChars * charWidth, 0));
    this.y = clamp(this.y + deltaY, 0, Math.max(((nLines - 1) * lineHeight) / 2, 0));

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

    this.width = this.canvas.width / this.scale;
    this.height = this.canvas.height / this.scale;
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

    // FIXME: ratio!?
    const char = Math.round(((x + this.x) - this.gutterWidth - (charWidth / 2)) / charWidth);
    const line = Math.round(((y + (this.y * this.scale)) - (lineHeight / 2)) / lineHeight);

    return [line, char];
  }

  // TODO: scroll margins
  /**
   * Scrolls so that the given "line" and "char" are visible in the view.
   * @param  {number} line Line number.
   * @param  {number} char Column number.
   */
  public scrollTo(line: number, char: number) {
    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();

    const linePos = lineHeight * line;
    const charPos = charWidth * char;

    // FIXME: TODO: WHAT: why is it `this.scale` applies only for `y` values?

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

    this.render();
  }

  /**
   * Get information about the currently visible viewport of the editor.
   * @return {Object} An object with measurements about the current viewport.
   */
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

  /**
   * Renders the document onto the canvas.
   */
  public render() {
    const baseline = this.metrics.baseline();
    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();
    const { editorPadding, gutterPadding, gutterWidth } = this;
    const xOffset = gutterWidth + editorPadding[0] - this.x;

    // Reset canvas.
    // TODO: at some stage in the future we should employ a tiling approach. Only draw tiles, cache
    // their contents, and invalidate/redraw them only when necessary. This way we only redraw what's
    // necessary rather than triggering a redraw each and every render.
    this.ctx.font = this.metrics.fontString();
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Get lines to draw and screen coords.
    const firstChar = Math.floor(this.x / charWidth);
    const lastChar = Math.ceil((this.width - xOffset) / charWidth);
    const firstLine = Math.floor(this.y / lineHeight);
    const lastLine = Math.ceil((this.y + this.height) / lineHeight);

    this.lineCache.computeMissing(firstLine, lastLine);

    const getLineData = (i: number) => ({
      y: (lineHeight * i) - (this.y % lineHeight) - this.y,
      line: this.lineCache.get(firstLine + i)
    });

    // First pass, for drawing background selections and search highlights.
    for (let i = firstLine; i <= lastLine; ++i) {
      const { line, y } = getLineData(i);
      if (!line || !line.containsReservedStyle()) { continue; }

      // Draw selection(s).
      const selections = line.styles.filter((span) => span.style.isSelection());
      if (selections.length) {
        this.ctx.fillStyle = selections[0].style.bg;
        selections.forEach(({ range: { start, length } }) => {
          this.ctx.fillRect((charWidth * start) + xOffset, y, charWidth * length, lineHeight);
        });
      }

      // Draw highlight(s).
      const highlights = line.styles.filter((span) => span.style.isHighlight());
      if (highlights.length) {
        this.ctx.fillStyle = highlights[0].style.bg;
        highlights.forEach(({ range: { start, length } }) => {
          this.ctx.fillRect((charWidth * start) + xOffset, y, charWidth * length, lineHeight);
        });
      }
    }

    // Second pass, for actually rendering text.
    this.ctx.save();
    for (let i = firstLine; i <= lastLine; ++i) {
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
      line.cursor.forEach((ch) => {
        this.ctx.fillRect((ch * charWidth) + xOffset, y, 2, lineHeight);
      });

      // Draw text.
      // NOTE: batching similar font styles (across all lines) may increase performance because
      // switching the canvas state can be expensive.
      const textY = y + baseline;
      for (let i = 0; i < line.styles.length; ++i) {
        const { style, range: { start, length } } = line.styles[i];
        if (start + length < firstChar) { continue; }
        if (start > lastChar) { break; }

        this.ctx.fillStyle = style.fg;
        this.ctx.font = style.fontString(this.metrics);

        let a = start;
        let b = length;
        let textX = (charWidth * start) + xOffset;

        // Clip start of text.
        if (start < firstChar) {
          const diff = firstChar - start;
          a = firstChar;
          b -= diff;
          textX = (charWidth * firstChar) + xOffset;
        }

        // Clip end of text.
        if (start + length > lastChar) {
          const diff = start + length - lastChar;
          b -= diff;
        }

        const text = line.text.substr(a, b);
        if (text.length > 0) {
          this.ctx.fillText(text, textX, textY);
        }
      }
    }
    this.ctx.restore();

    if (!this.drawGutter) { return; }

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
    for (let i = firstLine; i <= lastLine; ++i) {
      const { line, y } = getLineData(i);
      if (!line) { continue; }

      // Right-align gutter text.
      let text = `${firstLine + i + 1}`;
      text = ' '.repeat(this.gutterChars - text.length) + text;
      this.ctx.fillText(text, gutterPadding[0] / 2, y + baseline);
    }
  }
}

/**
 * TODO:
 *  - make drawing the gutter optional
 *  - implement blinking cursors
 *  - find a better way to get the longest line in editor
 *  - invalidate parts of the canvas, to decrease load
 *  - simplify calculations with `this.scale`
 *    - introduce custom dpi scaling? (https://github.com/niklasvh/html2canvas/pull/1087/files)
 *  - when `metrics` are updated, get current scrollTo pos then `scrollTo` and `render`
 */