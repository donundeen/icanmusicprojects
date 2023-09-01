#include <SD.h>
#include <WiFi.h>
#include <WebServer.h>
using SDClass = fs::SDFS;
#define EXTERNAL_SWITCH_PIN A0

#include <AutoConnect.h>

WebServer Server;          // Replace with WebServer for ESP32
AutoConnect Portal(Server);


// In the declaration,
// Declare AutoConnectElements for the page asf /mqtt_setting
ACText(header, "<h2>MQTT broker settings</h2>", "text-align:center;color:#2f4f4f;padding:10px;");
ACText(caption, "Publishing the WiFi signal strength to MQTT channel. RSSI value of ESP8266 to the channel created on ThingSpeak", "font-family:serif;color:#4682b4;");
ACInput(mqttserver, "", "Server", "^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]*[a-zA-Z0-9])\\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\\-]*[A-Za-z0-9])$", "MQTT broker server");
ACInput(channelid, "", "Channel ID", "^[0-9]{6}$");
ACInput(userkey, "", "User Key");
ACInput(apikey, "", "API Key");
ACElement(newline, "<hr>");
ACCheckbox(uniqueid, "unique", "Use APID unique");
ACRadio(period, { "30 sec.", "60 sec.", "180 sec." }, "Update period", AC_Vertical, 1);
ACSubmit(save, "Start", "mqtt_save");
ACSubmit(discard, "Discard", "/");

// Declare the custom Web page as /mqtt_setting and contains the AutoConnectElements
AutoConnectAux mqtt_setting("/mqtt_setting", "MQTT Setting", true, {
  header,
  caption,
  mqttserver,
  channelid,
  userkey,
  apikey,
  newline,
  uniqueid,
  period,
  newline,
  save,
  discard
});

// Declare AutoConnectElements for the page as /mqtt_save
ACText(caption2, "<h4>Parameters available as:</h4>", "text-align:center;color:#2f4f4f;padding:10px;");
ACText(parameters);
ACSubmit(clear, "Clear channel", "/mqtt_clear");

// Declare the custom Web page as /mqtt_save and contains the AutoConnectElements
AutoConnectAux mqtt_save("/mqtt_save", "MQTT Setting", false, {
  caption2,
  parameters,
  clear
});


void setup() {
  delay(1000);
  Serial.begin(115200);
  Serial.println();

  Portal.join({ mqtt_setting, mqtt_save });
  Portal.begin();


  if (Portal.begin()) {
    Serial.println("WiFi connected: " + WiFi.localIP().toString());
  }
}

void loop() {
    Portal.handleClient();
}