// TODO: move this logic into `style-map.ts`

import { DEVMODE } from '../utils/environment';
import FontMetrics from './view/font-metrics';

// TOOD: get rid of these
// TODO: where to get selection / highlight colors for themes?
export enum COLORS {
  SELECTION  = 'rgba(135, 135, 135, 0.25)',
  HIGHLIGHT  = 'rgba(255, 215, 0, 0.5)',
  CURSOR     = '#AAAAAA',
  BACKGROUND = '#2e2e2e',
  FOREGROUND = '#ffffff',
}

export class Style {
  constructor(
    public fg: string,
    public bg: string,
    public weight: number | string = 'normal',
    public italic: boolean = false,
    public underline: boolean = false,
  ) {}

  // TODO: will have to manually implement underlines!
  fontString(metrics: FontMetrics) {
    return `${this.italic ? 'italic' : ''} ${this.weight} ${metrics.fontString()}`;
  }
}

export const DefinedStyles: Style[] = [];
const defaultStyle = new Style('grey', '');

export const getStyle = (id: number) => DefinedStyles[id] || defaultStyle;
export const defineStyle = (params: any) => {
  const { id, fg_color, bg_color, italic, weight, underline } = params;
  DefinedStyles[id] = new Style(
    colorFromARBG(fg_color),
    colorFromARBG(bg_color),
    weight,
    italic,
    underline
  );
};

const colorFromARBG = (argb: number) => {
  const a = (argb >> 24) & 0xff;
  const r = (argb >> 16) & 0xff;
  const g = (argb >> 8) & 0xff;
  const b = argb & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

if (DEVMODE) {
  (<any>window).DefinedStyles = DefinedStyles;
}