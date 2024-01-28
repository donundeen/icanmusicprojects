/*
testing a system for playing a score in time.
to become a reusable library later
*/

let bpm = 120;
// defining some note lengths
let scorename = "simplescore.txt";
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

Transport    = require("./transport.module.js").Transport;
ScoreReader  = require("./scorereader.module.js").ScoreReader;
TheoryEngine = require("./theoryengine.module.js").TheoryEngine;
socketServer = require("./socketserver.module.js").SocketServer;

console.log(Transport);

console.log("starting");

trans = Object.create(Transport);
score = Object.create(ScoreReader);
theory = Object.create(TheoryEngine);

trans.setBeatCallback(function(beatcount, bar, beat, transport){
    score.onbeat(beatcount, bar, beat, transport)
});

score.setMessageCallback(function(msg){
    theory.runSetter(msg, "fromscore");
});

theory.setMidiListCallback(function(msg){
//    console.log("theory output " + msg);
    let args = msg.map(function(x) {return {type: "i", value: parseInt(x)};});
    let bundle = {
        timeTag: osc.timeTag(1),
        packets :[{
            address: "/notelist",
            args: args
        }]
    }
    udpPort.send(bundle, UDPSENDIP, UDPSENDPORT);     
});

console.log(trans);

trans.updateBpm(bpm);
score.scoreFilename = scorename;

socketServer.startSocketServer();
socketServer.startWebServer();

//score.openscore(function(){trans.start();});
