const Rsync = require('rsync');
const ipc = require('electron').ipcRenderer;
const rsyncFactory = require('../rsyncFactory');
 
const STARTUP_COUNTDOWN_TIMER = 2;

let _appSettings = null;
let syncTime = [];
let syncTimeoutIds = [];
let configChanged = false;
let startupCountdown = STARTUP_COUNTDOWN_TIMER;
let startupCountdownTimer = null;
let isPausedChanged = false;
let paused = false;

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
        // eligable for re-sync
        startSync(id);
      }
      else {
        if(configChanged || isPausedChanged) {
          if(rsyncFactory.getStartedSyncIds().length == 0) {
            configChangedActions();
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
      rsyncFactory.rsyncConfigId(id, 'push', null, true);
    });
    // pull button
    document.querySelectorAll('#settingsList > .controlPannel')[co].querySelector('.buttonsHolder > .button-pull').addEventListener('click', function(e) {         
      var id = + e.srcElement.parentElement.parentElement.getAttribute('key');
      rsyncFactory.rsyncConfigId(id, 'pull', null ,true);
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

document.getElementById("pause").addEventListener("click", function (e) {
  paused = !paused;
  e.target.innerHTML = paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
  debugger;
  initApp();
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

function initApp() {
  rsyncFactory.loadConfig(_appSettings);
  startupCountdown = STARTUP_COUNTDOWN_TIMER;
  configChanged = false;
  setupSyncPanels();
  showModal('<p>Authomatic sync is starting in</p><button><p>' + startupCountdown  + ' sec.</p><p>CANCEL</p></button>');
  document.querySelector('#ModalWin > div > p > button').addEventListener('click', function(event) {
    clearInterval(startupCountdownTimer);
    paused = true;
    dismissModal();
  });
  coutdownBeforeSync();  
}

function configChangedActions() {
  if(isPausedChanged) {
    isPausedChanged = false;
    if(!paused) {
      debugger;
      startTimeBasedSync();
      return;
    }
  }
  else {
    alert("Detected config changes!");
  }
  initApp();
}

/**
 * Messages with the background process.
 */

ipc.on('ready-to-show', (event, appSettings) => {
  // fires once when app is ready to start sync.
  _appSettings = appSettings;
  setTimeout( () => {
  initApp();
}, 500);
});

ipc.on('show', (event, payload) => {
  alert("!");
  console.log(payload);
});

ipc.on('save-config-notify', (event, newAppConfig) => {

  _appSettings = newAppConfig;
  // set this up 
  configChanged = true;
  // disable any ferther sync jobs.
  syncTimeoutIds.map( (timeoutId, id) => {
    clearTimeout(syncTimeoutIds[id]);   
  });
  syncTimeoutIds = [];
  if(rsyncFactory.getStartedSyncIds().length == 0) {
    // if there are no sync jobs, re-init app with the new config.
    configChangedActions();
  }
  else {

  }
});