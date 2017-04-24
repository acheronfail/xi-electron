import url from 'url';
import path from 'path';
import electron from 'electron';
const app = electron.app || electron.remote.app;

// Environment variables.
export const DEV = process.env.NODE_ENV == 'development';
export const PROD = process.env.NODE_ENV == 'production';

// Paths.
export const CORE_PATH = path.join(__dirname, 'xi-core', 'xi-core');
export const APP_DIR = path.join(app.getPath('userData'));
export const PKG_DIR = path.join(APP_DIR, 'Packages');
export const USER_DIR = path.join(PKG_DIR, 'User');
export const PREFS_USER_PATH = path.join(USER_DIR, 'Preferences.xi-settings');
export const PREFS_DEFAULT_PATH = path.join(PKG_DIR, 'Preferences.xi-settings');

// Lock file for reading / writing settings.
export const PREFS_LOCK = path.join(APP_DIR, '.~xi-preferences.lock');

// URLs.
export const WINDOW_URL = url.format({
  pathname: path.join(__dirname, 'index.html'),
  protocol: 'file:',
  slashes: true
});
