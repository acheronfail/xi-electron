import ViewController from './view-controller';

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

// TODO: add in all supported commands
export const keyMap: { [key: string]: string } = {
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
