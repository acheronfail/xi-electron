import path from 'path';
import fs from 'fs-extra';

import { USER_PREFS } from '../../environment';

// Run this config after app initialisation.
process.nextTick(function () {
  // Ensure the preferences file exists.
  fs.outputFile(USER_PREFS, 'test', { flag: 'wx' }, (err) => {
    if (err && err.code != 'EEXIST') throw err;
  });
});
