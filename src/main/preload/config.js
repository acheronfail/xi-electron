import path from 'path';
import fs from 'fs-extra';
import WindowManager from '../window';
import { PREFS_LOCK, ASSET_DEFAULT_PREFS, PREFS_DEFAULT_PATH, PREFS_USER_PATH } from '../../common/environment';

// Run this config after app initialisation.
process.nextTick(function () {

  // Ensure our lockfile is present.
  fs.outputFileSync(PREFS_LOCK, `${process.pid}`);

  // Write but don't overwrite files.
  const opts = { flag: 'wx', spaces: 2 };

  // Ensure the default preferences file exists.
  // TODO: if this file is corrupt we should return it to its default value.
  fs.readFile(ASSET_DEFAULT_PREFS, 'utf8', (err, data) => {
    fs.outputFile(PREFS_DEFAULT_PATH, data, opts, (err) => {
      if (err && err.code != 'EEXIST') throw err;
    });
  });

  // Ensure the user preferences file exists.
  fs.outputFile(PREFS_USER_PATH, {}, opts, (err) => {
    if (err && err.code != 'EEXIST') throw err;
  });


  // ...


  // If there are any windows, tell them that config is ready.
  WindowManager.sendToAll('config-ready');
});
