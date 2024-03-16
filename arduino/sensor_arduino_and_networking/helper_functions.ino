

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



float dyn_rescale(float inval, float *minVal, float *maxVal, float tomin, float tomax){
  char pbuf[100];
  if(inval < *minVal){
    *minVal = inval;
  }
  if(inval > *maxVal){
    *maxVal = inval;
  }

  float mapped = constrain(floatmap(inval, *minVal, *maxVal, tomin, tomax), tomin, tomax);
  sprintf(pbuf, "dyn: in:%f min:%f max:%f tomin:%f tomax:%f out:%f", inval, *minVal, *maxVal, tomin, tomax, mapped);
  Serial.println(pbuf);
  if(mapped == -1){

  }
  return mapped;
}

float floatmap(float in, float inmin, float inmax, float outmin, float outmax){
  // assume all values are 0-1
  float inrange = inmax - inmin;
  float outrange = outmax - outmin;
  float ratio = outrange / inrange;
  float inflat = in - inmin;
  float outflat = inflat * ratio;
  float out = outmin + outflat;
  return out;
}

// END HELPER FUNCTIONS
/////////////////////////
