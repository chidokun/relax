/**
 * Bird — a rainbow flock. A soft seven-band rainbow (red outside → violet inside) arches over
 * the capsule and sweeps in from the left on reveal; a ribbon of 21 glowing birds, each coloured
 * along the spectrum, loops around the capsule with flapping wings so the whole flock reads as a
 * flying rainbow; rainbow feathers drift down, and the capsule rim carries a slowly turning
 * spectrum.
 */
export const BIRD_GLSL = /* glsl */ `
const vec3 RB[7] = vec3[7](
  vec3(1.00, 0.24, 0.26),   // red
  vec3(1.00, 0.55, 0.14),   // orange
  vec3(1.00, 0.86, 0.20),   // yellow
  vec3(0.26, 0.86, 0.42),   // green
  vec3(0.20, 0.62, 1.00),   // blue
  vec3(0.32, 0.32, 0.92),   // indigo
  vec3(0.64, 0.32, 0.96)    // violet
);

// x in [0,1]: red → violet, smoothly blended between the seven bands.
vec3 rainbow(float x) {
  float f = clamp(x, 0.0, 1.0) * 6.0;
  int i = int(min(floor(f), 5.0));
  return mix(RB[i], RB[i + 1], smoothstep(0.0, 1.0, f - float(i)));
}

// Glowing gull silhouette around p, wings flapping with flap ∈ [-1, 1]. Returns (line, glow).
vec2 birdShape(vec2 q, vec2 p, float ang, float flap, float s) {
  vec2 l = rot2(-ang) * (q - p) / s;
  float ax = abs(l.x);
  if (ax > 11.0 || abs(l.y) > 10.0) return vec2(0.0);
  float wing = ax * (0.62 - ax * 0.06) * flap;
  float line = exp(-sq((l.y - wing) / 0.75)) * (1.0 - smoothstep(8.5, 10.0, ax));
  float body = exp(-(sq(l.x / 2.2) + sq(l.y / 1.3)));
  float glow = exp(-dot(l, l) / 40.0);
  return vec2(max(line, body), glow);
}

void birdFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.04;

  col += BIRD_SEC * exp(-dd / 200.0) * 0.1 * aud * r;
  if (d > 520.0) return;
  float far = 1.0 - smoothstep(360.0, 520.0, d);
  float floorQ = (uCY - uFloorY) / uScale;      // floor line in base units
  float fy = q.y - floorQ;                      // < 0 on the floor surface
  float glass = smoothstep(0.0, 10.0, d);       // hidden behind the card
  float aboveFloor = smoothstep(-4.0, 8.0, fy);

  vec3 c = vec3(0.0);

  // ---- the rainbow arch, sweeping in from the left ----
  vec2 ac = vec2(0.0, -70.0);
  vec2 av = q - ac;
  float ar = length(av);
  float R0 = 238.0;
  float W = 66.0;
  float u = (ar - R0) / W;                      // 0 inner (violet) → 1 outer (red)
  if (u > -0.3 && u < 1.3) {
    float ang = atan(av.y, -av.x);              // 0 at the left foot, π at the right foot
    float sweep = smoothstep(ang - 0.25, ang, r * 3.6);
    float band = smoothstep(-0.08, 0.06, u) * (1.0 - smoothstep(0.94, 1.08, u));
    float feet = smoothstep(-10.0, 70.0, av.y);
    float shimmer = 0.85 + 0.15 * sin(ang * 18.0 - t * 0.9);
    c += rainbow(1.0 - u) * band * feet * sweep * shimmer * 0.27 * glass * aboveFloor * far;
    // faint secondary glow inside the arch
    c += vec3(0.9, 0.92, 1.0) * smoothstep(0.0, -0.3, u) * exp(-max(-u, 0.0) * 4.0) * feet * sweep * 0.025 * glass;
  }

  // ---- the flock: a rainbow ribbon of birds looping around the capsule ----
  vec3 flock = vec3(0.0);
  float n = 14.0 + 7.0 * step(0.3, uQuality);
  for (int i = 0; i < 21; i++) {
    float fi = float(i);
    if (fi >= n) break;
    float k = fi / (n - 1.0);
    float h1 = hash11(fi * 3.7 + 0.2);
    float h2 = hash11(fi * 1.3 + 5.1);
    float ph = t * 0.21 - fi * 0.075;           // trailing birds follow the leader
    vec2 path = vec2(cos(ph) * 270.0, 40.0 + sin(ph) * 150.0 + sin(ph * 2.0) * 28.0);
    vec2 vel = vec2(-sin(ph) * 270.0, cos(ph) * 150.0 + cos(ph * 2.0) * 56.0);
    vec2 off = (vec2(h1, h2) - 0.5) * vec2(22.0, 26.0) + 6.0 * vec2(sin(t * 0.7 + fi), cos(t * 0.6 + fi * 1.3));
    vec2 p = path + off;
    if (length(q - p) > 40.0) continue;
    float tilt = clamp(atan(vel.y, abs(vel.x)) * sign(vel.x), -0.5, 0.5);
    float flap = sin(t * mix(6.0, 8.5, h1) + fi * 1.9);
    vec2 b = birdShape(q, p, tilt, flap, mix(1.15, 1.5, h2));
    vec3 bc = rainbow(k);
    flock += bc * (b.x * 1.3 + b.y * 0.35) + vec3(1.0) * b.x * 0.25;
  }
  c += flock * glass * aboveFloor * smoothstep(0.15, 0.6, r);

  // ---- rainbow feathers drifting down ----
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 6.1 + 0.3);
    float h2 = hash11(fi * 2.9 + 4.4);
    float life = mix(12.0, 18.0, h1);
    float k = fract(t / life + h2);
    float sx = (h1 > 0.5 ? 1.0 : -1.0) * mix(130.0, 330.0, h2);
    vec2 fc = vec2(sx + sin(k * 8.0 + h1 * 6.0) * 26.0, mix(300.0, floorQ + 4.0, k));
    float swing = sin(k * 8.0 + h1 * 6.0) * 0.6;
    vec2 fl = rot2(swing + 0.3) * (q - fc);
    if (abs(fl.x) > 6.0 || abs(fl.y) > 14.0) continue;
    float vane = exp(-sq(fl.x / (2.6 * (1.0 - sq(fl.y / 13.0)) + 0.01))) * (1.0 - smoothstep(11.0, 13.0, abs(fl.y)));
    float shaft = exp(-sq(fl.x / 0.45)) * (1.0 - smoothstep(12.0, 14.0, abs(fl.y)));
    float fade = smoothstep(0.0, 0.06, k) * (1.0 - smoothstep(0.92, 1.0, k));
    c += (rainbow(fract(h1 * 7.0 + 0.5 + fl.y / 60.0)) * vane * 0.35 + vec3(1.0) * shaft * 0.25) * fade * glass;
  }

  // ---- rim: white-hot edge, a spectrum slowly turning around the capsule ----
  float ra = atan(q.x, q.y) / TAU + 0.5;
  vec3 spec = rainbow(abs(fract(ra + t * 0.03) * 2.0 - 1.0));
  float flick = 1.0 + 0.03 * sin(t * 1.4) + 0.02 * sin(t * 2.5 + 0.7);
  float inner = mix(1.0, 0.3, 1.0 - smoothstep(-24.0, 0.0, d));
  c += BIRD_HI * exp(-dd / 2.3) * 1.4 * flick * inner;
  c += mix(BIRD_HI, spec, 0.7) * exp(-dd / 10.0) * 0.7 * flick * inner;
  c += spec * exp(-dd / 44.0) * 0.3 * aud;

  col += c * r;
}
`;
