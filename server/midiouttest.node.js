var JZZ = require('jzz');
require('jzz-midi-gear')(JZZ);

// start the MIDI engine:
JZZ({sysex:true}).and(function() {
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