console.log('Starting build of xi-core...');

const cp = require('child_process');
const fse = require('fs-extra');
const path = require('path');
const which = require('which');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const XI_CORE = path.join(PROJECT_ROOT, 'xi-editor', 'rust');
const XI_CORE_BUILD = path.join(XI_CORE, 'target', 'release', 'xi-core');
const XI_CORE_DEST = path.join(PROJECT_ROOT, 'src', 'xi', 'xi-core');

// Do we have cargo? (this will throw if not).
which.sync('cargo');

// Build xi-core.
let res = cp.spawnSync('cargo', ['build', '--release'], {
  encoding: 'utf8',
  stdio: 'inherit',
  cwd: XI_CORE
});
if (res.status != 0) {
  throw result.error || new Error('Could not build xi-core!');
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
const XI_PLUGINS_SYNTECT_BUILD = path.join(XI_PLUGINS_SYNTECT, 'target', 'release', 'xi-syntect-plugin');
const XI_PLUGINS_SYNTECT_DEST = path.join(XI_PLUGINS_DEST, 'syntect', 'bin', 'xi-syntect-plugin');

// Build plugins that need building.
console.log('Building plugins...');

res = cp.spawnSync('cargo', ['build', '--release'], {
  encoding: 'utf8',
  stdio: 'inherit',
  cwd: XI_PLUGINS_SYNTECT
});
if (res.status != 0) {
  throw result.error || new Error('Could not build syntect-plugin!');
}

// Copy over plugins.
fse.removeSync(XI_PLUGINS_DEST);
fse.copySync(XI_PLUGINS_PY, XI_PLUGINS_DEST);
fse.copySync(XI_PLUGINS_SYNTECT_BUILD, XI_PLUGINS_SYNTECT_DEST);
fse.copySync(XI_PLUGINS_SYNTECT_MANIFEST, XI_PLUGINS_SYNTECT_MANIFEST_DEST);

console.log('Build complete!');
console.log(`Plugins were built and placed in: "${XI_PLUGINS_DEST}".`);
