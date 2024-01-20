#include <AsyncTimer.h> //https://github.com/Aasim-A/AsyncTimer

#include "uClock.h"


AsyncTimer t;

int bpm = 120;

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


void setup() {
  // put your setup code here, to run once:

  Serial.begin(9600);
  timersetup();
}

void timersetup(){
  uClock.init();  
  uClock.setPPQN(PPQNr);
  uClock.setOnPPQN(onPPQNCallback);
  uClock.setOnClockStart(onClockStartCallback);
  uClock.setTempo(bpm);
  uClock.start();
  t.setInterval(triggerRandNote, pulseToMS(HN));
  t.setInterval(triggerRandNote, pulseToMS(HN3));
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

void triggerRandNote(){
  Serial.println("trigger");
  int note = random(32,120);
  midiMakeNote(note, 127, pulseToMS(QN));
}

void midiMakeNote(int pitch, int vel, int durationms){
  Serial.print("MKNOTE: ");
  Serial.print(pitch);
  Serial.print(" : ");
  Serial.print(vel);
  Serial.print(" : ");
  Serial.println(durationms);
  midiNoteOn(pitch, vel);
 // int innerpitch = pitch;
  t.setTimeout([pitch]() {
     midiNoteOff(pitch);
  }, durationms);
}

void midiNoteOn(int pitch, int vel){
  Serial.print("NOTEON: ");
  Serial.print(pitch);
  Serial.print(" : ");
  Serial.println(vel);
}

void midiNoteOff(int pitch){
  Serial.print("NOTEOF: ");
  Serial.print(pitch);
  Serial.println(" : 0 ");
}

void onClockStartCallback(){
  Serial.println("clock start");
}

void onPPQNCallback(uint32_t tick) {
} 

void loop() {
  // put your main code here, to run repeatedly:
  t.handle();
}
