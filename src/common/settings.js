import electron from 'electron';
import assert from 'assert';
import strip from 'strip-json-comments';
import fs from 'fs-extra';

import { MAIN_CONFIG_PATH, PREFS_DEFAULT_PATH, PREFS_USER_PATH } from './environment';
import EventEmitter from './events';
import { requestLock } from './lock';
import { encrypt, decrypt } from './encryption';

/**
 * Settings module.
 */

// TODO: make like sublime's load_settings
// recurse Packages dir and find and load all files, returning the
// final object.

export function loadSettings(filename) {
  // TODO: actually build logic here.
  // TODO: if file is conf, when writing, encrypt file.
  if (filename == 'Main.xi-conf') {
    return new Settings([MAIN_CONFIG_PATH], true);
  }

  // return a Settings class.
  return new Settings([PREFS_DEFAULT_PATH, PREFS_USER_PATH]);
}

class Settings extends EventEmitter {
  constructor(paths = [], encrypted = false) {
    super();

    // We don't want this changing.
    Object.defineProperty(this, '_encrypted', {
      value: encrypted,
      writable: false
    });

    this._watchers = {};

    // Read each file, parse, and combine into object in given order.
    this._paths = paths;
    this._load('ready');
  }

  // Loads the settings.
  _load(event) {
    // Lock the resource to ensure we're the only ones reading from prefs.
    requestLock((err, release) => {
      if (err) throw err;
      // Read each preferences file.
      this._store = Object.assign({}, ...this._paths.map((p) => this._read(p)));
      // Release the lock on our file.
      release();
      // Emit event asynchronously.
      process.nextTick(() => this.emit(event));
    });
  }

  // Read and parse a JSON file with comments.
  _read(filepath) {
    try {
      // Get and strip comments from JSON.
      const json = strip(fs.readFileSync(filepath, 'utf8'));
      this._watchFile(filepath);
      // Strip and parse JSON text.
      try {
        return JSON.parse(this._encrypted ? decrypt(json) : json);
      } catch (err) {
        // Could not parse the file - may not be correct JSON.
        // Notify the user.
        alertError('Error trying to parse settings', err.message);
        return {};
      }
    } catch (err) {
      // Could not read the file. The user may not have permission to
      // access the file or directory. Notify user.
      alertError('Error trying to parse settings', err.message);
      return {};
    }
  }

  _write(filepath) {

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
      this._load('change');
    }

    else if (eventType == 'rename') {
      this._unwatchFile(filepath, true);
    }
  }

  // Get a key from settings using dot-notation.
  get(keyPath, defaultValue) {
    assert.strictEqual(typeof keyPath, 'string', 'First parameter must be a string. Did you mean to use `all()` instead?');

    const exists = hasKeyPath(this._store, keyPath);
    const value = getValueAtKeyPath(this._store, keyPath);

    if (!exists && typeof defaultValue !== 'undefined') {
      return defaultValue;
    }

    return value;
  }

  set(keyPath, value) {
    assert.strictEqual(typeof keyPath, 'string', 'First parameter must be a string.');

    setValueAtKeyPath(this._store, keyPath, value);
  }

  all() {
    return this._store;
  }

  // TODO:
  // flush changes to disk.
  save() {
    // TODO: write to the loaded prefs files
    try {
      const text = JSON.stringify(this._store);
      const data = this._encrypted ? encrypt(text) : text;
      fs.writeFileSync(MAIN_CONFIG_PATH, data, 'utf8');
    } catch (err) {
      // Could not write the file. The user may not have permission to
      // access the file or directory. Throw error.
      throw err;
    }
  }

  // TODO: implement set methods
  //        - keep objects separate so we can write to them?
  // TODO: implement save to disk (save this._store)
}


// Show an error alert.
function alertError(title, content) {
  if (electron.ipcRenderer) {
    electron.ipcRenderer.send('dialog-error', title, content);
  } else {
    require('../main/dialog').showErrorBox(title, content);
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

// Sets the value of the given object at the given key path.
function setValueAtKeyPath(obj, keyPath, value) {
  const keys = keyPath.split(/\./);

  while (keys.length > 1) {
    const key = keys.shift();

    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = {};
    }

    obj = obj[key];
  }

  obj[keys.shift()] = value;
}
