'use strict';

const path = require('path');
const which = require('which');

// Do we have cargo & git? (this will throw if not).
which.sync('git');
which.sync('cargo');

const WIN = process.platform == 'win32';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const XI_CORE = path.join(PROJECT_ROOT, 'xi-editor', 'rust');
const XI_CORE_BUILD = path.join(XI_CORE, 'target', 'debug', WIN ? 'xi-core.exe' : 'xi-core');
const XI_CORE_DIR = path.join(PROJECT_ROOT, 'src', 'xi');
const XI_CORE_DEST = path.join(XI_CORE_DIR, WIN ? 'xi-core.exe' : 'xi-core');
const XI_PLUGINS_DEST = path.join(XI_CORE_DIR, 'plugins');
const XI_PLUGINS_PY = path.join(PROJECT_ROOT, 'xi-editor', 'python');
const XI_PLUGINS_SYNTECT = path.join(XI_CORE, 'syntect-plugin');
const XI_PLUGINS_SYNTECT_MANIFEST = path.join(XI_PLUGINS_SYNTECT, 'manifest.toml');
const XI_PLUGINS_SYNTECT_MANIFEST_DEST = path.join(XI_PLUGINS_DEST, 'syntect', 'manifest.toml');
const XI_PLUGINS_SYNTECT_BUILD = path.join(XI_CORE, 'target', 'debug', WIN ? 'xi-syntect-plugin.exe' : 'xi-syntect-plugin');
const XI_PLUGINS_SYNTECT_DEST = path.join(XI_PLUGINS_DEST, 'syntect', 'bin', WIN ? 'xi-syntect-plugin.exe' : 'xi-syntect-plugin');

module.exports = {
  PROJECT_ROOT,
  XI_CORE,
  XI_CORE_BUILD,
  XI_CORE_DIR,
  XI_CORE_DEST,
  XI_PLUGINS_DEST,
  XI_PLUGINS_PY,
  XI_PLUGINS_SYNTECT,
  XI_PLUGINS_SYNTECT_MANIFEST,
  XI_PLUGINS_SYNTECT_MANIFEST_DEST,
  XI_PLUGINS_SYNTECT_BUILD,
  XI_PLUGINS_SYNTECT_DEST
};

