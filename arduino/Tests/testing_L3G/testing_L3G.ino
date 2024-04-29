/*
The sensor outputs provided by the library are the raw 16-bit values
obtained by concatenating the 8-bit high and low gyro data registers.
They can be converted to units of dps (degrees per second) using the
conversion factors specified in the datasheet for your particular
device and full scale setting (gain).

Example: An L3GD20H gives a gyro X axis reading of 345 with its
default full scale setting of +/- 245 dps. The So specification
in the L3GD20H datasheet (page 10) states a conversion factor of 8.75
mdps/LSB (least significant bit) at this FS setting, so the raw
reading of 345 corresponds to 345 * 8.75 = 3020 mdps = 3.02 dps.
*/

#include <Wire.h>
#include <L3G.h>

L3G gyro;

void setup() {
  Serial.begin(9600);
  Wire.begin();



  if (!gyro.init()) // (device_4200D, device_D20, device_D20H, or device_auto) 
  {
    Serial.println("Failed to autodetect gyro type!");
    while (1);
  }

  Serial.print("device type: ");
  Serial.println(gyro.getDeviceType());
  //Serial.println(gyro.deviceType.device_D20);
  gyro.enableDefault();
}

void loop() {
  gyro.read();

//  Serial.print("G ");
//  Serial.print("X: ");
  Serial.print((int)gyro.g.x);
//  Serial.print("\t Y: ");
  Serial.print(", ");
  Serial.print((int)gyro.g.y);
//  Serial.print("\t Z: ");
  Serial.print(", ");
  Serial.println((int)gyro.g.z);

  delay(100);
}
