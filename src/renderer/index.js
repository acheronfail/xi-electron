import Workspace from './lib/workspace';
import { ipcRenderer } from 'electron';

const workspace = window.workspace = new Workspace(document.querySelector('#xi-root'));

ipcRenderer.on('message', (e, method, ...args) => {
  workspace.message(method, ...args);
});
