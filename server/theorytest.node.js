let message = "C m";

// thoeryEngine generates lists of notes from theory terms (eg A MINORPENTATONIC)
const TheoryEngine = require("./modules/theoryengine.module.js").TheoryEngine;

theory = Object.create(TheoryEngine);


theory.setMidiListCallback(function(msg){
    console.log("theory output ");
    console.log(msg);
});

theory.runSetter(message, "fromscore");

