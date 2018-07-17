import DOMView from './dom';
import WebGLView from './webgl';
import CanvasView from './canvas';
import ViewController from '../view-controller';

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
export enum ViewType {
  Canvas = 'Canvas',
  WebGL = 'WebGL',
  DOM = 'DOM',
}

/**
 * Configuration options for Views.
 */
export type ViewOptions = {
  // Which view type to use.
  type: ViewType,
  // Whether or not to draw the gutter.
  drawGutter?: boolean,
  // Gutter padding: [x, y].
  gutterPadding?: [number, number],
  // Editor padding: [x, y]
  editorPadding?: [number, number],
  // Whether or not the view should scroll past the end of the document.
  scrollPastEnd?: boolean,
};

/**
 * Information about the current viewport. Measured in lines and characters.
 */
export type Viewport = {
  lineStart: number,
  lineEnd: number,
  charStart: number,
  charEnd: number
};

/**
 * Interface for each view.
 */
export interface View {
  // Called when the view requires a re-render.
  render(): void;
  // Called whenever the view controller's wrapper element resizes.
  resize(width: number, height: number): void;
  // Scrolls the view to the given `line, char` position.
  scrollTo(line: number, char: number): void;
  // Return the `line, char` at the given `x, y` coordinate.
  posFromCoords(x: number, y: number): [number, number];
  // Get details of the visible lines in the current viewport.
  getViewport(): Viewport;
}

export interface FontMetrics {
  fontString(): string;
}

/**
 * Creates and returns a View of the given type.
 * @param  {ViewType} type             The view type.
 * @param  {ViewController} controller The view controller requesting the view.
 * @param  {Object} opts               Configuration options for the view.
 * @return {View}                      The newly created view.
 */
export function createView(controller: ViewController, opts: ViewOptions): View {
  const View = Views[opts.type];
  return new View(controller, opts);
}
