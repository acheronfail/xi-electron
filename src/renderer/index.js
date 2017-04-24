import Workspace from './lib/workspace';
import settings from 'electron-settings';
import { ipcRenderer, remote } from 'electron';

const workspace = window.workspace = new Workspace(
  document.querySelector('#xi-root'),
  settings
);

ipcRenderer.on('message', (e, method, ...args) => {
  workspace.message(method, ...args);
});
