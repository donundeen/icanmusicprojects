

//////////////////////////////////
// MUSIC PERFORMANCE FUNCTIONS

void setNotelist(int* newlist, int* curlist, int size){
  notelistlength = size;
  memcpy(curlist, newlist, sizeof(newlist[0])*size);
}

void setRoot(int root){
  rootMidi = root;
}

int noteFromFloat(double value, int min, int max){
  makeworkinglist(min, max);
  //Serial.print("note from value ");
  //Serial.println(value);
  //Serial.println(workinglistlength);
	int index = floor((double)workinglistlength * value);
  //Serial.println(index);
	int note  = workinglist[index];// % workingList.length]
  //Serial.println(note);
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
// END MUSIC PERFORMANCE FUNCTIONS
/////////////////////////////////





