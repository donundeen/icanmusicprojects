const UDPInstrument = require("./udpinstrument.module");

inst1 = new UDPInstrument(1,2);
inst2 = new UDPInstrument(3,4);



var JZZ = require('jzz');
require('jzz-synth-fluid')(JZZ);

let args = ["a", "coreaudio"];
let program = 22;

///Users/donundeen/Downloads/MuseScore_General.sf2
let soundfont = '/Users/donundeen/Documents/htdocs/icanmusicprojects/server/soundfonts/GeneralUserGS/GeneralUserGS.sf2'
//let soundfont = "/Users/donundeen/Downloads/MuseScore_General.sf2";

console.log("gonna play");


var osc = require("osc");
var oscPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 8006, // this port for listening
    broadcast: true,
    metadata: true
});

oscPort.on("message", function (oscMsg) {
    console.log("An OSC message just arrived!", oscMsg);
    if(oscMsg.address == "/makenote"){
        makenote_parse(oscMsg.args[0].value);
    }
});

oscPort.open();




let synth = JZZ.synth.Fluid({ path: '/opt/homebrew/bin/fluidsynth', 
                sf: soundfont,
                args: args });
synth
    .program(0,program)
    .noteOn(0, 'C5', 127)
    .wait(500).noteOn(0, 'E5', 127)
    .wait(500).noteOn(0, 'G5', 127)
    .wait(500).noteOff(0, 'C5').noteOff(0, 'E5').noteOff(0, 'G5');
    // .close();


function makenote_parse(stringargs){
    console.log("makenote");
    console.log(stringargs);
    let split = stringargs.split(",");
    console.log(split);
    let channel = split[0];
    let instrument = split[1];
    let pitch = split[2];
    let velocity = split[3];
    let duration = split[4];
    makenote(channel, instrument, pitch, velocity, duration);
}

function makenote(channel, instrument, pitch, velocity, duration){
    console.log("playing note");

    synth.program(channel, instrument)
    .noteOn(channel, pitch, velocity)
    .wait(duration)
    .noteOff(channel,pitch, 0)
}