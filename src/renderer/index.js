import Workspace from './lib/workspace';
import { ipcRenderer, remote } from 'electron';

const workspace = window.workspace = new Workspace(
  document.querySelector('#xi-root'),
  remote.require('electron-settings')
);

ipcRenderer.on('message', (e, method, ...args) => {
  workspace.message(method, ...args);
});
