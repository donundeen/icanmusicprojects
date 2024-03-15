///*************************
// Defining all the config values
// functions that are specific to different config values

/* make an array of defined vonfig vars, sorta like
["var1","int",
"var2", "string",
"var3", "intarray",
etc...]
*/

void routeConfigVal(OSCMessage &msg, int addrOffset ){
  Serial.println("configvar");
  char devroute[100];

  // one of these for each variable
  sprintf(devroute,"/%s/config/somevar",this_device_name);  
  msg.route(devroute, routeConfig_somevar);
}


// one of these for each variable
void routeConfig_somevar(OSCMessage &msg, int addrOffset ){
  route_int(msg, addrOffset, "somevar");
}


// don't change this part
void route_int(OSCMessage &msg, int addrOffset, String varname){
  int i = 0;
  //Serial.println(msg.getType(i));
  //Serial.println(msg.getFloat(i));
  int theval;
  while (msg.getType(i) == 'i'){
    //Serial.println(msg.getInt(i));
    //Serial.print(" ");
    theval = msg.getInt(i);
    Serial.println("got val");
    Serial.println(theval);
    setStoredConfigVal(varname,theval);
    i++;
  }
}
