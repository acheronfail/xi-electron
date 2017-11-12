import { StyleSpan, N_RESERVED_STYLES } from './style-map';

// Represents a single line, including rendering information.
class Line {

  text: string;
  styles: StyleSpan[];
  cursor: number[];

  static fromJSON({ text, cursor, styles }) {
    const line = new Line();
    line.text = text;
    line.cursor = cursor || [];
    if (styles) {
      line.styles = StyleSpan.stylesFromRaw(styles, text);
    } else {
      line.styles = [];
    }
    return line;
  }

  static updateFromJSON(line, { cursor, styles }) {
    if (!line) return null;
    if (cursor) line.cursor = cursor;
    if (styles) line.styles = styles;
    return line;
  }

  containsCursor() {
    return this.cursor.length > 0;
  }

  containsReservedStyle() {
    return this.styles.every((span) => span.style < N_RESERVED_STYLES);
  }
}


// Keeps a "window" cache of a view which is inside xi-core.
export default class LineCache {
  constructor() {
    this.nInvalidBefore = 0;
    this.nInvalidAfter = 0
    this.lines = [];
  }

  height() {
    return this.nInvalidBefore + this.lines.length + this.nInvalidAfter;
  }

  // A boolean value indicating whether or not the linecache contains any text.
  // - Note: An empty line cache will still contain a single empty line, this
  // is sent as an update from the core after a new document is created.
  isEmpty() {
    return lines.length == 0 || (lines.length == 1 && lines[0].text == "");
  }

  get(i) {
    if (i < this.nInvalidBefore) return null;
    i -= this.nInvalidBefore;
    if (i < this.lines.length) return this.lines[i];
    return null;
  }

  applyUpdate(update: any) {
    if (!update.ops) return;

    let newInvalidBefore = 0;
    let newInvalidAfter = 0;
    let newLines = [];
    let oldIndex = 0;

    const ops = update.ops;
    for (let i = 0; i < ops.length; ++i) {
      const { n, op: op_type } = ops[i];
      if (!op_type || !n) return;

      switch (op_type) {
        case 'invalidate':
          if (newLines.length == 0) {
            newInvalidBefore += n;
          } else {
            newInvalidAfter += n;
          }
          break;

        case 'ins':
          for (let i = 0; i < newInvalidAfter; ++i) newLines.push(null);
          newInvalidAfter = 0;

          const { lines } = ops[i];
          if (!lines) return;

          for (let i = 0; i < lines.length; ++i) {
            newLines.push(Line.fromJSON(lines[i]));
          }
          break;

        case 'copy':
        case 'update':
          let nRemaining = n;
          if (oldIndex < this.nInvalidBefore) {
            let nInvalid = Math.min(n, this.nInvalidBefore - oldIndex);
            if (newLines.length == 0) {
              newInvalidBefore += nInvalid;
            } else {
              newInvalidAfter += nInvalid;
            }
            oldIndex += nInvalid;
            nRemaining -= nInvalid;
          }

          if (nRemaining > 0 && oldIndex < this.nInvalidBefore + this.lines.length) {
            for (let i = 0; i < newInvalidAfter; ++i) newLines.push(null);
            newInvalidAfter = 0;

            let nCopy = Math.min(nRemaining, this.nInvalidBefore + this.lines.length - oldIndex);
            let start = oldIndex - this.nInvalidBefore;
            if (op_type == 'copy') {
              newLines.push(...this.lines.slice(start, start + nCopy));
            } else {
              const { lines } = ops[i];
              if (!lines) return;

              let jsonIndex = n - nRemaining;
              for (let i = start; i < start + nCopy; ++i) {
                newLines.push(Line.updateFromJSON(this.lines[i], lines[jsonIndex]));
                jsonIndex++;
              }
            }
            oldIndex += nCopy;
            nRemaining -= nCopy;
          }

          if (newLines.length == 0) {
            newInvalidBefore += nRemaining;
          } else {
            newInvalidAfter += nRemaining;
          }
          oldIndex += nRemaining;
          break;

        case 'skip':
          oldIndex += n;
        default:
          console.error(`Unknown op type: "${op_type}".`);
      }
    }
    this.nInvalidBefore = newInvalidBefore;
    this.nInvalidAfter = newInvalidAfter;
    this.lines = newLines;
  }

  // Return ranges of invalid lines within the given range.
  computeMissing(first, last) {
    const result = [];
    last = Math.min(last, this.height());
    if (first >= last) {
      console.error('compute missing called with first > last');
      return result;
    }

    for (let i = first; i < last; ++i) {
      if (i < this.nInvalidBefore || i >= (this.nInvalidBefore + this.lines.length) || this.lines[i - this.nInvalidBefore] == null) {
        if (result.length == 0 || result[result.length - 1][1] != i) {
          result.push([i, i + 1]);
        } else {
          result[result.length - 1][1] = i + 1;
        }
      }
    }
    return result;
  }
}
