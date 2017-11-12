// @flow

import { elt } from '../utils/dom';
import { STYLE_SELECTION, STYLE_HIGHLIGHT } from './style-map';

// TODO: move theming to its own file?
const COLOR_SELECTION = 'rgba(0, 0, 255, 0.5)';
const COLOR_HIGHLIGHT = 'rgba(255, 215, 0, 0.5)';
const COLOR_CURSOR = '#FF0000';
const COLOR_BACKGROUND = '#FFFFFF';
const COLOR_FOREGROUND = '#000000';

export default class Canvas {
  // Parent view class.
  _view: any;

  // The actual canvas.
  _canvas: HTMLCanvasElement;

  // Canvas context.
  _ctx: any;

  // TODO: rethink this...
  _viewportFrom: number = 0;

  constructor(view: any, opts: any) {
    this._view = view;

    this._canvas = view._wrapper.appendChild(elt('canvas'));
    this._canvas.style.display = 'block';

    // TODO: I would like to try and make a renderer using `getContext('webgl');`
    // It seems rather difficult to use WebGL to render text...
    // Here are some future resources to get started:
    // https://webglfundamentals.org/webgl/lessons/webgl-text-glyphs.html
    // https://stackoverflow.com/questions/24525410/possible-to-draw-a-string-hello-world-as-a-texture-at-run-time
    // https://stackoverflow.com/questions/25319040/display-text-with-webgl
    // https://www.eventbrite.com/engineering/its-2015-and-drawing-text-is-still-hard-webgl-threejs/
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
    this._ctx.fillStyle = COLOR_BACKGROUND;
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
      this._ctx.fillStyle = COLOR_SELECTION;
      const selections = line.styles.filter((span) => span.style == STYLE_SELECTION);
      selections.forEach((span) => {
        const start = span.range.start * charWidth;
        const end = span.range.length * charWidth;
        this._ctx.fillRect(start, y, end, lineHeight);
      });

      // Draw highlight(s).
      this._ctx.fillStyle = COLOR_HIGHLIGHT;
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
      this._ctx.fillStyle = COLOR_CURSOR;
      line.cursor.forEach((ch) => {
        this._ctx.fillRect((ch * charWidth), y, 2, lineHeight);
      });

      // Draw text.
      this._ctx.fillStyle = COLOR_FOREGROUND;
      this._ctx.fillText(line.text, 0, y + baseline);
    }
  }
}


// // TODO: could block for ~1ms waiting for missing lines to arrive
// guard let line = getLine(lineIx) else { continue }
// let s = line.text
// var attrString = NSMutableAttributedString(string: s, attributes: dataSource.textMetrics.attributes)
// /*
// let randcolor = NSColor(colorLiteralRed: Float(drand48()), green: Float(drand48()), blue: Float(drand48()), alpha: 1.0)
// attrString.addAttribute(NSForegroundColorAttributeName, value: randcolor, range: NSMakeRange(0, s.utf16.count))
// */
// dataSource.styleMap.applyStyles(text: s, string: &attrString, styles: line.styles)
// for c in line.cursor {
//     let cix = utf8_offset_to_utf16(s, c)

//     self.cursorPos = (lineIx, cix)
//     if (markedRange().location != NSNotFound) {
//         let markRangeStart = cix - markedRange().length
//         if (markRangeStart >= 0) {
//             attrString.addAttribute(NSAttributedStringKey.underlineStyle,
//                                     value: NSUnderlineStyle.styleSingle.rawValue,
//                                     range: NSMakeRange(markRangeStart, markedRange().length))
//         }
//     }
//     if (selectedRange().location != NSNotFound) {
//         let selectedRangeStart = cix - markedRange().length + selectedRange().location
//         if (selectedRangeStart >= 0) {
//             attrString.addAttribute(NSAttributedStringKey.underlineStyle,
//                                     value: NSUnderlineStyle.styleThick.rawValue,
//                                     range: NSMakeRange(selectedRangeStart, selectedRange().length))
//         }
//     }
// }

// let y = dataSource.textMetrics.linespace * CGFloat(lineIx + 1);
// attrString.draw(with: NSRect(x: x0, y: y, width: dirtyRect.origin.x + dirtyRect.width - x0, height: 14), options: [])
// if showBlinkingCursor {
//     for cursor in line.cursor {
//         let ctline = CTLineCreateWithAttributedString(attrString)
//         /*
//         CGContextSetTextMatrix(context, CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: x0, ty: y))
//         CTLineDraw(ctline, context)
//         */
//         var pos = CGFloat(0)
//         // special case because measurement is so expensive; might have to rethink in rtl
//         if cursor != 0 {
//             let utf16_ix = utf8_offset_to_utf16(s, cursor)
//             pos = CTLineGetOffsetForStringIndex(ctline, CFIndex(utf16_ix), nil)
//         }
//         cursorColor.setStroke()
//         context.setShouldAntialias(false)
//         context.move(to: CGPoint(x: x0 + pos, y: y + dataSource.textMetrics.descent))
//         context.addLine(to: CGPoint(x: x0 + pos, y: y - dataSource.textMetrics.ascent))
//         context.strokePath()
//         context.setShouldAntialias(true)
//               }
// }
