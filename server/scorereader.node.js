const fs = require('node:fs');

let ScoreReader = {
    scoreFilename : false,
    parsedScore: false,
    scoreText : false,
    messageCallback: false,

    foo: "bar",

    setMessageCallback(callback){
        this.messageCallback = callback;
    },

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
//        console.log("score beat");
        console.log(beatcount + ": " + bar + ":" + beat);
//        console.log(this.scoreText);
        let rstring = "(^|\r|\n|\r\n)"+bar+":"+beat+" (.*)($|\r|\n|\r\n)";
//        console.log(rstring);
        let regex = new RegExp(rstring, "g");
        let matches =  [...this.scoreText.matchAll(regex)];
//        console.log(matches);
        for(match of matches){
            let msg = match[2];
            console.log(match[2]);
            let splits = msg.split(" ");
            for (split of splits){
                this.processMessage(split, transport);
            }
        }
    },

    processMessage(msg, transport){
        if(msg == "tostart"){
            transport.reset();
        }else if(this.messageCallback){
            this.messageCallback(msg, transport);
        }

    }

}

exports.ScoreReader = ScoreReader;