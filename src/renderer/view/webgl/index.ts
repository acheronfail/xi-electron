import { elt } from '../../../utils/dom';

import { View, ViewOptions, Viewport } from '../index';
import ViewController from '../../view-controller';
import LineCache from '../../line-cache';

// UNIMPLEMENTED:
export default class DOMView implements View {
  constructor() {/**/ }
  render() {/**/ }
  resize(_width: number, _height: number) {/**/ }
  scrollTo(line: number, char: number): void {/**/ }
  posFromCoords(x: number, y: number): [number, number] { return [0, 0]; }
  getViewport(): Viewport { return { lineStart: 0, lineEnd: 0, charStart: 0, charEnd: 0 }; }
}
