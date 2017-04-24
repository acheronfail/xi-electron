import { ipcMain } from 'electron';
import { showErrorBox } from './dialog';

ipcMain.on('dialog-error', (e, ...args) => {
  showErrorBox(...args);
});
