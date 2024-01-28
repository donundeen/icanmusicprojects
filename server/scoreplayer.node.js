/*
testing a system for playing a score in time.
to become a reusable library later
*/
import { Client } from 'node-osc';

const client = new Client('10.0.0.255', 7003);



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
    console.log("theory output" + msg);
    client.send('/notelist', msg, () => {
        console.log("data sent");
//        client.close();
    });    
});

console.log(trans);

trans.updateBpm(bpm);
score.scoreFilename = scorename;

console.log("OPENED" + score.scoreText);



score.openscore(function(){trans.start();});
