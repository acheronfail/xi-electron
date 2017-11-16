import { elt, on } from '../utils/dom';
import FontMetrics from './font-metrics';
import LineCache from './line-cache';
import { createView } from './views';

type ViewType = 'Canvas' | 'DOM' | 'WebGL';

type ViewOptions = {
  type?: ViewType
};

// this module should be controlled by the "workspace" which has the xi-core running
// it is linked to a view inside of xi-core via a "ViewProxy"
export default class ViewController {
  // TODO: class types

  // Proxy to xi-core's corresponding view.
  _proxy: any;

  // Wrapper element.
  _wrapper: HTMLElement;

  // Line cache of the view inside xi-core.
  _lineCache: any;

  // FontMetrics.
  _metrics: FontMetrics;

  // Actual view which manages drawing of the editor.
  _view: any;

  // Whether or not this view has focus.
  _hasFocus: boolean;

  constructor(place: HTMLElement, proxy: any, opts: ViewOptions) {
    this._proxy = proxy;

    this._wrapper = place.appendChild(elt('div', null, 'xi-view'));
    this._wrapper.style.border = '1px solid #000';
    this._wrapper.style.overflow = 'hidden';
    this._wrapper.tabIndex = 0;

    this._hasFocus = false;
    on(this._wrapper, 'blur', this._blur.bind(this), false);
    on(this._wrapper, 'focus', this._focus.bind(this), false);

    this._lineCache = new LineCache();
    this._metrics = new FontMetrics(this._wrapper, {
      family: 'monospace',
      size: 20
    });

    this._view = createView(opts.type, this, {});

    this._proxy.on('update', this._update.bind(this));
    this._proxy.on('scroll_to', this._scrollTo.bind(this));
    this._proxy.on('available_plugins', this._availablePlugins.bind(this));

    this.updateViewport();
  }

  /**
   * Public API
   */

  doAction(action: string) {
    this._edit(action);
  }

  insert(chars: string) {
    this._edit('insert', { chars })
  }

  click(event: any) {
    if (!this.isFocused()) this.focus();
    event.preventDefault();

    const { left, top } = this._wrapper.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;

    const [line, char] = this.posFromCoords(x, y, false);
    this._click(line, char, 0, 0);
  }

  // Returns a [line, char] from the given coordinates.
  posFromCoords(x: number, y: number, forRect: boolean): [number, number] {
    const charWidth = this._metrics.charWidth();
    const lineHeight = this._metrics.lineHeight();

    const line = Math.round((y - (lineHeight / 2)) / lineHeight);
    const char = Math.round((x < 0 ? 0 : x) / charWidth);

    return [line, char];
  }

  // Trigger a render of the view.
  render() {
    this._view.render();
  }

  blur() {
    this._wrapper.blur();
  }

  focus() {
    this._wrapper.focus();
  }

  isFocused() {
    return this._hasFocus;
  }

  getWrapperElement() {
    return this._wrapper;
  }

  // Determine how many lines should render, and send this info to xi-core so it
  // knows how much information to give us.
  updateViewport() {
    const { top, height } = this._view.getViewport();
    console.log(top, height)
    this._edit('scroll', [top, height]);
  }

  /**
   * Private API
   */

  _blur() {
    this._hasFocus = false;
  }

  _focus() {
    this._hasFocus = true;
  }

  // Messages to xi-core.

  _click(line: number, char: number, mod: number, count: number) {
    this._edit('click', [line, char, mod, count]);
  }

  _drag(line: number, char: number, mod: number) {
    this._edit('drag', [line, char, mod]);
  }

  _edit(method: string, params: any = {}) {
    this._proxy.send('edit', { method, params });
  }

  // Responses to xi-core's messages.

  _update(params: any) {
    this._lineCache.applyUpdate(params.update);
    this.render();
  }

  _scrollTo(params: any) {
    this._view.scrollTo(params.line, params.col);
  }

  _availablePlugins(params: any) {
    console.log(params);
  }
}
