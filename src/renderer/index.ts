import Workspace from './workspace';
import { DEVMODE } from '../utils/environment';

const workspace = new Workspace(document.querySelector('#view'), {});

if (DEVMODE) {
  // tslint:disable-next-line
  (<any>window).Core = require('./core').default;
  (<any>window).workspace = workspace;
}
