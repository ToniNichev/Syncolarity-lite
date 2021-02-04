const {BrowserWindow, ipcMain} = require('electron');

const {app,Menu} = require('electron');

// Callback for the ready event
app.on('ready', () => {
  /*
   This is where your other code would go
  */

  // Check if we are on a MAC
  if (process.platform === 'darwin') {
    // Create our menu entries so that we can use MAC shortcuts
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' }
        ]
      }
    ]));
  }
});

class SettingsWindow {

  constructor(appSettings) {
    // Creating setup window
    this.window = new BrowserWindow({
          show: false, // Initially, we should hide it, in such way we will remove blink-effect. 
          height: 770,
          width: appSettings.devMode ? 1925 : 1000,
          frame: false,  // This option will remove frame buttons. By default window has standart chrome header buttons (close, hide, minimize). We should change this option because we want to display our window like Tray Window not like common chrome-like window.
          backgroundColor: '#E4ECEF',
          resizable: false,
          frame: false
        });
  
    this.window.loadFile('./SettingsWindow/index.html');
    if(appSettings.devMode)
      this.window.webContents.openDevTools();
    
    this.window.on('blur', () => {
      this.window.hide();
    });   

    this.window.on('show', () => {
      //appSettings.saveSettings();
      //this.window.webContents.send('update-config', appSettings);
    }); 
    
    this.window.on('ready-to-show', () => {
      // pass the app settings to the renderer process
      this.window.webContents.send('ready-to-show', appSettings);
    });
    

    // save window clicked
    ipcMain.on('save-config-notify', function (event, appSettingsConfig) {
      //this.window.webContents.send('save-config-notify-test', "Test 123");
      appSettings.saveSettings(appSettingsConfig.config);

    })    
  }

}



module.exports = SettingsWindow;
