/**
 * Universe — a tilted two-armed spiral galaxy with the capsule as its nucleus. Logarithmic arms
 * (θ − k·ln ρ) turn slowly with dust lanes and star clumps, coloured gold at the core, cyan in
 * the disc and magenta at the rim; cyan/magenta nebulae drift at the edges over a two-depth
 * twinkling star field, and a small ringed planet orbits, lit by the core. On reveal the arms
 * unwind into place and grow outward from the nucleus.
 */
export const UNIVERSE_GLSL = /* glsl */ `
void universeFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.04;

  col += UNI_SEC * exp(-dd / 200.0) * 0.12 * aud * r;
  if (d > 540.0) return;
  float far = 1.0 - smoothstep(380.0, 540.0, d);
  float floorQ = (uCY - uFloorY) / uScale;      // floor line in base units
  float fy = q.y - floorQ;                      // < 0 on the floor surface
  float glass = smoothstep(0.0, 10.0, d);       // hidden behind the card
  float aboveFloor = smoothstep(-4.0, 8.0, fy);

  vec3 c = vec3(0.0);

  // ---- nebulae drifting at the edges ----
  vec2 nq = q * 0.0042 + vec2(t * 0.006, -t * 0.004);
  float neb = smoothstep(0.45, 0.85, fbm3(nq));
  vec3 nebCol = mix(NEBULA, UNI_CORE, smoothstep(0.35, 0.7, fbm3(nq * 1.7 + 9.0)));
  float nebEnv = smoothstep(100.0, 240.0, length(q * vec2(0.8, 1.0))) * far * aboveFloor;
  c += nebCol * neb * nebEnv * 0.07;

  // ---- background stars: two depths, twinkling ----
  float st = 0.0;
  for (int L = 0; L < 2; L++) {
    float fl = float(L);
    if (fl > 0.5 && uQuality < 0.3) break;
    float cs = mix(26.0, 15.0, fl);
    vec2 sp = q / cs + fl * 17.3 + vec2(t * 0.004 * (1.0 + fl), 0.0);
    vec2 si = floor(sp);
    vec2 sf = fract(sp) - 0.5;
    float h = hash21(si + fl * 7.0);
    vec2 o = (vec2(hash21(si + 3.1), hash21(si + 5.7)) - 0.5) * 0.7;
    vec2 dq = (sf - o) * cs;
    float tw = 0.6 + 0.4 * sin(t * mix(1.0, 3.0, h) + h * 50.0);
    float size = mix(0.6, 1.4, pow(hash21(si + 9.2), 3.0)) * (1.0 - fl * 0.35);
    st += step(0.55 + fl * 0.1, h) * exp(-dot(dq, dq) / (size * size)) * tw * mix(1.0, 0.55, fl);
  }
  c += mix(UNI_HI, UNI_CORE, 0.2) * st * glass * aboveFloor * far;

  // ---- the galaxy: tilted disc, two log-spiral arms ----
  vec2 g = rot2(0.32) * q;
  g.y /= 0.36;
  float rho = length(g);
  float th = atan(g.y, g.x);
  float spin = t * 0.045 + (1.0 - r) * 1.6;    // unwinds into place on reveal
  float ph = 2.0 * (th - 2.2 * log(max(rho, 1.0) / 40.0) - spin);
  float arm = pow(0.5 + 0.5 * cos(ph), 4.0);
  float dust = pow(0.5 + 0.5 * cos(ph - 0.9), 8.0);
  vec2 gc = rot2(-spin) * g;                    // co-rotating frame for the clumps
  float clump = 0.5 + 0.9 * fbm3(gc * 0.02);
  float grow = 1.0 - smoothstep(r * 480.0 - 60.0, r * 480.0, rho);
  float env = exp(-rho / 230.0) * smoothstep(20.0, 70.0, rho) * grow;
  vec3 gcol = mix(GALAXY_CORE, UNI_CORE, smoothstep(60.0, 220.0, rho));
  gcol = mix(gcol, NEBULA, smoothstep(220.0, 420.0, rho) * 0.6);
  vec3 gal = gcol * (arm * clump * 1.15 + 0.03) * env + GALAXY_CORE * exp(-rho / 110.0) * 0.22 * grow;
  gal *= 1.0 - dust * 0.8 * smoothstep(40.0, 90.0, rho);

  // young stars glinting along the arms
  if (uQuality > 0.3) {
    vec2 sp = q / 6.0 + 41.0;
    vec2 si = floor(sp);
    vec2 sf = fract(sp) - 0.5;
    float h = hash21(si);
    vec2 o = (vec2(hash21(si + 1.7), hash21(si + 8.3)) - 0.5) * 0.6;
    vec2 dq = (sf - o) * 6.0;
    float spark = step(0.8, h) * exp(-dot(dq, dq) / 0.8);
    gal += mix(UNI_HI, NEBULA, step(0.93, h)) * spark * arm * env * 2.2;
  }
  c += gal * glass * aboveFloor * far;
  c += GALAXY_CORE * exp(-dd / 70.0) * 0.3;     // nucleus light spilling around the card

  // ---- a small ringed planet orbiting the galaxy, lit by the core ----
  float pa = t * 0.12 + 1.0;
  vec2 pg = vec2(cos(pa), sin(pa)) * 300.0;
  vec2 pq = rot2(-0.32) * vec2(pg.x, pg.y * 0.36);
  vec2 pd = q - pq;
  float pl = length(pd);
  if (pl < 40.0) {
    float body = 1.0 - smoothstep(6.0, 7.2, pl);
    vec3 ldir = normalize(vec3(-pq, 80.0));
    vec3 nrm = vec3(pd / 7.0, sqrt(max(1.0 - dot(pd, pd) / 49.0, 0.0)));
    float lam = max(dot(nrm, ldir), 0.0);
    c += (UNI_SEC * 0.15 + GALAXY_CORE * lam * 0.9) * body * glass;
    vec2 rp = rot2(0.45) * pd;
    float re = length(rp * vec2(1.0, 3.2));
    c += UNI_HI * exp(-sq((re - 12.0) / 0.9)) * 0.35 * (1.0 - body * step(0.0, rp.y)) * glass;
    c += UNI_CORE * exp(-pl / 18.0) * 0.08 * glass;
  }

  // ---- rim, as on the other scenes ----
  float flick = 1.0 + 0.03 * sin(t * 1.2) + 0.02 * sin(t * 2.7 + 0.5);
  float inner = mix(1.0, 0.3, 1.0 - smoothstep(-24.0, 0.0, d));
  c += UNI_HI * exp(-dd / 2.3) * 1.5 * flick * inner;
  c += mix(UNI_HI, UNI_CORE, 0.5) * exp(-dd / 10.0) * 0.65 * flick * inner;
  c += UNI_SEC * exp(-dd / 44.0) * 0.35 * aud;

  col += c * r;
}
`;
