import { elt, on } from '../utils/dom';
import FontMetrics from './view/font-metrics';
import LineCache from './line-cache';
import { createView } from './view';

import { View, ViewOptions } from './view';
import ViewProxy from './view-proxy';
import { CoreMethod } from './types/core';
import { posIsClose, Point, clamp } from '../utils/misc';

// This module should be controlled by the "workspace" which has the xi-core running
// it is linked to a view inside of xi-core via a "ViewProxy"
export default class ViewController {

  // Wrapper element.
  public wrapper: HTMLElement;

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
  constructor(place: HTMLElement, private proxy: ViewProxy, opts: ViewOptions) {
    this.wrapper = place.appendChild(elt('div', null, 'xi-view', 'height: 100%; width: 100%'));
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

    this.view = createView(opts.type, this, opts);

    // Listen for resizes to the element with the new ResizeObserver feature.
    type ResizeObserverEntry = any;
    const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.target == this.wrapper) {
          const { width, height } = entry.contentRect;
          this.view.resize(width, height);
          this.updateViewport();
        }
      }
    });
    ro.observe(this.wrapper);

    const { width, height } = this.wrapper.getBoundingClientRect();
    this.view.resize(width, height);

    this.proxy.on('update', this.update.bind(this));
    this.proxy.on('scroll_to', this.scrollTo.bind(this));

    this.updateViewport();
  }

  /**
   * Public API
   */

  /**
   * Sends the given method to xi-core.
   * @param  {CoreMethod} method The method to send.
   */
  public doMethod(method: CoreMethod): void {
    this.edit(method);
  }

  /**
   * Sends the given string to xi-core to be inserted.
   * @param  {String} chars Given string.
   */
  public insert(chars: string): void {
    this.edit(CoreMethod.INSERT, { chars });
  }

  // Contains info about previous click history
  private clicks: {
    last: number,
    count: number,
    point: Point
  } = {
    last: Date.now(),
    count: 1,
    point: { x: 0, y: 0 }
  };

  /**
   * Perform a "click" event on the view.
   * @param  {Object} event DOM MouseEvent.
   * @return {Array}        A [line, char] object of where the click occurred.
   */
  public doClick(event: MouseEvent): [number, number] {
    if (!this.isFocused()) { this.focus(); }
    event.preventDefault();

    const now = Date.now();
    const { left, top } = this.wrapper.getBoundingClientRect();
    const point = {
      x: event.clientX - left,
      y: event.clientY - top,
    };

    if (now - this.clicks.last > 300) {
      this.clicks = {
        last: Date.now(),
        count: 1,
        point: point,
      };
    } else {
      const wasClose = posIsClose(point, this.clicks.point);
      if (wasClose) {
        const { count } = this.clicks;
        this.clicks.last = now;
        this.clicks.count = count == 3 ? 1 : count + 1;
        this.clicks.point = point;
      }
    }

    // TOOD: get all different mods (enum?)
    const mod = event.shiftKey ? 2 : 0;

    const [line, char] = this.view.posFromCoords(point.x, point.y, false);
    this.click(line, char, mod, this.clicks.count);

    return [line, char];
  }

  /**
   * doDrag
   */
  public doDrag(event: MouseEvent) {
    const { left, top, width, height } = this.wrapper.getBoundingClientRect();
    const point = {
      x: clamp(event.clientX - left, 0, width),
      y: clamp(event.clientY - top, 0, height),
    };

    // TOOD: get all different mods (enum?)
    const mod = event.shiftKey ? 2 : 0;

    const [line, char] = this.view.posFromCoords(point.x, point.y, false);
    this.drag(line, char, mod);
  }

  /**
   * Trigger a render of the view.
   */
  public render(): void {
    this.view.render();
  }

  /**
   * Remove focus from the view.
   */
  public blur(): void {
    this.wrapper.blur();
  }

  /**
   * Give focus to the view.
   */
  public focus(): void {
    this.wrapper.focus();
  }

  /**
   * Checks if the view is focused.
   * @return {Boolean} Is the view focused?
   */
  public isFocused(): boolean {
    return this.hasFocus;
  }

  /**
   * Returns the view's wrapper element.
   * @return {[type]} The outermost HTMLElement of the view.
   */
  public getWrapperElement(): HTMLElement {
    return this.wrapper;
  }

  /**
   * Determine how many lines should render, and send this info to xi-core so it
   * knows how much information to give us.
   */
  public updateViewport(): void {
    const { lineStart, lineEnd } = this.view.getViewport();
    this.edit(CoreMethod.SCROLL, [lineStart, lineEnd]);
  }

  // Messages to xi-core -------------------------------------------------------

  /**
   * Send click information to xi-core.
   * @param  {Number} line  The line for xi-core.
   * @param  {Number} char  The char for xi-core.
   * @param  {Number} mod   The click modifier for xi-core.
   * @param  {Number} count This is the nth click.
   */
  private click(line: number, char: number, mod: number, count: number): void {
    this.edit(CoreMethod.CLICK, [line, char, mod, count]);
  }

  /**
   * Send drag information to xi-core.
   * @param  {Number} line See `this.click()`.
   * @param  {Number} char See `this.click()`.
   * @param  {Number} mod  See `this.click()`.
   */
  private drag(line: number, char: number, mod: number): void {
    this.edit(CoreMethod.DRAG, [line, char, mod]);
  }

  /**
   * Convenience method for sending "edit" submethods through to the view.
   * @param  {CoreMethod} method The edit method to send to xi-core.
   * @param  {Object}     params The edit method's parameters.
   */
  private edit(method: CoreMethod, params: any = {}): void {
    this.proxy.send(CoreMethod.EDIT, { method, params });
  }

  // Responses to xi-core's messages -------------------------------------------

  /**
   * Called when xi-core requests an update on this view.
   * @param  {Object} params The update for the LineCache.
   */
  private update(params: any): void {
    this.lineCache.applyUpdate(params.update);
    this.render();
  }

  /**
   * Called when xi-core requests the view scroll to the given position.
   * @param  {Object} params Objecting containing "line" and "col".
   */
  private scrollTo(params: any): void {
    this.view.scrollTo(params.line, params.col);
  }
}
