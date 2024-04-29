/*
const UDPInstrument = require("./modules/udpinstrument.module");

inst1 = new UDPInstrument(1,2);
inst2 = new UDPInstrument(3,4);
*/

var JZZ = require('jzz');
require('jzz-synth-fluid')(JZZ);

let env = "rpi"; // or "mac"


///Users/donundeen/Downloads/MuseScore_General.sf2
//let soundfont = '/Users/donundeen/Documents/htdocs/icanmusicprojects/server/soundfonts/GeneralUserGS/GeneralUserGS.sf2'
let soundfont = './soundfonts/GeneralUserGS/GeneralUserGS.sf2'
//let fluidpath = '/opt/homebrew/bin/fluidsynth';
let fluidpath = '/usr/bin/fluidsynth';
let arg_a = "pulseaudio";
let args = ["a", arg_a];
if(env == "mac"){
    fluidpath = '/opt/homebrew/bin/fluidsynth';
    soundfont = '/Users/donundeen/Documents/htdocs/icanmusicprojects/server/soundfonts/GeneralUserGS/GeneralUserGS.sf2'
    arg_a = "coreaudio";
    args = ["a", arg_a];
}


ch1 = 0;
ch2 = 1;

v1 = 22;
v2 = 12;

let numnotes = 10; 
let interval = 10;

/* chokes out after:
80 : 6 or 6
100 : 4 (6 if I don't change channel/voice)
*/

//let soundfont = "/Users/donundeen/Downloads/MuseScore_General.sf2";
let synth = JZZ.synth.Fluid({ path: fluidpath, 
                sf: soundfont,
                args: args }).or(function(){console.log("some problem starting!")});
      
synth.reset();
synth.allNotesOff(ch1);
synth.allNotesOff(ch2);
synth.resetAllControllers(ch1);
synth.resetAllControllers(ch2);




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

setInterval(function(){
    
    if(global_count >= 300){
        console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^RESET^^^^^^^^^^^^^")
        synth.reset();
        
        synth.stop();
        synth.close();
/*
        synth = JZZ.synth.Fluid({ path: fluidpath, 
            sf: soundfont,
            args: args });
        global_count = 0;
        */
    } 
    play_notes(numnotes);

       
}, interval);

/*
synth
    .program(ch1, v1)
    .noteOn(ch1, 'B5', 127)
    .wait(1000).noteOn(ch1, 'D5', 127)
    .wait(1000).noteOn(ch1, 'F5', 127)
    .wait(1000).noteOff(ch1, 'B5').noteOff(ch1, 'D5').noteOff(ch1, 'F5');

synth
    .program(ch2,v2)
    .noteOn(ch2, 'C5', 127)
    .wait(100).noteOn(ch2, 'E5', 127)
    .wait(100).noteOn(ch2, 'G5', 127)
    .wait(100).noteOff(ch2, 'C5').noteOff(ch2, 'E5').noteOff(ch2, 'G5');
*/
//console.log("played");
    // .close();

let global_count = 0;
function play_notes(numnotes){
    console.log("playnotes");
    let i = 0;
    while(i < numnotes){
        global_count++;
        console.log(global_count+ "********************************************** " + global_count);
        let note = Math.floor(Math.random() * 127);
        let velocity = Math.floor(Math.random() * 70)+ 50;
        let voice = Math.floor(Math.random() * 100);
        let duration = Math.floor(Math.random() * 200) + 25;
        let channel = Math.floor(Math.random() * 10);
        makenote(channel, voice, note, velocity, duration );
        i++;
    }
}


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
    console.log("playing note "+ channel + ", " + pitch +","+velocity+","+duration);

    synth.program(channel, instrument)
    .noteOn(channel, pitch, velocity)
    .wait(duration)
    .noteOff(channel,pitch).or(function(msg){
        console.log("some problem! " + msg);
    });
}