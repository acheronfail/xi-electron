import Workspace from './workspace';

const workspace = new Workspace(document.querySelector('#view'), {});

// TODO: debug?
if (true) {
  window.workspace = workspace;
  window.Core = require('./core').default;
}
