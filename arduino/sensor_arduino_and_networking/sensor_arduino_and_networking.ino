

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

//#define VS1053_GM1_OCARINA 81
#define VS1053_GM1_OCARINA 12 // change this for other sounds
// See http://www.vlsi.fi/fileadmin/datasheets/vs1053.pdf Pg 32 for more!

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
float velocitycurve[] = {0., 0.0, 0., 1.0, 1.0, 0.0, -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 , -1.0, -1.0 ,-1.0 };
float velocitycurvelength = 6; 


/////////////////////////////
// TIMING VARIABLES 
int bpm = 120;

/////////////////////////////
// Sensor scaling variables
float minVal = 100000.0; 
float maxVal = -1.0;


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





