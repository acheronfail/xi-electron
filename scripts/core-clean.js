'use strict';

console.log('Cleaning xi-core...');

const cp = require('child_process');
const fse = require('fs-extra');
const paths = require('./paths');

const cargoPackages = [paths.XI_CORE, paths.XI_PLUGINS_SYNTECT];
const dirsToClean = [paths.XI_CORE_DIR];

let res;
for (const pkgPath of cargoPackages) {
  res = cp.spawnSync('cargo', ['clean'], { encoding: 'utf8', stdio: 'inherit', cwd: pkgPath });
  if (res.status != 0) {
    throw res.error || new Error(`Failed to cargo clean ${pkgPath}`);
  }
}

for (const dirPath of dirsToClean) {
  fse.removeSync(dirPath);
}

console.log('Clean complete! Be sure to run `yarn core:build` again.');
