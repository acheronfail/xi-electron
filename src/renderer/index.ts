import Workspace from './workspace';

const workspace = new Workspace(document.querySelector('#view'), {});

// TODO: devmode in environment
if (true) {
  // tslint:disable-next-line
  (<any>window).Core = require('./core').default;
  (<any>window).workspace = workspace;
}
