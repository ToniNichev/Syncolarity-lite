const Rsync = require('rsync');
const ipc = require('electron').ipcRenderer;
const rsyncFactory = require('../rsyncFactory');
 
const STARTUP_COUNTDOWN_TIMER = 5;

let _appSettings = null;
let notif = null;
let syncTime = [];
let syncTimeoutIds = [];
let configChanged = false;
let startupCountdown = STARTUP_COUNTDOWN_TIMER;
let startupCountdownTimer = null;

document.getElementById("btn-pull").addEventListener("click", function (e) {
  mode = 'PULL';
  rsyncFactory.rsyncRequest(_appSettings.serverUrl, _appSettings.syncFolder, prepareExcludeList(_appSettings.exclusions));
});

document.getElementById("btn-push").addEventListener("click", function (e) {
  rsyncFactory.rsyncAll();
});

function prepareExcludeList(rawList) {
  if(typeof rawList == 'undefined') {
    return [];
  }
  var list = rawList.split('\n');
  return list;
}

/**
 * Start time based sync process
 * @param {*} id the id of the sync config
 */
function startSync(id) {
  
  function pullRequest(id) {
    rsyncFactory.rsyncConfigId(id, 'pull', function() {
      // sync complete
      const sec = (new Date() - syncTime[id]) / 1000;
      if( sec >= + _appSettings.config.syncConfigs[id].interval && !rsyncFactory.getStartedSyncIds().includes(id) ) {
        console.log("eligable for re-sync");
        // eligable for re-sync
        startSync(id);
      }
      else {
        if(configChanged) {
          if(rsyncFactory.getStartedSyncIds().length == 0) {
            alert("Sync completed! Detected config changes.");
            configChanged = false;
            // init the app with config = null since the config was already updated.
            initApp(null);
          }
          return;
        }
        const remindingTime = Math.round( + _appSettings.config.syncConfigs[id].interval - sec);
        console.log("check again in " + remindingTime + " sec.");
        syncTimeoutIds[id] = setTimeout( () => {
          // check again in `remindingTime` seconds.
          startSync(id);
        }, remindingTime * 1000);
      }
    });
  }

  syncTime[id] = new Date();
  // do the pull request, wait 1/2 sec and request pull sync
  rsyncFactory.rsyncConfigId(id, 'push', function() {    
    setTimeout( () => { 
      pullRequest(id); 
    }, 10);
  });
}

// When config updates, or loads do these:
function startTimeBasedSync() {
  // set up time based sync for each config.
  startupCountdown = STARTUP_COUNTDOWN_TIMER;
  setTimeout(() => {
    _appSettings.config.syncConfigs.forEach((element, id) => {     
      if(element.autosync && !rsyncFactory.getStartedSyncIds().includes(id) ) {
        startSync(id);
      }
    });
  }, 1000); 
}


function setupSyncPanels() {
  // draw sync panels
  document.querySelector('#settingsList').innerHTML = returnPanels(_appSettings.config.syncConfigs.length);
  var co = 0;
  _appSettings.config.syncConfigs.map((config, id) => {  

    // statusbar
    document.querySelectorAll('#settingsList > .controlPannel')[co].querySelector('.status-pannel').innerHTML = rsyncFactory.getLastSyncStatus([co]);

    // attach panel events.
    document.querySelectorAll('#settingsList > .controlPannel')[co].querySelector('.label').innerText = config.title;
    document.querySelectorAll('#settingsList > .controlPannel')[co].setAttribute('key', co);
    // push button
    document.querySelectorAll('#settingsList > .controlPannel')[co].querySelector('.buttonsHolder > .button-push').addEventListener('click', function(e) {         
      var id = + e.srcElement.parentElement.parentElement.getAttribute('key');
      rsyncFactory.rsyncConfigId(id, 'push');
    });
    // pull button
    document.querySelectorAll('#settingsList > .controlPannel')[co].querySelector('.buttonsHolder > .button-pull').addEventListener('click', function(e) {         
      var id = + e.srcElement.parentElement.parentElement.getAttribute('key');
      rsyncFactory.rsyncConfigId(id, 'pull');
    });

    // pulse active syncs 
    if(rsyncFactory.getStartedSyncIds().includes(''+ id)) {
      document.querySelector(".controlPannel[key='0']").classList.add("pulse");  
    }      
    co ++;
  });  
}

function returnPanels(numberPanels) {
  let html = '';
  for(var q = 0;q < numberPanels; q++) {
    html += document.querySelector('#panelsContainer > .controlPannel').outerHTML;
  }
  return html;
}

document.getElementById("clear-log").addEventListener("click", function (e) {
  document.querySelector('#log').innerHTML = "";
});

document.getElementById("expand-log").addEventListener("click", function (e) {
    if(document.getElementById("logWrapper").classList.contains("logWrapperExpanded")) 
      document.getElementById("logWrapper").classList.remove('logWrapperExpanded');    
    else
      document.getElementById("logWrapper").classList.add('logWrapperExpanded');    
    
});


document.getElementById("setup").addEventListener("click", function (e) {
  window.ipcRenderer.send('request-showing-of-settting-window');
});

function coutdownBeforeSync() {
  startupCountdownTimer = setTimeout( () => {
    document.querySelector('#ModalWin > div > p > button > p:nth-child(1)').innerHTML = startupCountdown + ' sec.';
    startupCountdown --;
    if(startupCountdown > -1) {
      coutdownBeforeSync();
    }
    else {
      // start sync
      startTimeBasedSync();
      dismissModal();
    }
  },1000);
}


function initApp(appSettings) {
  if(appSettings != null)
    _appSettings = appSettings;
  rsyncFactory.loadConfig();
  startupCountdown = STARTUP_COUNTDOWN_TIMER;
  console.log("!!!!!!!!!!!!!: ", STARTUP_COUNTDOWN_TIMER);
  setupSyncPanels();
  showModal('<p>Authomatic sync is starting in</p><button><p>' + startupCountdown  + ' sec.</p><p>CANCEL</p></button>');
  document.querySelector('#ModalWin > div > p > button').addEventListener('click', function(event) {
    clearInterval(startupCountdownTimer);
    dismissModal();
  });
  coutdownBeforeSync();  
}

/**
 * Messages with the background process.
 */

ipc.on('ready-to-show', (event, appSettings) => {
  // fires once when app is ready to start sync.
  initApp(appSettings);
});

ipc.on('show', (event, payload) => {
  alert("!");
  console.log(payload);
});

ipc.send('update-notify-value', 123);


ipc.on('save-config-notify', (event, appSettings) => {
  configChanged = true; 
  console.log(">>>>", appSettings);
  debugger;
  syncTimeoutIds.map( (timeoutId, id) => {
    clearTimeout(syncTimeoutIds[id]);   
  });
  syncTimeoutIds = [];
  if(rsyncFactory.getStartedSyncIds().length == 0) {
    alert("Detected config changes!");
    initApp(appSettings);
  }
});