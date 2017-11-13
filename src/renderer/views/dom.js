// @flow

import { elt } from '../../utils/dom';
import { STYLE_SELECTION, STYLE_HIGHLIGHT, COLORS } from '../style-map';

export default class DOMView {
  // The actual canvas.
  _wrapper: HTMLDivElement;

  constructor(place: HTMLElement, opts: any) {
    this._wrapper = place.appendChild(elt('div'));
  }

  // Renders the document onto the canvas.
  render(lineCache: any, metrics: any) {}
}
