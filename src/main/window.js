import { BrowserWindow } from 'electron';
import { DEV, WINDOW_URL } from '../environment';


class WindowManager {
  constructor() {
    this.windows = [];
  }

  createWindow(paths = [], dimensions = [800, 600]) {
    const win = new BrowserWindow({
      show: false,
      width: dimensions[0],
      height: dimensions[1]
    });
    win.loadURL(WINDOW_URL);

    // Save our window.
    const index = this.windows.push(win) - 1;

    // Remove our reference to it when it's closed.
    win.on('closed', () => this.windows.splice(index, 1));

    // Show the window when it's ready and send it's args.
    win.on('ready-to-show', () => {
      // Open devTools if in development mode.
      if (DEV) win.webContents.openDevTools();
      process.nextTick(() => {
        win.show();
        win.webContents.send('args', paths);
      });
    });

    return win;
  }
}

export default new WindowManager();
