

export function execKey(view, e) {
  if (e.type == 'keydown') {
    let action;
    if (e.shiftKey) {
      action = keyMap['Shift+' + e.key];
    } else {
      action = keyMap[e.key];
    }

    if (action) {
      view.edit(action);
      return true;
    }
  }

  if (e.type == 'keypress') {
    view.insert(e.key);
    return true;
  }

  return false;
}


export const keyMap = {
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
