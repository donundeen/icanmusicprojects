const midi = require('midi');

let portname = "UM-ONE:UM-ONE MIDI 1 28:0";






const easymidi = require('easymidi');

console.log(easymidi.getOutputs());

output = new easymidi.Output(portname);


setTimeout(function(){
  makenote(1,67,127,500);
}, 1000);
setTimeout(function(){
  makenote(2,69,127,500);
}, 2000);
setTimeout(function(){
  makenote(3,70,127,500);
}, 3000);
setTimeout(function(){
  makenote(4,72,127,500);
}, 4000);
setTimeout(function(){
  makenote(5,73,127,500);
}, 5000);
setTimeout(function(){
  makenote(6,73,127,500);
}, 6000);

function makenote(channel, note, velocity, duration){
  output.send('noteon', {
    note: note,
    velocity: velocity,
    channel: channel
  });
  setTimeout(function(){
    output.send('noteoff', {
      note: note,
      velocity: 0,
      channel: channel
    });
  }, duration)
}


/*
var JZZ = require('jzz');
//require("jazz-midi");
//require('jzz-midi-gear')(JZZ);

console.log("starting");
// start the MIDI engine:
JZZ({sysex:true}).and(function() {
  console.log("sysex in");
    var inputs = this.info().inputs;
    var outputs = this.info().outputs;
    // enable message handlers on all MIDI-In ports:
    for (var i in inputs) this.openMidiIn(i).connect(function(msg) {
      if (msg.isIdResponse()) {
        var gear = msg.gearInfo();
        console.log('ID Response SysEx received:');
        console.log('   port:    ' + this.name());
        console.log('   message: ' + msg);
        console.log('   brand:   ' + gear.brand);
        console.log('   model:   ' + gear.model);
        console.log('   device:  ' + gear.descr);
      }
    });
    // send the ID Request SysEx to all MIDI-Out ports:
    for (var i in outputs) this.openMidiOut(i).sxIdRequest();
  });
  // ...
  // in Node.js - don't forget to stop the engine when done:
  JZZ().wait(500).close();  

let engine = JZZ({engine: "node"}).or('Cannot start MIDI engine!');
let info = engine.info();
console.log(info);
  engine
  .openMidiOut(1).or('Cannot open MIDI Out port!')
  .wait(500).send([0x90,60,127]) // note on
  .wait(500).send([0x80,60,0]);  // note off
JZZ().openMidiIn(1).or('Cannot open MIDI In port!')
  .and(function() { console.log('MIDI-In: ', this.name()); })
  .connect(function(msg) { console.log(msg.toString()); })
  .wait(5000).close();

*/
