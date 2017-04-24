import settings from 'electron-settings';
import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';

// Constants that aren't ready until the app is ready should return
// null if they are requested beforehand.
// Also, if `electron.app` is `null` then we're in the renderer process.
const CONFIG_PATH = (function () {
  if (!app || !app.isReady()) return null;
  return path.join(app.getPath('userData'), 'User');
})();

// Do settings setup here...

// Make sure you don't use this instance of electron-settings at the
// same time as one in a renderer process! Or them, together:
// https://github.com/nathanbuchar/electron-settings/issues/81


// Ensure our folders exist.
fs.ensureDir(CONFIG_PATH, (err) => {
  if (err) throw err;
});
