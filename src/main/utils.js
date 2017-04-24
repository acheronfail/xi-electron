
export function send(win, method, ...args) {
  win.webContents.send('message', method, ...args);
}
