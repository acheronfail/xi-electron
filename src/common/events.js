import NodeEventEmitter from 'events';

// Simple event emitter class.
export default class EventEmitter extends NodeEventEmitter {
  constructor() {
    super();

    // Ensure errors thrown in handlers don't crash Node.
    this.on('error', (err) => {
      console.error('An error occurred in an emitter');
      console.error(err);
    });
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
