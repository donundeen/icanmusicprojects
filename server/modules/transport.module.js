
let Transport = {
    play: false,
    bpm: false,
    beatcount: 0,
    bar: false,
    beat: false,
    interval: false,
    QN: false,
    HN : false,
    WN: false,
    N8: false,
    beatcallback: false,

    bpmToMS(bpm){
        return 60000 / bpm;
    },

    updateBpm(bpm){
        console.log("set bpm " + bpm);
        this.bpm = bpm;
        this.QN = this.bpmToMS(bpm);
        this.HN = this.QN * 2;
        this.WN = this.QN * 4;
        this.N8 = this.QN / 2;
    },

    onbeat(){
        this.bar = Math.floor(this.beatcount / 4) + 1;
        this.beat = (this.beatcount % 4) + 1;
        this.beatcount++;
        if(this.beatcallback){
            this.beatcallback(this.beatcount, this.bar, this.beat, this);
        }else{
            console.log("no callback");
        }
    },

    start(){
        if(!this.interval){
            if(this.QN){
                console.log("Starting " + this.QN);
                this.interval = setInterval((function(){this.onbeat();}).bind(this), this.QN);
            }else{
                console.log("no BPM set");
                console.log(this);
            }
        }
    },

    stop(){
        clearInterval(this.interval);
        this.interval = false;
        this.reset();
    },

    pause(){
        clearInterval(this.interval);
        this.interval = false;
    },    

    reset(){
        this.beatcount = 0;
    },

    setBeatCallback(callback){
        this.beatcallback = callback;
    }
}

exports.Transport = Transport;