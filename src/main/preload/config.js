import path from 'path';
import fs from 'fs-extra';
import WindowManager from '../window';
import * as ENV from '../../common/environment';
import { encrypt } from '../../common/encryption';

export function init() {
  // Run this config after app initialisation.
  process.nextTick(function () {

    // Ensure the main config file exists.
    // NOTE: This file shouldn't ever be changed by the user.
    fs.readFile(ENV.ASSET_MAIN_CONFIG, 'utf8', (err, data) => {
      fs.outputFile(ENV.MAIN_CONFIG_PATH, encrypt(data), opts, (err) => {
        if (err && err.code != 'EEXIST') throw err;
      });
    });

    // Ensure our lockfile is present.
    fs.outputFileSync(ENV.PREFS_LOCK, `${process.pid}`);

    // Write but don't overwrite files.
    const opts = { flag: 'wx', spaces: 2 };

    // Ensure the default preferences file exists.
    // TODO: if this file is corrupt we should return it to its default value.
    fs.readFile(ENV.ASSET_DEFAULT_PREFS, 'utf8', (err, data) => {
      fs.outputFile(ENV.PREFS_DEFAULT_PATH, data, opts, (err) => {
        if (err && err.code != 'EEXIST') throw err;
      });
    });

    // Ensure the user preferences file exists.
    fs.outputFile(ENV.PREFS_USER_PATH, '{\n  \n}\n', opts, (err) => {
      if (err && err.code != 'EEXIST') throw err;
    });


    // ...


    // If there are any windows, tell them that config is ready.
    WindowManager.sendToAll('config-ready');
  });
}
