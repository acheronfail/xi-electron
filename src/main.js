import { app } from 'electron';
import { DEV } from './environment';
import glob from 'glob';
import path from 'path';
import WindowManager from './main/window';

if (DEV) {
  // Autamatically reload the editor on file changes.
  require('electron-reload')(__dirname);
}

// Map SIGINT & SIGTERM to process exit so that they fire exit events on the
// process (so lockfiles are removed).
process.once('SIGINT', () => process.exit(1));
process.once('SIGTERM', () => process.exit(1));

// TODO: handle uncaught errors
// TODO: handle window hangs
// TODO: handle window crashes
// TODO: handle main proc crashes

// Start the app.
function initialise() {
  // Load main process modules.
  const modules = glob.sync(path.join(__dirname, 'main/preload/**/*.js'))
  modules.forEach((module) => require(module));

  app.on('ready', () => {
    // TODO: re-open tabs and windows from last time?
    WindowManager.createWindow();
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
    if (WindowManager.windows.length == 0) {
      WindowManager.createWindow();
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
    initialise();
}
