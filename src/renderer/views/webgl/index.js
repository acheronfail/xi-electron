// @flow
import { elt } from '../../../utils/dom';
import { STYLES } from '../../style-map';
import { COLORS } from '../../theme';

import type { View, ViewOptions, Viewport } from '../index';
import type ViewController from '../../view-controller';
import type FontMetrics from '../../font-metrics';
import type LineCache from '../../line-cache';

/**
 * A View built by using the DOM.
 */
export default class WebGLView implements View {

  // Wrapper element.
  _wrapper: any;

  // Parent ViewController's FontMetrics.
  _metrics: FontMetrics;

  // Parent ViewController's LineCache.
  _lineCache: LineCache;

  // The actual canvas.
  _canvas: any;

  // WebGL context.
  _gl: any;

  /**
   * Create the view.
   * @param  {ViewController} controller Parent ViewController.
   * @param  {FontMetrics}    metrics    Font measurements.
   * @param  {ViewOptions}    opts       Configuration options.
   */
  constructor(controller: ViewController, opts: ViewOptions) {
    this._wrapper = controller._wrapper;
    this._canvas = this._wrapper.appendChild(elt('canvas'));
    this._gl = this._canvas.getContext('webgl');
  }

  /**
   * Called whenever the view is resized.
   */
  resize() {}

  /**
   * Scrolls so that the given "line" and "char" are visible in the view.
   * @param  {number} line Line number.
   * @param  {number} char Column number.
   */
  scrollTo(line: number, char: number) {}

  /**
   * Get information about the currently visible viewport of the editor.
   * @return {Object} An object with measurements about the current viewport:
   *                  "top" and "height" are measured in lines, "left" and
   *                   "width" in chars.
   */
  getViewport(): Viewport {
    return {
      top:    0,
      height: 0,
      left:   0,
      width:  0
    }
  }

  // Renders the document.
  render() {}
}
