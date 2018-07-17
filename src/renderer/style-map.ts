import {FontMetrics} from './view';
import {DEVMODE} from '../utils/environment';
import {colorFromARBG} from '../utils/misc';

// TODO: color/embolden gutter line number in active line
// TODO: find a place/method for theming the frontend
export const COLORS = {
  CURSOR: '#AAAAAA',
  BACKGROUND: '#2e2e2e',
  FOREGROUND: '#ffffff',
};

/**
 * The styles for the editor - xi-core reserves numbers below `N_RESERVED_STYLES` for selection
 * and highlights, etc.
 */
export const STYLE_SELECTION = 0;
export const STYLE_HIGHLIGHT = 1;
export const N_RESERVED_STYLES = 2;

/**
 * Simple wrapper class for a style defined by the xi-syntect-plugin.
 */
export class Style {
  static DefinedStyles: Style[] = [
    new Style(STYLE_SELECTION, '', 'rgba(135, 135, 135, 0.25)'),
    new Style(STYLE_HIGHLIGHT, '', 'rgba(255, 215, 0, 0.5)'),
  ];

  constructor(
    private id: number,
    public fg: string,
    public bg: string,
    public weight: number | string = 'normal',
    public italic: boolean = false,
    public underline: boolean = false,
  ) {}

  // TODO: will have to manually implement underlines in the canvas view!
  // TODO: and obviously will need to implement complete font for WebGL
  fontString(metrics: FontMetrics) {
    return `${this.italic ? 'italic' : ''} ${this.weight} ${metrics.fontString()}`;
  }

  isSelection(): boolean {
    return this === Style.DefinedStyles[STYLE_SELECTION];
  }

  isHighlight(): boolean {
    return this === Style.DefinedStyles[STYLE_HIGHLIGHT];
  }

  isReservedStyle(): boolean {
    return this.id < N_RESERVED_STYLES;
  }
}

// Reserve DefinedStyles[-1] for a default style.
Style.DefinedStyles[-1] = new Style(-1, 'white', '');
export const defineStyle = (params: any) => {
  const {id, fg_color, bg_color, italic, weight, underline} = params;
  Style.DefinedStyles[id] = new Style(
    id,
    colorFromARBG(fg_color),
    colorFromARBG(bg_color),
    weight,
    italic,
    underline
  );
};

/**
 * Simple range class.
 */
export class Range {
  /**
   * Create the class.
   * @param  {Number} start  Starting index.
   * @param  {Number} length Length of range.
   */
  constructor(public start: number = 0, public length: number = 0) {}
}

/**
 * A basic type representing a range of text and and a style identifier.
 */
export class StyleSpan {

  /**
   * Create an array of StyleSpans with offset mappings from the parent Line class. The core sends
   * us these offsets as utf8 so we need to convert to character positions in order to more easily
   * render the text. See https://github.com/google/xi-editor/blob/protocol_doc/doc/update.md
   * @param utf8ToChIndices Sparse array mapping utf8 to character position indices
   * @param utf8Styles Raw utf8 offsets from xi-core
   * @param charLength Amount of characters in the given line of text
   */
  static stylesFromCore(utf8ToChIndices: number[], utf8Styles: number[], charLength: number): StyleSpan[] {
    const styles = [];

    // Current character position and utf8 offset in the line.
    let pos = 0, pos8 = 0;

    // Create a blank span for any unstyled characters at the start of the line.
    if (utf8Styles.length) {
      const firstStylePos = utf8ToChIndices[utf8Styles[0]];
      if (firstStylePos > pos) {
        styles.push(new StyleSpan(new Range(0, firstStylePos)));
      }
    }

    // Run over the style triplets and generate style spans for them.
    for (let i = 0; i < utf8Styles.length; i += 3) {
      const start8 = pos8 + utf8Styles[i];
      const end8 = start8 + utf8Styles[i + 1];
      const styleId = utf8Styles[i + 2];

      const start = utf8ToChIndices[start8];
      const end = utf8ToChIndices[end8];

      if (start == undefined || end == undefined || end < start) {
        // TODO: how should we do error handling?
        console.error('bad offsets');
      }

      styles.push(new StyleSpan(new Range(start, end - start), Style.DefinedStyles[styleId]));
      pos8 = end8;
      pos = end;
    }

    // Create a blank span for any unstyled characters at the end of the line.
    if (pos < charLength) {
      styles.push(new StyleSpan(new Range(pos, charLength - pos)));
    }

    return styles;
  }

  /**
   * Create the StyleSpan.
   * @param  {Range}           range The range of the StyleSpan.
   * @param  {StyleIdentifier} style The style's type or identifier.
   */
  constructor(public range: Range, public style: Style = Style.DefinedStyles[-1]) {}
}

// Expose `DefinedStyles` in devmode.
if (DEVMODE) {
  (<any>window).DefinedStyles = Style.DefinedStyles;
}
