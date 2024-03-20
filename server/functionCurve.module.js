const functionCurve = class{

    curvelist = [0., 0.0, 0., 1.0, 1.0, 0.0];
    e = 2.71828; 

    constructor(curve){
        this.curvelist = curve;
    }

    mapvalue(x){
        // where is x in the curvelist?
        let xindex = 0;
        while(xindex < this.curvelist.length){
            let curx = this.curvelist[xindex];
            let nextx = this.curvelist[xindex + 3];
            if(x >= curx && x <= nextx ){
                break;
            }
            xindex = xindex + 3;
        }
        let minx = this.curvelist[xindex];
        let maxx = this.curvelist[xindex + 3];
        let miny = this.curvelist[xindex+1];
        let maxy = this.curvelist[xindex + 4];
        let curve = this.curvelist[xindex + 5];
        if(x == minx){
            return miny;
        }
        if(x == maxx){
            return maxy;
        }
        return this.curvescale(x, minx, maxx, miny, maxy, curve);
    }

    curvescale(x , inmin, inmax, outmin, outmax, curve ){
        // treat input and output like it's scaled 0-1, then do the curve on it, then scale back to the output scaling
        let inscaled = this.floatmap(x, inmin, inmax, 0.0, 1.0);
        let outscaled = inscaled;
        if(curve < 0){
          outscaled = this.logscale(inscaled, curve);
        }else if (curve > 0){
          outscaled = this.expscale(inscaled, curve);
        }
        outscaled = this.floatmap(outscaled, 0.0, 1.0, outmin, outmax);
        return outscaled;
    }
      
    floatmap(inval, inmin, inmax, outmin, outmax){
        // assume all values are 0-1
        let inrange = inmax - inmin;
        let outrange = outmax - outmin;
        let ratio = outrange / inrange;
        let inflat = inval - inmin;
        let outflat = inflat * ratio;
        let out = outmin + outflat;
        return out;
    }

    logscale(x, curve){
        // assume input is 0-1.0
        let innerpow = (1 / (1+ curve)) - 1;
        let pow1 =  Math.pow(e, -1 * x * innerpow) ;
        let pow2 = Math.pow(e, -1 * innerpow);
        let y = (1 - pow1) / (1 - pow2 );  
        return y;
    }

    expscale(x, curve){
        // assume input is 0-1.0
        let innerpow = (1 / (1-curve)) - 1;
        let pow1 =  pow(e, x * innerpow) ;
        let pow2 = pow(e, innerpow);
        let y = (1 - pow1) / (1 - pow2 );  
        return y;
      }
            

}

module.exports = functionCurve;