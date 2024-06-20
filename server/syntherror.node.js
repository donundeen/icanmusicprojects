
var JZZ = require('jzz');
require('jzz-synth-fluid')(JZZ);

let resetAt = 300;

let env = "rpi"; // or "rpi"

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

let numnotes = 10; // make this number larger for more notes at once (a cluster of notes)
let interval = 200; // how often (in milliseconds) to play each "cluster"
let synth = JZZ.synth.Fluid({ path: fluidpath, 
                sf: soundfont,
                args: args }).or(function(){console.log("some problem starting!")});

setInterval(function(){
    play_notes(numnotes);   
}, interval);

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
        let duration = Math.floor(Math.random() * 2) + 25;
        let channel = Math.floor(Math.random() * 2);
        makenote(channel, voice, note, velocity, duration );

        if(global_count > resetAt){
            global_count = 0;
            resetAttempt();
        }

        i++;
    }
}

function resetAttempt(){
    console.log("resetAttempt");
    synth.reset();
}


function makenote(channel, instrument, pitch, velocity, duration){
    console.log("playing note "+ channel + ", " + pitch +","+velocity+","+duration);
    synth//.program(channel, instrument)
    .noteOn(channel, pitch, velocity)
    .wait(duration)
    .noteOff(channel,pitch).or(function(msg){
        console.log("some problem! " + msg); // this never is printed
    });
}