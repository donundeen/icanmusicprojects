// comments here
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
    sockets.forEach(s => s.send(msg)); // send back out - we don't need to do this
  	console.log(msg);
	  Max.post("Got message " + msg.toString());

  	Max.outlet(msg.toString());	
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function() {
    sockets = sockets.filter(s => s !== socket);
  });
});

Max.post(__dirname);

connect()
     .use(serveStatic(__dirname+"/.."))
     .listen(8000, () => 	Max.post('Server running on 8000... http://localhost:8000/other/aiselector.html'+__dirname));
