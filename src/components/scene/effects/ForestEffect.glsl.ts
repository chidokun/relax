/**
 * Forest — deep-green woodland at first light. Two parallax rows of trunks stand in the haze
 * either side of a clearing around the capsule (the far row softened by mist, the near row
 * almost black with a lit inner edge), a leafy canopy lets light shafts slant down through
 * its gaps with dust glinting in them, fireflies drift and blink, a few leaves tumble down,
 * and moss mist creeps along the floor. On reveal the shafts reach down from the canopy and
 * the fireflies wake one by one.
 */
export const FOREST_GLSL = /* glsl */ `
// One parallax row of trunks. Returns (coverage, back-lit edge facing the capsule).
vec2 trunkRow(vec2 q, float cellW, float wMin, float wMax, float ox, float seed, float fy, float t) {
  float sx = q.x + ox;
  float ci = floor(sx / cellW);
  float h1 = hash11(ci * 1.93 + seed);
  float h2 = hash11(ci * 3.71 + seed * 2.3);
  float present = step(0.28, h1);
  float w = mix(wMin, wMax, h2) * (1.0 + 0.6 * exp(-max(fy, 0.0) / 16.0));   // root flare
  float lean = sin(t * 0.23 + h1 * 6.3) * 2.2 * smoothstep(0.0, 500.0, fy);  // rooted sway
  float xc = (ci + 0.5 + (h1 - 0.5) * 0.4) * cellW + lean;
  float dx = sx - xc;
  float aa = max(0.7 / (uScale * uPx), 0.35);
  float cov = present * (1.0 - smoothstep(w - aa, w + aa, abs(dx)));
  float facing = step(0.0, -dx * sign(xc - ox));
  float rim = present * exp(-sq((abs(dx) - w + 1.0) / 1.3)) * facing;
  return vec2(cov, rim);
}

void forestFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.04;

  col += FOREST_SEC * exp(-dd / 190.0) * 0.12 * aud * r;
  if (d > 500.0) return;
  float far = 1.0 - smoothstep(340.0, 500.0, d);
  float floorQ = (uCY - uFloorY) / uScale;      // floor line in base units
  float fy = q.y - floorQ;                      // < 0 on the floor surface
  float glass = smoothstep(0.0, 10.0, d);       // hidden behind the card
  float aboveFloor = smoothstep(-4.0, 6.0, fy);

  vec3 c = vec3(0.0);

  // ---- air: green haze lit by the capsule ----
  vec3 air = FOREST_SEC * (0.02 + 0.2 * exp(-dd / 130.0)) * aboveFloor;

  // ---- canopy: leaf mass with bright gaps up top ----
  float canopyY = smoothstep(140.0, 330.0, q.y);
  float leaf = 0.0;
  if (q.y > 110.0) {
    vec2 cp = q * vec2(0.011, 0.015) + vec2(sin(t * 0.19) * 0.10 + t * 0.012, sin(t * 0.13) * 0.05);
    leaf = smoothstep(0.42, 0.62, fbm3(cp));
    float gaps = (1.0 - leaf) * canopyY * exp(-sq(q.x / 360.0));
    air += (FOREST_HI * 0.03 + FOREST_CORE * 0.09) * gaps;
  }

  // ---- light shafts slanting down from the canopy gaps ----
  float sx = q.x + q.y * 0.38;                  // constant along a shaft
  float shafts = pow(vnoise(vec2(sx * 0.02, t * 0.06)), 2.5) * 1.4
               + pow(vnoise(vec2(sx * 0.055 + 13.0, t * 0.11)), 3.0) * 0.6;
  float depth = 330.0 - q.y;                    // distance travelled from the canopy
  float reach = mix(-40.0, 640.0, r);           // shafts reach down during reveal
  float shaftEnv = smoothstep(-20.0, 60.0, depth) * exp(-max(depth, 0.0) / 430.0)
                 * (1.0 - smoothstep(reach - 140.0, reach, depth))
                 * exp(-sq((q.x - 40.0) / 360.0)) * aboveFloor;
  float beam = shafts * shaftEnv;
  air += mix(FOREST_SEC, FOREST_HI, 0.3) * beam * 0.26 * glass;

  // ---- trunks: far row softened by the mist, near row nearly black ----
  if (fy > -4.0) {
    float ax = abs(q.x);
    float fadeTop = 1.0 - smoothstep(260.0, 420.0, q.y);
    vec2 tf = trunkRow(q, 46.0, 2.4, 5.5, 7.0, 3.0, fy, t);
    vec2 tn = trunkRow(q, 82.0, 6.0, 12.0, 19.0, 11.0, fy, t);
    float mf = smoothstep(128.0, 172.0, ax) * aboveFloor * fadeTop;
    float mn = smoothstep(168.0, 220.0, ax) * aboveFloor * fadeTop;
    air *= 1.0 - tf.x * mf * 0.55;
    air *= 1.0 - tn.x * mn * 0.92;
    c += FOREST_CORE * tn.y * mn * (0.05 + 0.5 * exp(-dd / 140.0) + beam * 0.4);
  }
  air *= 1.0 - leaf * canopyY * 0.75;
  c += air * far;

  // ---- dust glinting inside the shafts ----
  if (uQuality > 0.3 && beam > 0.01) {
    vec2 gp = (q + vec2(t * 4.0, t * 6.5)) / 14.0;
    vec2 gi = floor(gp);
    vec2 gf = fract(gp) - 0.5;
    float hh = hash21(gi);
    vec2 off = (vec2(hash21(gi + 7.1), hash21(gi + 3.3)) - 0.5) * 0.6
             + 0.12 * vec2(sin(t * 0.7 + hh * 6.0), cos(t * 0.5 + hh * 4.0));
    vec2 dq = (gf - off) * 14.0;
    float speck = exp(-dot(dq, dq) / 1.2) * step(0.7, hh);
    c += FOREST_HI * speck * beam * 1.6 * glass;
  }

  // ---- fireflies: wandering, slow blinks, waking one by one on reveal ----
  float ff = 0.0;
  float count = 10.0 + 14.0 * uQuality;
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    if (fi >= count) break;
    float h1 = hash11(fi * 3.17 + 0.3);
    float h2 = hash11(fi * 1.91 + 4.1);
    float h3 = hash11(fi * 7.43 + 2.7);
    float side = h3 > 0.5 ? 1.0 : -1.0;
    vec2 home = vec2(side * mix(118.0, 360.0, h1), mix(floorQ + 16.0, 220.0, h2 * h2));
    vec2 p = home + vec2(sin(t * mix(0.13, 0.29, h3) + h1 * 9.0) * 34.0 + sin(t * 0.51 + h2 * 5.0) * 8.0,
                         sin(t * mix(0.17, 0.33, h1) + h3 * 7.0) * 18.0);
    float blink = smoothstep(0.45, 1.0, sin(t * mix(0.6, 1.3, h2) + h1 * 40.0));
    blink = blink * blink + 0.05;
    float appear = smoothstep(h3 * 0.6, h3 * 0.6 + 0.35, r);
    vec2 dq = q - p;
    float d2 = dot(dq, dq);
    ff += (exp(-d2 / 2.2) * 1.6 + exp(-d2 / 90.0) * 0.2) * blink * appear;
  }
  c += FIREFLY * ff * glass * aud;

  // ---- a few leaves tumbling down ----
  float leaves = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 5.31 + 0.9);
    float h2 = hash11(fi * 2.47 + 6.2);
    float life = mix(10.0, 16.0, h1);
    float k = fract(t / life + h2);
    vec2 lc = vec2((h1 - 0.5) * 560.0 + sin(k * 9.0 + h2 * 6.0) * 30.0, mix(320.0, floorQ + 3.0, k));
    float spin = t * mix(1.2, 2.4, h2) + fi;
    vec2 lp = rot2(spin * 0.4 + sin(k * 7.0)) * (q - lc);
    float flip = abs(cos(spin));
    lp.y /= max(flip, 0.18);
    float shape = exp(-sq(lp.x / 5.0) - sq(lp.y / 2.2));
    float fade = smoothstep(0.0, 0.06, k) * (1.0 - smoothstep(0.93, 1.0, k));
    leaves += shape * fade * (0.45 + 0.55 * flip);
  }
  c += mix(FOREST_CORE, FIREFLY, 0.35) * leaves * (0.3 + 0.9 * exp(-dd / 140.0)) * glass * r;

  // ---- moss mist creeping along the floor ----
  if (fy > -10.0 && fy < 140.0) {
    float m = fbm3(vec2(q.x * 0.005 + t * 0.03, fy * 0.014 - t * 0.008));
    c += FOREST_SEC * smoothstep(0.3, 0.8, m) * exp(-max(fy, 0.0) / 50.0) * smoothstep(-10.0, 6.0, fy)
       * exp(-sq(q.x / 340.0)) * 0.2;
  }

  // ---- rim, as on the other scenes ----
  float flick = 1.0 + 0.03 * sin(t * 0.9) + 0.02 * sin(t * 2.1 + 1.3);
  float inner = mix(1.0, 0.3, 1.0 - smoothstep(-24.0, 0.0, d));
  c += FOREST_HI * exp(-dd / 2.3) * 1.5 * flick * inner;
  c += mix(FOREST_HI, FOREST_CORE, 0.5) * exp(-dd / 10.0) * 0.65 * flick * inner;
  c += FOREST_CORE * exp(-dd / 44.0) * 0.3 * aud;

  col += c * r;
}
`;
