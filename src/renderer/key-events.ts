import ViewController from './view-controller';
import { CoreMethod } from './types/core';

// TODO: add in all supported commands
export const keyMap: { [key: string]: CoreMethod } = {
  'Backspace':        CoreMethod.DELETE_BACKWARD,
  'Enter':            CoreMethod.INSERT_NEWLINE,
  'ArrowLeft':        CoreMethod.MOVE_LEFT,
  'ArrowRight':       CoreMethod.MOVE_RIGHT,
  'ArrowUp':          CoreMethod.MOVE_UP,
  'ArrowDown':        CoreMethod.MOVE_DOWN,

  'Shift+ArrowLeft':  CoreMethod.MOVE_LEFT_AND_MODIFY_SELECTION,
  'Shift+ArrowRight': CoreMethod.MOVE_RIGHT_AND_MODIFY_SELECTION,
  'Shift+ArrowUp':    CoreMethod.MOVE_UP_AND_MODIFY_SELECTION,
  'Shift+ArrowDown':  CoreMethod.MOVE_DOWN_AND_MODIFY_SELECTION,
};

/**
 * Called with a DOM key event ("keypress" or "keydown") which looks first for
 * actions (or keybindings) and then passes the input to the ViewController.
 * @param  {ViewController} viewController The active ViewController.
 * @param  {KeyEvent}       event          DOM event, "keypress" or "keydown".
 * @return {boolean}                       Whether or not we handled the event.
 */
export function execKey(viewController: ViewController, event: KeyboardEvent): boolean {
  if (event.type == 'keydown') {
    let method;
    if (event.shiftKey) {
      method = keyMap['Shift+' + event.key];
    } else {
      method = keyMap[event.key];
    }

    if (method) {
      viewController.doMethod(method);
      return true;
    }
  }

  if (event.type == 'keypress') {
    viewController.insert(event.key);
    return true;
  }

  return false;
}
