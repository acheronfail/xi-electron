import DOMView from './dom';
import WebGLView from './webgl';
import CanvasView from './canvas';

export const Views = {
  DOM: DOMView,
  WebGL: WebGLView,
  Canvas: CanvasView,
};

// Just default to canvas view for now.
export function createView(type: string, controller: any, opts?: any = {}) {
  const View = Views[type] || CanvasView;
  return new View(controller, opts);
};
