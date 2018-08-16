// Simple event emitter class.
export default class EventEmitter {

  // Map of events and listeners.
  _events: { [key: string]: Array<(...args: any[]) => void> };

  // Max amount of listeners that will be added without warnings. Useful to
  // protect against accidental memory leaks.
  _maxListeners: number = 10;

  /**
   * Instantiate the class.
   */
  constructor() {
    this._events = {};
  }

  /**
   * Get the max listeners settings.
   * @return {Number} Value of setting.
   */
  getMaxListeners(): number {
    return this._maxListeners;
  }

  /**
   * Set the max listeners. Any more listeners added to a single event will
   * result in console warnings.
   * @param {Number} n The desired value.
   */
  setMaxListeners(n: number): number {
    return this._maxListeners = n;
  }

  /**
   * Add a listener to the given event.
   * @param  {String} event      The event name.
   * @param  {(...args: any[]) => void} listener The listener.
   */
  on(event: string, listener: (...args: any[]) => void) {
    if (this._events[event] == null) {
      this._events[event] = [];
    }

    const n = this._events[event].push(listener);
    if (n > this._maxListeners) {
      console.warn(`Possible EventEmitter memory leak detected. ${n} "${
        event}" listener(s) added. Use emitter.setMaxListeners() to increase limit.`);
    }
  }

  /**
   * Listen to an event only once.
   * @param  {String} event       The event name.
   * @param  {(...args: any[]) => void} listener: The listener.
   */
  once(event: string, listener: (...args: any[]) => void) {
    const once = (...args: any[]) => {
      listener(...args);
      this.off(event, once);
    };

    this.on(event, once);
  }

  /**
   * Remove the given listener from the event.
   *   TODO: review how this works: it currently scans backwards so identical
   *   listeners are added/removed in a stack-like fashion. If this is called,
   *   should all instances of the same listener be removed? Or just the last
   *   one that's been added?
   * @param  {String} event      The event name.
   * @param  {(...args: any[]) => void} listener The listener.
   */
  off(event: string, listener: (...args: any[]) => void) {
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

  /**
   * Emit an event - also emits the "all" event.
   * @param  {String}  event The event name.
   * @return {Boolean}       Returns true if there were any listeners subscribed
   *                         to the event.
   */
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
}
