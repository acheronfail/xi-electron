import { BrowserWindow, ipcMain } from 'electron';
import { DEV, WINDOW_URL } from '../common/environment';

const DEFAULT_BOUNDS = {
  width: 800,
  height: 600
};

class WindowManager {
  constructor() {
    this.send = send;
    // We keep references to all our windows here. They are stored like so:
    // [
    //   { win: <BrowserWindow>, data: { ... } }
    // ]
    this.windows = [];
  }

  // TODO: async passing of view data to WindowManager so that we can
  // close the window quickly without communication b/w renderer and main

  saveWindowState() {
    return this.windows.map(({ win, data }) => {
      return {
        bounds: win.getBounds(),
        data: data || {}
      };
    });
  }

  restoreWindowState(states = null) {
    if (states) {
      states.forEach(({ bounds, data }) => {
        this.createWindow(data.paths || [], bounds);
      });
    } else {
      this.createWindow();
    }
  }

  // Create a new window.
  createWindow(paths = [], bounds = DEFAULT_BOUNDS) {
    const opts = Object.assign({ show: false }, bounds);
    const win = new BrowserWindow(opts);
    win.loadURL(WINDOW_URL);

    // Save our window.
    const index = this.windows.push({ win }) - 1;

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
    this.windows.forEach(({ win }) => send(win, method, ...args));
  }
}

// Export a single WindowManager instance.
export default new WindowManager();

// Helper function for sending messages to windows.
export function send(win, method, ...args) {
  win.webContents.send('message', method, ...args);
}
