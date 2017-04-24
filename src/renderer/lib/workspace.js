import cp from 'child_process';
import { CORE_PATH } from '../../environment';
import { el } from './utils';
import View from './view';
import Tabs from './tabs';

// ID of views ?
let instanceId = 0;

export default class Workspace {
  constructor(place, settings) {
    if (!place || !settings) {
      throw new Error('Invalid arguments sent to workspace!');
    }

    // Setup settings.
    this.settings = settings;
    this.settings.watch('renderer.theme-ui', () => this.updateTheme());

    // Setup our theming.
    this.theme = { uiEl: el('link'), syntaxEl: el('link') };
    this.updateTheme();

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
    });

    // TODO: re-open previously opened tabs.
    // Create an empty view.
    this.newView();
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
  updateTheme() {
    const uiEl = this.theme.uiEl;
    // Remove previous theme from DOM.
    uiEl.remove();

    // Get new settings and add it to the DOM.
    const themePath = this.settings.get('renderer.theme-ui', null);
    if (themePath !== null) {
      uiEl.rel = 'stylesheet';
      uiEl.href = themePath;
      document.head.appendChild(uiEl);
    }
  }

  /**
   * Messaging to workspace.
   * Usually from main process. (TODO: May also be from plugins?)
   */

  message(method, ...args) {
    if (method == 'new-file') {
      this.newView();
    } else if (method == 'close-file') {
      this.tabs.remove(this.activeViewId());
    } else if (method == 'save-file') {
      this.saveView(this.activeView());
    } else if (method == 'dialog-open-file') {
      this.openFile(...args);
    } else {
      console.warn('message not handled from main process');
      console.log(method, args);
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

