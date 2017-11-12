// @flow

import { elt } from '../../../utils/dom';
import { STYLE_SELECTION, STYLE_HIGHLIGHT, COLORS } from '../../style-map';

// It seems rather difficult to use WebGL to render text...
// Here are some future resources to get started:
//
// https://webglfundamentals.org/webgl/lessons/webgl-text-glyphs.html
// https://stackoverflow.com/questions/24525410/possible-to-draw-a-string-hello-world-as-a-texture-at-run-time
// https://stackoverflow.com/questions/25319040/display-text-with-webgl
// https://www.eventbrite.com/engineering/its-2015-and-drawing-text-is-still-hard-webgl-threejs/

export default class WebGLView {
  // The actual canvas.
  _canvas: HTMLCanvasElement;

  // WebGL context.
  _gl: any;

  constructor(place: HTMLElement, opts: any) {
    this._canvas = place.appendChild(elt('canvas'));
    this._gl = this._canvas.getContext('webgl');
  }

  // Renders the document onto the canvas.
  render(lineCache: any, metrics: any) {}
}
