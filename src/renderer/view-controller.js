// @flow

import { elt, on } from '../utils/dom';
import FontMetrics from './font-metrics';
import LineCache from './line-cache';
import { createView } from './views';

// TODO: class types
// TODO: params object types for each update type

type ViewOptions = {
  type: string // "Canvas", DOM" or "WebGL"
};

// this module should be controlled by the "workspace" which has the xi-core running
// it is linked to a view inside of xi-core via a "ViewProxy"
export default class ViewController {

  // Proxy to xi-core's corresponding view.
  // TODO: class types
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

    this._view = createView(opts.type, this._wrapper, {});

    this._proxy.on('update', this._update.bind(this));
    this._proxy.on('scroll_to', this._scrollTo.bind(this));
    this._proxy.on('available_plugins', this._availablePlugins.bind(this));
  }

  /**
   * Public API
   */

  // Editing methods.

  insert(chars: string) {
    this.edit('insert', { chars })
  }

  click(line: number, char: number, mod: number, count: number) {
    if (!this.isFocused()) this.focus();
    this.edit('click', [line, char, mod, count]);
  }

  drag(line: number, char: number, mod: number) {
    if (!this.isFocused()) this.focus();
    this.edit('drag', [line, char, mod]);
  }

  edit(method: string, params: any = {}) {
    this._proxy.send('edit', { method, params });
  }

  // View management methods.

  render() {
    this._view.render(this._lineCache, this._metrics);
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

  /**
   * Private API
   */

  _blur() {
    this._hasFocus = false;
  }

  _focus() {
    this._hasFocus = true;
  }

  // Responses to xi-core's messages.

  _update(params: any) {
    this._lineCache.applyUpdate(params.update);
    this.render();
  }

  _scrollTo(params: any) {
    // console.log(params);
  }

  _availablePlugins(params: any) {
    // console.log(params);
  }
}
