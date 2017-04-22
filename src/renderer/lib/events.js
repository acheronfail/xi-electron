export default class EventEmitter {
  constructor() {
    this.events = {};
  }

  // Subscribe to an event.
  on(event, listener) {
    if (Array.isArray(event)) {
      return event.forEach((ev) => this.on(ev, listener));
    }

    if (!Array.isArray(this.events[event])) this.events[event] = [];
    this.events[event].push(listener);
  }

  // Subscribe to an event only once.
  once(event, listener) {
    this.on(event, function func() {
      this.removeListener(event, func);
      listener.apply(this, arguments);
    });
  }

  // Remove listener.
  off(event, listener) {
    if (Array.isArray(event)) {
      return event.forEach((ev) => this.off(ev, listener));
    }

    if (Array.isArray(this.events[event])) {
      let index = this.events[event].indexOf(listener);
      if (index > -1) this.events[event].splice(index, 1);
    }
  }

  // Emit an event with args.
  emit(event) {
    let args = [].slice.call(arguments, 1);

    if (Array.isArray(this.events[event])) {
      let listeners = this.events[event].slice();
      for (let i = 0; i < listeners.length; i++) listeners[i].apply(this, args);
    }

    // Emit for the 'all' event too.
    if (event != 'all') this.emit.apply(this, ['all', event].concat(args));
  }

  // Signals an event and returns false if the event was prevented.
  signal(name, event, ...args) {
    if (!event) event = {};
    if (!event.hasOwnProperty('_prevented')) event._prevented = false;
    if (!event.hasOwnProperty('preventDefault')) {
      event.preventDefault = () => event._prevented = true;
    }
    if (!event.hasOwnProperty('defaultPrevented')) {
      Object.defineProperty(event, 'defaultPrevented', { get: () => event._prevented });
    }

    this.emit(name, event, ...args);
    return !event.defaultPrevented;
  }
}
