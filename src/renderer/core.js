import cp from 'child_process';
import EventEmitter from '../utils/emitter';
import { XI_CORE_BIN, XI_PLUGIN_DIR } from '../utils/environment';
import ViewProxy from './view-proxy';

/**
 * This is a class that manages xi-core. It creates ViewProxies which are simple
 * emitters that link xi-core's internal views with out actual ViewControllers.
 * It is also responsible for encoding/decoding messages to and from xi-core, and
 * managing the spawned process.
 */
class Core extends EventEmitter {

  // The spawned child process.
  _child: any;

  // References to our ViewProxy classes. Keyed by the view's id.
  _proxies: any;

  /**
   * Create the class.
   * @param  {Object} env The environment map to use when spawning xi-core.
   */
  constructor(env: any = {}) {
    super();

    this._proxies = {};

    // Spawn xi-core.
    this._child = cp.spawn(XI_CORE_BIN, [], { env });
    this._child.on('close', this._coreClosed.bind(this));

    // Receive messages from xi-core as text.
    this._stdout().setEncoding('utf8');
    this._stderr().setEncoding('utf8');

    // Listen to its streams.
    this._stdout().on('data', this._eventFromCore.bind(this));
    this._stderr().on('data', this._errorFromCore.bind(this));
  }

  /**
   * Public API
   */

  // TODO: make a list (enum?) of all of xi-core's commands/methods, and then
  // have them as args/consts/enums to the `send` command?
  // e.g., Core.send('newView') or Core.send(Core.NEW_VIEW) ???
  //
  // Maybe I can use Flow's enums to limit input into this function?

  //
  // Returns `true` on success, `false` on error.
  /**
   * Serialise and send a message to xi-core.
   * @param  {String} method The method to send.
   * @param  {Object} params The method's parameters.
   * @param  {Object} rest   An optional object to extend the top request.
   * @return {Boolean}       Whether or not the message successfully sent.
   */
  send(method: string, params?: any = {}, rest?: any = {}): boolean {
    const data = { method, params, ...rest };
    try {
      this._stdin().write(`${JSON.stringify(data)}\n`);
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
  _stdin() { return this._child.stdin; }
  _stdout() { return this._child.stdout; }
  _stderr() { return this._child.stderr; }

  /**
   * Called when we get events from xi-core's `stdout` stream.
   * @param {String} data Raw data emitted from xi-core's stdout.
   */
  _eventFromCore(raw: string) {
    parseMessages(raw).forEach((msg) => {

      // Returned after calling 'new_view'.
      if (msg.result) {
        this._proxies[msg.result] = new ViewProxy(this._proxySend, msg.id, msg.result);
        this.emit('new_view', this._proxies[msg.result]);
      }

      // Called for other messages -> forward the message to the right ViewProxy.
      else if (msg.method) {
        this._proxies[msg.params.view_id].emit(msg.method, msg.params);
      }

      // Unrecognised.
      else {
        // TODO: throw an error here at some stage
        console.warn('Unhandled message from core: ', msg);
      }
    });
  }

  /**
   * Called when we get events from xi-core's `stderr` stream.
   * @param {String} data Raw data emitted from xi-core's stderr.
   */
  _errorFromCore(data: string) {
    console.error(`Error from core: "${data.toString()}"`);
  }

  /**
   * Called when the xi-core process has closed.
   * @param {Number} code   The exit code of the process.
   * @param {String} signal The close signal (why the process closed).
   */
  _coreClosed(code: number, signal: string) {
    // TODO: if error attempt to reboot core process?
    // TODO: or alternatively just close the app with a dialog error?
    console.log('core proc closed: ', code, signal);
  }

  /**
   * This function is bound to this class and given to each ViewProxy so that
   * they may send messages back to the core process.
   * @param  {String} method The method to send.
   * @param  {Object} params The method's parameters.
   */
  _proxySend = (method: string, params: any = {}): void => {
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
    if (typeof lines[i] !== 'string' || lines[i] === '') continue;
    try {
      parsed.push(JSON.parse(lines[i]));
    } catch (err) {
      console.warn('Error parsing message from core!');
      console.error(err);
    }
  }

  return parsed;
}
