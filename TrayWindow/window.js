const Rsync = require('rsync');
const ipc = require('electron').ipcRenderer;
const rsyncFactory = require('../rsyncFactory');
 
const STARTUP_COUNTDOWN_TIMER = 5;

let _appSettings = null;
let syncTime = [];
let syncTimeoutIds = [];
let configChanged = false;
let startupCountdown = STARTUP_COUNTDOWN_TIMER;
let startupCountdownTimer = null;
let isPausedChanged = false;
let paused = false;

document.getElementById("btn-pull").addEventListener("click", function (e) {
  rsyncFactory.rsyncAll('pull');
});

document.getElementById("btn-push").addEventListener("click", function (e) {
  rsyncFactory.rsyncAll('push');
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
      // when sync is complete
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

  if(paused == true)
    return;
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

// Play / Pause button
document.getElementById("pause").addEventListener("click", function (e) {
  paused = !paused;
  isPausedChanged = paused;
  e.target.innerHTML = !paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
  if(!paused) {
    showModal('<p>Sync started.</p>', 5);
    startTimeBasedSync();
    document.querySelector('body').classList.remove('syncPaused');
  }
  else {
    document.querySelector('body').classList.add('syncPaused');
    if(rsyncFactory.getStartedSyncIds().length === 0)
      showModal('<p>Sync paused.</p>', 13);      
    else
      showModal('<p>Sync will pause, after finishing the remaining sync jobs.</p>', 5);
      
  }
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
  if(paused) {
    return;
  }
  setupSyncPanels();
  showModal('<p>Authomatic sync is starting in</p><button><p>' + startupCountdown  + ' sec.</p><p>CANCEL</p></button>');
  document.querySelector('#ModalWin > div > p > button').addEventListener('click', function(event) {
    clearInterval(startupCountdownTimer);
    dismissModal();
  });
  coutdownBeforeSync();  
}

function configChangedActions() {
  if(isPausedChanged) {
    isPausedChanged = false;
    if(!paused) {
      startTimeBasedSync();
      return;
    }
  }
  else {
    showModal('Detected config changes! Restarting sync jobs ....');
    setTimeout( () => { dismissModal() }, 2000);
  }
  initApp();
}

/**
 * Messages with the background process.
 */

ipc.on('ready-to-show', (event, appSettings) => {
  // fires once when app is ready to start sync.
  _appSettings = appSettings;
  debugger;
  setTimeout( () => {
  initApp();
}, 500);
});

ipc.on('show', (event, payload) => {
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