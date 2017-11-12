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
    on(window, 'keydown', this.onKeyedInput.bind(this), false);
    on(window, 'keypress', this.onKeyedInput.bind(this), false);
    on(window, 'mousedown', this.onPointerInput.bind(this), false);

    // Create View objects whenever xi-core creates a view.
    Core.on('new_view', (proxy) => {
      this._controllers.push(new ViewController(this._wrapper, proxy, {}));
    });

    // Initially create just one view.
    Core.send('new_view', {}, { id: viewInstanceId++ });
  }

  // TODO: perhaps there's a better way to get the active view.
  activeView() {
    return this._controllers.find((view) => view.isFocused());
  }

  onKeyedInput(event) {
    const view = this.activeView();
    if (view && execKey(view, event)) {
      event.preventDefault();
    }
  }

  // TODO: move mouse events into another file
  // TODO: drag events, click, dbl click, alt click, etc. ALL THE EVENTS!
  // TODO: mouse events inside views.
  onPointerInput(event) {
    // TODO: abstract these into different view types: e.g., canvas view, DOM view, WebGL view, etc
    const view = this._controllers.find((view) => view.getWrapperElement() == event.target);
    if (view) {
      event.preventDefault();
      // TODO: calc click position
      // TODO: abstract and pass in event, so different view types may handle it differently
      return view.click(0, 0, 0, 0);
    }
  }
}
