import { BrowserWindow, ipcMain } from 'electron';
import { DEV, WINDOW_URL } from '../common/environment';


class WindowManager {
  constructor() {
    this.windows = [];
    this.send = send;
  }

  //
  serialise() {
    const results = this.windows.map((win) => {
      return new Promise((resolve, reject) => {
        ipcMain.once(`__serialise__${win.id}__`, (e, text) => {
          resolve(JSON.stringify({
            bounds: win.getBounds(),
            views: text
          }));
        });

        win.webContents.send('__serialise__', win.id);
      });
    });

    return new Promise((resolve, reject) => {
      Promise.all(results).then((data) => {
        try {
          resolve(JSON.stringify(data));
        } catch (err) {
          reject(err);
        }
      }).catch(resolve);
    });
  }

  // Create a new window.
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

  // Send a message to all windows.
  sendToAll(method, ...args) {
    this.windows.forEach((win) => send(win, method, ...args));
  }
}

// Export a single WindowManager instance.
export default new WindowManager();

// Helper function for sending messages to windows.
export function send(win, method, ...args) {
  win.webContents.send('message', method, ...args);
}
