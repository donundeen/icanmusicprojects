
// getting args
let argsin = process.argv;

let def_device= "RENAME_ME";
let def_var = "midi_voice";
let def_val = 2;
let def_type = "i";

let device = def_device;
let varname = def_var;
let varval = def_val;
let vartype = def_type; 

let args = false;

if(argsin.length > 2){
    device = argsin[2]; // 3rd
    varname = argsin[3]; // 4th
}
if(argsin.length == 6){
    vartype = argsin[4];
    varval = argsin[5];
    args = {type: vartype, value: varval};
}


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


sendUDP(device, varname, {type:vartype, value:varval});

setTimeout(function(){process.exit(), 500});

function sendUDP(device, varname, args){
    console.log("sending");
    let address =  "/"+device+"/config/"+varname;
    console.log(address);
    console.log(args);
    //    console.log("theory output " + msg)
    // let args = msg.map(function(x) {return {type: "i", value: parseInt(x)};});
    let bundle = {
        timeTag: osc.timeTag(1),
        packets :[{
            address: address,
            args: args
        }]
    }
    console.log(UDPSENDIP);
    console.log(bundle);
    try{
        udpPort.send(bundle, UDPSENDIP, UDPSENDPORT);     
    }catch(e){
        console.log("udp send error");
        console.log(e);
    }
    console.log("sent");
}