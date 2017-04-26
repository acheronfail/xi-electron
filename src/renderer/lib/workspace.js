import assert from 'assert';
import cp from 'child_process';
import path from 'path';

import { CORE_PATH, APP_DIR } from '../../common/environment';
import { el, link } from './utils';
import View from '../editor/view';
import Tabs from './tabs';

// Unique instance id of each view.
let instanceId = 0;

// Each window has a workspace.
export default class Workspace {
  constructor(place, settings) {
    assert.strictEqual(typeof place.nodeType, 'number', 'First parameter must be an element');
    assert.strictEqual(typeof settings, 'object', 'Second parameter must be a settings instance');

    // Setup our theming.
    this.theme = { uiEl: link(), syntaxEl: link() };

    // Setup settings.
    this.settings = settings;
    this.settings.on('change', () => this.loadSettings());
    this.loadSettings();

    // This is our reference to each view. Keyed by their `id` from xi-core.
    this.views = {};

    // This is an array that links each view to its `instanceId`. Used
    // to link the view object to the view returned by xi-core, since those
    // operations are asynchronous.
    this.instanceData = [];

    // Create the main element.
    this.el = place.appendChild(el('div', null, 'xi-workspace'));

    // Initialise tabs.
    this.tabs = new Tabs(this);
    this.tabs.on('new', () => this.newView());
    this.tabs.on('change', ({ id }) => this.selectView(id));
    this.tabs.on('remove', (e, { id }) => {
      // TODO: prevent if isDirty from core.
      if (!this.closeView(id)) e.preventDefault();
    });

    // Initialise xi-core.
    this.core = cp.spawn(CORE_PATH);
    this.core.stdout.on('data', this.receiveFromCore.bind(this));
    this.core.stderr.on('data', (data) => {
      console.error(data.toString());
      // TODO: attempt to reboot core process?
    });
  }

  /**
   * Working with views.
   */

  newView(params = {}) {
    this.instanceData[instanceId] = params;
    this.sendToCore({
      params,
      id: instanceId,
      method: "new_view",
    });
    instanceId++;
  }

  activeView() {
    return this.views[this._selected_view];
  }

  activeViewId() {
    return this._selected_view;
  }

  selectView(id) {
    if (this.views[id] && id != this._selected_view) {
      this._selected_view = id;
      this.views[id].show();
      this.tabs.select(id);

      for (const key in this.views) {
        if (id != key) this.views[key].hide();
      }
    }
  }

  createView(instanceId, viewId) {
    const view = new View(this, viewId, this.instanceData[instanceId]);
    this.views[viewId] = view;
    this.tabs.add({ title: view.name, id: view.id });
    this.selectView(viewId);
  }

  saveView(view) {
    // TODO: add clean / dirty state to tabs!
    this.sendToCore({
      method: 'save',
      params: {
        view_id: view.id,
        file_path: view.path
      }
    })
  }

  // return true when closing, false otherwise.
  // TODO: query core to see if view is dirty.
  closeView(id) {
    if (this.views[id] /* && !this.isDirty(id) */ ) {
      this.views[id].destroy();
      delete this.views[id];
      return true;
    }

    // TODO: open dialog to user.
    return false;
  }

  /**
   * Working with projects / files.
   */

  openFile(filepaths) {
    filepaths.forEach((filepath) => {
      this.newView({ 'file_path': filepath });
    });
  }

  /**
   * Theming.
   */

  // TODO: check if path exists!
  // and check if correct stylesheet! (onerror) ?
  updateTheme(el, filepath) {
    // Remove previous theme element from DOM.
    el.remove();
    // Get new settings and add it to the DOM.
    if (typeof filepath == 'string') {
      el.href = filepath;
      document.head.appendChild(el);
    }
  }

  /**
   * Settings.
   */

  // Called on initial load of settings, as well as when they're updated.
  loadSettings() {
    const s = this.settings;
    // Update theme, remember, paths should be relative to our Packages
    // directory.
    this.updateTheme(this.theme.uiEl, path.join(APP_DIR, s.get('theme.ui')));
    this.updateTheme(this.theme.syntaxEl, path.join(APP_DIR, s.get('theme.syntax')));
  }

  serialise() {
    const views = [];
    for (const id in this.views) {
      const view = this.views[id];
      views.push({ id: view.id });
    }
    return Promise.resolve(JSON.stringify(views));
  }

  /**
   * Messaging to workspace.
   * Usually from main process. (TODO: May also be from plugins?)
   */

  message(method, ...args) {
    switch (method) {
      // File based methods.
      case 'new-file':
        return this.newView();
      case 'close-file':
        return this.tabs.remove(this.activeViewId());
      case 'save-file':
        return this.saveView(this.activeView());
      case 'dialog-open-file':
        return this.openFile(...args);
      // Window based methods.
      case 'close-window':
        return window.close();

      default:
        console.warn('message not handled from main process');
        console.log(method, args);
        return;
    }
  }

  /**
   * Messaging to/from xi-core.
   */

  sendToCore(data) {
    try {
      this.core.stdin.write(`${JSON.stringify(data)}\n`);
      return true;
    }
    catch (e) {
      console.error(e);
      return false;
    }
  }

  receiveFromCore(data) {
    const msgs = this.parseMessage(data);
    msgs.forEach((msg) => {
      if (msg.result) {
        this.createView(msg.id, msg.result);
      }
      else if (msg.method == 'update') {
        const view = this.views[msg.params.view_id];
        if (view) view.update(msg.params.update);
      }
      else if (msg.method == 'scroll_to') {
        const view = this.views[msg.params.view_id];
        if (view) {
          const { col, line } = msg.params;
          view.scrollTo(col, line);
        }
      }
      else {
        console.warn('Unhandled message from xi-core');
        console.log(msg);
      }
    });
  }

  parseMessage(data) {
    try {
      return data.toString()
        .split('\n')
        .map(parse)
        .filter(exists => !!exists);
    }
    catch (e) {
      console.error(e);
      return null;
    }
  }
}

function parse(json) {
  if (typeof json != 'string' || json === '') {
    return null;
  }

  try {
    return JSON.parse(json);
  }
  catch (e) {
    console.error(e);
    return null;
  }
}

