import { el } from './utils';

export default class Cursor {
  constructor(line, pos) {
    this.line = line;
    this.el = el('div', null, 'xi-cursor', `left: ${line.lineView.charWidth() * pos}px;`);
    line.el.appendChild(this.el);
  }
}
