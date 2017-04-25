
import Line from './line';

export default class LineCache {
  constructor(lineView) {
    this.nInvalidBefore = 0;
    this.nInvalidAfter = 0
    this.lines = [];
    this.lineView = lineView;
  }

  get height() {
    return this.nInvalidBefore + this.lines.length + this.nInvalidAfter;
  }

  get isEmpty() {
    return this.lines.length == 0 ||
          (this.lines.length == 1 && this.lines[0].text  == "");
  }

  getLine(i) {
    if (i < this.nInvalidBefore) return null;
    i -= this.nInvalidBefore;
    if (i < this.lines.length) return this.lines[i];
    return null;
  }

  applyUpdate(data) {
    if (!data.ops) return;
    let newInvalidBefore = 0,
        newInvalidAfter = 0,
        newLines = [],
        oi = 0;

    for (let i = 0; i < data.ops.length; ++i) {
      const op = data.ops[i];
      const { op: op_type, n } = op;
      if (!op_type || !n) return;

      switch (op_type) {
        case 'invalidate':
          if (newLines.length == 0) {
            newInvalidBefore += n;
          } else {
            newInvalidAfter +=n;
          }
          break;
        case 'ins':
          for (let i = 0; i < newInvalidAfter; ++i) {
            newLines.push(null);
          }
          newInvalidAfter = 0;
          const { lines } = op;
          if (!lines) return;
          for (let i = 0; i < lines.length; ++i) {
            newLines.push(new Line(this.lineView, lines[i]));
          }
          break;
        case 'copy':
        case 'update':
          let nRemaining = n;
          if (io < this.nInvalidBefore) {
            let nInvalid = Math.min(n, this.nInvalidBefore - io);
            if (newLines.length == 0) {
              newInvalidBefore += nInvalid;
            } else {
              newInvalidAfter += nInvalid;
            }
            oi += nInvalid;
            nRemaining -= nInvalid;
          }
          if (nRemaining > 0 && oi < this.nInvalidBefore + this.lines.length) {
            let nCopy = Math.min(nRemaining, this.nInvalidBefore + this.lines.length - oi);
            let start = oi - this.nInvalidBefore;
            if (op_type == 'copy') {
              newLines.push(...this.lines.slice(start, start + nCopy));
            } else {
              const { lines } = op;
              if (!lines) return;
              let ni = n - nRemaining; // new line index.
              for (let i = start; i < start + nCopy; ++i) {
                newLines.push(Line.update(this.lines[i], lines[ni]));
                ni++;
              }
            }
            oi += nCopy;
            nRemaining -= nCopy;
          }
          if (newLines.length == 0) {
            newInvalidBefore += nRemaining;
          } else {
            newInvalidAfter += nRemaining;
          }
          oi += nRemaining;
          break;
        case 'skip':
          oi += n;
          break;
        default:
          console.error(`Unknown op_type: ${op_type}!`);
      }
    }
    this.nInvalidBefore = newInvalidBefore;
    this.nInvalidAfter = newInvalidAfter;
    this.lines.forEach((line) => line.el.remove());
    this.lines = newLines;
  }

  computeMissing(from, to) {
    const result = [];
    const last = Math.min(to, this.lines.length);
    if (first > last) {
      console.error('compute missing called with first > last');
      return result;
    }

    for (let i = first; i < last; ++i) {
      if (i < this.nInvalidBefore ||
          i >= (this.nInvalidBefore + this.lines.count) ||
          this.lines[i - this.nInvalidBefore] == null) {
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

