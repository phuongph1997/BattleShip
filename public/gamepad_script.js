

var socket = io.connect("18.136.212.75")

makeid()

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 12; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  console.log(text)
  socket.emit("Gamepad_Connect", text )
  return text;
}

