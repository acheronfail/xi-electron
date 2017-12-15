/**
 * Simple range class.
 */
class Range {
  start: number = 0;
  length: number = 0;

  /**
   * Create the class.
   * @param  {Number} start  Starting index.
   * @param  {Number} length Length of range.
   */
  constructor(start: number, length: number) {
    this.start = start;
    this.length = length;
  }
}

export const N_RESERVED_STYLES = 2;
export const STYLES = {
  SELECTION: 0,
  HIGHLIGHT: 1,
};

export type StyleIdentifier = number;

/**
 * A basic type representing a range of text and and a style identifier.
 */
export class StyleSpan {

  // The range of the span.
  range: Range;

  // The span's style.
  style: StyleIdentifier;

  /**
   * Given a line of text and an array of style values, generate an array of
   * StyleSpans.
   *   See https://github.com/google/xi-editor/blob/protocol_doc/doc/update.md
   * @param  {Array} raw    Array (sorted in 3-length-tuples) of spans.
   * @param  {String} text The text of the line.
   * @return {Array}        Generated StyleSpan array.
   */
  static stylesFromRaw(raw: number[], text: string): StyleSpan[] {
    const styles = [];
    let pos = 0;
    for (let i = 0; i < raw.length; i += 3) {
      const start = pos + raw[i];
      const end = start + raw[i + 1];
      const style = raw[i + 2];

      // // TODO: offsets and utf16 ???
      // // SWIFT from xi-mac:
      // let startIx = utf8_offset_to_utf16(text, start)
      // let endIx = utf8_offset_to_utf16(text, end)
      // if startIx < 0 || endIx < startIx {
      //     //FIXME: how should we be doing error handling?
      //     print("malformed style array for line:", text, raw)
      // } else {
      //     out.append(StyleSpan(range: NSMakeRange(startIx, endIx - startIx), style: style))
      // }

      styles.push(new StyleSpan(new Range(start, end - start), style));
      pos += end;
    }
    return styles;
  }

  /**
   * Create the StyleSpan.
   * @param  {Range}           range The range of the StyleSpan.
   * @param  {StyleIdentifier} style The style's type or identifier.
   */
  constructor(range: Range, style: StyleIdentifier) {
    this.range = range;
    this.style = style;
  }
}
