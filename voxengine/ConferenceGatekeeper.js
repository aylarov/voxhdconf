VoxEngine.addEventListener(AppEvents.CallAlerting, function(e) {
  var call = VoxEngine.callConference("hdconf", e.callerid, e.displayName);
  call.addEventListener(CallEvents.MessageReceived, function(e) {
    e.call.sendMessage(e.text);
  });
  VoxEngine.easyProcess(e.call, call);
});
