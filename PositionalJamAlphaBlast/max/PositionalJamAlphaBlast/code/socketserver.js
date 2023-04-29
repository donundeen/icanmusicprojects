const path = require('path');
const Max = require('max-api');
const WebSocket = require('ws');
var connect = require('connect');
var serveStatic = require('serve-static');

const server = new WebSocket.Server({
  port: 8080
});

let sockets = [];

Max.post("trying to start websockets");

server.on('connection', function(socket) {
  sockets.push(socket);
  Max.post("STARTD websockets");

  // When you receive a message, send that message to every socket.
  socket.on('message', function(msg) {
    sockets.forEach(s => s.send(msg));
	console.log(msg);
	Max.post("Got message " + msg);

	Max.outlet("message" + msg);	
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function() {
    sockets = sockets.filter(s => s !== socket);
  });
});

//console.log(__dirname);

connect()
     .use(serveStatic(__dirname))
     .listen(8000, () => console.log('Server running on 8080...'.__dirname));
