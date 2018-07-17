import * as path from 'path';

// environment
export const DEVMODE = /node_modules[\\/]electron[\\/]/.test(process.execPath);
export const MACOS = process.platform === 'darwin';
export const WIN = process.platform === 'win32';

// project dirs
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
export const SOURCE_DIR = path.join(PROJECT_ROOT, 'src');

// xi-core
export const XI_CORE_DIR = path.join(SOURCE_DIR, 'xi');
export const XI_CORE_BIN = path.join(XI_CORE_DIR, WIN ? 'xi-core.exe' : 'xi-core');
