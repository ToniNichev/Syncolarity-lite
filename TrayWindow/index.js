const {app, BrowserWindow, ipcMain} = require('electron');

class TrayWindow {

  constructor(appSettings) {

    // Creation of the new window.
    this.window = new BrowserWindow({
      show: false, // Initially, we should hide it, in such way we will remove blink-effect. 
      height: 710,
      width: appSettings.devMode ? 1925 : 700,
      frame: false,  
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
      console.log(">>>> save-config-notify", newConfig);
      this.window.webContents.send('save-config-notify', newConfig);
    })      

  }
}

module.exports = TrayWindow;