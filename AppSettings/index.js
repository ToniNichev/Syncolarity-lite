const fs = require('fs');
const path = require('path');
class AppSettings {

  constructor(callback) {
    this.test = [];
    this.filepath = path.join(__dirname, '/../settings/app-settings.json');    
    this.callback = callback;
    this.loadSettings();

  } 
  
  loadSettings() {
    let filepath = this.filepath;

    try {
      if (fs.existsSync(filepath)) {
        //settings exists
        fs.readFile(filepath, 'utf-8', (err, data) => {
          if(err){
              console.log("Error loading settings!");
              return;
          }    
    
          this.config = JSON.parse(data); 
          if(typeof this.callback != 'undefined') {
            this.callback();
          }
        });        
      }
    } catch(err) {
      // create config for the first time
      let appSettingsConfig = '{"firstTimeRun":1,"syncConfigs":[]}';
      saveSettings(appSettingsConfig);
    }    
  }

  saveSettings(appSettingsConfig) {   
    //this.config.syncConfigs = appSettingsConfig;
    this.config = appSettingsConfig;
    //this.config.firstTimeRun = 0;
    let filepath = this.filepath;
    let cfg = JSON.stringify(this.config);
    fs.writeFile(filepath, cfg,  function (err) {
      console.log("SAVED");
      if(err){
          console.log("An error ocurred reading the file :" + err.message);
          return;
      }    
    });     
  }

}  

module.exports = AppSettings;