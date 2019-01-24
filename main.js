const {app, ipcMain} = require('electron');
const TrayWindow = require('./TrayWindow');
const TrayIcon = require('./TrayIcon');
const SettingsWindow = require('./SettingsWindow');
const AppSettings = require('./AppSettings');
  
let trayWindow = null;
let trayIcon = null;
let appSettings = null;
let settingsWindow = null;
  
app.on('ready', function() {
  appSettings = new AppSettings(() => {  
    appSettings.test.push("one");
    trayWindow = new TrayWindow(appSettings);
    trayIcon = new TrayIcon(trayWindow.window);
    settingsWindow = new SettingsWindow(appSettings);
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

