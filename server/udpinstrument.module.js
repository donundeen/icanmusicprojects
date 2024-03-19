dynRescale = require("./dynRescale.module");

const UDPInstrument = class{
    /*
    define vars here, like
    foo = "var"; 
    or 
    foo;
    */

    // note lists
    notelist = [];
    workinglist = [];
    device_name = "RENAME_ME";

    // networking info
    icanmusic_server_ip = "10.0.0.174";
    icanmusic_port = "7002";

    // midi vars
    midi_voice = 1;
    midi_channel = 0;
    rootMidi = 0;
    midimin = 32;
    midimax = 100;

    // set fluidSynth object
    synth = false;

    // velocity curve starts as a straight line
    velocitycurve = [0., 0.0, 0., 1.0, 1.0, 0.0]
    
    // timing for different common note values.
    bpm = 120;


    // dyn rescaling
    volume_scale = new dynRescale();
    changerate_scale = new dynRescale();

    // input values
    input_val;
    changerate;

    running = false;

    // vars that might be externally set.
    // we can send this info to a server so it can set up a UI to collect those values
    // maybe array of objects?
    configVars = {};


    constructor(){
        this.setNoteLengths();
    }

    run(){
        // start the instrument running
        this.running = true;
    }

    stop(){
        // stop the instrument from running
        this.running = false;
    }

    set bpm(bpm){
        this.bpm = bpm;
        this.setNoteLengths();
    }
    setNoteLengths(){
        // set note constant lengths, depending on bpms
        this.QN = this.bpmToMS();
        this.WN = this.QN * 4;
        this.HN = this.QN * 2;
        this.QN = this.QN;
        this.N8 = this.QN / 2;
        this.N16 = this.QN / 4;
        this.QN3 = this.HN / 3;
        this.HN3 = this.WN / 3;
        this.N83 = this.QN / 3;
    }

    bpmToMS(){
        // how many ms is a quarter note?
        return 60000 / this.bpm;
    }
 
    note_loop(){
        // process the input and send a note
    }

    sensor_loop(){
        // process the recieved input_val
    }

    get_changerate(){
        // derive the changerate
    }

    derive_pitch(){

    }

    derive_velocity(){

    }

    derive_duration(){

    }

    setup_osc(OSCObj){
        // setup the osc message receive stuff
    }


    routeDeviceMsg(address, msg){

    }

    routeConfigVal(address, msg){

    }
    // handle the setting of config vars with class getters and setters?

    ////////////////////////
    // MIDI FUNCTIONS
    midi_setup(){

    }

    midiMakeNote(pitch, velocity, duration){
        // note: each instrument needs its own channel, or the instrument will be the same tone.
        this.synth
        .noteOn(this.midi_channel, pitch, velocit)
        .wait(duration)
        .noteOff(this.midi_channel, pitch);
    }

    midiSetInstrument(instr){
        this.midi_voice = instr;
        this.synth
        .program(this.midi_channel, this.midi_voice)        
    }

    // we might care about this, for mono things
    midiNoteOn(channel, pitch, velocity){
        this.synth
        .noteOn(this.midi_channel, pitch, velocit)
    }

    midiNoteOff(channel, pitch){
        this.synth
        .noteOff(this.midi_channel, pitch);

    }
    // END MIDI FUNCTIONS
    ////////////////////////

    ////////////////////////
    // MUSIC FUNCTIONS
    set notelist(notelist){
        this.notelist = notelist;
    }

    setRoot(root){

    }

    noteFromFloat(value, min, max){

    }

    fixedNoteFromFloat(value){

    }

    getRootedBestNoteFromFlat(value){
    }

    moveMinMax(root, minmax){

    }

    // Make a new array that's a subset of the notelist, with min and max values
    makeWorkingList(min, max){

    }




}

module.exports = UDPInstrument;