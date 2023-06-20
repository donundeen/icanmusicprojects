//#include <SoftwareSerial.h> // Arduino issue: a library can't include other libraries, the sketch has to do this. Avoid by not using Arduino!
//#define PS_INCLUDE_SOFTWARESERIAL 0
#include <PingSerial.h>
#include <SoftwareSerial.h>


/*
 * Libraries to install (include dependencies)
 * OSC
 * AutoConnect (see https://hieromon.github.io/AutoConnect/#installation)
 * 
library :  https://github.com/stoduk/PingSerial
eg code from here: https://github.com/stoduk/PingSerial/blob/master/examples/PingSerialExample/PingSerialDistance.ino 
 Rangefinder demo: https://learn.adafruit.com/ultrasonic-sonar-distance-sensors
 */


// Here US-100 is connected to Serial, so we have debugging on a SoftwareSerial port (eg. connected to Bluetooth module or TTL-USB adaptor).
PingSerial us100(Serial, 650, 1200);  // Valid measurements are 650-1200mm
SoftwareSerial SerialDbg(4, 5);       // SoftwareSerial for debugging from this script (*not* 

bool ping_enabled = FALSE;
unsigned int pingSpeed = 100; // How frequently are we going to send out a ping (in milliseconds). 50ms would be 20 times a second.
unsigned long pingTimer = 0;     // Holds the next ping time.



/*
const char *WIFI_SSID = "Studio314";
const char *WIFI_PASSWORD = "!TIE2lacesWiFi";
//const char * UDPReceiverIP = "10.0.0.164"; // ip where UDP messages are going
const char * UDPReceiverIP = "10.102.134.110"; // ip where UDP messages are going
*/
const char *WIFI_SSID = "JJandJsKewlPad";
const char *WIFI_PASSWORD = "WeL0veLettuce";
//const char * UDPReceiverIP = "10.0.0.164"; // ip where UDP messages are going
const char * UDPReceiverIP = "10.0.0.174"; // ip where UDP messages are going
const int UDPPort = 9002; // the UDP port that Max is listening on



int touchPin = 15;


/*
 * Required libraries to install in the arduino IDE (use the Library Manager to find and install):
 * https://github.com/Hieromon/PageBuilder : PageBuilder
 * https://github.com/bblanchon/ArduinoJson : ArduinoJson
 * https://github.com/CNMAT/OSC : OSC
 * AutoConnect: https://hieromon.github.io/AutoConnect/index.html : instructions on how to install are here: 
 * follow the instructions under "Install the AutoConnect" if you can't just find it in the Library Manager
 */

// this is all the OSC libraries
#include <SLIPEncodedSerial.h>
#include <OSCData.h>
#include <OSCBundle.h>
#include <OSCBoards.h>
#include <OSCTiming.h>
#include <OSCMessage.h>
#include <OSCMatch.h>

// these the libraries for connecting to WiFi
// based on docs here: https://hieromon.github.io/AutoConnect/gettingstarted.html 
#include <WiFi.h>
#include <AutoConnect.h>
#include <WebServer.h>

/* 
 *  WIFI_MODE_ON set to true to send osc data over WIFI.
 *  When this is true: 
 *  -- if the arduino can't connect to wifi, it will create its own AP, named esp32_ap (pw 12345678)
 *  -- you'll need to connect to that SSID via your phone, and use the interface that pops up on your phone 
 *     to configure the SSID and PW of the router you want to connect to
 *  When WIFI_MODE_ON = false, you need the arduino connected to the laptop, 
 *  and it will send data over serial USB
 */
const boolean WIFI_MODE_ON = true;

/* if we aren't using the auto-configuration process, 
    and we want to hard-code the router's SSID and password here.
    Also set HARDCODE_SSID = true
*/
const boolean HARDCODE_SSID = true;

// remember you can't connect to 5G networks with the arduino. 



bool wifi_connected =false;

/*
 * Sometimes we need to delete the SSIDs that are stored in the config of the arduino.
 * Set this value to TRUE and rerun the arduino, to remove all the stored SSIDs 
 * (aka clear the configuration storage). 
 * Then set it badk to false to start saving new SSID/Passwords
 * 
 */
const boolean DELETE_SSIDS = false;

String thisperifitid = "";
String thisarduinomac = "";
String thishumanname = "";
String thisarduinoip = "";


//create UDP instance
WiFiUDP udp;

// wifi autoconnect code
WebServer Server;
AutoConnect      Portal(Server);
AutoConnectConfig  config;

OSCErrorCode error;


static boolean doConnect = false;


void rootPage() {
  char content[] = "Hello, world";
  Server.send(200, "text/plain", content);
}


void deleteAllCredentials(void) {
  Serial.println("deleting all stored SSID credentials");
  AutoConnectCredential credential2;
  boolean result;
  
  result = credential2.del((const char*)"GuestNet");
  Serial.println(result);

  station_config_t config2;
  uint8_t ent = credential2.entries();
  Serial.print("Num SSIDS: ");
  Serial.println(ent);

  while (ent--) {
    credential2.load((int8_t)0, &config2);
    Serial.println((const char*)&config2.ssid[0]);
    result = credential2.del((const char*)&config2.ssid[0]);
    Serial.println(result);
  }
}



// sending data over OSC/UDP.
void sendOSCUDP(int touchVal){
  /* egs
   *  '/perifit/1', valueInt1, valueInt2, device.name);
   *  28:ec:9a:14:2b:b3 l 180
      28:ec:9a:14:2b:b3 u 1391
   *  
   */
 if(WiFi.status() == WL_CONNECTED){   
  //send hello world to server
  char ipbuffer[20];
  thisarduinoip.toCharArray(ipbuffer, 20);
  OSCMessage oscmsg("/range1/val");  
  oscmsg.add(touchVal).add(ipbuffer);
  Serial.print("sending data ");
  Serial.println(touchVal);

  udp.beginPacket(UDPReceiverIP, UDPPort);
//  udp.write(buffer, msg.length()+1);
  oscmsg.send(udp);
  udp.endPacket();
  oscmsg.empty();
 }else{
  Serial.println("not sending udp, not connected");
 }


}

/*
 * connecting to UDP port on laptop runnin Max
 */
void configUdp(){
  if(WIFI_MODE_ON){
    if(!wifi_connected && WiFi.status() == WL_CONNECTED){
      Serial.println("HTTP server:" + WiFi.localIP().toString());
      thisarduinoip = WiFi.localIP().toString();
      Serial.println("SSID:" + WiFi.SSID());
      wifi_connected = true;
      udp.begin(UDPPort);
    }
    if(WiFi.status() != WL_CONNECTED){
      Serial.println("wifi not connected");
      wifi_connected = false;
    }
  }
}


void setup() {
//  Serial.begin(115200);
//  Serial.begin(9600);
  Serial.begin(38400);  
  delay(1000);
  Serial.println("setup");



  Serial.print("ESP Board MAC Address:  ");
  Serial.println(WiFi.macAddress());

  thisarduinomac = WiFi.macAddress();

  if(WIFI_MODE_ON){
    if(!DELETE_SSIDS){

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
        Server.on("/", rootPage);
        Serial.println("done with Server.on");  
        config.portalTimeout = 15000;  // It will time out in 15 seconds
        Portal.config(config);
        Portal.begin();
      }
    }else{
      deleteAllCredentials();
    }
  }
  
  /*if (Portal.begin()) {
    Serial.println();
    Serial.println("HTTP server:" + WiFi.localIP().toString());

    // setup UDP:
      udp.begin(UDPPort);
  }else{
    Serial.println("not portal.begin");
  }
  */
  sensor_setup();
}

void loop() {
  // put your main code here, to run repeatedly:
  // this handles the wifi config business:

  if(!HARDCODE_SSID){
    Portal.handleClient();
  }
  configUdp();


  sensor_loop();


  
 

  delay(10);
}


void sensor_setup(){
   us100.begin();
  SerialDbg.begin(9600);

}

void sensor_loop(){
  byte data_available;
  unsigned int current_height = 0;

  /*
   * Note: none of this code is blocking (no calls to delay() for example)
   * so your Arduino can do other things while measurements are being made.
   * Quite useful for any real world examples!
   */
  data_available = us100.data_available();

  if (data_available & DISTANCE) {
      current_height = us100.get_distance();
      SerialDbg.print("Distance: ");
      SerialDbg.println(current_height);
  }
  if (data_available & TEMPERATURE) {
      SerialDbg.print("Temperature: ");
      SerialDbg.println(us100.get_temperature());
  }
  
  if (ping_enabled && (millis() >= pingTimer)) {   // pingSpeed milliseconds since last ping, do another ping.
      pingTimer = millis() + pingSpeed;      // Set the next ping time.
      us100.request_distance();
  }

// sendOSCUDP(current_height );

}
