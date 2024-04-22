/*
const UDPInstrument = require("./modules/udpinstrument.module");

inst1 = new UDPInstrument(1,2);
inst2 = new UDPInstrument(3,4);
*/

var JZZ = require('jzz');
require('jzz-synth-fluid')(JZZ);

let program = 22;


let args = ["a", "coreaudio"];
///Users/donundeen/Downloads/MuseScore_General.sf2
//let soundfont = '/Users/donundeen/Documents/htdocs/icanmusicprojects/server/soundfonts/GeneralUserGS/GeneralUserGS.sf2'
let soundfont = './soundfonts/GeneralUserGS/GeneralUserGS.sf2'
//let soundfont = "/Users/donundeen/Downloads/MuseScore_General.sf2";
let synth = JZZ.synth.Fluid({ path: '/opt/homebrew/bin/fluidsynth', 
                sf: soundfont,
                args: args });
      




/*
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
*/


console.log("gonna play");
          
synth
    .program(1,program)
    .noteOn(1, 'B5', 127)
    .wait(1000).noteOn(1, 'D5', 127)
    .wait(1000).noteOn(1, 'F5', 127)
    .wait(1000).noteOff(1, 'B5').noteOff(1, 'D5').noteOff(1, 'F5');

synth
    .program(0,13)
    .noteOn(0, 'C5', 127)
    .wait(100).noteOn(0, 'E5', 127)
    .wait(100).noteOn(0, 'G5', 127)
    .wait(100).noteOff(0, 'C5').noteOff(0, 'E5').noteOff(0, 'G5');

console.log("played");
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