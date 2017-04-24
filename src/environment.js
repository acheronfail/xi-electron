import url from 'url';
import path from 'path';
import electron from 'electron';
const app = electron.app || electron.remote.app;

// Environment variables.
export const DEV = process.env.NODE_ENV == 'development';
export const PROD = process.env.NODE_ENV == 'production';

// Paths.
export const CORE_PATH = path.join(__dirname, 'xi-core', 'xi-core');
export const USER_DIR = path.join(app.getPath('userData'), 'User');
export const USER_PREFS = path.join(USER_DIR, 'Preferences.xi-settings');

// URLs.
export const WINDOW_URL = url.format({
  pathname: path.join(__dirname, 'index.html'),
  protocol: 'file:',
  slashes: true
});
