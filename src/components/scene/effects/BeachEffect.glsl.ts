/**
 * Beach — sunlit shore. A horizon splits a warm sky from the deep-blue sea; a small sun rises
 * out of the water on reveal and lays a glitter path across perspective wave bands; waves wash
 * up a band of golden sand and draw back, leaving a lacy foam line; gold-lit wisps drift in the
 * sky and a few gulls glide past the sun.
 */
export const BEACH_GLSL = /* glsl */ `
// Gull silhouette: a flapping, shallow "M" around p (base units). Returns coverage.
float gull(vec2 q, vec2 p, float flap) {
  vec2 l = q - p;
  float ax = abs(l.x);
  if (ax > 9.0 || abs(l.y) > 6.0) return 0.0;
  float wing = ax * (0.55 - ax * 0.055) * flap;
  return exp(-sq((l.y - wing) / 0.7)) * (1.0 - smoothstep(7.5, 9.0, ax));
}

void beachFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.04;

  col += BEACH_SEC * exp(-dd / 190.0) * 0.08 * aud * r;
  if (d > 520.0) return;
  float far = 1.0 - smoothstep(360.0, 520.0, d);
  float floorQ = (uCY - uFloorY) / uScale;      // floor line in base units
  float fy = q.y - floorQ;                      // < 0 on the floor surface
  float glass = smoothstep(0.0, 10.0, d);       // hidden behind the card
  float hz = floorQ * 0.2;                      // horizon, a little below the pill centre
  float hy = q.y - hz;
  float lit = 0.3 + 0.9 * exp(-dd / 150.0);
  float spread = exp(-sq(q.x / 430.0)) * far;

  // the sun rises out of the sea during reveal
  vec2 sun = vec2(168.0, hz + mix(-30.0, 132.0, r));
  float sunUp = smoothstep(-20.0, 40.0, sun.y - hz);

  vec3 c = vec3(0.0);

  // ---- sky: warm band at the horizon, blue higher up, sun disc and glow ----
  if (hy > -2.0) {
    vec3 sky = GOLD * exp(-max(hy, 0.0) / 65.0) * 0.6 * (0.4 + 0.6 * sunUp)
             + BEACH_SEC * 0.025 * smoothstep(20.0, 260.0, hy);
    vec2 sd = q - sun;
    float ls = length(sd);
    float pulse = 1.0 + 0.05 * sin(t * 0.7) + uAudio * 0.05;
    sky += (SUN * exp(-ls / 50.0) * 0.65 + GOLD * exp(-ls / 170.0) * 0.4 + GOLD * exp(-ls / 380.0) * 0.12)
         * sunUp * pulse;
    // slowly turning sunbeams fanning out of the disc (periodic noise, no seam)
    vec2 dir = rot2(t * 0.025) * (sd / max(ls, 1e-3));
    float rays = pow(vnoise(dir * 4.0 + vec2(t * 0.05, -t * 0.04)), 2.6) * 1.3
               + pow(vnoise(dir * 11.0 + vec2(5.0 - t * 0.07, t * 0.09)), 3.5) * 0.9;
    float rayEnv = smoothstep(22.0, 34.0, ls) * exp(-ls / 210.0);
    sky += mix(GOLD, SUN, 0.55) * rays * rayEnv * 0.75 * sunUp * pulse;
    float disc = 1.0 - smoothstep(25.0, 27.0, ls);
    sky += mix(vec3(1.0, 0.8, 0.32), BEACH_HI, 0.45 * (1.0 - ls / 27.0)) * disc * 0.95;
    // gold-lit wisps
    if (hy > 40.0 && hy < 300.0) {
      float w = fbm3(vec2(q.x * 0.004 - t * 0.012, q.y * 0.02));
      float wisp = smoothstep(0.55, 0.8, w) * smoothstep(40.0, 90.0, hy) * (1.0 - smoothstep(200.0, 300.0, hy));
      sky += GOLD * wisp * (0.06 + 0.35 * exp(-length(q - sun) / 160.0));
    }
    // gulls cross in front of the sun glow
    float g = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float h = hash11(fi * 4.7 + 1.3);
      float x = mod(t * mix(9.0, 15.0, h) + h * 900.0, 1000.0) - 500.0;
      vec2 p = vec2(x, hz + mix(95.0, 175.0, h) + sin(t * 0.4 + fi * 2.0) * 7.0);
      g += gull(q, p, 0.55 + 0.45 * sin(t * mix(3.0, 4.2, h) + fi * 3.0));
    }
    sky *= 1.0 - min(g, 1.0) * 0.85;
    sky *= smoothstep(-2.0, 1.5, hy);
    c += sky * spread * glass;
  }

  // ---- shoreline: waves wash up the sand and draw back ----
  float k = fract(t / 7.5);
  float adv = smoothstep(0.0, 0.32, k) * (1.0 - smoothstep(0.32, 1.0, k));
  float edge = 40.0 - 32.0 * adv + (vnoise(vec2(q.x * 0.022, t * 0.18)) - 0.5) * 9.0;
  float edgeOld = edge + 9.0 + 6.0 * (1.0 - adv);

  // ---- sea: perspective wave bands, glitter path under the sun ----
  if (hy < 1.5 && fy > edge - 3.0) {
    float depth = max(hz - q.y, 0.0);          // 0 at the horizon, grows toward the shore
    float zz = 1.0 / (depth + 14.0);
    float s = fbm3(vec2(q.x * zz * 2.2, 260.0 * zz - t * 0.35));
    float crest = smoothstep(0.6, 0.78, s);
    vec3 sea = mix(BEACH_CORE * 0.3, BEACH_SEC * 0.22, smoothstep(0.0, 160.0, depth));
    sea += BEACH_HI * crest * 0.1;
    sea *= lit;

    float gx = q.x - sun.x;
    float path = exp(-sq(gx / (16.0 + depth * 0.6)));
    sea += GOLD * path * 0.4 * exp(-depth / 240.0) * sunUp;
    // warm sheen where the sun glow meets the water
    sea += GOLD * exp(-length((q - vec2(sun.x, hz)) * vec2(1.0, 2.6)) / 130.0) * 0.3 * sunUp;
    float cs = 2.2 + depth * 0.045;
    vec2 gp = vec2(q.x / cs, depth / (cs * 0.6) + t * 0.6);
    vec2 gi = floor(gp);
    vec2 gf = fract(gp) - 0.5;
    float hh = hash21(gi);
    float tw = pow(0.5 + 0.5 * sin(t * mix(4.0, 8.0, hh) + hh * 40.0), 6.0);
    float spark = step(0.72, hh) * exp(-dot(gf, gf) * 22.0) * tw;
    sea += mix(SUN, BEACH_HI, 0.3) * spark * (path * 2.4 + 0.1 * crest) * sunUp;

    // horizon seam
    sea += BEACH_HI * exp(-sq(hy / 1.4)) * 0.18;
    float seaMask = (1.0 - smoothstep(0.0, 1.5, hy)) * smoothstep(edge - 3.0, edge + 1.0, fy);
    c += sea * seaMask * spread * glass;
  }

  // ---- sand band, foam lace at the water's edge ----
  if (fy > -2.0 && fy < 60.0) {
    float sandMask = smoothstep(-2.0, 2.0, fy) * (1.0 - smoothstep(edge - 2.0, edge + 1.0, fy));
    float grain = hash21(floor(q * 1.3));
    vec3 sand = SAND * (0.3 + 0.08 * grain) * (0.6 + 0.6 * exp(-dd / 200.0));
    sand += SUN * step(0.985, grain) * 0.6;              // sun glints in the grains
    float wet = smoothstep(edge - 14.0, edge, fy) * (1.0 - adv);
    sand = mix(sand, sand * 0.6 + BEACH_SEC * 0.04, wet);
    c += sand * sandMask * spread * glass;

    float lace = 0.55 + 0.45 * vnoise(vec2(q.x * 0.09, t * 0.5));
    float foam = exp(-sq((fy - edge) / 1.8)) * lace
               + exp(-sq((fy - edgeOld) / 1.4)) * 0.35 * vnoise(vec2(q.x * 0.12 + 7.0, t * 0.3));
    c += BEACH_HI * foam * 0.55 * lit * spread * glass * smoothstep(-2.0, 2.0, fy);
  }

  // ---- rim, warm white with a blue under-glow ----
  float flick = 1.0 + 0.03 * sin(t * 1.3) + 0.02 * sin(t * 2.6 + 0.4);
  float inner = mix(1.0, 0.3, 1.0 - smoothstep(-24.0, 0.0, d));
  c += BEACH_HI * exp(-dd / 2.3) * 1.5 * flick * inner;
  c += mix(BEACH_HI, SUN, 0.5) * exp(-dd / 10.0) * 0.6 * flick * inner;
  c += BEACH_CORE * exp(-dd / 44.0) * 0.3 * aud;

  col += c * r;
}
`;
