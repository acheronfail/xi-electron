import cp from 'child_process';
import { CORE_PATH } from '../../config';
import { el } from './utils';
import View from './view';
import Tabs from './tabs';

// ID of views ?
let instanceId = 0;

export default class Workspace {
  constructor(place, options = {}) {
    this.views = {};
    this.el = place.appendChild(el('div', null, 'xi-workspace'));

    this.tabs = new Tabs(this);
    this.tabs.on('new', () => this.newView());
    this.tabs.on('change', ({ id }) => this.selectView(id));
    this.tabs.on('remove', (e, { id }) => {
      // TODO: prevent if isDirty from core.
      if (!this.closeView(id)) e.preventDefault();
    });

    this.core = cp.spawn(CORE_PATH);
    this.core.stdout.on('data', this.receiveFromCore.bind(this));
    this.core.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    this.newView();
  }

  newView() {
    this.sendToCore({
      id: instanceId++,
      method: "new_view",
      params: {}
    });
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

  createView(id) {
    const view = new View(this, id);
    this.views[id] = view;
    this.tabs.add({ title: view.id, id: view.id });
    this.selectView(id);
  }

  // return true when closing, false otherwise.
  // TODO: query core to see if view is dirty.
  closeView(id) {
    console.log(id);
    if (this.views[id] /* && !this.isDirty(id) */ ) {
      this.views[id].destroy();
      delete this.views[id];
      return true;
    }

    // TODO: open dialog to user.
    return false;
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
        this.createView(msg.result);
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

