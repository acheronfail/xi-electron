// @flow
import Workspace from './workspace';

const workspace = new Workspace(document.querySelector('#view'), {});

// TODO: devmode in environment
if (true) {
  window.workspace = workspace;
  window.Core = require('./core').default;
}
