import { elt, on } from '../utils/dom';
import { execKey } from './key-events';
import Core from './core';
import ViewController from './view-controller';

let viewInstanceId = 0;

// Top class that controls everything.
//
// TODO: listen for commands
// TODO: listen for user input
// TODO: manage clipboard, etc
// TODO: manage views
// TODO: manage settings
export default class Workspace {

  // References of all our child view controllers.
  // TODO: flow object
  _controllers: any[];

  // Wrapper top-level element.
  _wrapper: HTMLElement;

  constructor(place, opts) {
    this._controllers = [];
    this._wrapper = place.appendChild(elt('div', null, 'xi-workspace'));

    // All events are listened to on the window.
    on(window, 'keydown', this.keyedInput.bind(this), false);
    on(window, 'keypress', this.keyedInput.bind(this), false);
    on(window, 'mousedown', this.mousedown.bind(this), false);

    // Create View objects whenever xi-core creates a view.
    Core.on('new_view', (proxy) => {
      this._controllers.push(new ViewController(this._wrapper, proxy, {}));
    });

    // Initially create just one view.
    Core.send('new_view', {}, { id: viewInstanceId++ });
  }

  // TODO: perhaps there's a better way to get the active view.
  activeViewController() {
    return this._controllers.find((controller) => controller.isFocused());
  }

  keyedInput(event) {
    const controller = this.activeViewController();
    if (controller && execKey(controller, event)) {
      event.preventDefault();
    }
  }

  // TODO: move mouse events into another file
  // TODO: drag events, click, dbl click, alt click, etc. ALL THE EVENTS!
  // TODO: mouse events inside views.
  mousedown(event) {
    const controller = this._controllers.find((controller) => {
      return controller.getWrapperElement().contains(event.target);
    });
    if (controller) {
      controller.click(event);
    }
  }
}
