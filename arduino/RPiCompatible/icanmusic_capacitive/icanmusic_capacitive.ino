
////////////////////////
// NETWORK INCLUDES
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
// END NETWORK INCLUDES
////////////////////////


// TIMING INCLUDES
#include <AsyncTimer.h> //https://github.com/Aasim-A/AsyncTimer
#include "uClock.h"
// END TIMING INCLUDES

////////////////////////
// CONFIG WEBPAGE INCLUDES
#include <FS.h>                   //this needs to be first, or it all crashes and burns...
#include <WiFiManager.h>          //https://github.com/tzapu/WiFiManager
#ifdef ESP32
  #include <SPIFFS.h>
#endif
#include <ArduinoJson.h>          //https://github.com/bblanchon/ArduinoJson
// END CONFIG WEBPAGE INCLUDES
////////////////////////


///////////////////////////
// DEVICE CONFIGS
#define sensorPin  A2 // Flex Sensor is connected to this pin

// sensor config vars - pins
// Just test touch pin - Touch0 is T0 which is on GPIO 4.
// using 32 - This is GPIO #32 and also an analog input A7 on ADC #1
int touchPin = 32; //15;


int SERIALBAUDRATE = 115200;

///////////////////////////////
// MUSIC PERFORMANCE VARIABLES
int notelist[127];
int notelistlength = 0;
int workinglist[127];
int workinglistlength = 0;
// END MUSIC PERFORMANCE VARIABLES
///////////////////////////


// if the device has a synth/speakers attached, set this to true
// if false, it will send a makenote message out over the netework,
// for the server to play.
boolean localSynth = false;

////////////////// SETING UP CONFIG WEBPAGE - FOR WIFI AND OTHER VALUES
//define your default values here, if there are different values in config.json, they are overwritten.
// My values: (in addition to WIFI data)
// icanmusic_server_ip
// icanmusic_port
// this_device_name

// wifi autoconnect code
// CONFIG WEBPAGE PINS AND VARS
int resetButtonPin = A0;

char icanmusic_server_ip[40] = "10.0.0.255";
char icanmusic_port[6] = "7005";
char this_device_name[34] = "RENAME_ME";
//flag for saving data
bool shouldSaveConfig = true;
/// END SETTING UP CONFIG WEBPAGE VARS
///////////////////////////


/////////////////////////////
// TIMING VARIABLES 
AsyncTimer t;



////////////////////////////////////////////
// NETWORK SPECIFIC VARS - SHOULDN'T CHANGE
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
OSCErrorCode error;



// END NETWORK-SPECIFIC VARS
//////////////////////////////////////////////////////////////////////////////



////////////////
// Define the number of pulses per beat
umodular::clock::uClockClass::PPQNResolution PPQNr = uClock.PPQN_96;
int PPQN = 96;

// number of pulses for different common note values.
int WN = PPQN * 4;
int HN = PPQN * 2;
int QN = PPQN;
int N8 = PPQN / 2;
int N16 = PPQN / 4;
int QN3 = HN / 3;
int HN3 = WN / 3;
int N83 = QN / 3;

// array of all notelengths, for picking
int notelengths[] = {WN, HN, HN3, QN, QN3, N8, N83, N16};

// END TIMING VARIABLES
////////////////////////


//////////////////////////////
/// NETWORK CONFIGS  
const boolean HARDCODE_SSID = false; //true; //false;

const char *WIFI_SSID = "icanmusic";// "icanmusic"; //"JJandJsKewlPad";
const char *WIFI_PASSWORD = "";//"icanmusic";//"icanmusic"; //"WeL0veLettuce";
char *UDPReceiverIP = "10.0.0.255"; // ip where UDP messages are going
char *presetip = "10.0.0.255"; // in case we just want to force it for testing
int UDPPort = 7005; // the UDP port that Max is listening on
int UDPINPort = 7004; // the UDP port that Max is listening on
// END NETWORK CONFIGS
////////////////////////

// NETWORK+SENSOR CONFIGS
const char *DEVICE_NAME = "flex1";
const char *DEVICE_ID_SUFFIX = "/val";
char DEVICE_ID[40] = "/";

// NO NETWORK MODE? for testing sensor without network
const bool no_network = false;


/////////// MIDI DEFINITIONS /////////////////////

//#define VS1053_GM1_OCARINA 81
#define VS1053_GM1_OCARINA 12 // change this for other sounds
// See http://www.vlsi.fi/fileadmin/datasheets/vs1053.pdf Pg 32 for more!
int midi_voice = 12; // see define_configs


///  END MIDI DEFINITIONS
/////////////////////////////////////////



///////////////////////////////
// MUSIC PERFORMANCE VARIABLES

// These might get changed at start, or during play
int rootMidi = 0;
int midimin = 32;  
int midimax = 100;
////// END MUSIC PERFORMANCE VARIABLES  
///////////////////////////////////////

//////////////////////////////
// CURVE VARIABLES

// initial velocity curve is a straight line, extra -1.0 variables are for when we want to make it longer
//float velocitycurve[] = {0., 0.0, 0., 1.0, 1.0, 0.0, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 };
float velocitycurve[] = {0., 0., 0., 1., 1., -0.65, 1., 1., -0.65, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 };
float velocitycurvelength = 6; 
String velocitycurvename = "curve_logup";

// a collection of useful curves:
float curve_str8up[]       = {0., 0., 0., 1., 1., 0.};
float curve_str8dn[]       = {0., 1., 0., 1., 0., 0.};
float curve_logup[]        = {0., 0., 0., 1., 1., -0.65};
float curve_logdn[]        = {0., 1., 0., 1., 0., -0.65}; // not sure if this is right
float curve_expup[]        = {0., 0., 0., 1., 1., 0.65};
float curve_expdn[]        = {0., 1., 0., 1., 0., 0.65}; // not sure if this is right
float curve_str8upthresh[] = {0., 0., 0., 0.05, 0., 0., 1., 1., 0.};
float curve_str8dnthresh[] = {0., 1., 0., 0.95, 0., 0., 1., 0., 0., 1., 0., 0.};
float curve_logupthresh[]  = {0., 0., 0., 0.05, 0., 0., 1., 1., -0.65};
float curve_logdnthresh[]  = {0., 1., 0., 0.95, 0., -0.65, 1., 0., -0.65};


/////////////////////////////
// TIMING VARIABLES 
int bpm = 120;

/////////////////////////////
// Sensor scaling variables
float minVal = 100000.0; 
float maxVal = -1.0;
float changeMin = 10000.0;
float changeMax = -1.0;

float elasticMinMaxScale = .005; // if true, then the min and max values used for dynamic scaling slowly come closer together, 
                                // so that a rate large value over time will get smoothed out
                                // set to 0 to disable

////////////////////////////////////
// SENSOR PROCESSING GLOBALS
int ADCRaw = -1;
float changerate = -1.0;
float prevChangeVal = -1.0;
int prevChangeTime = -1;


void reset_minmax(){
  minVal = 100000.0; 
  maxVal = -1.0;
  changeMin = 10000.0;
  changeMax = -1.0;
}


void sensor_setup(){
  pinMode(sensorPin, INPUT); // Sensor pin as input
  t.setInterval(sensor_loop, 10);
  sensor_loop();
//  t.setInterval(changerate_loop, 100);
  changerate_loop();
  note_loop();
}


void note_loop(){
  if(ADCRaw == -1){
    // sensor hasn't sensed yet, skip this
    return;
  }
  changerate_loop();
  char pbuf[100];
  sprintf(pbuf, "looppre: in:%d  min %f max %f", ADCRaw, minVal, maxVal);
//  Serial.println(pbuf);
  float value = dyn_rescale(ADCRaw, &minVal, &maxVal, 0.0, 1.0);
  sprintf(pbuf, "loop: in:%d scaled:%f min %f max %f", ADCRaw, value, minVal, maxVal);
//  Serial.println(pbuf);
  int midipitch    = derive_pitch(value);
  int midivelocity = derive_velocity(ADCRaw);
  int mididuration = derive_duration(value);
  sprintf(pbuf, "      in:%d scaled:%f p:%d v:%d d:%d", ADCRaw, value, midipitch, midivelocity, mididuration);
//  Serial.println(pbuf);
  // this will also make it monophonic:
  if(localSynth){
    midiMakeNote(midipitch, midivelocity, mididuration);
  }else{
    sendMakeNote(midipitch, midivelocity, mididuration);
  }
  t.setTimeout(note_loop, mididuration); // but changing the mididuration in this function could make notes overlap, so creeat space between notes. Or we make this a sensor-controlled variable as well
}

void sensor_loop(){

  // use capacative touchPin
  ADCRaw = touchRead(touchPin);
  //ADCRaw = analogRead(sensorPin);


  Serial.println("read value");
  Serial.println(ADCRaw);
  /*
  if(!no_network){
    sendOSCUDP(ADCRaw);
  }
  */
  // should be 10
  //delay(10); // removing when using timeouts
}


void changerate_loop(){
  changerate = get_changerate(ADCRaw);
}


float get_changerate(int ival){
  float val = (float)ival;
  char pbuf[100];
  int millisr = millis();

  if(prevChangeVal == -1){
    prevChangeVal = val;
    prevChangeTime = millisr;
    return 0;
  }

  float ochange = val - prevChangeVal;
  if(ochange == 0){
    return 0;
  }
  int millisd = millisr - prevChangeTime;
  ochange = abs(ochange);
  // divide the change amoutn by the timeframe, so chnages in shorter timeframes count for me.
  ochange = ochange / (float)millisd; 
  float change = dyn_rescale(ochange, &changeMin, &changeMax, 0, 1.0);

  // readjust changemin and max based on elasticMinMaxScale
  changeMin = changeMin + (changeMin * elasticMinMaxScale);
  changeMax = changeMax - (changeMax * elasticMinMaxScale);

 // Serial.println(pbuf);
  prevChangeVal = val;
  prevChangeTime = millisr;
  sprintf(pbuf, "changerate v: %.4f pv: %.4f oc:%.4f c:%.4f minc:%.4f maxc:%.4f", val, prevChangeVal, ochange, change, changeMin, changeMax);
  Serial.println(pbuf);
  return change;

}

int derive_pitch(float val){
  int pitch = noteFromFloat(val, midimin, midimax);
  return pitch;
}

int derive_velocity(int val){
  int velocity = floor(127.0 * functioncurve(changerate, velocitycurve, velocitycurvelength));
  return velocity;
}

int derive_duration(float val){
  return pulseToMS(N16);
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
  Serial.println("sending udp");
  Serial.println(UDPReceiverIP);
  Serial.println(UDPPort);
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

void udp_loop(){
  UDPListen();
}

void UDPListen(){
  OSCBundle bundleIN;
  int size;
 
  if( (size = udp.parsePacket())>0)
  {
    Serial.println("got UDP");
  // unsigned int outPort = Udp.remotePort();
    while(size--){
      byte b = udp.read();
//      bundleIN.fill(udp.read());
//      Serial.println(b);
      bundleIN.fill(b);
    }
    if(!bundleIN.hasError()){
      Serial.println("routing?");
      bundleIN.route("/all/notelist", routeNotelist);
      char devroute[100];
      sprintf(devroute,"/%s",this_device_name);
      bundleIN.route(devroute, routeDeviceMsg);
    }else{
      Serial.println("some error");
      Serial.println(bundleIN.getError());
    }
  }
}

// END UDP FUNCTIONS
/////////////////////////



/////////////////////////////
// SETUP AND LOOP FUNCTIONS
// calls other setup and loop functions
void setup() {
  delay(1000);
  
  Serial.begin(115200);

  if(!no_network){  
    network_setup();
  }

  midi_setup();
  clock_setup();
  test_setup();
  sensor_setup();
  config_setup();

  announceCreation();

}

void loop() {  
  // everything else should be handled as async calls
  if(!no_network){
    network_loop();
  }  
  udp_loop();
  t.handle();
//  sensor_loop(); // moving this into sensor_setup, with a setTimeout function to make the looping happen
}
// END SETUP AND LOOP FUNCTIONS
/////////////////////////////////





