'use strict';

console.log('Starting build of xi-core...');

const cp = require('child_process');
const fse = require('fs-extra');
const path = require('path');
const which = require('which');

const WIN = process.platform == 'win32';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const XI_CORE = path.join(PROJECT_ROOT, 'xi-editor', 'rust');
const XI_CORE_BUILD = path.join(XI_CORE, 'target', 'release', WIN ? 'xi-core.exe' : 'xi-core');
const XI_CORE_DEST = path.join(PROJECT_ROOT, 'src', 'xi', WIN ? 'xi-core.exe' : 'xi-core');

// Do we have cargo & git? (this will throw if not).
which.sync('git');
which.sync('cargo');

let res = null;
const args = (o) => Object.assign({ encoding: 'utf8', stdio: 'inherit' }, o || {});

// Ensure that the submodule is present.
res = cp.spawnSync('git', ['submodule', 'update', '--init'], args());

// Build xi-core.
res = cp.spawnSync('cargo', ['build', '--release'], args({ cwd: XI_CORE }));
if (res.status != 0) {
  throw res.error || new Error('Could not build xi-core!');
}

// Copy build into project source.
fse.removeSync(XI_CORE_DEST);
fse.copySync(XI_CORE_BUILD, XI_CORE_DEST);

console.log('Build complete!');
console.log(`xi-core was built and placed in: "${XI_CORE_DEST}".`);

// -----------------------------------------------------------------------------

const XI_PLUGINS_DEST = path.join(PROJECT_ROOT, 'src', 'xi', 'plugins');
const XI_PLUGINS_PY = path.join(PROJECT_ROOT, 'xi-editor', 'python');
const XI_PLUGINS_SYNTECT = path.join(XI_CORE, 'syntect-plugin');
const XI_PLUGINS_SYNTECT_MANIFEST = path.join(XI_PLUGINS_SYNTECT, 'manifest.toml');
const XI_PLUGINS_SYNTECT_MANIFEST_DEST = path.join(XI_PLUGINS_DEST, 'syntect', 'manifest.toml');
const XI_PLUGINS_SYNTECT_BUILD = path.join(XI_PLUGINS_SYNTECT, 'target', 'release', WIN ? 'xi-syntect-plugin.exe' : 'xi-syntect-plugin');
const XI_PLUGINS_SYNTECT_DEST = path.join(XI_PLUGINS_DEST, 'syntect', 'bin', WIN ? 'xi-syntect-plugin.exe' : 'xi-syntect-plugin');

// Build plugins that need building.
console.log('Building plugins...');

res = cp.spawnSync('cargo', ['build', '--release'], args({ cwd: XI_PLUGINS_SYNTECT }));
if (res.status != 0) {
  throw res.error || new Error('Could not build syntect-plugin!');
}

// Copy over plugins.
fse.removeSync(XI_PLUGINS_DEST);
fse.copySync(XI_PLUGINS_PY, XI_PLUGINS_DEST);
fse.copySync(XI_PLUGINS_SYNTECT_BUILD, XI_PLUGINS_SYNTECT_DEST);
fse.copySync(XI_PLUGINS_SYNTECT_MANIFEST, XI_PLUGINS_SYNTECT_MANIFEST_DEST);

console.log('Build complete!');
console.log(`Plugins were built and placed in: "${XI_PLUGINS_DEST}".`);
