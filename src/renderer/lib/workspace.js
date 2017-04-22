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

  getActiveView() {
    return this.views[this._selected_view];
  }

  selectView(id) {
    const view = this.views[id];
    if (view && id != this._selected_view) {
      this._selected_view = id;
      view.show();

      for (const key in this.views) {
        if (id != key) this.views[key].hide();
      }
    }
  }

  createView(id) {
    const view = new View(this, id);
    this.views[id] = view;
    this.selectView(id);
    this.tabs.addTab({ title: view.id, id: view.id });
  }

  closeView(id) {
    const view = this.views[id];
    if (view) {
      // TODO:
      // view.destroy();
      view.el.remove();
    }
  }

  /**
   * Messaging to/from main process.
   */

  message(method, ...args) {
    if (method == 'new-window') {} // TODO:
    if (method == 'new-file') {
      this.newView();
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

