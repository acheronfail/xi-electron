import Workspace from './workspace';
import { DEVMODE } from '../utils/environment';
import { ViewType } from './view/index';

const opts = { viewType: ViewType.DOM };
const workspace = new Workspace(document.body, opts);

if (DEVMODE) {
  // tslint:disable-next-line
  (<any>window).Core = require('./core').default;
  (<any>window).workspace = workspace;
  // Show current view in body.
  document.body.appendChild(document.createTextNode(`ViewType: ${opts.viewType}`));
}
