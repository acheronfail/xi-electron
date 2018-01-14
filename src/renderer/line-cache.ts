import { StyleSpan, N_RESERVED_STYLES } from './style-map';
import EventEmitter from '../utils/emitter';
import { CoreMethod } from './types/core';

/**
 * Represents a single line, including rendering information.
 */
export class Line {

  public text: string;

  public styles: StyleSpan[];

  public cursor: number[];

  /**
   * Create a line from the given JSON object (from xi-core).
   * @param  {Object} data The JSON data.
   * @return {Line}        Newly created Line class.
   */
  public static fromJSON(data: { text: string, cursor: number[], styles: number[] }): Line {
    const { text, cursor, styles } = data;
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

  /**
   * Update a given line from the given JSON object (from xi-core).
   * @param  {Line}   line The Line to update.
   * @param  {Object} data The JSON data.
   * @return {Line}        The given Line class.
   */
  public static updateFromJSON(data: { cursor: number[], styles: StyleSpan[] }, line?: Line, ): Line | null {
    const { cursor, styles } = data;
    if (!line) { return null; }
    if (cursor) { line.cursor = cursor; }
    if (styles) { line.styles = styles; }
    return line;
  }

  /**
   * Check if the line contains a cursor.
   * @return {Boolean} Whether or not it does contain a cursor.
   */
  containsCursor(): boolean {
    return this.cursor.length > 0;
  }

  /**
   * Check if the line contains a reserved style.
   * @return {Boolean} Whether or not it does contain a reserved style.
   */
  containsReservedStyle(): boolean {
    return this.styles.length > 0 && this.styles.some(({ style }) => style.isReservedStyle());
  }

  toJSON(): { cursor: number[], styles: StyleSpan[] } {
    const { cursor, styles } = this;
    return { cursor, styles };
  }
}

/**
 * Keeps a "window" (or cache) of a view which is inside xi-core.
 */
export default class LineCache extends EventEmitter {

  // Amount of lines invalid before and after our valid window of cached lines.
  private nInvalidBefore: number = 0;
  private nInvalidAfter: number = 0;

  // Our window of cached lines.
  public lines: Array<Line | null> = [];

  /**
   * Return the height (amount of lines) currently within the cache.
   * @return {Number} Amount of lines.
   */
  height(): number {
    return this.nInvalidBefore + this.lines.length + this.nInvalidAfter;
  }

  /**
   * A boolean value indicating whether or not the linecache contains any text.
   *   Note: An empty line cache will still contain a single empty line, this
   *   is sent as an update from the core after a new document is created.
   * @return {Boolean} Whether or not the line is empty.
   */
  isEmpty(): boolean {
    return this.lines.length == 0 || (this.lines.length == 1 && (<Line>this.lines[0]).text == '');
  }

  /**
   * Get the text of the line at the given index.
   * @param  {Number} i Desired index.
   * @return {String}   The text of the line at i, or null if none exists.
   */
  get(i: number): Line | null {
    if (i < this.nInvalidBefore) { return null; }
    i -= this.nInvalidBefore;
    if (i < this.lines.length) { return this.lines[i]; }
    return null;
  }

  /**
   * Apply an update to the cache with data given the xi-core.
   * @param {Object} update The update from xi-core.
   */
  applyUpdate(data: any): void {
    if (!data.ops) { return; }

    let newInvalidBefore = 0;
    let newInvalidAfter = 0;
    let newLines = [];
    let oldIndex = 0;

    const ops = data.ops;
    for (let i = 0; i < ops.length; ++i) {
      const { n, op: op_type } = ops[i];
      if (!op_type || !n) { return; }

      switch (op_type) {
        case 'invalidate': {
          if (newLines.length == 0) {
            newInvalidBefore += n;
          } else {
            newInvalidAfter += n;
          }
          break;
        }

        case 'ins': {
          for (let i = 0; i < newInvalidAfter; ++i) { newLines.push(null); }
          newInvalidAfter = 0;

          const { lines } = ops[i];
          if (!lines) { return; }

          for (let i = 0; i < lines.length; ++i) {
            const line = Line.fromJSON(lines[i]);
            newLines.push(line);
          }
          break;
        }

        case 'copy':
        case 'update': {
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
            for (let i = 0; i < newInvalidAfter; ++i) { newLines.push(null); }
            newInvalidAfter = 0;

            let nCopy = Math.min(nRemaining, this.nInvalidBefore + this.lines.length - oldIndex);
            let start = oldIndex - this.nInvalidBefore;
            if (op_type == 'copy') {
              newLines.push(...this.lines.slice(start, start + nCopy));
            } else {
              const { lines } = ops[i];
              if (!lines) { return; }

              let jsonIndex = n - nRemaining;
              for (let i = start; i < start + nCopy; ++i) {
                const line = this.lines[i];
                if (!line) { continue; }
                newLines.push(Line.updateFromJSON(line.toJSON(), lines[jsonIndex]));
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
        }
        case 'skip': {
          oldIndex += n;
          break;
        }
        default: {
          console.error(`Unknown op type: "${op_type}".`);
        }
      }
    }
    this.nInvalidBefore = newInvalidBefore;
    this.nInvalidAfter = newInvalidAfter;
    this.lines = newLines;
    this.emit('update');
  }

  /**
   * Return ranges of invalid lines within the given range. Used to request
   * invalid lines when drawing the editor.
   * @param  {Number} first Starting line of range.
   * @param  {Number} last  Ending line of range.
   * @return {Array}        Array of [[startLine, endLine], ...] ranges.
   */
  computeMissing(first: number, last: number): Array<Array<number>> {
    const ranges: Array<Array<number>> = [];
    last = Math.min(last, this.height());

    if (first >= last) {
      console.error(`compute missing called with first (${first}) >= last (${last})`);
      return ranges;
    }

    for (let i = first; i < last; ++i) {
      if (
        i < this.nInvalidBefore ||
        i >= (this.nInvalidBefore + this.lines.length) ||
        this.lines[i - this.nInvalidBefore] == null
      ) {
        if (ranges.length == 0 || ranges[ranges.length - 1][1] != i) {
          ranges.push([i, i + 1]);
        } else {
          ranges[ranges.length - 1][1] = i + 1;
        }
      }
    }

    // Request missing lines.
    ranges.forEach(([first, last]) => {
      // TODO: should something be done in this case?
      // this.emit(CoreMethod.REQUEST_LINES, [first, last]);
    });

    return ranges;
  }
}
