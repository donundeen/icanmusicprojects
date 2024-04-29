# ICanmusic

ICanMusic is an open-source hardware and software platform that simplifies the creation of electronic musical instruments from simple found materials and the performance of these instruments by groups of people with no prior musical or performance experience. All sensor input is piped through a system that ensures that the notes produced follow chord changes that can be controlled in real time or composed in advance, allowing integration with live instruments and rock/pop bands. An ICanMusic Jam Session brings participants together to explore the affordances of low-cost electronic sensors and consider how they can be combined with the materials on hand to create playful objects that generate sound when thrown, touched, bounced, shown colors, etc. These sensors, far from the techno-capitalist ideal of “perfect surveillance devices,” introduce their own noise, flutter and errors, which instead of being corrected, are drawn into dialogue with performers, influencing the aesthetics and acoustics of the performances. Entirely wireless, ICanMusic performances can happen anywhere, with any number of people, or even with entirely non-human participants. In a new media art world that privileges technical virtuosity, ICanMusic stubbornly asserts the importance of the amateur, the messy, the joyful. In short, ICanMusic epowers an entirely different approach to music making, giving everyone a chance to join the jam.

# Included in this repo:

- arduino code to integrate a variety of sensors, on the Arduino Feather ESP32 platform
- Max/MSP patches to control the arduino devices according to a preset-score, and/or a web page allowing real-time chord changes
- NodeJs server which re-implements all Max/MSP features on open-source software, capable of running on a raspberry Pi
- NEW: new arduino code implements the Music Maker (midi synth) Featherwing, so note logic and midi tone production happens on the arduino itself, through attached speakers.
- NEW: Intergration with Pareto Anywhere, allowing the use of Off-the-shelf bluetooth devices as input devices, with audio output through virtual devices running on the server. 

Complete installation instructions coming shortly.

# Live Performances and Media:

- "Paleta De Aguacate, an ICanMusic Performance", Morelia, Mexico:  https://www.youtube.com/watch?v=Ay2ICAsvL2w&t=2s&ab_channel=DonUndeen 



# In This Repo:

- **arduino**: Arduino files for running on Feather Huzzah ESP32 arduinos. 
  
  - **MaxCompatible**: arduino code for devices that just send thier raw values over UDP to a Max installation (in **PositionalJamAlphaBlast**). I've moved away from this approach to using the more open-source, RPi-based setup in **RPiCompatible**.
  
  - **RPiCompatible**: Arduino code for devices that take their sensor value, turn it into MIDI notes based on the supplied chord changes, and plays the notes using the attached MusicMaker featherwing. It ALSO can send the MIDI note as a makenote message over OSC/UDP, so that another computer could play it via an attached synth. This is useful if you don't have enough MusicMakers, or want to use fancier synths. There will be a sub-folder for each type of device
    
    - **icanmusic_capacitive**: The version of the device code for handling simple capacitive sensing, on pin 32.
      
      - Note, there are a bunch of files in here, but the only one that should change between types of devices is the one named the same as the folder. All other files should be the same between all devices.
  
  - **Utils:** Useful Utilities
    
    - **curveMaker.maxpat**: sometimes you want to finesse input values in arduino functions, so that an input value is mapped to an output with curve intead of a line, or even a series of curve segments. In this Max patch, you can draw the curve then dump a series of numbers that define the curve, then plug it into the arduino code. **TODO** Build a web interface for drawing curves, or at least selected from a set of pre-created curves.
    
    - **i2c_scanner.ino**:  When working with a bunch of different sensors, sometimes you need to see what i2c channels are in use. That's what this is for
    
    - **SPIFFS_mgmt:** The arduinos use SPIFFS for storing configuration values in non-volative memory. This arduino code helps manage that storage in case things get messy
  
  - **Tests**: Files I made to test things, and may want to refer to later.

- **server**: This is the 

- **PositionalJamAlphaBlast**: An implementation of this project that uses Max/MSP for most of the processing. In this setup, the devices simply send their raw values, and Max handles during those values into midi notes according to the chord changes, and sends MIDI values out. In this implmentation, the MIDI values are captured and played by Ableton; the ableton files are also in this folder. I've put aside this version in favor of the more open-source, wireless and headless version using the files in server and arduino folders instead. But there's lots of good stuff in here if you like working with Max.



## Hardware Used:

- Arduino Feather Case, with Battery Case: [Arduino Feather Cases](https://www.tinkercad.com/things/8DuQjJnMVJv-arduino-feather-cases) : this is only slightly modified from a case I found online, but I regret to say I can't remember where I got it and can't seem to find it now. Apologies to the original creator, and I'll update the credits once I find it.

- Adafruit HUZZAH32 ESP32 Feather Board: [Adafruit HUZZAH32 – ESP32 Feather ](https://www.adafruit.com/product/3405) 

- Adafruit Music Maker MP3 player and MIDI Synth: [Adafruit Music Maker](https://www.adafruit.com/product/3357) 

- Raspberry Pi 4 (but you can probably use other Pis)



# 
