import Cursor from './cursor';
import { el } from './utils';

// Line styles.
const STYLE_SEL = 0;

export default class Line {
  constructor(lineView, data) {
    this.lineView = lineView;
    this.spans = el('span', null, 'xi-line-span');
    this.el = lineView.lineContainer.appendChild(el('pre', [this.spans], 'xi-line'));
    this.text = data.text;
    this.styles = data.styles || [];
    this.cursors = data.cursor || [];
    this._cursors = []
    this.render();
  }

  hasSelection() {
    return this.styles.some((s) => s == 0);
  }

  hasCursor() {
    return this.cursors.length > 0;
  }

  highlight(flag) {
    if (this.hasCursor() && !this.hasSelection()) {
      this.el.classList.add('xi-active-line');
    }
  }

  get settings() {
    return this.lineView.settings;
  }

  render() {
    // Remove old cursors, and create new ones.
    this._cursors.forEach((c) => c.el.remove());
    this._cursors.length = 0;
    this.cursors.forEach((ch, i) => {
      this._cursors[i] = new Cursor(this, ch);
    });

    // Highlight line if it contains a cursor.
    if (this.settings.get('view.active-line')) {
      this.highlight();
    } else if (this.el.classList.contains('xi-active-line')) {
      this.el.classList.remove('xi-active-line');
    }

    // Empty spans.
    while (this.spans.lastChild) {
      this.spans.lastChild.remove();
    }

    // Add text and styles.
    if (this.styles.length == 0) {
      this.spans.appendChild(el('span', this.text));
    } else {
      let pos = 0;
      for (let i = 0; i < this.styles.length; i += 3) {
        const start = this.styles[i];
        const end = start + this.styles[i+1];
        const type = this.styles[i+2];

        let cls = '';
        if (type == STYLE_SEL) cls = 'xi-selection';

        // Fill unstyled region (if it exists).
        if (pos < start) {
          this.spans.appendChild(el('span', this.text.substring(pos, start)));
          pos = start;
        }
        // Add in styled region.
        if (start != end) {
          this.spans.appendChild(el('span', this.text.substring(start, end), cls));
          pos = end;
        }
      }
      // Fill unstyled region at the end (if it exists).
      if (pos != this.text.length) {
        this.spans.appendChild(el('span', this.text.substring(pos, this.text.length)));
      }
    }
  }

  static update(line, data) {
    if (!line) return;
    if (data.styles) line.styles = data.styles;
    if (data.cursor) line.cursors = data.cursor;
    line.render();
  }
}
