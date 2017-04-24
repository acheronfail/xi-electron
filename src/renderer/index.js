import Workspace from './lib/workspace';
import { loadSettings } from './lib/settings';
import { ipcRenderer, remote } from 'electron';

const workspace = window.workspace = new Workspace(
  document.querySelector('#xi-root'),
  loadSettings()
);

ipcRenderer.once('args', (e, filepaths) => {
  filepaths.forEach((filepath) => {
    workspace.newView({ 'file_path': filepath });
  });
});

ipcRenderer.on('message', (e, method, ...args) => {
  workspace.message(method, ...args);
});
