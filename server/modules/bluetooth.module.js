let Bluetooth = {
    deviceID : "74:F0:F0:AB:D5:21",
    blue : false,
    active: false,



    constructor(){
        if(!this.active) return;

        this.blue = require("bluetoothctl");
        this.blue.Bluetooth();
    },


    test(){
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
            console.log('isBluetooth Ready:' + this.blue.isBluetoothReady)
            this.blue.scan(true)
            setTimeout(function(){
                console.log('stopping scan')
                this.blue.scan(false)
                this.blue.info('00:0C:8A:8C:D3:71')
            },20000)
        }
    }


}

exports.Bluetooth = Bluetooth;
