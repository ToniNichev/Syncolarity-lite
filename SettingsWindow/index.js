const {BrowserWindow, ipcMain} = require('electron');

class SettingsWindow {

  constructor(appSettings) {
    // Creating setup window
    this.window = new BrowserWindow({
          show: false, // Initially, we should hide it, in such way we will remove blink-effect. 
          height: 910,
          width: 1925,
          frame: false,  // This option will remove frame buttons. By default window has standart chrome header buttons (close, hide, minimize). We should change this option because we want to display our window like Tray Window not like common chrome-like window.
          backgroundColor: '#E4ECEF',
          resizable: false
        });
  
    this.window.loadFile('./SettingsWindow/index.html');
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
    
    // Messages from renderer 

    // save window clicked
    ipcMain.on('save-config-notify', function (event, appSettingsConfig) {
      appSettings.saveSettings(appSettingsConfig);
    })    
  }

}



module.exports = SettingsWindow;
