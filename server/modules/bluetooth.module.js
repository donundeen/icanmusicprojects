const { exec } = require('child_process');

let Bluetooth = {
    deviceID : "74:F0:F0:AB:D5:21",
    deviceName : "",
    blue : false,
    active: false,
    connected: false,

    init(){
        console.log("bluetooth init 1");

        if(!this.active) return;

        console.log("bluetooth init");
        this.blue = require("bluetoothctlwe");
        this.blue.Bluetooth();
    },

    keepUp(){
        if(!this.active) return;
        let self = this;

        function deviceCheckAndConnect(options, callback) {
            
            // this is where we might wait until we see a set of headphones connected before we start
            exec("pacmd list-sinks", (error, stdout, stderr) => {
                if (error) {
                  console.log(`exec error: ${error.message}`);
                }
                if (stderr) {
                  console.log(`exec stderr: ${stderr}`);
                }
                if (stdout) {
                    console.log(`exec stdout: ${stdout}`);
                }
  
                //		if(stdout.includes("drive: <module-bluez5-device.c>")){
                if (stdout.includes("module-bluez5-device")) {
                    console.log("headphones found");
                } else {
                    console.log("headphones not found, connecting");
                    exec("bluetoothctl connect " + self.deviceID, (error, stdout, stderr) => {
                        if (error) {
                            console.log(`exec error: ${error.message}`);
                        }
                        if (stderr) {
                            console.log(`exec stderr: ${stderr}`);
                        }
                        console.log(`exec stdout ${stdout}`);
                    });
                }                  
            });          
        }

        deviceCheckAndConnect();
        setInterval(deviceCheckAndConnect, 10000);

    },

    test(){
        this.keepUp();
    },

    test2(){
        if(!this.active) return;

        if(!this.blue){ this.init();}


        var hasBluetooth=this.blue.checkBluetoothController();
        console.log('system has bluetooth controller:' + hasBluetooth);

        this.blue.on(this.blue.bluetoothEvents.Device, function (devices) {
            console.log('devices:' + JSON.stringify(devices,null,2))
            device = devices.filter((d)=> {return d.mac = this.deviceID})[0];
            console.log(device);
        });

        
        if(hasBluetooth) {
            let self = this;

            function waitForHeadphones(options, callback) {
                //    callback();
                    
                
                  // if there's a headphones_id set, then we need to try to connect to it manually here
                  if (self.deviceID) {
                    console.log("connected to headphones " + self.deviceID);
                    exec("bluetoothctl connect " + self.deviceID, (error, stdout, stderr) => {
                      if (error) {
                        console.log(`exec error: ${error.message}`);
                      }
                      if (stderr) {
                        console.log(`exec stderr: ${stderr}`);
                      }
                 //     console.log(`exec stdout ${stdout}`);
                    });
                  }
                
                  // this is where we might wait until we see a set of headphones connected before we start
                  exec("pacmd list-sinks", (error, stdout, stderr) => {
                    if (error) {
                      console.log(`exec error: ${error.message}`);
                    }
                    if (stderr) {
                      console.log(`exec stderr: ${stderr}`);
                    }
                    //		if(stdout.includes("drive: <module-bluez5-device.c>")){
                    if (stdout.includes("module-bluez5-device")) {
                
                      console.log("headphones found");
                      callback();
                    } else {
                      console.log("headphones not found");
                 //     console.log(`exec stdout ${stdout}`);
                      setTimeout(function () { waitForHeadphones(options, callback) }, 1000);
                    }
                  });          
                }

            waitForHeadphones({}, function(){
                console.log("^&^&^&^&^&^&^&^&^&^&&^&^&^&^ CONNECTED");
              //  self.blue.scan(false);                
            });
/*
            console.log('isBluetooth Ready:' + this.blue.isBluetoothReady);
            console.log(this.blue.info(this.deviceID));
            */
/*
            this.blue.scan(true);
            setTimeout(function(){
                console.log('stopping scan')
                self.blue.scan(false)
                console.log(self.blue.info(self.deviceID));
            },5000);
            */
        }
    },



}

exports.Bluetooth = Bluetooth;
