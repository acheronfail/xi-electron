import { el } from '../lib/utils';

// TODO: position cursor in the middle and add options:
//      (add in a dynamic stylesheet?)
//      (like Sublime Text)
//      options: cursor_extra_top
//               cursor_extra_bottom
//               cursor_width
//               cursor_style

export default class Cursor {
  constructor(line, pos) {
    this.line = line;
    this.el = el('div', null, 'xi-cursor', `left: ${line.lineView.charWidth() * pos}px;`);
    line.el.appendChild(this.el);
  }
}
