
#include <AsyncTimer.h> //https://github.com/Aasim-A/AsyncTimer

#include "uClock.h"

// Solder closed jumper on bottom!

// See http://www.vlsi.fi/fileadmin/datasheets/vs1053.pdf Pg 31
#define VS1053_BANK_DEFAULT 0x00
#define VS1053_BANK_DRUMS1 0x78
#define VS1053_BANK_DRUMS2 0x7F
#define VS1053_BANK_MELODY 0x79

// See http://www.vlsi.fi/fileadmin/datasheets/vs1053.pdf Pg 32 for more!
//#define VS1053_GM1_OCARINA 81
#define VS1053_GM1_OCARINA 12

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

//notelist stuff
int notelist[127];
int notelistlength = 0;
int workinglist[127];
int workinglistlength = 0;
int rootMidi = 0;
int midimin = 6;
int midimax = 120;


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


void clocksetup(){
    // avaliable resolutions
  // [ uClock.PPQN_24, uClock.PPQN_48, uClock.PPQN_96, uClock.PPQN_384, uClock.PPQN_480, uClock.PPQN_960 ]
  // not mandatory to call, the default is 96PPQN if not set
  uClock.init();  
  uClock.setPPQN(PPQNr);
  uClock.setOnPPQN(onPPQNCallback);
  uClock.setOnClockStart(onClockStartCallback);
  uClock.setTempo(bpm);
  uClock.start();
  t.setInterval(triggerRandNote, pulseToMS(HN));
  t.setInterval(triggerRandNote, pulseToMS(QN3));
  t.setInterval(switchnotelist, pulseToMS(HN * 4));
}

void onPPQNCallback(uint32_t tick) {

} 

void onClockStartCallback(){
  Serial.println("clock start");
}

void triggerRandNote(){
  Serial.println("trigger");
  //int note = random(32,120);
  int note = noteFromFloat((double)random(1000) / (double)1000, 32, 100);
  midiMakeNote(note, 127, pulseToMS(QN));
}

void midiMakeNote(int pitch, int vel, int durationms){
  Serial.print("MKNOTE: ");
  Serial.print(pitch);
  Serial.print(" : ");
  Serial.print(vel);
  Serial.print(" : ");
  Serial.println(durationms);
  midiNoteOn(0, pitch, vel);
   
 // int innerpitch = pitch;
  t.setTimeout([pitch, vel]() {
    midiNoteOff(0, pitch, vel);
  }, durationms);
}

 
int notelist1[] = { 0, 3, 7, 12, 15, 19, 24, 27, 31, 36, 39, 43, 48, 51, 55, 60, 63, 67, 72, 75, 79, 84, 87, 91, 96, 99, 103, 108, 111, 115, 120, 123, 127 };
int notelist2[] = {  1, 5, 10, 13, 17, 22, 25, 29, 34, 37, 41, 46, 49, 53, 58, 61, 65, 70, 73, 77, 82, 85, 89, 94, 97, 101, 106, 109, 113, 118, 121, 125  };

void testsetup(){
  int newlen = sizeof(notelist1)/sizeof(int);
  setNotelist(notelist1, notelist, newlen);
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

void testloop(){

}

void setup() {
  delay(1000);
  
  Serial.begin(115200);

  Serial.println("VS1053 MIDI test");

  VS1053_MIDI.begin(31250); // MIDI uses a 'strange baud rate'
  
  midiSetChannelBank(0, VS1053_BANK_MELODY);
  midiSetChannelVolume(0, 127);
  midiSetInstrument(0, VS1053_GM1_OCARINA);

  clocksetup();
  testsetup();
}

void loop() {  
  

  t.handle();


}

void midiMakeNote(){

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



// Music Theory Things
void setNotelist(int* newlist, int* curlist, int size){
  notelistlength = size;
  memcpy(curlist, newlist, sizeof(newlist[0])*size);
}

void setRoot(int root){
  rootMidi = root;
}


int noteFromFloat(double value, int min, int max){
  makeworkinglist(min, max);
	int index = floor((double)workinglistlength * value);
  Serial.println(index);
	int note  = workinglist[index];// % workingList.length]
  Serial.println(note);
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

int indexOf(int value, int searcharray[], int length){
  for (int i = 0; i < length; i++) {
    if (searcharray[i] == value) {
      return i;
    }
  }
  return -1;
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