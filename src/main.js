import glob from 'glob';
import { app } from 'electron';

import { releaseLock } from './common/lock';
import { DEV, PRELOAD_SCRIPTS, EXIT_EXTERNAL, EXIT_UNCAUGHT } from './common/environment';
import WindowManager from './main/window';

if (DEV) {
  // Autamatically reload the editor on file changes.
  require('electron-reload')(__dirname);
}

// Map SIGINT & SIGTERM to process exit so that they fire exit events on the
// process (so our lockfiles are removed).
process.once('SIGINT', () => process.exit(EXIT_EXTERNAL));
process.once('SIGTERM', () => process.exit(EXIT_EXTERNAL));

// Cleanup our resources on uncaught exceptions.
process.on('uncaughtException', (err) => {
  releaseLock();

  console.error('Uncaught error!');
  console.error(err);
  // TODO: log/report crashes
  process.exit(EXIT_UNCAUGHT);
});

// TODO: handle window hangs
// TODO: handle window crashes

// Start the app.
function initialise() {
  // Load main process modules.
  glob.sync(PRELOAD_SCRIPTS).forEach((script) => require(script));

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

  app.on('before-quit', () => {
    console.log(WindowManager.windows.length)
  });
}


// We're ready! Start 'er up!
initialise();
