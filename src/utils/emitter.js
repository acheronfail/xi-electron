// Simple event emitter class.
export default class EventEmitter {

  _events: { [string]: Array<() => mixed> };

  _maxListeners: number = 10;

  constructor() {
    this._events = {};
  }

  getMaxListeners() {
    return this._maxListeners;
  }

  setMaxListeners(n) {
    return this._maxListeners = n;
  }

  // Listen to the given event.
  on(event: string, listener: () => mixed) {
    if (this._events[event] == null) {
      this._events[event] = [];
    }

    const n = this._events[event].push(listener);
    if (n > this._maxListeners) {
      console.warn(`Possible EventEmitter memory leak detected. ${n} "${event}" listener(s) added. Use emitter.setMaxListeners() to increase limit.`);
    }
  }

  // Listen to an event only once.
  once(event: string, listener: () => mixed) {
    const once = (...args) => {
      listener(...args);
      this.off(event, once);
    };

    this.on(event, once);
  }

  // Remove the give listener from the event.
  // TODO: review how this works: it currently scans backwards so identical
  // listeners are added/removed in a stack-like fashion. If this is called,
  // should all instances of the same listener be removed? Or just the last one
  // that's been added?
  off(event: string, listener: () => mixed) {
    const listeners = this._events[event];
    if (listeners && listeners.length) {
      for (let i = listeners.length - 1; i >= 0; --i) {
        if (listeners[i] === listener) {
          listeners.splice(i, 1);
          break;
        }
      }
    }
  }

  // Emit an event. Returns true if there were any listeners subscribed to the
  // event. Also emits the "all" event which is called for any emission.
  emit(event: string, ...args: Array<any>) {
    const listeners = this._events[event];
    const listenersExist = !!(listeners && listeners.length);
    if (listenersExist) {
      for (let i = 0; i < listeners.length; ++i) {
        listeners[i](...args);
      }
    }

    if (event != 'all') {
      this.emit('all', ...args);
    }

    return listenersExist;
  }
};
