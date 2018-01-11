// The allowed messages we can send to xi-core.
export enum CoreMethod {
    INSERT = 'insert',
    SCROLL = 'scroll',
    CLICK = 'click',
    DRAG = 'drag',
    EDIT = 'edit',

    DELETE_BACKWARD = 'delete_backward',
    INSERT_NEWLINE = 'insert_newline',
    MOVE_LEFT = 'move_left',
    MOVE_RIGHT = 'move_right',
    MOVE_UP = 'move_up',
    MOVE_DOWN = 'move_down',
    MOVE_LEFT_AND_MODIFY_SELECTION = 'move_left_and_modify_selection',
    MOVE_RIGHT_AND_MODIFY_SELECTION = 'move_right_and_modify_selection',
    MOVE_UP_AND_MODIFY_SELECTION = 'move_up_and_modify_selection',
    MOVE_DOWN_AND_MODIFY_SELECTION = 'move_down_and_modify_selection',
}
