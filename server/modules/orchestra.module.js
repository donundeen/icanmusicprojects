//orchestra.module.js
// managing the collection of (local?) instruments
const LocalInstrument = require("./localinstrument.module");


class Orchestra{
    localInstruments = {};
    channelPool = [0,1,2,3,4,5,6,7,8,9,10];
    synth = false; // fluidsynth object
    bpm = 120;

    notelist = [];


    // instr, pitch, velocity, duration
    _makenote_callback = false;

    set makenote_callback(callback){
        this._makenote_callback = callback;
        for (let key in this.localInstruments) {
            this.localInstruments[key].makenote_callback = this._makenote_callback;
        }
    }

    set bpm(bpm){
        this.bpm = bpm;
        this.all_instrument_set_val("bpm", this.bpm);
    }

    set synth(synth){
        this.synth = synth;
        this.all_instrument_set_val("bpm", this.synth);
    }

    getChannel(){
        return this.channelPool.shift();
    }

    releaseChannel(channel){
        this.channelPool.unshift(channel);
    }

    instrument(name){
        if(this.localInstruments[name]){
            return this.localInstruments[name];
        }
        return false;
    }

    get_instrument_names(){
        let names = Object.keys(this.localInstruments);
        return Object.keys(this.localInstruments);
    }

    create_local_instrument(name, options){
        if(this.localInstruments[name]){
            return this.localInstruments[name];
        }
        console.log("CREATING INSTRUMENT " + name);
        this.localInstruments[name] = new LocalInstrument();
        this.localInstruments[name].device_name = name;
        this.localInstruments[name].midi_channel = this.getChannel();
        this.localInstruments[name].synth = this.synth;
        this.localInstruments[name].bpm = this.bpm;
        this.localInstruments[name].notelist = this.notelist;
        this.localInstruments[name].start();
        this.localInstruments[name].makenote_callback = this._makenote_callback;       
        return this.localInstruments[name];
    }

    destroy_instrument(name){
        this.releaseChannel(this.localInstruments[name].midi_channel);
        this.localInstruments[name].stop();
        delete(this.localInstruments[name]);
    }

    all_instrument_set_value(prop, value){
        console.log("setting value for " +prop);
        console.log(value);
        if(prop == "notelist"){
            // store it locally for future instruments
            console.log("setting notelist");
            this.notelist = value;
        }
        for (let key in this.localInstruments) {
            this.instrument_set_value(key, prop, value);
        }
    }

    instrument_set_value(name, prop, value){
        console.log("setting instr value" , name, prop, value);
        if(this.localInstruments[name]){
            this.localInstruments[name][prop] = value;
        }
    }


    // call a callback function on all instruments.
    allInstruments(callback){
        for (let key in this.localInstruments) {
            callback(this.localInstruments[key]);
        }        
    }

    setNotelist(notelist){
        this.all_instrument_set_value("notelist", notelist);
    }
}

module.exports = Orchestra