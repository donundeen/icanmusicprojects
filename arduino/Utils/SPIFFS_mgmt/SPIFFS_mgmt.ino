#include "SPIFFS.h"
 
/*
If you change the structure of the config file in the arduino (eg adding variables), 
you'll need to delete the old one. 

To use this:
- run once and look at the name of the existing files
- uncomment the   SPIFFS.remove("/something.json"); line and change to the name of the file to remove
- run it again

*/

void listAllFiles(){
 
  File root = SPIFFS.open("/");
 
  File file = root.openNextFile();
 
  while(file){
 
      Serial.print("FILE: ");
      Serial.println(file.name());
 
      file = root.openNextFile();
  }
 
}
 
void setup() {
 
  Serial.begin(115200);
 
 
  if (!SPIFFS.begin(true)) {
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }
 

  
  File file = SPIFFS.open("/test.txt", FILE_WRITE);
 
  if (!file) {
    Serial.println("There was an error opening the file for writing");
    return;
  }
 
  if (file.print("some content")) {
    Serial.println("File was written");
  } else {
    Serial.println("File write failed");
  }
  
 
  file.close();
 


  Serial.println("\n\n---BEFORE REMOVING---");
  listAllFiles();
 
  SPIFFS.remove("/config.json");
  SPIFFS.remove("/test.txt");
 
  Serial.println("\n\n---AFTER REMOVING---");
  listAllFiles();
 
}
 
void loop() {}