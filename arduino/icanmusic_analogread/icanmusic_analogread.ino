// SENSOR LIBS
#include <SoftwareSerial.h>


// NETWORK_LIBS
/*
 * Required libraries to install in the arduino IDE (use the Library Manager to find and install):
 * https://github.com/bblanchon/ArduinoJson : ArduinoJson
 * https://github.com/CNMAT/OSC : OSC
 * https://github.com/tzapu/WiFiManager : WifiManager
 */
// this is all the OSC libraries
#include <SLIPEncodedSerial.h>
#include <OSCData.h>
#include <OSCBundle.h>
#include <OSCBoards.h>
#include <OSCTiming.h>
#include <OSCMessage.h>
#include <OSCMatch.h>
#include <WiFi.h>


// CONFIG WEBPAGE INCLUDES
#include <FS.h>                   //this needs to be first, or it all crashes and burns...
#include <WiFiManager.h>          //https://github.com/tzapu/WiFiManager
#ifdef ESP32
  #include <SPIFFS.h>
#endif
#include <ArduinoJson.h>          //https://github.com/bblanchon/ArduinoJson


const char *WIFI_SSID = "icanmusic";
const char *WIFI_PASSWORD = "icanmusic";
const char *UDPReceiverIP = "192.168.0.200"; // ip where UDP messages are going
int UDPPort = 7002; // the UDP port that Max is listening on


/*
const char *WIFI_SSID = "Studio314";
const char *WIFI_PASSWORD = "!TIE2lacesWiFi";
const char * UDPReceiverIP = "172.30.142.113"; // ip where UDP messages are going
*/
//const char * UDPReceiverIP = "10.0.0.164"; // ip where UDP messages are going
//const char * UDPReceiverIP = "10.102.134.110"; // ip where UDP messages are going
//const char * UDPReceiverIP = "10.102.135.53"; // ip where UDP messages are going
//const char * UDPReceiverIP = "192.168.10.31"; // ip where UDP messages are going
//172.30.142.76 172.30.142.113
//const char * UDPReceiverIP = "172.30.142.80"; // ip where UDP messages are going
//const char * UDPReceiverIP = "172.28.192.1"; // ip where UDP messages are going

/*
const char *WIFI_SSID = "JJandJsKewlPad";
const char *WIFI_PASSWORD = "WeL0veLettuce";
//const char * UDPReceiverIP = "10.0.0.164"; // ip where UDP messages are going
const char * UDPReceiverIP = "10.0.0.174"; // ip where UDP messages are going
*/


// NETWORK+SENSOR CONFIGS
const char *DEVICE_NAME = "analog1";
const char *DEVICE_ID_SUFFIX = "/val";
char DEVICE_ID[40] = "/";

// NO NETWORK MODE? for testing sensor without network
const bool no_network = false;


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
const boolean HARDCODE_SSID = false;
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
// CONFIG WEBPAGE PINS AND VARS
int resetButtonPin = A0;

char icanmusic_server_ip[40];
char icanmusic_port[6] = "7002";
char this_device_name[34] = "RENAME_ME";
//flag for saving data
bool shouldSaveConfig = false;

// END NETWORK-SPECIFIC VARS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////
// SENSOR code
 
// sensor config vars - pins
const int analogInPin = A0;  // Analog input pin that the potentiometer is attached to

void device_setup(){
//    US100Serial.begin(9600);
}

void device_loop() {
 
 
    delay(10);
 
    int sensorValue = analogRead(analogInPin);


    sendOSCUDP(sensorValue);
 /*
    US100Serial.flush(); 
    US100Serial.write(0x50); 
 
    delay(500);
    if(US100Serial.available() >= 1) 
    {
        temp = US100Serial.read();
        if((temp > 1) && (temp < 130)) // temprature is in range
        {
            temp -= 45; // correct 45º offset
            Serial.print("Temp: ");
            Serial.print(temp, DEC);
            Serial.println(" ºC.");
        }
    }
 
    delay(500);
    */
}



// NETWORK+SENSOR CODE
// sending data over OSC/UDP.
void sendOSCUDP(int analogread){ /* egs
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
  oscmsg.add(analogread).add(ipbuffer);

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
  Serial.println("starting");
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

void deleteAllCredentials(void) {
  Serial.println("deleting all stored SSID credentials");
  if (!SPIFFS.begin(true)) {
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }  
  SPIFFS.remove("/config.json");
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


////////////////// SETING UP CONFIG WEBPAGE - FOR WIFI AND OTHER VALUES
//define your default values here, if there are different values in config.json, they are overwritten.
// My values: (in addition to WIFI data)
// icanmusic_server_ip
// icanmusic_port
// this_device_name


//callback notifying us of the need to save config
void saveConfigCallback () {
  Serial.println("Should save config");
  shouldSaveConfig = true;
}


void config_webpage_setup() {
  // put your setup code here, to run once:

  pinMode(resetButtonPin, INPUT_PULLUP);
  bool configMode = false;
  if(digitalRead(resetButtonPin) == LOW){
    Serial.println("config Mode ON");
    digitalWrite(BUILTIN_LED, HIGH);
    configMode = true;
  }else{
    digitalWrite(BUILTIN_LED, LOW);
  }

  //clean FS, for testing
  //SPIFFS.format();

  //read configuration from FS json
  Serial.println("mounting FS...");

  if (SPIFFS.begin()) {
    Serial.println("mounted file system");
    if (SPIFFS.exists("/config.json")) {
      //file exists, reading and loading
      Serial.println("reading config file");
      File configFile = SPIFFS.open("/config.json", "r");
      if (configFile) {
        Serial.println("opened config file");
        size_t size = configFile.size();
        // Allocate a buffer to store contents of the file.
        std::unique_ptr<char[]> buf(new char[size]);

        configFile.readBytes(buf.get(), size);

 #if defined(ARDUINOJSON_VERSION_MAJOR) && ARDUINOJSON_VERSION_MAJOR >= 6
        DynamicJsonDocument json(1024);
        auto deserializeError = deserializeJson(json, buf.get());
        serializeJson(json, Serial);
        if ( ! deserializeError ) {
#else
        DynamicJsonBuffer jsonBuffer;
        JsonObject& json = jsonBuffer.parseObject(buf.get());
        json.printTo(Serial);
        if (json.success()) {
#endif
          Serial.println("\nparsed json");
          strcpy(icanmusic_server_ip, json["icanmusic_server_ip"]);
          strcpy(icanmusic_port, json["icanmusic_port"]);
          strcpy(this_device_name, json["this_device_name"]);
        } else {
          Serial.println("failed to load json config");
        }
        configFile.close();
      }
    }
  } else {
    Serial.println("failed to mount FS");
  }
  //end read

  // The extra parameters to be configured (can be either global or just in the setup)
  // After connecting, parameter.getValue() will get you the configured value
  // id/name placeholder/prompt default length
  WiFiManagerParameter custom_icanmusic_server_ip("server", "iCanMusic server IP", icanmusic_server_ip, 40);
  WiFiManagerParameter custom_icanmusic_port("port", "ICanMusic port", icanmusic_port, 6);
  WiFiManagerParameter custom_this_device_name("devicename", "Device Name", this_device_name, 32);

  //WiFiManager
  //Local intialization. Once its business is done, there is no need to keep it around
  WiFiManager wifiManager;

  //set config save notify callback
  wifiManager.setSaveConfigCallback(saveConfigCallback);

  //set static ip
  // don: I'd reather get a dynamic IP, don't need static for the devices
  //wifiManager.setSTAStaticIPConfig(IPAddress(10, 0, 1, 99), IPAddress(10, 0, 1, 1), IPAddress(255, 255, 255, 0));

  //add all your parameters here
  wifiManager.addParameter(&custom_icanmusic_server_ip);
  wifiManager.addParameter(&custom_icanmusic_port);
  wifiManager.addParameter(&custom_this_device_name);

  //reset settings - for testing
  // don: does this make the ap mode pop up? I don't want it to delete my settings though, just let me enter new ones
  //wifiManager.resetSettings();

  //set minimu quality of signal so it ignores AP's under that quality
  //defaults to 8%
  //wifiManager.setMinimumSignalQuality();

  //sets timeout until configuration portal gets turned off
  //useful to make it all retry or go to sleep
  //in seconds
  wifiManager.setTimeout(120);
  char* apname = this_device_name;
  //fetches ssid and pass and tries to connect
  //if it does not connect it starts an access point with the specified name
  //here  "AutoConnectAP"
  //and goes into a blocking loop awaiting configuration
  //  if (!wifiManager.autoConnect(apname, "password")) {
  // instead we fire this up if the button is pressed at startup
  wifiManager.setConfigPortalTimeout(120);

  if(configMode){
    if(!wifiManager.startConfigPortal(apname)){
      Serial.println("failed to connect and hit timeout");
      delay(3000);
      //reset and try again, or maybe put it to deep sleep
      ESP.restart();
      delay(5000);
    }
  }else{
    if(!wifiManager.autoConnect(apname)){
      Serial.println("failed to connect and hit timeout");
      delay(3000);
      //reset and try again, or maybe put it to deep sleep
      ESP.restart();
      delay(5000);
    }
  }
/* 
  if (!wifiManager.autoConnect(apname)) {
    Serial.println("failed to connect and hit timeout");
    delay(3000);
    //reset and try again, or maybe put it to deep sleep
    ESP.restart();
    delay(5000);
  }
*/
  //if you get here you have connected to the WiFi
  Serial.println("connected...yeey :)");
  digiflash(BUILTIN_LED, 10, 100, LOW);


  //read updated parameters
  strcpy(icanmusic_server_ip, custom_icanmusic_server_ip.getValue());
  strcpy(icanmusic_port, custom_icanmusic_port.getValue());
  strcpy(this_device_name, custom_this_device_name.getValue());
  Serial.println("The values in the file are: ");
  Serial.println("\ticanmusic_server_ip : " + String(icanmusic_server_ip));
  Serial.println("\ticanmusic_port : " + String(icanmusic_port));
  Serial.println("\tthis_device_name : " + String(this_device_name));

  UDPReceiverIP = icanmusic_server_ip; // ip where UDP messages are going
  UDPPort = atoi(icanmusic_port); // convert to int //  7002; // the UDP port that Max is listening on
  DEVICE_NAME = this_device_name;
  strcpy(DEVICE_ID, "/");
  strcat(DEVICE_ID, DEVICE_NAME);
  strcat(DEVICE_ID, DEVICE_ID_SUFFIX);

  Serial.print("\t UDPPort ");
  Serial.println(UDPPort);
  Serial.println("\tDEVICE_ID : " + String(DEVICE_ID));

  //save the custom parameters to FS
  if (shouldSaveConfig) {
    Serial.println("saving config");
 #if defined(ARDUINOJSON_VERSION_MAJOR) && ARDUINOJSON_VERSION_MAJOR >= 6
    DynamicJsonDocument json(1024);
#else
    DynamicJsonBuffer jsonBuffer;
    JsonObject& json = jsonBuffer.createObject();
#endif
    json["icanmusic_server_ip"] = icanmusic_server_ip;
    json["icanmusic_port"] = icanmusic_port;
    json["this_device_name"] = this_device_name;

    File configFile = SPIFFS.open("/config.json", "w");
    if (!configFile) {
      Serial.println("failed to open config file for writing");
    }

#if defined(ARDUINOJSON_VERSION_MAJOR) && ARDUINOJSON_VERSION_MAJOR >= 6
    serializeJson(json, Serial);
    serializeJson(json, configFile);
#else
    json.printTo(Serial);
    json.printTo(configFile);
#endif
    configFile.close();
    //end save
    digiflash(BUILTIN_LED, 4, 250, LOW);

  }

  Serial.println("local ip");
  Serial.println(WiFi.localIP());
}

void digiflash(int pin, int numflash, int delaytime, int endval){
  for(int i = 0; i< numflash; i++){
    digitalWrite(pin, HIGH);
    delay(delaytime);
    digitalWrite(pin, LOW);
    delay(delaytime);
  }
  digitalWrite(pin, endval);
}




