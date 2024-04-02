







////////////////////////////////
// NETWORKING FUNCTIONS
void network_setup() {

  strcat(DEVICE_ID, DEVICE_NAME);
  strcat(DEVICE_ID, DEVICE_ID_SUFFIX);
  Serial.print("DEVICE_ID ");
  Serial.println(DEVICE_ID);
  delay(1000);
  Serial.println("setup");

  // for incoming UDP
//  SLIPSerial.begin(115200);
  pinMode(21, INPUT_PULLUP);

  pinMode(BUILTIN_LED, OUTPUT);

  Serial.print("ESP Board MAC Address:  ");
  Serial.println(WiFi.macAddress());

  thisarduinomac = WiFi.macAddress();

  if(WIFI_MODE_ON){
 
      // wifi config business

    if(HARDCODE_SSID){
      Serial.println("connecting to hardcoded SSID");
      Serial.println(WIFI_SSID);
      Serial.println(WIFI_PASSWORD);
      
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      while (WiFi.status() != WL_CONNECTED) {
        // wifi status codes: https://realglitch.com/2018/07/arduino-wifi-status-codes/
        delay(1000);
        Serial.print(".");
        Serial.print(WiFi.status());
        Serial.print(WL_CONNECTED);
      }
    }else{
      config_webpage_setup();
    }
  
  }
}


void network_loop(){

  if(!HARDCODE_SSID){
   // Portal.handleClient();
  }
  configUdp();
}



/*
 * connecting to UDP port on laptop runnin Max (or otherwise sending/recieving UDP data)
 */
void configUdp(){
  if(WIFI_MODE_ON){
    if(!wifi_connected && WiFi.status() == WL_CONNECTED){
      Serial.println("HTTP server:" + WiFi.localIP().toString());
      thisarduinoip = WiFi.localIP().toString();
      Serial.println("SSID:" + WiFi.SSID());
      wifi_connected = true;
      udp.begin(UDPINPort);
    }
    if(WiFi.status() != WL_CONNECTED){
      Serial.println("wifi not connected");
      wifi_connected = false;
    }
  }
}


///////////////////////////////
// functions to handle communication with the server/conductor

// send announce message over OSC when connected
void announceCreation(){
  if(WiFi.status() == WL_CONNECTED){   
    Serial.println("ANNOUNCING udp:::");
    Serial.println(UDPReceiverIP);
    Serial.println(UDPPort);
    Serial.println(DEVICE_ID);
    //send hello world to server
    char ipbuffer[20];
    thisarduinoip.toCharArray(ipbuffer, 20);
    Serial.println(ipbuffer);
    OSCMessage oscmsg("/announceUDPInstrument");  
    oscmsg.add(DEVICE_ID).add(ipbuffer);
 //   udp.beginPacket(UDPReceiverIP, UDPPort);
    udp.beginPacket(UDPReceiverIP, 7005);
 
   // udp.beginMulticastPacket(UDPReceiverIP, UDPPort, WiFi.localIP());
  //  udp.write(buffer, msg.length()+1);
    oscmsg.send(udp);
    udp.endPacket();
    oscmsg.empty();
  }else{
    Serial.println("not sending udp, not connected");
  }  
}







// END NETWORKING FUNCTIONS
////////////////////////////////





