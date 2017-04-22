import LineView from './line-view';
import { el, on } from './utils';
import { execKey } from './key-events';

export default class View {
  constructor(workspace, id) {
    this.id = id;
    this.workspace = workspace;

    this.el = workspace.el.appendChild(el('div', null, 'xi-view'));
    this.el.setAttribute('tabindex', 0);
    on(this.el, 'focus', this.onFocus.bind(this), false);
    on(this.el, 'blur', this.onBlur.bind(this), false);

    this.lineView = new LineView(this);
    this.registerKeyEvents();
  }

  destroy() {
    // TODO: isDirty methods from core ?
    this.workspace.sendToCore({
      method: "close_view",
      params: { view_id: this.id }
    });
    this.el.remove();
  }

  show() {
    this.el.style.display = 'block';
    this.focus();
  }

  hide() {
    this.el.style.display = 'none';
    this.blur();
  }

  focus() {
    this.el.focus();
  }

  onFocus() {
    this.hasFocus = true;
  }

  blur() {
    this.el.blur();
  }

  onBlur() {
    this.hasFocus = false;
  }

  /**
   * Messages from xi-core
   */

  update(data) {
    this.lineView.update(data);
  }

  scrollTo(col, line) {
    // TODO: ensure scrolled to here
  }

  /**
   * Methods that communicate with xi-core.
   */

  insert(chars) {
    this.edit('insert', { chars })
  }

  edit(method, params = {}) {
    this.workspace.sendToCore({
      method: 'edit',
      params: {
        method,
        params,
        view_id: this.id
      }
    });
  }

  /**
   * Initialisation.
   */

  registerKeyEvents() {
    const onKeyEvent = (e) => {
      if (this.hasFocus && execKey(this, e)) {
        e.preventDefault();
        // restartBlink(cs);
        // // Show crosshair when "alt" key is held down (rectangular selections).
        // if (!mobile && e.keyCode == 18) showCrossHair(cs);
      }
    };

    on(this.el, 'keydown', onKeyEvent, false);
    on(this.el, 'keypress', onKeyEvent, false);
  }
}

