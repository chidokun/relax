/**
 * Dream — a slow breathing guide for falling asleep. The light around the capsule swells on a 4.5 s inhale,
 * holds, and settles on a 6 s exhale (≈5.5 breaths/min) while a soft ring travels out and back
 * with it. Pillowy clouds drift along the floor and across the top with lit crowns, large dim
 * bokeh motes rise very slowly, and a small crescent moon hangs among a few faint stars.
 * Everything is low-contrast and the slowest-moving of all the scenes.
 */
export const DREAM_GLSL = /* glsl */ `
// 0 → 1 → 0 breath: 4.5 s in, 0.5 s hold, 6 s out.
float breath(float t) {
  float bt = mod(t, 11.0);
  if (bt < 4.5) return smoothstep(0.0, 4.5, bt);
  if (bt < 5.0) return 1.0;
  return 1.0 - smoothstep(5.0, 11.0, bt);
}

// Pillowy cloud band. Returns (density, lit crown).
vec2 cloudBand(vec2 p, float t, float seed) {
  vec2 w = p * vec2(0.0065, 0.011) + vec2(t * 0.01 + seed, seed * 0.37);
  float n = fbm3(w);
  float up = fbm3(w + vec2(0.0, 0.066));        // sample a little higher for the crown light
  float dens = smoothstep(0.5, 0.68, n);
  float crown = clamp((n - up) * 9.0, 0.0, 1.0) * dens;
  return vec2(dens, crown);
}

void dreamFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.03;
  float b = breath(t);

  col += DREAM_SEC * exp(-dd / 200.0) * 0.1 * r;
  if (d > 520.0) return;
  float far = 1.0 - smoothstep(360.0, 520.0, d);
  float floorQ = (uCY - uFloorY) / uScale;      // floor line in base units
  float fy = q.y - floorQ;                      // < 0 on the floor surface
  float glass = smoothstep(0.0, 10.0, d);       // hidden behind the card
  float aboveFloor = smoothstep(-4.0, 8.0, fy);

  vec3 c = vec3(0.0);

  // ---- breathing halo and the ring that travels with it ----
  vec3 warm = mix(DREAM_CORE, PEACH, 0.25 + 0.4 * b);
  c += warm * exp(-dd / (40.0 + 70.0 * b)) * (0.14 + 0.12 * b) * aud;
  float R = 18.0 + 110.0 * b;
  c += mix(DREAM_HI, warm, 0.5) * exp(-sq((dd - R) / (9.0 + 10.0 * b))) * (0.05 + 0.07 * b) * glass;
  float R2 = R * 0.55;
  c += warm * exp(-sq((dd - R2) / 7.0)) * 0.04 * b * glass;

  // ---- a few faint stars, slow twinkle ----
  vec2 sp = q / 30.0 + 3.3;
  vec2 si = floor(sp);
  vec2 sf = fract(sp) - 0.5;
  float h = hash21(si);
  vec2 so = (vec2(hash21(si + 2.1), hash21(si + 6.4)) - 0.5) * 0.7;
  vec2 sdq = (sf - so) * 30.0;
  float star = step(0.82, h) * exp(-dot(sdq, sdq) / 1.0) * (0.55 + 0.45 * sin(t * mix(0.4, 0.9, h) + h * 30.0));
  c += DREAM_HI * star * 0.7 * glass * aboveFloor * far * smoothstep(-40.0, 60.0, q.y);

  // ---- crescent moon, upper left ----
  vec2 mc = vec2(-205.0, 215.0);
  float lm = length(q - mc);
  float moon = (1.0 - smoothstep(17.0, 18.5, lm)) * smoothstep(15.0, 16.5, length(q - mc - vec2(8.0, 5.0)));
  c += mix(DREAM_HI, PEACH, 0.3) * moon * 0.85 * glass;
  c += mix(DREAM_CORE, PEACH, 0.4) * exp(-lm / 45.0) * 0.08 * glass;

  // ---- clouds: a low bank on the floor and a thin one up top ----
  float spread = exp(-sq(q.x / 420.0)) * far;
  if (fy > -6.0 && fy < 150.0) {
    vec2 cb = cloudBand(vec2(q.x, fy * 1.6), t, 0.0);
    float band = smoothstep(-6.0, 10.0, fy) * (1.0 - smoothstep(60.0, 150.0, fy));
    vec3 body = mix(DREAM_SEC * 0.32, warm * 0.25, exp(-dd / 160.0));
    c += (body * cb.x + mix(DREAM_HI, PEACH, 0.3) * cb.y * (0.12 + 0.18 * exp(-dd / 140.0))) * band * spread * glass;
  }
  if (q.y > 160.0) {
    vec2 ct = cloudBand(q * vec2(1.0, 1.4) + vec2(400.0, 0.0), t * 0.8, 5.0);
    float band = smoothstep(160.0, 220.0, q.y) * (1.0 - smoothstep(300.0, 380.0, q.y));
    c += (DREAM_SEC * 0.22 * ct.x + DREAM_HI * ct.y * 0.08) * band * spread * glass;
  }

  // ---- bokeh motes rising very slowly ----
  float count = 6.0 + 8.0 * uQuality;
  vec3 bok = vec3(0.0);
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    if (fi >= count) break;
    float h1 = hash11(fi * 2.37 + 0.4);
    float h2 = hash11(fi * 5.13 + 1.9);
    float h3 = hash11(fi * 3.91 + 7.2);
    float life = mix(22.0, 36.0, h1);
    float k = fract(t / life + h2);
    float side = h3 > 0.5 ? 1.0 : -1.0;
    vec2 p = vec2(side * mix(120.0, 360.0, h1) + sin(t * 0.11 + fi) * 18.0, mix(floorQ + 20.0, 300.0, k));
    float R0 = mix(6.0, 15.0, h2);
    float l = length(q - p);
    float disk = (1.0 - smoothstep(R0 - 1.5, R0, l)) * (0.6 + 0.4 * smoothstep(R0 - 4.0, R0 - 1.0, l));
    float fade = sin(k * PI);
    vec3 bc = h3 < 0.33 ? PEACH : (h3 < 0.66 ? DREAM_CORE : DREAM_HI);
    bok += bc * disk * fade * mix(0.05, 0.1, h1);
  }
  c += bok * glass * aboveFloor;

  // ---- rim, softer than elsewhere, breathing with the halo ----
  float glow = 0.85 + 0.25 * b;
  float inner = mix(1.0, 0.3, 1.0 - smoothstep(-24.0, 0.0, d));
  c += DREAM_HI * exp(-dd / 2.3) * 1.2 * glow * inner;
  c += mix(DREAM_HI, warm, 0.5) * exp(-dd / 10.0) * 0.5 * glow * inner;

  col += c * r;
}
`;
