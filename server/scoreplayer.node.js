/*
testing a system for playing a score in time.
to become a reusable library later
*/
//import { Client } from 'node-osc';

let Client = require("node-osc").Client;
let Bundle = require("node-osc").Bundle;
//const client = new Client('10.0.0.255', 7003);
//const client = new Client('10.0.0.174', 7003);
const client = new Client('10.0.0.131', 7004);

var osc = require("osc");
var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 57121,
    metadata: true
});
udpPort.open();

Transport    = require("./transport.node.js").Transport;
ScoreReader  = require("./scorereader.node.js").ScoreReader;
TheoryEngine = require("./theoryengine.node.js").TheoryEngine;

console.log(Transport);

let bpm = 120;
// defining some note lengths
let scorename = "simplescore.txt";

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
    console.log("theory output " + msg);
    console.log(msg.join(" "));
//    let bundle = new Bundle(['/notelist', msg.join(" ")]);
   // const client = new Client('10.0.0.131', 7004);

    /*
    client.send("/notelist", 42, () => {
        console.log("data sent");
        client.close();
    });
    */
    /*
    let bundle = new Bundle(['/notelist', msg]);
    client.send(bundle, () => {
        console.log("data sent");
        client.close();
    });
    */
    let args = msg.map(function(x) {return {type: "i", value: parseInt(x)};});
    let bundle = {
        timeTag: osc.timeTag(1),
        packets :[{
            address: "/notelist",
            args: args
        }]
    }
    console.log(args);
    udpPort.send(bundle, "10.0.0.131", 7004);

        
});

console.log(trans);

trans.updateBpm(bpm);
score.scoreFilename = scorename;



score.openscore(function(){trans.start();});
