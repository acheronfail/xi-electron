import url from 'url';
import path from 'path';
import electron from 'electron';
const app = electron.app || electron.remote.app;

// Environment variables.
export const DEV = process.env.NODE_ENV == 'development';
export const PROD = process.env.NODE_ENV == 'production';

// Paths.
export const ROOT = path.resolve(__dirname, '..');
export const CORE_PATH = path.join(ROOT, 'xi-core', 'xi-core');
export const ASSETS = path.join(ROOT, 'assets');
export const UPDATE_SCRIPT = path.join(ROOT, 'main', 'update.js');
export const PRELOAD_SCRIPTS = path.join(ROOT, 'main', 'preload', '**', '*.js');

export const APP_DIR = path.join(app.getPath('userData'));
export const PKG_DIR = path.join(APP_DIR, 'Packages');
export const USER_DIR = path.join(PKG_DIR, 'User');
export const DEFAULT_DIR = path.join(PKG_DIR, 'Default');

export const MAIN_CONFIG_PATH = path.join(APP_DIR, 'Main.xi-conf');
export const ASSET_MAIN_CONFIG = path.join(ASSETS, 'Main.xi-conf');
export const ASSET_DEFAULT_PREFS = path.join(ASSETS, 'Preferences.xi-settings');
export const PREFS_USER_PATH = path.join(USER_DIR, 'Preferences.xi-settings');
export const PREFS_DEFAULT_PATH = path.join(DEFAULT_DIR, 'Preferences.xi-settings');

export const DEFAULT_THEME_DIR = path.join(DEFAULT_DIR, 'theme');
export const DEFAULT_THEME_UI = path.join(DEFAULT_THEME_DIR, 'ui', 'default.scss');
export const DEFAULT_THEME_UI_DARK = path.join(DEFAULT_THEME_DIR, 'ui', 'default-dark.scss');
export const DEFAULT_THEME_SYNTAX = path.join(DEFAULT_THEME_DIR, 'syntax', 'default.scss');
export const DEFAULT_THEME_SYNTAX_DARK = path.join(DEFAULT_THEME_DIR, 'syntax', 'default-dark.scss');

// Lock file for reading / writing settings.
export const PREFS_LOCK = path.join(APP_DIR, '.~xi-preferences');

// URLs.
export const WINDOW_URL = url.format({
  pathname: path.join(ROOT, 'index.html'),
  protocol: 'file:',
  slashes: true
});

// Enums.
// Exit codes.
export const EXIT_EXTERNAL = 1;
export const EXIT_UNCAUGHT = 2;
// Update environment variables.
export const UPDATE_NONE = 0;
export const UPDATE_FIRST = 1;
export const UPDATE_VERSION = 2;
export const UPDATE_FORCE = 3;


// Other.

// This is the current version of the app. Used to detect if
// the app should run its update scripts or not.
export const VERSION = app.getVersion();
