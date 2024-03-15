
//////////////////////////////////////
// CURVE FUNCTIONS


float functioncurve(float x, float curvelist[] , int length){
  // where is x in the curvelist?
  int xindex = 0;
  while(xindex < length){
    float curx = curvelist[xindex];
    float nextx = curvelist[xindex + 3];
    if(x >= curx && x <= nextx ){
      break;
    }
    xindex = xindex + 3;
  }
  float minx = curvelist[xindex];
  float maxx = curvelist[xindex + 3];
  float miny = curvelist[xindex+1];
  float maxy = curvelist[xindex + 4];
  float curve = curvelist[xindex + 5];
  if(x == minx){
    return miny;
  }
  if(x == maxx){
    return maxy;
  }
  return curvescale(x, minx, maxx, miny, maxy, curve);

}

float curvescale(float x , float inmin, float inmax, float outmin, float outmax, float curve ){
  // treat input and output like it's scaled 0-1, then do the curve on it, then scale back to the output scaling
  float inscaled = floatmap(x, inmin, inmax, 0.0, 1.0);
  float outscaled = inscaled;
  if(curve < 0){
    outscaled = logscale(inscaled, curve);
  }else if (curve > 0){
    outscaled = expscale(inscaled, curve);
  }
  outscaled = floatmap(outscaled, 0.0, 1.0, outmin, outmax);
  return outscaled;
}

float floatmap(float in, float inmin, float inmax, float outmin, float outmax){
  // assume all values are 0-1
  float inrange = inmax - inmin;
  float outrange = outmax - outmin;
  float ratio = outrange / inrange;
  float inflat = in - inmin;
  float outflat = inflat * ratio;
  float out = outmin + outflat;
  return out;
}

float e = 2.71828; 
float logscale(float x, float curve){
  // assume input is 0-1.0
  float innerpow = (1 / (1+curve)) - 1;
  float pow1 =  pow(e, -1 * x * innerpow) ;
  float pow2 = pow(e, -1 * innerpow);
  float y = (1 - pow1) / (1 - pow2 );  
  return y;
}

float expscale(float x, float curve){
  // assume input is 0-1.0
  float innerpow = (1 / (1-curve)) - 1;
  float pow1 =  pow(e, x * innerpow) ;
  float pow2 = pow(e, innerpow);
  float y = (1 - pow1) / (1 - pow2 );  
  return y;
}


