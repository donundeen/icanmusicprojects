// comments here
const path = require('path');
const Max = require('max-api');
const WebSocket = require('ws');
var connect = require('connect');
var serveStatic = require('serve-static');

// figuring out IP address:
const { networkInterfaces } = require('os');
const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
      if (net.family === familyV4Value && !net.internal) {
          if (!results[name]) {
              results[name] = [];
          }
          results[name].push(net.address);
      }
  }
}
//Max.post(results);
let my_ip_address = results["en0"];


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
     .listen(8000, () => 	{
      Max.post('Server running on 8000... http://'+my_ip_address+':8000/other/aiselector.html '+__dirname);
      Max.post('http://'+my_ip_address+':8000/other/aiselector.html');
      Max.outlet('UIInterface http://'+my_ip_address+':8000/other/aiselector.html');
     });
