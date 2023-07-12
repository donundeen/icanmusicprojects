/*
 * Libraries to install (include dependencies)
 * OSC
 * AutoConnect (see https://hieromon.github.io/AutoConnect/#installation)
 * 
 */


// NETWORK_LIBS
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

/// NETWORK CONFIGS  
const char *WIFI_SSID = "icanmusic";
const char *WIFI_PASSWORD = "icanmusic";
const char *UDPReceiverIP = "192.168.0.200"; // ip where UDP messages are going

/*
const char *WIFI_SSID = "Studio314";
const char *WIFI_PASSWORD = "!TIE2lacesWiFi";
const char * UDPReceiverIP = "172.30.142.113"; // ip where UDP messages are going 172.30.142.113
*/
//const char * UDPReceiverIP = "10.0.0.164"; // ip where UDP messages are going
//const char * UDPReceiverIP = "10.102.134.110"; // ip where UDP messages are going
//const char * UDPReceiverIP = "10.102.135.53"; // ip where UDP messages are going
//const char * UDPReceiverIP = "192.168.10.31"; // ip where UDP messages are going
//const char * UDPReceiverIP = "172.30.142.80"; // ip where UDP messages are going
//const char * UDPReceiverIP = "172.30.142.119"; // ip where UDP messages are going
//const char * UDPReceiverIP = "172.28.192.1"; // ip where UDP messages are going

/*
const char *WIFI_SSID = "JJandJsKewlPad";
const char *WIFI_PASSWORD = "WeL0veLettuce";
//const char * UDPReceiverIP = "10.0.0.164"; // ip where UDP messages are going
const char * UDPReceiverIP = "10.0.0.174"; // ip where UDP messages are going
*/

const int UDPPort = 7002; // the UDP port that Max is listening on

// NETWORK+SENSOR CONFIGS
const char *DEVICE_ID = "/flex1/val";

// NO NETWORK MODE? for testing sensor without network
const bool no_network = false;


// sensor config vars - pins
// one wire of flex: Ground
// one wire of flex: A0
// 22k Resistor btw power and A0
#define sensorPin  A2 // Flex Sensor is connected to this pin

////////////////////////////////////////////
// NETWORK SPECIFIC CODE - SHOULDN'T CHANGE
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
// END NETWORK-SPECIFIC VARS
//////////////////////////////////////////////////////////////////////////////



////////////////////////////////
// SENSOR code
void device_setup(){
  pinMode(sensorPin, INPUT); // Sensor pin as input

}

void device_loop(){
  int ADCRaw = analogRead(sensorPin);
//  Serial.print("sending data ");
//  Serial.println(ADCRaw);
  if(!no_network){
    sendOSCUDP(ADCRaw);
  }
  delay(10);
}

// NETWORK+SENSOR CODE
// sending data over OSC/UDP.
void sendOSCUDP(int flexVal){
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
  OSCMessage oscmsg(DEVICE_ID);  
  oscmsg.add(flexVal).add(ipbuffer);
  udp.beginPacket(UDPReceiverIP, UDPPort);
//  udp.write(buffer, msg.length()+1);
  oscmsg.send(udp);
  udp.endPacket();
  oscmsg.empty();
 }else{
  Serial.println("not sending udp, not connected");
 }

}


///////////////////////////////////////////////////
// BELOW HERE  SHOULD BE THE SAME FOR ALL DEVICES

void setup(){
  Serial.begin(9600);

  if(!no_network){
    network_setup();
  }
  device_setup();
}


void loop(){
  if(!no_network){
    network_loop();
  }
  device_loop();
}

void network_setup() {

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

}



void network_loop(){

  if(!HARDCODE_SSID){
    Portal.handleClient();
  }
  configUdp();
}



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
