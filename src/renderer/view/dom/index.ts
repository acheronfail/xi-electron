import { nDigits } from '../../../utils/misc';
import { elt, removeChildren, on, off } from '../../../utils/dom';
import { StyleSpan, COLORS } from '../../style-map';

import { View, ViewOptions, Viewport } from '../index';
import ViewController from '../../view-controller';
import LineCache, { Line } from '../../line-cache';
import FontMetrics from './font-metrics';

/**
 * Represents a line in the DOM editor.
 */
class LineNode {
  public element: HTMLPreElement;

  private asciiWidth: number;
  private lineHeight: number;

  constructor(public line: Line, private metrics: FontMetrics) {
    this.asciiWidth = this.metrics.asciiWidth();
    this.lineHeight = this.metrics.lineHeight();
    this.element = (<HTMLPreElement>elt('pre', null, null, `
      position: relative;
      border-width: 0;
      border-radius: 0;
      word-wrap: normal;
      margin: 0;
      z-index: 2;
      font-variant-ligatures: contextual;
      font: ${this.metrics.fontString()};
    `));

    // Build DOM cursors.
    line.cursors.forEach((char) => {
      this.element.appendChild(this.createCursor(char));
    });

    // Build DOM spans from StyleSpans.
    line.styles.forEach((styleSpan) => {
      this.element.appendChild(this.nodeFromStyleSpan(styleSpan));
    });
  }

  createCursor(char: number): HTMLElement {
    return elt('div', null, null, `position: absolute;
                                   border: 1px solid ${COLORS.CURSOR};
                                   height: ${this.lineHeight}px;
                                   left: ${this.asciiWidth * char}px`);
  }

  nodeFromStyleSpan(styleSpan: StyleSpan): HTMLSpanElement {
    const { style, range: { start, length } } = styleSpan;
    const css = `
      font: ${style.fontString(this.metrics)};
      color: ${style.fg};
    `;
    return elt('span', this.line.text.substr(start, length), null, css);
  }
}

/**
 * A view built using the Document Object Model.
 * The scrolling mechanism takes inspiration from CodeMirror.
 * See http://marijnhaverbeke.nl/blog/a-pathological-scrolling-model.html
 *
 * See the Canvas implementation of a view for commented/documented code abotu
 * how a custom view class should be implemeneted.
 */
export default class DOMView implements View {

  private scroller: HTMLElement;
  private wrapper: HTMLElement;
  private gutter: HTMLElement;
  private sizer: HTMLElement;
  private lines: HTMLElement;
  private mover: HTMLElement;

  private metrics: FontMetrics;
  private lineCache: LineCache;

  private drawGutter: boolean = true;
  private gutterChars: number = 0;
  private gutterWidth: number = 0;
  // private editorPadding: [number, number] = [5, 0];
  private gutterPadding: [number, number] = [20, 0];
  // private scrollPastEnd: boolean = false;

  constructor(private controller: ViewController, opts: ViewOptions) {
    this.wrapper = controller.wrapper;
    this.lineCache = controller.lineCache;

    this.metrics = new FontMetrics(this.wrapper, {
      family: 'monospace',
      size: 20
    });

    ['drawGutter', 'gutterPadding', 'editorPadding', 'scrollPastEnd'].forEach((key) => {
      if (opts[key]) {
        this[key] = opts[key];
      }
    });

    this.wrapper.style.background = COLORS.BACKGROUND;
    this.wrapper.style.overflow = 'hidden';

    this.lines = elt('div', null, 'lines', `
      min-height: 1px;
      cursor: text;
    `);
    this.gutter = elt('div', null, 'gutter', `
      position: absolute; left: 0; top: 0;
      min-height: 100%;
      z-index: 3;
      background: #242424;
      text-align: right;
      /* padding: ${this.gutterPadding[1]}px ${this.gutterPadding[0]}px; */
    `);
    this.mover = elt('div', [this.lines], 'mover', 'position: relative');
    this.sizer = elt('div', [this.mover], 'sizer', `
      position: relative;
      box-sizing: content-box;
      border-right: 30px solid transparent;
    `);
    this.scroller = controller.wrapper.appendChild(elt('div', [this.gutter, this.sizer], 'scroller', `
      box-sizing: content-box;
      overflow: scroll !important;
      /* 30px is the magic margin used to hide the element's real scrollbars */
      /* Needs overflow: hidden on the wrapper */
      margin-bottom: -30px; margin-right: -30px;
      padding-bottom: 30px;
      position: relative;
    `));
    on(this.scroller, 'scroll', this.onScroll, { capture: false, passive: true });

    this.lineCache.on('update', () => this.updateViewport());
  }

  /**
   * Private API
   */

  private measureGutter() {
    if (this.drawGutter) {
      const asciiWidth = this.metrics.asciiWidth();
      this.gutterChars = nDigits(this.lineCache.height());
      this.gutterWidth = this.gutterChars * asciiWidth + this.gutterPadding[0];
    } else {
      this.gutterWidth = 0;
    }
    this.gutter.style.width = `${this.gutterWidth}px`;
  }

  private updateViewport(): void {
    this.measureGutter();
    this.lines.style.marginBottom = `${this.scroller.clientHeight}px`;
    this.sizer.style.height = `${this.calculateTotalHeight()}px`;
  }

  private calculateTotalHeight(): number {
    return this.metrics.lineHeight() * this.lineCache.height();
  }

  private onScroll = (_event: MouseWheelEvent): void => {
    if (this.scroller.clientHeight) {
      this.controller.updateViewport();

      // HACK: a shameless hack in order to stop an infinite loop from
      // occurring. When `this.lines` has a margin applied to it (for it to
      // scroll past the end) it triggers a scroll event on the scroller (since
      // its contents changes size) thereby calling this listener again ...
      // and so on ... and so on ...
      // There's definitely a better way to get around this!
      off(this.scroller, 'scroll', this.onScroll, { capture: false, passive: true });
      this.render();
      // Wait for re-draw to complete, then re-attach scroll listener.
      setTimeout(() => {
        on(this.scroller, 'scroll', this.onScroll, { capture: false, passive: true });
      });
    }
  }

  /**
   * View API
   */

  public resize(width: number, height: number): void {
    this.scroller.style.width = `${width}px`;
    this.scroller.style.height = `${height}px`;

    this.render();
  }

  public scrollTo(line: number, char: number): void {
    this.sizer.scrollTop = this.metrics.lineHeight() * line;
    this.sizer.scrollLeft = this.metrics.asciiWidth() * char;
  }

  public posFromCoords(_x: number, _y: number): [number, number] {
    return [0, 0];
  }

  public getViewport(): Viewport {
    const asciiWidth = this.metrics.asciiWidth();
    const lineHeight = this.metrics.lineHeight();
    // TODO: gutter and offsets
    const xOffset = 0; // this.gutterWidth - this.editorPadding[0];
    const { scrollTop, scrollLeft, clientHeight, clientWidth } = this.scroller;
    return {
      lineStart: Math.floor(scrollTop / lineHeight),
      lineEnd: Math.floor((scrollTop + clientHeight) / lineHeight),
      charStart: Math.floor(scrollLeft / asciiWidth),
      charEnd: Math.floor((clientWidth + scrollLeft - xOffset) / asciiWidth),
    };
  }

  public render(): void {
    // Empty containers.
    removeChildren(this.lines);
    removeChildren(this.gutter);

    let { lineStart, lineEnd } = this.getViewport();
    this.lineCache.computeMissing(lineStart, lineEnd);

    // Push mover forward as we scroll.
    const height = `${lineStart * this.metrics.lineHeight()}px`;
    this.mover.style.top = this.gutter.style.top = height;
    this.mover.style.left = `${this.gutterWidth}px`;

    for (let i = lineStart; i < lineEnd + 1; ++i) {
      const line = this.lineCache.get(i);
      if (!line) {
        continue;
      }

      // TODO: CodeMirror draws the gutter itself and the line numbers separately.
      // The gutter itself is placed in the scroller, but the numbers are positioned
      // within CodeMirror-code (aka the lines container).
      this.gutter.appendChild(elt('div', `${i}`, null, `
        color: #5a5a5a;
        white-space: normal;
        height: 100%;
        font: ${this.metrics.fontString()};
      `));

      const lineNode = new LineNode(line, this.metrics);
      this.lines.appendChild(lineNode.element);
    }
  }
}
