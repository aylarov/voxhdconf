// Enable Conference module
require(Modules.Conference);

var conf = null,
    calls = [];

// Create conference during the session start
VoxEngine.addEventListener(AppEvents.Started, function(e) {
  if (conf === null) {
    // hd_audio - enable HD conferencing
    conf = VoxEngine.createConference({ hd_audio: false });
  }
});

// Connect inbound call to conference
VoxEngine.addEventListener(AppEvents.CallAlerting, function(e) {
  e.call.addEventListener(CallEvents.Connected, handleCallConnected);
  e.call.addEventListener(CallEvents.Disconnected, handleCallDisconnected);
  e.call.answer();
});

// Connect media streams
function handleCallConnected(e) {
  VoxEngine.sendMediaBetween(conf, e.call);
  calls.push(e.call);
  for (var i=0; i < calls.length; i++) calls[i].sendMessage(JSON.stringify({participants: calls.length}));
}

// No more calls - terminate the session
function handleCallDisconnected(e) {
  var index = calls.indexOf(e.call);
  if (index > -1) calls.splice(index, 1);
  if (calls.length === 0) VoxEngine.terminate();
}