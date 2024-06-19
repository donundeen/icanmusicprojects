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
// int midimin
// int midimax

void config_setup(){
  midi_voice = getStoredConfigValInt("midi_voice");
  Serial.println("setting midi voice");
  Serial.println(midi_voice);
  midiSetInstrument(0, midi_voice);
}


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

  sprintf(devroute,"/%s/config/midimin",this_device_name);  
  msg.route(devroute, routeConfig_midimin);


  sprintf(devroute,"/%s/config/midimax",this_device_name);  
  msg.route(devroute, routeConfig_midimax);


  sprintf(devroute,"/%s/config/velocitycurve",this_device_name);  
  msg.route(devroute, routeConfig_velocitycurve);


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

void routeConfig_midimin(OSCMessage &msg, int addrOffset ){
  midimin = route_int(msg, addrOffset, "midimin");
  Serial.println("midimin");
  Serial.println(midimin);
}

void routeConfig_midimax(OSCMessage &msg, int addrOffset ){
  midimax = route_int(msg, addrOffset, "midimax");
  Serial.println("midimax");
  Serial.println(midimax);
}

void routeConfig_velocitycurve(OSCMessage &msg, int addrOffset ){
  velocitycurve = route_int(msg, addrOffset, "velocitycurve");
  Serial.println("midimax");
  Serial.println(midimax);
}



void routeConfig_reset(OSCMessage &msg, int addrOffset ){
  // getting the reset command is enough, no need to get the value
  Serial.println("********************resetting minmax");
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

int route_string(OSCMessage &msg, int addrOffset, String varname){
  int i = 0;
  //Serial.println(msg.getType(i));
  //Serial.println(msg.getFloat(i));
  int theval= -1;
  while (msg.getType(i) == 's'){
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