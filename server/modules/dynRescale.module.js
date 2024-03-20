const dynRescale = class{
    min = false;
    max = false;


    scale(inval, outmin, outmax){
        // do thje math
        if(this.min === false || inval < this.min){
            this.min = inval;
        }
        if(this.max === false || inval > this.max){
            this.max = inval;
        }
        mapped
    }

    reset(){
        this.min = false;
        this.max = false;

    }

    constrain(inval, min, max){
        if(inval < min){
            inval = min;
        }
        if(inval > max){
            inval = max;
        }
    }

    floatmap(inval, inmin, inmax, outmin, outmax){
        // assume all values are 0-1
        inrange = inmax - inmin;
        outrange = outmax - outmin;
        ratio = outrange / inrange;
        inflat = inval - inmin;
        outflat = inflat * ratio;
        out = outmin + outflat;
        return out;
      }

}

module.exports = dynRescale;