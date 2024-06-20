

// midi hardward setup:
let midi_hardware_engine = false;
let use_midi_out = true; // whether or not to send midi values through a hardware output, via easymidi
//let midi_out_portname = "UM-ONE";
let midi_out_portname = "FLUID";
if(use_midi_out){
    const midi = require('midi');
    const easymidi = require('easymidi');
    let midi_outputs = easymidi.getOutputs();
    console.log(midi_outputs);
    let real_portname = false;
    for(let i = 0; i<midi_outputs.length; i++){
        if(midi_outputs[i].includes(midi_out_portname)){
            real_portname = midi_outputs[i];
        }
    }
    console.log("using port " + real_portname);
    if(real_portname){
        midi_hardware_engine = new easymidi.Output(real_portname);  
        midi_hardware_engine.send('reset'); 
    }
}


console.log("all off");