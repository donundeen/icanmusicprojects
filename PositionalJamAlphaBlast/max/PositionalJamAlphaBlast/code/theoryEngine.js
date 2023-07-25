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


const maxApi = require("max-api");
const teoria = require("teoria");
const teoriaChordProgression = require('teoria-chord-progression');




var notes = [
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
]

var noteSets = {
	"Maj Triad":[0,4,7],
	"Min Triad":[0,3,7]	
};

var currentNotelist = [43, 47, 49];

var curNote = false;
var curScale = false;
var curScaleName= false;

var curRootMidi = 0;

var curChord = false;
var curChordName = false;

var scaleNoteSet = false;
var scaleNoteSetMidi = false;
var weightedScaleNoteSet = false;
var weightedScaleNoteSetMidi = false;
var chordNoteSet = false;
var chordNoteSetMidi = false;

// some system might not want to think about the difference between "chords" and "scales" as teoria defines them. He're we'll just store whichever was the MOST RECENT note set created, either scale or chord.
var curBestSetChordOrScale = false;
var curBestSetName = false;
var bestNoteSet = false;
var bestNoteSetMidi = false;

function bestSetIsChord(){
	bestNoteSet = chordNoteSet;
	bestNoteSetMidi = chordNoteSetMidi;
	curBestSetName = curChordName;
	getBestNoteMidiList();

}

function bestSetIsScale(){
	bestNoteSet = scaleNoteSet;
	bestNoteSetMidi = scaleNoteSetMidi;
	curBestSetName = curScaleName;
	getBestNoteMidiList();
}


maxApi.post("in script");

console.log("started");


// messages section
maxApi.addHandler("buildMenus", function(){
	maxApi.post("in buildMenus");
	buildMenus();

});

maxApi.addHandler("noteList", function(){
//	maxApi.post("noteList");
	noteList();
});


maxApi.addHandler("set", function(labelid, command){
	//maxApi.post("set " + " : " + labelid + " : " + command);
	runSetter(command.toString(), labelid);
});

maxApi.addHandler("get", function(labelid, command){
	//maxApi.post("get " + " : " + labelid + " : " + command);
	runGetter(command.toString(), labelid);

});

maxApi.addHandler("moveMinMax", function(rootval, minmax){
	moveMinMax(rootval, minmax);
});



// setter commands
function runSetter(command, labelid){
	if(command.match(/^[a-gA-G][b#♭]?[0-9]?$/)){
//		maxApi.post("command setNote " + command);
		setNote(command, labelid);
	}else if(teoria.Scale.KNOWN_SCALES.indexOf(command.toLowerCase()) >= 0){
//		maxApi.post("command setScale " + command);
		setScale(command.toLowerCase(), labelid);
		bestSetIsScale();
	}else if (command.match(/^[+-]/)){
		var interval  = command.replace(/^[+-]/,"");
		if(command[0] == "-" && command[1] != "-"){
			interval = [interval.slice(0, 1), "-", interval.slice(1)].join('');
		}
//		maxApi.post("command transpose " + command);
//		maxApi.post(interval);
		transpose(command.replace(/^[+-]/,""), labelid);
	}else if(command.match(/[0-7]\.[34]/)){
//		maxApi.post("command diatonic " + command);
		var position = command[0];
		var size = command[2];
//		maxApi.post(position + " , " + size);
		setChordDiatonic(parseInt(position), parseInt(size), labelid);
		bestSetIsChord();
	}else{
		let result = tryChord(command);
		if(!result){
			maxApi.post("no command match for "+command);
		}
	}
} 

function tryChord(command){
	maxApi.post("trying " + command);
	try{
		setChord(command);
		bestSetIsChord();
	}catch(e){
		maxApi.post("chord set error " + e);
		return false;
	}
	return true;
}

function runGetter(command, labelid){
    // - s0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the scale note at the position in the scale represented by the float, between the Min and Max MIDI values
	// - c0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the chord note at the position in the scale represented by the float, between the Min and Max MIDI values
	// - w0.[0-9]+(Min-Max) : (float val btw 0.0 and 1.0) get the note at the position in the weighted scale  represented by the float, between the Min and Max MIDI values
	// - s[0-9]+(min-Max) : get the note at that index in the list of scale notes, btw Min and Max. Loops around to bottom.
    // - c[0-9]+(min-Max) : get the note at that index in the list of chord notes, btw Min and Max. Loops around to bottom.
    // - w[0-9]+(min-Max) : get the note at that index in the list of weighted scale notes, btw Min and Max. Loops around to bottom.
	
	command = command.toLowerCase();

	var matches = command.match(/([bscwrf])([0-9]*\.?[0-9]+)\(([0-9]+)-([0-9]+)\)/);
//	maxApi.post(matches); //
	if(!matches){
//		maxApi.post("no command match for "+command);
		return;
	}
	var sc = matches[1];
	var intfl = "int";
	if(matches[2].match(/\./)){
		var intfl = "float";
	}
//	maxApi.post(intfl);
	var value = parseFloat(matches[2]);
//	maxApi.post(value);
	
	var min = parseInt(matches[3]);
	var max = parseInt(matches[4]);
//	maxApi.post("min: " + min);
//	maxApi.post("max: " + max);
	
	if(sc == "s"){
		if(intfl == "int"){
			getScaleNoteFromInt(labelid, value, min, max);
		}
		if(intfl == "float"){
			getScaleNoteFromFloat(labelid, value, min, max);
		}		
	}
	if(sc == "c"){
		if(intfl == "int"){
			getChordNoteFromInt(labelid, value, min, max);
		}
		if(intfl == "float"){
			getChordNoteFromFloat(labelid, value, min, max);
		}		
	}
	if(sc == "b"){
		if(intfl == "int"){
			getBestNoteFromInt(labelid, value, min, max);
		}
		if(intfl == "float"){
			getBestNoteFromFloat(labelid, value, min, max);
		}		
	}	
	if(sc == "w"){
		if(intfl == "int"){
			getWeightedScaleNoteFromInt(labelid, value, min, max);
		}
		if(intfl == "float"){
			getWeightedScaleNoteFromFloat(labelid, value, min, max);
		}		
	}
	if(sc == "r"){
		if(intfl == "int"){
			getRootedBestNoteFromInt(labelid, value, min, max);
		}
		if(intfl == "float"){
			getRootedBestNoteFromFloat(labelid, value, min, max);
		}		
	}

	if(sc == "f"){
		if(intfl == "int"){
			getFixedBestNoteFromInt(labelid, value, min, max);
		}
		if(intfl == "float"){
			getFixedBestNoteFromFloat(labelid, value, min, max);
		}		
	}	

}

function transpose(theinterval){
//	console.log("+++++ transposing "+ theinterval);
//	console.log("now note");
	if(curNote){
		curNote = curNote.interval(theinterval);
	}
//	console.log("now scale");
	if(curScale){
		curScale = curNote.scale(curScaleName);
		createScaleSet();
	}
//	console.log("now chord");
	if(curChord){
		curChord = curChord.interval(theinterval);
		curChordName = curChord.name.toLowerCase().replace(curChord.root.toString(true),"");
		createChordSet();
	}

}

function setNote(note){
	curNote = teoria.note(note);
	if(curScale){
		curScale = curNote.scale(curScaleName);
		createScaleSet();
	}
	if(curChord){
		curChord = curNote.chord(curChordName);
		createChordSet();
	}
}

function setChord(chord){
//	console.log("+++++ setChord " + chord);
	if(!curNote){
		throw new Exception("need a note set first");
	}
	curChordName = chord;
	curChord = curNote.chord(chord);
	createChordSet();
}

function setChordDiatonic(position, size){
	try{
	console.log("+++++ set diatonic " +position +" size " +size);
	if(curScale){
		curChord = teoriaChordProgression(curScale, [position], size).getChord(0);
		curChordName = curChord.name.toLowerCase().replace(curChord.root.toString(true),"");
		createChordSet();

	}
	}catch(e){
		maxApi.post("some error processing setChordDiatonic " + position + ", "+ size);
		maxApi.post(JSON.stringify(e, null, "  "));
	}
}

function setScale(scale){
//	console.log("+++++ setScale " + scale);
	if(!curNote){
		throw new Exception("need a note set first");
	}
	curScaleName = scale;
	curScale = curNote.scale(scale);
	createScaleSet()
}

function getScaleNotes(){
	if(curScale){
		/*
		console.log("getScaleNotes");
		console.log(curScaleName);
		console.log(curScale.simple());
		*/
		return curScale.simple();
	}
}

function getChordNotes(){
	if(curChord){
		/*
		console.log("getChordNotes");
		console.log(curChord.simple());
		console.log(curChordName);
		console.log(curChord.name);
		*/
//		console.log(curChord.name.toLowerCase().replace(curChord.root.toString(true),""));
//			console.log(curChord.root.toString(true));
		return curChord.simple();
	}
}

function createScaleSet(){
	console.log("creating scale set ");
	scaleNoteSet = [];
	scaleNoteSetMidi = [];
	var notes = curScale.notes();
	curRootMidi = curScale.tonic.midi() % 12;

	for(var i = 0; i < notes.length; i++){
		var note = notes[i];
		console.log(note.toString());
		console.log(note.midi() % 12);
		var midiroot = note.midi() % 12
		for(var octave = 0; octave <= 12; octave++){
			var midi = (octave * 12) + midiroot
			if(midi <= 128){
				var newnote = teoria.note.fromMIDI(midi);
				scaleNoteSet.push(newnote);
				scaleNoteSetMidi.push(parseInt(newnote.midi()));
			}
		}
	}
	scaleNoteSetMidi.sort(function(a,b){
		return a - b;
	});
	
	scaleNoteSet.sort(function(a,b){
		return (a.midi() - b.midi());
	});

	console.log(scaleNoteSetMidi);

	scaleNoteSet.map(function(item){
		console.log(item.toString());
	});
	getScaleNoteMidiList();
	
    createWeightedScaleSet();	
}


function createChordSet(){
//	console.log("creating chord set ");
	chordNoteSet = [];
	chordNoteSetMidi = []
	var notes = curChord.notes();
	curRootMidi = curChord.root.midi() % 12;
	for(var i = 0; i < notes.length; i++){
		var note = notes[i];
//		console.log(note.toString());
//		console.log(note.midi() % 12);
		var midiroot = note.midi() % 12
		for(var octave = 0; octave <= 12; octave++){
			var midi = (octave * 12) + midiroot
			if(midi <= 128){
				var newnote = teoria.note.fromMIDI(midi);
				chordNoteSet.push(newnote);
				chordNoteSetMidi.push(parseInt(newnote.midi()));
			}
		}
	}
	chordNoteSetMidi.sort(function(a,b){
		return a - b;
	});
	
	chordNoteSet.sort(function(a,b){
		return (a.midi() - b.midi());
	});

	console.log(chordNoteSetMidi);

	chordNoteSet.map(function(item){
		console.log(item.toString());
	});

	getChordNoteMidiList();
	
	createWeightedScaleSet();
}


// make a scaleset that has duplicates of chord notes, so chord notes are more likely
function createWeightedScaleSet(){
	if(chordNoteSet  && chordNoteSetMidi && scaleNoteSet && scaleNoteSetMidi){
		weightedScaleNoteSet = scaleNoteSet.concat(chordNoteSet);
		weightedScaleNoteSetMidi = scaleNoteSetMidi.concat(chordNoteSetMidi);
		weightedScaleNoteSetMidi.sort(function(a,b){
			return a - b;
		});
	
		weightedScaleNoteSet.sort(function(a,b){
			return (a.midi() - b.midi());
		});	
	}
}



function buildMenus(){
	scalesForMenu();
	notesForMenu();
}

function scalesForMenu(){
	var names = Object.keys(noteSets);
	for (var i =0; i< names.length; i++){
		maxApi.outlet( "scalesForMenu " + names[i] );
	}
}

function notesForMenu(){
	for (var i =0; i< notes.length; i++){
		maxApi.outlet("notesForMenu " +notes[i] );
	}
}
 


function getScaleNoteMidiList(labelid){
	if(!labelid){
		labelid = "scaleNoteMidiList";
	}
	if(scaleNoteSetMidi){
		var output = labelid+" " + scaleNoteSetMidi.join(" ");
//		maxApi.post(output);
		maxApi.outlet(output)
	}else{
		maxApi.post("no scale set");
	}
	
}

function getWeightedScaleNoteMidiList(labelid){
	if(!labelid){
		labelid = "weightedScaleNoteMidiList";
	}
	if(weightedScaleNoteSetMidi){
		var output = labelid+" " + weightedScaleNoteSetMidi.join(" ");
//		maxApi.post(output);
		maxApi.outlet(output)
	}else{
		maxApi.post("no weighted scale set");
	}
	
}

function getChordNoteMidiList(labelid){
	if(!labelid){
		labelid = "chordNoteMidiList";
	}
	if(chordNoteSetMidi){
		var output = labelid+" " + chordNoteSetMidi.join(" ");
//		maxApi.post(output);
		maxApi.outlet(output)
	}else{
		maxApi.post("no chord set");
	}	
}

function getBestNoteMidiList(labelid){
	if(!labelid){
		labelid = "bestNoteMidiList";
	}
	if(bestNoteSetMidi){
		var output = labelid+" " + bestNoteSetMidi.join(" ");
//		maxApi.post(output);
		maxApi.outlet(output)
	}else{
		maxApi.post("no best set");
	}	
}



function noteList(){
	var output = "noteList " +   currentNotelist.join(" ");
//	maxApi.post(output);

	maxApi.outlet(output)//+ currentNotelist.join(" "));
}


function getScaleNoteFromFloat(labelid, value, min, max){

	var note = selectFromFloat(value, scaleNoteSetMidi, min, max);
	if(!note){
		maxApi.post("no note");
		maxApi.post("getScaleNoteFromFloat");
//		maxApi.post(scaleNoteSetMidi.join(" "));	
		maxApi.post("sending " + labelid + " " + note);		 
		return false;
	}
//	maxApi.post("getScaleNoteFromFloat");
//	maxApi.post(scaleNoteSetMidi.join(" "));	
//	maxApi.post("sending " + labelid + " " + note);
	maxApi.outlet(labelid+ " " + note);
}

function getWeightedScaleNoteFromFloat(labelid, value, min, max){

	var note = selectFromFloat(value, weightedScaleNoteSetMidi, min, max);
	if(!note){
		return false;
	}
//	maxApi.post("sending " + labelid + " " + note);
	maxApi.outlet(labelid+ " " + note);
}

function getScaleNoteFromInt(labelid, value, min, max){
	var note = selectFromInt(value, scaleNoteSetMidi, min, max);
	if(!note){
		return false;
	}
	maxApi.outlet(labelid+ " " + note);
}

function getWeightedScaleNoteFromInt(labelid, value, min, max){
	var note = selectFromInt(value, weightedScaleNoteSetMidi, min, max);
	if(!note){
		return false;
	}
	maxApi.outlet(labelid+ " " + note);
}



function getChordNoteFromFloat(labelid, value, min, max){
//		maxApi.post("getChordNoteFromFloat "+labelid + ", " + value);
//		maxApi.post(chordNoteSetMidi);
	var note = selectFromFloat(value, chordNoteSetMidi, min, max);
//	maxApi.post("note " + note);
	if(!note){
		return false;
	}
	maxApi.outlet(labelid+ " " + note);
	
}

function getChordNoteFromInt(labelid, value, min, max){
	var note = selectFromInt(value, chordNoteSetMidi, min, max);
	if(!note){
		return false;
	}
	maxApi.outlet(labelid+ " " + note);
	
}


function getBestNoteFromFloat(labelid, value, min, max){
	//		maxApi.post("getChordNoteFromFloat "+labelid + ", " + value);
	//		maxApi.post(chordNoteSetMidi);
	var note = selectFromFloat(value, bestNoteSetMidi, min, max);
	//	maxApi.post("note " + note);
	if(!note){
		return false;
	}
	maxApi.outlet(labelid+ " " + note);
	
}
	
function getBestNoteFromInt(labelid, value, min, max){
	var note = selectFromInt(value, bestNoteSetMidi, min, max);
	if(!note){
		return false;
	}
	maxApi.outlet(labelid+ " " + note);
	
}

function getRootedBestNoteFromFloat(labelid, value, min, max){
	// for a "rooted" scale/chord, expand the min and max so that both min and max are the root
			maxApi.post("getRootedBestNoteFromFloat "+labelid + ", " + value + " , "+ min +", " + max) ;
	//		maxApi.post(chordNoteSetMidi);
	min = moveMinMax(curRootMidi, min);
	max = moveMinMax(curRootMidi, max);
	//maxApi.post("newminmax  "+ min +", " + max) ;

	var note = selectFromFloat(value, bestNoteSetMidi, min, max);
	//	maxApi.post("note " + note);
	if(!note){
		return false;
	}
	maxApi.outlet(labelid+ " " + note);
	
}

	
function getRootedBestNoteFromInt(labelid, value, min, max){
	min = moveMinMax(curRootMidi, min);
	max = moveMinMax(curRootMidi, max);	
	var note = selectFromInt(value, bestNoteSetMidi, min, max);
	if(!note){
		return false;
	}
	maxApi.outlet(labelid+ " " + note);
	
}
	
	
function getFixedBestNoteFromFloat(labelid, value, min, max){
// in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale
// - map the float across FULL range, from min to max
// - move resulting value DOWN to the closest note in the scale
	//		maxApi.post("getFixededBestNoteFromFloat "+labelid + ", " + value + " , "+ min +", " + max) ;
	//		maxApi.post(chordNoteSetMidi);
//	min = moveMinMax(curRootMidi, min);
//	max = moveMinMax(curRootMidi, max);
//	maxApi.post("newminmax  "+ min +", " + max) ;

	var note = selectFixedFromFloat(value, bestNoteSetMidi, min, max);
	//	maxApi.post("note " + note);
	if(!note){
		return false;
	}
	maxApi.outlet(labelid+ " " + note);
	
}

	
function getRootedBestNoteFromInt(labelid, value, min, max){
	
	min = moveMinMax(curRootMidi, min);
	max = moveMinMax(curRootMidi, max);	
	var note = selectFromInt(value, bestNoteSetMidi, min, max);
	if(!note){
		return false;
	}
	maxApi.outlet(labelid+ " " + note);
	
}


function selectFixedFromFloat(value, thelist, min, max){
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
}



function selectFromFloat(value, thelist, min, max){
	if(!thelist){
		return false;
	}

	var workingList = thelist.filter(function(note){
		if(note >= min && note <= max){
			return true;
		}
		return false;
	});
//	maxApi.post(workingList);
	var index = Math.floor(workingList.length * value);
	var note  = workingList[index];// % workingList.length];
//	maxApi.post(note);	
	return note;
}


function selectFromInt(value, thelist, min, max){
	if(!thelist){
		return false;
	}
	var workingList = thelist.filter(function(note){
		if(note >= min && note <= max){
			return true;
		}
		return false;
	});
//	maxApi.post(workingList);
	var note  = workingList[value % workingList.length];
//	maxApi.post(note);	
	return note;
}


function moveMinMax(root, minmax){
	// for a "rooted" scale/chord, expand the min and max so that both min and max are the root
	//		maxApi.post("getChordNoteFromFloat "+labelid + ", " + value);
	//		maxApi.post(chordNoteSetMidi);
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

}