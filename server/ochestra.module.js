//orchestra.module.js
// managing the collection of (local?) instruments
const UDPInstrument = require("./udpinstrument.module");


class Orchestra{
    instruments = {};
    channelPool = [0,1,2,3,4,5,6,7,8,9,10];
    synth = false; // fluidsynth object

    getChannel(){
        this.channelPool.shift();
    }

    releaseChannel(channel){
        this.channelPool.unshift(channel);
    }

    parse_osc(address, value){
        /* format:
        /[INSTRNAME|"ALL"]/[propname]
        */
        let matches = address.match(/(\/[^\/]+)\/(\/[^\/]+)/);
        if(matches){
            let instrname = matches[1];
            let propname = matches[2];
            if(instrname.toLowerCase() == "all"){
                this.all_instrument_set_val(propname, value);
            }else{
                this.instrument_set_val(instrname, propname, value);
            }
        }
    }

    instrument(name){
        if(this.instruments[name]){
            return this.instruments[name];
        }
        this.instruments[name] = new UDPInstrument();
        this.instruments[name].device_name = name;
        this.instruments[name].midi_channel = this.getChannel();
        this.instruments[name].synth = this.synth;
        this.instruments[name].start();
        return this.instruments[name];
    }

    destroy_instrument(name){
        this.releaseChannel(this.instruments[name].midi_channel);
        this.instruments[name].stop();
        delete(this.instruments[name]);
    }

    all_instrument_set_val(prop, value){
        this.allInstruments((instr)=>{
            instr[prop] = val;
        });
    }

    instrument_set_val(name, prop, value){
        this.instrument(name)[prop] = value;
    }


    // call a callback function on all instruments.
    allInstruments(callback){
        for (let key in this.instruments) {
            callback(this.instruments[key]);
        }        
    }

    setNotelist(notelist){
        this.all_instrument_set_val("notelist", notelist);
    }
}

module.exports = Orchestra