// TIMING INCLUDES
#include <AsyncTimer.h> //https://github.com/Aasim-A/AsyncTimer
#include "uClock.h"
// END TIMING INCLUDES


/////////////////////////////
// TIMING VARIABLES 
AsyncTimer t;
int bpm = 120;

////////////////
// Define the number of pulses per beat
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

// array of all notelengths, for picking
int notelengths[] = {WN, HN, HN3, QN, QN3, N8, N83, N16};

// END TIMING VARIABLES
////////////////////////


//////////////////////////
// TIMING FUNCTIONS
void clock_setup(){
    // avaliable resolutions
  // [ uClock.PPQN_24, uClock.PPQN_48, uClock.PPQN_96, uClock.PPQN_384, uClock.PPQN_480, uClock.PPQN_960 ]
  // not mandatory to call, the default is 96PPQN if not set
  uClock.init();  
  uClock.setPPQN(PPQNr);
  uClock.setOnPPQN(onPPQNCallback);
  uClock.setOnClockStart(onClockStartCallback);
  uClock.setTempo(bpm);
  uClock.start();

}

void onPPQNCallback(uint32_t tick) {
} 

void onClockStartCallback(){
  Serial.println("clock start");
}
// END TIMING FUNCTIONS
//////////////////////////
