var JZZ = require('jzz');
require('jzz-synth-fluid')(JZZ);

let args = ["a", "coreaudio"];
let program = 22;

///Users/donundeen/Downloads/MuseScore_General.sf2
let soundfont = '/Users/donundeen/Documents/htdocs/icanmusicprojects/server/soundfonts/GeneralUserGS/GeneralUserGS.sf2'
//let soundfont = "/Users/donundeen/Downloads/MuseScore_General.sf2";

console.log("gonna play");

JZZ.synth.Fluid({ path: '/opt/homebrew/bin/fluidsynth', 
                sf: soundfont,
                args: args })
    .program(0,program)
    .noteOn(0, 'C5', 127)
    .wait(500).noteOn(0, 'E5', 127)
    .wait(500).noteOn(0, 'G5', 127)
    .wait(500).noteOff(0, 'C5').noteOff(0, 'E5').noteOff(0, 'G5')
    .close();