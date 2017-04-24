import path from 'path';
import LineView from './line-view';
import { el, on } from './utils';
import { execKey } from './key-events';

const MODIFIER_NONE = 0;
const MODIFIER_SHIFT = 2;

export default class View {
  constructor(workspace, viewId, data) {
    this.id = viewId;
    this.path = data.file_path;
    this.name = this.path ? path.basename(this.path) : 'Untitled';
    this.workspace = workspace;

    // Element setup.
    this.el = workspace.el.appendChild(el('div', null, 'xi-view'));
    this.el.setAttribute('tabindex', 0);

    // Focus and blur events.
    on(this.el, 'focus', this.onFocus.bind(this), false);
    on(this.el, 'blur', this.onBlur.bind(this), false);

    // Create the line view.
    this.lineView = new LineView(this);

    // Initialise the view.
    this.registerKeyEvents();

    // Initialise pointer state and events.
    this.pointerState = {
      clicks: 0,
      last: {
        pageX: -1,
        pageY: -1,
        end: 0
      }
    };
    on(this.el, 'mousedown', this.onPointerStart.bind(this), false);
  }

  get settings() {
    return this.workspace.settings;
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
    this.el.classList.add('xi-focused');
    this.hasFocus = true;
  }

  blur() {
    this.el.blur();
  }

  onBlur() {
    this.el.classList.remove('xi-focused');
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

  save() {
    console.log(this.path);
  }

  insert(chars) {
    this.edit('insert', { chars })
  }

  click(line, char, mod, count) {
    this.edit('click', [line, char, mod, count]);
  }

  drag(line, char, mod) {
    this.edit('drag', [line, char, mod]);
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
        // // Show crosshair when "alt" key is held down (rectangular selections).
        // if (!mobile && e.keyCode == 18) showCrossHair(cs);
      }
    };

    on(this.el, 'keydown', onKeyEvent, false);
    on(this.el, 'keypress', onKeyEvent, false);
  }

  onPointerStart(e) {
    const now = Date.now();
    const pos = this.lineView.posFromMouse(e);
    const state = this.pointerState;

    // TODO: switch button type

    // Forget last click if too much time has passed.
    if (now - state.last.end > 500) {
      state.last = { pageY: -1, pageX: -1, end: 0 };
    }

    // TODO: multi-clicks
    if (isClose(e, state.last)) {
      state.clicks++;
    } else {
      state.clicks = 1;
      state.last.pageX = e.pageX;
      state.last.pageY = e.pageY;
      state.last.end = now;
    }

    const modifier = e.shiftKey ? MODIFIER_SHIFT : MODIFIER_NONE;
    this.click(pos.line, pos.char, modifier, state.clicks);



    // TODO: dragging!
    // i.e., on('mousemove'), off(...), etc...

  }
}


// Checks if two points { left, top } are close to one another.
function isClose(a, b) {
  if (a.pageX == -1 || b.pageX == -1) return false;
  let dx = b.pageX - a.pageX, dy = b.pageY - a.pageY;
  return dx * dx + dy * dy < 20 * 20;
}
