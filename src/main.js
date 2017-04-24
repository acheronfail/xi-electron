import { app, BrowserWindow } from 'electron';
import { DEV } from './environment';
import glob from 'glob';
import path from 'path';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

if (DEV) {
  // Autamatically reload the editor on file changes.
  require('electron-reload')(__dirname);
}

// Start the app.
function initialise() {
  // Load main process modules.
  const modules = glob.sync(path.join(__dirname, 'main/preload/**/*.js'))
  modules.forEach((module) => require(module));

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
    });

    mainWindow.loadURL(`file://${__dirname}/index.html`);

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    if (DEV) {
      mainWindow.webContents.openDevTools();
    }
  };

  app.on('ready', () => {
    // Load our config.
    require(path.join(__dirname, 'main/config.js'));
    // Create window.
    createWindow();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow();
    }
  });
}

// Handle Squirrel on Windows startup events.
switch (process.argv[1]) {
  // case '--squirrel-install':
  //   autoUpdater.createShortcut(function () { app.quit() })
  //   break
  // case '--squirrel-uninstall':
  //   autoUpdater.removeShortcut(function () { app.quit() })
  //   break
  // case '--squirrel-obsolete':
  // case '--squirrel-updated':
  //   app.quit()
  //   break
  default:
    initialise()
}
