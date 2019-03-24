const { BrowserWindow, Tray } = require('electron');
const Positioner = require('electron-positioner');
const path = require('path');

class TrayIcon {  
  constructor(trayWindow) {
    this.iconId =1;
    this.trayWindow = trayWindow;
    this.createNewTryIcon(); 
  }


  animate() {
    clearInterval(this.tryIconInterval);
    this.tryIconInterval = setInterval( () => {   
      this.createNewTryIcon();   
    }, 1000 );
  }

  createNewTryIcon() {
    if(typeof this.trayIcon != 'undefined')
      this.trayIcon.destroy();
    this.iconId = this.iconId > 6 ? 1 : this.iconId;
    const filepath = path.join(__dirname, '/../icons/tray-icon-' + this.iconId + '.png');    
    this.trayIcon = new Tray(filepath);
    this.iconId++;

    this.trayIcon.setToolTip('Syncolarity'); 

    this.trayIcon.on('click', (e, bounds) => {
      if ( this.trayWindow.isVisible() ) {
        this.trayWindow.hide();
      } else {
        let positioner = new Positioner(this.trayWindow);
        positioner.move('trayCenter', bounds);

        this.trayWindow.show();
      }
    }); 
  }

  stopAnimation() {
    clearInterval(this.tryIconInterval);
  }
}



module.exports = TrayIcon;