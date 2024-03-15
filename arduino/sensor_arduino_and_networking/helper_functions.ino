

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
