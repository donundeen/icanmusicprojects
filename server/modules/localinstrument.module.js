dynRescale = require("./dynRescale.module");
functionCurve = require("./functionCurve.module");

const LocalInstrument = class{
    /*
    define vars here, like
    foo = "var"; 
    or 
    foo;
    */
    // input values
    _sensor_value = false;;
    changerate = false;
    prevChangeVal = false;


    // note lists
    _notelist = [];
    workinglist = [];
    _device_name = "RENAME_ME";

    // networking info
    _icanmusic_server_ip = "10.0.0.174";
    _icanmusic_port = "7002";

    // midi vars
    _midi_voice = 1;
    _midi_channel = 1;
    _rootMidi = 0;
    _midimin = 32;
    _midimax = 100;

    currentnotes = []; // need to keep track of all playing notes to to a panic stop

    // set fluidSynth object
    synth = false;

    // velocity curve starts as a straight line
    _velocitycurve = new functionCurve([0., 0.0, 0., 1.0, 1.0, 0.0]);
    _changeratecurve = new functionCurve([0., 0.0, 0., 1.0, 1.0, 0.0]);
    // dyn rescaling
    input_scale = new dynRescale();
    changerate_scale = new dynRescale();
    velocity_scale = new dynRescale();

    // timing for different common note values.
    _bpm = 120;

    running = false;

    // vars that might be externally set.
    // we can send this info to a server so it can set up a UI to collect those values
    // maybe array of objects?
    configVars = {};

    constructor(){
        console.log("CONSTRUCTING");
        this.setNoteLengths();
    }

    start(){
        // start the instrument running
        this.running = true;
        this.note_loop();
    }

    stop(){
        // stop the instrument from running
        this.running = false;
    }

    reset(){
        this.input_scale.reset();
        this.velocity_scale.reset();
        this.changerate_scale.reset();
        this._sensor_value = false;
    }

    set velocitycurve(curve){
        this._velocitycurve.curvelist = curve;
    }

    get velocitycurve(){
        return this._velocitycurve;
    }

    set changeratecurve(curve){
        this._changeratecurve.curvelist = curve;
    }
    get changeratecurve(){
        return this._changeratecurve;
    }

    set bpm(bpm){
        this._bpm = bpm;
        this.setNoteLengths();
    }

    get bpm(){
        return this._bpm;
    }

    set sensor_value(value){
        console.log('sensor value is ' + value);
        console.log("********************")
        console.log(typeof(value));
        console.log(value);
        if(typeof value == "number"){
            value = value;
        }else if(Array.isArray(value) && value.length > 0 && Object.hasOwn(value[0], "value")){
            value = value[0].value;
        }else{
            console.log("!!!!!!!!!!!!!! ");
            console.log("don't know what value is " + Array.isArray(value) + " : " + value.length);
        }
        console.log(value);
        console.log("********************");
        this.derive_changerate(this._sensor_value);
        this._sensor_value = value;
    }
    get sensor_value(){
        return this._sensor_value;
    }

    set midi_channel(channel){
        console.log("changing midi channel to " + channel);
        this._midi_channel = channel;
    }
    get midi_channel(){
        return this._midi_channel;
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
        if(this.sensor_value === false){
            setTimeout((function(){
                this.note_loop();
            }).bind(this), 500);            
            return false;
        }
        if(this.running === false){
            setTimeout((function(){
                this.note_loop();
            }).bind(this), 500);              
            return false;
        }
        console.log("sensor value " + this.sensor_value);
        let value        = this.input_scale.scale(this.sensor_value,0,1);
        console.log("scaled value is " + value);
        let midipitch    = this.derive_pitch(value);
        let midivelocity = this.derive_velocity();
        let mididuration = this.derive_duration();
        this.midiMakeNote(midipitch, midivelocity, mididuration);
        setTimeout((function(){
            this.note_loop()
        }).bind(this), mididuration);
    }

    sensor_loop(){
        // process the recieved sensor_value

    }

    derive_changerate(val){
        // derive the changerate
        console.log("getting changerate");
        if(this.prevChangeVal === false){
            this.prevChangeVal = val;
            return 0;
        }
        let ochange = val - this.prevChangeVal;
        ochange = Math.abs(ochange);
        this.changerate = this.changerate_scale.scale(ochange, 0, 1.0);
        this.prevChangeVal = val;
        console.log("changerate " + this.changerate);
        return this.changerate;        
    }

    derive_pitch(val){
        let pitch = this.noteFromFloat(val, this.midimin, this.midimax);
        return pitch;
    }

    derive_velocity(){
        let velocity = Math.floor(127.0 * this.velocitycurve.mapvalue(this.changerate));
        return velocity;
    }

    derive_duration(){
        return this.N16; 
    }
    // handle the setting of config vars with class getters and setters?

    ////////////////////////
    // MIDI FUNCTIONS
    midi_setup(){

    }

    midiMakeNote(pitch, velocity, duration){
        // note: each instrument needs its own channel, or the instrument will be the same tone.
        console.log(pitch + " : " + velocity + " : " + duration);
        if(!Number.isFinite(pitch) || !Number.isFinite(velocity) || !Number.isFinite(duration)){
            console.log("bad midi values, returning");
//            return;
        }
        if(velocity == 0){
            console.log("no volume, no note");
            //return;
        }
        this.synth
        .noteOn(this.midi_channel, pitch, velocity)
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
        this._notelist = notelist;
    }
    get notelist(){
        return this._notelist;
    }

    set rootMidi(root){
        this._rootMidi = root;
    }
    get rootMidi(){
        return this._rootMidi;
    }

    set midimax(max){
        this._midimax = max;
    }

    get midimax(){
        return this._midimax;
    }


    set midimin(min){
        this._midimin = min;
    }

    get midimin(){
        return this._midimin;
    }

    noteFromFloat(value, min, max){
        console.log("note from float " + value);
        this.makeWorkingList(min, max);
        //Serial.print("note from value ");
        //Serial.println(value);
        //Serial.println(workinglistlength);
        let index = Math.floor(this.workinglist.length * value);
        if(index == this.workinglist.length){
            index = this.workinglist.length -1;
        }
        console.log(index);
        //Serial.println(index);
        let note  = this.workinglist[index];// % workingList.length]
        console.log("returning note " + note);
        //Serial.println(note);
        return note;
    }

    fixedNoteFromFloat(value){
        // in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale
        // - map the float across FULL range, from min to max
        // - move resulting value DOWN to the closest note in the scale
        this.makeworkinglist(min, max);
        let range = max - min;
        let initial = min + Math.floor(range * value);
        while(indexOf(initial, workinglist) < 0){
            initial--;
        }
        return initial;
    }

    getRootedBestNoteFromFlat(value, min, max){
        // for a "rooted" scale/chord, expand the min and max so that both min and max are the root
        min = moveMinMax(this.rootMidi, min);
        max = moveMinMax(this.rootMidi, max);

        let note = noteFromFloat(value, min, max);
        if(!note){
            return false;
        }
        return note;
    }


    moveMinMax(root, minmax){
        // for a "rooted" scale/chord, expand the min and max so that both min and max are the root
        //		maxApi.post("getChordNoteFromFloat "+labelid + ", " + value);
        //		maxApi.post(chordNoteSetMidi);
        let orig = minmax;
        let mindiff = (minmax % 12) - (root % 12);
        let minmove = abs(6 - mindiff);

        if(mindiff == 0){
            // do nothing
        }
        else if (mindiff < -6){
            mindiff = -12 - mindiff;
            minmax = minmax - mindiff;
            //big distance, go opposite way around
        }
        else if (mindiff < 0){
            // small different, go toward
            minmax = minmax - mindiff;
        }
        else if(mindiff < 6){
            minmax = minmax - mindiff;
        }
        else if (mindiff < 12){
            mindiff = 12 - mindiff;
            minmax = minmax + mindiff;
        }
        return minmax;
    }

    // Make a new array that's a subset of the notelist, with min and max values
    makeWorkingList(min, max){
        let wi = -1;
        this.workinglist = [];
        for(let i = 0; i < this.notelist.length; i ++){
          if(this.notelist[i] >= min && this.notelist[i] <= max){
            wi++;
            this.workinglist[wi] = this.notelist[i];
          }
        }
    }
}

module.exports = LocalInstrument;