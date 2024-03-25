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
