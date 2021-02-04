const {app, BrowserWindow, ipcMain} = require('electron');

class TrayWindow {

  constructor(appSettings) {

    // Creation of the new window.
    this.window = new BrowserWindow({
      show: false, // Initially, we should hide it, in such way we will remove blink-effect. 
      height: 710,
      width: appSettings.devMode ? 1900 : 900,
      frame: false,  
      transparent: true, 
      backgroundColor: '#E4ECEF',
      resizable: false
    });    
  
    // and load the index.html of the app.
    this.window.loadFile('./TrayWindow/index.html');
    if(appSettings.devMode)
      this.window.webContents.openDevTools();


    this.window.on('blur', () => {
      this.window.hide();
    });    

    this.window.on('ready-to-show', () => {
      // pass the app settings to the renderer process
      this.window.webContents.send('ready-to-show', appSettings);
      
      this.window.show();
    });

    ipcMain.on('update-notify-value', (event, arg) => {
      console.log("ipcMain!", arg);
    });

    // save window clicked
    ipcMain.on('save-config-notify', (event, newConfig) => {
      this.window.webContents.send('save-config-notify', newConfig);
    });

    ipcMain.on('request-app-guit', function (event, appSettingsConfig) {
      app.quit();
    })      
  }
}

module.exports = TrayWindow;