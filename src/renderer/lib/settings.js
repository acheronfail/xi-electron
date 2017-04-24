import assert from 'assert';
import { ipcRenderer } from 'electron';
import strip from 'strip-json-comments';
import lockfile from 'proper-lockfile';
import { PREFS_LOCK, PREFS_DEFAULT_PATH, PREFS_USER_PATH } from '../../environment';
import fs from 'fs-extra';
import EventEmitter from './events';

/**
 * Settings module.
 */

// TODO: make like sublime's load_settings
// recurse Packages dir and find and load all files, returning the
// final object.

export function loadSettings(/* filename */) {
  // return a Settings class.
  return new Settings([PREFS_DEFAULT_PATH, PREFS_USER_PATH]);
}

class Settings extends EventEmitter {
  constructor(paths = []) {
    super();

    this._watchers = {};

    // Read each file, parse, and combine into object in given order.
    this._paths = paths;
    this._load();
  }

  // Loads the settings.
  _load(callback) {
    this._store = Object.assign({}, ...this._paths.map((p) => this._read(p)));
    if (callback && typeof callback == 'function') callback();
  }

  // Read and parse a JSON file with comments.
  _read(filepath) {
    try {
      const json = fs.readFileSync(filepath, 'utf8');
      this._watchFile(filepath);
      // Strip and parse JSON text.
      try {
        return JSON.parse(strip(json));
      } catch (err) {
        // Could not parse the file - may not be correct JSON.
        // Notify the user.
        ipcRenderer.send('dialog-error', 'Error trying to parse settings', err.message);
        return {};
      }
    } catch (err) {
      // Could not read the file. The user may not have permission to
      // access the file or directory. Notify user.
      ipcRenderer.send('dialog-error', 'Error trying to parse settings', err.message);
      return {};
    }
  }

  _watchFile(filepath) {
    if (!this._watchers[filepath]) {
      try {
        this._watchers[filepath] = fs.watch(filepath, this._onFileChange.bind(this, filepath));
      } catch (err) {
        // File may not exist yet or the user may not have permission to
        // access the file or directory. Fail gracefully.
      }
    }
  }

  _unwatchFile(filepath, reset = false) {
    if (this._watchers[filepath]) {
      this._watchers[filepath].close();
      delete this._watchers[filepath];

      if (reset) {
        this._watchFile(filepath);
      }
    }
  }

  _onFileChange(filepath, eventType) {
    // Reload settings and emit change event.
    if (eventType == 'change') {
      this._load(() => this.emit('change'));
    }

    else if (eventType == 'rename') {
      this._unwatchFile(filepath, true);
    }
  }

  // Get a key from settings using dot-notation.
  get(keyPath, defaultValue) {
    assert.strictEqual(typeof keyPath, 'string', 'First parameter must be a string. Did you mean to use `getAll()` instead?');

    const exists = hasKeyPath(this._store, keyPath);
    const value = getValueAtKeyPath(this._store, keyPath);

    if (!exists && typeof defaultValue !== 'undefined') {
      return defaultValue;
    }

    return value;
  }

  getAll() {
    return this._store;
  }

  // TODO: implement set methods
  //        - keep objects separate so we can write to them?
  // TODO: implement save to disk (save this._store)
}


/**
 * File operations.
 */

// Time in ms after which to abort the operation.
const MAX_WAIT = 10000;
// Time in ms to wait before retrying before a read op.
const POLL_READ = 25;
// Time in ms to wait before retrying before a write op.
const POLL_WRITE = 250;

// Request access to write the settings files.
function request(op, wait, _start) {
  _start = _start || Date.now();

  lockfile.lock(PREFS_LOCK, compromised, (err, release) => {
    if (err) return compromised(err);
    op(release);
  });

  function compromised(err) {
    // Abort if we've been trying too long.
    if (Date.now() - _start > MAX_WAIT) {
      throw new Error('Request timed out.');
    }
    // If resource still locked, keep trying trying.
    if (err.code == 'ELOCKED') {
      setTimeout(() => request(op, wait, _start), wait);
    }
  }
}


/**
 * Dot-notation helpers.
 */

// Checks if the given object contains the given key path.
function hasKeyPath(obj, keyPath) {
  const keys = keyPath.split(/\./);

  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];

    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj = obj[key];
    } else {
      return false;
    }
  }

  return true;
}

// Gets the value of the given object at the given key path.
function getValueAtKeyPath(obj, keyPath) {
  const keys = keyPath.split(/\./);

  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];

    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj = obj[key];
    } else {
      return undefined;
    }
  }

  return obj;
}
