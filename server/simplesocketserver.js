// comments here
const path = require('path');
const WebSocket = require('ws');
var connect = require('connect');
var serveStatic = require('serve-static');
let my_ip_address= "localhost";
// figuring out IP address:
const { networkInterfaces } = require('os');

const WEBSOCKET_PORT = 8001;
const WEBSERVER_PORT = 8002;



const server = new WebSocket.Server({
  port: WEBSOCKET_PORT
});

let sockets = [];

console.log("trying to start websockets...");

server.on('connection', function(socket) {
  sockets.push(socket);
  console.log("STARTD websockets");




  // When you receive a message, send that message to every socket.
  socket.on('message', function(msg) {
    sockets.forEach(s => s.send(msg)); // send back out - we don't need to do this
//  	console.log(msg);
//	  console.log("Got message " + msg.toString());

  	console.log(msg.toString());	
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function() {
    sockets = sockets.filter(s => s !== socket);
  });
});

console.log(__dirname);

connect()
      .use(serveStatic(__dirname+"/html"))
      .listen(WEBSERVER_PORT, () => 	{

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
                console.log(name);
                results[name].push(net.address);
            }
        }
      }
      console.log(results);
      if(results["en0"]){
        my_ip_address = results["en0"]; 
      }else if(results["Ethernet"]){
        my_ip_address = results["Ethernet 2"]; 
      }
     

      console.log('Server running on '+WEBSERVER_PORT+'... http://'+my_ip_address+':'+WEBSERVER_PORT+'/aiselector.html '+__dirname);
      console.log('http://'+my_ip_address+':'+WEBSERVER_PORT+'/aiselector.html');
      console.log('UIInterface http://'+my_ip_address+':'+WEBSERVER_PORT+'/aiselector.html');
      console.log('ipaddress '+my_ip_address);
     });
