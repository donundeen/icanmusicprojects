const midi = require('midi');

let portname = "UM-ONE";

var output = new midi.Output();
console.log('Output ports: ' + output.getPortCount());

for (var i = 0; i < output.getPortCount(); ++i) {
    console.log('Port ' + i + ' name: ' + output.getPortName(i));
}




// Open the first available output port.
output.openPort(1);

// Send a MIDI message.
output.sendMessage([176,22,1]);

// Close the port when done.
output.closePort();


const easymidi = require('easymidi');
output = new easymidi.Output(portname);
output.send('noteon', {
  note: 64,
  velocity: 127,
  channel: 3
});


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


