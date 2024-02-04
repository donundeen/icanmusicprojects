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
int minVal = 100000; 
int maxVal = -1;





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
int changerate = -1;
int prevChangeVal = -1;
int changeMin = 10000;
int changeMax = -1;

void sensor_setup(){
  pinMode(sensorPin, INPUT); // Sensor pin as input
  t.setInterval(sensor_loop, 10);
  note_loop();
}


void note_loop(){
  char pbuf[100];
  int value = dyn_rescale(ADCRaw, &minVal, &maxVal, 0, 10000);
  sprintf(pbuf, "loop: in:%d scaled:%d", ADCRaw, value);
  Serial.println(pbuf);
  int midipitch = derive_pitch(value);
  int midivelocity = derive_velocity(ADCRaw);
  int mididuration = derive_duration(value);
  sprintf(pbuf, "      in:%d scaled:%d p:%d v:%d d:%d", ADCRaw, value, midipitch, midivelocity, mididuration);
  Serial.println(pbuf);
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



int get_changerate(int val){
  char pbuf[100];
  if(prevChangeVal == -1){
    prevChangeVal = val;
    return 0;
  }
  int ochange = val - prevChangeVal;
  ochange = abs(ochange);
  int change = dyn_rescale(ochange, &changeMin, &changeMax, 0, 10000);
  sprintf(pbuf, "changerate v: %d pv: %d oc:%d c:%d minc:%d maxc:%d", val, prevChangeVal, ochange, change, changeMin, changeMax);
 // Serial.println(pbuf);
  prevChangeVal = val;
  return change;

}

int derive_pitch(int val){
  float fval = (float)val / 10000;
  int pitch = noteFromFloat(fval, midimin, midimax);
  return pitch;
}

int derive_velocity(int val){
  int velocity = floor(127.0 * ((float)changerate / 10000.0));
  return velocity;
}

int derive_duration(int val){
  return pulseToMS(N16);
}

int dyn_rescale(int inval, int *minVal, int *maxVal, int tomin, int tomax){
  char pbuf[100];
  if(inval < *minVal){
    *minVal = inval;
  }
  if(inval > *maxVal){
    *maxVal = inval;
  }

  int mapped = constrain(map(inval, *minVal, *maxVal, tomin, tomax), tomin, tomax);
  sprintf(pbuf, "dyn: in:%d min:%d max:%d tomin:%d tomax:%d out:%d", inval, *minVal, *maxVal, tomin, tomax, mapped);
//  Serial.println(pbuf);
  if(mapped == -1){

  }
  return mapped;
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
  // unsigned int outPort = Udp.remotePort();
    while(size--){
      byte b = udp.read();
//      bundleIN.fill(udp.read());
//      Serial.println(b);
      bundleIN.fill(b);
    }
    if(!bundleIN.hasError()){
//      Serial.println("routing");
      bundleIN.route("/notelist", routeNotelist);
    }else{
      Serial.println("some error");
      Serial.println(bundleIN.getError());
    }
  }
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



////////////////////
// HELPER FUNCTIONS
int indexOf(int value, int searcharray[], int length){
  for (int i = 0; i < length; i++) {
    if (searcharray[i] == value) {
      return i;
    }
  }
  return -1;
}

// get number of milliseconds for some number of pulses
int pulseToMS(int pulses){
  // pulses per beat = PPQN, or some other value
  // bpm = beats per minute
  // pulses per beat

  // a beat is how many seconds?
  // 120 bpm = .5 sec per beat | 60 / 120
  double secperbeat = (double)60 / (double)bpm;
  double secperpulse = secperbeat / (double)PPQN;
  double pulsems = secperpulse * pulses * 1000;
  return floor(pulsems); 
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



// END HELPER FUNCTIONS
/////////////////////////



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

void deleteAllCredentials(void) {
  Serial.println("deleting all stored SSID credentials");
  if (!SPIFFS.begin(true)) {
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }  
  SPIFFS.remove("/config.json");
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
// END NETWORKING FUNCTIONS
////////////////////////////////



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
  digiflash(BUILTIN_LED, 10, 100, LOW);


  //read updated parameters
  strcpy(icanmusic_server_ip, custom_icanmusic_server_ip.getValue());
  strcpy(icanmusic_port, custom_icanmusic_port.getValue());
  strcpy(this_device_name, custom_this_device_name.getValue());
  Serial.println("The values in the file are: ");
  Serial.println("\ticanmusic_server_ip : " + String(icanmusic_server_ip));
  Serial.println("\ticanmusic_port : " + String(icanmusic_port));
  Serial.println("\tthis_device_name : " + String(this_device_name));

  UDPReceiverIP = icanmusic_server_ip; // ip where UDP messages are going //presetip
  // just for testing:
  UDPReceiverIP = presetip;

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
    digiflash(BUILTIN_LED, 4, 250, LOW);
    //end save
  }

  Serial.println("local ip");
  Serial.println(WiFi.localIP());
}

// END SETUP CONFIG WEBPAGE FUNCTIONS
/////////////////////////////////////////







