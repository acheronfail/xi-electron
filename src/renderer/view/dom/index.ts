import { elt, removeChildren } from '../../../utils/dom';
import { StyleSpan, N_RESERVED_STYLES, COLORS } from '../../style-map';

import { View, ViewOptions, Viewport } from '../index';
import ViewController from '../../view-controller';
import LineCache, { Line } from '../../line-cache';

// UNIMPLEMENTED:
export default class DOMView implements View {
  constructor() {/**/}
  render() {/**/}
  resize(_width: number, _height: number) {/**/}
  scrollTo(line: number, char: number): void {/**/}
  posFromCoords(x: number, y: number): [number, number] { return [0, 0]; }
  getViewport(): Viewport { return { lineStart: 0, lineEnd: 0, charStart: 0, charEnd: 0 }; }
}

// NOTE: there have been some significant API changes, so we're commenting out the old DOM renderer.
// We'll begin working on it very soon to get it to work with the new structure.

/**
 * A View built by using the DOM.
 */
// export default class DOMView implements View {

//   // Wrapper element.
//   private wrapper: HTMLElement;

//   // Scroll container.
//   private scrollContainer: HTMLElement;

//   // Line container.
//   private lineContainer: HTMLElement;

//   // Parent ViewController's LineCache.
//   private lineCache: LineCache;

//   /**
//    * Create the view.
//    * @param  {ViewController} controller Parent ViewController.
//    * @param  {FontMetrics}    metrics    Font measurements.
//    * @param  {ViewOptions}    opts       Configuration options.
//    */
//   constructor(controller: ViewController,  _opts: ViewOptions) {
//     this.wrapper = controller.wrapper;
//     this.lineCache = controller.lineCache;

//     this.scrollContainer = this.wrapper.appendChild(elt('div', null, null, 'height: 300px; overflow: scroll'));
//     this.lineContainer = this.scrollContainer.appendChild(elt('div'));

//     this.lineCache.on('update', () => this.updateViewport());
//     // this.metrics.on('update', () => this.updateViewport());
//   }

//   private getInnerHeight(): number {
//     const lineHeight = this.metrics.lineHeight();
//     const nLines = this.lineCache.lines.length;
//     return lineHeight * nLines;
//   }

//   private updateViewport() {
//     this.lineContainer.style.height = `${this.getInnerHeight()}px`;
//   }

//   /**
//    * Called whenever the view is resized.
//    */
//   public resize(): void {/* TODO */}

//   /**
//    * Scrolls so that the given "line" and "char" are visible in the view.
//    * @param  {number} line Line number.
//    * @param  {number} char Column number.
//    */
//   public scrollTo(line: number, char: number): void {
//     const charWidth = this.metrics.charWidth();
//     const lineHeight = this.metrics.lineHeight();
//     this.scrollContainer.scrollTop = lineHeight * line;
//     this.scrollContainer.scrollLeft = charWidth * char;
//   }

//   /**
//    * Returns a [line, char] from the given coordinates.
//    * @param  {Number}  x       The x coordinate (relative to the view).
//    * @param  {Number}  y       The y coordinate (relative to the view).
//    * @param  {Boolean} forRect Whether the click was using rectangular selections.
//    * @return {Array}           A [line, char] object of the coordinates at the point.
//    */
//   public posFromCoords(x: number, y: number, _forRect: boolean): [number, number] {
//     return [0, 0];
//   }

//   /**
//    * Get information about the currently visible viewport of the editor.
//    * @return {Object} An object with measurements about the current viewport.
//    */
//   public getViewport(): Viewport {
//     const lineHeight = this.metrics.lineHeight();
//     return {
//       lineStart: Math.floor(this.scrollContainer.scrollTop / lineHeight),
//       lineEnd: Math.ceil(this.scrollContainer.clientHeight / lineHeight),
//       charStart: Math.floor(this.scrollContainer.scrollLeft / lineHeight),
//       charEnd: Math.ceil(this.scrollContainer.clientWidth / lineHeight)
//     };
//   }

//   /**
//    * Renders the document into the DOM.
//    */
//   public render(): void {
//     // Empty previous lines
//     removeChildren(this.lineContainer);

//     const first = 0;
//     const last = this.lineCache.lines.length;

//     this.lineCache.computeMissing(first, last);

//     // TODO: only render currently visible lines, rather than every single one
//     for (let i = first; i < last; ++i) {
//       const line = this.lineCache.get(i);
//       if (!line) { continue; }

//       const lineNode = new LineNode(line, this.metrics);
//       this.lineContainer.appendChild(lineNode.element);
//     }
//   }
// }

// class LineNode {
//   public element: HTMLPreElement;

//   private charWidth: number;
//   private lineHeight: number;

//   constructor(public line: Line, metrics: FontMetrics) {
//     this.charWidth = metrics.charWidth();
//     this.lineHeight = metrics.lineHeight();
//     this.element = (<HTMLPreElement>elt('pre', null, null, `position: relative;
//                                                             margin: 0;
//                                                             font: ${metrics.fontString()}`));

//     // Build DOM cursors.
//     line.cursor.forEach((char) => {
//       this.element.appendChild(this.createCursor(char));
//     });

//     // Build DOM spans from StyleSpans.
//     line.styles.forEach((styleSpan) => {
//       this.element.appendChild(this.nodeFromStyleSpan(styleSpan));
//     });
//   }

//   createCursor(char: number): HTMLElement {
//     return elt('div', null, null, `position: absolute;
//                                    border: 1px solid ${COLORS.CURSOR};
//                                    height: ${this.lineHeight}px;
//                                    left: ${this.charWidth * char}px`);
//   }

//   nodeFromStyleSpan(styleSpan: StyleSpan): HTMLSpanElement {
//     const { style, range: { start, length } } = styleSpan;

//     // TODO: better way of styling (probably use classes)...
//     let css = '';
//     switch (style) {
//       case STYLES.SELECTION: {
//         css = `background-color: ${COLORS.SELECTION}`;
//         break;
//       }
//       case STYLES.HIGHLIGHT: {
//         css = `background-color: ${COLORS.HIGHLIGHT}`;
//         break;
//       }

//       default: {
//         css = 'color: black';
//         if (style > N_RESERVED_STYLES) {
//           css = 'color: green';
//           console.log('this text has syntax highlighting');
//         }
//       }
//     }

//     return elt('span', this.line.text.substr(start, length), null, css);
//   }
// }
