import * as path from 'path';
import { app, BrowserWindow } from 'electron';

let win: BrowserWindow | null = null;

app.on('ready', async () => {

  win = new BrowserWindow({ show: true });
  win.loadURL('file://' + path.join(__dirname, '..', 'pages', 'index.html'));
  win.on('close', () => win = null);

});
