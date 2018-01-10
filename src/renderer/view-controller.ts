import { elt, on } from '../utils/dom';
import FontMetrics from './font-metrics';
import LineCache from './line-cache';
import { createView } from './views';

import { View, ViewOptions } from './views';
import ViewProxy from './view-proxy';

// This module should be controlled by the "workspace" which has the xi-core running
// it is linked to a view inside of xi-core via a "ViewProxy"
export default class ViewController {

  // Wrapper element.
  public wrapper: any;

  // Line cache of the view inside xi-core.
  public lineCache: LineCache;

  // FontMetrics.
  public metrics: FontMetrics;

  // Actual view which manages drawing of the editor.
  private view: View;

  // Whether or not this view has focus.
  private hasFocus: boolean;

  /**
   * Create the ViewController.
   * @param {HTMLElement} place Where to place the wrapper element.
   * @param {ViewProxy}   proxy This ViewController's ViewProxy.
   * @param {[type]}      opts  Configuration options.
   */
  constructor(place: any, private proxy: ViewProxy, opts: ViewOptions) {
    this.wrapper = place.appendChild(elt('div', null, 'xi-view'));
    this.wrapper.style.border = '1px solid #000';
    this.wrapper.style.overflow = 'hidden';
    this.wrapper.tabIndex = 0;

    this.hasFocus = false;
    on(this.wrapper, 'blur', () => this.hasFocus = false, false);
    on(this.wrapper, 'focus', () => this.hasFocus = true, false);

    this.lineCache = new LineCache();
    this.metrics = new FontMetrics(this.wrapper, {
      family: 'monospace',
      size: 20
    });

    this.view = createView(opts.type, this, {});

    this.proxy.on('update', this._update.bind(this));
    this.proxy.on('scroll_to', this._scrollTo.bind(this));
    this.proxy.on('available_plugins', this._availablePlugins.bind(this));

    this.updateViewport();
  }

  /**
   * Public API
   */

  /**
   * Sends the given method to xi-core.
   * @param  {String} method The method to send.
   */
  doMethod(method: string): void {
    this._edit(method);
  }

  /**
   * Sends the given string to xi-core to be inserted.
   * @param  {String} chars Given string.
   */
  insert(chars: string): void {
    this._edit('insert', { chars });
  }

  /**
   * Perform a "click" event on the view.
   * @param  {Object} event DOM MouseEvent.
   * @return {Array}        A [line, char] object of where the click occurred.
   */
  click(event: any): [number, number] {
    if (!this.isFocused()) { this.focus(); }
    event.preventDefault();

    const { left, top } = this.wrapper.getBoundingClientRect();
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
  posFromCoords(x: number, y: number, _forRect: boolean): [number, number] {
    const charWidth = this.metrics.charWidth();
    const lineHeight = this.metrics.lineHeight();

    const line = Math.round((y - (lineHeight / 2)) / lineHeight);
    const char = Math.round((x < 0 ? 0 : x) / charWidth);

    return [line, char];
  }

  /**
   * Trigger a render of the view.
   */
  render(): void {
    this.view.render();
  }

  /**
   * Remove focus from the view.
   */
  blur(): void {
    this.wrapper.blur();
  }

  /**
   * Give focus to the view.
   */
  focus(): void {
    this.wrapper.focus();
  }

  /**
   * Checks if the view is focused.
   * @return {Boolean} Is the view focused?
   */
  isFocused(): boolean {
    return this.hasFocus;
  }

  /**
   * Returns the view's wrapper element.
   * @return {[type]} The outermost HTMLElement of the view.
   */
  getWrapperElement(): HTMLElement {
    return this.wrapper;
  }

  /**
   * Determine how many lines should render, and send this info to xi-core so it
   * knows how much information to give us.
   */
  updateViewport(): void {
    const { top, height } = this.view.getViewport();
    this._edit('scroll', [top, height]);
  }

  // Messages to xi-core -------------------------------------------------------

  /**
   * Send click information to xi-core.
   * @param  {Number} line  The line for xi-core.
   * @param  {Number} char  The char for xi-core.
   * @param  {Number} mod   The click modifier for xi-core.
   * @param  {Number} count This is the nth click.
   */
  _click(line: number, char: number, mod: number, count: number): void {
    this._edit('click', [line, char, mod, count]);
  }

  /**
   * Send drag information to xi-core.
   * @param  {Number} line See `this._click()`.
   * @param  {Number} char See `this._click()`.
   * @param  {Number} mod  See `this._click()`.
   */
  _drag(line: number, char: number, mod: number): void {
    this._edit('drag', [line, char, mod]);
  }

  /**
   * Convenience method for sending "edit" submethods through to the view.
   * @param  {String} method The edit method to send to xi-core.
   * @param  {Object} params The edit method's parameters.
   */
  _edit(method: string, params: any = {}): void {
    this.proxy.send('edit', { method, params });
  }

  // Responses to xi-core's messages -------------------------------------------

  /**
   * Called when xi-core requests an update on this view.
   * @param  {Object} params The update for the LineCache.
   */
  _update(params: any): void {
    this.lineCache.applyUpdate(params.update);
    this.render();
  }

  /**
   * Called when xi-core requests the view scroll to the given position.
   * @param  {Object} params Objecting containing "line" and "col".
   */
  _scrollTo(params: any): void {
    this.view.scrollTo(params.line, params.col);
  }

  /**
   * Called when xi-core send information regarding available plugins.
   * @param  {Object} params
   */
  _availablePlugins(params: any): void {
    console.log(params);
  }
}
