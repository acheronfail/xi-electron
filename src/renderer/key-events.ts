import ViewController from './view-controller';
import { CoreMethod } from './types/core';
import { MACOS } from '../utils/environment';

/**
 * Key shortcut precedence:
 * 'Super' -> 'Ctrl' -> 'Shift' -> 'Alt' -> {KEY_NAME}
 * Connected by '+'
 */

const CmdOrCtrl = MACOS ? 'Super' : 'Ctrl';
export const keyMap: { [key: string]: CoreMethod } = {
  // Editing
  [`Tab`]: CoreMethod.INSERT_TAB,
  [`Enter`]: CoreMethod.INSERT_NEWLINE,
  [`Backspace`]: CoreMethod.DELETE_BACKWARD,
  [`Shift+Backspace`]: CoreMethod.DELETE_FORWARD,
  [`Delete`]: CoreMethod.DELETE_FORWARD,
  [`${CmdOrCtrl}+Backspace`]: CoreMethod.DELETE_TO_BEGINNING_OF_LINE,
  [`Alt+Backspace`]: CoreMethod.DELETE_WORD_BACKWARD,
  [`Shift+Alt+Backspace`]: CoreMethod.DELETE_WORD_FORWARD,
  [`Alt+Delete`]: CoreMethod.DELETE_WORD_FORWARD,
  [`${CmdOrCtrl}+Shift+Z`]: CoreMethod.REDO,
  [`${CmdOrCtrl}+Z`]: CoreMethod.UNDO,
  [`Ctrl+T`]: CoreMethod.TRANSPOSE,
  [`${CmdOrCtrl}+Y`]: CoreMethod.YANK,

  // Movement & selection
  [`ArrowDown`]: CoreMethod.MOVE_DOWN,
  [`Shift+ArrowDown`]: CoreMethod.MOVE_DOWN_AND_MODIFY_SELECTION,
  [`ArrowLeft`]: CoreMethod.MOVE_LEFT,
  [`Shift+ArrowLeft`]: CoreMethod.MOVE_LEFT_AND_MODIFY_SELECTION,
  [`ArrowRight`]: CoreMethod.MOVE_RIGHT,
  [`Shift+ArrowRight`]: CoreMethod.MOVE_RIGHT_AND_MODIFY_SELECTION,
  [`Super+ArrowUp`]: CoreMethod.MOVE_TO_BEGINNING_OF_DOCUMENT,
  [`Super+Shift+ArrowUp`]: CoreMethod.MOVE_TO_BEGINNING_OF_DOCUMENT_AND_MODIFY_SELECTION,
  [`Super+ArrowDown`]: CoreMethod.MOVE_TO_END_OF_DOCUMENT,
  [`Super+Shift+ArrowDown`]: CoreMethod.MOVE_TO_END_OF_DOCUMENT_AND_MODIFY_SELECTION,
  [`${CmdOrCtrl}+ArrowLeft`]: CoreMethod.MOVE_TO_LEFT_END_OF_LINE,
  [`${CmdOrCtrl}+Shift+ArrowLeft`]: CoreMethod.MOVE_TO_LEFT_END_OF_LINE_AND_MODIFY_SELECTION,
  [`${CmdOrCtrl}+ArrowRight`]: CoreMethod.MOVE_TO_RIGHT_END_OF_LINE,
  [`${CmdOrCtrl}+Shift+ArrowRight`]: CoreMethod.MOVE_TO_RIGHT_END_OF_LINE_AND_MODIFY_SELECTION,
  [`ArrowUp`]: CoreMethod.MOVE_UP,
  [`Shift+ArrowUp`]: CoreMethod.MOVE_UP_AND_MODIFY_SELECTION,
  [`Alt+ArrowLeft`]: CoreMethod.MOVE_WORD_LEFT,
  [`Shift+Alt+ArrowLeft`]: CoreMethod.MOVE_WORD_LEFT_AND_MODIFY_SELECTION,
  [`Alt+ArrowRight`]: CoreMethod.MOVE_WORD_RIGHT,
  [`Shift+Alt+ArrowRight`]: CoreMethod.MOVE_WORD_RIGHT_AND_MODIFY_SELECTION,
  [`${CmdOrCtrl}+A`]: CoreMethod.SELECT_ALL,
};

function normalizeKey(input: string): string {
  const parts = input.split('+');

  // If the last part of the command is a character then capitalise it.
  const last = parts[parts.length - 1];
  if (last.length == 1) {
    parts[parts.length - 1] = last.toUpperCase();
  }

  return parts.join('+').replace(/\s/g, '');
}

/**
 * Called with a DOM key event ("keypress" or "keydown") which looks first for
 * actions (or keybindings) and then passes the input to the ViewController.
 * @param  {ViewController} viewController The active ViewController.
 * @param  {KeyEvent}       event          DOM event, "keypress" or "keydown".
 * @return {boolean}                       Whether or not we handled the event.
 */
export function execKey(viewController: ViewController, event: KeyboardEvent): boolean {
  if (event.type == 'keydown') {

    const { metaKey, ctrlKey, shiftKey, altKey } = event;

    let prefix = '';
    if (metaKey) {
      prefix += 'Super+';
    }
    if (ctrlKey) {
      prefix += 'Ctrl+';
    }
    if (shiftKey) {
      prefix += 'Shift+';
    }
    if (altKey) {
      prefix += 'Alt+';
    }

    const shortcut = normalizeKey(prefix + event.key);
    const method = keyMap[shortcut];
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
