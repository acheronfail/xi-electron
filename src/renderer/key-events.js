export function execKey(view, event) {
  if (event.type == 'keydown') {
    let action;
    if (event.shiftKey) {
      action = keyMap['Shift+' + event.key];
    } else {
      action = keyMap[event.key];
    }

    if (action) {
      view.edit(action);
      return true;
    }
  }

  if (event.type == 'keypress') {
    view.insert(event.key);
    return true;
  }

  return false;
}

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
