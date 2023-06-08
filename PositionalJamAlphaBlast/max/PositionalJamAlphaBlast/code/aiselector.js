
Array.prototype.rotateRight = function( n ) {
    this.unshift.apply( this, this.splice( n, this.length ) );
    return this;
  }

// chnage this depending on location of webserver. Figure out a way to make this more dynamic...
let host =  window.location.host;
host = host.replace(/:[0-9]+/,"");
// remove port
console.log(host);




//  const ws = new WebSocket('ws://localhost:8080');
//const ws = new WebSocket('ws://192.168.4.34:8080');
//const ws = new WebSocket('ws://10.102.134.110:8080');
const ws = new WebSocket('ws://'+host+':8080');

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

let wsready = false;  
  // Browser WebSockets have slightly different syntax than `ws`.
  // Instead of EventEmitter syntax `on('open')`, you assign a callback
  // to the `onopen` property.
  ws.onopen = function() {
    wsready = true;
  };

  ws.onmessage = function(msg) {
    console.log("got message "+ msg);
    console.log(JSON.stringify(msg));
  };  

var svgDoc = false;
let currentRoot = "C"
const numFifths = ['1','5','2','6','3','7','b5','b2','b6','b3','b7','4'];
const circleOfFourths = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G'];
const circleOfFifths =  ['C', 'G', 'D', 'A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
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
}

function setRoot(root){
    console.log("setRoot " + root);

}

function setChord(root, value){
    console.log("setChord  " + root + "  , " + value);
    let index = numFifths.indexOf(root);
    console.log(index);
    console.log(currentMajWheel);
    let note = currentMajWheel[index];
    let chord = note+"6 "+value;
    console.log(chord);
    sendChord(chord);
}

function sendChord(chord){
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
        console.log(majId);
        console.log(minId);
        console.log(dimId);
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
        svgDoc.getElementById(dimId).children[0].textContent = dimNote.toLowerCase()+"*";
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

function setupFormElements(){
    nlelem = document.getElementById("notelength");
    console.log(nlelem);
    nlelem.addEventListener("input", function(event){
        let nlindex = event.target.value;
        let curnotelength = notelengths[nlindex];
        let curnotelengthname = lengthnames[nlindex];        
        document.getElementById("curnotelength").textContent = curnotelengthname;
    });
    nlelem.addEventListener("change", function(event){
        let nlindex = event.target.value;
        let curnotelength = notelengths[nlindex];
        let curnotefract = notefracts[nlindex];
        let curnotelengthname = lengthnames[nlindex];        
        document.getElementById("curnotelength").textContent = curnotelengthname;
        sendNoteLength(curnotelength, curnotefract);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMCONTENTLOADED...");
});
//setMajRoot("infile");

