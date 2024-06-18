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


        var hasBluetooth=this.blue.checkBluetoothController();
        console.log('system has bluetooth controller:' + hasBluetooth)
        
        if(hasBluetooth) {
            let self = this;

            function waitForReady(callback){
                console.log('isBluetooth Ready:' + self.blue.isBluetoothReady);
                if(self.blue.isBluetoothReady){
                    callback();
                }
                setTimeout(function(){waitForReady(callback)}, 1000);
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
