/**
 * Morning — a pastel dawn. A large, soft sun rises behind the capsule on reveal so it peeks out
 * on both sides like a backlit halo; the sky washes from rose at the horizon to pale blue above;
 * thin layers of morning mist drift sideways across the sun, warmer where they pass in front of
 * it; a faint horizontal glint runs through the sun, dew motes rise and twinkle, and the rim
 * fades from gold at the bottom to sky blue at the top.
 */
export const MORNING_GLSL = /* glsl */ `
void morningFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.04;

  col += MORNING_SEC * exp(-dd / 210.0) * 0.07 * aud * r;
  if (d > 540.0) return;
  float far = 1.0 - smoothstep(380.0, 540.0, d);
  float floorQ = (uCY - uFloorY) / uScale;      // floor line in base units
  float fy = q.y - floorQ;                      // < 0 on the floor surface
  float glass = smoothstep(0.0, 10.0, d);       // hidden behind the card
  float aboveFloor = smoothstep(-4.0, 8.0, fy);
  float hz = floorQ + 36.0;                     // horizon, just above the floor
  float hy = q.y - hz;
  float above = smoothstep(-5.0, 5.0, hy);
  float spread = exp(-sq(q.x / 430.0)) * far;

  vec3 c = vec3(0.0);

  // ---- sky: rose at the horizon → peach → pale blue higher up ----
  vec3 sky = mix(MORNING_SEC, MORNING_CORE, smoothstep(0.0, 110.0, hy));
  sky = mix(sky, MORNING_SKY, smoothstep(90.0, 380.0, hy));
  c += sky * spread * exp(-max(hy, 0.0) / 380.0) * 0.12 * above;

  // ---- the sun, rising behind the capsule ----
  vec2 sun = vec2(0.0, hz + mix(-60.0, 66.0, r));
  float sr = 148.0;
  float ds = length(q - sun);
  float edge = max(ds - sr, 0.0);
  float disc = 1.0 - smoothstep(sr - 7.0, sr + 2.0, ds);
  vec3 sunCol = mix(MORNING_HI, MORNING_CORE, smoothstep(0.0, sr, ds));
  sunCol = mix(sunCol, MORNING_SEC, smoothstep(sr * 0.6, sr, ds) * 0.35);
  c += sunCol * disc * 0.24 * above;
  c += MORNING_CORE * exp(-edge / 46.0) * 0.22 * above * far;
  c += MORNING_SEC * exp(-edge / 190.0) * 0.1 * far;

  // faint horizontal glint through the sun (morning haze)
  float gy = q.y - sun.y - 14.0;
  float glint = exp(-sq(gy / 2.0)) * 0.3 + exp(-sq(gy / 16.0)) * 0.08;
  c += mix(MORNING_HI, MORNING_GOLD, 0.4) * glint * exp(-sq(q.x / 230.0)) * above * far;

  // ---- drifting layers of mist ----
  vec3 mist = vec3(0.0);
  float layers = 3.0 + 2.0 * step(0.3, uQuality);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    if (fi >= layers) break;
    float h1 = hash11(fi * 3.1 + 1.0);
    float by = hz + 14.0 + fi * 50.0 + sin(t * 0.08 + fi * 1.7) * 5.0;
    float th = mix(7.0, 16.0, h1);
    float yy = (q.y - by) / th;
    if (abs(yy) > 3.0) continue;
    float dir = mod(fi, 2.0) * 2.0 - 1.0;
    float nz = fbm3(vec2(q.x / 150.0 + t * (0.018 + 0.008 * fi) * dir, fi * 4.3 + q.y / 90.0));
    float band = exp(-yy * yy) * smoothstep(0.32, 0.72, nz);
    vec3 mc = mix(MORNING_SEC, MORNING_SKY, fi / 4.0 * 0.7);
    mc = mix(mc, MORNING_HI, exp(-edge / 90.0) * 0.8);   // lit where it crosses the sun
    mist += mc * band * (0.6 - fi * 0.07);
  }
  c += mist * 0.3 * spread * glass * aboveFloor * smoothstep(0.1, 0.6, r);

  // ---- dew motes rising from the floor ----
  float dew = 0.0;
  float count = 8.0 + 8.0 * uQuality;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    if (fi >= count) break;
    float h1 = hash11(fi * 3.71 + 0.4);
    float h2 = hash11(fi * 5.13 + 1.9);
    float h3 = hash11(fi * 7.37 + 3.3);
    float life = mix(9.0, 15.0, h1);
    float k = fract(t / life + h2);
    float side = h3 > 0.5 ? 1.0 : -1.0;
    vec2 p = vec2(side * mix(120.0, 340.0, fract(h3 * 7.1)) + sin(k * 5.0 + h1 * 6.0) * 14.0,
                  floorQ + 10.0 + k * mix(200.0, 360.0, h2));
    float dist = length(q - p);
    if (dist > 14.0) continue;
    float m = exp(-sq(dist / 1.5)) + exp(-sq(dist / 5.0)) * 0.22;
    float tw = 0.6 + 0.4 * sin(t * (2.0 + h3 * 3.0) + h1 * TAU);
    dew += m * sin(k * PI) * tw;
  }
  c += mix(MORNING_HI, MORNING_GOLD, 0.3) * dew * 0.9 * glass;

  // ---- rim: white-hot edge, gold at the bottom fading to sky blue at the top ----
  vec3 rimCol = mix(MORNING_GOLD, MORNING_SKY, smoothstep(-150.0, 150.0, q.y));
  rimCol = mix(rimCol, MORNING_SEC, 0.25 * exp(-sq(q.y / 90.0)));
  float flick = 1.0 + 0.03 * sin(t * 1.3) + 0.02 * sin(t * 2.2 + 0.9);
  float inner = mix(1.0, 0.3, 1.0 - smoothstep(-24.0, 0.0, d));
  c += MORNING_HI * exp(-dd / 2.3) * 1.45 * flick * inner;
  c += mix(MORNING_HI, rimCol, 0.65) * exp(-dd / 10.0) * 0.75 * flick * inner;
  c += rimCol * exp(-dd / 44.0) * 0.3 * aud;

  col += c * r;
}
`;
