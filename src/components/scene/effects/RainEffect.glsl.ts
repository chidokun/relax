/**
 * Rain — deep-blue downpour. Three parallax layers of wind-slanted streaks fall around the
 * capsule (hidden behind the glass, lit by its glow, ending at the floor), droplets bead on
 * the outline and run down its sides, rings ripple out on the glossy floor, a low mist drifts
 * along the horizon, and now and then soft sheet lightning lights the cloud bank above.
 */
export const RAIN_GLSL = /* glsl */ `
// One parallax layer of falling streaks. q in base units (+y up); returns intensity.
float rainLayer(vec2 q, float cellW, float len, float speed, float wid, float seed, float density, float t) {
  float cx = floor(q.x / cellW);
  float h2 = hash11(cx * 2.71 + seed + 3.1);
  float h3 = hash11(cx * 0.53 + seed + 7.7);
  float P = len * mix(2.4, 4.8, h2);
  float y = q.y + t * speed * mix(0.85, 1.15, h3) + h2 * 913.0;
  float id = floor(y / P);
  float yy = fract(y / P) * P;                  // 0 at the head, grows up the tail
  float hd = hash21(vec2(cx, id) + seed);
  float on = step(hd, density);
  float x = (fract(q.x / cellW) - 0.5 - (hash21(vec2(id, cx) + seed * 1.9) - 0.5) * 0.6) * cellW;
  float tail = clamp(1.0 - yy / len, 0.0, 1.0);
  float head = smoothstep(0.0, 3.0, yy);
  float w = exp(-sq(x / max(wid, 0.8 / (uScale * uPx))));
  return on * tail * tail * head * w * mix(0.5, 1.0, hash21(vec2(id * 0.37, cx) + seed * 3.0));
}

void rainFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.04;

  col += RAIN_SEC * exp(-dd / 180.0) * 0.14 * aud * r;
  if (d > 480.0) return;
  float far = 1.0 - smoothstep(330.0, 480.0, d);
  float floorQ = (uCY - uFloorY) / uScale;      // floor line in base units
  float fy = q.y - floorQ;                      // < 0 on the floor surface

  vec3 c = vec3(0.0);

  // ---- soft sheet lightning: a rare double pulse, never a bolt ----
  float LP = 13.0;
  float slot = floor(t / LP + 0.21);
  float ls = fract(t / LP + 0.21) * LP;
  float flash = 0.0;
  if (hash11(slot * 4.3 + 0.7) > 0.3) {
    flash = exp(-sq((ls - 0.12) / 0.05)) + 0.6 * exp(-sq((ls - 0.45) / 0.11));
  }
  flash *= r;

  // ---- cloud bank above the capsule ----
  if (q.y > 110.0) {
    float cl = fbm3(vec2(q.x * 0.0045 + t * 0.012, q.y * 0.007 - t * 0.004));
    float mass = smoothstep(0.35, 0.8, cl) * smoothstep(110.0, 280.0, q.y) * exp(-sq(q.x / 380.0));
    c += (RAIN_TOP * 0.45 + RAIN_HI * flash * 0.9) * mass * far;
  }
  c += RAIN_CORE * flash * 0.06 * exp(-dd / 260.0);

  // ---- rain: three parallax layers with a slight wind slant ----
  if (fy > -4.0) {
    vec2 p = vec2(q.x + q.y * 0.13, q.y);
    float s = rainLayer(p, 9.0, 36.0, 430.0, 0.75, 1.0, 0.16 + 0.26 * r, t)
            + rainLayer(p + vec2(3.1, 0.0), 6.0, 22.0, 320.0, 0.55, 5.0, 0.12 + 0.24 * r, t) * 0.55;
    if (uQuality > 0.3) s += rainLayer(p + vec2(1.7, 0.0), 4.0, 13.0, 230.0, 0.45, 9.0, 0.28 * r, t) * 0.3;
    float mask = smoothstep(0.0, 10.0, d)                    // behind the glass
               * smoothstep(-4.0, 8.0, fy)                   // ends at the floor
               * mix(0.2, 1.0, 1.0 - smoothstep(220.0, 420.0, q.y))
               * far;
    float light = 0.32 + 0.95 * exp(-dd / 120.0) + flash * 0.9;
    c += mix(RAIN_CORE, RAIN_HI, 0.55) * s * mask * light * aud;
  }

  // ---- droplets beading on the outline and running down its sides ----
  if (abs(d) < 14.0) {
    float dr = 0.0;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float side = i < 3 ? -1.0 : 1.0;
      float per = mix(3.6, 6.8, hash11(fi * 3.17 + 0.5));
      float k = fract(t / per + hash11(fi * 7.3 + 1.0));
      float y = mix(112.0, -128.0, k * k);                   // slides, gathering speed
      float ay = max(abs(y) - 50.0, 0.0);
      vec2 pnt = vec2(side * sqrt(max(92.0 * 92.0 - ay * ay, 0.0)), y);
      vec2 n = normalize(vec2(pnt.x, y - clamp(y, -50.0, 50.0)));
      pnt += n * 1.6;
      float bead = exp(-sq(length(q - pnt) / 2.0));
      float up = q.y - y;
      float trail = step(0.0, q.x * side) * exp(-sq((d - 1.2) / 1.1))
                  * smoothstep(0.0, 3.0, up) * exp(-max(up, 0.0) / 18.0);
      float fade = smoothstep(0.0, 0.08, k) * (1.0 - smoothstep(0.82, 1.0, k));
      dr += (bead + trail * 0.35) * fade;
    }
    c += RAIN_HI * dr * 1.1 * r;
  }

  // ---- ripples on the glossy floor (the composite darkens the floor, hence the gain) ----
  if (fy < 3.0 && fy > -60.0 && abs(q.x) < 380.0) {
    float rip = 0.0;
    float cw = 54.0;
    for (int j = 0; j < 2; j++) {
      float row = float(j);
      float depth = mix(9.0, 28.0, row);
      float sq_ = mix(0.16, 0.26, row);                      // perspective squash
      float sx = q.x + row * 27.0;
      float ci = floor(sx / cw);
      for (int i = -1; i <= 1; i++) {
        float id = ci + float(i);
        float h1 = hash21(vec2(id, row + 3.0));
        float per = mix(1.5, 3.1, h1);
        float u = t / per + hash21(vec2(id * 1.7, row + 9.0));
        float k = fract(u);
        float sl = floor(u);
        float hx = hash21(vec2(id, sl + row * 31.0));
        if (hash21(vec2(sl, id) + row) > 0.7) continue;
        vec2 ctr = vec2((id + 0.2 + 0.6 * hx) * cw - row * 27.0, floorQ - depth - (hx - 0.5) * 6.0);
        vec2 e = (q - ctr) * vec2(1.0, 1.0 / sq_);
        float le = max(length(e), 0.001);
        float g = length(vec2(e.x, e.y / sq_)) / le;         // gradient of the ellipse field
        float R = k * mix(16.0, 24.0, h1) * (1.0 + row * 0.35);
        float ring = exp(-sq((le - R) / g / 0.8)) + 0.45 * exp(-sq((le - R * 0.6) / g / 0.7)) * step(0.18, k);
        rip += ring * sq(1.0 - k) * smoothstep(0.0, 0.05, k);
      }
    }
    c += mix(RAIN_HI, RAIN_CORE, 0.35) * rip * exp(-sq(q.x / 230.0)) * (1.5 + flash) * r;
  }

  // ---- low mist drifting along the horizon ----
  if (fy > -10.0 && fy < 150.0) {
    float m = fbm3(vec2(q.x * 0.006 - t * 0.05, fy * 0.012 + t * 0.01));
    c += RAIN_SEC * smoothstep(0.3, 0.8, m) * exp(-max(fy, 0.0) / 60.0) * smoothstep(-10.0, 8.0, fy)
       * exp(-sq(q.x / 320.0)) * 0.24;
  }

  // ---- rim, as on the other scenes ----
  float flick = 1.0 + 0.03 * sin(t * 1.1) + 0.02 * sin(t * 2.3 + 0.8) + flash * 0.25;
  float inner = mix(1.0, 0.4, 1.0 - smoothstep(-24.0, 0.0, d));
  c += RAIN_HI * exp(-dd / 2.3) * 1.7 * flick * inner;
  c += mix(RAIN_HI, RAIN_CORE, 0.5) * exp(-dd / 10.0) * 0.75 * flick * inner;
  c += RAIN_CORE * exp(-dd / 44.0) * 0.32 * aud;

  col += c * r;
}
`;
