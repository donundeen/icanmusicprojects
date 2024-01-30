const WEBSOCKET_PORT = 8001;
const WEBSERVER_PORT = 8002;

Array.prototype.rotateRight = function( n ) {
    this.unshift.apply( this, this.splice( n, this.length ) );
    return this;
  } 

// this lib: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/

// chnage this depending on location of webserver. Figure out a way to make this more dynamic...
let host =  window.location.host;
host = host.replace(/:[0-9]+/,"");
// remove port
console.log(host);

// some note characters: 
// ♭ 𝅘𝅥𝅮𝅗𝅥°♭𝅘𝅥𝅗𝅥𝅗 𝄼 𝄽 

//  const ws = new WebSocket('ws://localhost:8080');
//const ws = new WebSocket('ws://192.168.4.34:8080');
//const ws = new WebSocket('ws://10.102.134.110:8080');
const ws = new WebSocket('ws://'+host+':'+WEBSOCKET_PORT);

// 1 2 3 4 6 8 16
const notelengths = [4,2,1.33333,1,.66667,.5]; // multiples of a quarter note (1)
const lengthnames = ["Whole Note",
                    "Half Note",
                    "Half Triplet",
                    "Quarter",
                    "Quarter Triplet",
                    "Eighth Note"];
// lengths as fractions of whole notes
const notefracts = ["1","1/2","1/3","1/4","1/6","1/8"]; 
let nlindex = 1;
let curnotelength = notelengths[nlindex];
let curnotefract = notefracts[nlindex];
let curnotelengthname = lengthnames[nlindex];

let selectednotelengthobj = false;
let prevnlStroke = false;
let prevnlFill = false;

let wsready = false;  
  // Browser WebSockets have slightly different syntax than `ws`.
  // Instead of EventEmitter syntax `on('open')`, you assign a callback
  // to the `onopen` property.
ws.onopen = function() {
    wsready = true;
    console.log("opened " + ws.readyState);
    ws.send("READY NOW");    
};

ws.onerror = function(msg){
    console.log("ws error");
    console.log(msg);
}

ws.onclose = function(msg){
    console.log("wsclose");
    console.log(msg);
}

ws.onmessage = function(msg) {
    console.log("got message "+ msg);
    console.log(JSON.stringify(msg));
};  

var svgDoc = false;
let currentRoot = "C"
const numFifths = ['1','5','2','6','3','7','b5','b2','b6','b3','b7','4'];
const circleOfFourths = ['C', 'F', 'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'B', 'E', 'A', 'D', 'G'];
const circleOfFifths  = ['C', 'G', 'D', 'A', 'E', 'B', 'G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
let currentMajWheel = [...circleOfFifths];
let currentMinWheel = [...currentMajWheel].rotateRight(3);
let currentDimWheel = [...currentMajWheel].rotateRight(5);
// [...circleOfFourths].reverse().rotateRight(-1);
const majWheel = ['maj1', 'maj5', 'maj2', 'maj6', 'maj3', 'maj7', 'majb5', 'majb2', 'majb6', 'majb3', 'majb7', 'maj4'];
const minWheel = ['min6', 'min3', 'min7', 'minb5', 'minb2', 'minb6', 'minb3', 'minb7', 'min4','min1', 'min5', 'min2'];
const dimWheel = ['dim7', 'dimb5', 'dimb2', 'dimb6', 'dimb3', 'dimb7', 'dim4','dim1', 'dim5', 'dim2', 'dim6', 'dim3'];

console.log(currentMajWheel);
console.log(currentMinWheel);
console.log(currentDimWheel);


let selectedElem = false;
let prevStroke = false;
let prevFill = false;
let selectedFill = "red";
let selectedStroke = "red";

let lastChordRoot = false;
let lastChordValue = false;
let lastChordObj= false;

function setMajRoot(root){
    root = "maj"+root;
    console.log("setMajRoot " + root);
    var index = majWheel.indexOf(root);
    var rootNote = currentMajWheel[index];
    console.log("new root " + rootNote);
    console.log(currentMajWheel);
    currentMajWheel.rotateRight(index);
    currentMinWheel.rotateRight(index);
    currentDimWheel.rotateRight(index);
    console.log(currentMajWheel);

    assignNotes();
    setTransposedChord();    
}

function setMinRoot(root){
    console.log("setMinRoot " + root);
    root = "min"+root;
    console.log("setMinRoot " + root);
    var index = minWheel.indexOf(root);
    var rootNote = currentMinWheel[index];
    console.log("new root " + rootNote);
    console.log(currentMinWheel);
    currentMajWheel.rotateRight(index);
    currentMinWheel.rotateRight(index);
    currentDimWheel.rotateRight(index);
    console.log(currentMinWheel);

    assignNotes();
    setTransposedChord();

}

function setDimRoot(root){
    console.log("setDimRoot " + root);
    root = "dim"+root;
    console.log("setDimRoot " + root);
    var index = dimWheel.indexOf(root);
    var rootNote = currentDimWheel[index];
    console.log("new root " + rootNote);
    console.log(currentDimWheel);
    currentMajWheel.rotateRight(index);
    currentMinWheel.rotateRight(index);
    currentDimWheel.rotateRight(index);
    console.log(currentDimWheel);

    assignNotes();
    setTransposedChord();
}

function setRoot(root){
    console.log("setRoot " + root);
}

function markSelectedObj(obj){
    if(selectedElem){
        selectedElem.style.stroke = prevStroke;
        selectedElem.style.fill = prevFill;
    }
    selectedElem = obj;
    prevFill = obj.style.fill;
    prevStroke = obj.style.stroke;
    obj.style.fill = selectedFill;
    obj.style.stroke = selectedStroke;
}

function setChord(root, value, obj){
    console.log("setChord  " + root + "  , " + value);
    lastChordRoot = root;
    lastChordValue = value;
    lastChordObj = obj;
    markSelectedObj(obj);
    
    let index = numFifths.indexOf(root);
    console.log(index);
    console.log(currentMajWheel);
    let note = currentMajWheel[index];
    let chord = note+"6 "+value;
    console.log(chord);
    sendChord(chord);
}

function setTransposedChord(){
    if(lastChordRoot){
        setChord(lastChordRoot, lastChordValue, lastChordObj);
    }
}


function sendChord(chord){
    chord = chord.replace("♭","b");
    chord = chord.replace(/[0-9]/,"");
    console.log("sending: " + chord);
    console.log(ws.readyState);
    if(wsready){
        ws.send("chord " + chord);
    }else{
        console.log("ws not ready");
    }
}

function sendNoteLength(notelength, notefract){
    if(wsready){
        ws.send("notelength " + notelength + " " + notefract);
    }else{
        console.log("ws not ready");
    }
}




function assignNotes(){
    console.log("assigning Notes");
    console.log(majWheel);
    console.log(dimWheel);
    for (let i = 0; i<12; i++){
        let majId = majWheel[i];
        let minId = minWheel[i];
        let dimId = dimWheel[i];
//        console.log(majId);
//        console.log(minId);
//        console.log(dimId);
        let majNote = currentMajWheel[i];
        let minNote = currentMinWheel[i];
        let dimNote = currentDimWheel[i];
        // if there are extra child elements, as tehre sometimes are coming from AI, delete them

        while (svgDoc.getElementById(majId).childNodes.length > 1) {
            svgDoc.getElementById(majId).removeChild(svgDoc.getElementById(majId).lastChild);
        }
        svgDoc.getElementById(majId).children[0].textContent = majNote;
        // if there are extra child elements, as tehre sometimes are coming from AI, delete them
        while (svgDoc.getElementById(minId).childNodes.length > 1) {
            svgDoc.getElementById(minId).removeChild(svgDoc.getElementById(minId).lastChild);
        }
        svgDoc.getElementById(minId).children[0].textContent = minNote.toLowerCase();
        while (svgDoc.getElementById(dimId).childNodes.length > 1) {
            svgDoc.getElementById(dimId).removeChild(svgDoc.getElementById(dimId).lastChild);
        }
        svgDoc.getElementById(dimId).children[0].textContent = dimNote.toLowerCase()+"°";
    }
}
//Layer_1

var a = document.getElementById("Layer_1");
console.log(a);
// It's important to add an load event listener to the object,
// as it will load the svg doc asynchronously
let firstLoadDone = false;
a.addEventListener("load",function(){
    if(!firstLoadDone){
        firstLoadDone = true;
        console.log("loaded");

        // get the inner DOM of alpha.svg
        console.log(a);

        svgDoc = a;//.contentDocument;
        console.log(svgDoc);
    
        doLoadStuff();
    }
});

if(document.querySelectorAll("#Layer_1").length){
    console.log("is already loaded");
    if(!firstLoadDone){
        firstLoadDone = true;
        console.log("loaded");
        a = document.getElementById("Layer_1");
        // get the inner DOM of alpha.svg
        console.log(a);

        svgDoc = a;//.contentDocument;
        console.log(svgDoc);
    
        doLoadStuff();
    }    
}

function doLoadStuff(){
    assignNotes();
    setupFormElements();
}




function noteLengthSelected(nlindex, obj){
    console.log("note lenght selected " + nlindex);
    let curnotelength = notelengths[nlindex];
    let curnotefract = notefracts[nlindex];
    let curnotelengthname = lengthnames[nlindex];        
    markselectednotelength(obj);
    sendNoteLength(curnotelength, curnotefract);
}

function markselectednotelength(obj){
    if(selectednotelengthobj){
        selectednotelengthobj.style.stroke = prevnlStroke;
        selectednotelengthobj.style.fill = prevnlFill;
    }
    selectednotelengthobj = obj;
    prevnlFill = obj.style.fill;
    prevnlStroke = obj.style.stroke;
    obj.style.fill = selectedFill;
    obj.style.stroke = selectedStroke;
}

function sendMoveCursor(direction, obj){
    console.log("move cursor " + direction);
    if(wsready){
        ws.send("movecursor " + direction );
    }else{
        console.log("ws not ready");
    } 
    (function(theobj){
        console.log(theobj);

        let prevFill = theobj.style.fill;
        let prevStroke = theobj.style.stroke;
        theobj.style.fill = selectedFill;
        theobj.style.stroke = selectedStroke;
        setTimeout(function(){
            theobj.style.fill = prevFill;
            theobj.style.stroke = prevStroke;
        }, 500);        
            
    })(obj);
}



function setupFormElements(){
    console.log("setup form");
    nlelem = document.getElementById("half");
    console.log(nlelem);


    selectednotelengthobj = false;
    prevnlStroke = false;
    prevnlFill = false;    
    noteLengthSelected(4, nlelem)

}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMCONTENTLOADED...");
});
//setMajRoot("infile");

