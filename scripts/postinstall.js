console.log('postinstall');
console.log('Attempting to build xi-core...');

const cp = require('child_process');
const fse = require('fs-extra');
const path = require('path');
const which = require('which');

// Adds unix-like `pushdir` and `popdir` to the process object.
require("dirutils");

const PROJECT_ROOT = path.resolve(__dirname, '..');
const XI_CORE = path.join(PROJECT_ROOT, 'xi-editor');
const XI_CORE_RUST = path.join(XI_CORE, 'rust');
const XI_CORE_BUILD = path.join(XI_CORE_RUST, 'target', 'debug');
const XI_CORE_DEST = path.join(PROJECT_ROOT, 'src', 'xi-core');

const XI_PLUGINS_PY = path.join(XI_CORE, 'python');
const XI_PLUGINS_SYNTECT = path.join(XI_CORE_RUST, 'syntect-plugin');
const XI_PLUGINS_SYNTECT_BUILD = path.join(XI_PLUGINS_SYNTECT, 'target', 'debug', 'xi-syntect-plugin');
const XI_PLUGINS_DEST = path.join(PROJECT_ROOT, 'src', 'xi-plugins');

// Do we have cargo? (this will throw if not).
which.sync('cargo');

// Build xi-core.
process.pushdir(XI_CORE_RUST);
let res = cp.spawnSync('cargo', ['build'], { encoding: 'utf8', stdio: 'inherit' });
if (res.status != 0) {
  throw result.error || new Error('Could not build xi-core!');
}
process.popdir();

// Copy build into project source.
fse.removeSync(XI_CORE_DEST);
fse.ensureDirSync(XI_CORE_DEST);
fse.copySync(XI_CORE_BUILD, XI_CORE_DEST);

console.log('Build complete!');
console.log(`xi-core was built and placed in: "${XI_CORE_DEST}".`);

// -----------------------------------------------------------------------------

// Build plugins that need building.
console.log('Building plugins...');

process.pushdir(XI_PLUGINS_SYNTECT);
res = cp.spawnSync('cargo', ['build'], { encoding: 'utf8', stdio: 'inherit' });
if (res.status != 0) {
  throw result.error || new Error('Could not build syntect-plugin!');
}
process.popdir();

// Copy over plugins.
fse.removeSync(XI_PLUGINS_DEST);
fse.copySync(XI_PLUGINS_PY, XI_PLUGINS_DEST);
fse.copySync(XI_PLUGINS_SYNTECT_BUILD, path.join(XI_PLUGINS_DEST, 'xi-syntect-plugin'));
