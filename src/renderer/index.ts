import Workspace from './workspace';
import { DEVMODE } from '../utils/environment';
import { ViewType } from './view/index';

const workspace = new Workspace(document.body, {
  viewType: ViewType.DOM
});

if (DEVMODE) {
  // tslint:disable-next-line
  (<any>window).Core = require('./core').default;
  (<any>window).workspace = workspace;
}
