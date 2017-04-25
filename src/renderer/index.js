import Workspace from './lib/workspace';
import { loadSettings } from '../common/settings';
import { ipcRenderer, remote } from 'electron';

// Load workspace after settings are ready.
const settings = loadSettings();
settings.on('ready', () => {
  window.workspace = new Workspace(
    document.querySelector('#xi-root'),
    settings
  );
});

// Renderer IPC events.

// Emitted when parsing boot args to a workspace.
// TODO: put this info in settings so it's available earlier?
ipcRenderer.once('args', (e, filepaths) => {
  filepaths.forEach((filepath) => {
    workspace.newView({ 'file_path': filepath });
  });
});

// Standard message passing between main and renderer.
ipcRenderer.on('message', (e, method, ...args) => {
  workspace.message(method, ...args);
});
