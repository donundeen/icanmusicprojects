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

    // velocity curve starts as a straight line
    velocitycurve = [0., 0.0, 0., 1.0, 1.0, 0.0]
    
    // timing for different common note values.
    bpm = 120;


    // dyn rescaling
    volume_scale;
    changerate_scale;

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

    }

    midiSetInstrument(instr){

    }

    midiNoteOn(channel, pitch, velocity){

    }

    midiNoteOff(channel, pitch){

    }
    // END MIDI FUNCTIONS
    ////////////////////////

    ////////////////////////
    // MUSIC FUNCTIONS
    setNotelist(notelist){

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