/* testing sending udp to arduino */
let UDPSENDIP = "10.0.0.255";
//let UDPSENDIP = "10.0.0.131";
let UDPSENDPORT = 7004;

var osc = require("osc");
const { SocketServer } = require("./socketserver.module.js");
var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 57121, // this port for listening
    broadcast: true,
    metadata: true
});
udpPort.open();




sendUDP("RENAME_ME",[7]);


function sendUDP(device, msg){
    console.log("sending");

    //    console.log("theory output " + msg);
    let args = msg.map(function(x) {return {type: "i", value: parseInt(x)};});
    let bundle = {
        timeTag: osc.timeTag(1),
        packets :[{
            address: "/"+device+"/config/somevar",
            args: args
        }]
    }
    udpPort.send(bundle, UDPSENDIP, UDPSENDPORT);     
    console.log("sent");
}