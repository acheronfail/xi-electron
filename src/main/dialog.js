import { dialog, BrowserWindow } from 'electron';
import { send } from './window';

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

/**
 * Export dialog methods.
 */

// export function showMessageBox(win, opts) {}

export function showErrorBox(title, content) {
  dialog.showErrorBox(title, content);
}
