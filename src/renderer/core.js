import cp from 'child_process';
import EventEmitter from '../utils/emitter';
import { XI_CORE_BIN, XI_PLUGIN_DIR } from '../utils/environment';
import ViewProxy from './view-proxy';

type xiMethod = 'new_view' | 'update';

// This manages xi-core.
class Core extends EventEmitter {

  // spawned child process.
  _child: any;

  // References to our ViewProxy classes. Keyed by the view's id.
  _proxies: any;

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
  // Serialise and send a message to xi-core.
  // Returns `true` on success, `false` on error.
  send(method: xiMethod, params?: any = {}, rest?: any = {}) {
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

  // Called when we get events from xi-core's `stdout` stream.
  _eventFromCore(data: any) {
    parseMessages(data).forEach((msg) => {

      // Returned after calling 'new_view'.
      if (msg.result) {
        this._proxies[msg.result] = new ViewProxy(this, msg.id, msg.result);
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

  // Called when we get events from xi-core's `stderr` stream.
  _errorFromCore(data) {
    console.error(`Error from core: "${data.toString()}"`);
  }

  // Called when the xi-core process has closed.
  _coreClosed(code, signal) {
    console.log('core proc closed: ', code, signal);
    // TODO: if error attempt to reboot core process?
    // TODO: just close the app with a dialog error?
  }
}

// Export as a singleton.
const env = Object.assign({ XI_PLUGIN_DIR, RUST_BACKTRACE: 1 }, process.env);
export default new Core(env);

// Helpers ---------------------------------------------------------------------

// Parses a message (from stdout/err) sent from xi-core. Xi sends multiple
// messages as serialised JSON objects separated by a newline.
function parseMessages(string) {
  const parsed = [];
  const lines = string.split('\n');

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
