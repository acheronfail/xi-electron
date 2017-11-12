import { elt } from '../../../utils/dom';
import { STYLE_SELECTION, STYLE_HIGHLIGHT, COLORS } from '../../style-map';

export default class CanvasView {
  // The actual canvas.
  _canvas: HTMLCanvasElement;

  // Canvas context.
  _ctx: any;

  constructor(place: HTMLElement, opts: any) {
    this._canvas = place.appendChild(elt('canvas'));
    this._canvas.style.display = 'block';

    this._ctx = this._canvas.getContext('2d');

    // Render canvas appropriately on hi-def screens (retina).
    if (window.devicePixelRatio) {
      const { width, height } = this._canvas;

      this._canvas.width = width * window.devicePixelRatio;
      this._canvas.height = height * window.devicePixelRatio;
      this._canvas.style.width = `${width}px`;
      this._canvas.style.height = `${height}px`;
      this._ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  // Renders the document onto the canvas.
  render(lineCache: any, metrics: any) {
    const baseline = metrics.baseline();
    const charWidth = metrics.charWidth();
    const lineHeight = metrics.lineHeight();

    // Clear canvas.
    this._ctx.fillStyle = COLORS.BACKGROUND;
    this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    // Set font.
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font
    // TODO: when do I need to set/reset this?
    this._ctx.font = metrics.fontString();

    const first = 0;
    const last = Math.ceil(this._canvas.height / lineHeight);

    lineCache.computeMissing(first, last).forEach((tuple) => {
      console.log(`Requesting missing: ${tuple[0]}..${tuple[1]}`);
      // TODO: sendRpcAsync("request_lines", params: [f, l])
    });

    // First pass, for drawing background selections and search highlights.
    for (let i = first; i < last; ++i) {
      const line = lineCache.get(i);
      if (!line || !line.containsReservedStyle()) continue;

      const y = lineHeight * (i);

      // Draw selection(s).
      this._ctx.fillStyle = COLORS.SELECTION;
      const selections = line.styles.filter((span) => span.style == STYLE_SELECTION);
      selections.forEach((span) => {
        const start = span.range.start * charWidth;
        const end = span.range.length * charWidth;
        this._ctx.fillRect(start, y, end, lineHeight);
      });

      // Draw highlight(s).
      this._ctx.fillStyle = COLORS.HIGHLIGHT;
      const highlights = line.styles.filter((span) => span.style == STYLE_HIGHLIGHT);
      highlights.forEach((span) => {
        const start = span.range.start * charWidth;
        const end = span.range.length * charWidth;
        this._ctx.fillRect(start, y, end, lineHeight);
      });
    }

    // Second pass, for actually rendering text.
    for (let i = first; i < last; ++i) {
      const line = lineCache.get(i);
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
