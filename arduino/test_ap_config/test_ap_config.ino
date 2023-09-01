// CONFIG WEBPAGE INCLUDES
#include <FS.h>                   //this needs to be first, or it all crashes and burns...
#include <WiFiManager.h>          //https://github.com/tzapu/WiFiManager
#ifdef ESP32
  #include <SPIFFS.h>
#endif
#include <ArduinoJson.h>          //https://github.com/bblanchon/ArduinoJson

// CONFIG WEBPAGE PINS
int resetButtonPin = A0;

////////////////// SETING UP CONFIG WEBPAGE - FOR WIFI AND OTHER VALUES
//define your default values here, if there are different values in config.json, they are overwritten.
// My values: (in addition to WIFI data)
// icanmusic_server_ip
// icanmusic_port
// this_device_name

char icanmusic_server_ip[40];
char icanmusic_port[6] = "7002";
char this_device_name[34] = "RENAME_ME";

//flag for saving data
bool shouldSaveConfig = false;

//callback notifying us of the need to save config
void saveConfigCallback () {
  Serial.println("Should save config");
  shouldSaveConfig = true;
}

void setup(){
  Serial.begin(115200);
  Serial.println();

  config_webpage_setup();
}

void config_webpage_setup() {
  // put your setup code here, to run once:


  pinMode(resetButtonPin, INPUT_PULLUP);
  bool configMode = false;
  if(digitalRead(resetButtonPin) == LOW){
    Serial.println("config Mode ON");
    configMode = true;
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
  //wifiManager.setTimeout(120);
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

  //read updated parameters
  strcpy(icanmusic_server_ip, custom_icanmusic_server_ip.getValue());
  strcpy(icanmusic_port, custom_icanmusic_port.getValue());
  strcpy(this_device_name, custom_this_device_name.getValue());
  Serial.println("The values in the file are: ");
  Serial.println("\ticanmusic_server_ip : " + String(icanmusic_server_ip));
  Serial.println("\ticanmusic_port : " + String(icanmusic_port));
  Serial.println("\tthis_device_name : " + String(this_device_name));




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
  }

  Serial.println("local ip");
  Serial.println(WiFi.localIP());
}

void loop() {
  // put your main code here, to run repeatedly:

}
