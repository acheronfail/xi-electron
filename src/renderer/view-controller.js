// @flow
import { elt, on } from '../utils/dom';
import FontMetrics from './font-metrics';
import LineCache from './line-cache';
import { createView } from './views';

import type { View, ViewType, ViewOptions } from './views';
import type ViewProxy from './view-proxy';

// This module should be controlled by the "workspace" which has the xi-core running
// it is linked to a view inside of xi-core via a "ViewProxy"
export default class ViewController {

  // Wrapper element.
  _wrapper: any;

  // Proxy to xi-core's corresponding view.
  _proxy: ViewProxy;

  // Line cache of the view inside xi-core.
  _lineCache: LineCache;

  // FontMetrics.
  _metrics: FontMetrics;

  // Actual view which manages drawing of the editor.
  _view: View;

  // Whether or not this view has focus.
  _hasFocus: boolean;

  /**
   * Create the ViewController.
   * @param {HTMLElement} place Where to place the wrapper element.
   * @param {ViewProxy}   proxy This ViewController's ViewProxy.
   * @param {[type]}      opts  Configuration options.
   */
  constructor(place: any, proxy: ViewProxy, opts: ViewOptions) {
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

  /**
   * Sends the given method to xi-core.
   * @param  {String} method The method to send.
   */
  doMethod(method: string) {
    this._edit(method);
  }

  /**
   * Sends the given string to xi-core to be inserted.
   * @param  {String} chars Given string.
   */
  insert(chars: string) {
    this._edit('insert', { chars })
  }

  /**
   * Perform a "click" event on the view.
   * @param  {Object} event DOM MouseEvent.
   * @return {Array}        A [line, char] object of where the click occurred.
   */
  click(event: any): [number, number] {
    if (!this.isFocused()) this.focus();
    event.preventDefault();

    const { left, top } = this._wrapper.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;

    const [line, char] = this.posFromCoords(x, y, false);
    this._click(line, char, 0, 0);

    return [line, char];
  }

  /**
   * Returns a [line, char] from the given coordinates.
   * @param  {Number}  x       The x coordinate (relative to the view).
   * @param  {Number}  y       The y coordinate (relative to the view).
   * @param  {Boolean} forRect Whether the click was using rectangular selections.
   * @return {Array}           A [line, char] object of the coordinates at the point.
   */
  posFromCoords(x: number, y: number, forRect: boolean): [number, number] {
    const charWidth = this._metrics.charWidth();
    const lineHeight = this._metrics.lineHeight();

    const line = Math.round((y - (lineHeight / 2)) / lineHeight);
    const char = Math.round((x < 0 ? 0 : x) / charWidth);

    return [line, char];
  }

  /**
   * Trigger a render of the view.
   */
  render() {
    this._view.render();
  }

  /**
   * Remove focus from the view.
   */
  blur() {
    this._wrapper.blur();
  }

  /**
   * Give focus to the view.
   */
  focus() {
    this._wrapper.focus();
  }

  /**
   * Checks if the view is focused.
   * @return {Boolean} Is the view focused?
   */
  isFocused() {
    return this._hasFocus;
  }

  /**
   * Returns the view's wrapper element.
   * @return {[type]} The outermost HTMLElement of the view.
   */
  getWrapperElement() {
    return this._wrapper;
  }

  /**
   * Determine how many lines should render, and send this info to xi-core so it
   * knows how much information to give us.
   */
  updateViewport() {
    const { top, height } = this._view.getViewport();
    this._edit('scroll', [top, height]);
  }

  /**
   * Private API
   */

  /**
   * Called when the view is blurred.
   *   TODO: change colours of selections, etc.
   */
  _blur() {
    this._hasFocus = false;
  }

  /**
   * Called when the view is focused.
   *   TODO: change colours of selections, etc.
   */
  _focus() {
    this._hasFocus = true;
  }

  // Messages to xi-core -------------------------------------------------------

  /**
   * Send click information to xi-core.
   * @param  {Number} line  The line for xi-core.
   * @param  {Number} char  The char for xi-core.
   * @param  {Number} mod   The click modifier for xi-core.
   * @param  {Number} count This is the nth click.
   */
  _click(line: number, char: number, mod: number, count: number) {
    this._edit('click', [line, char, mod, count]);
  }

  /**
   * Send drag information to xi-core.
   * @param  {Number} line See `this._click()`.
   * @param  {Number} char See `this._click()`.
   * @param  {Number} mod  See `this._click()`.
   */
  _drag(line: number, char: number, mod: number) {
    this._edit('drag', [line, char, mod]);
  }

  /**
   * Convenience method for sending "edit" submethods through to the view.
   * @param  {String} method The edit method to send to xi-core.
   * @param  {Object} params The edit method's parameters.
   */
  _edit(method: string, params: any = {}) {
    this._proxy.send('edit', { method, params });
  }

  // Responses to xi-core's messages -------------------------------------------

  /**
   * Called when xi-core requests an update on this view.
   * @param  {Object} params The update for the LineCache.
   */
  _update(params: any) {
    this._lineCache.applyUpdate(params.update);
    this.render();
  }

  /**
   * Called when xi-core requests the view scroll to the given position.
   * @param  {Object} params Objecting containing "line" and "col".
   */
  _scrollTo(params: any) {
    this._view.scrollTo(params.line, params.col);
  }

  /**
   * Called when xi-core send information regarding available plugins.
   * @param  {Object} params
   */
  _availablePlugins(params: any) {
    console.log(params);
  }
}
