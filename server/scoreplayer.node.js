/*
testing a system for playing a score in time.
to become a reusable library later
*/
const fs = require('node:fs');


let bpm = 240;
// defining some note lengths
let scorename = "simplescore.txt";


function bpmToMS(bpm){
    return 60000 / bpm;
}

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

    updateBpm(bpm){
        console.log("set bpm " + bpm);
        this.bpm = bpm;
        this.QN = bpmToMS(bpm);
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
        if(this.QN){
            console.log("Starting " + this.QN);
            this.interval = setInterval((function(){this.onbeat();}).bind(this), this.QN);
        }else{
            console.log("no BPM set");
            console.log(this);
        }
    },

    stop(){
        clearInterval(this.interval);
        this.interval = false;
    },

    setBeatCallback(callback){
        this.beatcallback = callback;
    }
}

let scoreReader = {
    scoreFilename : false,
    parsedScore: false,
    scoreText : false,
    foo: "bar",

    openscore(callback){
        let self = this;
            fs.readFile(self.scoreFilename, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                self.scoreText = data;
                if(callback){
                    callback();
                }
            });
    },

    onbeat(beatcount, bar, beat, transport){
        console.log("score beat");
        console.log(beatcount + ": " + bar + ":" + beat);
        console.log(this.scoreText);
        let rstring = "(^|\r|\n|\r\n)"+bar+":"+beat+" (.*)($|\r|\n|\r\n)";
//        console.log(rstring);
        let regex = new RegExp(rstring, "g");
        let matches =  [...this.scoreText.matchAll(regex)];
        console.log(matches);
    }

}

console.log("starting");


trans = Object.create(Transport);
trans.updateBpm(bpm);
score = Object.create(scoreReader);
score.scoreFilename = scorename;

console.log("OPENED" + score.scoreText);

trans.setBeatCallback(function(beatcount, bar, beat, transport){
    score.onbeat(beatcount, bar, beat, transport)
});


score.openscore(function(){trans.start();});


/*
trans.setBeatCallback(function(beatcount, bar, beat, transport){
    console.log(beatcount + ": " + bar + ":" + beat);
});
*/



