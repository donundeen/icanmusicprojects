//orchestra.module.js
// managing the collection of (local?) instruments
const LocalInstrument = require("./localinstrument.module");
const UDPInstrument = require("./udpinstrument.module");


class Orchestra{
    localInstruments = {};
    udpInstruments = {};
    allChannels =  [0,1,2,3,4,5,6,7,8,9,10];
    channelPool = [0,1,2,3,4,5,6,7,8,9,10];
    _synth = false; // fluidsynth object
    _midi_hardware_engine = false; // easymidi object
    bpm = 120;

    notelist = [];


    // instr, pitch, velocity, duration
    _makenote_callback = false;

    set makenote_callback(callback){
        console.log("set makenote callback")
        this._makenote_callback = callback;
        for (let key in this.localInstruments) {
            this.localInstruments[key].makenote_callback = this._makenote_callback;
        }
        for (let key in this.udpInstruments) {
            this.udpInstruments[key].makenote_callback = this._makenote_callback;
        }
    }

    set bpm(bpm){
        this.bpm = bpm;
        this.all_local_instrument_set_value("bpm", this.bpm);
        this.all_udp_instrument_set_value("bpm", this.bpm);
    }

    set synth(synth){
        this._synth = synth;
        this.all_local_instrument_set_value("synth", this._synth);
        this.all_udp_instrument_set_value("synth", this._synth);
    }

    set midi_hardware_engine(engine){
        this._midi_hardware_engine = engine;
        this.all_local_instrument_set_value("midi_hardware_engine", this._midi_hardware_engine);
        this.all_udp_instrument_set_value("midi_hardware_engine", this._midi_hardware_engine);
    }

    getChannel(){
        if(this.channelPool.length == 0){
            this.channelPool = this.allChannels;
        }
        return this.channelPool.shift();
    }

    releaseChannel(channel){
        this.channelPool.unshift(channel);
    }

    local_instrument(name){
        if(this.localInstruments[name]){
            return this.localInstruments[name];
        }
        return false;
    }

    udp_instrument(name){
        if(this.udpInstruments[name]){
            return this.udpInstruments[name];
        }
        return false;
    }    

    get_local_instrument_names(){
        let names = Object.keys(this.localInstruments);
        return Object.keys(this.localInstruments);
    }

    get_udp_instrument_names(){
        let names = Object.keys(this.udpInstruments);
        return Object.keys(this.udpInstruments);
    }    

    create_local_instrument(name, options){
        if(this.localInstruments[name]){
            return this.localInstruments[name];
        }
        console.log("CREATING INSTRUMENT " + name);
        this.localInstruments[name] = new LocalInstrument();
        this.localInstruments[name].device_name = name;
        this.localInstruments[name].midi_channel = this.getChannel();
        this.localInstruments[name].synth = this._synth;
        this.localInstruments[name].midi_hardware_engine = this._midi_hardware_engine;
        this.localInstruments[name].bpm = this.bpm;
        this.localInstruments[name].notelist = this.notelist;
        this.localInstruments[name].start();
        this.localInstruments[name].makenote_callback = this._makenote_callback;       
        return this.localInstruments[name];
    }

    create_udp_instrument(name, options){
        if(this.udpInstruments[name]){
            return this.udpInstruments[name];
        }
        console.log("CREATING INSTRUMENT " + name);
        this.udpInstruments[name] = new UDPInstrument();
        this.udpInstruments[name].device_name = name;
        this.udpInstruments[name].midi_channel = this.getChannel();
        this.udpInstruments[name].synth = this._synth;
        this.udpInstruments[name].midi_hardware_engine = this._midi_hardware_engine;
        this.udpInstruments[name].bpm = this.bpm;
        this.udpInstruments[name].notelist = this.notelist;
        this.udpInstruments[name].makenote_callback = this._makenote_callback;
        // set the device voice number from a list of name=>voice mappings (sort of a hack here)
        if(this.synthDeviceVoices[name]){
            this.udpInstruments[name].midi_voice = this.synthDeviceVoices[name];
        }else{
            this.udpInstruments[name].midi_voice = 1;

        }
        return this.udpInstruments[name];
    }

    destroy_local_instrument(name){
        this.releaseChannel(this.localInstruments[name].midi_channel);
        this.localInstruments[name].stop();
        delete(this.localInstruments[name]);
    }


    destroy_udp_instrument(name){
        this.udpInstruments[name].stop();
        delete(this.udpInstruments[name]);
    }    

    // send a makenote message from some external source (ie webpage, or networked device) to an instrument
    local_makenote(name, pitch, velocity, duration){
        if(this.localInstruments[name]){
            this.localInstruments[name].midiMakeNote(pitch, velocity, duration);
        }
    }

    has_udp_instrument(name){
        if(this.udpInstruments[name]){
            return true;
        }
        return false;
    }

    udp_makenote(name, pitch, velocity, duration){
        if(this.udpInstruments[name]){
            this.udpInstruments[name].midiMakeNote(pitch, velocity, duration);
        }else{
            console.log("no instrument " + name);
        }
    }
    all_local_instrument_set_value(prop, value){
        console.log("setting value for " +prop);
        console.log(value);
        if(prop == "notelist"){
            // store it locally for future instruments
            console.log("setting notelist");
            this.notelist = value;
        }
        for (let key in this.localInstruments) {
            this.local_instrument_set_value(key, prop, value);
        }
    }

    all_udp_instrument_set_value(prop, value){
        console.log("setting value for " +prop);
        console.log(value);
        if(prop == "notelist"){
            // store it locally for future instruments
            console.log("setting notelist");
            this.notelist = value;
        }
        for (let key in this.udpInstruments) {
            this.udp_instrument_set_value(key, prop, value);
        }
    }    

    local_instrument_set_value(name, prop, value){
        console.log("setting instr value" , name, prop, value);
        if(this.localInstruments[name]){
            this.localInstruments[name][prop] = value;
        }
    }

    udp_instrument_set_value(name, prop, value){
        console.log("setting udp instr value" , name, prop, value);
        console.log("value is " + value);
        if(this.udpInstruments[name]){
            this.udpInstruments[name][prop] = value;
        }
    }    

    // call a callback function on all instruments.
    allLocalInstruments(callback){
        for (let key in this.localInstruments) {
            callback(this.localInstruments[key]);
        }        
    }

    // call a callback function on all instruments.
    allUDPInstruments(callback){
        for (let key in this.udpInstruments) {
            callback(this.udpInstruments[key]);
        }        
    }    

    setNotelist(notelist){
        this.all_local_instrument_set_value("notelist", notelist);
        this.all_udp_instrument_set_value("notelist", notelist);

    }
}

module.exports = Orchestra