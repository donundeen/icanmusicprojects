//////////////////////////
// DEFINE CONFIGS FILE
///*************************
// Defining all the config values
// functions that are specific to different config values

/* make an array of defined vonfig vars, sorta like
["var1","int",
"var2", "string",
"var3", "intarray",
etc...]
*/

//Variable List
//int midi_voice = 12;

void routeDeviceMsg(OSCMessage &msg, int addrOffset ){
  Serial.println("devicemsg");
  char devroute[100];
  sprintf(devroute, "/%s/config", this_device_name);  
  msg.route(devroute, routeConfigVal);
}


void routeConfigVal(OSCMessage &msg, int addrOffset ){
  Serial.println("configvar");
  char devroute[100];

  // one of these for each variable
  sprintf(devroute,"/%s/config/somevar",this_device_name);  
  msg.route(devroute, routeConfig_somevar);

  // midi_vocie
  sprintf(devroute,"/%s/config/midi_voice",this_device_name);  
  msg.route(devroute, routeConfig_midi_voice);

  // reset system (max/mins, etc)
  sprintf(devroute,"/%s/config/reset",this_device_name);  
  msg.route(devroute, routeConfig_reset);

}




// one of these for each variable
void routeConfig_somevar(OSCMessage &msg, int addrOffset ){
  route_int(msg, addrOffset, "somevar");
}

void routeConfig_midi_voice(OSCMessage &msg, int addrOffset ){
  midi_voice = route_int(msg, addrOffset, "midi_voice");
  Serial.println("midi voice");
  Serial.println(midi_voice);

  midiSetInstrument(0, midi_voice);
}


void routeConfig_reset(OSCMessage &msg, int addrOffset ){
  // getting the reset command is enough, no need to get the value
  Serial.println("resetting minmax");
  reset_minmax();
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


// don't change this part
int route_int(OSCMessage &msg, int addrOffset, String varname){
  int i = 0;
  //Serial.println(msg.getType(i));
  //Serial.println(msg.getFloat(i));
  int theval= -1;
  while (msg.getType(i) == 'i'){
    //Serial.println(msg.getInt(i));
    //Serial.print(" ");
    theval = msg.getInt(i);
    Serial.println("got val");
    Serial.println(theval);
    setStoredConfigVal(varname,theval);
    i++;
  }
  return theval;
}


// END DEFINE CONFIGS FILE
//////////////////////////