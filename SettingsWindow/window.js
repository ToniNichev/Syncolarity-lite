'use strict'  
const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer;
//let AppSettings = require('../AppSettings');

let _appSettings = null;

/**
 * Fires after the config file is loaded and sets up the pannels with the config data
 */
function init() {
  document.querySelector('#settingsList').innerHTML = returnPanels(_appSettings.config.syncConfigs.length);
  var co = 0;
  _appSettings.config.syncConfigs.map((config) => {
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings.header button').setAttribute('key', co);
    document.querySelectorAll('#settingsList .settingsPannel')[co].setAttribute('key', co);

    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.locationHolder #sync-folder').value = config.syncFolder;    
    addOpenFolderLocation(document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.locationHolder #select-sync-folder'));  
    addOpenFolderLocation(document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.serverFolder #select-server-folder'));

    // active button    
    var headarBar = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings.header');
    if(config.autosyncActive)
      headarBar.classList.add('active');
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings.header > #autosyncActive').addEventListener('click', function(e) {
      e.target.parentElement.classList.contains("active") ? e.target.parentElement.classList.remove('active') : e.target.parentElement.classList.add('active');      
    });

    // remove sync pannel button
    document.querySelectorAll('#settingsList > .settingsPannel')[co].querySelector('.settings > button').addEventListener('click', function(e) { 
      var child = e.target.parentElement.parentElement;
      document.querySelector('#settingsList').removeChild( child );  
    }); 
    
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('#title').value = config.title; 
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('#remote-server').value = config.serverUrl; 
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('#exclusion-list').value = config.exclusions;
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('#interval').value = config.interval;
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #autosyncActive').checked = config.autosyncActive;   
    var selectObj = config.autosync = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #action'); 
    selectObj.selectedIndex = config.action; 
    // options
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #opt-a').checked = config.opt.a;
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #opt-u').checked = config.opt.u;
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #opt-z').checked = config.opt.z;
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #opt-progress').checked = config.opt.progress;
    document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #opt-delete').checked = config.opt.delete;
    co ++;
  });

  document.getElementById("select-sync-folder").addEventListener("click", function (e) {
    var dialog = remote.dialog;
    var selection = dialog.showOpenDialog({ properties: ['openDirectory']})
  
    if (selection && selection[0]) {
      console.log('got Selection');
    }
    syncFolderPath = selection[0];
    document.getElementById("sync-folder").value = syncFolderPath;
  }); 
}

function addOpenFolderLocation(e) {
  e.addEventListener('click', function(e){
    var dialog = remote.dialog;
    var selection = dialog.showOpenDialog({ properties: ['openDirectory']})
  
    if (selection && selection[0]) {
      console.log('got Selection');
    }
    e.currentTarget.parentElement.querySelector('input').value = selection[0];
  });    
}

/**
 * adding new settings pannel
 */
function addNewSettingsPanel() {
  var last = document.querySelectorAll('#settingsList .settingsPannel').length;  
  var element = document.createElement('div');
  element.innerHTML = document.querySelector('#panelsContainer > .settingsPannel').innerHTML;
  element.setAttribute('class', 'settingsPannel settingsPannelTransparent');
  element.setAttribute('key', last);
  document.querySelector("#settingsList").appendChild(element);
  addOpenFolderLocation(document.querySelectorAll('#settingsList .settingsPannel')[last].querySelector('.locationHolder #select-sync-folder'));
  addOpenFolderLocation(document.querySelectorAll('#settingsList .settingsPannel')[last].querySelector('.serverFolder #select-server-folder'));

  // active button    
  document.querySelectorAll('#settingsList .settingsPannel')[last].querySelector('.settings.header > #autosyncActive').addEventListener('click', function(e) {
    e.target.parentElement.classList.contains("active") ? e.target.parentElement.classList.remove('active') : e.target.parentElement.classList.add('active');      
  });
    
  // remove sync pannel button
  document.querySelectorAll('#settingsList > .settingsPannel')[last].querySelector('.settings > button').addEventListener('click', function(e) { 
    var child = e.target.parentElement.parentElement;
    document.querySelector('#settingsList').removeChild( child );  
  }); 
  document.querySelector('#settingsList').scrollTo(0,document.querySelector('#settingsList').scrollHeight); 
  document.querySelector('.settingsPannel.settingsPannelTransparent').classList.remove('settingsPannelTransparent');
}

/**
 * SAVE buton clicked
 */
document.getElementById("save").addEventListener("click", function (e) {
  var co = 0;
  var appSettingsConfig = [];
  var len = document.querySelectorAll('#settingsList .settingsPannel').length;
  for(var co = 0; co < len ;co ++) {
    var config = {};
    config.syncFolder = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.locationHolder #sync-folder').value;    
    config.title = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('#title').value; 
    config.serverUrl = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('#remote-server').value; 
    config.exclusions = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('#exclusion-list').value;
    config.interval = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('#interval').value;
    config.autosyncActive = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #autosyncActive').checked;    
    var selectObj = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #action'); 
    config.action = selectObj.selectedIndex;
    // options
    config.opt = {};
    config.opt.a = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #opt-a').checked;
    config.opt.u = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #opt-u').checked;
    config.opt.z = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #opt-z').checked;
    config.opt.progress = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #opt-progress').checked;
    config.opt.delete = document.querySelectorAll('#settingsList .settingsPannel')[co].querySelector('.settings > #opt-delete').checked;
    appSettingsConfig.push(config);
  }  
  console.log(">>>", appSettingsConfig);
  _appSettings.config.syncConfigs = appSettingsConfig;
  ipc.send('save-config-notify', _appSettings);
  showModal('Config saved! New settings will be applied after curent jobs are completed or sync is unpaused!', 5);
});


function returnPanels(numberPanels) {
  let html = '';
  for(var q = 0;q < numberPanels; q++) {
    html += document.querySelector('#panelsContainer > .settingsPannel').outerHTML;
  }
  return html;
}


/**
 * Messages from the background process.
 */

ipc.on('ready-to-show', (event, payload) => {
  _appSettings = payload;
  setTimeout( () => {
    init();
  }, 2000);
});

ipc.on('show', (event, payload) => {
  console.log(payload);
});

// save window clicked
ipc.on('save-config-notify-test', function (event, appSettingsConfig) {
  console.log("############################");
  console.log(config);
})  