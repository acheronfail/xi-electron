import { elt, on } from '../utils/dom';
import Core from './core';
import View from './view';

let viewInstanceId = 0;

// Top class that controls everything.
//
// TODO: listen for commands
// TODO: listen for user input
// TODO: manage clipboard, etc
// TODO: manage views
// TODO: manage settings
export default class Workspace {

  // References of all our child views.
  // TODO: flow object
  _views: any[];

  // Wrapper top-level element.
  _wrapper: HTMLElement;

  constructor(place, opts) {
    this._views = [];
    this._wrapper = place.appendChild(elt('div', null, 'xi-workspace'));

    // All events are listened to on the window.
    on(window, 'keydown', this.execKey.bind(this), false);
    on(window, 'keypress', this.execKey.bind(this), false);
    on(window, 'mousedown', this.mousedown.bind(this), false);

    // Create View objects whenever xi-core creates a view.
    Core.on('new_view', (proxy) => {
      this._views.push(new View(this._wrapper, proxy, {}));
    });

    // Initially create just one view.
    Core.send('new_view', {}, { id: viewInstanceId++ });
  }

  // TODO: perhaps there's a better way to get the active view.
  activeView() {
    return this._views.find((view) => view.isFocused());
  }

  // TODO: move key responses to another file
  execKey(event) {
    const view = this.activeView();
    if (view) {
      if (event.type == 'keydown') {
        let action;
        if (event.shiftKey) {
          action = keyMap['Shift+' + event.key];
        } else {
          action = keyMap[event.key];
        }

        if (action) {
          event.preventDefault();
          view.edit(action);
          return true;
        }
      }

      if (event.type == 'keypress') {
        event.preventDefault();
        view.insert(event.key);
        return true;
      }
    }

    return false;
  }

  // TODO: move mouse events into another file
  // TODO: drag events, click, dbl click, alt click, etc. ALL THE EVENTS!
  // TODO: mouse events inside views.
  mousedown(event) {
    // TODO: abstract these into different view types: e.g., canvas view, DOM view, WebGL view, etc
    const view = this._views.find((view) => view.getCanvasElement() == event.target);
    if (view) {
      event.preventDefault();
      // TODO: calc click position
      // TODO: abstract and pass in event, so different view types may handle it differently
      return view.click(0, 0, 0, 0);
    }
  }
}

// TODO: move key responses to a new file
// TODO: add in all supported
const keyMap = {
  'Backspace':        'delete_backward',
  'Enter':            'insert_newline',
  'ArrowLeft':        'move_left',
  'ArrowRight':       'move_right',
  'ArrowUp':          'move_up',
  'ArrowDown':        'move_down',

  'Shift+ArrowLeft':  'move_left_and_modify_selection',
  'Shift+ArrowRight': 'move_right_and_modify_selection',
  'Shift+ArrowUp':    'move_up_and_modify_selection',
  'Shift+ArrowDown':  'move_down_and_modify_selection',
};
