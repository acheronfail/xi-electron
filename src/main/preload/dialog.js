import { ipcMain, dialog, BrowserWindow } from 'electron';
import { send } from '../utils';

/**
 * Open File.
 */
export function openFile(win = null, opts = {}) {
  opts.properties = ['openFile'];
  dialog.showOpenDialog(win, opts, (files) => {
    if (files) {
      send(win, 'dialog-open-file', files);
    }
  });
}

ipcMain.on('dialog-open-file', (e, win, opts) => {
  openFile(win || w(e), opts);
});

/**
 * Open Folder.
 */
export function openFolder(win = null, opts = {}) {
  opts.properties = ['openDirectory'];
  dialog.showOpenDialog(win, opts, (files) => {
    if (files) {
      send(win, 'dialog-open-folder', files);
    }
  });
}

ipcMain.on('dialog-open-folder', (e, win, opts) => {
  openFolder(win || w(e), opts);
});


// Gets the BrowserWindow from an event.
function w(e) {
  return BrowserWindow.fromWebContents(e.sender);
}
