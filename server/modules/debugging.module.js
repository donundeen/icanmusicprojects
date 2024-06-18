let Debugging = {

    active : false,

    log(text){
        if(!this.active){ return};

        console.log(...arguments);
        
    },

    testSynth(synth, bluetooth){
        if(!this.active){ return};

        this.bluetoothTest(bluetooth);

        this.log("speakerTest");
        let channel = 1;
        let note = 65;
        let velocity = 127
        let duration = 500
        let repeat = 750;

        let self = this;

        setInterval(function(){
            self.log("test note");
            synth
            .noteOn(channel, note, velocity)
            .wait(duration)
            .noteOff(channel, note);
        }, repeat);

    },

    bluetoothTest(bluetooth){
        bluetooth.test();


    }

}

exports.Debugging = Debugging;