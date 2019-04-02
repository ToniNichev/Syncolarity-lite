const Rsync = require('rsync');
const ipc = require('electron').ipcRenderer;
const rsyncFactory = require('../rsyncFactory');

var appVersion = require('electron').remote.app.getVersion();
 
const STARTUP_COUNTDOWN_TIMER = 3;

let _appSettings = null;
let syncTime = [];
let syncTimeInSeconds = [];
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

document.getElementById("appTitle").innerHTML = "Syncolarity v " + appVersion;

setInterval(function() {
  for(let i=0; i < _config.length; i ++) {
    let interval = + _config[i].interval;
    let secondsLeft = interval - Math.round((new Date() - syncTime[i]) / 1000);
    let progressBar = document.querySelectorAll("#settingsList .controlPannel")[i].querySelector(".syncTimeProgressBar");
    let w = (window.innerWidth - 10) / interval;
    progressBar.style.width = secondsLeft * w + "px";
  }


}, 1000);


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
function startSync(id, syncPart) {


  if(paused == true)
    return;   

  var actions = [ 'push' , 'pull' , 'push-pull' , 'pull-push'];
  var actionId = _appSettings.config.syncConfigs[id].action;    
  var executeActions = actions[actionId].split('-');
  
  rsyncFactory.rsyncConfigId(id, executeActions[syncPart], function() {
    // when sync is complete
    if(executeActions.length == 1 || (executeActions.length > 1 && syncPart ==1) ) {
      syncTime[id] = new Date();
    }
    if(syncPart == 0 && executeActions.length > 1) {
      // if first sync part is complete, and tehre is second part, run it.
      startSync(id, 1);      
      return;
    }

    const sec = Math.round( (new Date() - syncTime[id]) / 1000 );

    if( sec >= + _appSettings.config.syncConfigs[id].interval && !rsyncFactory.getStartedSyncIds().includes(id) ) {
      // eligable for re-sync
      startSync(id, 0);
    }
    else {
      if(configChanged || isPausedChanged) {          
        if(rsyncFactory.getStartedSyncIds().length == 0) {
          configChangedActions();
        }
        return;
      }
      const remindingTime = Math.round( _appSettings.config.syncConfigs[id].interval - sec);
      console.log("check again in " + remindingTime + " sec.");
      syncTimeoutIds[id] = setTimeout( () => {
        // check again in `remindingTime` seconds.
        startSync(id, 0);
      }, remindingTime * 1000);
    }
  });

}

// When config updates, or loads do these:
function startTimeBasedSync() {
  // set up time based sync for each config.
  startupCountdown = STARTUP_COUNTDOWN_TIMER;
  setTimeout(() => {
    _appSettings.config.syncConfigs.forEach((element, id) => {  
      //console.log(">>>", element.)
      if(element.autosyncActive && !rsyncFactory.getStartedSyncIds().includes(id) ) {
        startSync(id, 0);
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
  e.target.innerHTML = !paused ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>'; 
  if(!paused) {
    showModal('<p>Sync started.</p>', 5);
    startTimeBasedSync();
    document.querySelector('body').classList.remove('syncPaused');
  }
  else {
    document.querySelector('body').classList.add('syncPaused');
    if(rsyncFactory.getStartedSyncIds().length === 0)
      showModal('<p>Sync paused.</p>', 3);      
    else
      showModal('<p>Sync will pause, after finishing the remaining sync jobs.</p>', 3);
      
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

function initAppPartTwo() {
  showModal('<p>Authomatic sync is starting in</p><button class="autoSyncCancel"><p>' + startupCountdown  + ' sec.</p><p>CANCEL</p></button>');
  document.querySelector('#ModalWin > div > p > button').addEventListener('click', function(event) {
    clearInterval(startupCountdownTimer);
    paused = true;
    //isPausedChanged = paused;
    document.querySelector('#pause').innerHTML = '<i class="fas fa-play"></i>';
    document.querySelector('body').classList.add('syncPaused');    
    dismissModal();
  });
  coutdownBeforeSync();    
}

function initApp() {
  rsyncFactory.loadConfig(_appSettings);
  startupCountdown = STARTUP_COUNTDOWN_TIMER;
  configChanged = false;
  if(paused) {
    return;
  }
  setupSyncPanels();

  if(_appSettings.config.firstTimeRun==1) {
    showModal(`
      <firstTimeRun>
      <h1>Thanks for using Syncolarity!</h1>
      <hr>
      On the top left:<br>
      Use <i class="fas fa-cogs"></i> button to create new sync jobs.<br>
      Use <i class="fas fa-pause"></i> to pause/resume authomated sync jobs.<br>
      <button onclick="
        dismissModal();
        document.querySelector('.close').style.display = 'block';
        _appSettings.config.firstTimeRun = 0;
        ipc.send('save-config-notify', _appSettings);
        setTimeout( function() { initAppPartTwo();}, 500);
        ">GOT IT!</button>
      </firstTimeRun>
    `);  
    document.querySelector('.close').style.display = 'none';  
  }
  else {
    initAppPartTwo();
  }
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
    //if(rsyncFactory.getStartedSyncIds().length == 0)
   //   return;
    showModal('Detected config changes! Restarting sync jobs ....');
    setTimeout( () => { dismissModal() }, 3);
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

ipc.on('update-downloaded', (event, payload) => {
  console.log("Update downloaded!");
  console.log(payload);
});


ipc.on('message', function(event, text) {
  console.log(">>>", text);
});
