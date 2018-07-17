import {elt, on, off} from '../utils/dom';
import {execKey} from './key-events';
import Core, {CoreOptions} from './core';
import ViewController from './view-controller';
import ViewProxy from './view-proxy';
import {ViewOptions} from './view';
import {CoreMethod} from './types/core';

/**
 * Our unique id of the our views, we send this through to xi-core when
 * requesting a new view.
 */
let viewInstanceId = 0;

/**
 * Configuration options for each Workspace.
 */
export type WorkspaceOptions = {
  filePath?: string,
  coreOptions: CoreOptions,
  viewOptions: ViewOptions
};

/**
 * Top parent class that controls everything.
 *   TODO: listen for commands
 *   TODO: listen for user input
 *   TODO: manage clipboard, etc
 *   TODO: manage views
 *   TODO: manage settings
 */
export default class Workspace {

  // Wrapper top-level element.
  public wrapper: HTMLElement;

  // References of all our child view controllers.
  private controllers: ViewController[];

  // This workspace's handle to xi-core (as a ChildProcess).
  private core: Core;

  /**
   * Create the Workspace.
   * @param  {HTMLElement}      place Where to attach the workspace.
   * @param  {WorkspaceOptions} opts  Configuration options.
   */
  constructor(place: HTMLElement, opts: WorkspaceOptions) {
    this.controllers = [];
    this.wrapper = place.appendChild(elt('div', null, 'xi-workspace', 'height: 100%; width: 100%'));

    // All events are listened to on the window.
    on((<any>window), 'keydown', this.keyedInput.bind(this), false);
    on((<any>window), 'keypress', this.keyedInput.bind(this), false);
    on((<any>window), 'mousedown', this.mousedown.bind(this), false);

    // Instantiate xi-core.
    this.core = new Core(opts.coreOptions);

    // Create View objects whenever xi-core creates a view.
    this.core.on(CoreMethod.NEW_VIEW, (proxy: ViewProxy) => {
      this.controllers.push(new ViewController(this, proxy, opts.viewOptions));
    });

    // Initially create just one view.
    this.core.send(CoreMethod.NEW_VIEW, {file_path: opts.filePath}, {id: viewInstanceId++});

    // Attach unload handler to window.
    window.onbeforeunload = this.beforeUnload.bind(this);
  }

  /**
   * Perform cleanup before window is closed.
   * @param event Event passed from window.onbeforeunload
   */
  public beforeUnload(_event: BeforeUnloadEvent) {
    // TODO: confirm before closing if there are unsaved changes
    this.core.close();
  }

  /**
   * Find the active ViewController (if any).
   * @return {ViewController} The active ViewController, or undefined.
   */
  public activeViewController(): ViewController | undefined {
    return this.controllers.find((controller) => controller.isFocused());
  }

  /**
   * Called when the Workspace receives keyboard input ("keydown" or "keypress").
   * @param  {KeyboardEvent} event DOM KeyEvent.
   */
  private keyedInput(event: KeyboardEvent) {
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
  private mousedown(event: MouseEvent) {
    const controller = this.controllers.find((c) => c.getWrapperElement().contains((<Node>event.target)));
    if (!controller) {return; }

    // Send click event through to ViewController.
    controller.doClick(event);

    // Listen for dragging events.
    const onMove = (event: MouseEvent) => controller.doDrag(event);
    const onUp = (_event: MouseEvent) => {
      off((<any>window), 'mousemove', onMove, false);
      off((<any>window), 'mouseup', onUp, false);
    };

    on((<any>window), 'mousemove', onMove, false);
    on((<any>window), 'mouseup', onUp, false);
  }
}

/**
 * Current thoughts...
 *  - should cut/copy/paste be implemented in the frontend or backend?
 */
