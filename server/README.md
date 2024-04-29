# Raspberry Pi Server

The Raspberry Pi Server does these things:

- Runs a WiFI access point which all devices can connect to, so an internet connection isn't needed

- Sends out Note List information to all the devices, so they play from the same selection of notes. This note list can come from a score that plays on its own, or from a web app where the use can trigger chord changes in real time

- Run a Web Server, which provides
  
  - score editing and playing interface
  
  - live chord change selection
  
  - control configuration of individual devices.

- Runs a local MIDI synth, which can play notes sent from networked devices, or can process raw sensor values from devices that can't create their own MIDI notes. These notes can be played from the Rpi's audio out, or through a bluetooth speaker

- Can send raw MIDI notes to hardware synths connected via USB->MIDI interfaces.



## RPI Setup

- Get a Pi. I use a Pi4, but you can probably use a pi 3



## install some basics

```
sudo apt update
sudo apt upgrade
sudo curl -fsSL https://deb.nodesource.com/setup_21.x  > nodeget.sh
chmod a+x nodeget.sh
sudo ./nodeget.sh
sudo apt-get install -y nodejs
sudo apt install git 

```



## PiJuice Setup

Do this only if you're using a PiJuice:

https://www.pishop.ca/product/pijuice-hat-a-portable-power-platform-for-every-raspberry-pi/

`sudo apt-get install pijuice-base`

## Install this Repo

with whatever mthod you use to clone repos, eg

` git clone https://github.com/donundeen/icanmusicprojects.git`

` cd icanmusicprojects/server`

`npm install`

### Setup up WIFI AP / Regular WIFI connect modes

following these instructions: **Following this: [Turn Your Raspberry Pi into an Access Point ](https://raspberrytips.com/access-point-setup-raspberry-pi/)**

```
sudo nmcli con add con-name hotspot ifname wlan0 type wifi ssid "icanmusic"
sudo nmcli con modify hotspot wifi-sec.key-mgmt wpa-psk
sudo nmcli con modify hotspot wifi-sec.psk "icanmusic"


```

Then I ran `nmtui` , which brings up an interface that lets me create a named connection to my local wifi.

**I ALSO changed the icanmusic AP to NOT use a password, since I couldn't get the arduinos to negotiate authentication. **



Then I ran

`nmcli con modify [YOUR LOCAL WIFI NAME] connection.interface-name wlan0`



To bring up the local wifi (access the internet):

```
nmcli con down hotspot
nmcli con up [YOUR LOCAL WIFI NAME]
```

To run as access point (no access to internet)

```
nmcli con down [YOUR LOCAL WIFI NAME]
nmcli con up hotspot
```



## Setup Fluidsynth

fluidsynth is the local midi synth, for playing midi notes through an audio out, or for piping midi to a connected hardware synth

`sudo apt install fluidsynth`

### get fluidsynth running with high priority:

I followed the instructions here: **[How do I configure my linux system to allow JACK to use realtime scheduling? | JACK Audio Connection Kit](https://jackaudio.org/faq/linux_rt_config.html)**  - even though I'm not using JACK

If your system has no directory called /etc/security/limits.d then you will need to edit /etc/security/limits.conf. If /etc/security/limits.d does exist on your machine, then you will need to create and edit a file called /etc/security/limits.d/audio.conf. The file must contain (at least) the following two lines:

```
@audio   -  rtprio     95

@audio   -  memlock    unlimited
```

restart after doing this stuff.



try running `node synthplayer.node.js` - you should hear sounds



## Setup Webserver

In server folder, run

`npm install`



## Run conductor.node.js

conductor.node.js is the main program that runs all the cool stuff. The file itself mostly glues together a bunch of modules, provides message routing between them and the networked devices and webpage, and gets things going. There's a lot of config values to check out, which you might need to edito foryour particular setup, in particular if you want to run it on different test environments, a mac laptop, etc.

`node conductor.node.js`

you might get errors about missing npm modules the first time you run in, wich cna probably be fixed by npm installing those modules.

## Access Web Interface

Connect your screen devices (laptop, tablet, etc) to the icanmusic wifi.

The web interface for controlling the score and the devices is at

`http://10.0.0.1:8002`





## Connect to Bluetooth Speakers

The rpi audio out is pretty crap, you'll get much better performance from bluetooth audio. Here's how to get it working.

**

`sudo apt-get install pulseaudio pulseaudio-module-bluetooth`

`sudo usermod -G bluetooth -a pi`

`sudo apt install mpg123`

**

run ```bluetoothctl```

in bluetoothctl, run:

`power on`
`agent on`
`default-agent`
`scan on`
Watch for the devices it finds. Take note of the bluetooth speaker you’re looking for
Might need to turn the headphones on and off again, to figure out which one it is
(you can use tab for auto-completion)
Below <dev> is the name of the device (usually a bunch of HEX characters like 20:45:CF:... etc
`pair <dev>`
`trust <dev>`
`connect <dev> `
`quit`

Then run `node synthplayer.node.js`  - you should hear some notes.
