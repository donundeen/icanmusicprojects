const teoria = require("teoria");
const teoriaChordProgression = require('teoria-chord-progression');



    /*

    How to use this:
    interface to teoria : https://www.npmjs.com/package/teoria

    // set the harmonid structure:
    set [labelid] [command]
    - [labelid] - the output will be preceded with this value, so you can route it out 
    - [command] - one of a variety of setter commands:

    setter commands:
    -  /^[a-gA-G][b#]?[0-9]?$/ : eg Ab, G, C#3 - Sets the root note. will adjust the scale and chord root if they are currently set

    - [Any of the list of KNOWN_SCALES]: sets the Scale used

    - [+-][INTERVAL_VALUES] : transpose by some interval. 

    - [0-7].[34] : set the chord based on the diatonic position in the set scale. 3 or 4 for 3 or 4-note chords

    // get notes
    get [labelid] [command]

    getter commands
    - s0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the scale note at the position in the scale represented by the float, between the Min and Max MIDI values
    - c0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the chord note at the position in the scale represented by the float, between the Min and Max MIDI values
    - s[0-9]+(min-Max) : get the note at that index in the list of scale notes, btw Min and Max. Loops around to bottom.
    - c[0-9]+(min-Max) : get the note at that index in the list of chord notes, btw Min and Max. Loops around to bottom.

    KNOWN_SCALES:
    major
    minor
    ionian (Alias for major)
    dorian
    phrygian
    lydian
    mixolydian
    aeolian (Alias for minor)
    locrian
    majorpentatonic
    minorpentatonic
    chromatic
    harmonicchromatic (Alias for chromatic)
    blues
    doubleharmonic
    flamenco
    harmonicminor
    melodicminor
    wholetone

    INTERVAL_VALUES
    examples:
    m3 (minor third)
    P5 (perfect fifth)
    M3 (major third)
    [will need to experiment to find more]

    */


let TheoryEngine = {


    notes : [
    "C",	//0  
    "Db",	//1	
    "D",	//2
    "Eb",	//3
    "E",	//4
    "F",	//5
    "Gb",	//6
    "G",	//7
    "Ab",	//8
    "A",	//9
    "Bb",	//10
    "B",	//11
    ],

    currentNotelist : [43, 47, 49],

    curNote : false,
    curScale : false,
    curScaleName : false,

    curRootMidi :0,

    curChord : false,
    curChordName : false,

    scaleNoteSet : false,
    scaleNoteSetMidi : false,
    weightedScaleNoteSet : false,
    weightedScaleNoteSetMidi : false,
    chordNoteSet : false,
    chordNoteSetMidi : false,

    // some system might not want to think about the difference between "chords" and "scales" as teoria defines them. He're we'll just store whichever was the MOST RECENT note set created, either scale or chord.
    curBestSetChordOrScale : false,
    curBestSetName : false,
    bestNoteSet : false,
    bestNoteSetMidi : false,

    outputCallback : false,
    midiListCallback : false,

    debugmode : false,

    setOutputCallback(callback){
        this.outputCallback = callback;
    },

    sendOutput(msg){
        if(this.outputCallback){
            this.outputCallback(msg);
        }
    },  

    setMidiListCallback(callback){
        this.midiListCallback = callback;
    },

    sendBestMidiList(list){
        this.midiListCallback(list);
    },

    bestSetIsChord(){
        this.bestNoteSet = this.chordNoteSet;
        this.bestNoteSetMidi = this.chordNoteSetMidi;
        this.curBestSetName = this.curChordName;
        this.getBestNoteMidiList();
    },

    bestSetIsScale(){
        this.bestNoteSet = this.scaleNoteSet;
        this.bestNoteSetMidi = this.scaleNoteSetMidi;
        this.curBestSetName = this.curScaleName;
        this.getBestNoteMidiList();
    },

    debugmsg(msg){
        if(this.debugmode){
            console.log(msg);
        }
    },

    getKnownScales(){
        return teoria.Scale.KNOWN_SCALES;
    },

    // setter commands
    runSetter(command, labelid){
        // if there's spaces, split and run each one
        command = command.trim();
        if(command.match(/ /)){
            let split = command.split(" ");
            for (com of split){
                this.runSetter(com.trim());
            }
            return;
        }
        if(command.match(/^[a-gA-G][b#♭]?[0-9]?$/)){
            this.setNote(command, labelid);
        }else if(teoria.Scale.KNOWN_SCALES.indexOf(command.toLowerCase()) >= 0){
            this.setScale(command.toLowerCase(), labelid);
            this.bestSetIsScale();
        }else if (command.match(/^[+-]/)){
            var interval  = command.replace(/^[+-]/,"");
            if(command[0] == "-" && command[1] != "-"){
                interval = [interval.slice(0, 1), "-", interval.slice(1)].join('');
            }
            this.transpose(command.replace(/^[+-]/,""), labelid);
        }else if(command.match(/[0-7]\.[34]/)){
            var position = command[0];
            var size = command[2];
            this.setChordDiatonic(parseInt(position), parseInt(size), labelid);
            this.bestSetIsChord();
        }else{
            let result = this.tryChord(command);
            if(!result){
                console.log("no command match for "+command);
            }
        }
    }, 

    tryChord(command){
        this.debugmsg("trying " + command);
        try{
            this.setChord(command);
            this.bestSetIsChord();
        }catch(e){
            this.debugmsg("chord set error " + e);
            return false;
        }
        return true;
    },

    runGetter(command, labelid){
        // - s0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the scale note at the position in the scale represented by the float, between the Min and Max MIDI values
        // - c0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the chord note at the position in the scale represented by the float, between the Min and Max MIDI values
        // - w0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the note at the position in the weighted scale  represented by the float, between the Min and Max MIDI values
        // - s[0-9]+(min-Max) : get the note at that index in the list of scale notes, btw Min and Max. Loops around to bottom.
        // - c[0-9]+(min-Max) : get the note at that index in the list of chord notes, btw Min and Max. Loops around to bottom.
        // - w[0-9]+(min-Max) : get the note at that index in the list of weighted scale notes, btw Min and Max. Loops around to bottom.
        
        command = command.toLowerCase();

        var matches = command.match(/([bscwrf])([0-9]*\.?[0-9]+)\(([0-9]+)-([0-9]+)\)/);
    //	this.debugmsg(matches); //
        if(!matches){
    //		this.debugmsg("no command match for "+command);
            return;
        }
        var sc = matches[1];
        var intfl = "int";
        if(matches[2].match(/\./)){
            var intfl = "float";
        }
    //	this.debugmsg(intfl);
        var value = parseFloat(matches[2]);
    //	this.debugmsg(value);
        
        var min = parseInt(matches[3]);
        var max = parseInt(matches[4]);
    //	this.debugmsg("min: " + min);
    //	this.debugmsg("max: " + max);
        
        if(sc == "s"){
            if(intfl == "int"){
                this.getScaleNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getScaleNoteFromFloat(labelid, value, min, max);
            }		
        }
        if(sc == "c"){
            if(intfl == "int"){
                this.getChordNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getChordNoteFromFloat(labelid, value, min, max);
            }		
        }
        if(sc == "b"){
            if(intfl == "int"){
                this.getBestNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getBestNoteFromFloat(labelid, value, min, max);
            }		
        }	
        if(sc == "w"){
            if(intfl == "int"){
                this.getWeightedScaleNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getWeightedScaleNoteFromFloat(labelid, value, min, max);
            }		
        }
        if(sc == "r"){
            if(intfl == "int"){
                this.getRootedBestNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getRootedBestNoteFromFloat(labelid, value, min, max);
            }		
        }

        if(sc == "f"){
            if(intfl == "int"){
                this.getFixedBestNoteFromInt(labelid, value, min, max);
            }
            if(intfl == "float"){
                this.getFixedBestNoteFromFloat(labelid, value, min, max);
            }		
        }	

    },

    transpose(theinterval){
    //	this.debugmsg("+++++ transposing "+ theinterval);
    //	this.debugmsg("now note");
        if(this.curNote){
            this.curNote = this.curNote.interval(theinterval);
        }
    //	this.debugmsg("now scale");
        if(this.curScale){
            this.curScale = this.curNote.scale(curScaleName);
            this.createScaleSet();
        }
    //	this.debugmsg("now chord");
        if(this.curChord){
            this.curChord = this.curChord.interval(theinterval);
            this.curChordName = this.curChord.name.toLowerCase().replace(this.curChord.root.toString(true),"");
            this.createChordSet();
        }

    },

    setNote(note){
        this.curNote = teoria.note(note);
        if(this.curScale){
            this.curScale = this.curNote.scale(this.curScaleName);
            this.createScaleSet();
        }
        if(this.curChord){
            this.curChord = this.curNote.chord(this.curChordName);
            this.createChordSet();
        }
    },

    setChord(chord){
    //	this.debugmsg("+++++ setChord " + chord);
        if(!this.curNote){
            throw new Error("need a note set first");
        }
        this.curChordName = chord;
        this.curChord = this.curNote.chord(chord);
        this.createChordSet();
    },

    setChordDiatonic(position, size){
        try{
            this.debugmsg("+++++ set diatonic " +position +" size " +size);
            if(this.curScale){
                this.curChord = teoriaChordProgression(this.curScale, [position], size).getChord(0);
                this.curChordName = this.curChord.name.toLowerCase().replace(this.curChord.root.toString(true),"");
                this.createChordSet();

            }
        }catch(e){
            this.debugmsg("some error processing setChordDiatonic " + position + ", "+ size);
            this.debugmsg(JSON.stringify(e, null, "  "));
        }
    },

    setScale(scale){
    //	this.debugmsg("+++++ setScale " + scale);
        if(!this.curNote){
            throw new Error("need a note set first");
        }
        this.curScaleName = scale;
        this.curScale = this.curNote.scale(scale);
        this.createScaleSet()
    },

    getScaleNotes(){
        if(this.curScale){
            /*
            this.debugmsg("getScaleNotes");
            this.debugmsg(curScaleName);
            this.debugmsg(curScale.simple());
            */
            return this.curScale.simple();
        }
    },

    getChordNotes(){
        if(this.curChord){
            /*
            this.debugmsg("getChordNotes");
            this.debugmsg(curChord.simple());
            this.debugmsg(curChordName);
            this.debugmsg(curChord.name);
            */
    //		this.debugmsg(curChord.name.toLowerCase().replace(curChord.root.toString(true),""));
    //			this.debugmsg(curChord.root.toString(true));
            return this.curChord.simple();
        }
    },

    createScaleSet(){
        this.debugmsg("creating scale set ");
        this.debugmsg("creating scale set ");
        this.scaleNoteSet = [];
        this.scaleNoteSetMidi = [];
        var notes = this.curScale.notes();
        this.curRootMidi = this.curScale.tonic.midi() % 12;

        for(var i = 0; i < notes.length; i++){
            var note = notes[i];
            this.debugmsg(note.toString());
            this.debugmsg(note.midi() % 12);
            var midiroot = note.midi() % 12
            for(var octave = 0; octave <= 12; octave++){
                var midi = (octave * 12) + midiroot
                if(midi <= 128){
                    var newnote = teoria.note.fromMIDI(midi);
                    this.scaleNoteSet.push(newnote);
                    this.scaleNoteSetMidi.push(parseInt(newnote.midi()));
                }
            }
        }
        this.scaleNoteSetMidi.sort(function(a,b){
            return a - b;
        });
        
        this.scaleNoteSet.sort(function(a,b){
            return (a.midi() - b.midi());
        });

        this.debugmsg(this.scaleNoteSetMidi);

        /*
        this.scaleNoteSet.map(function(item){
            this.debugmsg(item.toString());
        });
        */
        this.getScaleNoteMidiList();
        
        this.createWeightedScaleSet();	
    },


    createChordSet(){
    //	this.debugmsg("creating chord set ");
        this.chordNoteSet = [];
        this.chordNoteSetMidi = []
        var notes = this.curChord.notes();
        this.curRootMidi = this.curChord.root.midi() % 12;
        for(var i = 0; i < notes.length; i++){
            var note = notes[i];
    //		this.debugmsg(note.toString());
    //		this.debugmsg(note.midi() % 12);
            var midiroot = note.midi() % 12
            for(var octave = 0; octave <= 12; octave++){
                var midi = (octave * 12) + midiroot
                if(midi <= 128){
                    var newnote = teoria.note.fromMIDI(midi);
                    this.chordNoteSet.push(newnote);
                    this.chordNoteSetMidi.push(parseInt(newnote.midi()));
                }
            }
        }
        this.chordNoteSetMidi.sort(function(a,b){
            return a - b;
        });
        
        this.chordNoteSet.sort(function(a,b){
            return (a.midi() - b.midi());
        });

        this.debugmsg(this.chordNoteSetMidi);

        this.chordNoteSet.map((function(item){
            this.debugmsg(item.toString());
        }).bind(this));

        this.getChordNoteMidiList();
        
        this.createWeightedScaleSet();
    },


    // make a scaleset that has duplicates of chord notes, so chord notes are more likely
    createWeightedScaleSet(){
        if(this.chordNoteSet  && this.chordNoteSetMidi && this.scaleNoteSet && this.scaleNoteSetMidi){
            this.weightedScaleNoteSet = this.scaleNoteSet.concat(this.chordNoteSet);
            this.weightedScaleNoteSetMidi = this.scaleNoteSetMidi.concat(this.chordNoteSetMidi);
            this.weightedScaleNoteSetMidi.sort(function(a,b){
                return a - b;
            });
        
            this.weightedScaleNoteSet.sort(function(a,b){
                return (a.midi() - b.midi());
            });	
        }
    },


    getScaleNoteMidiList(labelid){
        if(!labelid){
            labelid = "scaleNoteMidiList";
        }
        if(this.scaleNoteSetMidi){
            var output = labelid+" " + this.scaleNoteSetMidi.join(" ");
    //		this.debugmsg(output);
            this.sendOutput(output);
        }else{
            this.debugmsg("no scale set");
        }
        
    },

    getWeightedScaleNoteMidiList(labelid){
        if(!labelid){
            labelid = "weightedScaleNoteMidiList";
        }
        if(this.weightedScaleNoteSetMidi){
            var output = labelid+" " + this.weightedScaleNoteSetMidi.join(" ");
    //		this.debugmsg(output);
            this.sendOutput(output);
        }else{
            this.debugmsg("no weighted scale set");
        }
        
    },

    getChordNoteMidiList(labelid){
        if(!labelid){
            labelid = "chordNoteMidiList";
        }
        if(this.chordNoteSetMidi){
            var output = labelid+" " + this.chordNoteSetMidi.join(" ");
    //		this.debugmsg(output);
            this.sendOutput(output)
        }else{
            this.debugmsg("no chord set");
        }	
    },

    getBestNoteMidiList(labelid){
        if(!labelid){
            labelid = "bestNoteMidiList";
        }
        if(this.bestNoteSetMidi){
            var output = labelid+" " + this.bestNoteSetMidi.join(" ");
    //		this.debugmsg(output);
            this.sendBestMidiList(this.bestNoteSetMidi)
        }else{
            this.debugmsg("no best set");
        }	
    },



    noteList(){
        var output = "noteList " +   this.currentNotelist.join(" ");
    //	this.debugmsg(output);

        this.sendOutput(output)//+ currentNotelist.join(" "));
    },


    getScaleNoteFromFloat(labelid, value, min, max){

        var note = this.selectFromFloat(value, this.scaleNoteSetMidi, min, max);
        if(!note){
            this.debugmsg("no note");
            this.debugmsg("getScaleNoteFromFloat");
    //		this.debugmsg(scaleNoteSetMidi.join(" "));	
            this.debugmsg("sending " + labelid + " " + note);		 
            return false;
        }
    //	this.debugmsg("getScaleNoteFromFloat");
    //	this.debugmsg(scaleNoteSetMidi.join(" "));	
    //	this.debugmsg("sending " + labelid + " " + note);
        this.sendOutput(labelid+ " " + note);
    },

    getWeightedScaleNoteFromFloat(labelid, value, min, max){

        var note = this.selectFromFloat(value, this.weightedScaleNoteSetMidi, min, max);
        if(!note){
            return false;
        }
    //	this.debugmsg("sending " + labelid + " " + note);
        this.sendOutput(labelid+ " " + note);
    },

    getScaleNoteFromInt(labelid, value, min, max){
        var note = this.selectFromInt(value, this.scaleNoteSetMidi, min, max);
        if(!note){
            return false;
        }
        this.sendOutput(labelid+ " " + note);
    },

    getWeightedScaleNoteFromInt(labelid, value, min, max){
        var note = this.selectFromInt(value, this.weightedScaleNoteSetMidi, min, max);
        if(!note){
            return false;
        }
        this.sendOutput(labelid+ " " + note);
    },

    getChordNoteFromFloat(labelid, value, min, max){
    //		this.debugmsg("getChordNoteFromFloat "+labelid + ", " + value);
    //		this.debugmsg(chordNoteSetMidi);
        var note = this.selectFromFloat(value, this.chordNoteSetMidi, min, max);
    //	this.debugmsg("note " + note);
        if(!note){
            return false;
        }
        this.sendOutput(labelid+ " " + note);
        
    },

    getChordNoteFromInt(labelid, value, min, max){
        var note = this.selectFromInt(value, this.chordNoteSetMidi, min, max);
        if(!note){
            return false;
        }
        this.sendOutput(labelid+ " " + note);
        
    },


    getBestNoteFromFloat(labelid, value, min, max){
        //		this.debugmsg("getChordNoteFromFloat "+labelid + ", " + value);
        //		this.debugmsg(chordNoteSetMidi);
        var note = this.selectFromFloat(value, this.bestNoteSetMidi, min, max);
        //	this.debugmsg("note " + note);
        if(!note){
            return false;
        }
        this.sendOutput(labelid+ " " + note);
        
    },
        
    getBestNoteFromInt(labelid, value, min, max){
        var note = this.selectFromInt(value, this.bestNoteSetMidi, min, max);
        if(!note){
            return false;
        }
        this.sendOutput(labelid+ " " + note);
        
    },

    getRootedBestNoteFromFloat(labelid, value, min, max){
        // for a "rooted" scale/chord, expand the min and max so that both min and max are the root
                this.debugmsg("getRootedBestNoteFromFloat "+labelid + ", " + value + " , "+ min +", " + max) ;
        //		this.debugmsg(chordNoteSetMidi);
        min = this.moveMinMax(this.curRootMidi, min);
        max = this.moveMinMax(this.curRootMidi, max);
        //this.debugmsg("newminmax  "+ min +", " + max) ;

        var note = this.selectFromFloat(value, this.bestNoteSetMidi, min, max);
        //	this.debugmsg("note " + note);
        if(!note){
            return false;
        }
        this.sendOutput(labelid+ " " + note);
    },

        
    getRootedBestNoteFromInt(labelid, value, min, max){
        min = this.moveMinMax(this.curRootMidi, min);
        max = this.moveMinMax(this.curRootMidi, max);	
        var note = this.selectFromInt(value, this.bestNoteSetMidi, min, max);
        if(!note){
            return false;
        }
        this.sendOutput(labelid+ " " + note);
        
    },
        
        
    getFixedBestNoteFromFloat(labelid, value, min, max){
    // in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale
    // - map the float across FULL range, from min to max
    // - move resulting value DOWN to the closest note in the scale
        //		this.debugmsg("getFixededBestNoteFromFloat "+labelid + ", " + value + " , "+ min +", " + max) ;
        //		this.debugmsg(chordNoteSetMidi);
    //	min = moveMinMax(curRootMidi, min);
    //	max = moveMinMax(curRootMidi, max);
    //	this.debugmsg("newminmax  "+ min +", " + max) ;

        var note = this.selectFixedFromFloat(value, this.bestNoteSetMidi, min, max);
        //	this.debugmsg("note " + note);
        if(!note){
            return false;
        }
        this.sendOutput(labelid+ " " + note);
        
    },

        
    getRootedBestNoteFromInt(labelid, value, min, max){
        
        min = this.moveMinMax(curRootMidi, min);
        max = this.moveMinMax(curRootMidi, max);	
        var note = this.selectFromInt(value, bestNoteSetMidi, min, max);
        if(!note){
            return false;
        }
        this.sendOutput(labelid+ " " + note);
        
    },


    selectFixedFromFloat(value, thelist, min, max){
    // in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale
    // - map the float across FULL range, from min to max
    // - move resulting value DOWN to the closest note in the scale

        if(!thelist){
            return false;
        }

        let range = max - min;
        let initial = min + Math.floor(range * value);
        while(thelist.indexOf(initial) < 0){
            initial--;
        }
        return initial;
    },



    selectFromFloat(value, thelist, min, max){
        if(!thelist){
            return false;
        }

        var workingList = thelist.filter(function(note){
            if(note >= min && note <= max){
                return true;
            }
            return false;
        });
    //	this.debugmsg(workingList);
        var index = Math.floor(workingList.length * value);
        var note  = workingList[index];// % workingList.length];
    //	this.debugmsg(note);	
        return note;
    },


    selectFromInt(value, thelist, min, max){
        if(!thelist){
            return false;
        }
        var workingList = thelist.filter(function(note){
            if(note >= min && note <= max){
                return true;
            }
            return false;
        });
    //	this.debugmsg(workingList);
        var note  = workingList[value % workingList.length];
    //	this.debugmsg(note);	
        return note;
    },


    moveMinMax(root, minmax){
        // for a "rooted" scale/chord, expand the min and max so that both min and max are the root
        //		this.debugmsg("getChordNoteFromFloat "+labelid + ", " + value);
        //		this.debugmsg(chordNoteSetMidi);
        let orig = minmax;
        let mindiff = (minmax % 12) - (root % 12);
        let minmove = Math.abs(6 - mindiff);

        if(mindiff == 0){
            // do nothing
        }else if (mindiff < -6){
            mindiff = -12 - mindiff;
            minmax = minmax - mindiff
            //big distance, go opposite way around
        }else if (mindiff < 0){
            // small different, go toward
            minmax = minmax - mindiff
        }else if(mindiff < 6){
            minmax = minmax - mindiff
        }else if (mindiff < 12){
            mindiff = 12 - mindiff;
            minmax = minmax + mindiff
        }
        return minmax;
    },


}


exports.TheoryEngine = TheoryEngine;