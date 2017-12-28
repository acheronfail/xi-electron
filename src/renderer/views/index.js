// @flow
import DOMView from './dom';
import WebGLView from './webgl';
import CanvasView from './canvas';

/**
 * Map of our different View classes.
 */
export const Views = {
  DOM: DOMView,
  WebGL: WebGLView,
  Canvas: CanvasView,
};

/**
 * Potential types of views.
 */
export type ViewType = 'Canvas' | 'DOM' | 'WebGL';

/**
 * Configuration options for Views.
 */
export type ViewOptions = {
  type: ViewType
};

/**
 * Information about the current viewport. Measured in lines and characters.
 */
export type Viewport = {
  top:    number, // Topmost line number.
  height: number, // How many lines fit in the window (fully).
  left:   number, // Leftmost character position.
  width:  number  // How many characters fit in the window (fully).
};

/**
 * Interface for each view.
 */
export interface View {
  resize(): void;
  render(): void;
  scrollTo(line: number, char: number): void;
  getViewport(): Viewport;
}

/**
 * Creates and returns a View of the given type.
 * @param  {String} type               The view type.
 * @param  {ViewController} controller The view controller requesting the view.
 * @param  {Object} opts               Configuration options for the view.
 * @return {View}                      The newly created view.
 */
export function createView(type: string, controller: any, opts?: any = {}): View {
  // NOTE: we just default to canvas view for now, since it's the only
  // implemented one at the moment.
  const View = Views[type] || CanvasView;
  return new View(controller, opts);
};
