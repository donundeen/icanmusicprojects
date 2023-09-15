/*********
  Rui Santos
  Complete project details at http://randomnerdtutorials.com  
*********/

// TCS230 or TCS3200 pins wiring to Arduino
#define S0 27
#define S1 33
#define S2 15
#define S3 32
#define sensorOut A2
/*
int S0 = 27;
int S1 = 33;
int S2 = 15;
int S3 = 32;
int OUT = A2;
*/ 

// Stores frequency read by the photodiodes
int redFrequency = 0;
int greenFrequency = 0;
int blueFrequency = 0;

int redlow = 29;
int redhigh = 80;
int greenlow = 53;
int greenhigh = 118;
int bluelow = 17;
int bluehigh = 125;

// Stores the red. green and blue colors
int redColor = 0;
int greenColor = 0;
int blueColor = 0;

void setup() {
  // Setting the outputs
  pinMode(S0, OUTPUT);
  pinMode(S1, OUTPUT);
  pinMode(S2, OUTPUT);
  pinMode(S3, OUTPUT);
  
  // Setting the sensorOut as an input
  pinMode(sensorOut, INPUT);
  
  // Setting frequency scaling to 20%
  digitalWrite(S0,HIGH);
  digitalWrite(S1,LOW);
  
   // Begins serial communication 
  Serial.begin(9600);
}
void loop() {
  // Setting RED (R) filtered photodiodes to be read
  digitalWrite(S2,LOW);
  digitalWrite(S3,LOW);
  
  // Reading the output frequency
  redFrequency = pulseIn(sensorOut, LOW);
  // Remaping the value of the RED (R) frequency from 0 to 255
  // You must replace with your own values. Here's an example: 
  // redColor = map(redFrequency, 70, 120, 255,0);
  redColor = map(redFrequency, redlow, redhigh, 255,0);


   // Printing the RED (R) value
  Serial.print("R = ");
  Serial.print(redFrequency);
  Serial.print("|");
  Serial.print(redColor);
  
  // Setting GREEN (G) filtered photodiodes to be read
  digitalWrite(S2,HIGH);
  digitalWrite(S3,HIGH);
  
  // Reading the output frequency
  greenFrequency = pulseIn(sensorOut, LOW);
  greenColor = map(greenFrequency, greenlow, greenhigh, 255, 0);

  // Printing the GREEN (G) value  
  Serial.print(" G = ");
  Serial.print(greenFrequency);
  Serial.print("|");
  Serial.print(greenColor);

 
  // Setting BLUE (B) filtered photodiodes to be read
  digitalWrite(S2,LOW);
  digitalWrite(S3,HIGH);
  
  // Reading the output frequency
  blueFrequency = pulseIn(sensorOut, LOW);
  blueColor = map(blueFrequency, bluelow, bluehigh, 255, 0);

  
  // Printing the BLUE (B) value 
  Serial.print(" B = ");
  Serial.print(blueFrequency);
  Serial.print("|");
  Serial.println(blueColor);

  double redf = float(redColor) / 255.0;
  double greenf = float(greenColor) / 255.0;
  double bluef = float(blueColor) / 255.0;
  double hsl[3];
  rgbToHsl(redf, greenf, bluef, hsl);
  Serial.print("H:" );
  Serial.print(hsl[0]);
  Serial.print(" S:" );
  Serial.print(hsl[1]);
  Serial.print(" L:" );
  Serial.println(hsl[2]);



  delay(1000);
}




/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
void rgbToHsl(double rd, double gd, double bd, double hsl[]) { 

    double max = threeway_max(rd, gd, bd);
    double min = threeway_min(rd, gd, bd);
    double h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        double d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max == rd) {
            h = (gd - bd) / d + (gd < bd ? 6 : 0);
        } else if (max == gd) {
            h = (bd - rd) / d + 2;
        } else if (max == bd) {
            h = (rd - gd) / d + 4;
        }
        h /= 6;
    }
    hsl[0] = h;
    hsl[1] = s;
    hsl[2] = l;
}


double threeway_max(double a, double b, double c) {
    return max(a, max(b, c));
}

double threeway_min(double a, double b, double c) {
    return min(a, min(b, c));
}
