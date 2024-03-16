// TIMING INCLUDES
#include <AsyncTimer.h> //https://github.com/Aasim-A/AsyncTimer
#include "uClock.h"
// END TIMING INCLUDES

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



//////////////////////////////
/// NETWORK CONFIGS  
const char *WIFI_SSID = "JJandJsKewlPad";
const char *WIFI_PASSWORD = "WeL0veLettuce";
char *UDPReceiverIP = "10.0.0.174"; // ip where UDP messages are going
char *presetip = "10.0.0.174"; // in case we just want to force it for testing
int UDPPort = 7002; // the UDP port that Max is listening on
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
// Solder closed jumper on bottom!

//#define VS1053_GM1_OCARINA 81
#define VS1053_GM1_OCARINA 12 // change this for other sounds
// See http://www.vlsi.fi/fileadmin/datasheets/vs1053.pdf Pg 32 for more!

#define VS1053_BANK_DEFAULT 0x00
#define VS1053_BANK_DRUMS1 0x78
#define VS1053_BANK_DRUMS2 0x7F
#define VS1053_BANK_MELODY 0x79

#define MIDI_NOTE_ON  0x90
#define MIDI_NOTE_OFF 0x80
#define MIDI_CHAN_MSG 0xB0
#define MIDI_CHAN_BANK 0x00
#define MIDI_CHAN_VOLUME 0x07
#define MIDI_CHAN_PROGRAM 0xC0


#if defined(ESP8266) || defined(__AVR_ATmega328__) || defined(__AVR_ATmega328P__)
  #define VS1053_MIDI Serial
#else
  // anything else? use the hardware serial1 port
  #define VS1053_MIDI Serial1
#endif
///  END MIDI DEFINITIONS
/////////////////////////////////////////



///////////////////////////////
// MUSIC PERFORMANCE VARIABLES
int notelist[127];
int notelistlength = 0;
int workinglist[127];
int workinglistlength = 0;

// These might get changed at start, or during play
int rootMidi = 0;
int midimin = 32;  
int midimax = 100;
////// END MUSIC PERFORMANCE VARIABLES  
///////////////////////////////////////

//////////////////////////////
// CURVE VARIABLES

// initial velocity curve is a straight line, extra -1.0 variables are for when we want to make it longer
float velocitycurve[] = {0., 0.0, 0., 1.0, 1.0, 0.0, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 };
float velocitycurvelength = 6; 


/////////////////////////////
// TIMING VARIABLES 
AsyncTimer t;
int bpm = 120;

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

/////////////////////////////
// Sensor scaling variables
float minVal = 100000.0; 
float maxVal = -1.0;





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
OSCErrorCode error;

// wifi autoconnect code
// CONFIG WEBPAGE PINS AND VARS
int resetButtonPin = A0;

char icanmusic_server_ip[40] = "10.0.0.174";
char icanmusic_port[6] = "7002";
char this_device_name[34] = "RENAME_ME";
//flag for saving data
bool shouldSaveConfig = true;

// END NETWORK-SPECIFIC VARS
//////////////////////////////////////////////////////////////////////////////


////////////////////////////////////
// SENSOR PROCESSING FUNCTIONS
int ADCRaw = -1;
float changerate = -1.0;
float prevChangeVal = -1.0;
float changeMin = 10000.0;
float changeMax = -1.0;

void sensor_setup(){
  pinMode(sensorPin, INPUT); // Sensor pin as input
  t.setInterval(sensor_loop, 10);
  sensor_loop();
  note_loop();
}


void note_loop(){
  if(ADCRaw == -1){
    // sensor hasn't sensed yet, skip this
    return;
  }
  char pbuf[100];
  sprintf(pbuf, "looppre: in:%d  min %f max %f", ADCRaw, minVal, maxVal);
//  Serial.println(pbuf);
  float value = dyn_rescale(ADCRaw, &minVal, &maxVal, 0.0, 1.0);
  sprintf(pbuf, "loop: in:%d scaled:%f min %f max %f", ADCRaw, value, minVal, maxVal);
//  Serial.println(pbuf);
  int midipitch = derive_pitch(value);
  int midivelocity = derive_velocity(ADCRaw);
  int mididuration = derive_duration(value);
  sprintf(pbuf, "      in:%d scaled:%f p:%d v:%d d:%d", ADCRaw, value, midipitch, midivelocity, mididuration);
//  Serial.println(pbuf);
  // this will also make it monophonic:
  midiMakeNote(midipitch, midivelocity, mididuration);
  t.setTimeout(note_loop, mididuration); // but changing the mididuration in this function could make notes overlap, so creeat space between notes. Or we make this a sensor-controlled variable as well
}

void sensor_loop(){
  ADCRaw = analogRead(sensorPin);
  changerate = get_changerate(ADCRaw);
  /*
  if(!no_network){
    sendOSCUDP(ADCRaw);
  }
  */

  // should be 10
  //delay(10); // removing when using timeouts
}



float get_changerate(int val){
  char pbuf[100];
  if(prevChangeVal == -1){
    prevChangeVal = val;
    return 0;
  }
  float ochange = val - prevChangeVal;
  ochange = abs(ochange);
  float change = dyn_rescale(ochange, &changeMin, &changeMax, 0, 1.0);
  sprintf(pbuf, "changerate v: %d pv: %d oc:%d c:%d minc:%d maxc:%d", val, prevChangeVal, ochange, change, changeMin, changeMax);
 // Serial.println(pbuf);
  prevChangeVal = val;
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







//////////////////////////
// TIMING FUNCTIONS
void clock_setup(){
    // avaliable resolutions
  // [ uClock.PPQN_24, uClock.PPQN_48, uClock.PPQN_96, uClock.PPQN_384, uClock.PPQN_480, uClock.PPQN_960 ]
  // not mandatory to call, the default is 96PPQN if not set
  uClock.init();  
  uClock.setPPQN(PPQNr);
  uClock.setOnPPQN(onPPQNCallback);
  uClock.setOnClockStart(onClockStartCallback);
  uClock.setTempo(bpm);
  uClock.start();

}

void onPPQNCallback(uint32_t tick) {
} 

void onClockStartCallback(){
  Serial.println("clock start");
}
// END TIMING FUNCTIONS
//////////////////////////






////////////////////////////
// MIDI FUNCTIONS
void midi_setup(){
  VS1053_MIDI.begin(31250); // MIDI uses a 'strange baud rate'
  
  midiSetChannelBank(0, VS1053_BANK_MELODY);
  midiSetChannelVolume(0, 127);
  midiSetInstrument(0, VS1053_GM1_OCARINA);
}

// Makenote: pith, velocity, duration
void midiMakeNote(int pitch, int vel, int durationms){
  /*
  Serial.print("MKNOTE: ");
  Serial.print(pitch);
  Serial.print(" : ");
  Serial.print(vel);
  Serial.print(" : ");
  Serial.println(durationms);
  */
  midiNoteOn(0, pitch, vel);
   
 // int innerpitch = pitch;
  t.setTimeout([pitch, vel]() {
    midiNoteOff(0, pitch, vel);
  }, durationms);
}


void midiSetInstrument(uint8_t chan, uint8_t inst) {
  if (chan > 15) return;
  inst --; // page 32 has instruments starting with 1 not 0 :(
  if (inst > 127) return;
  
  VS1053_MIDI.write(MIDI_CHAN_PROGRAM | chan);  
  delay(10);
  VS1053_MIDI.write(inst);
  delay(10);
}

void midiSetChannelVolume(uint8_t chan, uint8_t vol) {
  if (chan > 15) return;
  if (vol > 127) return;
  
  VS1053_MIDI.write(MIDI_CHAN_MSG | chan);
  VS1053_MIDI.write(MIDI_CHAN_VOLUME);
  VS1053_MIDI.write(vol);
}

void midiSetChannelBank(uint8_t chan, uint8_t bank) {
  if (chan > 15) return;
  if (bank > 127) return;
  
  VS1053_MIDI.write(MIDI_CHAN_MSG | chan);
  VS1053_MIDI.write((uint8_t)MIDI_CHAN_BANK);
  VS1053_MIDI.write(bank);
}

void midiNoteOn(uint8_t chan, uint8_t n, uint8_t vel) {
  if (chan > 15) return;
  if (n > 127) return;
  if (vel > 127) return;
  
  VS1053_MIDI.write(MIDI_NOTE_ON | chan);
  VS1053_MIDI.write(n);
  VS1053_MIDI.write(vel);
}

void midiNoteOff(uint8_t chan, uint8_t n, uint8_t vel) {
  if (chan > 15) return;
  if (n > 127) return;
  if (vel > 127) return;
  
  VS1053_MIDI.write(MIDI_NOTE_OFF | chan);
  VS1053_MIDI.write(n);
  VS1053_MIDI.write(vel);
}
// END MIDI FUNCTIONS
//////////////////////////


/////////////////
// TESTING FUNCTIONS
int notelist1[] = { 0, 3, 7, 12, 15, 19, 24, 27, 31, 36, 39, 43, 48, 51, 55, 60, 63, 67, 72, 75, 79, 84, 87, 91, 96, 99, 103, 108, 111, 115, 120, 123, 127 };
int notelist2[] = {  1, 5, 10, 13, 17, 22, 25, 29, 34, 37, 41, 46, 49, 53, 58, 61, 65, 70, 73, 77, 82, 85, 89, 94, 97, 101, 106, 109, 113, 118, 121, 125  };

void test_setup(){
  int newlen = sizeof(notelist1)/sizeof(int);
  setNotelist(notelist1, notelist, newlen);
  /// This part just for testing
//  t.setInterval(triggerRandNote, pulseToMS(HN));
//  t.setInterval(triggerRandNote, pulseToMS(QN3));
//  t.setInterval(switchnotelist, pulseToMS(HN * 4));
 // t.setInterval(sendRandVal, pulseToMS(QN));
}

void triggerRandNote(){
//  Serial.println("triggerRandNote");
  //int note = random(32,120);
  int note = noteFromFloat((double)random(1000) / (double)1000, midimin, midimax);
  midiMakeNote(note, 127, pulseToMS(QN));
}

int notelisti = 0;
void switchnotelist(){
  notelisti++;
  if(notelisti % 2 == 0){
    int newlen = sizeof(notelist1)/sizeof(int);
    setNotelist(notelist1, notelist, newlen);
  }else{
    int newlen = sizeof(notelist2)/sizeof(int);
    setNotelist(notelist2, notelist, newlen);
  }
}

void sendRandVal(){
 // sendOSCUDP(random(4,1000));
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
      Serial.println("routing");
      bundleIN.route("/notelist", routeNotelist);
      char devroute[100];
      sprintf(devroute,"/%s",this_device_name);
      bundleIN.route(devroute, routeDeviceMsg);
    }else{
      Serial.println("some error");
      Serial.println(bundleIN.getError());
    }
  }
}

void routeDeviceMsg(OSCMessage &msg, int addrOffset ){
  Serial.println("devicemsg");
  char devroute[100];
  sprintf(devroute,"/%s/config",this_device_name);  
  msg.route(devroute, routeConfigVal);
}


void routeNotelist(OSCMessage &msg, int addrOffset ){
  Serial.println("notelist");

  int newnotelist[127];

  int i = 0;
  //Serial.println(msg.getType(i));
  //Serial.println(msg.getFloat(i));
  while (msg.getType(i) == 'i'){
    //Serial.println(msg.getInt(i));
    //Serial.print(" ");
    newnotelist[i] = msg.getInt(i);
    i++;
  }
  //Serial.println(" Setting ");
  //Serial.println(i);
  setNotelist(newnotelist, notelist, i);

}
// END TEST FUNCTIONS
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

  Serial.println("getting testvar");
  int val = getStoredConfigVal("testvar");
  Serial.println(val);
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



//////////////////////////////////
// MUSIC PERFORMANCE FUNCTIONS

void setNotelist(int* newlist, int* curlist, int size){
  notelistlength = size;
  memcpy(curlist, newlist, sizeof(newlist[0])*size);
}

void setRoot(int root){
  rootMidi = root;
}

int noteFromFloat(double value, int min, int max){
  makeworkinglist(min, max);
  //Serial.print("note from value ");
  //Serial.println(value);
  //Serial.println(workinglistlength);
	int index = floor((double)workinglistlength * value);
  //Serial.println(index);
	int note  = workinglist[index];// % workingList.length]
  //Serial.println(note);
  return note;
}

int fixedNoteFromFloat(float value, int min, int max){
// in a "fixed" setup, the same float value should result in the same midi note (octave may vary), regardless of scale
// - map the float across FULL range, from min to max
// - move resulting value DOWN to the closest note in the scale
  makeworkinglist(min, max);
	int range = max - min;
	int initial = min + floor(range * value);
	while(indexOf(initial, workinglist, workinglistlength) < 0){
		initial--;
	}
	return initial;
}

int getRootedBestNoteFromFloat(int value, int min, int max){
	// for a "rooted" scale/chord, expand the min and max so that both min and max are the root
	min = moveMinMax(rootMidi, min);
	max = moveMinMax(rootMidi, max);

	int note = noteFromFloat(value, min, max);
	if(!note){
		return false;
	}
	return note;
}

int moveMinMax(int root, int minmax){
	// for a "rooted" scale/chord, expand the min and max so that both min and max are the root
	//		maxApi.post("getChordNoteFromFloat "+labelid + ", " + value);
	//		maxApi.post(chordNoteSetMidi);
	int orig = minmax;
	int mindiff = (minmax % 12) - (root % 12);
	int minmove = abs(6 - mindiff);

	if(mindiff == 0){
		// do nothing
	}
  else if (mindiff < -6){
		mindiff = -12 - mindiff;
		minmax = minmax - mindiff;
		//big distance, go opposite way around
	}
  else if (mindiff < 0){
		// small different, go toward
		minmax = minmax - mindiff;
	}
  else if(mindiff < 6){
		minmax = minmax - mindiff;
	}
  else if (mindiff < 12){
		mindiff = 12 - mindiff;
		minmax = minmax + mindiff;
	}
	return minmax;

}


// Make a new array that's a subset of the notelist, with min and max values
void makeworkinglist(int minval, int maxval){
  int wi = -1;
  for(int i = 0; i < notelistlength; i ++){
    if(notelist[i] >= minval && notelist[i] <= maxval){
      wi++;
      workinglist[wi] = notelist[i];
    }
  }
  workinglistlength = wi + 1;
}
// END MUSIC PERFORMANCE FUNCTIONS
/////////////////////////////////





