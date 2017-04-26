import glob from 'glob';
import { app } from 'electron';

import { loadSettings }  from './common/settings';
import { releaseLock } from './common/lock';
import * as ENV from './common/environment';
import WindowManager from './main/window';

if (ENV.DEV) {
  // Autamatically reload the editor on file changes.
  require('electron-compile').enableLiveReload();
}

// Map SIGINT & SIGTERM to process exit so that they fire exit events on the
// process (so our lockfiles are removed).
process.once('SIGINT', () => process.exit(ENV.EXIT_EXTERNAL));
process.once('SIGTERM', () => process.exit(ENV.EXIT_EXTERNAL));

// Clean up our resources on uncaught exceptions.
process.on('uncaughtException', (err) => {
  releaseLock();

  console.error('Uncaught error!');
  console.error(err);
  // TODO: log/report crashes
  process.exit(ENV.EXIT_UNCAUGHT);
});

// TODO: handle window hangs
// TODO: handle window crashes

// Start loading our base settings now.
const settings = loadSettings('Main.xi-conf');
let isReady = false;

// Wait until settings are ready before we load the app.
function ready() {
  return new Promise((resolve, reject) => {
    // Load main process modules.
    glob.sync(ENV.PRELOAD_SCRIPTS).forEach((script) => {
      require(script).init();
    });
    // Wait until our settings are ready.
    settings.on('ready', resolve);
  });
}

// Wait until we're ready, then start 'er up!
app.on('ready', async () => {
  // After we've prepared the main process, wait for the settings
  // and then start up our renderer processes.
  await ready();
  isReady = true;

  // Check if we need to run the update script or not.
  if (settings.get('UPDATE_FIRST') == false) {
    require(ENV.UPDATE_SCRIPT)(ENV.UPDATE_FIRST, settings);
  } else if (ENV.PROD && (settings.get('UPDATE_VERSION') != ENV.VERSION)) {
    require(ENV.UPDATE_SCRIPT)(ENV.UPDATE_VERSION, settings);
  } else if (settings.get('UPDATE_FORCE')) {
    require(ENV.UPDATE_SCRIPT)(ENV.UPDATE_FORCE, settings);
  }

  // Open our windows.
  WindowManager.restoreWindowState(settings.get('window-state'));
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
    if (isReady) WindowManager.createWindow();
  }
});

// Serialise window state on exit for next app start.
app.on('before-quit', () => {
  if (isReady) {
    const state = WindowManager.saveWindowState(settings);
    settings.set('window-state', state);
    settings.save();
  }
});
