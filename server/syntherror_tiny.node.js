
var JZZ = require('jzz');
const WAAPI = require('node-web-audio-api');
require('jzz-synth-tiny')(JZZ);
global.window = { AudioContext: WAAPI.AudioContext };

/*
JZZ.synth.Tiny()
  .or(function() { console.log('Cannot open MIDI-Out!\n' + this.err() ); })
  .note(0, 'C5', 127, 500).wait(500)
  .note(0, 'E5', 127, 500).wait(500)
  .note(0, 'G5', 127, 500).wait(500)
  .note(9, 'C6', 127, 500).wait(500)
  .and(function() { JZZ.lib.closeAudioContext(); });

  */

//require('jzz-synth-fluid')(JZZ);

let numnotes = 100; // make this number larger for more notes at once (a cluster of notes)
let interval = 200; // how often (in milliseconds) to play each "cluster"


/*
let env = "mac"; // or "rpi"

let soundfont = './soundfonts/GeneralUserGS/GeneralUserGS.sf2'
let fluidpath = '/usr/bin/fluidsynth';
let arg_a = "pulseaudio";
let args = ["a", arg_a];
if(env == "mac"){
    fluidpath = '/opt/homebrew/bin/fluidsynth';
    soundfont = '/Users/donundeen/Documents/htdocs/icanmusicprojects/server/soundfonts/GeneralUserGS/GeneralUserGS.sf2'
    arg_a = "coreaudio";
//    args = ["a "+ arg_a, "m coremidi"];
    args = ["-d"];
}
let synth = JZZ.synth.Fluid({ path: fluidpath, 
                sf: soundfont,
                args: args }).or(function(){console.log("some problem starting!")});
*/

let synth = JZZ.synth.Tiny();

setInterval(function(){
    play_notes(numnotes);   
}, interval);

let global_count = 0;
let bad_tiny_voices = [6,7,8,22,23,24,40,41,42,43,44,55,56,57,59,60,61,62,63,64,65,66,67,68,69,71,72, 84, 90, 105,110,118,119,120,121,122,123,124,125,126,127];
let tiny_voices = [];
for(let i = 0; i<=127;i++){
    if(!bad_tiny_voices.includes(i)){
        tiny_voices.push(i);
    }
}
function play_notes(numnotes){
    console.log("playnotes");
    let i = 0;
    while(i < numnotes){
        global_count++;
        console.log(global_count+ "********************************************** " + global_count);
        let note = Math.floor(Math.random() * 127);
        let velocity = Math.floor(Math.random() * 70)+ 50;
        let voice = Math.floor(Math.random() * 100);
        //voice = global_count % 10 + 120;
        voice = tiny_voices[Math.floor(Math.random() * tiny_voices.length)];  
        let duration = Math.floor(Math.random() * 200) + 25;
        let channel = Math.floor(Math.random() * 10);
        makenote(channel, voice, note, velocity, duration );
       // makenote(channel, 62, note, velocity, duration );
        i++;
    }
}

function makenote(channel, instrument, pitch, velocity, duration){
    console.log("playing note "+ channel + ", "+instrument+"," + pitch +","+velocity+","+duration);
    synth.program(channel, instrument)
    .noteOn(channel, pitch, velocity)
    .wait(duration)
    .noteOff(channel,pitch).or(function(msg){
        console.log("some problem! " + msg); // this never is printed
    });
}

