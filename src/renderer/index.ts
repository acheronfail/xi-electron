import Workspace from './workspace';
import { DEVMODE } from '../utils/environment';
import { ViewType } from './view/index';

const opts = {
  filePath: '/Users/acheronfail/src/xi-electron-ts/src/xi/plugins/xi_plugin/cache.py',
  coreOptions: {
    // TODO: XI_RPC_LOG ?
    env: Object.assign({ RUST_BACKTRACE: 1 }, process.env)
  },
  viewOptions: {
    type: ViewType.Canvas,
    scrollPastEnd: true
  }
};
const workspace = new Workspace(document.body, opts);

if (DEVMODE) {
  // Attach core and workspace to window for easy debugging.
  (<any>window).Core = require('./core').default;
  (<any>window).workspace = workspace;
  // Show current view type in title for clarity.
  document.title += ` -- ViewType: ${opts.viewOptions.type}`;
}
