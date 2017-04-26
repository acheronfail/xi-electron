import { ipcMain } from 'electron';
import { openFile, openFolder, showErrorBox } from '../dialog';

export function init() {
  // ...
}

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
