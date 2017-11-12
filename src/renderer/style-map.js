class Range {
  start: number;
  length: number;

  constructor(start, length) {
    this.start = start;
    this.length = length;
  }
}

type StyleIdentifier = number;
export const STYLE_SELECTION: StyleIdentifier = 0;
export const STYLE_HIGHLIGHT: StyleIdentifier = 1;
export const N_RESERVED_STYLES: StyleIdentifier = 2;

export const COLORS = {
  SELECTION:  'rgba(0, 0, 255, 0.5)',
  HIGHLIGHT:  'rgba(255, 215, 0, 0.5)',
  CURSOR:     '#FF0000',
  BACKGROUND: '#FFFFFF',
  FOREGROUND: '#000000',
};

// A basic type representing a range of text and and a style identifier.
export class StyleSpan {
  range: Range;
  style: StyleIdentifier;

  // Given a line of text and an array of style values, generate an array of StyleSpans.
  // see https://github.com/google/xi-editor/blob/protocol_doc/doc/update.md
  static stylesFromRaw(raw, text) {
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

  constructor(range, style) {
    this.range = range;
    this.style = style;
  }
}
