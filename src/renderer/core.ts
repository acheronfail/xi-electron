import * as cp from 'child_process';
import EventEmitter from '../utils/emitter';
import { XI_CORE_BIN, XI_PLUGIN_DIR } from '../utils/environment';
import ViewProxy from './view-proxy';
import { CoreMethod } from './types/core';

/**
 * This is a class that manages xi-core. It creates ViewProxies which are simple
 * emitters that link xi-core's internal views with out actual ViewControllers.
 * It is also responsible for encoding/decoding messages to and from xi-core, and
 * managing the spawned process.
 */
export class Core extends EventEmitter {

  // The spawned child process.
  private child: cp.ChildProcess;

  // References to our ViewProxy classes. Keyed by the view's id.
  private proxies: { [key: string]: ViewProxy };

  /**
   * Create the class.
   * @param  {Object} env The environment map to use when spawning xi-core.
   */
  constructor(env: { [key: string]: string | number } = {}) {
    super();

    this.proxies = {};

    // Spawn xi-core.
    this.child = cp.spawn(XI_CORE_BIN, [], { env });
    this.child.on('close', this.coreClosed.bind(this));

    // Receive messages from xi-core as text.
    this.stdout().setEncoding('utf8');
    this.stderr().setEncoding('utf8');

    // Listen to its streams.
    this.stdout().on('data', this.eventFromCore.bind(this));
    this.stderr().on('data', this.errorFromCore.bind(this));
  }

  /**
   * Public API
   */

  /**
   * Serialise and send a message to xi-core.
   * @param  {CoreMethod} method The method to send.
   * @param  {Object} params The method's parameters.
   * @param  {Object} rest   An optional object to extend the top request.
   * @return {Boolean}       Whether or not the message successfully sent.
   */
  public send(method: CoreMethod, params: any = {}, rest: any = {}): boolean {
    const data = { method, params, ...rest };
    try {
      this.stdin().write(`${JSON.stringify(data)}\n`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  /**
   * Private API
   */

  // Getters for easier access to streams.
  private stdin() { return this.child.stdin; }
  private stdout() { return this.child.stdout; }
  private stderr() { return this.child.stderr; }

  /**
   * Called when we get events from xi-core's `stdout` stream.
   * @param {String} data Raw data emitted from xi-core's stdout.
   */
  private eventFromCore(raw: string) {
    parseMessages(raw).forEach((msg) => {

      // Returned after calling 'new_view'.
      if (msg.result) {
        this.proxies[msg.result] = new ViewProxy(this.proxySend, msg.id, msg.result);
        this.emit('new_view', this.proxies[msg.result]);
      } else if (msg.method) {
        this.proxies[msg.params.view_id].emit(msg.method, msg.params);
      } else {
        // TODO: throw an error here at some stage
        console.warn('Unhandled message from core: ', msg);
      }
    });
  }

  /**
   * Called when we get events from xi-core's `stderr` stream.
   * @param {String} data Raw data emitted from xi-core's stderr.
   */
  private errorFromCore(data: string) {
    console.error(`Error from core: "${data.toString()}"`);
  }

  /**
   * Called when the xi-core process has closed.
   * @param {Number} code   The exit code of the process.
   * @param {String} signal The close signal (why the process closed).
   */
  private coreClosed(code: number, signal: string) {
    // TODO: if error attempt to reboot core process?
    // TODO: or alternatively just close the app with a dialog error?
    console.log('core proc closed: ', code, signal);
  }

  /**
   * This function is bound to this class and given to each ViewProxy so that
   * they may send messages back to the core process.
   * @param  {CoreMethod} method The method to send.
   * @param  {Object}     params The method's parameters.
   */
  private proxySend = (method: CoreMethod, params: any = {}): void => {
    this.send(method, params);
  }
}

// Export as a singleton.
const env = Object.assign({ XI_PLUGIN_DIR, RUST_BACKTRACE: 1 }, process.env);
export default new Core(env);

// Helpers ---------------------------------------------------------------------

/**
 * Parses a message (from stdout/err) sent from xi-core. Xi sends multiple
 * messages as serialised JSON objects separated by newlines.
 * @param  {String} string Raw data emitted from xi-core's stdout.
 * @return {Array}         An array containing JSON objects of xi's messages.
 */
function parseMessages(raw: string): Array<any> {
  const parsed = [];
  const lines = raw.split('\n');

  for (let i = 0; i < lines.length; ++i) {
    if (typeof lines[i] !== 'string' || lines[i] === '') { continue; }
    try {
      parsed.push(JSON.parse(lines[i]));
    } catch (err) {
      console.warn('Error parsing message from core!');
      console.error(err);
    }
  }

  return parsed;
}
