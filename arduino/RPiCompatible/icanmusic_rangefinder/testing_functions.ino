

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

// END TESTING FUNCTIONS
///////////////////////////////
