const AppSettings = require('../AppSettings');
let appSettings = null;
var startedSyncIds = [];
var disableLogScroll = false;
var lastSyncStatus = [];
var onCompleteFuncs = [];
var rsyncMessagesCount = [];

function loadConfig(config) {
  _config = config.config.syncConfigs;
}

function rsyncAll(mode) {
  for(var q=0;q <  _config.length; q++) {
    var config = _config[q];
    this.rsyncConfigId(q, mode, null ,true);
  }
}

/**
 * Called when sync job is invoked
 * @param {int} id sync job jd
 * @param {string} mode - pull / push
 * @param {cakkback} onComplete 
 */
function rsyncConfigId(id, mode, onComplete) {
  rsyncMessagesCount[id] = 0;
  onCompleteFuncs[id] = onComplete;
  if(startedSyncIds.includes(id)) {

    addToLogWindow(id, mode, "<important>Synk in progress, skipping!</important><br/>", onComplete);
    return;
  }

  window.ipcRenderer.send('sync-started');
  startedSyncIds.push(id);
  var config = _config[id];
  if(mode == 'push')
    this.rsyncRequest(id, config.title, config.syncFolder, config.serverUrl, prepareExcludeList(config.exclusions), mode, config.opt);
  else
    this.rsyncRequest(id, config.title, config.serverUrl, config.syncFolder, prepareExcludeList(config.exclusions), mode, config.opt);  
}

function rsyncRequest(id, title, from, to, excludeList, mode, opt) {
  var rsync = new Rsync()
    .shell('ssh')
    .flags('av')
    .source(from + '/')
    .destination(to);

  if(opt) {
    Object.keys(opt).forEach(function(key,index) {
      if(opt[key]) {
        rsync.set(key);
      }
    });    
  }

  if(excludeList[0])
    rsync.exclude(excludeList);

  const m = mode == 'push' ? '<i class="fas fa-upload"></i>' : '<i class="fas fa-download"></i>';
  const _date = new Date().toString();
  lastSyncStatus[id] = "<statusOK>" + m + _date + "</statusOK>";
  addToLogWindow(id, mode, "<header>" + m + " " +  title + " : " + _date + "</header>", onCompleteFuncs[id]);
  document.querySelector(".controlPannel[key='" + id + "']").classList.add("pulse");    
  
  rsync.execute(function(error, code, cmd, onComplete) {
    if(error) {
      const m = '<i class="fas fa-exclamation-circle"></i>';
      lastSyncStatus[id] = "<statusError>" + m + " " + _date + "</statusError>";
      document.querySelector('[key="' + id + '"] .status-pannel').innerHTML = lastSyncStatus[id];
      addToLogWindow(id, mode, "<error>" + m + " " +  error.message + " : " + _date + "</error><br>total size is 0.", onCompleteFuncs[id]);
      // disable tray icon animation, and pulse of the panel
      syncJobCompleted(id);      
    }
    else {
      onCompleteFuncs[id]();
    }
  }, function(stdOutChunk){      
      var msg = stdOutChunk.toString();
      if(msg.match(/[0-9]*\sfiles\.\.\./gi, ''))
        return;
      rsyncMessagesCount[id] = rsyncMessagesCount[id] + 1;        
      addToLogWindow(id,mode, msg + "<br>", onCompleteFuncs[id]);
  });
}

function addToLogWindow(id, mode, msg, onComplete) {
  msg = msg.split("\n").join("<br>");

  // if sync completed, execute the code below.  
  if(msg.includes('<br>total size is')) {    
    // remove startedSyncIds
    removeStartedSyncId(id);          
    // disable tray icon animation, and pulse of the panel
    syncJobCompleted(id);
    // tray notification
    var trayMsgParts = msg.split('<br>sent ');
    if(trayMsgParts.length == 1)
    trayMsgParts[1] = "";
    let trayMsg = trayMsgParts[1].replace(/<br>/g, '');
    let tryMsgTitle = trayMsgParts[1] == '' ? 'Error syncing ' +  _config[id].title + "!" : 'Sync ' +  _config[id].title + ' complete!';
    sendNotification(id, tryMsgTitle, trayMsg, 'request-showing-of-main-window', onComplete);    
    // footer and status notification msg
    const title = _config[id].title;
    const m = mode == 'push' ? '<i class="fas fa-upload"></i>' : '<i class="fas fa-download"></i>';
    const _date = new Date().toString();
    msg = trayMsgParts[0] + '<footer>' + m + ' ' + title + ' complete! ' +  _date + "<linebreak />" + trayMsgParts[1] + '</footer><br><br>';
    document.querySelector('[key="' + id + '"] .status-pannel').innerHTML = lastSyncStatus[id];
    // disable tray icon animation, and pulse of the panel
    syncJobCompleted(id);    
  } 

  var newtext = document.createElement('p');
  newtext.innerHTML = msg;
  var log = document.getElementById("log");
  log.appendChild(newtext);  

  if(!disableLogScroll)
    document.querySelector('#log').scrollTo(0,document.querySelector('#log').scrollHeight);  
}

function removeStartedSyncId(id) {
  startedSyncIds = startedSyncIds.filter(function(value, index, arr){
    return value != id;  
  });  
}

document.querySelector('#log').addEventListener('mouseenter', function (e) {
  disableLogScroll = true;
});

document.querySelector('#log').addEventListener('mouseleave', function (e) {
  disableLogScroll = false;
});
 
 

function sendNotification(id, title, message, mainProcessNotificationType, onComplete) {

  if(rsyncMessagesCount[id] > 5) {
    // send notification only if there are real updates
    let notif = new window.Notification( title, {
      body: message
    });

    // send notification to the main process if needed
    if(mainProcessNotificationType != null) {
      notif.onclick = function () {
        window.ipcRenderer.send(mainProcessNotificationType);
      }    
    }    
  }
  rsyncMessagesCount[id] = 0;

  
  if(onComplete != null) {
    //onComplete();
  }  
}

function _getStartedSyncIds() {
  return startedSyncIds;
}

function _getLastSyncStatus(id) {
  return lastSyncStatus[id] || "";
}

function syncJobCompleted(id) {
  if(rsyncFactory.getStartedSyncIds().includes(id))
    return;
  // remove pannel pulse
  document.querySelector(".controlPannel[key='" + id + "']").classList.remove("pulse");       
  // disable tray icon animation
  if(startedSyncIds.length == 0)
    window.ipcRenderer.send('sync-stopped');      
}

module.exports =  {
  loadConfig: loadConfig,
  rsyncRequest: rsyncRequest,
  rsyncAll: rsyncAll,
  rsyncConfigId: rsyncConfigId,
  getStartedSyncIds: _getStartedSyncIds,
  getLastSyncStatus: _getLastSyncStatus
}