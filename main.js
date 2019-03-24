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
let devMode = true;

function sendStatusToWindow(text) {
  trayWindow.window.webContents.send('message', text);
}
  
app.on('ready', function() {
  appSettings = new AppSettings(() => {  
    appSettings.devMode = devMode;
    trayWindow = new TrayWindow(appSettings);
    trayIcon = new TrayIcon(trayWindow.window);
    settingsWindow = new SettingsWindow(appSettings);
    setTimeout(() => {
      sendStatusToWindow("App is starting!");
      autoUpdater.checkForUpdatesAndNotify();
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




// when receiving a quitAndInstall signal, quit and install the new version ;)
ipcMain.on("quitAndInstall", (event, arg) => {
  autoUpdater.quitAndInstall();
});


/* Auto updater */

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('updateReady');
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
});


