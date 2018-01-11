import * as path from 'path';

// environment
export const DEVMODE = /node_modules[\\/]electron[\\/]/.test(process.execPath);
export const MACOS = process.platform === 'darwin';

// project dirs
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
export const SOURCE_DIR = path.join(PROJECT_ROOT, 'src');

// xi-core
export const XI_CORE_DIR = path.join(SOURCE_DIR, 'xi-core');
export const XI_CORE_BIN = path.join(XI_CORE_DIR, 'xi-core');
export const XI_PLUGIN_DIR = path.join(SOURCE_DIR, 'xi-plugins');
