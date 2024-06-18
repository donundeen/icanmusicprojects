let Bluetooth = {
    deviceID : "74:F0:F0:AB:D5:21",
    blue : false,
    active: false,



    init(){
        console.log("bluetooth init 1");

        if(!this.active) return;

        console.log("bluetooth init");
        this.blue = require("bluetoothctlwe");
        this.blue.Bluetooth();
    },


    test(){
        if(!this.active) return;

        if(!this.blue){ this.init();}



        this.blue.on(this.blue.bluetoothEvents.Controller, function(controllers){
            console.log('Controllers:' + JSON.stringify(controllers,null,2))
        });
            
        this.blue.on(this.blue.bluetoothEvents.DeviceSignalLevel, function(devices,mac,signal){
            console.log('signal level of:' + mac + ' - ' + signal)
        
        });
        
        this.blue.on(this.blue.bluetoothEvents.Device, function (devices) {
            console.log('devices:' + JSON.stringify(devices,null,2))
        })
        
        this.blue.on(this.blue.bluetoothEvents.PassKey, function (passkey) {
            console.log('Confirm passkey:' + passkey)
            blue.confirmPassKey(true);
        })
        
        var hasBluetooth=this.blue.checkBluetoothController();
        console.log('system has bluetooth controller:' + hasBluetooth)
        
        if(hasBluetooth) {
            let self = this;

            function waitForReady(callback){
                console.log('isBluetooth Ready:' + self.blue.isBluetoothReady);
                if(self.blue.isBluetoothReady){
                    callback();
                }
                setTimeout(waitForReady, 1000);
            }


            waitForReady(function(){
                console.log("trying connecting....")
                console.log(self.blue.info(self.deviceID));
                self.blue.connect(self.deviceID);
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
