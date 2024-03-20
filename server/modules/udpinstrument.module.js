dynRescale = require("./dynRescale.module");

const UDPInstrument = class{
    /*
    define vars here, like
    foo = "var"; 
    or 
    foo;
    */
    // input values
    sensor_value = false;;
    changerate = false;
    prefChangeVal = false;


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

    currentnotes = []; // need to keep track of all playing notes to to a panic stop

    // set fluidSynth object
    synth = false;

    // velocity curve starts as a straight line
    velocitycurve = new functionCurve([0., 0.0, 0., 1.0, 1.0, 0.0]);
    changeratecurve = new functionCurve([0., 0.0, 0., 1.0, 1.0, 0.0]);
    // dyn rescaling
    input_scale = new dynRescale();
    changerate_scale = new dynRescale();

    // timing for different common note values.
    bpm = 120;

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
        this.note_loop();
    }

    stop(){
        // stop the instrument from running
        this.running = false;
    }

    reset(){
        this.velocity_scale.reset();
        this.changerate_scale.reset();
        this.sensor_value = false;
    }

    set velocitycurve(curve){
        this.velocitycurve.curvelist = curve;
    }

    set changeratecurve(curve){
        this.changeratecurve.curvelist = curve;
    }

    set bpm(bpm){
        this.bpm = bpm;
        this.setNoteLengths();
    }

    set sensor_value(value){
        this.sensor_value = value;
        thie.derive_changerate();
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
        let value = this.input_scale(this.sensor_value);
        let midipitch = this.derive_pitch(value);
        let midivelocity = this.derive_velocity();
        let mididuration = this.derive_duration();
        this.midiMakeNote(midipith, midivelocity, mididuration);
        setTimeout((function(){
            this.note_loop()
        }).bind(this), mididuration);
    }

    sensor_loop(){
        // process the recieved sensor_value

    }

    derive_changerate(){
        // derive the changerate
        if(this.prevChangeVal === false){
            this.prevChangeVal = val;
            return 0;
        }
        let ochange = val - this.prevChangeVal;
        ochange = Math.abs(ochange);
        this.changerate = this.changerate_scale.scale(ochange, 0, 1.0);
        this.prevChangeVal = val;
        return this.changerate;        
    }

    derive_pitch(val){
        let pitch = this.noteFromFloat(val, this.midimin, this.midimax);
        return pitch;
    }

    derive_velocity(){
        let velocity = Math.floor(127.0 * this.velocitycurve(changerate));
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

    set rootMidi(root){
        this.rootMidi = root;
    }

    set midimax(max){
        this.midimax = max;
    }

    set midimin(min){
        this.midimin = min;
    }

    noteFromFloat(value, min, max){
        this.makeworkinglist(min, max);
        //Serial.print("note from value ");
        //Serial.println(value);
        //Serial.println(workinglistlength);
        let index = floor(this.workinglist.length * value);
        //Serial.println(index);
        let note  = this.workinglist[index];// % workingList.length]
        //Serial.println(note);
        return note;
    }

    fixedNoteFromFloat(value){
        // in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale
        // - map the float across FULL range, from min to max
        // - move resulting value DOWN to the closest note in the scale
        this.makeworkinglist(min, max);
        let range = max - min;
        let initial = min + floor(range * value);
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
        for(i = 0; i < this.notelist.length; i ++){
          if(this.notelist[i] >= min && this.notelist[i] <= max){
            wi++;
            workinglist[wi] = notelist[i];
          }
        }
    }
}

module.exports = UDPInstrument;