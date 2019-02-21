const {app, ipcMain} = require('electron');
const TrayWindow = require('./TrayWindow');
const TrayIcon = require('./TrayIcon');
const SettingsWindow = require('./SettingsWindow');
const AppSettings = require('./AppSettings');
const {autoUpdater} = require("electron-updater");

  
let trayWindow = null;
let trayIcon = null;
let appSettings = null;
let settingsWindow = null;
let devMode = false;
  
app.on('ready', function() {
  appSettings = new AppSettings(() => {  
    appSettings.devMode = devMode;
    trayWindow = new TrayWindow(appSettings);
    trayIcon = new TrayIcon(trayWindow.window);
    settingsWindow = new SettingsWindow(appSettings);
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 2000);    
  });
});


app.on('quit-app', function() {
  tray.window.close();
  app.quit();
});

ipcMain.on('request-showing-of-main-window', function() {
  trayWindow.window.show();
});

ipcMain.on('request-showing-of-settting-window', function() {
  settingsWindow.window.show();
});

ipcMain.on('sync-started', function() {
  trayIcon.animate();  
});

ipcMain.on('sync-stopped', function() {
  trayIcon.stopAnimation();  
});



// when the update has been downloaded and is ready to be installed, notify the BrowserWindow
autoUpdater.on('update-downloaded', (info) => {
  trayWindow.webContents.send('updateReady')
});

// when receiving a quitAndInstall signal, quit and install the new version ;)
ipcMain.on("quitAndInstall", (event, arg) => {
  autoUpdater.quitAndInstall();
})