/*
Conductor.node.js is the code that runs. 
It connects the various modules, 
holds the configuration variables
and shows how messages are routed from one to the other.

*/

let bpm = 120;
// defining some note lengths
let scorename = "./scores/simplescore.txt";
let UDPSENDIP = "10.0.0.255";
//let UDPSENDIP = "10.0.0.131";
let UDPSENDPORT = 7004;
let UDPLISTENPORT = 7005;

let WEBSOCKET_PORT = 8001;
let WEBSERVER_PORT = 8002;

let default_webpage = "conductor.html";


var osc = require("osc");
const { SocketServer } = require("./modules/socketserver.module.js");
var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: UDPLISTENPORT, // this port for listening
    broadcast: true,
    metadata: true
});

udpPort.open();


// transport generates beat messges
const Transport    = require("./modules/transport.module.js").Transport;
// Score reader outputs messages at timed intervals
const ScoreReader  = require("./modules/scorereader.module.js").ScoreReader;
// thoeryEngine generates lists of notes from theory terms (eg A MINORPENTATONIC)
const TheoryEngine = require("./modules/theoryengine.module.js").TheoryEngine;
// socketServer is the web page that gets control messages
const socketServer = require("./modules/socketserver.module.js").SocketServer;
// orchestra controls local instruments that generate midi values, and /or actual tones
const Orchestra    = require("./modules/orchestra.module.js");
// jzz controls a local synthesizer and connected midi devices
const JZZ = require('jzz');
require('jzz-synth-fluid')(JZZ);

socketServer.WEBSOCKET_PORT  = WEBSOCKET_PORT;
socketServer.WEBSERVER_PORT  = WEBSERVER_PORT;
socketServer.default_webpage = default_webpage;

console.log("starting");

// initialize the modules
orchestra = new Orchestra();
trans  = Object.create(Transport);
score  = Object.create(ScoreReader);
theory = Object.create(TheoryEngine);
socket = Object.create(socketServer);

// intialize the midi synth
let args = ["a", "coreaudio"];
// paths to soundfonts will change depending on the system.
let soundfont = './soundfonts/GeneralUserGS/GeneralUserGS.sf2'
//let soundfont = "/Users/donundeen/Downloads/MuseScore_General.sf2";
let synth = JZZ.synth.Fluid({ path: '/opt/homebrew/bin/fluidsynth', 
                sf: soundfont,
                args: args });
orchestra.synth = synth;

// tell the score to do smomething when a beat happens
// send a data over websockets with the transport info
trans.setBeatCallback(function(beatcount, bar, beat, transport){
    score.onbeat(beatcount, bar, beat, transport);
    let data = [beatcount, bar, beat]; 
    socket.sendMessage("curbeat", data);    
});

// when score produces a messages, send it to the theory engine
score.setMessageCallback(function(msg){
    theory.runSetter(msg, "fromscore");
});

// when the websocket gets a message, send it where it needs to go
socket.setMessageReceivedCallback(function(msg){
    let result = routeFromWebsocket(msg, "chord", function(msg){
        theory.runSetter(msg, "fromsocket");
    });
    routeFromWebsocket(msg, "getscore", function(msg){
        data = score.scoreText;
        socket.sendMessage("score", data);    
    });
    routeFromWebsocket(msg, "getscorelist", function(msg){
        score.getScoreList(function(list){
            socket.sendMessage("scorelist", list);    
        });
    });
    routeFromWebsocket(msg,"loadscore", function(msg){
        score.scoreFilename = msg;
        score.openscore(function(scoreText){    
            socket.sendMessage("score", scoreText);             //  trans.start();
        });        
    });

    routeFromWebsocket(msg,"savescore", function(msg){
        let filename = msg.filename;
        let scoreText = msg.scoreText;
        let dir = score.scoreDir;
        let fullpath = dir + "/"+filename;

        fs.writeFile(fullpath, scoreText, err => {
            if (err) {
                console.error(err);
            } else {
                // file written successfully
            }
        });        
    });

    routeFromWebsocket(msg, "stop", function(msg){
        trans.stop();
    });
    routeFromWebsocket(msg, "play", function(msg){
        trans.start();
    });
    routeFromWebsocket(msg, "pause", function(msg){
        trans.pause();
    });

    routeFromWebsocket(msg, "setbpm", function(msg){
        let bpm = msg.bpm;
        trans.updateBpm(bpm);
        orchestra.all_instrument_set_val("bpm", bpm);
    });

    routeFromWebsocket(msg, "ready", function(msg){
        data = score.scoreText;
        socket.sendMessage("score", data);     
    });
    routeFromWebsocket(msg, "score", function(text){
        score.scoreText = text;
    });

    routeFromWebsocket(msg, "instrval", function(data){
        // send config messages to instruments
        // remind myself how the instruments like to get messages...

    });


});

// handling message over OSC
udpPort.on("message", function (oscMsg) {
    // when an OSC messages comes in
//    console.log("An OSC message just arrived!", oscMsg);
    // pass the message to the orchestra, which controls all the instruments
//    orchestra.parseOSC(oscMsg.address, oscMsg.args);

    // announcind instruments to create them in the orchestra
    routeFromOSC(oscMsg, "/announceLocalInstrument", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        console.log(value);
        let name = value;
        if(value.name){
            name = value.name;
        }
        orchestra.create_local_instrument(name, value).start();
    });
    // processing request to destroy and instruments
    routeFromOSC(oscMsg, "/removeLocalInstrument", function(oscMsg, address){
        let value = oscMsg.simpleValue;
        let name = value;
        if(value.name){
            name = value.name;
        }
        orchestra.destroy_local_instrument(name);
    });


    // setting config values for instruments
    let instrnames = orchestra.get_instrument_names()
    let localInstrMatch = "("+ instrnames.join("|")+")";
    if(localInstrMatch != "()"){
        let configMatch =  "\/property\/"+localInstrMatch+"\/[^\/]+"
        routeFromOSC(oscMsg, configMatch, function(oscMsg, address){
            let instrname = address[2];
            let propname = address[3];
            let value = oscMsg.simpleValue;
            if(instrname.toLowerCase() == "all"){
                orchestra.all_instrument_set_val(propname, value);
            }else{
                orchestra.instrument_set_val(instrname, propname, value);
            }
        });
    }
});

// oasMsg : osc message, with .address and .args address provided
// route : string or regex to match the address
// args: the message content
// callback function(oscMsg, routematches)
// -- the orginalOSCMsg, with propery simpleValue added, 
//    which is the best we could do to get the sent message value as a simple value or JSON array
// -- the address split into an arrqy on /
function routeFromOSC(oscMsg, route, callback){

    // get teh OSC value. Need to figure out types here, 
    let value = oscMsg.args;

    console.log("got oscMsg " + value, value);
    console.log(oscMsg);

    if(typeof value == "number"){
        value = value;
    }else if(Array.isArray(value) && value.length == 1 && Object.hasOwn(value[0], "value")){
        if(value[0].type == "s"){
            try{
                value = JSON.parse(value[0].value);
            }catch(e){
                value = value[0].value;
            }
        }else{
            value = value[0].value;
        }
    }else{
        console.log("!!!!!!!!!!!!!! ");
        console.log("don't know what value is " + Array.isArray(value) + " : " + value.length + " type :" + typeof value);
    }

    oscMsg.simpleValue = value;

    let matches = oscMsg.address.match(route);
    if(matches){
        let split = oscMsg.address.split("/");
        callback(oscMsg, split);
    }
}


// some websocket messages come in with a word preceding them, 
// which helps determine what they mean and where they should go.
// pass to Route to send to a specific callback.
// return true if the route was a match, false otherwise.
function routeFromWebsocket(msg, route, callback){
    let channel = false;
    let newmsg = false;
    if(msg.address){
        channel = msg.address; 
        newmsg = msg.data;       
    }else{
        let split = msg.split(/ /);
        channel = split.shift();
        newmsg = split.join(" ");
    }
    if(channel.toLowerCase() == route.toLowerCase()){
        callback(newmsg);
        return true;
    }
    return false;
}


// when the theory engine produces a list of notes,
// send it out over udp (to networked devices)
// also send it to local instruments in the orchestra
theory.setMidiListCallback(function(msg){
    //console.log("theory output ");
    //console.log(msg);
    let args = msg.map(function(x) {return {type: "i", value: parseInt(x)};});
    let bundle = {
        timeTag: osc.timeTag(1),
        packets :[{
            address: "/all/notelist",
            args: args
        }]
    }
    // send notelist to all UDP connected devices
    udpPort.send(bundle, UDPSENDIP, UDPSENDPORT);
    // and send to local ochestra
    orchestra.all_instrument_set_val("notelist", msg);   
});


// set the bpm in the transport and the orchestra
trans.updateBpm(bpm);
orchestra.all_instrument_set_val("bpm", bpm);

// set the name of the score
score.scoreFilename = scorename;


// start the socket server and the web server
socket.startSocketServer();
socket.startWebServer();

// open the score file, 
// and when it's open, run the score
// or we're waiting for the web page to load up to start it?
score.openscore(function(){    
  //  trans.start();
});//function(){trans.start();});
