import path from 'path';
import fs from 'fs-extra';
import WindowManager from '../window';
import { PREFS_LOCK, PREFS_DEFAULT_PATH, PREFS_USER_PATH } from '../../environment';

const PREFS_DEFAULT = {
  theme: {
    ui: 'Packages/Default/theme/ui/default.scss',
    syntax: 'Packages/Default/theme/syntax/default.scss'
  },
  view: {
    active_line: true
  }
};

// Run this config after app initialisation.
process.nextTick(function () {

  // Ensure our lockfile is present.
  fs.outputFileSync(PREFS_LOCK, `${process.pid}`);

  // Write but don't overwrite files.
  const opts = { flag: 'wx', spaces: 2 };

  // Ensure the default preferences file exists.
  // TODO: if this file is corrupt we should return it to its default value.
  // On updates, this file should be overwritten as well.
  fs.outputJson(PREFS_DEFAULT_PATH, PREFS_DEFAULT, opts, (err) => {
    if (err && err.code != 'EEXIST') throw err;
  });

  // Ensure the user preferences file exists.
  fs.outputJson(PREFS_USER_PATH, {}, opts, (err) => {
    if (err && err.code != 'EEXIST') throw err;
  });


  // ...


  // If there are any windows, tell them that config is ready.
  WindowManager.sendToAll('config-ready');
});
