import { ipcMain } from 'electron';
import { openFile, openFolder, showErrorBox } from '../dialog';

export function init() {
  // ...
}

// Unique instance id of each view. We handle it here in the main
// process so that no matter how many windows are open, each view
// gets a unique id.
let instanceId = 0;
// NB: This is a synchronous event!
ipcMain.on('request-instance-id', (e) => {
  e.returnValue = instanceId++;
});

/**
 * Dialog.
 */

ipcMain.on('dialog-error', (e, ...args) => {
  showErrorBox(...args);
});

ipcMain.on('dialog-open-file', (e, win, opts) => {
  openFile(win || w(e), opts);
});

ipcMain.on('dialog-open-folder', (e, win, opts) => {
  openFolder(win || w(e), opts);
});

/**
 * Helpers.
 */

// Gets the BrowserWindow from an event.
function w(e) {
  return BrowserWindow.fromWebContents(e.sender);
}
