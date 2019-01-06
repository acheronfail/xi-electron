'use strict';

console.log('Starting build of xi-core...');

const cp = require('child_process');
const fse = require('fs-extra');
const paths = require('./paths');

let res = null;
const args = (o) => Object.assign({ encoding: 'utf8', stdio: 'inherit' }, o || {});

// Ensure that the submodule is present.
res = cp.spawnSync('git', ['submodule', 'update', '--init'], args());

// Build xi-core.
res = cp.spawnSync('cargo', ['build'], args({ cwd: paths.XI_CORE }));
if (res.status != 0) {
  throw res.error || new Error('Could not build xi-core!');
}

// Copy build into project source.
fse.removeSync(paths.XI_CORE_DEST);
fse.copySync(paths.XI_CORE_BUILD, paths.XI_CORE_DEST);

console.log('Build complete!');
console.log(`xi-core was built and placed in: "${paths.XI_CORE_DEST}".`);

// -----------------------------------------------------------------------------

// Build plugins that need building.
console.log('Building plugins...');

res = cp.spawnSync('cargo', ['build'], args({ cwd: paths.XI_PLUGINS_SYNTECT }));
if (res.status != 0) {
  throw res.error || new Error('Could not build syntect-plugin!');
}

// Copy over plugins.
fse.removeSync(paths.XI_PLUGINS_DEST);
fse.copySync(paths.XI_PLUGINS_PY, paths.XI_PLUGINS_DEST);
fse.copySync(paths.XI_PLUGINS_SYNTECT_BUILD, paths.XI_PLUGINS_SYNTECT_DEST);
fse.copySync(paths.XI_PLUGINS_SYNTECT_MANIFEST, paths.XI_PLUGINS_SYNTECT_MANIFEST_DEST);

console.log('Build complete!');
console.log(`Plugins were built and placed in: "${paths.XI_PLUGINS_DEST}".`);
