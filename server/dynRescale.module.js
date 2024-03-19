const dynRescale = class{
    min = 100000;
    max = -10000;


    scale(inval, outmin, outmax){
        // do thje math
    }

    reset(){

    }

    float floatmap(in, inmin, inmax, outmin, outmax){
        // assume all values are 0-1
        float inrange = inmax - inmin;
        float outrange = outmax - outmin;
        float ratio = outrange / inrange;
        float inflat = in - inmin;
        float outflat = inflat * ratio;
        float out = outmin + outflat;
        return out;
      }

}

module.exports = dynRescale;