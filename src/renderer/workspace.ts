import { elt, on } from '../utils/dom';
import { execKey } from './key-events';
import Core from './core';
import ViewController from './view-controller';
import ViewProxy from './view-proxy';
import { ViewType } from './view';
import { CoreMethod } from './types/core';

/**
 * Our unique id of the our views, we send this through to xi-core when
 * requesting a new view.
 */
let viewInstanceId = 0;

/**
 * Configuration options for each Workspace.
 */
export type WorkspaceOptions = {};

/**
 * Top parent class that controls everything.
 *   TODO: listen for commands
 *   TODO: listen for user input
 *   TODO: manage clipboard, etc
 *   TODO: manage views
 *   TODO: manage settings
 */
export default class Workspace {

  // References of all our child view controllers.
  _controllers: ViewController[];

  // Wrapper top-level element.
  _wrapper: any;

  /**
   * Create the Workspace.
   * @param  {HTMLElement}      place Where to attach the workspace.
   * @param  {WorkspaceOptions} opts  Configuration options.
   */
  constructor(place: any, _opts: WorkspaceOptions) {
    this._controllers = [];
    this._wrapper = place.appendChild(elt('div', null, 'xi-workspace'));

    // All events are listened to on the window.
    on((<any>window), 'keydown', this.keyedInput.bind(this), false);
    on((<any>window), 'keypress', this.keyedInput.bind(this), false);
    on((<any>window), 'mousedown', this.mousedown.bind(this), false);

    // Create View objects whenever xi-core creates a view.
    Core.on(CoreMethod.NEW_VIEW, (proxy: ViewProxy) => {
      const viewOptions = { type: ViewType.Canvas };
      this._controllers.push(new ViewController(this._wrapper, proxy, viewOptions));
    });

    // Initially create just one view.
    Core.send(CoreMethod.NEW_VIEW, {}, { id: viewInstanceId++ });
  }

  /**
   * Find the active ViewController (if any).
   * @return {ViewController} The active ViewController, or undefined.
   */
  activeViewController(): ViewController | undefined {
    return this._controllers.find((controller) => controller.isFocused());
  }

  /**
   * Called when the Workspace receives keyboard input ("keydown" or "keypress").
   * @param  {KeyboardEvent} event DOM KeyEvent.
   */
  keyedInput(event: KeyboardEvent) {
    const controller = this.activeViewController();
    if (controller && execKey(controller, event)) {
      event.preventDefault();
    }
  }

  /**
   * Called when the Workspace receives mouse input.
   *   TODO: move mouse events into another file
   *   TODO: drag events, click, dbl click, alt click, etc. do ALL THE EVENTS!
   * @param  {MouseEvent} event DOM MouseEvent.
   */
  mousedown(event: MouseEvent) {
    const controller = this._controllers.find((controller) => {
      return controller.getWrapperElement().contains((<Node>event.target));
    });
    if (controller) {
      controller.doClick(event);
    }
  }
}
