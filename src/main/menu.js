import electron, { BrowserWindow, Menu, app } from 'electron';

function send(win, method, ...args) {
  if (win) {
    win.webContents.send('message', method, ...args);
  }
}

let template = [{
  label: 'File',
  submenu: [{
    label: 'New Window',
    accelerator: 'Shift+CmdOrCtrl+N',
    click: (item, win) => send(win, 'new-window')
  }, {
    label: 'New File',
    accelerator: 'CmdOrCtrl+N',
    click: (item, win) => send(win, 'new-file')
  }, {
    type: 'separator'
  }, {
    label: 'Close Window',
    accelerator: 'Shift+CmdOrCtrl+W',
    click: (item, win) => send(win, 'close-window')
  }, {
    label: 'Close File',
    accelerator: 'CmdOrCtrl+W',
    click: (item, win) => send(win, 'close-file')
  }]
}, {
  label: 'Edit',
  submenu: [{
    label: 'Undo',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: 'Redo',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo'
  }, {
    type: 'separator'
  }, {
    label: 'Cut',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: 'Select All',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
  }]
}, {
  label: 'View',
  submenu: [{
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        // on reload, start fresh and close any old
        // open secondary windows
        if (focusedWindow.id === 1) {
          BrowserWindow.getAllWindows().forEach((win) => {
            if (win.id > 1) {
              win.close();
            }
          });
        }
        focusedWindow.reload();
      }
    }
  }, {
    label: 'Toggle Full Screen',
    accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
      }
    }
  }, {
    label: 'Toggle Developer Tools',
    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.toggleDevTools();
      }
    }
  }]
}, {
  label: 'Window',
  role: 'window',
  submenu: [{
    label: 'Minimize',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }, {
    label: 'Zoom',
    role: 'zoom'
  }, {
    type: 'separator'
  }, {
    label: 'Reopen Window',
    accelerator: 'CmdOrCtrl+Shift+T',
    enabled: false,
    key: 'reopenMenuItem',
    click: () => app.emit('activate')
  }]
}, {
  label: 'Help',
  role: 'help',
  submenu: [{
    label: 'Learn More',
    click: () => shell.openExternal('https://github.com/<author>/xi-electron')
  }]
}];

// function addUpdateMenuItems (items, position) {
//   if (process.mas) return;

//   const version = electron.app.getVersion();
//   let updateItems = [{
//     label: `Version ${version}`,
//     enabled: false
//   }, {
//     label: 'Checking for Update',
//     enabled: false,
//     key: 'checkingForUpdate'
//   }, {
//     label: 'Check for Update',
//     visible: false,
//     key: 'checkForUpdate',
//     click: function () {
//       require('electron').autoUpdater.checkForUpdates()
//     }
//   }, {
//     label: 'Restart and Install Update',
//     enabled: true,
//     visible: false,
//     key: 'restartToUpdate',
//     click: function () {
//       require('electron').autoUpdater.quitAndInstall()
//     }
//   }];

//   items.splice.apply(items, [position, 0].concat(updateItems))
// }

function findReopenMenuItem () {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  let reopenMenuItem;
  menu.items.forEach((item) => {
    if (item.submenu) {
      item.submenu.items.forEach((item) => {
        if (item.key === 'reopenMenuItem') {
          reopenMenuItem = item;
        }
      })
    }
  });

  return reopenMenuItem;
}

if (process.platform === 'darwin') {
  const name = electron.app.getName();
  template.unshift({
    label: name,
    submenu: [{
      label: `About ${name}`,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: 'Services',
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: `Hide ${name}`,
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: 'Hide Others',
      accelerator: 'Command+Alt+H',
      role: 'hideothers'
    }, {
      label: 'Show All',
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: () => app.quit()
    }]
  });

  // Window menu.
  template[3].submenu.push({
    type: 'separator'
  }, {
    label: 'Bring All to Front',
    role: 'front'
  });

  // addUpdateMenuItems(template[0].submenu, 1);
}

// if (process.platform === 'win32') {
//   const helpMenu = template[template.length - 1].submenu;
//   addUpdateMenuItems(helpMenu, 0);
// }

app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

app.on('browser-window-created', () => {
  let reopenMenuItem = findReopenMenuItem();
  if (reopenMenuItem) reopenMenuItem.enabled = false;
});

app.on('window-all-closed', () => {
  let reopenMenuItem = findReopenMenuItem();
  if (reopenMenuItem) reopenMenuItem.enabled = true;
});
