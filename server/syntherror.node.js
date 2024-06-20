
var JZZ = require('jzz');
require('jzz-synth-fluid')(JZZ);

let resetAt = 100;

let env = "rpi"; // or "rpi" or "mac"

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
let interval = 500; // how often (in milliseconds) to play each "cluster"
let synth = JZZ.synth.Fluid({ path: fluidpath, 
                sf: soundfont,
                args: args }).or(function(){console.log("some problem starting!")});

setInterval(function(){
    play_notes(numnotes);   
}, interval);

let global_count = 0;
let reset_count = 0;
function play_notes(numnotes){
//    console.log("playnotes");
    let i = 0;
    while(i < numnotes){
        global_count++;
        reset_count++;
    //    console.log(global_count +":" +reset_count +" ********************************************** " + global_count);
        let note = Math.floor(Math.random() * 127);
        let velocity = Math.floor(Math.random() * 70)+ 50;
        let voice = Math.floor(Math.random() * 100);
        let duration = Math.floor(Math.random() * 2) + 100;
        let channel = Math.floor(Math.random() * 2);
        makenote(channel, voice, note, velocity, duration );

        if(reset_count > resetAt){
            reset_count = 0;
            resetAttempt();
        }

        i++;
    }
}

function resetAttempt(){
    console.log("resetAttempt");

    let formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;

    let memoryData = process.memoryUsage();
    
    let memoryUsage = {
      rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
      heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
      heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
      external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
    };
    
    console.log(memoryUsage);    
  //  synth.reset();
}


function makenote(channel, instrument, pitch, velocity, duration){
 //   console.log("playing note "+ channel + ", " + pitch +","+velocity+","+duration);
    synth.program(channel, instrument)
    .noteOn(channel, pitch, velocity)
    .wait(duration)
    .noteOff(channel,pitch).or(function(msg){
        console.log("some problem! " + msg); // this never is printed
    });
}