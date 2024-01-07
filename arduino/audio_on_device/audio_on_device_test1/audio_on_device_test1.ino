
// Solder closed jumper on bottom!

// See http://www.vlsi.fi/fileadmin/datasheets/vs1053.pdf Pg 31
#define VS1053_BANK_DEFAULT 0x00
#define VS1053_BANK_DRUMS1 0x78
#define VS1053_BANK_DRUMS2 0x7F
#define VS1053_BANK_MELODY 0x79

// See http://www.vlsi.fi/fileadmin/datasheets/vs1053.pdf Pg 32 for more!
#define VS1053_GM1_OCARINA 81

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



void testsetup(){
  int notelist1[] = { 0, 3, 7, 12, 15, 19, 24, 27, 31, 36, 39, 43, 48, 51, 55, 60, 63, 67, 72, 75, 79, 84, 87, 91, 96, 99, 103, 108, 111, 115, 120, 123, 127 };
  int newlen = sizeof(notelist1)/sizeof(int);
  setNotelist(notelist1, notelist, newlen);
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

  testsetup();
}

void loop() {  
  /*
  for (uint8_t i=60; i<69; i++) {
    midiNoteOn(0, i, 127);
    delay(100);
    midiNoteOff(0, i, 127);
  }
  */
  testloop();

  delay(1000);
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


void setNotelist(int* newlist, int* curlist, int size){
  notelistlength = size;
  memcpy(curlist, newlist, sizeof(newlist[0])*size);
}

void setRoot(int root){
  rootMidi = root;
}


int noteFromFloat(float value, int min, int max){
  makeworkinglist(min, max);
	int index = floor(workinglistlength * value);
	int note  = workinglist[index];// % workingList.length];
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
