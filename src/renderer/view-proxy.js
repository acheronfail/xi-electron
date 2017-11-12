import EventEmitter from 'events';

// A proxy that listens/emits to events in regards to one xi view.
export default class ViewProxy extends EventEmitter {
  constructor(core, id, viewId) {
    super();

    // Reference to the main core module.
    this.core = core;

    this.id = id;
    this.viewId = viewId;
  }

  send(method, params = {}) {
    params.view_id = this.viewId;
    this.core.send(method, params);
  }
}


