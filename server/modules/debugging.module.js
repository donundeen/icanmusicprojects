let Debugging = {

    active : false,

    log(text){
        if(!this.active) return;

        console.log(...arguments);
        
    },

    speakerTest(synth){
        if(!this.active) return;

        this.log("speakerTest");
        channel = 1;
        note = 65;
        velocity = 128
        duration = 500
        repeat = 750;

        setInterval(function(){
            this.log("test note");
            synth
            .noteOn(channel, note, velocity)
            .wait(duration)
            .noteOff(channel, note);
        }, repeat);

    }

}

exports.Debugging = Debugging;